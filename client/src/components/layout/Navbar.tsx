import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Menu, X, ChevronDown, Home, User, LogIn, LogOut, Mic, Info } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import VoiceSearchDialog from '@/components/search/VoiceSearchDialog';
import logoPath from '@assets/IMG-20250225-WA0007.jpg';
import './navbar.css';

export default function Navbar() {
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
    console.log('Menu toggle clicked, current state:', isMenuOpen);
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await logout();
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
      {/* Menu button is now in the navbar */}

      <nav className="bg-[#ff8c42] shadow-md sticky top-0 z-50">
        <div className="px-2 sm:px-4 py-3">
          <div className="flex justify-between items-center">
            {/* Logo with better mobile sizing */}
            <div className="flex items-center">
              <Link href="/">
                <span className="cursor-pointer flex items-center">
                  <img 
                    src={logoPath} 
                    alt="StudentMoves" 
                    className="h-8 w-auto" 
                  />

                </span>
              </Link>
            </div>

            {/* Right side items - voice search and menu */}
            <div className="flex items-center space-x-3">
              {/* Voice search icon button */}
              <button 
                className="bg-white text-[#f37021] p-2 rounded-full flex items-center justify-center"
                onClick={() => {
                  const voiceSearchButton = document.querySelector("[aria-label='Search by voice']") as HTMLButtonElement;
                  if (voiceSearchButton) voiceSearchButton.click();
                }}
              >
                <Mic className="h-5 w-5" />
              </button>
              
              {/* Hamburger menu button */}
              <button 
                onClick={toggleMenu}
                className="bg-white p-2 rounded-md flex items-center justify-center"
                aria-expanded={isMenuOpen}
                aria-label="Toggle Menu"
              >
                <Menu className="h-5 w-5 text-[#f37021]" />
              </button>
              
              {/* User account button only if authenticated */}
              {isAuthenticated && (
                <Link href={userDashboardLink()}>
                  <span className="bg-white text-[#f37021] px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-sm sm:text-base font-medium hover:bg-white/90 hover:text-[#d15f18] transition-colors duration-300 flex items-center cursor-pointer">
                    <User className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">My Account</span>
                    <span className="xs:hidden">Account</span>
                  </span>
                </Link>
              )}
            </div>
          </div>

          {/* Mobile and Desktop Menu (slides in from the right) */}
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
                <Link href="/">
                  <span className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors duration-300 flex items-center cursor-pointer">
                    <Home className="mr-2 h-5 w-5" />
                    <span>Home</span>
                  </span>
                </Link>
                
                <Link href="/properties">
                  <span className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors duration-300 cursor-pointer">
                    Properties
                  </span>
                </Link>

                <Link href="/marketplace">
                  <span className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors duration-300 cursor-pointer">
                    Marketplace
                    <span className="ml-2 px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded">New</span>
                  </span>
                </Link>
                
                <Link href="/jobs">
                  <span className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors duration-300 cursor-pointer">
                    Student Jobs
                    <span className="ml-2 px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded">New</span>
                  </span>
                </Link>


                
                {/* Collapsible section for Information */}
                <div className="block px-3 py-2 text-gray-700">
                  <span className="font-medium">Information</span>
                  <div className="pl-4 mt-1 space-y-1">
                    <Link href="/tenants-guide">
                      <span className="block py-1 text-gray-600 hover:text-primary transition-colors duration-300 cursor-pointer">
                        Tenant's Guide
                      </span>
                    </Link>
                    <Link href="/landlords-guide">
                      <span className="block py-1 text-gray-600 hover:text-primary transition-colors duration-300 cursor-pointer">
                        Landlord's Guide
                      </span>
                    </Link>
                    <Link href="/about-us">
                      <span className="block py-1 text-gray-600 hover:text-primary transition-colors duration-300 cursor-pointer">
                        About Us
                      </span>
                    </Link>
                  </div>
                </div>
                
                <Link href="/contact">
                  <span className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors duration-300 cursor-pointer">
                    Contact
                  </span>
                </Link>
                
                <div 
                  className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors duration-300 cursor-pointer" 
                  onClick={() => {
                    const voiceSearchButton = document.querySelector("[aria-label='Search by voice']") as HTMLButtonElement;
                    if (voiceSearchButton) voiceSearchButton.click();
                  }}
                >
                  <div className="flex items-center">
                    <Mic className="mr-2 h-5 w-5 text-primary" />
                    <span>Voice Search</span>
                    <span className="ml-2 px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded">New</span>
                  </div>
                </div>
                
                {/* Demo Login Options */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="px-3 py-2 text-sm font-medium text-gray-500">Demo Access</div>
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/auth/demo-login', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ role: 'agent' })
                        });
                        if (response.ok) {
                          window.location.href = '/dashboard/agent';
                        }
                      } catch (error) {
                        console.error('Demo login failed:', error);
                      }
                    }}
                    className="w-full text-left block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors duration-300"
                  >
                    Agent Dashboard Demo
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/auth/demo-login', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ role: 'admin' })
                        });
                        if (response.ok) {
                          window.location.href = '/dashboard/admin';
                        }
                      } catch (error) {
                        console.error('Demo login failed:', error);
                      }
                    }}
                    className="w-full text-left block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors duration-300"
                  >
                    Admin Dashboard Demo
                  </button>
                </div>
                
                {isAuthenticated ? (
                  <>
                    <Link href={userDashboardLink()}>
                      <span className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors duration-300 flex items-center cursor-pointer">
                        <User className="mr-2 h-5 w-5" />
                        <span>My Account</span>
                      </span>
                    </Link>
                    
                    {userType === 'admin' && (
                      <Link href="/dashboard/admin/ai-settings">
                        <span className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors duration-300 cursor-pointer">
                          AI Settings
                        </span>
                      </Link>
                    )}
                    
                    <button 
                      onClick={handleLogout}
                      className="block w-full text-left px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors duration-300 flex items-center"
                    >
                      <LogOut className="mr-2 h-5 w-5" />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <>
                    {/* Login Button (Combined) */}
                    <Link href="/login">
                      <span className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors duration-300 flex items-center cursor-pointer">
                        <LogIn className="mr-2 h-5 w-5" />
                        <span>Login</span>
                      </span>
                    </Link>
                    <Link href="/register">
                      <span className="mt-2 block w-full px-3 py-2 rounded-md bg-gray-100 text-gray-800 font-medium text-center hover:bg-gray-200 transition-colors duration-300 cursor-pointer">
                        Sign Up
                      </span>
                    </Link>
                    <Link href="/register-student">
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
        </div>
      </nav>
    </>
  );
}