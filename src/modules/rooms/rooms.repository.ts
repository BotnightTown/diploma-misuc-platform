import { db } from "../../config/db.ts";
import { CreateRoomInput, UpdateRoomInput } from "./rooms.schema.ts";

export const roomsRepository = {
  create(hostId: number, data: CreateRoomInput) {
    return db.rooms.create({
      data: {
        host_id: hostId,
        title: data.title,
        description: data.description ?? "",
        max_participants: data.max_participants,
        room_participants: {
          create: { user_id: hostId, role: "host" },
        },
      },
    });
  },

  findById(roomId: number) {
    return db.rooms.findUnique({ where: { id: roomId } });
  },

  findActive(limit: number, cursor?: number) {
    return db.rooms.findMany({
      where: { is_active: true },
      orderBy: { created_at: "desc" },
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });
  },

  update(roomId: number, data: UpdateRoomInput) {
    return db.rooms.update({ where: { id: roomId }, data });
  },

  close(roomId: number) {
    return db.rooms.update({
      where: { id: roomId },
      data: { is_active: false, closed_at: new Date() },
    });
  },

  // --- participants ---
  findParticipant(roomId: number, userId: number) {
    return db.room_participants.findUnique({
      where: { room_id_user_id: { room_id: roomId, user_id: userId } },
    });
  },

  countActiveParticipants(roomId: number) {
    return db.room_participants.count({
      where: { room_id: roomId, left_at: null },
    });
  },

  addParticipant(roomId: number, userId: number, role: "listener" | "co_host" = "listener") {
    return db.room_participants.upsert({
      where: { room_id_user_id: { room_id: roomId, user_id: userId } },
      create: { room_id: roomId, user_id: userId, role },
      update: { left_at: null, joined_at: new Date() },
    });
  },

  removeParticipant(roomId: number, userId: number) {
    return db.room_participants.update({
      where: { room_id_user_id: { room_id: roomId, user_id: userId } },
      data: { left_at: new Date() },
    });
  },

  listParticipants(roomId: number) {
    return db.room_participants.findMany({
      where: { room_id: roomId, left_at: null },
      include: { users: { select: { id: true, username: true, avatar_url: true } } },
    });
  },

  // --- messages ---
  addMessage(roomId: number, userId: number, body: string) {
    return db.room_messages.create({
      data: { room_id: roomId, user_id: userId, body },
      include: { users: { select: { id: true, username: true, avatar_url: true } } },
    });
  },

  listMessages(roomId: number, limit = 50) {
    return db.room_messages.findMany({
      where: { room_id: roomId },
      orderBy: { created_at: "desc" },
      take: limit,
      include: { users: { select: { id: true, username: true, avatar_url: true } } },
    });
  },

  // --- queue ---
  getQueue(roomId: number) {
    return db.room_queue.findMany({
      where: { room_id: roomId, played_at: null, skipped_at: null },
      orderBy: { position: "asc" },
      include: { tracks: true, room_votes: true },
    });
  },

  async nextQueuePosition(roomId: number) {
    const last = await db.room_queue.findFirst({
      where: { room_id: roomId },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    return (last?.position ?? 0) + 1;
  },

  addToQueue(roomId: number, trackId: number, addedBy: number, position: number) {
    return db.room_queue.create({
      data: { room_id: roomId, track_id: trackId, added_by: addedBy, position },
      include: { tracks: true },
    });
  },

  findQueueItem(queueId: number) {
    return db.room_queue.findUnique({ where: { id: queueId } });
  },

  markPlayed(queueId: number) {
    return db.room_queue.update({ where: { id: queueId }, data: { played_at: new Date() } });
  },

  markSkipped(queueId: number) {
    return db.room_queue.update({ where: { id: queueId }, data: { skipped_at: new Date() } });
  },

  // --- votes ---
  upsertVote(roomId: number, queueId: number, userId: number, vote: "skip" | "keep") {
    return db.room_votes.upsert({
      where: { room_id_user_id_queue_id: { room_id: roomId, user_id: userId, queue_id: queueId } },
      create: { room_id: roomId, queue_id: queueId, user_id: userId, vote },
      update: { vote },
    });
  },

  countVotes(queueId: number) {
    return db.room_votes.groupBy({
      by: ["vote"],
      where: { queue_id: queueId },
      _count: true,
    });
  },
};
