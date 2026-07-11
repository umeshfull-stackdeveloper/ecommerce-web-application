import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../hooks/reduxHooks';
import { addLocalItem } from '../store/slices/cartSlice';
import { addToast } from '../store/slices/toastSlice';
import { apiRequest } from '../services/api';
import {
  ShoppingBag, Calendar, Download, Eye, EyeOff, Search, SlidersHorizontal, ChevronRight,
  TrendingUp, Award, MapPin, Truck, ShieldCheck, Compass, CheckCircle2, AlertCircle,
  HelpCircle, MessageSquare, PhoneCall, RefreshCw, X, ChevronDown, Check, Info, Share2,
  FileText, ShieldAlert, ArrowRight, Star, ShoppingCart, User, Gift, ChevronLeft, Play
} from 'lucide-react';

// Interfaces for our dashboard structure
interface OrderAddress {
  recipient: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  instructions: string;
}

interface ProductItem {
  id: string;
  name: string;
  brand: string;
  color: string;
  size: string;
  price: number;
  originalPrice?: number;
  qty: number;
  image: string;
  rating: number;
  isBook?: boolean;
  author?: string;
  publisher?: string;
  language?: string;
  isbn?: string;
}

interface DemoOrder {
  id: string;
  orderNumber: string;
  status: string; // 'PENDING' | 'CONFIRMED' | 'PACKED' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'RETURNED' | 'REFUNDED'
  placedDate: string;
  expectedDelivery: string;
  estimatedArrivalDays: number;
  seller: {
    name: string;
    logo: string;
    rating: number;
    gstVerified: boolean;
    storeSince: string;
    warrantyPolicy: string;
    supportPolicy: string;
  };
  payment: {
    method: string;
    transactionId: string;
    invoiceNumber: string;
    gstin: string;
    status: string;
    pointsEarned: number;
    taxAmount: number;
    shippingCost: number;
    couponDiscount: number;
    pointsDiscount: number;
    walletUsed: number;
    subtotal: number;
    grandTotal: number;
  };
  courier?: {
    name: string;
    trackingNumber: string;
    vehicle: string;
    driverName: string;
    driverPhone: string;
    driverPhoto: string;
    currentLocation: string;
    distanceKm: number;
    otp: string;
    weightKg: number;
    estTime: string;
  };
  address: OrderAddress;
  items: ProductItem[];
  timeline: {
    status: string;
    label: string;
    timestamp: string;
    location: string;
    detail: string;
    completed: boolean;
  }[];
}

// ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// MOCK DEMO DATA (High Fidelity, curated for Nexus India)
// ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const DEMO_ORDERS: DemoOrder[] = [
  {
    id: "demo-order-1",
    orderNumber: "a89feab7",
    status: "CONFIRMED",
    placedDate: "4 July 2026",
    expectedDelivery: "9 July 2026",
    estimatedArrivalDays: 2,
    seller: {
      name: "Decathlon India",
      logo: "🚲",
      rating: 4.8,
      gstVerified: true,
      storeSince: "2018",
      warrantyPolicy: "2 Years Brand Warranty on Frame, 6 Months on Components.",
      supportPolicy: "Easy replacements within 7 days of delivery at any Decathlon Hub."
    },
    payment: {
      method: "PhonePe UPI",
      transactionId: "TXN982409823019",
      invoiceNumber: "INV-2026-9812",
      gstin: "27AAACD9281A1ZP",
      status: "COMPLETED",
      pointsEarned: 350,
      subtotal: 39999,
      taxAmount: 2800,
      shippingCost: 499,
      couponDiscount: 5000,
      pointsDiscount: 300,
      walletUsed: 1000,
      grandTotal: 36998
    },
    courier: {
      name: "BlueDart Express",
      trackingNumber: "BD891238910IN",
      vehicle: "Electric Delivery Van (NEX-EV-92)",
      driverName: "Rajesh Kumar",
      driverPhone: "+91 98765 43210",
      driverPhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=105&fit=crop",
      currentLocation: "Mumbai Sorting Center Hub",
      distanceKm: 42.5,
      otp: "4819",
      weightKg: 11.5,
      estTime: "9 July, 3:00 PM"
    },
    address: {
      recipient: "Umesh Dunnaboyina",
      phone: "+91 91234 56789",
      street: "Flat 402, Signature Elite Towers, Outer Ring Road",
      city: "Bengaluru",
      state: "Karnataka",
      postalCode: "560103",
      country: "India",
      instructions: "Keep with society security guard if not home. Do not ring bell after 9 PM."
    },
    items: [
      {
        id: "demo-prod-1",
        name: "Triban RC100 Road Bike",
        brand: "Decathlon",
        color: "Slate Grey",
        size: "Medium",
        price: 34999,
        originalPrice: 39999,
        qty: 1,
        image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=300",
        rating: 5
      }
    ],
    timeline: [
      { status: "PENDING", label: "Order Placed", timestamp: "4 July 2026, 10:15 AM", location: "Bengaluru City Hub", detail: "Order successfully submitted by customer.", completed: true },
      { status: "CONFIRMED", label: "Payment Successful", timestamp: "4 July 2026, 10:17 AM", location: "PhonePe PG Gateway", detail: "Transaction approved under ID TXN982409823019.", completed: true },
      { status: "CONFIRMED", label: "Confirmed by Seller", timestamp: "4 July 2026, 1:45 PM", location: "Decathlon Warehouse, Pune", detail: "Decathlon India verified stock and accepted order.", completed: true },
      { status: "PACKED", label: "Packed at Warehouse", timestamp: "5 July 2026, 9:00 AM", location: "Decathlon Warehouse, Pune", detail: "Item securely packed, invoice slip attached.", completed: false },
      { status: "SHIPPED", label: "Shipped & Dispatched", timestamp: "--", location: "--", detail: "BlueDart pickup scheduled.", completed: false },
      { status: "OUT_FOR_DELIVERY", label: "Out for Delivery", timestamp: "--", location: "--", detail: "Package heading to final address.", completed: false },
      { status: "DELIVERED", label: "Delivered", timestamp: "--", location: "--", detail: "Handover OTP required.", completed: false }
    ]
  },
  {
    id: "demo-order-2",
    orderNumber: "b392fda8",
    status: "DELIVERED",
    placedDate: "2 July 2026",
    expectedDelivery: "3 July 2026",
    estimatedArrivalDays: 0,
    seller: {
      name: "HarperCollins India",
      logo: "📚",
      rating: 4.9,
      gstVerified: true,
      storeSince: "2015",
      warrantyPolicy: "Physical books cover only printing errors/missing pages replacements.",
      supportPolicy: "Immediate return if book arrived damaged or bent."
    },
    payment: {
      method: "Google Pay UPI",
      transactionId: "TXN102948293746",
      invoiceNumber: "INV-2026-4829",
      gstin: "27AAACH8921J1ZO",
      status: "COMPLETED",
      pointsEarned: 24,
      subtotal: 849,
      taxAmount: 76,
      shippingCost: 40,
      couponDiscount: 100,
      pointsDiscount: 0,
      walletUsed: 0,
      grandTotal: 865
    },
    courier: {
      name: "Delhivery Plus",
      trackingNumber: "DEL2093849182",
      vehicle: "Delivery Rider Motorcycle",
      driverName: "Amit Singh",
      driverPhone: "+91 88877 66554",
      driverPhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      currentLocation: "Delivered to Residence",
      distanceKm: 0,
      otp: "9041",
      weightKg: 1.2,
      estTime: "3 July, 1:20 PM (Completed)"
    },
    address: {
      recipient: "Umesh Dunnaboyina",
      phone: "+91 91234 56789",
      street: "Flat 402, Signature Elite Towers, Outer Ring Road",
      city: "Bengaluru",
      state: "Karnataka",
      postalCode: "560103",
      country: "India",
      instructions: "Ring doorbell, hand over to family."
    },
    items: [
      {
        id: "demo-prod-2",
        name: "The Psychology of Money",
        brand: "Morgan Housel",
        color: "Paperback Edition",
        size: "Standard",
        price: 399,
        originalPrice: 499,
        qty: 1,
        image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300",
        rating: 5,
        isBook: true,
        author: "Morgan Housel",
        publisher: "Jaico Publishing House",
        language: "English",
        isbn: "978-9390166268"
      },
      {
        id: "demo-prod-3",
        name: "Atomic Habits",
        brand: "James Clear",
        color: "Hardcover Special",
        size: "Standard",
        price: 450,
        originalPrice: 550,
        qty: 1,
        image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=300",
        rating: 5,
        isBook: true,
        author: "James Clear",
        publisher: "Penguin Random House",
        language: "English",
        isbn: "978-1847941831"
      }
    ],
    timeline: [
      { status: "PENDING", label: "Order Placed", timestamp: "2 July 2026, 8:00 AM", location: "Bengaluru City Hub", detail: "Order successfully submitted.", completed: true },
      { status: "CONFIRMED", label: "Confirmed", timestamp: "2 July 2026, 8:30 AM", location: "HarperCollins Depot", detail: "Books packed and certified for shipment.", completed: true },
      { status: "SHIPPED", label: "Shipped", timestamp: "2 July 2026, 4:00 PM", location: "Hubli Sorting Depot", detail: "Consignment handed over to Delhivery.", completed: true },
      { status: "OUT_FOR_DELIVERY", label: "Out for Delivery", timestamp: "3 July 2026, 9:00 AM", location: "Marathahalli Center", detail: "Package loaded in dispatch unit.", completed: true },
      { status: "DELIVERED", label: "Delivered", timestamp: "3 July 2026, 1:20 PM", location: "Customer Doorstep", detail: "Package handed over with OTP verification.", completed: true }
    ]
  },
  {
    id: "demo-order-3",
    orderNumber: "c902ff22",
    status: "RETURNED",
    placedDate: "25 June 2026",
    expectedDelivery: "28 June 2026",
    estimatedArrivalDays: 0,
    seller: {
      name: "Nike India Official",
      logo: "✔️",
      rating: 4.7,
      gstVerified: true,
      storeSince: "2019",
      warrantyPolicy: "No brand warranty on apparel, standard 30 days manufacturing defect claims.",
      supportPolicy: "Complimentary pickup for size exchanges or returns."
    },
    payment: {
      method: "HDFC Credit Card",
      transactionId: "TXN76293810298",
      invoiceNumber: "INV-2026-1029",
      gstin: "27AAACN8301B1ZH",
      status: "REFUNDED",
      pointsEarned: 0,
      subtotal: 9999,
      taxAmount: 1800,
      shippingCost: 0,
      couponDiscount: 1000,
      pointsDiscount: 0,
      walletUsed: 0,
      grandTotal: 8999
    },
    address: {
      recipient: "Umesh Dunnaboyina",
      phone: "+91 91234 56789",
      street: "Flat 402, Signature Elite Towers, Outer Ring Road",
      city: "Bengaluru",
      state: "Karnataka",
      postalCode: "560103",
      country: "India",
      instructions: "No instructions."
    },
    items: [
      {
        id: "demo-prod-4",
        name: "Nike Air Max Sneakers",
        brand: "Nike",
        color: "Obsidian/White",
        size: "UK 9",
        price: 9999,
        originalPrice: 10999,
        qty: 1,
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300",
        rating: 4
      }
    ],
    timeline: [
      { status: "PENDING", label: "Order Placed", timestamp: "25 June 2026", location: "Bengaluru Portal", detail: "Submitted.", completed: true },
      { status: "DELIVERED", label: "Delivered", timestamp: "28 June 2026", location: "Residence", detail: "Handed over.", completed: true },
      { status: "RETURNED", label: "Return Initiated", timestamp: "29 June 2026", location: "App Request", detail: "Customer requested return: Size was too small.", completed: true },
      { status: "RETURNED", label: "Return Picked Up", timestamp: "30 June 2026", location: "Delhivery Courier", detail: "Courier scanned and validated item quality.", completed: true },
      { status: "REFUNDED", label: "Refund Processed", timestamp: "1 July 2026", location: "HDFC Card Refund Gateway", detail: "₹8,999 returned to Card ending in 4021.", completed: true }
    ]
  },
  {
    id: "demo-order-4",
    orderNumber: "d29831a3",
    status: "CANCELLED",
    placedDate: "20 June 2026",
    expectedDelivery: "25 June 2026",
    estimatedArrivalDays: 0,
    seller: {
      name: "Apple Store India",
      logo: "🍏",
      rating: 5.0,
      gstVerified: true,
      storeSince: "2020",
      warrantyPolicy: "1 Year Apple Limited Warranty. Valid worldwide.",
      supportPolicy: "Easy AppleCare+ extension options via support."
    },
    payment: {
      method: "UPI QR Payment",
      transactionId: "TXN540918239012",
      invoiceNumber: "INV-2026-0021",
      gstin: "27AAAAP1002C1ZQ",
      status: "CANCELLED",
      pointsEarned: 0,
      subtotal: 144900,
      taxAmount: 26082,
      shippingCost: 0,
      couponDiscount: 0,
      pointsDiscount: 0,
      walletUsed: 0,
      grandTotal: 144900
    },
    address: {
      recipient: "Umesh Dunnaboyina",
      phone: "+91 91234 56789",
      street: "Flat 402, Signature Elite Towers, Outer Ring Road",
      city: "Bengaluru",
      state: "Karnataka",
      postalCode: "560103",
      country: "India",
      instructions: "Handover directly."
    },
    items: [
      {
        id: "demo-prod-5",
        name: "iPhone 17 Pro Max",
        brand: "Apple",
        color: "Natural Titanium",
        size: "256 GB",
        price: 144900,
        qty: 1,
        image: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=300",
        rating: 5
      }
    ],
    timeline: [
      { status: "PENDING", label: "Order Initiated", timestamp: "20 June 2026", location: "Nexus App", detail: "Order checkout initialised.", completed: true },
      { status: "CANCELLED", label: "Cancelled", timestamp: "20 June 2026, 11:30 AM", location: "User Action", detail: "Cancelled by user: Changed mind on color variant.", completed: true }
    ]
  },
  {
    id: "demo-order-5",
    orderNumber: "e3401fa9",
    status: "SHIPPED",
    placedDate: "3 July 2026",
    expectedDelivery: "8 July 2026",
    estimatedArrivalDays: 4,
    seller: {
      name: "Xiaomi India",
      logo: "📱",
      rating: 4.6,
      gstVerified: true,
      storeSince: "2017",
      warrantyPolicy: "1 Year Domestic Warranty.",
      supportPolicy: "Replacement within 10 days for hardware faults."
    },
    payment: {
      method: "Razorpay NetBanking",
      transactionId: "TXN10298301928",
      invoiceNumber: "INV-2026-7491",
      gstin: "27AAACX1820D1ZR",
      status: "COMPLETED",
      pointsEarned: 199,
      subtotal: 19999,
      taxAmount: 1800,
      shippingCost: 0,
      couponDiscount: 1000,
      pointsDiscount: 0,
      walletUsed: 0,
      grandTotal: 18999
    },
    courier: {
      name: "Delhivery Express",
      trackingNumber: "DEL9901823901",
      vehicle: "Container Truck (NEX-TRK-10)",
      driverName: "Satish Kumar",
      driverPhone: "+91 99008 87766",
      driverPhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
      currentLocation: "Secunderabad Transit Hub",
      distanceKm: 340,
      otp: "1092",
      weightKg: 0.6,
      estTime: "8 July, 12:00 PM"
    },
    address: {
      recipient: "Umesh Dunnaboyina",
      phone: "+91 91234 56789",
      street: "Flat 402, Signature Elite Towers, Outer Ring Road",
      city: "Bengaluru",
      state: "Karnataka",
      postalCode: "560103",
      country: "India",
      instructions: "Keep near front door shoe rack."
    },
    items: [
      {
        id: "demo-prod-6",
        name: "Redmi Note 15 Pro",
        brand: "Xiaomi",
        color: "Midnight Jade",
        size: "8GB RAM / 256GB",
        price: 19999,
        qty: 1,
        image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=300",
        rating: 4
      }
    ],
    timeline: [
      { status: "PENDING", label: "Placed", timestamp: "3 July 2026", location: "Portal", detail: "Done.", completed: true },
      { status: "CONFIRMED", label: "Confirmed", timestamp: "3 July 2026", location: "Xiaomi Pune Depot", detail: "Accepted.", completed: true },
      { status: "PACKED", label: "Packed", timestamp: "4 July 2026", location: "Xiaomi Depot", detail: "Consigned.", completed: true },
      { status: "SHIPPED", label: "Shipped out from Source Hub", timestamp: "4 July 2026, 4:00 PM", location: "Pune Main Cargo", detail: "Dispatched towards Bengaluru in express truck.", completed: true },
      { status: "SHIPPED", label: "Arrived at Secunderabad Transit", timestamp: "4 July 2026, 11:30 PM", location: "Secunderabad Sorting Terminal", detail: "In transit hub, undergoing sorting.", completed: true },
      { status: "OUT_FOR_DELIVERY", label: "Out for Delivery", timestamp: "--", location: "--", detail: "Awaiting local hub arrival.", completed: false },
      { status: "DELIVERED", label: "Delivered", timestamp: "--", location: "--", detail: "Awaiting signature.", completed: false }
    ]
  },
  {
    id: "demo-order-6",
    orderNumber: "f901a823",
    status: "OUT_FOR_DELIVERY",
    placedDate: "3 July 2026",
    expectedDelivery: "4 July 2026",
    estimatedArrivalDays: 0,
    seller: {
      name: "Samsung Electronics",
      logo: "🌌",
      rating: 4.8,
      gstVerified: true,
      storeSince: "2016",
      warrantyPolicy: "1 Year Manufacturer Warranty on Watch & Battery.",
      supportPolicy: "Free remote diagnostic support via Samsung hotline."
    },
    payment: {
      method: "UPI QR (Paytm)",
      transactionId: "TXN748102930219",
      invoiceNumber: "INV-2026-6410",
      gstin: "27AAACS1092M1ZK",
      status: "COMPLETED",
      pointsEarned: 420,
      subtotal: 42999,
      taxAmount: 7740,
      shippingCost: 0,
      couponDiscount: 2000,
      pointsDiscount: 500,
      walletUsed: 1500,
      grandTotal: 38999
    },
    courier: {
      name: "DHL Express India",
      trackingNumber: "DHL1029381029",
      vehicle: "Honda Activa Scooter (KA-03-HL-9102)",
      driverName: "Srinivas Gowda",
      driverPhone: "+91 94433 22110",
      driverPhoto: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop",
      currentLocation: "1.2 km away — near ORR Flyover",
      distanceKm: 1.2,
      otp: "3742",
      weightKg: 0.4,
      estTime: "Today, 1:45 PM (In 20 mins)"
    },
    address: {
      recipient: "Umesh Dunnaboyina",
      phone: "+91 91234 56789",
      street: "Flat 402, Signature Elite Towers, Outer Ring Road",
      city: "Bengaluru",
      state: "Karnataka",
      postalCode: "560103",
      country: "India",
      instructions: "Direct delivery. Customer is expecting call."
    },
    items: [
      {
        id: "demo-prod-7",
        name: "Galaxy Watch Ultra",
        brand: "Samsung",
        color: "Titanium White",
        size: "47mm LTE",
        price: 42999,
        qty: 1,
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300",
        rating: 5
      }
    ],
    timeline: [
      { status: "PENDING", label: "Placed", timestamp: "3 July 2026", location: "Portal", detail: "Done.", completed: true },
      { status: "CONFIRMED", label: "Confirmed", timestamp: "3 July 2026", location: "Samsung Hub", detail: "Accepted.", completed: true },
      { status: "PACKED", label: "Packed", timestamp: "3 July 2026", location: "Samsung Warehouse", detail: "Consigned.", completed: true },
      { status: "SHIPPED", label: "Shipped", timestamp: "4 July 2026, 2:00 AM", location: "Bengaluru Airport cargo", detail: "Dispatched to local terminal.", completed: true },
      { status: "OUT_FOR_DELIVERY", label: "Out for Delivery", timestamp: "4 July 2026, 12:45 PM", location: "Marathahalli Local Delivery Hub", detail: "Package loaded with rider Srinivas Gowda.", completed: true },
      { status: "DELIVERED", label: "Delivered", timestamp: "--", location: "--", detail: "Awaiting handshake.", completed: false }
    ]
  }
];

