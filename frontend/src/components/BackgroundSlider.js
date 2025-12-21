import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './BackgroundSlider.css';

const BackgroundSlider = ({ images = [], interval = 3000, blur = true, random = true }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length === 0) return;

    const timer = setInterval(() => {
      if (random && images.length > 1) {
        // Sélection aléatoire
        let newIndex;
        do {
          newIndex = Math.floor(Math.random() * images.length);
        } while (newIndex === currentIndex && images.length > 1);
        setCurrentIndex(newIndex);
      } else {
        // Sélection séquentielle
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [images.length, interval, random, currentIndex]);

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

