import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Camera, Upload, X, RefreshCw, Loader2, Timer, SwitchCamera, Sparkles, ShieldCheck, AlertCircle, ArrowLeft,
} from 'lucide-react';
import type { OutfitDetail } from '../types';
import { TryOnResultPanel } from './TryOnResultPanel';
import { postJson } from '../lib/owner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const MAX_SIDE = 1024;

type Step = 'intro' | 'camera' | 'review' | 'generating' | 'result';

interface Props {
  open: boolean;
  onClose: () => void;
  outfit: OutfitDetail;
  /** The outfit photo shown on the card (AI photo or reference model photo) */
  outfitImageSrc?: string;
}

/** Draw any image source to a JPEG data URI no larger than MAX_SIDE on its longest edge */
function toJpegDataUrl(source: CanvasImageSource, width: number, height: number): string {
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available in this browser');
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.88);
}

async function blobToJpegDataUrl(blob: Blob): Promise<string> {
  const bitmap = await createImageBitmap(blob);
  try {
    return toJpegDataUrl(bitmap, bitmap.width, bitmap.height);
  } finally {
    bitmap.close();
  }
}

function cameraErrorMessage(err: unknown): string {
  const name = err instanceof DOMException ? err.name : '';
  if (name === 'NotAllowedError') return 'Camera permission was blocked. Allow camera access in your browser, or upload a photo instead.';
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'No camera was found on this device. You can upload a photo instead.';
  if (name === 'NotReadableError') return 'The camera is being used by another app. Close it and try again, or upload a photo.';
  if (!window.isSecureContext) return 'The camera only works on https:// or localhost. Upload a photo instead.';
  return 'Could not start the camera. You can upload a photo instead.';
}

