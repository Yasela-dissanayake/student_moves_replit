import React from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, Users2 } from "lucide-react";
import { Link } from "wouter";

const AdminPropertyTargeting: React.FC = () => {
  return (
    <DashboardLayout dashboardType="admin">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center gap-2 mb-2">
          <Link to="/dashboard/AdminDashboard">
            <Button variant="outline" size="sm">Back to Dashboard</Button>
          </Link>
        </div>
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Property Management</h2>
          <Button>Add Property</Button>
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">31</div>
              <p className="text-xs text-muted-foreground">Across UK cities</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">28</div>
              <p className="text-xs text-muted-foreground">Currently available</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
              <Users2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">87%</div>
              <p className="text-xs text-muted-foreground">Current occupancy</p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Property Portfolio</CardTitle>
            <CardDescription>Manage property listings and tenant matching</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Student Housing - Manchester</div>
                  <div className="text-sm text-muted-foreground">4 bed house • £120/week per person</div>
                </div>
                <div className="space-x-2">
                  <Button size="sm" variant="outline">View Details</Button>
                  <Button size="sm">Edit</Button>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">City Centre Apartment - Birmingham</div>
                  <div className="text-sm text-muted-foreground">2 bed flat • £95/week per person</div>
                </div>
                <div className="space-x-2">
                  <Button size="sm" variant="outline">View Details</Button>
                  <Button size="sm">Edit</Button>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">University Campus - Leeds</div>
                  <div className="text-sm text-muted-foreground">5 bed house • £110/week per person</div>
                </div>
                <div className="space-x-2">
                  <Button size="sm" variant="outline">View Details</Button>
                  <Button size="sm">Edit</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminPropertyTargeting;