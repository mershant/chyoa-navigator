# CHYOA Navigator - Technical Specification

## Extension Architecture

### Core Components

#### 1. Extension Entry Point
```javascript
// index.js - Main extension file
class CHYOANavigator {
    constructor() {
        this.currentFile = null;
        this.currentTemplate = null;
        this.storyState = {};
    }
    
    init() {
        // Register with SillyTavern
        // Create UI panel
        // Set up event listeners
    }
}
```

#### 2. File Management System
```javascript
// utils/file-reader.js
class FileReader {
    async selectFolder() {
        // Use SillyTavern's file API to browse folders
    }
    
    async readMarkdownFile(filePath) {
        // Read and parse .md files
        // Return structured content
    }
    
    parseStoryStructure(content) {
        // Extract choices, chapter numbers, etc.
    }
}
```

#### 3. Template Engine
```javascript
// utils/template-engine.js
class TemplateEngine {
    constructor() {
        this.variables = {
            'MD_CONTENT': '',
            'FILE_NAME': '',
            'CHAPTER_NUM': '',
            'USER_NAME': '',
            'CHAR_NAME': ''
        };
    }
    
    processTemplate(beforePrompt, content, afterPrompt) {
        // Replace variables and combine prompts
    }
}
```

#### 4. UI Components
```html
<!-- ui/panel.html -->
<div id="chyoa-navigator">
    <div class="file-browser">
        <button id="select-folder">Select Story Folder</button>
        <div id="file-list"></div>
    </div>
    
    <div class="template-config">
        <select id="template-preset">
            <option value="interactive-fiction">Interactive Fiction</option>
            <option value="character-background">Character Background</option>
            <option value="custom">Custom</option>
        </select>
        
        <textarea id="before-prompt" placeholder="Before prompt..."></textarea>
        <div id="content-preview"></div>
        <textarea id="after-prompt" placeholder="After prompt..."></textarea>
    </div>
    
    <div class="actions">
        <button id="send-to-chat">Send to Chat</button>
        <button id="save-template">Save Template</button>
    </div>
</div>
```

## Data Structures

### Template Object
```javascript
{
    "name": "Interactive Fiction",
    "description": "For choice-based narratives",
    "beforePrompt": "For your next message, narrate this story section:",
    "afterPrompt": "Present clear choices A, B, C for the user to select.",
    "variables": {
        "MD_CONTENT": true,
        "FILE_NAME": false,
        "CHAPTER_NUM": true
    }
}
```

### Story State Object
```javascript
{
    "currentChapter": "chapter_001.md",
    "breadcrumbs": ["chapter_001.md", "chapter_015.md"],
    "choicesTaken": ["A", "B"],
    "storyFolder": "/path/to/story",
    "lastTemplate": "interactive-fiction"
}
```

### File Structure Object
```javascript
{
    "fileName": "chapter_001.md",
    "title": "Your patience is rewarded",
    "content": "Story content here...",
    "choices": [
        {
            "text": "Professional loyalty",
            "target": "chapter_015.md"
        },
        {
            "text": "Greed and betrayal", 
            "target": "chapter_032.md"
        }
    ],
    "chapterNumber": 1
}
```

## API Integration

### SillyTavern Extension API
```javascript
// Register extension
jQuery(() => {
    if (window.SillyTavern) {
        const extension = new CHYOANavigator();
        extension.init();
    }
});

// Send to chat
function sendToChat(message) {
    if (window.SillyTavern && window.SillyTavern.getContext) {
        const context = window.SillyTavern.getContext();
        context.sendSystemMessage(message);
    }
}
```

### File System Access
```javascript
// Use SillyTavern's file utilities
async function readFile(path) {
    try {
        const response = await fetch('/api/files/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: path })
        });
        return await response.text();
    } catch (error) {
        console.error('File read error:', error);
    }
}
```

## Configuration System

### Default Templates
```javascript
const DEFAULT_TEMPLATES = {
    "interactive-fiction": {
        "name": "Interactive Fiction",
        "beforePrompt": "For your next message, narrate this story section:\n\n",
        "afterPrompt": "\n\nPresent the story content above, then ask the user to choose from the available options by saying \"Choice A\", \"Choice B\", etc."
    },
    "character-background": {
        "name": "Character Background",
        "beforePrompt": "Use this as background context for your character:\n\n",
        "afterPrompt": "\n\nRespond in character based on this information."
    },
    "world-building": {
        "name": "World Building",
        "beforePrompt": "This is lore for the current scene:\n\n",
        "afterPrompt": "\n\nIncorporate this naturally into your responses."
    }
};
```

### Settings Storage
```javascript
// Store in localStorage
function saveSettings(settings) {
    localStorage.setItem('chyoa-navigator-settings', JSON.stringify(settings));
}

function loadSettings() {
    const stored = localStorage.getItem('chyoa-navigator-settings');
    return stored ? JSON.parse(stored) : getDefaultSettings();
}
```

## Error Handling

### File Operations
```javascript
async function safeFileRead(path) {
    try {
        const content = await readFile(path);
        if (!content) {
            throw new Error('File is empty or unreadable');
        }
        return content;
    } catch (error) {
        showError(`Failed to read file: ${error.message}`);
        return null;
    }
}
```

### UI Error Display
```javascript
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.getElementById('chyoa-navigator').appendChild(errorDiv);
    
    setTimeout(() => errorDiv.remove(), 5000);
}
```

## Performance Considerations

### Large File Handling
```javascript
// Lazy loading for large stories
class LazyFileLoader {
    constructor(maxCacheSize = 50) {
        this.cache = new Map();
        this.maxCacheSize = maxCacheSize;
    }
    
    async getFile(path) {
        if (this.cache.has(path)) {
            return this.cache.get(path);
        }
        
        const content = await readFile(path);
        this.addToCache(path, content);
        return content;
    }
    
    addToCache(path, content) {
        if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(path, content);
    }
}
```

### Memory Management
```javascript
// Clean up resources when switching stories
function cleanup() {
    // Clear file cache
    // Reset story state
    // Remove event listeners
}
```

## Security Considerations

### File Path Validation
```javascript
function validateFilePath(path) {
    // Prevent directory traversal
    const normalizedPath = path.replace(/\.\./g, '');
    
    // Only allow .md files
    if (!normalizedPath.endsWith('.md')) {
        throw new Error('Only markdown files are allowed');
    }
    
    return normalizedPath;
}
```

### Content Sanitization
```javascript
function sanitizeContent(content) {
    // Remove potentially harmful content
    // Escape HTML if needed
    return content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}
```

## Testing Strategy

### Unit Tests
- File reading functionality
- Template processing
- Variable substitution
- Error handling

### Integration Tests
- SillyTavern API integration
- File system access
- UI component interaction

### User Acceptance Tests
- Complete story navigation
- Template creation and usage
- Performance with large stories
- Cross-platform compatibility