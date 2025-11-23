import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Power, RefreshCw } from 'lucide-react';

// Use the same URL logic as your apiService
const API_URL = import.meta.env.VITE_API_URL || 'https://jai14-facefinder.hf.space';

export const ServerStatus: React.FC = () => {
  const [status, setStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [latency, setLatency] = useState<number | null>(null);

  const checkHealth = async () => {
    setStatus('checking');
    const start = Date.now();
    try {
      // Set a strict timeout (5s) so we don't wait forever
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${API_URL}/api/health`, { 
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        setLatency(Date.now() - start);
        setStatus('online');
      } else {
        setStatus('offline');
      }
    } catch (error) {
      console.error("Server check failed:", error);
      setStatus('offline');
    }
  };

  // Check on mount and every 30 seconds
  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // Color mapping
  const getStatusColor = () => {
    switch (status) {
      case 'online': return 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]';
      case 'offline': return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]';
      case 'checking': return 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'online': return `Online (${latency}ms)`;
      case 'offline': return 'Server Sleeping / Offline';
      case 'checking': return 'Pinging Server...';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-2 rounded-full bg-black/80 border border-white/10 backdrop-blur-md"
    >
      {/* Status Dot */}
      <div className={`w-3 h-3 rounded-full transition-colors duration-500 ${getStatusColor()}`} />
      
      {/* Status Text */}
      <span className="text-xs font-medium text-gray-300">
        {getStatusText()}
      </span>

      {/* Refresh Button (Only show if offline/checking) */}
      {status !== 'online' && (
        <button 
          onClick={checkHealth}
          className="ml-2 p-1 hover:bg-white/10 rounded-full transition-colors"
          title="Wake up server"
        >
          <RefreshCw size={14} className={`text-white ${status === 'checking' ? 'animate-spin' : ''}`} />
        </button>
      )}
    </motion.div>
  );
};

export default ServerStatus;
