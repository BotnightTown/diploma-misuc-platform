import { FastifyInstance } from "fastify";
import { PlaylistRepository } from "./playlists.repository.ts";
import { PlaylistService } from "./playlists.service.ts";
import { PlaylistController } from "./playlists.controller.ts";
import { authenticate } from "../../plugins/authenticate.ts";
import { optionalAuthenticate } from "../../plugins/optionalAuthenticate.ts";
import {
  PlaylistsQueryType,
  CreatePlaylistType,
  UpdatePlaylistType,
  AddTrackToPlaylistType,
  ReorderPlaylistTracksType,
} from "./playlists.schema.ts";

export const playlistRoutes = async (fastify: FastifyInstance) => {
  const repository = new PlaylistRepository();
  const service = new PlaylistService(repository);
  const controller = new PlaylistController(service);

  fastify.get<{ Querystring: PlaylistsQueryType }>(
    "/playlists",
    { preHandler: optionalAuthenticate },
    controller.getAll.bind(controller),
  );

  fastify.get<{ Params: { playlistId: number } }>(
    "/playlists/:playlistId",
    { preHandler: optionalAuthenticate },
    controller.getById.bind(controller),
  );

  fastify.get<{ Params: { playlistId: number }; Querystring: PlaylistsQueryType }>(
    "/playlists/:playlistId/tracks",
    { preHandler: optionalAuthenticate },
    controller.getTracks.bind(controller),
  );

  fastify.get<{ Params: { userId: number }; Querystring: PlaylistsQueryType }>(
    "/users/:userId/playlists",
    { preHandler: optionalAuthenticate },
    controller.getByUserId.bind(controller),
  );

  fastify.post<{ Body: CreatePlaylistType }>(
    "/playlists",
    { preHandler: authenticate },
    controller.create.bind(controller),
  );

  fastify.patch<{ Params: { playlistId: number }; Body: UpdatePlaylistType }>(
    "/playlists/:playlistId",
    { preHandler: authenticate },
    controller.update.bind(controller),
  );

  fastify.delete<{ Params: { playlistId: number } }>(
    "/playlists/:playlistId",
    { preHandler: authenticate },
    controller.delete.bind(controller),
  );

  fastify.post<{ Params: { playlistId: number }; Body: AddTrackToPlaylistType }>(
    "/playlists/:playlistId/tracks",
    { preHandler: authenticate },
    controller.addTrack.bind(controller),
  );

  fastify.delete<{ Params: { playlistId: number; trackId: number } }>(
    "/playlists/:playlistId/tracks/:trackId",
    { preHandler: authenticate },
    controller.removeTrack.bind(controller),
  );

  fastify.patch<{ Params: { playlistId: number }; Body: ReorderPlaylistTracksType }>(
    "/playlists/:playlistId/tracks/reorder",
    { preHandler: authenticate },
    controller.reorderTracks.bind(controller),
  );

  fastify.post<{ Params: { playlistId: number } }>(
    "/playlists/:playlistId/follow",
    { preHandler: authenticate },
    controller.follow.bind(controller),
  );

  fastify.delete<{ Params: { playlistId: number } }>(
    "/playlists/:playlistId/follow",
    { preHandler: authenticate },
    controller.unfollow.bind(controller),
  );

  fastify.get<{ Querystring: PlaylistsQueryType }>(
    "/me/followed-playlists",
    { preHandler: authenticate },
    controller.getFollowed.bind(controller),
  );
};
