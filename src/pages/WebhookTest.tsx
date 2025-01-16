import { useState } from 'react';

const DEFAULT_WEBHOOK_URL = 'https://webhook.site/your-unique-id';

export default function WebhookTest() {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(DEFAULT_WEBHOOK_URL);
  const [isValidUrl, setIsValidUrl] = useState(true);

  const validateUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setWebhookUrl(url);
    setIsValidUrl(validateUrl(url));
  };

  const testWebhook = async () => {
    if (!isValidUrl) {
      setStatus('Error: Please enter a valid webhook URL');
      return;
    }

    setLoading(true);
    setStatus('Sending test data...');

    try {
      const data = {
        name: 'Stephen Ford',
        email: 'SteveJFord1@Gmail.com',
        phone: '61435473212'
      };

      console.log('Sending data:', data);

      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value);
      });

      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        body: formData
      });

      console.log('Request sent. Check webhook.site for the received data');
      setStatus('Request sent! Check webhook.site to see the received data.');
    } catch (error) {
      console.error('Error:', error);
      setStatus(`Error: ${error instanceof Error ? error.message : 'Failed to send data'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Webhook Test Page
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Test the webhook connection with sample data
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="mb-6">
              <label htmlFor="webhookUrl" className="block text-sm font-medium text-gray-700 mb-2">
                Webhook URL
              </label>
              <input
                type="url"
                id="webhookUrl"
                value={webhookUrl}
                onChange={handleUrlChange}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-[#5861c5] focus:border-[#5861c5] sm:text-sm ${
                  isValidUrl ? 'border-gray-300' : 'border-red-500'
                }`}
                placeholder="Enter webhook URL"
              />
              {!isValidUrl && (
                <p className="mt-1 text-sm text-red-600">
                  Please enter a valid URL starting with http:// or https://
                </p>
              )}
              <button
                onClick={() => setWebhookUrl(DEFAULT_WEBHOOK_URL)}
                className="mt-2 text-sm text-[#5861c5] hover:text-[#4951b5]"
              >
                Reset to Default URL
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              This will send test data including:
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Name: Stephen Ford</li>
                <li>Email: SteveJFord1@Gmail.com</li>
                <li>Phone: 61435473212</li>
              </ul>
            </p>
            
            <div className="flex flex-col space-y-4">
              <button
                onClick={testWebhook}
                disabled={loading || !isValidUrl}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#5861c5] hover:bg-[#4951b5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5861c5] disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'Test Webhook'}
              </button>

              {status && (
                <div className={`mt-4 p-4 rounded-md ${
                  status.includes('Success') 
                    ? 'bg-green-50 text-green-800' 
                    : 'bg-red-50 text-red-800'
                }`}>
                  {status}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 