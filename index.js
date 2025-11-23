// Import from SillyTavern core
import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

// Extension name MUST match folder name
const extensionName = "chyoa-navigator";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

// Default settings
const defaultSettings = {
    source_text: "",
    ooc_pre: "[OOC1: Below is the scenario, keep in mind when continuing to stay in third person.]\nPOINT OF INTEREST: \n<rewrite>",
    ooc_post: "</rewrite>\n\n[OOC2: Your job is to rewrite the scenario above with the following changes...]",
    selected_text: ""
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
    const value = event.target.value;

    // Save to extension settings
    extension_settings[extensionName][id] = value;
    saveSettingsDebounced();
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
    }
}

// Extension initialization
jQuery(async () => {
    console.log(`[${extensionName}] Loading...`);

    try {
        // Load HTML from file
        const settingsHtml = await $.get(`${extensionFolderPath}/example.html`);

        // Append to settings panel (right column for UI extensions)
        $("#extensions_settings2").append(settingsHtml);

        // Bind events
        $("#source_text").on("input", onInput);
        $("#ooc_pre").on("input", onInput);
        $("#ooc_post").on("input", onInput);

        // Bind selection event (mouseup and keyup to catch keyboard selection)
        $("#source_text").on("mouseup keyup", onTextSelect);

        // Load saved settings
        loadSettings();

        console.log(`[${extensionName}] ✅ Loaded successfully`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Failed to load:`, error);
    }
});
