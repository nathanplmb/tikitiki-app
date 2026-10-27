import React from 'react';
import { motion } from 'motion/react';
import { House, FlaskConical, Sparkle, Heart, PartyPopper, ShoppingCart } from 'lucide-react';

export type ActiveTab = 'home' | 'lab' | 'discoveries' | 'collection' | 'bar' | 'party';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  shoppingCount: number;
  onOpenShopping: () => void;
  favoritesCount: number;
}

const NAV = [
  { id: 'home' as ActiveTab, label: 'Accueil', icon: House },
  { id: 'lab' as ActiveTab, label: 'Labo', icon: FlaskConical },
  { id: 'discoveries' as ActiveTab, label: 'Découvrir', icon: Sparkle },
  { id: 'collection' as ActiveTab, label: 'Collection', icon: Heart },
  { id: 'party' as ActiveTab, label: 'Soirée', icon: PartyPopper },
];

/** Floating liquid-glass tab bar (mobile) and glass rail (desktop). */
export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, shoppingCount, onOpenShopping, favoritesCount }) => (
  <>
    {/* Desktop rail */}
    <aside className="hidden lg:flex flex-col w-64 fixed left-0 top-0 bottom-0 z-30 p-5 tk-glass-dark border-r border-white/5">
      <button onClick={() => setActiveTab('home')} className="tk-display text-4xl text-left tk-gradient-text mb-8 mt-2">TikiTiki</button>
      <nav className="space-y-1 flex-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const on = activeTab === item.id;
          return (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-colors ${on ? 'text-white' : 'text-white/55 hover:text-white'}`}>
              {on && <motion.span layoutId="rail-pill" className="absolute inset-0 rounded-2xl bg-white/10 border border-white/10" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
              <Icon className="w-4.5 h-4.5 relative" />
              <span className="relative">{item.label}</span>
              {item.id === 'collection' && favoritesCount > 0 && <span className="relative ml-auto text-[10px] tk-mono text-white/50">{favoritesCount}</span>}
            </button>
          );
        })}
      </nav>
      <button onClick={onOpenShopping} className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-white/70 hover:text-white bg-white/5 border border-white/10">
        <ShoppingCart className="w-4 h-4" /> Liste de courses
        {shoppingCount > 0 && <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-[var(--tk-accent)] text-white">{shoppingCount}</span>}
      </button>
    </aside>

    {/* Mobile floating bar: Liquid Glass capsule with a moving lens */}
    <div className="fixed bottom-0 inset-x-0 z-40 flex justify-center px-5 pb-[calc(env(safe-area-inset-bottom)+14px)] pointer-events-none lg:hidden">
      <nav aria-label="Navigation principale" className="tk-liquid pointer-events-auto w-full max-w-[400px] rounded-full p-1.5 flex items-center justify-between">
        {NAV.map((item) => {
          const Icon = item.icon;
          const on = activeTab === item.id;
          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.88 }}
              onClick={() => setActiveTab(item.id)}
              aria-current={on ? 'page' : undefined}
              aria-label={item.label}
              className="relative flex-1 h-[54px] flex flex-col items-center justify-center gap-0.5 rounded-full"
            >
              {on && <motion.span layoutId="tab-lens" className="tk-lens absolute inset-0 rounded-full" transition={{ type: 'spring', stiffness: 420, damping: 30, mass: 0.8 }} />}
              <Icon
                className={`relative w-[22px] h-[22px] transition-all duration-300 ${on ? 'text-white drop-shadow-[0_0_8px_var(--drink)]' : 'text-white/60'}`}
                strokeWidth={on ? 2 : 1.6}
                fill={on ? 'currentColor' : 'none'}
                fillOpacity={on ? 0.18 : 0}
              />
              <span className={`relative text-[9.5px] font-semibold tracking-tight transition-colors ${on ? 'text-white' : 'text-white/55'}`}>{item.label}</span>
              {item.id === 'collection' && favoritesCount > 0 && !on && <span className="absolute top-2.5 right-[30%] w-1.5 h-1.5 rounded-full bg-[var(--tk-accent)] shadow-[0_0_6px_var(--tk-accent)]" />}
            </motion.button>
          );
        })}
      </nav>
    </div>
  </>
);
