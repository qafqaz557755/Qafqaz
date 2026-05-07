import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Layers, 
  Settings as SettingsIcon, 
  LogOut, 
  Plus, 
  Search,
  ChevronRight,
  ArrowLeft,
  Lock,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Video,
  ExternalLink,
  CheckCircle2,
  Clock,
  Truck,
  Box,
  Copy,
  Send,
  Database,
  Image as ImageIcon,
  Users as UsersIcon,
  MessageSquare,
  Bot,
  Type
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  query,
  orderBy,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { Product } from '../types';
import { CreditCard } from 'lucide-react';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'Qafqaz1234';
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'qqardasov61@gmail.com';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

const getYoutubeId = (url: string) => {
  const regExp = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[1].length === 11) ? match[1] : null;
};

export default function AdminPanel() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Password check
  const [isDbConnected, setIsDbConnected] = useState(false); // Firebase check
  const [password, setPassword] = useState('');
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'categories' | 'banners' | 'promos' | 'users' | 'settings'>('dashboard');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && user.email === ADMIN_EMAIL) {
        setIsDbConnected(true);
        setIsAdminUser(true);
        setIsAuthenticated(true); // Auto-authenticate if Google login matches admin email
      } else {
        setIsDbConnected(false);
        setIsAdminUser(false);
      }
    });
    return unsub;
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      alert('Səhv şifrə!');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user.email !== ADMIN_EMAIL) {
        await signOut(auth);
        alert('Bu email ilə daxil olmaq olmaz! Yalnız ' + ADMIN_EMAIL + ' icazəlidir.');
      }
    } catch (error) {
      console.error(error);
      alert('Giriş xətası!');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl border border-white max-w-md w-full flex flex-col items-center gap-8"
        >
          <div className="w-20 h-20 bg-brand-blue/10 rounded-3xl flex items-center justify-center text-brand-blue">
            <Lock size={40} />
          </div>
          
          <div className="text-center flex flex-col gap-2">
            <h1 className="text-2xl font-black text-charcoal tracking-tight">Admin Girişi</h1>
            <p className="text-charcoal/40 text-sm font-medium">Panelə daxil olmaq üçün şifrəni yazın.</p>
          </div>

          <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifrə"
              className="w-full px-6 py-4 bg-off-white rounded-2xl border-none outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all font-medium text-center tracking-widest"
              autoFocus
            />
            <button 
              type="submit"
              className="w-full py-4 bg-brand-blue text-white rounded-2xl font-bold uppercase tracking-widest shadow-xl shadow-brand-blue/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Daxil ol
            </button>
            <button 
              type="button"
              onClick={() => navigate('/')}
              className="w-full py-4 text-charcoal/40 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:text-charcoal transition-colors"
            >
              <ArrowLeft size={16} /> Ana səhifəyə qayıt
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Dashboard but needs Google sign in for write access
  if (!isDbConnected) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center px-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-white max-w-lg w-full flex flex-col items-center gap-8 text-center"
        >
          <div className="w-24 h-24 bg-brand-blue rounded-full flex items-center justify-center text-white shadow-xl shadow-brand-blue/30">
            <Database size={48} />
          </div>
          <div className="flex flex-col gap-3">
            <h2 className="text-3xl font-black text-charcoal tracking-tight">Bazaya Qoşul</h2>
            <p className="text-charcoal/60 font-medium">
              Panelə daxil oldunuz, lakin məlumatları redaktə etmək üçün {ADMIN_EMAIL} ilə Google giriş etməlisiniz.
            </p>
          </div>
          <button 
            onClick={handleGoogleSignIn}
            className="w-full py-5 bg-white border-2 border-black/5 rounded-3xl flex items-center justify-center gap-4 hover:bg-off-white transition-all group overflow-hidden relative"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6" />
            <span className="font-black uppercase tracking-widest text-sm text-charcoal">Google ilə təsdiqlə</span>
          </button>
          <button 
            onClick={() => setIsAuthenticated(false)}
            className="text-charcoal/40 font-bold uppercase tracking-widest text-xs hover:text-charcoal transition-colors"
          >
            Geri qayıt
          </button>
        </motion.div>
      </div>
    );
  }

  const menuItems = [
    { id: 'dashboard', label: 'Monitorinq', icon: LayoutDashboard },
    { id: 'products', label: 'Məhsullar', icon: Package },
    { id: 'orders', label: 'Sifarişlər', icon: ShoppingBag },
    { id: 'categories', label: 'Kateqoriyalar', icon: Layers },
    { id: 'banners', label: 'Bannerlər', icon: ImageIcon },
    { id: 'promos', label: 'Promo Kodlar', icon: Type },
    { id: 'users', label: 'Müştərilər', icon: UsersIcon },
    { id: 'settings', label: 'Tənzimləmələr', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-off-white flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-black/5 flex flex-col p-6 fixed inset-y-0 left-0 z-20">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-brand-blue text-white rounded-xl flex items-center justify-center font-black italic shadow-lg shadow-brand-blue/20">
            P
          </div>
          <span className="text-xl font-black text-charcoal tracking-tighter uppercase italic">PURELY Admin</span>
        </div>

        <nav className="flex-grow flex flex-col gap-1.5 overflow-y-auto pr-2 custom-scrollbar">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group",
                activeTab === item.id 
                  ? "bg-brand-blue text-white shadow-lg shadow-brand-blue/20" 
                  : "text-charcoal/40 hover:bg-black/5 hover:text-charcoal"
              )}
            >
              <item.icon size={20} className={cn("transition-transform group-hover:scale-110", activeTab === item.id ? "scale-110" : "")} />
              <span className="font-bold text-sm tracking-tight">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="pt-6 mt-6 border-t border-black/5 flex flex-col gap-2">
          <button 
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl bg-off-white text-charcoal/60 hover:text-brand-blue transition-all font-black text-[10px] uppercase tracking-[0.2em] shadow-sm border border-black/5"
          >
            <ArrowLeft size={18} />
            Satış Saytına Qayıt
          </button>
          <button 
            onClick={() => {
              signOut(auth);
              setIsAuthenticated(false);
            }}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-red-500/60 hover:bg-red-50 hover:text-red-500 transition-all font-bold text-sm"
          >
            <LogOut size={20} />
            Çıxış et
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow ml-72 p-10 bg-white min-h-screen">
        <div className="max-w-6xl mx-auto">
          <header className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl font-black text-charcoal tracking-tighter uppercase italic">
                {menuItems.find(m => m.id === activeTab)?.label}
              </h2>
              <p className="text-charcoal/40 font-bold uppercase tracking-widest text-[10px] mt-1">İdarəetmə Paneli</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/20" />
                <input 
                  type="text" 
                  placeholder="Axtarış..."
                  className="pl-11 pr-6 py-3 bg-white rounded-2xl border-none outline-none focus:ring-2 focus:ring-brand-blue/10 transition-all w-64 shadow-sm text-sm"
                />
              </div>
              <button 
                className="p-3 bg-white rounded-full shadow-sm hover:shadow-md transition-all active:scale-95 border border-black/5"
              >
                <div className="w-8 h-8 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue font-bold text-xs">
                  QQ
                </div>
              </button>
            </div>
          </header>

          <AnimatePresence mode="wait">
            <motion.section
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && <AdminDashboard />}
              {activeTab === 'products' && <AdminProducts />}
              {activeTab === 'orders' && <AdminOrders />}
              {activeTab === 'categories' && <AdminCategories />}
              {activeTab === 'banners' && <AdminBanners />}
              {activeTab === 'promos' && <AdminPromoCodes />}
              {activeTab === 'users' && <AdminCustomers />}
              {activeTab === 'settings' && <AdminSettings />}
            </motion.section>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// Dummy components for now
function AdminDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[
        { label: 'Ümumi Satış', value: '1,240.50 AZN', delta: '+12%', color: 'bg-green-500' },
        { label: 'Sifarişlər', value: '42', delta: '+5', color: 'bg-brand-blue' },
        { label: 'Stokda qalan', value: '156', delta: '-2', color: 'bg-orange-500' },
      ].map((stat, i) => (
        <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-white flex flex-col gap-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-charcoal/40">{stat.label}</span>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-black text-charcoal">{stat.value}</span>
            <span className={cn("px-2 py-1 rounded-full text-[10px] font-black text-white", stat.color)}>{stat.delta}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    price: 0,
    discountPrice: 0,
    stock: 0,
    images: '',
    videoUrl: '',
    logoRequired: false,
    isHidden: false
  });

  useEffect(() => {
    const qProducts = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'products'));

    const qCats = query(collection(db, 'categories'), orderBy('name', 'asc'));
    const unsubCats = onSnapshot(qCats, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'categories'));

    return () => {
      unsubProducts();
      unsubCats();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      images: formData.images.split(',').map(s => s.trim()).filter(Boolean),
      price: Number(formData.price),
      discountPrice: Number(formData.discountPrice),
      stock: Number(formData.stock),
      updatedAt: serverTimestamp()
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), data);
      } else {
        await addDoc(collection(db, 'products'), { ...data, createdAt: serverTimestamp() });
      }
      setIsAdding(false);
      setEditingId(null);
      setFormData({ name: '', category: '', description: '', price: 0, discountPrice: 0, stock: 0, images: '', videoUrl: '', logoRequired: false, isHidden: false });
    } catch (err) {
      console.error(err);
      alert('Xəta baş verdi!');
    }
  };

  const handleEdit = (product: any) => {
    setEditingId(product.id);
    setFormData({
      ...product,
      images: (product.images || []).join(', '),
      videoUrl: product.videoUrl || '',
      description: product.description || '',
    });
    setIsAdding(true);
  };
  
  const handleDelete = async (id: string) => {
    if (window.confirm('Bu məhsulu silmək istədiyinizə əminsiniz?')) {
      await deleteDoc(doc(db, 'products', id));
    }
  };

  const toggleVisibility = async (product: any) => {
    await updateDoc(doc(db, 'products', product.id), {
      isHidden: !product.isHidden,
      updatedAt: serverTimestamp()
    });
  };

  const imagePreview = formData.images.split(',')[0]?.trim();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Məhsul Siyahısı ({products.length})</h3>
        <button 
          onClick={() => {
            setEditingId(null);
            setFormData({ name: '', category: '', description: '', price: 0, discountPrice: 0, stock: 0, images: '', videoUrl: '', logoRequired: false, isHidden: false });
            setIsAdding(true);
          }}
          className="px-6 py-3 bg-brand-blue text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-brand-blue/20"
        >
          <Plus size={20} /> Yeni Məhsul
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-black/5 mb-8">
              <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  {/* Left Column: Form Fields */}
                  <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest ml-4">AD</label>
                      <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="px-6 py-3 bg-off-white rounded-xl outline-none focus:ring-2 focus:ring-brand-blue/10" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest ml-4">KATEQORİYA</label>
                      <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="px-6 py-3 bg-off-white rounded-xl outline-none focus:ring-2 focus:ring-brand-blue/10">
                        <option value="">Seçin...</option>
                        {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-2 flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest ml-4">TƏSVİR</label>
                      <textarea rows={4} required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="px-6 py-4 bg-off-white rounded-xl outline-none resize-y min-h-[100px]" placeholder="Məhsul haqqında ətraflı məlumat..." />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest ml-4">QİYMƏT</label>
                      <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="px-6 py-3 bg-off-white rounded-xl outline-none" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest ml-4">ENDİRİMLİ QİYMƏT</label>
                      <input type="number" step="0.01" value={formData.discountPrice} onChange={e => setFormData({...formData, discountPrice: Number(e.target.value)})} className="px-6 py-3 bg-off-white rounded-xl outline-none" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest ml-4">STOK SAYI</label>
                      <input required type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} className="px-6 py-3 bg-off-white rounded-xl outline-none" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest ml-4">VİDEO URL (YouTube)</label>
                      <div className="relative">
                        <input type="text" value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})} className="w-full px-6 py-3 bg-off-white rounded-xl outline-none" placeholder="https://youtube.com/..." />
                        {formData.videoUrl && <Video size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500" />}
                      </div>
                    </div>
                    <div className="md:col-span-2 flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest ml-4">ŞƏKİL LİNKLƏRİ (Vergüllə ayır)</label>
                      <textarea rows={2} required value={formData.images} onChange={e => setFormData({...formData, images: e.target.value})} className="px-6 py-3 bg-off-white rounded-xl outline-none resize-none" />
                    </div>
                  </div>

                  {/* Right Column: Previews & Toggles */}
                  <div className="flex flex-col gap-8">
                    <div className="flex flex-col gap-4">
                      <label className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest">ÖNİZLƏMƏ</label>
                      <div className="aspect-square rounded-[2rem] bg-off-white overflow-hidden border border-black/5 flex items-center justify-center relative">
                        {imagePreview ? (
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon size={40} className="text-charcoal/10" />
                        )}
                        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/20 to-transparent">
                          <span className="text-[8px] font-black uppercase text-white tracking-[0.3em]">Əsas Şəkil</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 p-6 bg-off-white rounded-[2rem] border border-black/5">
                      <label className="flex items-center justify-between cursor-pointer group">
                        <span className="text-[10px] font-black uppercase tracking-widest text-charcoal/60 group-hover:text-brand-blue transition-colors">Logo Tələb Et</span>
                        <input type="checkbox" checked={formData.logoRequired} onChange={e => setFormData({...formData, logoRequired: e.target.checked})} className="w-5 h-5 accent-brand-blue" />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer group">
                        <span className="text-[10px] font-black uppercase tracking-widest text-charcoal/60 group-hover:text-red-500 transition-colors">Gizlət</span>
                        <input type="checkbox" checked={formData.isHidden} onChange={e => setFormData({...formData, isHidden: e.target.checked})} className="w-5 h-5 accent-charcoal" />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-8 border-t border-black/5">
                  <button type="button" onClick={() => setIsAdding(false)} className="px-10 py-5 bg-off-white rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] text-charcoal/40 hover:text-charcoal transition-all">Ləğv et</button>
                  <button type="submit" className="px-12 py-5 bg-black text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] hover:bg-brand-blue transition-all shadow-xl shadow-brand-blue/10">{editingId ? 'Yenilə' : 'Əlavə et'}</button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <div key={product.id} className={cn("bg-white p-6 rounded-[2.5rem] shadow-sm border border-black/5 flex flex-col gap-4 group", product.isHidden && "opacity-50 grayscale")}>
            <div className="relative aspect-square rounded-[2rem] overflow-hidden bg-off-white">
              {product.videoUrl ? (
                getYoutubeId(product.videoUrl) ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${getYoutubeId(product.videoUrl)}?mute=1&controls=0`}
                    className="w-full h-full border-none pointer-events-none"
                    allow="autoplay; encrypted-media"
                  />
                ) : (
                  <video src={product.videoUrl} muted className="w-full h-full object-cover" />
                )
              ) : (
                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              )}
              {product.isHidden && <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-black text-xs uppercase tracking-widest">GİZLİ</div>}
              {product.logoRequired && <div className="absolute top-4 right-4 bg-brand-blue text-white p-2 rounded-full shadow-lg"><Layers size={14} /></div>}
            </div>
            
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-brand-blue">
                <span>{product.category}</span>
                <span className={cn(product.stock < 5 ? "text-red-500" : "text-green-500")}>Stokda: {product.stock} ədəd</span>
              </div>
              <h4 className="font-bold text-charcoal truncate">{product.name}</h4>
              <div className="flex items-center justify-between mt-2">
                <div className="flex flex-col">
                  {product.discountPrice > 0 && <span className="text-xs text-charcoal/20 line-through">{product.discountPrice} ₼</span>}
                  <span className="text-lg font-black text-charcoal">{product.price} ₼</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleVisibility(product)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                    {product.isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button onClick={() => handleEdit(product)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDelete(product.id)} className="p-2 hover:bg-black/5 rounded-full text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const states = ['Yeni', 'Hazırlanır', 'Yoldadır', 'Tamamlandı'];

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const updateStatus = async (id: string, status: string, userId?: string, currentStatus?: string) => {
    if (status === currentStatus) return;
    
    await updateDoc(doc(db, 'orders', id), { status });
    
    // Send notification if userId exists
    if (userId) {
      await addDoc(collection(db, 'notifications'), {
        userId,
        title: 'Sifariş Statusu Yeniləndi',
        message: `Sifarişinizin statusu "${status}" olaraq dəyişdirildi.`,
        isRead: false,
        type: 'order_status',
        createdAt: serverTimestamp()
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {orders.map(order => (
        <div key={order.id} className="bg-white p-8 rounded-[3rem] shadow-sm border border-black/5">
          <div className="flex flex-wrap items-start justify-between gap-6 mb-8">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <h4 className="text-xl font-bold">{order.customerName}</h4>
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest text-white shadow-sm",
                  order.status === 'Yeni' ? "bg-brand-blue" :
                  order.status === 'Hazırlanır' ? "bg-orange-500" :
                  order.status === 'Yoldadır' ? "bg-purple-500" : "bg-green-500"
                )}>
                  {order.status}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium text-charcoal/40">
                <span>{order.phone}</span>
                <span>•</span>
                <span>{order.address}</span>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2 text-right">
              <span className="text-2xl font-black text-charcoal">{order.totalPrice.toFixed(2)} ₼</span>
              <span className="text-[10px] font-bold text-charcoal/20 uppercase tracking-widest">
                {order.createdAt?.toDate().toLocaleString('az-AZ')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-charcoal/40">Məhsullar</span>
              <div className="flex flex-col gap-3">
                {order.items.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-charcoal">{item.name} x {item.quantity}</span>
                    <span className="font-bold">{(item.price * item.quantity).toFixed(2)} ₼</span>
                  </div>
                ))}
              </div>
              {order.note && (
                <div className="mt-4 p-4 bg-off-white rounded-2xl border border-black/5 italic text-sm text-charcoal/60">
                  "{order.note}"
                </div>
              )}
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-charcoal/40">Statusu Dəyiş</span>
                <div className="flex flex-wrap gap-2">
                  {states.map(state => (
                    <button
                      key={state}
                      onClick={() => updateStatus(order.id, state, order.userId, order.status)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        order.status === state ? "bg-charcoal text-white" : "bg-off-white text-charcoal/40 hover:bg-black/5"
                      )}
                    >
                      {state}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                {order.receiptUrl && (
                  <a href={order.receiptUrl} target="_blank" rel="noreferrer" className="flex-grow flex items-center justify-center gap-2 py-3 bg-off-white rounded-2xl text-[10px] font-black uppercase tracking-widest text-charcoal/60 hover:bg-black/5 transition-all">
                    <Eye size={16} /> Qəbzə Bax
                  </a>
                )}
                {order.logoUrl && (
                  <a href={order.logoUrl} target="_blank" rel="noreferrer" className="flex-grow flex items-center justify-center gap-2 py-3 bg-brand-blue/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-brand-blue hover:bg-brand-blue/20 transition-all">
                    <Layers size={16} /> Müştəri Logosu
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [image, setImage] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, 'categories'), { name, image });
    setName('');
    setImage('');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Kateqoriyanı silmək istəyirsiniz?')) {
      await deleteDoc(doc(db, 'categories', id));
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
      <div className="md:col-span-1">
        <form onSubmit={handleAdd} className="bg-white p-8 rounded-[3rem] shadow-sm border border-black/5 flex flex-col gap-6">
          <h4 className="text-xl font-bold">Yeni Kateqoriya</h4>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest ml-4">AD</label>
            <input required value={name} onChange={e => setName(e.target.value)} className="px-6 py-3 bg-off-white rounded-xl outline-none" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest ml-4">ŞƏKİL LİNKİ</label>
            <input required value={image} onChange={e => setImage(e.target.value)} className="px-6 py-3 bg-off-white rounded-xl outline-none" />
          </div>
          <button type="submit" className="w-full py-4 bg-brand-blue text-white rounded-2xl font-bold uppercase tracking-widest">Əlavə et</button>
        </form>
      </div>

      <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {categories.map(cat => (
          <div key={cat.id} className="bg-white p-4 rounded-3xl border border-black/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-off-white">
                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-charcoal">{cat.name}</span>
            </div>
            <button onClick={() => handleDelete(cat.id)} className="p-2 text-charcoal/20 hover:text-red-500"><Trash2 size={18} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}


function AdminCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [notification, setNotification] = useState({ userId: '', title: '', message: '' });
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'users'));
    return unsubscribe;
  }, []);

  const sendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (notification.userId === 'all') {
        const promises = customers.map(customer => addDoc(collection(db, 'notifications'), {
          userId: customer.id,
          title: notification.title,
          message: notification.message,
          isRead: false,
          type: 'promotion',
          createdAt: serverTimestamp()
        }));
        await Promise.all(promises);
      } else {
        await addDoc(collection(db, 'notifications'), {
          userId: notification.userId,
          title: notification.title,
          message: notification.message,
          isRead: false,
          type: 'promotion',
          createdAt: serverTimestamp()
        });
      }
      setIsSending(false);
      setNotification({ userId: '', title: '', message: '' });
      alert('Bildiriş göndərildi!');
    } catch (err) {
      console.error(err);
      alert('Xəta baş verdi!');
    }
  };

  return (
    <div className="flex flex-col gap-12">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Müştərilər ({customers.length})</h3>
        <button 
          onClick={() => {
            setNotification({ userId: 'all', title: '', message: '' });
            setIsSending(true);
          }}
          className="px-6 py-3 bg-purple-500 text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20"
        >
          <Send size={20} /> Hamıya Bildiriş Göndər
        </button>
      </div>

      <AnimatePresence>
        {isSending && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-black/5 mb-8">
              <form onSubmit={sendNotification} className="flex flex-col gap-6">
                <h4 className="text-lg font-bold">
                  {notification.userId === 'all' ? 'Bütün müştərilərə bildiriş' : `Müştəriyə bildiriş`}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest ml-4">Başlıq</label>
                    <input required value={notification.title} onChange={e => setNotification({...notification, title: e.target.value})} placeholder="Məs: Yeni Kampaniya!" className="px-6 py-3 bg-off-white rounded-xl outline-none" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest ml-4">Mesaj</label>
                    <input required value={notification.message} onChange={e => setNotification({...notification, message: e.target.value})} placeholder="Məs: Bütün məhsullara 20% endirim..." className="px-6 py-3 bg-off-white rounded-xl outline-none" />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setIsSending(false)} className="px-8 py-4 bg-off-white rounded-xl font-bold">Ləğv et</button>
                  <button type="submit" className="px-10 py-4 bg-purple-500 text-white rounded-xl font-bold">Göndər</button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-[3rem] border border-black/5 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-charcoal/30 border-b border-black/5">
              <th className="py-6 pl-8">Ad Soyad</th>
              <th className="py-6">E-poçt / Tel</th>
              <th className="py-6">Qeydiyyat</th>
              <th className="py-6 pr-8 text-right">Əməliyyat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {customers.map(customer => (
              <tr key={customer.id} className="group hover:bg-off-white/30 transition-colors">
                <td className="py-6 pl-8">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-off-white rounded-xl flex items-center justify-center font-bold text-charcoal/20">
                      {customer.firstName?.[0]}{customer.lastName?.[0]}
                    </div>
                    <div>
                      <div className="font-bold text-charcoal">{customer.firstName} {customer.lastName}</div>
                      <div className="text-[10px] text-charcoal/30 uppercase tracking-widest">{customer.id.slice(0,8)}</div>
                    </div>
                  </div>
                </td>
                <td className="py-6">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{customer.email}</span>
                    <span className="text-xs text-charcoal/40">{customer.phone}</span>
                  </div>
                </td>
                <td className="py-6 text-sm text-charcoal/60">
                   {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('az-AZ') : '-'}
                </td>
                <td className="py-6 pr-8 text-right">
                  <button 
                    onClick={() => {
                      setNotification({ userId: customer.id, title: '', message: '' });
                      setIsSending(true);
                    }}
                    className="p-3 bg-off-white text-charcoal/40 rounded-full hover:bg-purple-500 hover:text-white transition-all shadow-sm"
                  >
                    <MessageSquare size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminBanners() {
  const [banners, setBanners] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    imageUrl: '',
    videoUrl: '',
    order: 0,
    titleSize: 'text-4xl',
    titleColor: '#000000',
    subtitleSize: 'text-lg',
    subtitleColor: '#666666'
  });

  useEffect(() => {
    const q = query(collection(db, 'banners'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, snapshot => {
      setBanners(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'banners'));
    return unsubscribe;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'banners', editingId), {
          ...formData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'banners'), {
          ...formData,
          order: formData.order || banners.length,
          createdAt: serverTimestamp()
        });
      }
      setIsAdding(false);
      setEditingId(null);
      setFormData({
        title: '',
        subtitle: '',
        imageUrl: '',
        videoUrl: '',
        order: 0,
        titleSize: 'text-4xl',
        titleColor: '#000000',
        subtitleSize: 'text-lg',
        subtitleColor: '#666666'
      });
    } catch (err) {
      console.error(err);
      alert('Xəta baş verdi!');
    }
  };

  const handleEdit = (banner: any) => {
    setEditingId(banner.id);
    setFormData({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      imageUrl: banner.imageUrl || '',
      videoUrl: banner.videoUrl || '',
      order: banner.order || 0,
      titleSize: banner.titleSize || 'text-4xl',
      titleColor: banner.titleColor || '#000000',
      subtitleSize: banner.subtitleSize || 'text-lg',
      subtitleColor: banner.subtitleColor || '#666666'
    });
    setIsAdding(true);
  };

  const deleteBanner = async (id: string) => {
    if (confirm('Silmek istədiyinizə əminsiniz?')) {
      await deleteDoc(doc(db, 'banners', id));
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Bannerlər ({banners.length})</h3>
        <button 
          onClick={() => {
            setEditingId(null);
            setFormData({
              title: '',
              subtitle: '',
              imageUrl: '',
              order: banners.length,
              titleSize: 'text-4xl',
              titleColor: '#000000',
              subtitleSize: 'text-lg',
              subtitleColor: '#666666'
            });
            setIsAdding(true);
          }}
          className="px-6 py-3 bg-brand-blue text-white rounded-2xl font-bold flex items-center gap-2"
        >
          <Plus size={20} /> Yeni Banner
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-black/5 mb-8">
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-6">
                   <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                     <label className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest ml-4">Şəkil URL</label>
                     <input value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} className="px-6 py-3 bg-off-white rounded-xl outline-none" placeholder="https://..." />
                    </div>
                    <div className="flex flex-col gap-2">
                     <label className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest ml-4">Video URL (Arxa plan)</label>
                     <input value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})} className="px-6 py-3 bg-off-white rounded-xl outline-none" placeholder="https://..." />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest ml-4">Başlıq</label>
                      <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="px-6 py-3 bg-off-white rounded-xl outline-none" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest ml-4">Alt Yazı</label>
                      <input value={formData.subtitle} onChange={e => setFormData({...formData, subtitle: e.target.value})} className="px-6 py-3 bg-off-white rounded-xl outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest ml-4">Başlıq Ölçüsü</label>
                      <select value={formData.titleSize} onChange={e => setFormData({...formData, titleSize: e.target.value})} className="px-6 py-3 bg-off-white rounded-xl outline-none">
                        <option value="text-2xl">Kiçik</option>
                        <option value="text-4xl text-md:text-5xl">Normal</option>
                        <option value="text-6xl text-md:text-7xl">Böyük</option>
                        <option value="text-8xl">Ekstra Böyük</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest ml-4">Başlıq Rəngi</label>
                      <div className="flex items-center gap-3">
                        <input type="color" value={formData.titleColor} onChange={e => setFormData({...formData, titleColor: e.target.value})} className="w-12 h-12 bg-transparent border-none p-0 cursor-pointer" />
                        <span className="text-xs font-mono uppercase">{formData.titleColor}</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest ml-4">Alt Yazı Ölçüsü</label>
                      <select value={formData.subtitleSize} onChange={e => setFormData({...formData, subtitleSize: e.target.value})} className="px-6 py-3 bg-off-white rounded-xl outline-none">
                        <option value="text-xs">Balaca</option>
                        <option value="text-sm">Normal</option>
                        <option value="text-lg">Böyük</option>
                        <option value="text-xl">Ekstra Böyük</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest ml-4">Alt Yazı Rəngi</label>
                      <div className="flex items-center gap-3">
                        <input type="color" value={formData.subtitleColor} onChange={e => setFormData({...formData, subtitleColor: e.target.value})} className="w-12 h-12 bg-transparent border-none p-0 cursor-pointer" />
                        <span className="text-xs font-mono uppercase">{formData.subtitleColor}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  <label className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest">Önizləmə</label>
                   <div className="relative aspect-video rounded-[2.5rem] overflow-hidden bg-off-white shadow-inner flex items-center justify-center text-center p-8">
                    {formData.videoUrl ? (
                      getYoutubeId(formData.videoUrl) ? (
                        <div className="absolute inset-0 pointer-events-none">
                          <iframe
                            src={`https://www.youtube.com/embed/${getYoutubeId(formData.videoUrl)}?autoplay=1&mute=1&controls=0&loop=1&playlist=${getYoutubeId(formData.videoUrl)}&modestbranding=1`}
                            className="w-full h-full border-none scale-125"
                            allow="autoplay; encrypted-media"
                          />
                        </div>
                      ) : (
                        <video src={formData.videoUrl} autoPlay muted loop className="absolute inset-0 w-full h-full object-cover" />
                      )
                    ) : formData.imageUrl ? (
                      <img src={formData.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    ) : null}
                    <div className="relative z-10">
                      <h2 style={{ color: formData.titleColor }} className={cn("font-black tracking-tighter mb-2", formData.titleSize)}>{formData.title || 'Başlıq'}</h2>
                      <p style={{ color: formData.subtitleColor }} className={cn("font-bold", formData.subtitleSize)}>{formData.subtitle || 'Alt Yazı'}</p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-auto">
                    <button type="button" onClick={() => setIsAdding(false)} className="px-8 py-4 bg-off-white rounded-xl font-bold">Ləğv et</button>
                    <button type="submit" className="px-10 py-4 bg-brand-blue text-white rounded-xl font-bold shadow-lg shadow-brand-blue/20">{editingId ? 'Yenilə' : 'Əlavə et'}</button>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {banners.map(banner => (
          <div key={banner.id} className="bg-white rounded-[2.5rem] border border-black/5 p-6 flex flex-col md:flex-row gap-8 items-center group relative overflow-hidden">
            <div className="w-full md:w-48 aspect-video rounded-2xl overflow-hidden bg-off-white shadow-sm shrink-0">
              {banner.videoUrl ? (
                getYoutubeId(banner.videoUrl) ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${getYoutubeId(banner.videoUrl)}?mute=1&controls=0`}
                    className="w-full h-full border-none"
                    allow="autoplay; encrypted-media"
                  />
                ) : (
                  <video src={banner.videoUrl} autoPlay muted loop className="w-full h-full object-cover" />
                )
              ) : (
                <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
              )}
            </div>
            <div className="flex-grow flex flex-col gap-2 min-w-0">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-blue">Sıra: #{banner.order}</span>
              <h5 className="text-xl font-bold text-charcoal truncate" style={{ color: banner.titleColor }}>{banner.title}</h5>
              <p className="text-sm text-charcoal/60 font-medium truncate" style={{ color: banner.subtitleColor }}>{banner.subtitle}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button 
                onClick={() => handleEdit(banner)}
                className="p-3 bg-off-white text-charcoal/40 rounded-full hover:bg-brand-blue hover:text-white transition-all shadow-sm"
              >
                <Edit size={20} />
              </button>
              <button 
                onClick={() => deleteBanner(banner.id)} 
                className="p-3 bg-red-50 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-sm"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminPromoCodes() {
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [newPromo, setNewPromo] = useState({ 
    code: '', 
    type: 'percentage' as 'percentage' | 'fixed',
    value: 0 
  });

  useEffect(() => {
    const q = query(collection(db, 'promoCodes'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPromoCodes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'promoCodes'));
    return unsubscribe;
  }, []);

  const addPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'promoCodes'), { 
        ...newPromo, 
        isActive: true,
        createdAt: serverTimestamp() 
      });
      setNewPromo({ code: '', type: 'percentage', value: 0 });
    } catch (err) {
      console.error(err);
      alert('Xəta!');
    }
  };

  const deletePromo = async (id: string) => {
    if (confirm('Silmek istəyirsiniz?')) {
      await deleteDoc(doc(db, 'promoCodes', id));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <section className="bg-white p-8 md:p-12 rounded-[3rem] shadow-sm border border-black/5 flex flex-col gap-8">
        <h4 className="text-xl font-bold flex items-center gap-3">
          <Type className="text-purple-500" /> Yeni Promo Kod
        </h4>
        <form onSubmit={addPromo} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest ml-4">KOD</label>
            <input required placeholder="Məs: YAY2024" value={newPromo.code} onChange={e => setNewPromo({...newPromo, code: e.target.value.toUpperCase()})} className="px-6 py-4 bg-off-white rounded-2xl outline-none font-black tracking-widest" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest ml-4">NÖVÜ</label>
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => setNewPromo({...newPromo, type: 'percentage'})}
                className={cn("flex-grow py-4 rounded-xl font-bold transition-all", newPromo.type === 'percentage' ? "bg-black text-white" : "bg-off-white text-charcoal/40")}
              >
                Faiz (%)
              </button>
              <button 
                type="button"
                onClick={() => setNewPromo({...newPromo, type: 'fixed'})}
                className={cn("flex-grow py-4 rounded-xl font-bold transition-all", newPromo.type === 'fixed' ? "bg-black text-white" : "bg-off-white text-charcoal/40")}
              >
                Məbləğ (AZN)
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest ml-4">DƏYƏR</label>
            <input required type="number" step="0.01" value={newPromo.value} onChange={e => setNewPromo({...newPromo, value: Number(e.target.value)})} className="px-6 py-4 bg-off-white rounded-2xl outline-none font-black" />
          </div>

          <button type="submit" className="w-full py-5 bg-brand-blue text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-brand-blue/20 hover:scale-[1.02] active:scale-95 transition-all">Promo Kod Yarat</button>
        </form>
      </section>

      <section className="bg-white p-8 md:p-12 rounded-[3rem] shadow-sm border border-black/5 flex flex-col gap-8">
        <h4 className="text-xl font-bold">Mövcud Kodlar ({promoCodes.length})</h4>
        <div className="flex flex-col gap-4">
          {promoCodes.map(promo => (
            <div key={promo.id} className="p-6 bg-off-white rounded-[2rem] border border-black/5 flex items-center justify-between group hover:border-brand-blue transition-all">
              <div className="flex flex-col gap-1">
                <span className="font-black text-lg text-charcoal tracking-widest">{promo.code}</span>
                <span className="text-xs font-bold text-brand-blue uppercase">
                  {promo.type === 'percentage' ? `-${promo.value}% Faiz` : `-${promo.value} AZN Sabit`}
                </span>
              </div>
              <button onClick={() => deletePromo(promo.id)} className="p-3 bg-red-50 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all">
                <Trash2 size={20} />
              </button>
            </div>
          ))}
          {promoCodes.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center gap-4 text-charcoal/20">
              <Type size={48} strokeWidth={1} />
              <p className="font-bold uppercase tracking-widest text-xs">Kod yoxdur</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function AdminSettings() {
  const [cardNumber, setCardNumber] = useState('');
  const [tawkId, setTawkId] = useState('');
  const [telegramToken, setTelegramToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [shopName, setShopName] = useState('');
  const [topBarText, setTopBarText] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      const docRef = doc(db, 'settings', 'global');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCardNumber(data.cardNumber || '');
        setTawkId(data.tawkId || '');
        setTelegramToken(data.telegramToken || import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '');
        setTelegramChatId(data.telegramChatId || import.meta.env.VITE_TELEGRAM_CHAT_ID || '');
        setShopName(data.shopName || '');
        setTopBarText(data.topBarText || '');
      }
    };
    fetchSettings();
  }, []);

  const saveSettings = async () => {
    await setDoc(doc(db, 'settings', 'global'), { 
      cardNumber,
      tawkId,
      telegramToken,
      telegramChatId,
      shopName,
      topBarText
    }, { merge: true });
    alert('Tənzimləmələr yeniləndi!');
  };

  const testTelegram = async () => {
    if (!telegramToken || !telegramChatId) {
      alert('Token və Chat ID doldurulmalıdır!');
      return;
    }
    
    try {
      const response = await fetch('/api/telegram/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: '<b>🔔 Test Mesajı!</b>\nTelegram bot tənzimləmələri uğurla yoxlanıldı.',
          token: telegramToken,
          chatId: telegramChatId
        })
      });
      
      const result = await response.json();
      if (result.ok) {
        alert('✅ Test mesajı göndərildi! Telegram-ı yoxlayın.');
      } else {
        alert('❌ Xəta: ' + (result.description || result.error || 'Naməlum xəta'));
      }
    } catch (err: any) {
      alert('❌ Server xətası: ' + err.message);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Kopyalandı!');
  };

  return (
    <div className="flex flex-col gap-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <section className="bg-white p-8 md:p-12 rounded-[3rem] shadow-sm border border-black/5 flex flex-col gap-8 overflow-hidden">
          <h4 className="text-xl font-bold flex items-center gap-3">
             <LayoutDashboard className="text-brand-blue" /> Mağaza Məlumatları
          </h4>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest ml-4">MAĞAZA ADI</label>
              <input value={shopName} onChange={e => setShopName(e.target.value)} className="w-full px-6 py-4 bg-off-white rounded-2xl outline-none font-bold" placeholder="Purely Official" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest ml-4">TIRE YAZISI (TOP BAR)</label>
              <input value={topBarText} onChange={e => setTopBarText(e.target.value)} className="w-full px-6 py-4 bg-off-white rounded-2xl outline-none font-medium" placeholder="Bütün sifarişlərə 10% endirim!" />
            </div>
          </div>
        </section>

        <section className="bg-white p-8 md:p-12 rounded-[3rem] shadow-sm border border-black/5 flex flex-col gap-8">
          <h4 className="text-xl font-bold flex items-center gap-3">
            <CreditCard className="text-brand-blue" /> Ödəniş Tənzimləmələri
          </h4>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest ml-4">KART NÖMRƏSİ</label>
              <div className="relative group">
                <input 
                  value={cardNumber} 
                  onChange={e => setCardNumber(e.target.value)} 
                  className="w-full px-6 py-4 bg-off-white rounded-2xl outline-none font-black tracking-widest tabular-nums focus:ring-2 focus:ring-brand-blue/10 transition-all pr-12" 
                />
                <button 
                  onClick={() => copyToClipboard(cardNumber)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal/20 hover:text-brand-blue transition-colors"
                >
                  <Copy size={18} />
                </button>
              </div>
            </div>
            
            <div className="p-6 bg-brand-blue/5 rounded-2xl border border-brand-blue/10">
              <p className="text-xs font-medium text-brand-blue leading-relaxed">
                Müştərilər online ödəniş seçdikdə bu kart nömrəsini görəcəklər. Çek yükləmək məcburidir.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white p-8 md:p-12 rounded-[3rem] shadow-sm border border-black/5 flex flex-col gap-8">
          <h4 className="text-xl font-bold flex items-center gap-3 text-red-500">
            <Bot /> Telegram Bot & Chat
          </h4>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest ml-4">BOT TOKEN</label>
              <input value={telegramToken} onChange={e => setTelegramToken(e.target.value)} className="w-full px-6 py-3 bg-off-white rounded-xl outline-none text-xs font-mono" placeholder="867390..." />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest ml-4">CHAT ID</label>
              <input value={telegramChatId} onChange={e => setTelegramChatId(e.target.value)} className="w-full px-6 py-3 bg-off-white rounded-xl outline-none text-xs font-mono" placeholder="6729..." />
            </div>
            <button 
              onClick={testTelegram}
              className="mt-2 py-3 bg-brand-blue/10 text-brand-blue rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-brand-blue hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <Send size={14} /> Botu Yoxla
            </button>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <section className="bg-white p-8 md:p-12 rounded-[3rem] shadow-sm border border-black/5 flex flex-col gap-8">
          <h4 className="text-xl font-bold flex items-center gap-3 text-cyan-500">
            <MessageSquare /> Canlı Dəstək (Tawk.to)
          </h4>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest ml-4">PROPERTY ID</label>
              <input value={tawkId} onChange={e => setTawkId(e.target.value)} className="w-full px-6 py-4 bg-off-white rounded-2xl outline-none font-mono text-sm" placeholder="69efd342..." />
            </div>
            <div className="p-6 bg-cyan-50 rounded-2xl border border-cyan-100 italic text-[10px] text-cyan-600 font-bold uppercase tracking-widest">
              ID dəyişdikdən sonra sayt avtomatik tənzimlənəcək.
            </div>
          </div>
        </section>
      </div>

      <div className="flex justify-center mt-6">
        <button 
          onClick={saveSettings} 
          className="px-12 py-6 bg-brand-blue text-white rounded-[2.5rem] font-black uppercase tracking-[0.3em] shadow-2xl shadow-brand-blue/40 hover:scale-105 active:scale-95 transition-all text-sm"
        >
          Bütün Dəyişiklikləri Yadda Saxla
        </button>
      </div>
    </div>
  );
}
