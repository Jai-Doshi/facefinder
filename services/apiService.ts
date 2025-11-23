// apiService.ts
// Real API service for FaceFinder backend integration

import { PhotoResult } from '../types';

const API_BASE_URL = 'https://jai14-facefinder.hf.space';

export interface SearchResponse {
  results: PhotoResult[];
}

export interface UploadResponse {
  processed: number;
  failed: number;
  failed_files: string[];
}

export interface ImagesResponse {
  images: PhotoResult[];
}

// Helper function to show toast notifications
const showToast = (message: string, type: 'success' | 'error' = 'error') => {
  // This will be handled by a toast component
  console.error(`[${type.toUpperCase()}] ${message}`);
  // In a real implementation, you'd dispatch to a toast context/store
};

// Helper function to handle API errors
const handleError = (error: any, defaultMessage: string = 'An error occurred') => {
  const message = error?.response?.data?.error || error?.message || defaultMessage;
  showToast(message, 'error');
  throw new Error(message);
};

/**
 * Search for similar faces in the database
 */
export const searchSimilarFaces = async (imageFile: File, token?: string | null, signal?: AbortSignal): Promise<PhotoResult[]> => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);

    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/search-image`, {
      method: 'POST',
      headers,
      body: formData,
      signal, // Support abort signal
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to search images' }));
      throw new Error(errorData.error || 'Failed to search images');
    }

    const data: SearchResponse = await response.json();
    return data.results;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw error; // Re-throw abort errors
    }
    handleError(error, 'Failed to search for similar faces');
    return [];
  }
};

/**
 * Upload multiple images (Admin only)
 */
export const uploadImages = async (files: File[]): Promise<UploadResponse> => {
  try {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });

    const response = await fetch(`${API_BASE_URL}/api/admin/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to upload images' }));
      throw new Error(errorData.error || 'Failed to upload images');
    }

    const data: UploadResponse = await response.json();
    return data;
  } catch (error: any) {
    handleError(error, 'Failed to upload images');
    throw error;
  }
};

/**
 * Get all images from database (Admin only)
 * @param taggedBy Optional profile name to filter by
 * @param untaggedOnly If true, only return untagged images
 */
export const getAllImages = async (taggedBy?: string, untaggedOnly?: boolean): Promise<PhotoResult[]> => {
  try {
    const params = new URLSearchParams();
    if (taggedBy) {
      params.append('tagged_by', taggedBy);
    }
    if (untaggedOnly) {
      params.append('untagged_only', 'true');
    }
    
    const url = `${API_BASE_URL}/api/admin/images${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to fetch images' }));
      throw new Error(errorData.error || 'Failed to fetch images');
    }

    const data: ImagesResponse = await response.json();
    return data.images;
  } catch (error: any) {
    handleError(error, 'Failed to fetch images');
    return [];
  }
};

/**
 * Get all unique tags (profile names) from database (Admin only)
 */
export const getAllTags = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/tags`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to fetch tags' }));
      throw new Error(errorData.error || 'Failed to fetch tags');
    }

    const data = await response.json();
    return data.tags || [];
  } catch (error: any) {
    handleError(error, 'Failed to fetch tags');
    return [];
  }
};

/**
 * Delete an image from database (Admin only)
 */
export const deleteImage = async (imageId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/image/${imageId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to delete image' }));
      throw new Error(errorData.error || 'Failed to delete image');
    }
  } catch (error: any) {
    handleError(error, 'Failed to delete image');
    throw error;
  }
};

/**
 * Update image metadata (Admin only)
 */
export const updateImage = async (imageId: string, metadata: Partial<PhotoResult>): Promise<void> => {
  try {
    const updateData: any = {};
    if (metadata.datetime !== undefined) updateData.datetime = metadata.datetime;
    if (metadata.latitude !== undefined) updateData.latitude = metadata.latitude;
    if (metadata.longitude !== undefined) updateData.longitude = metadata.longitude;
    if (metadata.tagged_by !== undefined) updateData.tagged_by = metadata.tagged_by;

    const response = await fetch(`${API_BASE_URL}/api/admin/image/${imageId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to update image' }));
      throw new Error(errorData.error || 'Failed to update image');
    }
  } catch (error: any) {
    handleError(error, 'Failed to update image');
    throw error;
  }
};

/**
 * Get image URL (helper function)
 */
export const getImageUrl = (imagePath: string): string => {
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  if (imagePath.startsWith('/api/images/')) {
    return `${API_BASE_URL}${imagePath}`;
  }
  return `${API_BASE_URL}/api/images/${imagePath}`;
};

/**
 * Authentication API calls
 */

export interface AuthResponse {
  message: string;
  user: {
    id: number;
    name: string;
    email: string;
    profile_image: string | null;
    is_admin: boolean;
  };
  token: string;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  profile_image: string | null;
  is_admin: boolean;
  created_at?: string;
}

/**
 * Sign up a new user
 */
export const signUp = async (name: string, email: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to sign up' }));
      throw new Error(errorData.error || 'Failed to sign up');
    }

    const data: AuthResponse = await response.json();
    return data;
  } catch (error: any) {
    handleError(error, 'Failed to sign up');
    throw error;
  }
};

/**
 * Sign in a user
 */
export const signIn = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to sign in' }));
      throw new Error(errorData.error || 'Failed to sign in');
    }

    const data: AuthResponse = await response.json();
    return data;
  } catch (error: any) {
    handleError(error, 'Failed to sign in');
    throw error;
  }
};

/**
 * Get current user profile (requires authentication)
 */
export const getProfile = async (token: string): Promise<{ user: UserProfile }> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to fetch profile' }));
      throw new Error(errorData.error || `Failed to fetch profile: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout: Server took too long to respond');
    }
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Connection failed: Unable to reach the server. Please check your connection and try again.');
    }
    // Re-throw if it's already an Error with a message
    if (error.message) {
      throw error;
    }
    handleError(error, 'Failed to fetch profile');
    throw error;
  }
};

