// Import from SillyTavern core
import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";
import { saveSettingsDebounced, event_types, eventSource, extension_prompt_types } from "../../../../script.js";

// Extension name MUST match folder name
const extensionName = "chyoa-navigator";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

console.log(`[${extensionName}] Script loaded!`);

// Default settings
const defaultSettings = {
    source_text: "",
    ooc_pre: "[OOC1: Below is the scenario, keep in mind when continuing to stay in third person.]\nPOINT OF INTEREST: \n<rewrite>",
    ooc_post: "</rewrite>\n\n[OOC2: Your job is to rewrite the scenario above with the following changes...",
    modification_text: "",
    separate_protagonist: false,
    selected_text: "",
    injection_depth: 4
};

async function loadSettings() {
    // Ensure settings object exists
    extension_settings[extensionName] = extension_settings[extensionName] || {};

    // Apply defaults if missing
    if (Object.keys(extension_settings[extensionName]).length === 0) {
        Object.assign(extension_settings[extensionName], defaultSettings);
    }

    // Load values into UI
    $("#source_text").val(extension_settings[extensionName].source_text || "");
    $("#ooc_pre").val(extension_settings[extensionName].ooc_pre || "");
    $("#ooc_post").val(extension_settings[extensionName].ooc_post || "");
    $("#modification_text").val(extension_settings[extensionName].modification_text || "");
    $("#separate_protagonist").prop("checked", extension_settings[extensionName].separate_protagonist || false);
    $("#injection_depth").val(extension_settings[extensionName].injection_depth || 4);

    // Restore selection preview
    const savedSelection = extension_settings[extensionName].selected_text || "";
    updateSelectionPreview(savedSelection);
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

    // Save to extension settings
    extension_settings[extensionName][id] = value;
    saveSettingsDebounced();

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
        extension_settings[extensionName].selected_text = selectedText;
        updateSelectionPreview(selectedText);
        saveSettingsDebounced();
        console.log(`[${extensionName}] Text selected:`, selectedText.substring(0, 20) + "...");

        // Refresh injection
        refreshInjection();
    }
}

// Construct the prompt to be injected
function constructPrompt() {
    const settings = extension_settings[extensionName];

    if (!settings || !settings.selected_text) {
        return "";
    }

    let prompt = "";

    // 1. Pre-Prompt (OOC1)
    prompt += settings.ooc_pre + "\n";

    // 2. Selected Text wrapped in rewrite tags
    prompt += settings.selected_text + "\n";

    // 3. Post-Prompt (OOC2)
    prompt += settings.ooc_post + "\n";

    // 4. Manual Modifications
    if (settings.modification_text) {
        prompt += settings.modification_text + "\n";
    }

    // 5. Toggles
    if (settings.separate_protagonist) {
        prompt += "- The protagonist of the story in the given perspective is a character separate from {{user}}.\n";
    }

    // Close the OOC2 block
    prompt += "]";

    return prompt;
}

// Refresh the injection using setExtensionPrompt
function refreshInjection() {
    const ctx = getContext();
    const prompt = constructPrompt();
    const settings = extension_settings[extensionName];

    if (prompt) {
        console.log(`[${extensionName}] Injecting prompt (${prompt.length} chars)`);
        console.log(`[${extensionName}] Prompt preview:`, prompt.substring(0, 100) + "...");

        // Use setExtensionPrompt: (id, text, position, depth, scan, role)
        // position: extension_prompt_types.IN_PROMPT (which is used by message-summarizer)
        // depth: how many messages from the end to inject at
        // scan: false
        // role: 'system'
        ctx.setExtensionPrompt(
            extensionName,
            prompt,
            extension_prompt_types.IN_PROMPT,  // Use the correct constant
            settings.injection_depth || 4,      // Depth
            false,                               // No scan
            'system'                             // System role
        );
    } else {
        console.log(`[${extensionName}] Clearing injection (no text selected)`);
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
        alert("No prompt generated. Make sure you have text selected in the Source Text box.");
    }
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
        $("#source_text").on("input", onInput);
        $("#ooc_pre").on("input", onInput);
        $("#ooc_post").on("input", onInput);
        $("#modification_text").on("input", onInput);
        $("#separate_protagonist").on("input", onInput);
        $("#injection_depth").on("input", onInput);
        $("#test_injection_btn").on("click", onTestInjection);

        // Bind selection event
        $("#source_text").on("mouseup keyup", onTextSelect);

        // Load saved settings
        loadSettings();

        // Initial injection refresh
        refreshInjection();

        // Register event listeners to refresh injection on chat events
        eventSource.on(event_types.MESSAGE_RECEIVED, refreshInjection);
        eventSource.on(event_types.MESSAGE_SENT, refreshInjection);
        eventSource.on(event_types.CHAT_CHANGED, refreshInjection);

        console.log(`[${extensionName}] ✅ Loaded successfully`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Failed to load:`, error);
    }
});
