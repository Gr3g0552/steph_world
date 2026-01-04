import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import BackgroundSlider from '../components/BackgroundSlider';
import './HomePage.css';

const HomePage = () => {
  const [categories, setCategories] = useState([]);
  const [homepageSettings, setHomepageSettings] = useState(null);
  const [loading, setLoading] = useState(true);

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
    <div className="homepage">
      <BackgroundSlider images={backgroundImages} interval={imageInterval} blur={true} random={true} />
      <div className="homepage-content">
        <motion.div
          className="hero-section calligraphy-message"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.img
            src="/logo.png"
            alt="Steph World"
            className="homepage-logo"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />
          <h1 className="calligraphy-text">Let imagination become the voice through which thought unveils its hidden music.</h1>
        </motion.div>
      </div>
    </div>
  );
};

export default HomePage;

