import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Bed, Bath, MapPin, Heart, Star } from 'lucide-react';
import { PropertyType } from '@/lib/types';
import { getProperties } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function CompactPropertyGrid() {
  const { data: properties, isLoading, error } = useQuery({
    queryKey: ['/api/properties'],
    queryFn: () => getProperties(),
  });

  if (isLoading) {
    return (
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Featured Properties
            </h2>
            <p className="text-lg text-gray-600">Loading properties...</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {[...Array(40)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border animate-pulse">
                <div className="h-40 bg-gray-200 rounded-t-lg"></div>
                <div className="p-3">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !properties) {
    return (
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Properties</h2>
          <p className="text-gray-600">Unable to load properties at the moment.</p>
        </div>
      </div>
    );
  }

  // Show 40 properties (10 rows × 4 columns)
  const displayProperties = properties.slice(0, 40);

  return (
    <div className="bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Featured Properties
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover your perfect student home from our curated selection of premium properties
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
          {displayProperties.map((property: PropertyType) => (
            <Link key={property.id} href={`/properties/${property.id}`}>
              <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200 cursor-pointer group">
                {/* Image */}
                <div className="relative h-32 md:h-40 overflow-hidden rounded-t-lg">
                  <img
                    src={property.images?.[0] || '/images/properties/default.jpg'}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="bg-white/90 text-gray-800">
                      {property.city}
                    </Badge>
                  </div>
                  <button className="absolute top-2 right-2 p-1 rounded-full bg-white/90 hover:bg-white transition-colors">
                    <Heart className="h-4 w-4 text-gray-600" />
                  </button>
                  {property.available && (
                    <div className="absolute bottom-2 left-2">
                      <Badge className="bg-green-600 text-white">Available</Badge>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-2 md:p-3">
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1 text-xs md:text-sm">
                    {property.title}
                  </h3>
                  
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span className="text-xs line-clamp-1">{property.address}</span>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {property.bedrooms && (
                        <div className="flex items-center">
                          <Bed className="h-3 w-3 text-gray-500 mr-1" />
                          <span className="text-xs text-gray-600">{property.bedrooms}</span>
                        </div>
                      )}
                      {property.bathrooms && (
                        <div className="flex items-center">
                          <Bath className="h-3 w-3 text-gray-500 mr-1" />
                          <span className="text-xs text-gray-600">{property.bathrooms}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center">
                      <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                      <span className="text-xs text-gray-600">4.8</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-gray-900">
                      £{property.price}
                      <span className="text-xs font-normal text-gray-500">/week</span>
                    </div>
                    {property.billsIncluded && (
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        Bills Inc.
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* View More Button */}
        <div className="text-center">
          <Link href="/properties">
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-8">
              View All Properties
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}