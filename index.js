// Import from SillyTavern core
import { extension_settings, getContext, saveMetadataDebounced } from "../../../extensions.js";
import { saveSettingsDebounced, event_types, eventSource, extension_prompt_types, chat_metadata } from "../../../../script.js";

// Extension name MUST match folder name
const extensionName = "chyoa-navigator";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

console.log(`[${extensionName}] Script loaded!`);

// Default settings (global - apply to all chats)
const defaultSettings = {
    ooc_pre: "[SEQUENCE SIMULATION: The following text describes a MANDATORY sequence of events that MUST occur in the story. These events are NON-NEGOTIABLE and should happen in the order presented, but they may be adapted to incorporate {{user}}'s modifications (e.g., different characters, added details, new dialogue).\n\nPOINT OF INTEREST:\n<simulate>",
    ooc_post: "</simulate>\n\nYOUR JOB: Simulate the sequence above in third-person perspective, ensuring ALL listed events occur. {{user}}'s input may modify WHO is involved or add contextual details, but the CORE EVENTS must still happen. Pay special attention to small details like objects being examined, internal thoughts being expressed through actions, and the pacing described.",
    modification_text: "",
    separate_protagonist: false,
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
    // Ensure global settings exist
    extension_settings[extensionName] = extension_settings[extensionName] || {};

    // Apply defaults for global settings if missing
    if (Object.keys(extension_settings[extensionName]).length === 0) {
        Object.assign(extension_settings[extensionName], defaultSettings);
    }

    // Load global settings into UI
    $("#ooc_pre").val(extension_settings[extensionName].ooc_pre || defaultSettings.ooc_pre);
    $("#ooc_post").val(extension_settings[extensionName].ooc_post || defaultSettings.ooc_post);
    $("#modification_text").val(extension_settings[extensionName].modification_text || "");
    $("#separate_protagonist").prop("checked", extension_settings[extensionName].separate_protagonist || false);
    $("#protagonist_name").val(extension_settings[extensionName].protagonist_name || "");
    $("#injection_depth").val(extension_settings[extensionName].injection_depth || 4);

    // Load per-chat data
    const chatSourceText = getChatMetadata('source_text', '');
    const chatSelectedText = getChatMetadata('selected_text', '');

    $("#source_text").val(chatSourceText);
    updateSelectionPreview(chatSelectedText);

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
    if (text) {
        previewEl.text(text);
        previewEl.css("color", "#fff");
    } else {
        previewEl.text("(No text selected)");
        previewEl.css("color", "#aaa");
    }
}

function onInput(event) {
    const id = event.target.id;
    const type = event.target.type;
    const value = type === "checkbox" ? event.target.checked : event.target.value;

    // Determine if this is a global or per-chat setting
    if (id === 'source_text') {
        // Per-chat: source text
        setChatMetadata('source_text', value);
    } else if (id === 'ooc_pre' || id === 'ooc_post' || id === 'modification_text' || id === 'separate_protagonist' || id === 'protagonist_name' || id === 'injection_depth') {
        // Global settings
        extension_settings[extensionName][id] = value;
        saveSettingsDebounced();
    }

    // Update UI when separate_protagonist changes
    if (id === 'separate_protagonist') {
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
        setChatMetadata('selected_text', selectedText);
        updateSelectionPreview(selectedText);
        console.log(`[${extensionName}] Text selected:`, selectedText.substring(0, 20) + "...");

        // Refresh injection
        refreshInjection();
    }
}

// Construct the prompt to be injected
function constructPrompt() {
    // Don't inject if disabled
    if (!isEnabled()) {
        return "";
    }

    const settings = extension_settings[extensionName];
    const selectedText = getChatMetadata('selected_text', '');

    if (!selectedText) {
        return "";
    }

    let prompt = "";

    // 1. Pre-Prompt (OOC1)
    prompt += settings.ooc_pre + "\n";

    // 2. Selected Text wrapped in simulate tags
    prompt += selectedText + "\n";

    // 3. Post-Prompt (OOC2)
    prompt += settings.ooc_post + "\n";

    // 4. Manual Modifications
    if (settings.modification_text) {
        prompt += settings.modification_text + "\n";
    }

    // 5. Toggles
    if (settings.separate_protagonist) {
        const protagonistName = settings.protagonist_name || "the protagonist";
        prompt += `\n- The protagonist of the story in the given perspective is a character separate from {{user}}, referred to as "${protagonistName}".\n`;
        prompt += "- Events happen to them following the source sequence, but {{user}} can experience it with/against them.\n";
        prompt += "- {{user}} may be present as a secondary character or observer.";
    }

    // Close with bracket
    prompt += "\n]";

    return prompt;
}

// Refresh the injection using setExtensionPrompt
function refreshInjection() {
    const ctx = getContext();
    const prompt = constructPrompt();
    const settings = extension_settings[extensionName];

    if (prompt && isEnabled()) {
        console.log(`[${extensionName}] Injecting prompt (${prompt.length} chars)`);
        console.log(`[${extensionName}] Prompt preview:`, prompt.substring(0, 100) + "...");

        ctx.setExtensionPrompt(
            extensionName,
            prompt,
            extension_prompt_types.IN_PROMPT,
            settings.injection_depth || 4,
            false,
            'system'
        );
    } else {
        console.log(`[${extensionName}] Clearing injection (disabled or no text selected)`);
        ctx.setExtensionPrompt(extensionName, "", extension_prompt_types.IN_PROMPT, 0, false, 'system');
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
        $("#protagonist_name").on("input", onInput);
        $("#injection_depth").on("input", onInput);
        $("#test_injection_btn").on("click", onTestInjection);

        // Bind selection event
        $("#source_text").on("mouseup keyup", onTextSelect);

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
