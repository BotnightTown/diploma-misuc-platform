import { ArtistRepository } from "./artist.repository.ts";
import { UpdateArtistType, ArtistsQueryType, CreateArtistType } from "./artist.schema.ts";
import { ProblemDocument } from "../../models/error.model.ts";
import {
  deleteFile,
  extractKeyFromUrl,
  generateStorageKey,
  IMAGE_FOLDERS,
  uploadCover,
  uploadFile,
  validateFile,
} from "../../utils/storage.utils.ts";
import { ArtistUpdateUploadData, ArtistUploadData } from "../../types/artist.types.ts";
import { UploadDataType } from "../../types/upload.types.ts";
import { DEFAULT_AVATAR_COVER } from "../../constants/DEFAULT.ts";

export class ArtistService {
  constructor(private repository: ArtistRepository) {}

  async getAll(query: ArtistsQueryType) {
    const { page, limit } = query;
    const { data, total } = await this.repository.findAll(page, limit);
    return {
      data,
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

  async create(data: CreateArtistType, avatarData: UploadDataType | null) {
    const avatarUrl = avatarData
      ? await uploadCover(avatarData, IMAGE_FOLDERS.artistAvatars)
      : DEFAULT_AVATAR_COVER;
    return this.repository.create({ ...data, avatar_url: avatarUrl });
  }

  async update(artistId: number, data: UpdateArtistType, avatarData: UploadDataType | null) {
    const artist = await this.repository.findById(artistId);
    if (!artist) {
      throw new ProblemDocument(
        404,
        "Artist Not Found",
        `Artist with ID ${artistId} does not exist`,
      );
    }
    let avatarUrl: string | undefined;
    if (avatarData) {
      avatarUrl = await uploadCover(avatarData, IMAGE_FOLDERS.artistAvatars);
    }

    const updated = await this.repository.update(artistId, {
      ...data,
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    });

    if (avatarUrl) {
      const oldKey = extractKeyFromUrl(artist.avatar_url, "images");
      if (oldKey && artist.avatar_url !== DEFAULT_AVATAR_COVER) {
        await deleteFile("images", oldKey);
      }
    }
    return updated;
  }

  async delete(artistId: number): Promise<void> {
    const artist = await this.getById(artistId);

    const key = extractKeyFromUrl(artist.avatar_url, "images");
    if (key) {
      await deleteFile("images", key);
    }

    await this.repository.delete(artistId);
  }

  async followArtist(artistId: number, userId: number) {
    const artist = await this.repository.findById(artistId);
    if (!artist) {
      throw new ProblemDocument(
        404,
        "Artist Not Found",
        `Artist with ID ${artistId} does not exist`,
      );
    }
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new ProblemDocument(404, "User Not Found", `User with ID ${userId} does not exist`);
    }

    return this.repository.followArtist(artistId, userId);
  }

  async deleteFollower(artistId: number, userId: number): Promise<void> {
    const [artist, user] = await Promise.all([
      this.repository.findById(artistId),
      this.repository.findById(userId),
    ]);
    if (!artist || !user) {
      throw new ProblemDocument(
        404,
        "User Not Found",
        "Artist or user with the given ID does not exist",
      );
    }
    await this.repository.deleteFollower(artistId, userId);
  }
}
