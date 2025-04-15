'use client';

import { useEffect, useState } from 'react';
import { supabase } from 'lib/supabaseClient';
import { useRouter } from 'next/navigation';

interface Tag {
    id: number;
    name: string;
    description: string;
    icon?: string;
    category_id: number;
    created_at?: string;
    tag_category?: TagCategory;
}

interface TagCategory {
    id: number;
    name: string;
    description: string;
}

export default function AdminTags() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [tags, setTags] = useState<Tag[]>([]);
    const [categories, setCategories] = useState<TagCategory[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isTagModalOpen, setIsTagModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('tags');
    const router = useRouter();

    // Form states
    const [editingTag, setEditingTag] = useState<Tag | null>(null);
    const [newTag, setNewTag] = useState<Partial<Tag>>({
        name: '',
        description: '',
        icon: '',
        category_id: 0
    });

    const [editingCategory, setEditingCategory] = useState<TagCategory | null>(null);
    const [newCategory, setNewCategory] = useState<Partial<TagCategory>>({
        name: '',
        description: ''
    });

    useEffect(() => {
        async function checkAdminAccess() {
            try {
                // Check if user is authenticated
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    router.push('/');
                    return;
                }

                // Check if user has admin role
                const { data: user } = await supabase.auth.getUser();
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('is_admin')
                    .eq('id', user.user?.id)
                    .single();

                if (!profile?.is_admin) {
                    router.push('/');
                    return;
                }

                setIsAdmin(true);

                // Load tags and categories
                await Promise.all([loadTags(), loadCategories()]);
            } catch (error) {
                console.error('Error checking admin access:', error);
                router.push('/');
            } finally {
                setIsLoading(false);
            }
        }

        checkAdminAccess();
    }, [router]);

    async function loadTags() {
        try {
            const { data, error } = await supabase
                .from('tags')
                .select('*, tag_category:tag_categories(id, name, description)')
                .order('name');

            if (error) throw error;
            setTags(data || []);
        } catch (error) {
            console.error('Error loading tags:', error);
        }
    }

    async function loadCategories() {
        try {
            const { data, error } = await supabase
                .from('tag_categories')
                .select('*')
                .order('name');

            if (error) throw error;
            setCategories(data || []);
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    // Tag operations
    function openAddTagModal() {
        setEditingTag(null);
        setNewTag({
            name: '',
            description: '',
            icon: '',
            category_id: categories.length > 0 ? categories[0].id : 0
        });
        setIsTagModalOpen(true);
    }

    function openEditTagModal(tag: Tag) {
        setEditingTag(tag);
        setNewTag({
            name: tag.name,
            description: tag.description,
            icon: tag.icon || '',
            category_id: tag.category_id
        });
        setIsTagModalOpen(true);
    }

    async function handleSaveTag() {
        try {
            if (!newTag.name || !newTag.category_id) {
                alert('Name and category are required');
                return;
            }

            let result;

            if (editingTag) {
                // Update existing tag
                result = await supabase
                    .from('tags')
                    .update({
                        name: newTag.name,
                        description: newTag.description,
                        icon: newTag.icon || null,
                        category_id: newTag.category_id
                    })
                    .eq('id', editingTag.id);
            } else {
                // Add new tag
                result = await supabase
                    .from('tags')
                    .insert({
                        name: newTag.name,
                        description: newTag.description,
                        icon: newTag.icon || null,
                        category_id: newTag.category_id
                    });
            }

            if (result.error) throw result.error;

            setIsTagModalOpen(false);
            await loadTags();
        } catch (error: any) {
            console.error('Error saving tag:', error);
            alert(`Error: ${error.message || 'Unknown error saving tag'}`);
        }
    }

    async function handleDeleteTag(tagId: number) {
        if (confirm('Are you sure you want to delete this tag? This action cannot be undone.')) {
            try {
                const { error } = await supabase
                    .from('tags')
                    .delete()
                    .eq('id', tagId);

                if (error) throw error;

                await loadTags();
            } catch (error: any) {
                console.error('Error deleting tag:', error);
                alert(`Error: ${error.message || 'Unknown error deleting tag'}`);
            }
        }
    }

    // Category operations
    function openAddCategoryModal() {
        setEditingCategory(null);
        setNewCategory({
            name: '',
            description: ''
        });
        setIsCategoryModalOpen(true);
    }

    function openEditCategoryModal(category: TagCategory) {
        setEditingCategory(category);
        setNewCategory({
            name: category.name,
            description: category.description
        });
        setIsCategoryModalOpen(true);
    }

    async function handleSaveCategory() {
        try {
            if (!newCategory.name) {
                alert('Name is required');
                return;
            }

            let result;

            if (editingCategory) {
                // Update existing category
                result = await supabase
                    .from('tag_categories')
                    .update({
                        name: newCategory.name,
                        description: newCategory.description
                    })
                    .eq('id', editingCategory.id);
            } else {
                // Add new category
                result = await supabase
                    .from('tag_categories')
                    .insert({
                        name: newCategory.name,
                        description: newCategory.description
                    });
            }

            if (result.error) throw result.error;

            setIsCategoryModalOpen(false);
            await Promise.all([loadCategories(), loadTags()]);
        } catch (error: any) {
            console.error('Error saving category:', error);
            alert(`Error: ${error.message || 'Unknown error saving category'}`);
        }
    }

    async function handleDeleteCategory(categoryId: number) {
        // Check if the category has any tags
        const { data: tagsInCategory } = await supabase
            .from('tags')
            .select('id')
            .eq('category_id', categoryId);

        if (tagsInCategory && tagsInCategory.length > 0) {
            alert(`Cannot delete: This category contains ${tagsInCategory.length} tags. Please delete the tags first.`);
            return;
        }

        if (confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
            try {
                const { error } = await supabase
                    .from('tag_categories')
                    .delete()
                    .eq('id', categoryId);

                if (error) throw error;

                await loadCategories();
            } catch (error: any) {
                console.error('Error deleting category:', error);
                alert(`Error: ${error.message || 'Unknown error deleting category'}`);
            }
        }
    }

    // Filter tags based on search term
    const filteredTags = tags.filter(tag =>
        tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tag.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tag.tag_category?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filter categories based on search term
    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen">Loading admin dashboard...</div>;
    }

    if (!isAdmin) {
        return null; // Router will redirect, this prevents flash of forbidden content
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Tag Management</h1>
                <button
                    onClick={() => router.push('/admin')}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
                >
                    Back to Dashboard
                </button>
            </div>

            <div className="mb-6 flex justify-between items-center">
                <div className="flex space-x-4">
                    <button
                        onClick={() => setActiveTab('tags')}
                        className={`px-4 py-2 rounded ${activeTab === 'tags' ?
                            'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                        Tags
                    </button>
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`px-4 py-2 rounded ${activeTab === 'categories' ?
                            'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                        Categories
                    </button>
                </div>

                <input
                    type="text"
                    placeholder="Search..."
                    className="w-64 p-2 border rounded"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                {activeTab === 'tags' ? (
                    <button
                        onClick={openAddTagModal}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center"
                    >
                        <span className="mr-1">+</span> Add Tag
                    </button>
                ) : (
                    <button
                        onClick={openAddCategoryModal}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center"
                    >
                        <span className="mr-1">+</span> Add Category
                    </button>
                )}
            </div>

            {activeTab === 'tags' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Icon</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
                            {filteredTags.map((tag) => (
                                <tr key={tag.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{tag.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {tag.tag_category?.name || 'Unknown'}
                                    </td>
                                    <td className="px-6 py-4 max-w-xs truncate">{tag.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{tag.icon || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap space-x-2">
                                        <button
                                            onClick={() => openEditTagModal(tag)}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTag(tag.id)}
                                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredTags.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center">
                                        No tags found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'categories' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tags Count</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
                            {filteredCategories.map((category) => (
                                <tr key={category.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{category.name}</td>
                                    <td className="px-6 py-4 max-w-xs truncate">{category.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {tags.filter(tag => tag.category_id === category.id).length}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap space-x-2">
                                        <button
                                            onClick={() => openEditCategoryModal(category)}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCategory(category.id)}
                                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredCategories.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center">
                                        No categories found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Tag Modal */}
            {isTagModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
                        <h2 className="text-2xl font-bold mb-4">
                            {editingTag ? 'Edit Tag' : 'Add New Tag'}
                        </h2>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">
                                Category:
                            </label>
                            <select
                                className="w-full p-2 border rounded"
                                value={newTag.category_id}
                                onChange={(e) => setNewTag({ ...newTag, category_id: Number(e.target.value) })}
                            >
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">
                                Name:
                            </label>
                            <input
                                type="text"
                                className="w-full p-2 border rounded"
                                value={newTag.name}
                                onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">
                                Description:
                            </label>
                            <textarea
                                className="w-full p-2 border rounded"
                                value={newTag.description}
                                onChange={(e) => setNewTag({ ...newTag, description: e.target.value })}
                                rows={3}
                            ></textarea>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-2">
                                Icon (emoji or symbol):
                            </label>
                            <input
                                type="text"
                                className="w-full p-2 border rounded"
                                value={newTag.icon}
                                onChange={(e) => setNewTag({ ...newTag, icon: e.target.value })}
                                placeholder="Example: 🚀, ☁️, 🔧"
                            />
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setIsTagModalOpen(false)}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveTag}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Category Modal */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
                        <h2 className="text-2xl font-bold mb-4">
                            {editingCategory ? 'Edit Category' : 'Add New Category'}
                        </h2>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">
                                Name:
                            </label>
                            <input
                                type="text"
                                className="w-full p-2 border rounded"
                                value={newCategory.name}
                                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-2">
                                Description:
                            </label>
                            <textarea
                                className="w-full p-2 border rounded"
                                value={newCategory.description}
                                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                                rows={3}
                            ></textarea>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setIsCategoryModalOpen(false)}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveCategory}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}