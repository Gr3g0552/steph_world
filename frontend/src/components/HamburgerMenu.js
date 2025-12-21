import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import './HamburgerMenu.css';

const HamburgerMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  const toggleInterface = () => {
    if (user?.role === 'admin') {
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/admin')) {
        window.location.href = '/';
      } else {
        window.location.href = '/admin';
      }
    }
    setIsOpen(false);
  };

  const menuItems = user ? [
    { path: '/', label: 'Accueil' },
    { path: '/search', label: 'Recherche' },
    { path: '/profile', label: 'Mon Profil' },
    ...(user.role === 'admin' ? [{ path: '/admin', label: 'Interface Admin', action: toggleInterface }] : [])
  ] : [
    { path: '/', label: 'Accueil' },
    { path: '/search', label: 'Recherche' },
    { path: '/login', label: 'Connexion' },
    { path: '/register', label: 'Inscription' }
  ];

  return (
    <div className="hamburger-menu">
      <motion.button
        className="hamburger-button"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Menu"
      >
        <motion.span
          className={`hamburger-line ${isOpen ? 'open' : ''}`}
          animate={isOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
          transition={{ duration: 0.3 }}
        />
        <motion.span
          className={`hamburger-line ${isOpen ? 'open' : ''}`}
          animate={isOpen ? { opacity: 0 } : { opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
        <motion.span
          className={`hamburger-line ${isOpen ? 'open' : ''}`}
          animate={isOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
          transition={{ duration: 0.3 }}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="hamburger-dropdown"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {menuItems.map((item) => (
              item.action ? (
                <button
                  key={item.path}
                  onClick={item.action}
                  className={`menu-item ${location.pathname === item.path ? 'active' : ''}`}
                >
                  {item.label}
                </button>
              ) : (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`menu-item ${location.pathname === item.path ? 'active' : ''}`}
                >
                  {item.label}
                </Link>
              )
            ))}
            {user && (
              <button onClick={handleLogout} className="menu-item logout">
                Déconnexion
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HamburgerMenu;

