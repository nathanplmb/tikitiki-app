import React, { useState } from 'react';
import { User, Bell, ShoppingBag, Sparkles, SlidersHorizontal, Check } from 'lucide-react';
import { sounds } from '../utils/audio';

interface HeaderProps {
  onSurpriseMe: () => void;
  onOpenRoulette: () => void;
  onOpenShopping: () => void;
  onOpenParty?: () => void;
  shoppingCount: number;
  isLoadingSurprise?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onSurpriseMe,
  onOpenRoulette,
  onOpenShopping,
  onOpenParty,
  shoppingCount,
  isLoadingSurprise,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 w-full px-4 pt-3 pb-2 transition-all">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {/* Left: User circular profile button */}
          <button
            onClick={() => {
              sounds.playTap();
              setShowProfile(true);
            }}
            className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 backdrop-blur-xl flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-sm"
            aria-label="Profil utilisateur"
          >
            <User className="w-4 h-4 stroke-[1.8]" />
          </button>

          {/* Center: Brand Name with wide tracked letters matching mockup */}
          <div className="flex flex-col items-center">
            <span className="font-display font-bold text-sm tracking-[0.28em] text-white pl-[0.28em]">
              TIKITIKI
            </span>
          </div>

          {/* Right: Bell Notification Icon */}
          <button
            onClick={() => {
              sounds.playTap();
              setShowNotifications(true);
            }}
            className="relative w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 backdrop-blur-xl flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-sm"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 stroke-[1.8]" />
            {/* Notification Dot */}
            <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-rose-500 ring-2 ring-[#0A0C14]" />
          </button>
        </div>
      </header>

      {/* Notifications Drawer / Popover */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 pt-16">
          <div className="fixed inset-0" onClick={() => setShowNotifications(false)} />
          <div className="relative w-full max-w-sm rounded-3xl glass-panel-overlay border border-white/10 p-5 space-y-4 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-purple-300" />
                <h3 className="font-display font-semibold text-sm text-white">Notifications TikiTiki</h3>
              </div>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-full bg-white/5"
              >
                Fermer
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/5 space-y-1">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span>Cocktail du jour : Black Velvet</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Découvrez l’harmonie parfaite entre mûre sauvage, cassis et effervescence raffinée.
                </p>
              </div>

              {shoppingCount > 0 && (
                <div 
                  onClick={() => {
                    setShowNotifications(false);
                    onOpenShopping();
                  }}
                  className="cursor-pointer p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1 hover:bg-emerald-500/15 transition-all"
                >
                  <div className="font-semibold text-emerald-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{shoppingCount} ingrédient{shoppingCount > 1 ? 's' : ''} à acheter</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">Voir le panier →</span>
                  </div>
                  <p className="text-emerald-200/80 text-[11px]">
                    Votre liste de courses pour vos cocktails favoris est prête.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-white/5 flex justify-end">
              <button
                onClick={() => {
                  sounds.playTap();
                  setShowNotifications(false);
                  onSurpriseMe();
                }}
                className="w-full py-2.5 rounded-full text-xs font-semibold btn-mockup-gradient text-white flex items-center justify-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tester une création surprise</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Drawer */}
      {showProfile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 pt-16">
          <div className="fixed inset-0" onClick={() => setShowProfile(false)} />
          <div className="relative w-full max-w-sm rounded-3xl glass-panel-overlay border border-white/10 p-5 space-y-4 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
                  TT
                </div>
                <div>
                  <h3 className="font-display font-semibold text-sm text-white">Profil Mixologiste</h3>
                  <p className="text-[10px] text-slate-400">Atelier Privé · Édition Sommelier</p>
                </div>
              </div>
              <button
                onClick={() => setShowProfile(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-full bg-white/5"
              >
                Fermer
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/5 flex items-center justify-between">
                <span className="text-slate-300">Niveau d'expertise</span>
                <span className="font-semibold text-white px-2 py-0.5 rounded-full bg-white/10 text-[11px]">
                  Amateur Éclairé
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/5 flex items-center justify-between">
                <span className="text-slate-300">Moteur d'intelligence</span>
                <span className="font-mono text-[11px] text-purple-300">Gemini 3.8 Flash</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/5 flex items-center justify-between">
                <span className="text-slate-300">Langue de formulation</span>
                <span className="font-medium text-white">Français (FR)</span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/5">
              <p className="text-[10px] text-center text-slate-400 italic">
                « Mix your taste. Discover your signature. »
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
