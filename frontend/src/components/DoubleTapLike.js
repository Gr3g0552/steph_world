import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHeart } from 'react-icons/fa';
import './DoubleTapLike.css';

const DoubleTapLike = ({ onLike, children }) => {
  const [showHeart, setShowHeart] = useState(false);
  const lastTap = useRef(0);
  const timeoutRef = useRef(null);

  const handleDoubleTap = (e) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap.current;

    if (tapLength < 300 && tapLength > 0) {
      // Double tap detected
      e.preventDefault();
      setShowHeart(true);
      onLike();
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        setShowHeart(false);
      }, 1000);
    }

    lastTap.current = currentTime;
  };

  return (
    <div className="double-tap-container" onDoubleClick={handleDoubleTap}>
      {children}
      <AnimatePresence>
        {showHeart && (
          <motion.div
            className="double-tap-heart"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0] }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <FaHeart />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DoubleTapLike;
