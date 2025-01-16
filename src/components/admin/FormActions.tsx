import React from 'react';
import { Link } from 'react-router-dom';
import { Copy, Edit, Trash2, FileText } from 'lucide-react';

interface FormActionsProps {
  id: string;
  slug: string;
  businessName: string;
  webhookUrl: string;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export default function FormActions({
  id,
  slug,
  businessName,
  webhookUrl,
  onEdit,
  onDelete,
  onDuplicate,
}: FormActionsProps) {
  const actionButtonClass = "inline-flex items-center justify-center p-2 text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 transition-all duration-200 group";
  const iconClass = "w-5 h-5 transition-transform group-hover:scale-110";

  return (
    <div className="flex items-center justify-end gap-2">
      <Link
        to={`/admin/forms/${slug}`}
        className={actionButtonClass}
        title="View form"
      >
        <FileText className={iconClass} />
      </Link>
      <button
        onClick={onEdit}
        className={actionButtonClass}
        title="Edit form"
      >
        <Edit className={iconClass} />
      </button>
      <button
        onClick={onDuplicate}
        className={actionButtonClass}
        title="Duplicate form"
      >
        <Copy className={iconClass} />
      </button>
      <button
        onClick={onDelete}
        className={actionButtonClass}
        title="Delete form"
      >
        <Trash2 className={`${iconClass} hover:text-red-600`} />
      </button>
    </div>
  );
}