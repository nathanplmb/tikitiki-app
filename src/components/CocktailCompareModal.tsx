import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Scale, Clock, ArrowRight, Wine } from 'lucide-react';
import { CocktailRecipe } from '../types/cocktail';
import { sounds } from '../utils/audio';

interface CocktailCompareModalProps {
  cocktails: [CocktailRecipe, CocktailRecipe] | null;
  onClose: () => void;
  onSelectCocktail: (cocktail: CocktailRecipe) => void;
}

export const CocktailCompareModal: React.FC<CocktailCompareModalProps> = ({
  cocktails,
  onClose,
  onSelectCocktail,
}) => {
  const [failedImgs, setFailedImgs] = useState<Record<string, boolean>>({});

  return (
    <AnimatePresence>
      {cocktails && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6">
          <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl glass-panel border border-white/10 p-5 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.8)] z-10 space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/[0.08] border border-white/10 flex items-center justify-center">
                <Scale className="w-4 h-4 text-slate-200" />
              </div>
              <div>
                <h2 className="font-display font-bold text-xl text-white">
                  Comparateur de Créations
                </h2>
                <p className="text-xs text-slate-400">
                  Comparez les dosages, le taux estimé et l’équilibre aromatique côte à côte.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Grid Side-by-Side Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
            {cocktails.map((c: CocktailRecipe) => {
              const isBroken = failedImgs[c.id] || !c.imageUrl;
              return (
                <div key={c.id} className="space-y-4 p-4 rounded-2xl glass-panel-subtle border border-white/5">
                  <div className="relative rounded-2xl overflow-hidden aspect-[16/10] bg-black/40 border border-white/10">
                    {!isBroken ? (
                      <img 
                        src={c.imageUrl} 
                        alt={c.name} 
                        referrerPolicy="no-referrer"
                        onError={() => setFailedImgs((prev) => ({ ...prev, [c.id]: true }))}
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-purple-950/60 via-[#0A0C14] to-black flex items-center justify-center">
                        <Wine className="w-12 h-12 text-white/30" />
                      </div>
                    )}
                    <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-black/70 backdrop-blur-md text-purple-300 uppercase border border-white/10">
                      {c.type}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-display font-bold text-lg text-white">
                      {c.name}
                    </h3>
                    <p className="text-xs text-slate-400 italic mt-0.5 line-clamp-1">
                      « {c.tagline} »
                    </p>
                  </div>

                  {/* Unboxed Metrics */}
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Temps :</span>
                      <span className="text-white font-bold">{c.prepTimeMinutes} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Ingrédients :</span>
                      <span className="text-white font-bold">{c.distinctIngredientsCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Alcool estimé :</span>
                      <span className="text-purple-300 font-bold">{c.alcoholEstimate}</span>
                    </div>
                  </div>

                  {/* Taste Bars */}
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2 text-xs">
                    <div className="text-[10px] font-mono uppercase text-slate-400">
                      Équilibre gustatif
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                        <span>Fruité</span>
                        <span className="text-slate-200">{c.tasteProfile.fruitiness}/5</span>
                      </div>
                      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-400 rounded-full"
                          style={{ width: `${(c.tasteProfile.fruitiness / 5) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                        <span>Douceur</span>
                        <span className="text-slate-200">{c.tasteProfile.sweetness}/5</span>
                      </div>
                      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-pink-400 rounded-full"
                          style={{ width: `${(c.tasteProfile.sweetness / 5) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                        <span>Originalité</span>
                        <span className="text-slate-200">{c.tasteProfile.originality}/5</span>
                      </div>
                      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${(c.tasteProfile.originality / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Ingrédients list */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-mono uppercase text-slate-400">
                      Composition :
                    </div>
                    <ul className="text-xs text-slate-300 space-y-1">
                      {c.ingredients.map((ing, idx) => (
                        <li key={idx} className="flex justify-between p-2 rounded-lg bg-white/[0.03]">
                          <span className="truncate pr-1">{ing.name}</span>
                          <span className="font-mono text-slate-200 font-semibold shrink-0">{ing.amount}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      sounds.playGlassClink();
                      onClose();
                      onSelectCocktail(c);
                    }}
                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-white text-slate-950 hover:bg-slate-100 flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-[0.98]"
                  >
                    <span>Choisir cette recette</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};