/**
 * Update user profile image (requires authentication)
 */
export const updateProfileImage = async (token: string, imageFile: File): Promise<{ user: UserProfile }> => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`${API_BASE_URL}/api/auth/profile/image`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to update profile image' }));
      throw new Error(errorData.error || 'Failed to update profile image');
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    handleError(error, 'Failed to update profile image');
    throw error;
  }
};

/**
 * Get profile image URL (helper function)
 */
export const getProfileImageUrl = (imagePath: string | null): string | null => {
  if (!imagePath) {
    return null; // No default avatar - will show initials instead
  }
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  if (imagePath.startsWith('/api/profile-images/')) {
    return `${API_BASE_URL}${imagePath}`;
  }
  return `${API_BASE_URL}/api/profile-images/${imagePath}`;
};

/**
 * Gallery API calls
 */

/**
 * Save image to gallery (requires authentication)
 */
export const saveToGallery = async (token: string, imageData: PhotoResult): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/gallery/save`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(imageData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to save image' }));
      throw new Error(errorData.error || 'Failed to save image');
    }
  } catch (error: any) {
    handleError(error, 'Failed to save image to gallery');
    throw error;
  }
};

/**
 * Get user's gallery images (requires authentication)
 */
export const getGalleryImages = async (token: string): Promise<PhotoResult[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/gallery/images`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to fetch gallery' }));
      throw new Error(errorData.error || 'Failed to fetch gallery');
    }

    const data = await response.json();
    return data.images.map((img: any) => ({
      ...img,
      imageUrl: getImageUrl(img.imageUrl),
    }));
  } catch (error: any) {
    handleError(error, 'Failed to fetch gallery images');
    return [];
  }
};

/**
 * Delete image from gallery (requires authentication)
 */
export const deleteFromGallery = async (token: string, imageId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/gallery/image/${imageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to delete image' }));
      throw new Error(errorData.error || 'Failed to delete image');
    }
  } catch (error: any) {
    handleError(error, 'Failed to delete image from gallery');
    throw error;
  }
};

/**
 * Get saved image IDs for filtering (requires authentication)
 */
export const getSavedImageIds = async (token: string): Promise<string[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/gallery/saved-ids`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to fetch saved IDs' }));
      throw new Error(errorData.error || 'Failed to fetch saved IDs');
    }

    const data = await response.json();
    return data.saved_ids || [];
  } catch (error: any) {
    handleError(error, 'Failed to fetch saved image IDs');
    return [];
  }
};

/**
 * Get user statistics (requires authentication)
 */
export const getUserStats = async (token: string): Promise<{ scan_count: number; saved_count: number }> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(`${API_BASE_URL}/api/user/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to fetch stats' }));
      throw new Error(errorData.error || `Failed to fetch stats: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('Stats request timeout');
      return { scan_count: 0, saved_count: 0 };
    }
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('Stats connection failed');
      return { scan_count: 0, saved_count: 0 };
    }
    console.error('Failed to fetch user statistics:', error);
    return { scan_count: 0, saved_count: 0 };
  }
};

/**
 * Get admin dashboard statistics
 */
export interface AdminStats {
  total_images: number;
  total_users: number;
  successful_scans: number;
  pending_reviews: number;
}

export const getAdminStats = async (): Promise<AdminStats> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to fetch admin stats' }));
      throw new Error(errorData.error || 'Failed to fetch admin stats');
    }

    const data: AdminStats = await response.json();
    return data;
  } catch (error: any) {
    handleError(error, 'Failed to fetch admin statistics');
    // Return default values on error
    return {
      total_images: 0,
      total_users: 0,
      successful_scans: 0,
      pending_reviews: 0
    };
  }
};

