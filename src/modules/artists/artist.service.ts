import { ArtistRepository } from "./artist.repository.ts";
import { UpdateArtistType, ArtistsQueryType, CreateArtistFormType } from "./artist.schema.ts";
import { ProblemDocument } from "../../models/error.model.ts";
import {
  deleteFile,
  extractKeyFromUrl,
  generateStorageKey,
  IMAGE_FOLDERS,
  uploadFile,
  validateFile,
} from "../../utils/storage.utils.ts";
import { ArtistUpdateUploadData, ArtistUploadData } from "../../types/artist.types.ts";

export class ArtistService {
  constructor(private repository: ArtistRepository) {}

  async getAll(query: ArtistsQueryType) {
    const { page, limit } = query;
    const { artists, total } = await this.repository.findAll(page, limit);
    return {
      artists,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(artistId: number) {
    const artist = await this.repository.findById(artistId);
    if (!artist) {
      throw new ProblemDocument(
        404,
        "Artist Not Found",
        `Artist with ID ${artistId} does not exist`,
      );
    }
    return artist;
  }

  async getAlbums(artistId: number) {
    await this.getById(artistId);
    return this.repository.findAlbums(artistId);
  }

  async getTracks(artistId: number) {
    await this.getById(artistId);
    return this.repository.findTracks(artistId);
  }

  private async uploadAvatar(data: ArtistUploadData | ArtistUpdateUploadData): Promise<string> {
    validateFile(data.contentType, data.size, "images");

    const key = generateStorageKey(data.filename, IMAGE_FOLDERS.artistAvatars);
    return uploadFile({
      bucket: "images",
      key,
      body: data.file,
      contentType: data.contentType,
      size: data.size,
    });
  }

  async create(data: ArtistUploadData | CreateArtistFormType) {
    if (!("file" in data)) {
      const { avatar_url, ...artistData } = data;
      return this.repository.create(artistData);
    }

    const avatarUrl = await this.uploadAvatar(data);
    return this.repository.create({ ...data.meta, avatar_url: avatarUrl });
  }

  async update(artistId: number, data: ArtistUpdateUploadData | UpdateArtistType) {
    const currentArtist = await this.getById(artistId);

    if (!("file" in data)) {
      const { avatar_url, ...artistData } = data;
      return this.repository.update(artistId, artistData);
    }

    const avatarUrl = await this.uploadAvatar(data);
    const updatedArtist = await this.repository.update(artistId, {
      ...data.meta,
      avatar_url: avatarUrl,
    });

    const oldKey = extractKeyFromUrl(currentArtist.avatar_url, "images");
    if (oldKey) {
      await deleteFile("images", oldKey);
    }

    return updatedArtist;
  }

  async delete(artistId: number): Promise<void> {
    const artist = await this.getById(artistId);

    const key = extractKeyFromUrl(artist.avatar_url, "images");
    if (key) {
      await deleteFile("images", key);
    }

    await this.repository.delete(artistId);
  }
}
