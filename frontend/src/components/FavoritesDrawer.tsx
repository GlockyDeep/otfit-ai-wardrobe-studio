import React from 'react';
import type { FavoriteOutfit } from '../types';
import { X, Trash2, Heart, ExternalLink, Calendar, User } from 'lucide-react';

interface FavoritesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: FavoriteOutfit[];
  onRemoveFavorite: (id: string) => void;
}

export const FavoritesDrawer: React.FC<FavoritesDrawerProps> = ({
  isOpen,
  onClose,
  favorites,
  onRemoveFavorite
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-gray-950/80 backdrop-blur-sm transition-opacity">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-gray-900 border-l border-gray-800 text-gray-100 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-gray-900/90">
            <div className="flex items-center space-x-2.5">
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
              <h2 className="font-serif-fashion text-xl font-bold text-gray-100">
                My Saved Wardrobe ({favorites.length})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {favorites.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                  <Heart className="w-8 h-8 stroke-1" />
                </div>
                <h3 className="text-lg font-semibold text-gray-300">Your Wardrobe is Empty</h3>
                <p className="text-sm text-gray-500 max-w-xs mx-auto">
                  Click the heart icon on any outfit card to bookmark your favorite designs here for future reference.
                </p>
              </div>
            ) : (
              favorites.map((fav) => {
                const pSearchUrl = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(
                  `${fav.outfit.clothing_type} ${fav.outfit.fabric} fashion style`
                )}`;

                return (
                  <div
                    key={fav.id}
                    className="glass-card rounded-2xl border border-gray-800 p-5 space-y-4 relative group"
                  >
                    {/* Image Preview */}
                    {(fav.outfit.sketch_url || fav.outfit.image_url) && (
                      <div className="h-44 w-full rounded-xl overflow-hidden bg-gray-950 relative border border-gray-800">
                        <img
                          src={fav.outfit.sketch_url || fav.outfit.image_url}
                          alt={fav.outfit.clothing_type}
                          className="w-full h-full object-cover object-top"
                        />
                        {fav.outfit.sketch_url && (
                          <div className="absolute top-2 left-2 bg-purple-900/80 backdrop-blur-sm text-purple-200 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-700/50">
                            🎨 AI Sketch
                          </div>
                        )}
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-xs text-amber-400 font-medium">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{fav.occasion}</span>
                      </span>
                      <span className="flex items-center space-x-1 text-gray-400">
                        <User className="w-3.5 h-3.5" />
                        <span>{fav.gender}</span>
                      </span>
                    </div>

                    {/* Title */}
                    <div>
                      <h4 className="font-serif-fashion font-bold text-lg text-gray-100">
                        {fav.outfit.clothing_type}
                      </h4>
                      <p className="text-xs text-gray-400 line-clamp-2 mt-1">
                        {fav.outfit.silhouette} &bull; {fav.outfit.fabric}
                      </p>
                    </div>

                    {/* Swatches */}
                    <div className="flex flex-wrap gap-1">
                      {fav.outfit.colors.map((c, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700"
                        >
                          {c}
                        </span>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between">
                      <a
                        href={pSearchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-amber-400 hover:text-amber-300 flex items-center space-x-1 transition"
                      >
                        <span>Pinterest Lookbook</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <button
                        onClick={() => onRemoveFavorite(fav.id)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                        title="Remove from Saved Wardrobe"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
