// Import from SillyTavern core
import { extension_settings, getContext, saveMetadataDebounced } from "../../../extensions.js";
import { saveSettingsDebounced, event_types, eventSource, extension_prompt_types, chat_metadata } from "../../../../script.js";

// Extension name MUST match folder name
const extensionName = "chyoa-navigator";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

console.log(`[${extensionName}] Script loaded!`);

// Selection history for undo functionality (max 10 items)
let selectionHistory = [];

// Default settings (global - apply to all chats)
const defaultSettings = {
    ooc_pre: "[SEQUENCE SIMULATION: The following text describes a MANDATORY sequence of events that MUST occur in the story. These events are NON-NEGOTIABLE and should happen in the order presented, but they may be adapted to incorporate {{user}}'s modifications (e.g., different characters, added details, new dialogue).\n\nPOINT OF INTEREST:\n<simulate>",
    ooc_post: "</simulate>\n\nYOUR JOB: Simulate the sequence above in third-person perspective, ensuring ALL listed events occur. {{user}}'s input may modify WHO is involved or add contextual details, but the CORE EVENTS must still happen. Pay special attention to small details like objects being examined, internal thoughts being expressed through actions, and the pacing described.",
    modification_text: "",
    separate_protagonist: false,
    isekai_mode: false,
    protagonist_name: "",
    injection_depth: 4
};

// Per-chat metadata helpers
function getChatMetadata(key, defaultValue = null) {
    if (!chat_metadata[extensionName]) {
        chat_metadata[extensionName] = {};
    }
    return chat_metadata[extensionName][key] ?? defaultValue;
}

function setChatMetadata(key, value) {
    if (!chat_metadata[extensionName]) {
        chat_metadata[extensionName] = {};
    }
    chat_metadata[extensionName][key] = value;
    saveMetadataDebounced();
}

// Check if extension is enabled for current chat
function isEnabled() {
    return getChatMetadata('enabled', false); // Default to OFF
}

// Toggle extension on/off for current chat
function toggleEnabled() {
    const newState = !isEnabled();
    setChatMetadata('enabled', newState);

    if (newState) {
        toastr.info(`Chyoa Navigator enabled for this chat`);
    } else {
        toastr.warning(`Chyoa Navigator disabled for this chat`);
    }

    refreshUI();
    refreshInjection();
}

async function loadSettings() {
    // Ensure global settings exist (only for global settings)
    extension_settings[extensionName] = extension_settings[extensionName] || {};

    // Apply defaults for global settings if missing
    if (Object.keys(extension_settings[extensionName]).length === 0) {
        Object.assign(extension_settings[extensionName], defaultSettings);
    }

    // Load global settings into UI
    $("#ooc_pre").val(extension_settings[extensionName].ooc_pre || defaultSettings.ooc_pre);
    $("#ooc_post").val(extension_settings[extensionName].ooc_post || defaultSettings.ooc_post);
    $("#modification_text").val(extension_settings[extensionName].modification_text || "");
    $("#injection_depth").val(extension_settings[extensionName].injection_depth || 4);

    // Load per-chat data (toggle settings and text data)
    const chatSourceText = getChatMetadata('source_text', '');
    const chatSelectedText = getChatMetadata('selected_text', '');
    const chatSeparateProtagonist = getChatMetadata('separate_protagonist', false);
    const chatIsekaiMode = getChatMetadata('isekai_mode', false);
    const chatProtagonistName = getChatMetadata('protagonist_name', '');

    $("#source_text").val(chatSourceText);
    updateSelectionPreview(chatSelectedText);
    $("#separate_protagonist").prop("checked", chatSeparateProtagonist);
    $("#isekai_mode").prop("checked", chatIsekaiMode);
    $("#protagonist_name").val(chatProtagonistName);

    // Update UI state
    refreshUI();
}

