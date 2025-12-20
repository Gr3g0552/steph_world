import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const menuItems = [
    { path: '/admin/users', title: 'Gestion des Utilisateurs', icon: '👥' },
    { path: '/admin/categories', title: 'Gestion des Catégories', icon: '📁' },
    { path: '/admin/posts', title: 'Gestion des Publications', icon: '📝' },
    { path: '/admin/pinned-messages', title: 'Messages Épinglés', icon: '📌' },
    { path: '/admin/homepage', title: 'Paramètres Page d\'Accueil', icon: '🏠' },
  ];

  return (
    <div className="admin-dashboard">
      <motion.div
        className="admin-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>Tableau de Bord Administrateur</h1>
        <div className="admin-menu">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={item.path} className="admin-menu-item">
                <span className="menu-icon">{item.icon}</span>
                <span className="menu-title">{item.title}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;

