import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link, useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';

export default function AuthDebug() {
  const { user, isAuthenticated, userType, logout } = useAuth();
  const [, navigate] = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Link href="/">
          <Button variant="ghost" className="flex items-center gap-1 mb-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Authentication Debug Info</CardTitle>
          <CardDescription>Current authentication state:</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>isAuthenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
            <p><strong>userType:</strong> {userType || 'Not set'}</p>
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60 text-xs">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
          
          <div className="mt-6 flex gap-4">
            {isAuthenticated ? (
              <Button onClick={handleLogout} variant="destructive">
                Logout
              </Button>
            ) : (
              <Button onClick={() => navigate('/login')} variant="default">
                Go to Login
              </Button>
            )}
            <Button onClick={() => navigate('/')} variant="outline">
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}