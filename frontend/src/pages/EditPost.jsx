import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import PostForm from '../components/editor/PostForm';
import postsService from '../services/postsService';
import usePermissions from '../hooks/usePermissions';
import SkeletonLoader from '../components/ui/SkeletonLoader';

const EditPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      toast.error('You must be logged in to edit posts');
      navigate('/login?redirect=/edit-post/' + id);
      return;
    }

    const fetchPost = async () => {
      try {
        setLoading(true);
        const response = await postsService.getPostById(id);
        const fetchedPost = response.post;
        
        // Check if user is author
        const isAuthor = fetchedPost.author._id === user._id;
        
        if (!isAuthor && user.role !== 'admin') {
          toast.error('You do not have permission to edit this post');
          navigate('/blog');
          return;
        }
        
        setPost(fetchedPost);
      } catch (error) {
        console.error('Error fetching post:', error);
        setError(error.response?.data?.message || 'Failed to fetch post');
        toast.error('Failed to fetch post');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && id) {
      fetchPost();
    }
  }, [id, isAuthenticated, navigate, user]);

  // Check if user is the creator of this post
  useEffect(() => {
    if (post && user) {
      // Get author ID as string
      const authorId = typeof post.author === 'object' ? post.author._id : post.author;
      const userId = user._id;
      
      // Check if the current user created this post
      const isCreator = userId === authorId;
      
      console.log('Edit post - creator check:', {
        postId: post._id,
        authorId,
        userId,
        isCreator
      });
      
      // If not the creator, redirect to the post view
      if (!isCreator) {
        toast.error('You can only edit your own posts');
        navigate(`/post/${id}`);
      }
    }
  }, [post, user, id, navigate]);

  if (loading) {
    return (
      <div className="container-custom py-12">
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-8">
          Edit Post
        </h1>
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          <div className="space-y-6">
            <SkeletonLoader variant="text" width="3/4" height="40px" />
            <SkeletonLoader variant="rectangle" height="200px" />
            <SkeletonLoader variant="text" width="1/2" />
            <SkeletonLoader variant="text" width="full" />
            <SkeletonLoader variant="text" width="full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-custom py-12">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md text-red-600 dark:text-red-400">
          {error}
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Edit Post - MERN Blog Platform</title>
        <meta name="description" content="Edit your blog post" />
      </Helmet>

      <div className="container-custom py-12">
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-8">
          Edit Post
        </h1>
        
        {post ? (
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
            <PostForm post={post} isEdit={true} />
          </div>
        ) : (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md text-yellow-600 dark:text-yellow-400">
            Post not found
          </div>
        )}
      </div>
    </>
  );
};

export default EditPost;
