import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import type { KindWallPost, KindWallPostStatus } from '../types.ts';
import { useAuth } from './AuthContext.tsx';
import { useLanguage } from './LanguageContext.tsx';

interface KindWallContextType {
  posts: KindWallPost[];
  loading: boolean;
  addPost: (postData: Omit<KindWallPost, 'id' | 'status' | 'userId' | 'userName' | 'createdAt' | 'language' | 'expiresAt' | 'rejectionReason'>) => Promise<void>;
  updatePostStatus: (postId: number, status: KindWallPostStatus, rejectionReason?: string) => Promise<void>;
  deletePost: (postId: number) => Promise<void>;
  editPost: (postId: number, updatedData: Partial<KindWallPost>) => Promise<void>;
  renewPost: (postId: number) => Promise<void>;
}

const KindWallContext = createContext<KindWallContextType | undefined>(undefined);

export const KindWallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [posts, setPosts] = useState<KindWallPost[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const { language } = useLanguage();

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            // This is a mock API call. In a real app, this would be a real endpoint.
            // For now, we'll simulate it by reading from localStorage to maintain functionality.
            const storedPosts = localStorage.getItem('reuseday_kindwall_posts');
            const data: KindWallPost[] = storedPosts ? JSON.parse(storedPosts) : [];
            setPosts(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);
    
    // Helper to simulate saving to a backend
    const persistPosts = (updatedPosts: KindWallPost[]) => {
         localStorage.setItem('reuseday_kindwall_posts', JSON.stringify(updatedPosts));
    }


    const addPost = useCallback(async (postData: Omit<KindWallPost, 'id' | 'status' | 'userId' | 'userName' | 'createdAt' | 'language' | 'expiresAt' | 'rejectionReason'>) => {
        if (!user) return;
        
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        // This simulates a POST request. The newPost object is what would be sent.
        const newPost: KindWallPost = {
            ...postData,
            id: Date.now(),
            status: 'approved',
            userId: user.id,
            userName: user.name,
            createdAt: new Date().toISOString(),
            expiresAt: expiresAt.toISOString(),
            language: language,
        };

        // Simulate API call and then refetch
        const currentPosts = posts;
        const updatedPosts = [newPost, ...currentPosts];
        persistPosts(updatedPosts);
        
        // In a real app with a backend, we'd refetch after POST.
        // await fetchPosts();
        setPosts(updatedPosts);

    }, [user, language, posts]);
    
    const updatePostStatus = useCallback(async (postId: number, status: KindWallPostStatus, rejectionReason?: string) => {
        // Simulate PATCH request
        const updatedPosts = posts.map(p => p.id === postId ? { ...p, status, rejectionReason: status === 'rejected' ? rejectionReason : undefined } : p);
        persistPosts(updatedPosts);
        setPosts(updatedPosts);
    }, [posts]);

    const deletePost = useCallback(async (postId: number) => {
        // Simulate DELETE request
        const updatedPosts = posts.filter(p => p.id !== postId);
        persistPosts(updatedPosts);
        setPosts(updatedPosts);
    }, [posts]);

    const editPost = useCallback(async (postId: number, updatedData: Partial<KindWallPost>) => {
        const updatedPosts = posts.map(p => p.id === postId ? { ...p, ...updatedData } : p);
        persistPosts(updatedPosts);
        setPosts(updatedPosts);
    }, [posts]);

    const renewPost = useCallback(async (postId: number) => {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        const updatedPosts = posts.map(p => p.id === postId ? { ...p, expiresAt: expiresAt.toISOString() } : p);
        persistPosts(updatedPosts);
        setPosts(updatedPosts);
    }, [posts]);

    const value = { posts, loading, addPost, updatePostStatus, deletePost, editPost, renewPost };

    return (
        <KindWallContext.Provider value={value}>
            {children}
        </KindWallContext.Provider>
    );
};

export const useKindWall = () => {
    const context = useContext(KindWallContext);
    if (context === undefined) {
        throw new Error('useKindWall must be used within a KindWallProvider');
    }
    return context;
};