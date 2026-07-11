import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { ProductCardSkeleton } from '../components/common/Skeleton';
import { 
  ArrowRight, Star, ShoppingCart, Percent, Heart, Sparkles, Award, Globe, Users, 
  Store, Cpu, Smartphone, Shirt, ShoppingBag, Home as HomeIcon, Apple, BookOpen, Trophy, Car, Timer,
  ShieldCheck, RotateCcw, Truck, PhoneCall, BadgeCheck, CreditCard
} from 'lucide-react';
import { useAppDispatch } from '../hooks/reduxHooks';
import { addLocalItem } from '../store/slices/cartSlice';
import { addToast } from '../store/slices/toastSlice';

export default function Home() {
  const dispatch = useAppDispatch();

  // Stats counter state
  const [stats, setStats] = useState({ customers: 0, products: 0, vendors: 0, cities: 0 });

  // Live marketplace statistics animation state
  const [liveStats, setLiveStats] = useState({ sold: 0, delivered: 0, vendors: 0, customers: 0, revenue: 0 });

  // Countdown timer state for Mega Festival Sale
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 24, seconds: 35 });

  useEffect(() => {
    // Stats counter animation
    const duration = 1500;
    const steps = 40;
    const interval = duration / steps;
    let step = 0;

    const statsTimer = setInterval(() => {
      step++;
      setStats({
        customers: Math.min(Math.floor((50000 / steps) * step), 50000),
        products: Math.min(Math.floor((5000 / steps) * step), 5000),
        vendors: Math.min(Math.floor((500 / steps) * step), 500),
        cities: Math.min(Math.floor((100 / steps) * step), 100),
      });
      if (step >= steps) {
        clearInterval(statsTimer);
      }
    }, interval);

    // Live statistics counters animation
    let liveStep = 0;
    const liveStatsTimer = setInterval(() => {
      liveStep++;
      setLiveStats({
        sold: Math.min(Math.floor((12450 / steps) * liveStep), 12450),
        delivered: Math.min(Math.floor((8920 / steps) * liveStep), 8920),
        vendors: Math.min(Math.floor((524 / steps) * liveStep), 524),
        customers: Math.min(Math.floor((1280 / steps) * liveStep), 1280),
        revenue: Math.min(Math.floor((4892400 / steps) * liveStep), 4892400),
      });
      if (liveStep >= steps) {
        clearInterval(liveStatsTimer);
      }
    }, interval);

    // Countdown timer ticks
    const countdownTimer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { hours: prev.hours, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 23, minutes: 59, seconds: 59 };
        }
      });
    }, 1000);

    return () => {
      clearInterval(statsTimer);
      clearInterval(liveStatsTimer);
      clearInterval(countdownTimer);
    };
  }, []);

  // Fetch top products (highest rated / newest)
  const { data, isLoading } = useQuery({
    queryKey: ['homeProducts'],
    queryFn: () => apiRequest('/products', { params: { limit: '4' } })
  });

  const products = data?.products || [];

  const handleQuickAdd = (product: any) => {
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

    dispatch(addToast({
      message: `${product.name} added to cart`,
      type: 'success'
    }));
  };

  const handleQuickAddFlash = (deal: any) => {
    dispatch(addLocalItem({
      productId: deal.id,
      quantity: 1,
      selectedSize: null,
      selectedColor: null,
      product: {
        id: deal.id,
        name: deal.name,
        price: deal.salePrice,
        discountPrice: deal.salePrice,
        images: JSON.stringify([deal.image]),
        slug: deal.slug
      }
    }));

    dispatch(addToast({
      message: `${deal.name} added to cart`,
      type: 'success'
    }));
  };

  // Categories config
  const categories = [
    { name: 'Electronics', slug: 'electronics', icon: Cpu, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'hover:border-indigo-500/40', count: '1.2k+ Items' },
    { name: 'Smartphones', slug: 'smartphones', icon: Smartphone, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'hover:border-blue-500/40', count: '450+ Items' },
    { name: 'Fashion', slug: 'fashion', icon: Shirt, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'hover:border-pink-500/40', count: '2.5k+ Items' },
    { name: 'Footwear', slug: 'footwear', icon: ShoppingBag, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'hover:border-orange-500/40', count: '800+ Items' },
    { name: 'Home & Kitchen', slug: 'home-living', icon: HomeIcon, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'hover:border-emerald-500/40', count: '1.5k+ Items' },
    { name: 'Beauty', slug: 'beauty', icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'hover:border-purple-500/40', count: '600+ Items' },
    { name: 'Grocery', slug: 'grocery', icon: Apple, color: 'text-lime-400', bg: 'bg-lime-500/10', border: 'hover:border-lime-500/40', count: '900+ Items' },
    { name: 'Books', slug: 'books', icon: BookOpen, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'hover:border-amber-500/40', count: '1.1k+ Items' },
    { name: 'Sports', slug: 'sports', icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'hover:border-yellow-500/40', count: '350+ Items' },
    { name: 'Automotive', slug: 'automotive', icon: Car, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'hover:border-cyan-500/40', count: '500+ Items' },
  ];

  // Flash Deals data
  const flashDeals = [
    {
      id: 'fd-1',
      name: "OnePlus 13 (Silk Black, 256GB)",
      category: "Smartphones",
      originalPrice: 69999,
      salePrice: 64999,
      discount: "7% OFF",
      rating: 4.7,
      image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&auto=format&fit=crop&q=60",
      claimed: 82,
      slug: "smartphones"
    },
    {
      id: 'fd-2',
      name: "Sony WH-1000XM6 ANC Headphones",
      category: "Electronics",
      originalPrice: 34990,
      salePrice: 29990,
      discount: "15% OFF",
      rating: 4.8,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&auto=format&fit=crop&q=60",
      claimed: 65,
      slug: "electronics"
    },
    {
      id: 'fd-3',
      name: "Adidas Ultraboost Light Shoes",
      category: "Footwear",
      originalPrice: 19999,
      salePrice: 17999,
      discount: "10% OFF",
      rating: 4.5,
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop&q=60",
      claimed: 48,
      slug: "footwear"
    },
    {
      id: 'fd-4',
      name: "Dyson Hot+Cool Purifier HP07",
      category: "Home & Kitchen",
      originalPrice: 45900,
      salePrice: 42900,
      discount: "6% OFF",
      rating: 4.8,
      image: "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=400&auto=format&fit=crop&q=60",
      claimed: 91,
      slug: "home-living"
    }
  ];

  return (
    <div className="flex flex-col gap-16 py-6 animate-slide-up">
      
      {/* 1. Redesigned Premium Static Hero Section with Video */}
      <section className="relative overflow-hidden rounded-3xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/40 p-8 md:p-16 flex flex-col lg:flex-row items-center justify-between gap-12 transition-colors duration-300">
        
        {/* Looping Technology Video Background */}
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover opacity-15 pointer-events-none z-0"
        >
          <source 
            src="https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-screens-and-numbers-31948-large.mp4" 
            type="video/mp4" 
          />
        </video>

        {/* Floating backdrop blur glows */}
        <div className="absolute -top-12 -left-12 h-80 w-80 rounded-full blur-[80px] bg-indigo-650/20" />
        <div className="absolute -bottom-12 -right-12 h-64 w-64 rounded-full bg-purple-550/15 blur-3xl" />

        {/* Hero Left Content */}
        <div className="flex flex-col gap-6 max-w-2xl relative z-10">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/15 px-3 py-1 text-xs font-semibold tracking-wide text-indigo-400">
              <Sparkles className="w-3.5 h-3.5" />
              NEXUS INDIA 2.0
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-xs font-semibold tracking-wide text-amber-400">
              ✨ Mega Festive Offers Live
            </span>
          </div>

          <div className="flex flex-col gap-3">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-white">
              Shop Smarter.<br />
              Sell Faster.<br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
                Grow Bigger.
              </span>
            </h1>
            <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-xl mt-2">
              India's trusted marketplace connecting customers and verified sellers across electronics, fashion, home essentials, and more. Experience elite support and speed.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-4">
            <Link
              to="/search"
              className="rounded-full bg-indigo-600 px-8 py-3.5 text-sm font-semibold text-white hover:bg-indigo-500 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/25"
            >
              Shop Now <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/auth?mode=register&role=SELLER"
              className="rounded-full border border-slate-700 bg-slate-900/40 hover:bg-slate-900/80 px-8 py-3.5 text-sm font-semibold text-slate-350 hover:text-white transition-all flex items-center gap-2"
            >
              Become a Seller <Store className="w-4 h-4 text-emerald-400" />
            </Link>
          </div>
        </div>

        {/* Highlights panel */}
        <div className="flex flex-col gap-4 w-full lg:max-w-md relative z-10">
          <div className="glass-panel rounded-2xl p-5 flex flex-col gap-1.5 border border-indigo-500/20 hover:border-indigo-500/40 transition-all duration-300">
            <Percent className="w-6 h-6 text-pink-400 mb-1" />
            <h3 className="font-bold text-sm text-white">Festive Promo Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Unlock maximum savings! Apply seeded code <span className="text-indigo-400 font-bold px-1.5 py-0.5 rounded bg-indigo-950/60 border border-indigo-500/20">NEWUSER</span> for an extra 15% discount.
            </p>
          </div>
          <div className="glass-panel rounded-2xl p-5 flex flex-col gap-1.5 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300">
            <ShoppingCart className="w-6 h-6 text-indigo-400 mb-1" />
            <h3 className="font-bold text-sm text-white">Persistent Guest Checkout</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Start adding products as guest now. Your checkout items auto-sync securely once you log in or sign up.
            </p>
          </div>
        </div>

      </section>

      {/* Trust & Credibility Bar */}
      <section className="bg-slate-950/80 border border-slate-900 rounded-3xl p-5 grid grid-cols-2 md:grid-cols-6 gap-6 text-center items-center divide-y md:divide-y-0 md:divide-x divide-slate-900 shadow-xl relative z-10">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 p-1">
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
          <span className="text-[11px] font-extrabold text-slate-350 tracking-wide uppercase">100% Genuine Products</span>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 p-1 pt-4 md:pt-1">
          <RotateCcw className="w-5 h-5 text-indigo-400" />
          <span className="text-[11px] font-extrabold text-slate-350 tracking-wide uppercase">7-Day Easy Returns</span>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 p-1 pt-4 md:pt-1">
          <Smartphone className="w-5 h-5 text-indigo-400" />
          <span className="text-[11px] font-extrabold text-slate-350 tracking-wide uppercase">Secure UPI Payments</span>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 p-1 pt-4 md:pt-1">
          <Truck className="w-5 h-5 text-indigo-400" />
          <span className="text-[11px] font-extrabold text-slate-350 tracking-wide uppercase">Free Delivery &gt; ₹499</span>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 p-1 pt-4 md:pt-1">
          <PhoneCall className="w-5 h-5 text-indigo-400" />
          <span className="text-[11px] font-extrabold text-slate-350 tracking-wide uppercase">24×7 Active Support</span>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 p-1 pt-4 md:pt-1">
          <BadgeCheck className="w-5 h-5 text-indigo-400" />
          <span className="text-[11px] font-extrabold text-slate-350 tracking-wide uppercase">Verified Brand Sellers</span>
        </div>
      </section>

      {/* 2. Target Statistics Panel (4 Columns) */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className="flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-[var(--border-color)] bg-slate-950/60 shadow-xl">
          <Users className="w-8 h-8 text-indigo-400 mb-3" />
          <span className="text-2xl md:text-3xl font-extrabold text-white">
            {stats.customers >= 1000 ? `${(stats.customers / 1000).toFixed(0)}K+` : stats.customers}
          </span>
          <span className="text-xs text-slate-450 font-semibold mt-1 uppercase tracking-wider">Customers</span>
        </div>
        <div className="flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-[var(--border-color)] bg-slate-950/60 shadow-xl">
          <Award className="w-8 h-8 text-pink-400 mb-3" />
          <span className="text-2xl md:text-3xl font-extrabold text-white">
            {stats.products >= 1000 ? `${(stats.products / 1000).toFixed(1)}K+` : stats.products}
          </span>
          <span className="text-xs text-slate-450 font-semibold mt-1 uppercase tracking-wider">Products Listed</span>
        </div>
        <div className="flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-[var(--border-color)] bg-slate-950/60 shadow-xl">
          <Store className="w-8 h-8 text-emerald-400 mb-3" />
          <span className="text-2xl md:text-3xl font-extrabold text-white">
            {stats.vendors}+
          </span>
          <span className="text-xs text-slate-450 font-semibold mt-1 uppercase tracking-wider">Verified Sellers</span>
        </div>
        <div className="flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-[var(--border-color)] bg-slate-950/60 shadow-xl">
          <Globe className="w-8 h-8 text-amber-400 mb-3" />
          <span className="text-2xl md:text-3xl font-extrabold text-white">
            {stats.cities}+
          </span>
          <span className="text-xs text-slate-450 font-semibold mt-1 uppercase tracking-wider">Cities Served</span>
        </div>
      </section>

      {/* 3. Mega Festival Sale Section (Countdown & Deal Cards) */}
      <section className="flex flex-col gap-8 border border-red-500/20 bg-gradient-to-br from-red-950/20 via-slate-950 to-slate-950 p-6 md:p-8 rounded-3xl relative overflow-hidden">
        
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-red-500/10 rounded-full blur-[80px] -z-10" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-800/80 pb-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Mega Festival Flash Sale
              </h2>
            </div>
            <p className="text-xs text-slate-400">Exclusive 24-hour deals from verified brand partners</p>
          </div>

          {/* Countdown Clock Widget */}
          <div className="flex items-center gap-3 bg-red-950/30 border border-red-500/20 px-4 py-2.5 rounded-2xl">
            <Timer className="w-5 h-5 text-red-500 animate-spin-slow" />
            <div className="flex items-center gap-1.5 text-white font-mono text-sm tracking-widest font-bold">
              <div className="flex flex-col items-center bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
                <span>{timeLeft.hours.toString().padStart(2, '0')}</span>
              </div>
              <span className="text-red-500 font-sans">:</span>
              <div className="flex flex-col items-center bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
                <span>{timeLeft.minutes.toString().padStart(2, '0')}</span>
              </div>
              <span className="text-red-500 font-sans">:</span>
              <div className="flex flex-col items-center bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
                <span>{timeLeft.seconds.toString().padStart(2, '0')}</span>
              </div>
            </div>
            <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider ml-1">Left</span>
          </div>
        </div>

        {/* Flash Deals Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {flashDeals.map((deal) => {
            const pctLeft = 100 - deal.claimed;
            return (
              <div key={deal.id} className="glass-panel border-slate-800/80 hover:border-red-550/30 rounded-2xl p-4 flex flex-col gap-3 group relative transition-all duration-300">
                
                {/* Discount Badge */}
                <span className="absolute top-3 left-3 z-10 rounded-md bg-red-600 px-2 py-1 text-[10px] font-bold text-white shadow-lg">
                  {deal.discount}
                </span>

                {/* Deal Image */}
                <div className="relative h-44 overflow-hidden rounded-xl bg-slate-900 block">
                  <img
                    src={deal.image}
                    alt={deal.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Info */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-red-400 font-bold tracking-wider uppercase">
                    {deal.category}
                  </span>
                  <h3 className="font-bold text-sm tracking-tight text-white hover:text-red-400 line-clamp-1 transition-colors">
                    {deal.name}
                  </h3>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-[11px] text-slate-350 font-bold">{deal.rating.toFixed(1)}</span>
                  </div>
                </div>

                {/* Progress bar showing stock sold */}
                <div className="flex flex-col gap-1.5 mt-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400">
                    <span>{deal.claimed}% Claimed</span>
                    <span className={pctLeft <= 15 ? 'text-red-400 animate-pulse' : ''}>
                      {pctLeft <= 15 ? 'Only ' : ''}{pctLeft} Left
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${pctLeft <= 15 ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-red-650'}`}
                      style={{ width: `${deal.claimed}%` }}
                    />
                  </div>
                </div>

                {/* Price and Cart */}
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-900">
                  <div className="flex flex-col">
                    <span className="font-extrabold text-base text-white">
                      ₹{deal.salePrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-slate-500 line-through">
                      ₹{deal.originalPrice.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <button
                    onClick={() => handleQuickAddFlash(deal)}
                    className="rounded-lg bg-red-600 hover:bg-red-550 p-2 text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-red-600/10 cursor-pointer"
                    title="Quick Add Deal"
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>

      </section>

      {/* 4. Category Grid Section (10 Categories Grid) */}
      <section className="flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Browse Departments</h2>
          <p className="text-xs text-slate-450 mt-1">Explore our range of curated Indian and Global inventory categories</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {categories.map((cat) => {
            const IconComponent = cat.icon;
            return (
              <Link
                key={cat.slug}
                to={`/search?category=${cat.slug}`}
                className={`flex flex-col items-center justify-center p-6 rounded-2xl border border-slate-900 bg-slate-950/40 hover:bg-slate-900/20 text-center transition-all duration-300 group ${cat.border}`}
              >
                <div className={`p-4 rounded-xl mb-3 transition-transform duration-300 group-hover:scale-110 ${cat.bg}`}>
                  <IconComponent className={`w-6 h-6 ${cat.color}`} />
                </div>
                <span className="font-bold text-xs tracking-tight text-white group-hover:text-indigo-400 transition-colors">
                  {cat.name}
                </span>
                <span className="text-[10px] text-slate-500 mt-1 font-semibold">
                  {cat.count}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 5. Featured Catalog Products */}
      <section className="flex flex-col gap-6">
        <div className="flex justify-between items-end border-b border-slate-900 pb-3">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Trending Catalog</h2>
            <p className="text-xs text-slate-450 mt-1">Direct catalog selections from our verified vendors</p>
          </div>
          <Link to="/search" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
            See all catalog <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {products.map((product: any) => {
              const imageUrls = JSON.parse(product.images || '[]');
              const displayImage = imageUrls[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400';
              const ratingScore = product.ratings || 0;

              return (
                <div key={product.id} className="glass-panel glass-panel-hover rounded-2xl p-4 flex flex-col gap-3 group relative border-slate-900">
                  
                  {/* Image container */}
                  <Link to={`/product/${product.slug}`} className="relative h-48 overflow-hidden rounded-xl bg-slate-900/60 block">
                    <img
                      src={displayImage}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {product.discountPrice && (
                      <span className="absolute top-2 left-2 rounded-md bg-rose-600 px-2 py-0.5 text-[9px] font-bold text-white shadow">
                        SALE
                      </span>
                    )}
                  </Link>

                  {/* Meta details */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">
                      {product.category?.name}
                    </span>
                    <Link to={`/product/${product.slug}`} className="font-bold text-sm tracking-tight text-white hover:text-indigo-400 line-clamp-1 transition-colors">
                      {product.name}
                    </Link>
                    
                    {/* Stars */}
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-[11px] text-slate-350 font-bold mt-0.5">
                        {ratingScore.toFixed(1)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-450 leading-normal line-clamp-2 mt-1">
                      {product.description}
                    </p>
                  </div>

                  {/* Price and Cart */}
                  <div className="flex justify-between items-center mt-auto pt-2 border-t border-slate-900">
                    <div className="flex flex-col">
                      {product.discountPrice ? (
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-extrabold text-base text-white">
                            ₹{product.discountPrice.toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs text-slate-550 line-through">
                            ₹{product.price.toLocaleString('en-IN')}
                          </span>
                        </div>
                      ) : (
                        <span className="font-extrabold text-base text-white">
                          ₹{product.price.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleQuickAdd(product)}
                      className="rounded-lg bg-indigo-600/95 hover:bg-indigo-500 p-2 text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-500/10 cursor-pointer"
                      title="Quick Add to Cart"
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Real-time statistics strip */}
      <section className="bg-gradient-to-r from-slate-950 via-indigo-950/20 to-slate-950 border border-slate-900 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col gap-1 text-center md:text-left">
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h3 className="font-extrabold text-xs text-emerald-450 uppercase tracking-widest">
              Live Marketplace Activity
            </h3>
          </div>
          <p className="text-[10px] text-slate-400">Real-time stats synced with database socket emitters</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 w-full md:w-auto">
          <div className="flex flex-col text-center">
            <span className="text-xl font-black text-white">{liveStats.sold.toLocaleString()}</span>
            <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mt-1">Products Sold Today</span>
          </div>
          <div className="flex flex-col text-center border-l border-slate-900">
            <span className="text-xl font-black text-white">{liveStats.delivered.toLocaleString()}</span>
            <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mt-1">Orders Delivered</span>
          </div>
          <div className="flex flex-col text-center border-l border-slate-900">
            <span className="text-xl font-black text-white">{liveStats.vendors}</span>
            <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mt-1">Active Vendors</span>
          </div>
          <div className="flex flex-col text-center border-l border-slate-900">
            <span className="text-xl font-black text-indigo-400">{liveStats.customers.toLocaleString()}</span>
            <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mt-1">Customers Online</span>
          </div>
          <div className="flex flex-col text-center border-l border-slate-900">
            <span className="text-xl font-black text-emerald-450">₹{liveStats.revenue.toLocaleString('en-IN')}</span>
            <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mt-1">Total Revenue</span>
          </div>
        </div>
      </section>

      {/* Why Choose NEXUS INDIA */}
      <section className="flex flex-col gap-6">
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-bold text-white tracking-tight">Why Choose NEXUS INDIA</h2>
          <p className="text-xs text-slate-450 mt-1">Built to provide an elite, trust-focused Indian shopping experience</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {[
            { title: "Fast Delivery", desc: "Express delivery across India", icon: Truck, color: "text-amber-400", bg: "bg-amber-500/10" },
            { title: "Secure Payments", desc: "UPI, Cards & Netbanking", icon: CreditCard, color: "text-emerald-400", bg: "bg-emerald-500/10" },
            { title: "Buyer Protection", desc: "Escrow and zero-fraud checks", icon: ShieldCheck, color: "text-indigo-400", bg: "bg-indigo-500/10" },
            { title: "Verified Sellers", desc: "100% vetted business owners", icon: Store, color: "text-pink-400", bg: "bg-pink-500/10" },
            { title: "AI Recommendations", desc: "Smart chatbot & matches", icon: Sparkles, color: "text-purple-400", bg: "bg-purple-500/10" },
            { title: "24×7 Support", desc: "Real-time query resolutions", icon: PhoneCall, color: "text-blue-400", bg: "bg-blue-500/10" },
          ].map((card, idx) => {
            const IconComponent = card.icon;
            return (
              <div 
                key={idx} 
                className="glass-panel hover:border-indigo-500/30 p-5 rounded-2xl flex flex-col gap-3 transition-all duration-300 group hover:-translate-y-1 select-none"
              >
                <div className={`p-3 rounded-xl w-fit ${card.bg}`}>
                  <IconComponent className={`w-5 h-5 ${card.color}`} />
                </div>
                <h3 className="font-extrabold text-xs text-white group-hover:text-indigo-400 transition-colors">
                  {card.title}
                </h3>
                <p className="text-[10px] text-slate-500 leading-normal">
                  {card.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Customer Review Section */}
      <section className="flex flex-col gap-8 border-t border-slate-900 pt-10">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Customer Testimonials</h2>
          <p className="text-xs text-slate-450 mt-1">Read honest feedback shared by our verified purchasers</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: "Aarav Sharma", comment: "Amazing shopping experience and fast delivery. Product catalog is fully premium and payments are seamless.", rating: 5, date: "2 days ago" },
            { name: "Priya Patel", comment: "Excellent seller support and secure checkout. Instant PhonePe UPI confirmation made the order workflow rapid.", rating: 5, date: "1 week ago" },
            { name: "Rohit Verma", comment: "Professional platform with genuine products. Authentic tech gear and quick support assistant resolutions.", rating: 5, date: "3 days ago" }
          ].map((item, idx) => (
            <div key={idx} className="glass-panel p-6 rounded-3xl flex flex-col gap-3 relative overflow-hidden">
              <span className="absolute top-4 right-4 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                ✓ Verified Purchase
              </span>
              <div className="flex items-center gap-1 text-amber-400">
                {Array.from({ length: item.rating }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed italic">
                "{item.comment}"
              </p>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-900 text-[10px] text-slate-500 font-semibold">
                <span>{item.name}</span>
                <span>{item.date}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Technology Showcase */}
      <section className="flex flex-col gap-6 border-t border-slate-900 pt-10">
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-bold text-white tracking-tight">Built With Developer Tech</h2>
          <p className="text-xs text-slate-450 mt-1">Production-ready, highly extensible full-stack architecture</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {[
            { name: "React.js", category: "Frontend Core", desc: "Component library using virtual DOM rendering", icon: Cpu, color: "text-blue-400" },
            { name: "Node.js", category: "Backend Runtime", desc: "Non-blocking event loop execution layer", icon: Globe, color: "text-emerald-400" },
            { name: "Express.js", category: "API Controller", desc: "Minimalist server route orchestrator middleware", icon: Cpu, color: "text-slate-350" },
            { name: "SQLite / Prisma", category: "Database Layer", desc: "Relational modeling, migration, and seeding engine", icon: Globe, color: "text-indigo-400" },
            { name: "JWT Auth", category: "Security Token", desc: "Cryptographic stateless user token validation", icon: ShieldCheck, color: "text-pink-400" },
            { name: "Razorpay UPI", category: "Payment Gateway", desc: "Integrated Indian UPI payment webhook flow", icon: CreditCard, color: "text-blue-500" },
            { name: "Socket.io", category: "Real-time Sync", desc: "Bidirectional state sync over server websockets", icon: Timer, color: "text-pink-500" },
            { name: "Redux Toolkit", category: "State Manager", desc: "Centralized client store with slicer reducers", icon: Cpu, color: "text-indigo-500" },
            { name: "Tailwind CSS", category: "Styling Engine", desc: "Utility-first modern HSL design token layout", icon: Shirt, color: "text-cyan-400" },
            { name: "Vite Bundler", category: "Build Compiler", desc: "ESM compilation for Lighthouse-optimal loads", icon: Sparkles, color: "text-amber-400" }
          ].map((tech, idx) => {
            const IconComponent = tech.icon;
            return (
              <div 
                key={idx} 
                className="glass-panel p-5 rounded-2xl flex flex-col gap-2 transition-all duration-350 hover:border-indigo-500/25 hover:scale-[1.02] select-none"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{tech.category}</span>
                  <IconComponent className={`w-4 h-4 ${tech.color}`} />
                </div>
                <h3 className="font-extrabold text-sm text-white mt-1">{tech.name}</h3>
                <p className="text-[10px] text-slate-450 leading-relaxed mt-1">{tech.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}

