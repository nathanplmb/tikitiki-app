import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Sparkles, BookOpen, ArrowRight } from 'lucide-react';
import { CocktailRecipe, CreationConfig } from '../types/cocktail';
import { buildRecipe } from '../catalog/build';
import { FLASH_CATALOG } from '../catalog/flash';
import { INGREDIENTS } from '../catalog/ingredients';
import { toCocktailRecipe, artFor } from '../catalog/adapter';
import { Glass } from '../catalog/types';
import { CocktailArt } from './CocktailArt';
import { setFocusColor } from '../utils/theme';
import { sounds } from '../utils/audio';

interface Props {
  onOpen: (c: CocktailRecipe) => void;
  onGenerate: (config: CreationConfig) => void;
  isGenerating: boolean;
  aiAvailable: boolean;
}

// Choices are catalog ingredient ids, so the result is a real, consistent recipe.
const SPIRITS = [
  { id: 'vodka', label: 'Vodka' },
  { id: 'white_rum', label: 'Rhum blanc' },
  { id: 'spiced_rum', label: 'Rhum épicé' },
  { id: 'coconut_rum', label: 'Rhum coco' },
  { id: 'gin', label: 'Gin' },
  { id: 'scotch', label: 'Whisky' },
  { id: 'tequila', label: 'Tequila' },
  { id: 'jagermeister', label: 'Jäger' },
  { id: 'creme_de_menthe', label: 'Get' },
] as const;

const SOFTS = [
  { id: 'energy_drink', label: 'Red Bull', color: '#f2c230' },
  { id: 'energy_drink_blue', label: 'Red Bull Myrtille', color: '#3c6bff' },
  { id: 'energy_drink_tropical', label: 'Red Bull Tropical', color: '#ffc21a' },
  { id: 'energy_drink_watermelon', label: 'Red Bull Pastèque', color: '#ff3b5c' },
  { id: 'citrus_soda', label: 'Schweppes Agrumes', color: '#ffd84a' },
  { id: 'cola', label: 'Coca', color: '#3c170a' },
  { id: 'lemon_soda', label: 'Sprite', color: '#e9f7e2' },
  { id: 'orange_soda', label: 'Orangina', color: '#ffa733' },
  { id: 'tropical_drink', label: 'Oasis Tropical', color: '#ff7a2f' },
  { id: 'iced_tea', label: 'Ice Tea Pêche', color: '#d78a2c' },
  { id: 'apple_juice', label: 'Jus de pomme', color: '#e8c45a' },
  { id: 'orange_juice', label: "Jus d'orange", color: '#ff9a1f' },
  { id: 'cranberry_juice', label: 'Cranberry', color: '#d6203f' },
  { id: 'pineapple_juice', label: 'Ananas', color: '#f5d34a' },
  { id: 'ginger_ale', label: 'Ginger ale', color: '#e3c27e' },
] as const;

const DOSES = [
  { cl: 4, label: 'Léger', note: '4 cl' },
  { cl: 5, label: 'Normal', note: '5 cl' },
  { cl: 6, label: 'Chargé', note: '6 cl' },
];

const FORMATS: { glass: Glass; label: string }[] = [
  { glass: 'bottle', label: 'Bouteille 50 cl' },
  { glass: 'solo', label: 'Gobelet' },
  { glass: 'highball', label: 'Verre' },
];

const SPARKLING = new Set(['energy_drink', 'energy_drink_blue', 'energy_drink_tropical', 'energy_drink_watermelon', 'citrus_soda', 'cola', 'lemon_soda', 'orange_soda', 'ginger_ale']);

const Pill: React.FC<{ on: boolean; onClick: () => void; children: React.ReactNode; dot?: string }> = ({ on, onClick, children, dot }) => (
  <motion.button whileTap={{ scale: 0.92 }} data-on={on} onClick={onClick} aria-pressed={on} className="tk-chip shrink-0 px-3 py-2 rounded-2xl text-[12px] font-bold flex items-center gap-1.5">
    {dot && <span className="w-2.5 h-2.5 rounded-full border border-white/30" style={{ background: dot }} />}
    {children}
  </motion.button>
);

