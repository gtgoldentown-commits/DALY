/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Check, Sparkles, Shield, Monitor, Zap, HeartHandshake } from 'lucide-react';
import { SubscriptionTier } from '../../types/index.ts';

interface SubscriptionModalProps {
  currentTier: SubscriptionTier;
  onClose: () => void;
  onUpgradeTier: (tier: SubscriptionTier) => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  currentTier,
  onClose,
  onUpgradeTier
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const plans: {
    tier: SubscriptionTier;
    name: string;
    monthlyPrice: number;
    annualPrice: number;
    tagline: string;
    badge?: string;
    features: string[];
    highlight?: boolean;
  }[] = [
    {
      tier: 'free',
      name: 'Free Discovery',
      monthlyPrice: 0,
      annualPrice: 0,
      tagline: 'Public domain & Creative Commons cinema archive with community discovery.',
      features: [
        'Full public-domain classics catalogue',
        'Standard 1080p Full HD playback',
        '1 Device active stream',
        'Basic personal watchlist'
      ]
    },
    {
      tier: 'vip',
      name: 'Cinephile VIP',
      monthlyPrice: 9.99,
      annualPrice: 95.9,
      tagline: 'The uncompromising master-grade cinema experience for discerning viewers.',
      badge: 'MOST POPULAR',
      highlight: true,
      features: [
        'All Cinema & Series master editions',
        'Stunning 4K UHD with HDR10 & Dolby Vision',
        'Dolby Atmos & 5.1 Lossless Audio',
        '2 Simultaneous screens',
        'Zero advertisements or interruptions',
        'Exclusive festival premiere previews'
      ]
    },
    {
      tier: 'family',
      name: 'Teatro Patron & Family',
      monthlyPrice: 14.99,
      annualPrice: 143.9,
      tagline: 'Multi-screen cinema for the entire household plus direct support for film restoration.',
      badge: 'ARCHIVE PATRON',
      features: [
        'Everything included in Cinephile VIP',
        '4 Simultaneous streams',
        'Up to 5 custom family profiles & Kids safety mode',
        'Offline viewing simulation caching',
        'Direct 15% contribution to classic film restoration',
        'Early access to restored 4K physical-to-digital scans'
      ]
    }
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-[#111111] border border-[#292929] rounded-2xl overflow-hidden shadow-2xl p-6 sm:p-10 my-auto text-white animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-[#181818] hover:bg-[#E50914] text-white border border-[#292929] transition-colors"
          aria-label="Close subscription modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#E50914]/20 border border-[#E50914]/50 text-[#ff4d58] text-xs font-semibold uppercase tracking-wider rounded mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>TEATRO Membership Architecture</span>
          </div>
          <h2 className="font-cinzel text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
            Elevate Your Cinema Experience
          </h2>
          <p className="text-sm text-[#B3B3B3]">
            Support master restorations, unlock uncompressed 4K HDR streams, and experience cinema the way filmmakers intended.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-3 bg-[#181818] border border-[#292929] p-1 rounded-full mt-6">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-[#E50914] text-white shadow'
                  : 'text-[#B3B3B3] hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                billingCycle === 'annual'
                  ? 'bg-[#E50914] text-white shadow'
                  : 'text-[#B3B3B3] hover:text-white'
              }`}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] bg-[#ffd700] text-black px-1.5 py-0.2 rounded-full font-extrabold">
                SAVE 20%
              </span>
            </button>
          </div>
        </div>

        {/* Plan Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => {
            const isCurrent = currentTier === p.tier;
            const price = billingCycle === 'monthly' ? p.monthlyPrice : p.annualPrice;
            const period = billingCycle === 'monthly' ? '/mo' : '/yr';

            return (
              <div
                key={p.tier}
                className={`relative rounded-xl p-6 flex flex-col justify-between transition-all border ${
                  p.highlight
                    ? 'bg-gradient-to-b from-[#181818] to-[#121212] border-[#E50914] shadow-2xl scale-[1.02]'
                    : 'bg-[#181818]/60 border-[#292929] hover:border-[#444]'
                }`}
              >
                {p.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#E50914] text-white font-extrabold text-[10px] uppercase tracking-wider rounded-full shadow">
                    {p.badge}
                  </div>
                )}

                <div>
                  <h3 className="font-cinzel text-lg font-bold text-white mb-1">{p.name}</h3>
                  <p className="text-xs text-[#777777] mb-4 min-h-[32px]">{p.tagline}</p>

                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-3xl sm:text-4xl font-extrabold text-white">
                      ${price}
                    </span>
                    <span className="text-xs text-[#777777] font-semibold">{period}</span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-[#B3B3B3] mb-8">
                    {p.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-[#E50914] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full py-2.5 bg-[#292929] text-[#B3B3B3] text-xs font-bold rounded cursor-default border border-[#333]"
                    >
                      Active Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        onUpgradeTier(p.tier);
                        onClose();
                      }}
                      className={`w-full py-2.5 rounded text-xs font-bold transition-all ${
                        p.highlight
                          ? 'bg-[#E50914] hover:bg-[#b80710] text-white shadow-lg hover:scale-[1.02]'
                          : 'bg-[#292929] hover:bg-[#383838] text-white border border-[#444]'
                      }`}
                    >
                      Select {p.name}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Compliance & Payment Infrastructure Disclaimer */}
        <div className="mt-8 pt-6 border-t border-[#292929] text-center text-xs text-[#777777]">
          <p>
            Demonstration mode: Plan upgrades instantly activate features and simulated billing
            tokens in your active session. Ready for production Stripe or Chargebee webhook wiring.
          </p>
        </div>
      </div>
    </div>
  );
};
