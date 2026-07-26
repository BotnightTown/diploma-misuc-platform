import { FastifyRequest, FastifyReply } from "fastify";
import { PlaylistService } from "./playlists.service.ts";
import {
  playlistsQuerySchema,
  PlaylistsQueryType,
  createPlaylistSchema,
  CreatePlaylistType,
  updatePlaylistSchema,
  UpdatePlaylistType,
  addTrackToPlaylistSchema,
  AddTrackToPlaylistType,
  reorderPlaylistTracksSchema,
  ReorderPlaylistTracksType,
} from "./playlists.schema.ts";
import { parseBody, parseUserId } from "../../utils/controller.utils.ts";
import {
  createHateoasResponse,
  playlistListLinks,
  playlistLinks,
  playlistMutationLinks,
} from "../../utils/hateoas.utils.ts";

export class PlaylistController {
  constructor(private service: PlaylistService) {}

  async getAll(request: FastifyRequest<{ Querystring: PlaylistsQueryType }>, reply: FastifyReply) {
    const query = parseBody(playlistsQuerySchema, request.query);
    const result = await this.service.getAll(query);
    return reply.status(200).send(createHateoasResponse(result, playlistListLinks()));
  }

  async getByUserId(
    request: FastifyRequest<{ Params: { userId: number }; Querystring: PlaylistsQueryType }>,
    reply: FastifyReply,
  ) {
    const userId = parseUserId(request.params.userId);
    const query = parseBody(playlistsQuerySchema, request.query);
    const requesterId = request.user?.sub ?? null;
    const result = await this.service.getByUserId(userId, query, requesterId);
    return reply.status(200).send(createHateoasResponse(result, playlistListLinks()));
  }

  async getById(request: FastifyRequest<{ Params: { playlistId: number } }>, reply: FastifyReply) {
    const playlistId = parseUserId(request.params.playlistId);
    const requesterId = request.user?.sub ?? null;
    const playlist = await this.service.getById(playlistId, requesterId);
    return reply.status(200).send(createHateoasResponse(playlist, playlistLinks(playlistId)));
  }

  async getTracks(
    request: FastifyRequest<{ Params: { playlistId: number }; Querystring: PlaylistsQueryType }>,
    reply: FastifyReply,
  ) {
    const playlistId = parseUserId(request.params.playlistId);
    const query = parseBody(playlistsQuerySchema, request.query);
    const requesterId = request.user?.sub ?? null;
    const result = await this.service.getTracks(playlistId, query, requesterId);
    return reply.status(200).send(createHateoasResponse(result, playlistLinks(playlistId)));
  }

  async create(request: FastifyRequest<{ Body: CreatePlaylistType }>, reply: FastifyReply) {
    const data = parseBody(createPlaylistSchema, request.body);
    const playlist = await this.service.create(request.user.sub, data);
    return reply
      .status(201)
      .send(createHateoasResponse(playlist, playlistMutationLinks(playlist.id)));
  }

  async update(
    request: FastifyRequest<{ Params: { playlistId: number }; Body: UpdatePlaylistType }>,
    reply: FastifyReply,
  ) {
    const playlistId = parseUserId(request.params.playlistId);
    const data = parseBody(updatePlaylistSchema, request.body);
    const playlist = await this.service.update(playlistId, request.user.sub, data);
    return reply
      .status(200)
      .send(createHateoasResponse(playlist, playlistMutationLinks(playlistId)));
  }

  async delete(request: FastifyRequest<{ Params: { playlistId: number } }>, reply: FastifyReply) {
    const playlistId = parseUserId(request.params.playlistId);
    await this.service.delete(playlistId, request.user.sub);
    return reply.status(204).send();
  }

  async addTrack(
    request: FastifyRequest<{ Params: { playlistId: number }; Body: AddTrackToPlaylistType }>,
    reply: FastifyReply,
  ) {
    const playlistId = parseUserId(request.params.playlistId);
    const data = parseBody(addTrackToPlaylistSchema, request.body);
    const playlistTrack = await this.service.addTrack(playlistId, request.user.sub, data);
    return reply.status(201).send(createHateoasResponse(playlistTrack, playlistLinks(playlistId)));
  }

  async removeTrack(
    request: FastifyRequest<{ Params: { playlistId: number; trackId: number } }>,
    reply: FastifyReply,
  ) {
    const playlistId = parseUserId(request.params.playlistId);
    const trackId = parseUserId(request.params.trackId);
    await this.service.removeTrack(playlistId, trackId, request.user.sub);
    return reply.status(204).send();
  }

  async reorderTracks(
    request: FastifyRequest<{ Params: { playlistId: number }; Body: ReorderPlaylistTracksType }>,
    reply: FastifyReply,
  ) {
    const playlistId = parseUserId(request.params.playlistId);
    const data = parseBody(reorderPlaylistTracksSchema, request.body);
    const playlistTrack = await this.service.reorderTracks(playlistId, request.user.sub, data);
    return reply.status(200).send(createHateoasResponse(playlistTrack, playlistLinks(playlistId)));
  }

  async follow(request: FastifyRequest<{ Params: { playlistId: number } }>, reply: FastifyReply) {
    const playlistId = parseUserId(request.params.playlistId);
    const follow = await this.service.follow(playlistId, request.user.sub);
    return reply.status(201).send(createHateoasResponse(follow, playlistLinks(playlistId)));
  }

  async unfollow(request: FastifyRequest<{ Params: { playlistId: number } }>, reply: FastifyReply) {
    const playlistId = parseUserId(request.params.playlistId);
    await this.service.unfollow(playlistId, request.user.sub);
    return reply.status(204).send();
  }

  async getFollowed(
    request: FastifyRequest<{ Querystring: PlaylistsQueryType }>,
    reply: FastifyReply,
  ) {
    const query = parseBody(playlistsQuerySchema, request.query);
    const result = await this.service.getFollowedByUser(request.user.sub, query);
    return reply.status(200).send(createHateoasResponse(result, playlistListLinks()));
  }
}
