import React from 'react';
import { useLanguage } from '../context/LanguageContext.tsx';

const AdPlaceholder: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="w-48 h-36 rounded-lg shadow-md flex items-center justify-center bg-gradient-to-br from-green-500 to-amazon-blue text-white p-4 flex-shrink-0">
      <span className="text-center font-semibold">{t('ad_placeholder_text')}</span>
    </div>
  );
};

export default AdPlaceholder;