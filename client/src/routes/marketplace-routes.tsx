import React from 'react';
import { Route, Switch } from 'wouter';
import { MarketplaceItemDetail } from '../components/marketplace/MarketplaceItemDetail';
import { MarketplaceGrid } from '../components/marketplace/MarketplaceGrid';
import { TransactionManager } from '../components/marketplace/TransactionManager';
import { CreateListingForm } from '../components/marketplace/CreateListingForm';

export function MarketplaceRoutes() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Student Marketplace</h1>
        <div>
          <a href="/marketplace/new" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
            Create Listing
          </a>
        </div>
      </div>
      
      <Switch>
        <Route path="/marketplace" component={MarketplaceGrid} />
        <Route path="/marketplace/new" component={CreateListingForm} />
        <Route path="/marketplace/transactions" component={TransactionManager} />
        <Route path="/marketplace/transactions/:id" component={TransactionManager} />
        <Route path="/marketplace/:id" component={MarketplaceItemDetail} />
      </Switch>
    </div>
  );
}