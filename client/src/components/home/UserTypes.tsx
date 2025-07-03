import { Link } from "wouter";
import { GraduationCap, Home, Briefcase, ShieldCheck, Check } from "lucide-react";

export default function UserTypes() {
  return (
    <section className="py-12 bg-light">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4">Who Uses UniRent?</h2>
        <p className="text-center mb-12 text-gray-600 max-w-3xl mx-auto">Our platform connects students, landlords, and agents with powerful tools for everyone.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="flex items-center mb-4">
              <div className="bg-primary/10 text-primary rounded-full p-3 mr-4">
                <GraduationCap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold">For Students</h3>
            </div>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mt-1 mr-2 flex-shrink-0" />
                <span>Find verified all-inclusive properties</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mt-1 mr-2 flex-shrink-0" />
                <span>Easy online contract signing</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mt-1 mr-2 flex-shrink-0" />
                <span>Manage payments in one place</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mt-1 mr-2 flex-shrink-0" />
                <span>24/7 access to tenancy details</span>
              </li>
            </ul>
            <Link href="/properties" className="mt-6 inline-block font-medium text-primary hover:underline">
              Find your property <span aria-hidden="true">→</span>
            </Link>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="flex items-center mb-4">
              <div className="bg-primary/10 text-primary rounded-full p-3 mr-4">
                <Home className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold">For Landlords</h3>
            </div>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mt-1 mr-2 flex-shrink-0" />
                <span>List properties to verified students</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mt-1 mr-2 flex-shrink-0" />
                <span>Automated Right to Rent checks</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mt-1 mr-2 flex-shrink-0" />
                <span>Simple property management tools</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mt-1 mr-2 flex-shrink-0" />
                <span>Automated deposit protection</span>
              </li>
            </ul>
            <Link href="/register" className="mt-6 inline-block font-medium text-primary hover:underline">
              Register as landlord <span aria-hidden="true">→</span>
            </Link>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="flex items-center mb-4">
              <div className="bg-primary/10 text-primary rounded-full p-3 mr-4">
                <Briefcase className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold">For Agents</h3>
            </div>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mt-1 mr-2 flex-shrink-0" />
                <span>Advanced portfolio management</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mt-1 mr-2 flex-shrink-0" />
                <span>HMO compliance tools</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mt-1 mr-2 flex-shrink-0" />
                <span>AI description generation</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mt-1 mr-2 flex-shrink-0" />
                <span>Integrated marketing features</span>
              </li>
            </ul>
            <Link href="/register" className="mt-6 inline-block font-medium text-primary hover:underline">
              Register as agent <span aria-hidden="true">→</span>
            </Link>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="flex items-center mb-4">
              <div className="bg-primary/10 text-primary rounded-full p-3 mr-4">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold">For Admins</h3>
            </div>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mt-1 mr-2 flex-shrink-0" />
                <span>Platform monitoring tools</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mt-1 mr-2 flex-shrink-0" />
                <span>Agent & landlord verification</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mt-1 mr-2 flex-shrink-0" />
                <span>AI marketing automation</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mt-1 mr-2 flex-shrink-0" />
                <span>System maintenance monitoring</span>
              </li>
            </ul>
            <Link href="/login" className="mt-6 inline-block font-medium text-primary hover:underline">
              Admin portal <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
