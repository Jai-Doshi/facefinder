import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Shimmer, ShimmerImage } from '../components/Shimmer';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Trash2, X, ZoomIn, ChevronLeft, ChevronRight, ZoomOut } from 'lucide-react';
import { PhotoResult } from '../types';
import { getGalleryImages, deleteFromGallery } from '../services/apiService';

interface GalleryProps {
  token?: string | null;
  onDelete?: (id: string) => void;
}

const Gallery: React.FC<GalleryProps> = ({ token, onDelete }) => {
  const [items, setItems] = useState<PhotoResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<PhotoResult | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (token) {
      loadGallery();
    } else {
      setLoading(false);
    }
  }, [token]);

  const loadGallery = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const images = await getGalleryImages(token);
      setItems(images);
    } catch (error) {
      console.error('Failed to load gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    
    try {
      await deleteFromGallery(token, id);
      const newItems = items.filter(item => item.id !== id);
      setItems(newItems);
      if (onDelete) {
        onDelete(id);
      }
      if (selectedImage?.id === id) {
        if (newItems.length === 0) {
          setSelectedImage(null);
        } else {
          const newIndex = Math.min(currentImageIndex, newItems.length - 1);
          setCurrentImageIndex(newIndex);
          setSelectedImage(newItems[newIndex]);
        }
      }
      const { showToast } = await import('../components/Toast');
      showToast('Image removed from gallery', 'success');
    } catch (error: any) {
      console.error('Failed to delete image:', error);
      const { showToast } = await import('../components/Toast');
      showToast(error.message || 'Failed to delete image', 'error');
    }
  };

  const openImageViewer = (image: PhotoResult) => {
    const index = items.findIndex(item => item.id === image.id);
    setCurrentImageIndex(index >= 0 ? index : 0);
    setSelectedImage(image);
    setIsZoomed(false);
  };

  const navigateImage = useCallback((direction: 'prev' | 'next') => {
    if (items.length === 0) return;
    
    setCurrentImageIndex(prevIndex => {
      let newIndex = prevIndex;
      if (direction === 'next') {
        newIndex = (prevIndex + 1) % items.length;
      } else {
        newIndex = (prevIndex - 1 + items.length) % items.length;
      }
      
      setSelectedImage(items[newIndex]);
      setIsZoomed(false);
      return newIndex;
    });
  }, [items]);

  const handleShare = async () => {
    if (!selectedImage) return;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'FaceFinder Match',
          text: `Found a ${selectedImage.confidence}% match!`,
          url: selectedImage.imageUrl,
        });
      } else {
        // Fallback: Copy image URL to clipboard
        await navigator.clipboard.writeText(selectedImage.imageUrl);
        const { showToast } = await import('../components/Toast');
        showToast('Image URL copied to clipboard', 'success');
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Failed to share:', error);
        const { showToast } = await import('../components/Toast');
        showToast('Failed to share image', 'error');
      }
    }
  };

  const handleZoom = () => {
    const newZoomState = !isZoomed;
    setIsZoomed(newZoomState);
    if (imageRef.current) {
      if (newZoomState) {
        imageRef.current.style.transform = 'scale(2)';
        imageRef.current.style.cursor = 'grab';
        imageRef.current.style.transition = 'transform 0.3s ease';
      } else {
        imageRef.current.style.transform = 'scale(1)';
        imageRef.current.style.cursor = 'zoom-in';
        imageRef.current.style.transition = 'transform 0.3s ease';
      }
    }
  };

  const handleImageDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleZoom();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isZoomed) return; // Don't swipe when zoomed
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isZoomed) return;
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (isZoomed || !touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      navigateImage('next');
    }
    if (isRightSwipe) {
      navigateImage('prev');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedImage) return;
      
      if (e.key === 'ArrowLeft') {
        navigateImage('prev');
      } else if (e.key === 'ArrowRight') {
        navigateImage('next');
      } else if (e.key === 'Escape') {
        setSelectedImage(null);
        setIsZoomed(false);
      }
    };

    if (selectedImage) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [selectedImage, navigateImage]);

  if (loading) {
    return (
      <div className="pt-20 pb-32 px-4 min-h-screen bg-brand-dark dark:bg-brand-dark light:bg-white">
        <div className="mb-6">
          <Shimmer height="2rem" width="12rem" rounded="lg" className="mb-2" />
          <Shimmer height="1rem" width="8rem" rounded="lg" />
        </div>
        <div className="columns-2 gap-4 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`break-inside-avoid ${i % 3 === 0 ? 'aspect-[3/4]' : 'aspect-[4/3]'}`}>
              <ShimmerImage className="w-full h-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-32 px-4 min-h-screen bg-brand-dark dark:bg-brand-dark light:bg-white">
      <h1 className="text-3xl font-display font-bold mb-2 text-white dark:text-white light:text-gray-900">Your Gallery</h1>
      <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 mb-6">Saved moments and discoveries</p>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 opacity-50">
          <div className="w-16 h-16 border-2 border-dashed border-gray-500 dark:border-gray-500 light:border-gray-300 rounded-xl mb-4" />
          <p className="text-gray-400 dark:text-gray-400 light:text-gray-600">No saved faces yet.</p>
          {!token && (
            <p className="text-sm text-gray-500 dark:text-gray-500 light:text-gray-500 mt-2">Sign in to save images to your gallery</p>
          )}
        </div>
      ) : (
        <div className="columns-2 gap-4 space-y-4">
          {items.map((item) => {
            // Determine if image is vertical or horizontal based on dimensions
            const isVertical = item.width && item.height ? item.height > item.width : false;
            const aspectClass = isVertical ? 'aspect-[3/4]' : 'aspect-[4/3]';
            
            return (
              <motion.div
                key={item.id}
                layoutId={`gallery-img-${item.id}`}
                className={`relative break-inside-avoid rounded-xl overflow-hidden cursor-pointer group ${aspectClass}`}
                onClick={() => openImageViewer(item)}
              >
                <img 
                  src={item.imageUrl} 
                  alt="Saved" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x400?text=Image+Not+Found';
                  }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Fullscreen Viewer */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/95 dark:bg-black/95 light:bg-black/80 backdrop-blur-xl flex flex-col transition-colors duration-300"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6">
              <div className="flex items-center gap-4">
                <span className="text-sm font-mono text-gray-400 dark:text-gray-400 light:text-gray-300 transition-colors duration-300">
                  {currentImageIndex + 1} / {items.length}
                </span>
              </div>
              <button 
                onClick={() => {
                  setSelectedImage(null);
                  setIsZoomed(false);
                }}
                className="p-2 rounded-full bg-white/10 dark:bg-white/10 light:bg-white/20 hover:bg-white/20 dark:hover:bg-white/20 light:hover:bg-white/30 transition-colors duration-300"
              >
                <X className="text-white dark:text-white light:text-white transition-colors duration-300" />
              </button>
            </div>

            {/* Image Container with Navigation */}
            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative">
              {/* Previous Button */}
              {items.length > 1 && !isZoomed && (
                <button
                  onClick={() => navigateImage('prev')}
                  className="absolute left-4 z-10 p-3 rounded-full bg-black/50 dark:bg-black/50 light:bg-white/20 backdrop-blur-md hover:bg-black/70 dark:hover:bg-black/70 light:hover:bg-white/30 transition-colors duration-300"
                >
                  <ChevronLeft className="text-white dark:text-white light:text-gray-900 transition-colors duration-300" size={24} />
                </button>
              )}

              {/* Image */}
              <motion.img
                ref={imageRef}
                key={selectedImage.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                layoutId={`gallery-img-${selectedImage.id}`}
                src={selectedImage.imageUrl}
                className={`max-h-full max-w-full object-contain rounded-lg shadow-[0_0_50px_rgba(124,92,255,0.2)] transition-transform duration-300 select-none ${isZoomed ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'}`}
                onClick={handleZoom}
                onDoubleClick={handleImageDoubleClick}
                draggable={isZoomed}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x400?text=Image+Not+Found';
                }}
              />

              {/* Next Button */}
              {items.length > 1 && !isZoomed && (
                <button
                  onClick={() => navigateImage('next')}
                  className="absolute right-4 z-10 p-3 rounded-full bg-black/50 dark:bg-black/50 light:bg-white/20 backdrop-blur-md hover:bg-black/70 dark:hover:bg-black/70 light:hover:bg-white/30 transition-colors duration-300"
                >
                  <ChevronRight className="text-white dark:text-white light:text-gray-900 transition-colors duration-300" size={24} />
                </button>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-8 flex justify-center gap-8 pb-12">
              <button 
                onClick={handleShare}
                className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-400 light:text-gray-300 hover:text-white dark:hover:text-white light:hover:text-white transition-colors duration-300"
              >
                <div className="w-12 h-12 rounded-full glass-panel flex items-center justify-center text-brand-secondary dark:text-brand-secondary light:text-brand-secondary/90 transition-colors duration-300">
                  <Share2 size={20} />
                </div>
                <span className="text-xs">Share</span>
              </button>
              
              <button 
                onClick={handleZoom}
                className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-400 light:text-gray-300 hover:text-white dark:hover:text-white light:hover:text-white transition-colors duration-300"
              >
                <div className="w-12 h-12 rounded-full glass-panel flex items-center justify-center text-white dark:text-white light:text-gray-900 transition-colors duration-300">
                  {isZoomed ? <ZoomOut size={20} /> : <ZoomIn size={20} />}
                </div>
                <span className="text-xs">{isZoomed ? 'Zoom Out' : 'Zoom'}</span>
              </button>

              <button 
                onClick={() => {
                  handleDelete(selectedImage.id);
                }}
                className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-400 light:text-gray-300 hover:text-red-400 dark:hover:text-red-400 light:hover:text-red-600 transition-colors duration-300"
              >
                <div className="w-12 h-12 rounded-full glass-panel flex items-center justify-center text-red-500 dark:text-red-500 light:text-red-600 hover:bg-red-500/20 dark:hover:bg-red-500/20 light:hover:bg-red-100 transition-colors duration-300">
                  <Trash2 size={20} />
                </div>
                <span className="text-xs">Delete</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Gallery;