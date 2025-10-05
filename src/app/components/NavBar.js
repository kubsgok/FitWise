import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NavBar({ showBackButton = false, backText = "Back to Home", backHref = "/" }) {
  const router = useRouter();

  return (
    <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200/60">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-center">
          <div 
            className="flex items-center space-x-2 cursor-pointer" 
            onClick={() => router.push("/")}
          >
            <div className="w-8 h-8 rounded-lg" style={{background: 'linear-gradient(135deg, #FF8C00 0%, #FF6B35 100%)'}}></div>
            <span className="text-xl font-bold text-slate-900">FitWise</span>
          </div>
          
          {showBackButton && (
            <div className="flex items-center space-x-4">
              <Link 
                href={backHref}
                className="text-slate-600 transition-colors font-medium" onMouseEnter={(e) => e.target.style.color = '#FF6B35'} onMouseLeave={(e) => e.target.style.color = ''}
              >
                {backText}
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}