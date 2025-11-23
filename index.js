// Import from SillyTavern core
import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";
import { saveSettingsDebounced, eventSource } from "../../../../script.js";

// Extension name MUST match folder name
const extensionName = "chyoa-navigator";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

console.log(`[${extensionName}] Script loaded! Checking for HTML at ${extensionFolderPath}/example.html`);

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

// Event listener for payload modification
function onChatCompletionPayloadReady(data) {
    console.log(`[${extensionName}] Payload ready event triggered!`);
    const promptToInject = constructPrompt();

    if (!promptToInject) {
        console.log(`[${extensionName}] Nothing to inject.`);
        return;
    }

    // Check if we are dealing with a Chat Completion (messages array) or Text Completion (prompt string)
    if (data.body.messages && Array.isArray(data.body.messages)) {
        console.log(`[${extensionName}] Injecting into messages array (Chat Completion)`);

        // Inject as a System message at the end (or near end) to ensure it's seen as a current instruction
        // or adhere to the "depth" logic if we implemented it. For now, let's append as a System message.
        // Usually, putting it right before the last user message is good, or at the very end.
        // Let's put it at the very end as a System message for maximum effect (OOC).

        data.body.messages.push({
            role: "system",
            content: promptToInject
        });

        console.log(`[${extensionName}] Injected system message:\n`, promptToInject);
    }
    else if (data.body.prompt && typeof data.body.prompt === "string") {
        console.log(`[${extensionName}] Injecting into prompt string (Text Completion)`);

        // Just append it to the prompt
        data.body.prompt += "\n\n" + promptToInject;

        console.log(`[${extensionName}] Appended to prompt string.`);
    }
    else {
        console.warn(`[${extensionName}] Unknown payload format. Could not inject.`);
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
        $("#injection_position").on("input", onInput);
        $("#test_injection_btn").on("click", onTestInjection);

        // Bind selection event
        $("#source_text").on("mouseup keyup", onTextSelect);

        // Load saved settings
        loadSettings();

        // Register Event Listener for Injection
        if (eventSource) {
            eventSource.on('chat_completion_payload_ready', onChatCompletionPayloadReady);
            console.log(`[${extensionName}] Event listener registered: chat_completion_payload_ready`);
        } else {
            console.error(`[${extensionName}] eventSource not found! Injection will not work.`);
        }

        console.log(`[${extensionName}] ✅ Loaded successfully`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Failed to load:`, error);
    }
});
