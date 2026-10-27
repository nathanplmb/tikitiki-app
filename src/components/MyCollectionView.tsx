import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Bookmark, 
  Star, 
  Trash2, 
  ArrowRight, 
  Scale, 
  Search,
  Download,
  Upload,
  RotateCcw,
  Sliders,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { CocktailRecipe, UserTastePreferences } from '../types/cocktail';
import { sounds } from '../utils/audio';

interface MyCollectionViewProps {
  favorites: CocktailRecipe[];
  onSelectCocktail: (cocktail: CocktailRecipe) => void;
  onRemoveFavorite: (id: string) => void;
  onOpenCompare: (c1: CocktailRecipe, c2: CocktailRecipe) => void;
  onStartLab: () => void;
  tastePrefs: UserTastePreferences;
  onUpdateTastePrefs: (prefs: UserTastePreferences) => void;
  onResetTastePrefs: () => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
}

export const MyCollectionView: React.FC<MyCollectionViewProps> = ({
  favorites,
  onSelectCocktail,
  onRemoveFavorite,
  onOpenCompare,
  onStartLab,
  tastePrefs,
  onUpdateTastePrefs,
  onResetTastePrefs,
  onExportData,
  onImportData,
}) => {
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [compareList, setCompareList] = useState<CocktailRecipe[]>([]);
  const [showTastePrefs, setShowTastePrefs] = useState<boolean>(false);

  const allTags = ['all', 'Parfait', 'À refaire', 'Original', 'Coup de cœur', 'Trop sucré', 'Trop amer'];

  const filteredFavorites = favorites.filter((item) => {
    if (selectedTag !== 'all') {
      if (!item.userTags?.includes(selectedTag)) return false;
    }
    if (searchQuery.trim()) {
      return (
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tasteProfile.profileName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

  const handleCompareClick = (recipe: CocktailRecipe, e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playTap();
    if (compareList.some((r) => r.id === recipe.id)) {
      setCompareList(compareList.filter((r) => r.id !== recipe.id));
    } else {
      if (compareList.length === 1) {
        onOpenCompare(compareList[0], recipe);
        setCompareList([]);
      } else {
        setCompareList([recipe]);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportData(file);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h1 className="font-display font-bold text-2xl text-white">
            Ma Collection
          </h1>
          <p className="text-xs text-slate-400">
            {favorites.length} cocktail{favorites.length > 1 ? 's' : ''} sauvegardé{favorites.length > 1 ? 's' : ''} et profil de goût.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Export button */}
          <button
            onClick={() => {
              sounds.playTap();
              onExportData();
            }}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
            title="Sauvegarder mes données (JSON)"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Import file label */}
          <label className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 cursor-pointer" title="Restaurer un fichier de sauvegarde">
            <Upload className="w-3.5 h-3.5" />
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={() => {
              sounds.playTap();
              setShowTastePrefs(!showTastePrefs);
            }}
            className={`p-2 rounded-full border transition-all ${
              showTastePrefs ? 'bg-white/15 text-white border-white/20' : 'bg-white/5 text-slate-400 border-white/10'
            }`}
            title="Ajuster mon profil de goût"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* TASTE PROFILE PREFERENCES (EDITABLE & RESETTABLE) */}
      {showTastePrefs && (
        <div className="p-5 rounded-3xl glass-panel border border-white/10 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <span className="text-xs font-semibold text-white">
              Préférences Gustatives Globales
            </span>
            <button
              onClick={() => {
                sounds.playTap();
                onResetTastePrefs();
              }}
              className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 font-mono"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Réinitialiser</span>
            </button>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Douceur préférée :</span>
                <span className="font-bold text-white">{tastePrefs.preferredSweetness}/5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={tastePrefs.preferredSweetness}
                onChange={(e) =>
                  onUpdateTastePrefs({ ...tastePrefs, preferredSweetness: parseInt(e.target.value, 10) })
                }
                className="w-full accent-white cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Intensité fruitée :</span>
                <span className="font-bold text-white">{tastePrefs.preferredFruitiness}/5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={tastePrefs.preferredFruitiness}
                onChange={(e) =>
                  onUpdateTastePrefs({ ...tastePrefs, preferredFruitiness: parseInt(e.target.value, 10) })
                }
                className="w-full accent-white cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Recherche d'originalité :</span>
                <span className="font-bold text-white">{tastePrefs.preferredOriginality}/5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={tastePrefs.preferredOriginality}
                onChange={(e) =>
                  onUpdateTastePrefs({ ...tastePrefs, preferredOriginality: parseInt(e.target.value, 10) })
                }
                className="w-full accent-white cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Rechercher par nom ou ingrédient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-2xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        {/* Tags */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                sounds.playTap();
                setSelectedTag(tag);
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all ${
                selectedTag === tag
                  ? 'bg-white/20 text-white'
                  : 'bg-white/5 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tag === 'all' ? 'Tous' : tag}
            </button>
          ))}
        </div>
      </div>

      {/* Cocktails Grid */}
      {filteredFavorites.length === 0 ? (
        <div className="p-10 text-center rounded-3xl glass-panel-subtle space-y-3">
          <Bookmark className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs text-slate-400">
            Aucun cocktail ne correspond à ta sélection.
          </p>
          <button
            onClick={onStartLab}
            className="px-4 py-2 rounded-full text-xs font-bold bg-white text-slate-950"
          >
            Créer un cocktail
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredFavorites.map((cocktail) => {
            const isComparing = compareList.some((r) => r.id === cocktail.id);
            return (
              <motion.div
                key={cocktail.id}
                layout
                onClick={() => {
                  sounds.playGlassClink();
                  onSelectCocktail(cocktail);
                }}
                className={`cursor-pointer group rounded-3xl overflow-hidden glass-panel border transition-all ${
                  isComparing ? 'border-purple-400 shadow-lg' : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="aspect-[16/10] overflow-hidden relative bg-black/40">
                  <img
                    src={cocktail.imageUrl}
                    alt={cocktail.name}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      if (target.nextElementSibling) {
                        (target.nextElementSibling as HTMLElement).style.display = 'flex';
                      }
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div 
                    style={{ display: 'none' }}
                    className="w-full h-full bg-gradient-to-tr from-purple-950/60 via-[#0A0C14] to-black items-center justify-center"
                  >
                    <Bookmark className="w-10 h-10 text-purple-300/40" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0C14] via-transparent to-transparent pointer-events-none" />

                  <div className="absolute top-2.5 right-2.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        sounds.playTap();
                        onRemoveFavorite(cocktail.id);
                      }}
                      className="p-1.5 rounded-full bg-black/60 text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Stars */}
                  {cocktail.userRating && (
                    <div className="absolute bottom-2.5 left-3 flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3 h-3 ${
                            s <= (cocktail.userRating || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="font-display font-bold text-base text-white group-hover:text-purple-200 truncate">
                    {cocktail.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {cocktail.description}
                  </p>

                  {/* Tags */}
                  {cocktail.userTags && cocktail.userTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {cocktail.userTags.map((t) => (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-slate-300">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                    <button
                      onClick={(e) => handleCompareClick(cocktail, e)}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      <Scale className="w-3.5 h-3.5" />
                      <span>{isComparing ? 'Sélectionné' : 'Comparer'}</span>
                    </button>

                    <span className="text-slate-300 font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 text-[11px]">
                      Voir <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
