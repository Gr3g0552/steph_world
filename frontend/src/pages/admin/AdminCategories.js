import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import './AdminPage.css';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    background_images: [],
    image_interval: 3000
  });
  const [newImageUrl, setNewImageUrl] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await api.put(`/admin/categories/${editingCategory.id}`, formData);
      } else {
        await api.post('/admin/categories', formData);
      }
      setShowModal(false);
      setEditingCategory(null);
      setFormData({ name: '', slug: '', background_images: [], image_interval: 3000 });
      setNewImageUrl('');
      loadCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      background_images: category.background_images || [],
      image_interval: category.image_interval || 3000
    });
    setShowModal(true);
  };

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setFormData({
        ...formData,
        background_images: [...formData.background_images, newImageUrl.trim()]
      });
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index) => {
    setFormData({
      ...formData,
      background_images: formData.background_images.filter((_, i) => i !== index)
    });
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      return;
    }
    try {
      await api.delete(`/admin/categories/${categoryId}`);
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Gestion des Catégories</h1>
        <button className="add-button" onClick={() => setShowModal(true)}>
          + Ajouter une catégorie
        </button>
      </div>

      <div className="categories-list">
        {categories.map((category) => (
          <motion.div
            key={category.id}
            className="category-admin-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="category-info">
              <h3>{category.name}</h3>
              <p>Slug: {category.slug}</p>
              <p>Sous-catégories: {category.subcategories?.length || 0}</p>
            </div>
            <div className="category-actions">
              <button onClick={() => handleEdit(category)}>Modifier</button>
              <button className="delete-button" onClick={() => handleDelete(category.id)}>
                Supprimer
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <motion.div
            className="modal-content"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{editingCategory ? 'Modifier' : 'Ajouter'} une catégorie</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nom</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Images de Fond (URLs)</label>
                <div className="image-input-group">
                  <input
                    type="text"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="https://exemple.com/image.jpg"
                    className="image-url-input"
                  />
                  <button type="button" onClick={handleAddImage} className="add-image-button">
                    Ajouter
                  </button>
                </div>
                <div className="images-list">
                  {formData.background_images.map((url, index) => (
                    <div key={index} className="image-item">
                      <img src={url} alt={`Background ${index + 1}`} />
                      <button
                        type="button"
                        className="remove-image-button"
                        onClick={() => handleRemoveImage(index)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Intervalle de changement (millisecondes)</label>
                <input
                  type="number"
                  value={formData.image_interval}
                  onChange={(e) => setFormData({ ...formData, image_interval: parseInt(e.target.value) || 3000 })}
                  min="1000"
                  step="1000"
                  required
                />
                <small>Valeur par défaut: 3000ms (3 secondes)</small>
              </div>
              <div className="form-actions">
                <button type="submit">Enregistrer</button>
                <button type="button" onClick={() => setShowModal(false)}>
                  Annuler
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;

