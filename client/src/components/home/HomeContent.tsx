import HeroSection from '@/components/home/HeroSection';
import FeaturedProperties from '@/components/home/FeaturedProperties';
import CTASection from '@/components/home/CTASection';

export default function HomeContent() {
  return (
    <>
      {/* Hero Section - First */}
      <HeroSection />
      
      {/* Properties Section - Second */}
      <div>
        <FeaturedProperties />
      </div>
      
      {/* Why Choose Section - Third (after properties) */}
      <div>
        <CTASection />
      </div>
    </>
  );
}