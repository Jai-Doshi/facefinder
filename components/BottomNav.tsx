import React from 'react';
import { Home, Image as ImageIcon, User, LayoutDashboard, Database } from 'lucide-react';
import { Tab, UserRole } from '../types';
import { motion } from 'framer-motion';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  role: UserRole;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, role }) => {
  
  const userItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'gallery', icon: ImageIcon, label: 'Gallery' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  const adminItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'all-images', icon: Database, label: 'All Data' },
    { id: 'gallery', icon: ImageIcon, label: 'My Gallery' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  const navItems = role === 'admin' ? adminItems : userItems;

  return (
    <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 px-4 pointer-events-none">
      <div className={`glass-panel-strong rounded-full px-2 py-2 flex items-center gap-1 pointer-events-auto shadow-2xl dark:shadow-black/50 light:shadow-gray-300/30 ${role === 'admin' ? 'border-purple-500/30 dark:bg-purple-900/40 light:bg-purple-100/60' : ''}`}>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id as Tab)}
              className="relative px-4 py-3 rounded-full flex flex-col items-center justify-center min-w-[70px]"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className={`absolute inset-0 rounded-full border ${role === 'admin' ? 'bg-purple-500/20 border-purple-500/30 dark:bg-purple-500/20 light:bg-purple-200/40' : 'bg-white/10 border-white/10 dark:bg-white/10 light:bg-gray-200/50'}`}
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              
              <Icon 
                className={`w-5 h-5 z-10 transition-colors duration-300 ${isActive ? (role === 'admin' ? 'text-purple-300 dark:text-purple-300 light:text-purple-600 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]' : 'text-brand-secondary drop-shadow-[0_0_8px_rgba(50,210,240,0.8)]') : 'text-gray-400 dark:text-gray-400 light:text-gray-600'}`} 
              />
              {isActive && (
                <motion.div
                  className={`absolute -bottom-1 w-1 h-1 rounded-full ${role === 'admin' ? 'bg-purple-400' : 'bg-brand-secondary'}`}
                  layoutId="nav-dot"
                />
              )}
              <span className={`text-[10px] mt-1 z-10 font-medium ${isActive ? 'text-white dark:text-white light:text-gray-900' : 'text-gray-500 dark:text-gray-500 light:text-gray-600'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;