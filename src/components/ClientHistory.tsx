import React from 'react';
import { getHistory } from '../utils/storage';

interface ClientHistoryProps {
  onEdit: (client: { name: string; email: string; phone: string }) => void;
  onResend: (client: { name: string; email: string; phone: string }) => void;
}

export default function ClientHistory({ onEdit, onResend }: ClientHistoryProps) {
  const history = getHistory();

  if (history.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No submission history available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((client, index) => (
        <div
          key={index}
          className="bg-white p-4 rounded-lg shadow border border-gray-200"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{client.name}</h3>
              <p className="text-sm text-gray-600">{client.email}</p>
              <p className="text-sm text-gray-600">{client.phone}</p>
            </div>
            <div className="space-x-2">
              <button
                onClick={() => onEdit(client)}
                className="text-sm text-[#5861c5] hover:text-[#4951b5]"
              >
                Edit
              </button>
              <button
                onClick={() => onResend(client)}
                className="text-sm text-[#5861c5] hover:text-[#4951b5]"
              >
                Resend
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 