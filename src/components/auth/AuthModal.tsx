/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, User, Check, Sparkles, Sliders, Shield } from 'lucide-react';
import { UserAccount, SubscriptionTier } from '../../types/index.ts';

interface AuthModalProps {
  user: UserAccount;
  onUpdateUser: (updates: Partial<UserAccount>) => void;
  onClose: () => void;
  onOpenPlans: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  user,
  onUpdateUser,
  onClose,
  onOpenPlans
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'profiles_switch'>('profile');

  const demoAccounts = [
    {
      name: 'Alexander Rostova',
      email: 'alexander@cinephile.org',
      tier: 'vip' as SubscriptionTier,
      role: 'VIP Cinephile & Archivist'
    },
    {
      name: 'Min-ji Park',
      email: 'minji@k-drama.club',
      tier: 'vip' as SubscriptionTier,
      role: 'Korean & Asian Drama Specialist'
    },
    {
      name: 'Kenji Sato',
      email: 'kenji@tokyocinema.jp',
      tier: 'free' as SubscriptionTier,
      role: 'Anime & Neo-Noir Enthusiast'
    },
    {
      name: 'Guest Cinephile',
      email: 'guest@teatro.cinema',
      tier: 'free' as SubscriptionTier,
      role: 'Discovery Explorer'
    }
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-[#111111] border border-[#292929] rounded-2xl overflow-hidden shadow-2xl p-6 sm:p-8 my-auto text-white animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-[#181818] hover:bg-[#E50914] text-white border border-[#292929] transition-colors"
          aria-label="Close Account Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[#181818] border border-[#292929] flex items-center justify-center mx-auto mb-3">
            <span className="font-cinzel text-2xl font-bold text-[#E50914]">T</span>
          </div>
          <h2 className="font-cinzel text-2xl font-bold text-white mb-1">
            {user.name}
          </h2>
          <p className="text-xs text-[#777777]">{user.email}</p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-[#E50914]/20 text-[#ff4d58] border border-[#E50914]/40">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {user.subscriptionTier === 'vip'
                ? 'Cinephile VIP Member'
                : user.subscriptionTier === 'family'
                ? 'Teatro Patron & Family'
                : 'Free Discovery Tier'}
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#292929] mb-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 text-center border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-[#E50914] text-white'
                : 'border-transparent text-[#777777] hover:text-white'
            }`}
          >
            Account
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex-1 py-2 text-center border-b-2 transition-colors ${
              activeTab === 'preferences'
                ? 'border-[#E50914] text-white'
                : 'border-transparent text-[#777777] hover:text-white'
            }`}
          >
            Playback Prefs
          </button>
          <button
            onClick={() => setActiveTab('profiles_switch')}
            className={`flex-1 py-2 text-center border-b-2 transition-colors ${
              activeTab === 'profiles_switch'
                ? 'border-[#E50914] text-white'
                : 'border-transparent text-[#777777] hover:text-white'
            }`}
          >
            Switch User
          </button>
        </div>

        {/* TAB 1: ACCOUNT DETAILS */}
        {activeTab === 'profile' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-[#181818] border border-[#292929] rounded-xl space-y-2">
              <span className="text-[#777777] uppercase font-bold text-[10px]">
                Membership Status
              </span>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-sm">
                    {user.subscriptionTier.toUpperCase()} PASS
                  </div>
                  <div className="text-[#777777]">
                    {user.subscriptionTier === 'vip'
                      ? 'Uncompressed 4K UHD with Dolby Atmos'
                      : 'Standard 1080p Discovery'}
                  </div>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onOpenPlans();
                  }}
                  className="px-3 py-1.5 bg-[#E50914] text-white font-bold rounded hover:bg-[#b80710]"
                >
                  Change Plan
                </button>
              </div>
            </div>

            <div className="p-4 bg-[#181818] border border-[#292929] rounded-xl space-y-1">
              <span className="text-[#777777] uppercase font-bold text-[10px]">
                Cloud Synchronization
              </span>
              <p className="text-[#B3B3B3]">
                Watch history and My List entries are synchronized in local persistent state.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: PREFERENCES */}
        {activeTab === 'preferences' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 bg-[#181818] border border-[#292929] rounded-lg">
              <div>
                <span className="font-semibold text-white block">Autoplay Previews</span>
                <span className="text-[#777777]">Play video trailers in hero & carousels</span>
              </div>
              <input
                type="checkbox"
                checked={user.preferences.autoplayPreviews}
                onChange={(e) =>
                  onUpdateUser({
                    preferences: {
                      ...user.preferences,
                      autoplayPreviews: e.target.checked
                    }
                  })
                }
                className="w-4 h-4 accent-[#E50914] cursor-pointer"
              />
            </div>

            <div className="p-3 bg-[#181818] border border-[#292929] rounded-lg space-y-1">
              <span className="font-semibold text-white block">Default Subtitle Track</span>
              <select
                value={user.preferences.subtitleLanguage}
                onChange={(e) =>
                  onUpdateUser({
                    preferences: {
                      ...user.preferences,
                      subtitleLanguage: e.target.value
                    }
                  })
                }
                className="w-full px-2.5 py-1.5 bg-[#111111] border border-[#292929] rounded text-white text-xs mt-1"
              >
                <option value="en">English [CC]</option>
                <option value="ko">Korean</option>
                <option value="ja">Japanese</option>
                <option value="es">Spanish</option>
                <option value="off">Off by default</option>
              </select>
            </div>
          </div>
        )}

        {/* TAB 3: DEMO ACCOUNT SWITCHER */}
        {activeTab === 'profiles_switch' && (
          <div className="space-y-2 text-xs">
            <p className="text-[#777777] mb-2">
              Select a pre-configured Cinephile profile for instant testing:
            </p>
            {demoAccounts.map((acc) => (
              <button
                key={acc.email}
                onClick={() => {
                  onUpdateUser({
                    name: acc.name,
                    email: acc.email,
                    subscriptionTier: acc.tier
                  });
                  onClose();
                }}
                className={`w-full p-3 rounded-lg border text-left flex items-center justify-between transition-all ${
                  user.email === acc.email
                    ? 'bg-[#181818] border-[#E50914]'
                    : 'bg-[#181818]/60 border-[#292929] hover:border-[#555]'
                }`}
              >
                <div>
                  <div className="font-bold text-white text-sm">{acc.name}</div>
                  <div className="text-[#777777] text-[11px]">{acc.role}</div>
                </div>
                {user.email === acc.email && (
                  <Check className="w-4 h-4 text-[#E50914]" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
