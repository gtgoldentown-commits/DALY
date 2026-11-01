/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { BrandLogo } from './BrandLogo.tsx';
import {
  Search,
  Bookmark,
  Sparkles,
  SlidersHorizontal,
  User,
  X,
  Menu,
  ChevronDown,
  Key,
  ShieldCheck,
  Video
} from 'lucide-react';
import { UserAccount, MediaTitle } from '../../types/index.ts';
import { tmdbService } from '../../services/tmdb.service.ts';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  myListCount: number;
  user: UserAccount;
  onOpenAuth: () => void;
  onOpenPlans: () => void;
  onOpenAdmin: () => void;
  onOpenApiKeyModal: () => void;
  onSearchSubmit: (query: string) => void;
  onSelectTitle: (title: MediaTitle) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  myListCount,
  user,
  onOpenAuth,
  onOpenPlans,
  onOpenAdmin,
  onOpenApiKeyModal,
  onSearchSubmit,
  onSelectTitle
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MediaTitle[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Scroll transparency detector
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Live real-time TMDB search with Arabic and English support
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length > 1) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        tmdbService
          .searchMulti(q, 1)
          .then((res) => {
            setSearchResults(res.results.slice(0, 6));
          })
          .catch((err) => {
            console.error('Navbar search error:', err);
            setSearchResults([]);
          })
          .finally(() => setIsSearching(false));
      }, 250);

      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchQuery]);

  // Click outside listener for profile dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearchSubmit(searchQuery.trim());
      setSearchOpen(false);
    }
  };

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'movies', label: 'Movies' },
    { id: 'series', label: 'TV Series' },
    { id: 'korean', label: 'Korean Drama' },
    { id: 'anime', label: 'Anime' },
    { id: 'browse', label: 'Browse' }
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#080808]/95 backdrop-blur-md border-b border-[#292929] shadow-2xl py-2'
          : 'bg-gradient-to-b from-[#080808]/90 via-[#080808]/40 to-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left: Brand Logo & Desktop Nav Links */}
        <div className="flex items-center gap-8">
          <BrandLogo onClick={() => onSelectTab('home')} size="md" />

          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => {
              const active = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => onSelectTab(link.id)}
                  className={`text-sm font-medium tracking-wide transition-colors relative py-1 ${
                    active ? 'text-white' : 'text-[#B3B3B3] hover:text-white'
                  }`}
                >
                  {link.label}
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#E50914] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right: Search, My List, TMDB Key, CMS, Upgrade & Profile */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Search Toggle & Input */}
          <div className="relative">
            {searchOpen ? (
              <form onSubmit={handleSearchSubmit} className="flex items-center">
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 text-[#777777] absolute left-3 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search in Arabic / English..."
                    autoFocus
                    className="w-48 sm:w-72 pl-9 pr-8 py-1.5 bg-[#181818] border border-[#292929] rounded text-sm text-white placeholder-[#777777] focus:outline-none focus:border-[#E50914] transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 text-[#777777] hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="ml-2 text-xs text-[#B3B3B3] hover:text-white"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                onClick={() => {
                  setSearchOpen(true);
                  setTimeout(() => searchInputRef.current?.focus(), 100);
                }}
                className="p-2 text-[#B3B3B3] hover:text-white transition-colors rounded-full hover:bg-[#181818]"
                aria-label="Search catalog"
              >
                <Search className="w-5 h-5" />
              </button>
            )}

            {/* Instant Real TMDB Search Dropdown Preview */}
            {searchOpen && searchQuery.trim().length > 1 && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[#111111] border border-[#292929] rounded-lg shadow-2xl overflow-hidden z-50">
                <div className="p-2.5 border-b border-[#292929] text-[11px] font-semibold text-[#777777] uppercase tracking-wider flex items-center justify-between">
                  <span>TMDB Live Search Results</span>
                  {isSearching && <span className="text-[#E50914] text-[10px]">Searching...</span>}
                </div>

                {searchResults.length > 0 ? (
                  searchResults.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTitle(item);
                        setSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className="w-full text-left p-2.5 flex items-center gap-3 hover:bg-[#181818] transition-colors border-b border-[#292929]/50 last:border-none"
                    >
                      <img
                        src={item.poster}
                        alt={item.title}
                        className="w-10 h-14 object-cover rounded bg-[#181818] shrink-0"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                      <div className="overflow-hidden">
                        <div className="text-sm font-semibold text-white truncate">
                          {item.title}
                        </div>
                        {item.originalTitle && item.originalTitle !== item.title && (
                          <div className="text-[11px] text-[#E50914] truncate font-mono">
                            {item.originalTitle}
                          </div>
                        )}
                        <div className="text-xs text-[#777777] flex items-center gap-2 mt-0.5">
                          <span>{item.year}</span>
                          <span>•</span>
                          <span className="capitalize">{item.type.replace('_', ' ')}</span>
                          <span>•</span>
                          <span className="text-[#ffd700] font-medium">★ {item.rating}</span>
                        </div>
                      </div>
                    </button>
                  ))
                ) : !isSearching ? (
                  <div className="p-4 text-center text-xs text-[#777777]">
                    No titles found for "{searchQuery}".
                  </div>
                ) : null}

                <button
                  onClick={handleSearchSubmit}
                  className="w-full text-center py-2.5 bg-[#181818] hover:bg-[#202020] text-xs font-semibold text-white transition-colors"
                >
                  View full search results ›
                </button>
              </div>
            )}
          </div>

          {/* My List Shortcut */}
          <button
            onClick={() => onSelectTab('mylist')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-sm font-medium transition-colors ${
              currentTab === 'mylist'
                ? 'bg-[#181818] text-white border border-[#292929]'
                : 'text-[#B3B3B3] hover:text-white hover:bg-[#181818]/60'
            }`}
            aria-label="My Watchlist"
          >
            <Bookmark className="w-4 h-4 text-[#E50914]" />
            <span className="hidden sm:inline">My List</span>
            {myListCount > 0 && (
              <span className="bg-[#E50914] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {myListCount}
              </span>
            )}
          </button>

          {/* TMDB API Key Config Button */}
          <button
            onClick={onOpenApiKeyModal}
            title="TMDB Metadata Configuration"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#B3B3B3] hover:text-white bg-[#181818] hover:bg-[#222222] border border-[#292929] rounded transition-colors"
          >
            <Key className="w-3.5 h-3.5 text-[#ffd700]" />
            <span className="hidden md:inline">API</span>
          </button>

          {/* Upgrade / Subscription Pass */}
          <button
            onClick={onOpenPlans}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-[#E50914] to-[#990007] hover:from-[#f40612] hover:to-[#b30009] text-white text-xs font-semibold rounded shadow-md transition-transform hover:scale-[1.02]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>VIP Pass</span>
          </button>

          {/* Admin CMS Studio Button */}
          <button
            onClick={onOpenAdmin}
            title="Content Management & Playback Rights Studio"
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#B3B3B3] hover:text-white bg-[#181818] hover:bg-[#222222] border border-[#292929] rounded transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>CMS</span>
          </button>

          {/* User Profile Avatar & Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-1.5 focus:outline-none group"
              aria-label="User Account Menu"
            >
              <div className="w-8 h-8 rounded bg-[#181818] border border-[#292929] overflow-hidden flex items-center justify-center text-xs font-bold text-white group-hover:border-[#E50914] transition-colors">
                <span className="font-cinzel text-sm text-[#E50914]">T</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#777777] group-hover:text-white transition-colors" />
            </button>

            {/* Profile Dropdown */}
            {profileDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-[#111111] border border-[#292929] rounded-lg shadow-2xl py-2 z-50 text-sm">
                <div className="px-4 py-2 border-b border-[#292929]">
                  <p className="font-semibold text-white">{user.name}</p>
                  <p className="text-xs text-[#777777] truncate">{user.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-[#E50914]/20 text-[#ff4d58] border border-[#E50914]/40">
                    {user.subscriptionTier === 'vip' ? 'Cinephile VIP' : 'Free Discovery'}
                  </span>
                </div>

                <div className="py-1 border-b border-[#292929]">
                  <button
                    onClick={() => {
                      onOpenApiKeyModal();
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-[#B3B3B3] hover:text-white hover:bg-[#181818] flex items-center justify-between"
                  >
                    <span>TMDB API Settings</span>
                    <Key className="w-3.5 h-3.5 text-[#ffd700]" />
                  </button>
                  <button
                    onClick={() => {
                      onOpenPlans();
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-[#B3B3B3] hover:text-white hover:bg-[#181818] flex items-center justify-between"
                  >
                    <span>Manage Subscription</span>
                    <Sparkles className="w-3.5 h-3.5 text-[#E50914]" />
                  </button>
                  <button
                    onClick={() => {
                      onOpenAdmin();
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-[#B3B3B3] hover:text-white hover:bg-[#181818] flex items-center justify-between"
                  >
                    <span>Admin Catalog & Rights</span>
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      onOpenAuth();
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-[#B3B3B3] hover:text-white hover:bg-[#181818] flex items-center gap-2"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Account & Preferences</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-[#B3B3B3] hover:text-white"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#080808]/98 border-b border-[#292929] px-6 py-4 space-y-3">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  onSelectTab(link.id);
                  setMobileMenuOpen(false);
                }}
                className={`text-left text-base font-medium py-2 px-3 rounded ${
                  currentTab === link.id
                    ? 'bg-[#181818] text-white border-l-4 border-[#E50914]'
                    : 'text-[#B3B3B3] hover:text-white'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-[#292929] flex flex-wrap gap-2">
            <button
              onClick={() => {
                onOpenApiKeyModal();
                setMobileMenuOpen(false);
              }}
              className="w-full py-2 bg-[#181818] border border-[#292929] text-white text-sm rounded text-center flex items-center justify-center gap-2"
            >
              <Key className="w-4 h-4 text-[#ffd700]" />
              <span>TMDB API Key Settings</span>
            </button>
            <button
              onClick={() => {
                onOpenPlans();
                setMobileMenuOpen(false);
              }}
              className="w-full py-2 bg-[#E50914] text-white text-sm font-semibold rounded text-center"
            >
              Upgrade to VIP Pass
            </button>
            <button
              onClick={() => {
                onOpenAdmin();
                setMobileMenuOpen(false);
              }}
              className="w-full py-2 bg-[#181818] border border-[#292929] text-white text-sm rounded text-center"
            >
              CMS Studio
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
