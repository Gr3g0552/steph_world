import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import HamburgerMenu from './HamburgerMenu';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleInterface = () => {
    if (user?.role === 'admin') {
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/admin')) {
        navigate('/');
      } else {
        navigate('/admin');
      }
    }
  };

  return (
    <motion.header
      className="header"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="header-content">
        <Link to="/" className="logo">
          <motion.h1
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Steph World
          </motion.h1>
        </Link>

        <nav className="nav">
          <HamburgerMenu />
          {user ? (
            <>
              {user.role === 'admin' && (
                <motion.button
                  className="nav-button"
                  onClick={toggleInterface}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {window.location.pathname.startsWith('/admin') ? 'Interface Utilisateur' : 'Interface Admin'}
                </motion.button>
              )}
              <div className="user-menu">
                <motion.button
                  className="profile-button"
                  onClick={() => setShowMenu(!showMenu)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <img
                    src={user.profile_image || 'https://via.placeholder.com/40'}
                    alt={user.username}
                    className="profile-avatar"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/40';
                    }}
                  />
                  <span>{user.username}</span>
                </motion.button>
                {showMenu && (
                  <motion.div
                    className="dropdown-menu"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Link to="/profile" onClick={() => setShowMenu(false)}>
                      Mon Profil
                    </Link>
                    <button onClick={handleLogout}>Déconnexion</button>
                  </motion.div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login">Connexion</Link>
              <Link to="/register">Inscription</Link>
            </>
          )}
        </nav>
      </div>
    </motion.header>
  );
};

export default Header;

