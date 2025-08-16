import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useKindWall } from '../context/KindWallContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import type { KindWallPost } from '../types.ts';
import EditKindWallPostModal from './EditKindWallPostModal.tsx';

const ProfileKindWall: React.FC = () => {
    const { user } = useAuth();
    const { posts, deletePost, renewPost, editPost } = useKindWall();
    const { t, language } = useLanguage();
    const { addToast } = useToast();
    const [editingPost, setEditingPost] = useState<KindWallPost | null>(null);

    const myPosts = useMemo(() => {
        if (!user) return [];
        return posts
            .filter(p => p.userId === user.id)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [posts, user]);

    const handleDelete = (postId: number) => {
        if (window.confirm(t('kindwall_post_delete_confirm'))) {
            deletePost(postId);
        }
    };
    
    const handleRenew = (postId: number) => {
        renewPost(postId);
        addToast(t('kindwall_post_renew_success'), 'success');
    };

    const handleSaveEdit = (post: KindWallPost, updatedData: Partial<KindWallPost>) => {
        editPost(post.id, updatedData);
        addToast(t('seller_product_updated_toast'), 'success');
        setEditingPost(null);
    };

    const StatusBadge: React.FC<{ status: KindWallPost['status'] }> = ({ status }) => {
        const styles = {
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            pending: 'bg-yellow-100 text-yellow-800',
        };
        return (
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>
                {t(`kindwall_admin_status_${status}`)}
            </span>
        );
    };

    if (myPosts.length === 0) {
        return <p>{t('kindwall_post_no_posts')}</p>;
    }

    return (
        <div>
            {editingPost && <EditKindWallPostModal post={editingPost} onClose={() => setEditingPost(null)} onSave={handleSaveEdit} />}
            <h2 className="text-2xl font-bold mb-4">{t('kindwall_post_my_posts')}</h2>
            <div className="space-y-4">
                {myPosts.map(post => (
                    <div key={post.id} className="border p-4 rounded-lg flex flex-col sm:flex-row items-start gap-4">
                        {post.imageUrl && <img src={post.imageUrl} alt={post.title} className="w-24 h-24 object-cover rounded-md flex-shrink-0" />}
                        <div className="flex-grow">
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-lg">{post.title}</h3>
                                <StatusBadge status={post.status} />
                            </div>
                             {post.status === 'rejected' && post.rejectionReason && (
                                <p className="text-sm text-red-600 mt-1">{t('kindwall_rejection_reason', { reason: post.rejectionReason })}</p>
                            )}
                            <p className="text-sm text-gray-600 mt-1">{post.description}</p>
                            <p className="text-xs text-gray-400 mt-2">
                                {t('kindwall_created_at', { date: new Date(post.createdAt).toLocaleDateString(language) })}
                                {post.expiresAt && ` | Expires: ${new Date(post.expiresAt).toLocaleDateString(language)}`}
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                            <button onClick={() => setEditingPost(post)} className="text-sm bg-blue-500 text-white py-1 px-3 rounded-md hover:bg-blue-600">{t('kindwall_post_action_edit')}</button>
                            <button onClick={() => handleRenew(post.id)} className="text-sm bg-green-500 text-white py-1 px-3 rounded-md hover:bg-green-600">{t('kindwall_post_action_renew')}</button>
                            <button onClick={() => handleDelete(post.id)} className="text-sm bg-red-500 text-white py-1 px-3 rounded-md hover:bg-red-600">{t('kindwall_post_action_delete')}</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProfileKindWall;