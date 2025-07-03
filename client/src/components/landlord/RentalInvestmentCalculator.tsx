import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calculator, 
  ArrowRight, 
  PiggyBank, 
  Percent, 
  Banknote,
  PoundSterling,
  TrendingUp,
  Download,
  Home,
  Calendar,
  RefreshCw,
  AlertCircle,
  FileDown,
  Share2
} from 'lucide-react';
import { getMortgageRates, getMortgageRateAverages } from '@/lib/api';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Interface for mortgage rate data
interface MortgageRate {
  lender: string;
  initialRate: number;
  followOnRate: number;
  initialPeriodYears: number;
  maxLTV: number;
  fee: number;
}

// Interface for calculation results
interface CalculationResults {
  depositAmount: number;
  loanAmount: number;
  monthlyMortgagePayment: number;
  annualMortgage: number;
  annualRent: number;
  vacancyLoss: number;
  managementFees: number;
  grossOperatingIncome: number;
  netOperatingIncome: number;
  cashFlow: number;
  cashOnCashReturn: number;
  capRate: number;
  projectedValue: number;
  projectedProfit: number;
  totalROI: number;
  annualizedROI: number;
  grossRentMultiplier: number;
  breakEvenOccupancy: number;
}

// Interface for mortgage rate averages
interface MortgageRateAverages {
  twoYearFixed: number;
  fiveYearFixed: number;
  variable: number;
}

// Validation schema for investment calculator
const investmentCalculatorSchema = z.object({
  purchasePrice: z.coerce.number()
    .min(1, 'Purchase price must be greater than 0')
    .max(10000000, 'Purchase price must be less than £10,000,000'),
  depositPercentage: z.coerce.number()
    .min(0, 'Deposit percentage must be 0 or greater')
    .max(100, 'Deposit percentage must be 100 or less'),
  mortgageInterestRate: z.coerce.number()
    .min(0, 'Interest rate must be 0 or greater')
    .max(20, 'Interest rate must be 20 or less'),
  mortgageTerm: z.coerce.number()
    .min(1, 'Mortgage term must be 1 year or greater')
    .max(40, 'Mortgage term must be 40 years or less'),
  monthlyRent: z.coerce.number()
    .min(1, 'Monthly rent must be greater than 0'),
  annualMaintenanceCost: z.coerce.number()
    .min(0, 'Annual maintenance cost must be 0 or greater'),
  managementFeePercentage: z.coerce.number()
    .min(0, 'Management fee percentage must be 0 or greater')
    .max(100, 'Management fee percentage must be 100 or less'),
  vacancyRatePercentage: z.coerce.number()
    .min(0, 'Vacancy rate percentage must be 0 or greater')
    .max(100, 'Vacancy rate percentage must be 100 or less'),
  propertyTaxPerYear: z.coerce.number()
    .min(0, 'Property tax must be 0 or greater'),
  propertyAppreciationRate: z.coerce.number()
    .min(-10, 'Property appreciation rate must be greater than -10%')
    .max(20, 'Property appreciation rate must be less than 20%'),
  holdingPeriod: z.coerce.number()
    .min(1, 'Holding period must be at least 1 year')
    .max(30, 'Holding period must be 30 years or less'),
});

type FormValues = z.infer<typeof investmentCalculatorSchema>;

