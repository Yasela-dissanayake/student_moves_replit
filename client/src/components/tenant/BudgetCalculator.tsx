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
  Calculator, 
  PoundSterling, 
  Building, 
  CreditCard, 
  Loader2, 
  Maximize, 
  PieChart, 
  ChartBar, 
  Home,
  Library,
  Utensils,
  Train,
  Lightbulb,
  Music,
  Wallet,
  PiggyBank,
  ArrowRight,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface BudgetAnalysisResult {
  affordableRent: number;
  affordableBudget: {
    rent: number;
    food: number;
    transport: number;
    utilities: number;
    entertainment: number;
    savings: number;
    [key: string]: number;
  };
  recommendations: string[];
  accommodationTypes: Array<{
    type: string;
    priceRange: {
      min: number;
      max: number;
    };
  }>;
  warningFlags?: string[];
  savingsRequired?: number;
}

export function BudgetCalculator() {
  const [monthlyIncome, setMonthlyIncome] = useState<number | ''>('');
  const [city, setCity] = useState<string>('');
  const [universityName, setUniversityName] = useState<string>('');
  const [existingExpenses, setExistingExpenses] = useState({
    transport: 0,
    food: 0,
    utilities: 0,
    entertainment: 0,
  });
  const [lifestyle, setLifestyle] = useState<string>('');
  const [courseType, setCourseType] = useState<string>('');
  const [savingsGoal, setSavingsGoal] = useState<number>(0);
  const [analysisResult, setAnalysisResult] = useState<BudgetAnalysisResult | null>(null);
  const [showSavingsWarning, setShowSavingsWarning] = useState<boolean>(false);
  
  // UK cities options
  const cityOptions = [
    "London", "Manchester", "Birmingham", "Liverpool", 
    "Edinburgh", "Glasgow", "Leeds", "Newcastle", 
    "Sheffield", "Bristol", "Cardiff", "Belfast",
    "Oxford", "Cambridge", "Nottingham", "Leicester"
  ];
  
  // University options by city (similar to NeighborhoodSafety component)
  const universityOptions: Record<string, string[]> = {
    "London": ["University College London", "King's College London", "Imperial College London", "Queen Mary University of London"],
    "Manchester": ["University of Manchester", "Manchester Metropolitan University", "Royal Northern College of Music"],
    "Birmingham": ["University of Birmingham", "Birmingham City University", "Aston University"],
    "Liverpool": ["University of Liverpool", "Liverpool John Moores University", "Liverpool Hope University"],
    "Edinburgh": ["University of Edinburgh", "Edinburgh Napier University", "Heriot-Watt University"],
    "Glasgow": ["University of Glasgow", "Glasgow Caledonian University", "University of Strathclyde"],
    "Leeds": ["University of Leeds", "Leeds Beckett University", "Leeds Trinity University"],
    "Newcastle": ["Newcastle University", "Northumbria University"],
    "Sheffield": ["University of Sheffield", "Sheffield Hallam University"],
    "Bristol": ["University of Bristol", "University of the West of England"],
    "Cardiff": ["Cardiff University", "Cardiff Metropolitan University"],
    "Belfast": ["Queen's University Belfast", "Ulster University"],
    "Oxford": ["University of Oxford", "Oxford Brookes University"],
    "Cambridge": ["University of Cambridge", "Anglia Ruskin University"],
    "Nottingham": ["University of Nottingham", "Nottingham Trent University"],
    "Leicester": ["University of Leicester", "De Montfort University"]
  };
  
  // Lifestyle options
  const lifestyleOptions = [
    "Budget", "Standard", "Comfortable", "Luxury"
  ];
  
  // Course types
  const courseTypeOptions = [
    "Undergraduate", "Postgraduate", "PhD", "MBA"
  ];
  
  // API call to analyze budget
  const budgetAnalysisMutation = useMutation({
    mutationFn: async () => {
      // Check if income and city are provided
      if (monthlyIncome === '' || city === '') {
        throw new Error('Monthly income and city are required');
      }
      
      const response = await apiRequest('POST', '/api/tenant/budget-calculator', {
        monthlyIncome,
        city,
        universityName,
        existingExpenses,
        lifestyle,
        courseType,
        savingsGoal
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.analysis) {
        setAnalysisResult(data.analysis);
        
        // Show warning dialog if savings are required
        if (data.analysis.savingsRequired && data.analysis.savingsRequired > 0) {
          setShowSavingsWarning(true);
        }
      } else {
        toast({
          title: "Analysis failed",
          description: "Failed to analyze your budget. Please try again with different inputs.",
          variant: "destructive"
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Analysis failed",
        description: error.message || "Failed to analyze your budget. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Handle expense change
  const handleExpenseChange = (key: string, value: number) => {
    setExistingExpenses(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Analyze budget
  const analyzeBudget = () => {
    budgetAnalysisMutation.mutate();
  };
  
  // Prepare pie chart data
  const preparePieChartData = () => {
    if (!analysisResult) return [];
    
    return Object.entries(analysisResult.affordableBudget).map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value
    }));
  };
  
  // Get color for pie chart segments
  const getPieChartColor = (name: string) => {
    const colors = {
      Rent: '#8884d8',
      Food: '#82ca9d',
      Transport: '#ffc658',
      Utilities: '#ff8042',
      Entertainment: '#a4de6c',
      Savings: '#d0ed57'
    };
    
    return colors[name as keyof typeof colors] || '#8884d8';
  };
  
  // Format currency
  const formatCurrency = (value: number) => {
    return `£${value.toFixed(0)}`;
  };
  
  // Prepare accommodation price data for bar chart
  const prepareAccommodationData = () => {
    if (!analysisResult) return [];
    
    return analysisResult.accommodationTypes.map(acc => ({
      name: acc.type,
      min: acc.priceRange.min,
      max: acc.priceRange.max,
      avg: (acc.priceRange.min + acc.priceRange.max) / 2
    }));
  };
  
  // Get status color based on analysis result
  const getStatusColor = () => {
    if (!analysisResult) return "bg-gray-300";
    
    // If there are warnings or savings required
    if ((analysisResult.warningFlags && analysisResult.warningFlags.length > 0) || 
        (analysisResult.savingsRequired && analysisResult.savingsRequired > 0)) {
      return "bg-amber-500";
    }
    
    // If affordable rent is at least 25% of monthly income (healthy ratio)
    const rentPercentage = (analysisResult.affordableRent / Number(monthlyIncome)) * 100;
    if (rentPercentage <= 30) {
      return "bg-green-500";
    } else if (rentPercentage <= 40) {
      return "bg-amber-500";
    } else {
      return "bg-red-500";
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Student Budget Calculator
        </CardTitle>
        <CardDescription>
          Calculate your affordable rent and get recommendations based on your budget
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="calculator" className="w-full">
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="calculator" className="flex items-center gap-1">
              <PoundSterling className="h-4 w-4" />
              <span>Calculator</span>
            </TabsTrigger>
            <TabsTrigger 
              value="analysis" 
              disabled={!analysisResult}
              className="flex items-center gap-1"
            >
              <PieChart className="h-4 w-4" />
              <span>Analysis</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="calculator" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="monthlyIncome" className="flex justify-between">
                    <span>Monthly Income</span>
                    <span className="text-muted-foreground">
                      {monthlyIncome !== '' ? formatCurrency(monthlyIncome) : '£0'}
                    </span>
                  </Label>
                  <div className="flex items-center">
                    <span className="bg-muted px-3 py-2 rounded-l-md text-muted-foreground">£</span>
                    <Input
                      id="monthlyIncome"
                      type="number"
                      placeholder="e.g. 1200"
                      value={monthlyIncome}
                      onChange={(e) => setMonthlyIncome(e.target.value === '' ? '' : Number(e.target.value))}
                      className="rounded-l-none"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Include student loans, grants, part-time work and any parental support
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="city">City</Label>
                  <Select 
                    value={city} 
                    onValueChange={(value) => {
                      setCity(value);
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
                </div>
                
                <div>
                  <Label htmlFor="lifestyle">Lifestyle Preference</Label>
                  <Select
                    value={lifestyle}
                    onValueChange={setLifestyle}
                  >
                    <SelectTrigger id="lifestyle">
                      <SelectValue placeholder="Select your preferred lifestyle" />
                    </SelectTrigger>
                    <SelectContent>
                      {lifestyleOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    How you'd like to live as a student (affects budget recommendations)
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="courseType">Course Type</Label>
                  <Select
                    value={courseType}
                    onValueChange={setCourseType}
                  >
                    <SelectTrigger id="courseType">
                      <SelectValue placeholder="Select your course type" />
                    </SelectTrigger>
                    <SelectContent>
                      {courseTypeOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium mb-1">Current Monthly Expenses (Optional)</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Add any fixed expenses you already have
                </p>
                
                <div className="space-y-5">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="transport" className="text-sm flex items-center">
                        <Train className="h-4 w-4 mr-1.5" />
                        Transport
                      </Label>
                      <span className="text-sm">{formatCurrency(existingExpenses.transport)}</span>
                    </div>
                    <Slider
                      id="transport"
                      min={0}
                      max={200}
                      step={5}
                      value={[existingExpenses.transport]}
                      onValueChange={(value) => handleExpenseChange('transport', value[0])}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="food" className="text-sm flex items-center">
                        <Utensils className="h-4 w-4 mr-1.5" />
                        Food
                      </Label>
                      <span className="text-sm">{formatCurrency(existingExpenses.food)}</span>
                    </div>
                    <Slider
                      id="food"
                      min={0}
                      max={300}
                      step={10}
                      value={[existingExpenses.food]}
                      onValueChange={(value) => handleExpenseChange('food', value[0])}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="utilities" className="text-sm flex items-center">
                        <Lightbulb className="h-4 w-4 mr-1.5" />
                        Utilities
                      </Label>
                      <span className="text-sm">{formatCurrency(existingExpenses.utilities)}</span>
                    </div>
                    <Slider
                      id="utilities"
                      min={0}
                      max={200}
                      step={5}
                      value={[existingExpenses.utilities]}
                      onValueChange={(value) => handleExpenseChange('utilities', value[0])}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="entertainment" className="text-sm flex items-center">
                        <Music className="h-4 w-4 mr-1.5" />
                        Entertainment
                      </Label>
                      <span className="text-sm">{formatCurrency(existingExpenses.entertainment)}</span>
                    </div>
                    <Slider
                      id="entertainment"
                      min={0}
                      max={200}
                      step={5}
                      value={[existingExpenses.entertainment]}
                      onValueChange={(value) => handleExpenseChange('entertainment', value[0])}
                    />
                  </div>
                </div>
                
                <div className="pt-4">
                  <Label htmlFor="savingsGoal" className="flex justify-between text-sm">
                    <span className="flex items-center">
                      <PiggyBank className="h-4 w-4 mr-1.5" />
                      Monthly Savings Goal
                    </span>
                    <span>{formatCurrency(savingsGoal)}</span>
                  </Label>
                  <Slider
                    id="savingsGoal"
                    min={0}
                    max={300}
                    step={10}
                    value={[savingsGoal]}
                    onValueChange={(value) => setSavingsGoal(value[0])}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    How much you'd like to save each month
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <Button 
                onClick={analyzeBudget} 
                disabled={monthlyIncome === '' || city === '' || budgetAnalysisMutation.isPending}
                className="gap-2"
              >
                {budgetAnalysisMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Calculator className="h-4 w-4" />
                    Calculate Budget
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="analysis" className="space-y-8">
            {analysisResult && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
                        <h3 className="text-lg font-medium">Budget Analysis</h3>
                      </div>
                      
                      <div className="bg-primary/10 rounded-lg p-5 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Affordable Monthly Rent</p>
                          <p className="text-3xl font-bold">{formatCurrency(analysisResult.affordableRent)}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {((analysisResult.affordableRent / Number(monthlyIncome)) * 100).toFixed(0)}% of income
                          </p>
                        </div>
                        <Home className="h-10 w-10 text-primary opacity-50" />
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm mb-2">Monthly Budget Breakdown</h4>
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={preparePieChartData()}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              dataKey="value"
                            >
                              {preparePieChartData().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getPieChartColor(entry.name)} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    {analysisResult.warningFlags && analysisResult.warningFlags.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <h4 className="font-medium text-amber-800 flex items-center gap-1.5 mb-2">
                          <AlertTriangle className="h-4 w-4" />
                          Budget Warnings
                        </h4>
                        <ul className="space-y-1">
                          {analysisResult.warningFlags.map((warning, index) => (
                            <li key={index} className="text-sm text-amber-700 flex items-start">
                              <ArrowRight className="h-4 w-4 mr-1 flex-shrink-0 mt-0.5" />
                              <span>{warning}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-medium text-sm mb-2">Accommodation Options</h4>
                      <div className="relative overflow-hidden rounded-lg border bg-background p-2">
                        <div className="h-[200px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={prepareAccommodationData()}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                              <YAxis tick={{ fontSize: 12 }} />
                              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                              <Bar dataKey="min" name="Min Price" fill="#8884d8" />
                              <Bar dataKey="max" name="Max Price" fill="#82ca9d" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center">
                        <div className={`h-2 w-2 rounded-full bg-green-500 mr-1`}></div>
                        <p className="text-xs text-muted-foreground">
                          Green bars indicate options within your budget of {formatCurrency(analysisResult.affordableRent)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Budget Details</h4>
                      <div className="space-y-2">
                        {Object.entries(analysisResult.affordableBudget).map(([category, amount]) => (
                          <div key={category} className="flex justify-between items-center p-2 border-b">
                            <span className="capitalize text-sm">{category}</span>
                            <Badge variant="outline">{formatCurrency(amount)}</Badge>
                          </div>
                        ))}
                        <div className="flex justify-between items-center p-2 font-medium">
                          <span className="text-sm">Total Monthly Expenses</span>
                          <Badge variant="secondary">
                            {formatCurrency(
                              Object.values(analysisResult.affordableBudget).reduce((a, b) => a + b, 0)
                            )}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm mb-2">Recommendations</h4>
                      <ul className="space-y-2">
                        {analysisResult.recommendations.map((recommendation, index) => (
                          <li key={index} className="flex items-start gap-2 bg-muted/40 p-3 rounded-md">
                            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                            <span className="text-sm">{recommendation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="financing-options">
                        <AccordionTrigger className="text-sm font-medium">
                          Additional Financing Options
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3 py-2">
                            <div className="flex items-start gap-2">
                              <CreditCard className="h-4 w-4 text-primary mt-0.5" />
                              <div>
                                <h5 className="text-sm font-medium">Student Loans</h5>
                                <p className="text-xs text-muted-foreground">Check if you're eligible for maintenance loans or additional funding</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-2">
                              <Library className="h-4 w-4 text-primary mt-0.5" />
                              <div>
                                <h5 className="text-sm font-medium">University Hardship Funds</h5>
                                <p className="text-xs text-muted-foreground">Many universities offer emergency funding for students in financial difficulty</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-2">
                              <Wallet className="h-4 w-4 text-primary mt-0.5" />
                              <div>
                                <h5 className="text-sm font-medium">Part-Time Work</h5>
                                <p className="text-xs text-muted-foreground">Consider campus jobs that work around your schedule</p>
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                    
                    <div className="pt-4">
                      <Button variant="outline" className="w-full gap-2">
                        <Building className="h-4 w-4" />
                        View Properties in Your Budget Range
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-2 border-t">
        <div className="text-sm text-muted-foreground flex items-center gap-1">
          <CreditCard className="h-4 w-4" />
          Student finance calculator
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setMonthlyIncome('');
              setCity('');
              setUniversityName('');
              setExistingExpenses({
                transport: 0,
                food: 0,
                utilities: 0,
                entertainment: 0,
              });
              setLifestyle('');
              setCourseType('');
              setSavingsGoal(0);
              setAnalysisResult(null);
            }}
          >
            Reset
          </Button>
          
          {analysisResult && (
            <Button 
              variant="default" 
              size="sm" 
              className="gap-1"
              asChild
            >
              <a href="#" onClick={(e) => e.preventDefault()}>
                <ChartBar className="h-4 w-4" />
                Save Analysis
              </a>
            </Button>
          )}
        </div>
      </CardFooter>
      
      {/* Budget warning dialog */}
      <Dialog open={showSavingsWarning} onOpenChange={setShowSavingsWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Budget Warning
            </DialogTitle>
            <DialogDescription>
              Your current budget requires adjustments to be sustainable
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
              <h3 className="font-medium text-amber-800 mb-2">Additional Savings Required</h3>
              <p className="text-sm text-amber-700 mb-3">
                Based on your budget needs, you'll need additional savings of{' '}
                <span className="font-bold text-amber-900">
                  {analysisResult?.savingsRequired ? formatCurrency(analysisResult.savingsRequired) : '£0'}{' '}
                  per month
                </span>{' '}
                to meet your expenses.
              </p>
              
              <h4 className="font-medium text-amber-800 mb-1">Recommended Actions:</h4>
              <ul className="space-y-1">
                <li className="text-sm text-amber-700 flex items-start">
                  <ArrowRight className="h-4 w-4 text-amber-500 mr-1 flex-shrink-0 mt-0.5" />
                  <span>Consider increasing your income through part-time work</span>
                </li>
                <li className="text-sm text-amber-700 flex items-start">
                  <ArrowRight className="h-4 w-4 text-amber-500 mr-1 flex-shrink-0 mt-0.5" />
                  <span>Look for more affordable accommodation options</span>
                </li>
                <li className="text-sm text-amber-700 flex items-start">
                  <ArrowRight className="h-4 w-4 text-amber-500 mr-1 flex-shrink-0 mt-0.5" />
                  <span>Reduce non-essential expenses like entertainment</span>
                </li>
                <li className="text-sm text-amber-700 flex items-start">
                  <ArrowRight className="h-4 w-4 text-amber-500 mr-1 flex-shrink-0 mt-0.5" />
                  <span>Check if you're eligible for additional financial support</span>
                </li>
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowSavingsWarning(false)}>
              I Understand
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}