import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '../services/api';
import { useToast } from '../hooks/useToast';
import { ShieldCheck, CheckCircle, XCircle, CreditCard, Laptop, Smartphone, Building2 } from 'lucide-react';

export default function MockCheckout() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') || '';
  const amount = searchParams.get('amount') || '0.00';
  const gateway = searchParams.get('gateway') || 'stripe';
  
  const navigate = useNavigate();
  const toast = useToast();

  // Sandbox inputs
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [upiId, setUpiId] = useState('9876543210@ybl');
  const [paypalEmail, setPaypalEmail] = useState('developer-sandbox@paypal.com');

  // Indian Payment Options State
  const [upiMethod, setUpiMethod] = useState<'phonepe' | 'gpay' | 'paytm' | 'netbanking'>('phonepe');
  const [selectedBank, setSelectedBank] = useState('State Bank of India');

  const fillTestCard = () => {
    setCardNumber('4242 4242 4242 4242');
    toast.success('Test card details filled!');
  };

  const successMutation = useMutation({
    mutationFn: () => apiRequest(`/payments/mock-success/${orderId}`, {
      method: 'POST'
    }),
    onSuccess: () => {
      toast.success('Mock payment captured successfully!');
      navigate(`/order-success?orderId=${orderId}`);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Simulation success trigger failed');
    }
  });

  const handleCancel = () => {
    toast.warning('Mock payment cancelled');
    navigate(`/order-failed?orderId=${orderId}`);
  };

  return (
    <div className="py-12 flex justify-center items-center min-h-[70vh] animate-slide-up">
      <div className="glass-panel rounded-3xl p-8 w-full max-w-md border-indigo-500/25 shadow-2xl relative overflow-hidden">
        
        <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-indigo-500/5 blur-2xl" />

        {/* Brand/Gate Header */}
        <div className="flex flex-col items-center text-center gap-3.5 mb-6">
          <div className="rounded-full bg-indigo-500/10 p-3.5 border border-indigo-500/20 text-indigo-400">
            <ShieldCheck className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="text-xl font-extrabold text-white uppercase tracking-wider">
            {gateway === 'stripe' ? 'Stripe Secure Checkout' : gateway === 'razorpay' ? 'UPI Secure QR Payment' : 'PayPal Secure Portal'}
          </h2>
          <p className="text-[10px] text-slate-400 leading-relaxed max-w-xs uppercase font-bold tracking-wider">
            Developer Sandbox Mode
          </p>
        </div>

        {/* Transaction Summary */}
        <div className="bg-slate-950 p-4.5 rounded-2xl border border-slate-900 flex flex-col gap-2.5 text-xs text-slate-400 mb-6">
          <div className="flex justify-between border-b border-slate-900 pb-2">
            <span>Transaction ID</span>
            <span className="font-bold text-slate-205">#ORD-{orderId.substring(0, 8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between items-baseline pt-1">
            <span>Payment Total</span>
            <span className="text-lg font-black text-indigo-400">₹{parseFloat(amount).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Custom Gateway Sandbox Inputs */}
        <div className="mb-8">
          {gateway === 'stripe' && (
            <div className="flex flex-col gap-4 bg-slate-950/40 p-4 border border-slate-900 rounded-2xl">
              <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                <span>Credit Card Details</span>
                <button
                  type="button"
                  onClick={fillTestCard}
                  className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 underline cursor-pointer bg-transparent border-none"
                >
                  Fill Test Card
                </button>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1 text-[10px]">
                  <span className="text-slate-500 font-bold uppercase">Card Number</span>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1 text-[10px]">
                    <span className="text-slate-500 font-bold uppercase">Expiry (MM/YY)</span>
                    <input
                      type="text"
                      defaultValue="12/28"
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-[10px]">
                    <span className="text-slate-500 font-bold uppercase">CVC Code</span>
                    <input
                      type="password"
                      defaultValue="422"
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                    />
                  </div>
                </div>
                <p className="text-[9px] text-slate-500 leading-normal italic mt-0.5">
                  Sandbox cards bypass actual charge processing and simulate instant success.
                </p>
              </div>
            </div>
          )}

          {gateway === 'razorpay' && (
            <div className="flex flex-col items-center gap-6 bg-slate-950/40 p-6 border border-slate-900 rounded-3xl text-center">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-slate-350 uppercase tracking-wider">Scan & Pay via UPI</span>
                <p className="text-[10px] text-slate-500 max-w-[240px] leading-relaxed mx-auto">
                  Scan this dynamic QR code using Google Pay, PhonePe, Paytm, or BHIM app.
                </p>
              </div>

              {/* Dynamic QR Code Container */}
              <div className="bg-white p-3.5 rounded-2xl shadow-xl flex items-center justify-center border border-slate-200 relative">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                    `upi://pay?pa=nexusindia@oksbi&pn=Nexus%20India%20Premium%20Stores&am=${amount}&cu=INR&tn=Order%2520${orderId.substring(0, 8)}`
                  )}`}
                  alt="UPI QR Code"
                  className="w-40 h-40"
                />
                {/* Micro-animation scanner line */}
                <div className="absolute top-3.5 left-3.5 w-[160px] h-[2px] bg-indigo-500 shadow-md shadow-indigo-500/50 animate-bounce pointer-events-none opacity-80" />
              </div>

              <div className="flex flex-col gap-1 text-xs">
                <span className="font-extrabold text-white text-base">₹{parseFloat(amount).toLocaleString('en-IN')}</span>
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Merchant: Nexus India Stores</span>
              </div>

              <p className="text-[9px] text-slate-500 italic max-w-[240px] leading-relaxed mx-auto">
                No real funds will be charged. Click Authorize below to complete checkout simulation.
              </p>
            </div>
          )}

          {gateway === 'paypal' && (
            <div className="flex flex-col gap-4 bg-slate-950/40 p-4 border border-slate-900 rounded-2xl">
              <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                <span>PayPal Account login</span>
                <Laptop className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1 text-[10px]">
                  <span className="text-slate-500 font-bold uppercase">PayPal Email Address</span>
                  <input
                    type="email"
                    value={paypalEmail}
                    onChange={(e) => setPaypalEmail(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500/50"
                  />
                </div>
                <div className="flex flex-col gap-1 text-[10px]">
                  <span className="text-slate-500 font-bold uppercase">Password</span>
                  <input
                    type="password"
                    defaultValue="sandbox-password"
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Form CTA Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => successMutation.mutate()}
            disabled={successMutation.isPending}
            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 text-sm font-semibold text-white flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-indigo-500/10 transition-all disabled:opacity-40"
          >
            <CheckCircle className="w-4 h-4" /> Authorize Sandbox Payment
          </button>
          
          <button
            onClick={handleCancel}
            className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 py-3 text-sm font-semibold text-slate-350 flex items-center justify-center gap-2 cursor-pointer border border-slate-800 transition-all"
          >
            <XCircle className="w-4 h-4" /> Decline / Cancel
          </button>
        </div>

      </div>
    </div>
  );
}

