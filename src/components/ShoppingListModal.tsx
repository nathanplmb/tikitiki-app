import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ShoppingCart, 
  Check, 
  Trash2, 
  Copy, 
  Share2, 
  AlertCircle,
  ShoppingBag
} from 'lucide-react';
import { ShoppingItem } from '../types/cocktail';
import { sounds } from '../utils/audio';

interface ShoppingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ShoppingItem[];
  onToggleItem: (id: string) => void;
  onClearList: () => void;
}

export const ShoppingListModal: React.FC<ShoppingListModalProps> = ({
  isOpen,
  onClose,
  items,
  onToggleItem,
  onClearList,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = () => {
    sounds.playTap();
    const text = items
      .map((item) => `- [${item.checked ? 'X' : ' '}] ${item.name} (${item.recipesUsing.join(', ')})`)
      .join('\n');
    navigator.clipboard.writeText(`🛒 Liste de courses MIXLAB :\n\n${text}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-xl flex justify-center items-end sm:items-center p-0 sm:p-4">
          <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl glass-panel border border-white/10 p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.8)] z-10 space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/[0.08] border border-white/10 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-slate-200" />
              </div>
              <div>
                <h2 className="font-display font-bold text-lg text-white">
                  Liste de Courses Intelligente
                </h2>
                <p className="text-xs text-slate-400">
                  {items.length} ingrédient{items.length > 1 ? 's' : ''} sans doublons
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Advice alert */}
          <div className="p-3.5 rounded-2xl glass-panel-subtle border border-white/5 flex items-center gap-3 text-xs text-slate-300">
            <ShoppingBag className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Astuce anti-gaspillage : privilégie les formats 25cl pour les sirops et les bouteilles d’un litre pour les softs.
            </span>
          </div>

          {/* List items */}
          {items.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <ShoppingCart className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="text-sm text-slate-400">
                Ta liste de courses est vide.
              </div>
              <div className="text-xs text-slate-500">
                Ouvre une recette et clique sur « Ajouter à la liste » pour regrouper les ingrédients.
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    sounds.playTap();
                    onToggleItem(item.id);
                  }}
                  className={`cursor-pointer p-3.5 rounded-2xl transition-all flex items-start justify-between border ${
                    item.checked
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-500'
                      : 'glass-panel border-white/10 text-slate-200 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        item.checked
                          ? 'bg-emerald-400 text-slate-950'
                          : 'border border-white/20 bg-white/5'
                      }`}
                    >
                      {item.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div>
                      <div className={`text-xs font-bold ${item.checked ? 'line-through' : ''}`}>
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Utilisé dans : {item.recipesUsing.join(', ')}
                      </div>
                      {item.formatNote && (
                        <div className="text-[10px] text-purple-300 font-mono mt-0.5">
                          {item.formatNote}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer Actions */}
          {items.length > 0 && (
            <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  sounds.playTap();
                  onClearList();
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-400 bg-white/5 hover:bg-white/10 flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Vider la liste</span>
              </button>

              <button
                onClick={handleCopy}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 text-slate-950 flex items-center gap-1.5 transition-all shadow-md active:scale-[0.98]"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Liste copiée !' : 'Copier la liste'}</span>
              </button>
            </div>
          )}
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};
