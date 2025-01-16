import { useState } from 'react';
import { User, Phone, Mail, Send, CheckCircle2 } from 'lucide-react';
import { validateEmail, validatePhone, formatPhoneNumber } from '../utils/validation';
import { addToHistory } from '../utils/storage';

interface Props {
  slug?: string;
  webhookUrl?: string;
  businessName?: string;
}

interface FormData {
  name: string;
  phone: string;
  email: string;
}

export default function PublicForm({ slug, webhookUrl, businessName }: Props) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      setFormData(prev => ({ ...prev, [name]: formatPhoneNumber(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors: Partial<FormData> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Invalid phone number';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!webhookUrl) {
      console.error('No webhook URL configured');
      setSubmitStatus('error');
      return;
    }

    setSubmitStatus('loading');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('phone', formData.phone.replace(/\D/g, ''));
      formDataToSend.append('email', formData.email);

      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        body: formDataToSend,
      });

      addToHistory(formData);
      setSubmitStatus('success');
      setFormData({ name: '', phone: '', email: '' });
    } catch (error) {
      console.error('Error sending webhook:', error);
      setSubmitStatus('error');
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900/95 to-gray-800/95 flex items-center justify-center">
      <div className="w-full max-w-xl py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-8">
          {/* Welcome Message */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Welcome to {businessName || 'Our Business'}
            </h1>
            <p className="text-gray-600 text-lg">
              We'd love to hear from you! Please fill out the form below and we'll respond as soon as possible.
            </p>
          </div>

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 text-[#5861c5] mr-2" />
                Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#5861c5] focus:ring-2 focus:ring-[#5861c5]/20 transition-all placeholder:text-gray-400 text-gray-900 hover:border-[#5861c5]/50"
                />
                <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              {errors.name && (
                <p className="mt-2 text-sm text-red-500 flex items-center">
                  <span className="mr-1">•</span> {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 text-[#5861c5] mr-2" />
                Phone
              </label>
              <div className="relative">
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="(555) 555-5555"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#5861c5] focus:ring-2 focus:ring-[#5861c5]/20 transition-all placeholder:text-gray-400 text-gray-900 hover:border-[#5861c5]/50"
                />
                <Phone className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              {errors.phone && (
                <p className="mt-2 text-sm text-red-500 flex items-center">
                  <span className="mr-1">•</span> {errors.phone}
                </p>
              )}
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 text-[#5861c5] mr-2" />
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#5861c5] focus:ring-2 focus:ring-[#5861c5]/20 transition-all placeholder:text-gray-400 text-gray-900 hover:border-[#5861c5]/50"
                />
                <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-500 flex items-center">
                  <span className="mr-1">•</span> {errors.email}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitStatus === 'loading'}
              className="w-full bg-[#5861c5] text-white py-3.5 px-6 rounded-xl font-semibold hover:bg-[#4850b0] focus:outline-none focus:ring-2 focus:ring-[#5861c5]/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-lg shadow-sm hover:shadow-md"
            >
              {submitStatus === 'loading' ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit
                </>
              )}
            </button>
          </form>

          {/* Success Message */}
          {submitStatus === 'success' && (
            <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-100">
              <div className="flex">
                <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-green-800">
                    Submission Successful
                  </h3>
                  <p className="mt-1 text-sm text-green-700">
                    Thank you for your submission. We'll be in touch shortly!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 