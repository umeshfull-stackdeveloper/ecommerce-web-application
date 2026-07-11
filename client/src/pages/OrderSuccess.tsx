import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../services/api';
import { Check, ShoppingBag, Download, ArrowRight, Home } from 'lucide-react';

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') || '';

  // Fetch order details
  const { data } = useQuery({
    queryKey: ['orderDetails', orderId],
    queryFn: () => apiRequest(`/orders/${orderId}`),
    enabled: !!orderId
  });

  const order = data?.order;
  const invoice = order?.invoice;

  const handleDownloadInvoice = () => {
    if (invoice?.pdfPath) {
      window.open(`http://localhost:5000${invoice.pdfPath}`, '_blank');
    }
  };

  return (
    <div className="py-12 flex justify-center items-center min-h-[60vh] animate-slide-up">
      <div className="glass-panel rounded-3xl p-8 w-full max-w-md shadow-2xl relative overflow-hidden text-center">
        
        <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-emerald-500/5 blur-2xl" />

        <div className="rounded-full bg-emerald-500/10 p-4 border border-emerald-500/20 text-emerald-450 w-fit mx-auto mb-4">
          <Check className="w-8 h-8" />
        </div>

        <h2 className="text-3xl font-extrabold text-white mb-2">Order Confirmed!</h2>
        <p className="text-xs text-slate-450 leading-relaxed max-w-xs mx-auto mb-6">
          Your payment has been successfully captured and processed. We sent a receipt confirmation to your registered email address.
        </p>

        {order && (
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-900 flex flex-col gap-3 text-xs text-slate-400 text-left mb-8">
            <div className="flex justify-between border-b border-slate-900 pb-2">
              <span>Order Reference</span>
              <span className="font-semibold text-slate-200">#{order.id.substring(0, 8)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-900 pb-2">
              <span>Invoice Number</span>
              <span className="font-semibold text-indigo-400">{invoice?.invoiceNumber || 'Generating...'}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Paid</span>
              <span className="font-bold text-white">₹{order.totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {invoice?.pdfPath && (
            <button
              onClick={handleDownloadInvoice}
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 text-sm font-semibold text-white flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-indigo-500/10 transition-all"
            >
              <Download className="w-4 h-4" /> Download PDF Invoice
            </button>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/orders"
              className="rounded-xl border border-slate-800 bg-slate-900/60 py-3 text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 hover:bg-slate-800 transition-all"
            >
              <ShoppingBag className="w-3.5 h-3.5" /> Order History
            </Link>
            <Link
              to="/"
              className="rounded-xl border border-slate-800 bg-slate-900/60 py-3 text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 hover:bg-slate-800 transition-all"
            >
              <Home className="w-3.5 h-3.5" /> Back Home
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
