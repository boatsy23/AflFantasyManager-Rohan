#!/usr/bin/env node
/**
 * AFL Fantasy Platform - COMPREHENSIVE FILE ANALYZER
 * 
 * Pure fact-finding forensic analysis matching manual quality.
 * No assumptions about importance - just complete functional descriptions.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ComprehensiveFileAnalyzer {
    constructor() {
        this.inventoryFile = 'codebase_inventory_analysis.txt';
        this.analysisResults = new Map();
        this.filePathCache = new Map();
        
        // Complete red/green flags from inventory file
        this.redFlagDefinitions = {
            'imports_nonexistent_modules': 'Files importing non-existent modules or paths',
            'hardcoded_mock_data': 'Hard-coded or mock player data instead of API calls',
            'multiple_identical_jobs': 'Multiple files doing identical jobs (duplicates)',
            'legacy_backup_files': 'Files in /legacy/, /backup/, or with .bak extensions',
            'commented_todo_blocks': 'Commented out code blocks or TODO comments',
            'not_imported_anywhere': 'Files not imported/used anywhere in the codebase',
            'dead_api_endpoints': 'Dead API endpoints not registered in routes',
            'not_rendered_components': 'Components not rendered in any page/parent component',
            'no_real_data_sources': 'Services that don\'t connect to real data sources',
            'screenshots_excel_mixed': 'Screenshots, Excel dumps, or temp files mixed with code',
            'hardcoded_team_names': 'Hardcoded team/player names instead of dynamic data',
            'console_debug_code': 'Console.log statements and debug code',
            'test_example_temp_files': 'Files with "test", "example", "temp" in the name',
            'python_in_frontend': 'Python scripts mixed with TypeScript frontend code',
            'backup_timestamp_names': 'Backup folders with timestamps or personal names',
            'imports_missing_paths': 'Files importing from paths that don\'t exist'
        };
        
        this.greenFlagDefinitions = {
            'properly_imported_used': 'Files properly imported and used by other components',
            'registered_api_endpoints': 'API endpoints registered in main routes file',
            'rendered_in_components': 'Components rendered in pages or parent components',
            'real_api_data_sources': 'Services that fetch data from real APIs/databases',
            'type_definitions_used': 'Type definitions used across multiple files',
            'utility_functions_called': 'Utility functions called by multiple components',
            'structured_react_components': 'Properly structured React components with real functionality',
            'active_database_schemas': 'Database schemas and models actively used',
            'required_config_files': 'Configuration files required by build tools',
            'main_application_flow': 'Files that are part of the main application flow',
            'clean_import_exports': 'Clean import/export relationships',
            'real_data_error_handling': 'Real data fetching with proper error handling',
            'proper_typescript_typing': 'Components with proper TypeScript typing',
            'contributes_to_preview': 'Files that contribute to the working preview',
            'essential_build_files': 'Essential build and configuration files',
            'active_dependencies': 'Files with active dependency relationships'
        };
    }

    async analyze() {
        console.log('🔍 Starting COMPREHENSIVE file analysis...');
        
        // Build file path cache first
        await this.buildFilePathCache();
        
        // Parse inventory to get file list
        const fileList = this.parseInventoryFile();
        console.log(`📁 Found ${fileList.length} files to analyze comprehensively`);
        
        // Analyze each file with full detail
        let analyzed = 0;
        for (const fileName of fileList) {
            analyzed++;
            console.log(`📊 Analyzing ${analyzed}/${fileList.length}: ${fileName}`);
            await this.comprehensiveAnalyze(fileName);
        }
        
        // Update inventory with comprehensive findings
        this.updateInventoryWithAnalysis();
        
        console.log('✅ Comprehensive analysis complete!');
    }

    async buildFilePathCache() {
        // Build a cache of all actual file paths for better resolution
        const walkDir = (dir, baseDir = '') => {
            try {
                const files = fs.readdirSync(dir);
                for (const file of files) {
                    const filePath = path.join(dir, file);
                    const relativePath = path.join(baseDir, file);
                    
                    try {
                        const stat = fs.statSync(filePath);
                        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
                            walkDir(filePath, relativePath);
                        } else if (stat.isFile()) {
                            // Store both basename and full relative path
                            const basename = path.basename(filePath);
                            if (!this.filePathCache.has(basename)) {
                                this.filePathCache.set(basename, []);
                            }
                            this.filePathCache.get(basename).push(filePath);
                        }
                    } catch (e) {
                        // Skip files we can't access
                    }
                }
            } catch (e) {
                // Skip directories we can't read
            }
        };
        
        walkDir('.');
        console.log(`📂 Cached ${this.filePathCache.size} unique file names`);
    }

    parseInventoryFile() {
        const content = fs.readFileSync(this.inventoryFile, 'utf8');
        const lines = content.split('\n');
        const files = [];
        
        for (const line of lines) {
            if (line.includes('FOLDER:') || line.includes('====') || line.includes('ANALYSIS:')) {
                continue;
            }
            
            // Extract file names more carefully
            const match = line.match(/([a-zA-Z0-9_\-]+\.[a-zA-Z0-9]+)/);
            if (match) {
                const fileName = match[1].trim();
                if (!files.includes(fileName)) {
                    files.push(fileName);
                }
            }
        }
        
        return files;
    }

    findFilePath(fileName) {
        // Try to find the actual file path
        if (this.filePathCache.has(fileName)) {
            const possiblePaths = this.filePathCache.get(fileName);
            // Return the first valid path
            for (const filePath of possiblePaths) {
                if (fs.existsSync(filePath)) {
                    return filePath;
                }
            }
        }
        
        // Fallback to common locations
        const commonPaths = [
            fileName,
            `client/src/components/player-stats/${fileName}`,
            `client/src/components/${fileName}`,
            `server/${fileName}`,
            `src/${fileName}`,
            `./${fileName}`
        ];
        
        for (const testPath of commonPaths) {
            if (fs.existsSync(testPath)) {
                return testPath;
            }
        }
        
        return null;
    }

    async comprehensiveAnalyze(fileName) {
        const analysis = {
            fileName,
            actualPath: null,
            exists: false,
            fileSize: 0,
            lines: 0,
            extension: path.extname(fileName),
            
            // Functional description
            purpose: '',
            howItWorks: '',
            whatItDoes: [],
            
            // Technical details
            functions: [],
            classes: [],
            components: [],
            imports: [],
            exports: [],
            dependencies: [],
            
            // API and data
            apiCalls: [],
            routes: [],
            dataFlow: '',
            
            // Flag results
            redFlags: new Map(),
            greenFlags: new Map(),
            
            // Raw content for analysis
            content: ''
        };

        // Find the actual file path
        const actualPath = this.findFilePath(fileName);
        if (!actualPath) {
            analysis.exists = false;
            analysis.purpose = 'FILE NOT FOUND - Cannot analyze';
            this.analysisResults.set(fileName, analysis);
            return;
        }

        analysis.actualPath = actualPath;
        analysis.exists = true;

        // Skip binary files
        if (this.isBinaryFile(actualPath)) {
            analysis.purpose = 'BINARY FILE - Image, Excel, or other binary format';
            this.analysisResults.set(fileName, analysis);
            return;
        }

        try {
            // Read file content
            const content = fs.readFileSync(actualPath, 'utf8');
            const stats = fs.statSync(actualPath);
            
            analysis.content = content;
            analysis.fileSize = stats.size;
            analysis.lines = content.split('\n').length;
            
            // Analyze based on file type
            if (['.ts', '.tsx', '.js', '.jsx'].includes(analysis.extension)) {
                this.analyzeJavaScriptFile(analysis);
            } else if (analysis.extension === '.py') {
                this.analyzePythonFile(analysis);
            } else if (analysis.extension === '.json') {
                this.analyzeJsonFile(analysis);
            } else if (['.md', '.txt'].includes(analysis.extension)) {
                this.analyzeDocumentationFile(analysis);
            } else if (['.css', '.scss'].includes(analysis.extension)) {
                this.analyzeStyleFile(analysis);
            } else {
                this.analyzeConfigFile(analysis);
            }
            
            // Check all flags
            this.checkAllFlags(analysis);
            
            // Generate comprehensive description
            this.generateFunctionalDescription(analysis);
            
        } catch (error) {
            analysis.purpose = `ERROR READING FILE: ${error.message}`;
        }

        this.analysisResults.set(fileName, analysis);
    }

    analyzeJavaScriptFile(analysis) {
        const content = analysis.content;
        
        // Extract all functions with context
        const functionPatterns = [
            /(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*\{/g,
            /(?:export\s+)?const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g,
            /(?:export\s+)?const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s+)?function/g
        ];
        
        for (const pattern of functionPatterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                if (!analysis.functions.includes(match[1])) {
                    analysis.functions.push(match[1]);
                }
            }
        }
        
        // Extract React components (capital first letter)
        const componentPattern = /(?:export\s+)?(?:default\s+)?(?:function|const)\s+([A-Z][a-zA-Z0-9_]*)/g;
        let match;
        while ((match = componentPattern.exec(content)) !== null) {
            if (!analysis.components.includes(match[1])) {
                analysis.components.push(match[1]);
                analysis.whatItDoes.push(`Defines React component: ${match[1]}`);
            }
        }
        
        // Extract classes
        const classPattern = /class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
        while ((match = classPattern.exec(content)) !== null) {
            if (!analysis.classes.includes(match[1])) {
                analysis.classes.push(match[1]);
                analysis.whatItDoes.push(`Defines class: ${match[1]}`);
            }
        }
        
        // Extract imports with detail
        const importPatterns = [
            /import\s+(?:\{([^}]*)\}|\*\s+as\s+([a-zA-Z_$][a-zA-Z0-9_$]*))\s+from\s+['"`]([^'"`]+)['"`]/g,
            /import\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s+from\s+['"`]([^'"`]+)['"`]/g,
            /import\s+['"`]([^'"`]+)['"`]/g
        ];
        
        for (const pattern of importPatterns) {
            pattern.lastIndex = 0;
            while ((match = pattern.exec(content)) !== null) {
                const importPath = match[match.length - 1];
                if (!analysis.imports.find(imp => imp.path === importPath)) {
                    const importInfo = {
                        path: importPath,
                        type: this.getImportType(importPath),
                        purpose: this.getImportPurpose(importPath, content)
                    };
                    analysis.imports.push(importInfo);
                }
            }
        }
        
        // Extract exports
        const exportPatterns = [
            /export\s+(?:default\s+)?(?:class|function|const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
            /export\s+\{\s*([^}]+)\s*\}/g,
            /export\s+default\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g
        ];
        
        for (const pattern of exportPatterns) {
            pattern.lastIndex = 0;
            while ((match = pattern.exec(content)) !== null) {
                if (match[1] && !analysis.exports.includes(match[1])) {
                    analysis.exports.push(match[1]);
                }
            }
        }
        
        // Extract API calls
        const apiPatterns = [
            /fetch\s*\(\s*['"`]([^'"`]+)['"`]/g,
            /axios\.\w+\s*\(\s*['"`]([^'"`]+)['"`]/g,
            /queryKey:\s*\[\s*['"`]([^'"`]+)['"`]/g,
            /useQuery\s*\(\s*\{\s*queryKey:\s*\[\s*['"`]([^'"`]+)['"`]/g
        ];
        
        for (const pattern of apiPatterns) {
            pattern.lastIndex = 0;
            while ((match = pattern.exec(content)) !== null) {
                if (!analysis.apiCalls.includes(match[1])) {
                    analysis.apiCalls.push(match[1]);
                    analysis.whatItDoes.push(`Makes API call to: ${match[1]}`);
                }
            }
        }
        
        // Extract routes
        const routePatterns = [
            /app\.\w+\s*\(\s*['"`]([^'"`]+)['"`]/g,
            /router\.\w+\s*\(\s*['"`]([^'"`]+)['"`]/g,
            /<Route\s+path\s*=\s*['"`]([^'"`]+)['"`]/g
        ];
        
        for (const pattern of routePatterns) {
            pattern.lastIndex = 0;
            while ((match = pattern.exec(content)) !== null) {
                if (!analysis.routes.includes(match[1])) {
                    analysis.routes.push(match[1]);
                    analysis.whatItDoes.push(`Defines route: ${match[1]}`);
                }
            }
        }
        
        // Detect React hooks usage
        if (content.includes('useState')) {
            analysis.whatItDoes.push('Uses React state management (useState)');
        }
        if (content.includes('useEffect')) {
            analysis.whatItDoes.push('Uses React side effects (useEffect)');
        }
        if (content.includes('useContext')) {
            analysis.whatItDoes.push('Uses React context (useContext)');
        }
        if (content.includes('useQuery')) {
            analysis.whatItDoes.push('Uses React Query for data fetching');
        }
    }

    analyzePythonFile(analysis) {
        const content = analysis.content;
        
        // Extract Python functions
        const functionPattern = /def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;
        let match;
        while ((match = functionPattern.exec(content)) !== null) {
            if (!analysis.functions.includes(match[1])) {
                analysis.functions.push(match[1]);
                analysis.whatItDoes.push(`Defines Python function: ${match[1]}`);
            }
        }
        
        // Extract Python classes
        const classPattern = /class\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;
        while ((match = classPattern.exec(content)) !== null) {
            if (!analysis.classes.includes(match[1])) {
                analysis.classes.push(match[1]);
                analysis.whatItDoes.push(`Defines Python class: ${match[1]}`);
            }
        }
        
        // Extract Python imports
        const importPattern = /(?:from\s+([^\s]+)\s+)?import\s+([^\n]+)/g;
        while ((match = importPattern.exec(content)) !== null) {
            const module = match[1] || match[2];
            if (!analysis.imports.find(imp => imp.path === module)) {
                analysis.imports.push({
                    path: module,
                    type: 'python_module',
                    purpose: this.getPythonImportPurpose(module)
                });
            }
        }
        
        // Detect scraping functionality
        if (content.includes('BeautifulSoup') || content.includes('requests.get')) {
            analysis.whatItDoes.push('Web scraping functionality');
        }
        if (content.includes('pandas')) {
            analysis.whatItDoes.push('Data processing with pandas');
        }
        if (content.includes('selenium')) {
            analysis.whatItDoes.push('Browser automation with Selenium');
        }
    }

    analyzeJsonFile(analysis) {
        try {
            const data = JSON.parse(analysis.content);
            
            if (analysis.fileName === 'package.json') {
                analysis.purpose = 'Node.js project configuration and dependencies';
                analysis.whatItDoes.push('Defines npm dependencies');
                analysis.whatItDoes.push('Defines npm scripts');
                if (data.scripts) {
                    Object.keys(data.scripts).forEach(script => {
                        analysis.whatItDoes.push(`Script: ${script} - ${data.scripts[script]}`);
                    });
                }
            } else if (analysis.fileName.includes('tsconfig')) {
                analysis.purpose = 'TypeScript compiler configuration';
                analysis.whatItDoes.push('Configures TypeScript compilation');
            } else if (analysis.fileName.includes('player')) {
                analysis.purpose = 'Player data storage';
                analysis.whatItDoes.push(`Stores data for ${Object.keys(data).length} items`);
            } else {
                analysis.purpose = 'JSON data file';
                analysis.whatItDoes.push(`Contains ${Object.keys(data).length} top-level keys`);
            }
        } catch (error) {
            analysis.purpose = 'Invalid or malformed JSON file';
        }
    }

    analyzeDocumentationFile(analysis) {
        const lines = analysis.content.split('\n');
        const headings = lines.filter(line => line.startsWith('#'));
        
        if (headings.length > 0) {
            analysis.whatItDoes.push(`Documentation with ${headings.length} sections`);
            // Get first few headings
            headings.slice(0, 3).forEach(heading => {
                analysis.whatItDoes.push(`Section: ${heading.replace(/#/g, '').trim()}`);
            });
        }
        
        if (analysis.fileName === 'README.md') {
            analysis.purpose = 'Main project documentation';
        } else if (analysis.fileName.includes('TODO')) {
            analysis.purpose = 'Task tracking documentation';
        } else {
            analysis.purpose = 'Documentation or notes file';
        }
    }

    analyzeStyleFile(analysis) {
        const content = analysis.content;
        
        // Count CSS rules
        const ruleCount = (content.match(/\{[^}]*\}/g) || []).length;
        analysis.whatItDoes.push(`Defines ${ruleCount} CSS rules`);
        
        // Check for specific patterns
        if (content.includes('@media')) {
            analysis.whatItDoes.push('Contains responsive media queries');
        }
        if (content.includes(':root') || content.includes('--')) {
            analysis.whatItDoes.push('Defines CSS custom properties/variables');
        }
        if (content.includes('@import')) {
            analysis.whatItDoes.push('Imports other stylesheets');
        }
        
        analysis.purpose = 'Stylesheet for visual styling';
    }

    analyzeConfigFile(analysis) {
        if (analysis.fileName.includes('vite')) {
            analysis.purpose = 'Vite build tool configuration';
            analysis.whatItDoes.push('Configures Vite bundler');
        } else if (analysis.fileName.includes('tailwind')) {
            analysis.purpose = 'Tailwind CSS configuration';
            analysis.whatItDoes.push('Configures Tailwind CSS framework');
        } else if (analysis.fileName.includes('drizzle')) {
            analysis.purpose = 'Drizzle ORM configuration';
            analysis.whatItDoes.push('Configures database ORM');
        } else {
            analysis.purpose = 'Configuration file';
        }
    }

    checkAllFlags(analysis) {
        const content = analysis.content;
        
        // Check each red flag
        for (const [flag, description] of Object.entries(this.redFlagDefinitions)) {
            let result = 'NO';
            
            switch(flag) {
                case 'imports_nonexistent_modules':
                    result = analysis.imports.some(imp => imp.type === 'missing') ? 'YES' : 'NO';
                    break;
                case 'hardcoded_mock_data':
                    result = /mock|placeholder|dummy|test.*data|'player1'/i.test(content) ? 'YES' : 'NO';
                    break;
                case 'legacy_backup_files':
                    result = /legacy|backup|\.bak|\.old/i.test(analysis.actualPath || '') ? 'YES' : 'NO';
                    break;
                case 'commented_todo_blocks':
                    result = /TODO|FIXME|HACK|XXX|\/\*[\s\S]*?\*\//.test(content) ? 'YES' : 'NO';
                    break;
                case 'console_debug_code':
                    result = /console\.(log|warn|error|debug|info)/.test(content) ? 'YES' : 'NO';
                    break;
                case 'hardcoded_team_names':
                    result = /(Richmond|Carlton|Collingwood|Essendon|Hawthorn|Melbourne)['"`]/.test(content) ? 'YES' : 'NO';
                    break;
                case 'test_example_temp_files':
                    result = /test|example|temp|sample|demo/i.test(analysis.fileName) ? 'YES' : 'NO';
                    break;
                case 'python_in_frontend':
                    result = (analysis.extension === '.py' && analysis.actualPath?.includes('client/')) ? 'YES' : 'NO';
                    break;
                case 'screenshots_excel_mixed':
                    result = /screenshot|\.xlsx|\.xls|attached_assets/i.test(analysis.actualPath || '') ? 'YES' : 'NO';
                    break;
                default:
                    result = 'N/A';
            }
            
            analysis.redFlags.set(flag, result);
        }
        
        // Check each green flag
        for (const [flag, description] of Object.entries(this.greenFlagDefinitions)) {
            let result = 'NO';
            
            switch(flag) {
                case 'real_api_data_sources':
                    result = (analysis.apiCalls.length > 0 || /fetch|axios|database/.test(content)) ? 'YES' : 'NO';
                    break;
                case 'proper_typescript_typing':
                    result = /interface\s+|type\s+|:\s*(string|number|boolean)/.test(content) ? 'YES' : 'NO';
                    break;
                case 'structured_react_components':
                    result = (analysis.components.length > 0 && /useState|useEffect|return\s*\(/.test(content)) ? 'YES' : 'NO';
                    break;
                case 'required_config_files':
                    result = /package\.json|tsconfig|vite\.config|tailwind/.test(analysis.fileName) ? 'YES' : 'NO';
                    break;
                case 'clean_import_exports':
                    result = (analysis.imports.length > 0 && analysis.exports.length > 0) ? 'YES' : 'NO';
                    break;
                case 'registered_api_endpoints':
                    result = analysis.routes.length > 0 ? 'YES' : 'NO';
                    break;
                default:
                    result = 'N/A';
            }
            
            analysis.greenFlags.set(flag, result);
        }
    }

    generateFunctionalDescription(analysis) {
        // Generate PURPOSE based on file characteristics
        if (analysis.components.length > 0) {
            if (analysis.fileName.includes('table')) {
                analysis.purpose = 'React component that displays data in table format';
            } else if (analysis.fileName.includes('modal')) {
                analysis.purpose = 'React component for modal/popup display';
            } else if (analysis.fileName.includes('form')) {
                analysis.purpose = 'React component for form input and submission';
            } else {
                analysis.purpose = `React component (${analysis.components.join(', ')})`;
            }
        } else if (analysis.routes.length > 0) {
            analysis.purpose = 'API route definitions for backend endpoints';
        } else if (analysis.fileName.includes('service')) {
            analysis.purpose = 'Service module for business logic';
        } else if (analysis.fileName.includes('util')) {
            analysis.purpose = 'Utility functions for reusable logic';
        } else if (analysis.extension === '.py') {
            if (analysis.content.includes('scrape') || analysis.content.includes('BeautifulSoup')) {
                analysis.purpose = 'Python web scraping script';
            } else if (analysis.content.includes('pandas')) {
                analysis.purpose = 'Python data processing script';
            } else {
                analysis.purpose = 'Python script';
            }
        }
        
        // Generate HOW IT WORKS
        if (analysis.components.length > 0) {
            analysis.howItWorks = `Renders React component with ${analysis.functions.length} functions. `;
            if (analysis.content.includes('useState')) {
                analysis.howItWorks += 'Manages local state. ';
            }
            if (analysis.apiCalls.length > 0) {
                analysis.howItWorks += `Fetches data from ${analysis.apiCalls.length} API endpoints. `;
            }
            if (analysis.content.includes('props')) {
                analysis.howItWorks += 'Receives data via props. ';
            }
        } else if (analysis.routes.length > 0) {
            analysis.howItWorks = `Defines ${analysis.routes.length} API routes handling HTTP requests. `;
        } else if (analysis.extension === '.py') {
            analysis.howItWorks = `Python script with ${analysis.functions.length} functions and ${analysis.classes.length} classes. `;
        } else {
            analysis.howItWorks = `${analysis.extension} file with ${analysis.lines} lines of code. `;
        }
        
        // Generate DATA FLOW if applicable
        if (analysis.apiCalls.length > 0) {
            analysis.dataFlow = `Fetches from: ${analysis.apiCalls.join(', ')}`;
        } else if (analysis.exports.length > 0) {
            analysis.dataFlow = `Exports: ${analysis.exports.join(', ')}`;
        } else {
            analysis.dataFlow = 'No external data flow detected';
        }
    }

    getImportType(importPath) {
        if (importPath.startsWith('.') || importPath.startsWith('@/')) {
            return 'local_module';
        } else if (importPath.includes('react')) {
            return 'react_framework';
        } else if (importPath.includes('ui')) {
            return 'ui_component';
        } else {
            return 'external_package';
        }
    }

    getImportPurpose(importPath, content) {
        if (importPath.includes('table')) {
            return 'Provides table UI components';
        } else if (importPath.includes('button')) {
            return 'Provides button UI component';
        } else if (importPath.includes('utils')) {
            return 'Provides utility functions';
        } else if (importPath.includes('types')) {
            return 'Provides TypeScript type definitions';
        } else if (importPath === 'react') {
            return 'React framework for component creation';
        } else if (importPath.includes('axios')) {
            return 'HTTP client for API calls';
        } else if (importPath.includes('query')) {
            return 'Data fetching and caching';
        } else {
            return 'Provides functionality';
        }
    }

    getPythonImportPurpose(module) {
        const purposes = {
            'pandas': 'Data manipulation and analysis',
            'requests': 'HTTP requests for web scraping',
            'BeautifulSoup': 'HTML parsing for web scraping',
            'selenium': 'Browser automation',
            'json': 'JSON data handling',
            'os': 'Operating system interface',
            'sys': 'System-specific parameters'
        };
        
        for (const [key, purpose] of Object.entries(purposes)) {
            if (module.includes(key)) {
                return purpose;
            }
        }
        return 'Python module';
    }

    isBinaryFile(filePath) {
        const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.xlsx', '.xls', '.zip', '.docx'];
        return binaryExtensions.some(ext => filePath.toLowerCase().endsWith(ext));
    }

    updateInventoryWithAnalysis() {
        let content = fs.readFileSync(this.inventoryFile, 'utf8');
        
        for (const [fileName, analysis] of this.analysisResults) {
            const report = this.formatComprehensiveReport(analysis);
            
            // Find and replace the ANALYSIS section for this file
            const patterns = [
                new RegExp(`(${fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*?\\nANALYSIS:)\\s*([^=]*?)(?=\\n[A-Za-z]|\\n\\*\\*|\\n====|$)`, 'gs'),
                new RegExp(`(${fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\nANALYSIS:)\\s*([^=]*?)(?=\\n[A-Za-z]|\\n\\*\\*|\\n====|$)`, 'gs')
            ];
            
            for (const pattern of patterns) {
                if (pattern.test(content)) {
                    content = content.replace(pattern, `$1\n\n${report}\n`);
                    break;
                }
            }
        }
        
        fs.writeFileSync(this.inventoryFile, content);
    }

    formatComprehensiveReport(analysis) {
        let report = '';
        
        // Basic info
        report += `📄 FILE: ${analysis.fileName}\n`;
        report += `📍 PATH: ${analysis.actualPath || 'NOT FOUND'}\n`;
        report += `📏 SIZE: ${analysis.fileSize} bytes, ${analysis.lines} lines\n`;
        
        // Purpose and functionality
        report += `\n🎯 PURPOSE: ${analysis.purpose}\n`;
        report += `⚙️ HOW IT WORKS: ${analysis.howItWorks}\n`;
        
        // What it does
        if (analysis.whatItDoes.length > 0) {
            report += `\n📋 WHAT IT DOES:\n`;
            analysis.whatItDoes.forEach(item => {
                report += `   • ${item}\n`;
            });
        }
        
        // Functions and components
        if (analysis.functions.length > 0) {
            report += `\n⚡ FUNCTIONS: [${analysis.functions.join(', ')}]\n`;
        }
        if (analysis.components.length > 0) {
            report += `🧩 COMPONENTS: [${analysis.components.join(', ')}]\n`;
        }
        if (analysis.classes.length > 0) {
            report += `🏛️ CLASSES: [${analysis.classes.join(', ')}]\n`;
        }
        
        // Imports and dependencies
        if (analysis.imports.length > 0) {
            report += `\n📥 IMPORTS (${analysis.imports.length} total):\n`;
            analysis.imports.slice(0, 8).forEach(imp => {
                report += `   • ${imp.path} → ${imp.purpose}\n`;
            });
            if (analysis.imports.length > 8) {
                report += `   • ... and ${analysis.imports.length - 8} more\n`;
            }
        }
        
        // Exports
        if (analysis.exports.length > 0) {
            report += `\n📤 EXPORTS: [${analysis.exports.join(', ')}]\n`;
        }
        
        // API and routes
        if (analysis.apiCalls.length > 0) {
            report += `\n🌐 API CALLS: ${analysis.apiCalls.join(', ')}\n`;
        }
        if (analysis.routes.length > 0) {
            report += `🛣️ ROUTES: ${analysis.routes.join(', ')}\n`;
        }
        
        // Data flow
        if (analysis.dataFlow) {
            report += `\n📊 DATA FLOW: ${analysis.dataFlow}\n`;
        }
        
        // Red flags
        const activeRedFlags = [];
        for (const [flag, result] of analysis.redFlags) {
            if (result === 'YES') {
                activeRedFlags.push(flag);
            }
        }
        
        report += `\n🚩 RED FLAGS:\n`;
        if (activeRedFlags.length > 0) {
            activeRedFlags.forEach(flag => {
                report += `   ❌ ${flag}: YES\n`;
            });
        } else {
            report += `   ✅ No red flags detected\n`;
        }
        
        // Green flags
        const activeGreenFlags = [];
        for (const [flag, result] of analysis.greenFlags) {
            if (result === 'YES') {
                activeGreenFlags.push(flag);
            }
        }
        
        report += `\n✅ GREEN FLAGS:\n`;
        if (activeGreenFlags.length > 0) {
            activeGreenFlags.forEach(flag => {
                report += `   ✅ ${flag}: YES\n`;
            });
        } else {
            report += `   ❌ No green flags detected\n`;
        }
        
        return report;
    }
}

// Execute the analyzer
const analyzer = new ComprehensiveFileAnalyzer();
analyzer.analyze().catch(console.error);