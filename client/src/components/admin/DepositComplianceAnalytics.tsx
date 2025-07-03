import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, LineChart, Line 
} from "recharts";
import { AlertCircle, Clock, TrendingUp, TrendingDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ProtectionStatistics {
  totalDeposits: number;
  protectedDeposits: number;
  unprotectedDeposits: number;
  depositsByScheme: {
    dps: number;
    mydeposits: number;
    tds: number;
  };
  expiringProtections: {
    next30Days: number;
    next60Days: number;
    next90Days: number;
  };
  complianceHistory: Array<{
    month: string;
    protectedRate: number;
    newDeposits: number;
  }>;
  averageProtectionTime: number; // in days
  riskAssessment: 'low' | 'medium' | 'high';
}

interface PieChartData {
  name: string;
  value: number;
}

interface Tenant {
  id: number;
  name: string;
  email: string;
}

interface Property {
  id: number;
  title: string;
  address: string;
}

interface ExpiringProtection {
  id: number;
  tenancyId: number;
  tenancy: {
    id: number;
    startDate: string;
    endDate: string;
    depositAmount: string;
    depositProtectionScheme: string;
    depositProtectionId: string;
    protectionExpiryDate: string;
  };
  tenant: Tenant;
  property: Property;
  daysUntilExpiry: number;
}

const DepositComplianceAnalytics: React.FC = () => {
  // Fetch protection statistics
  const { data: statistics, isLoading, error } = useQuery({
    queryKey: ['/api/deposit-protection/statistics'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/deposit-protection/statistics');
        const data = await response.json();
        return data;
      } catch (err) {
        console.error('Error fetching deposit protection statistics:', err);
        return {};
      }
    },
  });

  const { data: expiringProtections = [] } = useQuery({
    queryKey: ['/api/deposit-protection/expiring'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/deposit-protection/expiring');
        const data = await response.json();
        return data;
      } catch (err) {
        console.error('Error fetching expiring protections:', err);
        return [];
      }
    },
  });

  // Use demo data for development
  const demoStatistics: ProtectionStatistics = statistics || {
    totalDeposits: 128,
    protectedDeposits: 119,
    unprotectedDeposits: 9,
    depositsByScheme: {
      dps: 72,
      mydeposits: 31,
      tds: 16
    },
    expiringProtections: {
      next30Days: 4,
      next60Days: 8,
      next90Days: 15
    },
    complianceHistory: [
      { month: 'Jan', protectedRate: 87, newDeposits: 10 },
      { month: 'Feb', protectedRate: 89, newDeposits: 8 },
      { month: 'Mar', protectedRate: 91, newDeposits: 12 },
      { month: 'Apr', protectedRate: 94, newDeposits: 7 },
      { month: 'May', protectedRate: 93, newDeposits: 15 },
      { month: 'Jun', protectedRate: 95, newDeposits: 9 }
    ],
    averageProtectionTime: 18, // in days
    riskAssessment: 'low'
  };

  const demoExpiringProtections: ExpiringProtection[] = expiringProtections.length > 0 ? expiringProtections : [
    {
      id: 1,
      tenancyId: 153,
      tenancy: {
        id: 153,
        startDate: '2024-09-01',
        endDate: '2025-08-31',
        depositAmount: '950.00',
        depositProtectionScheme: 'dps',
        depositProtectionId: 'DPS-12345678',
        protectionExpiryDate: '2025-05-15'
      },
      tenant: {
        id: 245,
        name: 'James Wilson',
        email: 'james.wilson@example.com'
      },
      property: {
        id: 67,
        title: 'Modern 2-Bed Apartment',
        address: '15 Park Avenue, Manchester, M1 5AB'
      },
      daysUntilExpiry: 12
    },
    {
      id: 2,
      tenancyId: 187,
      tenancy: {
        id: 187,
        startDate: '2024-07-15',
        endDate: '2025-07-14',
        depositAmount: '1100.00',
        depositProtectionScheme: 'mydeposits',
        depositProtectionId: 'MYD-87654321',
        protectionExpiryDate: '2025-05-28'
      },
      tenant: {
        id: 302,
        name: 'Emily Johnson',
        email: 'emily.j@example.com'
      },
      property: {
        id: 42,
        title: 'Spacious 3-Bed House',
        address: '27 University Road, Leeds, LS2 9JT'
      },
      daysUntilExpiry: 25
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading compliance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load deposit protection compliance data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  const pieData: PieChartData[] = [
    { name: 'DPS', value: demoStatistics.depositsByScheme.dps },
    { name: 'mydeposits', value: demoStatistics.depositsByScheme.mydeposits },
    { name: 'TDS', value: demoStatistics.depositsByScheme.tds }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

  const complianceRate = Math.round((demoStatistics.protectedDeposits / demoStatistics.totalDeposits) * 100);

  return (
    <div className="space-y-8">
      {/* Compliance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{complianceRate}%</div>
              <p className="text-sm text-muted-foreground">Protection Rate</p>
              <Progress 
                value={complianceRate} 
                className="h-2 mt-2" 
                indicatorColor={complianceRate >= 95 ? 'bg-green-500' : complianceRate >= 85 ? 'bg-amber-500' : 'bg-red-500'} 
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{demoStatistics.unprotectedDeposits}</div>
              <p className="text-sm text-muted-foreground">Unprotected Deposits</p>
              {demoStatistics.unprotectedDeposits > 0 && (
                <div className="flex items-center justify-center mt-2 text-xs text-red-500">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Requires immediate action
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{demoStatistics.expiringProtections.next30Days}</div>
              <p className="text-sm text-muted-foreground">Expiring in 30 Days</p>
              {demoStatistics.expiringProtections.next30Days > 0 && (
                <div className="flex items-center justify-center mt-2 text-xs text-amber-500">
                  <Clock className="h-3 w-3 mr-1" />
                  Renewal required soon
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{demoStatistics.averageProtectionTime} days</div>
              <p className="text-sm text-muted-foreground">Avg. Protection Time</p>
              {demoStatistics.averageProtectionTime <= 14 ? (
                <div className="flex items-center justify-center mt-2 text-xs text-green-500">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  Excellent performance
                </div>
              ) : demoStatistics.averageProtectionTime <= 25 ? (
                <div className="flex items-center justify-center mt-2 text-xs text-amber-500">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Room for improvement
                </div>
              ) : (
                <div className="flex items-center justify-center mt-2 text-xs text-red-500">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Exceeding legal limits
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Alert */}
      {demoStatistics.unprotectedDeposits > 0 && (
        <Alert variant={demoStatistics.unprotectedDeposits > 5 ? "destructive" : "default"} className="border-amber-200 bg-amber-50 text-amber-900">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Attention Required</AlertTitle>
          <AlertDescription>
            You have {demoStatistics.unprotectedDeposits} deposits that are not protected. This puts you at risk of non-compliance penalties. 
            <a href="#" className="font-medium underline ml-1">Protect now</a>.
          </AlertDescription>
        </Alert>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Protection Scheme Distribution</CardTitle>
            <CardDescription>Deposit distribution across protection schemes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compliance Trend</CardTitle>
            <CardDescription>6-month trend of deposit protection rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={demoStatistics.complianceHistory}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="protectedRate"
                    name="Protected Rate (%)"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                  />
                  <Line type="monotone" dataKey="newDeposits" name="New Deposits" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expiring Protections Table */}
      <Card>
        <CardHeader>
          <CardTitle>Expiring Protections</CardTitle>
          <CardDescription>Deposit protections that require renewal soon</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="text-left p-2">Tenant</th>
                  <th className="text-left p-2">Property</th>
                  <th className="text-left p-2">Scheme</th>
                  <th className="text-left p-2">Protection ID</th>
                  <th className="text-right p-2">Deposit</th>
                  <th className="text-left p-2">Expiry Date</th>
                  <th className="text-right p-2">Days Left</th>
                </tr>
              </thead>
              <tbody>
                {demoExpiringProtections.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-muted/50">
                    <td className="p-2">{item.tenant.name}</td>
                    <td className="p-2">{item.property.title}</td>
                    <td className="p-2 capitalize">{item.tenancy.depositProtectionScheme}</td>
                    <td className="p-2">{item.tenancy.depositProtectionId}</td>
                    <td className="p-2 text-right">£{item.tenancy.depositAmount}</td>
                    <td className="p-2">{new Date(item.tenancy.protectionExpiryDate).toLocaleDateString()}</td>
                    <td className={`p-2 text-right font-medium ${
                      item.daysUntilExpiry <= 14 ? 'text-red-500' :
                      item.daysUntilExpiry <= 30 ? 'text-amber-500' : 'text-green-500'
                    }`}>
                      {item.daysUntilExpiry}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DepositComplianceAnalytics;