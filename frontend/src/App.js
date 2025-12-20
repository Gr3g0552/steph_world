import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { motion } from 'framer-motion';
import Header from './components/Header';

// User pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import CategoryPage from './pages/CategoryPage';
import PostDetailPage from './pages/PostDetailPage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCategories from './pages/admin/AdminCategories';
import AdminPosts from './pages/admin/AdminPosts';
import AdminPinnedMessages from './pages/admin/AdminPinnedMessages';
import AdminHomepageSettings from './pages/admin/AdminHomepageSettings';

import './App.css';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token) {
    return <Navigate to="/login" />;
  }
  
  if (user.role !== 'admin') {
    return <Navigate to="/" />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Header />
          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Routes>
              {/* User routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <ProfilePage />
                  </PrivateRoute>
                }
              />
              <Route path="/category/:categoryId" element={<CategoryPage />} />
              <Route path="/category/:categoryId/:subcategoryId" element={<CategoryPage />} />
              <Route path="/post/:id" element={<PostDetailPage />} />
              <Route path="/user/:id" element={<ProfilePage />} />

              {/* Admin routes */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <AdminRoute>
                    <AdminUsers />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/categories"
                element={
                  <AdminRoute>
                    <AdminCategories />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/posts"
                element={
                  <AdminRoute>
                    <AdminPosts />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/pinned-messages"
                element={
                  <AdminRoute>
                    <AdminPinnedMessages />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/homepage"
                element={
                  <AdminRoute>
                    <AdminHomepageSettings />
                  </AdminRoute>
                }
              />
            </Routes>
          </motion.main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

