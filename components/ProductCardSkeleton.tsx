import React from 'react';

const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse flex flex-col">
      <div className="relative">
        <div className="w-full h-40 bg-gray-200"></div>
      </div>
      <div className="p-2 flex flex-col flex-grow">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="flex items-center justify-between mt-auto">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-9 w-9 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
