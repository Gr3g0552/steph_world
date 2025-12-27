import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaHeart, FaComment, FaEdit, FaCheck, FaTimes } from 'react-icons/fa';
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
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTags, setEditTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
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

  const canEdit = post && user && (user.id === post.user_id || user.role === 'admin');


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

  const handleEdit = () => {
    setEditTitle(post.title || '');
    setEditDescription(post.description || '');
    setEditTags(post.tags || []);
    setTagInput('');
    setIsEditing(true);
    setExpanded(true); // Expand when editing
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim() && editTags.length < 10) {
      e.preventDefault();
      const newTag = tagInput.trim().substring(0, 30);
      if (!editTags.includes(newTag)) {
        setEditTags([...editTags, newTag]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setEditTags(editTags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = async () => {
    if (editDescription.length > 2000) {
      showToast('La description ne peut pas dépasser 2000 caractères', 'error');
      return;
    }
    
    try {
      const updateData = {};
      if (editTitle !== (post.title || '')) {
        updateData.title = editTitle;
      }
      if (editDescription !== (post.description || '')) {
        updateData.description = editDescription;
      }
      const currentTags = post.tags || [];
      if (JSON.stringify(editTags.sort()) !== JSON.stringify(currentTags.sort())) {
        updateData.tags = editTags.length > 0 ? JSON.stringify(editTags) : null;
      }

      if (Object.keys(updateData).length === 0) {
        setIsEditing(false);
        return;
      }

      const response = await api.put(`/posts/${id}`, updateData);
      setPost(response.data);
      setIsEditing(false);
      showToast('Publication modifiée avec succès', 'success');
    } catch (error) {
      console.error('Error updating post:', error);
      const errorMsg = error.response?.data?.error || 'Erreur lors de la modification';
      showToast(errorMsg, 'error');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditTitle('');
    setEditDescription('');
    setEditTags([]);
    setTagInput('');
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
            ) : post.file_type === 'video' ? (
              <video src={post.file_path} controls />
            ) : post.file_type === 'audio' ? (
              <div className="audio-player-container">
                <audio src={post.file_path} controls style={{ width: '100%' }} />
              </div>
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

          {isEditing ? (
            <div className="post-edit-form">
              <div className="form-group">
                <label>Titre</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  maxLength={200}
                  className="edit-input"
                  placeholder="Titre de la publication..."
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={5}
                  maxLength={2000}
                  className="edit-textarea"
                  placeholder="Description de la publication..."
                />
              </div>

              <div className="form-group">
                <label>Tags (max 10 tags, 30 caractères chacun)</label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleAddTag}
                  placeholder="Appuyez sur Entrée pour ajouter un tag"
                  maxLength={30}
                  disabled={editTags.length >= 10}
                  className="edit-input"
                />
                {editTags.length > 0 && (
                  <div className="tags-container" style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {editTags.map((tag, index) => (
                      <span
                        key={index}
                        className="tag"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '0.25rem 0.5rem',
                          background: 'rgba(102, 126, 234, 0.2)',
                          borderRadius: '4px',
                          fontSize: '0.875rem'
                        }}
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          style={{
                            marginLeft: '0.5rem',
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            lineHeight: '1'
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {editTags.length >= 10 && (
                  <small style={{ color: '#999', display: 'block', marginTop: '0.25rem' }}>
                    Maximum 10 tags atteint
                  </small>
                )}
              </div>

              <div className="edit-actions">
                <button
                  onClick={handleSave}
                  className="save-button"
                >
                  <FaCheck /> Enregistrer
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="cancel-button"
                >
                  <FaTimes /> Annuler
                </button>
              </div>
            </div>
          ) : (
            <>
              {post.title && <h2>{post.title}</h2>}

              {(description || canEdit) && (
                <div className="post-description">
                  {description && <p>{displayText}</p>}
                  <div className="description-actions">
                    {shouldTruncate && !isEditing && (
                      <button
                        className="expand-button"
                        onClick={() => setExpanded(!expanded)}
                      >
                        {expanded ? 'Voir moins' : 'Voir plus'}
                      </button>
                    )}
                    {canEdit && (
                      <button
                        className="edit-description-button"
                        onClick={handleEdit}
                        title="Modifier la publication"
                      >
                        <FaEdit /> Modifier
                      </button>
                    )}
                  </div>
                </div>
              )}

              {post.tags && post.tags.length > 0 && (
                <div className="post-tags" style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {post.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="tag"
                      style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.5rem',
                        background: 'rgba(102, 126, 234, 0.2)',
                        borderRadius: '4px',
                        fontSize: '0.875rem'
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </>
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



