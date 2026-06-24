import { z } from "zod";

export const trackParamsSchema = z.object({
  trackId: z.coerce.number().int().positive(),
});

export const tracksQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const createTrackSchema = z.object({
  album_id: z.coerce.number().int().positive(),
  artist_id: z.coerce.number().int().positive(),
  title: z.string().min(1, { message: "Title is required" }),
  duration_seconds: z.coerce.number().int().positive(),
  genre: z.string().min(1, { message: "Genre is required" }),
  bpm: z.coerce.number().int().positive(),
});

export const dbTrackSchema = createTrackSchema.extend({
  audio_url: z.string().min(1, { message: "Audio URL is required" }),
});

export const updateTrackSchema = createTrackSchema
  .omit({ album_id: true, artist_id: true })
  .partial();

export type TrackParamsType = z.infer<typeof trackParamsSchema>;
export type TracksQueryType = z.infer<typeof tracksQuerySchema>;
export type CreateTrackFormType = z.infer<typeof createTrackSchema>;
export type CreateTrackType = z.infer<typeof dbTrackSchema>;
export type UpdateTrackType = z.infer<typeof updateTrackSchema>;
