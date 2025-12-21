import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaBookmark } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import api from '../services/api';
import './SavedPostsButton.css';

const SavedPostsButton = ({ postId }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkSaved();
    }
  }, [user, postId]);

  const checkSaved = async () => {
    try {
      const response = await api.get(`/saved/${postId}`);
      setIsSaved(response.data.saved);
    } catch (error) {
      // Post not saved
      setIsSaved(false);
    }
  };

  const handleToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || loading) return;

    setLoading(true);
    try {
      if (isSaved) {
        await api.delete(`/saved/${postId}`);
        setIsSaved(false);
        showToast('Publication retirée des sauvegardes', 'info');
      } else {
        await api.post(`/saved/${postId}`);
        setIsSaved(true);
        showToast('Publication sauvegardée', 'success');
      }
    } catch (error) {
      showToast('Erreur lors de la sauvegarde', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <motion.button
      className={`saved-button ${isSaved ? 'saved' : ''}`}
      onClick={handleToggle}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      disabled={loading}
      title={isSaved ? 'Retirer des sauvegardes' : 'Sauvegarder'}
    >
      <FaBookmark style={{ fill: isSaved ? 'currentColor' : 'none' }} />
    </motion.button>
  );
};

export default SavedPostsButton;

