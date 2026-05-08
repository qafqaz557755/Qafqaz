import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  CreditCard, 
  Truck, 
  Smartphone, 
  Copy, 
  CheckCircle2, 
  Upload,
  Send,
  Loader2,
  FileText,
  Layers,
  Tag,
  Ticket
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { auth, db, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  doc, 
  onSnapshot, 
  runTransaction,
  query,
  where,
  getDocs
} from 'firebase/firestore';


import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';

enum PaymentMethod {
  ONLINE = 'Online (Kartla)',
  CASH = 'Qapıda ödəniş',
  POS = 'POS terminal ilə ödəniş'
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, totalPrice: cartTotalPrice, clearCart } = useCart();
  const { user, userData } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    note: ''
  });
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cardNumber, setCardNumber] = useState('Yüklənir...');
  const [telegramConfig, setTelegramConfig] = useState({
    token: import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '',
    chatId: import.meta.env.VITE_TELEGRAM_CHAT_ID || ''
  });

  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{code: string, type: string, value: number} | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

  const needsLogo = items.some(item => item.logoRequired);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (items.length === 0 && !isSuccess) {
      navigate('/products');
    }

    if (userData) {
      setFormData({
        name: `${userData.firstName} ${userData.lastName}`.trim(),
        phone: userData.phone || '',
        address: '', // Could be saved in profile too
        note: ''
      });
    }

    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCardNumber(data.cardNumber || '');
        setTelegramConfig({
          token: data.telegramToken || import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '',
          chatId: data.telegramChatId || import.meta.env.VITE_TELEGRAM_CHAT_ID || ''
        });
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'settings/global'));
    return unsubSettings;
  }, [items, isSuccess, navigate, userData]);

  const applyPromo = async () => {
    if (!promoCode) return;
    setPromoLoading(true);
    setPromoError('');
    try {
      const q = query(collection(db, 'promoCodes'), where('code', '==', promoCode.toUpperCase()), where('isActive', '==', true));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        setPromoError('Yanlış və ya aktiv olmayan promo kod');
      } else {
        const data = snapshot.docs[0].data();
        setAppliedPromo({ code: promoCode.toUpperCase(), type: data.type, value: data.value });
      }
    } catch (err) {
      setPromoError('Promo kod yoxlanarkən xəta baş verdi');
    } finally {
      setPromoLoading(false);
    }
  };

  const calculateDiscount = () => {
    if (!appliedPromo) return 0;
    if (appliedPromo.type === 'percentage') {
      return (cartTotalPrice * appliedPromo.value) / 100;
    }
    return appliedPromo.value;
  };

  const finalPrice = Math.max(0, cartTotalPrice - calculateDiscount());

  const handleCopyCard = () => {
    navigator.clipboard.writeText(cardNumber.replace(/\s/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceipt(e.target.files[0]);
    }
  };

  const escapeHtml = (unsafe: string) => {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

    const sendOrderToTelegram = async (orderData: any, retryCount = 0): Promise<boolean> => {
    if (!telegramConfig.token || !telegramConfig.chatId) {
      console.warn('Telegram configuration is missing');
      return false;
    }

    const MAX_RETRIES = 2;

    let message = '';
    try {
      message = `
<b>📦 YENİ SİFARİŞ! (#${orderData.id?.slice(-6) || '???'})</b>

<b>👤 Müştəri:</b> ${escapeHtml(orderData.customerName || 'Bilinmir')}
<b>📞 Nömrə:</b> ${escapeHtml(orderData.phone || 'Bilinmir')}
<b>📍 Ünvan:</b> ${escapeHtml(orderData.address || 'Bilinmir')}
<b>📝 Qeyd:</b> ${escapeHtml(orderData.note || 'Yoxdur')}

<b>🛒 Məhsullar:</b>
${(orderData.items || []).map((item: any) => `• ${escapeHtml(item.name || 'Məhsul')} x ${item.quantity || 1} - ${(Number(item.price || 0) * (item.quantity || 1)).toFixed(2)} AZN`).join('\n')}

<b>💰 Toplam:</b> ${(Number(orderData.totalPrice) || 0).toFixed(2)} AZN
<b>💳 Ödəniş:</b> ${orderData.paymentMethod || 'Bilinmir'}
${orderData.promoCode ? `<b>🎟️ Promo:</b> ${orderData.promoCode}` : ''}

<i>🖼️ Loqo və Çek aşağıdakı mesajlarda göndəriləcək.</i>
`.trim();
    } catch (msgErr) {
      console.error('Message construction error:', msgErr);
      message = '⚠️ Sifariş məlumatları hazırlarkən xəta baş verdi.';
    }

    try {
      console.log(`[${new Date().toISOString()}] Sending Telegram notification...`);
      
      const payload = {
        message: message,
        token: telegramConfig.token.trim(),
        chatId: telegramConfig.chatId.trim()
      };

      const response = await fetch('/api/telegram/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      return result.ok;
    } catch (error: any) {
      console.error(`Telegram Error:`, error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.address) return;
    if (needsLogo && !logoFile) {
      alert('Zəhmət olmasa logonu yükləyin');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitStatus('Sifariş hazırlanır...');

    const sendPhotoToTelegram = async (base64Photo: string, caption: string): Promise<boolean> => {
      try {
        const response = await fetch('/api/telegram/sendPhoto', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            photo: base64Photo,
            caption: caption,
            token: telegramConfig.token.trim(),
            chatId: telegramConfig.chatId.trim()
          })
        });
        const result = await response.json();
        return result.ok;
      } catch (err) {
        return false;
      }
    };

    try {
      // 1. Transaction to reduce stock
      setSubmitStatus('Stok yoxlanılır...');
      let finalOrderData: any = null;

      await runTransaction(db, async (transaction) => {
        for (const item of items) {
          const productRef = doc(db, 'products', item.id);
          const productDoc = await transaction.get(productRef);
          if (!productDoc.exists()) throw new Error(`Məhsul tapılmadı: ${item.name}`);
          
          const currentStock = productDoc.data().stock || 0;
          if (currentStock < item.quantity) {
             throw new Error(`Kifayət qədər stok yoxdur: ${item.name}`);
          }
          
          transaction.update(productRef, {
            stock: currentStock - item.quantity
          });
        }

        // 2. Prepare Order Data
        finalOrderData = {
          userId: user?.uid || null,
          customerName: formData.name,
          phone: formData.phone,
          address: formData.address,
          note: formData.note,
          items: items.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price })),
          totalPrice: finalPrice,
          paymentMethod,
          promoCode: appliedPromo?.code || null,
          status: 'Yeni',
          createdAt: serverTimestamp()
        };

        // 3. Save to Firestore
        const ordersRef = collection(db, 'orders');
        const newOrderDoc = doc(ordersRef);
        finalOrderData.id = newOrderDoc.id;
        transaction.set(newOrderDoc, finalOrderData);
      });

      // 4. Send notifications AFTER successful transaction
      if (finalOrderData) {
        setSubmitStatus('Sifariş tamamlanır...');
        try {
          await sendOrderToTelegram(finalOrderData);
          
          const processAndSend = async (file: File, label: string) => {
            try {
              const options = { maxSizeMB: 0.2, maxWidthOrHeight: 1024, useWebWorker: true, initialQuality: 0.5 };
              const compressedFile = await imageCompression(file, options);
              const reader = new FileReader();
              const base64Promise = new Promise<string>((resolve) => {
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(compressedFile);
              });
              const base64 = await base64Promise;
              await sendPhotoToTelegram(base64, `<b>${label}:</b> ${finalOrderData.customerName} (${finalOrderData.phone})`);
            } catch (err) {
              console.warn('Photo send error:', err);
            }
          };

          if (logoFile) {
            await processAndSend(logoFile, 'Müştəri Logosu');
          }
          if (receipt) {
            await processAndSend(receipt, 'Ödəniş Çeki');
          }
        } catch (notifErr) {
          console.warn('Notification error (non-blocking):', notifErr);
        }
      }

      setIsSuccess(true);
      clearCart();
    } catch (error: any) {
      console.error('Checkout error:', error);
      let errorMessage = 'Sifariş zamanı xəta baş verdi.';
      if (error.message?.includes('permissions')) {
        errorMessage = 'Xəta: Giriş icazəsi yoxdur. Zəhmət olmasa interneti yoxlayın və ya admin ilə əlaqə saxlayın.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
      setSubmitStatus('');
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-off-white pt-32 pb-20 px-6 flex flex-col items-center text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-12 rounded-[3.5rem] shadow-xl border border-white max-w-lg w-full flex flex-col items-center gap-6"
        >
          <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-200">
            <CheckCircle2 size={48} />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-charcoal">Təşəkkür edirik!</h1>
            <p className="text-charcoal/50">Sifarişiniz qeydə alındı.</p>
          </div>
          <button onClick={() => navigate('/')} className="mt-4 px-10 py-4 bg-brand-blue text-white rounded-full font-bold shadow-xl">Ana səhifəyə qayıt</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-off-white pt-32 pb-20 px-4 md:px-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-charcoal/40 hover:text-brand-blue transition-colors mb-8 group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> GERİ
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-12">
          <div className="lg:col-span-2 flex flex-col gap-6 md:gap-8">
            <section className="bg-white p-6 md:p-12 rounded-[2.5rem] md:rounded-[3rem] shadow-sm border border-white/50">
              <h2 className="text-xl md:text-2xl font-bold text-charcoal mb-6 md:mb-10 flex items-center gap-3">
                <Truck className="text-brand-blue" size={24} /> Çatdırılma Məlumatları
              </h2>
              <form id="checkout-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-charcoal/40 ml-4">AD SOYAD</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ad Soyad" className="px-6 py-4 bg-off-white rounded-2xl border-none outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all font-medium text-sm" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-charcoal/40 ml-4">TELEFON</label>
                  <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+994" className="px-6 py-4 bg-off-white rounded-2xl border-none outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all font-medium text-sm" />
                </div>
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-charcoal/40 ml-4">ÜNVAN</label>
                  <input required type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Küçə, mənzil, şəhər..." className="px-6 py-4 bg-off-white rounded-2xl border-none outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all font-medium text-sm" />
                </div>
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-charcoal/40 ml-4">QEYD (OPSİONAL)</label>
                  <textarea value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} placeholder="Kuryer üçün əlavə məlumat..." rows={2} className="px-6 py-4 bg-off-white rounded-2xl border-none outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all font-medium resize-none text-sm" />
                </div>
              </form>
            </section>

            <section className="bg-white p-6 md:p-12 rounded-[2.5rem] shadow-sm border border-white/50">
               <h2 className="text-xl md:text-2xl font-bold text-charcoal mb-8 flex items-center gap-3">
                <Ticket className="text-brand-blue" size={24} /> Promo Kod
              </h2>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-grow relative">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/30 w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder="PROMO KODU DAXİL EDİN"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    className="w-full pl-11 pr-4 py-4 bg-off-white rounded-2xl border-none outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all font-bold tracking-widest text-sm"
                  />
                </div>
                <button 
                  onClick={applyPromo}
                  disabled={promoLoading || !promoCode}
                  className="px-8 py-4 bg-charcoal text-white rounded-2xl font-bold hover:bg-black transition-colors disabled:opacity-50"
                >
                  {promoLoading ? 'Yoxlanılır...' : 'TƏTBİQ ET'}
                </button>
              </div>
              {promoError && <p className="text-red-500 text-xs mt-3 font-medium ml-4">{promoError}</p>}
              {appliedPromo && <p className="text-green-500 text-xs mt-3 font-medium ml-4 uppercase tracking-widest"><b>{appliedPromo.code}</b> tətbiq edildi!</p>}
            </section>

            <section className="bg-white p-6 md:p-12 rounded-[2.5rem] shadow-sm border border-white/50">
               <h2 className="text-xl md:text-2xl font-bold text-charcoal mb-10 flex items-center gap-3">
                <CreditCard className="text-brand-blue" size={24} /> Ödəniş Üsulu
              </h2>
              <div className="grid grid-cols-3 gap-2 md:gap-4">
                {[
                  { id: PaymentMethod.ONLINE, icon: CreditCard, label: 'Online' },
                  { id: PaymentMethod.CASH, icon: Truck, label: 'Qapıda' },
                  { id: PaymentMethod.POS, icon: Smartphone, label: 'POS' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setPaymentMethod(opt.id as PaymentMethod)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 h-24 md:h-28 rounded-3xl border-2 transition-all group",
                      paymentMethod === opt.id ? "border-brand-blue bg-[#EBF5FF]" : "border-black/5 hover:border-black/10"
                    )}
                  >
                    <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-colors", paymentMethod === opt.id ? "bg-brand-blue text-white" : "bg-off-white text-charcoal/40 group-hover:bg-black/5")}>
                      <opt.icon size={18} className="md:w-6 md:h-6" />
                    </div>
                    <span className={cn("text-[9px] md:text-[10px] font-black uppercase tracking-widest text-center px-1", paymentMethod === opt.id ? "text-brand-blue" : "text-charcoal/40")}>{opt.label}</span>
                  </button>
                ))}
              </div>

              <AnimatePresence>
                {paymentMethod === PaymentMethod.ONLINE && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="mt-8 p-6 md:p-8 bg-off-white rounded-[2rem] border border-black/5 flex flex-col gap-8">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-charcoal/40 text-center md:text-left">KART NÖMRƏSİ</span>
                          <span className="text-xl font-bold tracking-widest text-charcoal tabular-nums">{cardNumber}</span>
                        </div>
                        <button onClick={handleCopyCard} className="flex items-center justify-center gap-2 px-6 py-3 bg-white rounded-full shadow-sm text-xs font-bold uppercase tracking-widest text-brand-blue hover:scale-105 transition-all">{copied ? <CheckCircle2 size={16} /> : <Copy size={16} />} {copied ? 'KOPYALANDI' : 'KOPYALA'} </button>
                      </div>
                      <div className="flex flex-col gap-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-charcoal/40 text-center md:text-left">ÖDƏNİŞ QƏBZİ (ÇEK)</span>
                        <label className="relative group cursor-pointer">
                          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                          <div className={cn("flex flex-col items-center justify-center gap-3 p-10 border-2 border-dashed rounded-[1.5rem] transition-all", receipt ? "border-brand-blue bg-brand-blue/5" : "border-black/10 hover:border-brand-blue/30 hover:bg-brand-blue/5")}>
                            {receipt ? ( <> <FileText className="text-brand-blue" size={40} /> <span className="text-sm font-bold text-brand-blue">{receipt.name}</span> </>) : ( <> <Upload className="text-charcoal/20 group-hover:text-brand-blue transition-colors" size={40} /> <span className="text-sm font-bold text-charcoal/40 text-center">Şəkil yüklə və ya çək</span> </>) }
                          </div>
                        </label>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {needsLogo && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="mt-8 p-6 md:p-8 bg-brand-blue/5 rounded-[2rem] border border-brand-blue/10 flex flex-col gap-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-blue">LOGO TƏLƏB OLUNUR</span>
                        <p className="text-sm font-medium text-charcoal/60">Səbətinizdəki bəzi məhsullara logo lazımdır.</p>
                      </div>
                      <label className="relative group cursor-pointer">
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && setLogoFile(e.target.files[0])} />
                        <div className={cn("flex flex-col items-center justify-center gap-3 p-10 border-2 border-dashed rounded-[1.5rem] transition-all", logoFile ? "border-brand-blue bg-white" : "border-brand-blue/40 hover:border-brand-blue")}>
                          {logoFile ? ( <> <CheckCircle2 className="text-brand-blue" size={40} /> <span className="text-sm font-bold text-brand-blue">{logoFile.name}</span> </>) : ( <> <Layers className="text-brand-blue/40 group-hover:text-brand-blue transition-colors" size={40} /> <span className="text-sm font-bold text-brand-blue">Logo Yüklə</span> </>) }
                        </div>
                      </label>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          </div>

          <div className="flex flex-col gap-8">
            <section className="bg-charcoal text-white p-8 md:p-10 rounded-[3rem] shadow-2xl flex flex-col gap-8 lg:sticky lg:top-32">
              <h3 className="text-xl font-bold">Sifarişin Xülasəsi</h3>
              <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white/10 overflow-hidden flex-shrink-0">
                        <img src={item.images?.[0] || item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium line-clamp-1">{item.name}</span>
                        <span className="text-[10px] text-white/40">{item.quantity} x {item.price.toFixed(2)} ₼</span>
                      </div>
                    </div>
                    <span className="text-sm font-bold">{(item.price * item.quantity).toFixed(2)} ₼</span>
                  </div>
                ))}
              </div>
              <div className="h-[1px] bg-white/10" />
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm text-white/60">
                  <span>Məhsul cəmi</span>
                  <span>{cartTotalPrice.toFixed(2)} ₼</span>
                </div>
                {appliedPromo && (
                  <div className="flex justify-between text-sm text-green-400 font-bold">
                    <span>Endirim ({appliedPromo.code})</span>
                    <span>-{calculateDiscount().toFixed(2)} ₼</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-white/60">
                  <span>Çatdırılma</span>
                  <span className="text-green-400 font-bold text-[10px]">PULSUZ</span>
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/10">
                  <span className="text-lg font-bold">Toplam</span>
                  <span className="text-3xl font-black tabular-nums">{finalPrice.toFixed(2)} ₼</span>
                </div>
              </div>
              <button 
                type="submit" 
                form="checkout-form" 
                disabled={isSubmitting || (paymentMethod === PaymentMethod.ONLINE && !receipt) || (needsLogo && !logoFile)} 
                className={cn("w-full py-5 rounded-[2rem] font-bold text-lg flex items-center justify-center gap-3 transition-all", isSubmitting || (paymentMethod === PaymentMethod.ONLINE && !receipt) || (needsLogo && !logoFile) ? "bg-white/10 text-white/30 cursor-not-allowed" : "bg-brand-blue text-white shadow-2xl hover:scale-[1.02] active:scale-95")}
              >
                {isSubmitting ? ( <div className="flex flex-col items-center"> <Loader2 className="animate-spin mb-1" size={24} /> <span className="text-[10px] opacity-70 normal-case tracking-normal">{submitStatus}</span> </div> ) : ( <> <Send size={20} /> Sifariş ver </> )}
              </button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
