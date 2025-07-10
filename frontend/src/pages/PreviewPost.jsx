import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import DOMPurify from 'dompurify';
import PostContent from '@components/blog/PostContent';

const PreviewPost = () => {
  const navigate = useNavigate();
  const [post, setPost] = useState(null);

  useEffect(() => {
    // Get preview data from localStorage
    const previewData = localStorage.getItem('post-preview');
    
    if (!previewData) {
      navigate('/');
      return;
    }
    
    try {
      const parsedData = JSON.parse(previewData);
      setPost({
        ...parsedData,
        createdAt: new Date().toISOString(),
        author: {
          firstName: 'You',
          lastName: '(Preview)',
          avatar: '',
        },
      });
    } catch (error) {
      console.error('Error parsing preview data:', error);
      navigate('/');
    }
  }, [navigate]);

  if (!post) {
    return (
      <div className="container-custom py-12 flex justify-center">
        <div className="animate-pulse">Loading preview...</div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{post.title} (Preview) - MERN Blog Platform</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="container-custom py-12">
        {/* Preview Banner */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 p-4 rounded-md mb-8 flex items-center justify-between">
          <div>
            <span className="font-bold">Preview Mode</span> - This is a preview of your post. It has not been saved yet.
          </div>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
          >
            Back to Editor
          </button>
        </div>

        {/* Post Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {post.title}
          </h1>
          
          <div className="flex items-center text-gray-600 dark:text-gray-400 mb-6">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 mr-3">
                {post.author.firstName.charAt(0)}
              </div>
              <div>
                <p className="font-medium">{`${post.author.firstName} ${post.author.lastName}`}</p>
                <p className="text-sm">
                  {format(new Date(post.createdAt), 'MMM d, yyyy')}
                  {post.category && ` · ${post.category}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Image */}
        {post.featuredImage && (
          <div className="mb-8">
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full h-auto max-h-[500px] object-cover rounded-lg"
            />
          </div>
        )}

        {/* Content */}
        <PostContent content={post.content} />

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default PreviewPost; 