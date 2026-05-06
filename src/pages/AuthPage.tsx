import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { User, Lock, Mail, Phone, ArrowRight } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!isLogin) {
      if (formData.password.length < 6) {
        setError('Şifrə minimum 6 simvoldan ibarət olmalıdır');
        setLoading(false);
        return;
      }
      
      const phoneRegex = /^\+?[\d\s-]{9,}$/;
      if (!phoneRegex.test(formData.phone)) {
        setError('Telefon nömrəsi düzgün formatda deyil');
        setLoading(false);
        return;
      }
    }

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;

        // Update profile
        await updateProfile(user, {
          displayName: `${formData.firstName} ${formData.lastName}`
        });

        // Save metadata to Firestore
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          role: 'customer',
          wishlist: [],
          cart: [],
          createdAt: new Date().toISOString()
        });
      }
      navigate('/profile');
    } catch (err: any) {
      setError(err.message || 'Xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-off-white flex items-center justify-center px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden"
      >
        <div className="px-8 pt-12 pb-8">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-charcoal mb-2">
              {isLogin ? 'Xoş Gəldiniz' : 'Qeydiyyat'}
            </h1>
            <p className="text-charcoal/60">
              {isLogin ? 'Hesabınıza daxil olun' : 'Yeni hesab yaradın'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
                  <input
                    type="text"
                    placeholder="Ad"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-off-white/50 border border-charcoal/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all text-sm"
                    value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Soyad"
                    required
                    className="w-full px-4 py-3 bg-off-white/50 border border-charcoal/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all text-sm"
                    value={formData.lastName}
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
              <input
                type="email"
                placeholder="E-poçt"
                required
                className="w-full pl-11 pr-4 py-3 bg-off-white/50 border border-charcoal/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all text-sm"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            {!isLogin && (
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
                <input
                  type="text"
                  placeholder="Telefon"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-off-white/50 border border-charcoal/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all text-sm"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            )}

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
              <input
                type="password"
                placeholder="Şifrə"
                required
                className="w-full pl-11 pr-4 py-3 bg-off-white/50 border border-charcoal/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all text-sm"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            {error && (
              <p className="text-red-500 text-xs mt-2 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-charcoal text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-colors disabled:opacity-50 mt-6"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Daxil Ol' : 'Qeydiyyatı Tamamla'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm font-medium text-charcoal hover:text-brand-blue transition-colors"
            >
              {isLogin ? 'Hesabınız yoxdur? Qeydiyyatdan keçin' : 'Artıq hesabınız var? Daxil olun'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
