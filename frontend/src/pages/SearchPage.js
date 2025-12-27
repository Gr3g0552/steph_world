import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import PostCard from '../components/PostCard';
import SkeletonLoader from '../components/SkeletonLoader';
import './SearchPage.css';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [type, setType] = useState('posts');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    if (type === 'users') {
      // For users tab, load all users by default or search if query is provided
      loadUsers();
    } else if (query.trim().length >= 2) {
      // For posts tab, only search if query is provided
      performSearch();
    } else {
      setResults([]);
    }
  }, [query, type, categoryFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (query.trim().length >= 2) {
        params.q = query;
      }
      const response = await api.get('/search/users', { params });
      setResults(response.data);
    } catch (error) {
      console.error('Load users error:', error);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async () => {
    setLoading(true);
    try {
      const params = { q: query };
      if (categoryFilter) params.category_id = categoryFilter;

      const response = await api.get(`/search/${type}`, { params });
      setResults(response.data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      setSearchParams({ q: query });
      performSearch();
    }
  };

  return (
    <div className="search-page">
      <motion.div
        className="search-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>Recherche</h1>
        
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher..."
            className="search-input"
            minLength={2}
          />
          <button type="submit" className="search-button">
            🔍
          </button>
        </form>

        <div className="search-tabs">
          <button
            className={`search-tab ${type === 'posts' ? 'active' : ''}`}
            onClick={() => setType('posts')}
          >
            Publications
          </button>
          <button
            className={`search-tab ${type === 'users' ? 'active' : ''}`}
            onClick={() => setType('users')}
          >
            Utilisateurs
          </button>
        </div>

        {loading ? (
          <SkeletonLoader type="post" count={3} />
        ) : type === 'users' ? (
          // Users tab: show all users by default, or search results if query provided
          results.length === 0 ? (
            <div className="search-no-results">
              <p>Aucun utilisateur trouvé</p>
            </div>
          ) : (
            <div className="search-results">
              <div className="users-grid">
                {results.map((user) => (
                  <motion.div
                    key={user.id}
                    className="user-card"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="user-card-avatar-container">
                      <img
                        src={user.profile_image || 'https://via.placeholder.com/100'}
                        alt={user.username}
                        className="user-card-avatar"
                      />
                      <span
                        className={`user-status-indicator ${user.is_online ? 'online' : 'offline'}`}
                        title={user.is_online ? 'En ligne' : 'Hors ligne'}
                      />
                    </div>
                    <h3>{user.username}</h3>
                    {user.description && <p>{user.description}</p>}
                    <div className="user-stats">
                      <span>{user.posts_count || 0} publications</span>
                      <span>{user.followers_count || 0} abonnés</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )
        ) : query.trim().length < 2 ? (
          <div className="search-placeholder">
            <p>Entrez au moins 2 caractères pour rechercher</p>
          </div>
        ) : results.length === 0 ? (
          <div className="search-no-results">
            <p>Aucun résultat trouvé pour "{query}"</p>
          </div>
        ) : (
          <div className="search-results">
            {type === 'posts' ? (
              <div className="posts-grid">
                {results.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : null}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SearchPage;

