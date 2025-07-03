import { ReactNode } from "react";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

interface AgentPageTemplateProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export default function AgentPageTemplate({
  title,
  description,
  children
}: AgentPageTemplateProps) {
  return (
    <DashboardLayout dashboardType="agent">
      <Helmet>
        <title>{title} | UniRent Agent</title>
      </Helmet>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            {description && (
              <p className="text-muted-foreground mt-2">{description}</p>
            )}
          </div>
          <Link href="/dashboard/agent">
            <Button variant="outline" className="shrink-0">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        <div className="border-t" />
        {children}
      </div>
    </DashboardLayout>
  );
}