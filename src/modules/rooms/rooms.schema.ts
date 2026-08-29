import { z } from "zod";

export const roomIdParamSchema = z.object({
  roomId: z.coerce.number().int().positive(),
});

const genresTransform = z
  .string()
  .optional()
  .transform((val) => {
    if (!val) return [];
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  });

export const createRoomSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional().default(""),
  max_participants: z.coerce.number().int().min(2).max(500),
  is_public: z.coerce.boolean().optional().default(true),
  genres: genresTransform,
  queue_permission: z
    .enum(["everyone", "friends", "moderators", "host"])
    .optional()
    .default("everyone"),
  skip_mode: z.enum(["vote", "host", "auto"]).optional().default("vote"),
  vote_threshold: z.coerce.number().int().min(1).max(100).optional().default(60),
  allow_chat: z.coerce.boolean().optional().default(true),
});

export const updateRoomSchema = createRoomSchema.partial();

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
