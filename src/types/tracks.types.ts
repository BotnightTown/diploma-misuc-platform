import { CreateTrackFormType, UpdateTrackType } from "../modules/tracks/track.schema.ts";

export interface TrackUploadData {
  file: Buffer;
  filename: string;
  contentType: string;
  size: number;
  meta: CreateTrackFormType;
}

export interface TrackUpdateUploadData {
  file: Buffer;
  filename: string;
  contentType: string;
  size: number;
  meta: UpdateTrackType;
}
