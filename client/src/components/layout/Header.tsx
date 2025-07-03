import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';

export default function Header() {
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const { isAuthenticated, logout, userType } = useAuth();
  const [location] = useLocation();

  const toggleMobileMenu = () => {
    setMobileMenuVisible(!mobileMenuVisible);
  };

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold">
              <span className="text-primary">Uni</span><span className="text-secondary">Rent</span>
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <Link href="/" className={`font-medium hover:text-primary transition ${location === '/' ? 'text-primary' : ''}`}>
              Home
            </Link>
            <Link href="/properties" className={`font-medium hover:text-primary transition ${location === '/properties' ? 'text-primary' : ''}`}>
              Properties
            </Link>
            <Link href="/universities" className={`font-medium hover:text-primary transition ${location === '/universities' ? 'text-primary' : ''}`}>
              Universities
            </Link>
            <Link href="/about" className={`font-medium hover:text-primary transition ${location === '/about' ? 'text-primary' : ''}`}>
              About Us
            </Link>
            <Link href="/contact" className={`font-medium hover:text-primary transition ${location === '/contact' ? 'text-primary' : ''}`}>
              Contact
            </Link>
          </nav>
          
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard" className="text-primary hover:underline">
                  Dashboard
                </Link>
                <Button variant="outline" onClick={() => logout()}>
                  Log Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-primary hover:underline">
                  Log In
                </Link>
                <Link href="/register">
                  <Button>Sign Up</Button>
                </Link>
              </>
            )}
          </div>
          
          <button 
            className="md:hidden text-2xl"
            aria-label="Menu"
            onClick={toggleMobileMenu}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <div className={`md:hidden ${mobileMenuVisible ? 'block' : 'hidden'}`}>
        <nav className="flex flex-col space-y-3 px-4 py-3 border-t">
          <Link href="/" className="font-medium hover:text-primary transition">
            Home
          </Link>
          <Link href="/properties" className="font-medium hover:text-primary transition">
            Properties
          </Link>
          <Link href="/universities" className="font-medium hover:text-primary transition">
            Universities
          </Link>
          <Link href="/about" className="font-medium hover:text-primary transition">
            About Us
          </Link>
          <Link href="/contact" className="font-medium hover:text-primary transition">
            Contact
          </Link>
          <div className="flex flex-col space-y-2 pt-3 border-t">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard" className="text-primary hover:underline">
                  Dashboard
                </Link>
                <Button variant="outline" onClick={() => logout()}>
                  Log Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-primary hover:underline">
                  Log In
                </Link>
                <Link href="/register">
                  <Button className="w-full">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
