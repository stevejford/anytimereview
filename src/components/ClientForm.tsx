import React, { useState } from 'react';
import { WEBHOOK_URL } from '../config/constants';
import { ClientFormData, FormErrors } from '../types/form';
import { validateEmail, validatePhone, formatPhoneNumber } from '../utils/validation';
import { addToHistory } from '../utils/storage';
import FormInput from './FormInput';
import StatusMessage from './StatusMessage';

export default function ClientForm() {
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    phone: '',
    email: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid Australian phone number';
    }
    if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    const formDataObj = new FormData();
    formDataObj.append('name', formData.name);
    formDataObj.append('phone', formData.phone);
    formDataObj.append('email', formData.email);

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        body: formDataObj,
      });

      if (!response.ok) {
        throw new Error('Submission failed');
      }

      addToHistory({
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
      });

      setSubmitStatus('success');
      setFormData({ name: '', phone: '', email: '' });
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-[#5861c5] text-white p-6 sm:p-8">
        <h2 className="text-2xl sm:text-3xl font-semibold">Review Management Software</h2>
        <p className="text-white/90 text-base sm:text-lg mt-2">Enter client details below</p>
      </div>

      <div className="p-6 sm:p-8">
        {submitStatus && (
          <StatusMessage 
            type={submitStatus} 
            message={submitStatus === 'success' 
              ? 'Client registered successfully!' 
              : 'An error occurred. Please try again.'
            }
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <FormInput
            id="name"
            label="Full Name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            error={errors.name}
            placeholder="John Smith"
          />

          <FormInput
            id="phone"
            label="Phone Number"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: formatPhoneNumber(e.target.value) }))}
            error={errors.phone}
            placeholder="+61 4 XXXX XXXX"
          />

          <FormInput
            id="email"
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            error={errors.email}
            placeholder="john@example.com"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#5861c5] text-white py-3 sm:py-4 px-6 rounded-lg text-base sm:text-lg font-medium hover:bg-[#4951b5] focus:outline-none focus:ring-2 focus:ring-[#5861c5] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Submitting...' : 'Register Client'}
          </button>
        </form>
      </div>
    </div>
  );
}