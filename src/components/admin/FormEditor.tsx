import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ClientForm } from '../../types/form-management';
import { createSlug, validateWebhookUrl, formatBusinessName } from '../../utils/slug';

interface FormEditorProps {
  form?: ClientForm;
  onSave: (formData: Omit<ClientForm, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onClose: () => void;
}

export default function FormEditor({ form, onSave, onClose }: FormEditorProps) {
  const [formData, setFormData] = useState({
    businessName: form?.businessName || '',
    webhookUrl: form?.webhookUrl || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }

    if (!formData.webhookUrl.trim()) {
      newErrors.webhookUrl = 'Webhook URL is required';
    } else if (!validateWebhookUrl(formData.webhookUrl)) {
      newErrors.webhookUrl = 'Please enter a valid HTTPS URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBusinessNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedName = formatBusinessName(e.target.value);
    setFormData(prev => ({ ...prev, businessName: formattedName }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedName = formatBusinessName(formData.businessName);
      await onSave({
        businessName: formattedName,
        webhookUrl: formData.webhookUrl,
        slug: createSlug(formattedName),
      });
      onClose();
    } catch (error) {
      console.error('Error saving form:', error);
      setErrors({ submit: 'Failed to save form. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {form ? 'Edit Form' : 'New Form'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
              Business Name
            </label>
            <input
              type="text"
              id="businessName"
              value={formData.businessName}
              onChange={handleBusinessNameChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#5861c5] focus:ring-[#5861c5] sm:text-sm ${
                errors.businessName ? 'border-red-500' : ''
              }`}
            />
            {errors.businessName && (
              <p className="mt-1 text-sm text-red-600">{errors.businessName}</p>
            )}
          </div>

          <div>
            <label htmlFor="webhookUrl" className="block text-sm font-medium text-gray-700">
              Webhook URL
            </label>
            <input
              type="url"
              id="webhookUrl"
              value={formData.webhookUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, webhookUrl: e.target.value }))}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#5861c5] focus:ring-[#5861c5] sm:text-sm ${
                errors.webhookUrl ? 'border-red-500' : ''
              }`}
            />
            {errors.webhookUrl && (
              <p className="mt-1 text-sm text-red-600">{errors.webhookUrl}</p>
            )}
          </div>

          {errors.submit && (
            <p className="text-sm text-red-600">{errors.submit}</p>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5861c5]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#5861c5] hover:bg-[#4951b5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5861c5] disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}