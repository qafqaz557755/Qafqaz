import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, Minus, Plus, ArrowLeft, ShoppingBag, Youtube, Play } from 'lucide-react';
import { cn } from '../lib/utils';
import { useCart } from '../context/CartContext';
import { doc, getDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from '../types';

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, updateQuantity, items } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const cartItem = items.find(item => item.id === id);
  
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!id) return;

    const fetchProduct = async () => {
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const productData = { id: docSnap.id, ...docSnap.data() } as Product;
          setProduct(productData);
          
          // Fetch similar
          const q = query(
            collection(db, 'products'), 
            where('category', '==', productData.category),
            where('isHidden', '==', false),
            limit(4)
          );
          const similarSnap = await getDocs(q);
          setSimilarProducts(
            similarSnap.docs
              .map(d => ({ id: d.id, ...d.data() } as Product))
              .filter(p => p.id !== id)
              .slice(0, 2)
          );
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!product) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 px-6">
        <h1 className="text-2xl font-bold text-charcoal">Məhsul tapılmadı.</h1>
        <button 
          onClick={() => navigate('/')}
          className="px-8 py-3 bg-brand-blue text-white rounded-full font-medium"
        >
          Ana səhifəyə qayıt
        </button>
      </div>
    );
  }

  const handleAddToCart = () => {
    const currentQtyInCart = cartItem?.quantity || 0;
    updateQuantity(product.id, currentQtyInCart + quantity);
    setQuantity(1);
  };

  const gallery = product.images || [product.image];
  const currentPrice = product.price;
  const totalPrice = (currentPrice * quantity).toFixed(2);

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % gallery.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + gallery.length) % gallery.length);

  return (
    <div className="min-h-screen bg-off-white pt-24 pb-12 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row bg-white rounded-[3rem] overflow-hidden shadow-xl border border-white/50"
        >
          {/* Back Button Overlay for Mobile */}
          <button 
            onClick={() => navigate(-1)}
            className="absolute top-28 left-8 z-20 p-4 bg-white/70 backdrop-blur-md rounded-full shadow-lg border border-white lg:hidden"
          >
            <ArrowLeft size={24} />
          </button>

          {/* Left: Gallery (50%) */}
          <div className="lg:w-1/2 relative bg-off-white min-h-[400px] lg:min-h-[700px] flex items-center justify-center">
            {/* Desktop Back Button */}
            <button 
              onClick={() => navigate(-1)}
              className="absolute top-8 left-8 z-20 hidden lg:flex items-center gap-2 px-6 py-3 bg-white/70 backdrop-blur-md rounded-full text-sm font-bold tracking-wide hover:bg-white transition-all shadow-sm border border-white"
            >
              <ArrowLeft size={18} /> GERİ
            </button>

            <AnimatePresence mode="wait">
              <motion.img
                key={currentImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                src={gallery[currentImageIndex]}
                alt={product.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </AnimatePresence>

            {gallery.length > 1 && (
              <>
                <button 
                  onClick={prevImage}
                  className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-white/70 backdrop-blur-md rounded-full shadow-lg hover:bg-white transition-all z-10"
                >
                  <ChevronLeft size={28} />
                </button>
                <button 
                  onClick={nextImage}
                  className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-white/70 backdrop-blur-md rounded-full shadow-lg hover:bg-white transition-all z-10"
                >
                  <ChevronRight size={28} />
                </button>
                
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 z-10">
                  {gallery.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImageIndex(i)}
                      className={cn(
                        "transition-all duration-500 rounded-full",
                        currentImageIndex === i ? "w-8 h-2 bg-brand-blue" : "w-2 h-2 bg-black/20"
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right: Details (50%) */}
          <div className="lg:w-1/2 p-8 lg:p-20 flex flex-col justify-center">
            <div className="flex flex-col gap-6">
              <span className="text-[12px] font-bold uppercase tracking-[0.3em] text-brand-blue">
                {product.category}
              </span>
              <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-charcoal leading-tight">
                {product.name}
              </h1>
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-3xl font-bold text-charcoal">{product.price.toFixed(2)} ₼</span>
                  {product.discountPrice && product.discountPrice > 0 && (
                    <span className="text-sm text-charcoal/30 line-through">{product.discountPrice.toFixed(2)} ₼</span>
                  )}
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm",
                  product.stock > 0 ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                )}>
                  Stokda: {product.stock} ədəd
                </div>
              </div>
              <div className="w-16 h-1 bg-brand-blue/20 rounded-full" />
              <p className="text-lg text-charcoal/60 leading-relaxed max-w-lg">
                {product.description}
              </p>
              
              {product.videoUrl && (
                <a 
                  href={product.videoUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-6 py-4 bg-red-50 text-red-600 rounded-2xl w-fit font-bold text-sm hover:bg-red-100 transition-all border border-red-100"
                >
                  <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center">
                    <Play size={16} fill="currentColor" />
                  </div>
                  Məhsulun Videosu
                </a>
              )}
            </div>

            <div className="mt-12 flex flex-col gap-8">
              <div className="flex flex-col gap-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-charcoal/40">MİQDAR</span>
                <div className="flex items-center gap-6 bg-off-white p-2 rounded-[2rem] w-fit border border-black/5">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-14 h-14 flex items-center justify-center bg-white rounded-full shadow-sm text-charcoal hover:bg-black hover:text-white transition-all active:scale-90"
                  >
                    <Minus size={20} />
                  </button>
                  <span className="w-10 text-center font-bold text-2xl tabular-nums">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-14 h-14 flex items-center justify-center bg-white rounded-full shadow-sm text-charcoal hover:bg-black hover:text-white transition-all active:scale-90"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              <button 
                onClick={handleAddToCart}
                className="w-full max-w-md flex items-center justify-between px-10 py-6 bg-brand-blue text-white rounded-[2.5rem] font-bold shadow-2xl shadow-brand-blue/30 hover:shadow-brand-blue/50 transition-all hover:scale-[1.02] active:scale-95 group"
              >
                <div className="flex items-center gap-3">
                  <ShoppingBag size={20} className="group-hover:rotate-12 transition-transform" />
                  <span className="text-lg">Səbətə at</span>
                </div>
                <span className="text-xl tabular-nums">- {totalPrice} ₼</span>
              </button>
            </div>

            {/* Recommendations */}
            {similarProducts.length > 0 && (
              <div className="mt-16 pt-12 border-t border-black/5">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-charcoal/40 mb-6 block">OXŞAR MƏHSULLAR</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {similarProducts.map(p => (
                    <motion.div 
                      key={p.id}
                      whileHover={{ y: -5 }}
                      onClick={() => {
                        navigate(`/product/${p.id}`);
                        setCurrentImageIndex(0);
                        setQuantity(1);
                      }}
                      className="flex items-center gap-4 p-4 bg-off-white rounded-3xl group cursor-pointer border border-transparent hover:border-brand-blue/20 transition-all"
                    >
                      <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md flex-shrink-0">
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-bold truncate group-hover:text-brand-blue transition-colors">{p.name}</span>
                        <span className="text-xs font-medium text-charcoal/50">{p.price.toFixed(2)} ₼</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
