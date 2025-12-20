import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import './AdminPage.css';

const AdminPinnedMessages = () => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [formData, setFormData] = useState({
    user_id: '',
    title: '',
    content: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [messagesRes, usersRes] = await Promise.all([
        api.get('/admin/pinned-messages'),
        api.get('/admin/users')
      ]);
      setMessages(messagesRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMessage) {
        await api.put(`/admin/pinned-messages/${editingMessage.id}`, formData);
      } else {
        await api.post('/admin/pinned-messages', formData);
      }
      setShowModal(false);
      setEditingMessage(null);
      setFormData({ user_id: '', title: '', content: '' });
      loadData();
    } catch (error) {
      console.error('Error saving message:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (message) => {
    setEditingMessage(message);
    setFormData({
      user_id: message.user_id,
      title: message.title,
      content: message.content
    });
    setShowModal(true);
  };

  const handleDelete = async (messageId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
      return;
    }
    try {
      await api.delete(`/admin/pinned-messages/${messageId}`);
      loadData();
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Messages Épinglés</h1>
        <button className="add-button" onClick={() => setShowModal(true)}>
          + Ajouter un message
        </button>
      </div>

      <div className="messages-list">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            className="message-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="message-info">
              <h3>{message.title}</h3>
              <p>Utilisateur: {message.username} ({message.email})</p>
              <p className="message-content">{message.content}</p>
              <p className="message-date">
                {new Date(message.created_at).toLocaleString()}
              </p>
            </div>
            <div className="message-actions">
              <button onClick={() => handleEdit(message)}>Modifier</button>
              <button className="delete-button" onClick={() => handleDelete(message.id)}>
                Supprimer
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <motion.div
            className="modal-content"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{editingMessage ? 'Modifier' : 'Ajouter'} un message épinglé</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Utilisateur</label>
                <select
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  required
                >
                  <option value="">Sélectionner un utilisateur</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Titre</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Contenu</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                  rows={5}
                />
              </div>
              <div className="form-actions">
                <button type="submit">Enregistrer</button>
                <button type="button" onClick={() => setShowModal(false)}>
                  Annuler
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminPinnedMessages;

