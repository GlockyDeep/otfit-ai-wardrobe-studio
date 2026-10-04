import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Users, Lock, Sparkles, TrendingUp, ScanFace, Trash2, X, Loader2, ImageOff } from 'lucide-react';
import type { OutfitDetail } from '../types';
import { API_BASE_URL, getOwnerId } from '../lib/owner';
import { colorNameToHex } from '../lib/colors';
import { VirtualTryOn } from './VirtualTryOn';

interface Trend {
  id: string;
  title: string;
  gender: string;
  garment: string;
  colors: string[];
  season: string;
  why: string;
  outfit: string;
  image: string;
}

interface SavedLook {
  id: string;
  image_url: string;
  shared: boolean;
  display_name: string;
  clothing_type: string;
  colors: string[];
  pattern: string;
  created_at: number;
  mine: boolean;
}

type Tab = 'trends' | 'shared' | 'mine';

const trendToOutfit = (t: Trend): OutfitDetail => ({
  clothing_type: t.title,
  silhouette: t.outfit,
  colors: t.colors,
  fabric: '',
  embroidery_or_pattern: '',
  accessories: [],
  footwear: '',
  hairstyle: '',
  makeup: '',
  styling_tips: [],
  rationale: t.why,
});

const timeAgo = (ts: number) => {
  const s = Math.max(1, Math.floor(Date.now() / 1000 - ts));
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
};

