import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useMarketing } from '../context/MarketingContext.tsx';
import { Link } from 'react-router-dom';

const BannerSlider: React.FC = () => {
    const { banners } = useMarketing();
    const [currentIndex, setCurrentIndex] = useState(0);
    const intervalRef = useRef<number | null>(null);

    const nextSlide = useCallback(() => {
        if (banners.length > 0) {
            setCurrentIndex(prevIndex => (prevIndex + 1) % banners.length);
        }
    }, [banners.length]);

    const prevSlide = () => {
        if (banners.length > 0) {
            setCurrentIndex(prevIndex => (prevIndex - 1 + banners.length) % banners.length);
        }
    };
    
    const startInterval = useCallback(() => {
        stopInterval(); // Ensure no multiple intervals are running
        if (banners.length > 1) {
            intervalRef.current = window.setInterval(nextSlide, 4000); // 4 seconds
        }
    }, [banners.length, nextSlide]);

    const stopInterval = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
    };

    useEffect(() => {
        startInterval();
        return () => stopInterval();
    }, [banners, startInterval]); // Restart interval if banners change


    if (banners.length === 0) {
        return (
             <div className="relative w-full overflow-hidden rounded-lg shadow-lg h-36 bg-gray-200 flex items-center justify-center">
                <div className="text-center text-gray-500">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" /></svg>
                    <p className="mt-2">Promotional Banners Appear Here</p>
                </div>
            </div>
        );
    }

    return (
        <div 
            className="relative w-full overflow-hidden rounded-lg shadow-lg group h-36"
            onMouseEnter={stopInterval}
            onMouseLeave={startInterval}
        >
            {banners.map((banner, index) => (
                <Link 
                    to={banner.linkUrl} 
                    key={banner.id} 
                    className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                    aria-hidden={index !== currentIndex}
                    tabIndex={index === currentIndex ? 0 : -1}
                >
                    <img 
                        src={banner.imageUrl} 
                        alt="Promotional Banner" 
                        className="w-full h-full object-cover" 
                        loading={index === 0 ? "eager" : "lazy"} 
                    />
                </Link>
            ))}
            
            {banners.length > 1 && (
                <>
                    <button 
                        onClick={prevSlide} 
                        className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-black bg-opacity-30 text-white p-2 rounded-full hover:bg-opacity-50 focus:outline-none z-20 transition-opacity opacity-0 group-hover:opacity-100"
                        aria-label="Previous slide"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button 
                        onClick={nextSlide} 
                        className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-black bg-opacity-30 text-white p-2 rounded-full hover:bg-opacity-50 focus:outline-none z-20 transition-opacity opacity-0 group-hover:opacity-100"
                        aria-label="Next slide"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
                        {banners.map((_, index) => (
                            <button
                                key={index}
                                className={`w-3 h-3 rounded-full transition-colors ${currentIndex === index ? 'bg-white' : 'bg-white bg-opacity-50 hover:bg-opacity-75'}`}
                                onClick={() => setCurrentIndex(index)}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default BannerSlider;