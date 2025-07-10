import { useRef, useMemo, useCallback, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import DOMPurify from 'dompurify';
import api from '@services/api';

// Simplified RichTextEditor component
const RichTextEditor = ({ value, onChange, placeholder = 'Write something amazing...' }) => {
  const quillRef = useRef(null);

  // Image upload handler
  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      try {
        const file = input.files[0];
        if (!file) return;

        // Create form data
        const formData = new FormData();
        formData.append('image', file);

        // Upload to server
        const response = await api.post('/upload/post-image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        // Validate the response
        if (!response || !response.url) {
          console.error('Invalid image upload response:', response);
          throw new Error('Invalid response from server');
        }

        // Insert the image into the editor
        if (quillRef.current) {
          const quill = quillRef.current.getEditor();
          const range = quill.getSelection(true);
          quill.insertEmbed(range.index, 'image', response.url);
          quill.setSelection(range.index + 1);
        }
      } catch (error) {
        console.error('Image upload error:', error);
        alert('Failed to upload image. Please try again.');
      }
    };
  }, []);

  // Define the modules configuration
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ indent: '-1' }, { indent: '+1' }],
        [{ align: [] }],
        ['link', 'image'],
        ['clean'],
        [{ color: [] }, { background: [] }],
        ['blockquote', 'code-block'],
      ],
      handlers: {
        image: imageHandler,
      },
    },
    clipboard: {
      matchVisual: false,
    },
  }), [imageHandler]);

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'indent',
    'align',
    'link', 'image',
    'color', 'background',
    'blockquote', 'code-block',
  ];

  const handleChange = (content) => {
    // Sanitize content to prevent XSS attacks
    const sanitizedContent = DOMPurify.sanitize(content);
    onChange(sanitizedContent);
  };

  // Add custom CSS to fix any styling issues
  useEffect(() => {
    // Add custom CSS for better Quill styling
    const style = document.createElement('style');
    style.innerHTML = `
      .ql-editor {
        min-height: 250px;
        font-family: inherit;
      }
      .ql-container {
        border-bottom-left-radius: 0.375rem;
        border-bottom-right-radius: 0.375rem;
      }
      .ql-toolbar {
        border-top-left-radius: 0.375rem;
        border-top-right-radius: 0.375rem;
      }
      .ql-container.ql-snow, .ql-toolbar.ql-snow {
        border-color: #d1d5db;
      }
      .dark .ql-container.ql-snow, .dark .ql-toolbar.ql-snow {
        border-color: #4b5563;
      }
      .dark .ql-toolbar .ql-stroke {
        stroke: #e5e7eb;
      }
      .dark .ql-toolbar .ql-fill {
        fill: #e5e7eb;
      }
      .dark .ql-toolbar .ql-picker {
        color: #e5e7eb;
      }
      .dark .ql-editor.ql-blank::before {
        color: #9ca3af;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="rich-text-editor">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value || ''}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="bg-white dark:bg-gray-800 rounded-md"
      />
    </div>
  );
};

export default RichTextEditor; 