function refreshUI() {
    const enabled = isEnabled();

    // Update toggle button
    $("#enable_toggle").prop("checked", enabled);

    // Enable/disable all inputs based on toggle state
    $("#source_text").prop("disabled", !enabled);
    $("#ooc_pre").prop("disabled", !enabled);
    $("#ooc_post").prop("disabled", !enabled);
    $("#modification_text").prop("disabled", !enabled);
    $("#separate_protagonist").prop("disabled", !enabled);
    $("#isekai_mode").prop("disabled", !enabled);
    $("#injection_depth").prop("disabled", !enabled);
    $("#test_injection_btn").prop("disabled", !enabled);

    // Protagonist name is only enabled when extension is enabled AND separate_protagonist is checked
    const separateProtagonist = $("#separate_protagonist").prop("checked");
    $("#protagonist_name").prop("disabled", !enabled || !separateProtagonist);

    // Visual feedback
    if (enabled) {
        $(".chyoa-navigator-settings").removeClass("disabled-extension");
    } else {
        $(".chyoa-navigator-settings").addClass("disabled-extension");
    }
}

function updateSelectionPreview(text) {
    const previewEl = $("#selection_preview");
    const infoEl = $("#selection_info");

    if (text) {
        previewEl.text(text);
        previewEl.css("color", "#fff");

        // Update position info
        const start = getChatMetadata('selection_start', 0);
        const end = getChatMetadata('selection_end', 0);
        const sourceText = $("#source_text").val() || '';

        // Calculate line numbers
        const beforeText = sourceText.substring(0, start);
        const startLine = beforeText.split('\n').length;
        const selectedLines = text.split('\n').length;
        const endLine = startLine + selectedLines - 1;

        // Calculate word count
        const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;

        // Display info
        const charInfo = `Chars ${start}-${end} (${text.length} selected)`;
        const lineInfo = startLine === endLine ? `Line ${startLine}` : `Lines ${startLine}-${endLine}`;
        const wordInfo = `${wordCount} words`;

        infoEl.html(`${charInfo} • ${lineInfo} • ${wordInfo}`);
        infoEl.css("color", "#bbb");
    } else {
        previewEl.text("(No text selected)");
        previewEl.css("color", "#aaa");
        infoEl.text("No selection");
        infoEl.css("color", "#888");
    }
}

function onInput(event) {
    const id = event.target.id;
    const type = event.target.type;
    const value = type === "checkbox" ? event.target.checked : event.target.value;

    // Determine if this is a global or per-chat setting
    if (id === 'source_text' || id === 'separate_protagonist' || id === 'isekai_mode' || id === 'protagonist_name') {
        // Per-chat settings
        setChatMetadata(id, value);

        // Mutual exclusivity logic for per-chat settings
        if (id === 'separate_protagonist' && value === true) {
            setChatMetadata('isekai_mode', false);
            $("#isekai_mode").prop("checked", false);
        } else if (id === 'isekai_mode' && value === true) {
            setChatMetadata('separate_protagonist', false);
            $("#separate_protagonist").prop("checked", false);
        }
    } else if (id === 'ooc_pre' || id === 'ooc_post' || id === 'modification_text' || id === 'injection_depth') {
        // Global settings
        extension_settings[extensionName][id] = value;
        saveSettingsDebounced();
    }

    // Update UI when toggles change
    if (id === 'separate_protagonist' || id === 'isekai_mode') {
        refreshUI();
    }

    // Refresh injection whenever settings change
    refreshInjection();
}

function onTextSelect(event) {
    const textarea = event.target;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Only update if there is a selection
    if (start !== end) {
        const selectedText = textarea.value.substring(start, end);

        // Save current selection to history before updating (for undo)
        const currentSelection = getChatMetadata('selected_text', '');
        if (currentSelection && currentSelection !== selectedText) {
            const currentStart = getChatMetadata('selection_start', 0);
            const currentEnd = getChatMetadata('selection_end', 0);

            selectionHistory.push({
                text: currentSelection,
                start: currentStart,
                end: currentEnd,
                timestamp: Date.now()
            });

            // Keep only last 10 selections
            if (selectionHistory.length > 10) {
                selectionHistory.shift();
            }
        }

        // Save new selection
        setChatMetadata('selected_text', selectedText);
        setChatMetadata('selection_start', start);
        setChatMetadata('selection_end', end);
        updateSelectionPreview(selectedText);
        console.log(`[${extensionName}] Text selected:`, selectedText.substring(0, 20) + "...");

    }
}

