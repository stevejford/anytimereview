import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import FormsList from '../components/admin/FormsList';
import FormEditor from '../components/admin/FormEditor';
import AuthGuard from '../components/AuthGuard';
import { ClientForm } from '../types/form-management';
import { formatBusinessName } from '../utils/slug';

export default function AdminDashboard() {
  const [forms, setForms] = useState<ClientForm[]>([]);
  const [selectedForm, setSelectedForm] = useState<ClientForm | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      const { data, error } = await supabase
        .from('client_forms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Format the business names in the response
      const formattedData = (data || []).map(form => ({
        ...form,
        businessName: formatBusinessName(form.business_name),
        webhookUrl: form.webhook_url,
        createdAt: form.created_at,
        updatedAt: form.updated_at
      }));
      
      setForms(formattedData);
    } catch (error) {
      console.error('Error loading forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData: Omit<ClientForm, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const formattedBusinessName = formatBusinessName(formData.businessName);
      
      if (selectedForm) {
        const { error } = await supabase
          .from('client_forms')
          .update({
            business_name: formattedBusinessName,
            webhook_url: formData.webhookUrl,
            slug: formData.slug,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedForm.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('client_forms')
          .insert([{
            business_name: formattedBusinessName,
            webhook_url: formData.webhookUrl,
            slug: formData.slug,
          }]);

        if (error) throw error;
      }

      await loadForms();
      setIsEditorOpen(false);
      setSelectedForm(null);
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthGuard>
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5861c5]"></div>
          </div>
        ) : (
          <FormsList
            forms={forms}
            onEdit={(form) => {
              setSelectedForm(form);
              setIsEditorOpen(true);
            }}
            onDelete={async (id) => {
              if (window.confirm('Are you sure you want to delete this form?')) {
                await supabase.from('client_forms').delete().eq('id', id);
                await loadForms();
              }
            }}
            onDuplicate={async (form) => {
              const newForm = {
                business_name: `${formatBusinessName(form.businessName)} (Copy)`,
                webhook_url: form.webhookUrl,
                slug: `${form.slug}-copy`,
              };
              await supabase.from('client_forms').insert([newForm]);
              await loadForms();
            }}
            onAdd={() => {
              setSelectedForm(null);
              setIsEditorOpen(true);
            }}
          />
        )}
        
        {isEditorOpen && (
          <FormEditor
            form={selectedForm || undefined}
            onSave={handleSave}
            onClose={() => {
              setIsEditorOpen(false);
              setSelectedForm(null);
            }}
          />
        )}
      </div>
    </AuthGuard>
  );
}