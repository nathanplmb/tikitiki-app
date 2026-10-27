import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { Taste } from '../catalog/types';
import { TASTE_LABEL } from '../engine/text';
import { CocktailArt } from './CocktailArt';

interface Props {
  onDone: (r: { tastes: Taste[]; preferMocktails: boolean } | null) => void;
}

const PICKS: { t: Taste; c: string }[] = [
  { t: 'fruite', c: '#ff4f8b' }, { t: 'tropical', c: '#ffb547' }, { t: 'acidule', c: '#d4f25a' }, { t: 'amer', c: '#ff5a3c' },
  { t: 'petillant', c: '#7cd7ff' }, { t: 'herbace', c: '#3ee6a6' }, { t: 'cremeux', c: '#f4e3c8' }, { t: 'epice', c: '#ff6b6b' },
  { t: 'sec', c: '#c9c3b6' }, { t: 'fume', c: '#c8742f' }, { t: 'floral', c: '#b9a6ff' }, { t: 'cafe', c: '#8a5a34' },
];

/** Three-screen skippable tour. Answers seed the taste profile; nothing is mandatory. */
export const Onboarding: React.FC<Props> = ({ onDone }) => {
  const [step, setStep] = useState(0);
  const [tastes, setTastes] = useState<Taste[]>([]);
  const [mock, setMock] = useState(false);
  const color = PICKS.find((p) => p.t === tastes[tastes.length - 1])?.c ?? '#ff4f8b';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] bg-[#06060a] flex flex-col px-6 pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(env(safe-area-inset-bottom)+24px)] overflow-y-auto" style={{ ['--drink' as string]: color }}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,color-mix(in_srgb,var(--drink)_40%,transparent),transparent_60%)] transition-all duration-700" />
      <div className="relative flex justify-between items-center">
        <div className="flex gap-1.5">{[0, 1, 2].map((i) => <span key={i} className={`h-1 rounded-full transition-all ${i <= step ? 'w-8 bg-white' : 'w-4 bg-white/20'}`} />)}</div>
        <button onClick={() => onDone(null)} className="text-[13px] text-white/60">Passer</button>
      </div>
      <>
        <motion.div key={step} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="relative flex-1 flex flex-col">
          {step === 0 && (
            <div className="flex-1 flex flex-col justify-end">
              <div className="flex-1 flex items-center justify-center"><CocktailArt color={color} glass="coupe" sparkling garnish="cerise" className="w-[70%] max-w-[300px] tk-float" /></div>
              <h1 className="tk-display text-[64px] text-white">Tiki<span className="italic tk-gradient-text">Tiki</span></h1>
              <p className="text-[15px] text-white/70 mt-3 max-w-[30ch]">Plus de 200 recettes hors ligne, ton bar, et une IA pour inventer le reste.</p>
            </div>
          )}
          {step === 1 && (
            <div className="flex-1 pt-10">
              <h2 className="tk-display text-[44px] text-white">Tu aimes plutôt…</h2>
              <p className="text-[13px] text-white/55 mt-2">Choisis-en quelques-uns. Ça évoluera avec tes coups de cœur.</p>
              <div className="grid grid-cols-3 gap-2.5 mt-6">
                {PICKS.map((p, i) => {
                  const on = tastes.includes(p.t);
                  return (
                    <motion.button key={p.t} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: on ? 1.04 : 1 }} transition={{ delay: i * 0.03 }}
                      onClick={() => setTastes(on ? tastes.filter((x) => x !== p.t) : [...tastes, p.t])} aria-pressed={on}
                      className="h-20 rounded-[22px] border text-[13px] font-bold transition-colors"
                      style={{ background: on ? p.c : `${p.c}14`, color: on ? '#0b0b10' : '#fff', borderColor: on ? p.c : 'rgba(255,255,255,0.1)', boxShadow: on ? `0 10px 30px -8px ${p.c}` : 'none' }}>
                      {TASTE_LABEL[p.t]}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="flex-1 pt-10 space-y-3">
              <h2 className="tk-display text-[44px] text-white">Avec ou sans alcool ?</h2>
              {[{ v: false, l: 'Les deux me vont' }, { v: true, l: 'Plutôt sans alcool' }].map((o) => (
                <button key={String(o.v)} onClick={() => setMock(o.v)} className={`w-full h-16 rounded-[22px] text-left px-5 text-[15px] font-semibold border ${mock === o.v ? 'bg-white text-[#0b0b10] border-white' : 'tk-glass text-white'}`}>{o.l}</button>
              ))}
              <p className="text-[12px] text-white/45 pt-2">Aucun compte requis. Tes données restent sur cet appareil.</p>
            </div>
          )}
        </motion.div>
      </>
      <motion.button whileTap={{ scale: 0.96 }} onClick={() => (step < 2 ? setStep(step + 1) : onDone({ tastes, preferMocktails: mock }))}
        className="relative tk-cta h-14 rounded-full text-[15px] font-bold text-white flex items-center justify-center gap-2 mt-6">
        {step < 2 ? 'Continuer' : 'Entrer dans le bar'} <ArrowRight className="w-4.5 h-4.5" />
      </motion.button>
    </motion.div>
  );
};
