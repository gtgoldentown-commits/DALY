/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from './components/common/Navbar.tsx';
import { Footer } from './components/common/Footer.tsx';
import { CinematicHero } from './components/hero/CinematicHero.tsx';
import { ContentRow } from './components/carousel/ContentRow.tsx';
import { BrowseView } from './components/browse/BrowseView.tsx';
import { CinemaPlayer } from './components/player/CinemaPlayer.tsx';
import { TitleDetailModal } from './components/modal/TitleDetailModal.tsx';
import { SubscriptionModal } from './components/modal/SubscriptionModal.tsx';
import { AdminStudioModal } from './components/admin/AdminStudioModal.tsx';
import { AuthModal } from './components/auth/AuthModal.tsx';
import { ApiKeyModal } from './components/modal/ApiKeyModal.tsx';
import { INITIAL_CATALOG } from './data/catalog.ts';
import {
  MediaTitle,
  Episode,
  UserAccount,
  WatchProgress
} from './types/index.ts';
import { tmdbService } from './services/tmdb.service.ts';
import { Bookmark, Sparkles, RefreshCw, Key, ShieldCheck, Film } from 'lucide-react';

interface TmdbCatalogRows {
  trending: MediaTitle[];
  popular: MediaTitle[];
  topRated: MediaTitle[];
  korean: MediaTitle[];
  japanese: MediaTitle[];
  anime: MediaTitle[];
  nowPlaying: MediaTitle[];
}

