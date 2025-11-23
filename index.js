// Import from SillyTavern core
import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";
// Import from SillyTavern core
import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

// Extension name MUST match folder name
const extensionName = "chyoa-navigator";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

// Default settings
const defaultSettings = {
    original_text: "",
    modification_text: ""
};

async function loadSettings() {
    // Ensure settings object exists
    extension_settings[extensionName] = extension_settings[extensionName] || {};

    // Apply defaults if missing
    if (Object.keys(extension_settings[extensionName]).length === 0) {
        Object.assign(extension_settings[extensionName], defaultSettings);
    }

    // Load values into UI
    $("#original_text").val(extension_settings[extensionName].original_text || "");
    $("#modification_text").val(extension_settings[extensionName].modification_text || "");
}

function onInput(event) {
    const id = event.target.id;
    const value = event.target.value;

    // Save to extension settings
    extension_settings[extensionName][id] = value;
    saveSettingsDebounced();
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
        $("#original_text").on("input", onInput);
        $("#modification_text").on("input", onInput);

        // Load saved settings
        loadSettings();

        console.log(`[${extensionName}] ✅ Loaded successfully`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Failed to load:`, error);
    }
});
