import { z } from "zod";

export const trackParamsSchema = z.object({
  trackId: z.coerce.number().int().positive(),
});

const MIN_YEAR = 5900;
const CURRENT_YEAR = new Date().getFullYear();

export const tracksQuerySchema = z.object({
  genre: z.string().min(1).optional(),

  bpm: z.coerce.number().int().min(20).max(300).optional(),
  year: z.coerce.number().int().min(MIN_YEAR).max(CURRENT_YEAR).optional(),

  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),

  sortBy: z.enum(["title", "duration_seconds", "bpm", "year"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const getTracksResponseSchema = z.object({
  data: z.array(
    z.object({
      id: z.number().int().positive(),
      album_id: z.number().int().positive(),
      artist_id: z.number().int().positive(),
      title: z.string(),
      duration_seconds: z.number().int().positive(),
      genre: z.string(),
      bpm: z.number().int().positive(),
      audio_url: z.string(),
    }),
  ),
  meta: z.object({
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
  }),
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

export const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().optional(),
});

export type TracksQueryRaw = {
  genre?: string;
  bpm?: string;
  year?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: string;
};

export type TrackParamsType = z.infer<typeof trackParamsSchema>;
export type TracksQueryType = z.infer<typeof tracksQuerySchema>;
export type CreateTrackFormType = z.infer<typeof createTrackSchema>;
export type CreateTrackType = z.infer<typeof dbTrackSchema>;
export type UpdateTrackType = z.infer<typeof updateTrackSchema>;
export type CreateReviewType = z.infer<typeof createReviewSchema>;
