import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  doc, 
  getDoc,
  onSnapshot,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { motion } from 'motion/react';
import { 
  Package, 
  Heart, 
  ShoppingBag, 
  User, 
  Settings, 
  LogOut, 
  ChevronRight,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  Bell,
  MailOpen
} from 'lucide-react';
import { Product } from '../types';
import { cn } from '../lib/utils';

export default function ProfilePage() {
  const { user, userData, loading: authLoading } = useAuth();
  const { items: cartItems, wishlist: wishlistIds } = useCart();
  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'cart' | 'notifications'>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchOrders();
      fetchWishlist();
      
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const unsubscribeNotes = onSnapshot(q, (snapshot) => {
        setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => handleFirestoreError(error, OperationType.GET, 'notifications'));

      return () => unsubscribeNotes();
    }
  }, [user, wishlistIds]);

  const fetchOrders = async () => {
    try {
      if (!user) return;
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'orders');
    }
  };

  const fetchWishlist = async () => {
    try {
      if (wishlistIds.length === 0) {
        setWishlistProducts([]);
        setLoading(false);
        return;
      }
      const products: Product[] = [];
      for (const id of wishlistIds) {
        const docRef = doc(db, 'products', id);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          products.push({ id: snapshot.id, ...snapshot.data() } as Product);
        }
      }
      setWishlistProducts(products);
      setLoading(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'products');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    auth.signOut();
    navigate('/');
  };

  if (authLoading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-charcoal/10 border-t-charcoal rounded-full animate-spin" />
    </div>
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Yeni': return <AlertCircle className="w-4 h-4 text-brand-blue" />;
      case 'Hazırlanır': return <Clock className="w-4 h-4 text-orange-500" />;
      case 'Yoldadır': return <Truck className="w-4 h-4 text-blue-500" />;
      case 'Tamamlandı': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      default: return <Package className="w-4 h-4 text-charcoal/40" />;
    }
  };

  return (
    <div className="min-h-screen bg-off-white pt-32 pb-20 px-4">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12">
        
        {/* Sidebar */}
        <div className="lg:w-1/3 xl:w-1/4">
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-charcoal/5 sticky top-32">
            <div className="flex items-center gap-4 mb-8 pb-8 border-b border-charcoal/5">
              <div className="w-16 h-16 bg-off-white rounded-2xl flex items-center justify-center">
                <User className="w-8 h-8 text-charcoal/20" />
              </div>
              <div>
                <h2 className="font-bold text-charcoal">{userData?.firstName} {userData?.lastName}</h2>
                <p className="text-xs text-charcoal/40">{userData?.email}</p>
              </div>
            </div>

            <nav className="flex flex-col gap-2">
              <SidebarItem 
                icon={<Package />} 
                label="Sifarişlərim" 
                active={activeTab === 'orders'} 
                onClick={() => setActiveTab('orders')}
                count={orders.length}
              />
              <SidebarItem 
                icon={<Heart />} 
                label="Bəyəndiklərim" 
                active={activeTab === 'wishlist'} 
                onClick={() => setActiveTab('wishlist')}
                count={wishlistProducts.length}
              />
              <SidebarItem 
                icon={<Bell />} 
                label="Bildirişlər" 
                active={activeTab === 'notifications'} 
                onClick={() => setActiveTab('notifications')}
                count={notifications.filter(n => !n.isRead).length}
                highlight={notifications.some(n => !n.isRead)}
              />
              <SidebarItem 
                icon={<ShoppingBag />} 
                label="Səbətim" 
                active={activeTab === 'cart'} 
                onClick={() => setActiveTab('cart')}
                count={cartItems.length}
              />
              <div className="h-px bg-charcoal/5 my-4" />
              <button 
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 transition-colors w-full text-left"
              >
                <LogOut className="w-4 h-4" />
                Çıxış
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:flex-grow">
          <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-sm border border-charcoal/5 min-h-[600px]">
            <h1 className="text-3xl font-bold text-charcoal mb-10">
              {activeTab === 'orders' && 'Sifarişlərim'}
              {activeTab === 'wishlist' && 'Bəyəndiklərim'}
              {activeTab === 'cart' && 'Səbətim'}
              {activeTab === 'notifications' && 'Bildirişlər'}
            </h1>

            {activeTab === 'orders' && (
              <div className="space-y-6">
                {orders.length === 0 ? (
                  <EmptyState icon={<Package />} message="Hələ heç bir sifarişiniz yoxdur." />
                ) : (
                  orders.map(order => {
                    const statusSteps = ['Yeni', 'Hazırlanır', 'Yoldadır', 'Tamamlandı'];
                    const currentStepIndex = statusSteps.indexOf(order.status);
                    
                    return (
                      <div key={order.id} className="group p-6 bg-off-white/30 rounded-3xl border border-charcoal/5 hover:border-brand-blue/20 transition-all">
                        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {getStatusIcon(order.status)}
                              <span className="font-bold text-sm">{order.status}</span>
                            </div>
                            <span className="text-[10px] uppercase font-bold tracking-widest text-charcoal/30">ID: #{order.id.slice(0, 8)}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-charcoal">{order.totalPrice.toFixed(2)} AZN</p>
                            <p className="text-[10px] uppercase font-bold tracking-widest text-charcoal/30">
                              {new Date(order.createdAt?.seconds * 1000).toLocaleDateString('az-AZ')}
                            </p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="relative mb-8 px-2">
                          <div className="absolute top-1/2 left-0 w-full h-1 bg-charcoal/5 -translate-y-1/2 rounded-full" />
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${((currentStepIndex) / (statusSteps.length - 1)) * 100}%` }}
                            className="absolute top-1/2 left-0 h-1 bg-brand-blue -translate-y-1/2 rounded-full z-10"
                          />
                          <div className="relative flex justify-between">
                            {statusSteps.map((step, idx) => (
                              <div key={step} className="flex flex-col items-center gap-2">
                                <div className={cn(
                                  "w-3 h-3 rounded-full z-20 transition-colors duration-500",
                                  idx <= currentStepIndex ? "bg-brand-blue scale-125" : "bg-charcoal/10"
                                )} />
                                <span className={cn(
                                  "text-[10px] font-bold uppercase tracking-wider",
                                  idx <= currentStepIndex ? "text-brand-blue" : "text-charcoal/20"
                                )}>
                                  {step}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {order.items?.map((item: any) => (
                            <div key={item.id} className="px-3 py-1 bg-white border border-charcoal/5 rounded-full text-[10px] font-bold text-charcoal/60 lowercase">
                              {item.quantity}x {item.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-4">
                {notifications.length === 0 ? (
                  <EmptyState icon={<Bell />} message="Bildirişiniz yoxdur." />
                ) : (
                  notifications.map(note => (
                    <div 
                      key={note.id} 
                      onClick={() => !note.isRead && updateDoc(doc(db, 'notifications', note.id), { isRead: true })}
                      className={cn(
                        "p-6 rounded-3xl border transition-all cursor-pointer relative overflow-hidden",
                        note.isRead ? "bg-off-white/30 border-charcoal/5" : "bg-brand-blue/5 border-brand-blue/20 shadow-sm"
                      )}
                    >
                      {!note.isRead && <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-blue" />}
                      <div className="flex gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                          note.isRead ? "bg-charcoal/5 text-charcoal/40" : "bg-brand-blue text-white"
                        )}>
                          {note.isRead ? <MailOpen size={20} strokeWidth={1.5} /> : <Bell size={20} strokeWidth={1.5} />}
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className={cn("font-bold", note.isRead ? "text-charcoal/60" : "text-charcoal")}>{note.title}</h4>
                            <span className="text-[10px] font-bold text-charcoal/30 uppercase tracking-widest shrink-0">
                              {note.createdAt && new Date(note.createdAt?.seconds * 1000).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm text-charcoal/60 leading-relaxed">{note.message}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'wishlist' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {wishlistProducts.length === 0 ? (
                  <EmptyState icon={<Heart />} message="Bəyəndiyiniz məhsul yoxdur." />
                ) : (
                  wishlistProducts.map(product => (
                    <div key={product.id} className="group bg-off-white/30 rounded-3xl border border-charcoal/5 overflow-hidden flex h-32 hover:border-brand-blue/20 transition-all cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>
                      <div className="w-32 h-full">
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-4 flex flex-col justify-center flex-grow">
                        <h3 className="font-bold text-charcoal mb-1 line-clamp-1">{product.name}</h3>
                        <p className="font-bold text-brand-blue">{product.price.toFixed(2)} AZN</p>
                      </div>
                      <div className="p-4 flex items-center">
                        <ChevronRight className="w-5 h-5 text-charcoal/20" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'cart' && (
              <div className="space-y-6">
                {cartItems.length === 0 ? (
                  <EmptyState icon={<ShoppingBag />} message="Səbətiniz boşdur." />
                ) : (
                  <>
                    <div className="space-y-4">
                      {cartItems.map(item => (
                        <div key={item.id} className="flex items-center gap-4 p-4 bg-off-white/30 rounded-2xl border border-charcoal/5">
                          <img src={item.images[0]} alt={item.name} className="w-16 h-16 rounded-xl object-cover" />
                          <div className="flex-grow">
                            <h4 className="font-bold text-sm text-charcoal">{item.name}</h4>
                            <p className="text-xs text-charcoal/40">{item.quantity} ədəd</p>
                          </div>
                          <p className="font-bold text-brand-blue">{(item.price * item.quantity).toFixed(2)} AZN</p>
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={() => navigate('/checkout')}
                      className="w-full py-4 bg-charcoal text-white rounded-2xl font-bold hover:bg-black transition-colors"
                    >
                      Sifarişi Tamamla
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarItem({ 
  icon, 
  label, 
  active, 
  onClick, 
  count,
  highlight 
}: { 
  icon: any, 
  label: string, 
  active: boolean, 
  onClick: () => void, 
  count?: number,
  highlight?: boolean
}) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all relative ${active ? 'bg-charcoal text-white' : 'text-charcoal/40 hover:bg-off-white'}`}
    >
      <div className="flex items-center gap-3">
        {React.cloneElement(icon, { className: 'w-4 h-4' })}
        {label}
        {!active && highlight && (
          <span className="w-2 h-2 bg-brand-blue rounded-full absolute left-2 top-2" />
        )}
      </div>
      {count !== undefined && (
        <span className={`text-[10px] w-5 h-5 flex items-center justify-center rounded-full ${active ? 'bg-white/20' : 'bg-charcoal/5 text-charcoal/30'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function EmptyState({ icon, message }: { icon: any, message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 bg-off-white rounded-[32px] flex items-center justify-center mb-6">
        {React.cloneElement(icon, { className: 'w-10 h-10 text-charcoal/10' })}
      </div>
      <p className="text-charcoal/40 font-medium">{message}</p>
    </div>
  );
}
