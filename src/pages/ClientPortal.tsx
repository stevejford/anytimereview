import { useState } from 'react';
import { useParams } from 'react-router-dom';
import Navigation from '../components/Navigation';
import ClientForm from '../components/ClientForm';
import History from '../components/History';
import Footer from '../components/Footer';

export default function ClientPortal() {
  const [activePage, setActivePage] = useState<'home' | 'history'>('home');
  const { slug } = useParams<{ slug: string }>();

  if (!slug) return <div>Form not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navigation activePage={activePage} onNavigate={setActivePage} />
      
      <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 mt-16">
        {activePage === 'home' ? <ClientForm slug={slug} /> : <History />}
      </main>

      <Footer />
    </div>
  );
}