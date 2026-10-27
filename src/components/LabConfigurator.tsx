import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ClipboardList, 
  Search, 
  Sparkles, 
  Wine, 
  Leaf, 
  Flame, 
  Cake, 
  GlassWater,
  Check,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { CreationConfig, UserBarItem } from '../types/cocktail';
import { 
  ALCOHOL_BASES, 
  MIXERS, 
  AROMATICS, 
  FLAVOR_PROFILES 
} from '../data/ingredients';
import { sounds } from '../utils/audio';
import { Cocktail3DViewer } from './Cocktail3DViewer';

interface LabConfiguratorProps {
  onGenerate: (config: CreationConfig) => void;
  isGenerating: boolean;
  userBar: UserBarItem[];
  initialConfig?: Partial<CreationConfig>;
  onBack?: () => void;
}

export const LabConfigurator: React.FC<LabConfiguratorProps> = ({
  onGenerate,
  isGenerating,
  userBar,
  initialConfig,
  onBack,
}) => {
  // Screen 2 Segment Tab: Créer | Personnaliser | Surprise
  const [activeSegment, setActiveSegment] = useState<'create' | 'custom' | 'surprise'>('create');

  // Cocktail Type selection (5 categories matching mockup)
  const [selectedType, setSelectedType] = useState<string>('Fruité');

  // Spirits selection on bottle shelf
  const [selectedBottles, setSelectedBottles] = useState<string[]>(
    initialConfig?.selectedBases || ['Vodka']
  );

  // Search input for ingredients
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAllIngredientsModal, setShowAllIngredientsModal] = useState<boolean>(false);

  // 3D Live Glassware preview toggle
  const [show3DPreview, setShow3DPreview] = useState<boolean>(false);

  // 3 Gradient Sliders values
  const [sweetness, setSweetness] = useState<number>(initialConfig?.sweetness || 3);
  const [fruitiness, setFruitiness] = useState<number>(initialConfig?.fruitiness || 4);
  const [originality, setOriginality] = useState<number>(initialConfig?.originality || 3);

  // Extra selections (for full mixology logic)
  const [isMocktailMode, setIsMocktailMode] = useState<boolean>(initialConfig?.isMocktailMode || false);
  const [selectedMixers, setSelectedMixers] = useState<string[]>(
    initialConfig?.selectedMixers || ['Eau pétillante', 'Jus de fruit de la passion']
  );
  const [selectedAromatics, setSelectedAromatics] = useState<string[]>(
    initialConfig?.selectedAromatics || ['Sirop de vanille', 'Citron vert']
  );
  const [freeIntent, setFreeIntent] = useState<string>(initialConfig?.freeIntent || '');

  // 5 Main Types matching mockup
  const cocktailTypes = [
    { id: 'Classique', label: 'Classique', icon: GlassWater },
    { id: 'Fruité', label: 'Fruité', icon: Wine, isFruit: true },
    { id: 'Frais', label: 'Frais', icon: Leaf },
    { id: 'Gourmand', label: 'Gourmand', icon: Cake },
    { id: 'Épicé', label: 'Épicé', icon: Flame },
  ];

  // 5 Shelf Bottles matching mockup
  const shelfBottles = [
    {
      id: 'Rhum',
      name: 'Rhum',
      color: '#D97706',
      liquidColor: 'from-amber-600 to-amber-900',
      bottleHeight: 'h-14',
      badge: 'Ambré',
    },
    {
      id: 'Vodka',
      name: 'Vodka',
      color: '#94A3B8',
      liquidColor: 'from-slate-200 to-slate-400',
      bottleHeight: 'h-16',
      badge: 'Pure',
    },
    {
      id: 'Gin',
      name: 'Gin',
      color: '#10B981',
      liquidColor: 'from-emerald-700 to-emerald-950',
      bottleHeight: 'h-15',
      badge: 'Botanique',
    },
    {
      id: 'Tequila',
      name: 'Tequila',
      color: '#F59E0B',
      liquidColor: 'from-yellow-500 to-amber-700',
      bottleHeight: 'h-13',
      badge: 'Agave',
    },
    {
      id: 'Whisky',
      name: 'Whisky',
      color: '#B45309',
      liquidColor: 'from-amber-700 to-amber-950',
      bottleHeight: 'h-15',
      badge: 'Fumé',
    },
  ];

  const toggleBottle = (bottleName: string) => {
    sounds.playTap();
    if (selectedBottles.includes(bottleName)) {
      if (selectedBottles.length > 1) {
        setSelectedBottles(selectedBottles.filter((b) => b !== bottleName));
      }
    } else {
      setSelectedBottles([...selectedBottles, bottleName]);
    }
  };

  const handleLaunchCreation = () => {
    sounds.playGlassClink();
    const config: CreationConfig = {
      freeIntent: freeIntent.trim() || undefined,
      isMocktailMode,
      selectedBases: isMocktailMode ? [] : selectedBottles,
      singleBottleOnly: selectedBottles.length === 1,
      selectedMixers: selectedMixers.length > 0 ? selectedMixers : ['Eau pétillante'],
      selectedAromatics: selectedAromatics,
      profileName: `${selectedType} et équilibré`,
      fruitiness,
      sweetness,
      originality,
      crowdPleaser: true,
      servings: 1,
      advancedFilters: {
        budgetLimit: 'low',
        servings: 1,
        maxBottlesToCarry: 1,
        useBarOnly: false,
        prepTimeMax: 5,
        frenchSupermarketOnly: true,
        noSyrup: false,
        noFreshFruits: false,
        noEnergyDrinks: true,
      },
    };
    onGenerate(config);
  };

  return (
    <div className="space-y-5 pb-28 pt-1 max-w-md mx-auto">
      {/* Header, segments and title now live in the Labo page; free intent & mocktail stay in « Voir tout ». */}
      {/* =========================================================================
          TYPE DE COCKTAIL (5 ICON CARDS) MATCHING MOCKUP
          ========================================================================= */}
      <div className="space-y-2.5">
        <label className="text-xs font-medium text-slate-300 px-1 block">
          Type de cocktail
        </label>

        <div className="grid grid-cols-5 gap-2">
          {cocktailTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => {
                  sounds.playTap();
                  setSelectedType(type.id);
                }}
                className={`flex flex-col items-center justify-center py-3 px-1 rounded-2xl border transition-all duration-200 ${
                  isSelected
                    ? 'bg-gradient-to-b from-[#6A164E]/70 to-[#3C0F32]/80 border-pink-500/50 shadow-[0_0_18px_rgba(219,39,119,0.3)] text-white'
                    : 'bg-[#12141F]/80 hover:bg-[#181B2A] border-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                {type.isFruit ? (
                  /* Two glowing berries icon matching mockup */
                  <div className="w-6 h-6 flex items-center justify-center relative">
                    <span className="w-3.5 h-3.5 rounded-full bg-pink-400 ring-2 ring-pink-300/30 -mr-1" />
                    <span className="w-3 h-3 rounded-full bg-purple-400 ring-2 ring-purple-300/30" />
                  </div>
                ) : (
                  <Icon className={`w-5 h-5 mb-1 ${isSelected ? 'text-pink-200' : 'text-slate-400'}`} />
                )}
                <span className="text-[10px] mt-1 font-medium truncate w-full text-center">
                  {type.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          INGRÉDIENTS PRINCIPAUX (SEARCH + BOTTLE SHELF) MATCHING MOCKUP
          ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <label className="text-xs font-medium text-slate-300">
            Ingrédients principaux
          </label>
          <button
            onClick={() => {
              sounds.playTap();
              setShowAllIngredientsModal(true);
            }}
            className="text-[11px] text-slate-400 hover:text-white transition-colors"
          >
            Voir tout
          </button>
        </div>


        {/* Bottle Shelf matching mockup */}
        <div className="p-3.5 rounded-2xl bg-[#0D0F18]/90 border border-white/5 backdrop-blur-xl relative overflow-hidden">
          {/* Subtle bottle shelf glass reflection bar */}
          <div className="grid grid-cols-5 gap-2 items-end pt-2 pb-1">
            {shelfBottles.map((bottle) => {
              const isSelected = selectedBottles.includes(bottle.name);
              return (
                <div
                  key={bottle.id}
                  onClick={() => toggleBottle(bottle.name)}
                  className={`group cursor-pointer flex flex-col items-center justify-end rounded-xl p-2 transition-all duration-300 ${
                    isSelected
                      ? 'bg-white/[0.08] ring-1 ring-white/30 shadow-lg'
                      : 'hover:bg-white/[0.03]'
                  }`}
                >
                  {/* Photorealistic Bottle Silhouette */}
                  <div className="relative flex flex-col items-center justify-end h-20 w-full mb-1">
                    {/* Bottle Cap */}
                    <div className="w-2 h-2.5 rounded-t-sm bg-amber-200/80 border border-white/20 shadow-sm" />
                    {/* Bottle Neck */}
                    <div className="w-2.5 h-4 bg-white/20 border-x border-white/10" />
                    {/* Bottle Body with Liquid Gradient */}
                    <div className={`w-8 ${bottle.bottleHeight} rounded-t-md rounded-b-lg bg-gradient-to-t ${bottle.liquidColor} border border-white/20 relative overflow-hidden shadow-md flex items-center justify-center`}>
                      {/* Glass specular sheen */}
                      <div className="absolute top-1 left-1 bottom-1 w-1 bg-white/30 rounded-full blur-[0.5px]" />
                      {/* Label on bottle */}
                      <div className="w-5 h-4 rounded-sm bg-white/90 text-[7px] font-bold text-slate-900 flex items-center justify-center tracking-tighter uppercase font-mono shadow-xs">
                        {bottle.name.slice(0, 3)}
                      </div>
                    </div>

                    {/* Active check indicator */}
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px] font-bold shadow-md">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  <span className={`text-[11px] font-medium mt-1 truncate ${isSelected ? 'text-white font-semibold' : 'text-slate-400 group-hover:text-slate-200'}`}>
                    {bottle.name}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Glass shelf baseline */}
          <div className="h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full mt-1" />
        </div>
      </div>

      {/* =========================================================================
          3 CONTINUOUS GRADIENT SLIDERS MATCHING MOCKUP
          ========================================================================= */}
      <div className="space-y-4 pt-1">
        {/* Slider 1: Niveau de douceur (Sec -> Très sucré) */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-slate-300">
            Niveau de douceur
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-400 w-12 text-left">Sec</span>
            <div className="flex-1">
              <input
                type="range"
                min="1"
                max="5"
                step="0.1"
                value={sweetness}
                onChange={(e) => setSweetness(parseFloat(e.target.value))}
                className="w-full slider-pink cursor-pointer"
              />
            </div>
            <span className="text-[10px] text-slate-400 w-16 text-right">Très sucré</span>
          </div>
        </div>

        {/* Slider 2: Intensité fruitée (Léger -> Très fruité) */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-slate-300">
            Intensité fruitée
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-400 w-12 text-left">Léger</span>
            <div className="flex-1">
              <input
                type="range"
                min="1"
                max="5"
                step="0.1"
                value={fruitiness}
                onChange={(e) => setFruitiness(parseFloat(e.target.value))}
                className="w-full slider-green cursor-pointer"
              />
            </div>
            <span className="text-[10px] text-slate-400 w-16 text-right">Très fruité</span>
          </div>
        </div>

        {/* Slider 3: Niveau d'originalité (Classique -> Audacieux) */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-slate-300">
            Niveau d'originalité
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-400 w-12 text-left">Classique</span>
            <div className="flex-1">
              <input
                type="range"
                min="1"
                max="5"
                step="0.1"
                value={originality}
                onChange={(e) => setOriginality(parseFloat(e.target.value))}
                className="w-full slider-blue cursor-pointer"
              />
            </div>
            <span className="text-[10px] text-slate-400 w-16 text-right">Audacieux</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          LIVE 3D COCKTAIL SIMULATOR PREVIEW
          ========================================================================= */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => {
            sounds.playTap();
            setShow3DPreview(!show3DPreview);
          }}
          className="w-full py-2.5 px-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 flex items-center justify-between text-xs text-slate-300 transition-all active:scale-[0.99] group shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-500/20 via-pink-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 group-hover:border-pink-500/30 transition-colors">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            </div>
            <div className="text-left">
              <div className="text-xs font-medium text-white flex items-center gap-1.5">
                <span>Studio 3D interactif</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 font-mono">
                  WebGL
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                {selectedBottles[0] || 'Vodka'} · Verre, glaçons & physique en temps réel
              </div>
            </div>
          </div>
          <span className="text-[11px] text-purple-300 font-medium px-2 py-1 rounded-lg bg-white/5 border border-white/10">
            {show3DPreview ? 'Masquer' : 'Explorer'}
          </span>
        </button>

        {show3DPreview && (
          <div className="mt-3 animate-in fade-in zoom-in-95 duration-200">
            <Cocktail3DViewer
              colorTheme={
                selectedType === 'Fruité'
                  ? 'tropical'
                  : selectedType === 'Frais'
                  ? 'citrus-fresh'
                  : selectedType === 'Gourmand'
                  ? 'spiced-warm'
                  : selectedType === 'Épicé'
                  ? 'dark-berry'
                  : 'tropical'
              }
              spiritBase={selectedBottles[0] || 'Vodka'}
              sweetness={sweetness}
              fruitiness={fruitiness}
              heightClass="h-[280px]"
            />
          </div>
        )}
      </div>

      {/* =========================================================================
          SIGNATURE CTA BUTTON: CRÉER AVEC L'IA MATCHING MOCKUP
          ========================================================================= */}
      <div className="pt-2">
        <button
          onClick={handleLaunchCreation}
          disabled={isGenerating}
          className="w-full py-4 rounded-full text-sm font-semibold text-white btn-mockup-gradient flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95 shadow-xl"
        >
          <Sparkles className={`w-4 h-4 text-white ${isGenerating ? 'animate-spin' : ''}`} />
          <span>{isGenerating ? 'Création en cours...' : 'Créer avec l\'IA'}</span>
        </button>
      </div>

      {/* =========================================================================
          ALL INGREDIENTS / FULL CUSTOMIZATION MODAL (WHEN CLICKING VOIR TOUT)
          ========================================================================= */}
      {showAllIngredientsModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0" onClick={() => setShowAllIngredientsModal(false)} />
          <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl glass-panel-overlay border border-white/10 p-5 space-y-4 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-serif text-lg text-white font-normal">
                Garde-manger complet du laboratoire
              </h3>
              <button
                onClick={() => setShowAllIngredientsModal(false)}
                className="p-1 rounded-full bg-white/10 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Free intent */}
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium">
                Consigne libre pour l'IA (optionnel) :
              </label>
              <input
                type="text"
                placeholder="Ex : « Très frais avec du romarin », « Inspiré de l'été italien »..."
                value={freeIntent}
                onChange={(e) => setFreeIntent(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            {/* Mocktail switch */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.04] border border-white/5">
              <div>
                <div className="text-xs font-semibold text-white">Mode 100% Mocktail (0.0% Alcool)</div>
                <div className="text-[10px] text-slate-400">Remplace l'alcool par des infusions et agrumes toniques.</div>
              </div>
              <input
                type="checkbox"
                checked={isMocktailMode}
                onChange={(e) => setIsMocktailMode(e.target.checked)}
                className="accent-pink-500 w-4 h-4 rounded cursor-pointer"
              />
            </div>

            {/* Diluants */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-slate-300">Diluants disponibles :</div>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                {MIXERS.map((m) => {
                  const isSel = selectedMixers.includes(m.name);
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        sounds.playTap();
                        setSelectedMixers(
                          isSel
                            ? selectedMixers.filter((x) => x !== m.name)
                            : [...selectedMixers, m.name]
                        );
                      }}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${
                        isSel
                          ? 'bg-pink-500/20 text-pink-200 border border-pink-500/40'
                          : 'bg-white/5 text-slate-300 border border-white/5 hover:border-white/20'
                      }`}
                    >
                      {m.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Aromatics */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-slate-300">Arômes & Garnitures :</div>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                {AROMATICS.map((a) => {
                  const isSel = selectedAromatics.includes(a.name);
                  return (
                    <button
                      key={a.id}
                      onClick={() => {
                        sounds.playTap();
                        setSelectedAromatics(
                          isSel
                            ? selectedAromatics.filter((x) => x !== a.name)
                            : [...selectedAromatics, a.name]
                        );
                      }}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${
                        isSel
                          ? 'bg-pink-500/20 text-pink-200 border border-pink-500/40'
                          : 'bg-white/5 text-slate-300 border border-white/5 hover:border-white/20'
                      }`}
                    >
                      {a.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setShowAllIngredientsModal(false)}
              className="w-full py-2.5 rounded-xl btn-mockup-gradient text-white text-xs font-semibold"
            >
              Valider les ingrédients
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
