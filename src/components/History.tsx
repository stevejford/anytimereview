import { useState, useEffect } from 'react';
import { Calendar, Mail, Phone, User, Search, ChevronLeft, ChevronRight, Edit2, RefreshCw, Trash2 } from 'lucide-react';

interface HistoryEntry {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
}

interface HistoryProps {
  onEdit?: (client: Omit<HistoryEntry, 'id' | 'date'>) => void;
  onResend?: (client: Omit<HistoryEntry, 'id' | 'date'>) => void;
  formSlug?: string;
}

export default function History({ onEdit, onResend, formSlug }: HistoryProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredHistory, setFilteredHistory] = useState<HistoryEntry[]>([]);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const itemsPerPage = 10;

  const publicFormUrl = formSlug ? `${window.location.origin}/f/${formSlug}` : '';

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicFormUrl);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const getHistory = (): HistoryEntry[] => {
    try {
      const stored = localStorage.getItem('clientHistory');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  useEffect(() => {
    const history = getHistory();
    const filtered = history.filter((entry) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        entry.name.toLowerCase().includes(searchLower) ||
        entry.email.toLowerCase().includes(searchLower) ||
        entry.phone.toLowerCase().includes(searchLower)
      );
    });
    setFilteredHistory(filtered);
    setCurrentPage(1); // Reset to first page when search changes
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEntries = filteredHistory.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-[#5861c5] text-white p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1">
            <h2 className="text-xl font-semibold">Recent Submissions</h2>
            <p className="text-white/80 text-sm mt-0.5">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredHistory.length)} of {filteredHistory.length} entries
            </p>
          </div>
          
          {/* Refined Search Bar */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-white/70" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search submissions..."
                className="block w-full pl-8 pr-3 py-1.5 text-sm border border-white/30 rounded-md bg-white/10 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {currentEntries.length === 0 ? (
          <div className="text-center text-gray-500 py-6 text-base">
            {searchTerm ? 'No matching submissions found' : 'No submissions yet'}
          </div>
        ) : (
          <div className="space-y-3">
            {currentEntries.map((entry) => (
              <div
                key={entry.id}
                className="bg-white rounded-lg border border-gray-200 hover:border-[#5861c5]/70 hover:shadow-sm transition-all p-5"
              >
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-start">
                    <User className="w-4 h-4 text-[#5861c5] mr-2.5 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-0.5">Name</div>
                      <div className="text-sm font-medium text-gray-900">{entry.name}</div>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Phone className="w-4 h-4 text-[#5861c5] mr-2.5 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-0.5">Phone</div>
                      <div className="text-sm font-medium text-gray-900 font-mono">{entry.phone}</div>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Mail className="w-4 h-4 text-[#5861c5] mr-2.5 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-0.5">Email</div>
                      <div className="text-sm font-medium text-gray-900 break-all">{entry.email}</div>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Calendar className="w-4 h-4 text-[#5861c5] mr-2.5 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-0.5">Date</div>
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(entry.date).toLocaleDateString('en-AU', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => onEdit?.({ name: entry.name, email: entry.email, phone: entry.phone })}
                    className="flex items-center px-3 py-1.5 text-xs font-medium text-[#5861c5] hover:bg-[#5861c5]/5 rounded-md transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => onResend?.({ name: entry.name, email: entry.email, phone: entry.phone })}
                    className="flex items-center px-3 py-1.5 text-xs font-medium text-[#5861c5] hover:bg-[#5861c5]/5 rounded-md transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                    Resend
                  </button>
                  <button
                    onClick={() => {
                      const history = getHistory().filter(h => h.id !== entry.id);
                      localStorage.setItem('clientHistory', JSON.stringify(history));
                      setFilteredHistory(history);
                    }}
                    className="flex items-center px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Improved Pagination */}
        {filteredHistory.length > 0 && (
          <div className="mt-5 flex justify-between items-center border-t border-gray-100 pt-4">
            <div className="text-xs text-gray-500 font-medium">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="flex items-center px-3 py-1.5 border border-gray-200 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
                Previous
              </button>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="flex items-center px-3 py-1.5 border border-gray-200 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}