export function RentalInvestmentCalculator() {
  const [calculationResults, setCalculationResults] = useState<CalculationResults | null>(null);
  const [activeTab, setActiveTab] = useState<string>('inputs');
  const [selectedMortgageRate, setSelectedMortgageRate] = useState<MortgageRate | null>(null);

  // Fetch mortgage rates from API
  const { data: mortgageRates, isLoading: isLoadingRates, isError: isMortgageRateError } = 
    useQuery({
      queryKey: ['/api/mortgage-rates/buy-to-let'],
      queryFn: getMortgageRates
    });

  // Fetch average mortgage rates from API
  const { data: averageRates, isLoading: isLoadingAverages, isError: isAverageRateError } = 
    useQuery({
      queryKey: ['/api/mortgage-rates/averages'],
      queryFn: getMortgageRateAverages
    });
  
  const form = useForm<FormValues>({
    resolver: zodResolver(investmentCalculatorSchema),
    defaultValues: {
      purchasePrice: 250000,
      depositPercentage: 25,
      mortgageInterestRate: 4.5,
      mortgageTerm: 25,
      monthlyRent: 1200,
      annualMaintenanceCost: 1500,
      managementFeePercentage: 10,
      vacancyRatePercentage: 5,
      propertyTaxPerYear: 1200,
      propertyAppreciationRate: 3,
      holdingPeriod: 10,
    },
  });
  
  function calculateResults(values: FormValues) {
    // Calculate loan amount
    const depositAmount = (values.purchasePrice * values.depositPercentage) / 100;
    const loanAmount = values.purchasePrice - depositAmount;
    
    // Calculate monthly mortgage payment using the formula: P = L[c(1 + c)^n]/[(1 + c)^n - 1]
    // where P = payment, L = loan amount, c = monthly interest rate, n = total number of payments
    const monthlyInterestRate = values.mortgageInterestRate / 100 / 12;
    const totalPayments = values.mortgageTerm * 12;
    
    let monthlyMortgagePayment = 0;
    if (monthlyInterestRate > 0) {
      const formula = monthlyInterestRate * Math.pow(1 + monthlyInterestRate, totalPayments);
      const denominator = Math.pow(1 + monthlyInterestRate, totalPayments) - 1;
      monthlyMortgagePayment = loanAmount * (formula / denominator);
    } else {
      monthlyMortgagePayment = loanAmount / totalPayments;
    }
    
    // Calculate annual expenses
    const annualMortgage = monthlyMortgagePayment * 12;
    const annualRent = values.monthlyRent * 12;
    const vacancyLoss = (annualRent * values.vacancyRatePercentage) / 100;
    const managementFees = (annualRent * values.managementFeePercentage) / 100;
    const totalAnnualExpenses = annualMortgage + values.annualMaintenanceCost + 
                                managementFees + vacancyLoss + values.propertyTaxPerYear;
    
    // Calculate net operating income (NOI) and cash flow
    const grossOperatingIncome = annualRent - vacancyLoss;
    const operatingExpenses = values.annualMaintenanceCost + managementFees + values.propertyTaxPerYear;
    const netOperatingIncome = grossOperatingIncome - operatingExpenses;
    const cashFlow = netOperatingIncome - annualMortgage;
    
    // Calculate cash on cash return
    const initialInvestment = depositAmount;
    const cashOnCashReturn = (cashFlow / initialInvestment) * 100;
    
    // Calculate capitalization rate (Cap Rate)
    const capRate = (netOperatingIncome / values.purchasePrice) * 100;
    
    // Calculate return on investment (ROI) over holding period
    const projectedValue = values.purchasePrice * Math.pow(1 + values.propertyAppreciationRate / 100, values.holdingPeriod);
    const totalRentCollected = annualRent * values.holdingPeriod;
    const totalMortgagePaid = annualMortgage * values.holdingPeriod;
    const totalOperatingExpenses = operatingExpenses * values.holdingPeriod;
    const projectedProfit = projectedValue - values.purchasePrice + totalRentCollected - totalMortgagePaid - totalOperatingExpenses;
    const totalROI = (projectedProfit / initialInvestment) * 100;
    const annualizedROI = Math.pow(1 + totalROI / 100, 1 / values.holdingPeriod) - 1;
    
    // Calculate gross rent multiplier
    const grossRentMultiplier = values.purchasePrice / annualRent;
    
    return {
      depositAmount,
      loanAmount,
      monthlyMortgagePayment,
      annualMortgage,
      annualRent,
      vacancyLoss,
      managementFees,
      grossOperatingIncome,
      netOperatingIncome,
      cashFlow,
      cashOnCashReturn,
      capRate,
      projectedValue,
      projectedProfit,
      totalROI,
      annualizedROI: annualizedROI * 100,
      grossRentMultiplier,
      breakEvenOccupancy: (totalAnnualExpenses / annualRent) * 100,
    };
  }
  
  function onSubmit(values: FormValues) {
    const results = calculateResults(values);
    setCalculationResults(results);
    setActiveTab('results');
  }
  
  // Function to generate and download a PDF report of calculation results
  function generatePdfReport() {
    if (!calculationResults) return;
    
    const formValues = form.getValues();
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('Rental Investment Analysis Report', 105, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 22, { align: 'center' });
    
    // Property details
    doc.setFontSize(16);
    doc.text('Property Details', 14, 35);
    
    const propertyData = [
      ['Purchase Price', `£${formValues.purchasePrice.toLocaleString()}`],
      ['Monthly Rent', `£${formValues.monthlyRent.toLocaleString()}`],
      ['Annual Rent', `£${calculationResults.annualRent.toLocaleString()}`],
      ['Deposit Percentage', `${formValues.depositPercentage}%`],
      ['Deposit Amount', `£${Math.round(calculationResults.depositAmount).toLocaleString()}`],
      ['Loan Amount', `£${Math.round(calculationResults.loanAmount).toLocaleString()}`],
      ['Mortgage Interest Rate', `${formValues.mortgageInterestRate}%`],
      ['Mortgage Term', `${formValues.mortgageTerm} years`],
    ];
    
    (doc as any).autoTable({
      startY: 40,
      head: [['Description', 'Value']],
      body: propertyData,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
    });
    
    // Financial Performance
    doc.setFontSize(16);
    doc.text('Financial Performance', 14, (doc as any).lastAutoTable.finalY + 15);
    
    const performanceData = [
      ['Monthly Mortgage Payment', `£${Math.round(calculationResults.monthlyMortgagePayment).toLocaleString()}`],
      ['Annual Mortgage Payment', `£${Math.round(calculationResults.annualMortgage).toLocaleString()}`],
      ['Vacancy Loss (${formValues.vacancyRatePercentage}%)', `£${Math.round(calculationResults.vacancyLoss).toLocaleString()}`],
      ['Management Fees (${formValues.managementFeePercentage}%)', `£${Math.round(calculationResults.managementFees).toLocaleString()}`],
      ['Annual Maintenance Cost', `£${formValues.annualMaintenanceCost.toLocaleString()}`],
      ['Property Tax', `£${formValues.propertyTaxPerYear.toLocaleString()}`],
      ['Gross Operating Income', `£${Math.round(calculationResults.grossOperatingIncome).toLocaleString()}`],
      ['Net Operating Income', `£${Math.round(calculationResults.netOperatingIncome).toLocaleString()}`],
      ['Annual Cash Flow', `£${Math.round(calculationResults.cashFlow).toLocaleString()}`],
      ['Monthly Cash Flow', `£${Math.round(calculationResults.cashFlow / 12).toLocaleString()}`],
    ];
    
    (doc as any).autoTable({
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Description', 'Value']],
      body: performanceData,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
    });
    
    // Investment Returns
    doc.setFontSize(16);
    doc.text('Investment Returns', 14, (doc as any).lastAutoTable.finalY + 15);
    
    const returnsData = [
      ['Cash on Cash Return', `${calculationResults.cashOnCashReturn.toFixed(2)}%`],
      ['Cap Rate', `${calculationResults.capRate.toFixed(2)}%`],
      ['Holding Period', `${formValues.holdingPeriod} years`],
      ['Annual Appreciation Rate', `${formValues.propertyAppreciationRate}%`],
      ['Projected Future Value', `£${Math.round(calculationResults.projectedValue).toLocaleString()}`],
      ['Projected Profit', `£${Math.round(calculationResults.projectedProfit).toLocaleString()}`],
      ['Total ROI', `${calculationResults.totalROI.toFixed(2)}%`],
      ['Annualized ROI', `${calculationResults.annualizedROI.toFixed(2)}%`],
      ['Gross Rent Multiplier', calculationResults.grossRentMultiplier.toFixed(2)],
      ['Break-Even Occupancy', `${calculationResults.breakEvenOccupancy.toFixed(2)}%`],
    ];
    
    (doc as any).autoTable({
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Metric', 'Value']],
      body: returnsData,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
    });
    
    // Add footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text('PropertyCheck Pro - Investment Calculator Report', 105, 285, { align: 'center' });
      doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
    }
    
    // Save the PDF
    doc.save(`rental-investment-analysis-${new Date().toISOString().slice(0, 10)}.pdf`);
  }
  
  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inputs">
            <Calculator className="mr-2 h-4 w-4" />
            Calculator Inputs
          </TabsTrigger>
          <TabsTrigger value="results" disabled={!calculationResults}>
            <TrendingUp className="mr-2 h-4 w-4" />
            Investment Analysis
          </TabsTrigger>
          <TabsTrigger value="sensitivity" disabled={!calculationResults}>
            <Percent className="mr-2 h-4 w-4" />
            Sensitivity Analysis
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="inputs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator size={20} />
                Rental Investment Calculator
              </CardTitle>
              <CardDescription>
                Enter your property investment details to analyze returns and profitability.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Property Details</h3>
                      
                      <FormField
                        control={form.control}
                        name="purchasePrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Purchase Price (£)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                placeholder="e.g. 250000"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="monthlyRent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Monthly Rent (£)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                placeholder="e.g. 1200"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="propertyAppreciationRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Annual Appreciation Rate (%)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                step="0.1"
                                placeholder="e.g. 3.0"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Projected annual increase in property value
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="holdingPeriod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Holding Period (Years)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                placeholder="e.g. 10"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              How long you plan to own the property
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Financing</h3>
                      
                      <FormField
                        control={form.control}
                        name="depositPercentage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Deposit Percentage (%)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                placeholder="e.g. 25"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="mortgageInterestRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mortgage Interest Rate (%)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                step="0.1"
                                placeholder="e.g. 4.5"
                                {...field}
                              />
                            </FormControl>
                            <div className="mt-2">
                              {isLoadingRates ? (
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                                  Loading current mortgage rates...
                                </div>
                              ) : isMortgageRateError ? (
                                <Alert variant="destructive" className="py-2">
                                  <AlertCircle className="h-4 w-4" />
                                  <AlertTitle className="ml-2 text-xs">Error</AlertTitle>
                                  <AlertDescription className="ml-2 text-xs">
                                    Failed to load current mortgage rates
                                  </AlertDescription>
                                </Alert>
                              ) : mortgageRates && Array.isArray(mortgageRates) && mortgageRates.length > 0 ? (
                                <div className="space-y-2">
                                  <div className="text-sm text-muted-foreground">
                                    Select from current buy-to-let mortgage rates:
                                  </div>
                                  <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1">
                                    {mortgageRates.map((rate: MortgageRate, index: number) => (
                                      <div 
                                        key={index}
                                        className={`text-xs p-2 border rounded-md cursor-pointer transition-colors ${
                                          selectedMortgageRate && selectedMortgageRate.lender === rate.lender && 
                                          selectedMortgageRate.initialRate === rate.initialRate
                                            ? 'bg-primary/10 border-primary' 
                                            : 'hover:bg-muted'
                                        }`}
                                        onClick={() => {
                                          setSelectedMortgageRate(rate);
                                          field.onChange(rate.initialRate);
                                          form.setValue('mortgageTerm', rate.initialPeriodYears);
                                        }}
                                      >
                                        <div className="font-medium">{rate.lender}</div>
                                        <div className="flex justify-between mt-1">
                                          <span>Initial: {rate.initialRate}%</span>
                                          <span>Max LTV: {rate.maxLTV}%</span>
                                          <span>Fee: £{rate.fee}</span>
                                        </div>
                                        <div className="text-muted-foreground mt-1">
                                          {rate.initialPeriodYears} year fixed, then {rate.followOnRate}%
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="mortgageTerm"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mortgage Term (Years)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                placeholder="e.g. 25"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Operating Expenses</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="annualMaintenanceCost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Annual Maintenance Cost (£)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                placeholder="e.g. 1500"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="propertyTaxPerYear"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Annual Property Tax (£)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                placeholder="e.g. 1200"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="managementFeePercentage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Management Fee (%)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                step="0.1"
                                placeholder="e.g. 10"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Percentage of monthly rent
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="vacancyRatePercentage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vacancy Rate (%)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                step="0.1"
                                placeholder="e.g. 5"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Expected percentage of time property is vacant
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full md:w-auto">
                    Calculate Investment Returns
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="results" className="mt-4">
          {calculationResults && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp size={20} />
                    Investment Summary
                  </CardTitle>
                  <CardDescription>
                    Key performance metrics for your property investment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-lg border bg-card text-card-foreground shadow p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Percent size={16} className="text-primary" />
                        <h3 className="text-sm font-medium">Cash on Cash Return</h3>
                      </div>
                      <p className="text-2xl font-bold">{calculationResults.cashOnCashReturn.toFixed(2)}%</p>
                      <p className="text-xs text-muted-foreground">
                        Annual cash flow divided by initial investment
                      </p>
                    </div>
                    
                    <div className="rounded-lg border bg-card text-card-foreground shadow p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <PiggyBank size={16} className="text-primary" />
                        <h3 className="text-sm font-medium">Monthly Cash Flow</h3>
                      </div>
                      <p className="text-2xl font-bold">£{Math.round(calculationResults.cashFlow / 12).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        Monthly income after all expenses
                      </p>
                    </div>
                    
                    <div className="rounded-lg border bg-card text-card-foreground shadow p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Percent size={16} className="text-primary" />
                        <h3 className="text-sm font-medium">Cap Rate</h3>
                      </div>
                      <p className="text-2xl font-bold">{calculationResults.capRate.toFixed(2)}%</p>
                      <p className="text-xs text-muted-foreground">
                        Net operating income divided by property value
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Property Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-muted-foreground">Purchase Price:</span>
                      <span className="font-medium">£{form.getValues().purchasePrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-muted-foreground">Deposit (Down Payment):</span>
                      <span className="font-medium">£{Math.round(calculationResults.depositAmount).toLocaleString()} ({form.getValues().depositPercentage}%)</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-muted-foreground">Loan Amount:</span>
                      <span className="font-medium">£{Math.round(calculationResults.loanAmount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-muted-foreground">Monthly Mortgage Payment:</span>
                      <span className="font-medium">£{Math.round(calculationResults.monthlyMortgagePayment).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Monthly Rental Income:</span>
                      <span className="font-medium">£{form.getValues().monthlyRent.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Long-Term Returns</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-muted-foreground">Holding Period:</span>
                      <span className="font-medium">{form.getValues().holdingPeriod} years</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-muted-foreground">Projected Property Value:</span>
                      <span className="font-medium">£{Math.round(calculationResults.projectedValue).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-muted-foreground">Total Projected Profit:</span>
                      <span className="font-medium">£{Math.round(calculationResults.projectedProfit).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-muted-foreground">Total ROI:</span>
                      <span className="font-medium">{calculationResults.totalROI.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Annualized ROI:</span>
                      <span className="font-medium">{calculationResults.annualizedROI.toFixed(2)}% per year</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Banknote size={20} />
                    Mortgage Analysis
                  </CardTitle>
                  <CardDescription>
                    Comparing your mortgage with current market rates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-md font-medium border-b pb-2">Your Mortgage</h3>
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="text-muted-foreground">Interest Rate:</span>
                        <span className="font-medium">{form.getValues().mortgageInterestRate}%</span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="text-muted-foreground">Loan to Value (LTV):</span>
                        <span className="font-medium">{(100 - form.getValues().depositPercentage)}%</span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="text-muted-foreground">Monthly Payment:</span>
                        <span className="font-medium">£{Math.round(calculationResults.monthlyMortgagePayment).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total Interest Paid:</span>
                        <span className="font-medium">£{Math.round(calculationResults.annualMortgage * form.getValues().mortgageTerm - calculationResults.loanAmount).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-md font-medium border-b pb-2">Current Market Rates</h3>
                      {isLoadingAverages ? (
                        <div className="flex items-center gap-2 py-4">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">Loading market rates...</span>
                        </div>
                      ) : isAverageRateError ? (
                        <Alert variant="destructive" className="mt-4">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Error</AlertTitle>
                          <AlertDescription>
                            Failed to load current market rates data
                          </AlertDescription>
                        </Alert>
                      ) : averageRates && typeof averageRates === 'object' ? (
                        <>
                          <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-muted-foreground">Avg 2-Year Fixed:</span>
                            <span className="font-medium">
                              {(averageRates as MortgageRateAverages)?.twoYearFixed?.toFixed(2) || '0.00'}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-muted-foreground">Avg 5-Year Fixed:</span>
                            <span className="font-medium">
                              {(averageRates as MortgageRateAverages)?.fiveYearFixed?.toFixed(2) || '0.00'}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Avg Variable Rate:</span>
                            <span className="font-medium">
                              {(averageRates as MortgageRateAverages)?.variable?.toFixed(2) || '0.00'}%
                            </span>
                          </div>
                          <div className="bg-muted p-2 rounded-md mt-2">
                            <p className="text-xs text-muted-foreground">
                              {form.getValues().mortgageInterestRate < ((averageRates as MortgageRateAverages)?.twoYearFixed || 0) ? 
                                "Your rate is below market average - great job!" : 
                                "Your rate is above current market average. Consider refinancing to save money."}
                            </p>
                          </div>
                        </>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PiggyBank size={20} />
                    Operating Finances
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-md font-medium border-b pb-2">Income</h3>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Annual Rental Income:</span>
                        <span className="font-medium">£{Math.round(calculationResults.annualRent).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Less Vacancy Loss:</span>
                        <span className="font-medium text-destructive">-£{Math.round(calculationResults.vacancyLoss).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center font-medium pt-2 border-t">
                        <span>Gross Operating Income:</span>
                        <span>£{Math.round(calculationResults.grossOperatingIncome).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-md font-medium border-b pb-2">Expenses</h3>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Annual Mortgage:</span>
                        <span className="font-medium">£{Math.round(calculationResults.annualMortgage).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Property Tax:</span>
                        <span className="font-medium">£{form.getValues().propertyTaxPerYear.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Maintenance:</span>
                        <span className="font-medium">£{form.getValues().annualMaintenanceCost.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Management Fees:</span>
                        <span className="font-medium">£{Math.round(calculationResults.managementFees).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Net Operating Income:</span>
                      <span className="font-medium">£{Math.round(calculationResults.netOperatingIncome).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-medium">Annual Cash Flow:</span>
                      <span className={`font-bold ${calculationResults.cashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        £{Math.round(calculationResults.cashFlow).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Button onClick={() => setActiveTab('inputs')} variant="outline" className="w-full">
                Return to Calculator
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="sensitivity" className="mt-4">
          {calculationResults && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Percent size={20} />
                    Sensitivity Analysis
                  </CardTitle>
                  <CardDescription>
                    See how changes in key variables affect your investment returns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {/* Interest Rate Sensitivity */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium border-b pb-2">Interest Rate Sensitivity</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        How your cash flow and returns would change if mortgage interest rates change
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-muted">
                              <th className="p-2 text-left font-medium">Interest Rate</th>
                              <th className="p-2 text-right font-medium">Monthly Payment</th>
                              <th className="p-2 text-right font-medium">Monthly Cash Flow</th>
                              <th className="p-2 text-right font-medium">Cash-on-Cash Return</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              form.getValues().mortgageInterestRate - 2,
                              form.getValues().mortgageInterestRate - 1,
                              form.getValues().mortgageInterestRate,
                              form.getValues().mortgageInterestRate + 1,
                              form.getValues().mortgageInterestRate + 2
                            ].map((rate, index) => {
                              if (rate <= 0) return null;
                              
                              // Recalculate with different interest rate
                              const values = {...form.getValues(), mortgageInterestRate: rate};
                              const results = calculateResults(values);
                              
                              return (
                                <tr key={index} className={index % 2 === 0 ? 'bg-muted/50' : ''}>
                                  <td className="p-2 border-b">
                                    {rate.toFixed(2)}%
                                    {rate === form.getValues().mortgageInterestRate && 
                                      <span className="ml-2 text-xs text-primary">(Current)</span>
                                    }
                                  </td>
                                  <td className="p-2 border-b text-right">
                                    £{Math.round(results.monthlyMortgagePayment).toLocaleString()}
                                  </td>
                                  <td className="p-2 border-b text-right">
                                    <span className={results.cashFlow / 12 >= 0 ? 'text-green-600' : 'text-red-600'}>
                                      £{Math.round(results.cashFlow / 12).toLocaleString()}
                                    </span>
                                  </td>
                                  <td className="p-2 border-b text-right">
                                    <span className={results.cashOnCashReturn >= 0 ? 'text-green-600' : 'text-red-600'}>
                                      {results.cashOnCashReturn.toFixed(2)}%
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    {/* Vacancy Rate Sensitivity */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium border-b pb-2">Vacancy Rate Sensitivity</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        How your returns would change with different vacancy rates
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-muted">
                              <th className="p-2 text-left font-medium">Vacancy Rate</th>
                              <th className="p-2 text-right font-medium">Annual Vacancy Loss</th>
                              <th className="p-2 text-right font-medium">Monthly Cash Flow</th>
                              <th className="p-2 text-right font-medium">Cash-on-Cash Return</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[0, 2.5, 5, 7.5, 10, 15].map((rate, index) => {
                              // Recalculate with different vacancy rate
                              const values = {...form.getValues(), vacancyRatePercentage: rate};
                              const results = calculateResults(values);
                              
                              return (
                                <tr key={index} className={index % 2 === 0 ? 'bg-muted/50' : ''}>
                                  <td className="p-2 border-b">
                                    {rate.toFixed(1)}%
                                    {rate === form.getValues().vacancyRatePercentage && 
                                      <span className="ml-2 text-xs text-primary">(Current)</span>
                                    }
                                  </td>
                                  <td className="p-2 border-b text-right">
                                    £{Math.round(results.vacancyLoss).toLocaleString()}
                                  </td>
                                  <td className="p-2 border-b text-right">
                                    <span className={results.cashFlow / 12 >= 0 ? 'text-green-600' : 'text-red-600'}>
                                      £{Math.round(results.cashFlow / 12).toLocaleString()}
                                    </span>
                                  </td>
                                  <td className="p-2 border-b text-right">
                                    <span className={results.cashOnCashReturn >= 0 ? 'text-green-600' : 'text-red-600'}>
                                      {results.cashOnCashReturn.toFixed(2)}%
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    {/* Property Appreciation Sensitivity */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium border-b pb-2">Appreciation Rate Sensitivity</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        How different appreciation rates affect your total returns over the holding period
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-muted">
                              <th className="p-2 text-left font-medium">Appreciation Rate</th>
                              <th className="p-2 text-right font-medium">Final Property Value</th>
                              <th className="p-2 text-right font-medium">Total Profit</th>
                              <th className="p-2 text-right font-medium">Total ROI</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[0, 1, 2, 3, 4, 5, 6].map((rate, index) => {
                              // Recalculate with different appreciation rate
                              const values = {...form.getValues(), propertyAppreciationRate: rate};
                              const results = calculateResults(values);
                              
                              return (
                                <tr key={index} className={index % 2 === 0 ? 'bg-muted/50' : ''}>
                                  <td className="p-2 border-b">
                                    {rate.toFixed(1)}%
                                    {rate === form.getValues().propertyAppreciationRate && 
                                      <span className="ml-2 text-xs text-primary">(Current)</span>
                                    }
                                  </td>
                                  <td className="p-2 border-b text-right">
                                    £{Math.round(results.projectedValue).toLocaleString()}
                                  </td>
                                  <td className="p-2 border-b text-right">
                                    <span className={results.projectedProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                      £{Math.round(results.projectedProfit).toLocaleString()}
                                    </span>
                                  </td>
                                  <td className="p-2 border-b text-right">
                                    <span className={results.totalROI >= 0 ? 'text-green-600' : 'text-red-600'}>
                                      {results.totalROI.toFixed(2)}%
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Button onClick={() => setActiveTab('inputs')} variant="outline" className="w-full">
                Return to Calculator
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}