import React from 'react';
import { Sparkles, Shirt } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="border-b border-gray-800/80 glass-panel sticky top-0 z-40">
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

        <div className="flex items-center space-x-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="text-xs font-semibold text-amber-300">Rule-Guided Fashion Intelligence</span>
        </div>
      </div>
    </header>
  );
};
