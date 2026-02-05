import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Shimmer, ShimmerImage } from '../components/Shimmer';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Trash2, X, ZoomIn, ChevronLeft, ChevronRight, ZoomOut, Play, Film, ImageIcon as ImageIconLucide } from 'lucide-react';
import { PhotoResult, MediaType } from '../types';
import { getGalleryImages, deleteFromGallery } from '../services/apiService';

interface GalleryProps {
  token?: string | null;
  onDelete?: (id: string) => void;
}

const Gallery: React.FC<GalleryProps> = ({ token, onDelete }) => {
  const [items, setItems] = useState<PhotoResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMediaType, setActiveMediaType] = useState<MediaType>('image');
  const [selectedImage, setSelectedImage] = useState<PhotoResult | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

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

      // Deduplication Logic
      const uniqueVideos = new Map<string, any>();
      const processedImages: any[] = [];

      images.forEach(item => {
        const processedItem = {
          ...item,
          type: (item.media_type || 'image') as MediaType,
          videoUrl: item.media_type === 'video' ? item.imageUrl : undefined,
          timestamps: item.media_type === 'video' ? [item.timestamp || 0] : undefined
        };

        if (processedItem.type === 'video') {
          const existing = uniqueVideos.get(processedItem.imageUrl);
          const ts = processedItem.timestamp || 0;

          if (!existing) {
            uniqueVideos.set(processedItem.imageUrl, processedItem);
          } else {
            if (existing.timestamps && !existing.timestamps.includes(ts)) {
              existing.timestamps.push(ts);
              existing.timestamps.sort((a: number, b: number) => a - b);
            }
            // Keep the one with highest ID (newest) or some other metric?
            // For gallery, usually we just want one entry.
            // Let's keep the one currently in map, just merge timestamps.
          }
        } else {
          processedImages.push(processedItem);
        }
      });

      const finalItems = [...processedImages, ...Array.from(uniqueVideos.values())];
      // Sort by ID descending (newest first)
      finalItems.sort((a, b) => parseInt(b.id) - parseInt(a.id));

      setItems(finalItems);
    } catch (error) {
      console.error('Failed to load gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => item.type === activeMediaType);

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
          const currentFiltered = newItems.filter(i => i.type === activeMediaType);
          if (currentFiltered.length === 0) {
            setSelectedImage(null);
          } else {
            const newIndex = Math.min(currentImageIndex, currentFiltered.length - 1);
            setCurrentImageIndex(newIndex);
            setSelectedImage(currentFiltered[newIndex]);
          }
        }
      }
      const { showToast } = await import('../components/Toast');
      showToast(`${activeMediaType === 'image' ? 'Image' : 'Video'} removed from gallery`, 'success');
    } catch (error: any) {
      console.error('Failed to delete item:', error);
      const { showToast } = await import('../components/Toast');
      showToast(error.message || 'Failed to delete item', 'error');
    }
  };

  const openImageViewer = (image: PhotoResult) => {
    const index = filteredItems.findIndex(item => item.id === image.id);
    setCurrentImageIndex(index >= 0 ? index : 0);
    setSelectedImage(image);
    setIsZoomed(false);
  };

  const navigateImage = useCallback((direction: 'prev' | 'next') => {
    if (filteredItems.length === 0) return;

    setCurrentImageIndex(prevIndex => {
      let newIndex = prevIndex;
      if (direction === 'next') {
        newIndex = (prevIndex + 1) % filteredItems.length;
      } else {
        newIndex = (prevIndex - 1 + filteredItems.length) % filteredItems.length;
      }

      setSelectedImage(filteredItems[newIndex]);
      setIsZoomed(false);
      return newIndex;
    });
  }, [filteredItems]);

  const handleShare = async () => {
    if (!selectedImage) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'FaceFinder Discovery',
          text: `Check out this ${selectedImage.type === 'image' ? 'photo' : 'video'} match!`,
          url: selectedImage.videoUrl || selectedImage.imageUrl,
        });
      } else {
        await navigator.clipboard.writeText(selectedImage.videoUrl || selectedImage.imageUrl);
        const { showToast } = await import('../components/Toast');
        showToast('URL copied to clipboard', 'success');
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Failed to share:', error);
        const { showToast } = await import('../components/Toast');
        showToast('Failed to share item', 'error');
      }
    }
  };

  const handleZoom = () => {
    if (selectedImage?.type === 'video') return;
    const newZoomState = !isZoomed;
    setIsZoomed(newZoomState);
    if (imageRef.current) {
      if (newZoomState) {
        imageRef.current.style.transform = 'scale(2)';
        imageRef.current.style.cursor = 'grab';
      } else {
        imageRef.current.style.transform = 'scale(1)';
        imageRef.current.style.cursor = 'zoom-in';
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isZoomed) return;
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
    if (distance > 50) navigateImage('next');
    if (distance < -50) navigateImage('prev');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedImage) return;
      if (e.key === 'ArrowLeft') navigateImage('prev');
      else if (e.key === 'ArrowRight') navigateImage('next');
      else if (e.key === 'Escape') {
        setSelectedImage(null);
        setIsZoomed(false);
      }
    };
    if (selectedImage) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [selectedImage, navigateImage]);

  const TabButton = ({ type, label, icon: Icon }: { type: MediaType, label: string, icon: any }) => (
    <button
      onClick={() => setActiveMediaType(type)}
      className={`relative flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 z-10 ${activeMediaType === type
        ? 'text-gray-900 dark:text-white'
        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
        }`}
    >
      {activeMediaType === type && (
        <motion.div
          layoutId="gallery-tab-bg"
          className="absolute inset-0 bg-white dark:bg-white/10 rounded-full shadow-sm border border-gray-200/50 dark:border-white/5"
          initial={false}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      <Icon size={16} className="relative z-10" />
      <span className="relative z-10">{label}</span>
    </button>
  );

  if (loading) {
    return (
      <div className="pt-20 pb-32 px-4 min-h-screen bg-white dark:bg-brand-dark">
        <div className="mb-8 space-y-4">
          <Shimmer height="2.5rem" width="12rem" rounded="xl" />
          <div className="flex gap-2">
            <Shimmer height="2.5rem" width="6rem" rounded="full" />
            <Shimmer height="2.5rem" width="6rem" rounded="full" />
          </div>
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
    <div className="pt-20 pb-32 px-4 min-h-screen bg-white dark:bg-brand-dark transition-colors duration-300">
      <div className="mb-6">
        <h1 className="text-3xl font-display font-bold mb-1 text-gray-900 dark:text-white transition-colors duration-300">Discovery Gallery</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6 transition-colors duration-300 text-sm">Your private collection of AI matches</p>

        {/* Media Type Tabs */}
        <div className="inline-flex p-1.5 bg-gray-100 dark:bg-white/5 rounded-full border border-gray-200 dark:border-white/5 shadow-inner">
          <TabButton type="image" label="Images" icon={ImageIconLucide} />
          <TabButton type="video" label="Videos" icon={Film} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeMediaType}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="min-h-[400px]"
        >
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-40">
              <div className="w-16 h-16 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl flex items-center justify-center mb-4">
                {activeMediaType === 'image' ? <ImageIconLucide size={24} /> : <Film size={24} />}
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">No {activeMediaType}s saved yet.</p>
            </div>
          ) : (
            <div className="columns-2 gap-4 space-y-4">
              {filteredItems.map((item) => (
                <motion.div
                  key={item.id}
                  layoutId={`gallery-item-${item.id}`}
                  className={`relative break-inside-avoid rounded-2xl overflow-hidden cursor-pointer group shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-white/5`}
                  onClick={() => openImageViewer(item)}
                  whileHover={{ scale: 1.02 }}
                >
                  <div
                    onClick={() => openImageViewer(item)}
                    className="relative w-full h-full bg-black"
                    onMouseEnter={(e) => {
                      if (item.type === 'video') {
                        const vid = e.currentTarget.querySelector('video');
                        if (vid) vid.play().catch(() => { });
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (item.type === 'video') {
                        const vid = e.currentTarget.querySelector('video');
                        if (vid) {
                          vid.pause();
                          vid.currentTime = 0; // Reset preview
                        }
                      }
                    }}
                  >
                    {item.type === 'video' && item.videoUrl ? (
                      <video
                        src={`${item.videoUrl}#t=0.01`}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        preload="metadata" // Metadata only to save bandwidth
                        loop
                      />
                    ) : (
                      <img
                        src={item.imageUrl}
                        alt="Gallery item"
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x400?text=Error'; }}
                      />
                    )}

                    {item.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition-colors pointer-events-none">
                        <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center border border-white/40">
                          <Play size={18} className="text-white fill-current ml-0.5" />
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Fullscreen Viewer */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-white/98 dark:bg-black/98 backdrop-blur-2xl flex flex-col transition-colors duration-300"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-white/10 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                  {selectedImage.type}
                </span>
                <span className="text-xs font-mono text-gray-400 dark:text-gray-500">
                  {currentImageIndex + 1} / {filteredItems.length}
                </span>
              </div>
              <button
                onClick={() => { setSelectedImage(null); setIsZoomed(false); }}
                className="p-2.5 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-all active:scale-90"
              >
                <X className="text-gray-900 dark:text-white" size={20} />
              </button>
            </div>

            {/* Content Container */}
            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative">
              {filteredItems.length > 1 && !isZoomed && (
                <button
                  onClick={() => navigateImage('prev')}
                  className="absolute left-6 z-10 p-4 rounded-full bg-white/70 dark:bg-black/30 backdrop-blur-xl hover:bg-white dark:hover:bg-black/50 transition-all shadow-xl active:scale-95 hidden md:flex"
                >
                  <ChevronLeft className="text-gray-900 dark:text-white" size={24} />
                </button>
              )}

              <div className="relative w-full h-full flex items-center justify-center">
                {selectedImage.type === 'video' && selectedImage.videoUrl ? (
                  <video
                    ref={videoRef}
                    key={selectedImage.videoUrl}
                    src={selectedImage.videoUrl}
                    controls
                    autoPlay
                    className="max-h-full max-w-full rounded-2xl shadow-2xl"
                  />
                ) : (
                  <motion.img
                    ref={imageRef}
                    key={selectedImage.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    src={selectedImage.imageUrl}
                    className={`max-h-full max-w-full object-contain rounded-2xl shadow-2xl transition-transform duration-300 select-none ${isZoomed ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'}`}
                    onClick={handleZoom}
                  />
                )}
              </div>

              {filteredItems.length > 1 && !isZoomed && (
                <button
                  onClick={() => navigateImage('next')}
                  className="absolute right-6 z-10 p-4 rounded-full bg-white/70 dark:bg-black/30 backdrop-blur-xl hover:bg-white dark:hover:bg-black/50 transition-all shadow-xl active:scale-95 hidden md:flex"
                >
                  <ChevronRight className="text-gray-900 dark:text-white" size={24} />
                </button>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-8 flex justify-center gap-8 pb-16 items-center flex-wrap">
              <button onClick={handleShare} className="flex flex-col items-center gap-2 group">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 group-hover:bg-brand-primary/10 transition-colors flex items-center justify-center text-gray-700 dark:text-white">
                  <Share2 size={20} />
                </div>
                <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wider">Share</span>
              </button>

              {selectedImage.type === 'video' && selectedImage.timestamps && selectedImage.timestamps.length > 0 && (
                <div className="relative group">
                  <button
                    className="flex flex-col items-center gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Toggle or show timestamp list overlay
                      // For simplicity, we can use a local state or just show a popover
                      // Let's use a simple alert-like overlay or reuse the Info concept
                      // But user asked for a button "in middle".
                      // Let's toggle a visibility state for the list container
                      const el = document.getElementById('timestamp-overlay');
                      if (el) el.classList.toggle('hidden');
                    }}
                  >
                    <div className="w-14 h-14 rounded-full bg-brand-primary/10 dark:bg-brand-primary/20 group-hover:bg-brand-primary/20 border border-brand-primary/30 flex items-center justify-center text-brand-primary dark:text-brand-primary scale-110 shadow-[0_0_15px_rgba(124,92,255,0.3)]">
                      <div className="flex flex-col items-center leading-none">
                        <span className="text-lg font-bold">{selectedImage.timestamps.length}</span>
                        <span className="text-[8px] uppercase">Times</span>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-brand-primary dark:text-brand-primary tracking-wider">Timestamps</span>
                  </button>

                  {/* Timestamp Popover Overlay */}
                  <div id="timestamp-overlay" className="hidden absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-64 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl z-50 animate-in fade-in zoom-in duration-200">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Found {selectedImage.timestamps.length} times</span>
                      <button onClick={(e) => { e.stopPropagation(); document.getElementById('timestamp-overlay')?.classList.add('hidden'); }} className="text-white/50 hover:text-white">
                        <X size={14} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                      {selectedImage.timestamps.map((ts) => (
                        <button
                          key={ts}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (videoRef.current) {
                              videoRef.current.currentTime = ts;
                              videoRef.current.play();
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-brand-primary/80 hover:scale-105 active:scale-95 text-white text-xs border border-white/5 transition-all"
                        >
                          {ts}s
                        </button>
                      ))}
                    </div>
                    {/* Triangle Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-black/80"></div>
                  </div>
                </div>
              )}

              {selectedImage.type === 'image' && (
                <button onClick={handleZoom} className="flex flex-col items-center gap-2 group">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 group-hover:bg-gray-200 dark:group-hover:bg-white/10 transition-colors flex items-center justify-center text-gray-700 dark:text-white">
                    {isZoomed ? <ZoomOut size={20} /> : <ZoomIn size={20} />}
                  </div>
                  <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wider">{isZoomed ? 'Reset' : 'Zoom'}</span>
                </button>
              )}

              <button onClick={() => handleDelete(selectedImage.id)} className="flex flex-col items-center gap-2 group">
                <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-500/10 group-hover:bg-red-100 dark:group-hover:bg-red-500/20 transition-colors flex items-center justify-center text-red-600 dark:text-red-400">
                  <Trash2 size={20} />
                </div>
                <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wider">Delete</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Gallery;