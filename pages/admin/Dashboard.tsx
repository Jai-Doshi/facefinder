import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Users, Upload, Activity, AlertTriangle, X, CheckCircle, Image as ImageIcon, Scan } from 'lucide-react';
import { GlassCard, GradientButton } from '../../components/UIComponents';
import { ADMIN_TEXT_GRADIENT } from '../../constants';
import { uploadImages, getAdminStats, AdminStats } from '../../services/apiService';
import { showToast } from '../../components/Toast';
import { Shimmer } from '../../components/Shimmer';

interface AdminDashboardProps {
  onUpload: () => void;
  onUploadComplete?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onUpload, onUploadComplete }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ processed: 0, failed: 0, total: 0 });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [stats, setStats] = useState<AdminStats>({
    total_images: 0,
    total_users: 0,
    successful_scans: 0,
    pending_reviews: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const data = await getAdminStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
      showToast('Failed to load dashboard statistics', 'error');
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleBulkUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = async (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length === 0) return;

      setIsUploading(true);
      setShowUploadModal(true);
      setUploadProgress({ processed: 0, failed: 0, total: files.length });

      try {
        const result = await uploadImages(files);
        setUploadProgress({
          processed: result.processed,
          failed: result.failed,
          total: files.length,
        });

        if (result.processed > 0) {
          showToast(`Successfully processed ${result.processed} image(s)`, 'success');
        }
        if (result.failed > 0) {
          showToast(`${result.failed} image(s) failed to process`, 'error');
        }

        // Refresh images list if callback provided
        if (onUploadComplete) {
          setTimeout(() => {
            onUploadComplete();
          }, 2000);
        }

        // Refresh stats after upload
        fetchStats();
      } catch (error: any) {
        showToast(error.message || 'Failed to upload images', 'error');
      } finally {
        setTimeout(() => {
          setIsUploading(false);
          setShowUploadModal(false);
          setUploadProgress({ processed: 0, failed: 0, total: 0 });
        }, 3000);
      }
    };
    input.click();
  };
  return (
    <div className="pt-20 pb-32 px-4 min-h-screen bg-brand-dark dark:bg-brand-dark light:bg-gray-50 relative overflow-hidden transition-colors duration-300">
      {/* Ambient Admin Background */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-900/20 dark:bg-purple-900/20 light:bg-purple-100/30 rounded-full blur-[100px] -z-10 pointer-events-none transition-colors duration-300" />
      
      <div className="mb-8 flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-display font-bold text-white dark:text-white light:text-gray-900 transition-colors duration-300">Admin Console</h1>
            <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-sm flex items-center gap-2 transition-colors duration-300">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/> System Operational
            </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-white/5 dark:bg-white/5 light:bg-white shadow-sm flex items-center justify-center border border-white/10 dark:border-white/10 light:border-gray-200 transition-all duration-300">
            <Activity size={20} className="text-purple-400 dark:text-purple-400 light:text-purple-600 transition-colors duration-300" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <GlassCard className="p-4 relative overflow-hidden border-purple-500/20 dark:border-purple-500/20 light:border-purple-500/30">
          <div className="absolute top-0 right-0 p-2 opacity-20 dark:opacity-20 light:opacity-15">
            <ImageIcon size={40} className="text-green-400 dark:text-green-400 light:text-green-600" />
          </div>
          <h3 className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-xs uppercase tracking-wider mb-1">Total Images</h3>
          <div className="flex items-end gap-2">
            {isLoadingStats ? (
              <Shimmer height="2rem" width="4rem" rounded="lg" />
            ) : (
              <span className="text-2xl font-display font-bold text-green-400 dark:text-green-400 light:text-green-600">
                {stats.total_images.toLocaleString()}
              </span>
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-4 relative overflow-hidden border-purple-500/20 dark:border-purple-500/20 light:border-purple-500/30">
          <div className="absolute top-0 right-0 p-2 opacity-10 dark:opacity-10 light:opacity-5">
            <Users size={40} />
          </div>
          <h3 className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-xs uppercase tracking-wider mb-1">Total Users</h3>
          <div className="flex items-end gap-2">
            {isLoadingStats ? (
              <Shimmer height="2rem" width="4rem" rounded="lg" />
            ) : (
              <span className="text-2xl font-display font-bold text-white dark:text-white light:text-gray-900">
                {stats.total_users.toLocaleString()}
              </span>
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-4 relative overflow-hidden border-purple-500/20 dark:border-purple-500/20 light:border-purple-500/30">
          <div className="absolute top-0 right-0 p-2 opacity-10 dark:opacity-10 light:opacity-5">
            <Scan size={40} />
          </div>
          <h3 className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-xs uppercase tracking-wider mb-1">Successful Scans</h3>
          <div className="flex items-end gap-2">
            {isLoadingStats ? (
              <Shimmer height="2rem" width="4rem" rounded="lg" />
            ) : (
              <span className="text-2xl font-display font-bold text-white dark:text-white light:text-gray-900">
                {stats.successful_scans.toLocaleString()}
              </span>
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-4 relative overflow-hidden border-purple-500/20 dark:border-purple-500/20 light:border-purple-500/30">
          <div className="absolute top-0 right-0 p-2 opacity-20 dark:opacity-20 light:opacity-15">
            <AlertTriangle size={40} className="text-yellow-400 dark:text-yellow-400 light:text-yellow-600" />
          </div>
          <h3 className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-xs uppercase tracking-wider mb-1">Pending Reviews</h3>
          <div className="flex items-end gap-2">
            {isLoadingStats ? (
              <Shimmer height="2rem" width="4rem" rounded="lg" />
            ) : (
              <span className="text-2xl font-display font-bold text-yellow-400 dark:text-yellow-400 light:text-yellow-600">
                {stats.pending_reviews.toLocaleString()}
              </span>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Main Visualization (Mock Chart) */}
      <GlassCard className="p-6 mb-8 border-purple-500/20 dark:border-purple-500/20 light:border-purple-500/30 transition-colors duration-300">
        <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-white dark:text-white light:text-gray-900 transition-colors duration-300">Upload Traffic</h3>
            <select className="bg-white/5 dark:bg-white/5 light:bg-white border border-white/10 dark:border-white/10 light:border-gray-200 rounded-lg text-xs px-2 py-1 text-gray-300 dark:text-gray-300 light:text-gray-700 outline-none transition-all duration-300">
                <option>Last 24h</option>
                <option>7 Days</option>
            </select>
        </div>
        
        <div className="h-40 flex items-end justify-between gap-2 px-2">
             {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 95].map((h, i) => (
                 <motion.div 
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: i * 0.05, duration: 0.5 }}
                    className="w-full bg-gradient-to-t from-purple-900/50 dark:from-purple-900/50 light:from-purple-200 to-purple-500 dark:to-purple-500 light:to-purple-400 rounded-t-sm relative group transition-colors duration-300"
                 >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 dark:bg-black/80 light:bg-gray-800 text-white dark:text-white light:text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {h * 12}
                    </div>
                 </motion.div>
             ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500 light:text-gray-400 mt-2 font-mono transition-colors duration-300">
            <span>00:00</span>
            <span>12:00</span>
            <span>23:59</span>
        </div>
      </GlassCard>

      {/* Quick Actions */}
      <h3 className="text-white dark:text-white light:text-gray-900 font-bold mb-4 transition-colors duration-300">Quick Actions</h3>
      <div className="flex gap-4">
         <GradientButton onClick={handleBulkUpload} className="flex-1 !from-purple-600 !to-indigo-600 shadow-[0_0_20px_rgba(124,58,237,0.4)] dark:shadow-[0_0_20px_rgba(124,58,237,0.4)] light:shadow-[0_0_20px_rgba(124,58,237,0.3)]">
            <Upload size={18} /> Bulk Upload
         </GradientButton>
         <button className="flex-1 bg-white/5 dark:bg-white/5 light:bg-white border border-white/10 dark:border-white/10 light:border-gray-200 rounded-xl flex items-center justify-center gap-2 text-white dark:text-white light:text-gray-900 font-semibold hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-gray-50 transition-all duration-300 shadow-sm light:shadow">
            <AlertTriangle size={18} className="text-yellow-500 dark:text-yellow-500 light:text-yellow-600" /> Review ({stats.pending_reviews})
         </button>
      </div>

      {/* Upload Processing Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/90 dark:bg-black/90 light:bg-black/70 backdrop-blur-lg flex items-center justify-center p-4 transition-colors duration-300"
          >
            <GlassCard className="max-w-md w-full p-6 border-purple-500/30 dark:border-purple-500/30 light:border-purple-500/40">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-bold text-white dark:text-white light:text-gray-900 transition-colors duration-300">Processing Images</h3>
                {!isUploading && (
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="text-white/60 dark:text-white/60 light:text-gray-600 hover:text-white dark:hover:text-white light:hover:text-gray-900 transition-colors duration-300"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>

              {isUploading ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <motion.div
                      className="w-16 h-16 rounded-full border-4 border-purple-500/30 dark:border-purple-500/30 light:border-purple-300 border-t-purple-500 dark:border-t-purple-500 light:border-t-purple-600 transition-colors duration-300"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, ease: "linear", repeat: Infinity }}
                    />
                  </div>
                  <p className="text-center text-gray-300 dark:text-gray-300 light:text-gray-700 transition-colors duration-300">Embedding processing...</p>
                  <p className="text-center text-sm text-gray-400 dark:text-gray-400 light:text-gray-600 transition-colors duration-300">
                    Processing {uploadProgress.total} image(s)
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <CheckCircle size={48} className="text-green-400 dark:text-green-400 light:text-green-600 transition-colors duration-300" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-white dark:text-white light:text-gray-900 font-semibold transition-colors duration-300">Upload Complete</p>
                    <div className="space-y-1 text-sm">
                      <p className="text-green-400 dark:text-green-400 light:text-green-600 transition-colors duration-300">✓ Processed: {uploadProgress.processed}</p>
                      {uploadProgress.failed > 0 && (
                        <p className="text-red-400 dark:text-red-400 light:text-red-600 transition-colors duration-300">✗ Failed: {uploadProgress.failed}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
