import { z } from "zod";

export const albumParamsSchema = z.object({
  albumId: z.coerce.number().int().positive(),
});

export const albumsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const createAlbumSchema = z.object({
  artist_id: z.coerce.number().int().positive(),
  title: z.string().min(1, { message: "Title is required" }),
  cover_url: z.string().optional(),
  release_year: z.coerce.number().int().min(1900).max(new Date().getFullYear()),
  type: z.enum(["single", "album", "ep"]).default("single"),
});

export const updateAlbumSchema = createAlbumSchema.omit({ artist_id: true }).partial();

export type AlbumParamsType = z.infer<typeof albumParamsSchema>;
export type AlbumsQueryType = z.infer<typeof albumsQuerySchema>;
export type CreateAlbumType = z.infer<typeof createAlbumSchema>;
export type UpdateAlbumType = z.infer<typeof updateAlbumSchema>;
