import React from 'react';
import type { Advertisement } from '../types.ts';

interface AdBannerProps {
  ad: Advertisement;
}

const AdBanner: React.FC<AdBannerProps> = ({ ad }) => {
  return (
    <a
      href={ad.linkUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="block w-48 h-36 rounded-lg overflow-hidden shadow-md group transition-shadow duration-300 hover:shadow-lg flex-shrink-0"
      aria-label={`Advertisement for ${ad.companyName}`}
    >
      <img
        src={ad.imageUrl}
        alt={`Advertisement for ${ad.companyName}`}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
    </a>
  );
};

export default AdBanner;