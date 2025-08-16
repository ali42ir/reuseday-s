
import React, { useMemo } from 'react';
import { useProductContext } from '../context/ProductContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useMarketing } from '../context/MarketingContext.tsx';
import ProductGrid from '../components/ProductGrid.tsx';
import BannerSlider from '../components/BannerSlider.tsx';
import AdBanner from '../components/AdBanner.tsx';
import AdPlaceholder from '../components/AdPlaceholder.tsx';

const HomePage: React.FC = () => {
  const { products, loading } = useProductContext();
  const { advertisements, homepageAdIds } = useMarketing();
  const { t } = useLanguage();

  const homepageSideAds = useMemo(() => {
    const now = new Date();
    // Filter all ads by the selected IDs first, then check status and expiry.
    return advertisements
      .filter(ad => homepageAdIds.includes(ad.id) && ad.status === 'approved' && ad.expiresAt && new Date(ad.expiresAt) > now)
      .slice(0, 4); // Take up to 4 for the sidebars
  }, [advertisements, homepageAdIds]);

  const leftAds = homepageSideAds.slice(0, 2);
  const rightAds = homepageSideAds.slice(2, 4);

  const topElectronics = useMemo(() => {
    return products
      .filter(p => p.categoryId.startsWith('electronics'))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 6);
  }, [products]);
  
  const recentFurniture = useMemo(() => {
    return products
      .filter(p => p.categoryId.startsWith('furniture'))
      .sort((a, b) => b.id - a.id) // Assuming higher ID is newer
      .slice(0, 6);
  }, [products]);


  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      <div className="bg-gray-50 p-8 rounded-lg shadow-xl text-center border border-gray-200">
        <h1 className="text-4xl font-bold text-gray-800 mb-3 font-poppins">
          {t('home_welcome')}
        </h1>
        <p className="text-gray-600 text-lg">
          {t('home_tagline')}
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">{t('home_featured_products')}</h2>
        <div className="flex justify-center items-center gap-6">
          {/* Left Ads */}
          <aside className="hidden md:flex gap-4 flex-shrink-0">
            {leftAds[0] ? <AdBanner ad={leftAds[0]} /> : <AdPlaceholder />}
            {leftAds[1] ? <AdBanner ad={leftAds[1]} /> : <AdPlaceholder />}
          </aside>

          {/* Main Slider */}
          <div className="flex-grow min-w-0">
              <BannerSlider />
          </div>

          {/* Right Ads */}
          <aside className="hidden md:flex gap-4 flex-shrink-0">
            {rightAds[0] ? <AdBanner ad={rightAds[0]} /> : <AdPlaceholder />}
            {rightAds[1] ? <AdBanner ad={rightAds[1]} /> : <AdPlaceholder />}
          </aside>
        </div>
      </div>

      <div className="space-y-12">
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('home_top_in_electronics')}</h2>
          <ProductGrid products={topElectronics} loading={loading && topElectronics.length === 0} />
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('home_recent_in_furniture')}</h2>
          <ProductGrid products={recentFurniture} loading={loading && recentFurniture.length === 0} />
        </section>
      </div>
    </div>
  );
};

export default HomePage;