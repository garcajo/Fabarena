import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { DataPreloadProvider } from './context/DataPreloadContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Cards from './pages/Cards';
import Collection from './pages/Collection';
import Settings from './pages/Settings';


import Decks from './pages/Decks';
import Register from './pages/Register';
import Login from './pages/Login';
import DeckBuilder from './pages/DeckBuilder';
import HeroesPage from './pages/HeroesPage';
import LivingLegendPage from './pages/LivingLegendPage';
import BansPage from './pages/BansPage';
import DeckGuide from './pages/DeckGuide';
import TestDB from './pages/TestDB';
import ProtectedRoute from './components/ProtectedRoute';
import Help from './pages/Help';
import Wants from './pages/Wants';
import SharedWantsList from './pages/SharedWantsList';
import ScrollToTop from './components/common/ScrollToTop';




function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ToastProvider>
          <DataPreloadProvider>
            <Router>
              <ScrollToTop />
              <Layout>
                <Routes>
                  <Route path="/test-db" element={<TestDB />} />
                  <Route path="/" element={<Home />} />
                  <Route path="/cards" element={<Cards />} />
                  <Route path="/heroes" element={<HeroesPage />} />
                  <Route path="/living-legend" element={<LivingLegendPage />} />
                  <Route path="/bans" element={<BansPage />} />
                  <Route path="/help" element={<Help />} />
                  <Route
                    path="/collection"
                    element={
                      <ProtectedRoute>
                        <Collection />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <Settings />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/wants"
                    element={
                      <ProtectedRoute>
                        <Wants />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/wants/shared/:shareToken" element={<SharedWantsList />} />

                  <Route path="/register" element={<Register />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/decks" element={<Decks mode="public" />} />
                  <Route
                    path="/my-decks"
                    element={
                      <ProtectedRoute>
                        <Decks mode="mine" />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/decks/new"
                    element={
                      <ProtectedRoute redirectTo="/login">
                        <DeckBuilder />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/decks/:deckId/guide"
                    element={<DeckGuide />}
                  />

                  <Route
                    path="/decks/:deckId"
                    element={<DeckBuilder />}
                  />
                </Routes>
              </Layout>
            </Router>
          </DataPreloadProvider>
        </ToastProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;

