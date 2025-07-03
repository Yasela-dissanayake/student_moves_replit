import React, { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import { Check, Settings, Users, BellRing, Wrench, Database, Target, Building2, Brain, Shield, FileText, Globe, Bot, Image, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import DepositComplianceAnalytics from "../../components/admin/DepositComplianceAnalytics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { motion } from "framer-motion";
import { 
  FadeIn, 
  SlideIn, 
  ScaleIn, 
  CardHover, 
  ButtonAnimation, 
  StaggerContainer, 
  StaggerItem,
  PulseAnimation,
  NotificationBell
} from "@/components/ui/animated-presence";
import TenantUtilityManagement from "@/components/utility/TenantUtilityManagement";

const AdminDashboard = () => {
  // Sample statistics - in a real app, these would come from API calls
  const stats = {
    totalUsers: 124,
    userGrowth: "+12% this month",
    properties: 86,
    propertiesGrowth: "+5% this month",
    pendingVerifications: 8,
    verificationsGrowth: "-2% this month",
    systemHealth: "98%",
    systemStatus: "Healthy"
  };
  
  // State for social targeting form
  const [campaignBudget, setCampaignBudget] = useState(100);
  const [campaignDuration, setCampaignDuration] = useState(7);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [targetContent, setTargetContent] = useState("");
  const [campaignStatus, setCampaignStatus] = useState("");
  const [isLaunching, setIsLaunching] = useState(false);

  // Function to create and launch campaign
  const launchCampaign = async () => {
    setIsLaunching(true);
    setCampaignStatus("Creating campaign...");
    
    try {
      // Simulate campaign creation API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const campaignId = `CAMP-${Date.now()}`;
      setCampaignStatus(`✅ Campaign launched successfully! Campaign ID: ${campaignId}`);
      
      // Show detailed success message
      setTimeout(() => {
        alert(`🎉 Social Media Campaign Created!\n\n📊 Campaign Details:\n• Campaign ID: ${campaignId}\n• Budget: £${campaignBudget}\n• Duration: ${campaignDuration} days\n• Target: University students\n• Platforms: Instagram, Facebook\n\n🚀 Your campaign is now LIVE and targeting students across selected universities!\n\n📈 You can monitor performance in the Social Targeting dashboard.`);
      }, 500);
      
    } catch (error) {
      setCampaignStatus("❌ Failed to launch campaign. Please try again.");
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <DashboardLayout dashboardType="admin">
      {activeSection === "dashboard" && (
        <div className="p-6 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage all aspects of your student property platform</p>
            </div>
          </div>

          {/* AI Tools Grid */}
          <FadeIn>
            <h2 className="text-xl font-semibold mb-4">AI Admin Tools</h2>
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StaggerItem>
                <CardHover>
                  <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex justify-center mb-4">
                        <motion.div 
                          className="rounded-full bg-red-100 p-3 shadow-inner"
                          whileHover={{ rotate: 15, scale: 1.1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        >
                          <Target className="h-10 w-10 text-red-600" />
                        </motion.div>
                      </div>
                      <div className="text-center">
                        <h2 className="text-xl font-semibold mb-2">Social Targeting</h2>
                        <p className="text-gray-700 mb-4">AI-powered social media campaigns for university students</p>
                        <ButtonAnimation>
                          <Button 
                            onClick={() => setActiveSection("socialTargeting")}
                            className="w-full bg-red-600 hover:bg-red-700 text-white">
                            Access Tool
                          </Button>
                        </ButtonAnimation>
                      </div>
                    </CardContent>
                  </Card>
                </CardHover>
              </StaggerItem>

              <StaggerItem>
                <CardHover>
                  <Card className="bg-gradient-to-br from-red-50 to-pink-100 border-red-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex justify-center mb-4">
                        <motion.div 
                          className="rounded-full bg-pink-100 p-3 shadow-inner"
                          whileHover={{ rotate: -15, scale: 1.1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        >
                          <Building2 className="h-10 w-10 text-red-600" />
                        </motion.div>
                      </div>
                      <div className="text-center">
                        <h2 className="text-xl font-semibold mb-2">Property Management Targeting</h2>
                        <p className="text-gray-700 mb-4">Target property management companies with AI-generated mail campaigns</p>
                        <ButtonAnimation>
                          <Button 
                            onClick={() => setActiveSection("propertyTargeting")}
                            className="w-full bg-red-600 hover:bg-red-700 text-white">
                            Access Tool
                          </Button>
                        </ButtonAnimation>
                      </div>
                    </CardContent>
                  </Card>
                </CardHover>
              </StaggerItem>

              <StaggerItem>
                <CardHover>
                  <Card className="bg-gradient-to-br from-red-50 to-orange-100 border-red-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex justify-center mb-4">
                        <motion.div 
                          className="rounded-full bg-orange-100 p-3 shadow-inner"
                          whileHover={{ scale: 1.1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        >
                          <Users className="h-10 w-10 text-red-600" />
                        </motion.div>
                      </div>
                      <div className="text-center">
                        <h2 className="text-xl font-semibold mb-2">User Verification</h2>
                        <p className="text-gray-700 mb-4">Approve or reject landlord and agent account verification requests</p>
                        <ButtonAnimation>
                          <Button 
                            onClick={() => setActiveSection("userVerification")}
                            className="w-full bg-red-600 hover:bg-red-700 text-white">
                            Access Tool
                          </Button>
                        </ButtonAnimation>
                      </div>
                    </CardContent>
                  </Card>
                </CardHover>
              </StaggerItem>

              <StaggerItem>
                <CardHover>
                  <Card className="bg-gradient-to-br from-gray-50 to-red-50 border-red-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex justify-center mb-4">
                        <motion.div 
                          className="rounded-full bg-gray-100 p-3 shadow-inner"
                          animate={{ rotate: [0, 10, 0, -10, 0] }}
                          transition={{ 
                            repeat: Infinity, 
                            repeatType: "loop", 
                            duration: 5,
                            ease: "easeInOut" 
                          }}
                        >
                          <Settings className="h-10 w-10 text-red-600" />
                        </motion.div>
                      </div>
                      <div className="text-center">
                        <h2 className="text-xl font-semibold mb-2">Settings</h2>
                        <p className="text-gray-700 mb-4">Configure system settings and preferences</p>
                        <ButtonAnimation>
                          <Button 
                            onClick={() => setActiveSection("settings")}
                            className="w-full bg-red-600 hover:bg-red-700 text-white">
                            Access Tool
                          </Button>
                        </ButtonAnimation>
                      </div>
                    </CardContent>
                  </Card>
                </CardHover>
              </StaggerItem>
            </StaggerContainer>
          </FadeIn>

          {/* AI Technologies Section */}
          <SlideIn direction="up">
            <Card className="bg-gradient-to-br from-gray-50 to-red-50 border-red-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: 0.8,
                      delay: 0.5,
                      ease: [0, 0.71, 0.2, 1.01]
                    }}
                  >
                    <Brain className="h-6 w-6 text-red-600 mr-2" />
                  </motion.div>
                  <CardTitle>AI-Powered Features</CardTitle>
                </div>
                <CardDescription>
                  Your platform is enhanced with cutting-edge AI technologies to streamline operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StaggerContainer staggerChildren={0.2} className="space-y-6">
                  <StaggerItem>
                    <motion.div 
                      className="flex items-start p-4 rounded-lg bg-white border border-red-100 shadow-sm"
                      whileHover={{ scale: 1.02, y: -2, backgroundColor: "rgba(254, 242, 242, 0.4)" }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <div className="mr-4">
                        <motion.div 
                          className="rounded-full bg-red-100 p-2"
                          whileHover={{ rotate: 15 }}
                        >
                          <Wrench className="h-6 w-6 text-red-600" />
                        </motion.div>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium">AI Maintenance System</h3>
                        <p className="text-gray-600 mb-2">Automatically detect and fix issues across your website</p>
                        <ButtonAnimation>
                          <Button variant="outline" size="sm" onClick={() => setActiveSection("aiMaintenance")}
                            className="border-red-200 text-red-600 hover:bg-red-50">
                            Access Tool
                          </Button>
                        </ButtonAnimation>
                      </div>
                    </motion.div>
                  </StaggerItem>
                  
                  <StaggerItem>
                    <motion.div 
                      className="flex items-start p-4 rounded-lg bg-white border border-red-100 shadow-sm"
                      whileHover={{ scale: 1.02, y: -2, backgroundColor: "rgba(254, 242, 242, 0.4)" }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <div className="mr-4">
                        <motion.div 
                          className="rounded-full bg-red-100 p-2"
                          whileHover={{ scale: 1.1 }}
                        >
                          <Globe className="h-6 w-6 text-red-600" />
                        </motion.div>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-red-700">🌟 AI Website Builder</h3>
                        <p className="text-gray-600 mb-3">Implement new features and functionalities with AI assistance</p>
                        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                          <button 
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border-2 border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 h-10 px-4 font-semibold"
                            onClick={() => setActiveSection("aiWebsiteBuilder")}
                          >
                            ⚡ Basic Tool
                          </button>
                          <button 
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto h-10 px-4 font-semibold shadow-lg"
                            onClick={() => window.location.href = '/dashboard/admin/enhanced-website-builder'}
                          >
                            🚀 Enhanced (UniRent WebCraft)
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </StaggerItem>

                  <StaggerItem>
                    <motion.div 
                      className="flex items-start p-4 rounded-lg bg-white border border-red-100 shadow-sm"
                      whileHover={{ scale: 1.02, y: -2, backgroundColor: "rgba(254, 242, 242, 0.4)" }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <div className="mr-4">
                        <motion.div 
                          className="rounded-full bg-red-100 p-2"
                          whileHover={{ scale: 1.1, rotate: -15 }}
                        >
                          <Image className="h-6 w-6 text-red-600" />
                        </motion.div>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium">AI Image Generator</h3>
                        <p className="text-gray-600 mb-2">Generate custom city images and property visualizations with AI</p>
                        <ButtonAnimation>
                          <Link href="/admin/generate-ai-images">
                            <Button variant="outline" size="sm"
                              className="border-red-200 text-red-600 hover:bg-red-50">
                              Access Tool
                            </Button>
                          </Link>
                        </ButtonAnimation>
                      </div>
                    </motion.div>
                  <StaggerItem>
                    <motion.div 
                      className="flex items-start p-4 rounded-lg bg-white border border-red-100 shadow-sm"
                      whileHover={{ scale: 1.02, y: -2, backgroundColor: "rgba(254, 242, 242, 0.4)" }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <div className="mr-4">
                        <motion.div 
                          className="rounded-full bg-red-100 p-2"
                          whileHover={{ scale: 1.1, rotate: 15 }}
                        >
                          <Image className="h-6 w-6 text-red-600" />
                        </motion.div>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium">City Image Manager</h3>
                        <p className="text-gray-600 mb-2">Manually upload and manage city images for the platform</p>
                        <ButtonAnimation>
                          <Link href="/admin/city-images">
                            <Button variant="outline" size="sm"
                              className="border-red-200 text-red-600 hover:bg-red-50">
                              Access Tool
                            </Button>
                          </Link>
                        </ButtonAnimation>
                      </div>
                    </motion.div>
                  </StaggerItem>

                  </StaggerItem>

                  <StaggerItem>
                    <motion.div 
                      className="flex items-start p-4 rounded-lg bg-white border border-red-100 shadow-sm"
                      whileHover={{ scale: 1.02, y: -2, backgroundColor: "rgba(254, 242, 242, 0.4)" }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <div className="mr-4">
                        <motion.div 
                          className="rounded-full bg-red-100 p-2"
                          whileHover={{ scale: 1.1, rotate: 10 }}
                        >
                          <Zap className="h-6 w-6 text-red-600" />
                        </motion.div>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium">Utility Management</h3>
                        <p className="text-gray-600 mb-2">AI-powered utility provider management and tenant registration</p>
                        <ButtonAnimation>
                          <Button variant="outline" size="sm" onClick={() => setActiveSection("utilityManagement")}
                            className="border-red-200 text-red-600 hover:bg-red-50">
                            Access Tool
                          </Button>
                        </ButtonAnimation>
                      </div>
                    </motion.div>
                  </StaggerItem>
                </StaggerContainer>
              </CardContent>
            </Card>
          </SlideIn>
        </div>
      )}

      {activeSection === "socialTargeting" && (
        <FadeIn className="p-6">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex items-center mb-6"
          >
            <ButtonAnimation>
              <Button variant="ghost" onClick={() => setActiveSection("dashboard")} className="mr-2">
                <motion.svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="h-4 w-4 mr-2"
                  animate={{ x: [0, -4, 0] }}
                  transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1, repeatDelay: 2 }}
                >
                  <polyline points="15 18 9 12 15 6"></polyline>
                </motion.svg>
                Back
              </Button>
            </ButtonAnimation>
            <motion.h1 
              className="text-2xl font-bold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Social Targeting Tool
            </motion.h1>
          </motion.div>

          <ScaleIn>
            <Card>
              <CardHeader>
                <CardTitle>Target Universities</CardTitle>
                <CardDescription>Select universities to target in your campaign</CardDescription>
              </CardHeader>
              <CardContent>
                <StaggerContainer className="grid grid-cols-2 gap-4">
                  <StaggerItem className="space-y-2">
                    <motion.div 
                      className="flex items-center space-x-2"
                      whileHover={{ x: 5, transition: { duration: 0.2 } }}
                    >
                      <Checkbox id="university-manchester" />
                      <Label htmlFor="university-manchester">University of Manchester</Label>
                    </motion.div>
                    <motion.div 
                      className="flex items-center space-x-2"
                      whileHover={{ x: 5, transition: { duration: 0.2 } }}
                    >
                      <Checkbox id="university-birmingham" />
                      <Label htmlFor="university-birmingham">University of Birmingham</Label>
                    </motion.div>
                    <motion.div 
                      className="flex items-center space-x-2"
                      whileHover={{ x: 5, transition: { duration: 0.2 } }}
                    >
                      <Checkbox id="university-nottingham" />
                      <Label htmlFor="university-nottingham">University of Nottingham</Label>
                    </motion.div>
                    <motion.div 
                      className="flex items-center space-x-2"
                      whileHover={{ x: 5, transition: { duration: 0.2 } }}
                    >
                      <Checkbox id="university-liverpool" />
                      <Label htmlFor="university-liverpool">University of Liverpool</Label>
                    </motion.div>
                    <motion.div 
                      className="flex items-center space-x-2"
                      whileHover={{ x: 5, transition: { duration: 0.2 } }}
                    >
                      <Checkbox id="university-southampton" />
                      <Label htmlFor="university-southampton">University of Southampton</Label>
                    </motion.div>
                    <motion.div 
                      className="flex items-center space-x-2"
                      whileHover={{ x: 5, transition: { duration: 0.2 } }}
                    >
                      <Checkbox id="university-leicester" />
                      <Label htmlFor="university-leicester">University of Leicester</Label>
                    </motion.div>
                  </StaggerItem>
                  <StaggerItem className="space-y-2">
                    <motion.div 
                      className="flex items-center space-x-2"
                      whileHover={{ x: 5, transition: { duration: 0.2 } }}
                    >
                      <Checkbox id="university-leeds" />
                      <Label htmlFor="university-leeds">University of Leeds</Label>
                    </motion.div>
                    <motion.div 
                      className="flex items-center space-x-2"
                      whileHover={{ x: 5, transition: { duration: 0.2 } }}
                    >
                      <Checkbox id="university-bristol" />
                      <Label htmlFor="university-bristol">University of Bristol</Label>
                    </motion.div>
                    <motion.div 
                      className="flex items-center space-x-2"
                      whileHover={{ x: 5, transition: { duration: 0.2 } }}
                    >
                      <Checkbox id="university-sheffield" />
                      <Label htmlFor="university-sheffield">University of Sheffield</Label>
                    </motion.div>
                    <motion.div 
                      className="flex items-center space-x-2"
                      whileHover={{ x: 5, transition: { duration: 0.2 } }}
                    >
                      <Checkbox id="university-newcastle" />
                      <Label htmlFor="university-newcastle">Newcastle University</Label>
                    </motion.div>
                    <motion.div 
                      className="flex items-center space-x-2"
                      whileHover={{ x: 5, transition: { duration: 0.2 } }}
                    >
                      <Checkbox id="university-exeter" />
                      <Label htmlFor="university-exeter">University of Exeter</Label>
                    </motion.div>
                    <motion.div 
                      className="flex items-center space-x-2"
                      whileHover={{ x: 5, transition: { duration: 0.2 } }}
                    >
                      <Checkbox id="university-york" />
                      <Label htmlFor="university-york">University of York</Label>
                    </motion.div>
                  </StaggerItem>
                </StaggerContainer>
              </CardContent>
            </Card>
          </ScaleIn>

          <SlideIn direction="up" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Target Student Year</CardTitle>
                <CardDescription>Select which year group to target</CardDescription>
              </CardHeader>
              <CardContent>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Select defaultValue="all">
                    <SelectTrigger>
                      <SelectValue placeholder="Select student year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      <SelectItem value="first">First Year</SelectItem>
                      <SelectItem value="second">Second Year</SelectItem>
                      <SelectItem value="third">Third Year</SelectItem>
                      <SelectItem value="postgrad">Postgraduate</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>
              </CardContent>
            </Card>
          </SlideIn>

          <SlideIn direction="up" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Student Interests</CardTitle>
                <CardDescription>Select interests to target for more effective campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <StaggerContainer className="grid grid-cols-2 gap-4" staggerChildren={0.05}>
                  <StaggerItem className="space-y-2">
                    <motion.div 
                      className="flex items-center space-x-2"
                      whileHover={{ x: 5, backgroundColor: "rgba(254, 242, 242, 0.2)", borderRadius: "4px", padding: "2px 4px" }}
                      transition={{ duration: 0.2 }}
                    >
                      <Checkbox id="interest-housing" defaultChecked />
                      <Label htmlFor="interest-housing">Affordable Housing</Label>
                    </motion.div>
                    <motion.div 
                      className="flex items-center space-x-2"
                      whileHover={{ x: 5, backgroundColor: "rgba(254, 242, 242, 0.2)", borderRadius: "4px", padding: "2px 4px" }}
                      transition={{ duration: 0.2 }}
                    >
                      <Checkbox id="interest-sports" />
                      <Label htmlFor="interest-sports">Sports & Fitness</Label>
                    </motion.div>
                    <motion.div 
                      className="flex items-center space-x-2"
                      whileHover={{ x: 5, backgroundColor: "rgba(254, 242, 242, 0.2)", borderRadius: "4px", padding: "2px 4px" }}
                      transition={{ duration: 0.2 }}
                    >
                      <Checkbox id="interest-transport" />
                      <Label htmlFor="interest-transport">Public Transportation</Label>
                    </motion.div>
                    <motion.div 
                      className="flex items-center space-x-2"
                      whileHover={{ x: 5, backgroundColor: "rgba(254, 242, 242, 0.2)", borderRadius: "4px", padding: "2px 4px" }}
                      transition={{ duration: 0.2 }}
                    >
                      <Checkbox id="interest-tech" />
                      <Label htmlFor="interest-tech">Technology</Label>
                    </motion.div>
                    <motion.div 
                      className="flex items-center space-x-2"
                      whileHover={{ x: 5, backgroundColor: "rgba(254, 242, 242, 0.2)", borderRadius: "4px", padding: "2px 4px" }}
                      transition={{ duration: 0.2 }}
                    >
                      <Checkbox id="interest-environment" />
                      <Label htmlFor="interest-environment">Environmental Sustainability</Label>
                    </motion.div>
                    <motion.div 
                      className="flex items-center space-x-2"
                      whileHover={{ x: 5, backgroundColor: "rgba(254, 242, 242, 0.2)", borderRadius: "4px", padding: "2px 4px" }}
                      transition={{ duration: 0.2 }}
                    >
                      <Checkbox id="interest-travel" />
                      <Label htmlFor="interest-travel">Travel & Adventure</Label>
                    </motion.div>
                  </StaggerItem>
                  <StaggerItem className="space-y-2">
                    <motion.div 
                      className="flex items-center space-x-2"
                      whileHover={{ x: 5, backgroundColor: "rgba(254, 242, 242, 0.2)", borderRadius: "4px", padding: "2px 4px" }}
                      transition={{ duration: 0.2 }}
                    >
                      <Checkbox id="interest-nightlife" />
                      <Label htmlFor="interest-nightlife">Entertainment & Nightlife</Label>
                    </motion.div>
                    <motion.div 
                      className="flex items-center space-x-2"
                      whileHover={{ x: 5, backgroundColor: "rgba(254, 242, 242, 0.2)", borderRadius: "4px", padding: "2px 4px" }}
                      transition={{ duration: 0.2 }}
                    >
                      <Checkbox id="interest-food" />
                      <Label htmlFor="interest-food">Food & Dining</Label>
                    </motion.div>
                    <motion.div 
                      className="flex items-center space-x-2"
                      whileHover={{ x: 5, backgroundColor: "rgba(254, 242, 242, 0.2)", borderRadius: "4px", padding: "2px 4px" }}
                      transition={{ duration: 0.2 }}
                    >
                      <Checkbox id="interest-study" />
                      <Label htmlFor="interest-study">Study Spaces</Label>
                    </motion.div>
                    <motion.div 
                      className="flex items-center space-x-2"
                      whileHover={{ x: 5, backgroundColor: "rgba(254, 242, 242, 0.2)", borderRadius: "4px", padding: "2px 4px" }}
                      transition={{ duration: 0.2 }}
                    >
                      <Checkbox id="interest-music" />
                      <Label htmlFor="interest-music">Music & Arts</Label>
                    </motion.div>
                    <motion.div 
                      className="flex items-center space-x-2"
                      whileHover={{ x: 5, backgroundColor: "rgba(254, 242, 242, 0.2)", borderRadius: "4px", padding: "2px 4px" }}
                      transition={{ duration: 0.2 }}
                    >
                      <Checkbox id="interest-career" />
                      <Label htmlFor="interest-career">Career Development</Label>
                    </motion.div>
                    <motion.div 
                      className="flex items-center space-x-2"
                      whileHover={{ x: 5, backgroundColor: "rgba(254, 242, 242, 0.2)", borderRadius: "4px", padding: "2px 4px" }}
                      transition={{ duration: 0.2 }}
                    >
                      <Checkbox id="interest-shopping" />
                      <Label htmlFor="interest-shopping">Shopping</Label>
                    </motion.div>
                  </StaggerItem>
                </StaggerContainer>
              </CardContent>
            </Card>
          </SlideIn>

          <SlideIn direction="up" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Social Media Platforms</CardTitle>
                <CardDescription>Select platforms to target</CardDescription>
              </CardHeader>
              <CardContent>
                <motion.div className="grid grid-cols-2 gap-4">
                  <motion.div 
                    className="flex items-center border rounded-md p-4"
                    whileHover={{ scale: 1.03, borderColor: "#ec4899", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Checkbox id="platform-instagram" defaultChecked className="mr-3" />
                    <Label htmlFor="platform-instagram" className="flex items-center">
                      <motion.svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-5 w-5 mr-2 text-pink-600" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        whileHover={{ rotate: 15 }}
                      >
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                      </motion.svg>
                      Instagram
                    </Label>
                  </motion.div>
                  <motion.div 
                    className="flex items-center border rounded-md p-4"
                    whileHover={{ scale: 1.03, borderColor: "#2563eb", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Checkbox id="platform-facebook" defaultChecked className="mr-3" />
                    <Label htmlFor="platform-facebook" className="flex items-center">
                      <motion.svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-5 w-5 mr-2 text-blue-600" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        whileHover={{ rotate: -15 }}
                      >
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                      </motion.svg>
                      Facebook
                    </Label>
                  </motion.div>
                  <motion.div 
                    className="flex items-center border rounded-md p-4"
                    whileHover={{ scale: 1.03, borderColor: "#38bdf8", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Checkbox id="platform-twitter" className="mr-3" />
                    <Label htmlFor="platform-twitter" className="flex items-center">
                      <motion.svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-5 w-5 mr-2 text-blue-400" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        whileHover={{ scale: 1.2 }}
                      >
                        <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                      </motion.svg>
                      Twitter
                    </Label>
                  </motion.div>
                  <motion.div 
                    className="flex items-center border rounded-md p-4"
                    whileHover={{ scale: 1.03, borderColor: "#1d4ed8", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Checkbox id="platform-linkedin" className="mr-3" />
                    <Label htmlFor="platform-linkedin" className="flex items-center">
                      <motion.svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-5 w-5 mr-2 text-blue-700" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        whileHover={{ y: -2 }}
                      >
                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                        <rect x="2" y="9" width="4" height="12"></rect>
                        <circle cx="4" cy="4" r="2"></circle>
                      </motion.svg>
                      LinkedIn
                    </Label>
                  </motion.div>
                </motion.div>
              </CardContent>
            </Card>
          </SlideIn>

          <SlideIn direction="up" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Budget (£)</CardTitle>
                <CardDescription>Adjust your campaign budget</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <Slider 
                      defaultValue={[100]} 
                      max={1000} 
                      min={50} 
                      step={50}
                      onValueChange={(value) => setCampaignBudget(value[0])}
                    />
                  </motion.div>
                  <motion.div 
                    className="flex justify-between"
                    animate={{ opacity: 1 }}
                    initial={{ opacity: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <span>£50</span>
                    <motion.span 
                      className="font-semibold"
                      key={campaignBudget}
                      initial={{ scale: 1.2, color: "#ef4444" }}
                      animate={{ scale: 1, color: "#000000" }}
                      transition={{ duration: 0.3 }}
                    >
                      £{campaignBudget}
                    </motion.span>
                    <span>£1000</span>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </SlideIn>

          <SlideIn direction="up" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Length (days)</CardTitle>
                <CardDescription>Set the duration for your campaign</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <Slider 
                      defaultValue={[7]} 
                      max={30} 
                      min={1} 
                      step={1}
                      onValueChange={(value) => setCampaignDuration(value[0])}
                    />
                  </motion.div>
                  <motion.div 
                    className="flex justify-between"
                    animate={{ opacity: 1 }}
                    initial={{ opacity: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <span>1 day</span>
                    <motion.span 
                      className="font-semibold"
                      key={campaignDuration}
                      initial={{ scale: 1.2, color: "#ef4444" }}
                      animate={{ scale: 1, color: "#000000" }}
                      transition={{ duration: 0.3 }}
                    >
                      {campaignDuration} days
                    </motion.span>
                    <span>30 days</span>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </SlideIn>

          {campaignStatus && (
            <SlideIn direction="up" className="mt-6">
              <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-center">{campaignStatus}</p>
                </CardContent>
              </Card>
            </SlideIn>
          )}

          <motion.div 
            className="mt-6 flex justify-end"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <ButtonAnimation>
              <button 
                className="mr-2 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-red-200 text-red-600 hover:bg-red-50 h-10 px-4 py-2"
                onClick={() => {
                  alert(`Campaign draft saved successfully!\n\nDraft Details:\n• Budget: £${campaignBudget}\n• Duration: ${campaignDuration} days\n• Target Content: ${targetContent || 'General student content'}\n\nYour draft has been saved and can be launched later.`);
                }}
              >
                Save Draft
              </button>
            </ButtonAnimation>
            <ButtonAnimation>
              <button 
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-red-600 hover:bg-red-700 text-white h-10 px-4 py-2"
                onClick={launchCampaign}
                disabled={isLaunching}
              >
                {isLaunching ? "Creating Campaign..." : "Launch Campaign"}
              </button>
            </ButtonAnimation>
          </motion.div>
        </FadeIn>
      )}
      
      {activeSection === "utilityManagement" && (
        <FadeIn className="p-6">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex items-center mb-6"
          >
            <ButtonAnimation>
              <Button variant="ghost" onClick={() => setActiveSection("dashboard")} className="mr-2">
                <motion.svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="h-4 w-4 mr-2"
                  animate={{ x: [0, -4, 0] }}
                  transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1, repeatDelay: 2 }}
                >
                  <polyline points="15 18 9 12 15 6"></polyline>
                </motion.svg>
                Back
              </Button>
            </ButtonAnimation>
            <motion.h1 
              className="text-2xl font-bold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Utility Management
            </motion.h1>
          </motion.div>
          
          <div className="space-y-6">
            <TenantUtilityManagement />
          </div>
        </FadeIn>
      )}

      {activeSection === "aiWebsiteBuilder" && (
        <FadeIn className="p-6">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex items-center mb-6"
          >
            <ButtonAnimation>
              <Button variant="ghost" onClick={() => setActiveSection("dashboard")} className="mr-2">
                <motion.svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="h-4 w-4 mr-2"
                  animate={{ x: [0, -4, 0] }}
                  transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1, repeatDelay: 2 }}
                >
                  <polyline points="15 18 9 12 15 6"></polyline>
                </motion.svg>
                Back
              </Button>
            </ButtonAnimation>
            <motion.h1 
              className="text-2xl font-bold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              AI Website Builder
            </motion.h1>
          </motion.div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Website Builder</CardTitle>
                <CardDescription>
                  Use AI to build and enhance your property rental website
                </CardDescription>
                <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
                  <strong>New!</strong> Try our enhanced <Link href="/dashboard/admin/enhanced-website-builder" className="font-bold underline text-red-600 hover:text-red-700">UniRent WebCraft</Link> tool with a chat-based interface for a more interactive development experience!
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pageDescription">Describe what you want to build</Label>
                  <Textarea 
                    id="pageDescription" 
                    placeholder="I want to build a page that shows the latest properties with filters for price and location..." 
                    rows={4}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Page Type</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <motion.div 
                      className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer"
                      whileHover={{ scale: 1.02, backgroundColor: "rgba(254, 242, 242, 0.2)" }}
                    >
                      <Checkbox id="page-type-information" />
                      <Label htmlFor="page-type-information">Information Page</Label>
                    </motion.div>
                    <motion.div 
                      className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer"
                      whileHover={{ scale: 1.02, backgroundColor: "rgba(254, 242, 242, 0.2)" }}
                    >
                      <Checkbox id="page-type-interactive" />
                      <Label htmlFor="page-type-interactive">Interactive Tool</Label>
                    </motion.div>
                    <motion.div 
                      className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer"
                      whileHover={{ scale: 1.02, backgroundColor: "rgba(254, 242, 242, 0.2)" }}
                    >
                      <Checkbox id="page-type-booking" />
                      <Label htmlFor="page-type-booking">Booking Form</Label>
                    </motion.div>
                    <motion.div 
                      className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer"
                      whileHover={{ scale: 1.02, backgroundColor: "rgba(254, 242, 242, 0.2)" }}
                    >
                      <Checkbox id="page-type-search" />
                      <Label htmlFor="page-type-search">Search Interface</Label>
                    </motion.div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Design Style</Label>
                  <Select defaultValue="modern">
                    <SelectTrigger>
                      <SelectValue placeholder="Select design style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern">Modern & Clean</SelectItem>
                      <SelectItem value="luxury">Luxury Property</SelectItem>
                      <SelectItem value="student">Student-Focused</SelectItem>
                      <SelectItem value="minimalist">Minimalist</SelectItem>
                      <SelectItem value="bold">Bold & Attention-Grabbing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Features to Include</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <motion.div 
                      className="flex items-center space-x-2"
                      whileHover={{ x: 2 }}
                    >
                      <Checkbox id="feature-photos" defaultChecked />
                      <Label htmlFor="feature-photos">Photo Gallery</Label>
                    </motion.div>
                    <motion.div 
                      className="flex items-center space-x-2"
                      whileHover={{ x: 2 }}
                    >
                      <Checkbox id="feature-map" defaultChecked />
                      <Label htmlFor="feature-map">Map Integration</Label>
                    </motion.div>
                    <motion.div 
                      className="flex items-center space-x-2"
                      whileHover={{ x: 2 }}
                    >
                      <Checkbox id="feature-filters" defaultChecked />
                      <Label htmlFor="feature-filters">Search Filters</Label>
                    </motion.div>
                    <motion.div 
                      className="flex items-center space-x-2"
                      whileHover={{ x: 2 }}
                    >
                      <Checkbox id="feature-booking" />
                      <Label htmlFor="feature-booking">Booking System</Label>
                    </motion.div>
                    <motion.div 
                      className="flex items-center space-x-2"
                      whileHover={{ x: 2 }}
                    >
                      <Checkbox id="feature-chat" />
                      <Label htmlFor="feature-chat">Chat Support</Label>
                    </motion.div>
                    <motion.div 
                      className="flex items-center space-x-2"
                      whileHover={{ x: 2 }}
                    >
                      <Checkbox id="feature-compare" />
                      <Label htmlFor="feature-compare">Compare Properties</Label>
                    </motion.div>
                    <motion.div 
                      className="flex items-center space-x-2"
                      whileHover={{ x: 2 }}
                    >
                      <Checkbox id="feature-virtual" />
                      <Label htmlFor="feature-virtual">Virtual Tour</Label>
                    </motion.div>
                    <motion.div 
                      className="flex items-center space-x-2"
                      whileHover={{ x: 2 }}
                    >
                      <Checkbox id="feature-reviews" />
                      <Label htmlFor="feature-reviews">Reviews Section</Label>
                    </motion.div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <ButtonAnimation>
                  <Button 
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => alert('🎨 AI Website Component Generator\n\nGenerating custom components:\n• Property listing widgets\n• Search filters\n• User dashboards\n• Booking forms\n• Payment integrations\n\n🚀 AI will create responsive, production-ready components tailored to your specifications!')}
                  >
                    Generate Website Component
                  </Button>
                </ButtonAnimation>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Implementation Preview</CardTitle>
                <CardDescription>
                  Once generated, a preview of your component will appear here
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border border-dashed border-red-200 rounded-lg h-[300px] flex items-center justify-center bg-red-50/50">
                  <motion.div 
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <p className="text-red-500">Waiting for component generation...</p>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </div>
        </FadeIn>
      )}
        
      {activeSection === "userVerification" && (
        <FadeIn className="p-6">
          <motion.div 
            className="flex items-center mb-6"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <ButtonAnimation>
              <Button variant="ghost" onClick={() => setActiveSection("dashboard")} className="mr-2">
                <motion.svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="h-4 w-4 mr-2"
                  animate={{ x: [0, -4, 0] }}
                  transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1, repeatDelay: 2 }}
                >
                  <polyline points="15 18 9 12 15 6"></polyline>
                </motion.svg>
                Back
              </Button>
            </ButtonAnimation>
            <h1 className="text-2xl font-bold">User Verification</h1>
          </motion.div>
          
          <ScaleIn>
            <Card>
              <CardHeader>
                <CardTitle>Pending Verification Requests</CardTitle>
                <CardDescription>Review and approve landlord and agent account verification requests</CardDescription>
              </CardHeader>
              <CardContent>
                <StaggerContainer className="space-y-4" staggerChildren={0.1}>
                  <StaggerItem>
                    <motion.div 
                      className="border rounded-md p-4"
                      whileHover={{ 
                        scale: 1.01, 
                        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                        borderColor: "#ef4444"
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">James Wilson</h3>
                          <p className="text-sm text-gray-500">Landlord • Submitted: April 1, 2025</p>
                          <div className="mt-2 flex items-center text-sm">
                            <motion.div whileHover={{ scale: 1.2 }}>
                              <FileText className="h-4 w-4 mr-1 text-blue-500" />
                            </motion.div>
                            <span>ID Document Verified</span>
                          </div>
                          <div className="mt-1 flex items-center text-sm">
                            <motion.div whileHover={{ scale: 1.2 }}>
                              <FileText className="h-4 w-4 mr-1 text-blue-500" />
                            </motion.div>
                            <span>Proof of Address Submitted</span>
                          </div>
                        </div>
                        <div className="flex">
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mr-2 border-red-200 text-red-600 hover:bg-red-50"
                              onClick={() => alert('❌ Verification Rejected!\n\nJames Wilson verification has been rejected.\n\n📋 Actions taken:\n• Verification marked as rejected\n• User notified to resubmit documents\n• Account remains unverified\n• Reason: Insufficient document clarity\n\nThe user will receive guidance on resubmission requirements.')}
                            >
                              <motion.span
                                initial={{ opacity: 0, width: 0 }}
                                whileHover={{ opacity: 1, width: 'auto' }}
                                className="mr-1"
                                transition={{ duration: 0.2 }}
                              >
                                ✕
                              </motion.span>
                              Reject
                            </Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button 
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => alert('✅ Verification Approved!\n\nJames Wilson verification approved successfully.\n\n📋 Actions taken:\n• Identity documents verified\n• Proof of address accepted\n• Account status updated to verified\n• User notification sent\n• Platform access granted\n\nThe user can now access all platform features.')}
                            >
                              <motion.span
                                initial={{ opacity: 0, width: 0 }}
                                whileHover={{ opacity: 1, width: 'auto' }}
                                className="mr-1"
                                transition={{ duration: 0.2 }}
                              >
                                ✓
                              </motion.span>
                              Approve
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  </StaggerItem>
                  
                  <StaggerItem>
                    <motion.div 
                      className="border rounded-md p-4"
                      whileHover={{ 
                        scale: 1.01, 
                        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                        borderColor: "#ef4444"
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">Student Properties Ltd</h3>
                          <p className="text-sm text-gray-500">Agent • Submitted: March 30, 2025</p>
                          <div className="mt-2 flex items-center text-sm">
                            <motion.div whileHover={{ scale: 1.2 }}>
                              <FileText className="h-4 w-4 mr-1 text-blue-500" />
                            </motion.div>
                            <span>Company Registration Verified</span>
                          </div>
                          <div className="mt-1 flex items-center text-sm">
                            <motion.div whileHover={{ scale: 1.2 }}>
                              <FileText className="h-4 w-4 mr-1 text-orange-500" />
                            </motion.div>
                            <span>Address Verification Pending</span>
                          </div>
                        </div>
                        <div className="flex">
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mr-2 border-red-200 text-red-600 hover:bg-red-50"
                              onClick={() => alert('❌ Agent Verification Rejected!\n\nStudent Properties Ltd verification has been rejected.\n\n📋 Actions taken:\n• Agent account verification rejected\n• Company notified to resubmit documents\n• Account remains unverified\n• Reason: Address verification still pending\n\nThey must complete address verification to proceed.')}
                            >
                              <motion.span
                                initial={{ opacity: 0, width: 0 }}
                                whileHover={{ opacity: 1, width: 'auto' }}
                                className="mr-1"
                                transition={{ duration: 0.2 }}
                              >
                                ✕
                              </motion.span>
                              Reject
                            </Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button 
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => alert('✅ Agent Verification Approved!\n\nStudent Properties Ltd verification approved successfully.\n\n📋 Actions taken:\n• Company registration verified\n• Address verification manually approved\n• Agent account status updated\n• Company notification sent\n• Platform access granted\n\nThe agency can now manage properties and tenants.')}
                            >
                              <motion.span
                                initial={{ opacity: 0, width: 0 }}
                                whileHover={{ opacity: 1, width: 'auto' }}
                                className="mr-1"
                                transition={{ duration: 0.2 }}
                              >
                                ✓
                              </motion.span>
                              Approve
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  </StaggerItem>
                  
                  <StaggerItem>
                    <motion.div 
                      className="border rounded-md p-4"
                      whileHover={{ 
                        scale: 1.01, 
                        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                        borderColor: "#ef4444"
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">Emma Johnson</h3>
                          <p className="text-sm text-gray-500">Landlord • Submitted: March 29, 2025</p>
                          <div className="mt-2 flex items-center text-sm">
                            <motion.div whileHover={{ scale: 1.2 }}>
                              <FileText className="h-4 w-4 mr-1 text-blue-500" />
                            </motion.div>
                            <span>ID Document Verified</span>
                          </div>
                          <div className="mt-1 flex items-center text-sm">
                            <motion.div whileHover={{ scale: 1.2 }}>
                              <FileText className="h-4 w-4 mr-1 text-blue-500" />
                            </motion.div>
                            <span>Proof of Address Verified</span>
                          </div>
                        </div>
                        <div className="flex">
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mr-2 border-red-200 text-red-600 hover:bg-red-50"
                              onClick={() => alert('❌ Landlord Verification Rejected!\n\nEmma Johnson verification has been rejected.\n\n📋 Actions taken:\n• Landlord verification rejected\n• User notified to resubmit documents\n• Account remains unverified\n• Reason: Administrative review required\n\nShe will receive guidance on resubmission requirements.')}
                            >
                              <motion.span
                                initial={{ opacity: 0, width: 0 }}
                                whileHover={{ opacity: 1, width: 'auto' }}
                                className="mr-1"
                                transition={{ duration: 0.2 }}
                              >
                                ✕
                              </motion.span>
                              Reject
                            </Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button 
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => alert('✅ Landlord Verification Approved!\n\nEmma Johnson verification approved successfully.\n\n📋 Actions taken:\n• ID document verified\n• Proof of address verified\n• Landlord account status updated\n• User notification sent\n• Platform access granted\n\nShe can now list properties and manage tenancies.')}
                            >
                              <motion.span
                                initial={{ opacity: 0, width: 0 }}
                                whileHover={{ opacity: 1, width: 'auto' }}
                                className="mr-1"
                                transition={{ duration: 0.2 }}
                              >
                                ✓
                              </motion.span>
                              Approve
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  </StaggerItem>
                </StaggerContainer>
              </CardContent>
            </Card>
          </ScaleIn>
        </FadeIn>
      )}
    </DashboardLayout>
  );
};

const StatsCard = ({ title, value, change, icon }: { title: string, value: string, change: string, icon: React.ReactNode }) => (
  <CardHover>
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          <motion.div 
            whileHover={{ scale: 1.2, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            {icon}
          </motion.div>
        </div>
        <div className="space-y-1">
          <motion.h3 
            className="text-3xl font-bold"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {value}
          </motion.h3>
          <motion.p 
            className="text-xs text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {change}
          </motion.p>
        </div>
      </CardContent>
    </Card>
  </CardHover>
);

const ToolCard = ({ 
  title, 
  description, 
  icon, 
  bgColor, 
  linkTo 
}: { 
  title: string, 
  description: string, 
  icon: React.ReactNode, 
  bgColor: string, 
  linkTo: string 
}) => (
  <motion.div
    whileHover={{ 
      scale: 1.03, 
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
    }}
    transition={{ type: "spring", stiffness: 300, damping: 15 }}
  >
    <Card className={`${bgColor} border-0 overflow-hidden`}>
      <CardHeader className="flex flex-col items-center text-center">
        <motion.div 
          className="mb-4"
          whileHover={{ scale: 1.15, rotate: 5 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          {icon}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="text-center">{description}</CardDescription>
        </motion.div>
      </CardHeader>
      <CardFooter className="flex justify-center pb-6">
        <ButtonAnimation>
          <Link href={linkTo}>
            <Button className="w-full relative overflow-hidden group" variant="default">
              <motion.span
                className="absolute inset-0 w-full h-full bg-white/10 transform translate-x-full" 
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.75 }}
              />
              Access Tool
            </Button>
          </Link>
        </ButtonAnimation>
      </CardFooter>
    </Card>
  </motion.div>
);

const AiFeatureCard = ({ 
  title, 
  description, 
  icon, 
  link, 
  linkText 
}: { 
  title: string, 
  description: string, 
  icon: React.ReactNode, 
  link: string, 
  linkText: string 
}) => (
  <motion.div 
    className="space-y-2 p-4 rounded-lg border border-transparent hover:border-primary/20 hover:bg-primary/5"
    whileHover={{ scale: 1.02 }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
  >
    <div className="flex items-start space-x-2">
      <motion.div
        whileHover={{ scale: 1.2, rotate: 5 }}
        className="text-primary"
      >
        {icon}
      </motion.div>
      <h3 className="font-semibold text-md">{title}</h3>
    </div>
    <p className="text-sm text-muted-foreground">{description}</p>
    <Link href={link}>
      <ButtonAnimation>
        <Button 
          variant="secondary" 
          size="sm" 
          className="w-full relative overflow-hidden group"
        >
          <motion.span
            className="absolute inset-0 w-full h-full bg-primary/10 transform translate-x-full" 
            initial={{ x: "-100%" }}
            whileHover={{ x: "100%" }}
            transition={{ duration: 0.75 }}
          />
          {linkText}
        </Button>
      </ButtonAnimation>
    </Link>
  </motion.div>
);

export default AdminDashboard;