import { z } from "zod";

export const artistParamsSchema = z.object({
  artistId: z.coerce.number().int().positive(),
});

export const artistsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const createArtistSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  bio: z.string().optional(),
  avatar_url: z.string().optional(),
  country: z.string().optional(),
});

export const dbArtistSchema = createArtistSchema.extend({
  avatar_url: z.string().min(1, { message: "Avatar URL is required" }).optional(),
});

export const updateArtistSchema = createArtistSchema.partial();

export type ArtistParamsType = z.infer<typeof artistParamsSchema>;
export type ArtistsQueryType = z.infer<typeof artistsQuerySchema>;
export type CreateArtistFormType = z.infer<typeof createArtistSchema>;
export type CreateArtistType = z.infer<typeof dbArtistSchema>;
export type UpdateArtistType = z.infer<typeof updateArtistSchema>;
