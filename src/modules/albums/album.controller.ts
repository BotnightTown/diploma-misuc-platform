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
    const { data, pagination } = await this.service.getAll(query);
    return reply.status(200).send(createHateoasResponse(data, albumListLinks(), pagination));
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
    const { fields, files } = await parseMultipartFormData(request.body as Record<string, any>);
    const data = parseBody(createAlbumSchema, fields);
    const coverData = files.cover ?? null; // перевір реальну назву поля файлу, яку ти використовуєш у Postman

    const album = await this.service.create(data, coverData);
    return reply.status(201).send(createHateoasResponse(album, albumMutationLinks(album.id)));
  }

  async update(
    request: FastifyRequest<{ Params: { albumId: number }; Body: UpdateAlbumType }>,
    reply: FastifyReply,
  ) {
    const albumId = parseUserId(request.params.albumId);
    const { fields, files } = await parseMultipartFormData(request.body as Record<string, any>);
    const data = parseBody(updateAlbumSchema, fields);
    const coverData = files.cover ?? null;

    const album = await this.service.update(albumId, data, coverData);
    return reply.status(200).send(createHateoasResponse(album, albumMutationLinks(albumId)));
  }

  async delete(request: FastifyRequest<{ Params: { albumId: number } }>, reply: FastifyReply) {
    const albumId = parseUserId(request.params.albumId);
    await this.service.delete(albumId);
    return reply.status(204).send();
  }
}
