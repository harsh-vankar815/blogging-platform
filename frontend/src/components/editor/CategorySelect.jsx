import { useState, useEffect } from 'react';
import postsService from '../../services/postsService';

const CATEGORIES = [
  'Technology', 'Lifestyle', 'Travel', 'Food', 'Health', 
  'Business', 'Education', 'Entertainment', 'Sports', 'Other'
];

const CategorySelect = ({ value, onChange, error }) => {
  const [categories, setCategories] = useState(CATEGORIES);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await postsService.getCategories();
        
        // If we have categories from the API with counts, use those
        if (response && response.length > 0) {
          // Extract just the category names and add any missing default categories
          const apiCategories = response.map(cat => cat.category);
          const allCategories = [...new Set([...apiCategories, ...CATEGORIES])];
          setCategories(allCategories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Category
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
          ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}
          focus:outline-none focus:ring-2 focus:ring-primary-500`}
        disabled={loading}
      >
        <option value="">Select a category</option>
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
      
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-500">
          {error}
        </p>
      )}
    </div>
  );
};

export default CategorySelect; 