// RECOMMENDED PRODUCTS FOR NEXUS CAROUSEL
const RECOMMENDATIONS = [
  { id: "rec-1", name: "Premium Cycling Helmet", brand: "Decathlon", price: 2499, originalPrice: 3499, rating: 4.8, image: "https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?w=200", ratingCount: 142 },
  { id: "rec-2", name: "Decathlon Gel Cycling Gloves", brand: "Decathlon", price: 799, originalPrice: 999, rating: 4.5, image: "https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?w=200", ratingCount: 88 },
  { id: "rec-3", name: "Aluminum Cycling Bottle Holder", brand: "Triban", price: 349, originalPrice: 499, rating: 4.6, image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=200", ratingCount: 298 },
  { id: "rec-4", name: "Heavy Duty Bike U-Lock", brand: "Kryptonite", price: 1199, originalPrice: 1999, rating: 4.7, image: "https://images.unsplash.com/photo-1551608910-b997cb6ffc9a?w=200&h=200&fit=crop", ratingCount: 420 },
  { id: "rec-5", name: "Insulated Sports Water Bottle", brand: "Decathlon", price: 699, originalPrice: 899, rating: 4.4, image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=200", ratingCount: 153 },
  { id: "rec-6", name: "Professional Cycling Carbon Shoes", brand: "Shimano", price: 6999, originalPrice: 8999, rating: 4.9, image: "https://images.unsplash.com/photo-1539185441755-769473a23570?w=200", ratingCount: 65 }
];

// FAQS LIST
const FAQS = [
  { q: "How can I return an item under warranty?", a: "To return an item under warranty, select the order card and go to 'Downloads' to grab your Warranty Slip. Then, click 'Return Product' and upload the warranty certificate along with images of the defect. We will schedule a verification visit within 48 hours." },
  { q: "What should I do if my payment failed but money was deducted?", a: "Don't worry! In most cases, banks reconcile failed gateway charges automatically within 24-48 hours. If the amount does not reflect back in your account, please share the transaction reference ID in our 'Live Chat' to initiate a manual refund." },
  { q: "How do I request a GST Invoice?", a: "Ensure your GSTIN details are input during checkout. The system will automatically embed the GST details into the PDF Invoice. You can click 'Download GST Invoice' at the bottom of the order details card to download it instantly." },
  { q: "Can I delay my shipment delivery date?", a: "Yes, once your status transitions to 'SHIPPED' or 'OUT_FOR_DELIVERY', click 'Contact Seller' or call support. We will ping the logistics provider (e.g. BlueDart) to hold your parcel for up to 3 days." }
];

export default function Orders() {
  const dispatch = useAppDispatch();
  const themeMode = useAppSelector((state) => state.theme.mode);
  const { user } = useAppSelector((state) => state.auth);

  // Active user's name
  const userName = user?.name || "Umesh";

  // Fetch real database orders
  const { data: dbData, isLoading: dbLoading } = useQuery({
    queryKey: ['myOrders'],
    queryFn: () => apiRequest('/orders/my-orders')
  });

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL_TIME');
  const [sortOption, setSortOption] = useState('NEWEST');
  
  // Custom Date range states
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Selected Order for side details panel
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  
  // Tab states inside Selected Details Panel ('tracking', 'price', 'merchant', 'support')
  const [detailsTab, setDetailsTab] = useState<'tracking' | 'price' | 'merchant' | 'support'>('tracking');

  // Interactive Live Chat state
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'bot'; text: string; time: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);

  // OTP show/hide state
  const [showOTP, setShowOTP] = useState(false);

  // Complaint modal states
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintText, setComplaintText] = useState('');
  const [complaintType, setComplaintType] = useState('DAMAGE');

  // Address edit modal states
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [tempAddress, setTempAddress] = useState<OrderAddress>({
    recipient: '', phone: '', street: '', city: '', state: '', postalCode: '', country: '', instructions: ''
  });

  // Spin Wheel gamification states
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinAngle, setSpinAngle] = useState(0);
  const [spinReward, setSpinReward] = useState<string | null>(null);
  const [rewardPointsXP, setRewardPointsXP] = useState(12580);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Confetti particles state
  const [confetti, setConfetti] = useState<{ id: number; x: number; y: number; color: string; size: number; rotation: number; speedY: number; speedX: number }[]>([]);

  // Download invoice animation progress
  const [downloadProgress, setDownloadProgress] = useState<{ [orderId: string]: number }>({});
  
  // Mobile drawer slide-up state
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Merge Database orders with High-Fidelity Demo orders
  const mergedOrders = useMemo(() => {
    const dbOrders = dbData?.orders || [];
    
    // Map dbOrders to our high fidelity DemoOrder structure
    const mappedDbOrders: DemoOrder[] = dbOrders.map((order: any) => {
      const parsedImages = JSON.parse(order.items?.[0]?.product?.images || '[]');
      
      const mappedItems: ProductItem[] = (order.items || []).map((item: any) => ({
        id: item.id,
        name: item.product?.name || "Product Item",
        brand: item.product?.brand || "Generic",
        color: item.selectedColor || "Default",
        size: item.selectedSize || "Standard",
        price: item.priceAtBuy,
        qty: item.quantity,
        image: JSON.parse(item.product?.images || '[]')[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200',
        rating: item.product?.ratings || 4.5
      }));

      const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric'
      });

      return {
        id: order.id,
        orderNumber: order.id.substring(0, 8),
        status: order.status,
        placedDate: dateStr,
        expectedDelivery: new Date(new Date(order.createdAt).getTime() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
          day: 'numeric', month: 'long', year: 'numeric'
        }),
        estimatedArrivalDays: 3,
        seller: {
          name: order.items?.[0]?.product?.seller?.companyName || "Nexus Verified Seller",
          logo: "🏬",
          rating: 4.5,
          gstVerified: true,
          storeSince: "2021",
          warrantyPolicy: "1 Year Merchant Warranty.",
          supportPolicy: "Support within 10 business days."
        },
        payment: {
          method: order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment',
          transactionId: order.payment?.transactionId || "TXN" + Math.floor(1000000 + Math.random() * 9000000),
          invoiceNumber: order.invoice?.invoiceNumber || "INV-DB-" + Math.floor(1000000 + Math.random() * 9000000),
          gstin: "27AAACN" + Math.floor(1000 + Math.random() * 9000) + "J1ZQ",
          status: order.payment?.status || "PENDING",
          pointsEarned: Math.floor(order.totalAmount / 100),
          subtotal: order.totalAmount,
          taxAmount: order.taxAmount || 0,
          shippingCost: order.shippingCost || 0,
          couponDiscount: order.discountAmount || 0,
          pointsDiscount: 0,
          walletUsed: 0,
          grandTotal: order.totalAmount
        },
        address: {
          recipient: userName,
          phone: "+91 98765 43210",
          street: "Customer Delivery Address Set in Account",
          city: "Bengaluru",
          state: "Karnataka",
          postalCode: "560001",
          country: "India",
          instructions: "Deliver with care."
        },
        items: mappedItems,
        timeline: [
          { status: "PENDING", label: "Placed", timestamp: dateStr, location: "System", detail: "Order added successfully", completed: true },
          { status: "CONFIRMED", label: "Confirmed", timestamp: order.status !== 'PENDING' ? dateStr : '--', location: "Seller System", detail: "Seller acknowledged", completed: order.status !== 'PENDING' },
          { status: "PACKED", label: "Packed", timestamp: ['PACKED', 'SHIPPED', 'DELIVERED'].includes(order.status) ? dateStr : '--', location: "Seller Center", detail: "Packed", completed: ['PACKED', 'SHIPPED', 'DELIVERED'].includes(order.status) },
          { status: "SHIPPED", label: "Shipped", timestamp: ['SHIPPED', 'DELIVERED'].includes(order.status) ? dateStr : '--', location: "Logistics", detail: "Dispatched", completed: ['SHIPPED', 'DELIVERED'].includes(order.status) },
          { status: "DELIVERED", label: "Delivered", timestamp: order.status === 'DELIVERED' ? dateStr : '--', location: "Home", detail: "Delivered", completed: order.status === 'DELIVERED' }
        ]
      };
    });

    // Merge both lists
    return [...mappedDbOrders, ...DEMO_ORDERS];
  }, [dbData, userName]);

  // Set default selected order on load
  useEffect(() => {
    if (mergedOrders.length > 0 && !selectedOrderId) {
      setSelectedOrderId(mergedOrders[0].id);
    }
  }, [mergedOrders, selectedOrderId]);

  // Find currently active order object
  const selectedOrder = mergedOrders.find(o => o.id === selectedOrderId) || mergedOrders[0];

  // Load chat logs on active order switch
  useEffect(() => {
    if (selectedOrder) {
      setChatMessages([
        { sender: 'bot', text: `Hi ${userName}! I see you are asking about your order #${selectedOrder.orderNumber}. How can I assist you with this shipment today?`, time: "Just now" }
      ]);
    }
  }, [selectedOrderId, userName]);

  // Download simulation
  const triggerDownloadInvoice = (orderId: string, isReal: boolean) => {
    // If it's a real database order, we download via backend endpoint
    if (isReal) {
      dispatch(addToast({ message: "Connecting to server to generate PDF...", type: "info" }));
      window.open(`http://localhost:5000/api/orders/${orderId}/invoice`, '_blank');
      return;
    }

    // Interactive custom loader for mockup orders
    if (downloadProgress[orderId] > 0) return;
    dispatch(addToast({ message: `Preparing Invoice PDF for #${selectedOrder.orderNumber}...`, type: 'info' }));
    
    setDownloadProgress(prev => ({ ...prev, [orderId]: 5 }));
    
    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        const current = prev[orderId];
        if (current >= 100) {
          clearInterval(interval);
          dispatch(addToast({ message: 'Receipt & Invoice downloaded successfully!', type: 'success' }));
          
          // Trigger file download mock
          const element = document.createElement("a");
          const file = new Blob([`NEXUS INDIA INVOICE\nOrder ID: ${orderId}\nInvoice Number: ${selectedOrder.payment.invoiceNumber}\nRecipient: ${selectedOrder.address.recipient}\nTotal Paid: ₹${selectedOrder.payment.grandTotal}\nSeller: ${selectedOrder.seller.name}`], {type: 'text/plain'});
          element.href = URL.createObjectURL(file);
          element.download = `Invoice-${selectedOrder.orderNumber}.txt`;
          document.body.appendChild(element);
          element.click();
          document.body.removeChild(element);
          
          return { ...prev, [orderId]: 0 };
        }
        return { ...prev, [orderId]: current + 20 };
      });
    }, 150);
  };

  // Live Chat input submit
  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg, time: "Just now" }]);
    setChatInput('');
    setIsBotTyping(true);

    // Simulate smart support replies
    setTimeout(() => {
      let replyText = "I will check this detail with our shipment team and reply shortly.";
      
      const lower = userMsg.toLowerCase();
      if (lower.includes('otp')) {
        replyText = `Your secure delivery verification OTP for BlueDart is **${selectedOrder.courier?.otp || '4819'}**. Please share it ONLY when the driver arrives at your doorstep.`;
      } else if (lower.includes('delivery') || lower.includes('when') || lower.includes('arrive')) {
        if (selectedOrder.status === 'DELIVERED') {
          replyText = "This order has already been marked as DELIVERED. If you haven't received it, please check with your neighbors or raise a complaint card.";
        } else {
          replyText = `Your delivery is currently at the stage: **${selectedOrder.status}**. The expected arrival is **${selectedOrder.expectedDelivery}** by courier **${selectedOrder.courier?.name || 'BlueDart'}**.`;
        }
      } else if (lower.includes('refund') || lower.includes('return')) {
        replyText = "Refunds are processed within 24-48 business hours after the returned item passes the quality check. The amount will be credited back to your original payment method.";
      } else if (lower.includes('cancel')) {
        if (['SHIPPED', 'DELIVERED'].includes(selectedOrder.status)) {
          replyText = "Since the package has already left the seller warehouse, it cannot be cancelled. You can refuse delivery when the driver arrives to trigger an automatic return and full refund.";
        } else {
          replyText = "You can cancel this order directly using the 'Cancel Order' action button in the details panel.";
        }
      } else if (lower.includes('hello') || lower.includes('hi')) {
        replyText = `Hi ${userName}! Happy to help you. Ask me about OTP, delivery dates, refunds, or cancellations!`;
      }

      setChatMessages(prev => [...prev, { sender: 'bot', text: replyText, time: "Just now" }]);
      setIsBotTyping(false);
    }, 1000);
  };

  // Complaint Submit
  const submitComplaint = () => {
    if (!complaintText.trim()) return;
    dispatch(addToast({ message: `Complaint ticket ticket-#${Math.floor(1000 + Math.random() * 9000)} generated successfully. We will follow up.`, type: 'success' }));
    setShowComplaintModal(false);
    setComplaintText('');
  };

  // Edit Address Save
  const saveEditedAddress = () => {
    if (!tempAddress.recipient || !tempAddress.phone || !tempAddress.street) {
      dispatch(addToast({ message: 'Please fill out recipient, phone, and street address.', type: 'warning' }));
      return;
    }
    // Update local state for demo purposes
    selectedOrder.address = { ...tempAddress };
    dispatch(addToast({ message: 'Delivery address updated successfully.', type: 'success' }));
    setShowAddressModal(false);
  };

  // open Address Modal with existing values
  const openAddressModal = () => {
    setTempAddress({ ...selectedOrder.address });
    setShowAddressModal(true);
  };

  // custom Confetti explosion generator
  const triggerConfetti = () => {
    const colors = ['#2563EB', '#16A34A', '#F59E0B', '#EF4444', '#EC4899', '#A855F7'];
    const particles = [];
    for (let i = 0; i < 70; i++) {
      particles.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -10,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 10 + 6,
        rotation: Math.random() * 360,
        speedY: Math.random() * 5 + 3,
        speedX: Math.random() * 4 - 2
      });
    }
    setConfetti(particles);

    // Animating
    let duration = 0;
    const interval = setInterval(() => {
      setConfetti(prev => 
        prev.map(p => ({
          ...p,
          y: p.y + p.speedY,
          x: p.x + p.speedX,
          rotation: p.rotation + 4
        })).filter(p => p.y < window.innerHeight)
      );
      duration += 30;
      if (duration > 3500) {
        clearInterval(interval);
        setConfetti([]);
      }
    }, 30);
  };

  // Spin Wheel implementation
  const handleSpinWheel = () => {
    if (isSpinning) return;
    if (rewardPointsXP < 500) {
      dispatch(addToast({ message: 'Insufficient Reward XP Points! Earn more points by shopping.', type: 'warning' }));
      return;
    }

    setIsSpinning(true);
    setRewardPointsXP(prev => prev - 500);

    const rewards = [
      "₹150 Cashback Voucher",
      "Free Express Shipping",
      "1,000 Bonus XP Points",
      "15% Off Nexus Fashion Coupon",
      "2x Referral Points Boost",
      "₹500 Gift Card",
      "3 Months Nexus Prime Trial",
      "Better Luck Next Time"
    ];

    const randomIdx = Math.floor(Math.random() * rewards.length);
    const newAngle = spinAngle + 1800 + (360 - (randomIdx * 45)) + (Math.random() * 20 - 10);
    setSpinAngle(newAngle);

    setTimeout(() => {
      setIsSpinning(false);
      const won = rewards[randomIdx];
      setSpinReward(won);
      
      // Update stats based on reward
      if (won.includes('1,000')) {
        setRewardPointsXP(prev => prev + 1000);
      }
      
      dispatch(addToast({ message: `Congratulations! You won: ${won}`, type: 'success' }));
      triggerConfetti();
    }, 4000);
  };

  // Add recommend to cart
  const handleAddRecToCart = (item: any) => {
    dispatch(addLocalItem({
      productId: item.id,
      quantity: 1,
      selectedSize: 'Standard',
      selectedColor: 'Default',
      product: {
        id: item.id,
        name: item.name,
        slug: `rec-${item.id}`,
        price: item.price,
        images: JSON.stringify([item.image])
      }
    }));
    dispatch(addToast({ message: `${item.name} added to cart!`, type: 'success' }));
  };

  // Apply filters & Search
  const filteredOrders = mergedOrders.filter(order => {
    // 1. Search Query filter (matches order ID, product name, brand, seller)
    const query = searchQuery.toLowerCase().trim();
    if (query) {
      const matchNumber = order.orderNumber.toLowerCase().includes(query) || order.id.toLowerCase().includes(query);
      const matchSeller = order.seller.name.toLowerCase().includes(query);
      const matchProducts = order.items.some(item => 
        item.name.toLowerCase().includes(query) || item.brand.toLowerCase().includes(query)
      );
      if (!matchNumber && !matchSeller && !matchProducts) return false;
    }

    // 2. Status Badge Filter
    if (statusFilter !== 'ALL') {
      if (order.status !== statusFilter) return false;
    }

    // 3. Date filter
    if (dateFilter !== 'ALL_TIME') {
      const orderDate = new Date(order.placedDate);
      const now = new Date();
      if (dateFilter === 'TODAY') {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (orderDate < today) return false;
      } else if (dateFilter === 'THIS_WEEK') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (orderDate < weekAgo) return false;
      } else if (dateFilter === 'THIS_MONTH') {
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        if (orderDate < monthAgo) return false;
      } else if (dateFilter === 'LAST_6_MONTHS') {
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        if (orderDate < sixMonthsAgo) return false;
      } else if (dateFilter === 'CUSTOM') {
        if (customStartDate) {
          const start = new Date(customStartDate);
          if (orderDate < start) return false;
        }
        if (customEndDate) {
          const end = new Date(customEndDate);
          // Include full end day
          end.setHours(23, 59, 59, 999);
          if (orderDate > end) return false;
        }
      }
    }

    return true;
  });

  // Apply sorting
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const dateA = new Date(a.placedDate).getTime();
    const dateB = new Date(b.placedDate).getTime();

    if (sortOption === 'NEWEST') return dateB - dateA;
    if (sortOption === 'OLDEST') return dateA - dateB;
    if (sortOption === 'HIGHEST_AMOUNT') return b.payment.grandTotal - a.payment.grandTotal;
    if (sortOption === 'LOWEST_AMOUNT') return a.payment.grandTotal - b.payment.grandTotal;
    
    // Default fallback
    return dateB - dateA;
  });

  // Skeletons during loading
  if (dbLoading) {
    return (
      <div className="py-6 flex flex-col gap-6 max-w-7xl mx-auto w-full animate-pulse">
        <div className="h-16 bg-slate-900 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-24 bg-slate-900 rounded-xl" />
          <div className="h-24 bg-slate-900 rounded-xl" />
          <div className="h-24 bg-slate-900 rounded-xl" />
          <div className="h-24 bg-slate-900 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-900 rounded-2xl" />
          <div className="h-96 bg-slate-900 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 flex flex-col gap-8 max-w-7xl mx-auto w-full relative">
      
      {/* Visual Confetti Rain (Overlay) */}
      {confetti.map(p => (
        <div
          key={p.id}
          className="fixed pointer-events-none z-[9999]"
          style={{
            left: `${p.x}px`,
            top: `${p.y}px`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            transform: `rotate(${p.rotation}deg)`,
            borderRadius: p.id % 2 === 0 ? '50%' : '2px',
            opacity: 0.85,
            transition: 'top 0.03s linear, left 0.03s linear'
          }}
        />
      ))}

      {/* -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
          1. WELCOME HERO SECTION
          ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */}
      <div className="relative overflow-hidden rounded-3xl border border-[var(--border-color)] bg-gradient-to-br from-indigo-950/40 via-slate-950/60 to-purple-950/30 p-8 md:p-10 backdrop-blur-md shadow-2xl transition-all duration-300">
        
        {/* Parallax elements */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -z-10 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -z-10" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-semibold">
              <Award className="w-3.5 h-3.5" />
              <span>Nexus Prime Member</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight tracking-tight">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">{userName}</span> 👋
            </h1>
            <p className="text-sm text-slate-405 max-w-xl">
              Track your purchases, invoices, returns and shipments from one place.
            </p>
          </div>

          {/* User Fast Card Info */}
          <div className="flex items-center gap-4 bg-slate-900/60 border border-slate-800 p-4.5 rounded-2xl max-w-sm backdrop-blur">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-lg shadow-lg">
              {userName.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-bold text-slate-300 truncate">{userName}</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">d.umesh@nexusindia.com</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">GST Verified</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold">12,580 XP</span>
              </div>
            </div>
          </div>
        </div>

        {/* -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
            2. QUICK STATS CARDS
            ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 mt-8 pt-8 border-t border-slate-800/80">
          {[
            { label: "Total Orders", val: "18", color: "text-indigo-400", sub: "All purchases" },
            { label: "Total Spending", val: "₹2,48,950", color: "text-white font-bold", sub: "Annual spend" },
            { label: "Pending Orders", val: "2", color: "text-amber-550", sub: "In transit/prep" },
            { label: "Delivered", val: "15", color: "text-emerald-405", sub: "Received items" },
            { label: "Returns", val: "1", color: "text-rose-405", sub: "Refund completed" },
            { label: "Wishlist", val: "34 Items", color: "text-pink-400", sub: "Saved for later" },
            { label: "Reward Points", val: "12,580 XP", color: "text-purple-400", sub: "Level 4 Collector" },
            { label: "Membership", val: "Nexus Prime", color: "text-yellow-500", sub: "Expires Aug 2027" }
          ].map((stat, idx) => (
            <div key={idx} className="bg-slate-950/40 hover:bg-slate-900/60 border border-slate-900 hover:border-slate-800/80 p-3.5 rounded-2xl flex flex-col justify-between transition-all duration-300 hover:-translate-y-0.5 shadow-sm group">
              <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-400 transition-colors uppercase tracking-wide">{stat.label}</span>
              <div className="my-1.5">
                <span className={`text-sm md:text-base font-extrabold tracking-tight ${stat.color}`}>{stat.val}</span>
              </div>
              <span className="text-[9px] text-slate-650 group-hover:text-slate-500 transition-colors leading-tight">{stat.sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
          3. SEARCH & FILTERS PANEL (STICKY ON SCROLL)
          ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */}
      <div className="sticky top-16 z-30 p-4.5 bg-slate-950/80 backdrop-blur-xl border border-[var(--border-color)] rounded-2xl shadow-xl flex flex-col gap-4">
        
        {/* Search row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-xl">
            <input
              type="text"
              placeholder="Search products, brands, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/40 py-2.5 pl-10 pr-4 text-xs text-slate-300 placeholder-slate-500 focus:border-indigo-500/80 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all shadow-inner"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-3 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Select dropdowns */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Date range filter */}
            <div className="relative">
              <select
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setShowCustomDate(e.target.value === 'CUSTOM');
                }}
                className="appearance-none bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 pr-8 text-xs text-slate-350 font-bold hover:border-indigo-500/50 cursor-pointer focus:outline-none"
              >
                <option value="ALL_TIME">📅 All History</option>
                <option value="TODAY">Today</option>
                <option value="THIS_WEEK">This Week</option>
                <option value="THIS_MONTH">This Month</option>
                <option value="LAST_6_MONTHS">Last 6 Months</option>
                <option value="CUSTOM">Custom Range...</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-3 pointer-events-none" />
            </div>

            {/* Sort options */}
            <div className="relative">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="appearance-none bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 pr-8 text-xs text-slate-355 font-bold hover:border-indigo-500/50 cursor-pointer focus:outline-none"
              >
                <option value="NEWEST">⏳ Sort: Newest</option>
                <option value="OLDEST">Sort: Oldest</option>
                <option value="HIGHEST_AMOUNT">Sort: Highest Cost</option>
                <option value="LOWEST_AMOUNT">Sort: Lowest Cost</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-3 pointer-events-none" />
            </div>

            <button 
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setDateFilter('ALL_TIME');
                setSortOption('NEWEST');
                setShowCustomDate(false);
                dispatch(addToast({ message: 'Filters cleared', type: 'info' }));
              }}
              className="text-xs text-slate-500 hover:text-indigo-400 transition-colors font-bold px-2.5 py-1"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Custom date range modal / section */}
        {showCustomDate && (
          <div className="flex items-center gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800 animate-slide-up max-w-md">
            <span className="text-[10px] text-slate-500 uppercase font-extrabold">From:</span>
            <input 
              type="date" 
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg p-1 text-[10px] text-white focus:outline-none"
            />
            <span className="text-[10px] text-slate-500 uppercase font-extrabold">To:</span>
            <input 
              type="date" 
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg p-1 text-[10px] text-white focus:outline-none"
            />
            <button 
              onClick={() => setShowCustomDate(false)}
              className="ml-auto p-1 text-slate-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Status Pills Horizontal Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mr-2 flex-shrink-0 flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3" /> Status:
          </span>
          {[
            { code: 'ALL', label: 'All Orders' },
            { code: 'PENDING', label: 'Pending' },
            { code: 'CONFIRMED', label: 'Confirmed' },
            { code: 'PACKED', label: 'Packed' },
            { code: 'SHIPPED', label: 'Shipped' },
            { code: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
            { code: 'DELIVERED', label: 'Delivered' },
            { code: 'CANCELLED', label: 'Cancelled' },
            { code: 'RETURNED', label: 'Returned' },
            { code: 'REFUNDED', label: 'Refunded' }
          ].map(pill => (
            <button
              key={pill.code}
              onClick={() => {
                setStatusFilter(pill.code);
                dispatch(addToast({ message: `Viewing ${pill.label} orders`, type: 'info' }));
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer flex-shrink-0 border ${
                statusFilter === pill.code 
                  ? 'bg-indigo-605 border-indigo-500 text-white shadow-lg' 
                  : 'bg-slate-900/60 border-slate-850 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
          4. MAIN CONTENT PANEL: SPLIT GRID DESIGN
          ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* ========================================== LEFT COLUMN: ORDERS LIST ========================================== */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-indigo-400" />
              <span>Purchases ({sortedOrders.length})</span>
            </h2>
            <span className="text-xs text-slate-500">Showing {sortedOrders.length} matching order cards</span>
          </div>

          {sortedOrders.length === 0 ? (
            /* Premium Empty State */
            <div className="text-center py-16 border border-slate-800 border-dashed rounded-3xl bg-slate-950/20 flex flex-col items-center p-6 animate-slide-up">
              <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center mb-4">
                <ShoppingBag className="w-8 h-8 text-slate-650 animate-bounce" />
              </div>
              <h3 className="text-base font-bold text-slate-300">No Orders Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                We couldn't find any orders matching "{searchQuery}" with the selected filters. Change filters or browse new items.
              </p>
              <div className="flex gap-4 mt-6">
                <Link to="/search" className="rounded-full bg-indigo-650 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 shadow-lg transition-all active:scale-95">
                  Browse Products
                </Link>
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                    setDateFilter('ALL_TIME');
                    setShowCustomDate(false);
                  }}
                  className="rounded-full border border-slate-800 bg-slate-900/40 px-5 py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition-all"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {sortedOrders.map((order) => {
                const isSelected = selectedOrderId === order.id;
                
                // Color mapping for status badges
                const statusStyles: { [key: string]: string } = {
                  PENDING: 'bg-slate-900 border-slate-800 text-slate-450',
                  CONFIRMED: 'bg-emerald-950/30 border-emerald-500/20 text-emerald-450 font-semibold',
                  PACKED: 'bg-amber-950/30 border-amber-500/20 text-amber-450',
                  SHIPPED: 'bg-blue-950/30 border-blue-500/20 text-blue-450',
                  OUT_FOR_DELIVERY: 'bg-purple-950/30 border-purple-500/20 text-purple-400 font-semibold',
                  DELIVERED: 'bg-green-950/30 border-green-500/20 text-green-455',
                  CANCELLED: 'bg-rose-950/30 border-rose-500/20 text-rose-450',
                  RETURNED: 'bg-indigo-950/30 border-indigo-500/20 text-indigo-400',
                  REFUNDED: 'bg-cyan-950/30 border-cyan-500/20 text-cyan-400'
                };

                return (
                  <div
                    key={order.id}
                    onClick={() => {
                      setSelectedOrderId(order.id);
                      if (window.innerWidth < 1024) {
                        setIsMobileDrawerOpen(true);
                      }
                    }}
                    className={`glass-panel rounded-3xl p-5.5 cursor-pointer relative overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl flex flex-col gap-4 border ${
                      isSelected 
                        ? 'border-indigo-500/40 bg-indigo-950/5 shadow-lg translate-x-1' 
                        : 'border-[var(--border-color)] hover:border-slate-800'
                    }`}
                  >
                    {/* Top Order Card Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-850/80">
                      <div className="flex items-center gap-3">
                        <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                          <ShoppingBag className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-400 uppercase tracking-wide">Order Number</span>
                            <span className="font-extrabold text-xs text-white">#{order.orderNumber}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">Placed Date: {order.placedDate}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${statusStyles[order.status] || 'bg-slate-900'}`}>
                          {order.status}
                        </span>
                        
                        {/* Countdown Indicator */}
                        {['PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY'].includes(order.status) && (
                          <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-extrabold px-2.5 py-1 rounded-full border border-indigo-500/20">
                            ⏱️ {order.estimatedArrivalDays} Days Left
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Products Row inside Card */}
                    <div className="flex flex-col gap-3.5">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex gap-4 items-center justify-between group">
                          <div className="flex gap-4.5 items-center min-w-0">
                            <div className="h-16 w-16 rounded-2xl bg-slate-950 border border-slate-900 overflow-hidden flex-shrink-0 shadow-inner relative">
                              <img 
                                src={item.image} 
                                alt={item.name} 
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                              />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-xs text-white group-hover:text-indigo-400 transition-colors line-clamp-1">{item.name}</h3>
                              <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                                Brand: <span className="text-slate-400">{item.brand}</span> 
                                {item.size && ` • Size: ${item.size}`} 
                                {item.color && ` • Color: ${item.color}`}
                              </p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[10px] font-bold text-slate-350">Qty: {item.qty}</span>
                                {item.rating && (
                                  <span className="flex items-center text-yellow-500 text-[10px] font-extrabold gap-0.5">
                                    <Star className="w-2.5 h-2.5 fill-current" /> {item.rating}.0
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <span className="font-extrabold text-xs text-white">₹{item.price.toLocaleString('en-IN')}</span>
                            {item.originalPrice && (
                              <p className="text-[10px] text-slate-500 line-through mt-0.5">₹{item.originalPrice.toLocaleString('en-IN')}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer Row inside Card */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-slate-850/80 text-[10px] text-slate-400">
                      <div>
                        Seller: <span className="font-bold text-slate-300">{order.seller.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span>Total Paid: <span className="font-extrabold text-xs text-white">₹{order.payment.grandTotal.toLocaleString('en-IN')}</span></span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-650 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
              REWARDS SECTION & SPIN WHEEL GAMIFICATION WIDGET
              ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800 bg-gradient-to-br from-slate-900/60 to-purple-950/20 backdrop-blur shadow-xl mt-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Gift className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Nexus Rewards Hub</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Spin the luxury wheel to unlock cashbacks, coupons or bonus XP points!</p>
              </div>
              <div className="ml-auto bg-purple-500/15 border border-purple-500/30 rounded-xl px-3 py-1 text-xs text-purple-300 font-bold flex items-center gap-1 shadow-inner">
                🌟 {rewardPointsXP.toLocaleString()} XP
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-around gap-8">
              
              {/* The Spin Wheel Widget Visual */}
              <div className="relative flex-shrink-0">
                {/* Pointer Indicator Needle */}
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-purple-400 z-20 drop-shadow-lg" />
                
                {/* Outer Rim */}
                <div className="w-48 h-48 md:w-56 md:h-56 rounded-full border-4 border-slate-800 bg-slate-950 relative overflow-hidden shadow-2xl flex items-center justify-center transition-transform duration-[4000ms] ease-out"
                     style={{ transform: `rotate(${spinAngle}deg)`, transitionTimingFunction: 'cubic-bezier(0.1, 0.8, 0.1, 1)' }}>
                  
                  {/* Wheel segments */}
                  {[
                    { label: "₹150 Back", color: "bg-indigo-950/60 text-indigo-400" },
                    { label: "Free Shp", color: "bg-slate-900 text-slate-400" },
                    { label: "+1000 XP", color: "bg-purple-950/70 text-purple-400" },
                    { label: "15% Off", color: "bg-slate-900 text-slate-405" },
                    { label: "2x Boost", color: "bg-indigo-950/60 text-indigo-400" },
                    { label: "₹500 Card", color: "bg-slate-900 text-slate-405" },
                    { label: "Prime", color: "bg-purple-950/70 text-purple-400" },
                    { label: "Try Again", color: "bg-slate-900 text-slate-500" }
                  ].map((seg, idx) => (
                    <div
                      key={idx}
                      className={`absolute w-full h-full origin-center flex items-start justify-center pt-2 text-[8px] md:text-[9px] font-extrabold uppercase border-r border-slate-800/20 ${seg.color}`}
                      style={{ transform: `rotate(${idx * 45}deg)` }}
                    >
                      <span className="rotate-0 pt-1.5">{seg.label}</span>
                    </div>
                  ))}
                  
                  {/* Center Circle Pin */}
                  <div className="w-10 h-10 rounded-full bg-slate-900 border-2 border-slate-750 flex items-center justify-center text-[10px] font-extrabold text-white z-10 shadow-lg">
                    NEX
                  </div>
                </div>
              </div>

              {/* Action and description column */}
              <div className="flex-1 max-w-sm space-y-4 text-center md:text-left">
                <h4 className="text-sm font-bold text-slate-200">Win Nexus Premium Perks</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  Redeem <strong className="text-purple-400">500 XP Points</strong> to spin the lucky segment wheel. Prizes are deposited directly to your loyalty wallet.
                </p>

                {spinReward && (
                  <div className="bg-indigo-500/10 border border-indigo-500/30 p-3 rounded-xl flex items-center gap-2.5 animate-slide-up text-left">
                    <span className="text-lg">🎉</span>
                    <div>
                      <p className="text-[10px] text-indigo-400 font-extrabold uppercase">You Won</p>
                      <h5 className="text-xs font-bold text-white">{spinReward}</h5>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={handleSpinWheel}
                    disabled={isSpinning || rewardPointsXP < 500}
                    className="w-full rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs py-3 px-5 transition-all shadow-lg shadow-purple-650/20 active:scale-[0.97] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    {isSpinning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    <span>{isSpinning ? 'Spinning...' : 'Spin for 500 XP'}</span>
                  </button>
                  
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">
                    Cost: 500 XP
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
              5. RECOMMENDED PRODUCTS HORIZONTAL CAROUSEL
              ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */}
          <div className="space-y-4 mt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4.5 h-4.5 text-indigo-400" />
                <span>Customers Also Bought</span>
              </h3>
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => {
                    const el = document.getElementById('rec-carousel-container');
                    if (el) el.scrollBy({ left: -220, behavior: 'smooth' });
                  }}
                  className="w-7 h-7 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => {
                    const el = document.getElementById('rec-carousel-container');
                    if (el) el.scrollBy({ left: 220, behavior: 'smooth' });
                  }}
                  className="w-7 h-7 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div 
              id="rec-carousel-container" 
              className="flex gap-4 overflow-x-auto pb-3 scrollbar-none snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none' }}
            >
              {RECOMMENDATIONS.map(item => (
                <div 
                  key={item.id} 
                  className="w-48 bg-slate-900/50 border border-slate-850 p-3.5 rounded-2xl flex-shrink-0 snap-start hover:border-slate-800 hover:bg-slate-900 transition-all duration-305 group flex flex-col justify-between"
                >
                  <div className="h-28 w-full rounded-xl bg-slate-950 overflow-hidden border border-slate-900 relative">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="mt-3 flex-grow flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] text-indigo-400 font-extrabold uppercase">{item.brand}</span>
                      <h4 className="text-xs font-bold text-slate-200 line-clamp-1 group-hover:text-indigo-400 transition-colors mt-0.5">{item.name}</h4>
                      <div className="flex items-center gap-1 mt-1.5">
                        <div className="flex items-center text-yellow-500 gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          <span className="text-[10px] font-extrabold">{item.rating}</span>
                        </div>
                        <span className="text-[9px] text-slate-500">({item.ratingCount})</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <span className="font-extrabold text-xs text-white">₹{item.price.toLocaleString('en-IN')}</span>
                        <p className="text-[8px] text-slate-500 line-through">₹{item.originalPrice.toLocaleString('en-IN')}</p>
                      </div>

                      <button
                        onClick={() => handleAddRecToCart(item)}
                        className="rounded-lg bg-indigo-650/10 hover:bg-indigo-600 border border-indigo-500/20 text-indigo-400 hover:text-white p-1.5 transition-all cursor-pointer"
                        title="Add to Cart"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========================================== RIGHT COLUMN: SELECTED DETAILS PANEL (DESKTOP) ========================================== */}
        <div className="hidden lg:block">
          <DetailsPanelContent 
            selectedOrder={selectedOrder} 
            detailsTab={detailsTab}
            setDetailsTab={setDetailsTab}
            triggerDownloadInvoice={triggerDownloadInvoice}
            downloadProgress={downloadProgress}
            chatMessages={chatMessages}
            chatInput={chatInput}
            setChatInput={setChatInput}
            isBotTyping={isBotTyping}
            handleChatSubmit={handleChatSubmit}
            showOTP={showOTP}
            setShowOTP={setShowOTP}
            openAddressModal={openAddressModal}
            setShowComplaintModal={setShowComplaintModal}
            activeFaq={activeFaq}
            setActiveFaq={setActiveFaq}
            dispatch={dispatch}
            triggerConfetti={triggerConfetti}
          />
        </div>
      </div>

      {/* ========================================== MOBILE DRAWER DIALOG FOR DETAILS VIEW ========================================== */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex items-end justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-h-[85vh] overflow-y-auto bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5 shadow-2xl flex flex-col gap-4 animate-slide-up relative">
            <button
              onClick={() => setIsMobileDrawerOpen(false)}
              className="absolute right-4 top-4 p-2 rounded-full bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="pr-12">
              <h3 className="font-extrabold text-base text-white">Order Details</h3>
              <p className="text-[10px] text-slate-505">#{selectedOrder.orderNumber}</p>
            </div>
            
            <DetailsPanelContent 
              selectedOrder={selectedOrder} 
              detailsTab={detailsTab}
              setDetailsTab={setDetailsTab}
              triggerDownloadInvoice={triggerDownloadInvoice}
              downloadProgress={downloadProgress}
              chatMessages={chatMessages}
              chatInput={chatInput}
              setChatInput={setChatInput}
              isBotTyping={isBotTyping}
              handleChatSubmit={handleChatSubmit}
              showOTP={showOTP}
              setShowOTP={setShowOTP}
              openAddressModal={openAddressModal}
              setShowComplaintModal={setShowComplaintModal}
              activeFaq={activeFaq}
              setActiveFaq={setActiveFaq}
              dispatch={dispatch}
              triggerConfetti={triggerConfetti}
            />
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
          6. MODALS: EDIT ADDRESS & COMPLAINT FORM
          ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-4 animate-slide-up">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-sm text-white uppercase tracking-wide">Edit Delivery Address</h3>
              <button onClick={() => setShowAddressModal(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-bold">Recipient Name</label>
                  <input
                    type="text"
                    value={tempAddress.recipient}
                    onChange={(e) => setTempAddress({ ...tempAddress, recipient: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-bold">Contact Phone</label>
                  <input
                    type="text"
                    value={tempAddress.phone}
                    onChange={(e) => setTempAddress({ ...tempAddress, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase font-bold">Street Address / Flat</label>
                <input
                  type="text"
                  value={tempAddress.street}
                  onChange={(e) => setTempAddress({ ...tempAddress, street: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-bold">City</label>
                  <input
                    type="text"
                    value={tempAddress.city}
                    onChange={(e) => setTempAddress({ ...tempAddress, city: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-bold">State</label>
                  <input
                    type="text"
                    value={tempAddress.state}
                    onChange={(e) => setTempAddress({ ...tempAddress, state: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-bold">Postal Code</label>
                  <input
                    type="text"
                    value={tempAddress.postalCode}
                    onChange={(e) => setTempAddress({ ...tempAddress, postalCode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase font-bold">Delivery Instructions</label>
                <textarea
                  rows={2}
                  value={tempAddress.instructions}
                  onChange={(e) => setTempAddress({ ...tempAddress, instructions: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white outline-none focus:border-indigo-500 text-xs"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-3 border-t border-slate-800">
              <button 
                onClick={() => setShowAddressModal(false)}
                className="rounded-xl border border-slate-800 px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button 
                onClick={saveEditedAddress}
                className="rounded-xl bg-indigo-650 hover:bg-indigo-500 px-4 py-2 text-xs text-white font-bold"
              >
                Save Address
              </button>
            </div>
          </div>
        </div>
      )}

      {showComplaintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-4 animate-slide-up">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-sm text-white uppercase tracking-wide flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                <span>Raise Customer Complaint</span>
              </h3>
              <button onClick={() => setShowComplaintModal(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-300 font-medium">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase font-bold">Issue Category</label>
                <select
                  value={complaintType}
                  onChange={(e) => setComplaintType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white outline-none"
                >
                  <option value="DAMAGE">Damaged or Bent Item Received</option>
                  <option value="MISSING">Missing Items in Package</option>
                  <option value="DELAY">Severe Delivery Delay</option>
                  <option value="PAYMENT">Double Transaction Charges</option>
                  <option value="INCORRECT">Wrong Color/Size Shipped</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase font-bold">Describe Your Issue</label>
                <textarea
                  rows={4}
                  placeholder="Tell us details about the issue. Our support managers review tickets hourly..."
                  value={complaintText}
                  onChange={(e) => setComplaintText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white outline-none focus:border-indigo-500 text-xs"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-3 border-t border-slate-800">
              <button 
                onClick={() => setShowComplaintModal(false)}
                className="rounded-xl border border-slate-800 px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button 
                onClick={submitComplaint}
                className="rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2 text-xs text-white font-bold shadow-lg shadow-rose-600/10"
              >
                File Complaint Ticket
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// SUB-COMPONENT: CONTEXTUAL DETAILS PANEL CONTENT
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function DetailsPanelContent({
  selectedOrder,
  detailsTab,
  setDetailsTab,
  triggerDownloadInvoice,
  downloadProgress,
  chatMessages,
  chatInput,
  setChatInput,
  isBotTyping,
  handleChatSubmit,
  showOTP,
  setShowOTP,
  openAddressModal,
  setShowComplaintModal,
  activeFaq,
  setActiveFaq,
  dispatch,
  triggerConfetti
}: {
  selectedOrder: DemoOrder;
  detailsTab: 'tracking' | 'price' | 'merchant' | 'support';
  setDetailsTab: React.Dispatch<React.SetStateAction<'tracking' | 'price' | 'merchant' | 'support'>>;
  triggerDownloadInvoice: (orderId: string, isReal: boolean) => void;
  downloadProgress: { [orderId: string]: number };
  chatMessages: { sender: 'user' | 'bot'; text: string; time: string }[];
  chatInput: string;
  setChatInput: React.Dispatch<React.SetStateAction<string>>;
  isBotTyping: boolean;
  handleChatSubmit: (e: React.FormEvent) => void;
  showOTP: boolean;
  setShowOTP: React.Dispatch<React.SetStateAction<boolean>>;
  openAddressModal: () => void;
  setShowComplaintModal: React.Dispatch<React.SetStateAction<boolean>>;
  activeFaq: number | null;
  setActiveFaq: React.Dispatch<React.SetStateAction<number | null>>;
  dispatch: any;
  triggerConfetti: () => void;
}) {
  const isRealDatabaseOrder = selectedOrder.id.startsWith('demo-') === false;

  return (
    <div className="glass-panel rounded-3xl p-5 border border-slate-800/80 bg-slate-950/40 backdrop-blur shadow-2xl flex flex-col gap-5 sticky top-24">
      
      {/* Selection Summary */}
      <div className="flex justify-between items-center border-b border-slate-850 pb-3">
        <div>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold">Active View</span>
          <h3 className="font-extrabold text-sm text-white">Order #{selectedOrder.orderNumber}</h3>
        </div>
        
        {selectedOrder.status === 'DELIVERED' && (
          <button 
            onClick={triggerConfetti}
            className="text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full font-bold cursor-pointer transition-all active:scale-95 animate-pulse"
          >
            Celebrate Delivery 🎉
          </button>
        )}
      </div>

      {/* Details Tabs Header */}
      <div className="grid grid-cols-4 bg-slate-900/60 p-1 rounded-xl border border-slate-850 text-[10px] font-bold">
        {[
          { code: 'tracking', label: 'Tracking' },
          { code: 'price', label: 'Invoices' },
          { code: 'merchant', label: 'Merchant' },
          { code: 'support', label: 'Help' }
        ].map(t => (
          <button
            key={t.code}
            onClick={() => setDetailsTab(t.code as any)}
            className={`py-2 rounded-lg text-center cursor-pointer transition-all ${
              detailsTab === t.code 
                ? 'bg-slate-950 text-white shadow shadow-indigo-500/10' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ========================================== DETAILS TAB 1: TRACKING & MAP ========================================== */}
      {detailsTab === 'tracking' && (
        <div className="space-y-5 animate-slide-up">
          
          {/* Animated Vertical Timeline */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tracking Timeline</h4>
            <div className="relative pl-6 space-y-5 border-l-2 border-slate-900 ml-3.5">
              
              {selectedOrder.timeline.map((step, idx) => {
                const active = step.completed;
                const isCurrent = step.status === selectedOrder.status || (selectedOrder.status === 'OUT_FOR_DELIVERY' && step.status === 'OUT_FOR_DELIVERY') || (selectedOrder.status === 'DELIVERED' && idx === selectedOrder.timeline.length - 1);
                
                return (
                  <div key={idx} className="relative group">
                    {/* Circle Node */}
                    <div className={`absolute -left-[33px] top-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all z-10 ${
                      isCurrent 
                        ? 'bg-indigo-600 border-indigo-500 text-white animate-pulse shadow-lg ring-4 ring-indigo-500/20' 
                        : active 
                          ? 'bg-emerald-600 border-emerald-500 text-white' 
                          : 'bg-slate-950 border-slate-800 text-slate-650'
                    }`}>
                      {active ? '✓' : idx + 1}
                    </div>
                    
                    <div className="space-y-0.5">
                      <span className={`text-xs font-bold ${active ? 'text-slate-200' : 'text-slate-500'}`}>
                        {step.label}
                      </span>
                      <p className={`text-[10px] leading-relaxed ${active ? 'text-slate-400' : 'text-slate-600'}`}>
                        {step.detail}
                      </p>
                      {step.timestamp !== '--' && (
                        <div className="flex gap-2 text-[9px] text-slate-500 pt-0.5 font-medium">
                          <span>📍 {step.location}</span>
                          <span>•</span>
                          <span>🕒 {step.timestamp}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Delivery SVG Routing Map with Animated Truck */}
          {selectedOrder.courier && (
            <div className="bg-slate-900/60 p-4.5 rounded-2xl border border-slate-850">
              <div className="flex items-center justify-between mb-3 text-[10px] text-slate-500 font-extrabold uppercase tracking-wide">
                <span>Real-Time Route Map</span>
                <span className="text-emerald-450 animate-pulse">● Live Tracking</span>
              </div>
              
              {/* SVG Map Path */}
              <div className="relative h-20 bg-slate-950 rounded-xl overflow-hidden border border-slate-900 p-2.5 flex flex-col justify-end">
                {/* Dotted Connection line */}
                <div className="absolute top-1/2 left-6 right-6 h-0.5 border-t border-dashed border-slate-800 -translate-y-1/2" />
                
                {/* Truck Progression Line */}
                <div className="absolute top-1/2 left-6 h-0.5 bg-gradient-to-r from-indigo-500 to-indigo-600 -translate-y-1/2 transition-all duration-1000"
                     style={{
                       width: selectedOrder.status === 'DELIVERED' ? 'calc(100% - 48px)' :
                              selectedOrder.status === 'OUT_FOR_DELIVERY' ? 'calc(80% - 24px)' :
                              selectedOrder.status === 'SHIPPED' ? '50%' :
                              selectedOrder.status === 'PACKED' ? '25%' : '8px'
                     }}
                />

                {/* Nodes */}
                <div className="flex justify-between items-center w-full px-2 relative z-10 top-[-10px]">
                  {[
                    { label: "Wrhse", active: true },
                    { label: "Sort", active: ['PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(selectedOrder.status) },
                    { label: "Hub", active: ['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(selectedOrder.status) },
                    { label: "Deliv", active: ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(selectedOrder.status) },
                    { label: "Home", active: selectedOrder.status === 'DELIVERED' }
                  ].map((node, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${
                        node.active 
                          ? 'bg-indigo-600 border-indigo-500 text-white' 
                          : 'bg-slate-900 border-slate-800 text-slate-700'
                      }`}>
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                      <span className={`text-[8px] font-bold ${node.active ? 'text-slate-400' : 'text-slate-650'}`}>{node.label}</span>
                    </div>
                  ))}
                </div>

                {/* Driving Truck Icon */}
                <div className="absolute top-1/2 -translate-y-[15px] z-20 transition-all duration-1000 ease-out animate-bounce"
                     style={{
                       left: selectedOrder.status === 'DELIVERED' ? 'calc(100% - 46px)' :
                             selectedOrder.status === 'OUT_FOR_DELIVERY' ? 'calc(80% - 30px)' :
                             selectedOrder.status === 'SHIPPED' ? '50%' :
                             selectedOrder.status === 'PACKED' ? '25%' : '12px'
                     }}>
                  <Truck className="w-5 h-5 text-indigo-400 bg-slate-950 p-0.5 rounded-full border border-indigo-500 shadow-md shadow-indigo-500/20" />
                </div>
              </div>

              {/* View Map Action */}
              <a
                href="https://maps.google.com"
                target="_blank"
                rel="noreferrer"
                className="mt-3.5 w-full rounded-xl bg-slate-950 border border-slate-850 hover:bg-slate-900 text-[10px] font-extrabold text-indigo-450 text-center py-2.5 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5" /> View on Google Maps
              </a>
            </div>
          )}

          {/* Courier Card Details */}
          {selectedOrder.courier && (
            <div className="bg-slate-900/60 p-4.5 rounded-2xl border border-slate-850 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-900 flex items-center justify-center text-lg shadow-inner">
                  🚚
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{selectedOrder.courier.name}</h4>
                  <p className="text-[9px] text-slate-500 mt-0.5 font-bold">Tracking Number: {selectedOrder.courier.trackingNumber}</p>
                </div>
                <div className="ml-auto bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1 text-right">
                  <span className="text-[8px] text-slate-500 block uppercase font-bold">Weight</span>
                  <span className="text-[10px] text-slate-300 font-bold">{selectedOrder.courier.weightKg} kg</span>
                </div>
              </div>

              {/* Driver and Distance row */}
              <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-850 py-3.5">
                <div className="flex items-center gap-2.5">
                  <img 
                    src={selectedOrder.courier.driverPhoto} 
                    alt={selectedOrder.courier.driverName} 
                    className="w-8 h-8 rounded-full object-cover border border-slate-800 shadow"
                  />
                  <div>
                    <span className="text-[8px] text-slate-500 block uppercase font-bold">Driver</span>
                    <span className="text-[10px] text-white font-extrabold">{selectedOrder.courier.driverName}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[8px] text-slate-500 block uppercase font-bold">Current Location</span>
                  <span className="text-[10px] text-white font-extrabold">{selectedOrder.courier.currentLocation}</span>
                </div>
              </div>

              {/* Secure OTP Verification Box */}
              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-850">
                <div className="space-y-0.5">
                  <span className="text-[9px] text-slate-500 block font-bold uppercase tracking-wider">Delivery OTP</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm tracking-widest text-emerald-450 font-mono">
                      {showOTP ? selectedOrder.courier.otp : '••••'}
                    </span>
                    <button 
                      onClick={() => setShowOTP(!showOTP)}
                      className="text-slate-550 hover:text-indigo-400 transition-colors p-1 cursor-pointer"
                    >
                      {showOTP ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[8px] text-slate-500 block uppercase font-bold">Est. Arrival</span>
                  <span className="text-[10px] text-indigo-455 font-extrabold">{selectedOrder.courier.estTime}</span>
                </div>
              </div>
            </div>
          )}

          {/* Simple delivery warning */}
          <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl flex gap-2">
            <Info className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <p className="text-[10px] text-slate-400 leading-normal font-medium">
              Always request the driver to show their Nexus verified ID tag before revealing the delivery OTP.
            </p>
          </div>

        </div>
      )}

      {/* ========================================== DETAILS TAB 2: PRICE & PAYMENT ========================================== */}
      {detailsTab === 'price' && (
        <div className="space-y-4 animate-slide-up">
          
          {/* Price Breakdown expandable module */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Price Breakdown</h4>
            <div className="bg-slate-900/60 border border-slate-850 p-4.5 rounded-2xl space-y-2.5">
              
              {/* Product items subtotal list */}
              {selectedOrder.items.map((item, i) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 line-clamp-1 font-medium">{item.name} <span className="text-slate-500 font-bold">x{item.qty}</span></span>
                  <span className="text-slate-205 font-bold">₹{(item.price * item.qty).toLocaleString('en-IN')}</span>
                </div>
              ))}
              
              <div className="border-t border-slate-850 my-2 pt-2 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400 font-medium">
                  <span>GST Charges</span>
                  <span>₹{selectedOrder.payment.taxAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-400 font-medium">
                  <span>Shipping Cost</span>
                  <span>₹{selectedOrder.payment.shippingCost.toLocaleString('en-IN')}</span>
                </div>
                
                {selectedOrder.payment.couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Coupon Discount</span>
                    <span>- ₹{selectedOrder.payment.couponDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                
                {selectedOrder.payment.pointsDiscount > 0 && (
                  <div className="flex justify-between text-purple-400 font-bold">
                    <span>Reward Discount</span>
                    <span>- ₹{selectedOrder.payment.pointsDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {selectedOrder.payment.walletUsed > 0 && (
                  <div className="flex justify-between text-indigo-400 font-bold">
                    <span>Wallet Used</span>
                    <span>- ₹{selectedOrder.payment.walletUsed.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>

              {/* Total Savings display */}
              {(selectedOrder.payment.couponDiscount > 0 || selectedOrder.payment.pointsDiscount > 0) && (
                <div className="bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-xl flex justify-between items-center text-[10px] text-emerald-400 font-bold uppercase tracking-wide">
                  <span>Total Savings:</span>
                  <span>₹{(selectedOrder.payment.couponDiscount + selectedOrder.payment.pointsDiscount + selectedOrder.payment.walletUsed).toLocaleString('en-IN')} Saved</span>
                </div>
              )}

              {/* Grand Total */}
              <div className="flex justify-between items-center border-t border-slate-850 pt-2.5 mt-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Grand Total</span>
                <span className="text-base font-extrabold text-indigo-400">₹{selectedOrder.payment.grandTotal.toLocaleString('en-IN')}</span>
              </div>

            </div>
          </div>

          {/* Payment & Transaction Card */}
          <div className="bg-slate-900/60 border border-slate-850 p-4.5 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payment Details</h4>
            <div className="grid grid-cols-2 gap-4 text-[10px] font-medium">
              <div>
                <span className="text-slate-500 uppercase block">Payment Method</span>
                <span className="font-bold text-slate-200 text-xs mt-0.5 block">{selectedOrder.payment.method}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase block">Transaction ID</span>
                <span className="font-bold text-slate-200 mt-0.5 block font-mono truncate" title={selectedOrder.payment.transactionId}>
                  {selectedOrder.payment.transactionId}
                </span>
              </div>
              <div>
                <span className="text-slate-500 uppercase block">Invoice Number</span>
                <span className="font-bold text-slate-200 mt-0.5 block font-mono">{selectedOrder.payment.invoiceNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase block">Reward Points Earned</span>
                <span className="font-bold text-purple-400 mt-0.5 block">+ {selectedOrder.payment.pointsEarned} XP</span>
              </div>
            </div>

            {/* GSTIN card */}
            <div className="border-t border-slate-850 pt-2.5 flex justify-between items-center text-[10px]">
              <span className="text-slate-500 font-bold uppercase tracking-wider">GST Details</span>
              <span className="font-mono text-slate-300 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-850">
                GSTIN: {selectedOrder.payment.gstin}
              </span>
            </div>
          </div>

          {/* Downloadable Assets list */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Downloads</h4>
            <div className="flex flex-col gap-2">
              
              {[
                { label: "Download Invoice PDF", desc: "GST Compliant invoice receipt", key: "invoice" },
                { label: "Download Warranty", desc: "Verify manufacturer warranty details", key: "warranty" },
                { label: "Download User Manual", desc: "Setup guides and precautions PDF", key: "manual" },
                { label: "Download Receipt", desc: "Secured transaction banking receipt", key: "receipt" }
              ].map(asset => {
                const percent = downloadProgress[selectedOrder.id] || 0;
                
                return (
                  <button
                    key={asset.key}
                    onClick={() => triggerDownloadInvoice(selectedOrder.id, isRealDatabaseOrder)}
                    className="w-full text-left p-3 rounded-xl border border-slate-850 hover:border-slate-800 bg-slate-950/30 hover:bg-slate-900 transition-all flex items-center justify-between group relative overflow-hidden cursor-pointer"
                  >
                    {/* Progress loader bar background */}
                    {percent > 0 && (
                      <div className="absolute inset-y-0 left-0 bg-indigo-600/15 transition-all duration-300" style={{ width: `${percent}%` }} />
                    )}

                    <div className="flex items-center gap-3 relative z-10">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-850 text-indigo-400">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-205 group-hover:text-indigo-400 transition-colors block">{asset.label}</span>
                        <span className="text-[9px] text-slate-500 mt-0.5 block font-bold">{asset.desc}</span>
                      </div>
                    </div>

                    <div className="relative z-10">
                      {percent > 0 ? (
                        <span className="text-[10px] text-indigo-400 font-extrabold">{percent}%</span>
                      ) : (
                        <Download className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                      )}
                    </div>
                  </button>
                );
              })}

            </div>
          </div>

        </div>
      )}

      {/* ========================================== DETAILS TAB 3: MERCHANT & ADDRESS ========================================== */}
      {detailsTab === 'merchant' && (
        <div className="space-y-4 animate-slide-up">
          
          {/* Seller details card */}
          <div className="bg-slate-900/60 border border-slate-850 p-4.5 rounded-2xl space-y-3.5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xl shadow-inner">
                {selectedOrder.seller.logo}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-white">{selectedOrder.seller.name}</h4>
                  {selectedOrder.seller.gstVerified && (
                    <span className="w-3.5 h-3.5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[8px] font-bold" title="GST Verified Seller">
                      ✓
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 font-bold">
                  <div className="flex items-center text-yellow-500 gap-0.5">
                    <Star className="w-3 h-3 fill-current" />
                    <span className="text-[10px]">{selectedOrder.seller.rating}</span>
                  </div>
                  <span className="text-[9px] text-slate-500">• Store Since {selectedOrder.seller.storeSince}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-850 pt-3.5 space-y-2.5 text-[10px] text-slate-400 font-semibold leading-relaxed">
              <div>
                <span className="font-bold text-slate-300 block mb-0.5 uppercase tracking-wide text-[8px]">Warranty Policy</span>
                <p>{selectedOrder.seller.warrantyPolicy}</p>
              </div>
              <div>
                <span className="font-bold text-slate-300 block mb-0.5 uppercase tracking-wide text-[8px]">Customer Support Policy</span>
                <p>{selectedOrder.seller.supportPolicy}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button 
                onClick={() => setDetailsTab('support')}
                className="rounded-xl bg-slate-950 border border-slate-850 hover:bg-slate-900 text-[10px] font-bold text-indigo-400 py-2.5 text-center cursor-pointer transition-colors"
              >
                Contact Seller
              </button>
              <Link 
                to="/search"
                className="rounded-xl bg-slate-950 border border-slate-850 hover:bg-slate-900 text-[10px] font-bold text-slate-300 py-2.5 text-center transition-colors"
              >
                View Store
              </Link>
            </div>
          </div>

          {/* Delivery address details with map preview */}
          <div className="bg-slate-900/60 border border-slate-850 p-4.5 rounded-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Delivery Address</h4>
              <button 
                onClick={openAddressModal}
                className="text-[10px] text-indigo-400 hover:text-indigo-350 font-extrabold cursor-pointer"
              >
                Edit Address
              </button>
            </div>

            <div className="space-y-2 text-xs font-medium">
              <div className="flex justify-between">
                <span className="font-bold text-slate-200">{selectedOrder.address.recipient}</span>
                <span className="text-slate-400">{selectedOrder.address.phone}</span>
              </div>
              <p className="text-slate-400 leading-normal font-semibold">
                {selectedOrder.address.street}, {selectedOrder.address.city}, {selectedOrder.address.state} - <span className="font-mono">{selectedOrder.address.postalCode}</span>
              </p>
              
              {selectedOrder.address.instructions && (
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 text-[10px] text-slate-400 font-semibold italic">
                  <span className="font-extrabold text-slate-500 uppercase not-italic block mb-0.5 text-[8px] tracking-wide">Delivery Instructions</span>
                  "{selectedOrder.address.instructions}"
                </div>
              )}
            </div>

            {/* Map Preview Mockup (AirBnb aesthetic) */}
            <div className="h-28 w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-900 relative flex items-center justify-center group shadow-inner">
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]" />
              
              {/* Fake Map Route Lines */}
              <svg className="absolute inset-0 w-full h-full stroke-slate-800 stroke-[1.5]" fill="none">
                <path d="M 20,40 L 120,40 L 160,90 L 280,30" />
                <path d="M 80,10 L 80,110" />
                <circle cx="160" cy="90" r="3" className="fill-indigo-500 stroke-none" />
                <circle cx="280" cy="30" r="3" className="fill-purple-500 stroke-none" />
              </svg>

              {/* Marker pin */}
              <div className="relative z-10 flex flex-col items-center gap-1">
                <MapPin className="w-7 h-7 text-indigo-500 animate-bounce" />
                <span className="bg-slate-900 border border-slate-800 text-[8px] font-extrabold text-white px-2 py-0.5 rounded shadow">
                  Map Preview
                </span>
              </div>
              
              <div className="absolute bottom-2 right-2 bg-slate-900/90 text-[8px] text-slate-405 px-2 py-0.5 rounded border border-slate-800">
                Nexus Maps
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ========================================== DETAILS TAB 4: NEED HELP & LIVE SUPPORT ========================================== */}
      {detailsTab === 'support' && (
        <div className="space-y-4 animate-slide-up">
          
          {/* Action buttons list */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => dispatch(addToast({ message: "Connecting to dispatch helpline...", type: "info" }))}
              className="rounded-xl border border-slate-850 hover:border-slate-800 bg-slate-950/30 hover:bg-slate-900 py-3 text-[10px] font-bold text-slate-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5 text-indigo-400" /> Call Support
            </button>
            <button
              onClick={() => setShowComplaintModal(true)}
              className="rounded-xl border border-slate-850 hover:border-slate-800 bg-slate-950/30 hover:bg-slate-900 py-3 text-[10px] font-bold text-slate-350 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> Raise Complaint
            </button>
            
            {/* Conditional Return/Cancel actions */}
            {['PENDING', 'CONFIRMED', 'PACKED'].includes(selectedOrder.status) && (
              <button
                onClick={() => dispatch(addToast({ message: "Cancellation request sent to seller.", type: "warning" }))}
                className="col-span-2 rounded-xl bg-rose-600 hover:bg-rose-500 py-3 text-[10px] font-extrabold text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> Cancel Order
              </button>
            )}

            {selectedOrder.status === 'DELIVERED' && (
              <button
                onClick={() => dispatch(addToast({ message: "Return request submitted. Pickup scheduled within 48h.", type: "info" }))}
                className="col-span-2 rounded-xl bg-indigo-605 hover:bg-indigo-500 py-3 text-[10px] font-extrabold text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Return Product
              </button>
            )}
          </div>

          {/* Support live chat integration widget */}
          <div className="bg-slate-900/60 border border-slate-850 p-4.5 rounded-2xl flex flex-col h-[280px]">
            <div className="flex items-center gap-2 border-b border-slate-850 pb-2.5 mb-3 flex-shrink-0">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-extrabold text-slate-300 uppercase tracking-wide">Live Chat</span>
            </div>

            {/* Chat message display area */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 text-[10px] leading-relaxed scrollbar-thin">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'ml-auto items-end' : 'items-start'}`}>
                  <div className={`p-2.5 rounded-2xl ${
                    msg.sender === 'user' 
                      ? 'bg-indigo-650 text-white rounded-tr-none' 
                      : 'bg-slate-950 text-slate-300 border border-slate-850 rounded-tl-none font-medium'
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-[8px] text-slate-500 mt-1 font-bold">{msg.time}</span>
                </div>
              ))}
              
              {isBotTyping && (
                <div className="flex items-center gap-1 text-slate-500 text-[9px] italic">
                  <span className="animate-bounce">●</span>
                  <span className="animate-bounce delay-100">●</span>
                  <span className="animate-bounce delay-200">●</span>
                  <span>Typing...</span>
                </div>
              )}
            </div>

            {/* Input form */}
            <form onSubmit={handleChatSubmit} className="mt-3.5 flex gap-2 flex-shrink-0">
              <input
                type="text"
                placeholder="Ask about 'OTP', 'Delivery', or 'Refund'..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <button 
                type="submit"
                className="rounded-xl bg-indigo-650 hover:bg-indigo-500 text-white p-2 flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Help Center FAQs */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">FAQs</h4>
            <div className="space-y-2">
              {FAQS.map((faq, i) => {
                const isOpen = activeFaq === i;
                
                return (
                  <div key={i} className="border border-slate-850 rounded-xl overflow-hidden bg-slate-950/20">
                    <button
                      onClick={() => setActiveFaq(isOpen ? null : i)}
                      className="w-full text-left p-3 text-[10px] font-bold text-slate-300 hover:text-white flex items-center justify-between cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="p-3 pt-0 text-[9px] text-slate-500 leading-normal border-t border-slate-900 bg-slate-950/40 font-semibold">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
