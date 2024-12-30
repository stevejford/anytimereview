import React, { useState } from 'react';
import Navigation from '../components/Navigation';
import ClientForm from '../components/ClientForm';
import History from '../components/History';
import Footer from '../components/Footer';

export default function ClientPortal() {
  const [activePage, setActivePage] = useState<'home' | 'history'>('home');

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navigation activePage={activePage} onNavigate={setActivePage} />
      
      <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 mt-16">
        {activePage === 'home' ? <ClientForm /> : <History />}
      </main>

      <Footer />
    </div>
  );
}