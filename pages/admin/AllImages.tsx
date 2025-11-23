import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MoreVertical, Trash2, Edit2, Save, X, RefreshCw, Folder, FolderOpen, MapPin } from 'lucide-react';
import { PhotoResult } from '../../types';
import { GlassCard, GradientButton } from '../../components/UIComponents';
import { getAllImages, getAllTags, deleteImage, updateImage, getImageUrl } from '../../services/apiService';
import { showToast } from '../../components/Toast';
import { Shimmer, ShimmerImage } from '../../components/Shimmer';

interface AllImagesProps {
  images?: PhotoResult[];
  onUpdate?: (id: string, updates: Partial<PhotoResult>) => void;
  onDelete?: (id: string) => void;
}

const AllImages: React.FC<AllImagesProps> = ({ images: propImages, onUpdate, onDelete }) => {
  const [images, setImages] = useState<PhotoResult[]>(propImages || []);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<PhotoResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Partial<PhotoResult>>({});
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showUntaggedOnly, setShowUntaggedOnly] = useState(true); // Default to showing untagged images
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<PhotoResult | null>(null);
  const [locationDisplay, setLocationDisplay] = useState<string>('');
  const [locationSearch, setLocationSearch] = useState('');
  const [locationResults, setLocationResults] = useState<any[]>([]);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Fetch images and tags from API
  useEffect(() => {
    fetchTags();
    fetchImages();
  }, [selectedTag, showUntaggedOnly]);

  // Update location display when selected image changes
  useEffect(() => {
    if (selectedImage) {
      if (selectedImage.latitude && selectedImage.longitude) {
        reverseGeocode(selectedImage.latitude, selectedImage.longitude).then(setLocationDisplay);
      } else {
        setLocationDisplay('');
      }
    }
  }, [selectedImage]);

  const fetchTags = async () => {
    try {
      const tagList = await getAllTags();
      setTags(tagList);
    } catch (error: any) {
      console.error('Failed to fetch tags:', error);
    }
  };

  const fetchImages = async () => {
    setLoading(true);
    try {
      let data: PhotoResult[];
      if (showUntaggedOnly) {
        // Show only untagged images
        data = await getAllImages(undefined, true);
      } else if (selectedTag) {
        // Show only images with the selected tag
        data = await getAllImages(selectedTag);
      } else {
        // Default: show untagged images
        data = await getAllImages(undefined, true);
      }
      
      // Process images to format URLs and add isSaved flag
      const processedData = data.map((img) => ({
        ...img,
        isSaved: false,
        imageUrl: getImageUrl(img.imageUrl),
        confidence: 100, // Default for admin view
      }));
      setImages(processedData);
    } catch (error: any) {
      showToast(error.message || 'Failed to fetch images', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filtering - search by ID, tagged_by (profile name), or format
  // When searching by profile name, automatically filter by that tag
  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      // Check if search query matches any tag
      const matchingTag = tags.find(tag => tag.toLowerCase().includes(query));
      if (matchingTag && matchingTag !== selectedTag) {
        setSelectedTag(matchingTag);
        setShowUntaggedOnly(false);
      }
    }
  }, [searchQuery, tags]);

  const filteredImages = images.filter(img => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      img.id.includes(query) ||
      (img.tagged_by && img.tagged_by.toLowerCase().includes(query)) ||
      (img.format && img.format.toLowerCase().includes(query))
    );
  });

  // Reverse geocoding to get location from lat/long
  const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'GooglePhotosApp/1.0'
          }
        }
      );
      const data = await response.json();
      if (data.address) {
        const parts = [];
        if (data.address.city) parts.push(data.address.city);
        else if (data.address.town) parts.push(data.address.town);
        else if (data.address.village) parts.push(data.address.village);
        
        if (data.address.state) parts.push(data.address.state);
        else if (data.address.province) parts.push(data.address.province);
        
        if (data.address.country_code) {
          parts.push(data.address.country_code.toUpperCase());
        }
        
        return parts.length > 0 ? parts.join(', ') : 'Location found';
      }
      return '';
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return '';
    }
  };

  // Search for locations with debouncing
  useEffect(() => {
    if (!locationSearch || locationSearch.length < 3) {
      setLocationResults([]);
      return;
    }
    
    const timeoutId = setTimeout(() => {
      setLoadingLocation(true);
      fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationSearch)}&limit=10&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'GooglePhotosApp/1.0'
          }
        }
      )
        .then(res => res.json())
        .then(data => {
          setLocationResults(data);
          setLoadingLocation(false);
        })
        .catch(error => {
          console.error('Location search error:', error);
          setLocationResults([]);
          setLoadingLocation(false);
        });
    }, 500); // Debounce 500ms
    
    return () => clearTimeout(timeoutId);
  }, [locationSearch]);

  // Handle location selection
  const handleLocationSelect = (location: any) => {
    const lat = parseFloat(location.lat);
    const lon = parseFloat(location.lon);
    
    setEditData({
      ...editData,
      latitude: lat,
      longitude: lon,
    });
    
    // Format location display
    const address = location.address || {};
    const parts = [];
    if (address.city) parts.push(address.city);
    else if (address.town) parts.push(address.town);
    else if (address.village) parts.push(address.village);
    
    if (address.state) parts.push(address.state);
    else if (address.province) parts.push(address.province);
    
    if (address.country_code) {
      parts.push(address.country_code.toUpperCase());
    }
    
    setLocationDisplay(parts.length > 0 ? parts.join(', ') : location.display_name);
    setShowLocationPicker(false);
    setLocationSearch('');
    setLocationResults([]);
  };

  const openEdit = (img: PhotoResult) => {
    setSelectedImage(img);
    setEditData({
      datetime: img.datetime || '',
      latitude: img.latitude,
      longitude: img.longitude,
      tagged_by: img.tagged_by || '',
    });
    setEditMode(false);
    setLocationSearch('');
    setLocationResults([]);
    setShowLocationPicker(false);
  };

  const handleSave = async () => {
    if (selectedImage) {
      try {
        await updateImage(selectedImage.id, editData);
        // Update local state
        const updatedImage = { ...selectedImage, ...editData };
        setImages(prev => prev.map(img => img.id === selectedImage.id ? updatedImage : img));
        setSelectedImage(updatedImage);
        setEditMode(false);
        
        // Update location display if lat/long changed
        if (editData.latitude && editData.longitude) {
          const location = await reverseGeocode(editData.latitude, editData.longitude);
          setLocationDisplay(location);
        }
        
        showToast('Image updated successfully', 'success');
        if (onUpdate) {
          onUpdate(selectedImage.id, editData);
        }
      } catch (error: any) {
        showToast(error.message || 'Failed to update image', 'error');
      }
    }
  };

  const handleDeleteClick = (image: PhotoResult) => {
    setImageToDelete(image);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (imageToDelete) {
      try {
        await deleteImage(imageToDelete.id);
        setImages(prev => prev.filter(img => img.id !== imageToDelete.id));
        if (selectedImage && selectedImage.id === imageToDelete.id) {
          setSelectedImage(null);
        }
        showToast('Image deleted successfully', 'success');
        if (onDelete) {
          onDelete(imageToDelete.id);
        }
        setShowDeleteModal(false);
        setImageToDelete(null);
      } catch (error: any) {
        showToast(error.message || 'Failed to delete image', 'error');
      }
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setImageToDelete(null);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Unknown';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Unknown';
      
      const day = date.getDate();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      
      // Get ordinal suffix (1st, 2nd, 3rd, 4th, etc.)
      const getOrdinalSuffix = (n: number) => {
        const j = n % 10;
        const k = n % 100;
        if (j === 1 && k !== 11) return 'st';
        if (j === 2 && k !== 12) return 'nd';
        if (j === 3 && k !== 13) return 'rd';
        return 'th';
      };
      
      return `${day}${getOrdinalSuffix(day)} ${month}, ${year}`;
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="pt-20 pb-32 px-4 min-h-screen bg-brand-dark dark:bg-brand-dark light:bg-gray-50 transition-colors duration-300">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <Shimmer height="2rem" width="12rem" rounded="lg" />
            <Shimmer height="2.5rem" width="2.5rem" rounded="full" />
          </div>
          <div className="mb-4">
            <div className="flex flex-wrap gap-2 mb-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Shimmer key={i} height="2.5rem" width="6rem" rounded="xl" />
              ))}
            </div>
          </div>
          <Shimmer height="3rem" width="100%" rounded="xl" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <ShimmerImage key={i} className="w-full aspect-square" />
          ))}
        </div>
      </div>
    );
  }

  const handleTagClick = (tag: string | null) => {
    if (selectedTag === tag) {
      // Clicking the same tag deselects it and shows untagged
      setSelectedTag(null);
      setShowUntaggedOnly(true);
    } else {
      setSelectedTag(tag);
      setShowUntaggedOnly(false);
    }
  };

  const handleUntaggedClick = () => {
    if (showUntaggedOnly) {
      // Already showing untagged, do nothing (or could toggle to show all)
      // For now, keep it selected
      return;
    } else {
      setShowUntaggedOnly(true);
      setSelectedTag(null);
    }
  };

  return (
    <div className="pt-20 pb-32 px-4 min-h-screen bg-brand-dark dark:bg-brand-dark light:bg-gray-50 transition-colors duration-300">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-display font-bold text-white dark:text-white light:text-gray-900 transition-colors duration-300">Database Explorer</h1>
          <button
            onClick={() => {
              fetchTags();
              fetchImages();
            }}
            className="p-2 rounded-full bg-white/5 dark:bg-white/5 light:bg-white hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-gray-100 transition-colors duration-300 shadow-sm light:shadow"
            title="Refresh"
          >
            <RefreshCw size={20} className="text-white dark:text-white light:text-gray-900 transition-colors duration-300" />
          </button>
        </div>
        
        {/* Tags/Folders Section */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={handleUntaggedClick}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors duration-300 ${
                showUntaggedOnly
                  ? 'bg-purple-500/20 dark:bg-purple-500/20 light:bg-purple-100 border border-purple-500/50 dark:border-purple-500/50 light:border-purple-300 text-purple-300 dark:text-purple-300 light:text-purple-700'
                  : 'bg-white/5 dark:bg-white/5 light:bg-white hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-gray-100 text-gray-300 dark:text-gray-300 light:text-gray-700 border border-white/10 dark:border-white/10 light:border-gray-200'
              }`}
            >
              {showUntaggedOnly ? <FolderOpen size={16} /> : <Folder size={16} />}
              <span className="text-sm font-medium">Untagged</span>
            </button>
            
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors duration-300 ${
                  selectedTag === tag
                    ? 'bg-purple-500/20 dark:bg-purple-500/20 light:bg-purple-100 border border-purple-500/50 dark:border-purple-500/50 light:border-purple-300 text-purple-300 dark:text-purple-300 light:text-purple-700'
                    : 'bg-white/5 dark:bg-white/5 light:bg-white hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-gray-100 text-gray-300 dark:text-gray-300 light:text-gray-700 border border-white/10 dark:border-white/10 light:border-gray-200'
                }`}
              >
                {selectedTag === tag ? <FolderOpen size={16} /> : <Folder size={16} />}
                <span className="text-sm font-medium">{tag}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
            <Search className="absolute left-4 top-3.5 text-gray-400 dark:text-gray-400 light:text-gray-500 transition-colors duration-300" size={20} />
            <input 
                type="text"
                placeholder="Search by ID, Tagged By (profile name), or Format..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 dark:bg-white/5 light:bg-white border border-white/10 dark:border-white/10 light:border-gray-200 rounded-xl pl-12 pr-4 py-3 text-white dark:text-white light:text-gray-900 placeholder-gray-500 dark:placeholder-gray-500 light:placeholder-gray-400 focus:outline-none focus:border-purple-500 dark:focus:border-purple-500 light:focus:border-purple-600 transition-colors duration-300 shadow-sm light:shadow"
            />
        </div>
      </div>

      {/* Image Grid */}
      {filteredImages.length === 0 && !loading ? (
        <div className="text-center py-12">
          <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 transition-colors duration-300">No images found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {filteredImages.map((img) => (
              <motion.div 
                 key={img.id}
                 layoutId={`admin-img-${img.id}`}
                 onClick={() => openEdit(img)}
                 className="aspect-square rounded-lg overflow-hidden relative group cursor-pointer border border-white/5 dark:border-white/5 light:border-gray-200 hover:border-purple-500/50 dark:hover:border-purple-500/50 light:hover:border-purple-400 transition-colors duration-300 shadow-sm light:shadow"
              >
                 <img 
                   src={img.imageUrl} 
                   alt={img.id} 
                   className="w-full h-full object-cover"
                   onError={(e) => {
                     (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x300?text=Image+Not+Found';
                   }}
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 dark:from-black/80 light:from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                     <span className="text-xs text-white dark:text-white light:text-white font-bold transition-colors duration-300">{img.tagged_by || 'Untagged'}</span>
                 </div>
                 {/* Status Indicator - Green for tagged, Orange for untagged */}
                 <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                   img.tagged_by 
                     ? 'bg-green-500 shadow-[0_0_5px_#22c55e]' 
                     : 'bg-orange-500 shadow-[0_0_5px_#f97316]'
                 }`} />
              </motion.div>
          ))}
        </div>
      )}

      {/* CRUD Modal */}
      <AnimatePresence>
        {selectedImage && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] bg-black/90 dark:bg-black/90 light:bg-black/70 backdrop-blur-lg flex items-center justify-center p-4 transition-colors duration-300"
            >
                <GlassCard className="w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] !p-0 border-purple-500/30 dark:border-purple-500/30 light:border-purple-500/40">
                    <div className="relative h-64 bg-black/50 dark:bg-black/50 light:bg-gray-100 transition-colors duration-300">
                        <img 
                          src={selectedImage.imageUrl} 
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=Image+Not+Found';
                          }}
                        />
                        <button onClick={() => setSelectedImage(null)} className="absolute top-4 right-4 p-2 bg-black/50 dark:bg-black/50 light:bg-white/80 rounded-full text-white dark:text-white light:text-gray-900 transition-colors duration-300 shadow-sm light:shadow">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-white dark:text-white light:text-gray-900 transition-colors duration-300">Image Details</h2>
                                <p className="text-xs text-purple-300 dark:text-purple-300 light:text-purple-600 font-mono mt-1 transition-colors duration-300">ID: {selectedImage.id}</p>
                            </div>
                            <span className="bg-white/10 dark:bg-white/10 light:bg-gray-100 px-2 py-1 rounded text-xs text-gray-300 dark:text-gray-300 light:text-gray-700 transition-colors duration-300">
                                {formatDate(selectedImage.uploadedAt || selectedImage.datetime)}
                            </span>
                        </div>

                        {/* Metadata Display */}
                        <div className="space-y-3 mb-6 text-sm">
                            {selectedImage.format && (
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Format:</span>
                                    <span className="text-white">{selectedImage.format}</span>
                                </div>
                            )}
                            {selectedImage.width && selectedImage.height && (
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Resolution:</span>
                                    <span className="text-white">{selectedImage.width} × {selectedImage.height}</span>
                                </div>
                            )}
                            {selectedImage.file_size && (
                                <div className="flex justify-between">
                                    <span className="text-gray-400">File Size:</span>
                                    <span className="text-white">{formatFileSize(selectedImage.file_size)}</span>
                                </div>
                            )}
                            {(selectedImage.latitude && selectedImage.longitude) && !editMode && (
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Location:</span>
                                    <span className="text-white">
                                        {locationDisplay || `${selectedImage.latitude.toFixed(4)}, ${selectedImage.longitude.toFixed(4)}`}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Edit Form */}
                        {editMode && (
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Date/Time</label>
                                    <input 
                                        type="datetime-local"
                                        value={editData.datetime ? (() => {
                                            try {
                                                const date = new Date(editData.datetime);
                                                if (isNaN(date.getTime())) return '';
                                                return date.toISOString().slice(0, 16);
                                            } catch {
                                                return '';
                                            }
                                        })() : ''}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setEditData({...editData, datetime: value ? new Date(value).toISOString() : ''});
                                        }}
                                        className="w-full mt-1 bg-white/10 border border-purple-500/50 rounded p-2 text-white outline-none"
                                    />
                                </div>
                                
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Location</label>
                                    <div className="mt-1 space-y-2">
                                        {locationDisplay || (editData.latitude && editData.longitude) ? (
                                            <div className="flex items-center gap-2 text-white text-sm p-2 bg-white/5 rounded border border-transparent">
                                                <MapPin size={14} />
                                                <span>{locationDisplay || 'Location set'}</span>
                                            </div>
                                        ) : (
                                            <div className="text-xs text-gray-400 p-2 bg-white/5 rounded border border-transparent">No location set</div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setShowLocationPicker(!showLocationPicker)}
                                            className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg transition-colors text-sm"
                                        >
                                            <MapPin size={14} />
                                            {showLocationPicker ? 'Hide Location Picker' : (editData.latitude && editData.longitude ? 'Change Location' : 'Add Location')}
                                        </button>
                                        {showLocationPicker && (
                                            <div className="space-y-2">
                                                <input
                                                    type="text"
                                                    value={locationSearch}
                                                    onChange={(e) => setLocationSearch(e.target.value)}
                                                    placeholder="Search for city, state, country..."
                                                    className="w-full bg-white/10 border border-purple-500/50 rounded p-2 text-white outline-none text-sm"
                                                />
                                                {loadingLocation && (
                                                    <div className="text-xs text-gray-400 text-center py-2">Searching...</div>
                                                )}
                                                {locationResults.length > 0 && (
                                                    <div className="max-h-40 overflow-y-auto bg-white/5 rounded border border-white/10">
                                                        {locationResults.map((loc, idx) => (
                                                            <button
                                                                key={idx}
                                                                type="button"
                                                                onClick={() => handleLocationSelect(loc)}
                                                                className="w-full text-left px-3 py-2 hover:bg-white/10 text-white text-sm border-b border-white/5 last:border-0"
                                                            >
                                                                <div className="font-medium">{loc.display_name}</div>
                                                                {loc.address && (
                                                                    <div className="text-xs text-gray-400 mt-1">
                                                                        {[
                                                                            loc.address.city || loc.address.town || loc.address.village,
                                                                            loc.address.state || loc.address.province,
                                                                            loc.address.country_code?.toUpperCase()
                                                                        ].filter(Boolean).join(', ')}
                                                                    </div>
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Tag</label>
                                    <select
                                        value={editData.tagged_by || ''}
                                        onChange={(e) => setEditData({...editData, tagged_by: e.target.value || undefined})}
                                        className="w-full mt-1 bg-white/10 border border-purple-500/50 rounded p-2 text-white outline-none"
                                    >
                                        <option value="">Untagged</option>
                                        {tags.map((tag) => (
                                            <option key={tag} value={tag}>{tag}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                            {editMode ? (
                                <GradientButton onClick={handleSave} className="!py-2 !from-green-500 !to-emerald-600">
                                    <Save size={16} /> Save Changes
                                </GradientButton>
                            ) : (
                                <button 
                                    onClick={() => setEditMode(true)}
                                    className="flex items-center justify-center gap-2 bg-white/10 dark:bg-white/10 light:bg-gray-100 hover:bg-white/20 dark:hover:bg-white/20 light:hover:bg-gray-200 text-white dark:text-white light:text-gray-900 py-2 rounded-xl transition-colors duration-300"
                                >
                                    <Edit2 size={16} /> Edit Data
                                </button>
                            )}

                            <button 
                                onClick={() => handleDeleteClick(selectedImage)}
                                className="flex items-center justify-center gap-2 bg-red-500/10 dark:bg-red-500/10 light:bg-red-100 hover:bg-red-500/20 dark:hover:bg-red-500/20 light:hover:bg-red-200 text-red-400 dark:text-red-400 light:text-red-700 hover:text-red-300 dark:hover:text-red-300 light:hover:text-red-800 border border-red-500/20 dark:border-red-500/20 light:border-red-300 py-2 rounded-xl transition-colors duration-300"
                            >
                                <Trash2 size={16} /> Delete
                            </button>
                        </div>
                    </div>
                </GlassCard>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && imageToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/90 dark:bg-black/90 light:bg-black/70 backdrop-blur-lg flex items-center justify-center p-4 transition-colors duration-300"
            onClick={handleDeleteCancel}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel border border-red-500/30 dark:border-red-500/30 light:border-red-300/50 p-6 rounded-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-500/20 dark:bg-red-500/20 light:bg-red-100 rounded-lg transition-colors duration-300">
                  <Trash2 size={24} className="text-red-400 dark:text-red-400 light:text-red-600 transition-colors duration-300" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white dark:text-white light:text-gray-900 transition-colors duration-300">Delete Image</h3>
                  <p className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-600 transition-colors duration-300">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-gray-300 dark:text-gray-300 light:text-gray-700 mb-6 transition-colors duration-300">
                Are you sure you want to permanently delete this image from the database?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 px-4 py-2 bg-white/10 dark:bg-white/10 light:bg-gray-100 hover:bg-white/20 dark:hover:bg-white/20 light:hover:bg-gray-200 text-white dark:text-white light:text-gray-900 rounded-xl transition-colors duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-4 py-2 bg-red-500/20 dark:bg-red-500/20 light:bg-red-100 hover:bg-red-500/30 dark:hover:bg-red-500/30 light:hover:bg-red-200 text-red-400 dark:text-red-400 light:text-red-700 border border-red-500/30 dark:border-red-500/30 light:border-red-300 rounded-xl transition-colors duration-300"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AllImages;