import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import type { KindWallConversation, KindWallPost, User } from '../types.ts';
import { useAuth } from './AuthContext.tsx';
import { useUserNotification } from './UserNotificationContext.tsx';

interface KindWallConversationContextType {
    conversations: KindWallConversation[];
    getConversationById: (id: string) => KindWallConversation | undefined;
    startOrGetConversation: (post: KindWallPost) => KindWallConversation | null;
    sendMessage: (conversationId: string, text: string) => void;
    blockConversation: (conversationId: string) => void;
    reportConversation: (conversationId: string) => void;
    closeConversation: (conversationId: string) => void;
}

const KindWallConversationContext = createContext<KindWallConversationContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'reuseday_kindwall_chats_';

export const KindWallConversationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [conversations, setConversations] = useState<KindWallConversation[]>([]);
    const { user } = useAuth();
    const { addNotification } = useUserNotification();
    
    const storageKey = user ? `${STORAGE_KEY_PREFIX}${user.id}` : null;

    useEffect(() => {
        if (storageKey) {
            try {
                const stored = localStorage.getItem(storageKey);
                const parsed = stored ? JSON.parse(stored) : [];
                setConversations(parsed.sort((a: KindWallConversation, b: KindWallConversation) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
            } catch (e) {
                console.error("Failed to parse KindWall conversations from localStorage", e);
                setConversations([]);
            }
        } else {
            setConversations([]);
        }
    }, [storageKey]);

    const updateAndSaveConversations = (userId: number, updateFn: (convos: KindWallConversation[]) => KindWallConversation[]) => {
        const key = `${STORAGE_KEY_PREFIX}${userId}`;
        const currentRaw = localStorage.getItem(key);
        const current = currentRaw ? JSON.parse(currentRaw) : [];
        const updated = updateFn(current);
        localStorage.setItem(key, JSON.stringify(updated));
        if (user && userId === user.id) {
            setConversations(updated.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
        }
    };
    
    const startOrGetConversation = useCallback((post: KindWallPost): KindWallConversation | null => {
        if (!user || user.id === post.userId) return null;

        const conversationId = `${post.id}-${user.id}`;

        const existingConvo = conversations.find(c => c.id === conversationId);
        if (existingConvo) return existingConvo;
        
        const now = new Date().toISOString();
        const newConversation: KindWallConversation = {
            id: conversationId,
            postId: post.id,
            postTitle: post.title,
            postImageUrl: post.imageUrl,
            donorId: post.userId,
            donorName: post.userName,
            seekerId: user.id,
            seekerName: user.name,
            status: 'open',
            createdAt: now,
            updatedAt: now,
            messages: [],
        };
        
        updateAndSaveConversations(user.id, current => [...current, newConversation]);
        updateAndSaveConversations(post.userId, current => [...current, newConversation]);

        return newConversation;
    }, [user, conversations]);
    
    const sendMessage = useCallback((conversationId: string, text: string) => {
        if (!user) return;
        
        const newMessage = { id: Date.now(), senderId: user.id, text, createdAt: new Date().toISOString() };
        const now = new Date().toISOString();
        let convoToNotify: KindWallConversation | null = null;
        
        const updateFn = (convos: KindWallConversation[]) => convos.map(c => {
            if (c.id === conversationId) {
                const updatedConvo = { ...c, messages: [...c.messages, newMessage], updatedAt: now };
                convoToNotify = updatedConvo;
                return updatedConvo;
            }
            return c;
        });

        const convo = conversations.find(c => c.id === conversationId);
        if (!convo) return;
        
        updateAndSaveConversations(user.id, updateFn);
        updateAndSaveConversations(convo.donorId === user.id ? convo.seekerId : convo.donorId, updateFn);
        
        if (convoToNotify) {
            const recipientId = user.id === convoToNotify.donorId ? convoToNotify.seekerId : convoToNotify.donorId;
            addNotification(recipientId, {
                type: 'new_kindwall_message',
                message: 'notification_new_kindwall_message',
                replacements: { senderName: user.name, postTitle: convoToNotify.postTitle },
                link: `/profile/kindwall-chats`
            });
        }
    }, [user, conversations, addNotification]);

    const updateConversationStatus = (conversationId: string, status: KindWallConversation['status'], blockedBy?: number) => {
        const convo = conversations.find(c => c.id === conversationId);
        if (!convo) return;

        const updateFn = (convos: KindWallConversation[]) => convos.map(c => 
            c.id === conversationId ? { ...c, status, blockedBy } : c
        );

        updateAndSaveConversations(convo.donorId, updateFn);
        updateAndSaveConversations(convo.seekerId, updateFn);
    };

    const blockConversation = (conversationId: string) => user && updateConversationStatus(conversationId, 'blocked', user.id);
    const reportConversation = (conversationId: string) => updateConversationStatus(conversationId, 'reported');
    const closeConversation = (conversationId: string) => updateConversationStatus(conversationId, 'closed');
    
    const getConversationById = useCallback((id: string) => {
        return conversations.find(c => c.id === id);
    }, [conversations]);

    const value = { conversations, getConversationById, startOrGetConversation, sendMessage, blockConversation, reportConversation, closeConversation };

    return (
        <KindWallConversationContext.Provider value={value}>
            {children}
        </KindWallConversationContext.Provider>
    );
};

export const useKindWallConversation = () => {
    const context = useContext(KindWallConversationContext);
    if (context === undefined) {
        throw new Error('useKindWallConversation must be used within a KindWallConversationProvider');
    }
    return context;
};