import { useState } from 'react';
import { X, Star, ShoppingCart, Heart } from 'lucide-react';
import { useAppDispatch } from '../../hooks/reduxHooks';
import { addLocalItem } from '../../store/slices/cartSlice';
import { addToast } from '../../store/slices/toastSlice';

interface QuickViewModalProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  const dispatch = useAppDispatch();

  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const imageUrls = JSON.parse(product.images || '[]');
  const displayImage = imageUrls[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600';
  const ratingScore = product.ratings || 0;

  // Extract unique sizes & colors from variants
  const sizes = Array.from(new Set(product.variants?.map((v: any) => v.size).filter(Boolean))) as string[];
  const colors = Array.from(new Set(product.variants?.map((v: any) => v.color).filter(Boolean))) as string[];

  const handleAddToCart = () => {
    // If variants exist, warn user if they haven't selected one
    if (sizes.length > 0 && !selectedSize) {
      dispatch(addToast({ message: 'Please select a size', type: 'warning' }));
      return;
    }
    if (colors.length > 0 && !selectedColor) {
      dispatch(addToast({ message: 'Please select a color', type: 'warning' }));
      return;
    }

    dispatch(addLocalItem({
      productId: product.id,
      quantity,
      selectedSize,
      selectedColor,
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
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-panel w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl relative flex flex-col md:flex-row max-h-[90vh] md:max-h-none overflow-y-auto md:overflow-visible">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full border border-[var(--border-color)] bg-slate-900/40 text-slate-400 hover:text-white transition-colors cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left: Image */}
        <div className="w-full md:w-1/2 bg-slate-950/80 p-6 flex items-center justify-center border-b md:border-b-0 md:border-r border-[var(--border-color)]">
          <img 
            src={displayImage} 
            alt={product.name} 
            className="max-h-64 md:max-h-96 object-contain rounded-2xl"
          />
        </div>

        {/* Right: Info */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-wider">
              {product.category?.name}
            </span>
            <h2 className="text-xl md:text-2xl font-extrabold text-white leading-tight">
              {product.name}
            </h2>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex items-center text-amber-400">
                <Star className="w-4 h-4 fill-current" />
              </div>
              <span className="text-xs text-slate-400 font-bold mt-0.5">
                {ratingScore.toFixed(1)} / 5.0
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed max-h-24 overflow-y-auto">
            {product.description}
          </p>

          {/* Pricing */}
          <div className="flex items-baseline gap-2">
            {product.discountPrice ? (
              <>
                <span className="text-2xl font-black text-white">
                  ₹{product.discountPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-sm text-slate-500 line-through">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
              </>
            ) : (
              <span className="text-2xl font-black text-white">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Swatches Selection */}
          <div className="flex flex-col gap-4">
            {/* Colors */}
            {colors.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Available Colors</span>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${selectedColor === color ? 'border-indigo-500 bg-indigo-600/20 text-indigo-400' : 'border-[var(--border-color)] text-slate-350 hover:border-slate-700'}`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {sizes.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Select Size</span>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${selectedSize === size ? 'border-indigo-500 bg-indigo-600/20 text-indigo-400' : 'border-[var(--border-color)] text-slate-350 hover:border-slate-700'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quantity and Actions */}
          <div className="flex items-center gap-4 mt-auto pt-4 border-t border-[var(--border-color)]">
            <div className="flex items-center border border-[var(--border-color)] bg-slate-950/60 rounded-xl overflow-hidden">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2 text-slate-450 hover:bg-slate-900 transition-colors font-bold cursor-pointer"
              >
                -
              </button>
              <span className="px-4 text-xs font-bold text-white">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-2 text-slate-450 hover:bg-slate-900 transition-colors font-bold cursor-pointer"
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              className="flex-grow rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 text-xs md:text-sm font-bold text-white shadow-lg hover:shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <ShoppingCart className="w-4 h-4" /> Add to Cart
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
