import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Brain, 
  Coffee, 
  BookOpen, 
  Home, 
  Loader2, 
  ArrowRight, 
  Check, 
  AlertTriangle, 
  Heart, 
  X,
  AlarmClock,
  Music,
  ArrowUpDown,
  MessageSquare,
  MailPlus
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MatchResult {
  tenantId: number;
  name: string;
  compatibilityScore: number;
  compatibilityReasons: string[];
  sharedInterests: string[];
  potentialChallenges: string[];
}

export function RoommateMatching() {
  const [personalityTraits, setPersonalityTraits] = useState<string[]>([]);
  const [lifestyle, setLifestyle] = useState<string>('');
  const [interests, setInterests] = useState<string>('');
  const [studyHabits, setStudyHabits] = useState<string>('');
  const [livingPreferences, setLivingPreferences] = useState<string>('');
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [showProfileComplete, setShowProfileComplete] = useState<boolean>(false);
  
  // Personality trait options
  const personalityOptions = [
    "Extroverted", "Introverted", "Organized", "Spontaneous", 
    "Neat", "Relaxed", "Quiet", "Talkative", "Night Owl", 
    "Early Bird", "Studious", "Social"
  ];
  
  // Lifestyle options
  const lifestyleOptions = [
    "Active/Athletic", "Homebody", "Party-goer", "Traveler", 
    "Foodie", "Gamer", "Creative", "Academic"
  ];
  
  // API call to find roommate matches
  const matchingMutation = useMutation({
    mutationFn: async () => {
      // Check if all fields are filled
      if (!validateForm()) {
        throw new Error('Please complete all fields in your profile');
      }
      
      const response = await apiRequest('POST', '/api/tenant/roommate-match', {
        personalityTraits,
        lifestyle,
        interests,
        studyHabits,
        livingPreferences
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.matches) {
        setMatches(data.matches);
        setShowProfileComplete(true);
      } else {
        toast({
          title: "Matching failed",
          description: "Failed to find suitable roommate matches. Please try again.",
          variant: "destructive"
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Matching failed",
        description: error.message || "Failed to find suitable roommate matches. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Validate form
  const validateForm = () => {
    return (
      personalityTraits.length > 0 && 
      lifestyle !== '' && 
      interests.trim() !== '' && 
      studyHabits.trim() !== '' && 
      livingPreferences.trim() !== ''
    );
  };
  
  // Handle personality trait selection
  const handlePersonalityChange = (trait: string) => {
    setPersonalityTraits(prev => {
      if (prev.includes(trait)) {
        return prev.filter(t => t !== trait);
      } else {
        return [...prev, trait];
      }
    });
  };
  
  // Find roommate matches
  const findMatches = () => {
    matchingMutation.mutate();
  };
  
  // Get percentage color based on compatibility score
  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-green-400";
    if (score >= 40) return "bg-amber-400";
    return "bg-red-400";
  };
  
  // Format score for display
  const formatScore = (score: number) => {
    return `${score}%`;
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Roommate Matching
        </CardTitle>
        <CardDescription>
          Find compatible roommates based on personality, interests, and living preferences
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="profile" className="flex items-center gap-1">
              <Brain className="h-4 w-4" />
              <span>Your Profile</span>
            </TabsTrigger>
            <TabsTrigger 
              value="matches" 
              disabled={matches.length === 0}
              className="flex items-center gap-1"
            >
              <Users className="h-4 w-4" />
              <span>Matches</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label className="text-base">Personality Traits</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Select traits that best describe you
                </p>
                
                <div className="flex flex-wrap gap-2">
                  {personalityOptions.map((trait) => (
                    <Badge
                      key={trait}
                      variant={personalityTraits.includes(trait) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handlePersonalityChange(trait)}
                    >
                      {trait}
                    </Badge>
                  ))}
                </div>
                
                {personalityTraits.length === 0 && (
                  <p className="text-xs text-destructive mt-2">
                    Please select at least one personality trait
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="lifestyle">Lifestyle Preference</Label>
                <Select
                  value={lifestyle}
                  onValueChange={setLifestyle}
                >
                  <SelectTrigger id="lifestyle">
                    <SelectValue placeholder="Select your lifestyle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Lifestyle</SelectLabel>
                      {lifestyleOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="interests">Interests & Hobbies</Label>
                <Textarea
                  id="interests"
                  placeholder="List your interests, hobbies, and activities you enjoy (e.g., sports, music, cooking, gaming)"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  className="h-20"
                />
              </div>
              
              <div>
                <Label htmlFor="studyHabits">Study Habits</Label>
                <Textarea
                  id="studyHabits"
                  placeholder="Describe your study routine, when and where you prefer to study, noise preferences, etc."
                  value={studyHabits}
                  onChange={(e) => setStudyHabits(e.target.value)}
                  className="h-20"
                />
              </div>
              
              <div>
                <Label htmlFor="livingPreferences">Living Preferences</Label>
                <Textarea
                  id="livingPreferences"
                  placeholder="Describe your living preferences (e.g., cleanliness, guests, quiet hours, shared items, etc.)"
                  value={livingPreferences}
                  onChange={(e) => setLivingPreferences(e.target.value)}
                  className="h-20"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-4">
              <div>
                <p className="text-sm font-medium">Profile Completion</p>
                <Progress 
                  value={
                    (
                      (personalityTraits.length > 0 ? 20 : 0) +
                      (lifestyle ? 20 : 0) +
                      (interests.trim() ? 20 : 0) +
                      (studyHabits.trim() ? 20 : 0) +
                      (livingPreferences.trim() ? 20 : 0)
                    )
                  } 
                  className="h-2 w-40 mt-2"
                />
              </div>
              
              <Button 
                onClick={findMatches} 
                disabled={!validateForm() || matchingMutation.isPending}
              >
                {matchingMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Finding Matches...
                  </>
                ) : (
                  <>
                    <Users className="mr-2 h-4 w-4" />
                    Find Matches
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="matches" className="space-y-6">
            {matches.length > 0 ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Your Matches</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    We've found {matches.length} potential roommates that match your profile
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {matches.map((match, index) => (
                      <Card key={index} className="overflow-hidden">
                        <div className="p-4">
                          <div className="flex items-center space-x-4">
                            <Avatar className="h-12 w-12 border-4 border-background">
                              <AvatarFallback className="bg-primary text-white">
                                {match.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-semibold">{match.name}</h4>
                              <div className="flex items-center space-x-2">
                                <Progress 
                                  value={match.compatibilityScore} 
                                  className="h-2 w-24" 
                                  indicatorClassName={getCompatibilityColor(match.compatibilityScore)}
                                />
                                <span className="text-sm font-medium">
                                  {formatScore(match.compatibilityScore)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="px-4 py-3 bg-muted/40 flex flex-col gap-3">
                          <div>
                            <p className="text-xs font-medium flex items-center">
                              <Check className="h-3.5 w-3.5 text-green-500 mr-1" />
                              Why You'll Get Along
                            </p>
                            <ul className="mt-1 space-y-1">
                              {match.compatibilityReasons.map((reason, i) => (
                                <li key={i} className="text-xs flex">
                                  <ArrowRight className="h-3 w-3 text-muted-foreground mr-1 flex-shrink-0 mt-0.5" />
                                  <span>{reason}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <p className="text-xs font-medium flex items-center">
                              <Heart className="h-3.5 w-3.5 text-pink-500 mr-1" />
                              Shared Interests
                            </p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {match.sharedInterests.map((interest, i) => (
                                <Badge key={i} variant="outline" className="text-xs bg-background">
                                  {interest}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-xs font-medium flex items-center">
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mr-1" />
                              Potential Challenges
                            </p>
                            <ul className="mt-1 space-y-1">
                              {match.potentialChallenges.map((challenge, i) => (
                                <li key={i} className="text-xs flex">
                                  <X className="h-3 w-3 text-muted-foreground mr-1 flex-shrink-0 mt-0.5" />
                                  <span>{challenge}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        
                        <div className="p-3 border-t flex justify-end">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Connect
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Connect with {match.name}</DialogTitle>
                                <DialogDescription>
                                  Send a message to introduce yourself and start a conversation.
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="space-y-4 py-4">
                                <div className="flex items-start space-x-4">
                                  <Avatar className="mt-1">
                                    <AvatarFallback className="bg-primary text-white">
                                      {match.name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="bg-muted rounded-lg p-3">
                                      <div className="flex justify-between items-start">
                                        <h4 className="font-medium text-sm">{match.name}</h4>
                                        <Badge variant="outline" className="ml-2 text-xs">
                                          {formatScore(match.compatibilityScore)} Match
                                        </Badge>
                                      </div>
                                      <p className="text-sm mt-1">
                                        Hey there! I see we have some shared interests like {match.sharedInterests[0]}{" "}
                                        {match.sharedInterests[1] && `and ${match.sharedInterests[1]}`}. 
                                        Would be great to chat about potential housing options!
                                      </p>
                                    </div>
                                    <div className="mt-4">
                                      <Label htmlFor="message">Your Message</Label>
                                      <Textarea 
                                        id="message" 
                                        placeholder="Introduce yourself and mention why you think you'd be good roommates..."
                                        className="mt-1"
                                        rows={4}
                                        defaultValue={`Hi ${match.name}! I noticed we're a ${match.compatibilityScore}% match on the roommate finder. I'm looking for housing near campus and would love to chat about potentially being roommates.`}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <DialogFooter>
                                <Button variant="outline">Cancel</Button>
                                <Button className="gap-2">
                                  <MailPlus className="h-4 w-4" />
                                  Send Message
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
                
                <div className="bg-muted rounded-lg p-4">
                  <h4 className="font-medium flex items-center gap-1.5 mb-2">
                    <Coffee className="h-4 w-4" />
                    Roommate Compatibility Tips
                  </h4>
                  <ul className="space-y-2">
                    <li className="text-sm flex items-start">
                      <ArrowRight className="h-4 w-4 text-primary mr-2 flex-shrink-0 mt-0.5" />
                      <span>Discuss sleep schedules, study habits, and social preferences upfront</span>
                    </li>
                    <li className="text-sm flex items-start">
                      <ArrowRight className="h-4 w-4 text-primary mr-2 flex-shrink-0 mt-0.5" />
                      <span>Create a shared agreement for cleaning, guests, and quiet hours</span>
                    </li>
                    <li className="text-sm flex items-start">
                      <ArrowRight className="h-4 w-4 text-primary mr-2 flex-shrink-0 mt-0.5" />
                      <span>Plan occasional roommate activities to build rapport and communication</span>
                    </li>
                    <li className="text-sm flex items-start">
                      <ArrowRight className="h-4 w-4 text-primary mr-2 flex-shrink-0 mt-0.5" />
                      <span>Address issues early with honest, respectful communication</span>
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No Matches Yet</h3>
                <p className="text-muted-foreground mt-1 mb-6">
                  Complete your profile to find potential roommates
                </p>
                <Button onClick={() => document.querySelector('button[value="profile"]')?.click()}>
                  Complete Your Profile
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-4 border-t">
        <div className="flex items-center text-sm text-muted-foreground">
          <BookOpen className="h-4 w-4 mr-1" />
          <span>Matching based on compatibility scoring algorithm</span>
        </div>
        
        <Button variant="outline" size="sm" className="gap-2">
          <Home className="h-4 w-4" />
          Saved Matches
        </Button>
      </CardFooter>
      
      {/* Profile completion dialog */}
      <Dialog open={showProfileComplete} onOpenChange={setShowProfileComplete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Profile Complete!</DialogTitle>
            <DialogDescription>
              We've found {matches.length} potential roommates based on your profile
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex items-center justify-center rounded-lg bg-primary/10 p-4">
              <div className="text-center">
                <Check className="h-10 w-10 text-primary mx-auto mb-2" />
                <h3 className="font-medium">Match Analysis Complete</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  View your matches to see compatibility scores and shared interests
                </p>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center p-3 bg-muted/40 rounded-lg">
                <AlarmClock className="h-6 w-6 text-amber-500 mb-2" />
                <h4 className="text-sm font-medium">Save Time</h4>
                <p className="text-xs text-center text-muted-foreground mt-1">
                  Skip the roommate search hassle
                </p>
              </div>
              <div className="flex flex-col items-center p-3 bg-muted/40 rounded-lg">
                <Users className="h-6 w-6 text-green-500 mb-2" />
                <h4 className="text-sm font-medium">Better Living</h4>
                <p className="text-xs text-center text-muted-foreground mt-1">
                  Find roommates you'll get along with
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => {
              setShowProfileComplete(false);
              document.querySelector('button[value="matches"]')?.click();
            }} className="w-full">
              <ArrowRight className="mr-2 h-4 w-4" />
              View Your Matches
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}