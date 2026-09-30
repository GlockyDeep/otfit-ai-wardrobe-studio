import React, { useEffect, useState } from 'react';
import { Sparkles, Layers, CheckCircle2 } from 'lucide-react';
import { modelPhoto } from '../data/modelPhotos';

const SHOWCASE = [
  modelPhoto('Female', 'Lehenga Choli'), modelPhoto('Male', 'Sherwani'), modelPhoto('Female', 'Banarasi Silk Saree'),
  modelPhoto('Male', 'Tuxedo'), modelPhoto('Female', 'Anarkali Suit'), modelPhoto('Other', 'Co-ord Set'),
].filter(Boolean) as string[];

const STEPS = [
  'Evaluating event formality and cultural heritage...',
  'Filtering compatible fabrics and seasonal materials...',
  'Synthesizing color palette harmonies and motifs...',
  'Crafting your primary outfit ensemble and alternative designs...',
  'Generating styling rationale and accessories checklist...'
];

export const LoadingOverlay: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-16 px-4 text-center">
      <div className="glass-panel rounded-2xl p-8 sm:p-12 border border-amber-500/20 shadow-2xl relative overflow-hidden">
        {/* Animated background glow */}
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Cycling garment illustrations */}
          <div className="relative w-40 aspect-[2/3] mb-6">
            <div className="absolute -inset-1 rounded-[1.7rem] border-t-2 border-r-2 border-amber-400/70 animate-spin [animation-duration:3s]" />
            <div className="absolute inset-0 rounded-3xl overflow-hidden border border-amber-400/20 bg-[#2a2b2f]">
              {SHOWCASE.map((src, i) => (
                <img
                  key={src}
                  src={src}
                  alt=""
                  className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-700 ${i === currentStep % SHOWCASE.length ? 'opacity-100' : 'opacity-0'}`}
                />
              ))}
            </div>
          </div>

          <h3 className="font-serif-fashion text-2xl font-bold bg-gradient-to-r from-amber-200 via-rose-200 to-purple-200 bg-clip-text text-transparent mb-2">
            Designing Your Custom Ensemble
          </h3>
          <p className="text-xs text-gray-400 mb-8 uppercase tracking-widest font-semibold">
            ŌTFIT — AI Wardrobe Studio • In Progress
          </p>

          {/* Design Progress Checklist */}
          <div className="w-full max-w-md space-y-3 text-left">
            {STEPS.map((step, idx) => {
              const isDone = idx < currentStep;
              const isCurrent = idx === currentStep;

              return (
                <div
                  key={idx}
                  className={`flex items-center space-x-3 text-xs sm:text-sm transition-all duration-300 p-2.5 rounded-xl border ${
                    isCurrent
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-200 font-medium'
                      : isDone
                      ? 'bg-gray-900/40 border-gray-800 text-gray-400'
                      : 'opacity-40 border-transparent text-gray-600'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : isCurrent ? (
                    <Sparkles className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
                  ) : (
                    <Layers className="w-4 h-4 text-gray-600 shrink-0" />
                  )}
                  <span className="truncate">{step}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
