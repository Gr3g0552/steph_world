import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import './AdminPage.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      await api.post(`/admin/users/${userId}/approve`);
      loadUsers();
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Erreur lors de l\'approbation');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }
    try {
      await api.delete(`/admin/users/${userId}`);
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const filteredUsers = users.filter(user => {
    if (filter === 'pending') return !user.is_approved;
    if (filter === 'approved') return user.is_approved;
    return true;
  });

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Gestion des Utilisateurs</h1>
        <div className="filter-buttons">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            Tous
          </button>
          <button
            className={filter === 'pending' ? 'active' : ''}
            onClick={() => setFilter('pending')}
          >
            En attente
          </button>
          <button
            className={filter === 'approved' ? 'active' : ''}
            onClick={() => setFilter('approved')}
          >
            Approuvés
          </button>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Nom d'utilisateur</th>
              <th>Rôle</th>
              <th>Publications</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <motion.tr
                key={user.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <td>{user.id}</td>
                <td>{user.email}</td>
                <td>{user.username}</td>
                <td>
                  <span className={`role-badge ${user.role}`}>
                    {user.role === 'admin' ? 'Admin' : 'Utilisateur'}
                  </span>
                </td>
                <td>{user.posts_count || 0}</td>
                <td>
                  {user.is_approved ? (
                    <span className="status-badge approved">Approuvé</span>
                  ) : (
                    <span className="status-badge pending">En attente</span>
                  )}
                </td>
                <td>
                  <div className="action-buttons">
                    {!user.is_approved && (
                      <button
                        className="approve-button"
                        onClick={() => handleApprove(user.id)}
                      >
                        Approuver
                      </button>
                    )}
                    {user.role !== 'admin' && (
                      <button
                        className="delete-button"
                        onClick={() => handleDelete(user.id)}
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className="empty-state">Aucun utilisateur trouvé</div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;

