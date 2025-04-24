import { useState, useEffect } from 'react';
import { supabase } from 'lib/supabaseClient';
import { extractRateLimitInfo } from 'services/githubService';

interface TagItem {
    id: number;
    name: string;
    description: string | null;
    icon: string | null;
}

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
    const [description, setDescription] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [loadingRepoInfo, setLoadingRepoInfo] = useState(false);
    const [author, setAuthor] = useState('');
    const [isAdmin, setIsAdmin] = useState(false); // State to check if user is admin
    const [isMCPHOwned, setIsMCPHOwned] = useState(false); // State to track MCPH ownership option
    // New state variables
    const [deploymentUrl, setDeploymentUrl] = useState('');

    // Updated tag states for structured categories
    const [customTagInput, setCustomTagInput] = useState('');
    const [customTags, setCustomTags] = useState<string[]>([]);
    const [selectedDomainTags, setSelectedDomainTags] = useState<string[]>([]);
    const [selectedDeploymentTypes, setSelectedDeploymentTypes] = useState<string[]>([]);
    const [selectedProviderType, setSelectedProviderType] = useState<string>('Community'); // Default to Community

    // State for database tags
    const [domainCategories, setDomainCategories] = useState<TagItem[]>([]);
    const [deploymentTypes, setDeploymentTypes] = useState<TagItem[]>([]);
    const [providerTypes, setProviderTypes] = useState<TagItem[]>([]);
    const [loadingTags, setLoadingTags] = useState(false);

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

    // Fetch tags from the database
    useEffect(() => {
        async function fetchTags() {
            setLoadingTags(true);
            try {
                // Fetch domain tags
                const { data: domainData, error: domainError } = await supabase
                    .rpc('get_tags_by_category', { category_name: 'domain' });

                if (domainError) {
                    console.error('Error fetching domain tags:', domainError);
                } else {
                    setDomainCategories(domainData || []);
                }

                // Fetch deployment tags
                const { data: deploymentData, error: deploymentError } = await supabase
                    .rpc('get_tags_by_category', { category_name: 'deployment' });

                if (deploymentError) {
                    console.error('Error fetching deployment tags:', deploymentError);
                } else {
                    setDeploymentTypes(deploymentData || []);
                }

                // Fetch provider types
                const { data: providerData, error: providerError } = await supabase
                    .rpc('get_tags_by_category', { category_name: 'provider' });

                if (providerError) {
                    console.error('Error fetching provider types:', providerError);
                } else {
                    setProviderTypes(providerData || []);
                }
            } catch (error) {
                console.error('Error fetching tags:', error);
            } finally {
                setLoadingTags(false);
            }
        }

        if (isOpen) {
            fetchTags();
        }
    }, [isOpen]);

    // Handle custom tag input
    const handleCustomTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCustomTagInput(e.target.value);
    };

    const addCustomTag = () => {
        if (customTagInput.trim()) {
            // Check if the tag already exists
            if (!customTags.includes(customTagInput.trim().toLowerCase())) {
                setCustomTags([...customTags, customTagInput.trim().toLowerCase()]);
            }
            setCustomTagInput('');
        }
    };

    const handleTagKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addCustomTag();
        }
    };

    const removeCustomTag = (index: number) => {
        const newTags = [...customTags];
        newTags.splice(index, 1);
        setCustomTags(newTags);
    };

    // Handle domain category selection
    const toggleDomainTag = (tag: string) => {
        if (selectedDomainTags.includes(tag)) {
            setSelectedDomainTags(selectedDomainTags.filter(t => t !== tag));
        } else {
            setSelectedDomainTags([...selectedDomainTags, tag]);
        }
    };

    // Handle deployment type selection
    const toggleDeploymentType = (type: string) => {
        if (selectedDeploymentTypes.includes(type)) {
            setSelectedDeploymentTypes(selectedDeploymentTypes.filter(t => t !== type));
        } else {
            setSelectedDeploymentTypes([...selectedDeploymentTypes, type]);
        }
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

            // Extract rate limit information from headers
            const rateLimitInfo = extractRateLimitInfo(repoResponse.headers);

            // Handle rate limit specific errors
            if (!repoResponse.ok) {
                if (repoResponse.status === 403 && rateLimitInfo && rateLimitInfo.remaining === 0) {
                    const resetDate = new Date(rateLimitInfo.reset * 1000).toLocaleString();
                    setErrorMsg(
                        `GitHub API rate limit exceeded. Please try again after ${resetDate}. ` +
                        `This is a GitHub limitation to prevent abuse.`
                    );
                    setLoadingRepoInfo(false);
                    return;
                } else if (repoResponse.status === 404) {
                    setErrorMsg('Repository not found. Please check the URL and try again.');
                    setLoadingRepoInfo(false);
                    return;
                } else {
                    setErrorMsg(`GitHub API error: ${repoResponse.status} - ${repoResponse.statusText}`);
                    setLoadingRepoInfo(false);
                    return;
                }
            }

            // If rate limit is low but not exhausted, show a warning
            if (rateLimitInfo && rateLimitInfo.remaining < 5) {
                console.warn(`GitHub API rate limit warning: ${rateLimitInfo.remaining}/${rateLimitInfo.limit} requests remaining`);
            }

            const repoData = await repoResponse.json();
            setName(repoData.name || '');
            setDescription(repoData.description || '');

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
        setErrorMsg('');

        // Get the currently logged-in user
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        if (!user) {
            setErrorMsg('User not authenticated. Please log in again.');
            return;
        }

        // Combine all tags with prefixes for domain and deployment types
        const formattedDomainTags = selectedDomainTags.map(tag => `domain:${tag}`);
        const formattedDeploymentTags = selectedDeploymentTypes.map(type => `deployment:${type}`);
        const formattedProviderTag = [`provider:${selectedProviderType}`]; // Add the provider tag
        const allTags = [...formattedDomainTags, ...formattedDeploymentTags, ...formattedProviderTag, ...customTags];

        // Insert the new MCP entry into the 'mcps' table
        const { error } = await supabase
            .from('mcps')
            .insert({
                name: name.trim(),
                repository_url: repositoryUrl.trim(),
                owner_username: ownerUsername,
                repository_name: repositoryName,
                description: description.trim(),
                deployment_url: deploymentUrl.trim() || null,
                author: author,
                user_id: user.id,
                tags: allTags.length > 0 ? allTags : undefined,  // Use undefined instead of null
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
            setDescription('');
            setCustomTags([]);
            setSelectedDomainTags([]);
            setSelectedDeploymentTypes([]);
            setIsMCPHOwned(false); // Reset MCPH ownership flag
        }
    };

    return (
        isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                {/* Overlay */}
                <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>

                {/* Modal Content */}
                <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 z-10 max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
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

                            {/* Domain/Functional Categories */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Domain/Functional Categories
                                </label>
                                <p className="text-xs text-gray-500 mb-2">
                                    Select one or more categories that best describe your MCP's function or sector.
                                </p>
                                {loadingTags ? (
                                    <div className="flex items-center justify-center p-4">
                                        <div className="w-5 h-5 border-t-2 border-blue-500 rounded-full animate-spin"></div>
                                        <span className="ml-2 text-sm text-gray-600">Loading categories...</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
                                        {domainCategories.map((category) => (
                                            <button
                                                key={category.id}
                                                type="button"
                                                onClick={() => toggleDomainTag(category.name)}
                                                className={`text-xs py-1 px-2 rounded-full border ${selectedDomainTags.includes(category.name)
                                                    ? 'bg-blue-500 text-white border-blue-500'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                                    }`}
                                            >
                                                {category.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Deployment Types */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Deployment Types
                                </label>
                                <p className="text-xs text-gray-500 mb-2">
                                    Select how your MCP is typically deployed. You can select both if applicable.
                                </p>
                                {loadingTags ? (
                                    <div className="flex items-center justify-center p-2">
                                        <div className="w-4 h-4 border-t-2 border-blue-500 rounded-full animate-spin"></div>
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {deploymentTypes.map((type) => (
                                            <button
                                                key={type.id}
                                                type="button"
                                                onClick={() => toggleDeploymentType(type.name)}
                                                className={`text-xs py-1 px-2 rounded-full border ${selectedDeploymentTypes.includes(type.name)
                                                    ? 'bg-blue-500 text-white border-blue-500'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                                    }`}
                                            >
                                                {type.icon} {type.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Provider Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Provider Type
                                </label>
                                <p className="text-xs text-gray-500 mb-2">
                                    Select whether this MCP is officially provided by a service provider or is a community contribution.
                                </p>
                                {loadingTags ? (
                                    <div className="flex items-center justify-center p-2">
                                        <div className="w-4 h-4 border-t-2 border-blue-500 rounded-full animate-spin"></div>
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {providerTypes.map((type) => (
                                            <button
                                                key={type.id}
                                                type="button"
                                                onClick={() => setSelectedProviderType(type.name)}
                                                className={`text-xs py-1 px-2 rounded-full border ${selectedProviderType === type.name
                                                    ? 'bg-purple-500 text-white border-purple-500'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                                    }`}
                                            >
                                                {type.icon} {type.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Custom Tags */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Additional Tags (Optional)
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={customTagInput}
                                        onChange={handleCustomTagInputChange}
                                        onKeyDown={handleTagKeyDown}
                                        placeholder="Enter custom tags (comma or enter to add)"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md pr-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        onClick={addCustomTag}
                                        className="absolute right-1 top-1 h-8 px-3 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                                    >
                                        Add
                                    </button>
                                </div>

                                {customTags.length > 0 && (
                                    <div className="flex flex-wrap mt-2 gap-2">
                                        {customTags.map((tag, index) => (
                                            <span
                                                key={index}
                                                className="inline-flex items-center rounded-full bg-gray-400 px-3 py-1 text-sm text-white"
                                            >
                                                {tag}
                                                <button
                                                    onClick={() => removeCustomTag(index)}
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
                            </div>

                            {/* Selected Tags Summary */}
                            {(selectedDomainTags.length > 0 || selectedDeploymentTypes.length > 0) && (
                                <div className="mt-2 p-3 bg-gray-50 rounded-md">
                                    <h4 className="text-sm font-medium text-gray-700 mb-1">Selected Tags:</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedDomainTags.map((tag) => (
                                            <span key={tag} className="inline-flex items-center rounded-full bg-blue-500 px-3 py-1 text-xs text-white">
                                                {tag}
                                            </span>
                                        ))}
                                        {selectedDeploymentTypes.map((type) => (
                                            <span key={type} className="inline-flex items-center rounded-full bg-green-500 px-3 py-1 text-xs text-white">
                                                {deploymentTypes.find(t => t.name === type)?.icon || ''} {type}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

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
                    <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 sticky bottom-0 bg-white z-10">
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
