import { FastifyRequest, FastifyReply } from "fastify";
import { ArtistService } from "./artist.service.ts";
import {
  artistsQuerySchema,
  ArtistsQueryType,
  createArtistSchema,
  CreateArtistType,
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
    const result = await this.service.getAll(query);
    return reply.status(200).send(createHateoasResponse(result, artistListLinks()));
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
    if (!isMultipartRequest(request)) {
      const data = parseBody(createArtistSchema, request.body);
      const artist = await this.service.create(data);
      return reply.status(201).send(createHateoasResponse(artist, artistMutationLinks(artist.id)));
    }

    const { file, meta } = await parseMultipartFormData(request);
    const parsedMeta = parseBody(createArtistSchema, meta);

    const artist = await this.service.create(
      file
        ? {
            ...file,
            meta: parsedMeta,
          }
        : parsedMeta,
    );

    return reply.status(201).send(createHateoasResponse(artist, artistMutationLinks(artist.id)));
  }

  async update(
    request: FastifyRequest<{ Params: { artistId: number }; Body: UpdateArtistType }>,
    reply: FastifyReply,
  ) {
    const artistId = parseUserId(request.params.artistId);

    if (!isMultipartRequest(request)) {
      const data = parseBody(updateArtistSchema, request.body);
      const artist = await this.service.update(artistId, data);
      return reply.status(200).send(createHateoasResponse(artist, artistMutationLinks(artistId)));
    }

    const { file, meta } = await parseMultipartFormData(request);
    const parsedMeta = parseBody(updateArtistSchema, meta);
    const artist = await this.service.update(
      artistId,
      file
        ? {
            ...file,
            meta: parsedMeta,
          }
        : parsedMeta,
    );

    return reply.status(200).send(createHateoasResponse(artist, artistMutationLinks(artistId)));
  }

  async delete(request: FastifyRequest<{ Params: { artistId: number } }>, reply: FastifyReply) {
    const artistId = parseUserId(request.params.artistId);
    await this.service.delete(artistId);
    return reply.status(204).send();
  }
}
