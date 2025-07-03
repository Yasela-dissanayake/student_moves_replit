import React from 'react';
import { Route } from 'wouter';
import { CityImageManager } from '@/components/admin/city-images/CityImageManager';
import BusinessOutreachDatabase from '@/pages/admin/BusinessOutreachDatabase';
import NewsletterGenerator from '@/pages/admin/NewsletterGenerator';

export function AdminRoutes() {
  return (
    <>
      <Route path="/admin/city-images" component={CityImageManager} />
      <Route path="/admin/business-outreach-database" component={BusinessOutreachDatabase} />
      <Route path="/admin/newsletter-generator" component={NewsletterGenerator} />
    </>
  );
}