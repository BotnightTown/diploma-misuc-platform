import { FastifyRequest, FastifyReply } from "fastify";
import { AlbumService } from "./album.service.ts";
import {
  albumsQuerySchema,
  AlbumsQueryType,
  createAlbumSchema,
  CreateAlbumType,
  updateAlbumSchema,
  UpdateAlbumType,
} from "./album.schema.ts";
import {
  isMultipartRequest,
  parseBody,
  parseMultipartFormData,
  parseUserId,
} from "../../utils/controller.utils.ts";
import {
  createHateoasResponse,
  albumListLinks,
  albumLinks,
  albumMutationLinks,
} from "../../utils/hateoas.utils.ts";

export class AlbumController {
  constructor(private service: AlbumService) {}

  async getAll(request: FastifyRequest<{ Querystring: AlbumsQueryType }>, reply: FastifyReply) {
    const query = parseBody(albumsQuerySchema, request.query);
    const result = await this.service.getAll(query);
    return reply.status(200).send(createHateoasResponse(result, albumListLinks()));
  }

  async getById(request: FastifyRequest<{ Params: { albumId: number } }>, reply: FastifyReply) {
    const albumId = parseUserId(request.params.albumId);
    const album = await this.service.getById(albumId);
    return reply.status(200).send(createHateoasResponse(album, albumLinks(albumId)));
  }

  async getTracks(
    request: FastifyRequest<{ Params: { albumId: number }; Querystring: AlbumsQueryType }>,
    reply: FastifyReply,
  ) {
    const albumId = parseUserId(request.params.albumId);
    const query = parseBody(albumsQuerySchema, request.query);
    const result = await this.service.getTracks(albumId, query);
    return reply.status(200).send(createHateoasResponse(result, albumLinks(albumId)));
  }

  async create(request: FastifyRequest<{ Body: CreateAlbumType }>, reply: FastifyReply) {
    if (!isMultipartRequest(request)) {
      const data = parseBody(createAlbumSchema, request.body);
      const album = await this.service.create(data);
      return reply.status(201).send(createHateoasResponse(album, albumMutationLinks(album.id)));
    }

    const { file, meta } = await parseMultipartFormData(request);
    const parsedMeta = parseBody(createAlbumSchema, meta);

    const album = await this.service.create(
      file
        ? {
            ...file,
            meta: parsedMeta,
          }
        : parsedMeta,
    );

    return reply.status(201).send(createHateoasResponse(album, albumMutationLinks(album.id)));
  }

  async update(
    request: FastifyRequest<{ Params: { albumId: number }; Body: UpdateAlbumType }>,
    reply: FastifyReply,
  ) {
    const albumId = parseUserId(request.params.albumId);

    if (!isMultipartRequest(request)) {
      const data = parseBody(updateAlbumSchema, request.body);
      const album = await this.service.update(albumId, data);
      return reply.status(200).send(createHateoasResponse(album, albumMutationLinks(albumId)));
    }

    const { file, meta } = await parseMultipartFormData(request);
    const parsedMeta = parseBody(updateAlbumSchema, meta);
    const album = await this.service.update(
      albumId,
      file
        ? {
            ...file,
            meta: parsedMeta,
          }
        : parsedMeta,
    );

    return reply.status(200).send(createHateoasResponse(album, albumMutationLinks(albumId)));
  }

  async delete(request: FastifyRequest<{ Params: { albumId: number } }>, reply: FastifyReply) {
    const albumId = parseUserId(request.params.albumId);
    await this.service.delete(albumId);
    return reply.status(204).send();
  }
}
