import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { CocktailArt } from './CocktailArt';

export type GenStage = 'idle' | 'preparing' | 'assembling' | 'mixing' | 'reveal';

const STAGES: { key: Exclude<GenStage, 'idle'>; title: string; detail: string }[] = [
  { key: 'preparing', title: 'Préparation', detail: 'Lecture de tes critères et des recettes proches du catalogue.' },
  { key: 'assembling', title: 'Assemblage', detail: 'Requête envoyée à l’IA — en attente de sa réponse.' },
  { key: 'mixing', title: 'Mélange', detail: 'Réponse reçue : vérification des contraintes et des doublons.' },
  { key: 'reveal', title: 'Révélation', detail: 'Tes créations sont prêtes.' },
];

interface Props {
  stage: GenStage;
  color?: string;
  onCancel?: () => void;
  // legacy prop kept for compatibility
  isGenerating?: boolean;
}

/** Generation ritual. Each step reflects a real state of the request; no fake percentage. */
export const NeonLiquidShaker: React.FC<Props> = ({ stage, color = '#ff4f8b', onCancel }) => {
  const idx = STAGES.findIndex((s) => s.key === stage);
  const fill = [0.2, 0.45, 0.75, 1][Math.max(0, idx)];
  return (
    <AnimatePresence>
      {stage !== 'idle' && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.5 } }}
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-[#06060a]/90 backdrop-blur-2xl px-6"
          style={{ ['--drink' as string]: color }} role="status" aria-live="polite"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,color-mix(in_srgb,var(--drink)_35%,transparent),transparent_60%)]" />
          {onCancel && stage !== 'reveal' && (
            <button onClick={onCancel} aria-label="Annuler" className="absolute top-[calc(env(safe-area-inset-top)+16px)] right-4 tk-glass w-11 h-11 rounded-full flex items-center justify-center"><X className="w-5 h-5" /></button>
          )}
          <motion.div
            animate={stage === 'assembling' ? { rotate: [-8, 8, -8], y: [0, -10, 0] } : stage === 'reveal' ? { scale: [1, 1.12, 1], rotate: 0 } : { rotate: 0, y: 0 }}
            transition={stage === 'assembling' ? { repeat: Infinity, duration: 0.5 } : { duration: 0.6 }}
            className="relative w-[230px]"
          >
            <svg viewBox="0 0 200 260" className="absolute inset-0 w-full" aria-hidden>
              <defs><clipPath id="shk"><path d="M60 30 L140 30 L150 240 Q100 250 50 240 Z" /></clipPath></defs>
              <motion.rect clipPath="url(#shk)" x="0" width="200" height="260" fill={color} initial={{ y: 260 }} animate={{ y: 260 - fill * 220 }} transition={{ type: 'spring', stiffness: 40, damping: 12 }} opacity="0.85" />
              <path d="M60 30 L140 30 L150 240 Q100 250 50 240 Z" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.6)" strokeWidth="1.6" />
              <rect x="66" y="8" width="68" height="24" rx="8" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.5)" />
            </svg>
            {stage === 'reveal' ? <CocktailArt color={color} glass="coupe" sparkling className="w-full opacity-0" /> : <div className="w-full aspect-[200/260]" />}
          </motion.div>

          <div className="relative mt-10 w-full max-w-sm space-y-3">
            {STAGES.map((s, i) => (
              <motion.div key={s.key} initial={false} animate={{ opacity: i <= idx ? 1 : 0.3, x: i === idx ? 6 : 0 }} className="flex items-start gap-3">
                <span className={`mt-1 w-3 h-3 rounded-full shrink-0 ${i < idx ? 'bg-[var(--tk-ready)]' : i === idx ? 'bg-[var(--drink)] shadow-[0_0_14px_var(--drink)] animate-pulse' : 'bg-white/20'}`} />
                <div>
                  <div className="tk-display text-[26px] text-white leading-none">{s.title}</div>
                  {i === idx && <div className="text-[12px] text-white/60 mt-1">{s.detail}</div>}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
