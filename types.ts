export interface PhotoResult {
  id: string;
  imageUrl: string;
  similarity?: number;
  confidence?: number;
  file_size?: number;
  format?: string;
  width?: number;
  height?: number;
  datetime?: string;
  latitude?: number;
  longitude?: number;
  uploadedAt?: string;
  tagged_by?: string;
  isSaved?: boolean;
  media_type?: string;
  type?: MediaType;
  videoUrl?: string;
  timestamp?: number;
  timestamps?: number[]; // Added for aggregated video matches
}

export type MediaType = 'image' | 'video';