import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-cream transition-colors text-right">
      <div className="max-w-md w-full text-center">
        <h1 className="text-9xl font-bold text-accent mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-charcoal mb-4">הדף לא נמצא</h2>
        <p className="text-muted mb-8">הדף שאתה מחפש אינו קיים או שהועבר לכתובת אחרת.</p>
        <Link
          to="/"
          className="inline-block bg-accent hover:bg-accent-hover text-white font-medium px-6 py-3 rounded-lg transition-colors"
        >
          חזרה לדף הבית
        </Link>
      </div>
    </div>
  );
}
