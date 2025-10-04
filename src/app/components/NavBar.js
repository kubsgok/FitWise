import Link from 'next/link';

export default function NavBar({ showBackButton = false, backText = "Back to Home", backHref = "/home" }) {
  return (
    <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200/60">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-center">
          <Link href="/home" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg" style={{background: 'linear-gradient(135deg, #FF8C00 0%, #FF6B35 100%)'}}></div>
            <h1 className="text-2xl font-bold text-transparent" style={{background: 'linear-gradient(90deg, #FF8C00 0%, #FF6B35 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text'}}>
              FitWise
            </h1>
          </Link>
          
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