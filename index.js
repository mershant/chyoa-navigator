// Import from SillyTavern core
import { extension_settings, getContext, loadExtensionSettings, extension_prompt_types } from "../../../extensions.js";
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
    selected_text: "",
    injection_position: "after_story"
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
    $("#injection_position").val(extension_settings[extensionName].injection_position || "after_story");

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
    console.log(`[${extensionName}] constructPrompt called`);
    const settings = extension_settings[extensionName];

    if (!settings) {
        console.warn(`[${extensionName}] Settings not found during prompt construction`);
        return "";
    }

    // If no selection, don't inject anything
    if (!settings.selected_text) {
        console.log(`[${extensionName}] No text selected, skipping injection`);
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

    console.log(`[${extensionName}] Injecting prompt length: ${prompt.length}`);

    return prompt;
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

        // Remove existing drawer if present to prevent duplicates (using ID for safety)
        $("#chyoa-navigator-drawer").remove();
        $(".chyoa-navigator-settings").remove(); // Fallback
        $(".story-modifier-settings").remove(); // Cleanup old versions

        // Append to settings panel (right column for UI extensions)
        $("#extensions_settings2").append(settingsHtml);

        // Bind events
        $("#source_text").on("input", onInput);
        $("#ooc_pre").on("input", onInput);
        $("#ooc_post").on("input", onInput);
        $("#modification_text").on("input", onInput);
        $("#separate_protagonist").on("input", onInput);
        $("#injection_position").on("input", onInput);
        $("#test_injection_btn").on("click", onTestInjection);

        // Bind selection event
        $("#source_text").on("mouseup keyup", onTextSelect);

        // Load saved settings
        loadSettings();

        // Register the prompt injection
        // We use the imported extension_prompt_types
        if (extension_prompt_types) {
            // Remove old injection if exists to prevent duplicates on reload
            const existingIndex = extension_prompt_types.findIndex(e => e.name === extensionName);
            if (existingIndex !== -1) {
                extension_prompt_types.splice(existingIndex, 1);
            }

            extension_prompt_types.push({
                name: extensionName,
                value: constructPrompt,
                position: extension_settings[extensionName]?.injection_position || "after_story",
                order: 100,
                separator: "\n\n"
            });
            console.log(`[${extensionName}] Injection logic registered.`);
        } else {
            console.warn(`[${extensionName}] extension_prompt_types could not be imported! Injection will not work.`);
        }

        console.log(`[${extensionName}] ✅ Loaded successfully`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Failed to load:`, error);
    }
});
