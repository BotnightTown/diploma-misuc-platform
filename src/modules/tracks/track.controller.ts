import { FastifyRequest, FastifyReply } from "fastify";
import { TrackService } from "./track.service.ts";
import {
  createReviewSchema,
  CreateReviewType,
  createTrackSchema,
  tracksQuerySchema,
  TracksQueryRaw,
  updateTrackSchema,
  UpdateTrackType,
} from "./track.schema.ts";
import { parseBody, parseMultipartFormData, parseUserId } from "../../utils/controller.utils.ts";
import {
  createHateoasResponse,
  reviewLinks,
  reviewMutationLinks,
  trackLinks,
  trackListLinks,
  trackMutationLinks,
} from "../../utils/hateoas.utils.ts";
import { ProblemDocument } from "../../models/error.model.ts";

export class TrackController {
  constructor(private service: TrackService) {}

  async getTracks(request: FastifyRequest<{ Querystring: TracksQueryRaw }>, reply: FastifyReply) {
    const query = parseBody(tracksQuerySchema, request.query);
    const result = await this.service.getTracks(query);
    return reply
      .status(200)
      .send(createHateoasResponse(result.data, trackListLinks(), result.meta));
  }

  async getById(request: FastifyRequest<{ Params: { trackId: number } }>, reply: FastifyReply) {
    const trackId = parseUserId(request.params.trackId);
    const track = await this.service.getById(trackId);
    return reply.status(200).send(createHateoasResponse(track, trackLinks(trackId)));
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const { fields, files } = await parseMultipartFormData(request.body as Record<string, any>);

    const data = parseBody(createTrackSchema, fields);
    const audioData = files.track ?? null;
    if (!audioData) {
      throw new ProblemDocument(400, "Bad Request", "Audio file is required");
    }

    const track = await this.service.create(data, audioData);

    return reply
      .status(201)
      .send(createHateoasResponse(track, trackMutationLinks(track.id, track.album_id)));
  }

  async update(
    request: FastifyRequest<{ Params: { trackId: number }; Body: UpdateTrackType }>,
    reply: FastifyReply,
  ) {
    const trackId = parseUserId(request.params.trackId);
    const { fields, files } = await parseMultipartFormData(request.body as Record<string, any>);

    const data = parseBody(updateTrackSchema, fields);
    const audioData = files.track ?? null;

    const track = await this.service.update(trackId, data, audioData);

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

  async createReview(
    request: FastifyRequest<{ Params: { trackId: number }; Body: CreateReviewType }>,
    reply: FastifyReply,
  ) {
    const userId = parseUserId(request.user.sub);
    const trackId = parseUserId(request.params.trackId);
    const data = parseBody(createReviewSchema, request.body);

    const review = await this.service.createReview(userId, trackId, data);
    return reply.status(201).send(createHateoasResponse(review, reviewMutationLinks(trackId)));
  }

  async getReviewByTrackId(
    request: FastifyRequest<{ Params: { trackId: number } }>,
    reply: FastifyReply,
  ) {
    const trackId = parseUserId(request.params.trackId);
    const reviews = await this.service.getReviewByTrackId(trackId);
    return reply.status(200).send(createHateoasResponse(reviews, reviewLinks(trackId)));
  }

  async updateReview(
    request: FastifyRequest<{ Params: { trackId: number }; Body: CreateReviewType }>,
    reply: FastifyReply,
  ) {
    const userId = parseUserId(request.user.sub);
    const trackId = parseUserId(request.params.trackId);
    const data = parseBody(createReviewSchema, request.body);

    const review = await this.service.updateReview(userId, trackId, data);
    return reply.status(200).send(createHateoasResponse(review, reviewMutationLinks(trackId)));
  }

  async deleteReview(
    request: FastifyRequest<{ Params: { trackId: number } }>,
    reply: FastifyReply,
  ) {
    const userId = parseUserId(request.user.sub);
    const trackId = parseUserId(request.params.trackId);

    await this.service.deleteReview(userId, trackId);
    return reply.status(204).send();
  }

  async like(request: FastifyRequest<{ Params: { trackId: number } }>, reply: FastifyReply) {
    const userId = parseUserId(request.user.sub);
    const trackId = parseUserId(request.params.trackId);

    await this.service.like(userId, trackId);
    return reply.status(204).send();
  }

  async unlike(request: FastifyRequest<{ Params: { trackId: number } }>, reply: FastifyReply) {
    const userId = parseUserId(request.user.sub);
    const trackId = parseUserId(request.params.trackId);

    await this.service.unlike(userId, trackId);
    return reply.status(204).send();
  }
}
