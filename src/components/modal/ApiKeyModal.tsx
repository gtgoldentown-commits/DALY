/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Key, CheckCircle, AlertCircle, RefreshCw, ExternalLink, ShieldCheck } from 'lucide-react';
import { getActiveTmdbKey, setActiveTmdbKey } from '../../services/tmdb.service.ts';

interface ApiKeyModalProps {
  onClose: () => void;
  onKeyUpdated: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onClose, onKeyUpdated }) => {
  const [apiKeyInput, setApiKeyInput] = useState(getActiveTmdbKey());
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  const handleTestConnection = async () => {
    setTestStatus('testing');
    try {
      const res = await fetch(`https://api.themoviedb.org/3/configuration?api_key=${apiKeyInput.trim()}`);
      if (res.ok) {
        setTestStatus('success');
        setTestMessage('Connection successful! Verified valid TMDB metadata API key.');
      } else {
        const data = await res.json().catch(() => ({}));
        setTestStatus('error');
        setTestMessage(`Validation failed: ${data.status_message || 'Invalid API Key'}`);
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(`Network or CORS error: ${err.message}`);
    }
  };

  const handleSave = () => {
    setActiveTmdbKey(apiKeyInput.trim());
    onKeyUpdated();
    onClose();
  };

  const handleReset = () => {
    localStorage.removeItem('teatro_custom_tmdb_key');
    const defaultKey = getActiveTmdbKey();
    setApiKeyInput(defaultKey);
    onKeyUpdated();
    setTestStatus('idle');
    setTestMessage('Reset to verified default key.');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#111111] border border-[#292929] rounded-2xl overflow-hidden shadow-2xl p-6 sm:p-8 my-auto text-white animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-[#181818] hover:bg-[#E50914] text-white border border-[#292929] transition-colors"
          aria-label="Close API Key Modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-[#E50914]/20 border border-[#E50914]/40 rounded-xl text-[#E50914]">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-white">
              TMDB Metadata Engine
            </h2>
            <p className="text-xs text-[#777777]">
              Configure your real movie & television metadata connection
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-[#B3B3B3] font-semibold mb-1.5 uppercase tracking-wider text-[11px]">
              Active TMDB API Key (v3)
            </label>
            <input
              type="text"
              value={apiKeyInput}
              onChange={(e) => {
                setApiKeyInput(e.target.value);
                setTestStatus('idle');
              }}
              placeholder="Enter your 32-character TMDB API Key..."
              className="w-full px-3.5 py-2.5 bg-[#181818] border border-[#292929] rounded-lg text-white font-mono text-xs focus:outline-none focus:border-[#E50914] transition-colors"
            />
          </div>

          {/* Test Status feedback */}
          {testStatus === 'testing' && (
            <div className="flex items-center gap-2 text-xs text-[#B3B3B3]">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#E50914]" />
              <span>Pinging The Movie Database API...</span>
            </div>
          )}

          {testStatus === 'success' && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-lg flex items-start gap-2.5 text-emerald-300">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{testMessage}</span>
            </div>
          )}

          {testStatus === 'error' && (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-lg flex items-start gap-2.5 text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{testMessage}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleTestConnection}
              className="px-4 py-2 bg-[#181818] hover:bg-[#222222] border border-[#292929] hover:border-[#555] rounded-lg text-white font-semibold transition-colors"
            >
              Test Live Connection
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 text-[#777777] hover:text-white transition-colors"
            >
              Reset to Default Key
            </button>
          </div>

          <div className="p-4 bg-[#181818]/60 border border-[#292929] rounded-xl space-y-2 text-[#B3B3B3] leading-relaxed">
            <div className="flex items-center gap-2 text-white font-semibold text-xs">
              <ShieldCheck className="w-4 h-4 text-[#4ade80]" />
              <span>Getting your own free TMDB API Key:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-[#A3A3A3]">
              <li>Create a free account on <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer" className="text-[#E50914] underline">themoviedb.org</a>.</li>
              <li>Go to <strong>Settings → API</strong> and click <strong>Create</strong> (choose Developer).</li>
              <li>Copy your 32-character API Key into the field above or set <code>VITE_TMDB_API_KEY</code> in <code>.env</code>.</li>
            </ol>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 py-2.5 bg-[#E50914] hover:bg-[#b80710] text-white font-bold rounded-lg shadow-lg transition-transform hover:scale-[1.01]"
            >
              Save & Apply Key
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-[#181818] border border-[#292929] text-[#B3B3B3] hover:text-white rounded-lg font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
