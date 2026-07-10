import { db } from "../../config/db.ts";
import { CreatePlaylistType, UpdatePlaylistType } from "./playlists.schema.ts";

export class PlaylistRepository {
  async findAll(page: number, limit: number) {
    const offset = (page - 1) * limit;
    const where = { is_public: true };
    const [playlists, total] = await Promise.all([
      db.playlists.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { created_at: "desc" },
        include: { users: { select: { id: true, username: true, avatar_url: true } } },
      }),
      db.playlists.count({ where }),
    ]);
    return { playlists, total };
  }

  async findByUserId(userId: number, page: number, limit: number, onlyPublic: boolean) {
    const offset = (page - 1) * limit;
    const where = { user_id: userId, ...(onlyPublic ? { is_public: true } : {}) };
    const [playlists, total] = await Promise.all([
      db.playlists.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { created_at: "desc" },
      }),
      db.playlists.count({ where }),
    ]);
    return { playlists, total };
  }

  async findById(id: number) {
    return db.playlists.findUnique({
      where: { id },
      include: { users: { select: { id: true, username: true, avatar_url: true } } },
    });
  }

  async findTracks(playlistId: number, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const [playlistTracks, total] = await Promise.all([
      db.playlist_tracks.findMany({
        where: { playlist_id: playlistId },
        skip: offset,
        take: limit,
        orderBy: { position: "asc" },
        include: { tracks: true },
      }),
      db.playlist_tracks.count({ where: { playlist_id: playlistId } }),
    ]);
    return { playlistTracks, total };
  }

  async getMaxTrackPosition(playlistId: number): Promise<number> {
    const result = await db.playlist_tracks.aggregate({
      where: { playlist_id: playlistId },
      _max: { position: true },
    });
    return result._max.position ?? -1;
  }

  async create(userId: number, data: CreatePlaylistType) {
    return db.playlists.create({
      data: { ...data, user_id: userId },
    });
  }

  async update(id: number, data: UpdatePlaylistType) {
    return db.playlists.update({ where: { id }, data });
  }

  async delete(id: number): Promise<void> {
    await db.playlists.delete({ where: { id } });
  }

  async addTrack(playlistId: number, trackId: number, position: number) {
    return db.playlist_tracks.create({
      data: { playlist_id: playlistId, track_id: trackId, position },
    });
  }

  async findTrackInPlaylist(playlistId: number, trackId: number) {
    return db.playlist_tracks.findUnique({
      where: { playlist_id_track_id: { playlist_id: playlistId, track_id: trackId } },
    });
  }

  async removeTrack(playlistId: number, trackId: number): Promise<void> {
    await db.playlist_tracks.delete({
      where: { playlist_id_track_id: { playlist_id: playlistId, track_id: trackId } },
    });
  }

  async follow(userId: number, playlistId: number) {
    return db.playlist_follows.create({
      data: { user_id: userId, playlist_id: playlistId },
    });
  }

  async unfollow(userId: number, playlistId: number): Promise<void> {
    await db.playlist_follows.delete({
      where: { user_id_playlist_id: { user_id: userId, playlist_id: playlistId } },
    });
  }

  async findFollow(userId: number, playlistId: number) {
    return db.playlist_follows.findUnique({
      where: { user_id_playlist_id: { user_id: userId, playlist_id: playlistId } },
    });
  }

  async findFollowedByUser(userId: number, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const [follows, total] = await Promise.all([
      db.playlist_follows.findMany({
        where: { user_id: userId },
        skip: offset,
        take: limit,
        orderBy: { created_at: "desc" },
        include: { playlists: true },
      }),
      db.playlist_follows.count({ where: { user_id: userId } }),
    ]);
    return { follows, total };
  }
}
