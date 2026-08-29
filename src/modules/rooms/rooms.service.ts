import { redis, subscribe } from "../../config/redis.ts";
import { ProblemDocument } from "../../models/error.model.ts";
import { roomsRepository } from "./rooms.repository.ts";
import { CreateRoomInput, QueueTrackInput, UpdateRoomInput, VoteInput } from "./rooms.schema.ts";
import type { WebSocket } from "@fastify/websocket";
import { IMAGE_FOLDERS, uploadCover } from "../../utils/storage.utils.ts";
import { UploadDataType } from "../../types/upload.types.ts";

const DEFAULT_ROOM_COVER = "default_room_cover.png";

const CHANNEL_PREFIX = "room:";

type RoomEvent =
  | { type: "participant:joined"; payload: unknown }
  | { type: "participant:left"; payload: { userId: number } }
  | { type: "chat:message"; payload: unknown }
  | { type: "queue:updated"; payload: unknown }
  | { type: "queue:track_removed"; payload: { queueId: number; reason: "played" | "skipped" } }
  | { type: "room:closed"; payload: { roomId: number } };

class RoomHub {
  private sockets = new Map<number, Set<WebSocket>>();
  private subscribed = new Set<number>();

  private ensureSubscription(roomId: number) {
    if (this.subscribed.has(roomId)) return;
    this.subscribed.add(roomId);
    subscribe(CHANNEL_PREFIX + roomId, (message: string) => {
      const sockets = this.sockets.get(roomId);
      if (!sockets) return;
      for (const socket of sockets) {
        if (socket.readyState === socket.OPEN) socket.send(message);
      }
    });
  }

  add(roomId: number, socket: WebSocket) {
    this.ensureSubscription(roomId);
    if (!this.sockets.has(roomId)) this.sockets.set(roomId, new Set());
    this.sockets.get(roomId)!.add(socket);
  }

  remove(roomId: number, socket: WebSocket) {
    this.sockets.get(roomId)?.delete(socket);
    if (this.sockets.get(roomId)?.size === 0) this.sockets.delete(roomId);
  }

  async broadcast(roomId: number, event: RoomEvent) {
    await redis.publish(CHANNEL_PREFIX + roomId, JSON.stringify(event));
  }
}

export const roomHub = new RoomHub();

export const roomsService = {
  async createRoom(hostId: number, data: CreateRoomInput, coverData: UploadDataType | null) {
    const coverUrl = coverData
      ? await uploadCover(coverData, IMAGE_FOLDERS.roomCovers)
      : DEFAULT_ROOM_COVER;
    return roomsRepository.create(hostId, { ...data, cover_url: coverUrl });
  },

  async getRoomOrThrow(roomId: number) {
    const room = await roomsRepository.findById(roomId);
    if (!room) throw new ProblemDocument(404, "Room not found", `Room ${roomId} does not exist`);
    return room;
  },

  async getRoomState(roomId: number) {
    const room = await this.getRoomOrThrow(roomId);
    const [participants, queue, messages] = await Promise.all([
      roomsRepository.listParticipants(roomId),
      roomsRepository.getQueue(roomId),
      roomsRepository.listMessages(roomId),
    ]);
    return { room, participants, queue, messages: messages.reverse() };
  },

  async listActiveRooms(limit: number, cursor?: number) {
    return roomsRepository.findActive(limit, cursor);
  },

  async updateRoom(roomId: number, userId: number, data: UpdateRoomInput) {
    const room = await this.getRoomOrThrow(roomId);
    if (room.host_id !== userId) {
      throw new ProblemDocument(403, "Forbidden", "Only the host can update the room");
    }
    return roomsRepository.update(roomId, data);
  },

  async closeRoom(roomId: number, userId: number) {
    const room = await this.getRoomOrThrow(roomId);
    if (room.host_id !== userId) {
      throw new ProblemDocument(403, "Forbidden", "Only the host can close the room");
    }
    const closed = await roomsRepository.close(roomId);
    await roomHub.broadcast(roomId, { type: "room:closed", payload: { roomId } });
    return closed;
  },

  async joinRoom(roomId: number, userId: number) {
    const room = await this.getRoomOrThrow(roomId);
    if (!room.is_active) {
      throw new ProblemDocument(409, "Room closed", "This room is no longer active");
    }

    const existing = await roomsRepository.findParticipant(roomId, userId);
    if (!existing || existing.left_at) {
      const activeCount = await roomsRepository.countActiveParticipants(roomId);
      if (activeCount >= room.max_participants) {
        throw new ProblemDocument(409, "Room full", "This room has reached max participants");
      }
    }

    const participant = await roomsRepository.addParticipant(roomId, userId);
    await roomHub.broadcast(roomId, { type: "participant:joined", payload: participant });
    return participant;
  },

  async leaveRoom(roomId: number, userId: number) {
    await this.getRoomOrThrow(roomId);
    const participant = await roomsRepository.removeParticipant(roomId, userId);
    await roomHub.broadcast(roomId, { type: "participant:left", payload: { userId } });
    return participant;
  },

  async sendMessage(roomId: number, userId: number, body: string) {
    await this.assertParticipant(roomId, userId);
    const message = await roomsRepository.addMessage(roomId, userId, body);
    await roomHub.broadcast(roomId, { type: "chat:message", payload: message });
    return message;
  },

  async addTrackToQueue(roomId: number, userId: number, data: QueueTrackInput) {
    await this.assertParticipant(roomId, userId);
    const position = await roomsRepository.nextQueuePosition(roomId);
    const item = await roomsRepository.addToQueue(roomId, data.track_id, userId, position);
    await roomHub.broadcast(roomId, { type: "queue:updated", payload: item });
    return item;
  },

  async voteOnTrack(roomId: number, userId: number, data: VoteInput) {
    await this.assertParticipant(roomId, userId);
    const queueItem = await roomsRepository.findQueueItem(data.queue_id);
    if (!queueItem || queueItem.room_id !== roomId) {
      throw new ProblemDocument(
        404,
        "Queue item not found",
        `Queue item ${data.queue_id} not found in this room`,
      );
    }
    if (queueItem.played_at || queueItem.skipped_at) {
      throw new ProblemDocument(
        409,
        "Vote closed",
        "This track has already been played or skipped",
      );
    }

    await roomsRepository.upsertVote(roomId, data.queue_id, userId, data.vote);

    const [counts, activeParticipants] = await Promise.all([
      roomsRepository.countVotes(data.queue_id),
      roomsRepository.countActiveParticipants(roomId),
    ]);
    const skipVotes = counts.find((c) => c.vote === "skip")?._count ?? 0;

    // majority of currently active participants voting "skip" removes the track
    if (skipVotes > activeParticipants / 2) {
      await roomsRepository.markSkipped(data.queue_id);
      await roomHub.broadcast(roomId, {
        type: "queue:track_removed",
        payload: { queueId: data.queue_id, reason: "skipped" },
      });
      return { skipped: true };
    }

    await roomHub.broadcast(roomId, {
      type: "queue:updated",
      payload: { queueId: data.queue_id, counts },
    });
    return { skipped: false };
  },

  async assertParticipant(roomId: number, userId: number) {
    const participant = await roomsRepository.findParticipant(roomId, userId);
    if (!participant || participant.left_at) {
      throw new ProblemDocument(403, "Not a participant", "You must join the room first");
    }
    return participant;
  },
};