// Undo selection - restore previous selection from history
function undoSelection() {
    if (selectionHistory.length === 0) {
        toastr.warning('No previous selection to undo');
        return;
    }

    const previous = selectionHistory.pop();

    // Restore the previous selection
    setChatMetadata('selected_text', previous.text);
    setChatMetadata('selection_start', previous.start);
    setChatMetadata('selection_end', previous.end);
    updateSelectionPreview(previous.text);

    // Re-highlight in textarea
    const textarea = document.getElementById('source_text');
    if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(previous.start, previous.end);

        // Scroll to show the selection
        const lines = textarea.value.substring(0, previous.start).split('\n').length;
        const lineHeight = 20; // approximate
        textarea.scrollTop = Math.max(0, (lines - 5) * lineHeight);
    }

    toastr.success('Selection restored');
    console.log(`[${extensionName}] Undo: restored selection (${previous.text.substring(0, 20)}...)`);

    // Refresh injection
    refreshInjection();
}

// Find and select text from manual paste input - Mobile compatible version
function findAndSelectPasted(e) {
    console.log(`[${extensionName}] Manual paste button clicked`, e ? e.type : 'no event');
    
    // Prevent default to stop ghost clicks or form submission
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }

    const pastedText = $("#manual_paste_input").val();
    const textarea = document.getElementById('source_text');
    
    console.log(`[${extensionName}] Pasted text length:`, pastedText ? pastedText.length : 0);
    
    if (!pastedText) {
        toastr.warning("Please paste some text first");
        return;
    }
    
    if (!textarea || !textarea.value) {
        toastr.error("Source text is empty");
        return;
    }
    
    const sourceText = textarea.value;
    console.log(`[${extensionName}] Source text length:`, sourceText.length);
    
    // Mobile-compatible text search with better whitespace handling
    let index = -1;
    let matchedLength = 0;
    
    // First, try exact match
    index = sourceText.indexOf(pastedText);
    if (index !== -1) {
        matchedLength = pastedText.length;
        console.log(`[${extensionName}] Exact match found at index:`, index);
    } else {
        console.log(`[${extensionName}] No exact match, trying flexible matching`);
        // Mobile-friendly text matching with flexible whitespace handling
        // This handles cases where mobile copy/paste changes whitespace characters
        const normalizedPaste = pastedText.replace(/\s+/g, '\\s+').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        try {
            // Create regex that matches the text with flexible whitespace
            const regex = new RegExp(normalizedPaste, 'i'); // case insensitive for better matching
            const match = sourceText.match(regex);
            
            if (match) {
                index = match.index;
                matchedLength = match[0].length;
                console.log(`[${extensionName}] Regex match found at index:`, index, "length:", matchedLength);
            } else {
                // Fallback: try word-by-word matching for mobile copy issues
                const words = pastedText.trim().split(/\s+/);
                if (words.length > 0) {
                    // Find the first occurrence of the first few words
                    const searchText = words.slice(0, Math.min(3, words.length)).join('\\s+');
                    const wordRegex = new RegExp(searchText, 'i');
                    const wordMatch = sourceText.match(wordRegex);
                    
                    if (wordMatch) {
                        index = wordMatch.index;
                        // Try to find the full text around this position
                        const searchRadius = Math.min(500, sourceText.length - index);
                        const searchArea = sourceText.substring(index, index + searchRadius);
                        
                        // Find the best match in the search area
                        const areaMatch = searchArea.match(new RegExp(normalizedPaste, 'i'));
                        if (areaMatch) {
                            matchedLength = areaMatch[0].length;
                        } else {
                            // Use the word match length as fallback
                            matchedLength = wordMatch[0].length;
                        }
                        console.log(`[${extensionName}] Word-based match found at index:`, index, "length:", matchedLength);
                    }
                }
            }
        } catch (error) {
            console.error("Text search error:", error);
        }
    }

    if (index !== -1 && matchedLength > 0) {
        const start = index;
        const end = index + matchedLength;
        
        // Update metadata immediately so the extension knows, even if visual selection fails
        const selectedText = sourceText.substring(start, end);
        console.log(`[${extensionName}] Saving selection: start=${start}, end=${end}, text="${selectedText.substring(0, 50)}..."`);
        
        setChatMetadata('selected_text', selectedText);
        setChatMetadata('selection_start', start);
        setChatMetadata('selection_end', end);
        updateSelectionPreview(selectedText);
        
        // Force refresh injection to ensure rewrite works
        refreshInjection();

        // Mobile-compatible text selection with proper focus handling
        const performSelection = () => {
            try {
                console.log(`[${extensionName}] Attempting visual selection...`);
                // Ensure textarea is visible and focused
                textarea.focus();
                
                // Mobile browsers need a small delay for focus to take effect
                setTimeout(() => {
                    try {
                        textarea.setSelectionRange(start, end);
                        console.log(`[${extensionName}] Selection range set successfully`);
                        
                        // Additional mobile scroll handling
                        setTimeout(() => {
                            jumpToSelection();
                            
                            // Mobile-specific: ensure selection is visible after keyboard appears
                            if ('ontouchstart' in window) {
                                setTimeout(() => {
                                    const rect = textarea.getBoundingClientRect();
                                    if (rect.top < 0 || rect.bottom > window.innerHeight) {
                                        textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    }
                                }, 300);
                            }
                        }, 50);
                    } catch (selectionError) {
                        console.warn("Selection failed, but metadata was saved:", selectionError);
                        toastr.info("Text found and saved. Selection may not be visible on mobile.");
                    }
                }, 100);
                
                toastr.success("Text selected! Ready for rewrite.");
                $("#manual_paste_input").val(""); // Clear input
                
            } catch (focusError) {
                console.warn("Focus failed, but selection was saved:", focusError);
                toastr.info("Text found and saved. Manual focus may be needed on mobile.");
            }
        };
        
        // Execute selection
        performSelection();
    } else {
        console.log(`[${extensionName}] Text not found in source`);
        toastr.error("Text not found. Try copying a smaller chunk or check for formatting differences.");
    }
}

