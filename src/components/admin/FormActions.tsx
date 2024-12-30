import React from 'react';
import { Edit2, Copy, Trash2, ExternalLink } from 'lucide-react';

interface FormActionsProps {
  id: string;
  slug: string;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export default function FormActions({ id, slug, onEdit, onDelete, onDuplicate }: FormActionsProps) {
  return (
    <div className="flex items-center justify-end space-x-2">
      <a
        href={`/form/${slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#5861c5] hover:text-[#4951b5]"
        title="Open form"
      >
        <ExternalLink className="h-4 w-4" />
      </a>
      <button
        onClick={onEdit}
        className="text-[#5861c5] hover:text-[#4951b5]"
        title="Edit"
      >
        <Edit2 className="h-4 w-4" />
      </button>
      <button
        onClick={onDuplicate}
        className="text-[#5861c5] hover:text-[#4951b5]"
        title="Duplicate"
      >
        <Copy className="h-4 w-4" />
      </button>
      <button
        onClick={() => onDelete(id)}
        className="text-red-600 hover:text-red-900"
        title="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}