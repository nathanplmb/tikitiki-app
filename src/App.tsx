import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ShoppingBag, Volume2, VolumeX, CloudOff, X } from 'lucide-react';
import { AmbientBackground, AmbientTheme } from './components/AmbientBackground';
import { Navigation, ActiveTab } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { LabConfigurator } from './components/LabConfigurator';
import { CocktailResults } from './components/CocktailResults';
import { CocktailDetailModal } from './components/CocktailDetailModal';
import { CocktailCompareModal } from './components/CocktailCompareModal';
import { DiscoveriesView } from './components/DiscoveriesView';
import { MyCollectionView } from './components/MyCollectionView';
import { MyBarView } from './components/MyBarView';
import { ShoppingListModal } from './components/ShoppingListModal';
import { PartyPlannerView } from './components/PartyPlannerView';
import { NeonLiquidShaker, GenStage } from './components/NeonLiquidShaker';
import { Onboarding } from './components/Onboarding';
import { CrackheadHome } from './components/CrackheadHome';
import { CrackheadLab } from './components/CrackheadLab';
import { StormCanvas } from './components/StormCanvas';
import { AppMode, getStoredMode, setActiveMode } from './catalog/active';
import { CocktailRecipe, CreationConfig, UserBarItem, ShoppingItem, UserTastePreferences, PartyPlan } from './types/cocktail';
import {
  getFavorites, saveFavorites, getHistory, appendHistory, getUserBar, saveUserBar, getShoppingList, saveShoppingList,
  addRecipeToShoppingList, getTastePreferences, saveTastePreferences, resetTastePreferences, exportUserDataJSON,
  importUserDataJSON, getRecentIds, pushRecentId, isOnboarded, setOnboarded, getTasteSignals, recordTasteSignal, topTastes,
} from './utils/storage';
import { matchIngredientId } from './engine/text';
import { searchCatalog } from './engine/search';
import { artFor } from './catalog/adapter';
import { Taste } from './catalog/types';
import { sounds } from './utils/audio';

type AiStatus = { configured: boolean } | null;

// Apply the stored mode before the first render so searches use the right catalog.
setActiveMode(getStoredMode());

