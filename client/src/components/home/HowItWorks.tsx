import { Check, Search, FileCheck, Home } from "lucide-react";

export default function HowItWorks() {
  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">How UniRent Works</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center">
            <div className="bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center mb-4">
              <Search className="text-primary h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2">1. Find Your Property</h3>
            <p className="text-gray-600">Search our verified listings to find your perfect student home near your university.</p>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center mb-4">
              <FileCheck className="text-primary h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2">2. Easy Verification</h3>
            <p className="text-gray-600">Complete your profile and verify your identity using our secure AI verification system.</p>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center mb-4">
              <Home className="text-primary h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2">3. Sign & Move In</h3>
            <p className="text-gray-600">Sign your tenancy agreement online and manage everything through your tenant portal.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
