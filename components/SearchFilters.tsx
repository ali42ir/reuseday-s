import React from 'react';
import { useLanguage } from '../context/LanguageContext.tsx';
import type { ProductCondition } from '../types.ts';

interface SearchFiltersProps {
  filters: {
    condition: ProductCondition | 'all';
    minPrice: string;
    maxPrice: string;
  };
  onFilterChange: (name: string, value: string) => void;
  onApply: () => void;
  productCount: number;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({ filters, onFilterChange, onApply, productCount }) => {
  const { t } = useLanguage();
  const conditions: ProductCondition[] = ['new', 'used_like_new', 'used_good', 'used_acceptable'];

  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    onFilterChange(e.target.name, e.target.value);
  };
  
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply();
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md sticky top-24">
      <h3 className="text-lg font-bold border-b pb-2 mb-4">{t('filters')}</h3>
      <form onSubmit={handleFormSubmit} className="space-y-6">
        <div>
          <label htmlFor="condition-filter" className="block text-sm font-medium text-gray-700">{t('filter_by_condition')}</label>
          <select
            id="condition-filter"
            name="condition"
            value={filters.condition}
            onChange={handleInputChange}
            className="mt-1 block w-full p-2 border-gray-300 rounded-md"
          >
            <option value="all">{t('filter_all_conditions')}</option>
            {conditions.map(c => (
              <option key={c} value={c}>{t(`product_condition_${c}`)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">{t('filter_by_price_range')}</label>
          <div className="flex items-center space-x-2 mt-1">
            <input
              type="number"
              name="minPrice"
              value={filters.minPrice}
              onChange={handleInputChange}
              placeholder="Min"
              aria-label="Minimum price"
              className="w-full p-2 border-gray-300 rounded-md"
              min="0"
            />
            <span>-</span>
            <input
              type="number"
              name="maxPrice"
              value={filters.maxPrice}
              onChange={handleInputChange}
              placeholder="Max"
              aria-label="Maximum price"
              className="w-full p-2 border-gray-300 rounded-md"
              min="0"
            />
          </div>
        </div>
        <button type="submit" className="w-full bg-amazon-yellow text-amazon-blue font-bold py-2 px-4 rounded-lg hover:bg-amazon-yellow-light transition-colors">
          {t('filter_apply')} ({productCount})
        </button>
      </form>
    </div>
  );
};

export default SearchFilters;
