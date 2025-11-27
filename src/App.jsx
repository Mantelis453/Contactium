import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { useAuth } from './hooks/useAuth'
import { SubscriptionProvider } from './contexts/SubscriptionContext'
import { LanguageProvider } from './contexts/LanguageContext'
import LandingPage from './components/LandingPage'
import Auth from './components/Auth'
import PrivacyPolicy from './components/PrivacyPolicy'
import TermsOfService from './components/TermsOfService'
import CookiePolicy from './components/CookiePolicy'
import Dashboard from './components/Dashboard'
import Campaigns from './components/Campaigns'
import CampaignDetails from './components/CampaignDetails'
import CreateCampaign from './components/CreateCampaign'
import Companies from './components/Companies'
import ContactLists from './components/ContactLists'
import ContactListDetail from './components/ContactListDetail'
import Settings from './components/Settings'
import Help from './components/Help'
import Admin from './components/Admin'
import Layout from './components/Layout'
import './styles/App.css'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <LanguageProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/cookies" element={<CookiePolicy />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Analytics />
        </BrowserRouter>
      </LanguageProvider>
    )
  }

  return (
    <LanguageProvider>
      <BrowserRouter>
        <SubscriptionProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/campaigns" element={<Campaigns />} />
              <Route path="/campaigns/:id" element={<CampaignDetails />} />
              <Route path="/create" element={<CreateCampaign />} />
              <Route path="/companies" element={<Companies />} />
              <Route path="/contact-lists" element={<ContactLists />} />
              <Route path="/contact-lists/:listId" element={<ContactListDetail />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/help" element={<Help />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </SubscriptionProvider>
        <Analytics />
      </BrowserRouter>
    </LanguageProvider>
  )
}

export default App
