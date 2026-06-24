import { CreateAlbumType, UpdateAlbumType } from "../modules/albums/album.schema.ts";

export interface AlbumUploadData {
  file: Buffer;
  filename: string;
  contentType: string;
  size: number;
  meta: CreateAlbumType;
}

export interface AlbumUpdateUploadData {
  file: Buffer;
  filename: string;
  contentType: string;
  size: number;
  meta: UpdateAlbumType;
}
