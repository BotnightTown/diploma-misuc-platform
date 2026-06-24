import { CreateArtistFormType, UpdateArtistType } from "../modules/artists/artist.schema.ts";

export interface ArtistUploadData {
  file: Buffer;
  filename: string;
  contentType: string;
  size: number;
  meta: CreateArtistFormType;
}

export interface ArtistUpdateUploadData {
  file: Buffer;
  filename: string;
  contentType: string;
  size: number;
  meta: UpdateArtistType;
}
