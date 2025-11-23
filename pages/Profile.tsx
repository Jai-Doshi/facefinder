import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { GradientButton } from '../components/UIComponents';
import { Settings, Shield, Edit2, ToggleLeft, ToggleRight, Lock, Sun, Moon } from 'lucide-react';
import { getProfile, updateProfileImage, getProfileImageUrl, getUserStats } from '../services/apiService';
import { GlassCard } from '../components/UIComponents';
import { UserProfile as APIUserProfile } from '../services/apiService';
import { Shimmer } from '../components/Shimmer';
import { getUserInitials } from '../utils';

interface ProfileProps {
  role?: UserRole;
  onToggleRole?: () => void;
  token?: string | null;
  onSignOut?: () => void;
  onUseProfileImageForScan?: (imageUrl: string) => void;
  onThemeToggle?: () => void;
  isDarkTheme?: boolean;
}

const Profile: React.FC<ProfileProps> = ({ role = 'user', onToggleRole, token, onSignOut, onUseProfileImageForScan, onThemeToggle, isDarkTheme = true }) => {
  const [userData, setUserData] = useState<APIUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ scan_count: 0, saved_count: 0 });

  // Load user profile on mount
  useEffect(() => {
    if (token) {
      loadProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const loadProfile = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Try to load profile and stats separately to handle errors better
      try {
        const profileResponse = await getProfile(token);
        setUserData(profileResponse.user);
      } catch (profileErr: any) {
        console.error('Profile load error:', profileErr);
        setError(profileErr.message || 'Failed to load profile. Please check your connection and try again.');
        // Don't return early, still try to load stats
      }
      
      try {
        const statsResponse = await getUserStats(token);
        setStats(statsResponse);
      } catch (statsErr: any) {
        console.error('Stats load error:', statsErr);
        // Stats error is not critical, use default values
        setStats({ scan_count: 0, saved_count: 0 });
      }
    } catch (err: any) {
      console.error('Unexpected error loading profile:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = userData?.is_admin || false;
  const profileImageUrl = userData?.profile_image ? getProfileImageUrl(userData.profile_image) : null;

  const handleImageEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && token) {
        try {
          setUpdating(true);
          setError('');
          const response = await updateProfileImage(token, file);
          setUserData(response.user);
        } catch (err: any) {
          setError(err.message || 'Failed to update profile image');
        } finally {
          setUpdating(false);
        }
      }
    };
    input.click();
  };

  const handleProfileImageClick = () => {
    if (profileImageUrl && onUseProfileImageForScan) {
      onUseProfileImageForScan(profileImageUrl);
    }
  };

  if (loading) {
    return (
      <div className={`pt-20 pb-32 px-4 min-h-screen transition-colors duration-300 ${isAdmin ? 'bg-gradient-to-b from-brand-dark dark:from-brand-dark light:from-white to-purple-950/30 dark:to-purple-950/30 light:to-purple-100/30' : 'bg-brand-dark dark:bg-brand-dark light:bg-white'}`}>
        <div className="mb-8">
          <Shimmer height="2rem" width="8rem" rounded="lg" className="mb-2" />
          <Shimmer height="1rem" width="12rem" rounded="lg" />
        </div>
        <div className="flex flex-col items-center mb-10">
          <Shimmer height="8rem" width="8rem" rounded="full" className="mb-4" />
          <Shimmer height="1.5rem" width="10rem" rounded="lg" className="mb-2" />
          <Shimmer height="1rem" width="8rem" rounded="lg" />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <GlassCard className="flex flex-col items-center justify-center gap-2 py-6">
            <Shimmer height="2rem" width="3rem" rounded="lg" />
            <Shimmer height="0.75rem" width="4rem" rounded="lg" />
          </GlassCard>
          <GlassCard className="flex flex-col items-center justify-center gap-2 py-6">
            <Shimmer height="2rem" width="3rem" rounded="lg" />
            <Shimmer height="0.75rem" width="4rem" rounded="lg" />
          </GlassCard>
        </div>
        <div className="space-y-6">
          <div className="space-y-2">
            <Shimmer height="0.875rem" width="6rem" rounded="sm" />
            <Shimmer height="3rem" width="100%" rounded="xl" />
          </div>
          <div className="space-y-2">
            <Shimmer height="0.875rem" width="6rem" rounded="sm" />
            <Shimmer height="3rem" width="100%" rounded="xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`pt-20 pb-32 px-4 min-h-screen transition-colors duration-300 ${isAdmin ? 'bg-gradient-to-b from-brand-dark dark:from-brand-dark light:from-white to-purple-950/30 dark:to-purple-950/30 light:to-purple-100/30' : 'bg-brand-dark dark:bg-brand-dark light:bg-white'}`}>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-display font-bold text-white dark:text-white light:text-gray-900 transition-colors duration-300">Profile</h1>
        <button className="p-2 rounded-full bg-white/5 dark:bg-white/5 light:bg-gray-100 hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-gray-200 transition-colors duration-300">
          <Settings size={24} className="text-gray-400 dark:text-gray-400 light:text-gray-600 transition-colors duration-300" />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 dark:bg-red-500/20 light:bg-red-100 border border-red-500/50 dark:border-red-500/50 light:border-red-300 rounded-lg text-red-300 dark:text-red-300 light:text-red-700 text-sm transition-colors duration-300">
          {error}
        </div>
      )}

      {/* Avatar Section */}
      <div className="flex flex-col items-center mb-10 relative">
        <div className="relative w-32 h-32">
          {/* Animated Rings - Color changes based on Role */}
          <div className={`absolute -inset-4 rounded-full border transition-colors duration-300 ${isAdmin ? 'border-purple-500/40 dark:border-purple-500/40 light:border-purple-500/60' : 'border-brand-primary/30 dark:border-brand-primary/30 light:border-brand-primary/50'} animate-spin-slow`} />
          <div className={`absolute -inset-1 rounded-full border-2 border-transparent transition-colors duration-300 ${isAdmin ? 'border-t-purple-400 dark:border-t-purple-400 light:border-t-purple-600' : 'border-t-brand-secondary dark:border-t-brand-secondary light:border-t-brand-secondary/80'} animate-spin`} style={{ animationDuration: '3s' }} />
          
          <div 
            className={`w-full h-full rounded-full overflow-hidden border-4 border-brand-surface dark:border-brand-surface light:border-gray-200 relative transition-all duration-300 ${profileImageUrl && onUseProfileImageForScan ? 'cursor-pointer hover:opacity-80' : ''}`}
            onClick={handleProfileImageClick}
            title={profileImageUrl && onUseProfileImageForScan ? "Click to use this image for scanning" : ""}
          >
            {profileImageUrl ? (
              <img src={profileImageUrl} alt="Avatar" className="w-full h-full object-cover transition-opacity duration-300" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center transition-all duration-300">
                <span className="text-white text-3xl font-bold transition-colors duration-300">{getUserInitials(userData?.name)}</span>
              </div>
            )}
            {updating && (
              <div className="absolute inset-0 bg-black/50 dark:bg-black/50 light:bg-black/30 flex items-center justify-center transition-colors duration-300">
                <div className="w-8 h-8 border-2 border-white dark:border-white light:border-gray-800 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          
          {isAdmin && (
            <div className="absolute -top-2 -right-2 bg-purple-600 dark:bg-purple-600 light:bg-purple-500 text-white p-1.5 rounded-full border-2 border-brand-dark dark:border-brand-dark light:border-white z-10 shadow-[0_0_10px_#9333ea] dark:shadow-[0_0_10px_#9333ea] light:shadow-[0_0_10px_#9333ea]/60 transition-all duration-300">
               <Shield size={14} fill="currentColor" />
            </div>
          )}
          
          <button 
            onClick={handleImageEdit}
            disabled={updating || !token}
            className={`absolute bottom-0 right-0 p-2 rounded-full shadow-lg border-2 border-brand-dark dark:border-brand-dark light:border-white transition-all duration-300 ${isAdmin ? 'bg-purple-600 dark:bg-purple-600 light:bg-purple-500' : 'bg-brand-primary dark:bg-brand-primary light:bg-brand-primary/90'} hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed z-10`}
          >
            <Edit2 size={14} className="text-white transition-colors duration-300" />
          </button>
        </div>
        
        <h2 className="mt-4 text-2xl font-bold text-white dark:text-white light:text-gray-900 flex items-center gap-2 transition-colors duration-300">
            {userData?.name || 'Loading...'}
        </h2>
        <p className={`transition-colors duration-300 ${isAdmin ? 'text-purple-300 dark:text-purple-300 light:text-purple-600 font-mono uppercase text-xs tracking-widest mt-1' : 'text-brand-secondary dark:text-brand-secondary light:text-brand-secondary/80 text-sm'}`}>
            {isAdmin ? 'Administrator' : 'Premium Member'}
        </p>
        {profileImageUrl && onUseProfileImageForScan && (
          <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 mt-2 text-center transition-colors duration-300">Click profile image to scan</p>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <GlassCard className={`flex flex-col items-center justify-center gap-2 py-6 transition-all duration-300 ${isAdmin ? 'border-purple-500/20 dark:border-purple-500/20 light:border-purple-500/30' : ''}`}>
          <span className={`text-2xl font-bold transition-colors duration-300 ${isAdmin ? 'text-purple-400 dark:text-purple-400 light:text-purple-600' : 'text-brand-primary dark:text-brand-primary light:text-brand-primary/90'}`}>{stats.scan_count}</span>
          <span className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 transition-colors duration-300">Scans</span>
        </GlassCard>
        <GlassCard className={`flex flex-col items-center justify-center gap-2 py-6 transition-all duration-300 ${isAdmin ? 'border-purple-500/20 dark:border-purple-500/20 light:border-purple-500/30' : ''}`}>
          <span className={`text-2xl font-bold transition-colors duration-300 ${isAdmin ? 'text-purple-400 dark:text-purple-400 light:text-purple-600' : 'text-brand-secondary dark:text-brand-secondary light:text-brand-secondary/80'}`}>{stats.saved_count}</span>
          <span className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 transition-colors duration-300">Saved</span>
        </GlassCard>
      </div>

      {/* Form */}
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-600 ml-1 transition-colors duration-300">Display Name</label>
          <input 
            type="text" 
            value={userData?.name || ''}
            disabled
            className={`w-full bg-white/5 dark:bg-white/5 light:bg-gray-50 border rounded-xl p-4 text-white/70 dark:text-white/70 light:text-gray-900 focus:outline-none transition-colors duration-300 ${isAdmin ? 'border-purple-500/20 dark:border-purple-500/20 light:border-purple-200' : 'border-white/10 dark:border-white/10 light:border-gray-200'}`}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-600 ml-1 transition-colors duration-300">Email Address</label>
          <input 
            type="email" 
            value={userData?.email || ''}
            disabled
            className={`w-full bg-white/5 dark:bg-white/5 light:bg-gray-50 border rounded-xl p-4 text-white/70 dark:text-white/70 light:text-gray-900 focus:outline-none transition-colors duration-300 ${isAdmin ? 'border-purple-500/20 dark:border-purple-500/20 light:border-purple-200' : 'border-white/10 dark:border-white/10 light:border-gray-200'}`}
          />
        </div>

        {token && onSignOut && (
          <GradientButton 
            fullWidth 
            className={`mt-8 ${isAdmin ? '!from-red-600 !to-red-700' : '!from-red-500 !to-red-600'}`}
            onClick={onSignOut}
          >
            Sign Out
          </GradientButton>
        )}

        {!token && (
          <div className="mt-8 p-4 bg-yellow-500/20 dark:bg-yellow-500/20 light:bg-yellow-100 border border-yellow-500/50 dark:border-yellow-500/50 light:border-yellow-300 rounded-lg text-yellow-300 dark:text-yellow-300 light:text-yellow-700 text-sm text-center transition-colors duration-300">
            Please sign in to edit your profile
          </div>
        )}

        {/* Admin Switcher - Only show if user is admin */}
        {isAdmin && onToggleRole && (
          <div className="mt-12 space-y-4">
            {/* Admin Mode Toggle Card */}
            <GlassCard className="border-purple-500/20 dark:border-purple-500/20 light:border-purple-200 transition-all duration-300">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/5 dark:bg-white/5 light:bg-purple-100 rounded-lg transition-colors duration-300">
                    <Lock size={18} className="text-gray-400 dark:text-gray-400 light:text-purple-600 transition-colors duration-300"/>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white dark:text-white light:text-gray-900 transition-colors duration-300">Admin Mode</h4>
                    <p className="text-[10px] text-gray-500 dark:text-gray-500 light:text-gray-600 transition-colors duration-300">Toggle admin interface</p>
                  </div>
                </div>
                <button onClick={onToggleRole} className="text-white dark:text-white light:text-gray-900 opacity-80 hover:opacity-100 transition-opacity duration-300">
                    {role === 'admin' ? <ToggleRight size={32} className="text-purple-500 dark:text-purple-500 light:text-purple-600 transition-colors duration-300" /> : <ToggleLeft size={32} className="text-gray-500 dark:text-gray-500 light:text-gray-400 transition-colors duration-300" />}
                </button>
              </div>
            </GlassCard>
            
            {/* Theme Toggle Card - Only for admins */}
            {onThemeToggle && (
              <GlassCard className="border-brand-primary/20 dark:border-brand-primary/20 light:border-brand-primary/30 transition-all duration-300">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-primary/20 dark:bg-brand-primary/20 light:bg-brand-primary/10 rounded-lg transition-colors duration-300">
                      {isDarkTheme ? (
                        <Sun size={18} className="text-yellow-400 dark:text-yellow-400 light:text-yellow-500 transition-colors duration-300" />
                      ) : (
                        <Moon size={18} className="text-blue-400 dark:text-blue-400 light:text-blue-500 transition-colors duration-300" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white dark:text-white light:text-gray-900 transition-colors duration-300">Theme</h4>
                      <p className="text-[10px] text-gray-500 dark:text-gray-500 light:text-gray-600 transition-colors duration-300">
                        {isDarkTheme ? 'Switch to light mode' : 'Switch to dark mode'}
                      </p>
                    </div>
                  </div>
                  <button onClick={onThemeToggle} className="text-white dark:text-white light:text-gray-900 opacity-80 hover:opacity-100 transition-opacity duration-300">
                      {isDarkTheme ? <ToggleLeft size={32} className="text-gray-500 dark:text-gray-500 light:text-gray-400 transition-colors duration-300" /> : <ToggleRight size={32} className="text-brand-primary dark:text-brand-primary light:text-brand-primary/90 transition-colors duration-300" />}
                  </button>
                </div>
              </GlassCard>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Profile;