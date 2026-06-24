import { FastifyInstance } from "fastify";
import { TrackRepository } from "./track.repository.ts";
import { TrackService } from "./track.service.ts";
import { TrackController } from "./track.controller.ts";
import { authenticate } from "../../plugins/authenticate.ts";
import { requireAdmin } from "../../plugins/requireAdmin.ts";
import { CreateTrackType, UpdateTrackType } from "./track.schema.ts";

export const trackRoutes = async (fastify: FastifyInstance) => {
  const repository = new TrackRepository();
  const service = new TrackService(repository);
  const controller = new TrackController(service);

  fastify.get<{ Params: { trackId: number } }>("/tracks/:trackId", (req, reply) =>
    controller.getById(req, reply),
  );

  fastify.post<{ Params: { trackId: number } }>(
    "/tracks/:trackId/play",
    { preHandler: [authenticate] },
    (req, reply) => controller.incrementPlayCount(req, reply),
  );

  fastify.post<{ Body: CreateTrackType }>(
    "/tracks",
    { preHandler: [authenticate, requireAdmin] },
    (req, reply) => controller.create(req, reply),
  );

  fastify.patch<{ Params: { trackId: number }; Body: UpdateTrackType }>(
    "/tracks/:trackId",
    { preHandler: [authenticate, requireAdmin] },
    (req, reply) => controller.update(req, reply),
  );

  fastify.delete<{ Params: { trackId: number } }>(
    "/tracks/:trackId",
    { preHandler: [authenticate, requireAdmin] },
    (req, reply) => controller.delete(req, reply),
  );
};
