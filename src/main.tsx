import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import { ErrorBoundary } from './components/ErrorBoundary'
import { BracketViewer } from './components/Bracket'

import { ThemeController } from './components/ThemeController'
import { TestSingleElimination, TestDoubleElimination } from './components/TestBracketViewer'

const router = createBrowserRouter([
  {
    path: '/test-single-elimination/:accessToken?',
    element: (
      <>
        <ThemeController />
        <TestSingleElimination />
      </>
    ),
  },
  {
    path: '/test-double-elimination/:accessToken?',
    element: (
      <>
        <ThemeController />
        <TestDoubleElimination />
      </>
    ),
  },
  {
    path: '/:leagueId',
    element: (
      <>
        <ThemeController />
        <BracketViewer />
      </>
    ),
  },
  {
    path: '/',
    element: (
      <>
        <ThemeController />
        <div style={{ padding: '40px', color: '#fff' }}>Please provide a league ID in the URL (e.g., /your-league-id)</div>
      </>
    ),
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </StrictMode>,
)
