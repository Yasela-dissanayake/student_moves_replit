import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  LogOut, 
  Home, 
  User, 
  Bell, 
  Wrench, 
  Database, 
  Target, 
  Building2, 
  Settings, 
  Brain,
  Menu,
  X,
  ChevronRight,
  LayoutDashboard,
  SearchIcon,
  Users,
  FileText,
  Briefcase,
  Shield,
  Key,
  DollarSign,
  Bolt,
  Ticket
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Define types for navigation items and dashboard configuration
interface NavItem {
  path: string;
  label: string;
  icon: JSX.Element;
  children?: NavItem[];
}

interface DashboardConfig {
  title: string;
  color: string;
  navItems: NavItem[];
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  dashboardType?: 'admin' | 'agent' | 'landlord' | 'tenant';
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  dashboardType 
}) => {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  
  // Auto-detect dashboard type from URL path or user type
  const detectedDashboardType = dashboardType || 
    (location.includes('/dashboard/admin') ? 'admin' : 
     location.includes('/dashboard/agent') ? 'agent' :
     location.includes('/dashboard/landlord') ? 'landlord' :
     user?.userType || 'tenant');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
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
  };
  
  // Configure different dashboard types
  const dashboardConfigs: Record<string, DashboardConfig> = {
    admin: {
      title: "Admin Dashboard",
      color: "blue",
      navItems: [
        { path: "/dashboard/admin", label: "Overview", icon: <LayoutDashboard className="h-5 w-5" /> },
        { path: "/dashboard/admin/verification", label: "Verification", icon: <User className="h-5 w-5" /> },
        { path: "/dashboard/admin/notifications", label: "Notifications", icon: <Bell className="h-5 w-5" /> },
        { path: "/dashboard/admin/utilities", label: "Utility Management", icon: <Bolt className="h-5 w-5" /> },

        { path: "/dashboard/admin/ai-maintenance", label: "AI Maintenance", icon: <Wrench className="h-5 w-5" /> },
        { path: "/dashboard/admin/test-ai-service", label: "Test AI Service", icon: <Brain className="h-5 w-5" /> },
        { path: "/dashboard/admin/website-builder", label: "Website Builder", icon: <Database className="h-5 w-5" /> },
        { path: "/dashboard/admin/social-targeting", label: "Social Targeting", icon: <Target className="h-5 w-5" /> },
        { path: "/dashboard/admin/property-targeting", label: "Property Management", icon: <Building2 className="h-5 w-5" /> },
        { path: "/dashboard/admin/settings", label: "Settings", icon: <Settings className="h-5 w-5" /> },
      ]
    },
    agent: {
      title: "Agent Dashboard",
      color: "indigo",
      navItems: [
        { path: "/dashboard/agent", label: "Overview", icon: <LayoutDashboard className="h-5 w-5" /> },
        { path: "/dashboard/agent/properties", label: "Properties", icon: <Home className="h-5 w-5" /> },
        { path: "/dashboard/agent/applications", label: "Applications", icon: <FileText className="h-5 w-5" /> },
        { path: "/dashboard/agent/tenancies", label: "Tenancies", icon: <Users className="h-5 w-5" /> },
        { path: "/dashboard/agent/tenants", label: "Tenants", icon: <Users className="h-5 w-5" /> },
        { path: "/dashboard/agent/landlords", label: "Landlords", icon: <Briefcase className="h-5 w-5" /> },
        { path: "/dashboard/agent/maintenance", label: "Maintenance", icon: <Wrench className="h-5 w-5" /> },
        { path: "/dashboard/agent/keys", label: "Keys", icon: <Key className="h-5 w-5" /> },
        { path: "/dashboard/agent/compliance", label: "Compliance", icon: <Shield className="h-5 w-5" /> },
        { path: "/dashboard/agent/targeting", label: "Marketing", icon: <Target className="h-5 w-5" /> },
        { path: "/dashboard/agent/settings", label: "Settings", icon: <Settings className="h-5 w-5" /> },
      ]
    },
    landlord: {
      title: "Landlord Dashboard",
      color: "emerald",
      navItems: [
        { path: "/dashboard/landlord", label: "Overview", icon: <LayoutDashboard className="h-5 w-5" /> },
        { path: "/dashboard/landlord/properties", label: "Properties", icon: <Home className="h-5 w-5" /> },
        { path: "/dashboard/landlord/tenants", label: "Tenants", icon: <Users className="h-5 w-5" /> },
        { path: "/dashboard/landlord/maintenance", label: "Maintenance", icon: <Wrench className="h-5 w-5" /> },
        { path: "/dashboard/landlord/finances", label: "Finances", icon: <DollarSign className="h-5 w-5" /> },
        { path: "/dashboard/landlord/compliance", label: "Compliance", icon: <Shield className="h-5 w-5" /> },
        { path: "/dashboard/landlord/documents", label: "Documents", icon: <FileText className="h-5 w-5" /> },
        { path: "/dashboard/landlord/settings", label: "Settings", icon: <Settings className="h-5 w-5" /> },
      ]
    },
    tenant: {
      title: "Tenant Dashboard",
      color: "amber",
      navItems: [
        { path: "/dashboard/tenant", label: "Overview", icon: <LayoutDashboard className="h-5 w-5" /> },
        { path: "/dashboard/tenant/applications", label: "Applications", icon: <FileText className="h-5 w-5" /> },
        { path: "/dashboard/tenant/tenancy", label: "Tenancy", icon: <Home className="h-5 w-5" /> },
        { path: "/dashboard/tenant/payments", label: "Payments", icon: <DollarSign className="h-5 w-5" /> },
        { path: "/dashboard/tenant/maintenance", label: "Maintenance", icon: <Wrench className="h-5 w-5" /> },
        { path: "/dashboard/tenant/documents", label: "Documents", icon: <FileText className="h-5 w-5" /> },
        { path: "/dashboard/tenant/groups", label: "Groups", icon: <Users className="h-5 w-5" /> },
        { path: "/dashboard/tenant/settings", label: "Settings", icon: <Settings className="h-5 w-5" /> },
      ]
    }
  };

  const currentConfig = dashboardConfigs[detectedDashboardType as keyof typeof dashboardConfigs] || dashboardConfigs.tenant;
  const navItems = currentConfig.navItems;
  const colorClass = getColorClass(currentConfig.color);
  
  // Function to get color classes based on theme color
  function getColorClass(color: string) {
    const colors: Record<string, any> = {
      blue: {
        bg: "bg-blue-600",
        hover: "hover:bg-blue-700",
        gradientFrom: "from-blue-600",
        gradientTo: "to-blue-700",
        text: "text-blue-600",
        border: "border-blue-600",
        ring: "ring-blue-600",
      },
      indigo: {
        bg: "bg-indigo-600",
        hover: "hover:bg-indigo-700",
        gradientFrom: "from-indigo-600",
        gradientTo: "to-indigo-700",
        text: "text-indigo-600",
        border: "border-indigo-600",
        ring: "ring-indigo-600",
      },
      emerald: {
        bg: "bg-emerald-600",
        hover: "hover:bg-emerald-700",
        gradientFrom: "from-emerald-600",
        gradientTo: "to-emerald-700",
        text: "text-emerald-600",
        border: "border-emerald-600",
        ring: "ring-emerald-600",
      },
      amber: {
        bg: "bg-amber-600",
        hover: "hover:bg-amber-700",
        gradientFrom: "from-amber-600",
        gradientTo: "to-amber-700",
        text: "text-amber-600",
        border: "border-amber-600",
        ring: "ring-amber-600",
      }
    };
    
    return colors[color] || colors.blue;
  }
  
  const NavLink = ({ item }: { item: NavItem }) => {
    return (
      <Link key={item.path} href={item.path}>
        <div 
          className={cn(
            "flex items-center px-4 py-3 text-sm font-medium rounded-md transition-all cursor-pointer",
            location === item.path
              ? `${colorClass.bg} text-white shadow-md`
              : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
          )}
        >
          <span className={location === item.path ? "text-white" : "text-gray-500"}>
            {item.icon}
          </span>
          <span className="ml-3">{item.label}</span>
          
          {item.children && (
            <ChevronRight className="ml-auto h-4 w-4" />
          )}
        </div>
      </Link>
    );
  };

  // Mobile and desktop rendering

  // Mobile sidebar content
  const MobileSidebar = () => (
    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="lg:hidden text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0">
        <div className="h-full flex flex-col bg-white dark:bg-gray-900">
          <div className={`p-4 flex items-center gap-2 bg-gradient-to-r ${colorClass.gradientFrom} ${colorClass.gradientTo}`}>
            <Brain className="h-6 w-6 text-white" />
            <h1 className="text-xl font-bold text-white">{currentConfig.title}</h1>
          </div>
          
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="px-2 space-y-1">
              {navItems.map((item: NavItem) => (
                <Link 
                  key={item.path} 
                  href={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div 
                    className={cn(
                      "flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors cursor-pointer",
                      location === item.path
                        ? `${colorClass.bg} text-white`
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                    )}
                  >
                    {item.icon}
                    <span className="ml-3">{item.label}</span>
                  </div>
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={user?.profileImage || ""} />
                <AvatarFallback className={`${colorClass.bg} text-white`}>
                  {user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium dark:text-white">{user?.name || "User"}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || "user@example.com"}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className={`w-full mt-4 flex items-center justify-center gap-2 ${colorClass.bg} hover:${colorClass.hover} text-white border-transparent`}
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  // Desktop sidebar
  const DesktopSidebar = () => (
    <div className="hidden lg:flex w-64 flex-col fixed inset-y-0 z-10">
      <div className="flex-1 flex flex-col min-h-0 bg-white shadow-md dark:bg-gray-900 dark:border-gray-800">
        <div className={`p-4 flex items-center gap-2 bg-gradient-to-r ${colorClass.gradientFrom} ${colorClass.gradientTo}`}>
          <Brain className="h-6 w-6 text-white" />
          <h1 className="text-xl font-bold text-white">{currentConfig.title}</h1>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-2 space-y-1">
            {navItems.map((item) => (
              <NavLink key={item.path} item={item} />
            ))}
          </nav>
        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={user?.profileImage || ""} />
              <AvatarFallback className={`${colorClass.bg} text-white`}>
                {user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium dark:text-white">{user?.name || "User"}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || "user@example.com"}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className={`w-full mt-4 flex items-center justify-center gap-2 ${colorClass.bg} hover:${colorClass.hover} text-white border-transparent`}
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar for desktop */}
      <DesktopSidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:pl-64">
        {/* Header */}
        <header className={`sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm`}>
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center flex-1">
              {/* Mobile menu button */}
              <MobileSidebar />
              
              <div className="ml-2 lg:ml-0">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {currentConfig.title}
                </h1>
              </div>
            </div>
            
            {/* Search bar */}
            <div className="flex-1 max-w-md mx-4 hidden md:block">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search..."
                  className="pl-10 bg-gray-100 dark:bg-gray-800 border-0 focus-visible:ring-1 focus-visible:ring-offset-0"
                />
              </div>
            </div>
            
            {/* Header icons */}
            <div className="flex items-center space-x-4">
              <Link 
                href="/" 
                className="text-gray-600 hover:text-gray-900 rounded-full p-2 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
              >
                <Home className="h-5 w-5" />
              </Link>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    className="text-gray-600 hover:text-gray-900 rounded-full p-2 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800 relative"
                    aria-label="Notifications"
                  >
                    <Bell className="h-5 w-5" />
                    <span className={`absolute top-0 right-0 h-2.5 w-2.5 rounded-full ${colorClass.bg}`}></span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 mt-1.5">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-80 overflow-y-auto py-1">
                    <div className="px-4 py-2 text-center text-sm text-gray-500">
                      No new notifications
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
                    aria-label="User menu"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.profileImage || ""} />
                      <AvatarFallback className={`${colorClass.bg} text-white`}>
                        {user?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 mt-1.5">
                  <DropdownMenuLabel>{user?.name || "User"}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;