import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import type { DiscountCode, Banner, Advertisement, AdPackage, AdStatus } from '../types.ts';
import { useAuth } from './AuthContext.tsx';
import { useUserNotification } from './UserNotificationContext.tsx';
import { useProductContext } from './ProductContext.tsx';

interface MarketingContextType {
  discountCodes: DiscountCode[];
  featuredProductIds: number[];
  banners: Banner[];
  advertisements: Advertisement[];
  homepageAdIds: number[];
  setHomepageAdIds: (ids: number[]) => void;
  addDiscountCode: (codeData: Omit<DiscountCode, 'id' | 'isActive'>) => boolean;
  updateDiscountCode: (id: number, updatedData: Partial<DiscountCode>) => void;
  deleteDiscountCode: (id: number) => void;
  getValidDiscountCode: (code: string) => DiscountCode | null;
  setFeaturedProductIds: (ids: number[]) => void;
  submitAdvertisement: (adData: Omit<Advertisement, 'id' | 'uploaderId' | 'uploaderName' | 'status' | 'submittedAt' | 'expiresAt'>) => void;
  approveAdvertisement: (adId: number) => void;
  rejectAdvertisement: (adId: number) => void;
  deleteAdvertisement: (adId: number) => void;
}

const MarketingContext = createContext<MarketingContextType | undefined>(undefined);

const DISCOUNT_STORAGE_KEY = 'reuseday_discounts';
const FEATURED_STORAGE_KEY = 'reuseday_featured_products';
const ADVERTISEMENTS_STORAGE_KEY = 'reuseday_advertisements';
const HOMEPAGE_ADS_STORAGE_KEY = 'reuseday_homepage_ads';


const getFromStorage = <T,>(key: string, fallback: T): T => {
    try {
        const stored = localStorage.getItem(key);
        if (stored) return JSON.parse(stored) as T;
    } catch (e) {
        console.error(`Failed to parse ${key} from localStorage`, e);
    }
    return fallback;
};

