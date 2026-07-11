import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../services/api';
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks';
import { addLocalItem } from '../store/slices/cartSlice';
import { useToast } from '../hooks/useToast';
import { Star, ShoppingCart, Heart, Send, Sparkles, Check, Package, MessageSquare } from 'lucide-react';
import { Skeleton } from '../components/common/Skeleton';
import RecentlyViewedRail from '../components/common/RecentlyViewedRail';
import socketService from '../socket/socketService';

export default function ProductDetails() {
  const { slug } = useParams();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Fetch product details
  const { data, isLoading, isError } = useQuery({
    queryKey: ['productDetails', slug],
    queryFn: () => apiRequest(`/products/details/${slug}`)
  });

  const product = data?.product;

  // Variant choices states
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Review states
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [activeRecTab, setActiveRecTab] = useState<'related' | 'frequentlyBought' | 'personalized'>('related');

  // Pincode and Q&A states
  const [pincode, setPincode] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState<{ status: 'success' | 'error' | 'idle'; message: string }>({ status: 'idle', message: '' });
  const [qaQuestion, setQaQuestion] = useState('');
  const [qaList, setQaList] = useState<Array<{ q: string; a: string; date: string }>>([]);

  // Initialize Q&A list dynamically
  useEffect(() => {
    if (product) {
      const defaultQA = [
        {
          q: `Is this ${product.name} an original product with brand warranty?`,
          a: `Yes, absolutely. All products on NEXUS INDIA are sourced from authorized sellers. This product includes standard 1-year brand warranty.`,
          date: '2 weeks ago'
        },
        {
          q: "What is the return/replacement policy?",
          a: "This product is covered under our 7-day return and replacement window. In case of any technical or transit issues, you can initiate a return directly from your dashboard.",
          date: '1 week ago'
        }
      ];
      setQaList(defaultQA);
    }
  }, [product]);

  const handleAskQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qaQuestion.trim()) return;
    setQaList(prev => [
      {
        q: qaQuestion,
        a: "Thank you for your question. The seller or other customers usually answer within 24 hours.",
        date: "Just now"
      },
      ...prev
    ]);
    setQaQuestion('');
    toast.success("Question submitted successfully!");
  };

  const checkPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pincode)) {
      setPincodeStatus({ status: 'error', message: 'Please enter a valid 6-digit Indian pincode (e.g., 110001).' });
      return;
    }
    const isExpress = ['110', '400', '560', '600', '700', '500'].some(prefix => pincode.startsWith(prefix));
    const deliveryDays = isExpress ? 'Tomorrow' : 'in 2-3 business days';
    setPincodeStatus({
      status: 'success',
      message: `Delivery by ${deliveryDays}. Free delivery available (eligible for ₹499 free threshold).`
    });
  };

  // Log recently viewed product
  useEffect(() => {
    if (product) {
      // 1. Log to localStorage (local history)
      try {
        const localHistory = JSON.parse(localStorage.getItem('recently_viewed') || '[]');
        const filteredHistory = localHistory.filter((item: any) => item.id !== product.id);
        filteredHistory.unshift({
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          discountPrice: product.discountPrice,
          images: product.images,
          ratings: product.ratings,
          category: product.category
        });
        localStorage.setItem('recently_viewed', JSON.stringify(filteredHistory.slice(0, 12)));
      } catch (err) {
        console.error('Failed to log product to local storage:', err);
      }

      // 2. Log to database if authenticated
      if (isAuthenticated) {
        apiRequest('/recommendations/viewed', {
          method: 'POST',
          body: JSON.stringify({ productId: product.id })
        }).catch((err) => console.error('Failed to log product view to database:', err));
      }
    }
  }, [product, isAuthenticated]);

  // Listen for real-time inventory updates
  useEffect(() => {
    const handleInventoryUpdate = (data: { productId: string; variantId: string; stock: number }) => {
      if (product && data.productId === product.id) {
        queryClient.invalidateQueries({ queryKey: ['productDetails', slug] });
        toast.info("Stock levels updated in real-time!");
      }
    };

    const unsubscribe = socketService.onInventoryUpdate(handleInventoryUpdate);
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [product, slug, queryClient]);

  // Fetch recommendations
  const { data: recData } = useQuery({
    queryKey: ['recommendations', product?.id],
    queryFn: () => apiRequest('/recommendations', { params: { productId: product?.id } }),
    enabled: !!product?.id
  });

  const recommendations = recData?.products || [];
  const related = recData?.related || [];
  const frequentlyBought = recData?.frequentlyBought || [];
  const personalized = recData?.personalized || [];

  const recTabItems = activeRecTab === 'related' 
    ? related 
    : activeRecTab === 'frequentlyBought' 
      ? frequentlyBought 
      : personalized;

  // Toggle Wishlist mutation
  const wishlistMutation = useMutation({
    mutationFn: () => apiRequest('/wishlist/toggle', {
      method: 'POST',
      body: JSON.stringify({ productId: product?.id })
    }),
    onSuccess: (res) => {
      toast.success(res.message);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update wishlist');
    }
  });

  // Submit Review mutation
  const reviewMutation = useMutation({
    mutationFn: (body: any) => apiRequest(`/products/${product?.id}/reviews`, {
      method: 'POST',
      body: JSON.stringify(body)
    }),
    onSuccess: () => {
      toast.success('Review submitted successfully');
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: ['productDetails', slug] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to submit review');
    }
  });

  // Bidding states and mutation
  const [bidAmountInput, setBidAmountInput] = useState('');
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  const bidMutation = useMutation({
    mutationFn: (amount: number) => apiRequest(`/products/${product?.id}/bids`, {
      method: 'POST',
      body: JSON.stringify({ bidAmount: amount })
    }),
    onSuccess: (res: any) => {
      toast.success(res.message || 'Bid submitted successfully');
      setBidAmountInput('');
      queryClient.invalidateQueries({ queryKey: ['productDetails', slug] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to submit bid');
    }
  });

  const handlePlaceBid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.warning('Please log in to place a bid');
      return;
    }
    const amt = parseFloat(bidAmountInput);
    if (isNaN(amt) || amt <= 0) {
      toast.warning('Please enter a valid bid amount');
      return;
    }
    bidMutation.mutate(amt);
  };

  // Countdown timer hook
  useEffect(() => {
    const targetDate = product?.flashSaleEnd || product?.auctionEnd;
    if (!targetDate) return;

    const calculateTime = () => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference <= 0) {
        setTimeLeft(null);
        return false;
      } else {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
        return true;
      }
    };

    calculateTime();
    const timer = setInterval(() => {
      const active = calculateTime();
      if (!active) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [product?.flashSaleEnd, product?.auctionEnd]);

  if (isLoading) {
    return (
      <div className="py-12 flex flex-col gap-12 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="h-[400px] w-full rounded-2xl" />
          <div className="flex flex-col gap-4">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-[150px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-bold text-slate-350">Product Not Found</h2>
        <Link to="/search" className="text-indigo-400 mt-4 inline-block hover:underline">
          Return to Catalog
        </Link>
      </div>
    );
  }

  const imageUrls = JSON.parse(product.images || '[]');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'standard' | '360'>('standard');
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({});

  const displayImage = imageUrls[activeImageIndex] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800';

  // Compute product sizes / colors
  const sizes = Array.from(new Set(product.variants?.map((v: any) => v.size).filter(Boolean))) as string[];
  const colors = Array.from(new Set(product.variants?.map((v: any) => v.color).filter(Boolean))) as string[];

  // Find matching stock level
  const activeVariant = product.variants?.find((v: any) => {
    const sizeMatch = sizes.length === 0 || v.size === selectedSize;
    const colorMatch = colors.length === 0 || v.color === selectedColor;
    return sizeMatch && colorMatch;
  });

  const availableStock = activeVariant ? activeVariant.stock : 0;

  const handleAddToCart = () => {
    if (sizes.length > 0 && !selectedSize) {
      toast.warning('Please select a size');
      return;
    }
    if (colors.length > 0 && !selectedColor) {
      toast.warning('Please select a color');
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

    toast.success('Added to Shopping Cart!');
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.warning('Please log in to submit a review');
      return;
    }
    if (!newComment.trim()) return;

    reviewMutation.mutate({
      rating: newRating,
      comment: newComment
    });
  };

  return (
    <div className="py-6 flex flex-col gap-16 max-w-6xl mx-auto animate-slide-up">
      
      {/* Product top row */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
        
        {/* Gallery */}
        <div className="flex flex-col gap-4">
          
          {/* Controls to Switch Mode */}
          <div className="flex justify-between items-center bg-slate-950/40 p-2 rounded-2xl border border-[var(--border-color)]">
            <span className="text-xs font-bold text-slate-400 pl-2">Viewer Mode</span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setViewMode('standard')}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${viewMode === 'standard' ? 'bg-indigo-650 text-white shadow-md' : 'text-slate-450 hover:text-slate-200'}`}
              >
                Standard (Zoom)
              </button>
              <button
                onClick={() => setViewMode('360')}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${viewMode === '360' ? 'bg-indigo-650 text-white shadow-md' : 'text-slate-450 hover:text-slate-200'}`}
              >
                360° Drag Rotate
              </button>
            </div>
          </div>

          {/* Main Visual box */}
          <div 
            className={`aspect-square w-full overflow-hidden rounded-3xl bg-slate-950/60 border border-[var(--border-color)] relative cursor-zoom-in overflow-hidden ${viewMode === '360' ? 'cursor-grab active:cursor-grabbing select-none' : ''}`}
            onMouseMove={(e) => {
              if (viewMode === 'standard') {
                const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - left) / width) * 100;
                const y = ((e.clientY - top) / height) * 100;
                setZoomStyle({
                  transformOrigin: `${x}% ${y}%`,
                  transform: 'scale(1.8)'
                });
              } else if (isDragging) {
                const deltaX = e.clientX - startX;
                if (Math.abs(deltaX) > 20) {
                  const direction = deltaX > 0 ? -1 : 1;
                  setActiveImageIndex((prev) => {
                    const nextIndex = prev + direction;
                    if (nextIndex < 0) return imageUrls.length - 1;
                    return nextIndex % imageUrls.length;
                  });
                  setStartX(e.clientX);
                }
              }
            }}
            onMouseLeave={() => {
              if (viewMode === 'standard') {
                setZoomStyle({});
              } else {
                setIsDragging(false);
              }
            }}
            onMouseDown={(e) => {
              if (viewMode === '360') {
                setIsDragging(true);
                setStartX(e.clientX);
              }
            }}
            onMouseUp={() => {
              if (viewMode === '360') {
                setIsDragging(false);
              }
            }}
          >
            {viewMode === '360' && (
              <span className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-sm text-[9px] font-bold text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full z-10 select-none">
                360° View: Drag mouse horizontally
              </span>
            )}
            
            <img 
              src={displayImage} 
              alt={product.name} 
              className="w-full h-full object-cover transition-transform duration-100 ease-out pointer-events-none" 
              style={viewMode === 'standard' ? zoomStyle : undefined}
              draggable={false}
            />
          </div>

          {/* Thumbnail list */}
          {imageUrls.length > 1 && (
            <div className="grid grid-cols-4 gap-2.5">
              {imageUrls.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => { setViewMode('standard'); setActiveImageIndex(idx); }}
                  className={`aspect-square rounded-xl overflow-hidden bg-slate-950/60 border cursor-pointer transition-all ${idx === activeImageIndex ? 'border-indigo-500 ring-2 ring-indigo-500/25' : 'border-[var(--border-color)] hover:border-slate-700'}`}
                >
                  <img src={img} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Configurations details */}
        <div className="flex flex-col gap-6">
          {/* Flash Sale Banner */}
          {product.flashSaleEnd && new Date(product.flashSaleEnd) > new Date() && timeLeft && (
            <div className="bg-gradient-to-r from-pink-500/10 to-indigo-500/10 border border-pink-500/20 rounded-2xl p-4 flex justify-between items-center animate-pulse">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-pink-400 uppercase tracking-widest">⚡ Flash Sale Ending In</span>
                <span className="text-xs text-slate-350">Grab this product at a massive discount!</span>
              </div>
              <div className="flex gap-2 text-xs font-mono font-extrabold text-white">
                <span className="bg-slate-950/80 px-2 py-1 rounded border border-slate-900">{String(timeLeft.days).padStart(2, '0')}d</span>
                <span>:</span>
                <span className="bg-slate-950/80 px-2 py-1 rounded border border-slate-900">{String(timeLeft.hours).padStart(2, '0')}h</span>
                <span>:</span>
                <span className="bg-slate-950/80 px-2 py-1 rounded border border-slate-900">{String(timeLeft.minutes).padStart(2, '0')}m</span>
                <span>:</span>
                <span className="bg-slate-950/80 px-2 py-1 rounded border border-slate-900">{String(timeLeft.seconds).padStart(2, '0')}s</span>
              </div>
            </div>
          )}

          {/* Auction Banner */}
          {product.auctionEnd && new Date(product.auctionEnd) > new Date() && timeLeft && (
            <div className="bg-gradient-to-r from-amber-500/10 to-indigo-500/10 border border-amber-500/20 rounded-2xl p-4 flex justify-between items-center">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">🏛️ Live Auction Bid Clock</span>
                <span className="text-xs text-slate-350">Place your bid before hammer falls!</span>
              </div>
              <div className="flex gap-2 text-xs font-mono font-extrabold text-white">
                <span className="bg-slate-950/80 px-2 py-1 rounded border border-slate-900">{String(timeLeft.days).padStart(2, '0')}d</span>
                <span>:</span>
                <span className="bg-slate-950/80 px-2 py-1 rounded border border-slate-900">{String(timeLeft.hours).padStart(2, '0')}h</span>
                <span>:</span>
                <span className="bg-slate-950/80 px-2 py-1 rounded border border-slate-900">{String(timeLeft.minutes).padStart(2, '0')}m</span>
                <span>:</span>
                <span className="bg-slate-950/80 px-2 py-1 rounded border border-slate-900">{String(timeLeft.seconds).padStart(2, '0')}s</span>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full w-fit">
              {product.category?.name}
            </span>
            {product.badge && (
              <span className="text-[10px] font-extrabold uppercase px-2 py-1 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/15 animate-pulse">
                {product.badge}
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">{product.name}</h1>

          {/* Ratings summary */}
          <div className="flex items-center gap-4 border-b border-slate-900 pb-4">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-amber-400 fill-current" />
              <span className="text-sm font-bold text-slate-200 mt-0.5">{product.ratings.toFixed(1)}</span>
            </div>
            <span className="text-slate-500">|</span>
            <span className="text-xs text-slate-450">{product.reviews?.length || 0} customer reviews</span>
          </div>

          <p className="text-sm text-slate-400 leading-relaxed">{product.description}</p>

          {/* Variants Selectors */}
          <div className="flex flex-col gap-4 border-y border-slate-900 py-6">
            
            {/* Sizes */}
            {sizes.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-400">Select Size</span>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${selectedSize === sz ? 'border-indigo-500 bg-indigo-600/20 text-indigo-400' : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white'}`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Colors */}
            {colors.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-400">Select Color</span>
                <div className="flex flex-wrap gap-2">
                  {colors.map((col) => (
                    <button
                      key={col}
                      onClick={() => setSelectedColor(col)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${selectedColor === col ? 'border-indigo-500 bg-indigo-600/20 text-indigo-400' : 'border-slate-800 bg-slate-900/40 text-slate-450 hover:text-white'}`}
                    >
                      {col}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stock status indicator */}
            <div className="flex items-center gap-2 mt-2">
              <Package className="w-4 h-4 text-slate-500" />
              <span className={`text-xs font-semibold ${availableStock > 0 ? 'text-emerald-450' : 'text-rose-400'}`}>
                {availableStock > 0 ? `In Stock (${availableStock} items remaining)` : 'Out of Stock'}
              </span>
            </div>

          </div>

          {product.auctionEnd ? (
            <div className="flex flex-col gap-4 border-t border-slate-900 pt-6">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-450 uppercase">Current Highest Bid</span>
                <span className="text-2xl font-extrabold text-amber-400">
                  ₹{(product.bids?.[0]?.bidAmount || product.minBid || product.price).toLocaleString('en-IN')}
                </span>
              </div>

              {new Date(product.auctionEnd) > new Date() ? (
                <form onSubmit={handlePlaceBid} className="flex gap-2.5">
                  <input
                    type="number"
                    step="0.01"
                    placeholder={`Min bid: ₹${((product.bids?.[0]?.bidAmount || product.minBid || product.price) + 1).toLocaleString('en-IN')}`}
                    value={bidAmountInput}
                    onChange={(e) => setBidAmountInput(e.target.value)}
                    className="flex-1 rounded-full border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-amber-550/80 focus:ring-1 focus:ring-amber-550/30"
                  />
                  <button
                    type="submit"
                    disabled={bidMutation.isPending}
                    className="rounded-full bg-amber-600 hover:bg-amber-550 px-6 py-2.5 text-xs font-bold text-slate-950 flex items-center justify-center cursor-pointer shadow-lg hover:shadow-amber-500/10 transition-all active:scale-95 disabled:opacity-40"
                  >
                    Place Bid
                  </button>
                </form>
              ) : (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center text-xs font-bold text-rose-400">
                  🏛️ Auction Closed. Winner:{' '}
                  <span className="text-white font-extrabold">
                    {product.bids?.[0] ? `${product.bids[0].userName} (₹${product.bids[0].bidAmount.toLocaleString('en-IN')})` : 'No bids placed'}
                  </span>
                </div>
              )}

              {/* Bids Log */}
              {product.bids && product.bids.length > 0 && (
                <div className="flex flex-col gap-2 bg-slate-950/40 border border-slate-900 rounded-2xl p-4 mt-2">
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest border-b border-slate-900 pb-2">Bids History</span>
                  <div className="flex flex-col gap-2 max-h-[120px] overflow-y-auto pt-1 pr-1">
                    {product.bids.map((b: any, idx: number) => (
                      <div key={b.id || idx} className="flex justify-between text-xs">
                        <span className="text-slate-350 flex items-center gap-1">
                          <span className={`h-1.5 w-1.5 rounded-full ${idx === 0 ? 'bg-amber-500 animate-pulse' : 'bg-slate-750'}`} />
                          {b.userName}
                        </span>
                        <span className={`font-bold ${idx === 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                          ₹{b.bidAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Pricing and Actions */}
              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  {product.discountPrice ? (
                    <div className="flex items-baseline gap-2">
                      <span className="font-extrabold text-2xl text-white">
                        ₹{product.discountPrice.toLocaleString('en-IN')}
                      </span>
                      <span className="text-sm text-slate-500 line-through">
                        ₹{product.price.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ) : (
                    <span className="font-extrabold text-2xl text-white">
                      ₹{product.price.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                <div className="flex items-center border border-slate-800 bg-slate-950 rounded-xl px-2">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 text-slate-500 hover:text-white">-</button>
                  <span className="px-4 text-xs font-bold text-slate-300">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="p-2 text-slate-500 hover:text-white">+</button>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={availableStock === 0}
                  className="flex-1 rounded-full bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-indigo-500/10"
                >
                  <ShoppingCart className="w-4 h-4" /> Add to Shopping Cart
                </button>
                
                {isAuthenticated && (
                  <button
                    onClick={() => wishlistMutation.mutate()}
                    className="p-3 rounded-full border border-slate-850 bg-slate-900/50 text-slate-400 hover:text-rose-500 hover:border-rose-500/30 transition-all cursor-pointer"
                    title="Add to Wishlist"
                  >
                    <Heart className="w-5 h-5" />
                  </button>
                )}

                {/* Direct message to seller link */}
                {isAuthenticated && (
                  <Link
                    to={`/chat?userId=${product.seller?.userId}`}
                    className="p-3 rounded-full border border-slate-850 bg-slate-900/50 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30 transition-all"
                    title="Message Seller"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </Link>
                )}
              </div>
            </>
          )}

          {/* Pincode Estimator Widget */}
          <div className="border-t border-slate-900 pt-6 mt-2">
            <span className="text-xs font-bold text-slate-450">Delivery & Pincode Checker</span>
            <form onSubmit={checkPincode} className="flex gap-2.5 mt-2">
              <input
                type="text"
                maxLength={6}
                placeholder="Enter 6-digit Pincode (e.g. 110001)"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs text-slate-205 outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-bold px-4 py-2 text-slate-300 transition-all cursor-pointer"
              >
                Check
              </button>
            </form>
            {pincodeStatus.status !== 'idle' && (
              <div className={`mt-2 p-3 rounded-xl text-xs font-semibold border flex items-center gap-2 ${
                pincodeStatus.status === 'success' 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-450' 
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-450'
              }`}>
                {pincodeStatus.status === 'success' && <Check className="w-4 h-4 shrink-0 text-emerald-500" />}
                <span>{pincodeStatus.message}</span>
              </div>
            )}
          </div>

          <div className="border-t border-slate-900 pt-4 flex flex-col gap-2">
            <div className="flex items-center gap-3 bg-slate-950/40 p-3 rounded-2xl border border-slate-900">
              {product.seller?.logoUrl ? (
                <img src={product.seller.logoUrl} alt={product.seller.companyName} className="w-10 h-10 rounded-xl object-cover border border-slate-800" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                  {product.seller?.companyName?.charAt(0) || 'S'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-extrabold text-xs text-white truncate">{product.seller?.companyName || 'Verified Seller'}</h4>
                <p className="text-[10px] text-slate-450 mt-0.5 line-clamp-1">{product.seller?.description || 'Professional marketplace vendor.'}</p>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                  <span className="text-xs font-black text-slate-200">
                    {product.seller?.ratings ? product.seller.ratings.toFixed(1) : '5.0'}
                  </span>
                </div>
                <span className="text-[9px] text-slate-500 font-semibold">
                  {product.seller?.reviewCount || 0} reviews
                </span>
              </div>
            </div>
            <div className="text-[10px] text-slate-550 flex gap-4 px-1">
              <span>SKU: <strong className="text-slate-400">{activeVariant?.sku || 'N/A'}</strong></span>
            </div>
          </div>

        </div>

      </section>

      {/* Specifications & Customer Q&A Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-slate-900 pt-10">
        
        {/* Specifications Table */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">Technical Specifications</h2>
          </div>
          <div className="border border-slate-850 rounded-2xl overflow-hidden bg-slate-950/20">
            <table className="w-full text-xs text-left">
              <tbody>
                {(() => {
                  let specs: Record<string, string> = {};
                  try {
                    specs = JSON.parse(product.specifications || '{}');
                  } catch (e) {}

                  // Fallback specs if none populated or empty
                  if (Object.keys(specs).length === 0) {
                    specs = {
                      "Brand": product.brand || "NEXUS Brand",
                      "Model Name": product.name,
                      "Category": product.category?.name || "Premium Goods",
                      "Warranty": "1 Year Brand Warranty",
                      "Return Policy": "7 Days Return/Replacement",
                      "Shipping Details": "Free Delivery above ₹499",
                      "Country of Origin": "India"
                    };
                  }

                  return Object.entries(specs).map(([key, val], idx) => (
                    <tr key={idx} className="border-b border-slate-900 last:border-0 hover:bg-slate-900/10 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-450 bg-slate-950/40 w-1/3 border-r border-slate-900">{key}</td>
                      <td className="px-4 py-3 text-slate-205">{val}</td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Q&A Block */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">Customer Questions & Answers</h2>
          </div>

          <form onSubmit={handleAskQuestion} className="flex gap-2.5">
            <input
              type="text"
              placeholder="Have a question? Ask the seller..."
              value={qaQuestion}
              onChange={(e) => setQaQuestion(e.target.value)}
              className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs text-slate-205 outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="rounded-xl bg-indigo-650 hover:bg-indigo-600 px-5 py-2 text-xs font-bold text-white transition-all active:scale-95 cursor-pointer"
            >
              Ask
            </button>
          </form>

          <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-1">
            {qaList.map((qa, idx) => (
              <div key={idx} className="flex flex-col gap-2 p-4 border border-slate-900 rounded-2xl bg-slate-950/20">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex gap-1.5 items-start">
                    <span className="bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase mt-0.5">Q</span>
                    <p className="text-xs font-bold text-slate-200 leading-snug">{qa.q}</p>
                  </div>
                  <span className="text-[9px] text-slate-500 shrink-0 mt-0.5">{qa.date}</span>
                </div>
                <div className="flex gap-1.5 items-start pl-6">
                  <span className="bg-emerald-600/10 border border-emerald-500/20 text-emerald-450 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase mt-0.5">A</span>
                  <p className="text-xs text-slate-400 leading-relaxed">{qa.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* AI Recommendation rail */}
      {(related.length > 0 || frequentlyBought.length > 0 || personalized.length > 0) && (
        <section className="flex flex-col gap-6 border-t border-slate-900 pt-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl font-bold text-white">AI Recommendations</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'related', label: 'Related Products' },
                { id: 'frequentlyBought', label: 'Frequently Bought Together' },
                { id: 'personalized', label: 'Personalized For You' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveRecTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    activeRecTab === tab.id
                      ? 'bg-indigo-650 text-white border-indigo-600 shadow-md shadow-indigo-600/10'
                      : 'text-slate-450 border-transparent hover:text-slate-200 hover:border-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {recTabItems.length === 0 ? (
            <p className="text-slate-500 text-xs py-8 text-center border border-dashed border-slate-850 rounded-xl">No smart recommendations found for this section.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {recTabItems.slice(0, 4).map((rec: any) => {
                const recImg = JSON.parse(rec.images || '[]')[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400';
                return (
                  <div key={rec.id} className="glass-panel glass-panel-hover rounded-xl p-3 flex flex-col gap-2 relative group">
                    <Link to={`/product/${rec.slug}`} className="h-32 overflow-hidden rounded-lg bg-slate-950 block">
                      <img src={recImg} className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300" />
                    </Link>
                    <Link to={`/product/${rec.slug}`} className="font-bold text-xs text-white hover:text-indigo-400 line-clamp-1">
                      {rec.name}
                    </Link>
                    <div className="flex justify-between items-center mt-1">
                      <span className="font-semibold text-xs text-slate-200">₹{rec.price.toLocaleString('en-IN')}</span>
                      <div className="flex items-center text-[10px] text-amber-400">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        <span className="text-slate-400 font-semibold pl-0.5">{rec.ratings.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Reviews Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-slate-900 pt-10">
        
        {/* Left pane: ratings breakdown */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-white">Customer Reviews</h2>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-white">{product.ratings.toFixed(1)}</span>
            <span className="text-sm text-slate-500">out of 5</span>
          </div>
          <div className="flex items-center gap-1 text-amber-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`w-5 h-5 fill-current ${i < Math.round(product.ratings) ? 'text-amber-400' : 'text-slate-700'}`} />
            ))}
          </div>

          {/* Ratings Distribution Bars */}
          <div className="flex flex-col gap-2.5 mt-2 bg-slate-950/20 p-4 border border-slate-850 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest border-b border-slate-900 pb-2">Rating Distribution</span>
            {[
              { stars: 5, pct: 75, count: 42 },
              { stars: 4, pct: 15, count: 8 },
              { stars: 3, pct: 6, count: 3 },
              { stars: 2, pct: 3, count: 1 },
              { stars: 1, pct: 1, count: 0 }
            ].map((dist) => (
              <div key={dist.stars} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-slate-400 font-bold">{dist.stars}</span>
                <Star className="w-3 h-3 text-amber-400 fill-current shrink-0" />
                <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${dist.pct}%` }} />
                </div>
                <span className="w-8 text-right text-[10px] text-slate-500 font-semibold">{dist.pct}%</span>
              </div>
            ))}
          </div>
          
          {/* Write a review form */}
          <form onSubmit={handleReviewSubmit} className="flex flex-col gap-3 mt-4 bg-slate-950/20 p-4 border border-slate-850 rounded-2xl">
            <h3 className="font-semibold text-xs text-slate-350">Write an honest review</h3>
            <div className="flex gap-1 items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setNewRating(i + 1)}
                  className="text-amber-400 p-0.5 cursor-pointer"
                >
                  <Star className={`w-4 h-4 fill-current ${i < newRating ? 'text-amber-400' : 'text-slate-700'}`} />
                </button>
              ))}
            </div>
            <textarea
              placeholder="Share your thoughts about this product..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-300 outline-none h-20 resize-none focus:border-indigo-500/80"
            />
            <button
              type="submit"
              disabled={reviewMutation.isPending}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white flex items-center justify-center gap-1.5 hover:bg-indigo-500 cursor-pointer disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" /> Submit Review
            </button>
          </form>
        </div>

        {/* Right pane: list of reviews */}
        <div className="md:col-span-2 flex flex-col gap-4">
          <h2 className="text-xl font-bold text-white">Latest Feedback</h2>
          {product.reviews?.length === 0 ? (
            <p className="text-slate-500 text-xs py-8 text-center border border-dashed border-slate-800 rounded-2xl">No reviews yet. Be the first to review!</p>
          ) : (
            <div className="flex flex-col gap-4">
              {product.reviews?.map((rev: any) => (
                <div key={rev.id} className="p-4 border border-slate-900 rounded-2xl bg-slate-950/20 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs text-slate-300">{rev.user?.name}</span>
                    <span className="text-[10px] text-slate-550">{new Date(rev.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 fill-current ${i < rev.rating ? 'text-amber-400' : 'text-slate-800'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 leading-normal">{rev.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </section>

      {/* Recently Viewed Products */}
      <RecentlyViewedRail />

    </div>
  );
}
