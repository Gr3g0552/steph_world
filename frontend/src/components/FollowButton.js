import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import api from '../services/api';
import './FollowButton.css';

const FollowButton = ({ userId, onFollowChange }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && userId && user.id !== userId) {
      checkFollow();
    }
  }, [user, userId]);

  const checkFollow = async () => {
    try {
      const response = await api.get(`/follows/check/${userId}`);
      setIsFollowing(response.data.following);
    } catch (error) {
      setIsFollowing(false);
    }
  };

  const handleToggle = async () => {
    if (!user || loading || user.id === userId) return;

    setLoading(true);
    try {
      if (isFollowing) {
        await api.delete(`/follows/${userId}`);
        setIsFollowing(false);
        showToast('Abonnement retiré', 'info');
      } else {
        await api.post(`/follows/${userId}`);
        setIsFollowing(true);
        showToast('Abonnement ajouté', 'success');
      }
      if (onFollowChange) onFollowChange();
    } catch (error) {
      showToast('Erreur lors de l\'opération', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.id === userId) return null;

  return (
    <motion.button
      className={`follow-button ${isFollowing ? 'following' : ''}`}
      onClick={handleToggle}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      disabled={loading}
    >
      {isFollowing ? 'Se désabonner' : 'S\'abonner'}
    </motion.button>
  );
};

export default FollowButton;

