import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingUsers: 0,
    totalPosts: 0,
    totalComments: 0,
    totalCategories: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [usersRes, postsRes, commentsRes, categoriesRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/posts'),
        api.get('/posts'),
        api.get('/categories')
      ]);

      const pendingUsers = usersRes.data.filter(u => !u.is_approved).length;

      setStats({
        totalUsers: usersRes.data.length,
        pendingUsers,
        totalPosts: postsRes.data.length,
        totalComments: commentsRes.data.reduce((sum, post) => sum + (post.comments_count || 0), 0),
        totalCategories: categoriesRes.data.length
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { path: '/profile', title: 'Mon Profil', icon: '👤', external: true },
    { path: '/admin/users', title: 'Gestion des Utilisateurs', icon: '👥', count: stats.pendingUsers, highlight: stats.pendingUsers > 0 },
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

        {!loading && (
          <div className="admin-stats-grid">
            <motion.div
              className="stat-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <div className="stat-value">{stats.totalUsers}</div>
                <div className="stat-label">Utilisateurs</div>
                {stats.pendingUsers > 0 && (
                  <div className="stat-badge">{stats.pendingUsers} en attente</div>
                )}
              </div>
            </motion.div>

            <motion.div
              className="stat-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="stat-icon">📝</div>
              <div className="stat-content">
                <div className="stat-value">{stats.totalPosts}</div>
                <div className="stat-label">Publications</div>
              </div>
            </motion.div>

            <motion.div
              className="stat-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="stat-icon">💬</div>
              <div className="stat-content">
                <div className="stat-value">{stats.totalComments}</div>
                <div className="stat-label">Commentaires</div>
              </div>
            </motion.div>

            <motion.div
              className="stat-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="stat-icon">📁</div>
              <div className="stat-content">
                <div className="stat-value">{stats.totalCategories}</div>
                <div className="stat-label">Catégories</div>
              </div>
            </motion.div>
          </div>
        )}

        <div className="admin-menu">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              {item.external ? (
                <a
                  href={item.path}
                  className={`admin-menu-item ${item.highlight ? 'highlight' : ''}`}
                >
                  <span className="menu-icon">{item.icon}</span>
                  <div className="menu-content">
                    <span className="menu-title">{item.title}</span>
                    {item.count !== undefined && item.count > 0 && (
                      <span className="menu-badge">{item.count}</span>
                    )}
                  </div>
                </a>
              ) : (
                <Link
                  to={item.path}
                  className={`admin-menu-item ${item.highlight ? 'highlight' : ''}`}
                >
                  <span className="menu-icon">{item.icon}</span>
                  <div className="menu-content">
                    <span className="menu-title">{item.title}</span>
                    {item.count !== undefined && item.count > 0 && (
                      <span className="menu-badge">{item.count}</span>
                    )}
                  </div>
                </Link>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
