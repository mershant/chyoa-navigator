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
    ooc_post: "</rewrite>\n\n[OOC2: Your job is to rewrite the scenario above with the following changes...",
    modification_text: "",
    separate_protagonist: false,
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
    $("#modification_text").val(extension_settings[extensionName].modification_text || "");
    $("#separate_protagonist").prop("checked", extension_settings[extensionName].separate_protagonist || false);

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

// Construct the prompt to be injected
function constructPrompt() {
    const settings = extension_settings[extensionName];

    // If no selection, don't inject anything
    if (!settings.selected_text) {
        return "";
    }

    let prompt = "";

    // 1. Pre-Prompt (OOC1)
    prompt += settings.ooc_pre + "\n";

    // 2. Selected Text wrapped in rewrite tags (already in OOC1/2 defaults but let's be safe)
    // The user's default OOC1 ends with <rewrite>, OOC2 starts with </rewrite>
    // So we just sandwich the text.
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

    // Close the OOC2 block (assuming user didn't close it in the text area)
    prompt += "]";

    return prompt;
}

// Extension initialization
jQuery(async () => {
    console.log(`[${extensionName}] Loading...`);

    try {
        // Load HTML from file
        const settingsHtml = await $.get(`${extensionFolderPath}/example.html`);

        // Remove existing drawer if present to prevent duplicates
        $(".story-modifier-settings").remove();

        // Append to settings panel (right column for UI extensions)
        $("#extensions_settings2").append(settingsHtml);

        // Bind events
        $("#source_text").on("input", onInput);
        $("#ooc_pre").on("input", onInput);
        $("#ooc_post").on("input", onInput);
        $("#modification_text").on("input", onInput); // Ensure this exists in HTML if not already
        $("#separate_protagonist").on("input", onInput);

        // Bind selection event
        $("#source_text").on("mouseup keyup", onTextSelect);

        // Load saved settings
        loadSettings();

        // Register the prompt injection
        // We use extension_prompt_types to inject at depth 1 (or user defined)
        // This is a standard SillyTavern extension capability
        if (typeof extension_prompt_types !== "undefined") {
            extension_prompt_types.push({
                name: extensionName,
                value: constructPrompt,
                position: "after_story", // Inject after the story context (depth 1 usually)
                order: 100,
                separator: "\n\n"
            });
            console.log(`[${extensionName}] Injection logic registered.`);
        } else {
            console.warn(`[${extensionName}] extension_prompt_types not found! Injection will not work.`);
        }

        console.log(`[${extensionName}] ✅ Loaded successfully`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Failed to load:`, error);
    }
});
