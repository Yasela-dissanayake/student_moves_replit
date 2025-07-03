import { VoiceSearch } from '@/components/properties/VoiceSearch';
import { RoommateMatching } from '@/components/tenant/RoommateMatching';
import { BudgetCalculator } from '@/components/tenant/BudgetCalculator';
import { NeighborhoodSafety } from '@/components/tenant/NeighborhoodSafety';
import { VirtualAssistant } from '@/components/tenant/VirtualAssistant';
import { useState } from 'react';
import { Property } from '@shared/schema';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CardTitle, CardDescription, CardHeader, CardContent, Card } from '@/components/ui/card';
import { Mic, Users, Calculator, Shield, Bot, Search, ArrowLeft } from 'lucide-react';
import PropertyCard from '@/components/properties/PropertyCard';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

export default function TenantAiFeatures() {
  const [searchResults, setSearchResults] = useState<{
    properties: Property[], 
    searchParams: any
  } | null>(null);
  
  const handleSearchResults = (properties: Property[], searchParams: any) => {
    setSearchResults({ properties, searchParams });
  };
  
  return (
    <div className="container py-8">
      <div className="mb-4">
        <Link href="/dashboard/tenant">
          <Button variant="ghost" className="flex items-center gap-1 mb-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold relative inline-block">
          <Sparkles className="h-6 w-6 absolute -left-8 -top-1 text-primary" />
          AI-Powered Student Tools
          <Sparkles className="h-6 w-6 absolute -right-8 -top-1 text-primary" />
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Discover our innovative AI tools designed to make your student housing experience smarter, safer, and more personalized.
        </p>
      </header>
      
      <Tabs defaultValue="voice-search" className="w-full">
        <TabsList className="grid grid-cols-5 mb-8">
          <TabsTrigger value="voice-search" className="flex items-center gap-2">
            <Mic className="h-4 w-4" />
            <span className="hidden sm:inline">Voice Search</span>
          </TabsTrigger>
          <TabsTrigger value="roommate-matching" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Roommate Matching</span>
          </TabsTrigger>
          <TabsTrigger value="budget-calculator" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">Budget Calculator</span>
          </TabsTrigger>
          <TabsTrigger value="neighborhood-safety" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Safety Analyzer</span>
          </TabsTrigger>
          <TabsTrigger value="virtual-assistant" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            <span className="hidden sm:inline">Virtual Assistant</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="voice-search" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <VoiceSearch onSearchResults={handleSearchResults} />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  How to Use Voice Search
                </CardTitle>
                <CardDescription>
                  Speak naturally to find your perfect student property
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Try saying something like:</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="p-2 bg-muted rounded-md">"Show me 3-bedroom houses in Manchester near the university"</li>
                    <li className="p-2 bg-muted rounded-md">"Find studio flats in Leeds with bills included under £150 per week"</li>
                    <li className="p-2 bg-muted rounded-md">"I'm looking for a shared house in Birmingham with parking"</li>
                    <li className="p-2 bg-muted rounded-md">"Show me properties in Nottingham with en-suite bathrooms"</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">You can specify:</h3>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    <li>Location (city or neighborhood)</li>
                    <li>University</li>
                    <li>Property type (house, flat, studio, etc.)</li>
                    <li>Number of bedrooms</li>
                    <li>Maximum or minimum price</li>
                    <li>Features (parking, garden, furnished, etc.)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {searchResults && searchResults.properties.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Search Results</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.properties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            </div>
          )}
          
          {searchResults && searchResults.properties.length === 0 && (
            <Card className="bg-muted/40">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No properties found</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Try adjusting your search criteria or speaking more clearly.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="roommate-matching">
          <div className="max-w-4xl mx-auto">
            <RoommateMatching />
          </div>
        </TabsContent>
        
        <TabsContent value="budget-calculator">
          <div className="max-w-4xl mx-auto">
            <BudgetCalculator />
          </div>
        </TabsContent>
        
        <TabsContent value="neighborhood-safety">
          <div className="max-w-4xl mx-auto">
            <NeighborhoodSafety />
          </div>
        </TabsContent>
        
        <TabsContent value="virtual-assistant">
          <div className="max-w-4xl mx-auto">
            <VirtualAssistant />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}