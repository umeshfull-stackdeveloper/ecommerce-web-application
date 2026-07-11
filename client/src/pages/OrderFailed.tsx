import { Link, useSearchParams } from 'react-router-dom';
import { X, ArrowLeft } from 'lucide-react';

export default function OrderFailed() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') || '';

  return (
    <div className="py-12 flex justify-center items-center min-h-[60vh] animate-slide-up">
      <div className="glass-panel rounded-3xl p-8 w-full max-w-md shadow-2xl relative overflow-hidden text-center border-rose-500/25">
        
        <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-rose-500/5 blur-2xl" />

        <div className="rounded-full bg-rose-500/10 p-4 border border-rose-500/20 text-rose-400 w-fit mx-auto mb-4">
          <X className="w-8 h-8" />
        </div>

        <h2 className="text-3xl font-extrabold text-white mb-2">Checkout Cancelled</h2>
        <p className="text-xs text-slate-450 leading-relaxed max-w-xs mx-auto mb-6">
          The payment process was aborted or could not be captured. No funds have been deducted from your card.
        </p>

        {orderId && (
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-900 flex justify-between items-center text-xs text-slate-400 text-left mb-8">
            <span>Order Reference</span>
            <span className="font-semibold text-slate-200">#{orderId.substring(0, 8)}</span>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Link
            to="/cart"
            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 text-sm font-semibold text-white flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-indigo-500/10 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Cart & Retry
          </Link>
          <Link
            to="/"
            className="w-full rounded-xl border border-slate-800 bg-slate-900/60 py-3 text-sm font-semibold text-slate-350 hover:bg-slate-800 transition-all"
          >
            Back Home
          </Link>
        </div>

      </div>
    </div>
  );
}
