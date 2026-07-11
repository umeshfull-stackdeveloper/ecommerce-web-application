import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
  id: string; // cart item database ID, or temporary guest ID
  productId: string;
  quantity: number;
  selectedSize?: string | null;
  selectedColor?: string | null;
  product: {
    id: string;
    name: string;
    price: number;
    discountPrice?: number | null;
    images: string; // JSON array string
    slug: string;
  };
}

interface CartState {
  items: CartItem[];
  subtotal: number;
  totalQuantity: number;
}

const getLocalCart = (): CartItem[] => {
  const local = localStorage.getItem('guest_cart');
  if (local) {
    try {
      return JSON.parse(local);
    } catch {
      return [];
    }
  }
  return [];
};

const calculateTotals = (items: CartItem[]) => {
  let subtotal = 0;
  let totalQuantity = 0;

  items.forEach((item) => {
    const price = item.product.discountPrice || item.product.price;
    subtotal += price * item.quantity;
    totalQuantity += item.quantity;
  });

  return { subtotal, totalQuantity };
};

const initialLocalItems = getLocalCart();
const initialTotals = calculateTotals(initialLocalItems);

const initialState: CartState = {
  items: initialLocalItems,
  subtotal: initialTotals.subtotal,
  totalQuantity: initialTotals.totalQuantity,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCart: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload;
      const { subtotal, totalQuantity } = calculateTotals(action.payload);
      state.subtotal = subtotal;
      state.totalQuantity = totalQuantity;
    },
    addLocalItem: (state, action: PayloadAction<Omit<CartItem, 'id'>>) => {
      // Find matching item in local cart
      const existing = state.items.find(
        (item) =>
          item.productId === action.payload.productId &&
          item.selectedSize === action.payload.selectedSize &&
          item.selectedColor === action.payload.selectedColor
      );

      if (existing) {
        existing.quantity += action.payload.quantity;
      } else {
        const id = 'local_' + Math.random().toString(36).substring(2, 9);
        state.items.push({ ...action.payload, id });
      }

      localStorage.setItem('guest_cart', JSON.stringify(state.items));
      const { subtotal, totalQuantity } = calculateTotals(state.items);
      state.subtotal = subtotal;
      state.totalQuantity = totalQuantity;
    },
    updateLocalItemQty: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const item = state.items.find((i) => i.id === action.payload.id);
      if (item) {
        item.quantity = action.payload.quantity;
      }
      localStorage.setItem('guest_cart', JSON.stringify(state.items));
      const { subtotal, totalQuantity } = calculateTotals(state.items);
      state.subtotal = subtotal;
      state.totalQuantity = totalQuantity;
    },
    removeLocalItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((i) => i.id !== action.payload);
      localStorage.setItem('guest_cart', JSON.stringify(state.items));
      const { subtotal, totalQuantity } = calculateTotals(state.items);
      state.subtotal = subtotal;
      state.totalQuantity = totalQuantity;
    },
    clearLocalCart: (state) => {
      state.items = [];
      state.subtotal = 0;
      state.totalQuantity = 0;
      localStorage.removeItem('guest_cart');
    }
  },
});

export const { 
  setCart, 
  addLocalItem, 
  updateLocalItemQty, 
  removeLocalItem, 
  clearLocalCart 
} = cartSlice.actions;
export default cartSlice.reducer;
