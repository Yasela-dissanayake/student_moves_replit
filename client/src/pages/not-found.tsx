import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";

export default function NotFound() {
  // Get the current location
  const [location] = useLocation();
  
  // Log debug information when this component renders
  useEffect(() => {
    console.log("404 Page Not Found rendered", { path: location });
    
    // Specifically log if this is a marketplace route
    if (location.startsWith('/marketplace')) {
      console.log("Marketplace 404 detected - check if route is correctly defined", { fullPath: location });
    }
  }, [location]);
  
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start bg-gray-50 py-8">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            The page you are looking for doesn't exist or has been moved.
            <br />
            <span className="text-gray-500 text-xs">Path: {location}</span>
          </p>
          
          <div className="mt-6 mb-2">
            <Link href="/">
              <div className="text-blue-600 hover:underline text-sm cursor-pointer">Go back to homepage</div>
            </Link>
            {location.startsWith('/marketplace') && (
              <Link href="/marketplace">
                <div className="text-blue-600 hover:underline text-sm cursor-pointer mt-2">Go to Marketplace</div>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
