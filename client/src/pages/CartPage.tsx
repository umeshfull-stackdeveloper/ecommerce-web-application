import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../hooks/reduxHooks';
import { updateLocalItemQty, removeLocalItem, clearLocalCart } from '../store/slices/cartSlice';
import { useToast } from '../hooks/useToast';
import { ShoppingBag, Trash2, ArrowRight, Percent, ArrowLeft } from 'lucide-react';
import { apiRequest } from '../services/api';

export default function CartPage() {
  const { items, subtotal } = useAppSelector((state) => state.cart);
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const toast = useToast();
  const navigate = useNavigate();

  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [discountValue, setDiscountValue] = useState(0);
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED' | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  const handleQtyChange = (itemId: string, currentQty: number, change: number) => {
    const nextQty = currentQty + change;
    if (nextQty >= 1) {
      dispatch(updateLocalItemQty({ id: itemId, quantity: nextQty }));
    }
  };

  const handleRemove = (itemId: string) => {
    dispatch(removeLocalItem(itemId));
    toast.success('Item removed from cart');
  };

  const handleCouponApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    try {
      const res = await apiRequest('/orders/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({
          code: couponCode,
          orderValue: subtotal
        })
      });

      if (res.status === 'success') {
        const coupon = res.coupon;
        setDiscountType(coupon.discountType);
        setDiscountValue(coupon.value);
        setAppliedCoupon(coupon.code);
        toast.success(`Coupon ${coupon.code} applied successfully!`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Invalid coupon code');
    }
  };

  // Calculations
  const taxAmount = parseFloat((subtotal * 0.08).toFixed(2));
  const shippingCost = (subtotal > 0 && subtotal < 499) ? 99.0 : 0.0;
  
  let discountAmount = 0;
  if (appliedCoupon && discountType) {
    if (discountType === 'PERCENTAGE') {
      discountAmount = parseFloat(((subtotal * discountValue) / 100).toFixed(2));
    } else {
      discountAmount = discountValue;
    }
    discountAmount = Math.min(discountAmount, subtotal);
  }

  const finalTotal = parseFloat((subtotal + taxAmount + shippingCost - discountAmount).toFixed(2));

  const [isSyncing, setIsSyncing] = useState(false);

  const handleCheckoutRedirect = async () => {
    if (!isAuthenticated) {
      toast.info('Please sign in or register to complete checkout');
      navigate('/auth?redirect=checkout');
      return;
    }

    setIsSyncing(true);
    try {
      await apiRequest('/cart/sync', {
        method: 'POST',
        body: JSON.stringify({
          localItems: items.map(item => ({
            productId: item.productId,
            selectedSize: item.selectedSize || null,
            selectedColor: item.selectedColor || null,
            quantity: item.quantity
          })),
          replace: true
        })
      });

      if (appliedCoupon) {
        sessionStorage.setItem('applied_coupon', appliedCoupon);
      }
      navigate('/checkout');
    } catch (err: any) {
      toast.error(err.message || 'Failed to prepare checkout session');
    } finally {
      setIsSyncing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center gap-6 text-center animate-slide-up">
        <div className="rounded-full bg-slate-900/50 p-6 border border-slate-800">
          <ShoppingBag className="w-12 h-12 text-slate-650" />
        </div>
        <h2 className="text-2xl font-bold text-white">Your Shopping Cart is Empty</h2>
        <p className="text-sm text-slate-500 max-w-xs">
          Explore our next-gen items and fill your catalog bag with awesome gadgets!
        </p>
        <Link
          to="/search"
          className="rounded-full bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition-colors cursor-pointer"
        >
          Go Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="py-6 flex flex-col gap-8 max-w-6xl mx-auto animate-slide-up">
      <h1 className="text-3xl font-extrabold text-white">Shopping Cart Bag</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Cart Items List */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {items.map((item) => {
            const productImg = JSON.parse(item.product.images || '[]')[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400';
            const price = item.product.discountPrice || item.product.price;
            
            return (
              <div key={item.id} className="glass-panel rounded-2xl p-4 flex gap-4 items-center">
                
                {/* Image */}
                <div className="h-20 w-20 rounded-xl overflow-hidden bg-slate-950 border border-slate-900 flex-shrink-0">
                  <img src={productImg} className="w-full h-full object-cover" />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${item.product.slug}`} className="font-bold text-sm text-white hover:text-indigo-400 truncate block transition-colors">
                    {item.product.name}
                  </Link>
                  <p className="text-[10px] text-slate-500 mt-1 flex flex-wrap gap-2">
                    {item.selectedSize && <span>Size: <strong>{item.selectedSize}</strong></span>}
                    {item.selectedColor && <span>Color: <strong>{item.selectedColor}</strong></span>}
                  </p>
                  <span className="font-bold text-xs text-slate-200 mt-2 block">₹{price.toLocaleString('en-IN')}</span>
                </div>

                {/* Qty adjustments */}
                <div className="flex items-center border border-slate-800 bg-slate-950 rounded-lg px-1">
                  <button onClick={() => handleQtyChange(item.id, item.quantity, -1)} className="px-2 py-1 text-slate-500 hover:text-white">-</button>
                  <span className="px-2 text-xs font-bold text-slate-350">{item.quantity}</span>
                  <button onClick={() => handleQtyChange(item.id, item.quantity, 1)} className="px-2 py-1 text-slate-500 hover:text-white">+</button>
                </div>

                {/* Trash */}
                <button
                  onClick={() => handleRemove(item.id)}
                  className="p-2 text-slate-500 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

              </div>
            );
          })}

          <Link to="/search" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 mt-2">
            <ArrowLeft className="w-3 h-3" /> Continue Shopping
          </Link>
        </div>

        {/* Totals Summary */}
        <div className="flex flex-col gap-6">
          
          <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4">
            <h3 className="font-bold text-base text-white border-b border-slate-850 pb-3">Order Summary</h3>
            
            <div className="flex flex-col gap-2.5 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-200">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Tax (8%)</span>
                <span className="font-semibold text-slate-200">₹{taxAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Cost</span>
                <span className="font-semibold text-slate-200">{shippingCost > 0 ? `₹${shippingCost.toLocaleString('en-IN')}` : 'Free'}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-rose-400">
                  <span>Coupon Discount</span>
                  <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>

            <div className="border-t border-slate-850 pt-3 flex justify-between items-baseline">
              <span className="font-bold text-sm text-white">Estimated Total</span>
              <span className="font-extrabold text-xl text-white">₹{finalTotal.toLocaleString('en-IN')}</span>
            </div>

            <button
              onClick={handleCheckoutRedirect}
              disabled={isSyncing}
              className="w-full rounded-full bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-indigo-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSyncing ? 'Preparing Checkout...' : 'Checkout Now'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Coupon Engine interface */}
          <div className="glass-panel rounded-2xl p-6 flex flex-col gap-3">
            <span className="font-semibold text-xs text-slate-350 flex items-center gap-1.5">
              <Percent className="w-4 h-4 text-indigo-400" /> Apply Promo Coupon
            </span>
            <form onSubmit={handleCouponApply} className="flex gap-2">
              <input
                type="text"
                placeholder="Code: SAVE20, FLAT50"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                disabled={!!appliedCoupon}
                className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 uppercase outline-none focus:border-indigo-500/80"
              />
              <button
                type="submit"
                disabled={!!appliedCoupon}
                className="rounded-lg bg-indigo-600 px-4 text-xs font-bold text-white hover:bg-indigo-500 cursor-pointer disabled:opacity-40"
              >
                Apply
              </button>
            </form>
            {appliedCoupon && (
              <span className="text-[10px] text-emerald-450 font-semibold">
                ✓ Coupon code {appliedCoupon} applied successfully!
              </span>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
