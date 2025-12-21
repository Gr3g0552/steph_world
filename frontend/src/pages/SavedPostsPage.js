import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import PostCard from '../components/PostCard';
import SkeletonLoader from '../components/SkeletonLoader';
import './SavedPostsPage.css';

const SavedPostsPage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSavedPosts();
    }
  }, [user]);

  const loadSavedPosts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/saved');
      setPosts(response.data);
    } catch (error) {
      console.error('Error loading saved posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="saved-posts-page">
        <div className="saved-posts-container">
          <p>Veuillez vous connecter pour voir vos publications sauvegardées</p>
        </div>
      </div>
    );
  }

  return (
    <div className="saved-posts-page">
      <motion.div
        className="saved-posts-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>Publications Sauvegardées</h1>
        
        {loading ? (
          <SkeletonLoader type="post" count={6} />
        ) : posts.length === 0 ? (
          <div className="no-saved-posts">
            <p>Aucune publication sauvegardée</p>
          </div>
        ) : (
          <div className="saved-posts-grid">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SavedPostsPage;

