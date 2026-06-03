import { Link } from "react-router";
import { AlertCircle, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-full flex items-center justify-center p-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center size-16 rounded-full mb-4" style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)'
        }}>
          <AlertCircle className="size-8" style={{ color: '#EF4444' }} />
        </div>
        <h1 className="text-4xl font-bold mb-2" style={{ color: '#21222D' }}>404</h1>
        <h2 className="text-xl font-semibold mb-4" style={{ color: '#21222D' }}>Page Not Found</h2>
        <p className="mb-8" style={{ color: '#6B6C7E' }}>The page you're looking for doesn't exist or has been moved.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-xl font-medium transition-all"
          style={{ backgroundColor: '#958CE8' }}
          onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
            e.currentTarget.style.backgroundColor = '#8479D9';
            e.currentTarget.style.boxShadow = '0 8px 16px rgba(149, 140, 232, 0.3)';
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
            e.currentTarget.style.backgroundColor = '#958CE8';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <Home className="size-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
