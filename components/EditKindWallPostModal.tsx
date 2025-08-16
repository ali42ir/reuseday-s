import React, { useState } from 'react';
import type { KindWallPost } from '../types.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { compressImage } from '../utils/imageCompressor.ts';

interface EditKindWallPostModalProps {
    post: KindWallPost;
    onSave: (post: KindWallPost, updatedData: Partial<KindWallPost>) => void;
    onClose: () => void;
}

const EditKindWallPostModal: React.FC<EditKindWallPostModalProps> = ({ post, onSave, onClose }) => {
    const { t } = useLanguage();
    const { addToast } = useToast();
    const [formData, setFormData] = useState({
        title: post.title,
        description: post.description,
        location: post.location,
        contactInfo: post.contactInfo || ''
    });
    const [imageUrl, setImageUrl] = useState<string>(post.imageUrl || '');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
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
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        onSave(post, {
            ...formData,
            imageUrl
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[70] p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold p-6 border-b">{t('kindwall_post_edit_modal_title')}</h3>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">{t('kindwall_form_title_placeholder')}</label>
                            <input type="text" name="title" value={formData.title} onChange={handleChange} className="mt-1 block w-full p-2 border-gray-300 rounded-md" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">{t('kindwall_form_desc_placeholder')}</label>
                            <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="mt-1 block w-full p-2 border-gray-300 rounded-md" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">{t('kindwall_form_location_placeholder')}</label>
                            <input type="text" name="location" value={formData.location} onChange={handleChange} className="mt-1 block w-full p-2 border-gray-300 rounded-md" required />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">{t('complaint_upload_evidence')}</label>
                            <input type="file" name="imageUrl" onChange={handleFileChange} accept="image/jpeg,image/png,image/webp" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"/>
                             {imageUrl && (
                                <div className="mt-2">
                                    <img src={imageUrl} alt="Preview" className="h-24 w-auto rounded-md object-cover border" />
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">{t('kindwall_form_contact_placeholder')}</label>
                            <input type="text" name="contactInfo" value={formData.contactInfo} onChange={handleChange} className="mt-1 block w-full p-2 border-gray-300 rounded-md" />
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="bg-gray-200 font-bold py-2 px-4 rounded-lg">{t('cancel')}</button>
                        <button type="submit" className="bg-amazon-yellow text-amazon-blue font-bold py-2 px-4 rounded-lg">{t('seller_save_changes_button')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default EditKindWallPostModal;