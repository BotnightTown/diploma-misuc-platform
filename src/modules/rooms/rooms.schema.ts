import { z } from "zod";

export const roomIdParamSchema = z.object({
  roomId: z.coerce.number().int().positive(),
});

export const createRoomSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  max_participants: z.number().int().min(2).max(500),
});

export const updateRoomSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  max_participants: z.number().int().min(2).max(500).optional(),
});

export const sendMessageSchema = z.object({
  body: z.string().min(1).max(1000),
});

export const queueTrackSchema = z.object({
  track_id: z.number().int().positive(),
});

export const voteSchema = z.object({
  queue_id: z.number().int().positive(),
  vote: z.enum(["skip", "keep"]),
});

export const listRoomsQuerySchema = z.object({
  cursor: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type QueueTrackInput = z.infer<typeof queueTrackSchema>;
export type VoteInput = z.infer<typeof voteSchema>;
export type ListRoomsQuery = z.infer<typeof listRoomsQuerySchema>;

export const wsIncomingSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("chat:send"), payload: sendMessageSchema }),
  z.object({ type: z.literal("queue:add"), payload: queueTrackSchema }),
  z.object({ type: z.literal("queue:vote"), payload: voteSchema }),
  z.object({ type: z.literal("playback:sync_request"), payload: z.object({}).optional() }),
]);

export type WsIncoming = z.infer<typeof wsIncomingSchema>;
