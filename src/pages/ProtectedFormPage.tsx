import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import ProtectedFormView from '../components/admin/ProtectedFormView';
import AuthGuard from '../components/AuthGuard';

export default function ProtectedFormPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<{
    slug: string;
    businessName: string;
    webhookUrl: string;
  } | null>(null);

  useEffect(() => {
    async function loadForm() {
      try {
        const { data, error } = await supabase
          .from('client_forms')
          .select('slug, business_name, webhook_url')
          .eq('slug', slug)
          .single();

        if (error) throw error;
        
        if (!data) {
          navigate('/admin');
          return;
        }

        setFormData({
          slug: data.slug,
          businessName: data.business_name,
          webhookUrl: data.webhook_url
        });
      } catch (error) {
        console.error('Error loading form:', error);
        navigate('/admin');
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      loadForm();
    }
  }, [slug, navigate]);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 py-12">
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5861c5]"></div>
          </div>
        ) : formData ? (
          <ProtectedFormView
            slug={formData.slug}
            businessName={formData.businessName}
            webhookUrl={formData.webhookUrl}
          />
        ) : null}
      </div>
    </AuthGuard>
  );
} 