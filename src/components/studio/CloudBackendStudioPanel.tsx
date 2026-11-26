import React, { useState } from 'react';
import {
  Check,
  Cloud,
  Copy,
  Database,
  Flame,
  KeyRound,
  Loader2,
  Plus,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import type { SiteCloudConfig } from '../../types/builder';

export const DEFAULT_SITE_CLOUD_CONFIG: SiteCloudConfig = {
  firebase: {
    enabled: false,
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    defaultCollection: 'submissions',
    enableFirestore: true,
    enableAuth: true,
    enableStorage: false,
  },
  supabase: {
    enabled: false,
    url: '',
    anonKey: '',
    defaultTable: 'leads',
    enableDatabase: true,
    enableAuth: true,
    enableStorage: false,
  },
};

interface CloudBackendStudioPanelProps {
  lang: 'en' | 'si';
  cloudConfig: SiteCloudConfig;
  onChangeCloudConfig: (next: SiteCloudConfig) => void;
  onAddBackendBlocks: (preset: 'firebase-db' | 'firebase-auth' | 'firebase-form' | 'supabase-db' | 'supabase-auth' | 'supabase-form') => void;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const CloudBackendStudioPanel: React.FC<CloudBackendStudioPanelProps> = ({
  lang,
  cloudConfig,
  onChangeCloudConfig,
  onAddBackendBlocks,
  onToast,
}) => {
  const [providerTab, setProviderTab] = useState<'firebase' | 'supabase'>('firebase');
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [rawPaste, setRawPaste] = useState('');
  const [testing, setTesting] = useState<'firebase' | 'supabase' | null>(null);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const fb = cloudConfig.firebase;
  const sb = cloudConfig.supabase;

  const updateFb = (patch: Partial<SiteCloudConfig['firebase']>) => {
    onChangeCloudConfig({
      ...cloudConfig,
      firebase: { ...fb, ...patch },
    });
  };

  const updateSb = (patch: Partial<SiteCloudConfig['supabase']>) => {
    onChangeCloudConfig({
      ...cloudConfig,
      supabase: { ...sb, ...patch },
    });
  };

  const handleImportFirebaseSnippet = () => {
    const extract = (key: string): string => {
      const rx = new RegExp(`${key}\\s*[:=]\\s*["'\`]([^"'\`]+)["'\`]`, 'i');
      const m = rawPaste.match(rx);
      return m?.[1]?.trim() || '';
    };
    const apiKey = extract('apiKey');
    const authDomain = extract('authDomain');
    const projectId = extract('projectId');
    const storageBucket = extract('storageBucket');
    const messagingSenderId = extract('messagingSenderId');
    const appId = extract('appId');

    if (!apiKey && !projectId) {
      onToast(
        lang === 'si'
          ? 'firebaseConfig එකේ apiKey හෝ projectId හඳුනාගත නොහැක.'
          : 'Could not detect apiKey or projectId in pasted snippet.',
        'error'
      );
      return;
    }

    updateFb({
      enabled: true,
      ...(apiKey ? { apiKey } : {}),
      ...(authDomain ? { authDomain } : {}),
      ...(projectId ? { projectId } : {}),
      ...(storageBucket ? { storageBucket } : {}),
      ...(messagingSenderId ? { messagingSenderId } : {}),
      ...(appId ? { appId } : {}),
    });
    setRawPaste('');
    setShowPasteBox(false);
    onToast(
      lang === 'si'
        ? `Firebase config (${projectId || 'imported'}) site එකට එක් කළා!`
        : `Imported Firebase config (${projectId || 'ready'})!`,
      'success'
    );
  };

  const handleTestFirebase = async () => {
    if (!fb.apiKey.trim() || !fb.projectId.trim()) {
      onToast(
        lang === 'si' ? 'පළමුව API Key සහ Project ID ඇතුළත් කරන්න.' : 'Enter API Key and Project ID first.',
        'error'
      );
      return;
    }
    setTesting('firebase');
    setTestResult(null);
    try {
      const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(
          fb.apiKey.trim()
        )}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: 'check' }),
        }
      );
      const data = (await res.json()) as { error?: { message?: string } };
      const msg = data?.error?.message || '';
      if (msg.includes('API_KEY_INVALID')) {
        setTestResult({ ok: false, msg: 'Invalid Firebase API Key.' });
      } else {
        setTestResult({
          ok: true,
          msg: `Firebase key verified for project "${fb.projectId}".`,
        });
      }
    } catch {
      setTestResult({ ok: false, msg: 'Network check failed.' });
    } finally {
      setTesting(null);
    }
  };

  const handleTestSupabase = async () => {
    const cleanUrl = sb.url.trim().replace(/\/+$/, '');
    if (!cleanUrl || !sb.anonKey.trim()) {
      onToast(
        lang === 'si' ? 'පළමුව Supabase URL සහ Anon Key ඇතුළත් කරන්න.' : 'Enter Supabase URL and Anon Key first.',
        'error'
      );
      return;
    }
    setTesting('supabase');
    setTestResult(null);
    try {
      const res = await fetch(`${cleanUrl}/rest/v1/`, {
        headers: {
          apikey: sb.anonKey.trim(),
          Authorization: `Bearer ${sb.anonKey.trim()}`,
        },
      });
      if (res.ok) {
        setTestResult({ ok: true, msg: 'Supabase REST & Anon Key connected!' });
      } else if (res.status === 401 || res.status === 403) {
        setTestResult({ ok: false, msg: `Supabase rejected key (${res.status}).` });
      } else {
        setTestResult({ ok: true, msg: `Supabase reachable (HTTP ${res.status}).` });
      }
    } catch {
      setTestResult({ ok: false, msg: 'Could not reach Supabase URL.' });
    } finally {
      setTesting(null);
    }
  };

  const handleCopySnippet = () => {
    const code =
      providerTab === 'firebase'
        ? `// Firebase SDK Init for your site
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = ${JSON.stringify(
            {
              apiKey: fb.apiKey || 'YOUR_API_KEY',
              authDomain: fb.authDomain || `${fb.projectId || 'your-app'}.firebaseapp.com`,
              projectId: fb.projectId || 'your-project-id',
              storageBucket: fb.storageBucket || `${fb.projectId || 'your-app'}.firebasestorage.app`,
              messagingSenderId: fb.messagingSenderId || '',
              appId: fb.appId || '',
            },
            null,
            2
          )};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);`
        : `// Supabase Client Init for your site
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = ${JSON.stringify(sb.url || 'https://YOUR_PROJECT.supabase.co')};
const supabaseAnonKey = ${JSON.stringify(sb.anonKey || 'YOUR_SUPABASE_ANON_KEY')};

export const supabase = createClient(supabaseUrl, supabaseAnonKey);`;

    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    onToast(
      lang === 'si' ? 'SDK Setup code copy විය!' : 'Copied SDK setup snippet!',
      'success'
    );
    setTimeout(() => setCopiedCode(false), 1600);
  };

  return (
    <div className="space-y-3 pb-8 text-[11px] select-text">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-1.5">
          <Cloud className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-bold text-white">
            {lang === 'si' ? 'Firebase & Supabase' : 'Firebase & Supabase'}
          </span>
        </div>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-400/25">
          Site Cloud
        </span>
      </div>

      <p className="text-[10px] text-slate-400 leading-relaxed">
        {lang === 'si'
          ? 'ඔබ හදන website එකට Firebase හෝ Supabase සෘජුවම connect කර, Export කරන code එකට සහ canvas blocks වලට එක් කරන්න.'
          : 'Connect Firebase or Supabase to your built website. Auto-injects SDK setup into exported HTML, JS & React code.'}
      </p>

      {/* Provider Switcher */}
      <div className="grid grid-cols-2 gap-1.5 bg-[#101217] p-1 rounded-xl border border-white/10">
        <button
          type="button"
          onClick={() => {
            setProviderTab('firebase');
            setTestResult(null);
          }}
          className={`py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
            providerTab === 'firebase'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
              : 'text-slate-400 hover:text-white border border-transparent'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Firebase</span>
          {fb.enabled && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
        </button>

        <button
          type="button"
          onClick={() => {
            setProviderTab('supabase');
            setTestResult(null);
          }}
          className={`py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
            providerTab === 'supabase'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
              : 'text-slate-400 hover:text-white border border-transparent'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Supabase</span>
          {sb.enabled && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
        </button>
      </div>

      {providerTab === 'firebase' ? (
        <div className="space-y-2.5">
          {/* Enable Toggle */}
          <label className="flex items-center justify-between px-2.5 py-2 rounded-xl bg-[#101217] border border-white/10 cursor-pointer">
            <span className="font-semibold text-slate-200">
              {lang === 'si' ? 'Site එකට Firebase Enable කරන්න' : 'Enable Firebase on Site'}
            </span>
            <input
              type="checkbox"
              checked={fb.enabled}
              onChange={(e) => updateFb({ enabled: e.target.checked })}
              className="w-4 h-4 accent-amber-500 cursor-pointer"
            />
          </label>

          {/* Paste Config Importer */}
          <button
            type="button"
            onClick={() => setShowPasteBox((v) => !v)}
            className="w-full py-1.5 px-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/25 text-amber-200 font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3 h-3" />
            <span>{lang === 'si' ? 'firebaseConfig Paste කර Import කරන්න' : 'Paste firebaseConfig Snippet'}</span>
          </button>

          {showPasteBox && (
            <div className="p-2 rounded-xl bg-[#0D1016] border border-amber-400/30 space-y-1.5">
              <textarea
                rows={4}
                value={rawPaste}
                onChange={(e) => setRawPaste(e.target.value)}
                placeholder={'const firebaseConfig = {\n  apiKey: "...",\n  authDomain: "...",\n  projectId: "..."\n};'}
                className="w-full p-2 rounded-lg bg-[#090B10] border border-white/10 text-[10px] font-mono text-amber-100 outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={handleImportFirebaseSnippet}
                className="w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] cursor-pointer"
              >
                {lang === 'si' ? 'Auto-Fill & Enable' : 'Parse & Auto-Fill'}
              </button>
            </div>
          )}

          {/* Fields */}
          <div className="space-y-1.5 bg-[#101217] p-2.5 rounded-xl border border-white/10">
            <div>
              <span className="text-[10px] text-slate-400 block mb-0.5">Project ID</span>
              <input
                type="text"
                value={fb.projectId}
                onChange={(e) => updateFb({ projectId: e.target.value })}
                placeholder="my-web-app-12345"
                className="w-full px-2 py-1 rounded-lg bg-[#090B10] border border-white/10 text-slate-100 font-mono text-[10px] outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block mb-0.5">Web API Key</span>
              <input
                type="text"
                value={fb.apiKey}
                onChange={(e) => updateFb({ apiKey: e.target.value })}
                placeholder="AIzaSy..."
                className="w-full px-2 py-1 rounded-lg bg-[#090B10] border border-white/10 text-slate-100 font-mono text-[10px] outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block mb-0.5">Auth Domain</span>
              <input
                type="text"
                value={fb.authDomain}
                onChange={(e) => updateFb({ authDomain: e.target.value })}
                placeholder="my-app.firebaseapp.com"
                className="w-full px-2 py-1 rounded-lg bg-[#090B10] border border-white/10 text-slate-100 font-mono text-[10px] outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block mb-0.5">App ID</span>
              <input
                type="text"
                value={fb.appId || ''}
                onChange={(e) => updateFb({ appId: e.target.value })}
                placeholder="1:123456:web:abcdef"
                className="w-full px-2 py-1 rounded-lg bg-[#090B10] border border-white/10 text-slate-100 font-mono text-[10px] outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block mb-0.5">Default Firestore Collection</span>
              <input
                type="text"
                value={fb.defaultCollection || 'submissions'}
                onChange={(e) => updateFb({ defaultCollection: e.target.value })}
                placeholder="submissions"
                className="w-full px-2 py-1 rounded-lg bg-[#090B10] border border-white/10 text-sky-200 font-mono text-[10px] outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center gap-3 pt-1 text-[10px] text-slate-300">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fb.enableFirestore !== false}
                  onChange={(e) => updateFb({ enableFirestore: e.target.checked })}
                  className="accent-amber-500"
                />
                <span>Firestore</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fb.enableAuth !== false}
                  onChange={(e) => updateFb({ enableAuth: e.target.checked })}
                  className="accent-amber-500"
                />
                <span>Auth</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(fb.enableStorage)}
                  onChange={(e) => updateFb({ enableStorage: e.target.checked })}
                  className="accent-amber-500"
                />
                <span>Storage</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={handleTestFirebase}
              disabled={testing === 'firebase'}
              className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-semibold flex items-center justify-center gap-1 cursor-pointer"
            >
              {testing === 'firebase' ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <ShieldCheck className="w-3 h-3 text-amber-400" />
              )}
              <span>Test Key</span>
            </button>
            <button
              type="button"
              onClick={handleCopySnippet}
              className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-semibold flex items-center justify-center gap-1 cursor-pointer"
            >
              {copiedCode ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3 text-sky-400" />
              )}
              <span>{copiedCode ? 'Copied' : 'Copy SDK'}</span>
            </button>
          </div>

          {/* Add to Canvas */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              {lang === 'si' ? 'Canvas එකට Firebase Blocks එක් කරන්න' : 'Add Firebase Blocks to Canvas'}
            </span>
            <button
              type="button"
              onClick={() => onAddBackendBlocks('firebase-db')}
              className="w-full py-1.5 px-2.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-400/30 text-amber-200 font-semibold flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                <span>Firestore Collection Block</span>
              </span>
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onAddBackendBlocks('firebase-auth')}
              className="w-full py-1.5 px-2.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-400/30 text-amber-200 font-semibold flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" />
                <span>Firebase Auth Block</span>
              </span>
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onAddBackendBlocks('firebase-form')}
              className="w-full py-1.5 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" />
                <span>+ Firebase Signup & Save Form</span>
              </span>
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {/* Enable Toggle */}
          <label className="flex items-center justify-between px-2.5 py-2 rounded-xl bg-[#101217] border border-white/10 cursor-pointer">
            <span className="font-semibold text-slate-200">
              {lang === 'si' ? 'Site එකට Supabase Enable කරන්න' : 'Enable Supabase on Site'}
            </span>
            <input
              type="checkbox"
              checked={sb.enabled}
              onChange={(e) => updateSb({ enabled: e.target.checked })}
              className="w-4 h-4 accent-emerald-500 cursor-pointer"
            />
          </label>

          {/* Fields */}
          <div className="space-y-1.5 bg-[#101217] p-2.5 rounded-xl border border-white/10">
            <div>
              <span className="text-[10px] text-slate-400 block mb-0.5">Supabase Project URL</span>
              <input
                type="text"
                value={sb.url}
                onChange={(e) => updateSb({ url: e.target.value })}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-2 py-1 rounded-lg bg-[#090B10] border border-white/10 text-slate-100 font-mono text-[10px] outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block mb-0.5">Anon Public Key</span>
              <input
                type="text"
                value={sb.anonKey}
                onChange={(e) => updateSb({ anonKey: e.target.value })}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                className="w-full px-2 py-1 rounded-lg bg-[#090B10] border border-white/10 text-slate-100 font-mono text-[10px] outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block mb-0.5">Default Postgres Table</span>
              <input
                type="text"
                value={sb.defaultTable || 'leads'}
                onChange={(e) => updateSb({ defaultTable: e.target.value })}
                placeholder="leads"
                className="w-full px-2 py-1 rounded-lg bg-[#090B10] border border-white/10 text-emerald-200 font-mono text-[10px] outline-none focus:border-emerald-400"
              />
            </div>

            <div className="flex items-center gap-3 pt-1 text-[10px] text-slate-300">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sb.enableDatabase !== false}
                  onChange={(e) => updateSb({ enableDatabase: e.target.checked })}
                  className="accent-emerald-500"
                />
                <span>Postgres DB</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sb.enableAuth !== false}
                  onChange={(e) => updateSb({ enableAuth: e.target.checked })}
                  className="accent-emerald-500"
                />
                <span>Auth</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(sb.enableStorage)}
                  onChange={(e) => updateSb({ enableStorage: e.target.checked })}
                  className="accent-emerald-500"
                />
                <span>Storage</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={handleTestSupabase}
              disabled={testing === 'supabase'}
              className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-semibold flex items-center justify-center gap-1 cursor-pointer"
            >
              {testing === 'supabase' ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
              )}
              <span>Test Ping</span>
            </button>
            <button
              type="button"
              onClick={handleCopySnippet}
              className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-semibold flex items-center justify-center gap-1 cursor-pointer"
            >
              {copiedCode ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3 text-sky-400" />
              )}
              <span>{copiedCode ? 'Copied' : 'Copy SDK'}</span>
            </button>
          </div>

          {/* Add to Canvas */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              {lang === 'si' ? 'Canvas එකට Supabase Blocks එක් කරන්න' : 'Add Supabase Blocks to Canvas'}
            </span>
            <button
              type="button"
              onClick={() => onAddBackendBlocks('supabase-db')}
              className="w-full py-1.5 px-2.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-400/30 text-emerald-200 font-semibold flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                <span>Supabase Table Block</span>
              </span>
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onAddBackendBlocks('supabase-auth')}
              className="w-full py-1.5 px-2.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-400/30 text-emerald-200 font-semibold flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" />
                <span>Supabase Auth Block</span>
              </span>
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onAddBackendBlocks('supabase-form')}
              className="w-full py-1.5 px-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>+ Supabase Lead Form & Save</span>
              </span>
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Test Result Banner */}
      {testResult && (
        <div
          className={`p-2 rounded-lg border text-[10px] font-medium ${
            testResult.ok
              ? 'bg-emerald-950/50 border-emerald-400/40 text-emerald-200'
              : 'bg-rose-950/50 border-rose-400/40 text-rose-200'
          }`}
        >
          {testResult.msg}
        </div>
      )}
    </div>
  );
};
