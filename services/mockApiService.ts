import { PhotoResult } from '../types';
import { MOCK_RESULTS_DATA } from '../constants';

export const searchSimilarFaces = async (imgBlob: Blob): Promise<PhotoResult[]> => {
  // Simulate network latency and processing time
  return new Promise((resolve) => {
    setTimeout(() => {
      // Return a copy of mock data with slight variations if needed
      resolve([...MOCK_RESULTS_DATA]);
    }, 3500); // 3.5s processing time for effect
  });
};
