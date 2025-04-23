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
    description: string | null;
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
    const [isExporting, setIsExporting] = useState(false);
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
                const userId = user.user?.id;

                if (!userId) {
                    router.push('/');
                    return;
                }

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('is_admin')
                    .eq('id', userId)
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
            // Cast the returned data to match the Tag interface
            const typedTags = (data || []) as unknown as Tag[];
            setTags(typedTags);
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

    // Function to handle exporting tags as JSON
    const handleExportTags = async () => {
        try {
            setIsExporting(true);

            // Get the current session
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                throw new Error('You must be logged in to export tags');
            }

            // Use fetch with authentication token in the header
            const response = await fetch('/api/tags/export', {
                method: 'GET',
                credentials: 'include', // Include cookies
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to export tags');
            }

            // Get the filename from the Content-Disposition header if available
            const contentDisposition = response.headers.get('Content-Disposition');
            const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            const matches = filenameRegex.exec(contentDisposition || '');
            const filename = matches && matches[1] ? matches[1].replace(/['"]/g, '') : 'mcph-tags-export.json';

            // Convert the response to a blob
            const blob = await response.blob();

            // Create a download link and trigger the download
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();

            // Clean up
            window.URL.revokeObjectURL(url);
            document.body.removeChild(link);
            setIsExporting(false);
        } catch (error) {
            console.error('Error exporting tags:', error);
            alert(`Failed to export tags: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setIsExporting(false);
        }
    };

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
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md shadow-sm"
                >
                    Back to Dashboard
                </button>
            </div>

            <div className="mb-4">
                <button
                    onClick={handleExportTags}
                    disabled={isExporting}
                    className="bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white px-4 py-2 rounded-md shadow-sm flex items-center"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {isExporting ? 'Exporting...' : 'Export Tags as JSON'}
                </button>
            </div>

            <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex space-x-4">
                    <button
                        onClick={() => setActiveTab('tags')}
                        className={`px-4 py-2 rounded-md shadow-sm ${activeTab === 'tags' ?
                            'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
                    >
                        Tags
                    </button>
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`px-4 py-2 rounded-md shadow-sm ${activeTab === 'categories' ?
                            'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
                    >
                        Categories
                    </button>
                </div>

                <input
                    type="text"
                    placeholder="Search..."
                    className="w-full sm:w-64 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                {activeTab === 'tags' ? (
                    <button
                        onClick={openAddTagModal}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md shadow-sm flex items-center"
                    >
                        <span className="mr-1">+</span> Add Tag
                    </button>
                ) : (
                    <button
                        onClick={openAddCategoryModal}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md shadow-sm flex items-center"
                    >
                        <span className="mr-1">+</span> Add Category
                    </button>
                )}
            </div>

            {activeTab === 'tags' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-100 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Icon</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredTags.map((tag) => (
                                <tr key={tag.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-800 dark:text-gray-200">{tag.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-800 dark:text-gray-200">
                                        {tag.tag_category?.name || <span className="italic text-gray-500 dark:text-gray-400">Unknown</span>}
                                    </td>
                                    <td className="px-6 py-4 max-w-xs truncate text-gray-800 dark:text-gray-200">{tag.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-2xl">{tag.icon || <span className="text-sm text-gray-500 dark:text-gray-400">-</span>}</td>
                                    <td className="px-6 py-4 whitespace-nowrap space-x-2">
                                        <button
                                            onClick={() => openEditTagModal(tag)}
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md shadow-sm text-sm"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTag(tag.id)}
                                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md shadow-sm text-sm"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredTags.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                        No tags found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'categories' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-100 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Tags Count</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredCategories.map((category) => (
                                <tr key={category.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-800 dark:text-gray-200">{category.name}</td>
                                    <td className="px-6 py-4 max-w-xs truncate text-gray-800 dark:text-gray-200">{category.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-800 dark:text-gray-200">
                                        <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium">
                                            {tags.filter(tag => tag.category_id === category.id).length}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap space-x-2">
                                        <button
                                            onClick={() => openEditCategoryModal(category)}
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md shadow-sm text-sm"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCategory(category.id)}
                                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md shadow-sm text-sm"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredCategories.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
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
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full border border-gray-200 dark:border-gray-700">
                        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
                            {editingTag ? 'Edit Tag' : 'Add New Tag'}
                        </h2>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                Category:
                            </label>
                            <select
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
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
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                Name:
                            </label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                                value={newTag.name}
                                onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                Description:
                            </label>
                            <textarea
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                                value={newTag.description}
                                onChange={(e) => setNewTag({ ...newTag, description: e.target.value })}
                                rows={3}
                            ></textarea>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                Icon (emoji or symbol):
                            </label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                                value={newTag.icon}
                                onChange={(e) => setNewTag({ ...newTag, icon: e.target.value })}
                                placeholder="Example: 🚀, ☁️, 🔧"
                            />
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setIsTagModalOpen(false)}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md shadow-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveTag}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-sm"
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
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full border border-gray-200 dark:border-gray-700">
                        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
                            {editingCategory ? 'Edit Category' : 'Add New Category'}
                        </h2>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                Name:
                            </label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                                value={newCategory.name}
                                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                Description:
                            </label>
                            <textarea
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                                value={newCategory.description || ''}
                                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                                rows={3}
                            ></textarea>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setIsCategoryModalOpen(false)}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md shadow-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveCategory}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-sm"
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