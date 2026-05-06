import Hero from '../components/Hero';
import CategoryBar from '../components/CategoryBar';
import ProductGrid from '../components/ProductGrid';
import { Product } from '../types';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();

  const handleProductClick = (product: Product) => {
    navigate(`/product/${product.id}`);
  };

  return (
    <main className="flex-grow">
      <Hero />
      <CategoryBar />
      <ProductGrid onProductClick={handleProductClick} />
      
      {/* Newsletter Section */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="bg-white rounded-[3rem] p-12 md:p-24 flex flex-col items-center text-center gap-8 shadow-sm border border-white/50">
          <div className="flex flex-col gap-4">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-charcoal">
              Yeniliklərdən xəbərdar olun
            </h2>
            <p className="text-charcoal/50 max-w-md mx-auto">
              Yeni məhsullar və xüsusi təkliflər haqqında ilk siz eşidin.
            </p>
          </div>
          
          <form className="w-full max-w-md flex flex-col md:flex-row gap-4" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="E-poçt ünvanınız"
              className="flex-grow px-6 py-4 bg-off-white rounded-full focus:ring-1 focus:ring-brand-blue outline-none border-none text-charcoal font-medium"
            />
            <button className="px-8 py-4 bg-charcoal text-white rounded-full font-bold hover:bg-black transition-all active:scale-95">
              Abunə ol
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
