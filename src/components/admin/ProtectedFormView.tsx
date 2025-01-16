import { useState } from 'react';
import { Copy, ExternalLink } from 'lucide-react';
import ClientForm from '../ClientForm';

interface ProtectedFormViewProps {
  slug: string;
  businessName: string;
  webhookUrl: string;
}

export default function ProtectedFormView({ slug, businessName, webhookUrl }: ProtectedFormViewProps) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const formUrl = `${window.location.origin}/f/${slug}`;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(formUrl);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-3">
            {businessName}
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Staff Portal - Customer Information Form
          </p>
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-8" />
          <p className="text-gray-600">
            Add your customer's details below. Their information will be processed and sent to your system within 5 minutes.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
        <a
          href={formUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center px-6 py-3 bg-[#5861c5] text-white rounded-xl font-semibold hover:bg-[#4951b5] transition-all duration-200 shadow-sm hover:shadow-md group"
        >
          <ExternalLink className="w-5 h-5 mr-2 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          View Public Form
        </a>
        <button
          onClick={handleCopyUrl}
          className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md border border-gray-200 group"
        >
          <Copy className={`w-5 h-5 mr-2 transition-transform group-hover:scale-110 ${
            copyStatus === 'copied' ? 'text-green-500' : 'text-gray-400'
          }`} />
          {copyStatus === 'copied' ? 'Copied!' : 'Copy Form URL'}
        </button>
      </div>

      {/* Form Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <ClientForm
          slug={slug}
          webhookUrl={webhookUrl}
          businessName={businessName}
        />
      </div>
    </div>
  );
} 