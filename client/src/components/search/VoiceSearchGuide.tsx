import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { HelpCircle, SearchCheck, MapPin, Home, DollarSign, Bed, Calendar, UtilityPole } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function VoiceSearchGuide() {
  const searchCategories = [
    {
      icon: <Bed className="h-4 w-4" />,
      title: "Bedrooms",
      examples: [
        "Find exactly 4 bedroom properties",
        "3 bedroom flats in Leeds",
        "Houses with at least 2 bedrooms",
        "Properties with up to 6 bedrooms"
      ],
      highlight: "For exact matching, use 'exactly X bedrooms' or 'X bedroom houses'."
    },
    {
      icon: <MapPin className="h-4 w-4" />,
      title: "Location",
      examples: [
        "Properties near University of Manchester",
        "Houses in Hyde Park area",
        "Student accommodation in Headingley",
        "Flats in city centre"
      ]
    },
    {
      icon: <Home className="h-4 w-4" />,
      title: "Property Type",
      examples: [
        "Show me all available houses",
        "Apartments with garden access",
        "Furnished studio flats",
        "Modern townhouses"
      ]
    },
    {
      icon: <DollarSign className="h-4 w-4" />,
      title: "Price Range",
      examples: [
        "Properties under £400 per week",
        "Houses between £300 and £600 weekly",
        "Affordable student flats",
        "Budget-friendly accommodation"
      ]
    },
    {
      icon: <UtilityPole className="h-4 w-4" />,
      title: "Utilities & Amenities",
      examples: [
        "Properties with all bills included",
        "Houses with high-speed internet",
        "Flats with en-suite bathrooms",
        "Student accommodation with parking"
      ]
    },
    {
      icon: <Calendar className="h-4 w-4" />,
      title: "Availability",
      examples: [
        "Properties available from September",
        "Immediately available accommodation",
        "Houses available for next academic year",
        "Short-term student lets"
      ]
    }
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-1">
          <HelpCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Voice Search Help</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <SearchCheck className="h-5 w-5 text-primary" />
            Voice Search Guide
          </SheetTitle>
          <SheetDescription>
            Learn how to use voice commands to find your perfect student property
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">New Feature!</h3>
            <div className="p-3 bg-primary/10 rounded-md border border-primary/20">
              <h4 className="font-medium flex items-center gap-2 text-primary">
                <Bed className="h-4 w-4" />
                Exact Bedroom Matching
              </h4>
              <p className="text-sm mt-1 text-muted-foreground">
                When you need properties with a specific number of bedrooms, try phrases like:
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/30">
                  "exactly 4 bedrooms"
                </Badge>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/30">
                  "3 bedroom house"
                </Badge>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/30">
                  "find 5 bedroom properties"
                </Badge>
              </div>
            </div>
          </div>
          
          {searchCategories.map((category, i) => (
            <div key={i} className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                {category.icon}
                {category.title}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {category.examples.map((example, j) => (
                  <div 
                    key={j} 
                    className={`p-2 rounded text-xs ${
                      example.includes("exactly") 
                        ? "bg-primary/10 border border-primary/20 text-primary" 
                        : "bg-muted"
                    }`}
                  >
                    "{example}"
                  </div>
                ))}
              </div>
              {category.highlight && (
                <p className="text-xs italic text-primary">{category.highlight}</p>
              )}
            </div>
          ))}
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Combining Search Terms</h3>
            <div className="p-3 rounded-md bg-muted">
              <p className="text-sm">You can combine multiple criteria in a single voice command:</p>
              <div className="mt-2 text-xs space-y-1">
                <p>"Find exactly 4 bedroom houses in Leeds with bills included under £500 per week"</p>
                <p>"Show me furnished flats near University of Manchester with at least 2 bedrooms"</p>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}