
import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useProductContext } from '../context/ProductContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useCategory } from '../context/CategoryContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import ProductGrid from '../components/ProductGrid.tsx';
import Pagination from '../components/Pagination.tsx';
import SearchFilters from '../components/SearchFilters.tsx';
import StarRating from '../components/StarRating.tsx';
import type { Category, SubCategory, Language, ProductCondition } from '../types.ts';

type SortOption = 'relevance' | 'price_asc' | 'price_desc' | 'newest';

const useQuery = () => new URLSearchParams(useLocation().search);

const getCategoryName = (category: Category | SubCategory, language: Language) => {
    return category.names?.[language] || category.names?.en || category.id;
};

const NoResults: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="text-center py-12 bg-white rounded-lg shadow-md">
      <div className="mx-auto h-24 w-24 text-gray-300">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 15l6 6" />
        </svg>
      </div>
      <h2 className="mt-4 text-2xl font-bold text-gray-800">{t('search_no_results_title')}</h2>
      <p className="mt-2 text-gray-500">{t('search_try_something_else')}</p>
      <div className="mt-6 text-left max-w-md mx-auto">
        <h3 className="font-semibold text-gray-700">{t('search_no_results_suggestions_title')}</h3>
        <ul className="list-disc list-inside text-gray-500 mt-2 space-y-1">
          <li>{t('search_no_results_suggestion1')}</li>
          <li>{t('search_no_results_suggestion2')}</li>
          <li>{t('search_no_results_suggestion3')}</li>
        </ul>
      </div>
      <Link to="/" className="mt-8 inline-block bg-amazon-yellow text-amazon-blue font-bold py-3 px-8 rounded-lg hover:bg-amazon-yellow-light transition-colors text-lg">
        {t('search_browse_categories')}
      </Link>
    </div>
  );
};

const SellerInfoCard: React.FC<{ seller: { name: string; isVerified?: boolean; avgRating: number; ratingCount: number } }> = ({ seller }) => {
    const { t } = useLanguage();
    return (
        <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex items-center space-x-4">
            <div>
                <h2 className="text-xl font-bold flex items-center">{seller.name}
                {seller.isVerified && (
                  <div className="relative group ml-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                     <div className="absolute bottom-full mb-2 w-max bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {t('seller_verified_badge_tooltip')}
                    </div>
                  </div>
                )}
                </h2>
                <div className="flex items-center text-sm text-gray-600 mt-1">
                    <StarRating rating={seller.avgRating} />
                    <span className="ml-2">{seller.avgRating > 0 ? `${seller.avgRating.toFixed(1)} (${seller.ratingCount} ${t('ratings')})` : t('reviews_no_reviews')}</span>
                </div>
            </div>
        </div>
    );
};


const SearchResultsPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const query = useQuery();

    const searchQuery = query.get('q') || '';
    const categoryIdFromUrl = query.get('categoryId');
    const sellerIdFromUrl = query.get('sellerId');

    const { products: allProducts, searchProducts, getPaginatedProducts, loading } = useProductContext();
    const { t, language } = useLanguage();
    const { categories, getSubCategoryById } = useCategory();
    const { getStoredUser } = useAuth();
    
    const [currentPage, setCurrentPage] = useState(1);
    const [sortOption, setSortOption] = useState<SortOption>('relevance');
    const [filters, setFilters] = useState({
        condition: (query.get('condition') as ProductCondition | 'all') || 'all',
        minPrice: query.get('minPrice') || '',
        maxPrice: query.get('maxPrice') || '',
    });

    useEffect(() => {
        setFilters({
            condition: (query.get('condition') as ProductCondition | 'all') || 'all',
            minPrice: query.get('minPrice') || '',
            maxPrice: query.get('maxPrice') || '',
        });
        setCurrentPage(1);
    }, [location.search]);

    const handleFilterChange = (name: string, value: string) => {
        setFilters(prev => ({ ...prev, [name]: value as any }));
    };

    const handleApplyFilters = () => {
        const params = new URLSearchParams(location.search);
        Object.entries(filters).forEach(([key, value]) => {
            if (value && value !== 'all') {
                params.set(key, value);
            } else {
                params.delete(key);
            }
        });
        navigate(`${location.pathname}?${params.toString()}`);
    };
    
    const allResults = useMemo(() => {
        if (sellerIdFromUrl) return allProducts.filter(p => p.sellerId === Number(sellerIdFromUrl));
        if (categoryIdFromUrl) {
            const mainCat = categories.find(c => c.id === categoryIdFromUrl);
            if (mainCat && mainCat.subcategories.length > 0) {
                const subCategoryIds = mainCat.subcategories.map(s => s.id);
                return allProducts.filter(p => subCategoryIds.includes(p.categoryId));
            } else {
                return allProducts.filter(p => p.categoryId === categoryIdFromUrl);
            }
        }
        return searchProducts(searchQuery);
    }, [searchQuery, categoryIdFromUrl, sellerIdFromUrl, categories, allProducts, searchProducts]);
      
    const filteredAndSortedResults = useMemo(() => {
        let results = [...allResults];

        if (filters.condition !== 'all') results = results.filter(p => p.condition === filters.condition);
        if (filters.minPrice) results = results.filter(p => p.price >= parseFloat(filters.minPrice));
        if (filters.maxPrice) results = results.filter(p => p.price <= parseFloat(filters.maxPrice));

        switch (sortOption) {
            case 'price_asc': results.sort((a, b) => a.price - b.price); break;
            case 'price_desc': results.sort((a, b) => b.price - a.price); break;
            case 'newest': results.sort((a, b) => b.id - a.id); break;
        }
        
        return results;
    }, [allResults, filters, sortOption]);

    const { products: paginatedResults, totalPages } = useMemo(() => {
        return getPaginatedProducts(filteredAndSortedResults, currentPage);
    }, [filteredAndSortedResults, currentPage, getPaginatedProducts]);

    const sellerInfo = useMemo(() => {
        if (!sellerIdFromUrl) return null;
        const seller = getStoredUser(Number(sellerIdFromUrl));
        if (!seller) return null;
        const sellerAvgRating = seller.sellerRatings && seller.sellerRatings.length > 0
            ? seller.sellerRatings.reduce((sum, r) => sum + r.rating, 0) / seller.sellerRatings.length
            : 0;
        return { name: seller.name, isVerified: seller.isVerified, avgRating: sellerAvgRating, ratingCount: seller.sellerRatings?.length || 0 };
    }, [sellerIdFromUrl, getStoredUser]);

    const pageTitle = useMemo(() => {
        if (loading) return t('search_searching');
        if (sellerIdFromUrl) return t('search_results_for_seller', { name: sellerInfo?.name || '' });
        if (categoryIdFromUrl) {
            const catInfo = getSubCategoryById(categoryIdFromUrl);
            if (catInfo) return getCategoryName(catInfo.subcategory, language);
            const mainCat = categories.find(c => c.id === categoryIdFromUrl);
            if (mainCat) return getCategoryName(mainCat, language);
        }
        if (searchQuery) return <>{t('search_results_for', { count: filteredAndSortedResults.length, query: '' })}<span className="text-gray-900">"{searchQuery}"</span></>;
        return t('search_results_for', { count: filteredAndSortedResults.length, query: '' });
    }, [loading, categoryIdFromUrl, searchQuery, sellerIdFromUrl, filteredAndSortedResults.length, getSubCategoryById, categories, t, sellerInfo, language]);

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <aside className="md:col-span-1">
                    <SearchFilters filters={filters} onFilterChange={handleFilterChange} onApply={handleApplyFilters} productCount={filteredAndSortedResults.length} />
                </aside>
                <main className="md:col-span-3">
                    {sellerInfo && <SellerInfoCard seller={sellerInfo} />}
                    <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                        <h1 className="text-2xl font-bold text-gray-800">{pageTitle}</h1>
                        <div>
                            <label htmlFor="sort-options" className="sr-only">{t('sort_by')}</label>
                            <select id="sort-options" value={sortOption} onChange={(e) => setSortOption(e.target.value as SortOption)} className="p-2 border-gray-300 rounded-md shadow-sm">
                                <option value="relevance">{t('sort_relevance')}</option>
                                <option value="price_asc">{t('sort_price_low_high')}</option>
                                <option value="price_desc">{t('sort_price_high_low')}</option>
                                <option value="newest">{t('sort_newest')}</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <ProductGrid products={[]} loading={true} />
                    ) : (
                        <>
                            {paginatedResults.length > 0 ? (
                                <>
                                    <ProductGrid products={paginatedResults} />
                                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                                </>
                            ) : (
                                <NoResults />
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default SearchResultsPage;