import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './BackgroundSlider.css';

const BackgroundSlider = ({ images = [], interval = 5000, blur = true }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length === 0) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [images.length, interval]);

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="background-slider">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          className="background-slide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
          style={{
            backgroundImage: `url(${images[currentIndex]})`,
            filter: blur ? 'blur(8px)' : 'none',
          }}
        />
      </AnimatePresence>
    </div>
  );
};

export default BackgroundSlider;