export default function App() {
  // 1. Full merged catalog state (starts with INITIAL_CATALOG, then dynamically enriched by TMDB)
  const [catalog, setCatalog] = useState<MediaTitle[]>(() => {
    try {
      const saved = localStorage.getItem('teatro_catalog_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load saved catalog:', e);
    }
    return INITIAL_CATALOG;
  });

  // 2. Real TMDB Live Rows for Homepage Carousels
  const [liveRows, setLiveRows] = useState<TmdbCatalogRows>({
    trending: [],
    popular: [],
    topRated: [],
    korean: [],
    japanese: [],
    anime: [],
    nowPlaying: []
  });
  const [isLoadingLive, setIsLoadingLive] = useState(true);
  const [liveCatalogError, setLiveCatalogError] = useState<string | null>(null);

  // 3. Watchlist (My List) State
  const [myListIds, setMyListIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('teatro_watchlist_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load saved watchlist:', e);
    }
    return ['tt001', 'tt002'];
  });

  // 4. Watch Progress State (Continue Watching)
  const [watchProgressMap, setWatchProgressMap] = useState<Record<string, WatchProgress>>(() => {
    try {
      const saved = localStorage.getItem('teatro_progress_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load saved progress:', e);
    }
    return {
      tt001: {
        titleId: 'tt001',
        currentTime: 240,
        duration: 720,
        percentage: 33,
        lastUpdated: Date.now()
      }
    };
  });

  // 5. User Account State
  const [user, setUser] = useState<UserAccount>(() => {
    try {
      const saved = localStorage.getItem('teatro_user_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load saved user:', e);
    }
    return {
      id: 'usr_001',
      name: 'Alexander Rostova',
      email: 'alexander@cinephile.org',
      avatar: '',
      subscriptionTier: 'vip',
      profiles: [
        { id: 'p1', name: 'Alexander', avatar: '', isKids: false },
        { id: 'p2', name: 'Cinema Club', avatar: '', isKids: false }
      ],
      activeProfileId: 'p1',
      preferences: {
        autoplayPreviews: true,
        subtitleLanguage: 'en',
        audioLanguage: 'original',
        playbackQuality: '4k'
      }
    };
  });

  // 6. Navigation & View State
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [activeBrowseCategory, setActiveBrowseCategory] = useState<string>('all');
  const [activeSearchQuery, setActiveSearchQuery] = useState<string>('');

  // 7. Modals
  const [selectedTitleForDetail, setSelectedTitleForDetail] = useState<MediaTitle | null>(null);
  const [playingMedia, setPlayingMedia] = useState<{
    media: MediaTitle;
    episode?: Episode;
  } | null>(null);
  const [isPlansOpen, setIsPlansOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  // Persistence side effects
  useEffect(() => {
    try {
      localStorage.setItem('teatro_watchlist_v2', JSON.stringify(myListIds));
    } catch (e) {
      // ignore
    }
  }, [myListIds]);

  useEffect(() => {
    try {
      localStorage.setItem('teatro_progress_v2', JSON.stringify(watchProgressMap));
    } catch (e) {
      // ignore
    }
  }, [watchProgressMap]);

  useEffect(() => {
    try {
      localStorage.setItem('teatro_user_v2', JSON.stringify(user));
    } catch (e) {
      // ignore
    }
  }, [user]);

  // Load Real TMDB Catalog for Homepage Rows and Hero
  const loadLiveCatalog = useCallback(async () => {
    setIsLoadingLive(true);
    setLiveCatalogError(null);
    try {
      const [
        trendingRes,
        popularRes,
        topRatedRes,
        koreanRes,
        japaneseRes,
        animeRes,
        nowPlayingRes
      ] = await Promise.allSettled([
        tmdbService.getTrending(1),
        tmdbService.getPopularMovies(1),
        tmdbService.getTopRated(1),
        tmdbService.getKoreanDramas(1),
        tmdbService.getJapaneseCinema(1),
        tmdbService.getAnime(1),
        tmdbService.getNowPlayingMovies(1)
      ]);

      const trending = trendingRes.status === 'fulfilled' ? trendingRes.value.results : [];
      const popular = popularRes.status === 'fulfilled' ? popularRes.value.results : [];
      const topRated = topRatedRes.status === 'fulfilled' ? topRatedRes.value.results : [];
      const korean = koreanRes.status === 'fulfilled' ? koreanRes.value.results : [];
      const japanese = japaneseRes.status === 'fulfilled' ? japaneseRes.value.results : [];
      const anime = animeRes.status === 'fulfilled' ? animeRes.value.results : [];
      const nowPlaying = nowPlayingRes.status === 'fulfilled' ? nowPlayingRes.value.results : [];

      setLiveRows({
        trending,
        popular,
        topRated,
        korean,
        japanese,
        anime,
        nowPlaying
      });

      // Combine all fetched titles and merge with INITIAL_CATALOG
      const allFetched = [
        ...trending,
        ...popular,
        ...topRated,
        ...korean,
        ...japanese,
        ...anime,
        ...nowPlaying
      ];

      setCatalog((prev) => {
        const titleMap = new Map<string, MediaTitle>();
        // Add initial items first (for authorized sample streams)
        prev.forEach((item) => titleMap.set(String(item.id), item));
        // Add TMDB items
        allFetched.forEach((item) => {
          titleMap.set(String(item.id), item);
        });
        const merged = Array.from(titleMap.values());
        try {
          localStorage.setItem('teatro_catalog_v2', JSON.stringify(merged));
        } catch (e) {
          // ignore
        }
        return merged;
      });
    } catch (err: any) {
      console.error('Error fetching live TMDB catalog:', err);
      setLiveCatalogError(err.message || 'Failed to connect to TMDB');
    } finally {
      setIsLoadingLive(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadLiveCatalog();
  }, [loadLiveCatalog]);

  // Watchlist Toggle
  const toggleMyList = (titleId: string) => {
    setMyListIds((prev) =>
      prev.includes(titleId) ? prev.filter((id) => id !== titleId) : [...prev, titleId]
    );
  };

  const isTitleInMyList = (titleId: string) => myListIds.includes(titleId);

  // Watch Progress Update
  const handleSaveProgress = (progress: WatchProgress) => {
    setWatchProgressMap((prev) => ({
      ...prev,
      [progress.titleId]: progress
    }));
  };

  // Switch tabs & adapt browse filter
  const handleSelectTab = (tab: string) => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (tab === 'movies') {
      setActiveBrowseCategory('movie');
      setActiveSearchQuery('');
    } else if (tab === 'series') {
      setActiveBrowseCategory('series');
      setActiveSearchQuery('');
    } else if (tab === 'anime') {
      setActiveBrowseCategory('anime');
      setActiveSearchQuery('');
    } else if (tab === 'asian_drama') {
      setActiveBrowseCategory('asian_drama');
      setActiveSearchQuery('');
    } else if (tab === 'browse') {
      setActiveBrowseCategory('all');
      setActiveSearchQuery('');
    }
  };

  // Search Submit from Navbar (Arabic & English)
  const handleSearchSubmit = (query: string) => {
    setActiveSearchQuery(query);
    setActiveBrowseCategory('all');
    setCurrentTab('browse');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Hero Featured Titles: Use live trending titles with valid high-res backdrop
  const featuredTitles = useMemo(() => {
    if (liveRows.trending.length > 0) {
      return liveRows.trending.slice(0, 5);
    }
    return catalog.filter((item) => item.backdrop).slice(0, 5);
  }, [liveRows.trending, catalog]);

  // Dynamic "Continue Watching" Row Items
  const continueWatchingItems = useMemo(() => {
    const list: MediaTitle[] = [];
    for (const [id, prog] of Object.entries(watchProgressMap)) {
      if (prog.percentage > 0 && prog.percentage < 95) {
        const item = catalog.find((c) => String(c.id) === String(id));
        if (item) list.push(item);
      }
    }
    return list;
  }, [catalog, watchProgressMap]);

  // Dynamic "Recommended for You"
  const recommendedItems = useMemo(() => {
    if (liveRows.topRated.length > 0) {
      return liveRows.topRated.slice(0, 10);
    }
    return catalog.filter((c) => c.rating >= 8.0).slice(0, 8);
  }, [liveRows.topRated, catalog]);

  // My List Catalog
  const myListItems = useMemo(() => {
    return catalog.filter((item) => myListIds.includes(String(item.id)));
  }, [catalog, myListIds]);

  // Related titles generator for modal
  const getRelatedTitles = (current: MediaTitle) => {
    return catalog
      .filter((c) => c.id !== current.id && c.genres.some((g) => current.genres.includes(g)))
      .slice(0, 6);
  };

  // Launch playback
  const handlePlayTitle = (media: MediaTitle, episode?: Episode) => {
    setPlayingMedia({ media, episode });
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col font-sans select-none selection:bg-[#E50914] selection:text-white">
      {/* Top Fixed Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        myListCount={myListIds.length}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenPlans={() => setIsPlansOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onSearchSubmit={handleSearchSubmit}
        onSelectTitle={(item) => setSelectedTitleForDetail(item)}
      />

      {/* Main View Router */}
      <main className="flex-1 pb-16">
        {currentTab === 'home' && (
          <div className="space-y-4">
            {/* Cinematic Hero */}
            <CinematicHero
              featuredTitles={featuredTitles}
              onPlay={(title) => handlePlayTitle(title)}
              onMoreInfo={(title) => setSelectedTitleForDetail(title)}
              onToggleMyList={toggleMyList}
              isMyList={isTitleInMyList}
            />

            {/* Live Connection Banner (if API Key needs attention or is working) */}
            <div className="px-6 md:px-14">
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-lg bg-[#111111]/90 border border-[#292929] text-xs text-[#B3B3B3]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-semibold text-white">Live TMDB Catalog Active</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="hidden sm:inline">Dynamic metadata, posters, ratings & bilingual search</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsApiKeyModalOpen(true)}
                    className="flex items-center gap-1.5 text-xs text-white hover:text-[#E50914] font-medium transition-colors"
                  >
                    <Key className="w-3.5 h-3.5 text-[#E50914]" />
                    <span>API Key Settings</span>
                  </button>
                  <button
                    onClick={loadLiveCatalog}
                    className="flex items-center gap-1.5 text-xs text-[#B3B3B3] hover:text-white transition-colors"
                    title="Refresh live catalog"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLive ? 'animate-spin text-[#E50914]' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Dynamic Continue Watching Row (only when items exist) */}
            {continueWatchingItems.length > 0 && (
              <ContentRow
                title="Continue Watching for Alexander"
                items={continueWatchingItems}
                onSelectTitle={(item) => setSelectedTitleForDetail(item)}
                onPlayTitle={(item) => handlePlayTitle(item)}
                onToggleMyList={toggleMyList}
                isMyList={isTitleInMyList}
                watchProgressMap={watchProgressMap}
              />
            )}

            {/* Trending Now on TEATRO (Live TMDB) */}
            <ContentRow
              title="Trending Now This Week"
              items={liveRows.trending.length > 0 ? liveRows.trending : catalog.filter((i) => i.categories.includes('trending'))}
              onSelectTitle={(item) => setSelectedTitleForDetail(item)}
              onPlayTitle={(item) => handlePlayTitle(item)}
              onToggleMyList={toggleMyList}
              isMyList={isTitleInMyList}
              onExploreMore={() => {
                setActiveBrowseCategory('trending');
                setCurrentTab('browse');
              }}
              watchProgressMap={watchProgressMap}
            />

            {/* Popular Feature Films (Live TMDB) */}
            <ContentRow
              title="Popular Movies"
              items={liveRows.popular.length > 0 ? liveRows.popular : catalog.filter((i) => i.type === 'movie')}
              onSelectTitle={(item) => setSelectedTitleForDetail(item)}
              onPlayTitle={(item) => handlePlayTitle(item)}
              onToggleMyList={toggleMyList}
              isMyList={isTitleInMyList}
              onExploreMore={() => {
                setActiveBrowseCategory('movie');
                setCurrentTab('browse');
              }}
              watchProgressMap={watchProgressMap}
            />

            {/* Korean Dramas (Live TMDB) */}
            <ContentRow
              title="Korean Dramas & East Asian Thrillers"
              items={liveRows.korean.length > 0 ? liveRows.korean : catalog.filter((i) => i.categories.includes('korean'))}
              onSelectTitle={(item) => setSelectedTitleForDetail(item)}
              onPlayTitle={(item) => handlePlayTitle(item)}
              onToggleMyList={toggleMyList}
              isMyList={isTitleInMyList}
              onExploreMore={() => {
                setActiveBrowseCategory('korean');
                setCurrentTab('browse');
              }}
              watchProgressMap={watchProgressMap}
            />

            {/* Anime & Animation Masters (Live TMDB) */}
            <ContentRow
              title="Anime & International Animation"
              items={liveRows.anime.length > 0 ? liveRows.anime : catalog.filter((i) => i.type === 'anime')}
              onSelectTitle={(item) => setSelectedTitleForDetail(item)}
              onPlayTitle={(item) => handlePlayTitle(item)}
              onToggleMyList={toggleMyList}
              isMyList={isTitleInMyList}
              onExploreMore={() => {
                setActiveBrowseCategory('anime');
                setCurrentTab('browse');
              }}
              watchProgressMap={watchProgressMap}
            />

            {/* Japanese Cinema & Neo-Noir (Live TMDB) */}
            <ContentRow
              title="Japanese Cinema & International Masterpieces"
              items={liveRows.japanese.length > 0 ? liveRows.japanese : catalog.filter((i) => i.country === 'Japan')}
              onSelectTitle={(item) => setSelectedTitleForDetail(item)}
              onPlayTitle={(item) => handlePlayTitle(item)}
              onToggleMyList={toggleMyList}
              isMyList={isTitleInMyList}
              onExploreMore={() => {
                setActiveBrowseCategory('movie');
                setCurrentTab('browse');
              }}
              watchProgressMap={watchProgressMap}
            />

            {/* Critically Acclaimed & Top Rated (Live TMDB) */}
            <ContentRow
              title="Critically Acclaimed & Top Rated"
              items={liveRows.topRated.length > 0 ? liveRows.topRated : catalog.filter((i) => i.rating >= 8.5)}
              onSelectTitle={(item) => setSelectedTitleForDetail(item)}
              onPlayTitle={(item) => handlePlayTitle(item)}
              onToggleMyList={toggleMyList}
              isMyList={isTitleInMyList}
              onExploreMore={() => {
                setActiveBrowseCategory('all');
                setCurrentTab('browse');
              }}
              watchProgressMap={watchProgressMap}
            />

            {/* Recently Released / Now Playing (Live TMDB) */}
            <ContentRow
              title="Recently Released in Cinema"
              items={liveRows.nowPlaying.length > 0 ? liveRows.nowPlaying : catalog.slice(0, 10)}
              onSelectTitle={(item) => setSelectedTitleForDetail(item)}
              onPlayTitle={(item) => handlePlayTitle(item)}
              onToggleMyList={toggleMyList}
              isMyList={isTitleInMyList}
              onExploreMore={() => {
                setActiveBrowseCategory('now_playing');
                setCurrentTab('browse');
              }}
              watchProgressMap={watchProgressMap}
            />

            {/* Dynamic Recommended for You */}
            <ContentRow
              title="Curated Recommendations for You"
              items={recommendedItems}
              onSelectTitle={(item) => setSelectedTitleForDetail(item)}
              onPlayTitle={(item) => handlePlayTitle(item)}
              onToggleMyList={toggleMyList}
              isMyList={isTitleInMyList}
              watchProgressMap={watchProgressMap}
            />
          </div>
        )}

        {/* Dedicated Browse & Discovery Tab */}
        {(currentTab === 'browse' ||
          currentTab === 'movies' ||
          currentTab === 'series' ||
          currentTab === 'anime' ||
          currentTab === 'asian_drama') && (
          <BrowseView
            catalog={catalog}
            onSelectTitle={(item) => setSelectedTitleForDetail(item)}
            onPlayTitle={(item) => handlePlayTitle(item)}
            onToggleMyList={toggleMyList}
            isMyList={isTitleInMyList}
            initialCategory={activeBrowseCategory}
            initialSearch={activeSearchQuery}
          />
        )}

        {/* Dedicated My List Tab */}
        {currentTab === 'mylist' && (
          <div className="pt-24 pb-20 px-6 md:px-14 max-w-7xl mx-auto space-y-8 animate-fadeIn">
            <div>
              <h1 className="font-cinzel text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
                My Watchlist
              </h1>
              <p className="text-sm text-[#B3B3B3]">
                Your personal queue synchronized across mobile, tablet, and TV displays.
              </p>
            </div>

            {myListItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                {myListItems.map((item) => (
                  <div key={item.id} className="relative">
                    <ContentRow
                      title=""
                      items={[item]}
                      onSelectTitle={(t) => setSelectedTitleForDetail(t)}
                      onPlayTitle={(t) => handlePlayTitle(t)}
                      onToggleMyList={toggleMyList}
                      isMyList={isTitleInMyList}
                      watchProgressMap={watchProgressMap}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-24 text-center space-y-4 bg-[#111111] rounded-xl border border-[#292929] p-8 max-w-xl mx-auto">
                <Bookmark className="w-12 h-12 text-[#777777] mx-auto" />
                <h3 className="text-lg font-bold text-white">Your List is Empty</h3>
                <p className="text-sm text-[#B3B3B3]">
                  Add your favorite movies, series, anime, and dramas to keep track of what you
                  want to watch next.
                </p>
                <button
                  onClick={() => setCurrentTab('browse')}
                  className="px-6 py-2.5 bg-[#E50914] text-white text-xs font-bold rounded hover:bg-[#b80710] transition-colors"
                >
                  Explore Catalog
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Global Footer */}
      <Footer
        onSelectTab={handleSelectTab}
        onOpenPlans={() => setIsPlansOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Title Detail Modal (Real TMDB metadata, cast, episodes, trailer, and streaming rights) */}
      {selectedTitleForDetail && (
        <TitleDetailModal
          media={selectedTitleForDetail}
          onClose={() => setSelectedTitleForDetail(null)}
          onPlay={(media, episode) => {
            setSelectedTitleForDetail(null);
            handlePlayTitle(media, episode);
          }}
          onToggleMyList={toggleMyList}
          isMyList={isTitleInMyList(selectedTitleForDetail.id)}
          relatedTitles={getRelatedTitles(selectedTitleForDetail)}
          onSelectRelated={(related) => setSelectedTitleForDetail(related)}
        />
      )}

      {/* Cinema Video Player Overlay */}
      {playingMedia && (
        <CinemaPlayer
          media={playingMedia.media}
          initialEpisode={playingMedia.episode}
          onClose={() => setPlayingMedia(null)}
          onSaveProgress={handleSaveProgress}
          savedProgress={watchProgressMap[playingMedia.media.id]}
          onSelectNextEpisode={() => {
            if (playingMedia.media.episodes && playingMedia.episode) {
              const currIdx = playingMedia.media.episodes.findIndex(
                (e) => e.id === playingMedia.episode!.id
              );
              if (currIdx >= 0 && currIdx < playingMedia.media.episodes.length - 1) {
                setPlayingMedia({
                  media: playingMedia.media,
                  episode: playingMedia.media.episodes[currIdx + 1]
                });
              } else {
                alert('You have reached the final available episode in this season.');
              }
            }
          }}
        />
      )}

      {/* Subscription Plans Modal */}
      {isPlansOpen && (
        <SubscriptionModal
          currentTier={user.subscriptionTier}
          onClose={() => setIsPlansOpen(false)}
          onUpgradeTier={(tier) => {
            setUser((prev) => ({ ...prev, subscriptionTier: tier }));
            alert(
              `Membership updated to ${tier.toUpperCase()} Pass! 4K HDR & master features unlocked.`
            );
          }}
        />
      )}

      {/* Admin Studio CMS Modal */}
      {isAdminOpen && (
        <AdminStudioModal
          catalog={catalog}
          onAddTitle={(newTitle) => setCatalog((prev) => [newTitle, ...prev])}
          onDeleteTitle={(id) => setCatalog((prev) => prev.filter((t) => t.id !== id))}
          onResetCatalog={() => setCatalog(INITIAL_CATALOG)}
          onClose={() => setIsAdminOpen(false)}
        />
      )}

      {/* Account & Preferences Modal */}
      {isAuthOpen && (
        <AuthModal
          user={user}
          onUpdateUser={(updates) => setUser((prev) => ({ ...prev, ...updates }))}
          onClose={() => setIsAuthOpen(false)}
          onOpenPlans={() => setIsPlansOpen(true)}
        />
      )}

      {/* TMDB API Key & Metadata Provider Modal */}
      {isApiKeyModalOpen && (
        <ApiKeyModal
          onClose={() => setIsApiKeyModalOpen(false)}
          onKeyUpdated={() => {
            loadLiveCatalog();
          }}
        />
      )}
    </div>
  );
}
