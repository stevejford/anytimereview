import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#5861c5] to-[#4951b5] flex flex-col items-center justify-center text-white p-4">
      <div className="max-w-4xl w-full text-center">
        <h1 className="text-5xl font-bold mb-6">AnyTime Review</h1>
        <p className="text-xl mb-12 text-white/90">
          Collect and manage customer reviews with ease
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/admin"
            className="px-8 py-3 bg-white text-[#5861c5] rounded-lg font-semibold hover:bg-opacity-90 transition-colors"
          >
            Admin Dashboard
          </Link>
          <Link
            to="/login"
            className="px-8 py-3 border-2 border-white rounded-lg font-semibold hover:bg-white/10 transition-colors"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
} 