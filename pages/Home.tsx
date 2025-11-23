import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Upload, UserCircle, Sparkles, Shield } from 'lucide-react';
import { GlassCard, GradientButton } from '../components/UIComponents';
import Logo from '../components/Logo';
import ProfileDropdown from '../components/ProfileDropdown';
import { APP_TEXT_GRADIENT } from '../constants';

interface HomeProps {
  onCameraOpen: () => void;
  onUpload: () => void;
  onProfile: () => void;
  onUseProfileImage?: (imageUrl: string) => void;
  hasProfileImage?: boolean;
  profileImageUrl?: string | null;
  isAdmin?: boolean;
  userName?: string;
  onThemeToggle?: () => void;
  onLogout?: () => void;
  isDarkTheme?: boolean;
}

const Home: React.FC<HomeProps> = ({ 
  onCameraOpen, 
  onUpload, 
  onProfile, 
  onUseProfileImage, 
  hasProfileImage, 
  profileImageUrl, 
  isAdmin, 
  userName,
  onThemeToggle,
  onLogout,
  isDarkTheme = true
}) => {
  return (
    <div className={`min-h-screen relative overflow-hidden pb-32 transition-colors duration-300 ${isDarkTheme ? 'bg-brand-dark dark:bg-brand-dark' : 'bg-white light:bg-white'}`}>
      
      {/* Profile Dropdown - Top Right */}
      <div className="absolute top-4 right-4 z-10">
        <div className="relative">
          {/* Animated Rings - Color changes based on Role */}
          <div className={`absolute -inset-2 rounded-full border transition-colors duration-300 ${isAdmin ? 'border-purple-500/40 dark:border-purple-500/40 light:border-purple-500/60' : 'border-brand-primary/30 dark:border-brand-primary/30 light:border-brand-primary/50'} animate-spin-slow`} />
          <div className={`absolute -inset-0.5 rounded-full border-2 border-transparent transition-colors duration-300 ${isAdmin ? 'border-t-purple-400 dark:border-t-purple-400 light:border-t-purple-600' : 'border-t-brand-secondary dark:border-t-brand-secondary light:border-t-brand-secondary/80'} animate-spin`} style={{ animationDuration: '3s' }} />
          
          <ProfileDropdown
            profileImageUrl={profileImageUrl}
            userName={userName}
            isAdmin={isAdmin}
            onProfileClick={onProfile}
            onThemeToggle={onThemeToggle || (() => {})}
            onLogout={onLogout || (() => {})}
            isDarkTheme={isDarkTheme}
          />
          
          {isAdmin && (
            <div className="absolute -top-1 -right-1 bg-purple-600 dark:bg-purple-600 light:bg-purple-500 text-white p-1 rounded-full border-2 border-brand-dark dark:border-brand-dark light:border-white z-10 shadow-[0_0_8px_#9333ea] dark:shadow-[0_0_8px_#9333ea] light:shadow-[0_0_8px_#9333ea]/60 transition-all duration-300">
              <Shield size={10} fill="currentColor" />
            </div>
          )}
        </div>
      </div>
      
      {/* Animated Background Mesh */}
      <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-brand-primary/20 dark:from-brand-primary/20 light:from-brand-primary/10 to-transparent -z-10 transition-all duration-300" />
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-secondary/20 dark:bg-brand-secondary/20 light:bg-brand-secondary/10 rounded-full blur-3xl animate-pulse transition-all duration-300" />
      <div className="absolute top-40 -left-20 w-64 h-64 bg-brand-primary/20 dark:bg-brand-primary/20 light:bg-brand-primary/10 rounded-full blur-3xl animate-pulse delay-1000 transition-all duration-300" />

      {/* Header / Hero */}
      <div className="pt-12 px-6 flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Logo size="sm" />
        </motion.div>
        
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-display font-bold mt-6 mb-2 text-white dark:text-white light:text-gray-900 transition-colors duration-300"
        >
          Find Your <br />
          <span className={APP_TEXT_GRADIENT}>Digital Twin</span>
        </motion.h1>
        
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-400 dark:text-gray-400 light:text-gray-600 max-w-xs transition-colors duration-300"
        >
          Scan faces, analyze biometrics, and discover connections with AI.
        </motion.p>
      </div>

      {/* Actions Grid */}
      <div className="mt-12 px-4 flex flex-col gap-4">
        
        {/* Main Feature: Camera */}
        <GlassCard onClick={onCameraOpen} className="relative group overflow-hidden min-h-[140px] flex flex-col justify-center items-center border-brand-primary/30 dark:border-brand-primary/30 light:border-brand-primary/40 transition-all duration-300">
          <div className="absolute inset-0 bg-brand-primary/10 dark:bg-brand-primary/10 light:bg-brand-primary/5 group-hover:bg-brand-primary/20 dark:group-hover:bg-brand-primary/20 light:group-hover:bg-brand-primary/10 transition-colors duration-300" />
          <div className="absolute inset-0 flex items-center justify-center opacity-10 dark:opacity-10 light:opacity-5 transition-opacity duration-300">
             {/* Abstract Scan Lines */}
             <div className="w-full h-1 bg-white dark:bg-white light:bg-gray-800 animate-scan transition-colors duration-300" />
          </div>
          
          <motion.div 
            className="bg-brand-primary/20 dark:bg-brand-primary/20 light:bg-brand-primary/10 p-4 rounded-full mb-3 shadow-[0_0_15px_rgba(124,92,255,0.4)] dark:shadow-[0_0_15px_rgba(124,92,255,0.4)] light:shadow-[0_0_15px_rgba(124,92,255,0.3)] transition-all duration-300"
            whileHover={{ rotate: 90 }}
          >
            <Camera size={32} className="text-white dark:text-white light:text-gray-800 transition-colors duration-300" />
          </motion.div>
          <h3 className="text-lg font-bold z-10 text-white dark:text-white light:text-gray-900 transition-colors duration-300">Open Scanner</h3>
          <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 z-10 transition-colors duration-300">Real-time detection</p>
        </GlassCard>

        <div className="grid grid-cols-2 gap-4">
          {/* Secondary: Upload */}
          <GlassCard onClick={onUpload} className="flex flex-col items-center justify-center min-h-[120px] hover:border-brand-secondary/50 dark:hover:border-brand-secondary/50 light:hover:border-brand-secondary/60 transition-all duration-300">
            <div className="bg-brand-secondary/10 dark:bg-brand-secondary/10 light:bg-brand-secondary/5 p-3 rounded-full mb-2 text-brand-secondary dark:text-brand-secondary light:text-brand-secondary/80 transition-all duration-300">
              <Upload size={24} />
            </div>
            <span className="font-medium text-sm text-white dark:text-white light:text-gray-900 transition-colors duration-300">Upload Photo</span>
          </GlassCard>

          {/* Secondary: Profile */}
          <GlassCard 
            onClick={() => {
              if (hasProfileImage && onUseProfileImage && profileImageUrl) {
                onUseProfileImage(profileImageUrl);
              } else {
                onProfile();
              }
            }} 
            className={`flex flex-col items-center justify-center min-h-[120px] transition-all duration-300 ${hasProfileImage && onUseProfileImage ? 'hover:border-purple-500/50 dark:hover:border-purple-500/50 light:hover:border-purple-500/60 cursor-pointer' : 'hover:border-purple-500/50 dark:hover:border-purple-500/50 light:hover:border-purple-500/60'}`}
            title={hasProfileImage && onUseProfileImage ? "Use your profile image for AI scanning" : "View profile"}
          >
            <div className="bg-purple-500/10 dark:bg-purple-500/10 light:bg-purple-500/5 p-3 rounded-full mb-2 text-purple-400 dark:text-purple-400 light:text-purple-600 transition-all duration-300">
              {/* <UserCircle size={24} /> */}
              {hasProfileImage && onUseProfileImage && profileImageUrl ? (<img src={profileImageUrl} alt="Profile" className="p-0 w-12 h-12 rounded-full" />) : (<UserCircle size={24} />)}
            </div>
            <span className="font-medium text-sm text-white dark:text-white light:text-gray-900 transition-colors duration-300">{hasProfileImage && onUseProfileImage ? "Use Profile" : "Profile"}</span>
          </GlassCard>
        </div>

        {/* Promo / Fun */}
        <div className="mt-2 p-4 rounded-xl bg-gradient-to-r from-pink-500/10 dark:from-pink-500/10 light:from-pink-500/5 to-purple-500/10 dark:to-purple-500/10 light:to-purple-500/5 border border-pink-500/20 dark:border-pink-500/20 light:border-pink-500/30 flex items-center gap-4 transition-all duration-300">
            <div className="p-2 bg-pink-500/20 dark:bg-pink-500/20 light:bg-pink-500/10 rounded-lg text-pink-300 dark:text-pink-300 light:text-pink-600 transition-all duration-300">
                <Sparkles size={20} />
            </div>
            <div>
                <h4 className="font-bold text-sm text-pink-200 dark:text-pink-200 light:text-pink-600 transition-colors duration-300">Pro Feature</h4>
                <p className="text-xs text-pink-200/60 dark:text-pink-200/60 light:text-pink-600/80 transition-colors duration-300">Unlock detailed biometric reports.</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Home;