import React, { useState } from 'react';
import { useLocation, Route, Switch } from 'wouter';
import DocumentsList from './DocumentsList';
import DocumentView from './DocumentView';
import GenerateDocument from './GenerateDocument';

/**
 * Documents main component that handles routing for the documents section
 * This provides a central entry point for all document-related functionality
 */
export default function Documents() {
  const [location] = useLocation();
  
  // Extract the base path to handle nested routes correctly
  const basePath = '/dashboard/documents';
  
  return (
    <Switch>
      <Route path={`${basePath}/generate`} component={GenerateDocument} />
      <Route path={`${basePath}/:id`} component={DocumentView} />
      <Route path={basePath} component={DocumentsList} />
    </Switch>
  );
}