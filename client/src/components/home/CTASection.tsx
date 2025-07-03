import { Link } from 'wouter';
import { ArrowRight, User, Home, Building } from 'lucide-react';

export default function CTASection() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Why Choose UniRent?
            </h2>
            <p className="text-lg text-gray-600">
              Whether you're a student looking for a place, a landlord with properties, or an agent managing rentals, 
              UniRent has you covered with tailored solutions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* For Students */}
            <div className="bg-blue-50 rounded-lg p-6 text-center shadow-md transform hover:scale-105 transition-transform duration-300">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">For Students</h3>
              <p className="text-gray-600 mb-6">
                Find all-inclusive student properties near your university with no hidden costs. All bills covered!
              </p>
              <Link href="/register?type=tenant">
                <span className="inline-flex items-center text-primary font-medium hover:underline cursor-pointer">
                  Register as a Student <ArrowRight className="ml-1 h-4 w-4" />
                </span>
              </Link>
            </div>

            {/* For Landlords */}
            <div className="bg-indigo-50 rounded-lg p-6 text-center shadow-md transform hover:scale-105 transition-transform duration-300">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Home className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">For Landlords</h3>
              <p className="text-gray-600 mb-6">
                List your properties to verified students and manage your portfolio with our efficient tools.
              </p>
              <Link href="/register?type=landlord">
                <span className="inline-flex items-center text-primary font-medium hover:underline cursor-pointer">
                  Register as a Landlord <ArrowRight className="ml-1 h-4 w-4" />
                </span>
              </Link>
            </div>

            {/* For Agents */}
            <div className="bg-violet-50 rounded-lg p-6 text-center shadow-md transform hover:scale-105 transition-transform duration-300">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">For Agents</h3>
              <p className="text-gray-600 mb-6">
                Manage multiple properties, handle tenant inquiries, and grow your business with our platform.
              </p>
              <Link href="/register?type=agent">
                <span className="inline-flex items-center text-primary font-medium hover:underline cursor-pointer">
                  Register as an Agent <ArrowRight className="ml-1 h-4 w-4" />
                </span>
              </Link>
            </div>
          </div>

          {/* Compliance Notice */}
          <div className="mt-16 bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3">UK Housing Compliance</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-green-100 p-2 rounded-full mr-3">
                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">HMO Licensing</h4>
                  <p className="text-sm text-gray-600">All multi-occupancy properties are properly licensed</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-green-100 p-2 rounded-full mr-3">
                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Right to Rent</h4>
                  <p className="text-sm text-gray-600">Identity verification compliant with UK legislation</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-green-100 p-2 rounded-full mr-3">
                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Deposit Protection</h4>
                  <p className="text-sm text-gray-600">All deposits secured in government-approved schemes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}