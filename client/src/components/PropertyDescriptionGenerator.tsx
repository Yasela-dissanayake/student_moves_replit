/**
 * Property Description Generator Component
 * Uses OpenAI API to generate property descriptions
 */

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// Define the props interface for this component
interface PropertyDescriptionGeneratorProps {
  apiUrl?: (endpoint: string) => string;
  useEnhancedMode?: boolean;
}
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Wand2Icon,
  LoaderIcon,
  Copy,
  CheckCircle,
  AlertTriangleIcon,
  ChevronDownIcon,
  PlusIcon,
  MinusIcon,
  BuildingIcon,
  AlertCircle,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

type FeatureItem = {
  id: string;
  text: string;
};

export function PropertyDescriptionGenerator({ 
  apiUrl = (url: string) => url, 
  useEnhancedMode = false 
}: PropertyDescriptionGeneratorProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [description, setDescription] = useState("");
  const [generatedDescriptions, setGeneratedDescriptions] = useState<
    { id: string; content: string }[]
  >([]);
  const [copied, setCopied] = useState(false);
  const [isMockImplementation, setIsMockImplementation] = useState(false);
  
  // Check if mock implementation is active
  const { data: openaiStatusData } = useQuery<{status?: string, message?: string, usingMock?: boolean}>({
    queryKey: [apiUrl('/api/openai/status')],
    retry: false,
  });

  // Update mock implementation status
  useEffect(() => {
    if (openaiStatusData) {
      setIsMockImplementation(openaiStatusData.usingMock === true);
    }
  }, [openaiStatusData]);

  // Form inputs
  const [title, setTitle] = useState("");
  const [propertyType, setPropertyType] = useState("house");
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(1);
  const [location, setLocation] = useState("");
  const [university, setUniversity] = useState("");
  const [tone, setTone] = useState("professional");
  const [length, setLength] = useState("medium");
  const [furnished, setFurnished] = useState(true);
  const [features, setFeatures] = useState<FeatureItem[]>([
    { id: "1", text: "Modern kitchen" },
    { id: "2", text: "High-speed internet" },
  ]);
  const [amenities, setAmenities] = useState<FeatureItem[]>([
    { id: "1", text: "Local shops" },
    { id: "2", text: "Public transportation" },
  ]);
  const [highlightStudentFeatures, setHighlightStudentFeatures] = useState(true);
  const [includeSEO, setIncludeSEO] = useState(false);
  const [includeTransportation, setIncludeTransportation] = useState(true);
  const [includeUniversityDistance, setIncludeUniversityDistance] = useState(true);

  // Add new feature field
  const addFeature = () => {
    const id = Date.now().toString();
    setFeatures([...features, { id, text: "" }]);
  };

  // Remove feature field
  const removeFeature = (id: string) => {
    setFeatures(features.filter((feature) => feature.id !== id));
  };

  // Update feature field
  const updateFeature = (id: string, text: string) => {
    setFeatures(
      features.map((feature) =>
        feature.id === id ? { ...feature, text } : feature
      )
    );
  };

  // Add new amenity field
  const addAmenity = () => {
    const id = Date.now().toString();
    setAmenities([...amenities, { id, text: "" }]);
  };

  // Remove amenity field
  const removeAmenity = (id: string) => {
    setAmenities(amenities.filter((amenity) => amenity.id !== id));
  };

  // Update amenity field
  const updateAmenity = (id: string, text: string) => {
    setAmenities(
      amenities.map((amenity) =>
        amenity.id === id ? { ...amenity, text } : amenity
      )
    );
  };

  // Form validation
  const validateForm = () => {
    if (!title) {
      toast({
        title: "Missing Information",
        description: "Please enter a property title.",
        variant: "destructive",
      });
      return false;
    }

    if (!propertyType) {
      toast({
        title: "Missing Information",
        description: "Please select a property type.",
        variant: "destructive",
      });
      return false;
    }

    if (!location) {
      toast({
        title: "Missing Information",
        description: "Please enter a location.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  // Generate description
  const generateDescription = async () => {
    if (!validateForm()) return;

    setIsGenerating(true);
    setDescription("");

    // Filter out empty features and amenities
    const validFeatures = features
      .filter((feature) => feature.text.trim() !== "")
      .map((feature) => feature.text.trim());
    
    const validAmenities = amenities
      .filter((amenity) => amenity.text.trim() !== "")
      .map((amenity) => amenity.text.trim());

    try {
      const requestData = {
        operation: "generatePropertyDescription",
        prompt: `
Title: ${title}
Type: ${propertyType}
Bedrooms: ${bedrooms}
Bathrooms: ${bathrooms}
Location: ${location}
${university ? `University: ${university}` : ''}
Features: ${validFeatures.join(', ')}
${validAmenities.length > 0 ? `Nearby Amenities: ${validAmenities.join(', ')}` : ''}
Tone: ${tone}
${university && includeUniversityDistance ? 'Include university distance information' : ''}
${includeTransportation ? 'Include transportation information' : ''}
${includeSEO ? 'Optimize for SEO' : ''}
${highlightStudentFeatures ? 'Highlight student-specific features' : ''}
Furnished: ${furnished ? 'Yes' : 'No'}
`
      };

      // Use the OpenAI generate endpoint directly
      const response = await fetch(apiUrl("/api/openai/generate"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 'success' && result.result) {
        setDescription(result.result);
        
        // Add to generated descriptions list
        const newDescriptionId = Date.now().toString();
        setGeneratedDescriptions([
          {
            id: newDescriptionId,
            content: result.result,
          },
          ...generatedDescriptions,
        ]);
      } else {
        toast({
          title: "Generation Failed",
          description: "Could not generate a description. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating description:", error);
      toast({
        title: "Generation Error",
        description: "An error occurred while generating the description.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy description to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopied(true);
        toast({
          title: "Copied!",
          description: "Description copied to clipboard",
        });
        setTimeout(() => setCopied(false), 2000);
      },
      (err) => {
        console.error("Error copying to clipboard:", err);
        toast({
          title: "Copy failed",
          description: "Failed to copy to clipboard",
          variant: "destructive",
        });
      }
    );
  };

  return (
    <div className="w-full space-y-6">
      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">Generate Description</TabsTrigger>
          <TabsTrigger value="history">
            History ({generatedDescriptions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          <div className="space-y-8">
            {useEnhancedMode && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-800" />
                <AlertDescription className="text-green-800">
                  Using enhanced OpenAI implementation with real API access. You may incur API costs.
                </AlertDescription>
              </Alert>
            )}
            {isMockImplementation && !useEnhancedMode && (
              <Alert className="bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-800" />
                <AlertDescription className="text-amber-800">
                  Using mock OpenAI implementation. All descriptions are generated by a simulation service to save on API costs.
                </AlertDescription>
              </Alert>
            )}
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BuildingIcon className="mr-2 h-5 w-5" />
                  Property Information
                  {useEnhancedMode && (
                    <Badge variant="outline" className="ml-2 text-green-600 border-green-600 text-xs">
                      ENHANCED MODE
                    </Badge>
                  )}
                  {isMockImplementation && !useEnhancedMode && (
                    <Badge variant="outline" className="ml-2 text-amber-600 border-amber-600 text-xs">
                      MOCK IMPLEMENTATION
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Enter details about your property to generate a description.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="title">Property Title</Label>
                      <Input
                        id="title"
                        placeholder="Beautiful Student Apartment"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="property-type">Property Type</Label>
                      <Select
                        value={propertyType}
                        onValueChange={setPropertyType}
                      >
                        <SelectTrigger id="property-type">
                          <SelectValue placeholder="Select property type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="house">House</SelectItem>
                          <SelectItem value="apartment">Apartment</SelectItem>
                          <SelectItem value="studio">Studio</SelectItem>
                          <SelectItem value="flat">Flat</SelectItem>
                          <SelectItem value="dormitory">Dormitory</SelectItem>
                          <SelectItem value="shared_house">Shared House</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="bedrooms">Bedrooms: {bedrooms}</Label>
                      <Slider
                        id="bedrooms"
                        min={1}
                        max={10}
                        step={1}
                        value={[bedrooms]}
                        onValueChange={(value) => setBedrooms(value[0])}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bathrooms">Bathrooms: {bathrooms}</Label>
                      <Slider
                        id="bathrooms"
                        min={1}
                        max={5}
                        step={1}
                        value={[bathrooms]}
                        onValueChange={(value) => setBathrooms(value[0])}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        placeholder="City or neighborhood"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="university">
                        Nearby University (optional)
                      </Label>
                      <Input
                        id="university"
                        placeholder="University name"
                        value={university}
                        onChange={(e) => setUniversity(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Property Features</Label>
                    <div className="space-y-2">
                      {features.map((feature) => (
                        <div
                          key={feature.id}
                          className="flex items-center space-x-2"
                        >
                          <Input
                            placeholder="Enter a feature"
                            value={feature.text}
                            onChange={(e) =>
                              updateFeature(feature.id, e.target.value)
                            }
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            type="button"
                            onClick={() => removeFeature(feature.id)}
                          >
                            <MinusIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        className="w-full"
                        type="button"
                        onClick={addFeature}
                      >
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Add Feature
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Nearby Amenities</Label>
                    <div className="space-y-2">
                      {amenities.map((amenity) => (
                        <div
                          key={amenity.id}
                          className="flex items-center space-x-2"
                        >
                          <Input
                            placeholder="Enter nearby amenity"
                            value={amenity.text}
                            onChange={(e) =>
                              updateAmenity(amenity.id, e.target.value)
                            }
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            type="button"
                            onClick={() => removeAmenity(amenity.id)}
                          >
                            <MinusIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        className="w-full"
                        type="button"
                        onClick={addAmenity}
                      >
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Add Amenity
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  Description Options
                  {useEnhancedMode && (
                    <Badge variant="outline" className="ml-2 text-green-600 border-green-600 text-xs">
                      ENHANCED
                    </Badge>
                  )}
                  {isMockImplementation && !useEnhancedMode && (
                    <Badge variant="outline" className="ml-2 text-amber-600 border-amber-600 text-xs">
                      MOCK
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Customize how your property description is generated.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="tone">Tone</Label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger id="tone">
                        <SelectValue placeholder="Select tone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                        <SelectItem value="luxury">Luxury</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="length">Length</Label>
                    <Select value={length} onValueChange={setLength}>
                      <SelectTrigger id="length">
                        <SelectValue placeholder="Select length" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Short</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="long">Long</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="furnished" className="cursor-pointer">
                      Furnished
                    </Label>
                    <Switch
                      id="furnished"
                      checked={furnished}
                      onCheckedChange={setFurnished}
                    />
                  </div>

                  <div className="flex items-center justify-between space-x-2">
                    <Label
                      htmlFor="highlight-student-features"
                      className="cursor-pointer"
                    >
                      Highlight Student Features
                    </Label>
                    <Switch
                      id="highlight-student-features"
                      checked={highlightStudentFeatures}
                      onCheckedChange={setHighlightStudentFeatures}
                    />
                  </div>

                  <div className="flex items-center justify-between space-x-2">
                    <Label
                      htmlFor="include-transportation"
                      className="cursor-pointer"
                    >
                      Include Transportation Info
                    </Label>
                    <Switch
                      id="include-transportation"
                      checked={includeTransportation}
                      onCheckedChange={setIncludeTransportation}
                    />
                  </div>

                  {university && (
                    <div className="flex items-center justify-between space-x-2">
                      <Label
                        htmlFor="include-university-distance"
                        className="cursor-pointer"
                      >
                        Include University Distance
                      </Label>
                      <Switch
                        id="include-university-distance"
                        checked={includeUniversityDistance}
                        onCheckedChange={setIncludeUniversityDistance}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="include-seo" className="cursor-pointer">
                      Include SEO Keywords
                    </Label>
                    <Switch
                      id="include-seo"
                      checked={includeSEO}
                      onCheckedChange={setIncludeSEO}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={generateDescription}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2Icon className="mr-2 h-4 w-4" />
                      Generate Description
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {description && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    Generated Description
                    {useEnhancedMode && (
                      <Badge variant="outline" className="ml-2 text-green-600 border-green-600 text-xs">
                        ENHANCED RESPONSE
                      </Badge>
                    )}
                    {isMockImplementation && !useEnhancedMode && (
                      <Badge variant="outline" className="ml-2 text-amber-600 border-amber-600 text-xs">
                        SIMULATED RESPONSE
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {useEnhancedMode 
                      ? "Your property description has been generated using enhanced OpenAI features."
                      : isMockImplementation 
                        ? "Your property description has been generated using our cost-saving mock service."
                        : "Your AI-generated property description is ready."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-[200px] resize-y font-serif text-base"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute right-2 top-2"
                      onClick={() => copyToClipboard(description)}
                    >
                      {copied ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Previously Generated Descriptions</CardTitle>
              <CardDescription>
                Your recently generated property descriptions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generatedDescriptions.length > 0 ? (
                <div className="space-y-4">
                  {generatedDescriptions.map((item) => (
                    <div key={item.id} className="relative rounded-md border p-4">
                      <p className="whitespace-pre-wrap font-serif text-sm text-gray-700">
                        {item.content.length > 300
                          ? `${item.content.substring(0, 300)}...`
                          : item.content}
                      </p>
                      <div className="mt-2 flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(item.content)}
                        >
                          <Copy className="mr-2 h-3 w-3" />
                          Copy
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
                  <AlertTriangleIcon className="mb-2 h-10 w-10 text-gray-400" />
                  <h3 className="mb-1 text-lg font-semibold">No History</h3>
                  <p className="text-sm text-gray-500">
                    You haven't generated any descriptions yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}