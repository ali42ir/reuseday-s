import React from 'react';
import { useKindWallConversation } from '../context/KindWallConversationContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import type { KindWallConversation } from '../types.ts';

interface ProfileKindWallChatsProps {
    onChatSelect: (conversationId: string) => void;
}

const ProfileKindWallChats: React.FC<ProfileKindWallChatsProps> = ({ onChatSelect }) => {
    const { conversations } = useKindWallConversation();
    const { user } = useAuth();
    const { t } = useLanguage();

    if (!user) return null;

    if (conversations.length === 0) {
        return <p className="text-gray-600">{t('chat_no_conversations')}</p>;
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">{t('profile_kindwall_chats_tab')}</h2>
            <div className="space-y-3">
                {conversations.map(convo => {
                    const otherUser = user.id === convo.donorId ? { id: convo.seekerId, name: convo.seekerName } : { id: convo.donorId, name: convo.donorName };
                    const lastMessage = convo.messages[convo.messages.length - 1];

                    return (
                        <button
                            key={convo.id}
                            onClick={() => onChatSelect(convo.id)}
                            className="w-full text-left p-3 flex items-center space-x-3 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <img
                                src={convo.postImageUrl || `https://picsum.photos/seed/kw${convo.postId}/100`}
                                alt={convo.postTitle}
                                className="w-12 h-12 rounded-md object-cover flex-shrink-0"
                            />
                            <div className="flex-grow overflow-hidden">
                                <p className="font-semibold text-sm truncate text-gray-800">{convo.postTitle}</p>
                                <p className="text-xs text-gray-500 truncate">{t('conversation_with_user', { name: otherUser.name })}</p>
                                {lastMessage && (
                                     <p className="text-xs text-gray-600 truncate mt-1">
                                        {lastMessage.senderId === user.id ? 'You: ' : ''}{lastMessage.text}
                                    </p>
                                )}
                            </div>
                            <div className="text-xs text-gray-400 self-start">{new Date(convo.updatedAt).toLocaleDateString()}</div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default ProfileKindWallChats;