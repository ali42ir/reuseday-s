import React, { useState } from 'react';
import { useCategory } from '../../context/CategoryContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { useProductContext } from '../../context/ProductContext.tsx';
import type { Category, SubCategory, Language } from '../../types.ts';

type ModalType = 'add_cat' | 'edit_cat' | 'add_sub' | 'edit_sub';
interface ModalConfig {
    type: ModalType;
    data?: Category | SubCategory;
    parentId?: string;
}

const getCategoryName = (category: Category | SubCategory, language: Language) => {
    return category.names?.[language] || category.names?.en || category.id;
};

const LANGUAGES: Language[] = ['en', 'fr', 'fa', 'nl', 'ar'];
const langNames: { [key in Language]: string } = {
    en: 'English',
    fa: 'فارسی',
    ar: 'العربية',
    fr: 'Français',
    nl: 'Nederlands',
};

const CategoryModal: React.FC<{ config: ModalConfig; onClose: () => void; }> = ({ config, onClose }) => {
    const { t } = useLanguage();
    const { addCategory, updateCategory, addSubCategory, updateSubCategory } = useCategory();
    const { addToast } = useToast();
    
    const isEdit = config.type === 'edit_cat' || config.type === 'edit_sub';
    const [names, setNames] = useState<{ [key in Language]?: string }>(isEdit && config.data ? config.data.names : {});

    const handleNameChange = (lang: Language, value: string) => {
        setNames(prev => ({...prev, [lang]: value}));
    };
    
    const titleKey = {
        add_cat: 'admin_categories_add',
        edit_cat: 'admin_edit_category_title',
        add_sub: 'admin_add_subcategory',
        edit_sub: 'admin_edit_subcategory'
    }[config.type];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!names.en?.trim()) {
            addToast(t('admin_category_en_required_toast'), 'error');
            return;
        }

        let success = false;
        switch(config.type) {
            case 'add_cat':
                success = addCategory(names);
                break;
            case 'edit_cat':
                success = updateCategory((config.data as Category).id, names);
                break;
            case 'add_sub':
                success = addSubCategory(config.parentId!, names);
                break;
            case 'edit_sub':
                 success = updateSubCategory(config.parentId!, (config.data as SubCategory).id, names);
                break;
        }
        
        if (success) {
            addToast(t('admin_category_saved_toast'), 'success');
            onClose();
        } else {
            addToast(t('admin_category_name_exists_toast'), 'error');
        }
    };
    
    return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold p-6 border-b">{t(titleKey)}</h3>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <label className="block text-sm font-medium text-gray-700">{t('admin_category_multilingual_name')}</label>
                        {LANGUAGES.map(lang => (
                            <div key={lang}>
                                <label className="block text-xs font-medium text-gray-500">{t('admin_category_name_in_lang', { lang: langNames[lang] })}</label>
                                <input 
                                    type="text" 
                                    value={names[lang] || ''} 
                                    onChange={e => handleNameChange(lang, e.target.value)} 
                                    className="mt-1 block w-full p-2 border-gray-300 rounded-md" 
                                    required={lang === 'en'}
                                    dir={['fa', 'ar'].includes(lang) ? 'rtl' : 'ltr'}
                                />
                            </div>
                        ))}
                    </div>
                     <div className="p-4 bg-gray-50 flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg">{t('cancel')}</button>
                        <button type="submit" className="bg-amazon-yellow text-amazon-blue font-bold py-2 px-4 rounded-lg">{t('seller_save_changes_button')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AdminCategories: React.FC = () => {
    const { categories, deleteCategory, deleteSubCategory } = useCategory();
    const { reassignProductsCategory } = useProductContext();
    const { t, language } = useLanguage();
    const { addToast } = useToast();
    const [modalConfig, setModalConfig] = useState<ModalConfig | null>(null);

    const handleDeleteCategory = (category: Category) => {
        if (category.id === 'other') return;

        if (window.confirm(t('admin_category_delete_confirm'))) {
            const idsToReassign = [category.id, ...category.subcategories.map(sub => sub.id)];
            reassignProductsCategory(idsToReassign, 'other');
            
            if (deleteCategory(category.id)) {
                addToast(t('admin_category_deleted_toast'), 'success');
            }
        }
    };
    
    const handleDeleteSubCategory = (parentId: string, subCategory: SubCategory) => {
        if (window.confirm(t('admin_category_delete_confirm'))) {
            reassignProductsCategory([subCategory.id], 'other');

            if (deleteSubCategory(parentId, subCategory.id)) {
                addToast(t('admin_category_deleted_toast'), 'success');
            }
        }
    };
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            {modalConfig && <CategoryModal config={modalConfig} onClose={() => setModalConfig(null)} />}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">{t('admin_categories_title')}</h2>
                <button onClick={() => setModalConfig({ type: 'add_cat' })} className="bg-amazon-yellow text-amazon-blue font-bold py-2 px-4 rounded-lg hover:bg-amazon-yellow-light transition-colors">{t('admin_categories_add')}</button>
            </div>
            <div className="space-y-4">
                {categories.map(cat => (
                    <div key={cat.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg text-gray-800">{getCategoryName(cat, language)}</h3>
                            <div className="space-x-3">
                                {cat.id !== 'other' && (
                                    <>
                                        <button onClick={() => setModalConfig({ type: 'add_sub', parentId: cat.id })} className="text-sm text-green-600 hover:text-green-900">{t('admin_add_subcategory_button')}</button>
                                        <button onClick={() => setModalConfig({ type: 'edit_cat', data: cat })} className="text-sm text-blue-600 hover:text-blue-900">{t('seller_edit_product_button')}</button>
                                        <button onClick={() => handleDeleteCategory(cat)} className="text-sm text-red-600 hover:text-red-900">{t('admin_delete_button')}</button>
                                    </>
                                )}
                            </div>
                        </div>
                        {cat.subcategories.length > 0 && (
                            <div className="mt-3 pl-6 border-l-2 ml-2 space-y-2">
                                {cat.subcategories.map(sub => (
                                    <div key={sub.id} className="flex justify-between items-center py-1">
                                        <p className="text-gray-700">{getCategoryName(sub, language)}</p>
                                        <div className="space-x-3">
                                            <button onClick={() => setModalConfig({ type: 'edit_sub', data: sub, parentId: cat.id })} className="text-sm text-blue-600 hover:text-blue-900">{t('seller_edit_product_button')}</button>
                                            <button onClick={() => handleDeleteSubCategory(cat.id, sub)} className="text-sm text-red-600 hover:text-red-900">{t('admin_delete_button')}</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminCategories;