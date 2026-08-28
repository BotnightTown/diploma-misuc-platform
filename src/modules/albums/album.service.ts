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
import { UploadDataType } from "../../types/upload.types.ts";
import { DEFAULT_ALBUM_COVER } from "../../constants/DEFAULT.ts";

export class AlbumService {
  constructor(private repository: AlbumRepository) {}

  async getAll(query: AlbumsQueryType) {
    const { page, limit } = query;
    const { data, total } = await this.repository.findAll(page, limit);
    return {
      data,
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

  private async uploadCover(data: UploadDataType): Promise<string> {
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

  async create(data: CreateAlbumType, coverData: UploadDataType | null) {
    const coverUrl = coverData ? await this.uploadCover(coverData) : DEFAULT_ALBUM_COVER;
    return this.repository.create({ ...data, cover_url: coverUrl });
  }

  async update(albumId: number, data: UpdateAlbumType, coverData: UploadDataType | null) {
    const currentAlbum = await this.getById(albumId);

    let coverUrl: string | undefined;
    if (coverData) {
      coverUrl = await this.uploadCover(coverData);
    }

    const updatedAlbum = await this.repository.update(albumId, {
      ...data,
      ...(coverUrl ? { cover_url: coverUrl } : {}),
    });

    if (coverUrl) {
      const oldKey = extractKeyFromUrl(currentAlbum.cover_url, "images");
      if (oldKey && currentAlbum.cover_url !== DEFAULT_ALBUM_COVER) {
        await deleteFile("images", oldKey);
      }
    }

    return updatedAlbum;
  }

  async delete(albumId: number): Promise<void> {
    const album = await this.getById(albumId);
    const key = extractKeyFromUrl(album.cover_url, "images");
    if (key && album.cover_url !== DEFAULT_ALBUM_COVER) {
      await deleteFile("images", key);
    }
    await this.repository.delete(albumId);
  }
}
