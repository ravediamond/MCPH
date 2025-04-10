import { useState, useEffect } from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    FormControl,
    FormLabel,
    Text,
    VStack,
    Spinner,
    Textarea,
    HStack,
    Tag,
    TagLabel,
    TagCloseButton,
    Flex,
    Box,
    InputGroup,
    InputRightElement,
} from '@chakra-ui/react';
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
    const [name, setName] = useState('');
    const [version, setVersion] = useState('1.0.0'); // Default value
    const [description, setDescription] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [loadingRepoInfo, setLoadingRepoInfo] = useState(false);
    const [author, setAuthor] = useState('');
    // New state variables
    const [deploymentUrl, setDeploymentUrl] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>([]);

    // Fetch current user's email to auto-fill author
    useEffect(() => {
        async function fetchUser() {
            const { data: userData } = await supabase.auth.getUser();
            const user = userData?.user;
            if (user && user.email) {
                setAuthor(user.email);
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
                version: version.trim(),
                description: description.trim(),
                deployment_url: deploymentUrl.trim() || null,
                author: author,
                user_id: user.id,
                tags: tags.length > 0 ? tags : null,
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
            setDeploymentUrl('');
            setVersion('1.0.0');
            setDescription('');
            setTags([]);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Add New MCP</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4} align="stretch">
                        <FormControl isRequired>
                            <FormLabel>GitHub Repository URL</FormLabel>
                            <Input
                                value={repositoryUrl}
                                onChange={(e) => setRepositoryUrl(e.target.value)}
                                onBlur={handleRepoBlur}
                                placeholder="https://github.com/yourrepo"
                            />
                            {loadingRepoInfo && <Spinner size="sm" mt={2} />}
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel>Name</FormLabel>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="MCP Name"
                            />
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel>Version</FormLabel>
                            <Input
                                value={version}
                                onChange={(e) => setVersion(e.target.value)}
                                placeholder="e.g., 1.0.0"
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Description</FormLabel>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Detailed description of your MCP"
                                resize="vertical"
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel>MCP Deployment URL (optional)</FormLabel>
                            <Input
                                value={deploymentUrl}
                                onChange={(e) => setDeploymentUrl(e.target.value)}
                                placeholder="https://your-mcp-deployment.com"
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Tags/Categories</FormLabel>
                            <InputGroup size="md">
                                <Input
                                    value={tagInput}
                                    onChange={handleTagInputChange}
                                    onKeyDown={handleTagKeyDown}
                                    placeholder="Enter tags (comma or enter to add)"
                                />
                                <InputRightElement width="4.5rem">
                                    <Button h="1.75rem" size="sm" onClick={addTag}>
                                        Add
                                    </Button>
                                </InputRightElement>
                            </InputGroup>

                            {tags.length > 0 && (
                                <Flex wrap="wrap" mt={2} gap={2}>
                                    {tags.map((tag, index) => (
                                        <Tag
                                            size="md"
                                            key={index}
                                            borderRadius="full"
                                            variant="solid"
                                            colorScheme="blue"
                                        >
                                            <TagLabel>{tag}</TagLabel>
                                            <TagCloseButton onClick={() => removeTag(index)} />
                                        </Tag>
                                    ))}
                                </Flex>
                            )}
                            <Text fontSize="xs" color="gray.500" mt={1}>
                                Add relevant tags for better discoverability
                            </Text>
                        </FormControl>

                        {errorMsg && (
                            <Text color="red.500" mt={2}>
                                {errorMsg}
                            </Text>
                        )}
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button colorScheme="blue" mr={3} onClick={handleSubmit}>
                        Submit
                    </Button>
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
