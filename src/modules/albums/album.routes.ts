import { FastifyInstance } from "fastify";
import { AlbumRepository } from "./album.repository.ts";
import { AlbumService } from "./album.service.ts";
import { AlbumController } from "./album.controller.ts";
import { authenticate } from "../../plugins/authenticate.ts";
import { requireAdmin } from "../../plugins/requireAdmin.ts";
import { CreateAlbumType, UpdateAlbumType } from "./album.schema.ts";

export const albumRoutes = async (fastify: FastifyInstance) => {
  const repository = new AlbumRepository();
  const service = new AlbumService(repository);
  const controller = new AlbumController(service);

  fastify.get("/albums", controller.getAll.bind(controller));
  fastify.get("/albums/:albumId", controller.getById.bind(controller));
  fastify.get("/albums/:albumId/tracks", controller.getTracks.bind(controller));

  fastify.post<{ Body: CreateAlbumType }>(
    "/albums",
    { preHandler: [authenticate, requireAdmin] },
    (req, reply) => controller.create(req, reply),
  );

  fastify.patch<{ Params: { albumId: number }; Body: UpdateAlbumType }>(
    "/albums/:albumId",
    { preHandler: [authenticate, requireAdmin] },
    (req, reply) => controller.update(req, reply),
  );

  fastify.delete<{ Params: { albumId: number } }>(
    "/albums/:albumId",
    { preHandler: [authenticate, requireAdmin] },
    (req, reply) => controller.delete(req, reply),
  );
};
