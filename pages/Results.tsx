import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ArrowLeft, Info, ChevronLeft, ChevronRight, Video } from 'lucide-react';
import { PhotoResult } from '../types';
import { searchSimilarFaces, getImageUrl, getSavedImageIds, saveToGallery } from '../services/apiService';
import { APP_TEXT_GRADIENT } from '../constants';
import { showToast } from '../components/Toast';

interface ResultsProps {
  sourceImage: string | null;
  sourceFile: File | null;
  onBack: () => void;
  onSave: (photo: PhotoResult) => void;
  token?: string | null;
  savedImageIds?: string[];
}

const Results: React.FC<ResultsProps> = ({ sourceImage, sourceFile, onBack, onSave, token, savedImageIds: propSavedIds }) => {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<PhotoResult[]>([]);
  const [processingStep, setProcessingStep] = useState(0);
  const [selectedImage, setSelectedImage] = useState<PhotoResult | null>(null);
  const [viewerMode, setViewerMode] = useState<'info' | 'fullscreen'>('info');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [savedImageIds, setSavedImageIds] = useState<Set<string>>(new Set(propSavedIds || []));
  const processingRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Create a unique ID for this file to prevent duplicate processing
    const fileId = sourceFile ? `${sourceFile.name}-${sourceFile.size}-${sourceFile.lastModified}` : null;

    // Prevent duplicate processing for the same file
    if (!fileId || processingRef.current === fileId) {
      return;
    }

    processingRef.current = fileId;

    // Abort any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const process = async () => {
      if (!sourceFile) {
        showToast('No image file provided', 'error');
        setLoading(false);
        processingRef.current = null;
        return;
      }

      try {
        // Load saved image IDs if token is available
        let savedIdsSet = new Set<string>();
        if (token) {
          try {
            const savedIds = await getSavedImageIds(token);
            savedIdsSet = new Set(savedIds);
            setSavedImageIds(savedIdsSet);
          } catch (err) {
            console.error('Failed to load saved IDs:', err);
          }
        } else if (propSavedIds) {
          savedIdsSet = new Set(propSavedIds);
        }

        // Simulated "Steps" for the loading screen
        setTimeout(() => setProcessingStep(1), 800); // Detecting face
        setTimeout(() => setProcessingStep(2), 1800); // Generating mesh
        setTimeout(() => setProcessingStep(3), 2600); // Searching db

        // Actual API call - only make ONE request
        const data = await searchSimilarFaces(sourceFile, token, signal);

        // Check if request was aborted
        if (signal.aborted) {
          return;
        }

        // Filter out already-saved images and process results
        const processedData = data
          .filter((item) => !savedIdsSet.has(item.id)) // Filter out saved images
          .map((item) => ({
            ...item,
            isSaved: false,
            imageUrl: getImageUrl(item.imageUrl),
          }));

        setResults(processedData);
        setLoading(false);
      } catch (error: any) {
        if (error.name === 'AbortError') {
          return; // Request was aborted, ignore
        }
        showToast(error.message || 'Failed to search for similar faces', 'error');
        setLoading(false);
      } finally {
        processingRef.current = null; // Reset for next search
      }
    };

    process();

    return () => {
      // Cleanup: abort request if component unmounts or file changes
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      processingRef.current = null;
    };
  }, [sourceFile, token]);

  const handleSave = async (id: string, fromFullscreen: boolean = false) => {
    const photo = results.find(r => r.id === id);
    if (photo) {
      try {
        // Save to backend if token is available
        if (token) {
          await saveToGallery(token, photo);
        }

        // Mark as saved locally and remove from results
        setSavedImageIds(prev => new Set([...prev, id]));
        const newResults = results.filter(p => p.id !== id);
        setResults(newResults);
        onSave(photo);
        showToast('Image saved to gallery', 'success');

        // If in fullscreen mode, navigate to next image or close
        if (fromFullscreen && selectedImage?.id === id) {
          if (newResults.length === 0) {
            // No more images, close viewer and go back
            setSelectedImage(null);
            setViewerMode('info');
          } else {
            // Navigate to next image (stay at same index, or go to previous if at end)
            const currentIndex = currentImageIndex;
            const nextIndex = currentIndex < newResults.length ? currentIndex : Math.max(0, currentIndex - 1);
            if (nextIndex >= 0 && nextIndex < newResults.length) {
              setCurrentImageIndex(nextIndex);
              setSelectedImage(newResults[nextIndex]);
            } else {
              setSelectedImage(null);
              setViewerMode('info');
            }
          }
        }
      } catch (error: any) {
        showToast(error.message || 'Failed to save image', 'error');
      }
    }
  };

  const handleReject = (id: string, fromFullscreen: boolean = false) => {
    const newResults = results.filter(p => p.id !== id);
    setResults(newResults);

    // If in fullscreen mode, navigate to next image or close
    if (fromFullscreen && selectedImage?.id === id) {
      if (newResults.length === 0) {
        // No more images, close viewer and go back
        setSelectedImage(null);
        setViewerMode('info');
      } else {
        // Navigate to next image (stay at same index, or go to previous if at end)
        const currentIndex = currentImageIndex;
        const nextIndex = currentIndex < newResults.length ? currentIndex : Math.max(0, currentIndex - 1);
        if (nextIndex >= 0 && nextIndex < newResults.length) {
          setCurrentImageIndex(nextIndex);
          setSelectedImage(newResults[nextIndex]);
        } else {
          setSelectedImage(null);
          setViewerMode('info');
        }
      }
    } else if (selectedImage?.id === id) {
      setSelectedImage(null);
      setViewerMode('info');
    }
  };

  const openFullscreenViewer = (image: PhotoResult) => {
    const index = results.findIndex(r => r.id === image.id);
    setCurrentImageIndex(index >= 0 ? index : 0);
    setSelectedImage(image);
    setViewerMode('fullscreen');
  };

  const navigateImage = useCallback((direction: 'prev' | 'next', currentResults?: PhotoResult[]) => {
    const resultsToUse = currentResults || results;
    if (resultsToUse.length === 0) return;

    setCurrentImageIndex(prevIndex => {
      let newIndex = prevIndex;
      if (direction === 'next') {
        newIndex = (prevIndex + 1) % resultsToUse.length;
      } else {
        newIndex = (prevIndex - 1 + resultsToUse.length) % resultsToUse.length;
      }

      setSelectedImage(resultsToUse[newIndex]);
      return newIndex;
    });
  }, [results]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

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
      if (!selectedImage || viewerMode !== 'fullscreen') return;

      if (e.key === 'ArrowLeft') {
        navigateImage('prev');
      } else if (e.key === 'ArrowRight') {
        navigateImage('next');
      } else if (e.key === 'Escape') {
        setSelectedImage(null);
        setViewerMode('info');
      }
    };

    if (viewerMode === 'fullscreen') {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [selectedImage, viewerMode, navigateImage]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-brand-dark dark:bg-brand-dark light:bg-white flex flex-col items-center justify-center p-8 transition-colors duration-300">
        <div className="relative w-64 h-64 mb-8">
          {/* Scanning Circle */}
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-brand-primary/30 dark:border-brand-primary/30 light:border-brand-primary/50 border-t-brand-primary dark:border-t-brand-primary light:border-t-brand-primary/90 transition-colors duration-300"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, ease: "linear", repeat: Infinity }}
          />
          <motion.div
            className="absolute inset-4 rounded-full border-2 border-brand-secondary/30 dark:border-brand-secondary/30 light:border-brand-secondary/50 border-b-brand-secondary dark:border-b-brand-secondary light:border-b-brand-secondary/80 transition-colors duration-300"
            animate={{ rotate: -360 }}
            transition={{ duration: 3, ease: "linear", repeat: Infinity }}
          />

          {/* Source Image with Pulse */}
          <div className="absolute inset-8 rounded-full overflow-hidden border-2 border-white/20 dark:border-white/20 light:border-gray-300 transition-colors duration-300">
            {sourceImage && <img src={sourceImage} alt="Source" className="w-full h-full object-cover opacity-80 transition-opacity duration-300" />}
            <div className="absolute inset-0 bg-brand-primary/20 dark:bg-brand-primary/20 light:bg-brand-primary/10 animate-pulse transition-colors duration-300" />
          </div>
        </div>

        <h2 className={`text-2xl font-display font-bold mb-2 transition-colors duration-300 ${APP_TEXT_GRADIENT}`}>
          AI Processing
        </h2>

        <div className="h-6 overflow-hidden flex flex-col items-center">
          <AnimatePresence mode='wait'>
            {processingStep === 0 && <motion.span key="0" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="text-gray-400 dark:text-gray-400 light:text-gray-600 transition-colors duration-300">Analyzing facial features...</motion.span>}
            {processingStep === 1 && <motion.span key="1" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="text-gray-400 dark:text-gray-400 light:text-gray-600 transition-colors duration-300">Constructing neural mesh...</motion.span>}
            {processingStep === 2 && <motion.span key="2" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="text-gray-400 dark:text-gray-400 light:text-gray-600 transition-colors duration-300">Matching against global database...</motion.span>}
            {processingStep === 3 && <motion.span key="3" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="text-gray-400 dark:text-gray-400 light:text-gray-600 transition-colors duration-300">Finalizing matches...</motion.span>}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Unknown';
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  if (results.length === 0 && !loading) {
    return (
      <div className="pt-20 pb-32 px-4 min-h-screen flex flex-col items-center justify-center bg-brand-dark dark:bg-brand-dark light:bg-white">
        <div className="flex items-center mb-6">
          <button onClick={onBack} className="p-2 rounded-full bg-white/5 dark:bg-white/5 light:bg-gray-100 hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-gray-200 mr-4">
            <ArrowLeft className="text-white dark:text-white light:text-gray-900" />
          </button>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-display font-bold text-white dark:text-white light:text-gray-900 mb-2">No Matches Found</h2>
          <p className="text-gray-400 dark:text-gray-400 light:text-gray-600">Try uploading a different image or check the database.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-32 px-4 bg-brand-dark dark:bg-brand-dark light:bg-white min-h-screen">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="p-2 rounded-full bg-white/5 dark:bg-white/5 light:bg-gray-100 hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-gray-200 mr-4">
          <ArrowLeft className="text-white dark:text-white light:text-gray-900" />
        </button>
        <div>
          <h2 className="text-2xl font-display font-bold text-white dark:text-white light:text-gray-900">Matches Found</h2>
          <p className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-600">{results.length} result{results.length !== 1 ? 's' : ''} found</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {results.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative group"
          >
            <div
              className="relative rounded-2xl overflow-hidden aspect-[3/4] glass-panel border-0 cursor-pointer"
              onClick={() => openFullscreenViewer(item)}
            >
              <img
                src={item.imageUrl}
                alt="Match"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback if image fails to load
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x400?text=Image+Not+Found';
                }}
              />

              {/* Confidence Badge */}
              <div className="absolute top-2 right-2 bg-black/60 dark:bg-black/60 light:bg-black/50 backdrop-blur-md px-2 py-1 rounded-full border border-brand-secondary/30 dark:border-brand-secondary/30 light:border-brand-secondary/40 transition-colors duration-300">
                <span className="text-xs font-bold text-brand-secondary dark:text-brand-secondary light:text-brand-secondary/90 transition-colors duration-300">{item.confidence}%</span>
              </div>

              {/* Video Badge */}
              {item.media_type === 'video' && (
                <div className="absolute top-2 right-16 bg-black/60 dark:bg-black/60 light:bg-black/50 backdrop-blur-md px-2 py-1 rounded-full border border-blue-500/30 transition-colors duration-300 flex items-center gap-1">
                  <Video size={12} className="text-blue-400" />
                  <span className="text-xs font-bold text-blue-400">{item.timestamp}s</span>
                </div>
              )}

              {/* Info Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(item);
                  setViewerMode('info');
                }}
                className="absolute top-2 left-2 w-8 h-8 rounded-full bg-black/60 dark:bg-black/60 light:bg-black/40 backdrop-blur-md flex items-center justify-center text-white/70 dark:text-white/70 light:text-white/90 hover:bg-white/20 dark:hover:bg-white/20 light:hover:bg-white/30 transition-all duration-300 z-10"
              >
                <Info size={16} className="transition-colors duration-300" />
              </button>

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 dark:from-black/80 light:from-black/60 via-transparent to-transparent opacity-80 dark:opacity-80 light:opacity-70 transition-all duration-300" />

              {/* Actions */}
              <div className="absolute bottom-0 inset-x-0 p-3 flex justify-between items-center z-20">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReject(item.id);
                  }}
                  className="w-10 h-10 rounded-full bg-white/10 dark:bg-white/10 light:bg-white/20 backdrop-blur-md flex items-center justify-center text-white/70 dark:text-white/70 light:text-white/90 hover:bg-red-500/80 dark:hover:bg-red-500/80 light:hover:bg-red-500/70 hover:text-white transition-colors duration-300"
                >
                  <X size={18} />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSave(item.id);
                  }}
                  disabled={item.isSaved}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all transform active:scale-90 ${item.isSaved ? 'bg-green-500 dark:bg-green-500 light:bg-green-600 text-white' : 'bg-brand-primary dark:bg-brand-primary light:bg-brand-primary/90 text-white hover:bg-brand-primary/80 dark:hover:bg-brand-primary/80 light:hover:bg-brand-primary/70 shadow-[0_0_15px_rgba(124,92,255,0.5)] dark:shadow-[0_0_15px_rgba(124,92,255,0.5)] light:shadow-[0_0_15px_rgba(124,92,255,0.4)]'}`}
                >
                  <Check size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Fullscreen Image Viewer */}
      <AnimatePresence>
        {selectedImage && viewerMode === 'fullscreen' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/95 dark:bg-black/95 light:bg-black/90 backdrop-blur-xl flex flex-col transition-colors duration-300"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6">
              <div className="flex items-center gap-4">
                <span className="text-sm font-mono text-gray-400 dark:text-gray-400 light:text-gray-300 transition-colors duration-300">
                  {currentImageIndex + 1} / {results.length}
                </span>
                <span className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-300 transition-colors duration-300">
                  {selectedImage.confidence}% Match
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedImage(null);
                  setViewerMode('info');
                }}
                className="p-2 rounded-full bg-white/10 dark:bg-white/10 light:bg-white/20 hover:bg-white/20 dark:hover:bg-white/20 light:hover:bg-white/30 transition-colors duration-300"
              >
                <X className="text-white dark:text-white light:text-white transition-colors duration-300" size={20} />
              </button>
            </div>

            {/* Image Container with Navigation */}
            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative">
              {/* Previous Button */}
              {results.length > 1 && (
                <button
                  onClick={() => navigateImage('prev')}
                  className="absolute left-4 z-10 p-3 rounded-full bg-black/50 dark:bg-black/50 light:bg-white/20 backdrop-blur-md hover:bg-black/70 dark:hover:bg-black/70 light:hover:bg-white/30 transition-colors duration-300"
                >
                  <ChevronLeft className="text-white dark:text-white light:text-gray-900 transition-colors duration-300" size={24} />
                </button>
              )}

              {/* Image */}
              <motion.img
                key={selectedImage.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                src={selectedImage.imageUrl}
                alt="Match"
                className="max-h-full max-w-full object-contain rounded-lg shadow-[0_0_50px_rgba(124,92,255,0.2)]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x400?text=Image+Not+Found';
                }}
              />

              {/* Next Button */}
              {results.length > 1 && (
                <button
                  onClick={() => navigateImage('next')}
                  className="absolute right-4 z-10 p-3 rounded-full bg-black/50 dark:bg-black/50 light:bg-white/20 backdrop-blur-md hover:bg-black/70 dark:hover:bg-black/70 light:hover:bg-white/30 transition-colors duration-300"
                >
                  <ChevronRight className="text-white dark:text-white light:text-gray-900 transition-colors duration-300" size={24} />
                </button>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 flex justify-between items-center pb-12 px-8">
              <button
                onClick={() => handleReject(selectedImage.id, true)}
                className="w-14 h-14 rounded-full bg-white/10 dark:bg-white/10 light:bg-white/20 backdrop-blur-md flex items-center justify-center text-white/70 dark:text-white/70 light:text-white/90 hover:bg-red-500/80 dark:hover:bg-red-500/80 light:hover:bg-red-500/70 hover:text-white transition-colors duration-300"
              >
                <X size={24} />
              </button>

              <button
                onClick={() => handleSave(selectedImage.id, true)}
                disabled={selectedImage.isSaved}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all transform active:scale-90 ${selectedImage.isSaved
                  ? 'bg-green-500 dark:bg-green-500 light:bg-green-600 text-white'
                  : 'bg-brand-primary dark:bg-brand-primary light:bg-brand-primary/90 text-white hover:bg-brand-primary/80 dark:hover:bg-brand-primary/80 light:hover:bg-brand-primary/70 shadow-[0_0_20px_rgba(124,92,255,0.6)] dark:shadow-[0_0_20px_rgba(124,92,255,0.6)] light:shadow-[0_0_20px_rgba(124,92,255,0.5)]'
                  }`}
              >
                <Check size={24} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Metadata Modal */}
      <AnimatePresence>
        {selectedImage && viewerMode === 'info' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/90 dark:bg-black/90 light:bg-black/70 backdrop-blur-lg flex items-center justify-center p-4 transition-colors duration-300"
            onClick={() => {
              setSelectedImage(null);
              setViewerMode('info');
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel border border-white/20 dark:border-white/20 light:border-gray-200/30 p-6 rounded-2xl max-w-md w-full transition-all duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-white dark:text-white light:text-gray-900 transition-colors duration-300">Image Metadata</h3>
                <button
                  onClick={() => {
                    setSelectedImage(null);
                    setViewerMode('info');
                  }}
                  className="text-white/60 dark:text-white/60 light:text-gray-600 hover:text-white dark:hover:text-white light:hover:text-gray-900 transition-colors duration-300"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400 dark:text-gray-400 light:text-gray-600 transition-colors duration-300">Similarity:</span>
                  <span className="text-white dark:text-white light:text-gray-900 font-semibold transition-colors duration-300">{selectedImage.confidence}%</span>
                </div>
                {selectedImage.format && (
                  <div className="flex justify-between">
                    <span className="text-gray-400 dark:text-gray-400 light:text-gray-600 transition-colors duration-300">Format:</span>
                    <span className="text-white dark:text-white light:text-gray-900 transition-colors duration-300">{selectedImage.format}</span>
                  </div>
                )}
                {selectedImage.width && selectedImage.height && (
                  <div className="flex justify-between">
                    <span className="text-gray-400 dark:text-gray-400 light:text-gray-600 transition-colors duration-300">Resolution:</span>
                    <span className="text-white dark:text-white light:text-gray-900 transition-colors duration-300">{selectedImage.width} × {selectedImage.height}</span>
                  </div>
                )}
                {selectedImage.file_size && (
                  <div className="flex justify-between">
                    <span className="text-gray-400 dark:text-gray-400 light:text-gray-600 transition-colors duration-300">File Size:</span>
                    <span className="text-white dark:text-white light:text-gray-900 transition-colors duration-300">{formatFileSize(selectedImage.file_size)}</span>
                  </div>
                )}
                {selectedImage.datetime && (
                  <div className="flex justify-between">
                    <span className="text-gray-400 dark:text-gray-400 light:text-gray-600 transition-colors duration-300">Date Taken:</span>
                    <span className="text-white dark:text-white light:text-gray-900 transition-colors duration-300">{formatDate(selectedImage.datetime)}</span>
                  </div>
                )}
                {(selectedImage.latitude && selectedImage.longitude) && (
                  <div className="flex justify-between">
                    <span className="text-gray-400 dark:text-gray-400 light:text-gray-600 transition-colors duration-300">Location:</span>
                    <span className="text-white dark:text-white light:text-gray-900 transition-colors duration-300">
                      {selectedImage.latitude.toFixed(4)}, {selectedImage.longitude.toFixed(4)}
                    </span>
                  </div>
                )}
                {selectedImage.media_type === 'video' && selectedImage.timestamp !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-400 dark:text-gray-400 light:text-gray-600 transition-colors duration-300">Timestamp:</span>
                    <span className="text-white dark:text-white light:text-gray-900 transition-colors duration-300">{selectedImage.timestamp}s</span>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Results;