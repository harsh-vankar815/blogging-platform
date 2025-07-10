import React from 'react';

/**
 * FormInput component for consistent form inputs with icons and error handling
 * @param {Object} props - Component props
 * @param {string} props.id - Input ID
 * @param {string} props.name - Input name
 * @param {string} props.type - Input type (text, email, password, etc.)
 * @param {string} props.label - Input label
 * @param {string} props.value - Input value
 * @param {Function} props.onChange - Change handler function
 * @param {string} props.error - Error message
 * @param {React.ComponentType} props.icon - Icon component to display
 * @param {string} props.autoComplete - Autocomplete attribute
 * @param {boolean} props.required - Whether the input is required
 * @returns {JSX.Element} FormInput component
 */
const FormInput = ({
  id,
  name,
  type = 'text',
  label,
  value,
  onChange,
  error,
  icon: Icon,
  autoComplete,
  required = false,
  ...rest
}) => {
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-secondary-400" />
          </div>
        )}
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required={required}
          className={`block w-full ${
            Icon ? 'pl-10' : 'pl-3'
          } pr-3 py-2 border ${
            error
              ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
              : 'border-secondary-300 dark:border-secondary-700 placeholder-secondary-400 focus:ring-primary-500 focus:border-primary-500'
          } rounded-md shadow-sm bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white`}
          placeholder={label}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : undefined}
          {...rest}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
};

export default FormInput; 