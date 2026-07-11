import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Eye } from 'lucide-react';

export default function RecentlyViewedRail() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    try {
      const history = JSON.parse(localStorage.getItem('recently_viewed') || '[]');
      setItems(history);
    } catch (err) {
      console.error('Failed to load recently viewed items from localstorage:', err);
    }
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-6 border-t border-[var(--border-color)] pt-8 mt-4">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Eye className="w-5 h-5 text-indigo-400" /> Recently Viewed
        </h2>
        <p className="text-xs text-slate-450 mt-1">Jump back into products you recently browsed</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
        {items.map((product) => {
          const images = JSON.parse(product.images || '[]');
          const displayImage = images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200';
          const ratingScore = product.ratings || 0;

          return (
            <div 
              key={product.id} 
              className="glass-panel glass-panel-hover rounded-xl p-3 flex flex-col gap-2 relative group"
            >
              <Link 
                to={`/product/${product.slug}`} 
                className="relative h-28 overflow-hidden rounded-lg bg-slate-900/60 block"
              >
                <img 
                  src={displayImage} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </Link>

              <div className="flex flex-col gap-0.5">
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">
                  {product.category?.name}
                </span>
                <Link 
                  to={`/product/${product.slug}`} 
                  className="font-extrabold text-xs text-white hover:text-indigo-400 line-clamp-1 transition-colors"
                >
                  {product.name}
                </Link>
                <div className="flex items-center gap-1">
                  <Star className="w-2.5 h-2.5 text-amber-400 fill-current" />
                  <span className="text-[9px] text-slate-400 font-bold">{ratingScore.toFixed(1)}</span>
                </div>
                <span className="text-xs font-black text-white mt-1">
                  ${product.discountPrice ? product.discountPrice.toFixed(2) : product.price.toFixed(2)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
