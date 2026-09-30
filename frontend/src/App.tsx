import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { RecommendationForm } from './components/RecommendationForm';
import { LoadingOverlay } from './components/LoadingOverlay';
import { ResultsView } from './components/ResultsView';
import { FavoritesDrawer } from './components/FavoritesDrawer';
import type { RecommendationFormData, RecommendationResponse, OutfitDetail, FavoriteOutfit, ImageJobStatus } from './types';
import { AlertCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const STORAGE_KEY = 'otfit_saved_favorites';
const POLL_INTERVAL_MS = 2500;   // Poll every 2.5s for alternative images

export const App: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null);
  const [currentFormData, setCurrentFormData] = useState<RecommendationFormData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [altImagesPending, setAltImagesPending] = useState<boolean>(false);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Stop polling when component unmounts
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  /** Poll /image-status/{job_id} and patch alternative images into recommendation state as they arrive */
  const startPollingAlternativeImages = useCallback((jobId: string) => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    setAltImagesPending(true);

    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/image-status/${jobId}`);
        if (!res.ok) {
          clearInterval(pollTimerRef.current!);
          setAltImagesPending(false);
          return;
        }
        const job: ImageJobStatus = await res.json();

        // Patch in images for alternatives that have completed
        if (job.alternatives.length > 0) {
          setRecommendation(prev => {
            if (!prev) return prev;
            const updatedAlts = [...prev.alternatives];
            for (const completed of job.alternatives) {
              const idx = completed.index;
              if (idx < updatedAlts.length) {
                updatedAlts[idx] = {
                  ...updatedAlts[idx],
                  image_url: completed.image_url || updatedAlts[idx].image_url,
                  image_urls: completed.image_urls.length > 0 ? completed.image_urls : updatedAlts[idx].image_urls,
                  sketch_url: completed.sketch_url || updatedAlts[idx].sketch_url,
                };
              }
            }
            return { ...prev, alternatives: updatedAlts };
          });
        }

        // All done — stop polling
        if (job.status === 'done') {
          clearInterval(pollTimerRef.current!);
          setAltImagesPending(false);
        }
      } catch (err) {
        console.error('[POLL ERROR]', err);
        clearInterval(pollTimerRef.current!);
        setAltImagesPending(false);
      }
    }, POLL_INTERVAL_MS);
  }, []);

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
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);

    try {
      const response = await fetch(`${API_BASE_URL}/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Backend service error' }));
        throw new Error(errorData.detail || `Server error (${response.status})`);
      }

      const data: RecommendationResponse = await response.json();
      setRecommendation(data);
      window.scrollTo({ top: 0 });

      // If backend returned a job_id, start polling for alternative images
      if (data.image_job_id) {
        startPollingAlternativeImages(data.image_job_id);
      }
    } catch (err: any) {
      console.error('API Error:', err);
      setErrorMessage(
        err.message || 'Failed to connect to ŌTFIT server. Please ensure the backend service is running on port 8000.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    setAltImagesPending(false);
    setRecommendation(null);
    setErrorMessage(null);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="relative min-h-screen bg-[#0b0f19] text-gray-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden print:hidden" aria-hidden="true">
        <div className="absolute -top-40 -left-32 w-[36rem] h-[36rem] rounded-full bg-amber-500/[0.07] blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-[40rem] h-[40rem] rounded-full bg-fuchsia-600/[0.07] blur-3xl" />
        <div className="absolute -bottom-40 left-1/4 w-[32rem] h-[32rem] rounded-full bg-rose-500/[0.05] blur-3xl" />
      </div>

      <Header
        favoritesCount={favorites.length}
        onOpenFavorites={() => setIsFavoritesOpen(true)}
        onHome={handleReset}
      />

      <main className="relative flex-1 pb-16">
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
            altImagesPending={altImagesPending}
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
    </div>
  );
};

export default App;
