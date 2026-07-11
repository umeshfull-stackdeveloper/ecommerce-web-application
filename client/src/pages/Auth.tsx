import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../services/api';
import { useAppDispatch } from '../hooks/reduxHooks';
import { setCredentials } from '../store/slices/authSlice';
import { setCart } from '../store/slices/cartSlice';
import { useToast } from '../hooks/useToast';
import { User, Lock, Mail, Store, KeyRound } from 'lucide-react';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '';
  const initialRole = searchParams.get('role') || 'CUSTOMER';

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const queryClient = useQueryClient();

  // Mode: 'login' | 'register' | 'forgot'
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  
  // Registration Role: 'CUSTOMER' | 'SELLER'
  const [role, setRole] = useState<'CUSTOMER' | 'SELLER'>(initialRole as 'CUSTOMER' | 'SELLER');

  // Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [referralCode, setReferralCode] = useState('');

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (body: any) => apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body)
    }),
    onSuccess: async (res) => {
      dispatch(setCredentials({
        user: res.user,
        accessToken: res.accessToken,
        refreshToken: res.refreshToken
      }));

      toast.success('Successfully logged in!');

      // Sync guest cart to user cart
      const guestSessionId = localStorage.getItem('guest_session_id');
      if (guestSessionId) {
        try {
          const syncRes = await apiRequest('/cart/sync', {
            method: 'POST',
            body: JSON.stringify({ guestSessionId })
          });
          if (syncRes.cart) {
            dispatch(setCart(syncRes.cart.items || []));
          }
        } catch (err) {
          console.error('Failed to sync guest cart on login:', err);
        }
      }

      if (redirect === 'checkout') {
        navigate('/checkout');
      } else if (res.user.role === 'ADMIN') {
        navigate('/admin');
      } else if (res.user.role === 'SELLER') {
        navigate('/seller');
      } else {
        navigate('/');
      }
    },
    onError: (err: any) => {
      toast.error(err.message || 'Incorrect email or password');
    }
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (body: any) => apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body)
    }),
    onSuccess: (res) => {
      toast.success(res.message || 'Registration complete. Verify email.');
      setMode('login');
      // Reset fields
      setPassword('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Registration failed');
    }
  });

  // Forgot password mutation
  const forgotMutation = useMutation({
    mutationFn: (body: any) => apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(body)
    }),
    onSuccess: (res) => {
      toast.success('Reset link dispatched to email inbox');
      setMode('login');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Forgot password failed');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || (mode !== 'forgot' && !password)) {
      toast.warning('Please enter required credentials');
      return;
    }

    if (mode === 'login') {
      loginMutation.mutate({ email, password });
    } else if (mode === 'register') {
      if (!name) {
        toast.warning('Please supply name');
        return;
      }
      registerMutation.mutate({
        email,
        password,
        name,
        role,
        companyName: role === 'SELLER' ? companyName : undefined,
        description: role === 'SELLER' ? description : undefined,
        referralCode: referralCode.trim() || undefined
      });
    } else {
      forgotMutation.mutate({ email });
    }
  };

  return (
    <div className="py-12 flex justify-center items-center min-h-[70vh] animate-slide-up">
      <div className="glass-panel rounded-3xl p-8 w-full max-w-md shadow-2xl relative overflow-hidden">
        
        {/* Decorative backdrop glow */}
        <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl" />
        
        <h2 className="text-3xl font-extrabold text-white text-center tracking-tight mb-2">
          {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Create Account' : 'Recover Password'}
        </h2>
        <p className="text-xs text-slate-500 text-center mb-6">
          {mode === 'login' 
            ? 'Sign in to access your carts, orders, and chats.' 
            : mode === 'register' 
            ? 'Join our multi-vendor next-gen ecosystem.' 
            : 'Enter email to receive password reset tokens.'}
        </p>

        {/* Try Recruiter Demo Accounts panel */}
        {mode === 'login' && (
          <div className="mb-6 p-4 border border-indigo-500/20 bg-indigo-950/10 rounded-2xl flex flex-col gap-3">
            <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider text-center">
              ⚡ Recruiter Demo Quick-Login
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail('demo@nexusindia.com');
                  setPassword('password123');
                  loginMutation.mutate({ email: 'demo@nexusindia.com', password: 'password123' });
                }}
                className="py-2 text-[10px] font-bold rounded-xl border border-indigo-500/20 bg-slate-950 hover:bg-indigo-600/10 text-indigo-400 transition-all cursor-pointer text-center"
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('seller@nexusindia.com');
                  setPassword('password123');
                  loginMutation.mutate({ email: 'seller@nexusindia.com', password: 'password123' });
                }}
                className="py-2 text-[10px] font-bold rounded-xl border border-emerald-500/20 bg-slate-950 hover:bg-emerald-600/10 text-emerald-400 transition-all cursor-pointer text-center"
              >
                Seller Hub
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@nexusindia.com');
                  setPassword('password123');
                  loginMutation.mutate({ email: 'admin@nexusindia.com', password: 'password123' });
                }}
                className="py-2 text-[10px] font-bold rounded-xl border border-pink-500/20 bg-slate-950 hover:bg-pink-600/10 text-pink-400 transition-all cursor-pointer text-center"
              >
                Admin
              </button>
            </div>
          </div>
        )}

        {/* Role Toggle Switch for Register */}
        {mode === 'register' && (
          <div className="grid grid-cols-2 p-1 border border-slate-900 bg-slate-950 rounded-xl mb-6">
            <button
              onClick={() => setRole('CUSTOMER')}
              className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${role === 'CUSTOMER' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <User className="w-3.5 h-3.5" /> Customer Account
            </button>
            <button
              onClick={() => setRole('SELLER')}
              className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${role === 'SELLER' ? 'bg-emerald-650 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Store className="w-3.5 h-3.5" /> Seller Hub
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {mode === 'register' && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-10 pr-4 text-xs text-slate-200 outline-none focus:border-indigo-500/80"
                />
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-650" />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Email Address</label>
            <div className="relative">
              <input
                type="email"
                placeholder="customer@ecommerce.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-10 pr-4 text-xs text-slate-200 outline-none focus:border-indigo-500/80"
              />
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-650" />
            </div>
          </div>

          {mode === 'register' && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Referral Code (Optional)</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="REFERRAL123"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-10 pr-4 text-xs text-slate-200 outline-none focus:border-indigo-500/80"
                />
                <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-650" />
              </div>
            </div>
          )}

          {mode !== 'forgot' && (
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-baseline">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[10px] text-indigo-400 hover:underline cursor-pointer"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-10 pr-4 text-xs text-slate-200 outline-none focus:border-indigo-500/80"
                />
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-650" />
              </div>
            </div>
          )}

          {/* Seller Particular Fields */}
          {mode === 'register' && role === 'SELLER' && (
            <div className="flex flex-col gap-4 border-t border-slate-900 pt-4 mt-2">
              <span className="text-[10px] font-extrabold text-emerald-450 tracking-wider uppercase">Vendor Business Setup</span>
              
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Company / Shop Name</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Nexus Tech Labs"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-10 pr-4 text-xs text-slate-200 outline-none focus:border-indigo-500/80"
                  />
                  <Store className="absolute left-3.5 top-3 w-4 h-4 text-slate-650" />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Short Business Description</label>
                <textarea
                  placeholder="Specializing in SSDs, RAM chips, and high-performance screens..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs text-slate-200 outline-none h-16 resize-none focus:border-indigo-500/80"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loginMutation.isPending || registerMutation.isPending || forgotMutation.isPending}
            className={`w-full rounded-xl py-3 text-sm font-bold text-white transition-all shadow-lg mt-2 cursor-pointer ${role === 'SELLER' && mode === 'register' ? 'bg-emerald-600 hover:bg-emerald-500 hover:shadow-emerald-500/10' : 'bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-500/10'}`}
          >
            {loginMutation.isPending || registerMutation.isPending || forgotMutation.isPending
              ? 'Executing...'
              : mode === 'login'
              ? 'Sign In'
              : mode === 'register'
              ? 'Register Account'
              : 'Recover Password'}
          </button>
        </form>

        {/* Footer switches */}
        <div className="border-t border-slate-900 mt-6 pt-4 text-center text-xs text-slate-500 flex flex-col gap-2">
          {mode === 'login' ? (
            <p>
              New to our marketplace?{' '}
              <button onClick={() => setMode('register')} className="text-indigo-400 font-bold hover:underline cursor-pointer">
                Register here
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button onClick={() => setMode('login')} className="text-indigo-400 font-bold hover:underline cursor-pointer">
                Sign In
              </button>
            </p>
          )}
          
          <div className="text-[10px] text-slate-600 leading-relaxed bg-slate-950/30 p-2 rounded-lg mt-2">
            <span className="font-bold text-[10px] text-slate-550">Manual Test Accounts:</span> <br />
            Customer: <code className="text-indigo-400">demo@nexusindia.com</code> / <code>password123</code> <br />
            Seller: <code className="text-emerald-400">seller@nexusindia.com</code> / <code>password123</code> <br />
            Admin: <code className="text-pink-400">admin@nexusindia.com</code> / <code>password123</code>
          </div>
        </div>

      </div>
    </div>
  );
}
