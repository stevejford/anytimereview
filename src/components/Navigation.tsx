import React from 'react';
import { Home, History, ExternalLink } from 'lucide-react';

interface NavigationProps {
  activePage: 'home' | 'history';
  onNavigate: (page: 'home' | 'history') => void;
}

export default function Navigation({ activePage, onNavigate }: NavigationProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex space-x-4 sm:space-x-8 overflow-x-auto no-scrollbar">
            <button
              onClick={() => onNavigate('home')}
              className={`inline-flex items-center px-2 sm:px-1 pt-1 border-b-2 text-base sm:text-sm font-medium whitespace-nowrap ${
                activePage === 'home'
                  ? 'border-[#5861c5] text-[#5861c5]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Home className="w-5 h-5 mr-2" />
              Home
            </button>

            <button
              onClick={() => onNavigate('history')}
              className={`inline-flex items-center px-2 sm:px-1 pt-1 border-b-2 text-base sm:text-sm font-medium whitespace-nowrap ${
                activePage === 'history'
                  ? 'border-[#5861c5] text-[#5861c5]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <History className="w-5 h-5 mr-2" />
              History
            </button>

            <a
              href="https://reviews.5starhq.com.au/#/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-2 sm:px-1 pt-1 border-b-2 border-transparent text-base sm:text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap"
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              Review Portal
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}