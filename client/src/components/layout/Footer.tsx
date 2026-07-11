import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setSubscribed(true);
    setEmail('');
  };

  return (
    <footer className="border-t border-slate-900 bg-slate-950/60 py-12 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Newsletter Subscription Bar */}
        <div className="border-b border-slate-900 pb-8 mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col gap-1 max-w-md">
            <h3 className="text-base font-bold text-white">Subscribe to Nexus Newsletter</h3>
            <p className="text-xs text-slate-450">Get updates on flash sales, new premium releases, and exclusive seller discount coupons.</p>
          </div>
          <form onSubmit={handleSubscribe} className="w-full md:w-auto flex flex-col gap-2 relative">
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={subscribed}
                className="w-full md:w-64 rounded-xl border border-slate-800 bg-slate-905 px-4 py-2.5 text-xs text-slate-205 outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={subscribed}
                className="rounded-xl bg-indigo-650 hover:bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {subscribed ? 'Subscribed' : 'Subscribe'}
              </button>
            </div>
            {error && <span className="text-[10px] text-rose-455 absolute top-full mt-1 left-1">{error}</span>}
            {subscribed && <span className="text-[10px] text-emerald-450 absolute top-full mt-1 left-1">Thank you for subscribing! Check your inbox soon.</span>}
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="flex flex-col gap-3">
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
              NEXUS INDIA
            </span>
            <p className="text-xs text-slate-505 leading-relaxed max-w-xs">
              India's Next-Generation Marketplace. Experience lightning fast checkout, real-time live support, and verified brand products across electronics, fashion, and home essentials.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Shop Categories</h4>
            <ul className="flex flex-col gap-2 text-xs text-slate-400">
              <li><Link to="/search?category=electronics" className="hover:text-indigo-400 transition-colors">Consumer Electronics</Link></li>
              <li><Link to="/search?category=laptops" className="hover:text-indigo-400 transition-colors">Developer Laptops</Link></li>
              <li><Link to="/search?category=footwear" className="hover:text-indigo-400 transition-colors">Footwear & Sports</Link></li>
              <li><Link to="/search?category=home-living" className="hover:text-indigo-400 transition-colors">Home & Decor</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Seller Programs</h4>
            <ul className="flex flex-col gap-2 text-xs text-slate-400">
              <li><Link to="/auth?mode=register&role=SELLER" className="hover:text-indigo-400 transition-colors">Apply as Vendor</Link></li>
              <li><Link to="/seller" className="hover:text-indigo-400 transition-colors">Seller Portal Dashboard</Link></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Marketplace Policies</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Legal & Support</h4>
            <ul className="flex flex-col gap-2 text-xs text-slate-400">
              <li><Link to="/chat" className="hover:text-indigo-400 transition-colors">Live Support Center</Link></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Terms of Service</a></li>
            </ul>
          </div>

        </div>
        <div className="border-t border-slate-900 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-[10px]">
          <div className="flex flex-col gap-1 items-center md:items-start">
            <p>© 2026 Nexus India. All rights reserved.</p>
            <p className="text-[9px] text-slate-600">GSTIN: 07AAAAA1111A1Z0 | Corporate Office: Connaught Place, New Delhi, 110001</p>
          </div>
          <div className="flex flex-col items-center md:items-end gap-3">
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="border border-slate-900 bg-slate-950 px-2 py-0.5 rounded text-slate-400 hover:text-white transition-colors">PhonePe</span>
              <span className="border border-slate-900 bg-slate-950 px-2 py-0.5 rounded text-slate-400 hover:text-white transition-colors">GPay</span>
              <span className="border border-slate-900 bg-slate-950 px-2 py-0.5 rounded text-slate-400 hover:text-white transition-colors">Paytm</span>
              <span className="border border-slate-900 bg-slate-950 px-2 py-0.5 rounded text-slate-400 hover:text-white transition-colors">RuPay</span>
              <span className="border border-slate-900 bg-slate-950 px-2 py-0.5 rounded text-slate-400 hover:text-white transition-colors">Visa</span>
              <span className="border border-slate-900 bg-slate-950 px-2 py-0.5 rounded text-slate-400 hover:text-white transition-colors">Mastercard</span>
              <span className="border border-slate-900 bg-slate-950 px-2 py-0.5 rounded text-slate-400 hover:text-white transition-colors">Razorpay</span>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="border border-slate-900 bg-slate-950 px-2 py-0.5 rounded text-slate-450 text-[8px] tracking-wider uppercase">GST Compliant</span>
              <span className="border border-slate-900 bg-slate-950 px-2 py-0.5 rounded text-slate-450 text-[8px] tracking-wider uppercase">SSL Secured</span>
              <span className="border border-slate-900 bg-slate-950 px-2 py-0.5 rounded text-slate-450 text-[8px] tracking-wider uppercase">PCI-DSS Certified</span>
              <span className="border border-slate-900 bg-slate-950 px-2 py-0.5 rounded text-slate-450 text-[8px] tracking-wider uppercase">Secure Payments</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
