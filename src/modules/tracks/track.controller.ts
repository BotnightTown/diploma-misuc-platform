import { FastifyRequest, FastifyReply } from "fastify";
import { TrackService } from "./track.service.ts";
import { createTrackSchema, updateTrackSchema, UpdateTrackType } from "./track.schema.ts";
import {
  isMultipartRequest,
  parseBody,
  parseMultipartFormData,
  parseUserId,
} from "../../utils/controller.utils.ts";
import {
  createHateoasResponse,
  trackLinks,
  trackMutationLinks,
} from "../../utils/hateoas.utils.ts";
import { ProblemDocument } from "../../models/error.model.ts";

export class TrackController {
  constructor(private service: TrackService) {}

  async getById(request: FastifyRequest<{ Params: { trackId: number } }>, reply: FastifyReply) {
    const trackId = parseUserId(request.params.trackId);
    const track = await this.service.getById(trackId);
    return reply.status(200).send(createHateoasResponse(track, trackLinks(trackId)));
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    if (!isMultipartRequest(request)) {
      throw new ProblemDocument(400, "Bad Request", "Audio file is required");
    }

    const { file, meta } = await parseMultipartFormData(request);

    if (!file) {
      throw new ProblemDocument(400, "Bad Request", "Audio file is required");
    }

    const parsedMeta = parseBody(createTrackSchema, meta);

    const track = await this.service.create({
      ...file,
      meta: parsedMeta,
    });

    return reply
      .status(201)
      .send(createHateoasResponse(track, trackMutationLinks(track.id, track.album_id)));
  }

  async update(
    request: FastifyRequest<{ Params: { trackId: number }; Body: UpdateTrackType }>,
    reply: FastifyReply,
  ) {
    const trackId = parseUserId(request.params.trackId);

    if (!isMultipartRequest(request)) {
      const data = parseBody(updateTrackSchema, request.body);
      const track = await this.service.update(trackId, data);
      return reply
        .status(200)
        .send(createHateoasResponse(track, trackMutationLinks(trackId, track.album_id)));
    }

    const { file, meta } = await parseMultipartFormData(request);
    const parsedMeta = parseBody(updateTrackSchema, meta);
    const track = await this.service.update(
      trackId,
      file
        ? {
            ...file,
            meta: parsedMeta,
          }
        : parsedMeta,
    );

    return reply
      .status(200)
      .send(createHateoasResponse(track, trackMutationLinks(trackId, track.album_id)));
  }

  async incrementPlayCount(
    request: FastifyRequest<{ Params: { trackId: number } }>,
    reply: FastifyReply,
  ) {
    const trackId = parseUserId(request.params.trackId);
    const result = await this.service.incrementPlayCount(trackId);
    return reply.status(200).send(createHateoasResponse(result, trackLinks(trackId)));
  }

  async delete(request: FastifyRequest<{ Params: { trackId: number } }>, reply: FastifyReply) {
    const trackId = parseUserId(request.params.trackId);
    await this.service.delete(trackId);
    return reply.status(204).send();
  }
}
