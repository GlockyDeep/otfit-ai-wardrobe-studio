import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { RecommendationForm } from './components/RecommendationForm';
import { LoadingOverlay } from './components/LoadingOverlay';
import { ResultsView } from './components/ResultsView';
import { FavoritesDrawer } from './components/FavoritesDrawer';
import type { RecommendationFormData, RecommendationResponse, OutfitDetail, FavoriteOutfit } from './types';
import { AlertCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const STORAGE_KEY = 'couture_saved_favorites';

export const App: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null);
  const [currentFormData, setCurrentFormData] = useState<RecommendationFormData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Favorites Wardrobe State
  const [favorites, setFavorites] = useState<FavoriteOutfit[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isFavoritesOpen, setIsFavoritesOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch (e) {
      console.error('Failed to persist favorites to localStorage', e);
    }
  }, [favorites]);

  const handleToggleFavorite = (outfit: OutfitDetail, occasion: string = 'Design Spec', gender: string = 'Unisex') => {
    setFavorites(prev => {
      const exists = prev.some(f => f.outfit.clothing_type === outfit.clothing_type);
      if (exists) {
        return prev.filter(f => f.outfit.clothing_type !== outfit.clothing_type);
      } else {
        const newFav: FavoriteOutfit = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          saved_at: new Date().toLocaleDateString(),
          occasion: currentFormData?.occasion || occasion,
          gender: currentFormData?.gender || gender,
          outfit
        };
        return [newFav, ...prev];
      }
    });
  };

  const handleRemoveFavorite = (id: string) => {
    setFavorites(prev => prev.filter(f => f.id !== id));
  };

  const handleFormSubmit = async (formData: RecommendationFormData) => {
    setLoading(true);
    setErrorMessage(null);
    setCurrentFormData(formData);

    try {
      const response = await fetch(`${API_BASE_URL}/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Backend service error' }));
        throw new Error(errorData.detail || `Server error (${response.status})`);
      }

      const data: RecommendationResponse = await response.json();
      setRecommendation(data);
    } catch (err: any) {
      console.error('API Error:', err);
      setErrorMessage(
        err.message || 'Failed to connect to CoutureAI server. Please ensure the backend service is running on port 8000.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setRecommendation(null);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      <Header
        favoritesCount={favorites.length}
        onOpenFavorites={() => setIsFavoritesOpen(true)}
      />

      <main className="flex-1 pb-16">
        {errorMessage && (
          <div className="max-w-4xl mx-auto mt-6 px-4">
            <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl text-rose-300 text-sm flex items-start space-x-3 shadow-lg">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block mb-0.5">Connection Error</strong>
                <span>{errorMessage}</span>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <LoadingOverlay />
        ) : recommendation && currentFormData ? (
          <ResultsView
            data={recommendation}
            formData={currentFormData}
            onReset={handleReset}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
          />
        ) : (
          <RecommendationForm onSubmit={handleFormSubmit} isLoading={loading} />
        )}
      </main>

      <FavoritesDrawer
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        favorites={favorites}
        onRemoveFavorite={handleRemoveFavorite}
      />

      <footer className="border-t border-gray-800/80 py-6 text-center text-xs text-gray-500 print:hidden">
        <p>CoutureAI • Final Year B.Tech Project MVP • Rule-Guided Fashion Recommendation Engine</p>
      </footer>
    </div>
  );
};

export default App;
