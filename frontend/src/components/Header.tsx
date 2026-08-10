import React from 'react';
import { Sparkles, Shirt, Heart } from 'lucide-react';

interface HeaderProps {
  favoritesCount?: number;
  onOpenFavorites?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ favoritesCount = 0, onOpenFavorites }) => {
  return (
    <header className="border-b border-gray-800/80 glass-panel sticky top-0 z-40 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-0.5 flex items-center justify-center shadow-lg shadow-amber-500/10">
            <div className="w-full h-full bg-gray-950 rounded-[10px] flex items-center justify-center">
              <Shirt className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <h1 className="font-serif-fashion text-xl font-bold tracking-tight bg-gradient-to-r from-amber-200 via-rose-100 to-purple-200 bg-clip-text text-transparent">
              CoutureAI Studio
            </h1>
            <p className="text-xs text-gray-400 font-medium">AI-Assisted Fashion Design Recommendation System</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {onOpenFavorites && (
            <button
              onClick={onOpenFavorites}
              className="flex items-center space-x-1.5 bg-gray-900 border border-gray-700 hover:border-rose-500/50 text-gray-200 text-xs px-3.5 py-2 rounded-xl transition cursor-pointer"
            >
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
              <span className="font-semibold">My Wardrobe</span>
              {favoritesCount > 0 && (
                <span className="ml-1 bg-rose-500 text-white font-bold text-[10px] px-1.5 py-0.5 rounded-full">
                  {favoritesCount}
                </span>
              )}
            </button>
          )}

          <div className="hidden sm:flex items-center space-x-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="text-xs font-semibold text-amber-300">Rule-Guided AI Studio</span>
          </div>
        </div>
      </div>
    </header>
  );
};
