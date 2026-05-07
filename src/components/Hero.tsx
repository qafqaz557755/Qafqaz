import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { cn, getYoutubeId } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Hero() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [slides, setSlides] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'banners'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, snapshot => {
      const bannerData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (bannerData.length > 0) {
        setSlides(bannerData);
      } else {
        // Fallback
        setSlides([
          {
            title: 'Minimalist Təmizlik',
            subtitle: 'Eviniz üçün premium təmizlik vasitələri',
            imageUrl: 'https://images.unsplash.com/photo-1584622781564-1d9876a13d00?q=80&w=1920&auto=format&fit=crop',
          }
        ]);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides]);

  if (slides.length === 0) return null;

  return (
    <section className="relative h-[85vh] w-full overflow-hidden px-6 pt-24 pb-6">
      <div className="relative h-full w-full rounded-[2.5rem] overflow-hidden shadow-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            {slides[current].videoUrl ? (
              getYoutubeId(slides[current].videoUrl) ? (
                <div className="absolute inset-0 pointer-events-none">
                  <iframe
                    src={`https://www.youtube.com/embed/${getYoutubeId(slides[current].videoUrl)}?autoplay=1&mute=1&controls=0&loop=1&playlist=${getYoutubeId(slides[current].videoUrl)}&modestbranding=1&showinfo=0&rel=0&iv_load_policy=3&enablejsapi=1`}
                    className="absolute top-1/2 left-1/2 w-[115%] h-[115%] -translate-x-1/2 -translate-y-1/2 border-none"
                    allow="autoplay; encrypted-media"
                    title="Background Video"
                  />
                </div>
              ) : (
                <video
                  src={slides[current].videoUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                />
              )
            ) : (
              <img
                src={slides[current].imageUrl}
                alt={slides[current].title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="absolute inset-0 bg-black/20" />
            
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-6">
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className={cn("font-black tracking-tighter mb-4", slides[current].titleSize || "text-5xl md:text-7xl")}
                style={{ color: slides[current].titleColor }}
              >
                {slides[current].title}
              </motion.h1>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className={cn("font-bold mb-8 max-w-xl", slides[current].subtitleSize || "text-lg md:text-xl")}
                style={{ color: slides[current].subtitleColor }}
              >
                {slides[current].subtitle}
              </motion.p>
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={() => navigate('/products')}
                className="px-8 py-3 bg-white text-charcoal rounded-full font-medium hover:bg-white/90 transition-all hover:scale-105 active:scale-95"
              >
                İndi kəşf et
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>

        {slides.length > 1 && (
          <>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={cn(
                    "h-1.5 transition-all duration-500 rounded-full",
                    current === i ? "w-8 bg-white" : "w-1.5 bg-white/40"
                  )}
                />
              ))}
            </div>
            
            <button 
              onClick={() => setCurrent((prev) => (prev - 1 + slides.length) % slides.length)}
              className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/20 transition-all hidden md:block"
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              onClick={() => setCurrent((prev) => (prev + 1) % slides.length)}
              className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/20 transition-all hidden md:block"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>
    </section>
  );
}
