import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useKindWallConversation } from '../context/KindWallConversationContext.tsx';
import type { KindWallConversation, KindWallMessage } from '../types.ts';

interface KindWallChatModalProps {
    conversationId: string;
    onClose: () => void;
}

const KindWallChatModal: React.FC<KindWallChatModalProps> = ({ conversationId, onClose }) => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const { getConversationById, sendMessage, blockConversation, reportConversation, closeConversation } = useKindWallConversation();
    
    const conversation = getConversationById(conversationId);

    const [messageText, setMessageText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [conversation?.messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (messageText.trim() && conversation) {
            sendMessage(conversation.id, messageText.trim());
            setMessageText('');
        }
    };
    
    if (!user || !conversation) return null;

    const isBlocked = conversation.status === 'blocked';
    const isClosed = conversation.status === 'closed';
    const canInteract = !isBlocked && !isClosed;
    const iAmTheBlocker = isBlocked && conversation.blockedBy === user.id;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[70] p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b">
                    <h3 className="font-bold text-lg">{t('chat_modal_title')}</h3>
                    <p className="text-sm text-gray-600">{conversation.postTitle}</p>
                    <p className="text-xs text-gray-500 italic mt-1">{t('chat_header_secure')}</p>
                </div>

                <div className="flex-grow p-4 overflow-y-auto bg-gray-50 space-y-4">
                    {conversation.messages.map(msg => (
                        <div key={msg.id} className={`flex flex-col ${msg.senderId === user.id ? 'items-end' : 'items-start'}`}>
                            <div className={`p-3 rounded-lg max-w-sm ${msg.senderId === user.id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                <p className="text-sm">{msg.text}</p>
                            </div>
                            <span className="text-xs text-gray-400 mt-1">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                
                 {isClosed && (
                    <div className="p-4 text-center bg-gray-100 text-gray-600 text-sm italic">{t('chat_closed_message')}</div>
                )}
                {isBlocked && !iAmTheBlocker && (
                    <div className="p-4 text-center bg-red-50 text-red-700 text-sm italic">{t('chat_blocked_by_other_message')}</div>
                )}
                 {isBlocked && iAmTheBlocker && (
                    <div className="p-4 text-center bg-yellow-50 text-yellow-800 text-sm">{t('chat_you_blocked_message')}</div>
                )}


                {canInteract && (
                    <div className="p-3 border-t bg-white">
                        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                            <input type="text" value={messageText} onChange={e => setMessageText(e.target.value)} placeholder={t('profile_type_message')} className="flex-grow p-2 border rounded-md" />
                            <button type="submit" className="bg-green-500 text-white font-bold p-2 rounded-md">{t('profile_send_button')}</button>
                        </form>
                    </div>
                )}
                
                <div className="p-2 bg-gray-50 border-t flex justify-end items-center space-x-2">
                     <button onClick={() => reportConversation(conversation.id)} disabled={isClosed} className="text-xs text-gray-500 hover:text-red-600 disabled:opacity-50">{t('chat_report_button')}</button>
                     <span className="text-gray-300">|</span>
                     <button onClick={() => blockConversation(conversation.id)} disabled={isClosed} className="text-xs text-gray-500 hover:text-red-600 disabled:opacity-50">{t('chat_block_button')}</button>
                     <span className="text-gray-300">|</span>
                     <button onClick={() => closeConversation(conversation.id)} disabled={isClosed} className="text-xs text-gray-500 hover:text-red-600 disabled:opacity-50">{t('chat_close_button')}</button>
                </div>
            </div>
        </div>
    );
};

export default KindWallChatModal;