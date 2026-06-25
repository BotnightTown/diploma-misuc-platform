import { db } from "../../config/db.ts";
import { CreateReviewType, CreateTrackType, UpdateTrackType } from "./track.schema.ts";

type TrackUpdatePayload = UpdateTrackType & Partial<Pick<CreateTrackType, "audio_url">>;

export class TrackRepository {
  async findById(id: number) {
    return db.tracks.findUnique({
      where: { id },
      include: {
        artists: { select: { id: true, name: true, avatar_url: true } },
        albums: { select: { id: true, title: true, cover_url: true } },
      },
    });
  }

  async create(data: CreateTrackType) {
    return db.tracks.create({
      data,
      include: {
        artists: { select: { id: true, name: true, avatar_url: true } },
        albums: { select: { id: true, title: true, cover_url: true } },
      },
    });
  }

  async update(id: number, data: TrackUpdatePayload) {
    return db.tracks.update({
      where: { id },
      data,
      include: {
        artists: { select: { id: true, name: true, avatar_url: true } },
        albums: { select: { id: true, title: true, cover_url: true } },
      },
    });
  }

  async incrementPlayCount(id: number) {
    return db.tracks.update({
      where: { id },
      data: { play_count: { increment: 1 } },
      select: { id: true, play_count: true },
    });
  }

  async delete(id: number): Promise<void> {
    await db.tracks.delete({ where: { id } });
  }

  async createReview(userId: number, trackId: number, data: CreateReviewType) {
    return db.reviews.create({
      data: {
        user_id: userId,
        track_id: trackId,
        rating: data.rating,
        body: data.body ?? "",
      },
    });
  }

  async getReviewByTrackId(trackId: number) {
    return db.reviews.findMany({
      where: { track_id: trackId },
    });
  }

  async updateReview(userId: number, trackId: number, data: CreateReviewType) {
    return db.reviews.update({
      where: { user_id_track_id: { user_id: userId, track_id: trackId } },
      data: {
        rating: data.rating,
        body: data.body,
      },
    });
  }

  async deleteReview(userId: number, trackId: number): Promise<void> {
    await db.reviews.delete({
      where: { user_id_track_id: { user_id: userId, track_id: trackId } },
    });
  }
}
