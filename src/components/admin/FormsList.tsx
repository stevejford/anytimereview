import React from 'react';
import { Plus } from 'lucide-react';
import { ClientForm } from '../../types/form-management';
import FormActions from './FormActions';
import { formatDate } from '../../utils/date';

interface FormsListProps {
  forms: ClientForm[];
  onEdit: (form: ClientForm) => void;
  onDelete: (id: string) => void;
  onDuplicate: (form: ClientForm) => void;
  onAdd: () => void;
}

export default function FormsList({
  forms,
  onEdit,
  onDelete,
  onDuplicate,
  onAdd,
}: FormsListProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-6 sm:p-8 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Client Forms
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your customer information forms and view their submissions.
            </p>
          </div>
          <button
            onClick={onAdd}
            className="inline-flex items-center justify-center px-4 py-2 bg-[#5861c5] text-white rounded-xl font-medium hover:bg-[#4951b5] transition-all duration-200 shadow-sm hover:shadow-md group"
          >
            <Plus className="w-5 h-5 mr-1.5 transition-transform group-hover:scale-110" />
            New Form
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Business Name
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Slug
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {forms.map((form) => (
              <tr 
                key={form.id} 
                className="group hover:bg-gray-50/50 transition-colors duration-150"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="font-medium text-gray-900">{form.businessName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500 font-mono">{form.slug}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{formatDate(form.createdAt)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <FormActions
                    id={form.id}
                    slug={form.slug}
                    businessName={form.businessName}
                    webhookUrl={form.webhookUrl}
                    onEdit={() => onEdit(form)}
                    onDelete={() => onDelete(form.id)}
                    onDuplicate={() => onDuplicate(form)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {forms.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">No forms created yet.</p>
            <button
              onClick={onAdd}
              className="mt-4 inline-flex items-center justify-center px-4 py-2 bg-[#5861c5] text-white rounded-xl font-medium hover:bg-[#4951b5] transition-all duration-200 shadow-sm hover:shadow-md group"
            >
              <Plus className="w-5 h-5 mr-1.5 transition-transform group-hover:scale-110" />
              Create your first form
            </button>
          </div>
        )}
      </div>
    </div>
  );
}