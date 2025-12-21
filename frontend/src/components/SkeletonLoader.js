import React from 'react';
import { motion } from 'framer-motion';
import './SkeletonLoader.css';

const SkeletonLoader = ({ type = 'post', count = 1 }) => {
  const skeletons = Array.from({ length: count }, (_, i) => i);

  if (type === 'post') {
    return (
      <>
        {skeletons.map((i) => (
          <motion.div
            key={i}
            className="skeleton-post"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="skeleton-header">
              <div className="skeleton-avatar"></div>
              <div className="skeleton-text skeleton-text-small"></div>
            </div>
            <div className="skeleton-media"></div>
            <div className="skeleton-content">
              <div className="skeleton-text"></div>
              <div className="skeleton-text skeleton-text-short"></div>
            </div>
            <div className="skeleton-actions">
              <div className="skeleton-button"></div>
              <div className="skeleton-button"></div>
            </div>
          </motion.div>
        ))}
      </>
    );
  }

  if (type === 'comment') {
    return (
      <>
        {skeletons.map((i) => (
          <div key={i} className="skeleton-comment">
            <div className="skeleton-avatar skeleton-avatar-small"></div>
            <div className="skeleton-comment-content">
              <div className="skeleton-text skeleton-text-small"></div>
              <div className="skeleton-text"></div>
            </div>
          </div>
        ))}
      </>
    );
  }

  return null;
};

export default SkeletonLoader;

