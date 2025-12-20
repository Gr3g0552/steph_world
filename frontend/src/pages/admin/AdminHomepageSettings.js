import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import './AdminPage.css';

const AdminHomepageSettings = () => {
  const [settings, setSettings] = useState(null);
  const [backgroundImages, setBackgroundImages] = useState([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get('/homepage');
      setSettings(response.data);
      setBackgroundImages(response.data.background_images || []);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setBackgroundImages([...backgroundImages, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index) => {
    setBackgroundImages(backgroundImages.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/homepage', { background_images: backgroundImages });
      alert('Paramètres sauvegardés avec succès');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Paramètres de la Page d'Accueil</h1>
      </div>

      <div className="settings-container">
        <div className="settings-section">
          <h2>Images de Fond</h2>
          <p className="settings-description">
            Ajoutez des URLs d'images qui défileront en arrière-plan de la page d'accueil (floutées)
          </p>

          <div className="image-input-group">
            <input
              type="text"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="https://exemple.com/image.jpg"
              className="image-url-input"
            />
            <button onClick={handleAddImage} className="add-image-button">
              Ajouter
            </button>
          </div>

          <div className="images-list">
            {backgroundImages.map((url, index) => (
              <motion.div
                key={index}
                className="image-item"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <img src={url} alt={`Background ${index + 1}`} />
                <button
                  className="remove-image-button"
                  onClick={() => handleRemoveImage(index)}
                >
                  ✕
                </button>
              </motion.div>
            ))}
          </div>

          {backgroundImages.length === 0 && (
            <p className="empty-state">Aucune image ajoutée</p>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="save-button"
          >
            {saving ? 'Sauvegarde...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminHomepageSettings;

