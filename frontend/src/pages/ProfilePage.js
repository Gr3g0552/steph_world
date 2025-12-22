import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import api from '../services/api';
import PostCard from '../components/PostCard';
import FollowButton from '../components/FollowButton';
import { safeLocalStorage } from '../utils/browserCompatibility';
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);
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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
      showToast('Format d\'image non supporté. Utilisez JPEG, PNG, GIF ou WEBP.', 'error');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      showToast('L\'image est trop grande. Taille maximum: 5MB', 'error');
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post(
        '/users/profile/image',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // Update formData with the new image URL
      setFormData({
        ...formData,
        profile_image: response.data.profile_image
      });

      showToast('Photo de profil téléchargée avec succès', 'success');
      
      // Reload user data to get updated profile
      await loadUser();
    } catch (error) {
      console.error('Error uploading image:', error);
      const errorMsg = error.response?.data?.error || 'Erreur lors du téléchargement de l\'image';
      showToast(errorMsg, 'error');
    } finally {
      setUploadingImage(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleProfileImageChange = (e) => {
    let value = e.target.value;
    
    // Decode HTML entities that might have been encoded (fix for already broken URLs)
    value = value
      .replace(/&#x2F;/g, '/')
      .replace(/&#x27;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
    
    // Fix common URL formatting issues
    // Remove all whitespace (spaces, tabs, newlines, etc.)
    value = value.replace(/\s+/g, '');
    
    // Remove any invisible characters
    value = value.replace(/[\u200B-\u200D\uFEFF]/g, '');
    
    // Remove any HTML entity artifacts
    value = value.replace(/&amp;#x2F;/g, '/');
    value = value.replace(/&amp;/g, '&');
    
    // Trim the value
    value = value.trim();
    
    // If it looks like a URL but is missing protocol, add https://
    if (value && !value.startsWith('http://') && !value.startsWith('https://') && !value.startsWith('/')) {
      // Check if it looks like a domain (contains a dot and doesn't start with one)
      if (value.includes('.') && !value.startsWith('.') && !value.startsWith('localhost')) {
        // Check if it already has a protocol-like prefix
        if (!value.match(/^[a-zA-Z][a-zA-Z\d+\-.]*:/)) {
          value = 'https://' + value;
        }
      }
    }
    
    // Validate URL format if it's not empty and not a relative path
    if (value && (value.startsWith('http://') || value.startsWith('https://'))) {
      try {
        // Validate URL format - this will throw if invalid
        new URL(value);
      } catch (e) {
        // If URL is invalid, show error but don't prevent typing
        console.warn('Invalid URL format:', value);
      }
    }
    
    setFormData({ ...formData, profile_image: value });
  };

  const handleSave = async () => {
    try {
      // Sanitize profile_image URL before saving
      const sanitizedData = {
        ...formData,
        profile_image: formData.profile_image.trim()
      };
      
      await api.put('/users/profile', sanitizedData);
      await loadUser();
      setIsEditing(false);
      if (currentUser) {
        const updatedUser = { ...currentUser, ...sanitizedData };
        safeLocalStorage.setItem('user', JSON.stringify(updatedUser));
      }
      showToast('Profil mis à jour avec succès', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMsg = error.response?.data?.error || 'Erreur lors de la mise à jour du profil';
      showToast(errorMsg, 'error');
    }
  };

  const handleChangePassword = async () => {
    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      showToast('Veuillez remplir tous les champs', 'error');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      showToast('Le nouveau mot de passe doit contenir au moins 8 caractères', 'error');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('Les mots de passe ne correspondent pas', 'error');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      showToast('Le nouveau mot de passe doit être différent de l\'ancien', 'error');
      return;
    }

    setChangingPassword(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      showToast('Mot de passe modifié avec succès', 'success');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowChangePassword(false);
    } catch (error) {
      console.error('Error changing password:', error);
      const errorMsg = error.response?.data?.error || 'Erreur lors de la modification du mot de passe';
      showToast(errorMsg, 'error');
    } finally {
      setChangingPassword(false);
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
                <div className="profile-image-input-group">
                  <label className="upload-label">
                    {uploadingImage ? 'Téléchargement...' : '📤 Télécharger une image locale'}
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <div className="or-divider">ou</div>
                  <input
                    type="text"
                    value={formData.profile_image}
                    onChange={handleProfileImageChange}
                    placeholder="https://exemple.com/image.jpg"
                    className="profile-image-url-input"
                  />
                </div>
                {formData.profile_image && (
                  <div className="profile-image-preview">
                    <img 
                      src={formData.profile_image} 
                      alt="Aperçu" 
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <div style={{ display: 'none', color: '#ff6b6b', fontSize: '0.875rem' }}>
                      Impossible de charger l'image
                    </div>
                  </div>
                )}
                <div className="password-section">
                  {!showChangePassword ? (
                    <button 
                      type="button"
                      className="toggle-password-button" 
                      onClick={() => setShowChangePassword(true)}
                    >
                      Changer le mot de passe
                    </button>
                  ) : (
                    <div className="change-password-form">
                      <h3>Changer le mot de passe</h3>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        placeholder="Mot de passe actuel"
                        className="password-input"
                      />
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        placeholder="Nouveau mot de passe (min. 8 caractères)"
                        className="password-input"
                      />
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        placeholder="Confirmer le nouveau mot de passe"
                        className="password-input"
                      />
                      <div className="password-actions">
                        <button 
                          type="button"
                          onClick={handleChangePassword} 
                          disabled={changingPassword}
                          className="save-password-button"
                        >
                          {changingPassword ? 'Modification...' : 'Enregistrer le mot de passe'}
                        </button>
                        <button 
                          type="button"
                          onClick={() => {
                            setShowChangePassword(false);
                            setPasswordData({
                              currentPassword: '',
                              newPassword: '',
                              confirmPassword: ''
                            });
                          }}
                          className="cancel-password-button"
                          disabled={changingPassword}
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="edit-actions">
                  <button onClick={handleSave}>Enregistrer</button>
                  <button onClick={() => {
                    setIsEditing(false);
                    setShowChangePassword(false);
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                  }}>Annuler</button>
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

