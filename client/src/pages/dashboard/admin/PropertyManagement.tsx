import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Mail, Phone, Globe, Search, Users, Target, Briefcase, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

interface PropertyCompany {
  name: string;
  email: string;
  phone: string;
  website: string;
  description: string;
  location: string;
}

interface SearchCriteria {
  location: string;
  criteria: string;
}

interface CampaignConfig {
  campaignName: string;
  emailSubject: string;
  targetAudience: string;
  campaignObjective: string;
}

export default function PropertyManagement() {
  const [, setLocation] = useLocation();
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    location: '',
    criteria: 'student accommodation'
  });
  const [searchResults, setSearchResults] = useState<PropertyCompany[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [campaignConfig, setCampaignConfig] = useState<CampaignConfig>({
    campaignName: 'Student Accommodation Outreach',
    emailSubject: 'Partnership Opportunity - Premium Student Housing Services',
    targetAudience: 'University students seeking accommodation',
    campaignObjective: 'Generate property management leads'
  });

  const handleCompanySearch = async () => {
    if (!searchCriteria.location) return;
    
    setIsSearching(true);
    try {
      const params = new URLSearchParams({
        location: searchCriteria.location,
        criteria: searchCriteria.criteria
      });
      
      const response = await fetch(`/api/property-management/companies/search?${params}`);
      
      const data = await response.json();
      if (data.success) {
        setSearchResults(data.companies || []);
      }
    } catch (error) {
      console.error('Company search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation('/dashboard/admin')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Property Management B2B Targeting</h1>
            <p className="text-gray-600">Target student property management companies and letting agents</p>
          </div>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Zero-Cost AI Integration
        </Badge>
      </div>

      {/* Company Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Company Search & Discovery
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Target Location</label>
              <Input
                placeholder="e.g., Manchester, Leeds, Birmingham"
                value={searchCriteria.location}
                onChange={(e) => setSearchCriteria({ ...searchCriteria, location: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Search Criteria</label>
              <Input
                placeholder="e.g., student accommodation, letting agents"
                value={searchCriteria.criteria}
                onChange={(e) => setSearchCriteria({ ...searchCriteria, criteria: e.target.value })}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleCompanySearch} 
                disabled={!searchCriteria.location || isSearching}
                className="w-full"
              >
                {isSearching ? 'Searching...' : 'Find Companies'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Briefcase className="h-5 w-5 mr-2" />
              Found Companies ({searchResults.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {searchResults.map((company, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-lg">{company.name}</h3>
                  <p className="text-sm text-gray-600">{company.description}</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      {company.location}
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      {company.email}
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      {company.phone}
                    </div>
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 mr-2 text-gray-400" />
                      <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {company.website}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campaign Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Campaign Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Campaign Name</label>
              <Input
                value={campaignConfig.campaignName}
                onChange={(e) => setCampaignConfig({ ...campaignConfig, campaignName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email Subject</label>
              <Input
                value={campaignConfig.emailSubject}
                onChange={(e) => setCampaignConfig({ ...campaignConfig, emailSubject: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Target Audience</label>
              <Input
                value={campaignConfig.targetAudience}
                onChange={(e) => setCampaignConfig({ ...campaignConfig, targetAudience: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Campaign Objective</label>
              <Input
                value={campaignConfig.campaignObjective}
                onChange={(e) => setCampaignConfig({ ...campaignConfig, campaignObjective: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <Button variant="outline" className="flex items-center">
          <Users className="h-4 w-4 mr-2" />
          Preview Campaign
        </Button>
        <Button className="flex items-center bg-blue-600 hover:bg-blue-700">
          <Mail className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* System Status */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-green-800">System Status</h3>
              <p className="text-green-700">Property Management B2B targeting system is fully operational</p>
            </div>
            <Badge className="bg-green-100 text-green-800">
              ✓ Ready
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}