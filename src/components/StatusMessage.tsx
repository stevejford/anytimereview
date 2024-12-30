import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface StatusMessageProps {
  type: 'success' | 'error';
  message: string;
}

export default function StatusMessage({ type, message }: StatusMessageProps) {
  const isSuccess = type === 'success';
  const Icon = isSuccess ? CheckCircle2 : AlertCircle;
  
  return (
    <div className={`mb-6 p-4 ${isSuccess ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'} rounded-lg flex items-center text-base sm:text-sm`}>
      <Icon className="w-6 h-6 mr-3 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}