import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  Heart, 
  MoreHorizontal, 
  ShoppingCart, 
  Clock, 
  Wine, 
  Check, 
  Sparkles, 
  Share2, 
  Timer, 
  Play, 
  Pause, 
  RotateCcw,
  Scale,
  Edit3,
  BookmarkCheck,
  Flame,
  Info
} from 'lucide-react';
import { CocktailRecipe } from '../types/cocktail';
import { sounds } from '../utils/audio';
import { Cocktail3DViewer } from './Lazy3D';
import { DrinkVisual, SourceBadge } from './ui';
import { artFor } from '../catalog/adapter';
import { TASTE_LABEL } from '../engine/text';
import { Star } from 'lucide-react';

const RATING_TAGS = ['Parfait', 'À refaire', 'Original', 'Coup de cœur', 'Trop sucré', 'Trop amer'];

interface CocktailDetailModalProps {
  cocktail: CocktailRecipe | null;
  onClose: () => void;
  onToggleFavorite: (cocktail: CocktailRecipe) => void;
  isFavorite: boolean;
  onAddToShoppingList: (cocktail: CocktailRecipe) => void;
  onSaveRating: (recipeId: string, rating: number, tags: string[], notes: string) => void;
  onRebalanceWithAI?: (cocktail: CocktailRecipe, tweak: string) => Promise<void>;
  onOpenCompare?: (cocktail: CocktailRecipe) => void;
}

