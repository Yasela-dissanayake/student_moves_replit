import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { Calendar, Home, FileText, CheckCircle, XCircle, Clock, MapPin, Phone, Mail } from "lucide-react";
import { TenancyType, PropertyType, UserType } from "@/lib/types";
import { format, parseISO } from "date-fns";

interface TenancyWithDetails extends TenancyType {
  property?: PropertyType;
  landlord?: UserType;
}

export default function TenantTenancy() {
  const { user } = useAuth();

  // Get tenant tenancies
  const { data: tenancies, isLoading } = useQuery<TenancyWithDetails[]>({
    queryKey: ['/api/tenancies'],
  });

  const formatCurrency = (amount: string | number | undefined): string => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(parseFloat(amount.toString()));
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "N/A";
    try {
      return format(parseISO(dateString), "PPP");
    } catch {
      return "Invalid date";
    }
  };

  const renderTenancyStatus = (tenancy: TenancyWithDetails) => {
    if (tenancy.active) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>;
    } else if (!tenancy.signedByTenant || !tenancy.signedByOwner) {
      return <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">Pending Signatures</Badge>;
    } else if (tenancy.endDate && new Date(tenancy.endDate) < new Date()) {
      return <Badge variant="secondary">Expired</Badge>;
    } else {
      return <Badge variant="outline">Inactive</Badge>;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout dashboardType="tenant">
        <div className="space-y-6 p-6">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout dashboardType="tenant">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Tenancy</h1>
            <p className="text-muted-foreground">Manage your rental agreements and tenancy details</p>
          </div>
        </div>

        {/* Current Tenancies */}
        {!tenancies || tenancies.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Home className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No Active Tenancy</h3>
              <p className="text-muted-foreground mt-2">
                You don't have any active tenancy agreements at the moment.
              </p>
              <Button className="mt-4" asChild>
                <a href="/properties">Browse Properties</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {tenancies.map((tenancy) => (
              <Card key={tenancy.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">
                        {tenancy.property?.title || `Property ${tenancy.propertyId}`}
                      </CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        {tenancy.property?.address}, {tenancy.property?.city} {tenancy.property?.postcode}
                      </CardDescription>
                    </div>
                    {renderTenancyStatus(tenancy)}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Tenancy Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground">DURATION</h4>
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{formatDate(tenancy.startDate)} - {formatDate(tenancy.endDate)}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground">MONTHLY RENT</h4>
                      <div className="text-lg font-semibold">
                        {formatCurrency(tenancy.monthlyRent)}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground">DEPOSIT</h4>
                      <div className="text-lg font-semibold">
                        {formatCurrency(tenancy.depositAmount)}
                      </div>
                    </div>
                  </div>

                  {/* Signature Status */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-medium mb-3">Agreement Status</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Your Signature</span>
                        {tenancy.signedByTenant ? (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            <span className="text-sm">Signed</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-red-600">
                            <XCircle className="h-4 w-4 mr-1" />
                            <span className="text-sm">Pending</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Landlord Signature</span>
                        {tenancy.signedByOwner ? (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            <span className="text-sm">Signed</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-amber-600">
                            <Clock className="h-4 w-4 mr-1" />
                            <span className="text-sm">Pending</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Property Details */}
                  {tenancy.property && (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3">Property Details</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Type:</span>
                          <div className="font-medium capitalize">{tenancy.property.propertyType}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Bedrooms:</span>
                          <div className="font-medium">{tenancy.property.bedrooms}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Bathrooms:</span>
                          <div className="font-medium">{tenancy.property.bathrooms}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Furnished:</span>
                          <div className="font-medium">{tenancy.property.furnished ? 'Yes' : 'No'}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    {!tenancy.signedByTenant && (
                      <Button size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Sign Agreement
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      View Agreement
                    </Button>
                    {tenancy.active && (
                      <>
                        <Button variant="outline" size="sm">
                          Request Maintenance
                        </Button>
                        <Button variant="outline" size="sm">
                          Contact Landlord
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}