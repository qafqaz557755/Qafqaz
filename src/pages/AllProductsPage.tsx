import { useState, useMemo, useEffect } from 'react';
import { Search, ArrowLeft, Filter, X, ChevronRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ProductCard } from '../components/ProductGrid';
import { cn } from '../lib/utils';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, Category } from '../types';

export default function AllProductsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(location.state?.category || null);
  const [limit, setLimit] = useState(24);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    const qProducts = query(
      collection(db, 'products'),
      orderBy('createdAt', 'desc')
    );
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        image: doc.data().images?.[0] || '' 
      } as Product)));
      setLoading(false);
    });

    const qCats = query(collection(db, 'categories'), orderBy('name', 'asc'));
    const unsubCats = onSnapshot(qCats, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    });

    return () => {
      unsubProducts();
      unsubCats();
    };
  }, []);

  useEffect(() => {
    if (location.state?.category) {
      setSelectedCategory(location.state.category);
    }
  }, [location.state]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            product.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory ? product.category === selectedCategory : true;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, products]);

  const visibleProducts = filteredProducts.slice(0, limit);
  const hasMore = limit < filteredProducts.length;

  const handleLoadMore = () => {
    setLimit(prev => prev + 8);
  };

  const handleProductClick = (product: any) => {
    navigate(`/product/${product.id}`);
  };

  return (
    <div className="min-h-screen bg-off-white pt-24 pb-20 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Navigation & Title */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-charcoal/40 hover:text-brand-blue transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
            Ana Səhifə
          </button>
          <h1 className="text-xl font-bold tracking-tight text-charcoal">Bütün Məhsullar</h1>
          <div className="w-10 md:w-20" /> {/* Spacer */}
        </div>

        {/* Discovery Discovery Header */}
        <div className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-sm border border-white/50 mb-12 flex flex-col gap-8">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-charcoal/30 group-focus-within:text-brand-blue transition-colors" size={20} />
            <input 
              type="text"
              placeholder="Nə axtarırsınız? (məsələn: Salfet, Boşqab...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-16 pr-8 py-5 bg-off-white rounded-[1.5rem] border-none outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all text-charcoal font-medium"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-6 top-1/2 -translate-y-1/2 p-1 bg-black/5 hover:bg-black/10 rounded-full text-charcoal/40 transition-all"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-charcoal/30">
              <Filter size={12} /> Kateqoriyalar
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  "px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all",
                  selectedCategory === null 
                    ? "bg-brand-blue text-white shadow-lg shadow-brand-blue/20" 
                    : "bg-off-white text-charcoal/60 hover:bg-black/5 border border-black/5"
                )}
              >
                Hamısı
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={cn(
                    "px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all",
                    selectedCategory === cat.name 
                      ? "bg-brand-blue text-white shadow-lg shadow-brand-blue/20" 
                      : "bg-off-white text-charcoal/60 hover:bg-black/5 border border-black/5"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Info & Breadcrumbs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-charcoal/30">
            <span className="cursor-pointer hover:text-brand-blue" onClick={() => navigate('/')}>Ana səhifə</span>
            <ChevronRight size={12} />
            <span className="cursor-pointer hover:text-brand-blue" onClick={() => setSelectedCategory(null)}>Məhsullar</span>
            {selectedCategory && (
              <>
                <ChevronRight size={12} />
                <span className="text-brand-blue">{selectedCategory}</span>
              </>
            )}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-charcoal/20">
            Cəmi {filteredProducts.length} məhsul tapıldı
          </div>
        </div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {filteredProducts.length > 0 ? (
            <motion.div 
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-8"
            >
              {visibleProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onClick={handleProductClick}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="py-24 flex flex-col items-center text-center gap-6"
            >
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm border border-black/5">
                <Search size={40} className="text-charcoal/10" />
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold text-charcoal">Nəticə tapılmadı</h2>
                <p className="text-charcoal/40">Axtarış meyarlarınıza uyğun məhsul yoxdur.</p>
              </div>
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                }}
                className="px-8 py-4 bg-brand-blue text-white rounded-full font-bold shadow-lg shadow-brand-blue/20 transition-all hover:scale-105 active:scale-95"
              >
                Filtrləri sıfırla
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {hasMore && (
          <div className="mt-20 flex justify-center">
            <button 
              onClick={handleLoadMore}
              className="px-10 py-4 bg-white border border-black/5 rounded-full font-bold text-charcoal hover:bg-off-white transition-all shadow-sm active:scale-95"
            >
              Daha çox yüklə
            </button>
          </div>
        )}

        <div className="mt-20 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-charcoal/20">
          Cəmi {filteredProducts.length} məhsul tapıldı
        </div>
      </div>
    </div>
  );
}
