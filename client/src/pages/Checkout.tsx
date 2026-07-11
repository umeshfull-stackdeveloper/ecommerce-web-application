import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../services/api';
import { useAppSelector, useAppDispatch } from '../hooks/reduxHooks';
import { clearLocalCart } from '../store/slices/cartSlice';
import { useToast } from '../hooks/useToast';
import { MapPin, Plus, CreditCard, ChevronRight, Lock, Check } from 'lucide-react';

export default function Checkout() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { subtotal, items } = useAppSelector((state) => state.cart);

  // Sync cart to backend on mount to handle direct visits/refreshes cleanly
  useEffect(() => {
    if (items.length > 0) {
      apiRequest('/cart/sync', {
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
      }).catch(err => console.error('Silent checkout cart sync failed:', err));
    }
  }, []);

  // States
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'razorpay' | 'paypal' | 'cod'>('stripe');
  const [usePoints, setUsePoints] = useState(false);

  // Fetch profile to get fresh loyalty points
  const { data: profileData } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => apiRequest('/auth/me')
  });

  const userProfile = profileData?.user;
  const userPoints = userProfile?.points || 0;

  const appliedCoupon = sessionStorage.getItem('applied_coupon');

  // Fetch coupon details if any applied
  const { data: couponData } = useQuery({
    queryKey: ['appliedCoupon', appliedCoupon],
    queryFn: () => {
      if (!appliedCoupon) return null;
      return apiRequest('/orders/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: appliedCoupon, orderValue: subtotal })
      });
    },
    enabled: !!appliedCoupon
  } as any);

  const coupon = (couponData as any)?.coupon;

  // New address form
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('USA');
  const [phone, setPhone] = useState('');

  // Fetch addresses
  const { data: addrData } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => apiRequest('/orders/addresses'),
  } as any);

  const addresses = (addrData as any)?.addresses || [];

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const def = addresses.find((a: any) => a.isDefault);
      if (def) setSelectedAddressId(def.id);
      else setSelectedAddressId(addresses[0].id);
    }
  }, [addresses, selectedAddressId]);

  // Add Address mutation
  const addAddressMutation = useMutation({
    mutationFn: (body: any) => apiRequest('/orders/addresses', {
      method: 'POST',
      body: JSON.stringify(body)
    }),
    onSuccess: (res) => {
      toast.success('Address added successfully');
      setIsAddingAddress(false);
      // Reset form
      setStreet('');
      setCity('');
      setState('');
      setPostalCode('');
      setPhone('');
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setSelectedAddressId(res.address.id);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to add address');
    }
  });

  // Create Order mutation
  const createOrderMutation = useMutation({
    mutationFn: (body: any) => apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(body)
    }),
    onSuccess: async (orderRes) => {
      const orderId = orderRes.order.id;
      dispatch(clearLocalCart());

      if (paymentMethod === 'cod') {
        toast.success('Order placed successfully via Cash on Delivery!');
        navigate(`/order-success?orderId=${orderId}`);
      } else {
        // Proceed to Stripe or Sandbox
        try {
          const payRes = await apiRequest('/payments/create-checkout-session', {
            method: 'POST',
            body: JSON.stringify({ orderId, gateway: paymentMethod })
          });

          if (payRes.isMock) {
            // Direct local redirect with selected gateway query
            navigate(`${payRes.url}&gateway=${paymentMethod}`);
          } else {
            // Stripe redirect
            window.location.href = payRes.url;
          }
        } catch (err: any) {
          toast.error('Payment checkout session failed');
        }
      }
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to place order');
    }
  });

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!street || !city || !state || !postalCode || !phone) {
      toast.warning('Please fill in all address fields');
      return;
    }
    addAddressMutation.mutate({
      street,
      city,
      state,
      postalCode,
      country,
      phone,
      isDefault: addresses.length === 0
    });
  };

  const handlePlaceOrder = () => {
    if (!selectedAddressId) {
      toast.warning('Please choose a delivery address');
      return;
    }

    const appliedCoupon = sessionStorage.getItem('applied_coupon');
    sessionStorage.removeItem('applied_coupon'); // clean up

    const calculatedShipping = (subtotal > 0 && subtotal < 499) ? 99.0 : 0.0;

    createOrderMutation.mutate({
      addressId: selectedAddressId,
      couponCode: appliedCoupon || null,
      shippingCost: calculatedShipping,
      paymentMethod,
      usePoints
    });
  };

  return (
    <div className="py-6 flex flex-col gap-8 max-w-5xl mx-auto animate-slide-up">
      <h1 className="text-3xl font-extrabold text-white">Secure Checkout</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left column: Address list and payment */}
        <div className="md:col-span-2 flex flex-col gap-6">
          
          {/* Address Step */}
          <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-850">
              <span className="font-bold text-base text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-400" /> Delivery Address
              </span>
              {!isAddingAddress && (
                <button
                  onClick={() => setIsAddingAddress(true)}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add New
                </button>
              )}
            </div>

            {isAddingAddress ? (
              <form onSubmit={handleAddressSubmit} className="grid grid-cols-2 gap-4">
                <div className="col-span-2 flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Street Address</label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none"
                    placeholder="123 Developer St"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none"
                    placeholder="Seattle"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">State / Region</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none"
                    placeholder="WA"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Postal Code</label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none"
                    placeholder="98101"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none"
                    placeholder="+1 206 555 0199"
                  />
                </div>
                <div className="col-span-2 flex gap-3 justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingAddress(false)}
                    className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-2 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 cursor-pointer"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-3">
                {addresses.length === 0 ? (
                  <p className="text-slate-500 text-xs py-4 text-center">No addresses registered. Please create one.</p>
                ) : (
                  addresses.map((addr: any) => (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`p-4 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${selectedAddressId === addr.id ? 'border-indigo-500 bg-indigo-600/10' : 'border-slate-800 bg-slate-900/20 hover:border-slate-700'}`}
                    >
                      <div className="flex flex-col gap-1 text-xs">
                        <span className="font-semibold text-slate-250">
                          {addr.street}, {addr.city}, {addr.state} {addr.postalCode}
                        </span>
                        <span className="text-slate-500 text-[10px]">Contact: {addr.phone}</span>
                      </div>
                      {selectedAddressId === addr.id && (
                        <div className="rounded-full bg-indigo-500/20 p-1">
                          <Check className="w-4 h-4 text-indigo-400" />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Payment gateway display */}
          <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-850">
              <CreditCard className="w-5 h-5 text-indigo-400" />
              <span className="font-bold text-base text-white">Select Payment Gateway</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3.5">
              {[
                { id: 'stripe', title: 'Credit Card / Stripe', desc: 'Secure card checkout' },
                { id: 'razorpay', title: 'UPI / Razorpay', desc: 'NetBanking & Wallet' },
                { id: 'paypal', title: 'PayPal Sandbox', desc: 'Instant PayPal secure login' },
                { id: 'cod', title: 'Cash on Delivery (COD)', desc: 'Pay at your doorstep' }
              ].map((gateway) => (
                <div
                  key={gateway.id}
                  onClick={() => setPaymentMethod(gateway.id as any)}
                  className={`p-3.5 border rounded-2xl cursor-pointer flex flex-col gap-1 transition-all ${
                    paymentMethod === gateway.id
                      ? 'border-indigo-500 bg-indigo-600/10 shadow-md shadow-indigo-500/5'
                      : 'border-slate-800 bg-slate-900/25 hover:border-slate-700'
                  }`}
                >
                  <span className="font-bold text-xs text-white">{gateway.title}</span>
                  <span className="text-[10px] text-slate-400">{gateway.desc}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right column: Cart overview & Checkout CTA */}
        {(() => {
          const tax = parseFloat((subtotal * 0.08).toFixed(2));
          const shipping = (subtotal > 0 && subtotal < 499) ? 99.0 : 0.0;
          let couponDiscount = 0;
          if (coupon) {
            if (coupon.discountType === 'PERCENTAGE') {
              couponDiscount = parseFloat(((subtotal * coupon.value) / 100).toFixed(2));
            } else {
              couponDiscount = coupon.value;
            }
            couponDiscount = Math.min(couponDiscount, subtotal);
          }
          const prePointsTotal = subtotal + tax + shipping - couponDiscount;
          const pointsDiscount = usePoints ? Math.min(userPoints * 1, prePointsTotal) : 0;
          const finalTotal = parseFloat((prePointsTotal - pointsDiscount).toFixed(2));

          return (
            <div className="flex flex-col gap-6">
              <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4">
                <h3 className="font-bold text-base text-white border-b border-slate-850 pb-3">Place Order</h3>
                
                <div className="text-xs text-slate-400 flex flex-col gap-2.5">
                  <div className="flex justify-between">
                    <span>Subtotal (items)</span>
                    <span className="text-slate-200">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (8%)</span>
                    <span className="text-slate-200">₹{tax.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping Cost</span>
                    <span className="text-slate-200">{shipping > 0 ? `₹${shipping.toLocaleString('en-IN')}` : 'Free'}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-indigo-400 font-semibold">
                      <span>Coupon Discount</span>
                      <span>-₹{couponDiscount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {usePoints && pointsDiscount > 0 && (
                    <div className="flex justify-between text-emerald-450 font-semibold">
                      <span>Points Discount</span>
                      <span>-₹{pointsDiscount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-extrabold text-white border-t border-slate-850 pt-2.5 mt-1">
                    <span>Estimated Total</span>
                    <span>₹{finalTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                    <span>Payment Method</span>
                    <span className="uppercase font-bold text-slate-400">{paymentMethod}</span>
                  </div>
                  {finalTotal > 0 && (
                    <div className="flex justify-between text-[10px] text-indigo-400/80 mt-0.5 border-t border-dashed border-slate-850 pt-1.5">
                      <span>You will earn</span>
                      <span className="font-bold">{Math.floor(finalTotal)} loyalty points</span>
                    </div>
                  )}
                </div>

                {/* Loyalty Points Section */}
                {userPoints > 0 && (
                  <div className="border-t border-b border-slate-850 py-3.5 flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-350 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={usePoints}
                        onChange={(e) => setUsePoints(e.target.checked)}
                        className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500/30 w-4 h-4 cursor-pointer"
                      />
                      Use Loyalty Points (Balance: {userPoints} pts)
                    </label>
                    {usePoints && (
                      <p className="text-[10px] text-emerald-450 font-semibold leading-relaxed pl-6">
                        Redeeming {Math.min(userPoints, Math.ceil(prePointsTotal))} points for a ₹{pointsDiscount.toLocaleString('en-IN')} discount!
                      </p>
                    )}
                  </div>
                )}

                <button
                  onClick={handlePlaceOrder}
                  disabled={createOrderMutation.isPending || !selectedAddressId}
                  className="w-full rounded-full bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:shadow-indigo-500/10"
                >
                  <Lock className="w-4 h-4" /> Pay & Place Order
                </button>
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
}