export const VirtualTryOn: React.FC<Props> = ({ open, onClose, outfit, outfitImageSrc }) => {
  const [step, setStep] = useState<Step>('intro');
  const [error, setError] = useState<string | null>(null);
  const [personPhoto, setPersonPhoto] = useState<string>('');
  const [resultUrl, setResultUrl] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [canSwitch, setCanSwitch] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const timersRef = useRef<number[]>([]);
  // Try-on images generated in this session; deleted from the server unless the user saves
  const generatedRef = useRef<string[]>([]);
  const savedRef = useRef(false);

  const discardUnsaved = useCallback(() => {
    const urls = generatedRef.current;
    if (urls.length && !savedRef.current) {
      postJson('/tryons/discard', { image_urls: urls }).catch(() => undefined);
    }
    generatedRef.current = [];
    savedRef.current = false;
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  const clearTimers = () => {
    timersRef.current.forEach(id => window.clearTimeout(id));
    timersRef.current = [];
    setCountdown(null);
  };

  const reset = useCallback(() => {
    discardUnsaved();
    stopCamera();
    timersRef.current.forEach(id => window.clearTimeout(id));
    timersRef.current = [];
    setCountdown(null);
    setStep('intro');
    setError(null);
    setPersonPhoto('');
    setResultUrl('');
  }, [stopCamera, discardUnsaved]);

  const close = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  // Always release the camera when the dialog closes or unmounts
  useEffect(() => {
    if (!open) reset();
    return () => stopCamera();
  }, [open, reset, stopCamera]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && step !== 'generating' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, step, close]);

  useEffect(() => {
    if (step !== 'generating') return;
    setElapsed(0);
    const id = window.setInterval(() => setElapsed(s => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [step]);

  // Attach the live stream once the <video> element is on screen
  useEffect(() => {
    const video = videoRef.current;
    if (step !== 'camera' || !video || !streamRef.current) return;
    video.srcObject = streamRef.current;
    video.play().catch(() => undefined);
  }, [step, facingMode]);

  const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
    setError(null);
    stopCamera();
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('This browser does not support camera access. Upload a photo instead.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      setFacingMode(mode);
      setStep('camera');
      const devices = await navigator.mediaDevices.enumerateDevices();
      setCanSwitch(devices.filter(d => d.kind === 'videoinput').length > 1);
    } catch (err) {
      setError(cameraErrorMessage(err));
      setStep('intro');
    }
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setError('The camera is not ready yet. Try again in a moment.');
      return;
    }
    // Save the un-mirrored frame so the photo matches reality
    setPersonPhoto(toJpegDataUrl(video, video.videoWidth, video.videoHeight));
    stopCamera();
    setStep('review');
  };

  const captureWithTimer = () => {
    clearTimers();
    setCountdown(3);
    timersRef.current = [
      window.setTimeout(() => setCountdown(2), 1000),
      window.setTimeout(() => setCountdown(1), 2000),
      window.setTimeout(() => {
        setCountdown(null);
        capture();
      }, 3000),
    ];
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (JPG, PNG or WebP).');
      return;
    }
    try {
      setError(null);
      stopCamera();
      setPersonPhoto(await blobToJpegDataUrl(file));
      setStep('review');
    } catch {
      setError("This image format can't be read by the browser. Try a JPG or PNG.");
    }
  };

  const generate = async () => {
    if (!outfitImageSrc) {
      setError('This outfit has no photo yet. Wait for its photo to finish, then try again.');
      return;
    }
    setStep('generating');
    setError(null);
    try {
      const outfitBlob = await (await fetch(outfitImageSrc)).blob();
      const outfitImage = await blobToJpegDataUrl(outfitBlob);
      const res = await fetch(`${API_BASE_URL}/virtual-try-on`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          person_image: personPhoto,
          outfit_image: outfitImage,
          clothing_type: outfit.clothing_type,
          colors: outfit.colors,
          fabric: outfit.fabric,
          footwear: outfit.footwear,
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || `Try-on failed (${res.status})`);
      const data = await res.json();
      generatedRef.current = [data.image_url];
      savedRef.current = false;
      setResultUrl(data.image_url);
      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Try-on failed');
      setStep('review');
    }
  };


  if (!open) return null;

  const busy = step === 'generating';

  // Portal to <body>: the outfit card uses backdrop-filter, which would otherwise trap this fixed overlay inside the card
  return createPortal(
    <div className="fixed inset-0 z-50 bg-gray-950/90 backdrop-blur-md flex items-stretch sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-label="Virtual try-on">
      <div className="relative w-full sm:max-w-4xl max-h-full sm:max-h-[94vh] overflow-y-auto bg-gray-900 sm:border border-gray-800 sm:rounded-3xl shadow-2xl flex flex-col">
        {/* header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-800 bg-gray-900/95 backdrop-blur">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] font-semibold text-amber-400">
              <Sparkles className="w-3.5 h-3.5" /> Virtual try-on
            </div>
            <h4 className="font-serif-fashion font-bold text-lg text-gray-100 truncate">{outfit.clothing_type}</h4>
          </div>
          <button onClick={close} disabled={busy} className="p-2 rounded-xl text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition cursor-pointer disabled:opacity-40" aria-label="Close virtual try-on">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 grid md:grid-cols-[220px_minmax(0,1fr)] gap-5">
          {/* the outfit being tried on */}
          <div className="hidden md:block">
            <div className="text-[11px] uppercase tracking-[0.14em] text-gray-500 font-semibold mb-2">The look</div>
            <div className="rounded-2xl overflow-hidden bg-[#2a2b2f] aspect-[2/3]">
              {outfitImageSrc && <img src={outfitImageSrc} alt={outfit.clothing_type} className="w-full h-full object-contain" />}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {outfit.colors.map(c => (
                <span key={c} className="text-[10px] text-gray-300 bg-white/5 border border-white/10 rounded-full px-2 py-0.5">{c}</span>
              ))}
            </div>
          </div>

          <div className="min-w-0">
            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* ---------- intro ---------- */}
            {step === 'intro' && (
              <div className="space-y-5">
                <div>
                  <h5 className="text-xl font-semibold text-gray-100">See yourself in this outfit</h5>
                  <p className="text-sm text-gray-400 mt-1">
                    Take a photo or upload one. We'll create a head-to-toe image of you wearing this exact look, with the same garment, colours and shoes.
                  </p>
                </div>
                <ul className="text-sm text-gray-300 space-y-1.5">
                  <li>• Face the camera in good, even light.</li>
                  <li>• A full-body photo works best, but a clear face-and-shoulders photo is enough.</li>
                  <li>• Plain backgrounds and fitted clothing give the most accurate result.</li>
                </ul>
                <div className="grid sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => startCamera('user')}
                    className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-amber-400 via-rose-500 to-fuchsia-600 text-white shadow-lg hover:brightness-110 transition cursor-pointer"
                  >
                    <Camera className="w-4 h-4" /> Use camera
                  </button>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm border border-gray-700 text-gray-200 hover:border-gray-500 transition cursor-pointer"
                  >
                    <Upload className="w-4 h-4" /> Upload a photo
                  </button>
                </div>
                <p className="flex items-start gap-2 text-[11px] text-gray-500 leading-relaxed">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  Your photo is sent to the image AI service (Google Nano Banana via Replicate) only to create this try-on. ŌTFIT doesn't keep your
                  original photo; the finished try-on image is stored on this app's server so you can view and download it.
                </p>
              </div>
            )}

            {/* ---------- live camera ---------- */}
            {step === 'camera' && (
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-[3/4] max-h-[62vh] mx-auto">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : undefined }}
                  />
                  {/* framing guide */}
                  <div className="pointer-events-none absolute inset-x-[22%] top-[6%] bottom-[4%] rounded-[45%_45%_12%_12%/18%_18%_6%_6%] border-2 border-dashed border-white/35" />
                  <span className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 text-[11px] text-white bg-black/50 rounded-full px-3 py-1">
                    Fit yourself inside the outline
                  </span>
                  {countdown !== null && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <span className="text-7xl font-bold text-white drop-shadow-lg">{countdown}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-center gap-3">
                  <button onClick={() => { clearTimers(); reset(); }} className="p-3 rounded-full border border-gray-700 text-gray-300 hover:text-white cursor-pointer" aria-label="Back">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={capture}
                    disabled={countdown !== null}
                    className="w-16 h-16 rounded-full bg-white ring-4 ring-white/30 hover:scale-105 transition cursor-pointer disabled:opacity-50"
                    aria-label="Take photo"
                  />
                  <button onClick={captureWithTimer} disabled={countdown !== null} className="p-3 rounded-full border border-gray-700 text-gray-300 hover:text-white cursor-pointer disabled:opacity-50" aria-label="Take photo in 3 seconds" title="3-second timer: step back for a full-body shot">
                    <Timer className="w-5 h-5" />
                  </button>
                  {canSwitch && (
                    <button onClick={() => startCamera(facingMode === 'user' ? 'environment' : 'user')} className="p-3 rounded-full border border-gray-700 text-gray-300 hover:text-white cursor-pointer" aria-label="Switch camera">
                      <SwitchCamera className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <p className="text-center text-[11px] text-gray-500">Tip: use the timer, step back and let the camera see you from head to toe.</p>
              </div>
            )}

            {/* ---------- review / generating ---------- */}
            {(step === 'review' || step === 'generating') && personPhoto && (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-[3/4] max-h-[58vh] mx-auto">
                  <img src={personPhoto} alt="Your photo" className="w-full h-full object-contain" />
                  {busy && (
                    <div className="absolute inset-0 bg-gray-950/70 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 text-center px-6">
                      <Loader2 className="w-9 h-9 text-amber-300 animate-spin" />
                      <div className="text-amber-100 font-semibold">Dressing you in this look…</div>
                      <div className="text-xs text-gray-300">Usually 15–40 seconds · {elapsed}s</div>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={reset}
                    disabled={busy}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border border-gray-700 text-gray-200 hover:border-gray-500 transition cursor-pointer disabled:opacity-40"
                  >
                    <RefreshCw className="w-4 h-4" /> Retake
                  </button>
                  <button
                    onClick={generate}
                    disabled={busy}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-amber-400 via-rose-500 to-fuchsia-600 text-white shadow-lg hover:brightness-110 transition cursor-pointer disabled:opacity-60"
                  >
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {busy ? 'Generating…' : 'Try it on'}
                  </button>
                </div>
              </div>
            )}

            {/* ---------- result: pattern designer + save / don't save ---------- */}
            {step === 'result' && resultUrl && (
              <TryOnResultPanel
                outfit={outfit}
                personPhoto={personPhoto}
                initialUrl={resultUrl}
                onGenerated={url => { generatedRef.current.push(url); savedRef.current = false; }}
                onSaved={() => { savedRef.current = true; }}
                onDiscard={close}
                onRetake={reset}
              />
            )}

            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFile} />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
