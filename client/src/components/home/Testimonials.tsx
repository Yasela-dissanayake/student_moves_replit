import { Star, StarHalf } from "lucide-react";

export default function Testimonials() {
  return (
    <section className="py-12 bg-light">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">What Our Users Say</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center mb-4 text-amber-400">
              <Star className="fill-current" />
              <Star className="fill-current" />
              <Star className="fill-current" />
              <Star className="fill-current" />
              <Star className="fill-current" />
            </div>
            <p className="text-gray-600 mb-4">"Finding student accommodation has never been easier. I found a great flat near my university and the entire process was so smooth!"</p>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full overflow-hidden mr-3 bg-gray-200 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="font-medium">Sarah J.</p>
                <p className="text-sm text-gray-500">Student, University of Manchester</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center mb-4 text-amber-400">
              <Star className="fill-current" />
              <Star className="fill-current" />
              <Star className="fill-current" />
              <Star className="fill-current" />
              <Star className="fill-current" />
            </div>
            <p className="text-gray-600 mb-4">"As a landlord, the verification system gives me peace of mind. The dashboard makes managing my properties and tenants incredibly simple."</p>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full overflow-hidden mr-3 bg-gray-200 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="font-medium">David T.</p>
                <p className="text-sm text-gray-500">Landlord, Leeds</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center mb-4 text-amber-400">
              <Star className="fill-current" />
              <Star className="fill-current" />
              <Star className="fill-current" />
              <Star className="fill-current" />
              <StarHalf className="fill-current" />
            </div>
            <p className="text-gray-600 mb-4">"The AI tools save us so much time when creating property listings. The compliance features ensure we're always following the latest regulations."</p>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full overflow-hidden mr-3 bg-gray-200 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="font-medium">Emma P.</p>
                <p className="text-sm text-gray-500">Letting Agent, Birmingham</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
