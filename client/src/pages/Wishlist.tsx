import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useAppDispatch } from '../hooks/reduxHooks';
import { addLocalItem } from '../store/slices/cartSlice';
import { Heart, ShoppingCart, Trash2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Wishlist() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const dispatch = useAppDispatch();

  // Fetch wishlist
  const { data, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => apiRequest('/wishlist')
  });

  const wishlistItems = data?.wishlist?.items || [];

  // Remove mutation
  const removeMutation = useMutation({
    mutationFn: (productId: string) => apiRequest('/wishlist/toggle', {
      method: 'POST',
      body: JSON.stringify({ productId })
    }),
    onSuccess: (res) => {
      toast.success(res.message);
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    }
  });

  const handleAddToCart = (product: any) => {
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
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <div className="py-6 flex flex-col gap-8 max-w-5xl mx-auto animate-slide-up">
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
          <Heart className="w-8 h-8 text-rose-500 fill-current" /> My Wishlist
        </h1>
        <p className="text-xs text-slate-450 mt-1">Review saved products, check availability, and move to shopping bag.</p>
      </div>

      {isLoading ? (
        <div className="h-28 w-full animate-pulse rounded-2xl bg-slate-900/60" />
      ) : wishlistItems.length === 0 ? (
        <div className="text-center py-16 border border-slate-800 border-dashed rounded-3xl bg-slate-950/20 flex flex-col items-center">
          <Heart className="w-10 h-10 text-slate-650 mb-2" />
          <p className="text-slate-400 font-medium">Your wishlist collection is empty.</p>
          <Link to="/search" className="mt-4 rounded-full bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-500">
            Find Products
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {wishlistItems.map((item: any) => {
            const product = item.product;
            const image = JSON.parse(product.images || '[]')[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200';
            const price = product.discountPrice || product.price;

            return (
              <div key={item.id} className="glass-panel rounded-2xl p-4 flex gap-4 items-center">
                <img src={image} className="w-16 h-16 object-cover rounded-xl bg-slate-950 border border-slate-900 flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${product.slug}`} className="font-bold text-sm text-white hover:text-indigo-400 truncate block">
                    {product.name}
                  </Link>
                  <span className="font-bold text-xs text-slate-300 block mt-1">${price.toFixed(2)}</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="rounded-lg bg-indigo-600/90 hover:bg-indigo-650 text-white px-3 py-1.5 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" /> Buy
                  </button>
                  <button
                    onClick={() => removeMutation.mutate(product.id)}
                    className="p-2 text-slate-500 hover:text-rose-500 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
