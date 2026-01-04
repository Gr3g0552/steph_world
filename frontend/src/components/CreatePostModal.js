import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '../hooks/useToast';
import api from '../services/api';
import { isValidDescription, countWords } from '../utils/wordCount';
import './CreatePostModal.css';

const CreatePostModal = ({ isOpen, onClose, categories, onPostCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    subcategory_id: '',
    file: null
  });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const { showToast } = useToast();

  const selectedCategory = categories.find(c => c.id === parseInt(formData.category_id));

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Vérifier la taille (200MB)
      const maxSize = 200 * 1024 * 1024; // 200MB en bytes
      if (file.size > maxSize) {
        const errorMsg = 'Le fichier est trop volumineux. Taille maximale: 200MB';
        setError(errorMsg);
        showToast(errorMsg, 'error');
        e.target.value = ''; // Réinitialiser l'input
        return;
      }
      setFormData({ ...formData, file });
      setError('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.file) {
      setError('Veuillez sélectionner un fichier');
      return;
    }

    if (!isValidDescription(formData.description)) {
      setError('La description ne peut pas dépasser 2000 mots');
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('file', formData.file);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category_id', formData.category_id);
      if (formData.subcategory_id) {
        formDataToSend.append('subcategory_id', formData.subcategory_id);
      }

      // Don't set Content-Type header - let axios set it automatically with the correct boundary
      // Safari is strict about multipart/form-data boundaries
      // Remove default Content-Type header for FormData uploads
      setUploadProgress(0);
      await api.post('/posts', formDataToSend, {
        timeout: 180000, // 3 minutes timeout for large file uploads (200MB)
        headers: {
          // Explicitly remove Content-Type to let axios set it with boundary for FormData
          'Content-Type': undefined
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      });

      setFormData({
        title: '',
        description: '',
        category_id: '',
        subcategory_id: '',
        file: null
      });
      setPreview(null);
      setUploadProgress(0);
      showToast('Publication créée avec succès', 'success');
      onPostCreated();
      onClose();
    } catch (err) {
      console.error('Upload error:', err);
      let errorMsg = 'Erreur lors de la publication';
      if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        errorMsg = 'Le téléchargement a pris trop de temps. Veuillez réessayer avec un fichier plus petit ou vérifier votre connexion.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
      showToast(errorMsg, 'error');
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="create-post-modal"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>Nouvelle Publication</h2>
        {error && <div className="error-message">{error}</div>}
        {loading && uploadProgress > 0 && (
          <div style={{ marginBottom: '1rem', padding: '0.5rem', background: 'rgba(102, 126, 234, 0.1)', borderRadius: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span>Téléchargement en cours...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: `${uploadProgress}%`, height: '100%', background: '#667eea', transition: 'width 0.3s' }}></div>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Fichier (Image, Vidéo ou Audio)</label>
            <input
              type="file"
              accept="image/*,video/*,audio/*"
              onChange={handleFileChange}
              required
            />
            {preview && (
              <div className="preview-container">
                {formData.file?.type.startsWith('image/') ? (
                  <img src={preview} alt="Preview" />
                ) : formData.file?.type.startsWith('video/') ? (
                  <video src={preview} controls />
                ) : formData.file?.type.startsWith('audio/') ? (
                  <div>
                    <p>Fichier audio: {formData.file.name}</p>
                    <audio src={preview} controls />
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Catégorie</label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value, subcategory_id: '' })}
              required
            >
              <option value="">Sélectionner une catégorie</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {selectedCategory && selectedCategory.subcategories && selectedCategory.subcategories.length > 0 && (
            <div className="form-group">
              <label>Sous-catégorie (optionnel)</label>
              <select
                value={formData.subcategory_id}
                onChange={(e) => setFormData({ ...formData, subcategory_id: e.target.value })}
              >
                <option value="">Aucune</option>
                {selectedCategory.subcategories.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Titre (optionnel)</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              maxLength={200}
            />
          </div>

          <div className="form-group">
            <label>Description (optionnel, max 2000 mots)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={5}
              maxLength={10000}
            />
            <div className="word-count">
              {countWords(formData.description)} / 2000 mots
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose}>Annuler</button>
            <button type="submit" disabled={loading}>
              {loading ? 'Publication...' : 'Publier'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CreatePostModal;

