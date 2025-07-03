import { Link } from "wouter";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PropertyType } from "@/lib/types";
import { Bed, Bath, Wifi, MapPin, Bolt, Droplet, Flame, Package, Video, Camera } from "lucide-react";
import { MediaModal } from "@/components/ui/media-modal";

interface PropertyCardProps {
  property: PropertyType;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  // State for media modals
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [virtualTourModalOpen, setVirtualTourModalOpen] = useState(false);
  
  // Handle property data safely
  const {
    id,
    title = "Property",
    description = "Description unavailable",
    address = "",
    city = "",
    price = 0,
    propertyType = "",
    bedrooms = 0,
    bathrooms = 0,
    available = false, 
    features = [],
    images = [],
    videos = [],
    virtualTourUrl = "",
    university = "",
    billsIncluded = false,
  } = property || {};
  
  // Handle includedBills safely
  const includedBills = property?.includedBills || [];

  // Get reliable placeholder image
  const getPlaceholderImage = (property: PropertyType) => {
    const safeTitle = property.title || 'Property';
    const safeType = property.propertyType || 'House';
    return `https://placehold.co/600x400?text=${encodeURIComponent(safeTitle)}&desc=${encodeURIComponent(safeType)}`;
  };
  
  // Get first image or use reliable placeholder
  const mainImage = (images && Array.isArray(images) && images.length > 0) 
    ? images[0] 
    : getPlaceholderImage(property);
  
  // Check if image is from placeholder service
  const isPlaceholder = typeof mainImage === 'string' && mainImage.includes('placehold.co');

  // Calculate the total price including utilities (all-inclusive package)
  const utilitiesIncluded = true; // All properties include utilities
  const totalPrice = Number(price); // Price already includes utilities
  
  // Get the first video URL if available
  const firstVideoUrl = videos && Array.isArray(videos) && videos.length > 0 ? videos[0] : "";

