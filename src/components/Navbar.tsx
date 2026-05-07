import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, Menu, X, ChevronDown, LayoutGrid, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import CartDrawer from './CartDrawer';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Category } from '../types';

export default function Navbar() {
  const { totalItems } = useCart();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
    const unsubscribeCats = onSnapshot(q, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'categories'));

    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/global'));

    return () => {
      unsubscribeCats();
      unsubscribeSettings();
    };
  }, []);

  const isAllProductsPage = location.pathname === '/products';

  const handleCategoryClick = (categoryName: string) => {
    setIsCategoryOpen(false);
    setIsMenuOpen(false);
    navigate('/products', { state: { category: categoryName } });
  };

  return (
    <>
      <AnimatePresence>
        {settings?.topBarText && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="fixed top-0 left-0 right-0 z-50 bg-brand-blue text-white overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center">
              <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] animate-pulse">
                {settings.topBarText}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className={cn(
        "fixed left-0 right-0 z-50 px-4 md:px-6 transition-all duration-300",
        settings?.topBarText ? "top-8 md:top-10" : "top-0 pt-4"
      )}>
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 md:px-6 bg-white/70 backdrop-blur-xl border border-white/20 shadow-sm rounded-3xl">
          <div className="flex items-center gap-4 md:gap-6 lg:w-1/3">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-black/5 rounded-full transition-colors lg:hidden"
              id="mobile-menu-toggle"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            
            <div className="hidden lg:flex items-center gap-8 text-sm font-bold uppercase tracking-widest text-charcoal/60">
              <Link to="/" className="hover:text-brand-blue transition-colors">Mağaza</Link>
              <a href="#" className="hover:text-brand-blue transition-colors">Haqqımızda</a>
              <a href="#" className="hover:text-brand-blue transition-colors">Əlaqə</a>
            </div>
          </div>

          <Link to="/" className="absolute left-1/2 -translate-x-1/2 text-xl md:text-2xl font-black tracking-tighter text-charcoal uppercase italic" id="logo">
            {settings?.shopName || 'PURELY'}
          </Link>

        <div className="flex items-center justify-end gap-1 md:gap-2 lg:w-1/3 h-full">
          <button 
            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
            className={cn(
              "hidden md:flex items-center gap-2 px-3 py-2 rounded-full transition-all text-xs font-bold uppercase tracking-widest",
              isCategoryOpen ? "bg-brand-blue text-white" : "bg-black/5 text-charcoal/60 hover:bg-black/10"
            )}
            id="category-toggle"
          >
            <LayoutGrid size={14} />
            Kateqoriyalar
            <ChevronDown size={14} className={cn("transition-transform duration-300", isCategoryOpen && "rotate-180")} />
          </button>

          <AnimatePresence>
            {isSearchOpen && !isAllProductsPage && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 240, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="overflow-hidden hidden lg:block"
              >
                <input
                  type="text"
                  placeholder="Məhsul axtar..."
                  className="w-full bg-black/5 border-none rounded-full px-4 py-2 text-sm focus:ring-1 focus:ring-brand-blue outline-none"
                  autoFocus
                />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Header Action Icons Container to maintain layout stability */}
          <div className="flex items-center">
            <AnimatePresence>
              {!isAllProductsPage && (
                <motion.button 
                  key="header-search-btn"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="p-2 hover:bg-black/5 rounded-full transition-colors flex items-center justify-center"
                  id="search-btn"
                >
                  <Search size={20} />
                </motion.button>
              )}
            </AnimatePresence>
            
            <Link 
              to={user ? "/profile" : "/auth"}
              className="p-2 hover:bg-black/5 rounded-full transition-colors relative"
              id="profile-btn"
            >
              <User size={20} className={cn(user ? "text-brand-blue" : "text-charcoal")} />
            </Link>

            <button 
              onClick={() => setIsCartOpen(true)}
              className="p-2 hover:bg-black/5 rounded-full transition-colors relative" 
              id="cart-btn"
            >
              <ShoppingBag size={20} />
              {totalItems > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] px-1 bg-brand-blue text-white rounded-full border border-white text-[8px] font-black flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      
      {/* Category Overlay */}
      <AnimatePresence>
        {isCategoryOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-24 left-1/2 -translate-x-1/2 w-full max-w-lg p-3 bg-white/95 backdrop-blur-2xl rounded-[2.5rem] border border-white/20 shadow-2xl z-40"
          >
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button 
                  key={cat.id}
                  className="flex flex-col items-center gap-3 p-4 rounded-3xl hover:bg-brand-blue/5 transition-all group"
                  onClick={() => handleCategoryClick(cat.name)}
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden shadow-sm border-2 border-white group-hover:scale-110 transition-transform">
                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-center text-charcoal/60 group-hover:text-brand-blue">
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-24 left-4 right-4 p-8 bg-white/95 backdrop-blur-2xl rounded-[2.5rem] border border-white/20 shadow-xl lg:hidden flex flex-col gap-8"
          >
            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-charcoal/30">Menyu</span>
              <div className="flex flex-col gap-6">
                <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-2xl font-bold">Mağaza</Link>
                <a href="#" className="text-2xl font-bold">Haqqımızda</a>
                <a href="#" className="text-2xl font-bold">Əlaqə</a>
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-8 border-t border-black/5">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-charcoal/30">Kateqoriyalar</span>
              <div className="grid grid-cols-2 gap-4">
                {categories.map(cat => (
                  <button 
                    key={cat.id} 
                    onClick={() => handleCategoryClick(cat.name)}
                    className="flex items-center gap-3 p-3 bg-black/5 rounded-2xl text-left"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                      <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest truncate">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  </>
  );
}
