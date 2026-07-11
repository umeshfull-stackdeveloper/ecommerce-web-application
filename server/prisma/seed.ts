import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

declare const process: any;

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Database Seeding: Starting...');

  // Clean existing tables in order
  await prisma.notification.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.review.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.seller.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();
  await prisma.coupon.deleteMany();

  console.log('🧹 Cleaned existing database tables');

  // Hash password
  const hashedPassword = await bcrypt.hash('password123', 12);

  // 1. Create Users (Recruiter Demo Accounts)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@nexusindia.com',
      password: hashedPassword,
      name: 'Nexus Admin',
      role: 'ADMIN',
      isVerified: true,
      referralCode: 'ADMIN2026'
    }
  });

  const sellerUser = await prisma.user.create({
    data: {
      email: 'seller@nexusindia.com',
      password: hashedPassword,
      name: 'Nexus Premium Seller',
      role: 'SELLER',
      isVerified: true,
      referralCode: 'SELL2026'
    }
  });

  const customerUser = await prisma.user.create({
    data: {
      email: 'demo@nexusindia.com',
      password: hashedPassword,
      name: 'Recruiter Demo',
      role: 'CUSTOMER',
      isVerified: true,
      referralCode: 'DEMO2026'
    }
  });

  console.log('👤 Created recruiter demo accounts: admin@nexusindia.com, seller@nexusindia.com, demo@nexusindia.com');

  // 2. Create Seller Profile
  const sellerProfile = await prisma.seller.create({
    data: {
      userId: sellerUser.id,
      companyName: 'Nexus India Premium Stores',
      description: 'Authorized national distributor of premium consumer electronics, laptops, home goods, and sports lifestyle gear.',
      isApproved: true,
      logoUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150&auto=format&fit=crop&q=60'
    }
  });

  // Create empty carts & wishlists
  await prisma.cart.create({ data: { userId: admin.id } });
  await prisma.wishlist.create({ data: { userId: admin.id } });
  await prisma.cart.create({ data: { userId: sellerUser.id } });
  await prisma.wishlist.create({ data: { userId: sellerUser.id } });
  
  await prisma.cart.create({ data: { userId: customerUser.id } });
  await prisma.wishlist.create({ data: { userId: customerUser.id } });

  // 3. Create Addresses
  await prisma.address.create({
    data: {
      userId: customerUser.id,
      street: '12, MG Road, Block A',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'India',
      phone: '+91 98765 43210',
      isDefault: true
    }
  });

  console.log('📬 Configured Indian address metadata');

  // 4. Create 10 target categories
  const catElectronics = await prisma.category.create({ data: { name: 'Electronics', slug: 'electronics' } });
  const catSmartphones = await prisma.category.create({ data: { name: 'Smartphones', slug: 'smartphones', parentId: catElectronics.id } });
  const catFashion = await prisma.category.create({ data: { name: 'Fashion', slug: 'fashion' } });
  const catFootwear = await prisma.category.create({ data: { name: 'Footwear', slug: 'footwear', parentId: catFashion.id } });
  const catClothing = await prisma.category.create({ data: { name: 'Clothing', slug: 'clothing', parentId: catFashion.id } });
  const catHomeKitchen = await prisma.category.create({ data: { name: 'Home & Kitchen', slug: 'home-living' } });
  const catBeauty = await prisma.category.create({ data: { name: 'Beauty', slug: 'beauty' } });
  const catGrocery = await prisma.category.create({ data: { name: 'Grocery', slug: 'grocery' } });
  const catBooks = await prisma.category.create({ data: { name: 'Books', slug: 'books' } });
  const catSports = await prisma.category.create({ data: { name: 'Sports', slug: 'sports' } });
  const catAutomotive = await prisma.category.create({ data: { name: 'Automotive', slug: 'automotive' } });

  console.log('🗂️ Seeded 10 marketplace categories');

  // 5. Create 15 realistic Indian products
  // Product 1: OnePlus 13
  const p1 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catSmartphones.id,
      name: 'OnePlus 13 (Silk Black, 256GB)',
      slug: 'oneplus-13-silk-black',
      description: 'The latest flagship smartphone powered by Snapdragon 8 Elite, featuring an ultra-fluid 2K 120Hz display, Hasselblad mobile camera system, 100W SuperVOOC fast charging, and massive 6000mAh battery.',
      price: 64999.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.7,
      badge: 'Trending',
      brand: 'OnePlus',
      color: 'Silk Black',
      specifications: JSON.stringify({
        'Processor': 'Snapdragon 8 Elite',
        'RAM': '12GB LPDDR5X',
        'Storage': '256GB UFS 4.0',
        'Camera': '50MP + 50MP + 50MP Hasselblad',
        'Battery': '6000mAh with 100W Charging',
        'Warranty': '1 Year Brand Warranty'
      }),
      features: JSON.stringify([
        'Next-Gen Snapdragon 8 Elite Processor for peak gaming performance',
        'Stunning 2K Oriental AMOLED display with 120Hz refresh rate',
        'Professional grade Hasselblad mobile camera with OIS support',
        'IP68/IP69 rating for comprehensive dust and water resistance'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p1.id, size: '256GB', color: 'Silk Black', stock: 50, sku: 'OP-13-256-BLK' } });

  // Product 2: Samsung Galaxy S26
  const p2 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catSmartphones.id,
      name: 'Samsung Galaxy S26 Ultra (Titanium Gray)',
      slug: 'samsung-galaxy-s26-ultra',
      description: 'Samsung premium flagship featuring integrated S-Pen, dynamic 200MP camera matrix with hybrid zoom, Snapdragon 8 Elite Galaxy Edition chip, and Galaxy AI productivity tools built-in.',
      price: 124999.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.9,
      badge: 'Best Seller',
      brand: 'Samsung',
      color: 'Titanium Gray',
      specifications: JSON.stringify({
        'Processor': 'Snapdragon 8 Elite (Galaxy)',
        'RAM': '16GB LPDDR5X',
        'Storage': '512GB UFS 4.0',
        'Camera': '200MP + 50MP + 12MP + 10MP Quad Camera',
        'S-Pen': 'Included in chassis',
        'Warranty': '1 Year Manufacturer Warranty'
      }),
      features: JSON.stringify([
        'Ultra-durable Titanium Frame construction with Gorilla Glass Armor',
        'Revolutionary 200MP primary sensor for epic low-light photography',
        'Advanced Galaxy AI for live translation, note summaries, and photo edits',
        'Brightest Dynamic AMOLED 2X display with adaptive 1Hz-120Hz refresh'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p2.id, size: '512GB', color: 'Titanium Gray', stock: 35, sku: 'SS-S26U-512-GRY' } });

  // Product 3: iPhone 18 Pro
  const p3 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catSmartphones.id,
      name: 'Apple iPhone 18 Pro (Titanium Black, 128GB)',
      slug: 'apple-iphone-18-pro',
      description: 'The standard of mobile excellence with A20 Pro Bionic chip, custom ProMotion display, advanced spatial video capability, Action Button, and professional triple-camera system.',
      price: 139900.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.8,
      badge: 'New',
      brand: 'Apple',
      color: 'Titanium Black',
      specifications: JSON.stringify({
        'Processor': 'A20 Pro Bionic Chip',
        'RAM': '8GB LPDDR5X',
        'Storage': '128GB NVMe',
        'Camera': '48MP Main + 48MP Telephoto + 48MP Ultra Wide',
        'OS': 'iOS 18 / iOS 19 ready',
        'Warranty': '1 Year Apple International Warranty'
      }),
      features: JSON.stringify([
        'Aviation-grade Titanium enclosure with textured matte glass back',
        'ProMotion display with always-on technology and dynamic island',
        'Advanced USB-C port supporting fast USB 3 transfer speeds',
        'Apple Intelligence integration for smart writing and Siri assistance'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p3.id, size: '128GB', color: 'Titanium Black', stock: 40, sku: 'AP-I18P-128-BLK' } });

  // Product 4: Sony WH-1000XM6
  const p4 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catElectronics.id,
      name: 'Sony WH-1000XM6 Noise Cancelling Headphones',
      slug: 'sony-wh-1000xm6-headphones',
      description: 'The industry-leading wireless over-ear noise-cancelling headphones featuring newly engineered processors, high-res audio drivers, crystal clear calls, and up to 45 hours battery life.',
      price: 29990.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.8,
      badge: 'Best Seller',
      brand: 'Sony',
      color: 'Midnight Black',
      specifications: JSON.stringify({
        'Driver Unit': '40mm Dome Type',
        'Noise Cancelling': 'Industry Leading HD NC Processor QN2',
        'Battery Life': 'Up to 45 Hours (ANC Off)',
        'Bluetooth': 'Version 5.4',
        'Warranty': '1 Year Sony India Warranty'
      }),
      features: JSON.stringify([
        'High-Resolution Audio Wireless with LDAC support',
        'Smart Speak-to-Chat function auto pauses music when you speak',
        'Adaptive Sound Control optimizes audio profiles based on activities',
        'Multi-point connection links with two devices simultaneously'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p4.id, size: 'Standard', color: 'Midnight Black', stock: 60, sku: 'SN-XM6-BLK' } });

  // Product 5: Apple Watch Series 12
  const p5 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catElectronics.id,
      name: 'Apple Watch Series 12 GPS (Midnight, 45mm)',
      slug: 'apple-watch-series-12-gps',
      description: 'Smart health accessory featuring advanced ECG capabilities, sleep apnea detection, blood oxygen monitoring, always-on Retina display, and fast charging backing daily usage.',
      price: 45900.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.7,
      badge: 'New',
      brand: 'Apple',
      color: 'Midnight',
      specifications: JSON.stringify({
        'Case Size': '45mm Aluminum',
        'Connectivity': 'GPS + GLONASS',
        'Display': 'Always-On Retina LTPO OLED',
        'Sensors': 'ECG, SpO2, Temperature, Heart Rate',
        'Warranty': '1 Year Apple India Warranty'
      }),
      features: JSON.stringify([
        'Always-On display allows quick glances without raising wrist',
        'Advanced fitness tracking with custom heart rate zones',
        'Fall Detection and Crash Detection triggers emergency SOS calling',
        'Swimproof design up to 50m water resistance'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p5.id, size: '45mm', color: 'Midnight', stock: 25, sku: 'AP-AW12-45-MID' } });

  // Product 6: MacBook Air M5
  const p6 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catElectronics.id,
      name: 'Apple MacBook Air M5 (13-inch, 16GB, 512GB)',
      slug: 'macbook-air-m5-13-inch',
      description: 'Incredibly thin and light laptop powered by the revolutionary M5 chip, featuring a fanless silent design, up to 20 hours battery life, 16GB unified memory, and 512GB SSD.',
      price: 114900.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.9,
      badge: 'Trending',
      brand: 'Apple',
      color: 'Space Gray',
      specifications: JSON.stringify({
        'Processor': 'Apple M5 Chip (8-Core CPU)',
        'Unified Memory': '16GB Unified RAM',
        'SSD Storage': '512GB NVMe SSD',
        'Display': '13.6-inch Liquid Retina Display',
        'Keyboard': 'Backlit Magic Keyboard with Touch ID',
        'Warranty': '1 Year Apple Brand Warranty'
      }),
      features: JSON.stringify([
        'Supercharged M5 chip handles developer compiles and 4K editing with ease',
        'Completely silent, fanless design keeps laptop cool under heavy load',
        'Stunning Liquid Retina display with 500 nits peak brightness',
        'MagSafe 3 charging port along with dual Thunderbolt/USB-C ports'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p6.id, size: '13-inch', color: 'Space Gray', stock: 15, sku: 'AP-MBA-M5-SG' } });

  // Product 7: Lenovo Legion Pro
  const p7 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catElectronics.id,
      name: 'Lenovo Legion Pro 5 Gen 9 (Titanium)',
      slug: 'lenovo-legion-pro-5',
      description: 'High-performance gaming laptop with AMD Ryzen 9 processor, NVIDIA RTX 4070 Graphics, 16-inch 240Hz screen, 32GB RAM, and Legion Coldfront thermal cooling system.',
      price: 149990.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.6,
      badge: 'Limited Stock',
      brand: 'Lenovo',
      color: 'Titanium Grey',
      specifications: JSON.stringify({
        'Processor': 'AMD Ryzen 9 7945HX',
        'Graphics': 'NVIDIA RTX 4070 8GB GDDR6',
        'RAM': '32GB DDR5 (Dual Channel)',
        'Storage': '1TB PCIe Gen4 SSD',
        'Display': '16-inch WQXGA IPS 240Hz',
        'Warranty': '1 Year Lenovo Premium Care'
      }),
      features: JSON.stringify([
        'RTX 4070 supporting Ray Tracing and DLSS 3.0 frame generation',
        'Legion Coldfront 5.0 hybrid fan cooling prevents throttle drops',
        'RGB backlit keyboard with custom software mappings',
        'Rapid Charge Pro refills 50% battery in 30 minutes flat'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p7.id, size: '16-inch', color: 'Titanium Grey', stock: 8, sku: 'LN-L5P-R9-4070' } });

  // Product 8: ASUS ROG Strix
  const p8 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catElectronics.id,
      name: 'ASUS ROG Strix G16 (Volt Green)',
      slug: 'asus-rog-strix-g16',
      description: 'E-Sports gaming powerhouse with Intel Core i9 processor, NVIDIA RTX 4080 GPU, customizable Aura Sync RGB lightbar, 16-inch Nebula QHD display, and Liquid Metal cooling.',
      price: 184990.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.8,
      badge: 'Trending',
      brand: 'ASUS',
      color: 'Volt Green',
      specifications: JSON.stringify({
        'Processor': 'Intel Core i9-14900HX',
        'Graphics': 'NVIDIA RTX 4080 12GB GDDR6',
        'RAM': '32GB DDR5 5600MHz',
        'Storage': '1TB PCIe 4.0 NVMe SSD',
        'Display': '16-inch QHD+ ROG Nebula 240Hz',
        'Warranty': '1 Year ASUS On-Site Warranty'
      }),
      features: JSON.stringify([
        'Ultra-high tier RTX 4080 GPU for 150+ FPS ultra-settings gaming',
        'ROG Intelligent Cooling with liquid metal compound on CPU',
        'Gorgeous Nebula Display supporting Dolby Vision HDR',
        'Chassis lightbar syncing with desktop peripheral ecosystems'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p8.id, size: '16-inch', color: 'Volt Green', stock: 12, sku: 'AS-ROG-I9-4080' } });

  // Product 9: Dell XPS 15
  const p9 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catElectronics.id,
      name: 'Dell XPS 15 (Platinum Silver)',
      slug: 'dell-xps-15-platinum',
      description: 'The premium creator laptop featuring a stunning 3.5K OLED touch screen, CNC-machined aluminum chassis, Intel Core i9 processor, 32GB RAM, and dual studio-level speaker output.',
      price: 210000.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.7,
      badge: 'Best Seller',
      brand: 'Dell',
      color: 'Platinum Silver',
      specifications: JSON.stringify({
        'Processor': 'Intel Core i9-13900H',
        'RAM': '32GB DDR5',
        'Storage': '1TB PCIe 4.0 SSD',
        'Display': '15.6-inch 3.5K OLED Touch Display',
        'Audio': 'Waves MaxxAudio Pro Studio speakers',
        'Warranty': '2 Years Dell Premium Support'
      }),
      features: JSON.stringify([
        'CNC-Machined Aluminum frame with carbon fiber composite palmrest',
        'Breath-taking 3.5K InfinityEdge display with 100% DCI-P3 color',
        'Dedicated NVIDIA GeForce RTX 4060 graphics for studio rendering',
        'Double warranty coverage period with onsite engineer response'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p9.id, size: '15.6-inch', color: 'Platinum Silver', stock: 10, sku: 'DE-XPS15-SLV' } });

  // Product 10: Adidas Ultraboost
  const p10 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catFootwear.id,
      name: 'Adidas Ultraboost Light Running Shoes',
      slug: 'adidas-ultraboost-light',
      description: 'Experience epic energy return with the lightest Ultraboost yet, featuring high responsive Boost foam capsules, breathable primeknit mesh upper, and Continental rubber grip soles.',
      price: 17999.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.5,
      badge: 'Best Seller',
      brand: 'Adidas',
      color: 'Solar Red',
      specifications: JSON.stringify({
        'Sole Material': 'Continental Rubber Grip',
        'Midsole': 'Ultraboost Light Capsule Foam',
        'Upper Material': 'Primeknit Textile Mesh',
        'Weight': '290 grams',
        'Warranty': '3 Months Brand Warranty'
      }),
      features: JSON.stringify([
        '30% lighter Boost material compared to previous design iterations',
        'Continental Rubber outsole delivers optimal traction in wet and dry conditions',
        'Primeknit upper matches organic foot motion to prevent blister chafing',
        'Constructed using ocean plastic recycled textiles'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p10.id, size: 'UK-9', color: 'Solar Red', stock: 45, sku: 'AD-UB-RED-09' } });

  // Product 11: Nike Pegasus
  const p11 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catFootwear.id,
      name: 'Nike Air Zoom Pegasus 40 (Midnight Blue)',
      slug: 'nike-air-zoom-pegasus-40',
      description: 'The workhorse with wings returns. Delivering standard responsive cushion support for road runners, equipped with dual Zoom Air units and React foam midsole.',
      price: 11999.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.6,
      badge: 'Trending',
      brand: 'Nike',
      color: 'Midnight Blue',
      specifications: JSON.stringify({
        'Sole Material': 'Durable Rubber Waffle outsole',
        'Midsole': 'React Foam with 2x Zoom Air',
        'Upper Material': 'Engineered Single-Layer Mesh',
        'Pronation': 'Neutral Support',
        'Warranty': '3 Months Brand Warranty'
      }),
      features: JSON.stringify([
        'Highly responsive React foam base reduces shock impacts on joints',
        'Dual Zoom Air units at forefoot and heel maximize take-off spring',
        'Waffle-inspired outsole pattern provides multi-surface road traction',
        'Padded collar support keeps heels locked in during sprints'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p11.id, size: 'UK-8', color: 'Midnight Blue', stock: 30, sku: 'NK-PG40-BLU-08' } });

  // Product 12: Puma Velocity Nitro
  const p12 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catFootwear.id,
      name: 'Puma Velocity Nitro 3 (Sunset Coral)',
      slug: 'puma-velocity-nitro-3',
      description: 'Puma flagship runner featuring advanced Nitro foam gas-injected technology, providing light responsive cushion along with high-traction PumaGrip outsoles.',
      price: 7999.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.4,
      badge: 'New',
      brand: 'Puma',
      color: 'Sunset Coral',
      specifications: JSON.stringify({
        'Sole Material': 'PumaGrip Rubber Compound',
        'Midsole': 'Nitro Foam (Gas-Injected)',
        'Upper Material': 'Engineered breathable mesh',
        'Heel Drop': '10mm',
        'Warranty': '3 Months Brand Warranty'
      }),
      features: JSON.stringify([
        'Nitro foam technology offers superior responsiveness in a featherlight package',
        'PumaGrip rubber sole compound offers outstanding durability and traction',
        'TPU heel spoiler stabilizes gait patterns during long runs',
        'Reflective trims improve night runner roadside visibility'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p12.id, size: 'UK-9', color: 'Sunset Coral', stock: 25, sku: 'PM-VN3-CRL-09' } });

  // Product 13: Philips Air Fryer
  const p13 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catHomeKitchen.id,
      name: 'Philips Digital Air Fryer HD9252 (Black)',
      slug: 'philips-digital-air-fryer-hd9252',
      description: 'Prepare delicious fried food using up to 90% less oil. Powered by Rapid Air technology with a touch screen console hosting 7 pre-set recipes.',
      price: 9990.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.7,
      badge: 'Best Seller',
      brand: 'Philips',
      color: 'Black',
      specifications: JSON.stringify({
        'Power Usage': '1400 Watts',
        'Capacity': '4.1 Litres',
        'Technology': 'Rapid Air Technology',
        'Console': 'Touch Screen UI with 7 Presets',
        'Warranty': '2 Years Philips India Warranty'
      }),
      features: JSON.stringify([
        'Rapid Air hot swirl convection cooks food evenly without turning',
        'Up to 90% fat reduction compared to standard deep frying recipes',
        'Keep Warm function maintains serving temperature up to 30 mins',
        'QuickClean basket with non-stick grid is dishwasher safe'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p13.id, size: '4.1L', color: 'Black', stock: 50, sku: 'PH-AF-9252-BLK' } });

  // Product 14: Dyson Air Purifier
  const p14 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catHomeKitchen.id,
      name: 'Dyson Purifier Hot+Cool Air Purifier HP07',
      slug: 'dyson-hot-cool-purifier-hp07',
      description: 'Enterprise grade air purification that automatically detects, captures, and projects clean air. Dual functionality includes heating and cooling fan modes.',
      price: 42900.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.8,
      badge: 'Trending',
      brand: 'Dyson',
      color: 'Nickel/White',
      specifications: JSON.stringify({
        'Filters': 'HEPA H13 Glass + Activated Carbon',
        'Coverage Area': 'Up to 600 sq ft',
        'Modes': 'Heating, Fan Cooling, Night Mode',
        'Sensors': 'AQI, PM2.5, PM10, VOC, NO2',
        'Warranty': '2 Years Dyson India Warranty'
      }),
      features: JSON.stringify([
        'Fully sealed HEPA H13 filter traps 99.95% of micro allergens and virus particles',
        'Air Multiplier technology draws in distant pollutants and projects clean air',
        '350 degree oscillation projects filtered air throughout living spaces',
        'Dyson Link App allows remote monitoring and schedule configurations'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p14.id, size: 'Standard', color: 'Nickel/White', stock: 15, sku: 'DY-HP07-NKL' } });

  // Product 15: Prestige Induction Cooktop
  const p15 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catHomeKitchen.id,
      name: 'Prestige PIC 20.0 Induction Cooktop (Black)',
      slug: 'prestige-pic-induction-cooktop',
      description: 'Indian cooking made smart and efficient. Prestige induction cooktop with push-button control, automatic voltage regulator, and pre-set Indian menu options.',
      price: 3490.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.3,
      badge: 'Best Seller',
      brand: 'Prestige',
      color: 'Black',
      specifications: JSON.stringify({
        'Power': '1200 Watts',
        'Voltage': '230V AC 50Hz',
        'Control Type': 'Push Button Panel',
        'Presets': 'Idli, Dosa, Curry, Pressure Cook, Milk',
        'Warranty': '1 Year Prestige India Warranty'
      }),
      features: JSON.stringify([
        'Automatic Voltage Regulator handles Indian power grid fluctuations',
        'Eco-friendly design consumes less power compared to standard gas stove setups',
        'Anti-magnetic wall design prevents high thermal radiation leakage',
        'Flat polished glass panel allows quick sponge cleaning'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p15.id, size: '1200W', color: 'Black', stock: 80, sku: 'PR-PIC20-BLK' } });

  // Product 16: Google Pixel 10 Pro
  const p16 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catSmartphones.id,
      name: 'Google Pixel 10 Pro (Obsidian, 256GB)',
      slug: 'google-pixel-10-pro-obsidian',
      description: 'The ultimate AI smartphone by Google. Featuring a Tensor G5 processor, 16GB RAM, Gemini Ultra onboard integration, custom triple camera array with 5x optical zoom, and 7 years of Android updates.',
      price: 84999.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.8,
      badge: 'New',
      brand: 'Google',
      color: 'Obsidian',
      specifications: JSON.stringify({
        'Processor': 'Google Tensor G5 AI',
        'RAM': '16GB LPDDR5X',
        'Storage': '256GB UFS 4.0',
        'Camera': '50MP Main + 48MP Telephoto + 48MP Ultrawide',
        'Battery': '5050mAh with 45W Fast Charging',
        'Warranty': '1 Year Brand Warranty'
      }),
      features: JSON.stringify([
        'Google Tensor G5 for unmatched mobile AI performance and computational photography',
        'Immersive 6.7-inch Super Actua LTPO display with 120Hz refresh rate',
        'Magic Editor, Best Take, and Zoom Enhance powered by Google AI',
        '7 years of guaranteed OS, security, and feature drop updates'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p16.id, size: '256GB', color: 'Obsidian', stock: 25, sku: 'GG-P10P-256-OBS' } });

  // Product 17: Nothing Phone (3)
  const p17 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catSmartphones.id,
      name: 'Nothing Phone (3) (Dark Grey, 256GB)',
      slug: 'nothing-phone-3-dark-grey',
      description: 'Redefine smartphone design with the transparent Nothing Phone (3). Highlights a unique Glyph Interface, custom Nothing OS, Snapdragon 8s Gen 4 processor, and dual 50MP Sony primary cameras.',
      price: 42999.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1565849906660-f96b299c4874?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.6,
      badge: 'Trending',
      brand: 'Nothing',
      color: 'Dark Grey',
      specifications: JSON.stringify({
        'Processor': 'Snapdragon 8s Gen 4',
        'RAM': '12GB RAM',
        'Storage': '256GB UFS 4.0',
        'Camera': '50MP + 50MP Dual rear camera system',
        'Battery': '4900mAh with 45W charging',
        'Warranty': '1 Year Nothing India Warranty'
      }),
      features: JSON.stringify([
        'Iconic transparent back with customizable Glyph Interface LEDs',
        'Clean, bloatware-free Nothing OS with rapid animation performance',
        'Dual 50MP camera sensors with OIS + EIS capabilities',
        '100% recycled aluminum chassis frame structure'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p17.id, size: '256GB', color: 'Dark Grey', stock: 30, sku: 'NT-P3-256-GRY' } });

  // Product 18: ASUS Zenbook Duo 14
  const p18 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catElectronics.id,
      name: 'ASUS Zenbook Duo 14 (Inkwell Gray)',
      slug: 'asus-zenbook-duo-14',
      description: 'Revolutionary dual-screen laptop featuring two 14-inch OLED touchscreens, detachable Bluetooth keyboard, Intel Core Ultra 9 processor, and integrated kickstand.',
      price: 159990.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.7,
      badge: 'New',
      brand: 'ASUS',
      color: 'Inkwell Gray',
      specifications: JSON.stringify({
        'Processor': 'Intel Core Ultra 9 185H',
        'RAM': '32GB LPDDR5X',
        'Storage': '1TB PCIe 4.0 NVMe SSD',
        'Display': 'Dual 14-inch 3K OLED 120Hz Touchscreens',
        'Graphics': 'Intel Arc Graphics',
        'Warranty': '1 Year ASUS India Warranty'
      }),
      features: JSON.stringify([
        'Dual 14-inch OLED touchscreens offer unmatched multitasking workspace flexibility',
        'Detachable full-size keyboard with touchpad for multi-mode setups',
        'Intel Core Ultra 9 processor with built-in NPU for offline AI workloads',
        'Extremely compact and lightweight chassis weighing only 1.35kg'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p18.id, size: '14-inch', color: 'Inkwell Gray', stock: 10, sku: 'AS-ZD-U9-1TB' } });

  // Product 19: HP Spectre x360
  const p19 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catElectronics.id,
      name: 'HP Spectre x360 2-in-1 (Nightfall Black)',
      slug: 'hp-spectre-x360-2-in-1',
      description: 'Ultra-premium 2-in-1 laptop with 360-degree hinge, 14-inch 2.8K OLED touch display, Intel Core Ultra 7 processor, and included HP Rechargeable MPP 2.0 Tilt Pen.',
      price: 174990.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.8,
      badge: 'Best Seller',
      brand: 'HP',
      color: 'Nightfall Black',
      specifications: JSON.stringify({
        'Processor': 'Intel Core Ultra 7 155H',
        'RAM': '16GB LPDDR5x',
        'Storage': '1TB PCIe 4.0 NVMe SSD',
        'Display': '14-inch 2.8K OLED 120Hz Touchscreen',
        'Battery': 'Up to 15 hours battery life',
        'Warranty': '1 Year HP On-Site Premium Warranty'
      }),
      features: JSON.stringify([
        '360-degree convertible hinge allows seamless laptop, tent, or tablet modes',
        'Included active pen with magnetic storage and tilt support for artists',
        'Stunning 2.8K OLED screen with IMAX Enhanced certification',
        '9MP front camera with AI framing and auto background blur'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p19.id, size: '14-inch', color: 'Nightfall Black', stock: 12, sku: 'HP-SP-U7-1TB' } });

  // Product 20: Nike Air Max Flyknit
  const p20 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catFootwear.id,
      name: 'Nike Air Max Flyknit Running Shoes',
      slug: 'nike-air-max-flyknit',
      description: 'The pinnacle of comfort and style. Featuring a fully breathable Flyknit upper, massive visible Air Max cushioning unit, and modern sportswear design.',
      price: 14999.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.6,
      badge: 'Trending',
      brand: 'Nike',
      color: 'Volt Black',
      specifications: JSON.stringify({
        'Sole Material': 'Visible Air Max Unit Rubber Sole',
        'Upper Material': 'Recycled Polyester Flyknit Mesh',
        'Pronation': 'Neutral daily support',
        'Weight': '310 grams',
        'Warranty': '3 Months Brand Warranty'
      }),
      features: JSON.stringify([
        'Flyknit upper conforms organically to your foot like a cozy sock',
        'Full-length Max Air unit delivers exceptional premium underfoot cushion',
        'Outsole flex grooves enhance structural flexibility and smooth roll-offs',
        'Constructed using at least 20% recycled content by weight'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p20.id, size: 'UK-9', color: 'Volt Black', stock: 25, sku: 'NK-AMF-BLK-09' } });

  // Product 21: Adidas Stan Smith
  const p21 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catFootwear.id,
      name: 'Adidas Stan Smith Sneakers (Cloud White)',
      slug: 'adidas-stan-smith-white',
      description: 'The timeless classic street sneaker. Features premium vegan leather upper, perforated 3-Stripes branding, signature green heel tab, and durable ortholite sockliner.',
      price: 8999.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.5,
      badge: 'Best Seller',
      brand: 'Adidas',
      color: 'Cloud White/Green',
      specifications: JSON.stringify({
        'Upper Material': 'Premium Synthetic Vegan Leather',
        'Sole Material': 'Recycled rubber cupsole',
        'Lining': 'Synthetic leather lining',
        'Closure': 'Lace-up system',
        'Warranty': '3 Months Brand Warranty'
      }),
      features: JSON.stringify([
        'Classic minimalist silhouette that pairs perfectly with any outfit',
        'Perforated 3-Stripes for ventilation and authentic vintage styling',
        'Primegreen upper made with high-performance recycled materials',
        'Soft OrthoLite sockliner provides comfortable all-day steps'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p21.id, size: 'UK-8', color: 'Cloud White/Green', stock: 40, sku: 'AD-SS-WHT-08' } });

  // Product 22: Dyson V15 Detect
  const p22 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catHomeKitchen.id,
      name: 'Dyson V15 Detect Cordless Vacuum Cleaner',
      slug: 'dyson-v15-detect-vacuum',
      description: 'Dysons most powerful, intelligent cordless vacuum. Features laser dust detection, a piezo sensor that counts and measures dust particle sizes, and automatically adapts suction power.',
      price: 55900.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.9,
      badge: 'Trending',
      brand: 'Dyson',
      color: 'Yellow/Nickel',
      specifications: JSON.stringify({
        'Suction Power': '240 AW (Air Watts)',
        'Run Time': 'Up to 60 Minutes (Eco Mode)',
        'Bin Volume': '0.76 Litres',
        'Filtration': 'Whole-machine HEPA filtration',
        'Warranty': '2 Years Dyson India Warranty'
      }),
      features: JSON.stringify([
        'Angled laser reveals invisible microscopic dust on hard floors',
        'Piezo sensor automatically counts and adjusts suction depending on debris load',
        'LCD screen displays real-time run time countdown and particle breakdown',
        'Digital Motorbar cleaner head prevents hair tangles automatically'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p22.id, size: 'Standard', color: 'Yellow/Nickel', stock: 15, sku: 'DY-V15-DET' } });

  // Product 23: Xiaomi Smart Air Fryer
  const p23 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catHomeKitchen.id,
      name: 'Xiaomi Smart Air Fryer (3.5L, White)',
      slug: 'xiaomi-smart-air-fryer-3.5l',
      description: 'Smart oil-free cooking. Features 360-degree hot air circulation, 40-200 degree temperature range for baking/yogurt/dried fruit, OLED display, and Google Assistant/Alexa support.',
      price: 6999.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.5,
      badge: 'Best Seller',
      brand: 'Xiaomi',
      color: 'White',
      specifications: JSON.stringify({
        'Capacity': '3.5 Litres',
        'Power': '1500 Watts',
        'Connectivity': 'Wi-Fi IEEE 802.11 b/g/n',
        'Control': 'OLED Knob Control + Mi Home App',
        'Warranty': '1 Year Xiaomi India Warranty'
      }),
      features: JSON.stringify([
        '360-degree hot air convection cooks food evenly with low oil usage',
        'Supports up to 24-hour scheduled cooking via smart app settings',
        'Double-layer non-stick coating grid makes cleaning simple and swift',
        'Versatile temperature control handles yogurt fermentation and dehydrating'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p23.id, size: '3.5L', color: 'White', stock: 35, sku: 'XI-AF-3.5L-WHT' } });

  // Product 24: L'Oreal Hyaluronic Acid Serum
  const p24 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catBeauty.id,
      name: 'L\'Oreal Paris Revitalift Hyaluronic Acid Serum',
      slug: 'loreal-hyaluronic-acid-serum',
      description: 'Intensifies skin hydration. Formulated with 1.5% Hyaluronic Acid, this lightweight face serum absorbs quickly, replumps fine lines, and leaves skin looking radiant and smooth.',
      price: 999.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.4,
      badge: 'Best Seller',
      brand: 'L\'Oreal Paris',
      color: 'Transparent',
      specifications: JSON.stringify({
        'Volume': '30 ml',
        'Skin Type': 'All Skin Types',
        'Key Ingredient': '1.5% Hyaluronic Acid',
        'Format': 'Liquid Dropper Bottle',
        'Warranty': '100% Genuine Product Promise'
      }),
      features: JSON.stringify([
        '1.5% pure Hyaluronic Acid visibly replumps skin in 1 week',
        'Fragrance-free, paraben-free, synthetic dye-free formula',
        'Lightweight liquid gel texture absorbs quickly without sticky residues',
        'Dermatologist tested and approved for sensitive skin application'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p24.id, size: '30ml', color: 'Transparent', stock: 150, sku: 'LO-HAS-30ML' } });

  // Product 25: Forest Essentials Face Cream
  const p25 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catBeauty.id,
      name: 'Forest Essentials Soundarya Radiance Cream',
      slug: 'forest-essentials-soundarya-cream',
      description: 'Premium Ayurvedic skin care. Soundarya Radiance Cream is an exceptionally rich formulation featuring 24 Karat Gold Bhasma, pure saffron extracts, and organic sweet almond oil.',
      price: 2750.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.7,
      badge: 'Trending',
      brand: 'Forest Essentials',
      color: 'Gold Tint',
      specifications: JSON.stringify({
        'Volume': '50 grams',
        'Formulation': 'Ayurvedic Radiance Cream',
        'Key Ingredients': '24K Gold Bhasma, Saffron, Almond Oil',
        'Packaging': 'Luxury Glass Jar',
        'Warranty': 'Authentic Ayurvedic Formulation'
      }),
      features: JSON.stringify([
        'Infused with 24K Gold Bhasma to restore skin elasticity and glow',
        'Organic cold-pressed oils supply deep hydration and anti-aging benefits',
        'SPF 25 helps protect face skin from harmful solar UV damage',
        'Free from synthetic parabens, colorants, and petrochemicals'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p25.id, size: '50g', color: 'Gold Tint', stock: 45, sku: 'FE-SRC-50G' } });

  // Product 26: Organic India Tulsi Tea
  const p26 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catGrocery.id,
      name: 'Organic India Tulsi Green Tea Classic (100g)',
      slug: 'organic-india-tulsi-green-tea',
      description: 'Boost immunity and reduce stress with Organic India Tulsi Green Tea. A signature blend of Krishna, Rama, and Vana Tulsi leaves combined with fine organic green tea.',
      price: 250.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.6,
      badge: 'Best Seller',
      brand: 'Organic India',
      color: 'Green Tea',
      specifications: JSON.stringify({
        'Net Weight': '100 grams',
        'Container': 'Tin Can Package',
        'Ingredients': 'Rama, Krishna, Vana Tulsi & Green Tea',
        'Organic Certified': 'Yes (USDA Organic & India Organic)',
        'Warranty': '100% Organic & FSSAI Approved'
      }),
      features: JSON.stringify([
        'Contains abundant natural antioxidants that capture free radicals',
        'Soothes respiratory passages and aids daily digestive health',
        'Caffeine-balanced boost offers stress relief without crashes',
        'Sealed in a premium reusable tin to preserve herbal aroma freshness'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p26.id, size: '100g', color: 'Green Tea', stock: 200, sku: 'OI-TGT-100G' } });

  // Product 27: Tata Sampann Pure Almonds
  const p27 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catGrocery.id,
      name: 'Tata Sampann Premium California Almonds (500g)',
      slug: 'tata-sampann-california-almonds',
      description: 'Deliciously crunchy and high-quality California almonds selected for uniform size. Rich source of Vitamin E, dietary fiber, and healthy monounsaturated fats.',
      price: 699.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.5,
      badge: 'Best Seller',
      brand: 'Tata Sampann',
      color: 'Natural Brown',
      specifications: JSON.stringify({
        'Net Weight': '500 grams',
        'Origin': 'California, USA',
        'Packaging Type': 'Zipper Stand Up Pouch',
        'Grade': 'Premium Choice grade',
        'Warranty': 'Strict Quality Selection'
      }),
      features: JSON.stringify([
        'Carefully graded almonds with uniform size and no chemical bleaching',
        'Packed in a hygienic ziplock bag to retain crunchiness',
        'Excellent plant-based source of protein and heart-healthy fats',
        'Perfect for snacking, baking, or morning nutrient supplements'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p27.id, size: '500g', color: 'Natural Brown', stock: 120, sku: 'TS-CA-500G' } });

  // Product 28: Atomic Habits by James Clear
  const p28 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catBooks.id,
      name: 'Atomic Habits by James Clear (Paperback)',
      slug: 'atomic-habits-james-clear',
      description: 'The landmark self-help book. Learn how tiny changes can lead to remarkable results. James Clear offers practical strategies to build good habits and break bad ones.',
      price: 450.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.9,
      badge: 'Best Seller',
      brand: 'Penguin Books',
      color: 'Paperback Cover',
      specifications: JSON.stringify({
        'Author': 'James Clear',
        'Format': 'Paperback edition',
        'Language': 'English',
        'Pages': '320 pages',
        'Publisher': 'Penguin Random House',
        'Warranty': '100% Original Paperback Copy'
      }),
      features: JSON.stringify([
        'Millions of copies sold worldwide with transformative life impact',
        'Includes simple frameworks to redesign habit systems easily',
        'Features real-life success examples from sports, business, and science',
        'Printed on high-quality eco-friendly cream publication paper'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p28.id, size: 'Standard', color: 'Paperback Cover', stock: 100, sku: 'BK-AH-JC-PB' } });

  // Product 29: The Psychology of Money
  const p29 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catBooks.id,
      name: 'The Psychology of Money by Morgan Housel',
      slug: 'the-psychology-of-money-housel',
      description: 'Timeless lessons on wealth, greed, and happiness. Morgan Housel shares 19 short stories exploring the strange ways people think about money and how to make better financial decisions.',
      price: 399.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1592492159418-09f31330c6cd?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.8,
      badge: 'Trending',
      brand: 'Jaico Publishing',
      color: 'Paperback Cover',
      specifications: JSON.stringify({
        'Author': 'Morgan Housel',
        'Format': 'Paperback edition',
        'Language': 'English',
        'Pages': '252 pages',
        'Publisher': 'Jaico Publishing House',
        'Warranty': '100% Genuine Publisher Print'
      }),
      features: JSON.stringify([
        'Highly recommended reading by leading global investors and CEOs',
        'Easy-to-read narrative style with deep insights',
        'Explores how emotional intelligence beats technical finance knowledge',
        'Concise 19-chapter structure ideal for busy readers'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p29.id, size: 'Standard', color: 'Paperback Cover', stock: 80, sku: 'BK-PM-MH-PB' } });

  // Product 30: Decathlon Road Bike
  const p30 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catSports.id,
      name: 'Triban RC100 Road Bike (Decathlon, Medium)',
      slug: 'triban-rc100-road-bike',
      description: 'Designed for beginners starting road cycling. Features a lightweight 6061 aluminum frame, Shimano 7-speed shifter gears, rigid steel fork, and hybrid terrain puncture-resistant tires.',
      price: 34999.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.6,
      badge: 'Limited Stock',
      brand: 'Triban (Decathlon)',
      color: 'Slate Grey',
      specifications: JSON.stringify({
        'Frame': '6061 Aluminum Alloy Frame',
        'Gears': 'Shimano 7-Speed Indexed Shifting',
        'Brakes': 'Tektro Tek-Dual pivot calipers',
        'Weight': '11.3 kg (Medium size)',
        'Warranty': 'Lifetime frame warranty by Decathlon'
      }),
      features: JSON.stringify([
        'Highly versatile frame geometry optimized for comfortable endurance rides',
        'Shimano 7-speed handlebar shifters make gear shifting seamless',
        'Double-walled aluminum rims withstand tough Indian potholed streets',
        'Includes mounts for mudguards and rear pannier racks'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p30.id, size: 'Medium', color: 'Slate Grey', stock: 5, sku: 'DC-T100-MED-GRY' } });

  // Product 31: 70mai Dash Cam
  const p31 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catAutomotive.id,
      name: '70mai Pro Plus+ Dash Cam (A500S)',
      slug: '70mai-pro-plus-dash-cam',
      description: 'The ultimate smart car companion featuring 2.7K Ultra HD recording, built-in GPS, Advanced Driver Assistance Systems (ADAS), and 24-hour parking surveillance mode.',
      price: 6499.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.5,
      badge: 'New',
      brand: '70mai',
      color: 'Black',
      specifications: JSON.stringify({
        'Resolution': '2.7K Ultra HD',
        'Field of View': '140 degrees',
        'Screen': '2.0 inch IPS',
        'GPS': 'Built-in GPS & Glonass',
        'Warranty': '1 Year Brand Warranty'
      }),
      features: JSON.stringify([
        'Advanced Driver Assistance System (ADAS) alerts for lane departure and collision safety',
        '24-Hour Parking Surveillance automatically starts recording upon G-sensor impacts',
        'Dual-channel front and rear recording capability with night-vision clarity',
        'Mobile app control via built-in Wi-Fi for easy video downloads and playback'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p31.id, size: 'Standard', color: 'Black', stock: 40, sku: '70-DPRO-BLK' } });

  // Product 32: Honeywell Car Air Purifier
  const p32 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catAutomotive.id,
      name: 'Honeywell Move Pure Car Air Purifier (Black)',
      slug: 'honeywell-move-pure-car-purifier',
      description: 'Keep your car cabin fresh and allergen-free with high efficiency HEPA filtration, multi-layer active carbon filter, and low noise operations.',
      price: 3299.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.3,
      badge: 'Trending',
      brand: 'Honeywell',
      color: 'Black',
      specifications: JSON.stringify({
        'Filter Type': 'HEPA + Activated Carbon Filter',
        'Clean Air Delivery Rate': '12 m3/h',
        'Noise Level': '< 49 dB',
        'Power Consumption': '8 Watts',
        'Warranty': '1 Year Manufacturer Warranty'
      }),
      features: JSON.stringify([
        'High efficiency HEPA filter removes PM2.5 and harmful micro-particles',
        'Smart filter replacement indicator light prompts for timely filter changes',
        'Two fan speed modes allow rapid cabin purification or silent maintenance',
        'Easy strap-on installation on dashboard, armrest, or headrests'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p32.id, size: 'Standard', color: 'Black', stock: 25, sku: 'HW-MP-BLK' } });

  // Product 33: Yonex Badminton Racket
  const p33 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catSports.id,
      name: 'Yonex Nanoray 18i Graphite Badminton Racket',
      slug: 'yonex-nanoray-18i-racket',
      description: 'Ultra-lightweight graphite badminton racket designed for rapid speed and swift swings. Highlights aerodynamic box frame and nano-mesh carbon nanotube shaft.',
      price: 1899.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.5,
      badge: 'Best Seller',
      brand: 'Yonex',
      color: 'Black',
      specifications: JSON.stringify({
        'Frame Material': 'Carbon Graphite',
        'Shaft Material': 'Carbon Graphite',
        'Weight / Grip': '5U (75-79 grams) / G4',
        'Tension Strength': 'Up to 24-30 lbs',
        'Warranty': 'No warranty on pre-strung cords'
      }),
      features: JSON.stringify([
        'Aero-box frame structure minimizes air resistance for quick smash preparation',
        'Nanomesh and Carbon Nanotube construction delivers powerful bounce speed',
        'Built-in T-Joint joins shaft and frame securely for head stability',
        'Includes premium full zip-up racket head cover bag'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p33.id, size: 'Standard', color: 'Black', stock: 50, sku: 'YX-NR18-BLK' } });

  // Product 34: Nivia Storm Football
  const p34 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catSports.id,
      name: 'Nivia Storm Rubber Football (Size 5)',
      slug: 'nivia-storm-football-size-5',
      description: 'Durable rubberized hand-stitched football built for hard grounds, concrete surfaces, and wet weather conditions.',
      price: 549.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.2,
      badge: 'Trending',
      brand: 'Nivia',
      color: 'White',
      specifications: JSON.stringify({
        'Size': '5 (Match Standard Sizing)',
        'Outer Panel': 'Durable Rubberized Cover',
        'Inner Bladder': 'High-retention Butyl Bladder',
        'Stitch Style': '32-Panel Hand Stitched',
        'Warranty': 'No Manufacturer Warranty'
      }),
      features: JSON.stringify([
        'Robust hand-stitched panel structure ensures high roundness retention',
        'Heavy-duty rubber material designed specifically for hard street grounds',
        'Butyl bladder prevents air leakage to maintain pressure for weeks',
        'Excellent bounce and rebound control for casual match play'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p34.id, size: 'Size 5', color: 'White', stock: 100, sku: 'NV-ST5-WHT' } });

  // Product 35: Decathlon Yoga Mat
  const p35 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catSports.id,
      name: 'Decathlon Domyos Essential Yoga Mat (6mm, Blue)',
      slug: 'decathlon-yoga-mat-6mm',
      description: 'Comfortable, lightweight, and high-grip yoga mat with 6mm thickness to cushion joints during yoga, pilates, or floor fitness exercises.',
      price: 899.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.6,
      badge: 'New',
      brand: 'Decathlon',
      color: 'Blue',
      specifications: JSON.stringify({
        'Thickness': '6mm Cushioning',
        'Material': 'Eco-friendly TPE/PVC-free foam',
        'Dimensions': '180 cm x 60 cm',
        'Weight': '800 grams',
        'Warranty': '2 Years Decathlon Warranty'
      }),
      features: JSON.stringify([
        'High-traction textured grip prevents slipping during sweaty sessions',
        '6mm thickness provides protective cushioning for knees, elbows, and ankles',
        'Lightweight roll-up structure with double carrier strap loops included',
        'Waterproof surface allows quick washing and easy wipe maintenance'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p35.id, size: '6mm', color: 'Blue', stock: 60, sku: 'DC-YM6-BLU' } });

  // Product 36: Thinking, Fast and Slow Book
  const p36 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catBooks.id,
      name: 'Thinking, Fast and Slow by Daniel Kahneman (Paperback)',
      slug: 'thinking-fast-and-slow-kahneman',
      description: 'The revolutionary book on behavioral economics and cognitive psychology. Daniel Kahneman outlines the two systems that drive our thoughts: fast, intuitive thinking, and slow, deliberate logic.',
      price: 499.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.9,
      badge: 'Best Seller',
      brand: 'Farrar, Straus and Giroux',
      color: 'Paperback Cover',
      specifications: JSON.stringify({
        'Author': 'Daniel Kahneman',
        'Format': 'Paperback',
        'Pages': '499 pages',
        'Language': 'English',
        'Publisher': 'Farrar, Straus and Giroux',
        'Warranty': '100% Genuine Copy'
      }),
      features: JSON.stringify([
        'Detailed exploration of cognitive biases and human judgment systems',
        'Written by Nobel Prize Winner in Economics Daniel Kahneman',
        'Provides practical insights to recognize errors in daily decision-making',
        'A global bestseller recommended by top business experts'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p36.id, size: 'Paperback', color: 'Paperback Cover', stock: 75, sku: 'BK-TFS-DK' } });

  // Product 37: Sapiens Book
  const p37 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catBooks.id,
      name: 'Sapiens: A Brief History of Humankind (Paperback)',
      slug: 'sapiens-brief-history-harari',
      description: 'Yuval Noah Harari explores the history of humankind from the Stone Age to the twenty-first century, analyzing the cognitive, agricultural, and scientific revolutions.',
      price: 420.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.8,
      badge: 'Trending',
      brand: 'Harvill Secker',
      color: 'Paperback Cover',
      specifications: JSON.stringify({
        'Author': 'Yuval Noah Harari',
        'Format': 'Paperback',
        'Pages': '512 pages',
        'Language': 'English',
        'Publisher': 'Harvill Secker',
        'Warranty': '100% Genuine Publisher Print'
      }),
      features: JSON.stringify([
        'Fascinating review of human biology, sociology, and anthropology',
        'Recommended reading by Barack Obama, Bill Gates, and Mark Zuckerberg',
        'Explores how shared myths and corporations shaped modern civilizations',
        'Engaging style written for general audiences and history enthusiasts'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p37.id, size: 'Paperback', color: 'Paperback Cover', stock: 90, sku: 'BK-SAP-YH' } });

  // Product 38: Deep Work Book
  const p38 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catBooks.id,
      name: 'Deep Work by Cal Newport (Paperback)',
      slug: 'deep-work-cal-newport',
      description: 'Rules for focused success in a distracted digital world. Cal Newport presents an engaging guide on how to master the art of intense focus for professional breakthroughs.',
      price: 349.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.7,
      badge: 'New',
      brand: 'Grand Central Publishing',
      color: 'Paperback Cover',
      specifications: JSON.stringify({
        'Author': 'Cal Newport',
        'Format': 'Paperback',
        'Pages': '304 pages',
        'Language': 'English',
        'Publisher': 'Grand Central Publishing',
        'Warranty': '100% Genuine Copy'
      }),
      features: JSON.stringify([
        'Teaches practical rules to train cognitive focus capabilities',
        'Contrasts high-value deep focus against shallow administrative tasks',
        'Essential guidelines to limit social media and digital distractions',
        'Proven productivity strategy for students, writers, and engineers'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p38.id, size: 'Paperback', color: 'Paperback Cover', stock: 50, sku: 'BK-DW-CN' } });

  // Product 39: Nescafe Gold Coffee
  const p39 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catGrocery.id,
      name: 'Nescafe Gold Premium Freeze-Dried Instant Coffee (100g)',
      slug: 'nescafe-gold-coffee-100g',
      description: 'Indulge in the rich taste of premium freeze-dried instant coffee, carefully crafted with Arabica and Robusta coffee beans.',
      price: 599.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.6,
      badge: 'Best Seller',
      brand: 'Nescafe',
      color: 'Gold Glass Jar',
      specifications: JSON.stringify({
        'Net Weight': '100 grams',
        'Container Type': 'Glass Jar',
        'Roast Intensity': 'Medium Roast',
        'Form Factor': 'Freeze-Dried Granules',
        'Warranty': 'FSSAI Registered Food Product'
      }),
      features: JSON.stringify([
        'Arabica and Robusta blend provides rich aroma and smooth golden taste',
        'Premium freeze-dry preservation retains natural coffee flavor oils',
        'Simple preparation: just add hot milk or water and stir gently',
        'Airtight glass container preserves fresh bean aroma for months'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p39.id, size: '100g', color: 'Gold Glass Jar', stock: 150, sku: 'NS-GOLD-100G' } });

  // Product 40: Happilo Almonds
  const p40 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catGrocery.id,
      name: 'Happilo Premium California Almonds (200g Pouch)',
      slug: 'happilo-california-almonds-200g',
      description: 'Hand-picked, raw, and high-quality California almonds, packed with protein, healthy fats, and antioxidants. Ideal for healthy daily snacking.',
      price: 299.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.4,
      badge: 'Trending',
      brand: 'Happilo',
      color: 'Brown',
      specifications: JSON.stringify({
        'Net Weight': '200 grams',
        'Package Type': 'Resealable Zipper Stand-Up Pouch',
        'Almond Grade': 'Premium Choice Grade',
        'Preservatives': 'Zero chemical bleaching or preservatives',
        'Warranty': 'FSSAI Approved Product'
      }),
      features: JSON.stringify([
        'Excellent natural source of Vitamin E, proteins, and dietary fiber',
        'Cholesterol-free and trans-fat-free heart healthy dry fruit snacks',
        'Hygienic resealable pouch keeps almonds crunchy and fresh longer',
        'Vegan and gluten-free snack option perfect for active lifestyles'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p40.id, size: '200g', color: 'Brown', stock: 180, sku: 'HP-ALM-200G' } });

  // Product 41: Derma Co Niacinamide Serum
  const p41 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catBeauty.id,
      name: 'The Derma Co 10% Niacinamide Face Serum (30ml)',
      slug: 'derma-co-niacinamide-serum',
      description: 'Dermatologist-tested face serum with 10% Niacinamide and Zinc PCA, formulated to reduce acne marks, clear dark spots, and control oily sebum.',
      price: 549.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.5,
      badge: 'Best Seller',
      brand: 'The Derma Co',
      color: 'Transparent',
      specifications: JSON.stringify({
        'Volume': '30 ml',
        'Skin Suitability': 'Acne-Prone & Excessively Oily Skin',
        'Active Components': '10% Niacinamide + 1% Zinc PCA',
        'Packaging Type': 'UV-protective Glass Dropper Bottle',
        'Warranty': 'Dermatologist Tested Safe'
      }),
      features: JSON.stringify([
        'Niacinamide fades acne scars and promotes even skin tone',
        'Zinc PCA regulates oily sebum secretion to prevent future breakouts',
        'Lightweight, non-sticky liquid drops absorb instantly into pores',
        'Paraben-free, sulfate-free, and mineral-oil-free clean beauty formula'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p41.id, size: '30ml', color: 'Transparent', stock: 120, sku: 'TD-NIA-30ML' } });

  // Product 42: Neutrogena Hydro Boost Gel
  const p42 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catBeauty.id,
      name: 'Neutrogena Hydro Boost Water Gel Moisturizer (50g)',
      slug: 'neutrogena-hydro-boost-gel',
      description: 'Provide your skin with a boost of intense hydration. Unique lightweight water gel moisturizer formulated with Hyaluronic Acid for plump and glowing skin.',
      price: 950.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.7,
      badge: 'Trending',
      brand: 'Neutrogena',
      color: 'Blue',
      specifications: JSON.stringify({
        'Net Weight': '50 grams',
        'Skin Match': 'Dry, Normal, Dehydrated Skin',
        'Formula Type': 'Lightweight Water Gel Cream',
        'Key Actives': 'Purified Hyaluronic Acid + Olive Extract',
        'Warranty': '100% Genuine Import Guarantee'
      }),
      features: JSON.stringify([
        'Provides 72 hours of continuous intense hydration locks',
        'Featherlight water gel absorbs instantly without pore clogging',
        'Hyaluronic acid acts as a sponge to hold up to 1000x its weight in water',
        '100% oil-free, non-comedogenic, and alcohol-free dermatologist recommendation'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p42.id, size: '50g', color: 'Blue', stock: 85, sku: 'NT-HBG-50G' } });

  // Product 43: Levi's Slim Fit Jeans
  const p43 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catClothing.id,
      name: 'Levi\'s Men\'s 511 Slim Fit Stretchable Jeans (Blue)',
      slug: 'levis-511-slim-fit-jeans',
      description: 'Modern slim fit stretch denim jeans. Sits below the waist with a slim leg from hip to ankle for a clean, tailored profile.',
      price: 2299.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.4,
      badge: 'Best Seller',
      brand: 'Levi\'s',
      color: 'Blue',
      specifications: JSON.stringify({
        'Material': '98% Premium Cotton, 2% Elastane',
        'Fit': 'Slim Fit',
        'Rise': 'Low Rise (Sits below waist)',
        'Denim Stretch': 'Active Stretch Denim Blend',
        'Warranty': '15 Days Brand Exchange Window'
      }),
      features: JSON.stringify([
        'Tailored slim silhouette provides a modern alternative to skinny jeans',
        'Cotton-elastane blend ensures comfortable flexibility and shape retention',
        'Classic 5-pocket design with signature Arcuate stitching on rear pockets',
        'Heavy-duty copper rivets and zip fly with metal button closure'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p43.id, size: '32-Inch', color: 'Blue', stock: 40, sku: 'LV-511-BLU-32' } });

  // Product 44: Tommy Hilfiger Polo T-Shirt
  const p44 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catClothing.id,
      name: 'Tommy Hilfiger Solid Cotton Polo T-Shirt (Red)',
      slug: 'tommy-hilfiger-polo-tshirt',
      description: 'Premium organic cotton pique polo shirt featuring half sleeves, regular fit, double button placket, and embroidered flag logo.',
      price: 1799.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.6,
      badge: 'Trending',
      brand: 'Tommy Hilfiger',
      color: 'Red',
      specifications: JSON.stringify({
        'Material': '100% Organic Pique Cotton',
        'Fit': 'Regular Comfort Fit',
        'Sleeve Type': 'Short Sleeve (Ribbed Cuff)',
        'Neck Style': 'Polo Neck Collar',
        'Warranty': 'Exchangeable within brand policies'
      }),
      features: JSON.stringify([
        'Highly breathable organic pique cotton knit keeps body cool and dry',
        'Classic Tommy Hilfiger flag logo embroidery details on chest front',
        'Sturdy flat-knit collar and sleeve bands prevent fabric roll-up',
        'Perfect match for smart-casual events paired with khaki trousers or shorts'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p44.id, size: 'Large', color: 'Red', stock: 55, sku: 'TH-PL-RED-L' } });

  // Product 45: Crocs Classic Clogs
  const p45 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catFootwear.id,
      name: 'Crocs Unisex Classic Water-Friendly Clogs (Navy)',
      slug: 'crocs-classic-clogs-navy',
      description: 'Slip into your favorite clog and enjoy a custom fit, water-friendly design, and ventilated forefoot for maximum comfort and breathability.',
      price: 2695.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.5,
      badge: 'Best Seller',
      brand: 'Crocs',
      color: 'Blue',
      specifications: JSON.stringify({
        'Material': 'Croslite Closed-Cell Foam Resin',
        'Closure': 'Slip-On with pivoting heel strap',
        'Weight': 'Featherlight (< 150g per shoe)',
        'Waterproof': '100% Buoyant and Water-friendly',
        'Warranty': '3 Months Brand Warranty'
      }),
      features: JSON.stringify([
        'Fully-molded Croslite foam padding offers signature cushion comfort',
        'Front ventilation ports improve breathability and drain out water debris',
        'Pivoting heel strap offers options for secure fit or casual slide-on',
        'Odor-resistant, easy to clean, and extremely rapid drying'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p45.id, size: 'UK-9', color: 'Navy Blue', stock: 70, sku: 'CR-CC-NVY-09' } });

  // Product 46: Pigeon Electric Kettle
  const p46 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catHomeKitchen.id,
      name: 'Pigeon Amaze Plus Stainless Steel Electric Kettle (1.5L)',
      slug: 'pigeon-amaze-plus-electric-kettle',
      description: 'Prepare hot water, instant tea, coffee, or oatmeal in minutes. Equipped with 1500W heating element, stainless steel body, and auto shut-off safety.',
      price: 599.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1594385208974-2e75f9d8a8be?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.3,
      badge: 'Best Seller',
      brand: 'Pigeon',
      color: 'Silver',
      specifications: JSON.stringify({
        'Power': '1500 Watts',
        'Capacity': '1.5 Litres',
        'Body Material': 'Stainless Steel',
        'Base': '360 degree cordless power base',
        'Warranty': '1 Year Pigeon Brand Warranty'
      }),
      features: JSON.stringify([
        'Fast 1500W heating plate boils full capacity water in under 5 minutes',
        'Automatic power cut-off prevents heating elements from dry running',
        '360-degree rotating base allows convenient cordless pickup and placement',
        'Ergonomic cool-touch handle with single press lid release button'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p46.id, size: '1.5L', color: 'Silver', stock: 150, sku: 'PG-KTL-1.5' } });

  // Product 47: Kent Egg Boiler
  const p47 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catHomeKitchen.id,
      name: 'Kent Instant Stainless Steel Egg Boiler (150W)',
      slug: 'kent-instant-egg-boiler',
      description: 'Boil up to 7 eggs at a time with custom yolk hardness. Features stainless steel heating plate and three automatic boiling modes.',
      price: 999.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.5,
      badge: 'Trending',
      brand: 'Kent',
      color: 'Silver',
      specifications: JSON.stringify({
        'Power Rating': '150 Watts',
        'Capacity': '7 Eggs simultaneously',
        'Boil Controls': '3 Modes (Soft, Medium, Hard)',
        'Heating Surface': 'Stainless Steel Plate',
        'Warranty': '1 Year Kent Warranty'
      }),
      features: JSON.stringify([
        'Boils 7 eggs at once within 10 minutes based on water quantity indicator',
        '3 pre-measured boiling modes yield custom soft, medium, or hard yolk textures',
        'Automated power-off shuts down boiling instantly upon dry completion',
        'Overheating auto shut-off protector triggers safety backups'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p47.id, size: '7-Egg', color: 'Silver', stock: 80, sku: 'KT-EBL-150' } });

  // Product 48: Sony BRAVIA 55-inch TV
  const p48 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catElectronics.id,
      name: 'Sony BRAVIA 55-inch 4K Ultra HD Smart Google TV',
      slug: 'sony-bravia-55-4k-google-tv',
      description: 'Experience stunning 4K clarity with the X1 Processor, immersive Dolby Audio speakers, Google Assistant hands-free search, and sleek narrow bezel design.',
      price: 51990.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.8,
      badge: 'Best Seller',
      brand: 'Sony',
      color: 'Black',
      specifications: JSON.stringify({
        'Screen Size': '55 Inches (139 cm)',
        'Resolution': '4K Ultra HD (3840 x 2160)',
        'Operating System': 'Google TV with Play Store',
        'Sound Output': '20 Watts with Dolby Audio',
        'Warranty': '1 Year Manufacturer Warranty'
      }),
      features: JSON.stringify([
        'X1 4K Processor reduces pixel noise and boosts color contrast details',
        'Google TV lists curated movie and show suggestions from your subscriptions',
        'Dolby Audio and Open Baffle Speakers produce high fidelity spatial sound',
        'Narrow bezel construction maximizes screen viewing area dimensions'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p48.id, size: '55-Inch', color: 'Black', stock: 20, sku: 'SN-TV55-4K' } });

  // Product 49: Bose QC Earbuds
  const p49 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catElectronics.id,
      name: 'Bose QuietComfort Wireless Noise Cancelling Earbuds',
      slug: 'bose-quietcomfort-wireless-earbuds',
      description: 'Compact wireless earbuds with active noise cancellation, custom audio tuning, up to 24 hours of playback, and IPX4 sweat resistance.',
      price: 18990.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.7,
      badge: 'Trending',
      brand: 'Bose',
      color: 'Black',
      specifications: JSON.stringify({
        'NC Type': 'Active Noise Cancellation (Quiet/Aware)',
        'Battery Capacity': '6 hours buds (18 hours in charging case)',
        'Water Rating': 'IPX4 Sweat and Splash Proof',
        'Bluetooth Spec': 'Version 5.3 Low Energy',
        'Warranty': '1 Year Bose India Warranty'
      }),
      features: JSON.stringify([
        'Legendary active noise cancellation blocks environmental disturbances instantly',
        'CustomTune technology auto-tunes audio performance to your unique ear canal shape',
        'Super soft silicone ear tips offer stable comfort fit during physical exercises',
        'Smart touch sensors manage calls, volume levels, and active noise modes'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p49.id, size: 'Standard', color: 'Black', stock: 45, sku: 'BS-QC-BLK' } });

  // Product 50: Realme GT 6T
  const p50 = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      categoryId: catSmartphones.id,
      name: 'Realme GT 6T (Fluid Silver, 256GB)',
      slug: 'realme-gt-6t-fluid-silver',
      description: 'Performance flagship featuring Snapdragon 7+ Gen 3 processor, 120W SuperVOOC rapid charger, 6000 nits LTPO AMOLED display, and 50MP Sony OIS main camera.',
      price: 29999.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80'
      ]),
      ratings: 4.6,
      badge: 'New',
      brand: 'Realme',
      color: 'Silver',
      specifications: JSON.stringify({
        'Processor': 'Snapdragon 7+ Gen 3',
        'RAM Memory': '12GB LPDDR5X',
        'Storage Drive': '256GB UFS 4.0',
        'Display Panel': '6.78 inch LTPO AMOLED 120Hz',
        'Fast Charging': '120W SuperVOOC with 5500mAh',
        'Warranty': '1 Year Brand Warranty'
      }),
      features: JSON.stringify([
        'High performance Snapdragon 7+ Gen 3 chip is ideal for gaming and streaming',
        '6000 nits peak brightness display ensures visible readability under direct sunlight',
        '120W SuperVOOC charger refills 100% battery capacity in 26 minutes flat',
        'Sony 50MP primary sensor with OIS records stable high-detail 4K movies'
      ])
    }
  });
  await prisma.productVariant.create({ data: { productId: p50.id, size: '256GB', color: 'Fluid Silver', stock: 35, sku: 'RL-GT6T-SLV' } });

  console.log('🛍️ Created 50 realistic Indian products with specifications & variants');

  // 6. Seed reviews
  await prisma.review.createMany({
    data: [
      { productId: p1.id, userId: customerUser.id, rating: 5, comment: 'Amazing shopping experience and fast delivery. OnePlus 13 performance is absolute beast!' },
      { productId: p4.id, userId: customerUser.id, rating: 5, comment: 'Excellent seller support and secure checkout. ANC on WH-1000XM6 is top tier!' },
      { productId: p6.id, userId: customerUser.id, rating: 5, comment: 'Professional platform with genuine products. Extremely satisfied with my MacBook Air M5!' }
    ]
  });

  // 7. Seed coupons
  await prisma.coupon.createMany({
    data: [
      { code: 'SAVE20', discountType: 'PERCENTAGE', value: 20, expiryDate: new Date(Date.now() + 30 * 24 * 3600 * 1000), usageLimit: 200, minOrderValue: 500.0 },
      { code: 'FLAT50', discountType: 'FIXED', value: 50, expiryDate: new Date(Date.now() + 30 * 24 * 3600 * 1000), usageLimit: 100, minOrderValue: 2000.0 },
      { code: 'NEWUSER', discountType: 'PERCENTAGE', value: 15, expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000), usageLimit: 1000, minOrderValue: 0.0 }
    ]
  });

  console.log('🎟️ Created promo coupons: SAVE20, FLAT50, NEWUSER');
  console.log('🌱 Database Seeding: Successfully Completed!');
}

main()
  .catch((e) => {
    console.error('Seeding script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
