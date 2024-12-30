import React from 'react';
import { Calendar, Mail, Phone, User } from 'lucide-react';

interface HistoryEntry {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
}

export default function History() {
  const getHistory = (): HistoryEntry[] => {
    try {
      const stored = localStorage.getItem('clientHistory');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const history = getHistory().slice(0, 50);

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-[#5861c5] text-white p-8">
        <h2 className="text-3xl font-semibold">Recent Submissions</h2>
        <p className="text-white/90 text-lg mt-2">Last 50 entries</p>
      </div>

      <div className="p-8">
        {history.length === 0 ? (
          <div className="text-center text-gray-500 py-12 text-lg">
            No submissions yet
          </div>
        ) : (
          <div className="space-y-6">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="border rounded-lg p-6 hover:border-[#5861c5] transition-colors"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="flex items-center">
                    <User className="w-6 h-6 text-gray-400 mr-4" />
                    <div>
                      <div className="text-sm text-gray-500">Name</div>
                      <div className="font-medium text-lg">{entry.name}</div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Phone className="w-6 h-6 text-gray-400 mr-4" />
                    <div>
                      <div className="text-sm text-gray-500">Phone</div>
                      <div className="font-medium text-lg">{entry.phone}</div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Mail className="w-6 h-6 text-gray-400 mr-4" />
                    <div>
                      <div className="text-sm text-gray-500">Email</div>
                      <div className="font-medium text-lg">{entry.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Calendar className="w-6 h-6 text-gray-400 mr-4" />
                    <div>
                      <div className="text-sm text-gray-500">Date</div>
                      <div className="font-medium text-lg">
                        {new Date(entry.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}