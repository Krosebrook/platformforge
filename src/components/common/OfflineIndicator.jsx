/**
 * Offline Indicator Component
 * Displays a banner when the user is offline
 * Automatically detects online/offline status changes
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi } from 'lucide-react';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    /**
     * Handle online event
     * Shows a brief "reconnected" message
     */
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      
      // Hide reconnected message after 3 seconds
      setTimeout(() => setShowReconnected(false), 3000);
    };

    /**
     * Handle offline event
     * Shows persistent offline indicator
     */
    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {(!isOnline || showReconnected) && (
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          exit={{ y: -100 }}
          className={`fixed top-0 left-0 right-0 z-50 ${
            isOnline 
              ? 'bg-green-600' 
              : 'bg-yellow-600'
          } text-white py-2 px-4 text-center text-sm font-medium`}
        >
          <div className="flex items-center justify-center gap-2">
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4" />
                Back online - Your changes will sync automatically
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                You're offline - Some features may be limited
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}