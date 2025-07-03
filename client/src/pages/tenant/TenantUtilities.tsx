/**
 * Tenant Utilities Page
 * Comprehensive utility management for students
 */

import React from 'react';
import TenantUtilityManagement from '@/components/utility/TenantUtilityManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplets, Zap, Wifi, Tv } from "lucide-react";

export default function TenantUtilities() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Utility Management</h1>
          <p className="mt-2 text-gray-600">
            Manage your utility providers and switch to better rates
          </p>
        </div>

        {/* Quick Stats - Privacy-focused */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Energy</CardTitle>
              <Zap className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">✓ Set Up</div>
              <p className="text-xs text-muted-foreground">Ready to use</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Water</CardTitle>
              <Droplets className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">✓ Set Up</div>
              <p className="text-xs text-muted-foreground">Ready to use</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Broadband</CardTitle>
              <Wifi className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">✓ Set Up</div>
              <p className="text-xs text-muted-foreground">Ready to use</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">TV License</CardTitle>
              <Tv className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">✓ Set Up</div>
              <p className="text-xs text-muted-foreground">Ready to use</p>
            </CardContent>
          </Card>
        </div>

        {/* Privacy-focused utility information */}
        <Card>
          <CardHeader>
            <CardTitle>Your Utility Setup Status</CardTitle>
            <CardDescription>
              All utilities have been configured for your property. Contact your landlord or agent for specific provider details if needed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-green-600" />
                    <div>
                      <h3 className="font-medium">Energy (Gas & Electricity)</h3>
                      <p className="text-sm text-muted-foreground">Provider configured</p>
                    </div>
                  </div>
                  <div className="text-green-600 font-medium">✓ Active</div>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Droplets className="h-5 w-5 text-green-600" />
                    <div>
                      <h3 className="font-medium">Water & Sewerage</h3>
                      <p className="text-sm text-muted-foreground">Provider configured</p>
                    </div>
                  </div>
                  <div className="text-green-600 font-medium">✓ Active</div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Wifi className="h-5 w-5 text-green-600" />
                    <div>
                      <h3 className="font-medium">Broadband & Internet</h3>
                      <p className="text-sm text-muted-foreground">Provider configured</p>
                    </div>
                  </div>
                  <div className="text-green-600 font-medium">✓ Active</div>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Tv className="h-5 w-5 text-green-600" />
                    <div>
                      <h3 className="font-medium">TV License</h3>
                      <p className="text-sm text-muted-foreground">License configured</p>
                    </div>
                  </div>
                  <div className="text-green-600 font-medium">✓ Active</div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Need Help?</h4>
              <p className="text-sm text-blue-800">
                For billing queries, account changes, or specific provider information, please contact your property manager or landlord. 
                They have access to all utility provider details and can assist with any account-related matters.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}