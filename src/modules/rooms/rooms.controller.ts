import type { FastifyReply, FastifyRequest } from "fastify";
import {
  createHateoasResponse,
  roomLinks,
  roomMutationLinks,
  roomListLinks,
  roomParticipantLinks,
} from "../../utils/hateoas.utils.ts";
import { roomsService } from "./rooms.service.ts";
import {
  createRoomSchema,
  updateRoomSchema,
  sendMessageSchema,
  queueTrackSchema,
  voteSchema,
  listRoomsQuerySchema,
  roomIdParamSchema,
} from "./rooms.schema.ts";
import { parseBody } from "../../utils/controller.utils.ts";

type RoomParams = { Params: { roomId: string } };

export const roomsController = {
  async createRoom(req: FastifyRequest, reply: FastifyReply) {
    const userId = req.user.sub;
    const body = parseBody(createRoomSchema, req.body);
    const room = await roomsService.createRoom(userId, body);
    return reply
      .code(201)
      .send(createHateoasResponse(room, roomLinks(room.id, room.host_id, userId)));
  },

  async listRooms(req: FastifyRequest, reply: FastifyReply) {
    const { cursor, limit } = listRoomsQuerySchema.parse(req.query);
    const rooms = await roomsService.listActiveRooms(limit, cursor);
    return reply.send(createHateoasResponse(rooms, roomListLinks()));
  },

  async getRoom(req: FastifyRequest<RoomParams>, reply: FastifyReply) {
    const { roomId } = roomIdParamSchema.parse(req.params);
    const state = await roomsService.getRoomState(roomId);
    return reply.send(createHateoasResponse(state, roomLinks(state.room.id, state.room.host_id)));
  },

  async updateRoom(req: FastifyRequest<RoomParams>, reply: FastifyReply) {
    const userId = req.user.sub;
    const { roomId } = roomIdParamSchema.parse(req.params);
    const body = parseBody(updateRoomSchema, req.body);
    const room = await roomsService.updateRoom(roomId, userId, body);
    return reply.send(createHateoasResponse(room, roomLinks(room.id, room.host_id, userId)));
  },

  async closeRoom(req: FastifyRequest<RoomParams>, reply: FastifyReply) {
    const userId = req.user.sub;
    const { roomId } = roomIdParamSchema.parse(req.params);
    const room = await roomsService.closeRoom(roomId, userId);
    return reply.send(createHateoasResponse(room, roomMutationLinks(room.id)));
  },

  async joinRoom(req: FastifyRequest<RoomParams>, reply: FastifyReply) {
    const userId = req.user.sub;
    const { roomId } = roomIdParamSchema.parse(req.params);
    const participant = await roomsService.joinRoom(roomId, userId);
    return reply.code(201).send(createHateoasResponse(participant, roomParticipantLinks(roomId)));
  },

  async leaveRoom(req: FastifyRequest<RoomParams>, reply: FastifyReply) {
    const userId = req.user.sub;
    const { roomId } = roomIdParamSchema.parse(req.params);
    await roomsService.leaveRoom(roomId, userId);
    return reply.code(204).send();
  },

  async sendMessage(req: FastifyRequest<RoomParams>, reply: FastifyReply) {
    const userId = req.user.sub;
    const { roomId } = roomIdParamSchema.parse(req.params);
    const body = parseBody(sendMessageSchema, req.body);
    const message = await roomsService.sendMessage(roomId, userId, body.body);
    return reply.code(201).send(createHateoasResponse(message, roomMutationLinks(roomId)));
  },

  async queueTrack(req: FastifyRequest<RoomParams>, reply: FastifyReply) {
    const userId = req.user.sub;
    const { roomId } = roomIdParamSchema.parse(req.params);
    const body = parseBody(queueTrackSchema, req.body);
    const item = await roomsService.addTrackToQueue(roomId, userId, body);
    return reply.code(201).send(createHateoasResponse(item, roomMutationLinks(roomId)));
  },

  async voteTrack(req: FastifyRequest<RoomParams>, reply: FastifyReply) {
    const userId = req.user.sub;
    const { roomId } = roomIdParamSchema.parse(req.params);
    const body = parseBody(voteSchema, req.body);
    const result = await roomsService.voteOnTrack(roomId, userId, body);
    return reply.send(createHateoasResponse(result, roomMutationLinks(roomId)));
  },
};
