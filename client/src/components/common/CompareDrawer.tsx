import { useState } from 'react';
import { Sparkles, Trash2, ArrowRightLeft } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks';
import { removeFromCompare, clearCompare } from '../../store/slices/compareSlice';
import CompareModal from './CompareModal';

export default function CompareDrawer() {
  const dispatch = useAppDispatch();
  const { items } = useAppSelector((state) => state.compare);
  const [modalOpen, setModalOpen] = useState(false);

  if (items.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40 bg-slate-950/90 border border-[var(--border-color)] backdrop-blur-md rounded-2xl p-4 shadow-2xl flex flex-col gap-3 max-w-sm w-full animate-slide-up">
        <div className="flex justify-between items-center pb-2 border-b border-[var(--border-color)]">
          <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
            <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-400" /> Comparison Deck
          </span>
          <span className="text-[10px] text-slate-450 font-bold">{items.length} / 4 items</span>
        </div>

        {/* Selected List */}
        <div className="flex gap-2.5 overflow-x-auto py-1">
          {items.map((item) => {
            const imageUrls = JSON.parse(item.images || '[]');
            const displayImage = imageUrls[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200';
            return (
              <div key={item.id} className="relative group flex-shrink-0">
                <img 
                  src={displayImage} 
                  alt={item.name} 
                  className="h-12 w-12 object-cover rounded-lg border border-[var(--border-color)] bg-slate-900"
                />
                <button
                  onClick={() => dispatch(removeFromCompare(item.id))}
                  className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-rose-600 text-white cursor-pointer hover:bg-rose-500 transition-colors shadow-md"
                  title="Remove"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={() => dispatch(clearCompare())}
            className="rounded-xl border border-[var(--border-color)] bg-slate-900/60 py-2.5 px-3 text-xs font-bold text-slate-400 hover:text-slate-200 cursor-pointer transition-colors active:scale-95"
          >
            Reset
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex-grow rounded-xl bg-indigo-650 hover:bg-indigo-500 py-2.5 text-xs font-extrabold text-white shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            Compare Now <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <CompareModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
      />
    </>
  );
}
