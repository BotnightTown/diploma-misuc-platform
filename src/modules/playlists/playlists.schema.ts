import { z } from "zod";

export const playlistParamsSchema = z.object({
  playlistId: z.coerce.number().int().positive(),
});

export const playlistTrackParamsSchema = z.object({
  playlistId: z.coerce.number().int().positive(),
  trackId: z.coerce.number().int().positive(),
});

export const playlistsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const createPlaylistSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }).max(255),
  description: z.string().max(1000).optional().default(""),
  cover_url: z.string().optional(),
  is_public: z.coerce.boolean().optional().default(false),
});

export const updatePlaylistSchema = createPlaylistSchema.partial();

export const addTrackToPlaylistSchema = z.object({
  track_id: z.coerce.number().int().positive(),
  position: z.coerce.number().int().nonnegative().optional(),
});

export type PlaylistParamsType = z.infer<typeof playlistParamsSchema>;
export type PlaylistTrackParamsType = z.infer<typeof playlistTrackParamsSchema>;
export type PlaylistsQueryType = z.infer<typeof playlistsQuerySchema>;
export type CreatePlaylistType = z.infer<typeof createPlaylistSchema>;
export type UpdatePlaylistType = z.infer<typeof updatePlaylistSchema>;
export type AddTrackToPlaylistType = z.infer<typeof addTrackToPlaylistSchema>;
