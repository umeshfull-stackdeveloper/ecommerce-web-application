import { X, Star, ShoppingCart } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks';
import { removeFromCompare, clearCompare } from '../../store/slices/compareSlice';
import { addLocalItem } from '../../store/slices/cartSlice';
import { addToast } from '../../store/slices/toastSlice';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CompareModal({ isOpen, onClose }: CompareModalProps) {
  const dispatch = useAppDispatch();
  const { items } = useAppSelector((state) => state.compare);

  if (!isOpen) return null;

  const handleAddToCart = (product: any) => {
    const variant = product.variants?.[0];
    dispatch(addLocalItem({
      productId: product.id,
      quantity: 1,
      selectedSize: variant?.size || null,
      selectedColor: variant?.color || null,
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        discountPrice: product.discountPrice,
        images: product.images,
        slug: product.slug
      }
    }));
    dispatch(addToast({ message: `${product.name} added to cart`, type: 'success' }));
  };

  // Collect all unique spec keys across compared items
  const allSpecKeys = Array.from(
    new Set(
      items.flatMap((item) => {
        try {
          const specs = JSON.parse(item.specifications || '{}');
          return Object.keys(specs);
        } catch {
          return [];
        }
      })
    )
  ) as string[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-panel w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-slate-950/20">
          <div>
            <h2 className="text-xl font-extrabold text-white">Compare Products</h2>
            <p className="text-xs text-slate-450 mt-1">Comparing {items.length} items (Max 4)</p>
          </div>
          <div className="flex items-center gap-3">
            {items.length > 0 && (
              <button
                onClick={() => dispatch(clearCompare())}
                className="text-xs text-rose-400 hover:text-rose-300 font-bold transition-colors cursor-pointer mr-2"
              >
                Clear All
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-2 rounded-full border border-[var(--border-color)] bg-slate-900/40 text-slate-450 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-grow overflow-x-auto p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-sm text-slate-400 font-medium">No products selected for comparison</p>
              <p className="text-[11px] text-slate-500 mt-1">Add items to compare directly from the catalog cards.</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left min-w-[700px]">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="py-4 pr-4 text-xs font-bold text-slate-500 uppercase tracking-wide w-1/5">Attribute</th>
                  {items.map((item) => {
                    const imageUrls = JSON.parse(item.images || '[]');
                    const displayImage = imageUrls[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400';
                    return (
                      <th key={item.id} className="py-4 px-4 w-1/5 relative group align-top">
                        <button
                          onClick={() => dispatch(removeFromCompare(item.id))}
                          className="absolute top-2 right-2 p-1 rounded-full bg-rose-600/10 hover:bg-rose-650 text-rose-400 hover:text-white transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <div className="flex flex-col gap-2">
                          <img 
                            src={displayImage} 
                            alt={item.name} 
                            className="h-28 w-full object-contain rounded-xl bg-slate-950/40 p-2 border border-[var(--border-color)]"
                          />
                          <span className="font-extrabold text-xs text-white line-clamp-2 leading-snug">
                            {item.name}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                  {/* Fill empty columns if less than 4 items */}
                  {Array.from({ length: 4 - items.length }).map((_, idx) => (
                    <th key={`empty-${idx}`} className="py-4 px-4 w-1/5 text-center text-slate-700 italic text-xs font-normal align-middle">
                      Empty Slot
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Row: Price */}
                <tr className="border-b border-[var(--border-color)] hover:bg-slate-950/20 transition-colors">
                  <td className="py-4 pr-4 text-xs font-bold text-slate-450 uppercase">Price</td>
                  {items.map((item) => (
                    <td key={item.id} className="py-4 px-4 text-sm font-extrabold text-white">
                      ${item.discountPrice ? item.discountPrice.toFixed(2) : item.price.toFixed(2)}
                    </td>
                  ))}
                  {Array.from({ length: 4 - items.length }).map((_, idx) => <td key={`empty-price-${idx}`} />)}
                </tr>

                {/* Row: Ratings */}
                <tr className="border-b border-[var(--border-color)] hover:bg-slate-950/20 transition-colors">
                  <td className="py-4 pr-4 text-xs font-bold text-slate-450 uppercase">Rating</td>
                  {items.map((item) => (
                    <td key={item.id} className="py-4 px-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                        <span className="text-xs font-bold text-slate-200">{(item.ratings || 0).toFixed(1)}</span>
                      </div>
                    </td>
                  ))}
                  {Array.from({ length: 4 - items.length }).map((_, idx) => <td key={`empty-rating-${idx}`} />)}
                </tr>

                {/* Row: Brand */}
                <tr className="border-b border-[var(--border-color)] hover:bg-slate-950/20 transition-colors">
                  <td className="py-4 pr-4 text-xs font-bold text-slate-450 uppercase">Brand</td>
                  {items.map((item) => (
                    <td key={item.id} className="py-4 px-4 text-xs text-slate-300 font-semibold">
                      {item.brand || 'Generic'}
                    </td>
                  ))}
                  {Array.from({ length: 4 - items.length }).map((_, idx) => <td key={`empty-brand-${idx}`} />)}
                </tr>

                {/* Rows: Custom Specifications */}
                {allSpecKeys.map((key) => (
                  <tr key={key} className="border-b border-[var(--border-color)] hover:bg-slate-950/20 transition-colors">
                    <td className="py-4 pr-4 text-xs font-bold text-slate-450 uppercase">{key}</td>
                    {items.map((item) => {
                      let val = '-';
                      try {
                        const specs = JSON.parse(item.specifications || '{}');
                        val = specs[key] || '-';
                      } catch {}
                      return (
                        <td key={item.id} className="py-4 px-4 text-xs text-slate-350 leading-normal">
                          {val}
                        </td>
                      );
                    })}
                    {Array.from({ length: 4 - items.length }).map((_, idx) => <td key={`empty-spec-${key}-${idx}`} />)}
                  </tr>
                ))}

                {/* Row: Description */}
                <tr className="border-b border-[var(--border-color)] hover:bg-slate-950/20 transition-colors">
                  <td className="py-4 pr-4 text-xs font-bold text-slate-450 uppercase align-top">Description</td>
                  {items.map((item) => (
                    <td key={item.id} className="py-4 px-4 text-[11px] text-slate-400 leading-relaxed align-top">
                      <div className="line-clamp-4">{item.description}</div>
                    </td>
                  ))}
                  {Array.from({ length: 4 - items.length }).map((_, idx) => <td key={`empty-desc-${idx}`} />)}
                </tr>

                {/* Row: Actions */}
                <tr>
                  <td className="py-4 pr-4 text-xs font-bold text-slate-450 uppercase" />
                  {items.map((item) => (
                    <td key={item.id} className="py-4 px-4">
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="rounded-lg bg-indigo-600 hover:bg-indigo-500 py-2 px-3 text-[10px] font-bold text-white transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-md"
                      >
                        <ShoppingCart className="w-3 h-3" /> Buy Now
                      </button>
                    </td>
                  ))}
                  {Array.from({ length: 4 - items.length }).map((_, idx) => <td key={`empty-actions-${idx}`} />)}
                </tr>
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}
