import { Link } from 'wouter';
import { BarChart3, ShieldCheck, FileText, Calendar } from 'lucide-react';

export default function DashboardPreview() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Smart Property Management</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our AI-powered platform simplifies student property management for everyone involved
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          {/* Dashboard Preview Image */}
          <div className="lg:w-1/2 overflow-hidden rounded-lg shadow-xl">
            <div className="bg-white p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div className="ml-2 text-gray-700 font-medium">StudentMoves Dashboard</div>
              </div>
            </div>
            <div className="bg-gray-800 p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="text-white text-sm font-medium mb-1">Active Tenancies</div>
                  <div className="text-2xl font-bold text-white">24</div>
                  <div className="mt-2 text-green-400 text-xs">↑ 15% from last month</div>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="text-white text-sm font-medium mb-1">New Applications</div>
                  <div className="text-2xl font-bold text-white">12</div>
                  <div className="mt-2 text-green-400 text-xs">↑ 8% from last month</div>
                </div>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg mb-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-white font-medium">Rental Income</div>
                  <div className="text-white text-sm">Last 6 months</div>
                </div>
                <div className="h-32 flex items-end space-x-2">
                  <div className="bg-primary h-[40%] w-1/6 rounded-t"></div>
                  <div className="bg-primary h-[60%] w-1/6 rounded-t"></div>
                  <div className="bg-primary h-[50%] w-1/6 rounded-t"></div>
                  <div className="bg-primary h-[75%] w-1/6 rounded-t"></div>
                  <div className="bg-primary h-[65%] w-1/6 rounded-t"></div>
                  <div className="bg-primary h-[90%] w-1/6 rounded-t"></div>
                </div>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="text-white font-medium mb-3">Recent Notifications</div>
                <div className="space-y-2">
                  <div className="bg-gray-800 p-2 rounded text-sm text-gray-300">
                    <span className="text-green-400">●</span> New application received for 45 Oxford St
                  </div>
                  <div className="bg-gray-800 p-2 rounded text-sm text-gray-300">
                    <span className="text-yellow-400">●</span> Maintenance request: 12 London Rd - Heating issue
                  </div>
                  <div className="bg-gray-800 p-2 rounded text-sm text-gray-300">
                    <span className="text-blue-400">●</span> Rent payment received from John D. for 28 Cambridge Ave
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="lg:w-1/2 space-y-8">
            <div className="flex">
              <div className="flex-shrink-0 bg-primary/10 p-3 rounded-full mr-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">AI-Powered Analytics</h3>
                <p className="text-gray-600">
                  Get insights on property performance, occupancy rates, and rental income with smart analytics that predict future trends and help you make informed decisions.
                </p>
              </div>
            </div>

            <div className="flex">
              <div className="flex-shrink-0 bg-primary/10 p-3 rounded-full mr-4">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">ID Verification</h3>
                <p className="text-gray-600">
                  Our AI-powered identity verification ensures compliance with Right to Rent checks while providing a smooth experience for tenants.
                </p>
              </div>
            </div>

            <div className="flex">
              <div className="flex-shrink-0 bg-primary/10 p-3 rounded-full mr-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Automated Documents</h3>
                <p className="text-gray-600">
                  Generate compliant tenancy agreements, deposit certificates, and property descriptions instantly with our AI assistant.
                </p>
              </div>
            </div>

            <div className="flex">
              <div className="flex-shrink-0 bg-primary/10 p-3 rounded-full mr-4">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Maintenance Tracking</h3>
                <p className="text-gray-600">
                  Schedule, track, and resolve maintenance issues efficiently with our integrated system that keeps all parties informed.
                </p>
              </div>
            </div>

            <Link href="/register">
              <span className="inline-block bg-primary hover:bg-primary/90 text-white py-3 px-6 rounded-lg font-medium transition-colors cursor-pointer">
                Try Our Dashboard
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}