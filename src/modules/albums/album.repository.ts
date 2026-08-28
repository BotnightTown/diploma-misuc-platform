import { db } from "../../config/db.ts";
import { CreateAlbumType, UpdateAlbumType } from "./album.schema.ts";

export class AlbumRepository {
  async findAll(page: number, limit: number) {
    const offset = (page - 1) * limit;
    const [data, total] = await Promise.all([
      db.albums.findMany({
        skip: offset,
        take: limit,
        orderBy: { release_year: "desc" },
        include: { artists: { select: { id: true, name: true, avatar_url: true } } },
      }),
      db.albums.count(),
    ]);
    return { data, total };
  }

  async findById(id: number) {
    return db.albums.findUnique({
      where: { id },
      include: { artists: { select: { id: true, name: true, avatar_url: true } } },
    });
  }

  async findTracks(albumId: number, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const [tracks, total] = await Promise.all([
      db.tracks.findMany({
        where: { album_id: albumId },
        skip: offset,
        take: limit,
        orderBy: { created_at: "asc" },
      }),
      db.tracks.count({ where: { album_id: albumId } }),
    ]);
    return { tracks, total };
  }

  async create(data: CreateAlbumType) {
    return db.albums.create({
      data,
      include: { artists: { select: { id: true, name: true, avatar_url: true } } },
    });
  }

  async update(id: number, data: UpdateAlbumType) {
    return db.albums.update({
      where: { id },
      data,
      include: { artists: { select: { id: true, name: true, avatar_url: true } } },
    });
  }

  async delete(id: number): Promise<void> {
    await db.albums.delete({ where: { id } });
  }
}
