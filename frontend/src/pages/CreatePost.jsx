import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PostForm from '@components/editor/PostForm';
import { useAuth } from '@hooks/useAuth';

const CreatePost = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, canCreatePosts } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated and has permission to create posts
    if (!isAuthenticated) {
      navigate('/login?redirect=/create-post');
      return;
    }

    // Simple permission check
    if (!canCreatePosts) {
        navigate('/');
      return;
      }
      
      setLoading(false);
  }, [isAuthenticated, navigate, canCreatePosts]);

  if (loading) {
    return (
      <div className="container-custom py-12 flex justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Create Post - MERN Blog Platform</title>
        <meta name="description" content="Create a new blog post" />
      </Helmet>

      <div className="container-custom py-12">
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-8">
          Create New Post
        </h1>
        
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          <PostForm />
        </div>
      </div>
    </>
  );
};

export default CreatePost;