export const CocktailDetailModal: React.FC<CocktailDetailModalProps> = ({
  cocktail,
  onClose,
  onToggleFavorite,
  isFavorite,
  onAddToShoppingList,
  onSaveRating,
  onRebalanceWithAI,
  onOpenCompare,
}) => {
  // Mode: Photo vs 3D Interactive Studio
  const [viewMode, setViewMode] = useState<'photo' | '3d'>('photo');

  // Active tab in Screen 3: Ingrédients | Préparation | Profil | Alternatives
  const [activeTab, setActiveTab] = useState<'ingredients' | 'prep' | 'profile' | 'alternatives'>('ingredients');
  const [servings, setServings] = useState<number>(1);
  const [checkedSteps, setCheckedSteps] = useState<number[]>([]);
  const [addedToCart, setAddedToCart] = useState<boolean>(false);
  const [showMoreMenu, setShowMoreMenu] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Timer
  const [timerDuration, setTimerDuration] = useState<number>(15);
  const [timeLeft, setTimeLeft] = useState<number>(15);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // AI Rebalance
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [rating, setRating] = useState<number>(0);
  const [ratingTags, setRatingTags] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [savedRating, setSavedRating] = useState<boolean>(false);
  const [rebalancePrompt, setRebalancePrompt] = useState<string>('');
  const [isRebalancing, setIsRebalancing] = useState<boolean>(false);

  useEffect(() => {
    if (cocktail?.timerSeconds) {
      setTimerDuration(cocktail.timerSeconds);
      setTimeLeft(cocktail.timerSeconds);
    } else {
      setTimerDuration(15);
      setTimeLeft(15);
    }
    setCheckedSteps([]);
    setServings(1);
    setRating(cocktail?.userRating ?? 0);
    setRatingTags(cocktail?.userTags ?? []);
    setNotes(cocktail?.userNotes ?? '');
    setSavedRating(false);
  }, [cocktail?.id]);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      sounds.playSuccessChime();
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const toggleTimer = () => {
    sounds.playTap();
    if (timeLeft === 0) setTimeLeft(timerDuration);
    setIsTimerRunning(!isTimerRunning);
  };

  const resetTimer = () => {
    sounds.playTap();
    setIsTimerRunning(false);
    setTimeLeft(timerDuration);
  };

  const handleToggleFavoriteClick = () => {
    if (!cocktail) return;
    sounds.playTap();
    onToggleFavorite(cocktail);
  };

  const handleShopping = () => {
    if (!cocktail) return;
    sounds.playTap();
    onAddToShoppingList(cocktail);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2200);
  };

  const handleShare = () => {
    if (!cocktail) return;
    sounds.playTap();
    if (navigator.share) {
      navigator.share({ title: cocktail.name, text: `${cocktail.name} sur TikiTiki`, url: window.location.href });
    } else {
      navigator.clipboard.writeText(`${cocktail.name} — ${cocktail.tagline}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleRebalanceSubmit = async () => {
    if (!cocktail || !rebalancePrompt.trim() || !onRebalanceWithAI) return;
    setIsRebalancing(true);
    sounds.playTap();
    try {
      await onRebalanceWithAI(cocktail, rebalancePrompt.trim());
      setIsEditing(false);
      setRebalancePrompt('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsRebalancing(false);
    }
  };

  // Helper for ingredient thumbnail visualization matching mockup
  const renderIngredientThumb = (name: string, category: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('rhum') || lower.includes('vodka') || lower.includes('gin') || lower.includes('bourbon') || category === 'alcool') {
      return (
        <div className="w-8 h-8 rounded-lg bg-amber-950/40 border border-amber-500/30 flex items-center justify-center shrink-0">
          <div className="w-3.5 h-6 rounded-xs bg-gradient-to-t from-amber-600 to-amber-300 relative shadow-xs flex items-center justify-center">
            <span className="w-1.5 h-1 bg-white/70 absolute top-0 rounded-xs" />
          </div>
        </div>
      );
    }
    if (lower.includes('passion') || lower.includes('fruit') || lower.includes('jus')) {
      return (
        <div className="w-8 h-8 rounded-lg bg-orange-950/40 border border-orange-500/30 flex items-center justify-center shrink-0">
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 ring-1 ring-orange-300/40 flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-100/90" />
          </div>
        </div>
      );
    }
    if (lower.includes('eau') || lower.includes('pétillante') || lower.includes('tonic') || category === 'diluant') {
      return (
        <div className="w-8 h-8 rounded-lg bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center shrink-0">
          <div className="w-3.5 h-6 rounded-xs bg-gradient-to-t from-cyan-600 to-sky-300 relative shadow-xs flex items-center justify-center">
            <span className="w-1.5 h-1 bg-white/70 absolute top-0 rounded-xs" />
          </div>
        </div>
      );
    }
    if (lower.includes('vanille') || lower.includes('sirop') || category === 'sirop') {
      return (
        <div className="w-8 h-8 rounded-lg bg-yellow-950/40 border border-yellow-500/30 flex items-center justify-center shrink-0">
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-200 to-amber-600 flex items-center justify-center">
            <span className="text-[9px] font-bold text-amber-950">V</span>
          </div>
        </div>
      );
    }
    // Glaçons
    return (
      <div className="w-8 h-8 rounded-lg bg-slate-800/60 border border-white/20 flex items-center justify-center shrink-0">
        <div className="w-4 h-4 rounded-xs bg-white/30 border border-white/50 rotate-12 shadow-xs" />
      </div>
    );
  };

  const scaleAmount = (amountStr: string, multiplier: number): string => {
    const match = amountStr.match(/^([\d.,]+)\s*(cl|ml|g|cuillère|tranche|quartier|feuille|trait)?(.*)$/i);
    if (!match) return amountStr;
    const num = parseFloat(match[1].replace(',', '.'));
    if (isNaN(num)) return amountStr;
    const scaled = (num * multiplier).toFixed(multiplier > 1 && (num * multiplier) % 1 !== 0 ? 1 : 0);
    const unit = match[2] || '';
    const rest = match[3] || '';
    return `${scaled} ${unit}${rest}`.trim();
  };

  return (
    <AnimatePresence>
      {cocktail && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-xl flex justify-center items-end sm:items-center p-0 sm:p-4">
          <div className="fixed inset-0" onClick={onClose} />

          <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          style={{ ['--drink' as string]: artFor(cocktail).color }}
          role="dialog" aria-modal="true" aria-label={cocktail.name}
          className="relative w-full max-w-md max-h-[96vh] overflow-y-auto rounded-t-[36px] sm:rounded-[36px] bg-[#0b0a10]/95 backdrop-blur-2xl border border-white/10 shadow-[0_-20px_80px_-20px_var(--drink)] z-10 flex flex-col"
        >
          {/* =========================================================================
              CINEMATIC PHOTOGRAPHY OR 3D INTERACTIVE STUDIO HEADER
              ========================================================================= */}
          <div className="relative aspect-[4/4.2] min-h-[340px] w-full overflow-hidden shrink-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,color-mix(in_srgb,var(--drink)_55%,transparent),transparent_65%)]" />
            {viewMode === 'photo' ? (
              <>
                <motion.div layoutId={`card-${cocktail.id}`} className="absolute inset-0 flex items-center justify-center pt-10">
                  <DrinkVisual c={cocktail} className={cocktail.imageUrl ? 'w-full h-full' : 'h-[88%] tk-float drop-shadow-[0_30px_50px_rgba(0,0,0,0.6)]'} />
                </motion.div>
                {/* Dramatic smooth bottom vignette fade into the card */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0a10] via-transparent to-transparent pointer-events-none" />
              </>
            ) : (
              <div className="w-full h-full">
                <Cocktail3DViewer
                  colorTheme={cocktail.tasteProfile?.colorTheme || 'tropical'}
                  cocktailName={cocktail.name}
                  initialGlass={cocktail.glassType}
                  sweetness={cocktail.tasteProfile?.sweetness}
                  fruitiness={cocktail.tasteProfile?.fruitiness}
                  heightClass="h-full"
                />
              </div>
            )}

            {/* Overlaid Top Action Bar matching mockup */}
            <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10 pointer-events-none">
              <button
                onClick={() => {
                  sounds.playTap();
                  onClose();
                }}
                className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 border border-white/15 backdrop-blur-md flex items-center justify-center text-white transition-all shadow-md active:scale-95 pointer-events-auto"
                aria-label="Retour"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Photo vs 3D Studio toggle pill */}
              <div className="flex items-center p-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[11px] pointer-events-auto shadow-md">
                <button
                  onClick={() => {
                    sounds.playTap();
                    setViewMode('photo');
                  }}
                  className={`px-3 py-1 rounded-full font-medium transition-all ${
                    viewMode === 'photo'
                      ? 'bg-white/20 text-white font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Visuel
                </button>
                <button
                  onClick={() => {
                    sounds.playTap();
                    setViewMode('3d');
                  }}
                  className={`px-2.5 py-1 rounded-full font-medium transition-all flex items-center gap-1 ${
                    viewMode === '3d'
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-amber-200" />
                  <span>3D</span>
                </button>
              </div>

              <div className="flex items-center gap-2 pointer-events-auto">
                {/* Favorite Heart Button */}
                <button
                  onClick={handleToggleFavoriteClick}
                  className={`w-9 h-9 rounded-full border backdrop-blur-md flex items-center justify-center transition-all shadow-md active:scale-95 ${
                    isFavorite
                      ? 'bg-rose-500/90 border-rose-400 text-white'
                      : 'bg-black/60 hover:bg-black/80 border-white/15 text-white'
                  }`}
                  aria-label="Favori"
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-white' : ''}`} />
                </button>

                {/* More Options Menu */}
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 border border-white/15 backdrop-blur-md flex items-center justify-center text-white transition-all shadow-md active:scale-95"
                  aria-label="Plus d'options"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Dropdown More Menu */}
            {showMoreMenu && (
              <div className="absolute top-14 right-3 z-20 w-48 rounded-2xl glass-panel-overlay border border-white/10 p-2 space-y-1 shadow-2xl animate-in fade-in zoom-in-95">
                <button
                  onClick={handleShare}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-white hover:bg-white/10 flex items-center gap-2"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{copiedLink ? 'Lien copié !' : 'Partager'}</span>
                </button>
                {onOpenCompare && (
                  <button
                    onClick={() => {
                      setShowMoreMenu(false);
                      onOpenCompare(cocktail);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-white hover:bg-white/10 flex items-center gap-2"
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>Comparer</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    setIsEditing(true);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-white hover:bg-white/10 flex items-center gap-2"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Ajuster avec l'IA</span>
                </button>
              </div>
            )}
          </div>

          {/* =========================================================================
              CARD CONTENT BODY MATCHING MOCKUP SCREEN 3
              ========================================================================= */}
          <div className="p-5 pt-0 space-y-5 -mt-6 relative z-10">
            {/* Cocktail Title & Editorial Metadata */}
            <div className="space-y-2">
              <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-purple-300 font-semibold">
                <span className="inline-flex items-center gap-2 flex-wrap"><SourceBadge c={cocktail} /> <span>{cocktail.tagline}</span></span>
              </div>

              {cocktail.riskNote && (
                <div role="alert" className="my-2 rounded-2xl border border-[#ff2a1a]/60 bg-[#ff2a1a]/12 px-3 py-2 text-[12px] text-white/90">⚠ {cocktail.riskNote}</div>
              )}
              <h2 className="tk-display text-[40px] sm:text-[48px] text-white leading-none">
                {cocktail.name}
              </h2>

              <p className="text-xs text-slate-300 leading-relaxed">
                {cocktail.description}
              </p>

              {/* Badges in a row matching mockup */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(cocktail.userTags && cocktail.userTags.length > 0
                  ? cocktail.userTags
                  : [...(cocktail.tastes ?? []).map((t) => TASTE_LABEL[t]), cocktail.difficulty, cocktail.alcoholEstimate].filter(Boolean)
                ).map((badge, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-white/[0.06] border border-white/10 text-slate-200"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            {/* 3-Column Quick Stats Pill matching mockup */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-[#141724]/90 border border-white/10 text-center">
              <div className="space-y-0.5">
                <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-white">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{cocktail.prepTimeMinutes || 5} min</span>
                </div>
                <div className="text-[9px] text-slate-400">Préparation</div>
              </div>

              <div className="space-y-0.5 border-x border-white/10">
                <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-white">
                  <Wine className="w-3.5 h-3.5 text-slate-400" />
                  <span>{servings} verre{servings > 1 ? 's' : ''}</span>
                </div>
                <div className="text-[9px] text-slate-400">Portion</div>
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-white font-mono">
                  <span>{cocktail.estimatedCost?.min > 0 ? `${cocktail.estimatedCost.min.toFixed(1)}–${cocktail.estimatedCost.max.toFixed(1)} €` : 'Non renseigné'}</span>
                </div>
                <div className="text-[9px] text-slate-400">Coût estimé</div>
              </div>
            </div>

            {/* =========================================================================
                TABS: INGRÉDIENTS | PRÉPARATION | PROFIL | ALTERNATIVES MATCHING MOCKUP
                ========================================================================= */}
            <div className="grid grid-cols-4 gap-1 p-1 rounded-full bg-[#12141F] border border-white/10">
              <button
                onClick={() => {
                  sounds.playTap();
                  setActiveTab('ingredients');
                }}
                className={`py-1.5 rounded-full text-[11px] font-medium transition-all ${
                  activeTab === 'ingredients'
                    ? 'bg-white/15 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Ingrédients
              </button>

              <button
                onClick={() => {
                  sounds.playTap();
                  setActiveTab('prep');
                }}
                className={`py-1.5 rounded-full text-[11px] font-medium transition-all ${
                  activeTab === 'prep'
                    ? 'bg-white/15 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Préparation
              </button>

              <button
                onClick={() => {
                  sounds.playTap();
                  setActiveTab('profile');
                }}
                className={`py-1.5 rounded-full text-[11px] font-medium transition-all ${
                  activeTab === 'profile'
                    ? 'bg-white/15 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Profil
              </button>

              <button
                onClick={() => {
                  sounds.playTap();
                  setActiveTab('alternatives');
                }}
                className={`py-1.5 rounded-full text-[11px] font-medium transition-all ${
                  activeTab === 'alternatives'
                    ? 'bg-white/15 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Alternatives
              </button>
            </div>

            {/* TAB CONTENT 1: INGRÉDIENTS MATCHING MOCKUP ROWS */}
            {activeTab === 'ingredients' && (
              <div className="space-y-2.5">
                {/* Servings multiplier row */}
                <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                  <span>Ajuster le dosage :</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 4].map((n) => (
                      <button
                        key={n}
                        onClick={() => {
                          sounds.playTap();
                          setServings(n);
                        }}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition-all ${
                          servings === n
                            ? 'bg-white text-slate-950'
                            : 'bg-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        {n}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ingredient Rows with bottle/fruit/cube thumbnails matching mockup */}
                <div className="space-y-2">
                  {cocktail.ingredients.map((ing, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-2xl bg-[#12141F]/80 border border-white/5 flex items-center justify-between hover:bg-[#161928] transition-all"
                    >
                      <div className="flex items-center gap-3">
                        {renderIngredientThumb(ing.name, ing.category)}
                        <div>
                          <div className="text-xs font-semibold text-white leading-tight">
                            {ing.name}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400">
                            {scaleAmount(ing.amount, servings)}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleShopping}
                        className="text-slate-500 hover:text-slate-300 p-1 rounded-full"
                        title="Ajouter aux courses"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: PRÉPARATION & CHRONO */}
            {activeTab === 'prep' && (
              <div className="space-y-3">
                {/* Minuteur */}
                <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-200">
                    <Timer className="w-4 h-4 text-purple-300" />
                    <span>Chronomètre de shaker :</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-white px-2 py-0.5 rounded-md bg-black/40">
                      {timeLeft}s
                    </span>
                    <button
                      onClick={toggleTimer}
                      className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                    >
                      {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={resetTimer}
                      className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Steps Checklist */}
                <div className="space-y-2">
                  {cocktail.steps.map((step, idx) => {
                    const isDone = checkedSteps.includes(idx);
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          sounds.playTap();
                          setCheckedSteps(
                            isDone
                              ? checkedSteps.filter((s) => s !== idx)
                              : [...checkedSteps, idx]
                          );
                        }}
                        className={`cursor-pointer p-3 rounded-2xl border transition-all flex items-start gap-3 ${
                          isDone
                            ? 'bg-white/[0.02] border-white/5 text-slate-500'
                            : 'bg-[#12141F]/80 border-white/5 text-slate-200 hover:border-white/15'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-bold shrink-0 mt-0.5 ${
                            isDone ? 'bg-emerald-500 text-slate-950' : 'bg-white/10 text-white'
                          }`}
                        >
                          {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
                        </div>
                        <p className={`text-xs leading-relaxed ${isDone ? 'line-through' : ''}`}>
                          {step}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: PROFIL AROMATIQUE */}
            {activeTab === 'profile' && (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
                  <div className="text-xs font-semibold text-white">Analyse Sommelier :</div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {cocktail.aromaticCoherence || 'Équilibre harmonieux entre acidité, sucre et arômes botaniques.'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
                  <div className="text-xs font-semibold text-white">Profil gustatif :</div>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                        <span>Douceur</span>
                        <span className="font-mono text-pink-300">{cocktail.tasteProfile?.sweetness || 3}/5</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"
                          style={{ width: `${((cocktail.tasteProfile?.sweetness || 3) / 5) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                        <span>Intensité fruitée</span>
                        <span className="font-mono text-emerald-300">{cocktail.tasteProfile?.fruitiness || 4}/5</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-lime-500 rounded-full"
                          style={{ width: `${((cocktail.tasteProfile?.fruitiness || 4) / 5) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                        <span>Audace & Originalité</span>
                        <span className="font-mono text-sky-300">{cocktail.tasteProfile?.originality || 3}/5</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                          style={{ width: `${((cocktail.tasteProfile?.originality || 3) / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 4: ALTERNATIVES & MOCKTAIL */}
            <div className="mx-0 mb-4 p-4 rounded-[24px] tk-glass space-y-3">
              <div className="flex items-center justify-between">
                <span className="tk-mono text-[9.5px] text-white/50">Mon évaluation</span>
                {savedRating && <span className="text-[11px] text-[var(--tk-ready)]">Enregistrée</span>}
              </div>
              <div className="flex gap-1.5" role="radiogroup" aria-label="Note">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} role="radio" aria-checked={rating === n} aria-label={`${n} sur 5`} onClick={() => { sounds.playTap(); setRating(n); setSavedRating(false); }}>
                    <Star className={`w-7 h-7 transition-all ${n <= rating ? 'fill-[#ffc857] text-[#ffc857] drop-shadow-[0_0_8px_#ffc857]' : 'text-white/25'}`} />
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {RATING_TAGS.map((t) => (
                  <button key={t} data-on={ratingTags.includes(t)} onClick={() => { setRatingTags(ratingTags.includes(t) ? ratingTags.filter((x) => x !== t) : [...ratingTags, t]); setSavedRating(false); }} className="tk-chip px-2.5 py-1 rounded-full text-[11px] font-semibold">{t}</button>
                ))}
              </div>
              <textarea value={notes} onChange={(e) => { setNotes(e.target.value); setSavedRating(false); }} placeholder="Mes notes perso (dosage, variante testée…)" rows={2} aria-label="Notes personnelles" className="w-full bg-black/30 border border-white/10 rounded-2xl px-3 py-2 text-[12.5px] text-white placeholder:text-white/30 outline-none resize-none" />
              <button disabled={!rating} onClick={() => { onSaveRating(cocktail.id, rating, ratingTags, notes); setSavedRating(true); sounds.playSuccessChime(); }} className="w-full h-10 rounded-full bg-white text-[#0b0b10] text-[12.5px] font-bold disabled:opacity-30">Enregistrer ma note</button>
              {cocktail.provenanceLabel && <p className="text-[10.5px] text-white/40">Provenance : {cocktail.provenanceLabel}</p>}
            </div>

            {activeTab === 'alternatives' && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">
                    Alternative supermarché simple
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {cocktail.simplerAlternative || 'Remplacer le sirop de vanille par du sucre roux et un zeste d’agrume.'}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-emerald-300 block">
                    Variante sans alcool (0.0% Mocktail)
                  </span>
                  <p className="text-xs text-emerald-200/90 leading-relaxed">
                    {cocktail.mocktailVariant || 'Remplacer l’alcool par une infusion de thé blanc glacé et un trait de citron vert.'}
                  </p>
                </div>

                {/* AI Rebalance drawer */}
                <div className="pt-2">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-xs font-semibold text-purple-300 hover:text-purple-200 flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Rééquilibrer cette recette avec l'IA</span>
                  </button>

                  {isEditing && (
                    <div className="mt-2 p-3 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                      <input
                        type="text"
                        placeholder="Ex : « Moins sucré », « Remplacer le rhum par du gin »..."
                        value={rebalancePrompt}
                        onChange={(e) => setRebalancePrompt(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                      />
                      <button
                        onClick={handleRebalanceSubmit}
                        disabled={isRebalancing || !rebalancePrompt.trim()}
                        className="w-full py-2 rounded-xl text-xs font-bold btn-mockup-gradient text-white disabled:opacity-50"
                      >
                        {isRebalancing ? 'Calcul en cours...' : 'Appliquer l\'ajustement IA'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* =========================================================================
                BOTTOM FLOATING ACTIONS MATCHING MOCKUP SCREEN 3
                ========================================================================= */}
            <div className="pt-3 pb-2 flex items-center gap-2.5">
              {/* Wide Gradient Button: "Ajouter à ma collection" */}
              <button
                onClick={handleToggleFavoriteClick}
                className="flex-1 py-3.5 rounded-full text-xs sm:text-sm font-semibold text-white btn-mockup-gradient flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all"
              >
                {isFavorite ? (
                  <>
                    <BookmarkCheck className="w-4 h-4 text-white" />
                    <span>Dans ma collection</span>
                  </>
                ) : (
                  <>
                    <Wine className="w-4 h-4 text-white" />
                    <span>Ajouter à ma collection</span>
                  </>
                )}
              </button>

              {/* Circular Cart Button */}
              <button
                onClick={handleShopping}
                className={`w-12 h-12 rounded-full border flex items-center justify-center shrink-0 transition-all shadow-md active:scale-95 ${
                  addedToCart
                    ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                    : 'bg-[#181B28] hover:bg-[#202436] border-white/10 text-white'
                }`}
                title="Ajouter tous les ingrédients aux courses"
                aria-label="Ajouter aux courses"
              >
                <ShoppingCart className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};
