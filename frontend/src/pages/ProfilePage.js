import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import api from '../services/api';
import PostCard from '../components/PostCard';
import FollowButton from '../components/FollowButton';
import './ProfilePage.css';

const ProfilePage = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [formData, setFormData] = useState({
    username: '',
    description: '',
    profile_image: ''
  });
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const userId = id || currentUser?.id;
  const isOwnProfile = !id || currentUser?.id === parseInt(id);

  useEffect(() => {
    if (userId) {
      loadUser();
      loadPosts();
    }
  }, [userId]);

  const loadUser = async () => {
    try {
      const response = await api.get(`/users/${userId}`);
      setUser(response.data);
      setFormData({
        username: response.data.username || '',
        description: response.data.description || '',
        profile_image: response.data.profile_image || ''
      });
      
      // Load follow stats
      try {
        const [followersRes, followingRes] = await Promise.all([
          api.get(`/follows/${userId}/followers`),
          api.get(`/follows/${userId}/following`)
        ]);
        setFollowersCount(followersRes.data.length);
        setFollowingCount(followingRes.data.length);
      } catch (error) {
        console.error('Error loading follow stats:', error);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      const response = await api.get(`/users/${userId}/posts`);
      setPosts(response.data);
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const handleSave = async () => {
    try {
      await api.put('/users/profile', formData);
      await loadUser();
      setIsEditing(false);
      if (currentUser) {
        const updatedUser = { ...currentUser, ...formData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      showToast('Profil mis à jour avec succès', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMsg = error.response?.data?.error || 'Erreur lors de la mise à jour du profil';
      showToast(errorMsg, 'error');
    }
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  if (!user) {
    return <div className="error">Utilisateur non trouvé</div>;
  }

  return (
    <div className="profile-page">
      <motion.div
        className="profile-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="profile-header">
          <img
            src={user.profile_image || 'https://via.placeholder.com/150'}
            alt={user.username}
            className="profile-avatar-large"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/150';
            }}
          />
          <div className="profile-info">
            <h1>{user.username}</h1>
            {isOwnProfile && isEditing ? (
              <div className="edit-form">
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Nom d'utilisateur"
                />
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description"
                  maxLength={2000}
                  rows={4}
                />
                <input
                  type="text"
                  value={formData.profile_image}
                  onChange={(e) => setFormData({ ...formData, profile_image: e.target.value })}
                  placeholder="URL de l'image de profil"
                />
                <div className="edit-actions">
                  <button onClick={handleSave}>Enregistrer</button>
                  <button onClick={() => setIsEditing(false)}>Annuler</button>
                </div>
              </div>
            ) : (
              <>
                {user.description && <p className="profile-description">{user.description}</p>}
                {isOwnProfile ? (
                  <button className="edit-button" onClick={() => setIsEditing(true)}>
                    Modifier le profil
                  </button>
                ) : (
                  <FollowButton userId={userId} onFollowChange={loadUser} />
                )}
              </>
            )}
            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-number">{posts.length}</span>
                <span className="stat-label">Publications</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{followersCount}</span>
                <span className="stat-label">Abonnés</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{followingCount}</span>
                <span className="stat-label">Abonnements</span>
              </div>
              {isOwnProfile && (
                <Link to="/saved" className="saved-link">
                  Publications sauvegardées
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="profile-posts">
          <h2>Publications</h2>
          <div className="posts-grid">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
          {posts.length === 0 && (
            <div className="empty-state">
              <p>Aucune publication</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ProfilePage;

