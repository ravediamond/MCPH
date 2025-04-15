import { useState, useEffect } from 'react';
import { supabase } from 'lib/supabaseClient';

interface AddEditMCPModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function AddEditMCPModal({
    isOpen,
    onClose,
    onSuccess,
}: AddEditMCPModalProps) {
    // Form state for the MCP details
    const [repositoryUrl, setRepositoryUrl] = useState('');
    const [ownerUsername, setOwnerUsername] = useState(''); // New state for owner username
    const [repositoryName, setRepositoryName] = useState(''); // New state for repository name
    const [name, setName] = useState('');
    const [version, setVersion] = useState('1.0.0'); // Default value
    const [description, setDescription] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [loadingRepoInfo, setLoadingRepoInfo] = useState(false);
    const [author, setAuthor] = useState('');
    const [isAdmin, setIsAdmin] = useState(false); // State to check if user is admin
    const [isMCPHOwned, setIsMCPHOwned] = useState(false); // State to track MCPH ownership option
    // New state variables
    const [deploymentUrl, setDeploymentUrl] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>([]);

    // Fetch current user's email to auto-fill author
    // and check if the user is an admin
    useEffect(() => {
        async function fetchUser() {
            const { data: userData } = await supabase.auth.getUser();
            const user = userData?.user;
            if (user && user.email) {
                setAuthor(user.email);

                // Check if user is admin
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('is_admin')
                    .eq('id', user.id)
                    .single();

                setIsAdmin(!!profile?.is_admin);
            }
        }
        fetchUser();
    }, []);

    // Handle tag input
    const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTagInput(e.target.value);
    };

    const addTag = () => {
        if (tagInput.trim()) {
            // Check if the tag already exists
            if (!tags.includes(tagInput.trim().toLowerCase())) {
                setTags([...tags, tagInput.trim().toLowerCase()]);
            }
            setTagInput('');
        }
    };

    const handleTagKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag();
        }
    };

    const removeTag = (index: number) => {
        const newTags = [...tags];
        newTags.splice(index, 1);
        setTags(newTags);
    };

    // Automatically fetch repository details when the URL input loses focus
    const handleRepoBlur = async () => {
        if (!repositoryUrl.trim()) return;

        // Regex to validate GitHub URL and extract owner and repo
        const githubRegex = /https:\/\/github\.com\/([^\/]+)\/([^\/]+)/;
        const match = repositoryUrl.match(githubRegex);
        if (!match) {
            setErrorMsg('Please enter a valid GitHub repository URL.');
            return;
        }
        setErrorMsg('');
        setLoadingRepoInfo(true);
        const owner = match[1];
        const repo = match[2];

        // Store the extracted owner and repo name
        setOwnerUsername(owner);
        setRepositoryName(repo);

        try {
            // Fetch repository details from GitHub
            const repoResponse = await fetch(
                `https://api.github.com/repos/${owner}/${repo}`
            );
            if (!repoResponse.ok) {
                setErrorMsg('Failed to fetch repository details.');
                return;
            }
            const repoData = await repoResponse.json();
            setName(repoData.name || '');
            setDescription(repoData.description || '');

            // Fetch the latest release for version info
            const releaseResponse = await fetch(
                `https://api.github.com/repos/${owner}/${repo}/releases/latest`
            );
            if (releaseResponse.ok) {
                const releaseData = await releaseResponse.json();
                setVersion(releaseData.tag_name || '1.0.0');
            } else {
                // If no release info, keep default or let user adjust it.
                setVersion('1.0.0');
            }
        } catch (error) {
            console.error(error);
            setErrorMsg('Error occurred while fetching repository information.');
        } finally {
            setLoadingRepoInfo(false);
        }
    };

    const handleSubmit = async () => {
        // Basic field validation
        if (!name.trim() || name.trim().length < 3) {
            setErrorMsg('Name is required and must be at least 3 characters.');
            return;
        }
        if (!repositoryUrl.trim()) {
            setErrorMsg('Repository URL is required.');
            return;
        }
        if (!version.trim() || !version.match(/^\d+\.\d+\.\d+$/)) {
            setErrorMsg('Version is required and must follow semantic versioning (e.g., 1.0.0).');
            return;
        }
        setErrorMsg('');

        // Get the currently logged-in user
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        if (!user) {
            setErrorMsg('User not authenticated. Please log in again.');
            return;
        }

        // Insert the new MCP entry into the 'mcps' table
        const { error } = await supabase
            .from('mcps')
            .insert({
                name: name.trim(),
                repository_url: repositoryUrl.trim(),
                owner_username: ownerUsername,
                repository_name: repositoryName,
                version: version.trim(),
                description: description.trim(),
                deployment_url: deploymentUrl.trim() || null,
                author: author,
                user_id: user.id,
                tags: tags.length > 0 ? tags : null,
                is_mcph_owned: isMCPHOwned, // Add MCPH ownership flag
            });
        if (error) {
            console.error('Error adding MCP:', error);
            setErrorMsg('Error adding MCP: ' + error.message);
        } else {
            console.log('MCP added successfully.');
            onSuccess && onSuccess();
            onClose();
            // Reset form fields
            setName('');
            setRepositoryUrl('');
            setOwnerUsername('');
            setRepositoryName('');
            setDeploymentUrl('');
            setVersion('1.0.0');
            setDescription('');
            setTags([]);
            setIsMCPHOwned(false); // Reset MCPH ownership flag
        }
    };

    return (
        isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                {/* Overlay */}
                <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>

                {/* Modal Content */}
                <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 z-10">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-800">Add New MCP</h2>
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                            aria-label="Close"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-4">
                        <div className="flex flex-col space-y-4">
                            {/* GitHub Repository URL */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    GitHub Repository URL<span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={repositoryUrl}
                                    onChange={(e) => setRepositoryUrl(e.target.value)}
                                    onBlur={handleRepoBlur}
                                    placeholder="https://github.com/yourrepo"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                {loadingRepoInfo && (
                                    <div className="mt-2">
                                        <div className="w-5 h-5 border-t-2 border-blue-500 rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>

                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Name<span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="MCP Name"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Version */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Version<span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={version}
                                    onChange={(e) => setVersion(e.target.value)}
                                    placeholder="e.g., 1.0.0"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Detailed description of your MCP"
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                ></textarea>
                            </div>

                            {/* Deployment URL */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    MCP Deployment URL (optional)
                                </label>
                                <input
                                    type="text"
                                    value={deploymentUrl}
                                    onChange={(e) => setDeploymentUrl(e.target.value)}
                                    placeholder="https://your-mcp-deployment.com"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Tags */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tags/Categories
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={handleTagInputChange}
                                        onKeyDown={handleTagKeyDown}
                                        placeholder="Enter tags (comma or enter to add)"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md pr-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        onClick={addTag}
                                        className="absolute right-1 top-1 h-8 px-3 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                                    >
                                        Add
                                    </button>
                                </div>

                                {tags.length > 0 && (
                                    <div className="flex flex-wrap mt-2 gap-2">
                                        {tags.map((tag, index) => (
                                            <span
                                                key={index}
                                                className="inline-flex items-center rounded-full bg-blue-500 px-3 py-1 text-sm text-white"
                                            >
                                                {tag}
                                                <button
                                                    onClick={() => removeTag(index)}
                                                    className="ml-1 text-white hover:text-gray-200"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                                    </svg>
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                    Add relevant tags for better discoverability
                                </p>
                            </div>

                            {/* MCPH Ownership */}
                            {isAdmin && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        MCPH Ownership
                                    </label>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={isMCPHOwned}
                                            onChange={(e) => setIsMCPHOwned(e.target.checked)}
                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Set as MCPH owned</span>
                                    </div>
                                </div>
                            )}

                            {/* Error Message */}
                            {errorMsg && (
                                <p className="text-red-500 text-sm mt-2">
                                    {errorMsg}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                        >
                            Submit
                        </button>
                    </div>
                </div>
            </div>
        )
    );
}
