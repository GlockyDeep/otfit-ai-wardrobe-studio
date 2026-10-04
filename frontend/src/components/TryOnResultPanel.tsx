import React, { useState } from 'react';
import { Download, Loader2, Camera, Check, Lock, Users, Trash2, Wand2, RotateCcw, AlertCircle } from 'lucide-react';
import type { OutfitDetail } from '../types';
import { getOwnerId, postJson } from '../lib/owner';

/** Fabric patterns the user can apply to their try-on (names must match backend community.PATTERNS) */
const PATTERNS: { name: string; swatch: React.CSSProperties }[] = [
  { name: 'Paisley', swatch: { background: 'radial-gradient(ellipse 3px 5px at 40% 45%,#f0d27a 90%,transparent) 0 0/10px 12px,radial-gradient(circle,#f0d27a 1px,transparent 1.5px) 5px 6px/10px 12px,#7a1330' } },
  { name: 'Floral', swatch: { background: 'radial-gradient(circle,#f9a8d4 2px,transparent 3px) 0 0/9px 9px,radial-gradient(circle,#fde68a 1.5px,transparent 2px) 4px 4px/9px 9px,#1f5135' } },
  { name: 'Geometric', swatch: { background: 'conic-gradient(#1f4fb8 25%,#e3d3ae 0 50%,#1f4fb8 0 75%,#e3d3ae 0) 0 0/10px 10px' } },
  { name: 'Stripes', swatch: { background: 'repeating-linear-gradient(90deg,#33363b 0 4px,#efe3c6 4px 7px)' } },
  { name: 'Checks', swatch: { background: 'repeating-linear-gradient(0deg,rgba(176,20,44,.6) 0 3px,transparent 3px 8px),repeating-linear-gradient(90deg,rgba(176,20,44,.6) 0 3px,transparent 3px 8px),#f4ecd8' } },
  { name: 'Polka dots', swatch: { background: 'radial-gradient(circle,#fafafa 2px,transparent 2.5px) 0 0/8px 8px,#15151a' } },
  { name: 'Bandhani', swatch: { background: 'radial-gradient(circle,#fff 1.3px,transparent 1.8px) 0 0/5px 5px,#c2185b' } },
  { name: 'Leheriya', swatch: { background: 'repeating-linear-gradient(45deg,#eac435 0 3px,#0f766e 3px 6px)' } },
  { name: 'Ikat', swatch: { background: 'repeating-linear-gradient(90deg,#1e2a5a 0 5px,#f4ecd8 5px 7px,#9b111e 7px 10px)', filter: 'blur(.4px)' } },
  { name: 'Block print', swatch: { background: 'radial-gradient(circle,#b0521f 2px,transparent 2.6px) 0 0/7px 7px,radial-gradient(circle,#1e2a5a 1px,transparent 1.5px) 3px 3px/7px 7px,#efe3c6' } },
  { name: 'Brocade', swatch: { background: 'repeating-linear-gradient(45deg,#d4a73a 0 2px,#8a6420 2px 4px),#6d1a36', backgroundBlendMode: 'overlay' } },
  { name: 'Chikankari', swatch: { background: 'radial-gradient(circle,#fff 1px,transparent 1.5px) 0 0/4px 4px,#e8e4da' } },
  { name: 'Mirror work', swatch: { background: 'radial-gradient(circle,#e5e7eb 2px,#9ca3af 2.5px,transparent 3px) 0 0/9px 9px,#7b4fa0' } },
];

interface Props {
  outfit: OutfitDetail;
  personPhoto: string;
  /** The first try-on image */
  initialUrl: string;
  onGenerated: (url: string) => void;
  onSaved: () => void;
  onDiscard: () => void;
  onRetake: () => void;
}

type SaveMode = 'private' | 'shared';

