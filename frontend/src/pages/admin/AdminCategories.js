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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [subcategories, setSubcategories] = useState([]);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [subcategoryFormData, setSubcategoryFormData] = useState({
    name: '',
    slug: ''
  });

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
      setSubcategories([]);
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
    setSubcategories(category.subcategories || []);
    setShowModal(true);
  };

  const loadSubcategories = async (categoryId) => {
    try {
      const response = await api.get('/categories');
      const category = response.data.find(c => c.id === categoryId);
      if (category) {
        setSubcategories(category.subcategories || []);
      }
    } catch (error) {
      console.error('Error loading subcategories:', error);
    }
  };

  const handleAddSubcategory = () => {
    setEditingSubcategory(null);
    setSubcategoryFormData({ name: '', slug: '' });
    setShowSubcategoryModal(true);
  };

  const handleEditSubcategory = (subcategory) => {
    setEditingSubcategory(subcategory);
    setSubcategoryFormData({
      name: subcategory.name,
      slug: subcategory.slug
    });
    setShowSubcategoryModal(true);
  };

  const handleSaveSubcategory = async (e) => {
    e.preventDefault();
    if (!editingCategory) {
      alert('Veuillez d\'abord créer ou modifier une catégorie');
      return;
    }
    try {
      if (editingSubcategory) {
        await api.put(`/admin/subcategories/${editingSubcategory.id}`, subcategoryFormData);
      } else {
        await api.post(`/admin/categories/${editingCategory.id}/subcategories`, subcategoryFormData);
      }
      setShowSubcategoryModal(false);
      setEditingSubcategory(null);
      setSubcategoryFormData({ name: '', slug: '' });
      await loadSubcategories(editingCategory.id);
      loadCategories(); // Reload to update subcategory count
    } catch (error) {
      console.error('Error saving subcategory:', error);
      alert('Erreur lors de la sauvegarde de la sous-catégorie');
    }
  };

  const handleDeleteSubcategory = async (subcategoryId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette sous-catégorie ?')) {
      return;
    }
    try {
      await api.delete(`/admin/subcategories/${subcategoryId}`);
      await loadSubcategories(editingCategory.id);
      loadCategories(); // Reload to update subcategory count
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      alert('Erreur lors de la suppression');
    }
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

  const handleUploadImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!editingCategory) {
      alert('Veuillez d\'abord créer ou modifier une catégorie pour télécharger des images');
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post(
        `/admin/categories/${editingCategory.id}/background-image`,
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
        background_images: [...formData.background_images, response.data.imageUrl]
      });

      alert('Image téléchargée avec succès');
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Erreur lors du téléchargement de l\'image');
    } finally {
      setUploadingImage(false);
      // Reset file input
      e.target.value = '';
    }
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
                <label>Images de Fond</label>
                <p className="settings-description" style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
                  Vous pouvez ajouter des images via URL ou télécharger directement depuis votre ordinateur.
                  Les images téléchargées seront stockées sur le serveur pour éviter les erreurs de chargement.
                </p>
                
                {/* Upload file option - only when editing existing category */}
                {editingCategory && (
                  <div className="image-input-group" style={{ marginBottom: '1rem' }}>
                    <label className="upload-button" style={{ 
                      padding: '0.75rem 1.5rem',
                      background: 'rgba(102, 126, 234, 0.2)',
                      color: '#667eea',
                      border: '1px solid rgba(102, 126, 234, 0.5)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'inline-block',
                      textAlign: 'center'
                    }}>
                      {uploadingImage ? 'Téléchargement...' : '📤 Télécharger une image'}
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleUploadImage}
                        disabled={uploadingImage}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                )}

                {/* URL input option */}
                <div className="image-input-group">
                  <input
                    type="text"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="https://exemple.com/image.jpg"
                    className="image-url-input"
                  />
                  <button type="button" onClick={handleAddImage} className="add-image-button">
                    Ajouter URL
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

              {/* Subcategories Section */}
              <div className="form-group" style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <label style={{ margin: 0 }}>Sous-catégories</label>
                  <button 
                    type="button" 
                    onClick={handleAddSubcategory}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'rgba(102, 126, 234, 0.2)',
                      color: '#667eea',
                      border: '1px solid rgba(102, 126, 234, 0.5)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    + Ajouter
                  </button>
                </div>
                {subcategories.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {subcategories.map((sub) => (
                      <div 
                        key={sub.id} 
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.75rem',
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '6px'
                        }}
                      >
                        <div>
                          <strong>{sub.name}</strong>
                          <span style={{ marginLeft: '0.5rem', color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem' }}>
                            ({sub.slug})
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => handleEditSubcategory(sub)}
                            style={{
                              padding: '0.25rem 0.75rem',
                              background: 'rgba(102, 126, 234, 0.2)',
                              color: '#667eea',
                              border: '1px solid rgba(102, 126, 234, 0.5)',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.875rem'
                            }}
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSubcategory(sub.id)}
                            style={{
                              padding: '0.25rem 0.75rem',
                              background: 'rgba(255, 77, 77, 0.2)',
                              color: '#ff4d4d',
                              border: '1px solid rgba(255, 77, 77, 0.5)',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.875rem'
                            }}
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem', fontStyle: 'italic' }}>
                    Aucune sous-catégorie. Cliquez sur "Ajouter" pour en créer une.
                  </p>
                )}
              </div>

              <div className="form-actions">
                <button type="submit">Enregistrer</button>
                <button type="button" onClick={() => {
                  setShowModal(false);
                  setSubcategories([]);
                }}>
                  Annuler
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Subcategory Modal */}
      {showSubcategoryModal && (
        <div className="modal-overlay" onClick={() => setShowSubcategoryModal(false)}>
          <motion.div
            className="modal-content"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{editingSubcategory ? 'Modifier' : 'Ajouter'} une sous-catégorie</h2>
            <form onSubmit={handleSaveSubcategory}>
              <div className="form-group">
                <label>Nom</label>
                <input
                  type="text"
                  value={subcategoryFormData.name}
                  onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Slug</label>
                <input
                  type="text"
                  value={subcategoryFormData.slug}
                  onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, slug: e.target.value })}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit">Enregistrer</button>
                <button type="button" onClick={() => setShowSubcategoryModal(false)}>
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