// Jump to selection - scroll to current selection in textarea (Mobile compatible)
function jumpToSelection() {
    const start = getChatMetadata('selection_start', 0);
    const end = getChatMetadata('selection_end', 0);
    const selectedText = getChatMetadata('selected_text', '');

    if (!selectedText) {
        toastr.warning('No selection to jump to');
        return;
    }

    const textarea = document.getElementById('source_text');
    if (textarea) {
        // Mobile-friendly focus and selection
        textarea.focus();
        
        // Set selection with error handling for mobile
        try {
            textarea.setSelectionRange(start, end);
        } catch (error) {
            console.warn("Selection range setting failed:", error);
            // Continue anyway - the metadata is still saved
        }

        // Mobile-compatible scrolling
        const scrollToSelection = () => {
            try {
                // Method 1: Use scrollIntoView for mobile browsers
                if ('ontouchstart' in window) {
                    // For mobile, use scrollIntoView with better options
                    const element = textarea;
                    const scrollContainer = element.parentElement || document.documentElement;
                    
                    // Calculate approximate position
                    const linesBefore = textarea.value.substring(0, start).split('\n').length;
                    const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight) || 20;
                    const targetScrollTop = Math.max(0, (linesBefore - 3) * lineHeight);
                    
                    // Smooth scroll for modern browsers
                    if ('scrollBehavior' in document.documentElement.style) {
                        textarea.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
                    } else {
                        textarea.scrollTop = targetScrollTop;
                    }
                } else {
                    // Method 2: Original pixel-based calculation for desktop
                    const tempDiv = document.createElement('div');
                    tempDiv.style.cssText = `
                        position: absolute;
                        left: -9999px;
                        top: -9999px;
                        width: ${textarea.clientWidth}px;
                        font: ${window.getComputedStyle(textarea).font};
                        line-height: ${window.getComputedStyle(textarea).lineHeight};
                        white-space: pre-wrap;
                        word-wrap: break-word;
                        overflow-wrap: break-word;
                    `;
                    
                    const beforeSelection = textarea.value.substring(0, end);
                    tempDiv.textContent = beforeSelection;
                    document.body.appendChild(tempDiv);
                    
                    const pixelHeight = tempDiv.offsetHeight;
                    document.body.removeChild(tempDiv);
                    
                    const maxScroll = textarea.scrollHeight - textarea.clientHeight;
                    const targetScroll = Math.max(0, pixelHeight - (textarea.clientHeight / 2));
                    
                    textarea.scrollTop = Math.max(0, Math.min(maxScroll, targetScroll));
                }
                
                // Calculate line numbers for display
                const beforeText = textarea.value.substring(0, start);
                const startLine = beforeText.split('\n').length;
                const selectedLines = selectedText.split('\n').length;
                const endLine = startLine + selectedLines - 1;
                
                console.log(`[Jump Scroll Debug] Lines ${startLine}-${endLine}`);
                
            } catch (scrollError) {
                console.warn("Scroll failed:", scrollError);
                // Fallback: simple scroll to top of selection area
                const linesBefore = textarea.value.substring(0, start).split('\n').length;
                const lineHeight = 20;
                textarea.scrollTop = Math.max(0, (linesBefore - 5) * lineHeight);
            }
        };
        
        // Delay scrolling slightly for mobile to ensure focus is complete
        setTimeout(scrollToSelection, 150);
    }
}

