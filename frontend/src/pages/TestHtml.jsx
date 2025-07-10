import React from 'react';
import DOMPurify from 'dompurify';

const TestHtml = () => {
  const htmlContent = "<p>Hello my friend how all are you.</p>";
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">HTML Content Test</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Raw HTML String:</h2>
        <pre className="bg-gray-100 p-4 rounded">{htmlContent}</pre>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Using dangerouslySetInnerHTML:</h2>
        <div 
          className="bg-white border p-4 rounded"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlContent) }}
        />
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Using div with innerHTML:</h2>
        <div 
          className="bg-white border p-4 rounded"
          ref={(el) => {
            if (el) el.innerHTML = DOMPurify.sanitize(htmlContent);
          }}
        />
      </div>
    </div>
  );
};

export default TestHtml; 