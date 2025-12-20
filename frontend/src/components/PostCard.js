import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaHeart, FaComment } from 'react-icons/fa';
import api from '../services/api';
import { truncateText, countWords } from '../utils/wordCount';
import './PostCard.css';

const PostCard = ({ post, onLike }) => {
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [expanded, setExpanded] = useState(false);

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await api.post(`/posts/${post.id}/like`);
      setIsLiked(!isLiked);
      setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
      if (onLike) onLike(post.id, !isLiked);
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const description = post.description || '';
  const wordCount = countWords(description);
  const shouldTruncate = wordCount > 30;
  const displayText = shouldTruncate && !expanded 
    ? truncateText(description, 30) 
    : description;

  return (
    <motion.div
      className="post-card"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/post/${post.id}`} className="post-link">
        <div className="post-header">
          <Link
            to={`/user/${post.user_id}`}
            onClick={(e) => e.stopPropagation()}
            className="user-info"
          >
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

        <div className="post-media">
          {post.file_type === 'image' ? (
            <img src={post.file_path} alt={post.title || 'Post'} />
          ) : (
            <video src={post.file_path} controls />
          )}
        </div>

        <div className="post-content">
          {post.title && <h3>{post.title}</h3>}
          {description && (
            <div className="post-description">
              <p>{displayText}</p>
              {shouldTruncate && (
                <button
                  className="expand-button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setExpanded(!expanded);
                  }}
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
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FaHeart />
              <span>{likesCount}</span>
            </motion.button>
            <Link to={`/post/${post.id}`} className="comment-button">
              <FaComment />
              <span>{post.comments_count || 0}</span>
            </Link>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default PostCard;

