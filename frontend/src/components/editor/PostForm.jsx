import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { FiSave, FiEye, FiTrash2 } from 'react-icons/fi';

import RichTextEditor from './RichTextEditor';
import CoverImageUpload from './CoverImageUpload';
import TagsInput from './TagsInput';
import CategorySelect from './CategorySelect';
import postsService from '@services/postsService';
import { slugify } from '@utils/helpers';

const PostForm = ({ post = null, isEdit = false }) => {
  const navigate = useNavigate();
  const [content, setContent] = useState(post?.content || '');
  const [featuredImage, setFeaturedImage] = useState(post?.featuredImage || '');
  const [tags, setTags] = useState(post?.tags || []);
  const [status, setStatus] = useState(post?.status || 'draft');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    defaultValues: {
      title: post?.title || '',
      category: post?.category || '',
      excerpt: post?.excerpt || '',
      status: post?.status || 'draft',
    }
  });

  // Watch form values for validation
  const title = watch('title');
  const category = watch('category');

  useEffect(() => {
    // Register custom form fields
    register('content', { required: 'Content is required' });
    register('tags');
    register('featuredImage');
  }, [register]);

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      
      // Generate slug from title if creating a new post
      const postData = {
        ...data,
        content,
        tags,
        featuredImage,
        status,
      };

      // Generate slug from title if not editing
      if (!isEdit) {
        postData.slug = slugify(data.title);
      }

      let response;
      if (isEdit && post?._id) {
        response = await postsService.updatePost(post._id, postData);
        toast.success('Post updated successfully!');
      } else {
        response = await postsService.createPost(postData);
        toast.success('Post created successfully!');
      }

      // Navigate to the post or dashboard
      if (response?.post?.slug) {
        navigate(`/blog/${response.post.slug}`);
      } else if (response?.slug) {
        navigate(`/blog/${response.slug}`);
      } else {
        // Fallback if we don't have a slug or ID
        navigate('/blog');
      }
    } catch (error) {
      console.error('Error saving post:', error);
      toast.error(error.response?.data?.message || 'Failed to save post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!post?._id) return;

    try {
      setIsSubmitting(true);
      await postsService.deletePost(post._id);
      toast.success('Post deleted successfully');
      navigate('/blog');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error(error.response?.data?.message || 'Failed to delete post');
    } finally {
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handlePreview = () => {
    // Store draft in localStorage for preview
    const previewData = {
      title: watch('title'),
      content,
      featuredImage,
      tags,
      category: watch('category'),
      excerpt: watch('excerpt'),
      status: 'preview',
      previewId: Date.now().toString(),
    };

    localStorage.setItem('post-preview', JSON.stringify(previewData));
    window.open('/preview', '_blank');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Title */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Title
        </label>
        <input
          type="text"
          {...register('title', {
            required: 'Title is required',
            maxLength: { value: 200, message: 'Title cannot exceed 200 characters' }
          })}
          className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
            ${errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}
            focus:outline-none focus:ring-2 focus:ring-primary-500`}
          placeholder="Enter post title"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-500">
            {errors.title.message}
          </p>
        )}
      </div>

      {/* Cover Image */}
      <CoverImageUpload
        value={featuredImage}
        onChange={setFeaturedImage}
        error={errors.featuredImage?.message}
      />

      {/* Category */}
      <CategorySelect
        value={category}
        onChange={(value) => setValue('category', value)}
        error={errors.category?.message}
      />

      {/* Tags */}
      <TagsInput
        value={tags}
        onChange={setTags}
        error={errors.tags?.message}
      />

      {/* Content Editor */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Content
        </label>
        <RichTextEditor
          value={content}
          onChange={(value) => {
            setContent(value);
            setValue('content', value, { shouldValidate: true });
          }}
        />
        {errors.content && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-500">
            {errors.content.message}
          </p>
        )}
      </div>

      {/* Excerpt */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Excerpt (optional)
        </label>
        <textarea
          {...register('excerpt', {
            maxLength: { value: 500, message: 'Excerpt cannot exceed 500 characters' }
          })}
          className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          rows={3}
          placeholder="Brief summary of your post (will be auto-generated if left empty)"
        />
        {errors.excerpt && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-500">
            {errors.excerpt.message}
          </p>
        )}
      </div>

      {/* Status and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <input
              type="radio"
              id="draft"
              value="draft"
              checked={status === 'draft'}
              onChange={() => setStatus('draft')}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-700"
            />
            <label htmlFor="draft" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Save as Draft
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="radio"
              id="published"
              value="published"
              checked={status === 'published'}
              onChange={() => setStatus('published')}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-700"
            />
            <label htmlFor="published" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Publish Now
            </label>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {isEdit && (
            <>
              {showDeleteConfirm ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-red-600 dark:text-red-500">Confirm delete?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                    disabled={isSubmitting}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm rounded-md hover:bg-gray-400 dark:hover:bg-gray-500"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center px-4 py-2 border border-red-600 text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                  disabled={isSubmitting}
                >
                  <FiTrash2 className="mr-2" />
                  Delete
                </button>
              )}
            </>
          )}

          <button
            type="button"
            onClick={handlePreview}
            className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
            disabled={!title || !content || isSubmitting}
          >
            <FiEye className="mr-2" />
            Preview
          </button>

          <button
            type="submit"
            className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            <FiSave className="mr-2" />
            {isSubmitting ? 'Saving...' : isEdit ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default PostForm; 