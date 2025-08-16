import React, { useState, useMemo, useEffect } from 'react';
import { useKindWall } from '../context/KindWallContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import Spinner from '../components/Spinner.tsx';
import type { KindWallPost, KindWallPostType } from '../types.ts';
import KindwallGrid from '../components/KindwallGrid.tsx';
import MobileAuthModal from '../components/MobileAuthModal.tsx';
import { useSystemSettings } from '../context/SystemSettingsContext.tsx';
import { useKindWallConversation } from '../context/KindWallConversationContext.tsx';
import KindWallChatModal from '../components/KindWallChatModal.tsx';
import { Link } from 'react-router-dom';
import KindWallReplyModal from '../components/KindWallReplyModal.tsx';
import { compressImage } from '../utils/imageCompressor.ts';


const KindWallForm: React.FC<{
    formType: KindWallPostType;
    onClose: () => void;
}> = ({ formType, onClose }) => {
    const { t } = useLanguage();
    const { addPost } = useKindWall();
    const { addToast } = useToast();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: '',
        contactInfo: ''
    });
    const [imageUrl, setImageUrl] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, type } = e.target;
        if (type === 'file') {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                // Validation
                const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
                if (!allowedTypes.includes(file.type)) {
                    addToast(t('kindwall_image_type_error'), 'error');
                    return;
                }
                if (file.size > 3 * 1024 * 1024) { // 3MB
                    addToast(t('kindwall_image_size_error'), 'error');
                    return;
                }

                compressImage(file).then(compressedUrl => {
                    setImageUrl(compressedUrl);
                }).catch(error => {
                    console.error("Image compression failed", error);
                    addToast(t('kindwall_image_upload_failed'), 'error');
                });
            } else {
                setImageUrl('');
            }
        } else {
            setFormData(p => ({ ...p, [name]: e.target.value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await addPost({
                ...formData,
                imageUrl,
                type: formType,
            });
            addToast(t('kindwall_form_submit_toast'), 'success');
            onClose();
        } catch (error) {
            console.error("Failed to submit post:", error);
            addToast(t('kindwall_form_submit_failed'), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="my-8 bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-lg font-bold">{formType === 'giving' ? t('kindwall_give_title') : t('kindwall_request_title')}</h3>
                <div>
                    <label className="block text-sm font-medium text-gray-700">{t('kindwall_form_title_placeholder')}</label>
                    <input type="text" name="title" value={formData.title} onChange={handleChange} className="mt-1 block w-full p-2 border-gray-300 rounded-md" required disabled={isSubmitting} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">{t('kindwall_form_desc_placeholder')}</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="mt-1 block w-full p-2 border-gray-300 rounded-md" required disabled={isSubmitting} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">{t('kindwall_form_location_placeholder')}</label>
                    <input type="text" name="location" value={formData.location} onChange={handleChange} className="mt-1 block w-full p-2 border-gray-300 rounded-md" required disabled={isSubmitting} />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">{t('complaint_upload_evidence')}</label>
                    <input type="file" name="imageUrl" onChange={handleChange} accept="image/jpeg,image/png,image/webp" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100" disabled={isSubmitting}/>
                     {imageUrl && (
                        <div className="mt-2">
                            <img src={imageUrl} alt="Preview" className="h-24 w-auto rounded-md object-cover border" />
                        </div>
                    )}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">{t('kindwall_form_contact_placeholder')}</label>
                    <input type="text" name="contactInfo" value={formData.contactInfo} onChange={handleChange} className="mt-1 block w-full p-2 border-gray-300 rounded-md" disabled={isSubmitting} />
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                    <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg" disabled={isSubmitting}>{t('cancel')}</button>
                    <button type="submit" disabled={isSubmitting} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg min-w-[120px] disabled:bg-gray-400">
                        {isSubmitting ? t('ai_generating') : t('kindwall_form_submit_button')}
                    </button>
                </div>
            </form>
        </div>
    );
};


const KindWallPage: React.FC = () => {
    const { posts, loading } = useKindWall();
    const { isAuthenticated } = useAuth();
    const { t } = useLanguage();
    const { systemSettings } = useSystemSettings();
    const { startOrGetConversation } = useKindWallConversation();

    const [showForm, setShowForm] = useState<KindWallPostType | null>(null);
    const [authAction, setAuthAction] = useState<(() => void) | null>(null);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [replyModalPost, setReplyModalPost] = useState<KindWallPost | null>(null);

    const handleCreatePostClick = (type: KindWallPostType) => {
        if (!isAuthenticated) {
            setAuthAction(() => () => setShowForm(type));
        } else {
            setShowForm(type);
        }
    };
    
    const handlePostClick = (post: KindWallPost) => {
        const action = () => {
            if (systemSettings.enableKindWallDirectChat) {
                const convo = startOrGetConversation(post);
                if (convo) setActiveChatId(convo.id);
            } else {
                setReplyModalPost(post);
            }
        };

        if (!isAuthenticated) {
            setAuthAction(() => action);
        } else {
            action();
        }
    };


    const onAuthSuccess = () => {
        if(authAction) {
            authAction();
            setAuthAction(null);
        }
    };

    const approvedPosts = useMemo(() => {
        const now = new Date();
        return posts.filter(p => p.status === 'approved' && (!p.expiresAt || new Date(p.expiresAt) > now))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [posts]);

    const givingPosts = useMemo(() => approvedPosts.filter(p => p.type === 'giving'), [approvedPosts]);
    const requestingPosts = useMemo(() => approvedPosts.filter(p => p.type === 'requesting'), [approvedPosts]);

    return (
        <div className="container mx-auto px-4 py-8">
            {authAction && <MobileAuthModal onSuccess={onAuthSuccess} onClose={() => setAuthAction(null)} />}
            {activeChatId && <KindWallChatModal conversationId={activeChatId} onClose={() => setActiveChatId(null)} />}
            {replyModalPost && <KindWallReplyModal post={replyModalPost} onClose={() => setReplyModalPost(null)} />}

            <div className="bg-green-50 p-8 rounded-lg shadow-md text-center border-2 border-green-200">
                <h1 className="text-4xl font-bold text-green-800 mb-3">{t('kindwall_title')}</h1>
                <p className="text-green-700 text-lg">{t('kindwall_tagline')}</p>
                 <Link to="/pages/kindwall-rules" className="text-sm text-green-600 hover:underline mt-4 inline-block">{t('kindwall_rules_link_text')}</Link>
            </div>
            
            <div className="mt-8">
                {showForm ? (
                    <KindWallForm formType={showForm} onClose={() => setShowForm(null)} />
                ) : (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             {/* Column 1 */}
                            <div className="bg-emerald-50 p-6 rounded-lg shadow-md border border-emerald-200 text-center flex flex-col items-center justify-center min-h-[150px]">
                                <h2 className="text-2xl font-bold text-emerald-800 mb-4">{t('kindwall_give_title')}</h2>
                                <button onClick={() => handleCreatePostClick('giving')} className="bg-emerald-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-emerald-600">
                                    {t('kindwall_give_button')}
                                </button>
                            </div>

                             {/* Column 2 */}
                             <div className="bg-sky-50 p-6 rounded-lg shadow-md border border-sky-200 text-center flex flex-col items-center justify-center min-h-[150px]">
                                <h2 className="text-2xl font-bold text-sky-800 mb-4">{t('kindwall_request_title')}</h2>
                                <button onClick={() => handleCreatePostClick('requesting')} className="bg-sky-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-sky-600">
                                    {t('kindwall_request_button')}
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                            <div>
                                <h3 className="text-xl font-bold text-emerald-800 mb-4">{t('kindwall_latest_giving')}</h3>
                                {loading ? <Spinner /> : givingPosts.length > 0 ? (
                                    <KindwallGrid posts={givingPosts.slice(0, 8)} onPostClick={handlePostClick} />
                                ) : (
                                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center text-gray-500 h-full flex items-center justify-center min-h-[200px]">
                                        <p>{t('kindwall_no_giving_posts')}</p>
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-sky-800 mb-4">{t('kindwall_latest_requesting')}</h3>
                                {loading ? <Spinner /> : requestingPosts.length > 0 ? (
                                    <KindwallGrid posts={requestingPosts.slice(0, 8)} onPostClick={handlePostClick} />
                                ) : (
                                        <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center text-gray-500 h-full flex items-center justify-center min-h-[200px]">
                                        <p>{t('kindwall_no_requesting_posts')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                         {!loading && approvedPosts.length === 0 && (
                            <p className="text-center text-gray-500 mt-12">{t('kindwall_no_posts')}</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default KindWallPage;