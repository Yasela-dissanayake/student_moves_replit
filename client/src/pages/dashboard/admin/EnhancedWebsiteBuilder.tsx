import React from "react";
import { EnhancedWebsiteBuilder as EnhancedWebsiteBuilderComponent } from "@/components/admin/EnhancedWebsiteBuilder";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Code2 } from "lucide-react";

export default function EnhancedWebsiteBuilderPage() {
  return (
    <DashboardShell>
      <div className="container mx-auto p-4">
        <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:items-center mb-6">
          <div className="flex items-center space-x-4">
            <motion.div
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Link href="/dashboard/admin">
                <button 
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 gap-2 pl-1"
                  onClick={() => window.location.href = '/dashboard/admin'}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </button>
              </Link>
            </motion.div>
            <div>
              <motion.div
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="flex items-center gap-2"
              >
                <Code2 className="h-6 w-6 text-red-600" />
                <h1 className="text-3xl font-bold">UniRent WebCraft</h1>
              </motion.div>
              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="text-lg text-muted-foreground"
              >
                AI-powered website builder for custom development
              </motion.p>
            </div>
          </div>
        </div>
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid gap-4"
        >
          <EnhancedWebsiteBuilderComponent />
        </motion.div>
      </div>
    </DashboardShell>
  );
}