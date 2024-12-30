import React from 'react';

interface FormInputProps {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  placeholder?: string;
}

export default function FormInput({
  id,
  label,
  type,
  value,
  onChange,
  error,
  placeholder
}: FormInputProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-base sm:text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <input
        type={type}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full px-4 py-3 text-base sm:text-sm border rounded-lg shadow-sm focus:ring-2 focus:ring-[#5861c5] focus:border-[#5861c5] ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      />
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}