export const TryOnResultPanel: React.FC<Props> = ({ outfit, personPhoto, initialUrl, onGenerated, onSaved, onDiscard, onRetake }) => {
  const [versions, setVersions] = useState<{ pattern: string; url: string }[]>([{ pattern: 'Original', url: initialUrl }]);
  const [current, setCurrent] = useState(0);
  const [busyPattern, setBusyPattern] = useState<string | null>(null);
  const [patternError, setPatternError] = useState<string | null>(null);

  const [saveMode, setSaveMode] = useState<SaveMode>('private');
  const [displayName, setDisplayName] = useState('');
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAs, setSavedAs] = useState<SaveMode | null>(null);

  const shown = versions[current];

  const applyPattern = async (pattern: string) => {
    const existing = versions.findIndex(v => v.pattern === pattern);
    if (existing >= 0) {
      setCurrent(existing);
      return;
    }
    setBusyPattern(pattern);
    setPatternError(null);
    try {
      const data = await postJson<{ image_url: string }>('/tryon-pattern', { image_url: initialUrl, pattern, colors: outfit.colors });
      onGenerated(data.image_url);
      setVersions(v => [...v, { pattern, url: data.image_url }]);
      setCurrent(versions.length);
      setSavedAs(null);
    } catch (e) {
      setPatternError(e instanceof Error ? e.message : 'Pattern failed');
    } finally {
      setBusyPattern(null);
    }
  };

  const save = async () => {
    if (saveMode === 'shared' && !consent) {
      setSaveError('Tick the box to confirm you agree to share this photo.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await postJson('/tryons', {
        image_url: shown.url,
        owner_id: getOwnerId(),
        shared: saveMode === 'shared',
        consent,
        display_name: displayName.trim(),
        clothing_type: outfit.clothing_type,
        colors: outfit.colors,
        pattern: shown.pattern === 'Original' ? '' : shown.pattern,
      });
      setSavedAs(saveMode);
      onSaved();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const download = async () => {
    try {
      const blob = await (await fetch(shown.url)).blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `otfit-try-on-${shown.pattern.toLowerCase().replace(/\s+/g, '-')}.webp`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(shown.url, '_blank', 'noopener');
    }
  };

  return (
    <div className="space-y-5">
      {/* before / after */}
      <div className="grid grid-cols-2 gap-3">
        <figure>
          <figcaption className="text-[11px] uppercase tracking-[0.14em] text-gray-500 font-semibold mb-2">Your photo</figcaption>
          <div className="rounded-2xl overflow-hidden bg-black aspect-[2/3]">
            <img src={personPhoto} alt="Your photo" className="w-full h-full object-contain" />
          </div>
        </figure>
        <figure>
          <figcaption className="text-[11px] uppercase tracking-[0.14em] text-amber-400 font-semibold mb-2 truncate">
            You in this look{shown.pattern !== 'Original' ? ` · ${shown.pattern}` : ''}
          </figcaption>
          <div className="relative rounded-2xl overflow-hidden bg-[#2a2b2f] aspect-[2/3] ring-2 ring-amber-400/40">
            <img src={shown.url} alt={`You wearing ${outfit.clothing_type}`} className="w-full h-full object-contain" />
            {busyPattern && (
              <div className="absolute inset-0 bg-gray-950/65 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 text-center px-4">
                <Loader2 className="w-7 h-7 text-amber-300 animate-spin" />
                <span className="text-amber-100 text-sm font-semibold">Weaving {busyPattern}…</span>
                <span className="text-[11px] text-gray-300">About 15–30 seconds</span>
              </div>
            )}
          </div>
        </figure>
      </div>

      {/* pattern designer */}
      <section className="rounded-2xl border border-white/10 bg-gray-950/40 p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h5 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-fuchsia-300" /> Design the fabric pattern
          </h5>
          {current !== 0 && (
            <button onClick={() => setCurrent(0)} className="text-[11px] text-gray-400 hover:text-white flex items-center gap-1 cursor-pointer">
              <RotateCcw className="w-3 h-3" /> Original
            </button>
          )}
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {PATTERNS.map(({ name, swatch }) => {
            const done = versions.some(v => v.pattern === name);
            const active = shown.pattern === name;
            return (
              <button
                key={name}
                type="button"
                onClick={() => applyPattern(name)}
                disabled={!!busyPattern}
                className={`relative flex flex-col items-center gap-1.5 rounded-xl border p-2 text-[11px] transition cursor-pointer disabled:opacity-50 ${
                  active ? 'border-fuchsia-400 bg-fuchsia-500/15 text-fuchsia-100' : 'border-gray-800 text-gray-300 hover:border-gray-600'
                }`}
              >
                <span className="w-full h-8 rounded-md ring-1 ring-white/10" style={swatch} />
                {name}
                {done && !active && <Check className="absolute top-1 right-1 w-3 h-3 text-emerald-300" />}
              </button>
            );
          })}
        </div>
        {versions.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {versions.map((v, i) => (
              <button key={v.url} onClick={() => setCurrent(i)} className={`shrink-0 w-12 rounded-lg overflow-hidden border-2 cursor-pointer ${i === current ? 'border-amber-400' : 'border-transparent opacity-70'}`} title={v.pattern}>
                <img src={v.url} alt={v.pattern} className="w-full aspect-[2/3] object-cover object-top" />
              </button>
            ))}
          </div>
        )}
        {patternError && <p className="mt-2 text-xs text-rose-300 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{patternError}</p>}
        <p className="mt-2 text-[11px] text-gray-500">Keeps you, the cut and the colours; only the fabric design changes.</p>
      </section>

      {/* save / don't save */}
      <section className="rounded-2xl border border-white/10 bg-gray-950/40 p-4 space-y-3">
        {savedAs ? (
          <div className="flex items-start gap-3">
            <span className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0"><Check className="w-4 h-4" /></span>
            <div className="text-sm">
              <div className="text-gray-100 font-semibold">{savedAs === 'shared' ? 'Saved and shared on What Others' : 'Saved to My looks'}</div>
              <div className="text-gray-400 text-xs mt-0.5">Open <strong>What Others</strong> in the top bar to see it any time.</div>
            </div>
          </div>
        ) : (
          <>
            <h5 className="text-sm font-semibold text-gray-100">Keep this try-on?</h5>
            <div className="grid sm:grid-cols-2 gap-2">
              {([
                { mode: 'private', icon: Lock, title: 'Save to My looks', hint: 'Only visible in this browser' },
                { mode: 'shared', icon: Users, title: 'Save & share', hint: 'Show it to others on What Others' },
              ] as const).map(({ mode, icon: Icon, title, hint }) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSaveMode(mode)}
                  className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition cursor-pointer ${
                    saveMode === mode ? 'border-amber-400 bg-amber-400/10' : 'border-gray-800 hover:border-gray-600'
                  }`}
                >
                  <Icon className={`w-4 h-4 mt-0.5 ${saveMode === mode ? 'text-amber-300' : 'text-gray-400'}`} />
                  <span>
                    <span className="block text-sm font-semibold text-gray-100">{title}</span>
                    <span className="block text-[11px] text-gray-400">{hint}</span>
                  </span>
                </button>
              ))}
            </div>
            {saveMode === 'shared' && (
              <div className="space-y-2">
                <input
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value.slice(0, 30))}
                  placeholder="Name to show (optional, e.g. Priya)"
                  className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-amber-400/70"
                />
                <label className="flex items-start gap-2 text-xs text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-0.5 accent-amber-400" />
                  I agree that this photo of me will be visible to anyone using this ŌTFIT app. I can delete it later from My looks.
                </label>
              </div>
            )}
            {saveError && <p className="text-xs text-rose-300 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{saveError}</p>}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={save}
                disabled={saving || !!busyPattern}
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-amber-400 via-rose-500 to-fuchsia-600 text-white shadow-lg hover:brightness-110 transition cursor-pointer disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {saveMode === 'shared' ? 'Save & share' : 'Save'}
              </button>
              <button
                onClick={onDiscard}
                disabled={saving}
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border border-gray-700 text-gray-200 hover:border-rose-400/60 hover:text-rose-200 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Don't save
              </button>
            </div>
            <p className="text-[11px] text-gray-500">"Don't save" deletes these try-on images from the server.</p>
          </>
        )}
      </section>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={download} className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border border-gray-700 text-gray-200 hover:border-gray-500 transition cursor-pointer">
          <Download className="w-4 h-4" /> Download
        </button>
        <button onClick={onRetake} className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border border-gray-700 text-gray-200 hover:border-gray-500 transition cursor-pointer">
          <Camera className="w-4 h-4" /> Try another photo
        </button>
      </div>
      <p className="text-[11px] text-gray-500">AI-generated preview. Fit and drape on your real body may differ slightly.</p>
    </div>
  );
};
