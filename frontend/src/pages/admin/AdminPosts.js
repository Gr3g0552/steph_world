import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../services/api';
import './AdminPage.css';

const AdminPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const response = await api.get('/admin/posts');
      setPosts(response.data);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette publication ?')) {
      return;
    }
    try {
      await api.delete(`/admin/posts/${postId}`);
      loadPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Gestion des Publications</h1>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Image</th>
              <th>Auteur</th>
              <th>Titre</th>
              <th>Likes</th>
              <th>Commentaires</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <motion.tr
                key={post.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <td>{post.id}</td>
                <td>
                  {post.file_type === 'image' ? (
                    <img src={post.file_path} alt="" className="post-thumbnail" />
                  ) : post.file_type === 'video' ? (
                    <span>🎥</span>
                  ) : post.file_type === 'audio' ? (
                    <span>🎵</span>
                  ) : (
                    <span>📁</span>
                  )}
                </td>
                <td>{post.username}</td>
                <td>{post.title || '-'}</td>
                <td>{post.likes_count || 0}</td>
                <td>{post.comments_count || 0}</td>
                <td>{new Date(post.created_at).toLocaleDateString()}</td>
                <td>
                  <div className="action-buttons">
                    <Link to={`/post/${post.id}`} className="view-button">
                      Voir
                    </Link>
                    <button
                      className="delete-button"
                      onClick={() => handleDelete(post.id)}
                    >
                      Supprimer
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {posts.length === 0 && (
          <div className="empty-state">Aucune publication</div>
        )}
      </div>
    </div>
  );
};

export default AdminPosts;