// Calculate line numbers for display
function constructPrompt() {
            const globalSettings = extension_settings[extensionName];

            // Get per-chat settings from metadata
            const selectedText = getChatMetadata('selected_text', '');
            const separateProtagonist = getChatMetadata('separate_protagonist', false);
            const isekaiMode = getChatMetadata('isekai_mode', false);
            const protagonistName = getChatMetadata('protagonist_name', '');

            if (!globalSettings || !selectedText) {
                return "";
            }

            let prompt = "";

            // 1. Pre-Prompt (OOC1) - Global
            prompt += globalSettings.ooc_pre + "\n";

            // 2. Selected Text wrapped in simulate tags - Per-chat
            prompt += selectedText + "\n";

            // 3. Post-Prompt (OOC2) - Global
            prompt += globalSettings.ooc_post + "\n";

            // 4. Manual Modifications - Global
            if (globalSettings.modification_text) {
                prompt += globalSettings.modification_text + "\n";
            }

            // 5. Toggles - Per-chat
            if (separateProtagonist) {
                const name = protagonistName || "the protagonist";
                prompt += `\n- The protagonist of the story in the given perspective is a character separate from {{user}}, referred to as "${name}".\n`;
                prompt += "- Events happen to them following the source sequence, but {{user}} can experience it with/against them.\n";
                prompt += "- {{user}} may be present as a secondary character or observer.";
            }

            // 6. Isekai Mode (User Replaces Protagonist) - Per-chat
            if (isekaiMode) {
                prompt += `\n[ISEKAI MODE ACTIVE: {{user}} has replaced the protagonist]`;
                prompt += `\n- ROLE: You are the Game Master. Guide {{user}} through the Source Text's events.`;
                prompt += `\n- AGENCY: {{user}} has FREE WILL. Do NOT speak/act for them.`;
                prompt += `\n- THE NUDGE: To signal the canon path, describe strong internal urges, instincts, or 'gut feelings' that pull {{user}} toward the Source Text's choices (e.g., "You feel a burning compulsion to...", "Your instincts scream at you to...").`;
                prompt += `\n- ADAPTATION: If {{user}} resists the nudge, do NOT force them. Instead, adapt the world/NPCs to steer the plot back to the Source Text's outcome naturally.`;
            }

            // Close with bracket
            prompt += "\n]";

            return prompt;
        }

        // Refresh the injection using setExtensionPrompt - Proper context injection
        function refreshInjection() {
            const ctx = getContext();
            const prompt = constructPrompt();
            const settings = extension_settings[extensionName];

            if (prompt && isEnabled()) {
                console.log(`[${extensionName}] Injecting prompt (${prompt.length} chars)`);
                console.log(`[${extensionName}] Prompt preview:`, prompt.substring(0, 100) + "...");

                // Proper context injection using IN_CHAT type for better integration
                ctx.setExtensionPrompt(
                    extensionName,
                    prompt,
                    extension_prompt_types.IN_CHAT,
                    settings.injection_depth || 4
                );
            } else {
                console.log(`[${extensionName}] Clearing injection (disabled or no text selected)`);
                ctx.setExtensionPrompt(extensionName, "", extension_prompt_types.NONE, 0);
            }
        }

        // Test button handler
        function onTestInjection() {
            const prompt = constructPrompt();
            if (prompt) {
                console.log(`[${extensionName}] TEST INJECTION RESULT:\n`, prompt);
                alert("Prompt generated! Check the Browser Console (F12) to see the full injected text.");
            } else {
                alert("No prompt generated. Make sure the extension is enabled and you have text selected.");
            }
        }

        // Handle chat change event
        function onChatChanged() {
            console.log(`[${extensionName}] Chat changed, reloading settings...`);
            loadSettings();
            refreshInjection();
        }

        // Extension initialization
        jQuery(async () => {
            console.log(`[${extensionName}] Loading...`);

            try {
                // Load HTML from file
                const settingsHtml = await $.get(`${extensionFolderPath}/example.html`);

                // Remove existing drawer if present
                $("#chyoa-navigator-drawer").remove();
                $(".chyoa-navigator-settings").remove();
                $(".story-modifier-settings").remove();

                // Append to settings panel
                $("#extensions_settings2").append(settingsHtml);

                // Bind events
                $("#enable_toggle").on("change", toggleEnabled);
                $("#source_text").on("input", onInput);
                $("#ooc_pre").on("input", onInput);
                $("#ooc_post").on("input", onInput);
                $("#modification_text").on("input", onInput);
                $("#separate_protagonist").on("input", onInput);
                $("#isekai_mode").on("input", onInput);
                $("#protagonist_name").on("input", onInput);
                $("#injection_depth").on("input", onInput);
                $("#test_injection_btn").on("click", onTestInjection);
                $("#undo_selection_btn").on("click", undoSelection);
                $("#jump_to_selection_btn").on("click", jumpToSelection);
                
                // Manual paste binding - Mobile compatible
                // Use both click and touch events for maximum compatibility
                $("#manual_paste_btn").on("click touchstart", function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    findAndSelectPasted(e);
                });

                // Bind selection event - Mobile compatible
                // Use input event for mobile text selection changes
                $("#source_text").on("mouseup keyup input", onTextSelect);
                
                // Mobile selection tracking
                let selectionTimeout;
                document.addEventListener("selectionchange", () => {
                    const textarea = document.getElementById("source_text");
                    // Only process if the textarea is the active element to avoid capturing
                    // selections from other inputs (like manual paste box).
                    if (textarea && document.activeElement === textarea) {
                        // Debounce selection changes on mobile to prevent excessive updates
                        clearTimeout(selectionTimeout);
                        selectionTimeout = setTimeout(() => {
                            onTextSelect({ target: textarea });
                        }, 100);
                    }
                });

                // Load saved settings
                loadSettings();

                // Initial injection refresh
                refreshInjection();

                // Register event listeners
                eventSource.on(event_types.MESSAGE_RECEIVED, refreshInjection);
                eventSource.on(event_types.MESSAGE_SENT, refreshInjection);
                eventSource.on(event_types.CHAT_CHANGED, onChatChanged);

                console.log(`[${extensionName}] ✅ Loaded successfully`);
            } catch (error) {
                console.error(`[${extensionName}] ❌ Failed to load:`, error);
            }
        });
