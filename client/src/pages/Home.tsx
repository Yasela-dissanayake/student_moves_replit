import HeroSection from '@/components/home/HeroSection';
import CompactPropertyGrid from '@/components/home/CompactPropertyGrid';
import PropertyRecommendations from '@/components/home/PropertyRecommendations';

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <HeroSection />
      

      {/* Personalized Recommendations */}
      <section className="bg-slate-50">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-3">Personalized For You</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              AI-powered recommendations based on your preferences and browsing history
            </p>
          </div>
          <PropertyRecommendations />
        </div>
      </section>
      
      {/* Featured Properties */}
      <section className="bg-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-3">Some Of Our Favourite Properties</h2>
          </div>
          <CompactPropertyGrid />
        </div>
      </section>
      
      {/* Why Choose StudentMoves */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose <span className="text-orange-500">StudentMoves</span>?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* All Bills Included */}
            <div className="bg-orange-50 rounded-lg p-8 text-center border border-orange-100">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 7h-9" />
                  <path d="M14 17H5" />
                  <circle cx="17" cy="17" r="3" />
                  <circle cx="7" cy="7" r="3" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-orange-600 mb-4">All Bills Included</h3>
              <p className="text-gray-600">
                Gas, electricity, water, broadband, maintenance and property management all included in one simple package
              </p>
            </div>

            {/* Safe & Secure */}
            <div className="bg-green-50 rounded-lg p-8 text-center border border-green-100">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-green-600 mb-4">Safe & Secure</h3>
              <p className="text-gray-600">
                All properties fully compliant with HMO licensing requirements
              </p>
            </div>

            {/* AI-Verified Landlords */}
            <div className="bg-green-50 rounded-lg p-8 text-center border border-green-100">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-green-600 mb-4">AI-Verified Landlords</h3>
              <p className="text-gray-600">
                Every landlord is verified using our advanced ID verification system
              </p>
            </div>

            {/* Student Community */}
            <div className="bg-green-50 rounded-lg p-8 text-center border border-green-100">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-green-600 mb-4">Student Community</h3>
              <p className="text-gray-600">
                Connect with other students and find housemates easily
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}