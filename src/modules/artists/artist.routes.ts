import { FastifyInstance, RouteHandlerMethod } from "fastify";
import { ArtistRepository } from "./artist.repository.ts";
import { ArtistService } from "./artist.service.ts";
import { ArtistController } from "./artist.controller.ts";
import { authenticate } from "../../plugins/authenticate.ts";
import { requireAdmin } from "../../plugins/requireAdmin.ts";
import { CreateArtistType, FollowType, UpdateArtistType } from "./artist.schema.ts";

export const artistRoutes = async (fastify: FastifyInstance) => {
  const repository = new ArtistRepository();
  const service = new ArtistService(repository);
  const controller = new ArtistController(service);

  fastify.get("/artists", controller.getAll.bind(controller));
  fastify.get("/artists/:artistId", controller.getById.bind(controller));
  fastify.get("/artists/:artistId/albums", controller.getAlbums.bind(controller));
  fastify.get("/artists/:artistId/tracks", controller.getTracks.bind(controller));

  fastify.post<{ Body: CreateArtistType }>(
    "/artists",
    { preHandler: [authenticate, requireAdmin] },
    controller.create.bind(controller),
  );
  fastify.patch<{ Params: { artistId: number }; Body: UpdateArtistType }>(
    "/artists/:artistId",
    { preHandler: [authenticate, requireAdmin] },
    controller.update.bind(controller),
  );
  fastify.delete<{ Params: { artistId: number } }>(
    "/artists/:artistId",
    { preHandler: [authenticate, requireAdmin] },
    controller.delete.bind(controller),
  );
  fastify.post<{ Params: { artistId: number }; Body: FollowType }>(
    "/artists/:artistId/follow",
    { preHandler: [authenticate, requireAdmin] },
    controller.followArtist.bind(controller),
  );
  fastify.delete<{ Params: { artistId: number }; Body: FollowType }>(
    "/artists/:artistId/follow",
    { preHandler: [authenticate, requireAdmin] },
    controller.deleteFollower.bind(controller),
  );
};