export default function App() {
  const [mode, setMode] = useState<AppMode>(getStoredMode);
  const [modeFlash, setModeFlash] = useState(false);
  const switchMode = (m: AppMode) => {
    if (m === mode) return;
    setActiveMode(m);
    setMode(m);
    setSelectedCocktail(null);
    setModeFlash(true);
    setTimeout(() => setModeFlash(false), 450);
    sounds.playGlassClink();
  };
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [favorites, setFavorites] = useState<CocktailRecipe[]>(getFavorites);
  const [history, setHistory] = useState<CocktailRecipe[]>(getHistory);
  const [userBar, setUserBar] = useState<UserBarItem[]>(getUserBar);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>(getShoppingList);
  const [tastePrefs, setTastePrefs] = useState<UserTastePreferences>(getTastePreferences);
  const [recentIds, setRecentIds] = useState<string[]>(getRecentIds);
  const [signals, setSignals] = useState(getTasteSignals);
  const [showOnboarding, setShowOnboarding] = useState(() => !isOnboarded());
  const [muted, setMuted] = useState(sounds.getMuted());

  const [labMode, setLabMode] = useState<'ai' | 'bar'>('ai');
  const [currentRecipes, setCurrentRecipes] = useState<CocktailRecipe[]>([]);
  const [genStage, setGenStage] = useState<GenStage>('idle');
  const [aiStatus, setAiStatus] = useState<AiStatus>(null);
  const [aiError, setAiError] = useState<string | undefined>();
  const [toast, setToast] = useState<string | undefined>();
  const abortRef = useRef<AbortController | null>(null);

  const [selectedCocktail, setSelectedCocktail] = useState<CocktailRecipe | null>(null);
  const [compareCocktails, setCompareCocktails] = useState<[CocktailRecipe, CocktailRecipe] | null>(null);
  const [isShoppingOpen, setIsShoppingOpen] = useState(false);
  const [labConfig, setLabConfig] = useState<Partial<CreationConfig> | undefined>();
  const [discoverTastes, setDiscoverTastes] = useState<Taste[] | undefined>();
  const [discoverMode, setDiscoverMode] = useState<'swipe' | 'catalog'>('swipe');
  const [discoverCollection, setDiscoverCollection] = useState<string | undefined>();
  const openCatalog = (tastes?: Taste[], collection?: string) => { setDiscoverTastes(tastes); setDiscoverCollection(collection); setDiscoverMode('catalog'); go('discoveries'); };

  useEffect(() => {
    fetch('/api/ai/status').then((r) => r.json()).then(setAiStatus).catch(() => setAiStatus({ configured: false }));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(undefined), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }); }, [activeTab]);

  // Bar → catalog ingredient ids (free-text entries are matched through synonyms)
  const barIds = useMemo(() => {
    const ids = new Set<string>();
    for (const b of userBar) if (b.inStock) { const id = b.ingredientId ?? matchIngredientId(b.name); if (id) ids.add(id); }
    return ids;
  }, [userBar]);
  const barKnown = barIds.size > 0;
  const preferredTastes = useMemo(() => topTastes(signals) as Taste[], [signals]);
  const favoriteIds = useMemo(() => favorites.map((f) => f.catalogId).filter(Boolean) as string[], [favorites]);

  const ambientColor = selectedCocktail ? artFor(selectedCocktail).color : currentRecipes[0] && activeTab === 'lab' ? artFor(currentRecipes[0]).color : undefined;
  const ambientTheme: AmbientTheme = selectedCocktail?.tasteProfile?.colorTheme ?? (activeTab === 'party' ? 'tropical' : activeTab === 'lab' && labMode === 'bar' ? 'spiced-warm' : activeTab === 'discoveries' ? 'floral' : 'neutral');

  const go = (tab: ActiveTab) => { sounds.playTap(); setActiveTab(tab); };

  const openCocktail = (c: CocktailRecipe) => {
    setSelectedCocktail(c);
    if (c.catalogId) setRecentIds(pushRecentId(c.catalogId));
    if (c.tastes?.length) setSignals(recordTasteSignal(c.tastes, 0.5));
  };

  // ── AI generation: each ritual step reflects a real state of the request ──
  const handleGenerate = async (config: CreationConfig) => {
    setAiError(undefined);
    setGenStage('preparing');
    const catalogMatches = searchCatalog({ query: config.freeIntent, alcohol: config.isMocktailMode ? 'without' : 'any' }).slice(0, 12).map((m) => m.recipe.name);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      setGenStage('assembling');
      const res = await fetch('/api/cocktails/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          ...config,
          recentNames: history.slice(0, 15).map((h) => h.name),
          barIngredients: [...barIds],
          catalogMatches,
          preferredTastes,
        }),
      });
      setGenStage('mixing');
      const data = await res.json().catch(() => ({ success: false, message: 'Réponse illisible du serveur.' }));
      if (!res.ok || !data.success || !data.recipes?.length) throw new Error(data.message || 'La génération a échoué.');
      setGenStage('reveal');
      setCurrentRecipes(data.recipes);
      appendHistory(data.recipes);
      setHistory(getHistory());
      if (data.rejected?.length) setToast(`${data.rejected.length} proposition(s) rejetée(s) car non conformes.`);
      sounds.playSuccessChime();
      setTimeout(() => setGenStage('idle'), 900);
    } catch (err: any) {
      setGenStage('idle');
      if (err?.name === 'AbortError') return;
      setAiError(err?.message || "L'IA est indisponible. Le catalogue reste accessible.");
    } finally {
      abortRef.current = null;
    }
  };

  const handleRebalanceWithAI = async (recipe: CocktailRecipe, tweak: string) => {
    const res = await fetch('/api/cocktails/rebalance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ originalRecipe: recipe, userTweak: tweak }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => null) : null;
    if (!res?.ok || !data?.success) {
      setToast(data?.message || "Ajustement IA indisponible. La recette d'origine est conservée.");
      return;
    }
    setSelectedCocktail(data.recipe);
    appendHistory([data.recipe]);
    setHistory(getHistory());
    sounds.playSuccessChime();
  };

  const toLab = (cfg: Partial<CreationConfig>) => {
    setLabConfig(cfg);
    setCurrentRecipes([]);
    setLabMode('ai');
    setActiveTab('lab');
    sounds.playTap();
  };

  const handleToggleFavorite = (c: CocktailRecipe) => {
    const exists = favorites.some((f) => f.id === c.id);
    const updated = exists ? favorites.filter((f) => f.id !== c.id) : [c, ...favorites];
    if (!exists && c.tastes?.length) setSignals(recordTasteSignal(c.tastes, 3));
    setFavorites(updated);
    saveFavorites(updated);
  };

  // A rating is kept even if the drink was not a favourite: rated drinks are saved to the collection.
  const handleSaveRating = (recipeId: string, rating: number, tags: string[], notes: string) => {
    const patch = (c: CocktailRecipe) => (c.id === recipeId ? { ...c, userRating: rating, userTags: tags, userNotes: notes, testedByUser: true } : c);
    const base = selectedCocktail && selectedCocktail.id === recipeId ? patch(selectedCocktail) : undefined;
    const inFav = favorites.some((f) => f.id === recipeId);
    const updated = inFav ? favorites.map(patch) : base ? [base, ...favorites] : favorites;
    setFavorites(updated);
    saveFavorites(updated);
    if (base) setSelectedCocktail(base);
    if (base?.tastes?.length) setSignals(recordTasteSignal(base.tastes, (rating - 3) * 2));
  };

  const handleExportData = () => {
    const blob = new Blob([exportUserDataJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tikitiki_sauvegarde_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = async (file: File) => {
    if (importUserDataJSON(await file.text())) {
      setFavorites(getFavorites()); setHistory(getHistory()); setUserBar(getUserBar()); setShoppingList(getShoppingList()); setTastePrefs(getTastePreferences());
      setToast('Sauvegarde restaurée.');
    } else setToast('Fichier de sauvegarde illisible.');
  };

  const updateBar = (updated: UserBarItem[]) => { setUserBar(updated); saveUserBar(updated); };

  const handleAddPartyPlanToShopping = (plan: PartyPlan) => {
    const updated = [...getShoppingList()];
    plan.consolidatedShopping.forEach((s) => {
      const i = updated.findIndex((it) => it.name.toLowerCase() === s.item.toLowerCase());
      if (i >= 0) updated[i] = { ...updated[i], totalQuantity: s.bottlesNeeded, checked: false };
      else updated.push({ id: `party-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: s.item, category: 'autre', recipesUsing: [`Soirée (${plan.guestCount} invités)`], formatNote: s.bottlesNeeded, checked: false });
    });
    setShoppingList(updated);
    saveShoppingList(updated);
  };

  const shoppingCount = shoppingList.filter((i) => !i.checked).length;

  return (
    <div className="relative min-h-screen text-slate-100 flex flex-col font-sans">
      <AmbientBackground theme={ambientTheme} color={ambientColor} />
      {/* crackhead: storm behind every screen, seen through the glass panels while scrolling */}
      {mode === 'crackhead' && <StormCanvas variant="ambient" fixed className="z-[1]" />}
      <NeonLiquidShaker stage={genStage} color={ambientColor} onCancel={() => abortRef.current?.abort()} />

      <Navigation activeTab={activeTab} setActiveTab={go} shoppingCount={shoppingCount} onOpenShopping={() => setIsShoppingOpen(true)} favoritesCount={favorites.length} />

      {/* Top bar */}
      <header className="fixed top-0 inset-x-0 z-30 lg:pl-64 pointer-events-none bg-gradient-to-b from-[var(--tk-bg)] via-[var(--tk-bg)]/70 to-transparent pb-4">
        <div className="max-w-3xl mx-auto px-4 pt-[calc(env(safe-area-inset-top)+10px)] flex items-center justify-between">
          <button onClick={() => go('home')} className="pointer-events-auto tk-display text-[22px] text-white drop-shadow lg:invisible">{mode === 'crackhead' ? 'TK!' : 'TikiTiki'}</button>
          <div role="radiogroup" aria-label="Mode de l’application" className="pointer-events-auto tk-liquid rounded-full p-1 flex">
            {(['chic', 'crackhead'] as const).map((m) => (
              <button key={m} role="radio" aria-checked={mode === m} onClick={() => switchMode(m)} className="relative px-3 h-8 rounded-full text-[11px] font-bold">
                {mode === m && <motion.span layoutId="mode-pill" className="tk-lens absolute inset-0 rounded-full" transition={{ type: 'spring', stiffness: 500, damping: 32 }} />}
                <span className={`relative ${mode === m ? (m === 'crackhead' ? 'text-[#0a000f]' : 'text-white') : 'text-white/60'}`}>{m === 'chic' ? 'Chic' : 'Crackhead'}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2 pointer-events-auto">
            <button onClick={() => setMuted(sounds.toggleMute())} aria-label={muted ? 'Activer les sons' : 'Couper les sons'} className="tk-liquid w-10 h-10 rounded-full flex items-center justify-center">
              {muted ? <VolumeX className="w-4 h-4 text-white/70" /> : <Volume2 className="w-4 h-4 text-white" />}
            </button>
            <button onClick={() => setIsShoppingOpen(true)} aria-label="Liste de courses" className="tk-liquid relative w-10 h-10 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-white" />
              {shoppingCount > 0 && <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-[var(--tk-accent)] text-[10px] font-bold flex items-center justify-center">{shoppingCount}</span>}
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 flex-1 flex flex-col lg:pl-64">
          <motion.main
            key={activeTab + mode}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={`flex-1 w-full max-w-3xl mx-auto px-4 ${activeTab === 'home' ? '' : 'pt-[calc(env(safe-area-inset-top)+64px)]'}`}
          >
            {activeTab === 'home' && mode === 'crackhead' && (
              <CrackheadHome
                barIds={barIds}
                barKnown={barKnown}
                recentIds={recentIds}
                onSelectCocktail={openCocktail}
                onOpenRoulette={() => { setDiscoverTastes(undefined); setDiscoverMode('swipe'); go('discoveries'); }}
                onOpenParty={() => go('party')}
                onOpenShopping={() => setIsShoppingOpen(true)}
                onOpenCollection={(id) => openCatalog(undefined, id)}
              />
            )}
            {activeTab === 'home' && mode === 'chic' && (
              <Dashboard
                onStartLab={() => { setLabMode('ai'); setCurrentRecipes([]); setLabConfig(undefined); go('lab'); }}
                onOpenRoulette={() => { setDiscoverTastes(undefined); setDiscoverMode('swipe'); go('discoveries'); }}
                onOpenParty={() => go('party')}
                onOpenShopping={() => setIsShoppingOpen(true)}
                onOpenMood={(t) => openCatalog([t])}
                onOpenBar={() => { setLabMode('bar'); go('lab'); }}
                recentCocktails={history}
                onSelectCocktail={openCocktail}
                barIds={barIds}
                barKnown={barKnown}
                recentIds={recentIds}
                favoriteIds={favoriteIds}
                tastePrefs={tastePrefs}
                preferredTastes={preferredTastes}
                shoppingCount={shoppingCount}
              />
            )}

            {activeTab === 'lab' && (
              <div className="tk-safe-bottom space-y-5 pt-2">
                <header>
                  <div className="tk-mono text-[10px] text-white/50">{labMode === 'bar' ? 'Ton inventaire, tes possibilités' : mode === 'crackhead' ? 'Générateur de flash' : 'Création sur mesure'}</div>
                  <h1 className="tk-display text-[56px] text-white mt-1">Le <span className="italic tk-gradient-text">labo</span></h1>
                </header>
                <div className="grid grid-cols-2 gap-1 p-1 rounded-full tk-glass">
                  {(['ai', 'bar'] as const).map((m) => (
                    <button key={m} onClick={() => setLabMode(m)} className="relative h-11 rounded-full text-[13px] font-bold">
                      {labMode === m && <motion.span layoutId="lab-seg" className="absolute inset-0 rounded-full bg-white" transition={{ type: 'spring', stiffness: 500, damping: 34 }} />}
                      <span className={`relative ${labMode === m ? 'text-[#0b0b10]' : 'text-white/60'}`}>{m === 'ai' ? (mode === 'crackhead' ? 'Créer un flash ⚡' : 'Créer avec l’IA ✦') : 'Mon bar'}</span>
                    </button>
                  ))}
                </div>

                {labMode === 'bar' ? (
                  <MyBarView
                    userBar={userBar}
                    barIds={barIds}
                    recentIds={recentIds}
                    onToggleStock={(id) => updateBar(userBar.map((i) => (i.id === id ? { ...i, inStock: !i.inStock } : i)))}
                    onAddItem={(name, category, ingredientId) => updateBar([{ id: `bar-${Date.now()}`, name, category, inStock: true, ingredientId }, ...userBar])}
                    onRemoveItem={(id) => updateBar(userBar.filter((i) => i.id !== id))}
                    onGenerateFromBar={(b, m, a) => toLab({ selectedBases: b.slice(0, 2), selectedMixers: m.slice(0, 3), selectedAromatics: a.slice(0, 3), singleBottleOnly: b.length <= 1, crowdPleaser: true })}
                    onSelectCocktail={openCocktail}
                  />
                ) : (
                  <>
                    {aiStatus && !aiStatus.configured && mode === 'chic' && (
                      <div className="tk-glass rounded-[20px] px-4 py-3 flex items-start gap-3 text-[12.5px] text-white/70">
                        <CloudOff className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>Les fonctions IA sont indisponibles sur ce serveur (clé non configurée). Le catalogue fonctionne normalement.</span>
                      </div>
                    )}
                    {aiError && (
                      <div className="rounded-[20px] px-4 py-3 border border-[var(--tk-miss)]/40 bg-[var(--tk-miss)]/10 text-[12.5px] text-white/85 flex items-start gap-3">
                        <CloudOff className="w-4 h-4 mt-0.5 shrink-0 text-[var(--tk-miss)]" />
                        <div className="flex-1">
                          <div>{aiError}</div>
                          <button onClick={() => { setAiError(undefined); openCatalog(); }} className="mt-1 underline underline-offset-4 font-semibold">Chercher dans le catalogue</button>
                        </div>
                        <button onClick={() => setAiError(undefined)} aria-label="Fermer"><X className="w-4 h-4" /></button>
                      </div>
                    )}
                    {currentRecipes.length > 0 ? (
                      <CocktailResults
                        recipes={currentRecipes}
                        onSelectCocktail={openCocktail}
                        onToggleFavorite={handleToggleFavorite}
                        favorites={favorites}
                        onOpenCompare={(a, b) => setCompareCocktails([a, b])}
                        onRestartLab={() => setCurrentRecipes([])}
                      />
                    ) : mode === 'crackhead' ? (
                      <CrackheadLab onOpen={openCocktail} onGenerate={handleGenerate} isGenerating={genStage !== 'idle'} aiAvailable={Boolean(aiStatus?.configured)} />
                    ) : (
                      <LabConfigurator onGenerate={handleGenerate} isGenerating={genStage !== 'idle'} userBar={userBar} initialConfig={labConfig} onBack={() => go('home')} />
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === 'discoveries' && (
              <DiscoveriesView
                barIds={barIds}
                barKnown={barKnown}
                recentIds={recentIds}
                favoriteIds={favoriteIds}
                preferredTastes={preferredTastes}
                initialTastes={discoverTastes}
                initialCollection={discoverCollection}
                mode={discoverMode}
                onModeChange={setDiscoverMode}
                onSelectCocktail={openCocktail}
                onLike={(c) => { if (!favorites.some((f) => f.id === c.id)) handleToggleFavorite(c); }}
                onPass={(c) => c.tastes?.length && setSignals(recordTasteSignal(c.tastes, -1))}
              />
            )}

            {activeTab === 'collection' && (
              <div className="tk-safe-bottom pt-2">
                <MyCollectionView
                  favorites={favorites}
                  onSelectCocktail={openCocktail}
                  onRemoveFavorite={(id) => { const u = favorites.filter((f) => f.id !== id); setFavorites(u); saveFavorites(u); }}
                  onOpenCompare={(a, b) => setCompareCocktails([a, b])}
                  onStartLab={() => openCatalog()}
                  tastePrefs={tastePrefs}
                  onUpdateTastePrefs={(p) => { setTastePrefs(p); saveTastePreferences(p); }}
                  onResetTastePrefs={() => setTastePrefs(resetTastePreferences())}
                  onExportData={handleExportData}
                  onImportData={handleImportData}
                />
              </div>
            )}

            {activeTab === 'party' && <PartyPlannerView barIds={barIds} onAddAllToShoppingList={handleAddPartyPlanToShopping} onSelectCocktail={openCocktail} />}
          </motion.main>
      </div>

      <CocktailDetailModal
        cocktail={selectedCocktail}
        onClose={() => setSelectedCocktail(null)}
        onToggleFavorite={handleToggleFavorite}
        isFavorite={Boolean(selectedCocktail && favorites.some((f) => f.id === selectedCocktail.id))}
        onAddToShoppingList={(c) => { setShoppingList(addRecipeToShoppingList(c)); setToast(`Ingrédients de « ${c.name} » ajoutés aux courses.`); }}
        onSaveRating={handleSaveRating}
        onRebalanceWithAI={handleRebalanceWithAI}
        onOpenCompare={(c) => {
          const other = favorites.find((f) => f.id !== c.id) ?? history.find((h) => h.id !== c.id);
          if (other) setCompareCocktails([c, other]);
          else setToast('Enregistre au moins un autre cocktail pour comparer.');
        }}
      />
      <CocktailCompareModal cocktails={compareCocktails} onClose={() => setCompareCocktails(null)} onSelectCocktail={(c) => { setCompareCocktails(null); openCocktail(c); }} />
      <ShoppingListModal
        isOpen={isShoppingOpen}
        onClose={() => setIsShoppingOpen(false)}
        items={shoppingList}
        onToggleItem={(id) => { const u = shoppingList.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)); setShoppingList(u); saveShoppingList(u); }}
        onClearList={() => { setShoppingList([]); saveShoppingList([]); }}
      />

      <AnimatePresence>
        {modeFlash && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 0.9, 0] }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }}
            className="fixed inset-0 z-[95] pointer-events-none" style={{ background: mode === 'crackhead' ? 'linear-gradient(120deg,#c6ff00,#ff1fae,#00e5ff)' : 'radial-gradient(circle,#fff,#ffb547)' }} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} role="status"
            className="fixed z-[90] left-1/2 -translate-x-1/2 bottom-[calc(env(safe-area-inset-bottom)+96px)] tk-glass-dark rounded-full px-4 py-2.5 text-[12.5px] text-white max-w-[90vw] text-center">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showOnboarding && (
          <Onboarding
            onDone={(r) => {
              setOnboarded();
              setShowOnboarding(false);
              if (r) {
                if (r.tastes.length) setSignals(recordTasteSignal(r.tastes, 4));
                const p = { ...tastePrefs, preferMocktails: r.preferMocktails, lastUpdated: new Date().toISOString() };
                setTastePrefs(p);
                saveTastePreferences(p);
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
