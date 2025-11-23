import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Moon, Sun, LogOut, ChevronDown } from 'lucide-react';
import { getUserInitials } from '../utils';

interface ProfileDropdownProps {
  profileImageUrl?: string | null;
  userName?: string;
  isAdmin?: boolean;
  onProfileClick: () => void;
  onThemeToggle: () => void;
  onLogout: () => void;
  isDarkTheme: boolean;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  profileImageUrl,
  userName,
  isAdmin,
  onProfileClick,
  onThemeToggle,
  onLogout,
  isDarkTheme,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-brand-surface dark:border-brand-surface light:border-gray-200 cursor-pointer hover:opacity-80 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 dark:focus:ring-brand-primary/50 light:focus:ring-brand-primary/70"
        title={userName || "Profile"}
      >
        {profileImageUrl ? (
          <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover transition-opacity duration-300" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand-primary to-brand-secondary dark:from-brand-primary dark:to-brand-secondary light:from-brand-primary/90 light:to-brand-secondary/80 flex items-center justify-center transition-all duration-300">
            <span className="text-white text-lg font-bold transition-colors duration-300">{getUserInitials(userName)}</span>
          </div>
        )}
        <div className="absolute inset-0 border-2 border-transparent rounded-full hover:border-brand-primary/50 dark:hover:border-brand-primary/50 light:hover:border-brand-primary/70 transition-colors duration-300" />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-16 mt-2 w-72 glass-panel-strong rounded-xl border border-white/10 dark:border-white/10 light:border-gray-200 shadow-2xl dark:shadow-2xl light:shadow-gray-300/30 z-50 overflow-hidden"
          >
            <div className="p-2">
              {/* Profile Option */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  onProfileClick();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-gray-100 transition-colors duration-300 text-left"
              >
                <div className="p-2 bg-brand-primary/20 dark:bg-brand-primary/20 light:bg-brand-primary/10 rounded-lg transition-colors duration-300">
                  <User size={18} className="text-brand-primary dark:text-brand-primary light:text-brand-primary/90 transition-colors duration-300" />
                </div>
                <div className="flex-1">
                  <div className="text-white dark:text-white light:text-gray-900 font-medium text-sm transition-colors duration-300">Profile</div>
                  <div className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-xs transition-colors duration-300">View your profile</div>
                </div>
              </button>

              {/* Theme Toggle */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  onThemeToggle();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-gray-100 transition-colors duration-300 text-left"
              >
                <div className="p-2 bg-purple-500/20 dark:bg-purple-500/20 light:bg-purple-500/10 rounded-lg transition-colors duration-300">
                  {isDarkTheme ? (
                    <Sun size={18} className="text-yellow-400 dark:text-yellow-400 light:text-yellow-500 transition-colors duration-300" />
                  ) : (
                    <Moon size={18} className="text-blue-400 dark:text-blue-400 light:text-blue-500 transition-colors duration-300" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-white dark:text-white light:text-gray-900 font-medium text-sm transition-colors duration-300">
                    {isDarkTheme ? 'Light Theme' : 'Dark Theme'}
                  </div>
                  <div className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-xs transition-colors duration-300">
                    Switch to {isDarkTheme ? 'light' : 'dark'} mode
                  </div>
                </div>
              </button>

              {/* Divider */}
              <div className="my-2 h-px bg-white/10 dark:bg-white/10 light:bg-gray-200 transition-colors duration-300" />

              {/* Logout Option */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-500/20 dark:hover:bg-red-500/20 light:hover:bg-red-100 transition-colors duration-300 text-left"
              >
                <div className="p-2 bg-red-500/20 dark:bg-red-500/20 light:bg-red-500/10 rounded-lg transition-colors duration-300">
                  <LogOut size={18} className="text-red-400 dark:text-red-400 light:text-red-600 transition-colors duration-300" />
                </div>
                <div className="flex-1">
                  <div className="text-red-400 dark:text-red-400 light:text-red-600 font-medium text-sm transition-colors duration-300">Logout</div>
                  <div className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-xs transition-colors duration-300">Sign out of your account</div>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileDropdown;

