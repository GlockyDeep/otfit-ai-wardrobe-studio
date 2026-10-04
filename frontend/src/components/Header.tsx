import React from 'react';
import { Shirt, Heart, Users } from 'lucide-react';

interface HeaderProps {
  favoritesCount?: number;
  onOpenFavorites?: () => void;
  onHome?: () => void;
  onOpenCommunity?: () => void;
  communityActive?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ favoritesCount = 0, onOpenFavorites, onHome, onOpenCommunity, communityActive = false }) => {
  return (
    <header className="border-b border-white/5 bg-[#0b0f19]/80 backdrop-blur-xl sticky top-0 z-40 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        <button type="button" onClick={onHome} className="flex items-center gap-3 min-w-0 cursor-pointer text-left">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-0.5 shadow-lg shadow-amber-500/10">
            <div className="w-full h-full bg-gray-950 rounded-[10px] flex items-center justify-center">
              <Shirt className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div className="min-w-0">
            <h1 className="font-serif-fashion text-lg sm:text-xl font-bold tracking-tight bg-gradient-to-r from-amber-200 via-rose-100 to-purple-200 bg-clip-text text-transparent truncate">
              ŌTFIT <span className="hidden sm:inline">— AI Wardrobe Studio</span>
            </h1>
            <p className="text-[11px] text-gray-500 font-medium truncate hidden sm:block">AI-Assisted Fashion Design Recommendation System</p>
          </div>
        </button>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {onOpenCommunity && (
            <button
              onClick={onOpenCommunity}
              aria-pressed={communityActive}
              className={`flex items-center gap-1.5 border text-xs px-3 py-2 rounded-xl transition cursor-pointer ${
                communityActive
                  ? 'bg-amber-400 border-amber-400 text-gray-950'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-200 hover:border-amber-400'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="font-semibold hidden sm:inline">What Others</span>
            </button>
          )}
          {onOpenFavorites && (
            <button
              onClick={onOpenFavorites}
              className="flex items-center gap-1.5 bg-gray-900 border border-gray-700 hover:border-rose-500/50 text-gray-200 text-xs px-3 py-2 rounded-xl transition cursor-pointer"
            >
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
              <span className="font-semibold hidden sm:inline">My Wardrobe</span>
              {favoritesCount > 0 && (
                <span className="bg-rose-500 text-white font-bold text-[10px] px-1.5 py-0.5 rounded-full">{favoritesCount}</span>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
