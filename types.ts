import React from 'react';

export type AppState = 'splash' | 'walkthrough' | 'app';
export type Tab = 'home' | 'gallery' | 'profile' | 'dashboard' | 'all-images';
export type UserRole = 'user' | 'admin';
export type MediaType = 'image' | 'video';

export interface PhotoResult {
  id: string;
  imageUrl: string;
  videoUrl?: string;
  type?: MediaType;
  confidence: number;
  similarity?: number; // Raw similarity score (0-1)
  isSaved: boolean;
  category?: string; // Admin field
  uploadedAt?: string; // Admin field
  tagged_by?: string; // Profile name who tagged this image
  // Metadata fields from API
  file_size?: number;
  format?: string;
  width?: number;
  height?: number;
  datetime?: string;
  latitude?: number;
  longitude?: number;
  media_type?: 'image' | 'video';
  timestamp?: number;
}

export interface UserProfile {
  name: string;
  avatarUrl: string;
  role: UserRole;
}

export interface WalkthroughSlide {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

export interface AdminStat {
  label: string;
  value: string | number;
  change: string;
  isPositive: boolean;
}