/** Crackhead lab: build a flash from real ingredients, see it instantly, or ask the AI for a new one. */
export const CrackheadLab: React.FC<Props> = ({ onOpen, onGenerate, isGenerating, aiAvailable }) => {
  const [spirit, setSpirit] = useState<string>('vodka');
  const [soft, setSoft] = useState<string>('energy_drink');
  const [dose, setDose] = useState(5);
  const [glass, setGlass] = useState<Glass>('bottle');
  const [idea, setIdea] = useState('');

  const softDef = SOFTS.find((s) => s.id === soft)!;
  const spiritLabel = SPIRITS.find((s) => s.id === spirit)!.label;

  // Same spirit + soft already in the catalogue?
  const existing = useMemo(
    () => FLASH_CATALOG.find((r) => r.alcoholic && r.ingredients.some((i) => i.id === spirit) && r.ingredients.some((i) => i.id === soft) && r.ingredients.filter((i) => !i.optional).length <= 3),
    [spirit, soft]
  );

  const flash = useMemo(() => {
    const sparkling = SPARKLING.has(soft);
    const built = buildRecipe({
      id: `labo-${spirit}-${soft}-${dose}-${glass}`,
      name: `${spiritLabel} ${softDef.label}`,
      d: `Flash maison composé au Labo : ${dose} cl de ${INGREDIENTS[spirit].name.toLowerCase()} et ${INGREDIENTS[soft].name.toLowerCase()}.`,
      f: 'highball',
      t: sparkling ? 'doux,petillant' : 'fruite,doux',
      b: ({ vodka: 'vodka', white_rum: 'rum', spiced_rum: 'rum', coconut_rum: 'rum', gin: 'gin', scotch: 'whisky', tequila: 'tequila' } as const)[spirit as 'vodka'] ?? 'liqueur',
      g: glass,
      ice: glass === 'bottle' ? 'none' : 'cubes',
      m: sparkling ? 'build-top' : 'build',
      c: softDef.color,
      sw: 4,
      st: dose >= 6 ? 3 : 2,
      ing: `${spirit}:${dose} ${soft}:${sparkling ? 'top' : '12'}`,
      p: 't',
    });
    return { ...toCocktailRecipe(built), id: built.id, catalogId: undefined, source: 'user_custom' as const, provenanceLabel: 'Composé dans le Labo Crackhead' };
  }, [spirit, soft, dose, glass]);

  useEffect(() => setFocusColor(softDef.color, 4), [softDef.color]);

  const askAi = () => {
    sounds.playGlassClink();
    onGenerate({
      freeIntent: `Flash de pré-soirée style épicerie de nuit, simple, 2 à 3 ingrédients faciles à trouver, servi en bouteille de 50 cl. ${idea}`.trim(),
      isMocktailMode: false,
      selectedBases: [INGREDIENTS[spirit].name],
      singleBottleOnly: true,
      selectedMixers: [INGREDIENTS[soft].name],
      selectedAromatics: [],
      profileName: 'Flash de soirée, sucré et efficace',
      fruitiness: 3,
      sweetness: 4,
      originality: 4,
      crowdPleaser: true,
      servings: 1,
      advancedFilters: { budgetLimit: 'low', servings: 1, maxBottlesToCarry: 2, useBarOnly: false, prepTimeMax: 2, frenchSupermarketOnly: true, noSyrup: false, noFreshFruits: true, noEnergyDrinks: false },
    });
  };

  return (
    <div className="space-y-6">
      {/* live preview */}
      <section className="tk-glass rounded-[28px] p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,color-mix(in_srgb,var(--accent)_35%,transparent),transparent_65%)]" />
        <div className="relative flex items-center gap-4">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div key={`${soft}-${glass}`} initial={{ rotateY: -90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} exit={{ rotateY: 90, opacity: 0 }} transition={{ type: 'spring', stiffness: 160, damping: 16 }} className="w-[34%] shrink-0">
              <CocktailArt {...artFor(flash)} className="w-full tk-float drop-shadow-[0_0_30px_color-mix(in_srgb,var(--accent)_55%,transparent)]" />
            </motion.div>
          </AnimatePresence>
          <div className="flex-1 min-w-0">
            <div className="tk-mono text-[9px]">Ton flash</div>
            <div className="tk-display text-[30px] text-white leading-none mt-1">{flash.name}</div>
            <div className="text-[12px] text-white/65 mt-2">{dose} cl d'alcool · {FORMATS.find((f) => f.glass === glass)!.label}</div>
            <button onClick={() => { sounds.playTap(); onOpen(flash); }} className="tk-cta mt-3 h-10 px-4 rounded-xl text-[12px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
              Recette & étapes <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        {existing && (
          <button onClick={() => onOpen(toCocktailRecipe(existing))} className="relative mt-3 w-full text-left text-[12px] text-white/80 flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2">
            <BookOpen className="w-4 h-4 shrink-0" /> Déjà au catalogue : <b className="text-white">{existing.name}</b>
          </button>
        )}
      </section>

      <section className="space-y-2">
        <div className="tk-mono text-[9.5px]">1 · L'alcool</div>
        <div className="flex flex-wrap gap-1.5">{SPIRITS.map((s) => <Pill key={s.id} on={spirit === s.id} onClick={() => { sounds.playTap(); setSpirit(s.id); }}>{s.label}</Pill>)}</div>
      </section>

      <section className="space-y-2">
        <div className="tk-mono text-[9.5px]">2 · Le soft</div>
        <div className="flex flex-wrap gap-1.5">{SOFTS.map((s) => <Pill key={s.id} on={soft === s.id} dot={s.color} onClick={() => { sounds.playTap(); setSoft(s.id); }}>{s.label}</Pill>)}</div>
      </section>

      <section className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="tk-mono text-[9.5px]">3 · Dosage</div>
          <div className="flex flex-col gap-1.5">{DOSES.map((d) => <Pill key={d.cl} on={dose === d.cl} onClick={() => setDose(d.cl)}>{d.label} <span className="opacity-60">{d.note}</span></Pill>)}</div>
        </div>
        <div className="space-y-2">
          <div className="tk-mono text-[9.5px]">4 · Contenant</div>
          <div className="flex flex-col gap-1.5">{FORMATS.map((f) => <Pill key={f.glass} on={glass === f.glass} onClick={() => setGlass(f.glass)}>{f.label}</Pill>)}</div>
        </div>
      </section>

      {dose >= 6 && (
        <p className="text-[11.5px] text-white/60 px-1">Chargé = 6 cl, soit environ deux verres standard dans une seule bouteille. Bois de l'eau à côté.</p>
      )}

      {/* AI */}
      <section className="tk-glass rounded-[24px] p-4 space-y-3">
        <div className="flex items-center gap-2 text-[13px] font-extrabold uppercase tracking-wider text-white"><Zap className="w-4 h-4 text-[var(--accent)]" /> Inventer un flash avec l'IA</div>
        <input value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="Ex : un truc bleu, pas trop sucré, avec ce qu'il y a au Lidl…" aria-label="Idée pour l'IA"
          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-[13px] text-white placeholder:text-white/35 outline-none" />
        <button onClick={askAi} disabled={isGenerating || !aiAvailable} className="tk-cta w-full h-12 rounded-xl text-[13px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-40">
          <Sparkles className="w-4 h-4" /> {isGenerating ? 'Ça mélange…' : 'Lancer l’IA'}
        </button>
        {!aiAvailable && <p className="text-[11px] text-white/50">IA indisponible sur ce serveur (clé non configurée) : le générateur ci-dessus fonctionne sans elle.</p>}
      </section>
    </div>
  );
};