  return (
    <>
      <Card className="overflow-hidden h-full border-t-4 border-t-primary">
        <div className="relative pb-[60%]">
          <img 
            src={mainImage} 
            alt={title} 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute top-0 right-0 bg-primary text-white px-3 py-1 rounded-bl-lg font-medium text-sm md:text-base md:px-4 z-10">
            £{Number(totalPrice).toFixed(0)} pw
          </div>
          
          {/* Media indicators */}
          <div className="absolute top-0 left-0 flex gap-1 p-1 z-10">
            {videos && Array.isArray(videos) && videos.length > 0 && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setVideoModalOpen(true);
                }}
                className="bg-black/70 text-white rounded-full p-1.5 w-7 h-7 flex items-center justify-center hover:bg-primary/90 transition-colors cursor-pointer"
                aria-label="Watch video tour"
                title="Watch video tour"
              >
                <Video className="h-4 w-4" />
              </button>
            )}
            {virtualTourUrl && typeof virtualTourUrl === 'string' && virtualTourUrl.length > 0 && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setVirtualTourModalOpen(true);
                }}
                className="bg-black/70 text-white rounded-full p-1.5 w-7 h-7 flex items-center justify-center hover:bg-primary/90 transition-colors cursor-pointer"
                aria-label="View 360° tour"
                title="View 360° tour"
              >
                <Camera className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {billsIncluded && (
            <div className="absolute left-0 bottom-0 bg-gradient-to-r from-[#f37021] to-[#f58b47] text-white px-2 py-1 rounded-tr-lg font-medium text-xs md:text-sm md:px-3 z-10">
              All-Inclusive
            </div>
          )}
          
          {/* Virtual Tour Indicator */}
          {virtualTourUrl && typeof virtualTourUrl === 'string' && virtualTourUrl.length > 0 && (
            <div className="absolute left-0 bottom-[28px] bg-gradient-to-r from-blue-600 to-blue-500 text-white px-2 py-1 rounded-tr-lg font-medium text-xs md:text-sm md:px-3 z-10 flex items-center">
              <Camera className="h-3 w-3 md:h-4 md:w-4 mr-1" /> Virtual Tour
            </div>
          )}
        </div>
        <CardContent className="p-4 md:p-6">
          <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
            <h3 className="text-base md:text-xl font-semibold">{title}</h3>
            <Badge variant={available ? "default" : "secondary"} className={available ? "bg-[#f37021] hover:bg-[#f37021]/90 whitespace-nowrap" : "whitespace-nowrap"}>
              {available ? "Available" : "Unavailable"}
            </Badge>
          </div>
          <p className="text-gray-600 mb-4 line-clamp-2 text-sm md:text-base">
            {description.length > 120 ? `${description.substring(0, 120)}...` : description}
          </p>
          
          <div className="flex flex-wrap gap-2 md:gap-3 mb-4">
            <span className="bg-light rounded-full px-2 py-1 md:px-3 text-xs md:text-sm flex items-center">
              <Bed className="mr-1 h-3 w-3 md:h-4 md:w-4 md:mr-2 text-primary" /> {bedrooms} {bedrooms === 1 ? 'Bed' : 'Beds'}
            </span>
            <span className="bg-light rounded-full px-2 py-1 md:px-3 text-xs md:text-sm flex items-center">
              <Bath className="mr-1 h-3 w-3 md:h-4 md:w-4 md:mr-2 text-primary" /> {bathrooms} {bathrooms === 1 ? 'Bath' : 'Baths'}
            </span>
            {videos && Array.isArray(videos) && videos.length > 0 && (
              <button 
                onClick={() => setVideoModalOpen(true)}
                className="bg-light rounded-full px-2 py-1 md:px-3 text-xs md:text-sm flex items-center hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <Video className="mr-1 h-3 w-3 md:h-4 md:w-4 md:mr-2 text-primary" /> Video Tour
              </button>
            )}
            {virtualTourUrl && typeof virtualTourUrl === 'string' && virtualTourUrl.length > 0 && (
              <button 
                onClick={() => setVirtualTourModalOpen(true)}
                className="bg-light rounded-full px-2 py-1 md:px-3 text-xs md:text-sm flex items-center hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <Camera className="mr-1 h-3 w-3 md:h-4 md:w-4 md:mr-2 text-primary" /> 360° Tour
              </button>
            )}
          </div>

          {/* All-inclusive utilities section */}
          {billsIncluded && (
            <div className="mb-4 bg-[#f37021]/5 p-2 md:p-3 rounded-lg border border-[#f37021]/20">
              <h4 className="text-xs md:text-sm font-semibold text-[#f37021] mb-1 md:mb-2 flex items-center">
                <Package className="mr-1 h-3 w-3 md:h-4 md:w-4 md:mr-2" />
                All bills included
              </h4>
              <p className="text-xs text-gray-600 mb-2">
                Gas, electricity, water, broadband included
              </p>
              <div className="grid grid-cols-2 gap-1 md:gap-2">
                {includedBills && (includedBills.includes('electricity') || includedBills.includes('Electricity')) && (
                  <span className="text-xs flex items-center text-gray-700">
                    <Bolt className="h-3 w-3 mr-1 text-yellow-500" /> Electricity
                  </span>
                )}
                {includedBills && (includedBills.includes('gas') || includedBills.includes('Gas')) && (
                  <span className="text-xs flex items-center text-gray-700">
                    <Flame className="h-3 w-3 mr-1 text-orange-500" /> Gas
                  </span>
                )}
                {includedBills && (includedBills.includes('water') || includedBills.includes('Water')) && (
                  <span className="text-xs flex items-center text-gray-700">
                    <Droplet className="h-3 w-3 mr-1 text-blue-500" /> Water
                  </span>
                )}
                {includedBills && (includedBills.includes('broadband') || includedBills.includes('Internet') || includedBills.includes('Broadband')) && (
                  <span className="text-xs flex items-center text-gray-700">
                    <Wifi className="h-3 w-3 mr-1 text-purple-500" /> Broadband
                  </span>
                )}
              </div>
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <div className="text-primary font-medium flex items-center text-sm">
              <MapPin className="mr-1 h-3 w-3 md:h-4 md:w-4" />
              {city}
            </div>
            <Link href={`/properties/${id}`}>
              <Badge variant="outline" className="text-primary hover:bg-primary/10 cursor-pointer text-xs md:text-sm">
                View Details
              </Badge>
            </Link>
          </div>
        </CardContent>
      </Card>
      
      {/* Media modals */}
      {videos && Array.isArray(videos) && videos.length > 0 && (
        <MediaModal
          isOpen={videoModalOpen}
          onClose={() => setVideoModalOpen(false)}
          title={`${title} - Video Tour`}
          description="Take a video tour of this property"
          mediaType="video"
          mediaUrl={firstVideoUrl}
        />
      )}
      
      {virtualTourUrl && typeof virtualTourUrl === 'string' && virtualTourUrl.length > 0 && (
        <MediaModal
          isOpen={virtualTourModalOpen}
          onClose={() => setVirtualTourModalOpen(false)}
          title={`${title} - 360° Virtual Tour`}
          description="Explore this property in a 360° virtual tour"
          mediaType="virtualTour"
          mediaUrl={virtualTourUrl}
        />
      )}
    </>
  );
}
