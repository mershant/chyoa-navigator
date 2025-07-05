import { SlashCommand } from '../../../slash-commands/SlashCommand.js';
import { SlashCommandArgument } from '../../../slash-commands/SlashCommandArgument.js';
import { SlashCommandParser } from '../../../slash-commands/SlashCommandParser.js';
import { ARGUMENT_TYPE } from '../../../slash-commands/SlashCommandArgument.js';

/**
 * CHYOA Navigator Extension
 * Provides slash commands for loading and processing CHYOA story files
 */

// Global state
let currentFile = null;
let currentTemplate = 'interactive-fiction';
let storyFiles = [];

// Default templates
const defaultTemplates = {
    'interactive-fiction': {
        name: 'Interactive Fiction',
        beforePrompt: 'For your next message, narrate this story section:\\n\\n',
        afterPrompt: '\\n\\nPresent the story content above, then ask the user to choose from the available options by saying "Choice A", "Choice B", etc.'
    },
    'character-background': {
        name: 'Character Background', 
        beforePrompt: 'Use this as background context for your character:\\n\\n',
        afterPrompt: '\\n\\nRespond in character based on this information.'
    },
    'world-building': {
        name: 'World Building',
        beforePrompt: 'This is lore for the current scene:\\n\\n',
        afterPrompt: '\\n\\nIncorporate this naturally into your responses.'
    },
    'raw-injection': {
        name: 'Raw Injection',
        beforePrompt: '',
        afterPrompt: ''
    }
};

/**
 * Process file content and replace variables
 */
function processContent(content, fileName) {
    let processed = content;
    
    // Replace variables
    processed = processed.replace(/\\{MD_CONTENT\\}/g, content);
    processed = processed.replace(/\\{FILE_NAME\\}/g, fileName);
    
    // Extract chapter number if present
    const chapterMatch = fileName.match(/(\\d+)/);
    const chapterNum = chapterMatch ? chapterMatch[1] : '';
    processed = processed.replace(/\\{CHAPTER_NUM\\}/g, chapterNum);
    
    // Get user and character names from SillyTavern if available
    const userName = window.name1 || 'User';
    const charName = window.name2 || 'Character';
    processed = processed.replace(/\\{USER_NAME\\}/g, userName);
    processed = processed.replace(/\\{CHAR_NAME\\}/g, charName);
    
    return processed;
}

/**
 * Send content to chat
 */
function sendToChat(content) {
    const chatInput = document.getElementById('send_textarea');
    if (chatInput) {
        chatInput.value = content;
        const sendButton = document.getElementById('send_but');
        if (sendButton) {
            sendButton.click();
        }
    }
}

/**
 * Load a story file and process it with a template
 */
async function loadStoryFile(filePath, templateName = 'interactive-fiction') {
    try {
        // For now, we'll use a file input since we can't directly read files
        // This is a limitation we'll need to work around
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.md';
        
        return new Promise((resolve, reject) => {
            input.onchange = (event) => {
                const file = event.target.files[0];
                if (!file) {
                    reject('No file selected');
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    const content = e.target.result;
                    const template = defaultTemplates[templateName] || defaultTemplates['interactive-fiction'];
                    
                    const processedContent = processContent(content, file.name);
                    const finalOutput = template.beforePrompt + processedContent + template.afterPrompt;
                    
                    resolve(finalOutput);
                };
                reader.onerror = () => reject('Error reading file');
                reader.readAsText(file);
            };
            
            input.click();
        });
    } catch (error) {
        throw new Error(`Failed to load story file: ${error.message}`);
    }
}

// Register slash commands
SlashCommandParser.addCommandObject(SlashCommand.fromProps({
    name: 'chyoa-load',
    callback: async (args, value) => {
        try {
            const templateName = args.template || 'interactive-fiction';
            const content = await loadStoryFile(value, templateName);
            
            if (args.send === 'true') {
                sendToChat(content);
                return 'Story content sent to chat!';
            } else {
                return content;
            }
        } catch (error) {
            return `Error: ${error.message}`;
        }
    },
    returns: 'processed story content',
    helpString: 'Load and process a CHYOA story file with configurable templates',
    namedArgumentList: [
        {
            name: 'template',
            description: 'Template to use: interactive-fiction, character-background, world-building, raw-injection',
            typeList: [ARGUMENT_TYPE.STRING],
            defaultValue: 'interactive-fiction'
        },
        {
            name: 'send',
            description: 'Whether to send directly to chat (true/false)',
            typeList: [ARGUMENT_TYPE.BOOLEAN],
            defaultValue: 'false'
        }
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'file path (opens file picker if not provided)',
            typeList: [ARGUMENT_TYPE.STRING],
            isRequired: false
        })
    ]
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({
    name: 'chyoa-templates',
    callback: (args, value) => {
        const templateList = Object.keys(defaultTemplates).map(key => {
            const template = defaultTemplates[key];
            return `**${key}**: ${template.name}`;
        }).join('\\n');
        
        return `Available CHYOA templates:\\n${templateList}\\n\\nUsage: /chyoa-load template=interactive-fiction send=true`;
    },
    returns: 'list of available templates',
    helpString: 'Show available CHYOA story templates'
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({
    name: 'chyoa-help',
    callback: (args, value) => {
        return `**CHYOA Navigator Commands:**

**/chyoa-load** [template=name] [send=true/false]
- Load a story file with the specified template
- Opens file picker to select .md file
- Templates: interactive-fiction, character-background, world-building, raw-injection

**/chyoa-templates**
- Show all available templates

**Examples:**
\`/chyoa-load template=interactive-fiction send=true\` - Load file and send to chat
\`/chyoa-load template=character-background\` - Load file and return content
\`/chyoa-templates\` - Show available templates`;
    },
    returns: 'help information',
    helpString: 'Show CHYOA Navigator help and usage examples'
}));

console.log('CHYOA Navigator: Slash commands registered!');
console.log('Available commands: /chyoa-load, /chyoa-templates, /chyoa-help');