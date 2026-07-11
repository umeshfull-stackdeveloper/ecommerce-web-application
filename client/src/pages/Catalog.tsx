import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../services/api';
import { ProductCardSkeleton } from '../components/common/Skeleton';
import { Filter, Star, ShoppingCart, ArrowUpDown, ChevronLeft, ChevronRight, Heart, Eye, ArrowRightLeft } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks';
import { addLocalItem } from '../store/slices/cartSlice';
import { addToast } from '../store/slices/toastSlice';
import { addToCompare, removeFromCompare } from '../store/slices/compareSlice';
import QuickViewModal from '../components/common/QuickViewModal';

export default function Catalog() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Auth context for wishlist
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Compare deck states
  const compareItems = useAppSelector((state) => state.compare.items);
  const isCompared = (id: string) => compareItems.some((item: any) => item.id === id);

  // Quick View states
  const [quickViewProduct, setQuickViewProduct] = useState<any>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  // Wishlist Queries & Mutations
  const { data: wishlistData } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => apiRequest('/wishlist'),
    enabled: isAuthenticated
  });
  const wishlistItems = wishlistData?.wishlist?.items || [];
  const isInWishlist = (id: string) => wishlistItems.some((item: any) => item.productId === id);

  const toggleWishlistMutation = useMutation({
    mutationFn: (productId: string) => apiRequest('/wishlist/toggle', {
      method: 'POST',
      body: JSON.stringify({ productId })
    }),
    onSuccess: (res) => {
      dispatch(addToast({ message: res.message, type: 'success' }));
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
    onError: (err: any) => {
      dispatch(addToast({ message: err.message || 'Action failed', type: 'error' }));
    }
  });

  // Retrieve params
  const category = searchParams.get('category') || '';
  const search = searchParams.get('q') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const rating = searchParams.get('rating') || '';
  const inStock = searchParams.get('inStock') || 'false';
  const brand = searchParams.get('brand') || '';
  const color = searchParams.get('color') || '';
  const sortBy = searchParams.get('sortBy') || 'newest';
  const page = searchParams.get('page') || '1';

  // Local filter states for input
  const [localMin, setLocalMin] = useState(minPrice);
  const [localMax, setLocalMax] = useState(maxPrice || '250000'); // default max is ₹2,50,000

  // Fetch Categories
  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiRequest('/products/categories')
  });

  const categoriesList = catData?.categories || [];

  // Fetch Products based on params
  const { data: prodData, isLoading, isError } = useQuery({
    queryKey: ['catalogProducts', category, search, minPrice, maxPrice, rating, inStock, brand, color, sortBy, page],
    queryFn: () => apiRequest('/products', {
      params: {
        category,
        search,
        minPrice,
        maxPrice,
        rating,
        inStock,
        brand,
        color,
        sortBy,
        page,
        limit: '9'
      }
    })
  });

  const products = prodData?.products || [];
  const totalPages = prodData?.pages || 1;
  const currentPage = parseInt(page);

  const updateParam = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1'); // Reset page to 1 on filter
    setSearchParams(newParams);
  };

  const handlePriceApply = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (localMin) newParams.set('minPrice', localMin);
    else newParams.delete('minPrice');
    
    if (localMax) newParams.set('maxPrice', localMax);
    else newParams.delete('maxPrice');

    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('page', newPage.toString());
      setSearchParams(newParams);
    }
  };

  const handleAddToCart = (product: any, event?: React.MouseEvent) => {
    const variant = product.variants?.[0];

    // Dispatch immediately — cart is updated right away regardless of animation
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

    // Fly-to-cart animation — purely cosmetic, runs after dispatch
    const imgElement = document.getElementById(`product-image-${product.id}`) as HTMLImageElement;
    const cartButton = document.getElementById('navbar-cart-btn') || document.getElementById('navbar-cart-btn-mobile');
    
    if (imgElement && cartButton) {
      const imgRect = imgElement.getBoundingClientRect();
      const cartRect = cartButton.getBoundingClientRect();

      // Skip animation if element is not visible
      if (imgRect.width === 0 || imgRect.height === 0) return;
      
      const clone = imgElement.cloneNode(true) as HTMLImageElement;
      clone.removeAttribute('id'); // prevent duplicate IDs
      clone.classList.add('fly-to-cart-item');
      // position:fixed uses viewport coords — getBoundingClientRect() is already viewport-relative
      clone.style.width = `${imgRect.width}px`;
      clone.style.height = `${imgRect.height}px`;
      clone.style.top = `${imgRect.top}px`;
      clone.style.left = `${imgRect.left}px`;
      clone.style.opacity = '1';
      
      document.body.appendChild(clone);
      
      // Double rAF: first frame paints initial state, second triggers CSS transition
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          clone.style.top = `${cartRect.top + cartRect.height / 2 - 15}px`;
          clone.style.left = `${cartRect.left + cartRect.width / 2 - 15}px`;
          clone.style.width = '30px';
          clone.style.height = '30px';
          clone.style.opacity = '0';
        });
      });
      
      // Cleanup clone after animation completes
      setTimeout(() => clone.remove(), 900);
    }
  };

  return (
    <div className="flex flex-col gap-6 py-6 animate-slide-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Smart Product Catalog</h1>
          {search && (
            <p className="text-xs text-slate-400 mt-1">Showing search results for "{search}"</p>
          )}
        </div>
        
        {/* Sort Select */}
        <div className="flex items-center gap-2 border border-slate-800 bg-slate-900/40 rounded-xl px-3 py-1.5 self-end">
          <ArrowUpDown className="w-4 h-4 text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => updateParam('sortBy', e.target.value)}
            className="bg-transparent text-xs text-slate-200 outline-none pr-4 border-none"
          >
            <option value="newest" className="bg-slate-950">Sort by: Newest</option>
            <option value="price_asc" className="bg-slate-950">Price: Low to High</option>
            <option value="price_desc" className="bg-slate-950">Price: High to Low</option>
            <option value="rating" className="bg-slate-950">Popularity (Rating)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Filters Sidebar */}
        <aside className="glass-panel rounded-2xl p-6 flex flex-col gap-6 h-fit">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800/80">
            <span className="font-bold text-base text-white flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-400" /> Filters
            </span>
            <button
              onClick={() => setSearchParams({})}
              className="text-xs text-slate-500 hover:text-indigo-400 transition-colors"
            >
              Clear All
            </button>
          </div>

          {/* Department categories */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Departments</h4>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => updateParam('category', '')}
                className={`text-left text-sm transition-colors font-medium ${!category ? 'text-indigo-400' : 'text-slate-400 hover:text-white'}`}
              >
                All Products
              </button>
              {categoriesList.map((cat: any) => (
                <div key={cat.id} className="flex flex-col gap-1.5 pl-2 border-l border-slate-900">
                  <button
                    onClick={() => updateParam('category', cat.slug)}
                    className={`text-left text-xs transition-colors font-semibold ${category === cat.slug ? 'text-indigo-400' : 'text-slate-450 hover:text-white'}`}
                  >
                    {cat.name}
                  </button>
                  {cat.subcategories?.map((sub: any) => (
                    <button
                      key={sub.id}
                      onClick={() => updateParam('category', sub.slug)}
                      className={`text-left text-[11px] pl-2 transition-colors font-medium ${category === sub.slug ? 'text-indigo-400' : 'text-slate-500 hover:text-white'}`}
                    >
                      - {sub.name}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Price Range Slider */}
          <div className="flex flex-col gap-3 border-t border-[var(--border-color)] pt-4">
            <div className="flex justify-between items-baseline">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Max Price</h4>
              <span className="text-xs font-extrabold text-indigo-400">₹{Number(localMax || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex flex-col gap-2">
              <input
                type="range"
                min="0"
                max="250000"
                step="2500"
                value={localMax}
                onChange={(e) => {
                  setLocalMax(e.target.value);
                  updateParam('maxPrice', e.target.value);
                }}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                <span>₹0</span>
                <span>₹2,50,000</span>
              </div>
            </div>
          </div>

          {/* Brand Filter */}
          <div className="flex flex-col gap-3 border-t border-[var(--border-color)] pt-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Brands</h4>
            <div className="flex flex-wrap gap-1.5">
              {['Apple', 'OnePlus', 'Samsung', 'ASUS', 'Sony', 'Nike', 'Adidas', 'Dyson', 'Xiaomi', 'Realme', 'Bose', 'Pigeon', 'Kent', 'Neutrogena', "Levi's", 'Tommy Hilfiger', 'Yonex', 'Nivia', 'Decathlon', 'Nescafe', 'Happilo', '70mai', 'Honeywell'].map((b) => (
                <button
                  key={b}
                  onClick={() => updateParam('brand', brand === b ? '' : b)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${brand === b ? 'border-indigo-500 bg-indigo-600/20 text-indigo-400' : 'border-[var(--border-color)] text-slate-400 hover:border-slate-700'}`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Color Filter */}
          <div className="flex flex-col gap-3 border-t border-[var(--border-color)] pt-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Colors</h4>
            <div className="flex flex-wrap gap-1.5">
              {['Black', 'White', 'Titanium', 'Red', 'Blue', 'Grey', 'Silver', 'Gold', 'Transparent'].map((c) => (
                <button
                  key={c}
                  onClick={() => updateParam('color', color === c ? '' : c)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${color === c ? 'border-indigo-500 bg-indigo-600/20 text-indigo-400' : 'border-[var(--border-color)] text-slate-400 hover:border-slate-700'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Rating filter selection */}
          <div className="flex flex-col gap-3 border-t border-slate-900 pt-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Customer Rating</h4>
            <div className="flex flex-col gap-2">
              {[4, 3, 2].map((stars) => (
                <button
                  key={stars}
                  onClick={() => updateParam('rating', stars.toString())}
                  className={`flex items-center gap-1.5 text-xs text-left transition-colors ${rating === stars.toString() ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-white'}`}
                >
                  <div className="flex text-amber-400">
                    {Array.from({ length: stars }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <span>& Up</span>
                </button>
              ))}
            </div>
          </div>

          {/* Availability switch */}
          <div className="flex items-center justify-between border-t border-slate-900 pt-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">In Stock Only</span>
            <input
              type="checkbox"
              checked={inStock === 'true'}
              onChange={(e) => updateParam('inStock', e.target.checked.toString())}
              className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
            />
          </div>

        </aside>

        {/* Product Grid section */}
        <div className="lg:col-span-3 flex flex-col gap-8">
          
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <ProductCardSkeleton />
              <ProductCardSkeleton />
              <ProductCardSkeleton />
              <ProductCardSkeleton />
              <ProductCardSkeleton />
              <ProductCardSkeleton />
            </div>
          ) : isError ? (
            <div className="text-center py-12 border border-slate-900 rounded-2xl bg-slate-950/20">
              <p className="text-rose-400 text-sm">Failed to load catalog products. Try again.</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 border border-slate-800 border-dashed rounded-3xl bg-slate-950/20 flex flex-col items-center justify-center">
              <p className="text-slate-400 font-medium">No products match your search/filter criteria</p>
              <button
                onClick={() => setSearchParams({})}
                className="mt-4 rounded-full bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {products.map((product: any) => {
                const imageUrls = JSON.parse(product.images || '[]');
                const displayImage = imageUrls[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400';
                
                const handleCompareToggle = (e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (isCompared(product.id)) {
                    dispatch(removeFromCompare(product.id));
                    dispatch(addToast({ message: `${product.name} removed from comparison`, type: 'info' }));
                  } else {
                    if (compareItems.length >= 4) {
                      dispatch(addToast({ message: 'Compare up to 4 products only', type: 'warning' }));
                      return;
                    }
                    dispatch(addToCompare(product));
                    dispatch(addToast({ message: `${product.name} added to comparison`, type: 'success' }));
                  }
                };

                const handleWishlistToggle = (e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!isAuthenticated) {
                    dispatch(addToast({ message: 'Log in to manage wishlist', type: 'warning' }));
                    return;
                  }
                  toggleWishlistMutation.mutate(product.id);
                };

                const getBadgeStyle = (badgeStr: string) => {
                  switch (badgeStr?.toLowerCase()) {
                    case 'trending': return 'bg-orange-500/80 text-white';
                    case 'best seller': return 'bg-amber-500/80 text-white';
                    case 'limited stock': return 'bg-rose-600/80 text-white animate-pulse';
                    default: return 'bg-indigo-650/80 text-white';
                  }
                };

                return (
                  <div key={product.id} className="glass-panel glass-panel-hover rounded-2xl p-4 flex flex-col gap-3 group relative">
                    {/* Image Box */}
                    <Link to={`/product/${product.slug}`} className="relative h-48 overflow-hidden rounded-xl bg-slate-900/60 block">
                      <img
                        id={`product-image-${product.id}`}
                        src={displayImage}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      
                      {/* Badge (Sale or Custom) */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                        {product.discountPrice && (
                          <span className="rounded-md bg-rose-600 px-2 py-0.5 text-[9px] font-bold text-white shadow">
                            SALE
                          </span>
                        )}
                        {product.badge && (
                          <span className={`rounded-md px-2 py-0.5 text-[9px] font-bold shadow ${getBadgeStyle(product.badge)}`}>
                            {product.badge}
                          </span>
                        )}
                      </div>

                      {/* Wishlist Toggle Heart */}
                      <button
                        onClick={handleWishlistToggle}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-950/60 backdrop-blur-sm border border-[var(--border-color)] text-slate-400 hover:text-rose-500 transition-all z-10 cursor-pointer hover:scale-110 active:scale-90"
                        title={isInWishlist(product.id) ? "Remove from Wishlist" : "Add to Wishlist"}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isInWishlist(product.id) ? 'fill-current text-rose-500' : 'text-slate-350'}`} />
                      </button>

                      {/* Quick View Hover Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setQuickViewProduct(product);
                          setQuickViewOpen(true);
                        }}
                        className="absolute inset-0 m-auto h-9 w-24 bg-slate-950/90 backdrop-blur-sm border border-[var(--border-color)] text-white text-[10px] font-bold rounded-xl flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-xl cursor-pointer hover:scale-105 active:scale-95"
                      >
                        <Eye className="w-3.5 h-3.5" /> Quick View
                      </button>
                    </Link>

                    {/* Metadata details */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                        {product.category?.name}
                      </span>
                      <Link to={`/product/${product.slug}`} className="font-bold text-sm tracking-tight text-white hover:text-indigo-400 line-clamp-1 transition-colors">
                        {product.name}
                      </Link>
                      
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                        <span className="text-[10px] text-slate-400 font-semibold">{product.ratings.toFixed(1)}</span>
                      </div>

                      <p className="text-xs text-slate-450 leading-relaxed line-clamp-2 mt-1">
                        {product.description}
                      </p>
                    </div>

                    {/* Pricing & Actions */}
                    <div className="flex justify-between items-center mt-auto pt-2 border-t border-[var(--border-color)]">
                      <div className="flex flex-col">
                        {product.discountPrice ? (
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-base text-white">
                              ₹{product.discountPrice.toLocaleString('en-IN')}
                            </span>
                            <span className="text-xs text-slate-500 line-through">
                              ₹{product.price.toLocaleString('en-IN')}
                            </span>
                          </div>
                        ) : (
                          <span className="font-bold text-base text-white">
                            ₹{product.price.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Compare toggle */}
                        <button
                          onClick={handleCompareToggle}
                          className={`rounded-lg p-2 transition-all border cursor-pointer hover:scale-105 active:scale-95 ${isCompared(product.id) ? 'bg-indigo-650/20 border-indigo-500 text-indigo-400' : 'border-[var(--border-color)] text-slate-450 hover:text-white'}`}
                          title="Add to Compare"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => handleAddToCart(product, e)}
                          className="rounded-lg bg-indigo-650 hover:bg-indigo-500 p-2 text-white transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
                          title="Add to Cart"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageChange(i + 1)}
                  className={`h-9 w-9 rounded-lg border text-xs font-bold transition-all ${currentPage === i + 1 ? 'border-indigo-500 bg-indigo-600/20 text-indigo-400' : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white'}`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>

      </div>

      <QuickViewModal 
        product={quickViewProduct} 
        isOpen={quickViewOpen} 
        onClose={() => { setQuickViewOpen(false); setQuickViewProduct(null); }} 
      />
    </div>
  );
}
