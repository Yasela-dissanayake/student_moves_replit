import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import DashboardLayout from "@/components/layout/DashboardLayout";
import RightToRentVerification from "@/components/verification/RightToRentVerification";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function RightToRentPage() {
  // Get the user's ID from the API
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['/api/user'],
  });

  if (isLoadingUser) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center min-h-[40vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <Helmet>
          <title>Right to Rent Verification | UniRent</title>
        </Helmet>

        <div className="mb-8">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">
                  <Home className="h-4 w-4 mr-1" />
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/verification/right-to-rent">Right to Rent</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <Tabs defaultValue="verification" className="space-y-8">
          <TabsList>
            <TabsTrigger value="verification">Verification</TabsTrigger>
            <TabsTrigger value="information">Information</TabsTrigger>
          </TabsList>
          
          <TabsContent value="verification" className="space-y-8">
            <RightToRentVerification userId={user?.id} />
          </TabsContent>
          
          <TabsContent value="information" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Right to Rent Information</CardTitle>
                <CardDescription>
                  Essential information about Right to Rent requirements in the UK
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="prose max-w-none">
                  <h3>What is Right to Rent?</h3>
                  <p>
                    The Right to Rent scheme was introduced as part of the Immigration Act 2014. 
                    It requires landlords and letting agents in England to check that all tenants 
                    who occupy their properties have legal status to live in the UK.
                  </p>
                  
                  <h3>Who needs to be checked?</h3>
                  <p>
                    All adult tenants (18 years and older) need to be checked, regardless of nationality. 
                    This includes:
                  </p>
                  <ul>
                    <li>British citizens</li>
                    <li>EU/EEA citizens (who now need immigration status under the EU Settlement Scheme)</li>
                    <li>Non-EU/EEA citizens</li>
                  </ul>
                  
                  <h3>What documents are accepted?</h3>
                  <p>
                    Acceptable documents for UK and Irish citizens include:
                  </p>
                  <ul>
                    <li>UK passport</li>
                    <li>Irish passport</li>
                    <li>UK birth certificate with additional proof of ID</li>
                    <li>UK driving license</li>
                  </ul>
                  
                  <p>
                    For EU/EEA citizens:
                  </p>
                  <ul>
                    <li>EU Settlement Scheme status (pre-settled or settled status)</li>
                    <li>EU/EEA passport with additional evidence</li>
                  </ul>
                  
                  <p>
                    For non-EU/EEA citizens:
                  </p>
                  <ul>
                    <li>Biometric Residence Permit</li>
                    <li>Biometric Residence Card</li>
                    <li>Passport with valid visa</li>
                  </ul>
                  
                  <h3>What if I don't have the right documents?</h3>
                  <p>
                    If you don't have the standard documents, the Home Office offers a Landlord Checking Service 
                    where you can get a share code or a letter confirming your right to rent. Contact the Home Office 
                    for more information.
                  </p>
                  
                  <h3>Time-limited right to rent</h3>
                  <p>
                    Some people have a time-limited right to rent, such as those with pre-settled status or a time-limited visa. 
                    In these cases, follow-up checks will be required before the expiry date.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}