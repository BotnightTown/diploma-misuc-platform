import { AlbumRepository } from "./album.repository.ts";
import { CreateAlbumType, UpdateAlbumType, AlbumsQueryType } from "./album.schema.ts";
import { ProblemDocument } from "../../models/error.model.ts";
import {
  deleteFile,
  extractKeyFromUrl,
  generateStorageKey,
  IMAGE_FOLDERS,
  uploadFile,
  validateFile,
} from "../../utils/storage.utils.ts";
import { AlbumUpdateUploadData, AlbumUploadData } from "../../types/album.types.ts";

export class AlbumService {
  constructor(private repository: AlbumRepository) {}

  async getAll(query: AlbumsQueryType) {
    const { page, limit } = query;
    const { albums, total } = await this.repository.findAll(page, limit);
    return {
      albums,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(albumId: number) {
    const album = await this.repository.findById(albumId);
    if (!album) {
      throw new ProblemDocument(404, "Album Not Found", `Album with ID ${albumId} does not exist`);
    }
    return album;
  }

  async getTracks(albumId: number, query: AlbumsQueryType) {
    await this.getById(albumId);
    const { page, limit } = query;
    const { tracks, total } = await this.repository.findTracks(albumId, page, limit);
    return {
      tracks,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  private async uploadCover(data: AlbumUploadData | AlbumUpdateUploadData): Promise<string> {
    validateFile(data.contentType, data.size, "images");

    const key = generateStorageKey(data.filename, IMAGE_FOLDERS.albumCovers);
    return uploadFile({
      bucket: "images",
      key,
      body: data.file,
      contentType: data.contentType,
      size: data.size,
    });
  }

  async create(data: AlbumUploadData | CreateAlbumType) {
    if (!("file" in data)) {
      const { cover_url, ...albumData } = data;
      return this.repository.create(albumData);
    }

    const coverUrl = await this.uploadCover(data);
    return this.repository.create({ ...data.meta, cover_url: coverUrl });
  }

  async update(albumId: number, data: AlbumUpdateUploadData | UpdateAlbumType) {
    const currentAlbum = await this.getById(albumId);

    if (!("file" in data)) {
      const { cover_url, ...albumData } = data;
      return this.repository.update(albumId, albumData);
    }

    const coverUrl = await this.uploadCover(data);
    const updatedAlbum = await this.repository.update(albumId, {
      ...data.meta,
      cover_url: coverUrl,
    });

    const oldKey = extractKeyFromUrl(currentAlbum.cover_url, "images");
    if (oldKey) {
      await deleteFile("images", oldKey);
    }

    return updatedAlbum;
  }

  async delete(albumId: number): Promise<void> {
    const album = await this.getById(albumId);
    const key = extractKeyFromUrl(album.cover_url, "images");
    if (key) {
      await deleteFile("images", key);
    }
    await this.repository.delete(albumId);
  }
}
