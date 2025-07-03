import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Map, 
  Building, 
  Search, 
  Shield, 
  Bus, 
  Store, 
  GraduationCap,
  Loader2, 
  ChevronDown,
  Star,
  AlertTriangle,
  CheckCircle,
  Info,
  Lightbulb
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SafetyAnalysisResult {
  safety: number;
  safetyDetails: string;
  popularAreas: string[];
  transport: number;
  amenities: number;
  studentLife: number;
  tips: string[];
}

export function NeighborhoodSafety() {
  const [city, setCity] = useState<string>('');
  const [neighborhood, setNeighborhood] = useState<string>('');
  const [universityName, setUniversityName] = useState<string>('');
  const [studentPriorities, setStudentPriorities] = useState<string[]>(['safety', 'transport', 'nightlife']);
  const [safetyAnalysis, setSafetyAnalysis] = useState<SafetyAnalysisResult | null>(null);
  
  // UK cities options
  const cityOptions = [
    "Manchester", "Birmingham", "Leeds", "Liverpool", 
    "London", "Cardiff", "Edinburgh", "Glasgow", 
    "Newcastle", "Sheffield", "Nottingham", "Leicester",
    "Bristol", "Oxford", "Cambridge", "Belfast"
  ];
  
  // UK university options by city
  const universityOptions: Record<string, string[]> = {
    "Manchester": ["University of Manchester", "Manchester Metropolitan University", "Royal Northern College of Music"],
    "Birmingham": ["University of Birmingham", "Birmingham City University", "Aston University"],
    "Leeds": ["University of Leeds", "Leeds Beckett University", "Leeds Trinity University"],
    "Liverpool": ["University of Liverpool", "Liverpool John Moores University", "Liverpool Hope University"],
    "London": ["University College London", "King's College London", "Imperial College London", "Queen Mary University of London"],
    "Cardiff": ["Cardiff University", "Cardiff Metropolitan University"],
    "Edinburgh": ["University of Edinburgh", "Edinburgh Napier University", "Heriot-Watt University"],
    "Glasgow": ["University of Glasgow", "Glasgow Caledonian University", "University of Strathclyde"],
    "Newcastle": ["Newcastle University", "Northumbria University"],
    "Sheffield": ["University of Sheffield", "Sheffield Hallam University"],
    "Nottingham": ["University of Nottingham", "Nottingham Trent University"],
    "Leicester": ["University of Leicester", "De Montfort University"],
    "Bristol": ["University of Bristol", "University of the West of England"],
    "Oxford": ["University of Oxford", "Oxford Brookes University"],
    "Cambridge": ["University of Cambridge", "Anglia Ruskin University"],
    "Belfast": ["Queen's University Belfast", "Ulster University"]
  };
  
  // Neighborhood options by city
  const neighborhoodOptions: Record<string, string[]> = {
    "Manchester": ["City Centre", "Fallowfield", "Rusholme", "Withington", "Didsbury", "Salford"],
    "Birmingham": ["City Centre", "Selly Oak", "Edgbaston", "Harborne", "Moseley"],
    "Leeds": ["City Centre", "Headingley", "Hyde Park", "Woodhouse", "Burley"],
    "Liverpool": ["City Centre", "Wavertree", "Kensington", "Smithdown", "Aigburth"],
    "London": ["Camden", "Shoreditch", "Brixton", "Islington", "Greenwich", "Stratford", "Southwark"],
    "Cardiff": ["City Centre", "Cathays", "Roath", "Heath", "Butetown"],
    "Edinburgh": ["Old Town", "New Town", "Marchmont", "Newington", "Bruntsfield"],
    "Glasgow": ["City Centre", "West End", "Partick", "Shawlands", "Dennistoun"],
    "Newcastle": ["City Centre", "Jesmond", "Heaton", "Sandyford", "Gosforth"],
    "Sheffield": ["City Centre", "Broomhill", "Ecclesall", "Crookes", "Endcliffe"],
    "Nottingham": ["City Centre", "Lenton", "Beeston", "West Bridgford", "Dunkirk"],
    "Leicester": ["City Centre", "Clarendon Park", "Evington", "Stoneygate", "Oadby"],
    "Bristol": ["City Centre", "Clifton", "Redland", "Cotham", "Stokes Croft"],
    "Oxford": ["City Centre", "Jericho", "Cowley Road", "Headington", "Summertown"],
    "Cambridge": ["City Centre", "Chesterton", "Cherry Hinton", "Romsey", "Castle"],
    "Belfast": ["City Centre", "Queen's Quarter", "Stranmillis", "Ormeau", "Holylands"]
  };
  
  // Priority options
  const priorityOptions = [
    "safety", "transport", "nightlife", "affordable", "quiet", 
    "access to campus", "shopping", "green spaces", "dining", "gyms"
  ];
  
  // API call to analyze safety
  const safetyAnalysisMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/tenant/neighborhood-safety', {
        city,
        neighborhood,
        universityName,
        studentPriorities
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.analysis) {
        setSafetyAnalysis(data.analysis);
      } else {
        toast({
          title: "Analysis failed",
          description: "Failed to analyze the neighborhood. Please try again with different inputs.",
          variant: "destructive"
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Analysis failed",
        description: error.message || "Failed to analyze the neighborhood. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Handle priorities change
  const handlePriorityChange = (priority: string) => {
    setStudentPriorities(prev => {
      if (prev.includes(priority)) {
        return prev.filter(p => p !== priority);
      } else {
        return [...prev, priority];
      }
    });
  };
  
  // Analyze neighborhood
  const analyzeNeighborhood = () => {
    if (!city) {
      toast({
        title: "City required",
        description: "Please select a city to analyze.",
        variant: "destructive"
      });
      return;
    }
    
    safetyAnalysisMutation.mutate();
  };
  
  // Get rating color based on score
  const getRatingColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-amber-600";
    return "text-red-600";
  };
  
  // Get rating text based on score
  const getRatingText = (score: number) => {
    if (score >= 8) return "Excellent";
    if (score >= 6) return "Good";
    if (score >= 4) return "Average";
    return "Poor";
  };
  
  // Get progress color based on score
  const getProgressColor = (score: number) => {
    if (score >= 8) return "bg-green-600";
    if (score >= 6) return "bg-amber-600";
    if (score >= 4) return "bg-orange-600";
    return "bg-red-600";
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Neighborhood Safety Analyzer
        </CardTitle>
        <CardDescription>
          Evaluate the safety and suitability of student neighborhoods across the UK
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="search" className="flex items-center gap-1">
              <Search className="h-4 w-4" />
              <span>Search</span>
            </TabsTrigger>
            <TabsTrigger value="results" disabled={!safetyAnalysis} className="flex items-center gap-1">
              <Map className="h-4 w-4" />
              <span>Results</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="search" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Select 
                    value={city} 
                    onValueChange={(value) => {
                      setCity(value);
                      setNeighborhood('');
                      setUniversityName('');
                    }}
                  >
                    <SelectTrigger id="city">
                      <SelectValue placeholder="Select a city" />
                    </SelectTrigger>
                    <SelectContent>
                      {cityOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="neighborhood">Neighborhood (Optional)</Label>
                  <Select 
                    value={neighborhood} 
                    onValueChange={setNeighborhood}
                    disabled={!city}
                  >
                    <SelectTrigger id="neighborhood">
                      <SelectValue placeholder={city ? "Select a neighborhood" : "Select a city first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {city && neighborhoodOptions[city]?.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    If not selected, we'll analyze the general city area
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="university">University (Optional)</Label>
                  <Select 
                    value={universityName} 
                    onValueChange={setUniversityName}
                    disabled={!city}
                  >
                    <SelectTrigger id="university">
                      <SelectValue placeholder={city ? "Select a university" : "Select a city first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {city && universityOptions[city]?.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Helps us tailor the analysis for students at this university
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label>Your Priorities (Select up to 5)</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Select what matters most to you in a neighborhood
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    {priorityOptions.map((priority) => (
                      <Badge
                        key={priority}
                        variant={studentPriorities.includes(priority) ? "default" : "outline"}
                        className="cursor-pointer capitalize"
                        onClick={() => handlePriorityChange(priority)}
                      >
                        {priority}
                      </Badge>
                    ))}
                  </div>
                  
                  {studentPriorities.length > 5 && (
                    <p className="text-xs text-destructive mt-2">
                      Please select a maximum of 5 priorities
                    </p>
                  )}
                </div>
                
                <div className="pt-8 flex justify-center">
                  <Button 
                    onClick={analyzeNeighborhood} 
                    disabled={!city || safetyAnalysisMutation.isPending || studentPriorities.length > 5}
                    className="w-full"
                  >
                    {safetyAnalysisMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Analyze Neighborhood
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="results" className="space-y-8">
            {safetyAnalysis && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        {neighborhood || city} Safety Analysis
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {universityName ? `For students at ${universityName}` : 'For students in this area'}
                      </p>
                    </div>
                    
                    <div className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Safety Rating</h4>
                          <p className={`text-2xl font-bold ${getRatingColor(safetyAnalysis.safety)}`}>
                            {safetyAnalysis.safety}/10
                            <span className="text-sm font-normal ml-2">
                              ({getRatingText(safetyAnalysis.safety)})
                            </span>
                          </p>
                        </div>
                        <div className="w-16 h-16 rounded-full border-4 flex items-center justify-center relative">
                          <span className={`text-xl font-bold ${getRatingColor(safetyAnalysis.safety)}`}>
                            {safetyAnalysis.safety}
                          </span>
                          <svg className="absolute inset-0" width="64" height="64" viewBox="0 0 64 64">
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              fill="none"
                              stroke="#e5e7eb"
                              strokeWidth="4"
                            />
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              fill="none"
                              stroke={safetyAnalysis.safety >= 8 ? "#16a34a" : safetyAnalysis.safety >= 6 ? "#d97706" : "#dc2626"}
                              strokeWidth="4"
                              strokeDasharray={`${(safetyAnalysis.safety / 10) * 175.9} 175.9`}
                              transform="rotate(-90 32 32)"
                            />
                          </svg>
                        </div>
                      </div>
                      
                      <p className="text-sm">
                        {safetyAnalysis.safetyDetails}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Popular Student Areas Nearby</h4>
                      <div className="flex flex-wrap gap-1">
                        {safetyAnalysis.popularAreas.map((area, index) => (
                          <Badge key={index} variant="outline" className="bg-primary/10">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium mb-3">Area Ratings</h3>
                    
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="flex items-center gap-1">
                            <Bus className="h-4 w-4" />
                            Public Transport
                          </span>
                          <span className={`font-medium ${getRatingColor(safetyAnalysis.transport)}`}>
                            {safetyAnalysis.transport}/10
                          </span>
                        </div>
                        <Progress 
                          value={safetyAnalysis.transport * 10} 
                          className="h-2"
                          indicatorClassName={getProgressColor(safetyAnalysis.transport)}
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="flex items-center gap-1">
                            <Store className="h-4 w-4" />
                            Amenities
                          </span>
                          <span className={`font-medium ${getRatingColor(safetyAnalysis.amenities)}`}>
                            {safetyAnalysis.amenities}/10
                          </span>
                        </div>
                        <Progress 
                          value={safetyAnalysis.amenities * 10} 
                          className="h-2"
                          indicatorClassName={getProgressColor(safetyAnalysis.amenities)}
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="flex items-center gap-1">
                            <GraduationCap className="h-4 w-4" />
                            Student Life
                          </span>
                          <span className={`font-medium ${getRatingColor(safetyAnalysis.studentLife)}`}>
                            {safetyAnalysis.studentLife}/10
                          </span>
                        </div>
                        <Progress 
                          value={safetyAnalysis.studentLife * 10} 
                          className="h-2"
                          indicatorClassName={getProgressColor(safetyAnalysis.studentLife)}
                        />
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <h4 className="font-medium mb-2 flex items-center gap-1">
                        <Lightbulb className="h-4 w-4" />
                        Safety Tips
                      </h4>
                      <ul className="space-y-2">
                        {safetyAnalysis.tips.map((tip, index) => (
                          <li key={index} className="flex items-start text-sm">
                            <div className="mr-2 mt-0.5">
                              {safetyAnalysis.safety >= 7 ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                              )}
                            </div>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="faq">
                    <AccordionTrigger>
                      <div className="flex items-center">
                        <Info className="h-4 w-4 mr-2" />
                        <span>Frequently Asked Questions</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <div>
                        <h4 className="font-medium">How is the safety score calculated?</h4>
                        <p className="text-sm text-muted-foreground">
                          Safety scores are generated based on reported crime statistics, student reviews, proximity to populated areas, and lighting infrastructure.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium">What should I look for in a safe student area?</h4>
                        <p className="text-sm text-muted-foreground">
                          Look for well-lit streets, proximity to public transportation, presence of other students, secure entry systems on accommodations, and active community presence.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium">How often is this data updated?</h4>
                        <p className="text-sm text-muted-foreground">
                          Our neighborhood safety data is updated quarterly to reflect the most current information available.
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                
                <div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full"
                      >
                        <Building className="mr-2 h-4 w-4" />
                        Show Properties in {neighborhood || city}
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <h4 className="font-medium">View Available Properties</h4>
                          <p className="text-sm text-muted-foreground">
                            Browse student accommodations in {neighborhood || city} that match our safety criteria.
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline">All Properties</Button>
                          <Button>Safe Properties</Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-3 border-t">
        <Button 
          variant="outline" 
          onClick={() => {
            setCity('');
            setNeighborhood('');
            setUniversityName('');
            setStudentPriorities(['safety', 'transport', 'nightlife']);
            setSafetyAnalysis(null);
          }}
        >
          Reset
        </Button>
        
        {safetyAnalysis && (
          <Badge 
            variant={safetyAnalysis.safety >= 7 ? "default" : safetyAnalysis.safety >= 5 ? "secondary" : "destructive"}
            className="ml-auto"
          >
            {safetyAnalysis.safety >= 7 
              ? "Recommended Area" 
              : safetyAnalysis.safety >= 5 
                ? "Average Safety" 
                : "Exercise Caution"}
          </Badge>
        )}
      </CardFooter>
    </Card>
  );
}