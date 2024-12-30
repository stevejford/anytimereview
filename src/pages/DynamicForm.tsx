import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import ClientForm from '../components/ClientForm';
import { ClientForm as ClientFormType } from '../types/form-management';

export default function DynamicForm() {
  const { slug } = useParams<{ slug: string }>();
  const [form, setForm] = useState<ClientFormType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadForm();
  }, [slug]);

  const loadForm = async () => {
    try {
      const { data, error } = await supabase
        .from('client_forms')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      setForm(data);
    } catch (error) {
      setError('Form not found');
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
    <div className="max-w-4xl mx-auto p-4">
      <ClientForm
        webhookUrl={form.webhookUrl}
        businessName={form.businessName}
      />
    </div>
  );
}