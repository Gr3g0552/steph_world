import React, { useState } from 'react';
import { motion } from 'framer-motion';
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

  const selectedCategory = categories.find(c => c.id === parseInt(formData.category_id));

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, file });
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

      await api.post('/posts', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
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
      onPostCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la publication');
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
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Fichier (Image ou Vidéo)</label>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              required
            />
            {preview && (
              <div className="preview-container">
                {formData.file?.type.startsWith('image/') ? (
                  <img src={preview} alt="Preview" />
                ) : (
                  <video src={preview} controls />
                )}
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

