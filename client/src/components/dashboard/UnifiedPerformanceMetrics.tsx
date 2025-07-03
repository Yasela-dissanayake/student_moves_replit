import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  CircleDollarSign,
  Home,
  Users,
  Calendar,
  ClipboardCheck,
  ArrowUp,
  ArrowDown,
  Minus,
  Wrench,
  Building,
  Percent,
  MessageSquare,
  Star,
  Activity,
  TrendingUp,
  TrendingDown
} from "lucide-react";

// Define the performance metric interface
interface PerformanceMetric {
  title: string;
  value: number | string;
  description: string;
  icon: React.ReactNode;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
  change?: string;
  progress?: number;
}

interface UnifiedPerformanceMetricsProps {
  userType: 'agent' | 'landlord';
  data: {
    properties: any[];
    tenancies: any[];
    applications: any[];
    maintenanceRequests?: any[];
    payments?: any[];
    calendarEvents?: any[];
    contractors?: any[];
  };
}

// Metric card component
function MetricCard({ metric }: { metric: PerformanceMetric }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              {metric.title}
            </p>
            <div className="flex items-center">
              <h3 className="text-2xl font-bold">
                {metric.value}
              </h3>
              {metric.trend && (
                <span className={`ml-2 flex items-center text-sm ${
                  metric.trend === 'up' ? 'text-green-600' : 
                  metric.trend === 'down' ? 'text-red-600' : 
                  'text-gray-500'
                }`}>
                  {metric.trend === 'up' ? (
                    <ArrowUp className="h-4 w-4 mr-1" />
                  ) : metric.trend === 'down' ? (
                    <ArrowDown className="h-4 w-4 mr-1" />
                  ) : (
                    <Minus className="h-4 w-4 mr-1" />
                  )}
                  {metric.change}
                </span>
              )}
            </div>
          </div>
          <div className={`p-2 rounded-full bg-opacity-20 ${metric.color}`}>
            {metric.icon}
          </div>
        </div>
        
        <p className="mt-2 text-xs text-muted-foreground">
          {metric.description}
        </p>
        
        {metric.progress !== undefined && (
          <div className="mt-3 space-y-1">
            <Progress value={metric.progress} className="h-1" />
            <p className="text-xs text-right text-muted-foreground">
              {metric.progress}%
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function UnifiedPerformanceMetrics({ userType, data }: UnifiedPerformanceMetricsProps) {
  // Calculate metrics based on the provided dashboard data
  const propertyMetrics = calculatePropertyMetrics(data.properties);
  const tenancyMetrics = calculateTenancyMetrics(data.tenancies);
  const financialMetrics = calculateFinancialMetrics(data);
  
  // Additional metrics for agents
  const agentMetrics = userType === 'agent' 
    ? calculateAgentMetrics(data) 
    : [];
  
  return (
    <div className="space-y-4">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="tenancies">Tenancies</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              metric={{
                title: 'Total Properties',
                value: data.properties.length,
                description: `${data.properties.filter(p => p.available).length} available for rent`,
                icon: <Building className="h-5 w-5 text-blue-600" />,
                color: 'bg-blue-100',
              }}
            />
            <MetricCard
              metric={{
                title: 'Active Tenancies',
                value: data.tenancies.filter(t => t.active).length,
                description: 'Currently occupied properties',
                icon: <Users className="h-5 w-5 text-purple-600" />,
                color: 'bg-purple-100',
              }}
            />
            <MetricCard
              metric={{
                title: 'Monthly Revenue',
                value: `£${calculateMonthlyRevenue(data.tenancies).toLocaleString()}`,
                description: 'Recurring monthly income',
                icon: <CircleDollarSign className="h-5 w-5 text-green-600" />,
                color: 'bg-green-100',
              }}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="properties" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {propertyMetrics.map((metric, index) => (
              <MetricCard key={index} metric={metric} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="tenancies" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tenancyMetrics.map((metric, index) => (
              <MetricCard key={index} metric={metric} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="financial" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {financialMetrics.map((metric, index) => (
              <MetricCard key={index} metric={metric} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
      
      {userType === 'agent' && agentMetrics.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Agent Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {agentMetrics.map((metric, index) => (
              <MetricCard key={index} metric={metric} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Calculate property-related metrics
function calculatePropertyMetrics(properties: any[]): PerformanceMetric[] {
  // Calculate occupancy rate
  const occupiedProperties = properties.filter(p => !p.available).length;
  const occupancyRate = properties.length > 0 
    ? Math.round((occupiedProperties / properties.length) * 100) 
    : 0;
  
  // Calculate property compliance
  const compliantProperties = properties.filter(p => 
    p.epcRating && 
    p.gasChecked && 
    p.electricalChecked && 
    (p.bedrooms <= 4 || p.hmoLicensed)
  ).length;
  
  const complianceRate = properties.length > 0 
    ? Math.round((compliantProperties / properties.length) * 100) 
    : 0;
  
  // Get property types distribution
  const propertyTypes = properties.reduce((acc: Record<string, number>, property) => {
    const type = property.propertyType;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  
  const mostCommonType = Object.entries(propertyTypes)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .map(([type, count]) => ({ type, count }))[0]?.type || 'N/A';
  
  return [
    {
      title: 'Occupancy Rate',
      value: `${occupancyRate}%`,
      description: `${occupiedProperties} out of ${properties.length} properties occupied`,
      icon: <Percent className="h-5 w-5 text-green-600" />,
      color: 'bg-green-100',
      progress: occupancyRate
    },
    {
      title: 'Compliance Rate',
      value: `${complianceRate}%`,
      description: `${compliantProperties} fully compliant properties`,
      icon: <ClipboardCheck className="h-5 w-5 text-blue-600" />,
      color: 'bg-blue-100',
      progress: complianceRate
    },
    {
      title: 'Average Property Value',
      value: `£${calculateAveragePropertyValue(properties).toLocaleString()}`,
      description: `Most common type: ${mostCommonType}`,
      icon: <Home className="h-5 w-5 text-purple-600" />,
      color: 'bg-purple-100',
    },
  ];
}

// Calculate tenancy-related metrics
function calculateTenancyMetrics(tenancies: any[]): PerformanceMetric[] {
  const activeTenancies = tenancies.filter(t => t.active).length;
  
  // Calculate average tenancy length in months
  const tenancyLengths = tenancies.map(t => {
    const start = new Date(t.startDate);
    const end = t.active ? new Date() : new Date(t.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    return diffMonths;
  });
  
  const averageTenancyLength = tenancyLengths.length > 0
    ? Math.round(tenancyLengths.reduce((sum, length) => sum + length, 0) / tenancyLengths.length)
    : 0;
  
  // Calculate tenancy renewal rate
  const renewedTenancies = tenancies.filter(t => t.renewed).length;
  const completedTenancies = tenancies.filter(t => !t.active).length;
  
  const renewalRate = completedTenancies > 0
    ? Math.round((renewedTenancies / completedTenancies) * 100)
    : 0;
  
  return [
    {
      title: 'Active Tenancies',
      value: activeTenancies,
      description: `Out of ${tenancies.length} total tenancies`,
      icon: <Users className="h-5 w-5 text-indigo-600" />,
      color: 'bg-indigo-100',
    },
    {
      title: 'Average Tenancy Length',
      value: `${averageTenancyLength} months`,
      description: 'For completed tenancies',
      icon: <Calendar className="h-5 w-5 text-amber-600" />,
      color: 'bg-amber-100',
    },
    {
      title: 'Renewal Rate',
      value: `${renewalRate}%`,
      description: `${renewedTenancies} renewed out of ${completedTenancies} completed`,
      icon: <TrendingUp className="h-5 w-5 text-green-600" />,
      color: 'bg-green-100',
      progress: renewalRate
    },
  ];
}

// Calculate financial metrics
function calculateFinancialMetrics(data: UnifiedPerformanceMetricsProps['data']): PerformanceMetric[] {
  const { tenancies, payments = [] } = data;
  
  // Calculate monthly revenue
  const monthlyRevenue = calculateMonthlyRevenue(tenancies);
  
  // Calculate total deposits held
  const totalDeposits = tenancies
    .filter((t: any) => t.active)
    .reduce((sum: number, tenancy: any) => sum + parseFloat(tenancy.depositAmount), 0);
  
  // Calculate payment metrics
  const onTimePayments = payments.filter((p: any) => p.status === 'paid' && new Date(p.paidDate) <= new Date(p.dueDate)).length;
  const totalPayments = payments.filter((p: any) => p.status === 'paid').length;
  
  const onTimeRate = totalPayments > 0
    ? Math.round((onTimePayments / totalPayments) * 100)
    : 0;
  
  return [
    {
      title: 'Monthly Revenue',
      value: `£${monthlyRevenue.toLocaleString()}`,
      description: 'Recurring monthly income',
      icon: <CircleDollarSign className="h-5 w-5 text-green-600" />,
      color: 'bg-green-100',
    },
    {
      title: 'Total Deposits Held',
      value: `£${totalDeposits.toLocaleString()}`,
      description: 'Protected under deposit schemes',
      icon: <CircleDollarSign className="h-5 w-5 text-cyan-600" />,
      color: 'bg-cyan-100',
    },
    {
      title: 'On-Time Payment Rate',
      value: `${onTimeRate}%`,
      description: `${onTimePayments} on-time out of ${totalPayments} payments`,
      icon: <ClipboardCheck className="h-5 w-5 text-amber-600" />,
      color: 'bg-amber-100',
      progress: onTimeRate
    },
  ];
}

// Calculate agent-specific metrics
function calculateAgentMetrics(data: UnifiedPerformanceMetricsProps['data']): PerformanceMetric[] {
  const { properties, applications = [], maintenanceRequests = [] } = data;
  
  // Calculate application conversion rate
  const approvedApplications = applications.filter((a: any) => a.status === 'approved').length;
  const totalApplications = applications.length;
  
  const conversionRate = totalApplications > 0
    ? Math.round((approvedApplications / totalApplications) * 100)
    : 0;
  
  // Calculate maintenance resolution time and rate
  const resolvedRequests = maintenanceRequests.filter((r: any) => r.status === 'completed').length;
  const totalRequests = maintenanceRequests.length;
  
  const resolutionRate = totalRequests > 0
    ? Math.round((resolvedRequests / totalRequests) * 100)
    : 0;
  
  // Calculate average response time
  const responseTimes = maintenanceRequests
    .filter((r: any) => r.respondedDate && r.reportedDate)
    .map((r: any) => {
      const reportedDate = new Date(r.reportedDate);
      const respondedDate = new Date(r.respondedDate);
      const diffTime = Math.abs(respondedDate.getTime() - reportedDate.getTime());
      const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
      return diffHours;
    });
  
  const averageResponseTime = responseTimes.length > 0
    ? Math.round(responseTimes.reduce((sum: number, time: number) => sum + time, 0) / responseTimes.length)
    : 0;
  
  return [
    {
      title: 'Lead Conversion',
      value: `${conversionRate}%`,
      description: `${approvedApplications} approved from ${totalApplications} applications`,
      icon: <Users className="h-5 w-5 text-emerald-600" />,
      color: 'bg-emerald-100',
      progress: conversionRate
    },
    {
      title: 'Maintenance Resolution',
      value: `${resolutionRate}%`,
      description: `${resolvedRequests} resolved out of ${totalRequests} requests`,
      icon: <Wrench className="h-5 w-5 text-amber-600" />,
      color: 'bg-amber-100',
      progress: resolutionRate
    },
    {
      title: 'Avg. Response Time',
      value: `${averageResponseTime} hrs`,
      description: 'For maintenance requests',
      icon: <MessageSquare className="h-5 w-5 text-indigo-600" />,
      color: 'bg-indigo-100',
    },
    {
      title: 'Vacant Properties',
      value: properties.filter((p: any) => p.available).length,
      description: 'Properties ready to let',
      icon: <Home className="h-5 w-5 text-blue-600" />,
      color: 'bg-blue-100',
    },
  ];
}

// Helper functions
function calculateMonthlyRevenue(tenancies: any[]): number {
  return tenancies
    .filter((t: any) => t.active)
    .reduce((sum: number, tenancy: any) => sum + parseFloat(tenancy.rentAmount), 0);
}

function calculateAveragePropertyValue(properties: any[]): number {
  const prices = properties.map((p: any) => parseFloat(p.price));
  return prices.length > 0
    ? Math.round(prices.reduce((sum: number, price: number) => sum + price, 0) / prices.length)
    : 0;
}