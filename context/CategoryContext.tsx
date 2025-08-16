import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import type { Category as CategoryType, SubCategory, Language } from '../types.ts';
import { categoryData } from '../data/categories.ts';
import { translations } from '../translations.ts';

interface CategoryContextType {
  categories: CategoryType[];
  loading: boolean;
  getCategoryById: (id: string) => CategoryType | undefined;
  getSubCategoryById: (subCategoryId: string) => { subcategory: SubCategory; parent: CategoryType } | undefined;
  addCategory: (names: { [key in Language]?: string }) => boolean;
  updateCategory: (id: string, names: { [key in Language]?: string }) => boolean;
  deleteCategory: (id: string) => boolean;
  addSubCategory: (parentId: string, names: { [key in Language]?: string }) => boolean;
  updateSubCategory: (parentId: string, subId: string, names: { [key in Language]?: string }) => boolean;
  deleteSubCategory: (parentId: string, subId: string) => boolean;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

const STORAGE_KEY = 'reuseday_categories_multilang_v1';
const LANGUAGES: Language[] = ['en', 'fr', 'fa', 'nl', 'ar'];

const migrateCategories = (oldData: any[]): CategoryType[] => {
    return oldData.map(cat => {
        const newCat: CategoryType = {
            id: cat.id,
            names: {},
            subcategories: [],
        };

        if (cat.name) {
            LANGUAGES.forEach(lang => { newCat.names[lang] = cat.name; });
        } else if (cat.nameKey) {
            LANGUAGES.forEach(lang => {
                const translation = (translations as any)[lang]?.[cat.nameKey];
                newCat.names[lang] = translation || cat.nameKey;
            });
        }

        if (cat.subcategories && Array.isArray(cat.subcategories)) {
            newCat.subcategories = cat.subcategories.map((sub: any) => {
                const newSub: SubCategory = { id: sub.id, names: {} };
                if (sub.name) {
                    LANGUAGES.forEach(lang => { newSub.names[lang] = sub.name; });
                } else if (sub.nameKey) {
                    LANGUAGES.forEach(lang => {
                        const translation = (translations as any)[lang]?.[sub.nameKey];
                        newSub.names[lang] = translation || sub.nameKey;
                    });
                }
                return newSub;
            });
        }
        return newCat;
    });
};

const getInitialCategories = (): CategoryType[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }

        const oldStored = localStorage.getItem('reuseday_categories');
        if(oldStored) {
            const oldParsed = JSON.parse(oldStored);
            if(Array.isArray(oldParsed) && oldParsed.length > 0 && oldParsed[0].name) { // Heuristic for old dynamic categories
                const migrated = migrateCategories(oldParsed);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
                return migrated;
            }
        }
        
        const seededAndMigrated = migrateCategories(categoryData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seededAndMigrated));
        return seededAndMigrated;

    } catch (e) {
        console.error("Failed to initialize categories", e);
        return migrateCategories(categoryData); // Fallback to seed data
    }
};

export const CategoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [categories, setCategories] = useState<CategoryType[]>([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        setCategories(getInitialCategories());
        setLoading(false);
    }, []);

    const saveCategories = (updatedCategories: CategoryType[]) => {
        setCategories(updatedCategories);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCategories));
    };

    const getCategoryById = useCallback((id: string) => {
        return categories.find(c => c.id === id);
    }, [categories]);
    
    const getSubCategoryById = useCallback((subCategoryId: string) => {
        for (const parent of categories) {
            const subcategory = parent.subcategories.find(s => s.id === subCategoryId);
            if (subcategory) {
                return { subcategory, parent };
            }
        }
        return undefined;
    }, [categories]);

    const generateIdFromName = (name: string) => name.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and');
    
    const addCategory = useCallback((names: { [key in Language]?: string }) => {
        if (!names.en) return false;
        const newId = generateIdFromName(names.en);
        if (categories.some(c => c.id === newId)) return false;

        const newCategory: CategoryType = { id: newId, names, subcategories: [] };
        saveCategories([...categories, newCategory]);
        return true;
    }, [categories]);

    const updateCategory = useCallback((id: string, names: { [key in Language]?: string }) => {
        const updated = categories.map(c => c.id === id ? { ...c, names } : c);
        saveCategories(updated);
        return true;
    }, [categories]);
    
    const deleteCategory = useCallback((id: string) => {
        if (id === 'other') return false; // Prevent deleting 'other' category
        saveCategories(categories.filter(c => c.id !== id));
        return true;
    }, [categories]);
    
    const addSubCategory = useCallback((parentId: string, names: { [key in Language]?: string }) => {
        if (!names.en) return false;
        const newId = `${parentId}-${generateIdFromName(names.en)}`;
        
        const parent = categories.find(c => c.id === parentId);
        if (!parent || parent.subcategories.some(s => s.id === newId)) return false;

        const newSub: SubCategory = { id: newId, names };
        const updated = categories.map(c => c.id === parentId ? { ...c, subcategories: [...c.subcategories, newSub] } : c);
        saveCategories(updated);
        return true;
    }, [categories]);

    const updateSubCategory = useCallback((parentId: string, subId: string, names: { [key in Language]?: string }) => {
        const updated = categories.map(c => {
            if (c.id === parentId) {
                const updatedSubs = c.subcategories.map(s => s.id === subId ? { ...s, names } : s);
                return { ...c, subcategories: updatedSubs };
            }
            return c;
        });
        saveCategories(updated);
        return true;
    }, [categories]);
    
    const deleteSubCategory = useCallback((parentId: string, subId: string) => {
        const updated = categories.map(c => {
            if (c.id === parentId) {
                return { ...c, subcategories: c.subcategories.filter(s => s.id !== subId) };
            }
            return c;
        });
        saveCategories(updated);
        return true;
    }, [categories]);

    return (
        <CategoryContext.Provider value={{
            categories, loading, getCategoryById, getSubCategoryById, 
            addCategory, updateCategory, deleteCategory,
            addSubCategory, updateSubCategory, deleteSubCategory
        }}>
            {children}
        </CategoryContext.Provider>
    );
};

export const useCategory = () => {
    const context = useContext(CategoryContext);
    if (context === undefined) {
        throw new Error('useCategory must be used within a CategoryProvider');
    }
    return context;
};