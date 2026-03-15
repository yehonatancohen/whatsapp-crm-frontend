import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-charcoal mb-4">404</p>
        <h1 className="text-xl font-semibold text-charcoal mb-2">Page not found</h1>
        <p className="text-sm text-muted mb-6">The page you're looking for doesn't exist or has been moved.</p>
        <Link
          to="/"
          className="inline-block bg-accent hover:bg-accent text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
