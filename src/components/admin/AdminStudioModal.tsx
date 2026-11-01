/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  SlidersHorizontal,
  Film,
  Activity,
  HardDrive,
  Users,
  Bookmark,
  RotateCcw,
  ShieldCheck,
  Video,
  Key
} from 'lucide-react';
import { MediaTitle, MediaType } from '../../types/index.ts';
import { registerAuthorizedStream } from '../../services/streamingProvider.service.ts';

interface AdminStudioModalProps {
  catalog: MediaTitle[];
  onAddTitle: (title: MediaTitle) => void;
  onDeleteTitle: (id: string) => void;
  onResetCatalog: () => void;
  onClose: () => void;
}

export const AdminStudioModal: React.FC<AdminStudioModalProps> = ({
  catalog,
  onAddTitle,
  onDeleteTitle,
  onResetCatalog,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'add' | 'rights' | 'telemetry'>('catalog');

  // Rights authorization form
  const [targetTitleId, setTargetTitleId] = useState(catalog[0]?.id || '');
  const [authStreamUrl, setAuthStreamUrl] = useState('');
  const [authStreamFormat, setAuthStreamFormat] = useState<'mp4' | 'hls'>('mp4');
  const [authLicenseText, setAuthLicenseText] = useState('Authorized Commercial Streaming License (Direct Ingest)');
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');

  // Form State for new title
  const [newTitle, setNewTitle] = useState<Partial<MediaTitle>>({
    title: '',
    originalTitle: '',
    type: 'movie',
    year: 2024,
    maturityRating: 'PG-13',
    duration: '110m',
    genres: ['Drama', 'Cinema'],
    country: 'International',
    language: 'English',
    rating: 8.5,
    ratingCount: 1200,
    backdrop: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1920&q=80',
    poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
    synopsis: '',
    director: '',
    cast: [],
    streamUrl: 'https://archive.org/download/Tears-of-Steel/tears_of_steel_1080p.mp4',
    isAuthorizedStream: true,
    licenseRights: 'CC-BY 3.0 / Admin Ingest Verified',
    quality: '4K UHD',
    categories: ['trending', 'popular']
  });

  const [castInput, setCastInput] = useState('');
  const [genresInput, setGenresInput] = useState('Drama, Sci-Fi');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.title || !newTitle.synopsis || !newTitle.director) {
      alert('Please fill out the title, director, and synopsis.');
      return;
    }

    const castList = castInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const genreList = genresInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const completeTitle: MediaTitle = {
      id: `custom_${Date.now()}`,
      title: newTitle.title!,
      originalTitle: newTitle.originalTitle || newTitle.title,
      type: (newTitle.type as MediaType) || 'movie',
      categories: newTitle.categories || ['trending'],
      year: newTitle.year || 2024,
      maturityRating: newTitle.maturityRating || 'PG-13',
      duration: newTitle.duration || '90m',
      genres: genreList.length > 0 ? genreList : ['Cinema'],
      country: newTitle.country || 'International',
      language: newTitle.language || 'English',
      rating: newTitle.rating || 8.5,
      ratingCount: newTitle.ratingCount || 1000,
      backdrop:
        newTitle.backdrop ||
        'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1920&q=80',
      poster:
        newTitle.poster ||
        'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
      synopsis: newTitle.synopsis!,
      director: newTitle.director!,
      cast: castList.length > 0 ? castList : ['Cast Ensemble'],
      streamUrl: newTitle.streamUrl,
      isAuthorizedStream: Boolean(newTitle.streamUrl),
      licenseRights: newTitle.licenseRights || 'CC-BY Verified Master Ingest',
      quality: newTitle.quality || '4K UHD',
      audioTracks: ['Original 5.1 Surround', 'Stereo'],
      subtitles: [{ code: 'en', label: 'English [CC]' }]
    };

    onAddTitle(completeTitle);
    setActiveTab('catalog');
    alert(`Successfully added "${completeTitle.title}" to TEATRO master catalog!`);
  };

  const handleAuthorizeStream = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTitleId || !authStreamUrl) return;

    registerAuthorizedStream(targetTitleId, authStreamUrl.trim(), authStreamFormat, authLicenseText.trim());
    setAuthSuccessMsg(`Stream rights successfully mapped for title ID: ${targetTitleId}`);
    setTimeout(() => setAuthSuccessMsg(''), 4000);
    setAuthStreamUrl('');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-[#111111] border border-[#292929] rounded-2xl overflow-hidden shadow-2xl p-6 sm:p-8 my-auto text-white animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-[#292929]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#E50914]/20 border border-[#E50914]/40 rounded-lg text-[#E50914]">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-white">
                Content Management & Rights Studio
              </h2>
              <p className="text-xs text-[#777777]">
                Ingest media assets, map authorized playback streams, and monitor telemetry.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-[#181818] hover:bg-[#E50914] text-white rounded-full transition-colors"
            aria-label="Close Admin Studio"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 mt-6 mb-6 border-b border-[#292929] pb-3 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'catalog'
                ? 'bg-[#E50914] text-white'
                : 'text-[#B3B3B3] hover:text-white bg-[#181818]'
            }`}
          >
            Manage Catalog ({catalog.length})
          </button>
          <button
            onClick={() => setActiveTab('rights')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'rights'
                ? 'bg-[#E50914] text-white'
                : 'text-[#B3B3B3] hover:text-white bg-[#181818]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#4ade80]" />
            <span>Map Authorized Streams</span>
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'add'
                ? 'bg-[#E50914] text-white'
                : 'text-[#B3B3B3] hover:text-white bg-[#181818]'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ingest Media Master</span>
          </button>
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'telemetry'
                ? 'bg-[#E50914] text-white'
                : 'text-[#B3B3B3] hover:text-white bg-[#181818]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Telemetry & Platform</span>
          </button>
        </div>

        {/* TAB 1: CATALOG LIST VIEW */}
        {activeTab === 'catalog' && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#777777]">
                Live in-memory & persistent catalog
              </span>
              <button
                onClick={() => {
                  if (confirm('Reset catalog to the verified default masters?')) {
                    onResetCatalog();
                  }
                }}
                className="text-xs text-[#E50914] hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restore Default Catalog</span>
              </button>
            </div>

            <div className="space-y-2">
              {catalog.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-[#181818] border border-[#292929] rounded-lg flex items-center justify-between gap-4 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.poster}
                      alt={item.title}
                      className="w-10 h-14 object-cover rounded bg-black shrink-0"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                    <div className="min-w-0">
                      <h4 className="font-bold text-white text-sm truncate">
                        {item.title}
                      </h4>
                      <p className="text-[#777777] truncate">
                        {item.year} • {item.type.replace('_', ' ')} • Dir:{' '}
                        {item.director}
                      </p>
                      <p className="text-[11px] text-[#A3A3A3] truncate mt-0.5">
                        Stream: {item.streamUrl ? 'Authorized Live Master' : 'Metadata Only (Trailer)'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-0.5 bg-[#252525] rounded text-[10px] text-[#B3B3B3]">
                      ★ {item.rating}
                    </span>
                    <button
                      onClick={() => {
                        if (confirm(`Remove "${item.title}" from catalog?`)) {
                          onDeleteTitle(item.id);
                        }
                      }}
                      className="p-2 text-[#777777] hover:text-[#E50914] transition-colors rounded"
                      title="Delete title"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: MAP AUTHORIZED PLAYBACK RIGHTS */}
        {activeTab === 'rights' && (
          <form
            onSubmit={handleAuthorizeStream}
            className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 text-xs"
          >
            <div className="p-4 bg-[#181818]/60 border border-[#292929] rounded-xl space-y-2 text-[#B3B3B3]">
              <div className="flex items-center gap-2 text-white font-semibold text-xs">
                <ShieldCheck className="w-4 h-4 text-[#4ade80]" />
                <span>Authorized Playback Integration Rule:</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Connect licensed video sources (e.g. your proprietary CDN, AWS Elemental, Wowza HLS
                manifests, or public domain masters) to any TMDB title. Only titles with explicitly
                registered streams will activate the "Stream Now" theater player.
              </p>
            </div>

            {authSuccessMsg && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-emerald-300">
                {authSuccessMsg}
              </div>
            )}

            <div>
              <label className="block text-[#777777] uppercase font-bold mb-1">
                Select Catalog Title to Authorize *
              </label>
              <select
                value={targetTitleId}
                onChange={(e) => setTargetTitleId(e.target.value)}
                className="w-full px-3 py-2 bg-[#181818] border border-[#292929] rounded text-white focus:outline-none focus:border-[#E50914] cursor-pointer"
              >
                {catalog.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.year}) [ID: {t.id}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#777777] uppercase font-bold mb-1">
                Authorized Video Stream URL (HTTPS HLS .m3u8 or MP4) *
              </label>
              <input
                type="url"
                required
                value={authStreamUrl}
                onChange={(e) => setAuthStreamUrl(e.target.value)}
                placeholder="https://cdn.teatro.cinema/streams/master.m3u8 or https://..."
                className="w-full px-3 py-2 bg-[#181818] border border-[#292929] rounded text-white focus:outline-none focus:border-[#E50914]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#777777] uppercase font-bold mb-1">
                  Stream Format
                </label>
                <select
                  value={authStreamFormat}
                  onChange={(e) => setAuthStreamFormat(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#181818] border border-[#292929] rounded text-white focus:outline-none focus:border-[#E50914]"
                >
                  <option value="mp4">Progressive MP4 Master</option>
                  <option value="hls">HLS Adaptive Stream (.m3u8)</option>
                </select>
              </div>

              <div>
                <label className="block text-[#777777] uppercase font-bold mb-1">
                  License & Attribution Statement *
                </label>
                <input
                  type="text"
                  required
                  value={authLicenseText}
                  onChange={(e) => setAuthLicenseText(e.target.value)}
                  className="w-full px-3 py-2 bg-[#181818] border border-[#292929] rounded text-white focus:outline-none focus:border-[#E50914]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#E50914] hover:bg-[#b80710] text-white font-bold rounded shadow-lg transition-transform hover:scale-[1.01]"
            >
              Commit Authorized Stream Rights
            </button>
          </form>
        )}

        {/* TAB 3: INGEST MEDIA MASTER */}
        {activeTab === 'add' && (
          <form
            onSubmit={handleAddSubmit}
            className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 text-xs"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#777777] uppercase font-bold mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle.title}
                  onChange={(e) => setNewTitle({ ...newTitle, title: e.target.value })}
                  placeholder="e.g. Solaris (Restored Edition)"
                  className="w-full px-3 py-2 bg-[#181818] border border-[#292929] rounded text-white focus:outline-none focus:border-[#E50914]"
                />
              </div>

              <div>
                <label className="block text-[#777777] uppercase font-bold mb-1">
                  Original Title
                </label>
                <input
                  type="text"
                  value={newTitle.originalTitle}
                  onChange={(e) =>
                    setNewTitle({ ...newTitle, originalTitle: e.target.value })
                  }
                  placeholder="e.g. Солярис"
                  className="w-full px-3 py-2 bg-[#181818] border border-[#292929] rounded text-white focus:outline-none focus:border-[#E50914]"
                />
              </div>

              <div>
                <label className="block text-[#777777] uppercase font-bold mb-1">
                  Content Type
                </label>
                <select
                  value={newTitle.type}
                  onChange={(e) =>
                    setNewTitle({ ...newTitle, type: e.target.value as MediaType })
                  }
                  className="w-full px-3 py-2 bg-[#181818] border border-[#292929] rounded text-white focus:outline-none focus:border-[#E50914]"
                >
                  <option value="movie">Movie</option>
                  <option value="series">TV Series</option>
                  <option value="anime">Anime</option>
                  <option value="asian_drama">Asian Drama</option>
                  <option value="documentary">Documentary</option>
                </select>
              </div>

              <div>
                <label className="block text-[#777777] uppercase font-bold mb-1">
                  Release Year & Duration
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={newTitle.year}
                    onChange={(e) =>
                      setNewTitle({ ...newTitle, year: parseInt(e.target.value) || 2024 })
                    }
                    className="w-1/2 px-3 py-2 bg-[#181818] border border-[#292929] rounded text-white focus:outline-none focus:border-[#E50914]"
                  />
                  <input
                    type="text"
                    value={newTitle.duration}
                    onChange={(e) =>
                      setNewTitle({ ...newTitle, duration: e.target.value })
                    }
                    placeholder="e.g. 115m or 12 Eps"
                    className="w-1/2 px-3 py-2 bg-[#181818] border border-[#292929] rounded text-white focus:outline-none focus:border-[#E50914]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#777777] uppercase font-bold mb-1">
                  Director *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle.director}
                  onChange={(e) =>
                    setNewTitle({ ...newTitle, director: e.target.value })
                  }
                  placeholder="e.g. Andrei Tarkovsky"
                  className="w-full px-3 py-2 bg-[#181818] border border-[#292929] rounded text-white focus:outline-none focus:border-[#E50914]"
                />
              </div>

              <div>
                <label className="block text-[#777777] uppercase font-bold mb-1">
                  Cast (Comma separated)
                </label>
                <input
                  type="text"
                  value={castInput}
                  onChange={(e) => setCastInput(e.target.value)}
                  placeholder="e.g. Donatas Banionis, Natalya Bondarchuk"
                  className="w-full px-3 py-2 bg-[#181818] border border-[#292929] rounded text-white focus:outline-none focus:border-[#E50914]"
                />
              </div>

              <div>
                <label className="block text-[#777777] uppercase font-bold mb-1">
                  Genres (Comma separated)
                </label>
                <input
                  type="text"
                  value={genresInput}
                  onChange={(e) => setGenresInput(e.target.value)}
                  placeholder="e.g. Sci-Fi, Mystery, Drama"
                  className="w-full px-3 py-2 bg-[#181818] border border-[#292929] rounded text-white focus:outline-none focus:border-[#E50914]"
                />
              </div>

              <div>
                <label className="block text-[#777777] uppercase font-bold mb-1">
                  Country & Language
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTitle.country}
                    onChange={(e) =>
                      setNewTitle({ ...newTitle, country: e.target.value })
                    }
                    placeholder="Country"
                    className="w-1/2 px-3 py-2 bg-[#181818] border border-[#292929] rounded text-white focus:outline-none focus:border-[#E50914]"
                  />
                  <input
                    type="text"
                    value={newTitle.language}
                    onChange={(e) =>
                      setNewTitle({ ...newTitle, language: e.target.value })
                    }
                    placeholder="Language"
                    className="w-1/2 px-3 py-2 bg-[#181818] border border-[#292929] rounded text-white focus:outline-none focus:border-[#E50914]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[#777777] uppercase font-bold mb-1">
                Authorized Video Stream URL (HTTPS MP4/WebM)
              </label>
              <input
                type="url"
                value={newTitle.streamUrl}
                onChange={(e) =>
                  setNewTitle({ ...newTitle, streamUrl: e.target.value })
                }
                placeholder="https://...mp4 or https://...m3u8 (Authorized Stream)"
                className="w-full px-3 py-2 bg-[#181818] border border-[#292929] rounded text-white focus:outline-none focus:border-[#E50914]"
              />
            </div>

            <div>
              <label className="block text-[#777777] uppercase font-bold mb-1">
                Poster Image URL
              </label>
              <input
                type="url"
                value={newTitle.poster}
                onChange={(e) => setNewTitle({ ...newTitle, poster: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 bg-[#181818] border border-[#292929] rounded text-white focus:outline-none focus:border-[#E50914]"
              />
            </div>

            <div>
              <label className="block text-[#777777] uppercase font-bold mb-1">
                Synopsis *
              </label>
              <textarea
                required
                rows={3}
                value={newTitle.synopsis}
                onChange={(e) =>
                  setNewTitle({ ...newTitle, synopsis: e.target.value })
                }
                placeholder="Detailed cinematic description of the work..."
                className="w-full px-3 py-2 bg-[#181818] border border-[#292929] rounded text-white focus:outline-none focus:border-[#E50914]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#E50914] hover:bg-[#b80710] text-white font-bold rounded shadow-lg transition-transform hover:scale-[1.01]"
            >
              Commit Media to TEATRO Catalog
            </button>
          </form>
        )}

        {/* TAB 4: PLATFORM TELEMETRY & STATS */}
        {activeTab === 'telemetry' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-[#181818] border border-[#292929] rounded-xl text-center">
                <Film className="w-5 h-5 text-[#E50914] mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{catalog.length}</div>
                <div className="text-[11px] text-[#777777]">Catalog Titles</div>
              </div>

              <div className="p-4 bg-[#181818] border border-[#292929] rounded-xl text-center">
                <Users className="w-5 h-5 text-[#4ade80] mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">4,812</div>
                <div className="text-[11px] text-[#777777]">Active Sessions</div>
              </div>

              <div className="p-4 bg-[#181818] border border-[#292929] rounded-xl text-center">
                <HardDrive className="w-5 h-5 text-[#60a5fa] mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">1.48 TB</div>
                <div className="text-[11px] text-[#777777]">CDN Bandwidth (24h)</div>
              </div>

              <div className="p-4 bg-[#181818] border border-[#292929] rounded-xl text-center">
                <Bookmark className="w-5 h-5 text-[#ffd700] mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">28.4k</div>
                <div className="text-[11px] text-[#777777]">Watchlist Saves</div>
              </div>
            </div>

            <div className="p-5 bg-[#181818] border border-[#292929] rounded-xl space-y-3 text-xs">
              <h4 className="font-bold text-white text-sm">Streaming Delivery Infrastructure</h4>
              <p className="text-[#B3B3B3] leading-relaxed">
                Stream distribution architecture utilizes Edge Cloud CDN with direct MP4 byte-range
                and HLS chunking. All active media complies with CC-BY and public-domain archive
                preservation guidelines.
              </p>
              <div className="flex items-center gap-2 text-[11px] text-[#4ade80]">
                <span>●</span>
                <span>All CDN edge points reporting nominal health & 99.98% uptime.</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
