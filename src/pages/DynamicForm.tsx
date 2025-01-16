import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import PublicForm from '../components/PublicForm';
import { ClientForm as ClientFormType } from '../types/form-management';

export default function DynamicForm() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<ClientFormType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadForm();
  }, [slug]);

  const loadForm = async () => {
    if (!slug) {
      setError('Form not found');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('client_forms')
        .select('business_name, webhook_url')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      
      if (!data) {
        setError('Form not found');
        return;
      }

      setForm({
        businessName: data.business_name,
        webhookUrl: data.webhook_url,
        slug
      } as ClientFormType);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Form not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (error || !form) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return (
    <PublicForm
      slug={slug}
      businessName={form.businessName}
      webhookUrl={form.webhookUrl}
    />
  );
}