const getInitialFeatured = (): number[] => {
    const fallback = [1, 2, 3, 4, 5, 6, 7, 8];
    try {
        const stored = localStorage.getItem(FEATURED_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Use stored value only if it's a non-empty array
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch (e) {
        console.error(`Failed to parse ${FEATURED_STORAGE_KEY} from localStorage`, e);
    }
    return fallback;
};


export const MarketingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { addNotification } = useUserNotification();
    const { products: allProducts } = useProductContext();
    const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>(() => getFromStorage(DISCOUNT_STORAGE_KEY, []));
    const [featuredProductIds, setFeaturedProductIdsState] = useState<number[]>(getInitialFeatured);
    const [advertisements, setAdvertisements] = useState<Advertisement[]>(() => getFromStorage(ADVERTISEMENTS_STORAGE_KEY, []));
    const [homepageAdIds, setHomepageAdIdsState] = useState<number[]>(() => getFromStorage(HOMEPAGE_ADS_STORAGE_KEY, []));

    useEffect(() => {
        localStorage.setItem(DISCOUNT_STORAGE_KEY, JSON.stringify(discountCodes));
    }, [discountCodes]);

    useEffect(() => {
        localStorage.setItem(FEATURED_STORAGE_KEY, JSON.stringify(featuredProductIds));
    }, [featuredProductIds]);
    
    useEffect(() => {
        localStorage.setItem(ADVERTISEMENTS_STORAGE_KEY, JSON.stringify(advertisements));
    }, [advertisements]);
    
    useEffect(() => {
        localStorage.setItem(HOMEPAGE_ADS_STORAGE_KEY, JSON.stringify(homepageAdIds));
    }, [homepageAdIds]);

    const banners: Banner[] = useMemo(() => {
        const now = new Date();
        // First, try to get ads selected by the admin
        const selectedAds = advertisements.filter(ad => homepageAdIds.includes(ad.id));
        
        const validAdminBanners = selectedAds
            .filter(ad => ad.status === 'approved' && ad.expiresAt && new Date(ad.expiresAt) > now)
            .map(ad => ({
                id: ad.id,
                imageUrl: ad.imageUrl,
                linkUrl: ad.linkUrl
            }));

        // If there are valid admin-selected banners, use them
        if (validAdminBanners.length > 0) {
            return validAdminBanners;
        }

        // Fallback: If no admin banners are active, use the first 5 products as default banners
        if (allProducts.length > 0) {
            return allProducts.slice(0, 5).map(product => ({
                id: product.id,
                imageUrl: product.imageUrl,
                linkUrl: `/product/${product.id}`
            }));
        }

        // If no products either, return an empty array
        return [];
    }, [advertisements, homepageAdIds, allProducts]);
    
    const submitAdvertisement = useCallback((adData: Omit<Advertisement, 'id' | 'uploaderId' | 'uploaderName' | 'status' | 'submittedAt' | 'expiresAt'>) => {
        if (!user) return;
        const newAd: Advertisement = {
            ...adData,
            id: Date.now(),
            uploaderId: user.id,
            uploaderName: user.name,
            status: 'pending',
            submittedAt: new Date().toISOString(),
        };
        setAdvertisements(prev => [...prev, newAd]);
    }, [user]);

    const updateAdvertisementStatus = (adId: number, status: AdStatus, expiresAt?: string) => {
        let adToNotify: Advertisement | undefined;
        
        setAdvertisements(prev => prev.map(ad => {
            if (ad.id === adId) {
                adToNotify = { ...ad, status, expiresAt };
                return adToNotify;
            }
            return ad;
        }));
        
        if (adToNotify) {
            const messageKey = status === 'approved' ? 'notification_ad_approved' : 'notification_ad_rejected';
            addNotification(adToNotify.uploaderId, {
                type: 'ad_status_update',
                message: messageKey,
                replacements: { companyName: adToNotify.companyName },
                link: '/profile/advertisements'
            });
        }
    };

    const approveAdvertisement = useCallback((adId: number) => {
        const ad = advertisements.find(a => a.id === adId);
        if (!ad) return;
        
        const now = new Date();
        const expiry = new Date(now);
        const durationDays = ad.adPackage === 'daily' ? 1 : 7;
        expiry.setDate(now.getDate() + durationDays);

        updateAdvertisementStatus(adId, 'approved', expiry.toISOString());
    }, [advertisements]);
    
    const rejectAdvertisement = useCallback((adId: number) => {
        updateAdvertisementStatus(adId, 'rejected');
    }, []);

    const deleteAdvertisement = useCallback((adId: number) => {
        setAdvertisements(prev => prev.filter(ad => ad.id !== adId));
        setHomepageAdIdsState(prev => prev.filter(id => id !== adId));
    }, []);

    const addDiscountCode = useCallback((codeData: Omit<DiscountCode, 'id' | 'isActive'>) => {
        const codeExists = discountCodes.some(c => c.code.toUpperCase() === codeData.code.toUpperCase());
        if (codeExists) {
            return false;
        }
        const newCode: DiscountCode = {
            ...codeData,
            id: Date.now(),
            isActive: true,
        };
        setDiscountCodes(prev => [...prev, newCode]);
        return true;
    }, [discountCodes]);

    const updateDiscountCode = useCallback((id: number, updatedData: Partial<DiscountCode>) => {
        setDiscountCodes(prev => prev.map(c => c.id === id ? { ...c, ...updatedData } : c));
    }, []);

    const deleteDiscountCode = useCallback((id: number) => {
        setDiscountCodes(prev => prev.filter(c => c.id !== id));
    }, []);

    const getValidDiscountCode = useCallback((code: string): DiscountCode | null => {
        const foundCode = discountCodes.find(c => c.code.toUpperCase() === code.toUpperCase());
        if (!foundCode || !foundCode.isActive) return null;

        const now = new Date();
        now.setHours(0, 0, 0, 0); // Normalize to start of day for comparison
        
        // Add a day to expiry to make it inclusive
        const expiry = new Date(foundCode.expiryDate);
        expiry.setHours(23, 59, 59, 999);

        const start = new Date(foundCode.startDate);
        start.setHours(0, 0, 0, 0);
        
        if (now > expiry || now < start) return null;
        
        return foundCode;
    }, [discountCodes]);

    const setFeaturedProductIds = useCallback((ids: number[]) => {
        setFeaturedProductIdsState(ids);
    }, []);

    const setHomepageAdIds = useCallback((ids: number[]) => {
        setHomepageAdIdsState(ids);
    }, []);

    const value = { 
        discountCodes, 
        featuredProductIds,
        banners,
        advertisements,
        homepageAdIds,
        addDiscountCode, 
        updateDiscountCode, 
        deleteDiscountCode,
        getValidDiscountCode,
        setFeaturedProductIds,
        submitAdvertisement,
        approveAdvertisement,
        rejectAdvertisement,
        deleteAdvertisement,
        setHomepageAdIds,
    };

    return (
        <MarketingContext.Provider value={value}>
            {children}
        </MarketingContext.Provider>
    );
}

export const useMarketing = () => {
    const context = useContext(MarketingContext);
    if (context === undefined) {
        throw new Error('useMarketing must be used within a MarketingProvider');
    }
    return context;
}