import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaHeart, FaComment } from 'react-icons/fa';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { truncateText, countWords } from '../utils/wordCount';
import CommentSection from '../components/CommentSection';
import DoubleTapLike from '../components/DoubleTapLike';
import SavedPostsButton from '../components/SavedPostsButton';
import './PostDetailPage.css';

const PostDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadPost();
  }, [id]);

  const loadPost = async () => {
    try {
      const response = await api.get(`/posts/${id}`);
      setPost(response.data);
      setIsLiked(response.data.is_liked || false);
      setLikesCount(response.data.likes_count || 0);
    } catch (error) {
      console.error('Error loading post:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleLike = async () => {
    if (!user) return;
    
    try {
      await api.post(`/posts/${id}/like`);
      setIsLiked(!isLiked);
      setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
      showToast(isLiked ? 'Like retiré' : 'Publication aimée', 'success');
    } catch (error) {
      console.error('Error liking post:', error);
      showToast('Erreur lors du like', 'error');
    }
  };


  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  if (!post) {
    return <div className="error">Publication non trouvée</div>;
  }

  const description = post.description || '';
  const wordCount = countWords(description);
  const shouldTruncate = wordCount > 30;
  const displayText = shouldTruncate && !expanded 
    ? truncateText(description, 30) 
    : description;

  return (
    <div className="post-detail-page">
      <motion.div
        className="post-detail-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <DoubleTapLike onLike={handleLike}>
          <div className="post-detail-media">
            {post.file_type === 'image' ? (
              <img src={post.file_path} alt={post.title || 'Post'} />
            ) : (
              <video src={post.file_path} controls />
            )}
          </div>
        </DoubleTapLike>

        <div className="post-detail-content">
          <div className="post-detail-header">
            <Link to={`/user/${post.user_id}`} className="user-info">
              <img
                src={post.profile_image || 'https://via.placeholder.com/40'}
                alt={post.username}
                className="user-avatar"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/40';
                }}
              />
              <span>{post.username}</span>
            </Link>
          </div>

          {post.title && <h2>{post.title}</h2>}

          {description && (
            <div className="post-description">
              <p>{displayText}</p>
              {shouldTruncate && (
                <button
                  className="expand-button"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? 'Voir moins' : 'Voir plus'}
                </button>
              )}
            </div>
          )}

          <div className="post-actions">
            <motion.button
              className={`like-button ${isLiked ? 'liked' : ''}`}
              onClick={handleLike}
              disabled={!user}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FaHeart />
              <span>{likesCount}</span>
            </motion.button>
            <div className="comment-count">
              <FaComment />
              <span>{post.comments_count || 0}</span>
            </div>
            <SavedPostsButton postId={id} />
          </div>

          <CommentSection postId={id} onCommentAdded={() => {
            loadPost();
          }} />
        </div>
      </motion.div>
    </div>
  );
};

export default PostDetailPage;



