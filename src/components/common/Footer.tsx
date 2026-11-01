/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrandLogo } from './BrandLogo.tsx';
import { ShieldCheck, Film, Tv, Globe } from 'lucide-react';

interface FooterProps {
  onSelectTab: (tab: string) => void;
  onOpenPlans: () => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectTab,
  onOpenPlans,
  onOpenAdmin
}) => {
  return (
    <footer className="bg-[#080808] border-t border-[#292929] pt-16 pb-12 px-6 md:px-14 text-xs text-[#777777]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
        {/* Brand Col */}
        <div className="space-y-4 md:col-span-1">
          <BrandLogo size="lg" />
          <p className="text-xs text-[#B3B3B3] leading-relaxed">
            The definitive cinema streaming platform for international auteur films, restored
            classics, original television series, independent animation, and East Asian drama.
          </p>
          <div className="flex items-center gap-2 text-[#4ade80] text-[11px]">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Authorized CC-BY & Public Domain Masters</span>
          </div>
        </div>

        {/* Categories Col */}
        <div className="space-y-3">
          <h4 className="font-bold text-white text-sm uppercase tracking-wider">
            Discovery
          </h4>
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => onSelectTab('movies')}
                className="hover:text-white transition-colors"
              >
                Feature Films & Auteur Cinema
              </button>
            </li>
            <li>
              <button
                onClick={() => onSelectTab('series')}
                className="hover:text-white transition-colors"
              >
                Serialized Television & Mini-Series
              </button>
            </li>
            <li>
              <button
                onClick={() => onSelectTab('anime')}
                className="hover:text-white transition-colors"
              >
                Anime & International Animation
              </button>
            </li>
            <li>
              <button
                onClick={() => onSelectTab('asian_drama')}
                className="hover:text-white transition-colors"
              >
                Korean & Asian Dramas
              </button>
            </li>
            <li>
              <button
                onClick={() => onSelectTab('browse')}
                className="hover:text-white transition-colors"
              >
                Full Archive & Filters
              </button>
            </li>
          </ul>
        </div>

        {/* Platform & Technology */}
        <div className="space-y-3">
          <h4 className="font-bold text-white text-sm uppercase tracking-wider">
            Platform & Engine
          </h4>
          <ul className="space-y-2">
            <li>
              <button onClick={onOpenPlans} className="hover:text-white transition-colors">
                TEATRO VIP Pass & Memberships
              </button>
            </li>
            <li>
              <button onClick={onOpenAdmin} className="hover:text-white transition-colors">
                Content Management Studio (CMS)
              </button>
            </li>
            <li>
              <span className="text-[#A3A3A3]">Adaptive HLS & Byte-Range Streaming</span>
            </li>
            <li>
              <span className="text-[#A3A3A3]">Dolby Atmos & 4K UHD Direct Pipeline</span>
            </li>
          </ul>
        </div>

        {/* Rights, Compliance & Attribution */}
        <div className="space-y-3">
          <h4 className="font-bold text-white text-sm uppercase tracking-wider">
            Licensing & Compliance
          </h4>
          <p className="leading-relaxed">
            Content streamed on TEATRO conforms strictly to verified distribution rights: Creative
            Commons CC-BY 3.0 / CC-BY-SA 4.0 licenses (Blender Foundation, Open Movie Projects)
            and Public Domain Preservation Masters.
          </p>
          <p className="text-[11px] text-[#555555]">
            This product uses TMDB API specifications for extended catalog schema integration but is
            not endorsed or certified by TMDB.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-[#292929] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
        <div>
          © 2026 TEATRO Platforms Inc. All Rights Reserved. Built for high-fidelity cinema discovery.
        </div>
        <div className="flex gap-4">
          <span className="text-[#B3B3B3]">Privacy Policy</span>
          <span className="text-[#B3B3B3]">Terms of Service</span>
          <span className="text-[#B3B3B3]">Content Protection Notice</span>
        </div>
      </div>
    </footer>
  );
};
