/**
 * ============================================================
 * Ediccrew Tech Stack Architect
 * API Data Loader
 * Version: 1.0.0
 * ============================================================
 */

export default class API {

    static async load() {
        try {
            const componentsResponse = await fetch("../data/components.json");
            const domainsResponse = await fetch("../data/domain.json");
            const recipesResponse = await fetch("../data/recipes.json");

            if (!componentsResponse.ok || !domainsResponse.ok || !recipesResponse.ok) {
                throw new Error(`Failed to load data: components (${componentsResponse.status}), domains (${domainsResponse.status}), recipes (${recipesResponse.status})`);
            }

            let components = await componentsResponse.json();
            const jsonDomains = await domainsResponse.json();
            const recipes = await recipesResponse.json();

            let domains = jsonDomains;

        try {
            let mdText = "";
            let mdResponse = await fetch("../content-detail.md");
            if (!mdResponse.ok) {
                mdResponse = await fetch("../content-details.md");
            }
            if (mdResponse.ok) {
                mdText = await mdResponse.text();
            }

            if (mdText) {
                const parsedDomains = this.parseDomainsFromMarkdown(mdText);
                if (parsedDomains && parsedDomains.length > 0) {
                    domains = parsedDomains.map((parsed, idx) => {
                        const jsonDom = jsonDomains.find(d => d.id === parsed.id) || {};
                        return {
                            id: parsed.id,
                            title: parsed.title,
                            shortTitle: jsonDom.shortTitle || parsed.title,
                            description: parsed.description,
                            icon: jsonDom.icon || "📦",
                            color: jsonDom.color || "#6B7280",
                            priority: jsonDom.priority || (idx + 1),
                            tags: jsonDom.tags || [],
                            blogReference: {
                                title: parsed.blogTitle || (jsonDom.blogReference ? jsonDom.blogReference.title : ""),
                                slug: jsonDom.blogReference ? jsonDom.blogReference.slug : ""
                            },
                            supportedOutputs: jsonDom.supportedOutputs || []
                        };
                    });
                }

                const parsedComponents = this.parseComponentsFromMarkdown(mdText);
                if (parsedComponents && parsedComponents.length > 0) {
                    components = components.map(jsonComp => {
                        const parsed = parsedComponents.find(c => c.id === jsonComp.id);
                        if (parsed) {
                            return {
                                ...jsonComp,
                                name: parsed.name,
                                domain: parsed.domain,
                                category: parsed.category,
                                description: parsed.description,
                                requires: parsed.requires.length > 0 ? parsed.requires : (jsonComp.requires || []),
                                warnings: parsed.warnings.length > 0 ? parsed.warnings : (jsonComp.warnings || []),
                                pinsProvided: parsed.pinsProvided.length > 0 ? parsed.pinsProvided : (jsonComp.pinsProvided || []),
                                pinsRequired: parsed.pinsRequired.length > 0 ? parsed.pinsRequired : (jsonComp.pinsRequired || [])
                            };
                        }
                        return jsonComp;
                    });
                }
            }
        } catch (error) {
            console.error("Error loading or parsing content-detail(s).md:", error);
        }

        return {

            components,

            domains,

            recipes

        };
        } catch (error) {
            console.error("Critical error loading database configurations:", error);
            const errorDiv = document.createElement("div");
            errorDiv.style.position = "fixed";
            errorDiv.style.top = "0";
            errorDiv.style.left = "0";
            errorDiv.style.width = "100%";
            errorDiv.style.height = "100%";
            errorDiv.style.background = "rgba(15, 23, 42, 0.95)";
            errorDiv.style.color = "#FFFFFF";
            errorDiv.style.display = "flex";
            errorDiv.style.flexDirection = "column";
            errorDiv.style.alignItems = "center";
            errorDiv.style.justifyContent = "center";
            errorDiv.style.zIndex = "9999";
            errorDiv.style.fontFamily = "sans-serif";
            errorDiv.style.padding = "20px";
            errorDiv.style.textAlign = "center";
            
            errorDiv.innerHTML = `
                <div style="max-width: 500px; background: #1e1e2f; padding: 30px; border-radius: 12px; border: 1px solid #EF4444; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                    <h2 style="color: #EF4444; margin-bottom: 15px;">Database Load Error</h2>
                    <p style="color: #94A3B8; margin-bottom: 20px; font-size: 14px; line-height: 1.6;">
                        Failed to fetch or parse the required tech-stack data files. This usually happens if the server is offline or the configuration files are missing/malformed.
                    </p>
                    <pre style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 6px; font-size: 12px; overflow-x: auto; color: #F59E0B; border: 1px solid rgba(245, 158, 11, 0.2); text-align: left; white-space: pre-wrap; word-break: break-all;">${error.message}</pre>
                </div>
            `;
            document.body.appendChild(errorDiv);

            return {
                components: [],
                domains: [],
                recipes: []
            };
        }
    }

