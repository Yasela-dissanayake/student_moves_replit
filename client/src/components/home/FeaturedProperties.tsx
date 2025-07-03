import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Bed, Heart, MapPin, Home, Star, Bath, Camera } from 'lucide-react';
import { PropertyType } from '@/lib/types';
import { getProperties } from '@/lib/api';

// Mock data for properties that matches the design
const mockProperties = [
  {
    id: 1,
    title: 'Student Flat - Headingley',
    address: '19 flat 2 Cardigan Road',
    city: 'Leeds',
    postcode: 'LS6 3AE',
    price: 142.50,
    propertyType: 'flat',
    bedrooms: 4,
    bathrooms: 2,
    available: true,
    availableDate: '1st July 25',
    university: 'University of Leeds',
    distanceToUniversity: '10 min walk',
    features: ['Bills Included', 'Great communal living space'],
    images: [],
    area: 'Headingley',
    ownerId: 1,
    createdAt: '',
    updatedAt: '',
    description: ''
  },
  {
    id: 2,
    title: 'Student House Near University',
    address: '99 Victoria Road',
    city: 'Leeds',
    postcode: 'LS6 1DR',
    price: 140,
    propertyType: 'house',
    bedrooms: 8,
    bathrooms: 3,
    available: true,
    availableDate: '1st July 25',
    university: 'University of Leeds',
    distanceToUniversity: '5 min walk',
    features: ['Bills Included', 'Fantastic student house'],
    images: [],
    area: 'Hyde Park',
    ownerId: 1,
    createdAt: '',
    updatedAt: '',
    description: ''
  },
  {
    id: 3,
    title: 'Modern Student Accommodation',
    address: '141 Brudenell Road',
    city: 'Leeds',
    postcode: 'LS6 1LS',
    price: 165,
    propertyType: 'house',
    bedrooms: 8,
    bathrooms: 8,
    available: false,
    availableDate: 'Now Let',
    university: 'Leeds Beckett University',
    distanceToUniversity: '15 min walk',
    features: ['Bills Included', 'En-suite bathrooms'],
    images: [],
    area: 'Hyde Park',
    ownerId: 1,
    createdAt: '',
    updatedAt: '',
    description: ''
  },
];

// Duplicate the mock properties to create 5 rows of 3 properties
const allMockProperties = Array(5).fill(0).flatMap(() => 
  mockProperties.map((prop, idx) => ({...prop, id: Math.random() * 1000 + idx}))
);

export default function FeaturedProperties() {
  // Fetch featured properties
  const { data: properties, isLoading } = useQuery({
    queryKey: ['/api/properties'],
    queryFn: async () => {
      try {
        return await getProperties();
      } catch (error) {
        console.error("Failed to fetch properties:", error);
        // Use mock data when API fails
        return allMockProperties;
      }
    }
  });

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-2">Some Of Our Favourite Properties</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore our selection of quality student accommodations near universities across the UK
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-300"></div>
                <div className="p-6">
                  <div className="h-6 bg-gray-300 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-5/6 mb-4"></div>
                  <div className="flex justify-between mt-4">
                    <div className="h-8 bg-gray-300 rounded w-1/4"></div>
                    <div className="h-8 bg-gray-300 rounded w-1/4"></div>
                    <div className="h-8 bg-gray-300 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !properties || properties.length === 0 ? (
          <div className="text-center py-12">
            <Home className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No properties found</h3>
            <p className="text-gray-600">
              Check back soon for new listings or adjust your search criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(properties as PropertyType[]).slice(0, 30).map((property) => (
              <div 
                key={property.id} 
                className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 cursor-pointer transition-all hover:shadow-lg"
                onClick={() => window.location.href = `/properties/${property.id}`}
              >
                <div className="relative">
                  {/* Main Property Image */}
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={property.images?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'} 
                      alt={property.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Property Gallery - Small Images */}
                  <div className="absolute top-0 right-0 flex flex-col gap-1 p-1">
                    {Array(3).fill(0).map((_, idx) => (
                      <div key={idx} className="w-16 h-16 overflow-hidden rounded-md bg-gray-200">
                        <img 
                          src={property.images?.[idx + 1] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'} 
                          alt={`${property.title} - Image ${idx + 2}`} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Available Tag */}
                  <div className="absolute top-2 left-2">
                    <div className="bg-red-500 text-white px-3 py-1 rounded-md text-sm font-semibold">
                      {property.available ? 
                        `Available ${property.availableDate || '1st July 25'}` : 
                        'Now Let'}
                    </div>
                  </div>

                  {/* Heart Icon */}
                  <div className="absolute top-2 right-[68px] bg-white p-1 rounded-full shadow-md">
                    <Heart className="h-5 w-5 text-gray-400 cursor-pointer hover:text-red-500 transition-colors" />
                  </div>
                </div>

                {/* Property Details */}
                <div className="p-4">
                  {/* Room Count and Bathroom Badges */}
                  <div className="flex gap-2 mb-3 flex-wrap">
                    <div className="bg-primary/10 flex items-center px-2 py-1 rounded-full">
                      <Bed className="h-4 w-4 mr-1 text-primary" />
                      <span className="text-xs font-medium">{property.bedrooms}</span>
                    </div>
                    <div className="bg-primary/10 flex items-center px-2 py-1 rounded-full">
                      <Bath className="h-4 w-4 mr-1 text-primary" />
                      <span className="text-xs font-medium">{property.bathrooms}</span>
                    </div>
                    {property.virtualTourUrl && typeof property.virtualTourUrl === 'string' && property.virtualTourUrl.length > 0 && (
                      <div className="bg-blue-100 flex items-center px-2 py-1 rounded-full">
                        <Camera className="h-4 w-4 mr-1 text-blue-600" />
                        <span className="text-xs font-medium text-blue-700">Virtual Tour</span>
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div className="text-2xl font-bold text-primary mb-2">
                    £{typeof property.price === 'number' ? property.price.toFixed(2) : property.price} <span className="text-sm font-normal text-gray-600">Per Person Per Week</span>
                  </div>

                  {/* Address */}
                  <p className="text-gray-700 font-medium mb-2">
                    {property.address}, {property.city}, {property.postcode}
                  </p>

                  {/* Area */}
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                    <span className="text-sm">{property.area || 'City Center'}</span>
                  </div>

                  {/* Features */}
                  {property.features && property.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center text-gray-600 mb-1">
                      <Star className="h-4 w-4 mr-1 text-yellow-400" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-10">
          <button 
            onClick={() => window.location.href = '/properties'}
            className="inline-block border-2 border-primary text-primary hover:bg-primary hover:text-white font-medium py-2 px-6 rounded-md transition-colors duration-300"
          >
            View All Properties
          </button>
        </div>
      </div>
    </section>
  );
}