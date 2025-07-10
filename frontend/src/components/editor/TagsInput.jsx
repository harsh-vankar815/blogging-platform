import { useState, useRef, useEffect } from 'react';
import { FiX } from 'react-icons/fi';

const TagsInput = ({ value = [], onChange, maxTags = 10, error }) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  const addTag = () => {
    const tag = inputValue.trim().toLowerCase();
    
    if (tag && !value.includes(tag) && value.length < maxTags) {
      onChange([...value, tag]);
      setInputValue('');
    }
  };

  const removeTag = (index) => {
    const newTags = [...value];
    newTags.splice(index, 1);
    onChange(newTags);
  };

  useEffect(() => {
    // Focus input when tags change
    if (inputRef.current && value.length < maxTags) {
      inputRef.current.focus();
    }
  }, [value, maxTags]);

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Tags
      </label>
      <div
        className={`flex flex-wrap gap-2 p-2 border rounded-md bg-white dark:bg-gray-800 
          ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
      >
        {value.map((tag, index) => (
          <div
            key={index}
            className="flex items-center bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 px-2 py-1 rounded-md"
          >
            <span className="text-sm mr-1">{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200"
            >
              <FiX size={14} />
            </button>
          </div>
        ))}
        
        {value.length < maxTags && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={addTag}
            placeholder={value.length === 0 ? "Add tags (press Enter)" : ""}
            className="flex-grow min-w-[120px] bg-transparent border-none outline-none text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-600"
          />
        )}
      </div>
      
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {`${value.length}/${maxTags} tags - Press Enter or comma to add`}
      </p>
      
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-500">
          {error}
        </p>
      )}
    </div>
  );
};

export default TagsInput; 