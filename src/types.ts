export interface ImageFile {
  id: string;
  file: File;
  name: string;
  size: number;
  convertedName: string;
  convertedSize: number | null;
  convertedBlob: Blob | null;
  status: 'waiting' | 'converting' | 'done' | 'failed';
  error?: string;
  thumbnailUrl: string | null;
  webpUrl: string | null;
}

export interface ConverterSettings {
  quality: number; // between 0.01 and 1.00
  concurrency: number; // defaults to 3
}

export interface ConversionStats {
  total: number;
  completed: number;
  failed: number;
  savingBytes: number;
}
