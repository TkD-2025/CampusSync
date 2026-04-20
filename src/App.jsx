import { Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { lazy } from 'react'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'

const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const InstitutionalDetailsPage = lazy(() => import('./pages/InstitutionalDetailsPage'))
const FlashCardsPage = lazy(() => import('./pages/FlashCardsPage'))
const TasksPage = lazy(() => import('./pages/TasksPage'))
const EventsPage = lazy(() => import('./pages/EventsPage'))
const ResourcesPage = lazy(() => import('./pages/ResourcesPage'))
const GroupsPage = lazy(() => import('./pages/GroupsPage'))
const PeersPage = lazy(() => import('./pages/PeersPage'))
const AuthPage = lazy(() => import('./pages/AuthPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function App() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading...</div>}>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/institutional-details" element={<InstitutionalDetailsPage />} />
          <Route path="/flash-cards" element={<FlashCardsPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/peers" element={<PeersPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}

export default App
