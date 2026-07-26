import { ProblemDocument } from "../../models/error.model.ts";
import { PlaylistRepository } from "./playlists.repository.ts";
import {
  AddTrackToPlaylistType,
  CreatePlaylistType,
  PlaylistsQueryType,
  ReorderPlaylistTracksType,
  UpdatePlaylistType,
} from "./playlists.schema.ts";

export class PlaylistService {
  constructor(private repository: PlaylistRepository) {}

  async getAll(query: PlaylistsQueryType) {
    const { page, limit } = query;
    const { playlists, total } = await this.repository.findAll(page, limit);
    return { playlists, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getByUserId(userId: number, query: PlaylistsQueryType, requesterId: number | null) {
    const { page, limit } = query;
    const onlyPublic = requesterId !== userId;
    const { playlists, total } = await this.repository.findByUserId(
      userId,
      page,
      limit,
      onlyPublic,
    );
    return { playlists, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getById(playlistId: number, requesterId: number | null) {
    const playlist = await this.repository.findById(playlistId);
    if (!playlist) {
      throw new ProblemDocument(
        404,
        "Playlist Not Found",
        `Playlist with ID ${playlistId} does not exist`,
      );
    }

    if (!playlist.is_public && playlist.user_id !== requesterId) {
      throw new ProblemDocument(
        404,
        "Playlist Not Found",
        `Playlist with ID ${playlistId} does not exist`,
      );
    }

    return playlist;
  }

  async getTracks(playlistId: number, query: PlaylistsQueryType, requesterId: number | null) {
    await this.getById(playlistId, requesterId); // існування + приватність
    const { page, limit } = query;
    const { playlistTracks, total } = await this.repository.findTracks(playlistId, page, limit);
    return {
      tracks: playlistTracks.map((pt) => ({
        ...pt.tracks,
        position: pt.position,
        added_at: pt.added_at,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async create(userId: number, data: CreatePlaylistType) {
    return this.repository.create(userId, data);
  }

  private async assertOwnership(playlistId: number, userId: number) {
    const playlist = await this.repository.findById(playlistId);
    if (!playlist) {
      throw new ProblemDocument(
        404,
        "Playlist Not Found",
        `Playlist with ID ${playlistId} does not exist`,
      );
    }
    if (playlist.user_id !== userId) {
      throw new ProblemDocument(
        403,
        "Forbidden",
        "You do not have permission to modify this playlist",
      );
    }
    return playlist;
  }

  async update(playlistId: number, userId: number, data: UpdatePlaylistType) {
    await this.assertOwnership(playlistId, userId);
    return this.repository.update(playlistId, data);
  }

  async delete(playlistId: number, userId: number): Promise<void> {
    await this.assertOwnership(playlistId, userId);
    await this.repository.delete(playlistId);
  }

  async addTrack(playlistId: number, userId: number, data: AddTrackToPlaylistType) {
    await this.assertOwnership(playlistId, userId);

    const existing = await this.repository.findTrackInPlaylist(playlistId, data.track_id);
    if (existing) {
      throw new ProblemDocument(
        409,
        "Track Already In Playlist",
        "This track is already in the playlist",
      );
    }

    const position = data.position ?? (await this.repository.getMaxTrackPosition(playlistId)) + 1;
    return this.repository.addTrack(playlistId, data.track_id, position);
  }

  async removeTrack(playlistId: number, trackId: number, userId: number): Promise<void> {
    await this.assertOwnership(playlistId, userId);

    const existing = await this.repository.findTrackInPlaylist(playlistId, trackId);
    if (!existing) {
      throw new ProblemDocument(404, "Track Not In Playlist", "This track is not in the playlist");
    }

    await this.repository.removeTrack(playlistId, trackId);
  }

  async reorderTracks(playlistId: number, userId: number, data: ReorderPlaylistTracksType) {
    await this.assertOwnership(playlistId, userId);

    const tracks = await this.repository.findTracksForReordering(playlistId);
    const currentIndex = tracks.findIndex((track) => track.track_id === data.track_id);
    if (currentIndex === -1) {
      throw new ProblemDocument(404, "Track Not In Playlist", "This track is not in the playlist");
    }
    if (data.position >= tracks.length) {
      throw new ProblemDocument(
        400,
        "Invalid Track Position",
        `Position must be between 0 and ${tracks.length - 1}`,
      );
    }

    const orderedTrackIds = tracks.map((track) => track.track_id);
    const [trackId] = orderedTrackIds.splice(currentIndex, 1);
    orderedTrackIds.splice(data.position, 0, trackId);

    await this.repository.updateTrackPositions(playlistId, orderedTrackIds);
    return this.repository.findTrackInPlaylist(playlistId, data.track_id);
  }

  async follow(playlistId: number, userId: number) {
    const playlist = await this.getById(playlistId, userId);

    if (playlist.user_id === userId) {
      throw new ProblemDocument(400, "Bad Request", "You cannot follow your own playlist");
    }

    const existing = await this.repository.findFollow(userId, playlistId);
    if (existing) {
      throw new ProblemDocument(409, "Already Following", "You already follow this playlist");
    }

    return this.repository.follow(userId, playlistId);
  }

  async unfollow(playlistId: number, userId: number): Promise<void> {
    const existing = await this.repository.findFollow(userId, playlistId);
    if (!existing) {
      throw new ProblemDocument(404, "Not Following", "You do not follow this playlist");
    }
    await this.repository.unfollow(userId, playlistId);
  }

  async getFollowedByUser(userId: number, query: PlaylistsQueryType) {
    const { page, limit } = query;
    const { follows, total } = await this.repository.findFollowedByUser(userId, page, limit);
    return {
      playlists: follows.map((f) => f.playlists),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
