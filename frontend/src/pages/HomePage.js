import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import BackgroundSlider from '../components/BackgroundSlider';
import PostCard from '../components/PostCard';
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
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  const backgroundImages = homepageSettings?.background_images || [];

  return (
    <div className="homepage">
      <BackgroundSlider images={backgroundImages} interval={5000} blur={true} />
      <div className="homepage-content">
        <motion.div
          className="hero-section"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1>Bienvenue sur Steph World</h1>
          <p>Découvrez et partagez vos créations</p>
        </motion.div>

        <div className="categories-grid">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              className="category-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <Link to={`/category/${category.id}`}>
                <h2>{category.name}</h2>
                <div className="subcategories">
                  {category.subcategories?.map((sub) => (
                    <span key={sub.id} className="subcategory-tag">
                      {sub.name}
                    </span>
                  ))}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;

