import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import BackgroundSlider from '../components/BackgroundSlider';
import './SectionsPage.css';

const SectionsPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [homepageSettings, setHomepageSettings] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [categoriesRes, settingsRes] = await Promise.all([
        api.get('/categories'),
        api.get('/homepage')
      ]);
      setCategories(categoriesRes.data);
      setHomepageSettings(settingsRes.data);
    } catch (error) {
      // Silently handle 401 errors on public pages - user just needs to login
      if (error.response && error.response.status === 401) {
        // User not authenticated - this is OK for public pages
        setCategories([]);
        setHomepageSettings({ background_images: [], image_interval: 3000 });
      } else {
        console.error('Error loading data:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  const backgroundImages = homepageSettings?.background_images || [];
  const imageInterval = homepageSettings?.image_interval || 3000;

  return (
    <div className="sections-page">
      <BackgroundSlider images={backgroundImages} interval={imageInterval} blur={true} random={true} />
      <div className="sections-content">
        <motion.div
          className="sections-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1>Espaces de Publication</h1>
          <p>Naviguez entre les différentes sections pour découvrir les contenus</p>
        </motion.div>

        <div className="sections-grid">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              className="section-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
            >
              <Link to={`/category/${category.id}`} className="section-link">
                <div 
                  className="section-background"
                  style={{
                    backgroundImage: category.background_images && category.background_images.length > 0
                      ? `url(${category.background_images[0]})`
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  <div className="section-overlay">
                    <h2 className="section-title">{category.name}</h2>
                    {category.subcategories && category.subcategories.length > 0 && (
                      <div className="section-subcategories">
                        {category.subcategories.slice(0, 3).map((sub) => (
                          <span key={sub.id} className="subcategory-badge">
                            {sub.name}
                          </span>
                        ))}
                        {category.subcategories.length > 3 && (
                          <span className="subcategory-badge">
                            +{category.subcategories.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="empty-state">
            <p>Aucune section disponible</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SectionsPage;

