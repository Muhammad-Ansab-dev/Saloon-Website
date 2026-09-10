'use client';
// ServicesPage — Thin view wrapper that renders the ServicesCategories landing grid.
// Used by the /services route (app/services/page.tsx) as the top-level services entry point.
import React from 'react';
import { ServicesCategories } from '../components/ServicesCategories';

export const ServicesPage: React.FC = () => {
  return <ServicesCategories />;
};