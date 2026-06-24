import { FastifyInstance } from "fastify";
import { authRoutes } from "./modules/auth/auth.routes.ts";
import { userRoutes } from "./modules/users/user.routes.ts";
import { artistRoutes } from "./modules/artists/artist.routes.ts";
import { albumRoutes } from "./modules/albums/album.routes.ts";
import { trackRoutes } from "./modules/tracks/track.routes.ts";

export const apiRoutes = async (fastify: FastifyInstance) => {
  await fastify.register(authRoutes);
  await fastify.register(userRoutes);
  await fastify.register(artistRoutes);
  await fastify.register(albumRoutes);
  await fastify.register(trackRoutes);
};
