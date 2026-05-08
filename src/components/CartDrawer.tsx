import { motion, AnimatePresence } from 'motion/react';
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, updateQuantity, removeFromCart, totalPrice, totalItems } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-black/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingBag size={24} className="text-brand-blue" />
                <h2 className="text-xl font-bold text-charcoal">Səbətiniz</h2>
                <span className="bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded-full text-xs font-bold">
                  {totalItems}
                </span>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-black/5 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Items List */}
            <div className="flex-grow overflow-y-auto p-6 flex flex-col gap-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-12">
                  <div className="w-20 h-20 bg-off-white rounded-full flex items-center justify-center">
                    <ShoppingBag size={32} className="text-charcoal/20" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-lg font-bold text-charcoal">Səbətiniz boşdur</p>
                    <p className="text-sm text-charcoal/40">Mağazamıza keçid edərək alış-verişə başlayın.</p>
                  </div>
                  <button 
                    onClick={() => { onClose(); navigate('/products'); }}
                    className="mt-4 px-8 py-3 bg-brand-blue text-white rounded-full font-bold shadow-lg shadow-brand-blue/20"
                  >
                    Məhsullara bax
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex gap-4 group">
                    <div className="w-24 h-24 bg-off-white rounded-2xl overflow-hidden flex-shrink-0 border border-black/5">
                      <img src={item.image || item.images?.[0]} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-grow flex flex-col justify-between py-1">
                      <div className="flex justify-between gap-2">
                        <h3 className="font-bold text-charcoal leading-tight line-clamp-1">{item.name}</h3>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="text-charcoal/20 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <p className="text-sm text-charcoal/40 font-medium">{item.price.toFixed(2)} ₼</p>
                      
                      {item.logoRequired && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-blue animate-pulse" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-blue">Logo tələb olunur</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-4 bg-off-white px-2 py-1 rounded-xl border border-black/5">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 hover:text-brand-blue transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-xs font-bold w-4 text-center tabular-nums">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 hover:text-brand-blue transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <span className="font-bold text-charcoal">
                          {(item.price * item.quantity).toFixed(2)} ₼
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Summary */}
            {items.length > 0 && (
              <div className="p-8 bg-white border-t border-black/5 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <span className="text-charcoal/40 font-medium">Toplam məbləğ</span>
                  <span className="text-2xl font-black text-charcoal tabular-nums">
                    {totalPrice.toFixed(2)} ₼
                  </span>
                </div>
                
                <button 
                  onClick={handleCheckout}
                  className="w-full py-5 bg-brand-blue text-white rounded-[2rem] font-bold shadow-2xl shadow-brand-blue/30 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all group"
                >
                  Sifarişi tamamla
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
