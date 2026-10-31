import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { DashboardPage } from '../pages/DashboardPage';
import { FeedbackPage } from '../pages/FeedbackPage';
import { SignalsPage } from '../pages/SignalsPage';
import { IncidentsPage } from '../pages/IncidentsPage';
import { IncidentDetailPage } from '../pages/IncidentDetailPage';
import { ApprovalsPage } from '../pages/ApprovalsPage';
import { RecoveryPage } from '../pages/RecoveryPage';
import { IngestionPage } from '../pages/IngestionPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'feedback',
        element: <FeedbackPage />,
      },
      {
        path: 'signals',
        element: <SignalsPage />,
      },
      {
        path: 'incidents',
        element: <IncidentsPage />,
      },
      {
        path: 'incidents/:id',
        element: <IncidentDetailPage />,
      },
      {
        path: 'approvals',
        element: <ApprovalsPage />,
      },
      {
        path: 'recovery',
        element: <RecoveryPage />,
      },
      {
        path: 'ingestion',
        element: <IngestionPage />,
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
