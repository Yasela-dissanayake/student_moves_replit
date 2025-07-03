import React from 'react';
import { CheckCircle, Droplets, Zap, Wifi, Tv } from 'lucide-react';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const TenantUtilityManagement: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Energy</p>
                <p className="text-lg font-semibold text-green-600">✓ Set Up</p>
              </div>
              <Zap className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Water</p>
                <p className="text-lg font-semibold text-green-600">✓ Set Up</p>
              </div>
              <Droplets className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Internet</p>
                <p className="text-lg font-semibold text-green-600">✓ Set Up</p>
              </div>
              <Wifi className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">TV License</p>
                <p className="text-lg font-semibold text-green-600">✓ Set Up</p>
              </div>
              <Tv className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">All Utilities Configured</h3>
              <p className="text-muted-foreground">
                Your utilities have been set up by your property manager. For specific provider details or account queries, please contact them directly.
              </p>
            </div>
            <Link href="/tenant/utilities">
              <Button variant="outline" className="mt-4">
                View Details
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantUtilityManagement;