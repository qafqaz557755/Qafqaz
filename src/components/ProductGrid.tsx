import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { Plus, Minus, Heart, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { collection, query, orderBy, onSnapshot, limit as fsLimit, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';

interface ProductCardProps {
  key?: string;
  product: Product;
  onClick: (product: Product) => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const { items, addToCart, updateQuantity, toggleWishlist, isInWishlist } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const cartItem = items.find(item => item.id === product.id);
  const quantity = cartItem?.quantity || 0;
  const isWishlisted = isInWishlist(product.id);
  const mainImage = product.images?.[0] || product.image || 'https://images.unsplash.com/photo-1584346133934-a3afd2a33c4c?q=80&w=800';

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/auth');
      return;
    }
    toggleWishlist(product.id);
  };

  const handleCartAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Cart Add Clicked for", product.name);
    addToCart(product);
  };

  const handleQtyUpdate = (e: React.MouseEvent, newQty: number) => {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(product.id, newQty);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group flex flex-col gap-3 relative"
    >
      <div 
        onClick={() => onClick(product)}
        className="relative aspect-square overflow-hidden bg-white rounded-3xl shadow-sm border border-black/5 group-hover:shadow-xl transition-all duration-500 cursor-pointer"
      >
        <img
          src={mainImage}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        
        {/* Wishlist Button */}
        <button 
          onClick={handleWishlist}
          className="absolute top-3 right-3 w-10 h-10 bg-white/80 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-sm border border-black/5 hover:scale-110 active:scale-95 transition-all z-20"
        >
          <Heart 
            className={cn(
              "w-5 h-5 transition-colors",
              isWishlisted ? "fill-red-500 text-red-500" : "text-charcoal/40"
            )} 
          />
        </button>

        <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
          <div className="bg-white/80 backdrop-blur-md px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest text-charcoal/60 w-fit">
            {product.category}
          </div>
          <div className={cn(
            "px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest w-fit shadow-sm",
            product.stock > 0 ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
          )}>
            Stokda: {product.stock} ədəd
           </div>
           {product.videoUrl && (
             <div className="bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest w-fit shadow-sm flex items-center gap-1 border border-brand-blue/20">
               <Video size={8} /> Video
             </div>
           )}
         </div>
      </div>
      
        <div className="flex flex-col gap-1 px-1">
        <h3 
          onClick={() => onClick(product)}
          className="text-sm md:text-base font-semibold text-charcoal leading-tight truncate group-hover:text-brand-blue transition-colors cursor-pointer"
        >
          {product.name}
        </h3>
        
        <div className="flex flex-col gap-3 mt-2">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onClick(product)}>
            {product.discountPrice && product.discountPrice > 0 ? (
              <>
                <span className="text-base md:text-lg font-black text-brand-blue tabular-nums">
                  {product.discountPrice.toFixed(2)} ₼
                </span>
                <span className="text-xs text-charcoal/30 line-through tabular-nums font-medium">
                  {product.price.toFixed(2)} ₼
                </span>
              </>
            ) : (
              <span className="text-base md:text-lg font-black text-charcoal tabular-nums">
                {product.price.toFixed(2)} ₼
              </span>
            )}
          </div>
          
          <div className="h-11 relative z-30">
            <AnimatePresence mode="wait">
              {quantity === 0 ? (
                <motion.button
                  key="add-btn"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={handleCartAdd}
                  className="w-full h-full flex items-center justify-center bg-brand-blue text-white rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-brand-blue/20 hover:shadow-brand-blue/40 transition-all active:scale-95"
                >
                  Səbətə əlavə et
                </motion.button>
              ) : (
                <motion.div
                  key="quantity-selector"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full h-full flex items-center justify-between bg-off-white rounded-2xl p-1 border border-black/5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => handleQtyUpdate(e, quantity - 1)}
                    className="w-9 h-9 flex items-center justify-center bg-white rounded-xl shadow-sm text-charcoal active:scale-90 transition-transform"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="font-bold text-sm tabular-nums">{quantity}</span>
                  <button
                    onClick={(e) => handleQtyUpdate(e, quantity + 1)}
                    className="w-9 h-9 flex items-center justify-center bg-white rounded-xl shadow-sm text-charcoal active:scale-90 transition-transform"
                  >
                    <Plus size={16} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function ProductGrid({ onProductClick }: { onProductClick: (product: Product) => void }) {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayLimit, setDisplayLimit] = useState(12);

  useEffect(() => {
    const q = query(
      collection(db, 'products'), 
      fsLimit(displayLimit + 10)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (isAdmin) {
        console.log(`Fetched ${snapshot.docs.length} products from Firebase`);
      }
      
      const fetchedProducts = snapshot.docs
        .map(docSnap => {
          const data = docSnap.data();
          let createdAtDate = new Date(0);
          
          try {
            if (data.createdAt?.toDate) {
              createdAtDate = data.createdAt.toDate();
            } else if (data.createdAt instanceof Date) {
              createdAtDate = data.createdAt;
            } else if (typeof data.createdAt === 'string' || typeof data.createdAt === 'number') {
              createdAtDate = new Date(data.createdAt);
            }
          } catch (e) {
            console.error("Error parsing date for product", docSnap.id, e);
          }

          return {
            id: docSnap.id,
            ...data,
            image: data.images?.[0] || data.image || '',
            isHidden: data.isHidden ?? false,
            createdAt: createdAtDate
          } as Product;
        })
        .filter(p => isAdmin || !p.isHidden)
        .sort((a, b) => {
          const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
          const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, displayLimit);

      setProducts(fetchedProducts);
      setLoading(false);
    }, (error) => {
      console.error("Product fetch error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [displayLimit, isAdmin]);

  if (loading) return (
    <div className="max-w-7xl mx-auto px-6 py-24 text-center">
      <div className="w-12 h-12 border-4 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin mx-auto"></div>
    </div>
  );

  return (
    <section className="max-w-7xl mx-auto px-6 py-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight text-charcoal">
            Yeni Gələnlər
          </h2>
          <p className="text-charcoal/50 max-w-sm text-sm">
            Ən son texnologiya ilə hazırlanmış gigiyena məhsullarımızı kəşf edin.
          </p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => navigate('/products')}
            className="px-6 py-2 bg-charcoal text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-black transition-all"
          >
            Bütün Məhsullar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-8">
        {products.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product} 
            onClick={onProductClick}
          />
        ))}
      </div>

      {products.length >= displayLimit && (
        <div className="mt-20 flex justify-center">
          <button 
            onClick={() => setDisplayLimit(prev => prev + 8)}
            className="px-10 py-4 bg-white border border-black/5 rounded-full font-bold text-charcoal hover:bg-off-white transition-all shadow-sm active:scale-95"
          >
            Daha çox yüklə
          </button>
        </div>
      )}
    </section>
  );
}