    static parseDomainsFromMarkdown(mdText) {
        const domains = [];
        const lines = mdText.split(/\r?\n/);
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("|")) {
                const cols = trimmed.split("|")
                    .map(c => c.trim())
                    .filter((c, index, arr) => {
                        if (index === 0 && c === "") return false;
                        if (index === arr.length - 1 && c === "") return false;
                        return true;
                    });
                
                if (cols.length >= 3) {
                    const idCol = cols[0].replace(/`/g, "").trim().toLowerCase();
                    // Skip header or divider rows
                    if (idCol === "domain id" || idCol.startsWith(":") || idCol.startsWith("-")) {
                        continue;
                    }
                    
                    const id = cols[0].replace(/`/g, "").trim();
                    const title = cols[1].trim();
                    const description = cols[2].trim();
                    
                    // Cross-reference blog post
                    let blogTitle = "";
                    if (cols[3]) {
                        blogTitle = cols[3].trim().replace(/^["']|["']$/g, "").trim();
                    }
                    
                    domains.push({
                        id,
                        title,
                        description,
                        blogTitle
                    });
                }
            }
        }
        return domains;
    }

    static parseComponentsFromMarkdown(mdText) {
        const components = [];
        const lines = mdText.split(/\r?\n/);
        
        let currentDomainId = null;
        let currentComponent = null;
        
        const domainRegex = /###\s+DOMAIN:\s+([^(]+)\(([^)]+)\)/i;
        const itemRegex = /####\s+Item\s+\d+:\s+(.+)/i;
        const propRegex = /^\*\s+\*\*([^:]+):\*\*\s*(.+)$/;
        
        for (const line of lines) {
            const trimmed = line.trim();
            
            const domainMatch = trimmed.match(domainRegex);
            if (domainMatch) {
                currentDomainId = domainMatch[2].replace(/`/g, "").trim();
                continue;
            }
            
            const itemMatch = trimmed.match(itemRegex);
            if (itemMatch) {
                if (currentComponent) {
                    components.push(currentComponent);
                }
                currentComponent = {
                    name: itemMatch[1].trim(),
                    domain: currentDomainId,
                    id: '',
                    category: '',
                    description: '',
                    requires: [],
                    optional: [],
                    conflicts: [],
                    warnings: [],
                    pinsProvided: [],
                    pinsRequired: []
                };
                continue;
            }
            
            if (currentComponent && trimmed.startsWith("*")) {
                const propMatch = trimmed.match(propRegex);
                if (propMatch) {
                    const key = propMatch[1].trim().toLowerCase();
                    const value = propMatch[2].trim();
                    
                    if (key === 'id') {
                        currentComponent.id = value.replace(/`/g, "").trim();
                    } else if (key === 'category') {
                        currentComponent.category = value.trim();
                    } else if (key === 'validation rules') {
                        currentComponent.description = value.trim();
                    } else if (key === 'system requirements') {
                        let cleanVal = value.replace(/`/g, "").trim();
                        const closeIdx = cleanVal.lastIndexOf(']');
                        if (closeIdx !== -1) {
                            cleanVal = cleanVal.substring(0, closeIdx + 1);
                        }
                        try {
                            currentComponent.requires = JSON.parse(cleanVal);
                        } catch (e) {
                            console.warn(`[API] Failed to parse system requirements for ${currentComponent.name || 'unknown'}: "${cleanVal}"`, e);
                            currentComponent.requires = [];
                        }
                    } else if (key === 'pins provided') {
                        let cleanVal = value.replace(/`/g, "").trim();
                        const closeIdx = cleanVal.lastIndexOf(']');
                        if (closeIdx !== -1) {
                            cleanVal = cleanVal.substring(0, closeIdx + 1);
                        }
                        try {
                            currentComponent.pinsProvided = JSON.parse(cleanVal);
                        } catch (e) {
                            console.warn(`[API] Failed to parse pins provided for ${currentComponent.name || 'unknown'}: "${cleanVal}"`, e);
                            currentComponent.pinsProvided = [];
                        }
                    } else if (key === 'pins demanded') {
                        let cleanVal = value.replace(/`/g, "").trim();
                        const closeIdx = cleanVal.lastIndexOf(']');
                        if (closeIdx !== -1) {
                            cleanVal = cleanVal.substring(0, closeIdx + 1);
                        }
                        try {
                            currentComponent.pinsRequired = JSON.parse(cleanVal);
                        } catch (e) {
                            console.warn(`[API] Failed to parse pins demanded for ${currentComponent.name || 'unknown'}: "${cleanVal}"`, e);
                            currentComponent.pinsRequired = [];
                        }
                    } else if (key === 'architectural warning') {
                        const cleanWarning = value.replace(/^["']|["']$/g, "").trim();
                        currentComponent.warnings = [cleanWarning];
                    }
                }
            }
        }
        
        if (currentComponent) {
            components.push(currentComponent);
        }
        
        return components;
    }

}
