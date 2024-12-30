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
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Client Forms</h1>
        <button
          onClick={onAdd}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#5861c5] hover:bg-[#4951b5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5861c5]"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Form
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Business Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Slug
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {forms.map((form) => (
              <tr key={form.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {form.businessName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {form.slug}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(form.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <FormActions
                    id={form.id}
                    slug={form.slug}
                    onEdit={() => onEdit(form)}
                    onDelete={() => onDelete(form.id)}
                    onDuplicate={() => onDuplicate(form)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}