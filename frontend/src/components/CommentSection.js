import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHeart, FaReply, FaEdit, FaTrash, FaEllipsisV } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import api from '../services/api';
import SkeletonLoader from './SkeletonLoader';
import './CommentSection.css';

const CommentSection = ({ postId, onCommentAdded }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [showMenu, setShowMenu] = useState(null);

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/posts/${postId}/comments`);
      // Organize comments into tree structure
      const commentsMap = {};
      const rootComments = [];

      response.data.forEach(comment => {
        commentsMap[comment.id] = { ...comment, replies: [] };
      });

      response.data.forEach(comment => {
        if (comment.parent_id) {
          if (commentsMap[comment.parent_id]) {
            commentsMap[comment.parent_id].replies.push(commentsMap[comment.id]);
          }
        } else {
          rootComments.push(commentsMap[comment.id]);
        }
      });

      setComments(rootComments);
    } catch (error) {
      console.error('Error loading comments:', error);
      showToast('Erreur lors du chargement des commentaires', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    try {
      const payload = {
        content: newComment
      };
      // Only include parent_id if replyingTo is set
      if (replyingTo) {
        payload.parent_id = replyingTo;
      }
      const response = await api.post(`/posts/${postId}/comments`, payload);
      
      showToast('Commentaire ajouté', 'success');
      setNewComment('');
      setReplyingTo(null);
      loadComments();
      if (onCommentAdded) onCommentAdded();
    } catch (error) {
      showToast('Erreur lors de l\'ajout du commentaire', 'error');
    }
  };

  const handleLike = async (commentId) => {
    if (!user) return;
    
    try {
      await api.post(`/comments/${commentId}/like`);
      loadComments();
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleEdit = async (commentId) => {
    if (!editContent.trim()) {
      showToast('Le commentaire ne peut pas être vide', 'error');
      return;
    }
    
    try {
      await api.put(`/comments/${commentId}`, { content: editContent });
      showToast('Commentaire modifié', 'success');
      setEditingId(null);
      setEditContent('');
      // Update the comment in the local state instead of reloading all comments
      setComments(prevComments => {
        const updateComment = (comments) => {
          return comments.map(comment => {
            if (comment.id === commentId) {
              return { ...comment, content: editContent };
            }
            if (comment.replies && comment.replies.length > 0) {
              return { ...comment, replies: updateComment(comment.replies) };
            }
            return comment;
          });
        };
        return updateComment(prevComments);
      });
    } catch (error) {
      showToast('Erreur lors de la modification', 'error');
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Supprimer ce commentaire ?')) return;
    
    try {
      await api.delete(`/comments/${commentId}`);
      showToast('Commentaire supprimé', 'success');
      loadComments();
    } catch (error) {
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  const CommentItem = ({ comment, depth = 0 }) => {
    const isOwner = user && user.id === comment.user_id;
    const isAdmin = user && user.role === 'admin';
    const canEdit = isOwner || isAdmin; // Owner or admin can edit
    const isEditing = editingId === comment.id;

    return (
      <motion.div
        className={`comment-item ${depth > 0 ? 'comment-reply' : ''}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="comment-header">
          <Link to={`/user/${comment.user_id}`} className="comment-user">
            <img
              src={comment.profile_image || 'https://via.placeholder.com/32'}
              alt={comment.username}
              className="comment-avatar"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/32';
              }}
            />
            <span className="comment-username">{comment.username}</span>
          </Link>
          {canEdit && (
            <div className="comment-menu">
              <button
                className="comment-menu-button"
                onClick={() => setShowMenu(showMenu === comment.id ? null : comment.id)}
              >
                <FaEllipsisV />
              </button>
              {showMenu === comment.id && (
                <div className="comment-menu-dropdown">
                  <button onClick={() => {
                    setEditingId(comment.id);
                    setEditContent(comment.content);
                    setShowMenu(null);
                  }}>
                    <FaEdit /> Modifier
                  </button>
                  {(isOwner || isAdmin) && (
                    <button onClick={() => {
                      handleDelete(comment.id);
                      setShowMenu(null);
                    }}>
                      <FaTrash /> Supprimer
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="comment-edit-form">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
              maxLength={1000}
            />
            <div className="comment-edit-actions">
              <button onClick={() => handleEdit(comment.id)}>Enregistrer</button>
              <button onClick={() => {
                setEditingId(null);
                setEditContent('');
              }}>Annuler</button>
            </div>
          </div>
        ) : (
          <p className="comment-content">{comment.content}</p>
        )}

        <div className="comment-actions">
          <motion.button
            className={`comment-like-button ${comment.is_liked ? 'liked' : ''}`}
            onClick={() => handleLike(comment.id)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FaHeart />
            <span>{comment.likes_count || 0}</span>
          </motion.button>
          {user && depth < 2 && (
            <button
              className="comment-reply-button"
              onClick={() => {
                setReplyingTo(replyingTo === comment.id ? null : comment.id);
                setEditingId(null);
              }}
            >
              <FaReply /> Répondre
            </button>
          )}
        </div>

        {replyingTo === comment.id && (
          <form className="comment-reply-form" onSubmit={handleSubmit}>
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={`Répondre à ${comment.username}...`}
              autoFocus
              maxLength={1000}
            />
            <div className="comment-reply-actions">
              <button type="submit">Publier</button>
              <button type="button" onClick={() => setReplyingTo(null)}>Annuler</button>
            </div>
          </form>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="comment-replies">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  if (loading) {
    return <SkeletonLoader type="comment" count={3} />;
  }

  return (
    <div className="comment-section">
      <h3 className="comment-section-title">Commentaires ({comments.length})</h3>
      
      {user && !replyingTo && (
        <form onSubmit={handleSubmit} className="comment-form">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Ajouter un commentaire..."
            maxLength={1000}
          />
          <button type="submit" disabled={!newComment.trim()}>
            Publier
          </button>
        </form>
      )}

      <div className="comments-list">
        <AnimatePresence>
          {comments.length === 0 ? (
            <p className="no-comments">Aucun commentaire pour le moment</p>
          ) : (
            comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CommentSection;

