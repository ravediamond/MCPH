import { useState } from 'react';
import { useRouter } from 'next/router';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useForm, Controller } from 'react-hook-form';
import {
    Box,
    Button,
    Container,
    FormControl,
    FormErrorMessage,
    FormHelperText,
    FormLabel,
    Heading,
    Input,
    Tag,
    TagCloseButton,
    TagLabel,
    Textarea,
    VStack,
    HStack,
    useToast,
    Alert,
    AlertIcon,
} from '@chakra-ui/react';

type FormData = {
    name: string;
    description: string;
    deployment_url: string;
    documentation_url: string;
    version: string;
    author: string;
};

export default function NewMCP() {
    const router = useRouter();
    const user = useUser();
    const supabase = useSupabaseClient();
    const toast = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tags, setTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState('');

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<FormData>();

    if (!user) {
        return (
            <Container maxW="container.md" py={10}>
                <Alert status="warning">
                    <AlertIcon />
                    You need to be signed in to submit a new MCP.
                </Alert>
            </Container>
        );
    }

    const addTag = () => {
        if (newTag.trim() && !tags.includes(newTag.trim())) {
            setTags([...tags, newTag.trim()]);
            setNewTag('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);

        const mcpData = {
            ...data,
            tags,
            user_id: user.id,
        };

        const { data: newMCP, error } = await supabase
            .from('mcps')
            .insert([mcpData])
            .select()
            .single();

        setIsSubmitting(false);

        if (error) {
            toast({
                title: 'Error submitting MCP',
                description: error.message,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } else {
            toast({
                title: 'MCP submitted successfully',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            router.push(`/mcp/${newMCP.id}`);
        }
    };

    return (
        <Container maxW="container.md" py={8}>
            <VStack spacing={8} align="stretch">
                <Heading>Submit a New MCP</Heading>

                <Box as="form" onSubmit={handleSubmit(onSubmit)}>
                    <VStack spacing={6} align="stretch">
                        <FormControl isInvalid={!!errors.name} isRequired>
                            <FormLabel>MCP Name</FormLabel>
                            <Input
                                {...register('name', { required: 'Name is required' })}
                                placeholder="Enter the name of your MCP"
                            />
                            <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
                        </FormControl>

                        <FormControl isInvalid={!!errors.description} isRequired>
                            <FormLabel>Description</FormLabel>
                            <Textarea
                                {...register('description', {
                                    required: 'Description is required',
                                    minLength: {
                                        value: 30,
                                        message: 'Description should be at least 30 characters',
                                    },
                                })}
                                placeholder="Describe what your MCP does and how it can be used"
                                rows={5}
                            />
                            <FormErrorMessage>{errors.description?.message}</FormErrorMessage>
                        </FormControl>

                        <FormControl isInvalid={!!errors.deployment_url} isRequired>
                            <FormLabel>Deployment URL</FormLabel>
                            <Input
                                {...register('deployment_url', {
                                    required: 'Deployment URL is required',
                                    pattern: {
                                        value: /^https?:\/\/.+/i,
                                        message: 'Must be a valid URL starting with http:// or https://',
                                    },
                                })}
                                placeholder="https://example.com/api/mcp"
                            />
                            <FormHelperText>
                                The URL where your MCP is deployed and can be accessed
                            </FormHelperText>
                            <FormErrorMessage>{errors.deployment_url?.message}</FormErrorMessage>
                        </FormControl>

                        <FormControl isInvalid={!!errors.documentation_url}>
                            <FormLabel>Documentation URL</FormLabel>
                            <Input
                                {...register('documentation_url', {
                                    pattern: {
                                        value: /^https?:\/\/.+/i,
                                        message: 'Must be a valid URL starting with http:// or https://',
                                    },
                                })}
                                placeholder="https://example.com/docs"
                            />
                            <FormHelperText>Optional link to your MCP's documentation</FormHelperText>
                            <FormErrorMessage>{errors.documentation_url?.message}</FormErrorMessage>
                        </FormControl>

                        <FormControl isInvalid={!!errors.version} isRequired>
                            <FormLabel>Version</FormLabel>
                            <Input
                                {...register('version', {
                                    required: 'Version is required',
                                    pattern: {
                                        value: /^[0-9]+\.[0-9]+\.[0-9]+$/,
                                        message: 'Version must be in format x.y.z (e.g., 1.0.0)',
                                    },
                                })}
                                placeholder="1.0.0"
                            />
                            <FormErrorMessage>{errors.version?.message}</FormErrorMessage>
                        </FormControl>

                        <FormControl isInvalid={!!errors.author} isRequired>
                            <FormLabel>Author</FormLabel>
                            <Input
                                {...register('author', { required: 'Author is required' })}
                                placeholder="Your name or organization"
                            />
                            <FormErrorMessage>{errors.author?.message}</FormErrorMessage>
                        </FormControl>

                        <FormControl>
                            <FormLabel>Tags</FormLabel>
                            <HStack mb={2}>
                                <Input
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    placeholder="Add tags (e.g., 'finance', 'nlp')"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addTag();
                                        }
                                    }}
                                />
                                <Button onClick={addTag} colorScheme="brand">
                                    Add
                                </Button>
                            </HStack>
                            <Box>
                                {tags.length > 0 ? (
                                    <HStack spacing={2} wrap="wrap">
                                        {tags.map((tag) => (
                                            <Tag
                                                key={tag}
                                                size="md"
                                                borderRadius="full"
                                                variant="solid"
                                                colorScheme="brand"
                                                m={1}
                                            >
                                                <TagLabel>{tag}</TagLabel>
                                                <TagCloseButton onClick={() => removeTag(tag)} />
                                            </Tag>
                                        ))}
                                    </HStack>
                                ) : (
                                    <FormHelperText>
                                        Add relevant tags to help others discover your MCP
                                    </FormHelperText>
                                )}
                            </Box>
                        </FormControl>

                        <Button
                            mt={6}
                            colorScheme="brand"
                            type="submit"
                            size="lg"
                            isLoading={isSubmitting}
                        >
                            Submit MCP
                        </Button>
                    </VStack>
                </Box>
            </VStack>
        </Container>
    );
}
