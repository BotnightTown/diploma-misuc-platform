import { TrackRepository } from "./track.repository.ts";
import { CreateReviewType, TracksQueryType, UpdateTrackType } from "./track.schema.ts";
import { ProblemDocument } from "../../models/error.model.ts";
import {
  deleteFile,
  extractKeyFromUrl,
  generateStorageKey,
  uploadFile,
  validateFile,
} from "../../utils/storage.utils.ts";
import { TrackUpdateUploadData, TrackUploadData } from "../../types/tracks.types.ts";

export class TrackService {
  constructor(private repository: TrackRepository) {}

  async getTracks(query: TracksQueryType) {
    const { data, total } = await this.repository.findMany(query);

    return {
      data,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
      },
    };
  }

  async getById(trackId: number) {
    const track = await this.repository.findById(trackId);
    if (!track) {
      throw new ProblemDocument(404, "Track Not Found", `Track with ID ${trackId} does not exist`);
    }
    return track;
  }

  private async uploadAudio(data: TrackUploadData | TrackUpdateUploadData): Promise<string> {
    validateFile(data.contentType, data.size, "tracks");

    const key = generateStorageKey(data.filename);
    return uploadFile({
      bucket: "tracks",
      key,
      body: data.file,
      contentType: data.contentType,
      size: data.size,
    });
  }

  async create(data: TrackUploadData) {
    const audioUrl = await this.uploadAudio(data);
    return this.repository.create({ ...data.meta, audio_url: audioUrl });
  }

  async update(trackId: number, data: TrackUpdateUploadData | UpdateTrackType) {
    const currentTrack = await this.getById(trackId);

    if (!("file" in data)) {
      return this.repository.update(trackId, data);
    }

    const audioUrl = await this.uploadAudio(data);
    const updatedTrack = await this.repository.update(trackId, {
      ...data.meta,
      audio_url: audioUrl,
    });

    const oldKey = extractKeyFromUrl(currentTrack.audio_url, "tracks");
    if (oldKey) {
      await deleteFile("tracks", oldKey);
    }

    return updatedTrack;
  }

  async incrementPlayCount(trackId: number) {
    await this.getById(trackId);
    return this.repository.incrementPlayCount(trackId);
  }

  async delete(trackId: number): Promise<void> {
    const track = await this.getById(trackId);

    const key = extractKeyFromUrl(track.audio_url, "tracks");
    if (key) {
      await deleteFile("tracks", key);
    }

    await this.repository.delete(trackId);
  }

  async createReview(userId: number, trackId: number, data: CreateReviewType) {
    await this.getById(trackId);
    const existingReview = await this.repository.findReviewByUserAndTrack(userId, trackId);
    if (existingReview) {
      throw new ProblemDocument(
        400,
        "Review Already Exists",
        `User with ID ${userId} has already reviewed track ${trackId}`,
      );
    }
    return this.repository.createReview(userId, trackId, data);
  }

  async getReviewByTrackId(trackId: number) {
    await this.getById(trackId);
    const existingReviews = await this.repository.getReviewsByTrackId(trackId);
    if (!existingReviews.length) {
      throw new ProblemDocument(
        404,
        "Review Not Found",
        `No review found for track with ID ${trackId}`,
      );
    }
    return existingReviews;
  }

  async updateReview(userId: number, trackId: number, data: CreateReviewType) {
    await this.getById(trackId);
    const existingReview = await this.repository.findReviewByUserAndTrack(userId, trackId);
    if (!existingReview) {
      throw new ProblemDocument(
        404,
        "Review Not Found",
        `No review found for track with ID ${trackId}`,
      );
    }
    return this.repository.updateReview(userId, trackId, data);
  }

  async deleteReview(userId: number, trackId: number): Promise<void> {
    await this.getById(trackId);
    const existingReview = await this.repository.findReviewByUserAndTrack(userId, trackId);
    if (!existingReview) {
      throw new ProblemDocument(
        404,
        "Review Not Found",
        `No review found for track with ID ${trackId}`,
      );
    }
    return this.repository.deleteReview(userId, trackId);
  }

  async like(userId: number, trackId: number): Promise<void> {
    await this.getById(trackId);
    const existingLike = await this.repository.findLike(userId, trackId);

    if (existingLike) {
      throw new ProblemDocument(
        400,
        "Already Liked",
        `User with ID ${userId} has already liked track ${trackId}`,
      );
    }

    return this.repository.like(userId, trackId);
  }

  async unlike(userId: number, trackId: number): Promise<void> {
    await this.getById(trackId);
    const existingLike = await this.repository.findLike(userId, trackId);
    if (!existingLike) {
      throw new ProblemDocument(
        400,
        "Not Liked",
        `User with ID ${userId} has not liked track ${trackId}`,
      );
    }
    return this.repository.unlike(userId, trackId);
  }
}
