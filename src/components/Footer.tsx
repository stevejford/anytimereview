import React from 'react';

export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-4 text-center">
      <a
        href="https://www.5starhq.com.au"
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-600 hover:text-[#5861c5] transition-colors text-base sm:text-sm font-medium"
      >
        Powered by 5StarHQ
      </a>
    </footer>
  );
}