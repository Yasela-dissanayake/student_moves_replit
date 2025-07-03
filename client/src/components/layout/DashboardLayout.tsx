import { ReactNode, useState, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { Bell, Home } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout, userType } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [location, navigate] = useLocation();

  // Dashboard color themes based on user type
  const dashboardTheme = useMemo(() => {
    switch (userType) {
      case 'tenant':
        return {
          name: 'Tenant Dashboard',
          primaryColor: 'bg-blue-600',
          primaryHover: 'hover:bg-blue-700',
          primaryText: 'text-blue-600',
          accentColor: 'bg-blue-100',
          accentText: 'text-blue-800',
          activeBg: 'bg-blue-700',
          activeText: 'text-white',
          sidebarBg: 'bg-gray-900',
          headerBg: 'bg-gradient-to-r from-blue-600 to-blue-700',
          icon: <Home className="h-6 w-6 text-blue-500" />
        };
      case 'landlord':
        return {
          name: 'Landlord Dashboard',
          primaryColor: 'bg-emerald-600',
          primaryHover: 'hover:bg-emerald-700',
          primaryText: 'text-emerald-600',
          accentColor: 'bg-emerald-100',
          accentText: 'text-emerald-800',
          activeBg: 'bg-emerald-700',
          activeText: 'text-white',
          sidebarBg: 'bg-gray-900',
          headerBg: 'bg-gradient-to-r from-emerald-600 to-emerald-700',
          icon: <Home className="h-6 w-6 text-emerald-500" />
        };
      case 'agent':
        return {
          name: 'Agent Dashboard',
          primaryColor: 'bg-purple-600',
          primaryHover: 'hover:bg-purple-700',
          primaryText: 'text-purple-600',
          accentColor: 'bg-purple-100',
          accentText: 'text-purple-800',
          activeBg: 'bg-purple-700',
          activeText: 'text-white',
          sidebarBg: 'bg-gray-900',
          headerBg: 'bg-gradient-to-r from-purple-600 to-purple-700',
          icon: <Home className="h-6 w-6 text-purple-500" />
        };
      case 'admin':
        return {
          name: 'Admin Dashboard',
          primaryColor: 'bg-red-600',
          primaryHover: 'hover:bg-red-700',
          primaryText: 'text-red-600',
          accentColor: 'bg-red-100',
          accentText: 'text-red-800',
          activeBg: 'bg-red-700',
          activeText: 'text-white',
          sidebarBg: 'bg-gray-900',
          headerBg: 'bg-gradient-to-r from-red-600 to-red-700',
          icon: <Home className="h-6 w-6 text-red-500" />
        };
      default:
        return {
          name: 'Dashboard',
          primaryColor: 'bg-gray-600',
          primaryHover: 'hover:bg-gray-700',
          primaryText: 'text-gray-600',
          accentColor: 'bg-gray-100',
          accentText: 'text-gray-800',
          activeBg: 'bg-gray-700',
          activeText: 'text-white',
          sidebarBg: 'bg-gray-900',
          headerBg: 'bg-gradient-to-r from-gray-600 to-gray-700',
          icon: <Home className="h-6 w-6 text-gray-500" />
        };
    }
  }, [userType]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Get dashboard menu items based on user type
  const getDashboardMenuItems = () => {
    switch (userType) {
      case 'tenant':
        return [
          { label: 'My Properties', href: '/dashboard', icon: 'home' },
          { label: 'My Applications', href: '/dashboard/applications', icon: 'file-text' },
          { label: 'Payments', href: '/dashboard/payments', icon: 'credit-card' },
          { label: 'ID Verification', href: '/dashboard/verification', icon: 'user-check' },
          { label: 'Media Compressor', href: '/dashboard/media/compression', icon: 'image' },
          { label: 'Settings', href: '/dashboard/settings', icon: 'settings' },
        ];
      case 'landlord':
        return [
          { label: 'My Properties', href: '/dashboard', icon: 'home' },
          { label: 'Applications', href: '/dashboard/applications', icon: 'file-text' },
          { label: 'Tenants', href: '/dashboard/tenants', icon: 'users' },
          { label: 'Payments', href: '/dashboard/payments', icon: 'credit-card' },
          { label: 'Add Property', href: '/dashboard/add-property', icon: 'plus-circle' },
          { label: 'Media Compressor', href: '/dashboard/media/compression', icon: 'image' },
          { label: 'Settings', href: '/dashboard/settings', icon: 'settings' },
        ];
      case 'agent':
        return [
          { label: 'Properties', href: '/dashboard', icon: 'home' },
          { label: 'Applications', href: '/dashboard/applications', icon: 'file-text' },
          { label: 'Tenants', href: '/dashboard/tenants', icon: 'users' },
          { label: 'Landlords', href: '/dashboard/landlords', icon: 'briefcase' },
          { label: 'Payments', href: '/dashboard/payments', icon: 'credit-card' },
          { label: 'Add Property', href: '/dashboard/add-property', icon: 'plus-circle' },
          { label: 'HMO Compliance', href: '/dashboard/hmo-compliance', icon: 'shield' },
          { label: 'Media Compressor', href: '/dashboard/media/compression', icon: 'image' },
          { label: 'Settings', href: '/dashboard/settings', icon: 'settings' },
        ];
      case 'admin':
        return [
          { label: 'Dashboard', href: '/dashboard', icon: 'grid' },
          { label: 'Users', href: '/dashboard/users', icon: 'users' },
          { label: 'Properties', href: '/dashboard/properties', icon: 'home' },
          { label: 'Verifications', href: '/dashboard/verifications', icon: 'user-check' },
          { label: 'Compliance', href: '/dashboard/compliance', icon: 'shield' },
          { label: 'System Status', href: '/dashboard/system', icon: 'activity' },
          { label: 'Marketing', href: '/dashboard/marketing', icon: 'trending-up' },
          { label: 'Media Compressor', href: '/dashboard/media/compression', icon: 'image' },
          { label: 'Settings', href: '/dashboard/settings', icon: 'settings' },
        ];
      default:
        return [];
    }
  };

  const menuItems = getDashboardMenuItems();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside 
        className={`${dashboardTheme.sidebarBg} text-white w-64 min-h-screen p-4 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0 fixed z-10`}
      >
        <div className="flex items-center justify-between mb-6 pr-3">
          <Link href="/" className="text-xl font-bold">
            <span>Uni</span><span className={dashboardTheme.primaryText}>Rent</span>
          </Link>
          <button className="md:hidden" onClick={toggleSidebar}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User profile section */}
        <div className="flex flex-col items-center mb-6 pt-2 pb-6 border-b border-gray-700">
          <div className={`w-20 h-20 rounded-full ${dashboardTheme.accentColor} mb-2 flex items-center justify-center`}>
            {user?.profileImage ? (
              <img src={user.profileImage} alt={user.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-12 w-12 ${dashboardTheme.accentText}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </div>
          <h3 className="text-lg font-semibold mt-1">{user?.name}</h3>
          <p className="text-sm text-gray-400 capitalize">{userType}</p>
          {!user?.verified && (
            <span className="mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Not Verified
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav>
          <ul className="space-y-2">
            {menuItems.map((item, index) => (
              <li key={index}>
                <Link
                  href={item.href}
                  className={`flex items-center space-x-2 p-2 rounded-md transition-colors ${
                    location === item.href
                      ? `${dashboardTheme.primaryColor} ${dashboardTheme.activeText}`
                      : `text-gray-300 hover:bg-gray-800 hover:text-white`
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {getIconPath(item.icon)}
                  </svg>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout button */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <Button 
            variant="outline" 
            className={`w-full ${dashboardTheme.primaryColor} text-white ${dashboardTheme.primaryHover} border-transparent`}
            onClick={async () => {
              try {
                // Use the auth context logout function which handles everything properly
                await logout();
              } catch (error) {
                console.error('Logout error:', error);
                // If auth context fails, fallback to manual cleanup
                localStorage.clear();
                sessionStorage.clear();
                document.cookie.split(";").forEach(function(c) { 
                  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
                });
                window.location.href = '/';
                window.location.reload();
              }
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className={`shadow-sm ${dashboardTheme.headerBg} text-white`}>
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <button 
                className="md:hidden mr-3 text-white hover:text-gray-200"
                onClick={toggleSidebar}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold">{dashboardTheme.name}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/" className="text-white hover:text-gray-200 rounded-full p-2 hover:bg-white/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </Link>
              <button className="text-white hover:text-gray-200 rounded-full p-2 hover:bg-white/10 relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}

// Helper function to get SVG path for icon
function getIconPath(icon: string) {
  switch (icon) {
    case 'home':
      return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />;
    case 'file-text':
      return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />;
    case 'credit-card':
      return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />;
    case 'user-check':
      return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />;
    case 'settings':
      return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />;
    case 'users':
      return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />;
    case 'plus-circle':
      return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />;
    case 'briefcase':
      return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />;
    case 'shield':
      return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />;
    case 'grid':
      return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />;
    case 'activity':
      return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />;
    case 'trending-up':
      return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />;
    case 'image':
      return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />;
    default:
      return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />;
  }
}
