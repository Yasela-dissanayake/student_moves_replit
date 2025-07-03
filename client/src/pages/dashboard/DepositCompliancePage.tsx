import React from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Shield } from "lucide-react";
import DepositComplianceAnalytics from "../../components/admin/DepositComplianceAnalytics";
import { Link } from "wouter";

const DepositCompliancePage = () => {
  return (
    <DashboardLayout>
      <div className="p-6 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Deposit Protection Compliance</h1>
            <p className="text-muted-foreground">
              Track and monitor compliance with UK deposit protection regulations
            </p>
          </div>
          <div className="flex space-x-3">
            <Link href="/dashboard/admin">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                Back to Dashboard
              </Button>
            </Link>
            <Button 
              size="sm" 
              className="flex items-center gap-2"
              onClick={() => alert("Downloading comprehensive compliance report...")}
            >
              <Download size={18} />
              Download Full Report
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-indigo-600" />
              <CardTitle>Deposit Protection Compliance Analytics</CardTitle>
            </div>
            <CardDescription>
              Real-time overview of deposit protection status and compliance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DepositComplianceAnalytics />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Legal Requirements</CardTitle>
              <CardDescription>UK deposit protection legislation overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">30-Day Protection Requirement</h3>
                <p className="text-sm text-muted-foreground">
                  All tenant deposits must be protected with an approved scheme within 30 days of receipt. Failure to comply may result in penalties of up to 3x the deposit amount.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Approved Schemes</h3>
                <p className="text-sm text-muted-foreground">
                  The UK government has approved three protection schemes: Deposit Protection Service (DPS), mydeposits, and Tenancy Deposit Scheme (TDS).
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Prescribed Information</h3>
                <p className="text-sm text-muted-foreground">
                  Landlords and agents must provide tenants with prescribed information about their deposit protection within 30 days of receiving the deposit.
                </p>
              </div>
              <Button variant="outline" className="w-full mt-4" onClick={() => window.open("https://www.gov.uk/tenancy-deposit-protection", "_blank")}>
                View Official Guidance
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Best Practices</CardTitle>
              <CardDescription>Ensuring full compliance with deposit protection regulations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Documentation and Records</h3>
                <p className="text-sm text-muted-foreground">
                  Maintain comprehensive records of all deposit transactions, protection certificates, and prescribed information receipts.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Automated Registration</h3>
                <p className="text-sm text-muted-foreground">
                  Use our automatic deposit registration feature to ensure all deposits are protected within legal timeframes.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Regular Audits</h3>
                <p className="text-sm text-muted-foreground">
                  Conduct monthly reviews of deposit protection status using our analytics dashboard to identify and address compliance issues.
                </p>
              </div>
              <Button variant="default" className="w-full mt-4" onClick={() => alert("Opening automatic registration wizard...")}>
                Register Unprotected Deposits
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DepositCompliancePage;