export const CommunityPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [tab, setTab] = useState<Tab>('trends');
  const [trends, setTrends] = useState<Trend[]>([]);
  const [looks, setLooks] = useState<SavedLook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<SavedLook | null>(null);
  const [tryTrend, setTryTrend] = useState<Trend | null>(null);

  const load = useCallback(async (which: Tab) => {
    setLoading(true);
    setError(null);
    try {
      if (which === 'trends') {
        const res = await fetch(`${API_BASE_URL}/trends`);
        if (!res.ok) throw new Error();
        setTrends(await res.json());
      } else {
        const res = await fetch(`${API_BASE_URL}/tryons?scope=${which}&owner_id=${encodeURIComponent(getOwnerId())}`);
        if (!res.ok) throw new Error();
        setLooks(await res.json());
      }
    } catch {
      setError('Could not reach the ŌTFIT server. Make sure the backend is running on port 8000.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(tab);
  }, [tab, load]);

  const remove = async (look: SavedLook) => {
    if (!window.confirm('Delete this saved try-on? This removes the photo from the server.')) return;
    const res = await fetch(`${API_BASE_URL}/tryons/${look.id}?owner_id=${encodeURIComponent(getOwnerId())}`, { method: 'DELETE' });
    if (res.ok) {
      setLooks(l => l.filter(x => x.id !== look.id));
      setPreview(null);
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType; hint: string }[] = [
    { id: 'trends', label: 'AI trends', icon: TrendingUp, hint: 'Looks trending this season, generated with AI. Try any of them on yourself.' },
    { id: 'shared', label: 'Community', icon: Users, hint: 'Try-ons people chose to share from this app.' },
    { id: 'mine', label: 'My looks', icon: Lock, hint: 'Try-ons you saved in this browser, private or shared.' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-400 hover:text-amber-300 transition cursor-pointer mb-3">
            <ArrowLeft className="w-4 h-4" /> Back to the studio
          </button>
          <h2 className="font-serif-fashion text-3xl sm:text-4xl font-bold text-gray-50">What others are wearing</h2>
          <p className="text-sm text-gray-400 mt-1">Trends, shared try-ons and your own saved looks.</p>
        </div>
        <div className="flex gap-2 p-1 rounded-2xl bg-gray-950/60 border border-white/10 self-start">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
                tab === id ? 'bg-amber-400 text-gray-950' : 'text-gray-300 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-500 -mt-4">{tabs.find(t => t.id === tab)?.hint}</p>

      {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-400"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
      )}

      {/* ---------- AI trends ---------- */}
      {tab === 'trends' && !loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {trends.map(t => (
            <article key={t.id} className="glass-card rounded-2xl overflow-hidden flex flex-col">
              <div className="relative bg-[#2a2b2f] aspect-[2/3]">
                <img src={t.image} alt={t.title} loading="lazy" className="w-full h-full object-contain" />
                <span className="absolute top-3 left-3 text-[10px] uppercase tracking-wider font-bold bg-gray-950/75 text-amber-300 border border-amber-400/30 rounded-full px-2.5 py-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI trend
                </span>
              </div>
              <div className="p-4 flex-1 flex flex-col gap-2">
                <div className="text-[11px] text-gray-500">{t.season} · {t.gender}</div>
                <h3 className="font-serif-fashion text-lg font-bold text-gray-100 leading-tight">{t.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed flex-1">{t.why}</p>
                <div className="flex gap-1">
                  {t.colors.map(c => <span key={c} title={c} className="w-5 h-5 rounded-full ring-1 ring-white/15" style={{ background: colorNameToHex(c) }} />)}
                </div>
                <button
                  onClick={() => setTryTrend(t)}
                  className="mt-1 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-amber-400 via-rose-500 to-fuchsia-600 text-white shadow-lg hover:brightness-110 transition cursor-pointer"
                >
                  <ScanFace className="w-4 h-4" /> Try this on
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ---------- community / my looks ---------- */}
      {tab !== 'trends' && !loading && !error && (
        looks.length === 0 ? (
          <div className="glass-panel rounded-2xl p-10 text-center space-y-2">
            <ImageOff className="w-8 h-8 text-gray-500 mx-auto" />
            <div className="text-gray-200 font-semibold">{tab === 'mine' ? "You haven't saved any try-ons yet" : 'No shared looks yet'}</div>
            <p className="text-sm text-gray-500">
              Generate an outfit, use <strong>Virtual Try-On</strong>, then choose <strong>{tab === 'mine' ? 'Save' : 'Save & share'}</strong>.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {looks.map(l => (
              <button key={l.id} onClick={() => setPreview(l)} className="group glass-card rounded-2xl overflow-hidden text-left cursor-pointer">
                <div className="relative bg-[#2a2b2f] aspect-[2/3]">
                  <img src={l.image_url} alt={l.clothing_type} loading="lazy" className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.03]" />
                  {tab === 'mine' && (
                    <span className="absolute top-2 left-2 text-[10px] font-bold rounded-full px-2 py-0.5 bg-gray-950/75 border border-white/10 text-gray-200 flex items-center gap-1">
                      {l.shared ? <><Users className="w-3 h-3" /> Shared</> : <><Lock className="w-3 h-3" /> Private</>}
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <div className="text-xs font-semibold text-gray-100 line-clamp-2">{l.clothing_type || 'Try-on'}</div>
                  <div className="text-[11px] text-gray-500 mt-1 truncate">
                    {l.pattern ? `${l.pattern} · ` : ''}{tab === 'shared' ? `${l.display_name} · ` : ''}{timeAgo(l.created_at)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )
      )}

      {/* ---------- preview ---------- */}
      {preview && createPortal(
        <div className="fixed inset-0 z-50 bg-gray-950/90 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreview(null)} className="absolute top-3 right-3 z-10 p-2 rounded-xl bg-gray-950/70 text-gray-300 hover:text-white cursor-pointer" aria-label="Close preview">
              <X className="w-5 h-5" />
            </button>
            <div className="bg-[#2a2b2f] aspect-[2/3] max-h-[70vh] mx-auto">
              <img src={preview.image_url} alt={preview.clothing_type} className="w-full h-full object-contain" />
            </div>
            <div className="p-4 space-y-2">
              <div className="font-serif-fashion text-lg font-bold text-gray-100">{preview.clothing_type}</div>
              <div className="text-xs text-gray-400">
                {preview.pattern ? `${preview.pattern} pattern · ` : ''}{preview.shared ? `Shared by ${preview.display_name}` : 'Private'} · {timeAgo(preview.created_at)}
              </div>
              <div className="flex gap-1">
                {preview.colors.map(c => <span key={c} title={c} className="w-5 h-5 rounded-full ring-1 ring-white/15" style={{ background: colorNameToHex(c) }} />)}
              </div>
              {preview.mine && (
                <button onClick={() => remove(preview)} className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border border-rose-500/40 text-rose-200 hover:bg-rose-500/10 transition cursor-pointer">
                  <Trash2 className="w-4 h-4" /> Delete this look
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}

      {tryTrend && (
        <VirtualTryOn
          open
          onClose={() => {
            setTryTrend(null);
            if (tab === 'mine') load('mine');
          }}
          outfit={trendToOutfit(tryTrend)}
          outfitImageSrc={tryTrend.image}
        />
      )}
    </div>
  );
};
