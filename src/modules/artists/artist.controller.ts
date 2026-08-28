import { FastifyRequest, FastifyReply } from "fastify";
import { ArtistService } from "./artist.service.ts";
import {
  artistsQuerySchema,
  ArtistsQueryType,
  createArtistSchema,
  CreateArtistType,
  FollowType,
  updateArtistSchema,
  UpdateArtistType,
} from "./artist.schema.ts";
import {
  isMultipartRequest,
  parseBody,
  parseMultipartFormData,
  parseUserId,
} from "../../utils/controller.utils.ts";
import {
  createHateoasResponse,
  artistListLinks,
  artistLinks,
  artistMutationLinks,
} from "../../utils/hateoas.utils.ts";

export class ArtistController {
  constructor(private service: ArtistService) {}

  async getAll(request: FastifyRequest<{ Querystring: ArtistsQueryType }>, reply: FastifyReply) {
    const query = parseBody(artistsQuerySchema, request.query);
    const { data, pagination } = await this.service.getAll(query);
    return reply.status(200).send(createHateoasResponse(data, artistListLinks(), pagination));
  }

  async getById(request: FastifyRequest<{ Params: { artistId: number } }>, reply: FastifyReply) {
    const artistId = parseUserId(request.params.artistId);
    const artist = await this.service.getById(artistId);
    return reply.status(200).send(createHateoasResponse(artist, artistLinks(artistId)));
  }

  async getAlbums(request: FastifyRequest<{ Params: { artistId: number } }>, reply: FastifyReply) {
    const artistId = parseUserId(request.params.artistId);
    const albums = await this.service.getAlbums(artistId);
    return reply.status(200).send(createHateoasResponse(albums, artistLinks(artistId)));
  }

  async getTracks(request: FastifyRequest<{ Params: { artistId: number } }>, reply: FastifyReply) {
    const artistId = parseUserId(request.params.artistId);
    const tracks = await this.service.getTracks(artistId);
    return reply.status(200).send(createHateoasResponse(tracks, artistLinks(artistId)));
  }

  async create(request: FastifyRequest<{ Body: CreateArtistType }>, reply: FastifyReply) {
    const { fields, files } = await parseMultipartFormData(request.body as Record<string, any>);

    const data = parseBody(createArtistSchema, fields);
    const avatarData = files.avatar ?? null;

    const artist = await this.service.create(data, avatarData);
    return reply.status(201).send(createHateoasResponse(artist, artistMutationLinks(artist.id)));
  }

  async update(
    request: FastifyRequest<{ Params: { artistId: number }; Body: UpdateArtistType }>,
    reply: FastifyReply,
  ) {
    const artistId = parseUserId(request.params.artistId);
    const { fields, files } = await parseMultipartFormData(request.body as Record<string, any>);

    const data = parseBody(updateArtistSchema, fields);
    const avatarData = files.avatar ?? null;

    const artist = await this.service.update(artistId, data, avatarData);

    return reply.status(200).send(createHateoasResponse(artist, artistMutationLinks(artistId)));
  }

  async delete(request: FastifyRequest<{ Params: { artistId: number } }>, reply: FastifyReply) {
    const artistId = parseUserId(request.params.artistId);
    await this.service.delete(artistId);
    return reply.status(204).send();
  }

  async followArtist(
    request: FastifyRequest<{ Params: { artistId: number }; Body: FollowType }>,
    reply: FastifyReply,
  ) {
    const artistId = parseUserId(request.params.artistId);
    const userId = parseUserId(request.body.followerId);
    await this.service.followArtist(artistId, userId);
    return reply.status(204).send();
  }

  async deleteFollower(
    request: FastifyRequest<{ Params: { artistId: number }; Body: FollowType }>,
    reply: FastifyReply,
  ) {
    const artistId = parseUserId(request.params.artistId);
    const userId = parseUserId(request.body.followerId);
    await this.service.deleteFollower(artistId, userId);
    return reply.status(204).send();
  }
}
