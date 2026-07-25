import { db } from "../../config/db.ts";
import { CreateArtistType, UpdateArtistType } from "./artist.schema.ts";

export class ArtistRepository {
  async findAll(page: number, limit: number) {
    const offset = (page - 1) * limit;
    const [artists, total] = await Promise.all([
      db.artists.findMany({ skip: offset, take: limit, orderBy: { name: "asc" } }),
      db.artists.count(),
    ]);
    return { artists, total };
  }

  async findById(id: number) {
    return db.artists.findUnique({ where: { id } });
  }

  async findAlbums(artistId: number) {
    return db.albums.findMany({ where: { artist_id: artistId }, orderBy: { created_at: "desc" } });
  }

  async findTracks(artistId: number) {
    return db.tracks.findMany({ where: { artist_id: artistId }, orderBy: { title: "asc" } });
  }

  async create(data: CreateArtistType) {
    return db.artists.create({ data });
  }

  async update(id: number, data: UpdateArtistType) {
    return db.artists.update({ where: { id }, data });
  }

  async delete(id: number): Promise<void> {
    await db.artists.delete({ where: { id } });
  }

  async getFollowers(artistId: number) {
    return db.user_follows_artists.findMany({ where: { artist_id: artistId } });
  }

  async followArtist(artistId: number, userId: number) {
    return db.user_follows_artists.create({ data: { artist_id: artistId, user_id: userId } });
  }

  async deleteFollower(artistId: number, userId: number): Promise<void> {
    await db.user_follows_artists.deleteMany({ where: { artist_id: artistId, user_id: userId } });
  }
}
