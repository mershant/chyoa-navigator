// CHYOA Navigator - Proper SillyTavern Extension
console.log('CHYOA Navigator: Extension script loaded');

// Wait for SillyTavern's extension system to be ready
jQuery(async () => {
    // Wait for eventSource to be available
    while (!window.eventSource) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('CHYOA Navigator: EventSource found, registering listener');
    
    // Listen for the EXTENSIONS_FIRST_LOAD event
    eventSource.on('extensions_first_load', () => {
        console.log('CHYOA Navigator: EXTENSIONS_FIRST_LOAD event received');
        initializeExtension();
    });
    
    // Also try immediate initialization in case we missed the event
    setTimeout(() => {
        if (document.querySelector('#extensions_settings')) {
            console.log('CHYOA Navigator: Extensions panel found, initializing immediately');
            initializeExtension();
        }
    }, 2000);
});

function initializeExtension() {
    console.log('CHYOA Navigator: Initializing extension');
    
    // Check if already initialized
    if (document.querySelector('#chyoa-navigator-panel')) {
        console.log('CHYOA Navigator: Already initialized');
        return;
    }
    
    const extensionsPanel = document.querySelector('#extensions_settings');
    if (!extensionsPanel) {
        console.error('CHYOA Navigator: Extensions panel not found');
        return;
    }
    
    // Create the extension UI
    const extensionHTML = `
        <div id="chyoa-navigator-panel" class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>CHYOA Navigator</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
            </div>
            <div class="inline-drawer-content">
                <div style="padding: 10px;">
                    <h4>📁 Story Files</h4>
                    <div class="flex-container flexGap5">
                        <input type="file" id="chyoa-file-input" webkitdirectory multiple style="display: none;" accept=".md">
                        <button id="chyoa-select-folder" class="menu_button">Select Story Folder</button>
                        <button id="chyoa-select-file" class="menu_button">Select Single File</button>
                    </div>
                    <div id="chyoa-file-list" style="margin-top: 10px; max-height: 200px; overflow-y: auto; border: 1px solid var(--SmartThemeBorderColor); border-radius: 5px;"></div>
                    
                    <h4 style="margin-top: 15px;">📝 Template</h4>
                    <select id="chyoa-template-select" class="text_pole">
                        <option value="interactive-fiction">Interactive Fiction</option>
                        <option value="character-background">Character Background</option>
                        <option value="world-building">World Building</option>
                        <option value="raw-injection">Raw Injection</option>
                    </select>
                    
                    <div style="margin-top: 10px;">
                        <label>Before Prompt:</label>
                        <textarea id="chyoa-before-prompt" class="text_pole" rows="2" placeholder="Text before file content..."></textarea>
                    </div>
                    
                    <div style="margin-top: 10px;">
                        <label>After Prompt:</label>
                        <textarea id="chyoa-after-prompt" class="text_pole" rows="2" placeholder="Text after file content..."></textarea>
                    </div>
                    
                    <h4 style="margin-top: 15px;">👁️ Preview</h4>
                    <div id="chyoa-preview" style="max-height: 150px; overflow-y: auto; border: 1px solid var(--SmartThemeBorderColor); border-radius: 5px; padding: 10px; background: var(--SmartThemeBlurTintColor);">
                        <em>No file selected</em>
                    </div>
                    
                    <div class="flex-container flexGap5" style="margin-top: 15px;">
                        <button id="chyoa-send-to-chat" class="menu_button" disabled>Send to Chat</button>
                        <button id="chyoa-copy-to-clipboard" class="menu_button" disabled>Copy to Clipboard</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    extensionsPanel.insertAdjacentHTML('beforeend', extensionHTML);
    
    // Set up event listeners
    setupEventListeners();
    
    // Load default template
    loadDefaultTemplate();
    
    console.log('CHYOA Navigator: Extension UI created successfully');
}

// Global state
let currentFile = null;
let storyFiles = [];

// Default templates
const templates = {
    'interactive-fiction': {
        before: 'For your next message, narrate this story section:\n\n',
        after: '\n\nPresent the story content above, then ask the user to choose from the available options by saying "Choice A", "Choice B", etc.'
    },
    'character-background': {
        before: 'Use this as background context for your character:\n\n',
        after: '\n\nRespond in character based on this information.'
    },
    'world-building': {
        before: 'This is lore for the current scene:\n\n',
        after: '\n\nIncorporate this naturally into your responses.'
    },
    'raw-injection': {
        before: '',
        after: ''
    }
};

function setupEventListeners() {
    // File selection
    document.getElementById('chyoa-select-folder').addEventListener('click', () => {
        const input = document.getElementById('chyoa-file-input');
        input.setAttribute('webkitdirectory', '');
        input.click();
    });
    
    document.getElementById('chyoa-select-file').addEventListener('click', () => {
        const input = document.getElementById('chyoa-file-input');
        input.removeAttribute('webkitdirectory');
        input.click();
    });
    
    document.getElementById('chyoa-file-input').addEventListener('change', handleFileSelection);
    
    // Template selection
    document.getElementById('chyoa-template-select').addEventListener('change', loadSelectedTemplate);
    
    // Prompt changes
    document.getElementById('chyoa-before-prompt').addEventListener('input', updatePreview);
    document.getElementById('chyoa-after-prompt').addEventListener('input', updatePreview);
    
    // Actions
    document.getElementById('chyoa-send-to-chat').addEventListener('click', sendToChat);
    document.getElementById('chyoa-copy-to-clipboard').addEventListener('click', copyToClipboard);
}

function handleFileSelection(event) {
    const files = Array.from(event.target.files);
    storyFiles = files.filter(file => file.name.endsWith('.md'));
    
    const fileList = document.getElementById('chyoa-file-list');
    fileList.innerHTML = '';
    
    if (storyFiles.length === 0) {
        fileList.innerHTML = '<p style="padding: 10px; text-align: center; color: #888;">No .md files found</p>';
        return;
    }
    
    storyFiles.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.style.cssText = 'padding: 5px 10px; cursor: pointer; border-bottom: 1px solid var(--SmartThemeBorderColor);';
        fileItem.textContent = file.name;
        
        fileItem.addEventListener('click', () => selectFile(file));
        fileItem.addEventListener('mouseenter', () => {
            fileItem.style.backgroundColor = 'var(--SmartThemeBlurTintColor)';
        });
        fileItem.addEventListener('mouseleave', () => {
            fileItem.style.backgroundColor = '';
        });
        
        fileList.appendChild(fileItem);
    });
    
    // Auto-select if only one file
    if (storyFiles.length === 1) {
        selectFile(storyFiles[0]);
    }
}

function selectFile(file) {
    currentFile = file;
    
    // Highlight selected file
    document.querySelectorAll('#chyoa-file-list div').forEach(item => {
        item.style.backgroundColor = item.textContent === file.name ? 'var(--SmartThemeQuoteColor)' : '';
    });
    
    // Read file content
    const reader = new FileReader();
    reader.onload = (e) => {
        currentFile.content = e.target.result;
        updatePreview();
        enableActions();
    };
    reader.readAsText(file);
}

function loadDefaultTemplate() {
    loadSelectedTemplate();
}

function loadSelectedTemplate() {
    const templateName = document.getElementById('chyoa-template-select').value;
    const template = templates[templateName];
    
    if (template) {
        document.getElementById('chyoa-before-prompt').value = template.before;
        document.getElementById('chyoa-after-prompt').value = template.after;
        updatePreview();
    }
}

function updatePreview() {
    const preview = document.getElementById('chyoa-preview');
    
    if (!currentFile || !currentFile.content) {
        preview.innerHTML = '<em>No file selected</em>';
        return;
    }
    
    const beforePrompt = document.getElementById('chyoa-before-prompt').value;
    const afterPrompt = document.getElementById('chyoa-after-prompt').value;
    const content = currentFile.content;
    
    const finalOutput = beforePrompt + content + afterPrompt;
    
    preview.innerHTML = `<pre style="white-space: pre-wrap; font-size: 11px;">${escapeHtml(finalOutput)}</pre>`;
}

function enableActions() {
    document.getElementById('chyoa-send-to-chat').disabled = false;
    document.getElementById('chyoa-copy-to-clipboard').disabled = false;
}

function sendToChat() {
    if (!currentFile || !currentFile.content) return;
    
    const beforePrompt = document.getElementById('chyoa-before-prompt').value;
    const afterPrompt = document.getElementById('chyoa-after-prompt').value;
    const content = currentFile.content;
    
    const finalOutput = beforePrompt + content + afterPrompt;
    
    // Send to SillyTavern chat
    const chatInput = document.getElementById('send_textarea');
    if (chatInput) {
        chatInput.value = finalOutput;
        chatInput.dispatchEvent(new Event('input', { bubbles: true }));
        
        const sendButton = document.getElementById('send_but');
        if (sendButton) {
            sendButton.click();
        }
    }
    
    if (typeof toastr !== 'undefined') {
        toastr.success('Content sent to chat!');
    }
}

function copyToClipboard() {
    if (!currentFile || !currentFile.content) return;
    
    const beforePrompt = document.getElementById('chyoa-before-prompt').value;
    const afterPrompt = document.getElementById('chyoa-after-prompt').value;
    const content = currentFile.content;
    
    const finalOutput = beforePrompt + content + afterPrompt;
    
    navigator.clipboard.writeText(finalOutput).then(() => {
        if (typeof toastr !== 'undefined') {
            toastr.success('Content copied to clipboard!');
        }
    }).catch(() => {
        // Fallback
        const textArea = document.createElement('textarea');
        textArea.value = finalOutput;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (typeof toastr !== 'undefined') {
            toastr.success('Content copied to clipboard!');
        }
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}