// CHYOA Navigator - SillyTavern Extension
// Main extension file

(() => {
    'use strict';

    // Extension configuration
    const extensionName = 'CHYOA Navigator';
    const extensionFolderPath = 'scripts/extensions/third-party/chyoa-navigator';
    
    // Global state
    let currentFile = null;
    let currentTemplate = null;
    let storyFolder = null;
    let fileCache = new Map();

    // Default templates
    const defaultTemplates = {
        'interactive-fiction': {
            name: 'Interactive Fiction',
            description: 'For choice-based narratives',
            beforePrompt: 'For your next message, narrate this story section:\n\n',
            afterPrompt: '\n\nPresent the story content above, then ask the user to choose from the available options by saying "Choice A", "Choice B", etc.'
        },
        'character-background': {
            name: 'Character Background',
            description: 'Use as character context',
            beforePrompt: 'Use this as background context for your character:\n\n',
            afterPrompt: '\n\nRespond in character based on this information.'
        },
        'world-building': {
            name: 'World Building',
            description: 'Scene and lore information',
            beforePrompt: 'This is lore for the current scene:\n\n',
            afterPrompt: '\n\nIncorporate this naturally into your responses.'
        },
        'raw-injection': {
            name: 'Raw Injection',
            description: 'No additional prompting',
            beforePrompt: '',
            afterPrompt: ''
        }
    };

    // Initialize extension
    function init() {
        console.log(`${extensionName} initializing...`);
        
        // Create UI
        createExtensionPanel();
        
        // Load saved settings
        loadSettings();
        
        // Set up event listeners
        setupEventListeners();
        
        console.log(`${extensionName} initialized successfully`);
    }

    // Create the main extension panel
    function createExtensionPanel() {
        const panelHtml = `
            <div id="chyoa-navigator" class="drawer-content flexGap5">
                <div class="panelControlBar flex-container">
                    <div class="fa-solid fa-book-open extensionTitleIcon"></div>
                    <b>CHYOA Navigator</b>
                </div>
                
                <!-- File Browser Section -->
                <div class="chyoa-section">
                    <h4>📁 Story Files</h4>
                    <div class="flex-container">
                        <input type="file" id="chyoa-file-input" webkitdirectory directory multiple style="display: none;">
                        <button id="chyoa-select-folder" class="menu_button">Select Story Folder</button>
                        <span id="chyoa-folder-status" class="text_muted">No folder selected</span>
                    </div>
                    <div id="chyoa-file-list" class="chyoa-file-list"></div>
                </div>

                <!-- Template Configuration Section -->
                <div class="chyoa-section">
                    <h4>📝 Template Configuration</h4>
                    <div class="flex-container">
                        <select id="chyoa-template-preset" class="text_pole">
                            <option value="">Select Template...</option>
                            <option value="interactive-fiction">Interactive Fiction</option>
                            <option value="character-background">Character Background</option>
                            <option value="world-building">World Building</option>
                            <option value="raw-injection">Raw Injection</option>
                            <option value="custom">Custom Template</option>
                        </select>
                        <button id="chyoa-save-template" class="menu_button">Save</button>
                        <button id="chyoa-load-template" class="menu_button">Load</button>
                    </div>
                    
                    <div class="chyoa-template-config">
                        <label for="chyoa-before-prompt">Before Prompt:</label>
                        <textarea id="chyoa-before-prompt" class="text_pole" rows="3" 
                                  placeholder="Text to appear before the story content..."></textarea>
                        
                        <label for="chyoa-after-prompt">After Prompt:</label>
                        <textarea id="chyoa-after-prompt" class="text_pole" rows="3" 
                                  placeholder="Text to appear after the story content..."></textarea>
                    </div>
                </div>

                <!-- Content Preview Section -->
                <div class="chyoa-section">
                    <h4>👁️ Preview</h4>
                    <div id="chyoa-content-preview" class="chyoa-preview">
                        <em>Select a file and template to see preview...</em>
                    </div>
                </div>

                <!-- Actions Section -->
                <div class="chyoa-section">
                    <h4>🚀 Actions</h4>
                    <div class="flex-container">
                        <button id="chyoa-send-to-chat" class="menu_button menu_button_icon" disabled>
                            <i class="fa-solid fa-paper-plane"></i>
                            Send to Chat
                        </button>
                        <button id="chyoa-copy-to-clipboard" class="menu_button" disabled>
                            <i class="fa-solid fa-copy"></i>
                            Copy
                        </button>
                    </div>
                </div>

                <!-- Variables Help -->
                <div class="chyoa-section">
                    <details>
                        <summary>📋 Available Variables</summary>
                        <div class="chyoa-variables-help">
                            <code>{MD_CONTENT}</code> - The markdown file content<br>
                            <code>{FILE_NAME}</code> - Current file name<br>
                            <code>{CHAPTER_NUM}</code> - Extracted chapter number<br>
                            <code>{USER_NAME}</code> - Current user name<br>
                            <code>{CHAR_NAME}</code> - Current character name
                        </div>
                    </details>
                </div>
            </div>
        `;

        // Add to SillyTavern's drawer
        const drawerContent = document.getElementById('extensionsMenu');
        if (drawerContent) {
            drawerContent.insertAdjacentHTML('beforeend', panelHtml);
        }
    }

    // Set up all event listeners
    function setupEventListeners() {
        // Folder selection
        document.getElementById('chyoa-select-folder').addEventListener('click', selectFolder);
        document.getElementById('chyoa-file-input').addEventListener('change', handleFolderSelection);
        
        // Template management
        document.getElementById('chyoa-template-preset').addEventListener('change', handleTemplatePresetChange);
        document.getElementById('chyoa-before-prompt').addEventListener('input', updatePreview);
        document.getElementById('chyoa-after-prompt').addEventListener('input', updatePreview);
        document.getElementById('chyoa-save-template').addEventListener('click', saveCustomTemplate);
        document.getElementById('chyoa-load-template').addEventListener('click', loadCustomTemplate);
        
        // Actions
        document.getElementById('chyoa-send-to-chat').addEventListener('click', sendToChat);
        document.getElementById('chyoa-copy-to-clipboard').addEventListener('click', copyToClipboard);
    }

    // Handle folder selection
    function selectFolder() {
        document.getElementById('chyoa-file-input').click();
    }

    function handleFolderSelection(event) {
        const files = Array.from(event.target.files);
        const mdFiles = files.filter(file => file.name.endsWith('.md'));
        
        if (mdFiles.length === 0) {
            showNotification('No markdown files found in selected folder', 'error');
            return;
        }

        storyFolder = files[0].webkitRelativePath.split('/')[0];
        document.getElementById('chyoa-folder-status').textContent = `${mdFiles.length} files in "${storyFolder}"`;
        
        displayFileList(mdFiles);
        showNotification(`Loaded ${mdFiles.length} markdown files`, 'success');
    }

    // Display list of markdown files
    function displayFileList(files) {
        const fileList = document.getElementById('chyoa-file-list');
        fileList.innerHTML = '';

        files.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'chyoa-file-item';
            fileItem.innerHTML = `
                <div class="chyoa-file-name">${file.name}</div>
                <div class="chyoa-file-size">${formatFileSize(file.size)}</div>
            `;
            
            fileItem.addEventListener('click', () => selectFile(file));
            fileList.appendChild(fileItem);
        });
    }

    // Handle file selection
    async function selectFile(file) {
        try {
            // Remove previous selection styling
            document.querySelectorAll('.chyoa-file-item').forEach(item => {
                item.classList.remove('selected');
            });
            
            // Add selection styling
            event.currentTarget.classList.add('selected');
            
            // Read file content
            const content = await readFileContent(file);
            currentFile = {
                name: file.name,
                content: content,
                size: file.size
            };
            
            updatePreview();
            enableActions();
            
            showNotification(`Loaded: ${file.name}`, 'success');
        } catch (error) {
            showNotification(`Error reading file: ${error.message}`, 'error');
        }
    }

    // Read file content
    function readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = e => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    // Handle template preset changes
    function handleTemplatePresetChange(event) {
        const presetName = event.target.value;
        
        if (presetName && defaultTemplates[presetName]) {
            const template = defaultTemplates[presetName];
            document.getElementById('chyoa-before-prompt').value = template.beforePrompt;
            document.getElementById('chyoa-after-prompt').value = template.afterPrompt;
            currentTemplate = template;
            updatePreview();
        } else if (presetName === 'custom') {
            // Clear fields for custom template
            document.getElementById('chyoa-before-prompt').value = '';
            document.getElementById('chyoa-after-prompt').value = '';
            currentTemplate = null;
            updatePreview();
        }
    }

    // Update content preview
    function updatePreview() {
        if (!currentFile) {
            document.getElementById('chyoa-content-preview').innerHTML = '<em>Select a file to see preview...</em>';
            return;
        }

        const beforePrompt = document.getElementById('chyoa-before-prompt').value;
        const afterPrompt = document.getElementById('chyoa-after-prompt').value;
        
        const processedContent = processTemplate(beforePrompt, currentFile.content, afterPrompt);
        
        const preview = document.getElementById('chyoa-content-preview');
        preview.innerHTML = `<pre>${escapeHtml(processedContent)}</pre>`;
    }

    // Process template with variable substitution
    function processTemplate(beforePrompt, content, afterPrompt) {
        const variables = {
            'MD_CONTENT': content,
            'FILE_NAME': currentFile ? currentFile.name : '',
            'CHAPTER_NUM': extractChapterNumber(currentFile ? currentFile.name : ''),
            'USER_NAME': getUserName(),
            'CHAR_NAME': getCharacterName()
        };

        let result = beforePrompt + content + afterPrompt;
        
        // Replace variables
        Object.entries(variables).forEach(([key, value]) => {
            const regex = new RegExp(`\\{${key}\\}`, 'g');
            result = result.replace(regex, value);
        });

        return result;
    }

    // Extract chapter number from filename
    function extractChapterNumber(filename) {
        const match = filename.match(/(\d+)/);
        return match ? match[1] : '';
    }

    // Get current user name from SillyTavern
    function getUserName() {
        return window.name1 || 'User';
    }

    // Get current character name from SillyTavern
    function getCharacterName() {
        return window.name2 || 'Character';
    }

    // Send processed content to chat
    function sendToChat() {
        if (!currentFile) {
            showNotification('No file selected', 'error');
            return;
        }

        const beforePrompt = document.getElementById('chyoa-before-prompt').value;
        const afterPrompt = document.getElementById('chyoa-after-prompt').value;
        const processedContent = processTemplate(beforePrompt, currentFile.content, afterPrompt);

        // Send to SillyTavern chat
        if (window.sendSystemMessage) {
            window.sendSystemMessage(processedContent);
            showNotification('Sent to chat successfully', 'success');
        } else {
            // Fallback method
            const chatInput = document.getElementById('send_textarea');
            if (chatInput) {
                chatInput.value = processedContent;
                showNotification('Content added to chat input', 'success');
            } else {
                showNotification('Could not send to chat', 'error');
            }
        }
    }

    // Copy processed content to clipboard
    async function copyToClipboard() {
        if (!currentFile) {
            showNotification('No file selected', 'error');
            return;
        }

        const beforePrompt = document.getElementById('chyoa-before-prompt').value;
        const afterPrompt = document.getElementById('chyoa-after-prompt').value;
        const processedContent = processTemplate(beforePrompt, currentFile.content, afterPrompt);

        try {
            await navigator.clipboard.writeText(processedContent);
            showNotification('Copied to clipboard', 'success');
        } catch (error) {
            showNotification('Failed to copy to clipboard', 'error');
        }
    }

    // Save custom template
    function saveCustomTemplate() {
        const name = prompt('Enter template name:');
        if (!name) return;

        const template = {
            name: name,
            beforePrompt: document.getElementById('chyoa-before-prompt').value,
            afterPrompt: document.getElementById('chyoa-after-prompt').value,
            custom: true
        };

        const savedTemplates = getSavedTemplates();
        savedTemplates[name] = template;
        localStorage.setItem('chyoa-navigator-templates', JSON.stringify(savedTemplates));
        
        showNotification(`Template "${name}" saved`, 'success');
    }

    // Load custom template
    function loadCustomTemplate() {
        const savedTemplates = getSavedTemplates();
        const templateNames = Object.keys(savedTemplates);
        
        if (templateNames.length === 0) {
            showNotification('No saved templates found', 'info');
            return;
        }

        const name = prompt(`Select template:\n${templateNames.join('\n')}`);
        if (!name || !savedTemplates[name]) return;

        const template = savedTemplates[name];
        document.getElementById('chyoa-before-prompt').value = template.beforePrompt;
        document.getElementById('chyoa-after-prompt').value = template.afterPrompt;
        document.getElementById('chyoa-template-preset').value = 'custom';
        
        updatePreview();
        showNotification(`Template "${name}" loaded`, 'success');
    }

    // Get saved templates from localStorage
    function getSavedTemplates() {
        const saved = localStorage.getItem('chyoa-navigator-templates');
        return saved ? JSON.parse(saved) : {};
    }

    // Enable action buttons
    function enableActions() {
        document.getElementById('chyoa-send-to-chat').disabled = false;
        document.getElementById('chyoa-copy-to-clipboard').disabled = false;
    }

    // Load saved settings
    function loadSettings() {
        const settings = localStorage.getItem('chyoa-navigator-settings');
        if (settings) {
            try {
                const parsed = JSON.parse(settings);
                if (parsed.lastTemplate) {
                    document.getElementById('chyoa-template-preset').value = parsed.lastTemplate;
                    handleTemplatePresetChange({ target: { value: parsed.lastTemplate } });
                }
            } catch (error) {
                console.error('Error loading settings:', error);
            }
        }
    }

    // Save settings
    function saveSettings() {
        const settings = {
            lastTemplate: document.getElementById('chyoa-template-preset').value,
            lastFolder: storyFolder
        };
        localStorage.setItem('chyoa-navigator-settings', JSON.stringify(settings));
    }

    // Utility functions
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showNotification(message, type = 'info') {
        // Use SillyTavern's notification system if available
        if (window.toastr) {
            window.toastr[type](message);
        } else {
            // Fallback to console
            console.log(`[CHYOA Navigator] ${type.toUpperCase()}: ${message}`);
        }
    }

    // Auto-save settings on page unload
    window.addEventListener('beforeunload', saveSettings);

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();