'use client';
// Route: /services — Services landing page (App Router).
// Renders ServicesPage → ServicesCategories, showing the grid of all service categories.
// This is step 1 of the services workflow: landing → category → detail → booking.
import { ServicesPage } from '@/views/ServicesPage';

export default function Page() {
  return <ServicesPage />;
}