document.addEventListener('DOMContentLoaded', function () {
    // Sample MCP data - in a real implementation, this would come from an API
    const mcpComponents = [
        {
            id: 1,
            name: "WebSearchMCP",
            description: "A model context protocol for web search integration",
            tags: ["official", "deployed"],
            author: "MCPHub Team",
            version: "1.0.2",
            lastUpdated: "2023-09-15",
            github: "https://github.com/mcphub/websearch-mcp",
            deployedUrl: "https://api.mcphub.org/websearch-mcp",
            languages: ["Python", "JavaScript"]
        },
        {
            id: 2,
            name: "DatabaseQueryMCP",
            description: "MCP for executing and managing database queries",
            tags: ["official"],
            author: "MCPHub Team",
            version: "0.9.1",
            lastUpdated: "2023-08-22",
            github: "https://github.com/mcphub/db-query-mcp",
            deployedUrl: null,
            languages: ["Python", "SQL"]
        },
        {
            id: 3,
            name: "ImageGenerationMCP",
            description: "Generate and manipulate images using AI models",
            tags: ["community", "deployed"],
            author: "AI Artist Collective",
            version: "1.1.0",
            lastUpdated: "2023-09-28",
            github: "https://github.com/ai-artist/image-gen-mcp",
            deployedUrl: "https://api.ai-artist.org/image-mcp",
            languages: ["Python", "TypeScript"]
        },
        {
            id: 4,
            name: "WeatherDataMCP",
            description: "Access real-time and historical weather data",
            tags: ["community"],
            author: "Climate Tools",
            version: "0.8.5",
            lastUpdated: "2023-07-11",
            github: "https://github.com/climate-tools/weather-mcp",
            deployedUrl: null,
            languages: ["Python"]
        },
        {
            id: 5,
            name: "CodeAnalysisMCP",
            description: "Analyze and generate code across multiple languages",
            tags: ["official", "deployed"],
            author: "MCPHub Team",
            version: "1.2.1",
            lastUpdated: "2023-10-03",
            github: "https://github.com/mcphub/code-analysis-mcp",
            deployedUrl: "https://api.mcphub.org/code-mcp",
            languages: ["Python", "TypeScript", "Go"]
        },
        {
            id: 6,
            name: "CalendarMCP",
            description: "Calendar and scheduling integration for AI assistants",
            tags: ["community", "deployed"],
            author: "ProductivityAI",
            version: "0.9.8",
            lastUpdated: "2023-09-19",
            github: "https://github.com/productivityai/calendar-mcp",
            deployedUrl: "https://api.productivityai.com/calendar-mcp",
            languages: ["JavaScript", "Python"]
        }
    ];

    // Render all components on initial load
    renderComponents(mcpComponents);

    // Set up search functionality
    const searchInput = document.getElementById('search');
    searchInput.addEventListener('input', function () {
        filterComponents();
    });

    // Set up tag filtering
    const filterTags = document.querySelectorAll('.filter-tag');
    filterTags.forEach(tag => {
        tag.addEventListener('click', function () {
            filterTags.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            filterComponents();
        });
    });

    // Set "All" filter as active by default
    document.querySelector('.filter-tag[data-tag="all"]').classList.add('active');

    // Filter components based on search input and selected tag
    function filterComponents() {
        const searchTerm = searchInput.value.toLowerCase();
        const activeTag = document.querySelector('.filter-tag.active').getAttribute('data-tag');

        const filteredComponents = mcpComponents.filter(component => {
            const matchesSearch = component.name.toLowerCase().includes(searchTerm) ||
                component.description.toLowerCase().includes(searchTerm);

            const matchesTag = activeTag === 'all' || component.tags.includes(activeTag);

            return matchesSearch && matchesTag;
        });

        renderComponents(filteredComponents);
    }

    // Render components to the DOM
    function renderComponents(components) {
        const componentsList = document.getElementById('componentsList');
        componentsList.innerHTML = '';

        if (components.length === 0) {
            componentsList.innerHTML = '<div class="no-results">No components found matching your criteria.</div>';
            return;
        }

        components.forEach(component => {
            const componentCard = document.createElement('div');
            componentCard.className = 'component-card';

            const tagsHtml = component.tags.map(tag =>
                `<span class="tag tag-${tag}">${tag.charAt(0).toUpperCase() + tag.slice(1)}</span>`
            ).join('');

            const deployedUrlHtml = component.deployedUrl ?
                `<a href="${component.deployedUrl}" class="btn btn-secondary" target="_blank">
                    <i class="fas fa-external-link-alt"></i> View API
                </a>` : '';

            const languagesHtml = component.languages.map(lang =>
                `<span class="language">${lang}</span>`
            ).join(', ');

            componentCard.innerHTML = `
                <div class="component-header">
                    <h4 class="component-name">${component.name}</h4>
                    <p class="component-description">${component.description}</p>
                    <div class="component-tags">
                        ${tagsHtml}
                    </div>
                </div>
                <div class="component-body">
                    <div class="component-info">
                        <p><i class="fas fa-user"></i> ${component.author}</p>
                        <p><i class="fas fa-code-branch"></i> v${component.version}</p>
                        <p><i class="fas fa-calendar"></i> ${component.lastUpdated}</p>
                        <p><i class="fas fa-code"></i> ${languagesHtml}</p>
                    </div>
                    <div class="component-links">
                        <a href="${component.github}" class="btn" target="_blank">
                            <i class="fab fa-github"></i> GitHub
                        </a>
                        ${deployedUrlHtml}
                    </div>
                </div>
            `;

            componentsList.appendChild(componentCard);
        });
    }
});
