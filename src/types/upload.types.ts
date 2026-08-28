export interface UploadDataType {
  file: Buffer;
  filename: string;
  contentType: string;
  size: number;
}

export interface ParsedMultipart {
  fields: Record<string, string>;
  files: Record<string, UploadDataType>;
}
