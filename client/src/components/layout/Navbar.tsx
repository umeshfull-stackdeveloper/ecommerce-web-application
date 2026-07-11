import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks/reduxHooks';
import { logout } from '../../store/slices/authSlice';
import { toggleTheme } from '../../store/slices/themeSlice';
import { addToast } from '../../store/slices/toastSlice';
import { apiRequest } from '../../services/api';
import { ShoppingCart, Heart, MessageSquare, Shield, LogOut, User, Store, Search, Menu, X, Sun, Moon, Mic } from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { totalQuantity } = useAppSelector((state) => state.cart);
  const themeMode = useAppSelector((state) => state.theme.mode);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [bounce, setBounce] = useState(false);

  useEffect(() => {
    if (totalQuantity > 0) {
      setBounce(true);
      const timer = setTimeout(() => setBounce(false), 400);
      return () => clearTimeout(timer);
    }
  }, [totalQuantity]);

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [history, setHistory] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('search_history') || '[]');
    } catch {
      return [];
    }
  });

  // Fetch search suggestions
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const data = await apiRequest('/products', {
          params: { search: searchQuery.trim(), limit: '5' }
        });
        setSuggestions(data.products || []);
      } catch (err) {
        console.error('Suggestions error:', err);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const addToHistory = (query: string) => {
    if (!query || query.trim() === '') return;
    const cleanQuery = query.trim();
    const updated = [cleanQuery, ...history.filter((h) => h !== cleanQuery)].slice(0, 5);
    setHistory(updated);
    localStorage.setItem('search_history', JSON.stringify(updated));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      addToHistory(searchQuery);
      setShowDropdown(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      dispatch(addToast({ message: 'Voice search not supported in this browser.', type: 'warning' }));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      dispatch(addToast({ message: 'Listening... speak now', type: 'info' }));
    };

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setSearchQuery(speechToText);
      addToHistory(speechToText);
      setShowDropdown(false);
      navigate(`/search?q=${encodeURIComponent(speechToText)}`);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/80 backdrop-blur-md transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center gap-2">
              <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
                NEXUS INDIA
              </span>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md relative">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="text"
                placeholder="Search products, brands, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => {
                  setTimeout(() => setShowDropdown(false), 200);
                }}
                className="w-full rounded-full border border-slate-800 bg-slate-900/50 py-2 pl-4 pr-16 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-2">
                <button 
                  type="button" 
                  onClick={handleVoiceSearch}
                  className={`text-slate-505 hover:text-indigo-400 transition-colors cursor-pointer ${isListening ? 'animate-pulse text-indigo-500' : ''}`}
                  title="Voice Search"
                >
                  <Mic className="w-4 h-4" />
                </button>
                <button type="submit" className="text-slate-500 hover:text-indigo-400 transition-colors">
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Smart Suggestions Dropdown */}
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-950/95 border border-[var(--border-color)] backdrop-blur-md rounded-2xl p-4 shadow-2xl z-50 flex flex-col gap-3 animate-slide-up max-h-[350px] overflow-y-auto">
                
                {/* 1. If query is short, show Recent History */}
                {searchQuery.trim().length < 2 ? (
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Recent Searches</span>
                    {history.length === 0 ? (
                      <span className="text-xs text-slate-500 italic">No recent searches</span>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {history.map((term, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setSearchQuery(term);
                              navigate(`/search?q=${encodeURIComponent(term)}`);
                            }}
                            className="text-xs text-left text-slate-350 hover:text-indigo-400 transition-colors py-1 flex items-center gap-2 cursor-pointer"
                          >
                            <Search className="w-3 h-3 text-slate-650" /> {term}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  // 2. If query is long, show suggestions
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Product Suggestions</span>
                    {suggestions.length === 0 ? (
                      <span className="text-xs text-slate-500 italic">No products found matching "{searchQuery}"</span>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {suggestions.map((prod) => {
                          const images = JSON.parse(prod.images || '[]');
                          const img = images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100';
                          return (
                            <Link
                              key={prod.id}
                              to={`/product/${prod.slug}`}
                              onClick={() => {
                                addToHistory(searchQuery);
                                setSearchQuery('');
                              }}
                              className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-900/50 border border-transparent hover:border-[var(--border-color)] transition-all"
                            >
                              <img src={img} className="w-9 h-9 object-cover rounded-lg border border-slate-900 bg-slate-950" />
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-white truncate">{prod.name}</span>
                                <span className="text-[10px] text-slate-500">{prod.category?.name}</span>
                              </div>
                              <span className="text-xs font-extrabold text-white ml-auto">₹{prod.price.toLocaleString('en-IN')}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}
          </div>

          {/* Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/search" className="text-sm font-medium text-slate-300 hover:text-indigo-400 transition-colors">
              Catalog
            </Link>

            {(!isAuthenticated || user?.role === 'CUSTOMER') && (
              <Link to="/auth?role=SELLER" className="flex items-center gap-1 text-sm font-medium text-slate-300 hover:text-indigo-400 transition-colors">
                <Store className="w-4 h-4 text-emerald-450" />
                Sell on Nexus
              </Link>
            )}

            {isAuthenticated ? (
              <>
                {/* Role Specific Dashboards */}
                {user?.role === 'ADMIN' && (
                  <Link to="/admin" className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-indigo-400 transition-colors">
                    <Shield className="w-4 h-4 text-indigo-400" />
                    Admin
                  </Link>
                )}
                {user?.role === 'SELLER' && (
                  <Link to="/seller" className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-indigo-400 transition-colors">
                    <Store className="w-4 h-4 text-emerald-400" />
                    Seller
                  </Link>
                )}

                {/* Wishlist */}
                <Link to="/wishlist" className="relative p-1 text-slate-300 hover:text-rose-400 transition-colors">
                  <Heart className="w-5 h-5" />
                </Link>

                {/* Chat */}
                <Link to="/chat" className="p-1 text-slate-300 hover:text-indigo-400 transition-colors">
                  <MessageSquare className="w-5 h-5" />
                </Link>
              </>
            ) : null}

            {/* Cart */}
            <Link
              id="navbar-cart-btn"
              to="/cart"
              className={`relative p-2 text-[var(--text-secondary)] hover:text-indigo-400 transition-colors flex items-center gap-1 bg-slate-900/40 rounded-full border border-[var(--border-color)] px-3 ${bounce ? 'cart-badge-bounce' : ''}`}
            >
              <ShoppingCart className="w-4 h-4 text-[var(--text-primary)]" />
              {totalQuantity > 0 && (
                <span className="absolute -top-1.5 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                  {totalQuantity}
                </span>
              )}
              <span className="text-xs font-semibold text-[var(--text-primary)]">{totalQuantity}</span>
            </Link>

            {/* Theme Switcher Button */}
            <button
              onClick={() => dispatch(toggleTheme())}
              className="p-2 rounded-full border border-[var(--border-color)] bg-slate-900/40 text-[var(--text-secondary)] hover:text-indigo-400 transition-all flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95"
              title="Toggle Light/Dark Theme"
            >
              {themeMode === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* Profile / Login */}
            {isAuthenticated ? (
              <div className="flex items-center gap-4 border-l border-slate-800/80 pl-4">
                <Link to="/orders" className="text-xs text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  Orders
                </Link>
                <button
                  onClick={() => {
                    dispatch(logout());
                    navigate('/auth');
                  }}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-all duration-300"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => dispatch(toggleTheme())}
              className="p-1.5 mr-2 rounded-full border border-[var(--border-color)] bg-slate-900/40 text-[var(--text-secondary)] hover:text-indigo-400 transition-colors flex items-center justify-center cursor-pointer"
              title="Toggle theme"
            >
              {themeMode === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <Link
              id="navbar-cart-btn-mobile"
              to="/cart"
              className={`relative p-2 text-slate-300 mr-2 ${bounce ? 'cart-badge-bounce' : ''}`}
            >
              <ShoppingCart className="w-5 h-5" />
              {totalQuantity > 0 && (
                <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                  {totalQuantity}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950 p-4 flex flex-col gap-4">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2 pl-4 pr-10 text-sm outline-none"
            />
            <button type="submit" className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <Search className="w-4 h-4 text-slate-500" />
            </button>
          </form>

          <Link to="/search" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium">Catalog</Link>
          
          {isAuthenticated ? (
            <>
              {user?.role === 'ADMIN' && (
                <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-indigo-400">Admin Portal</Link>
              )}
              {user?.role === 'SELLER' && (
                <Link to="/seller" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-emerald-400">Seller Dashboard</Link>
              )}
              <Link to="/wishlist" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium">My Wishlist</Link>
              <Link to="/chat" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium">Live Chat</Link>
              <Link to="/orders" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium">My Orders</Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  dispatch(logout());
                  navigate('/auth');
                }}
                className="text-sm font-medium text-left text-rose-400"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link to="/auth" onClick={() => setMobileMenuOpen(false)} className="rounded-lg bg-indigo-600 py-2 text-center text-sm font-semibold text-white">
              Sign In
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
