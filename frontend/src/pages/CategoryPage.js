import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import InfiniteScroll from 'react-infinite-scroll-component';
import api from '../services/api';
import BackgroundSlider from '../components/BackgroundSlider';
import PostCard from '../components/PostCard';
import CreatePostModal from '../components/CreatePostModal';
import { useAuth } from '../hooks/useAuth';
import './CategoryPage.css';

const CategoryPage = () => {
  const { categoryId, subcategoryId } = useParams();
  const { user } = useAuth();
  const [category, setCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const limit = 20;

  useEffect(() => {
    loadCategory();
    loadPosts(true);
  }, [categoryId, subcategoryId]);

  const loadCategory = async () => {
    try {
      const [categoryRes, categoriesRes] = await Promise.all([
        api.get(`/categories/${categoryId}`),
        api.get('/categories')
      ]);
      setCategory(categoryRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error loading category:', error);
    }
  };

  const loadPosts = async (reset = false) => {
    try {
      const currentOffset = reset ? 0 : offset;
      const params = { category_id: categoryId, limit, offset: currentOffset };
      if (subcategoryId) {
        params.subcategory_id = subcategoryId;
      }

      const response = await api.get('/posts', { params });
      const newPosts = response.data;

      if (reset) {
        setPosts(newPosts);
        setOffset(limit);
      } else {
        setPosts([...posts, ...newPosts]);
        setOffset(offset + limit);
      }

      setHasMore(newPosts.length === limit);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = () => {
    loadPosts(true);
  };

  if (loading && posts.length === 0) {
    return <div className="loading">Chargement...</div>;
  }

  const backgroundImages = category?.background_images || [];

  return (
    <div className="category-page">
      <BackgroundSlider images={backgroundImages} interval={5000} blur={true} />
      <div className="category-content">
        {category && (
          <motion.div
            className="category-header"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="category-header-top">
              <h1>{category.name}</h1>
              {user && (
                <motion.button
                  className="create-post-button"
                  onClick={() => setShowCreateModal(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  + Publier
                </motion.button>
              )}
            </div>
            {category.subcategories && category.subcategories.length > 0 && (
              <div className="subcategories-nav">
                {category.subcategories.map((sub) => (
                  <a
                    key={sub.id}
                    href={`/category/${categoryId}/${sub.id}`}
                    className={`subcategory-link ${subcategoryId == sub.id ? 'active' : ''}`}
                  >
                    {sub.name}
                  </a>
                ))}
              </div>
            )}
          </motion.div>
        )}

        <CreatePostModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          categories={categories}
          onPostCreated={handlePostCreated}
        />

        <InfiniteScroll
          dataLength={posts.length}
          next={() => loadPosts(false)}
          hasMore={hasMore}
          loader={<div className="loading">Chargement...</div>}
          className="posts-grid"
        >
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </InfiniteScroll>

        {posts.length === 0 && !loading && (
          <div className="empty-state">
            <p>Aucune publication dans cette catégorie</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;

