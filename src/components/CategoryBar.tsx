import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Category } from '../types';

export default function CategoryBar() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'categories'));
    return () => unsubscribe();
  }, []);

  if (categories.length === 0) return null;

  return (
    <section className="px-6 -mt-16 relative z-10">
      <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-6 md:gap-12">
        {categories.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            viewport={{ once: true }}
            onClick={() => navigate('/products', { state: { category: category.name } })}
            className="flex flex-col items-center gap-4 group cursor-pointer"
          >
            <div className="w-20 h-20 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-white shadow-lg group-hover:shadow-xl transition-all group-hover:-translate-y-2">
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="text-xs md:text-sm font-semibold tracking-wide uppercase text-charcoal/70 group-hover:text-brand-blue transition-colors">
              {category.name}
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
