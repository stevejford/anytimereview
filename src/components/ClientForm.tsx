import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { validateEmail, validatePhone, formatPhoneNumber } from '../utils/validation';
import { addToHistory } from '../utils/storage';
import History from './History';
import { User, Phone, Mail, Send, Clock, Copy, CheckCircle2 } from 'lucide-react';

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

export default function ClientForm({ slug, webhookUrl: propWebhookUrl, businessName }: Props) {
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [webhookUrl, setWebhookUrl] = useState<string | null>(propWebhookUrl || null);
  const [localBusinessName, setBusinessName] = useState<string | undefined>(businessName);

  useEffect(() => {
    async function fetchFormDetails() {
      if (propWebhookUrl || !slug) return;
      try {
        const { data, error } = await supabase
          .from('client_forms')
          .select('webhook_url, business_name')
          .eq('slug', slug)
          .single();

        if (error) throw error;
        setWebhookUrl(data.webhook_url);
        if (!businessName) {
          setBusinessName(data.business_name);
        }
      } catch (error) {
        console.error('Error fetching form details:', error);
      }
    }

    fetchFormDetails();
  }, [slug, propWebhookUrl, businessName]);

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>, isResend = false) => {
    e.preventDefault();
    
    if (!isResend && !validateForm()) {
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

      if (!isResend) {
        addToHistory(formData);
      }
      
      setSubmitStatus('success');
      
      if (!isResend) {
        setFormData({ name: '', phone: '', email: '' });
      }
    } catch (error) {
      console.error('Error sending webhook:', error);
      setSubmitStatus('error');
    }
  };

  const handleEdit = (client: FormData) => {
    setFormData(client);
    setActiveTab('form');
  };

  const handleResend = async (client: FormData) => {
    setFormData(client);
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>;
    await handleSubmit(fakeEvent, true);
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('form')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'form'
                ? 'bg-[#5861c5] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Form
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'history'
                ? 'bg-[#5861c5] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            History
          </button>
        </div>
      </div>

      {activeTab === 'form' ? (
        <>
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
        </>
      ) : (
        <History onEdit={handleEdit} onResend={handleResend} />
      )}
    </div>
  );
}