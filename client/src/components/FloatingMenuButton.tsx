import { useState, useEffect } from 'react';
import { Menu, X, Info, User } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/lib/auth';

import './layout/navbar.css'; // Reusing the existing CSS

const FloatingMenuButton = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, userType, logout } = useAuth();
  
  // Add event listener for body scrolling prevention when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);
  
  const toggleMenu = () => {
    console.log('Global menu toggle clicked, current state:', isMenuOpen);
    console.log('Auth state:', { isAuthenticated, userType, user });
    console.log('Is student chat visible:', isAuthenticated && userType === 'tenant');
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await logout();
    setIsMenuOpen(false);
  };

  const userDashboardLink = () => {
    if (!isAuthenticated) return '/login';
    
    switch(userType) {
      case 'tenant': return '/dashboard/tenant';
      case 'landlord': return '/dashboard/landlord';
      case 'agent': return '/dashboard/agent';
      case 'admin': return '/dashboard/admin';
      default: return '/dashboard';
    }
  };

  return (
    <>
      {/* Floating menu button that's always visible */}
      <button 
        onClick={toggleMenu}
        className="floating-menu-button"
        aria-expanded={isMenuOpen}
        aria-label="Toggle Menu"
        title="Menu"
      >
        {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile Menu (slides in from the right) */}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-[100] ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="font-bold text-xl text-primary">Menu</h2>
          <button
            onClick={toggleMenu}
            className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-primary"
          >
            <X className="block h-6 w-6" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto h-full">
          <div className="space-y-4">
            <Link href="/" onClick={() => setIsMenuOpen(false)}>
              <span className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors duration-300 cursor-pointer">
                Home
              </span>
            </Link>
            
            <Link href="/properties" onClick={() => setIsMenuOpen(false)}>
              <span className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors duration-300 cursor-pointer">
                Properties
              </span>
            </Link>

            <Link href="/marketplace" onClick={() => setIsMenuOpen(false)}>
              <span className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors duration-300 cursor-pointer">
                Marketplace
                <span className="ml-2 px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded">New</span>
              </span>
            </Link>
            
            <Link href="/jobs" onClick={() => setIsMenuOpen(false)}>
              <span className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors duration-300 cursor-pointer">
                Student Jobs
                <span className="ml-2 px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded">New</span>
              </span>
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link href={userDashboardLink()} onClick={() => setIsMenuOpen(false)}>
                  <span className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors duration-300 cursor-pointer">
                    My Account
                  </span>
                </Link>
                
                <button 
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors duration-300"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                  <span className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors duration-300 cursor-pointer">
                    Login
                  </span>
                </Link>
                <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                  <span className="mt-2 block w-full px-3 py-2 rounded-md bg-gray-100 text-gray-800 font-medium text-center hover:bg-gray-200 transition-colors duration-300 cursor-pointer">
                    Sign Up
                  </span>
                </Link>
                <Link href="/register-student" onClick={() => setIsMenuOpen(false)}>
                  <span className="mt-2 block w-full px-3 py-2 rounded-md bg-primary text-white font-medium text-center hover:bg-primary/90 transition-colors duration-300 cursor-pointer flex items-center justify-center">
                    <User className="mr-2 h-4 w-4" />
                    Register as Student
                  </span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Overlay for menu background */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[99]"
          onClick={toggleMenu}
        />
      )}
    </>
  );
};

export default FloatingMenuButton;