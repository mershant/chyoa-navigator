# CHYOA Navigator - Installation Guide

## Quick Install

### Step 1: Locate SillyTavern Extensions Folder
1. Open your SillyTavern installation directory
2. Navigate to: `public/scripts/extensions/`
3. Create a new folder called: `chyoa-navigator`

### Step 2: Copy Extension Files
Copy these files into the `chyoa-navigator` folder:
- `manifest.json`
- `index.js` 
- `style.css`

### Step 3: Enable Extension
1. Start SillyTavern
2. Go to Extensions tab (puzzle piece icon)
3. Find "CHYOA Navigator" in the list
4. Toggle it ON

## File Structure
Your extensions folder should look like this:
```
public/scripts/extensions/
└── chyoa-navigator/
    ├── manifest.json
    ├── index.js
    ├── style.css
    └── README.md (optional)
```

## Usage

### 1. Select Story Files
- Click "Select Story Folder" to choose a folder containing .md files
- OR click "Select Single File" to pick one .md file
- Files will appear in the file list

### 2. Choose a Template
- Select from preset templates:
  - **Interactive Fiction**: For choice-based stories
  - **Character Background**: For character context
  - **World Building**: For scene/lore information
  - **Raw Injection**: No additional prompts

### 3. Customize Prompts (Optional)
- Edit "Before Prompt": Text added before file content
- Edit "After Prompt": Text added after file content
- Save custom templates for reuse

### 4. Send to Chat
- Preview shows final output
- Click "Send to Chat" to inject into conversation
- OR "Copy to Clipboard" to paste elsewhere

## Template Variables
Use these in your prompts:
- `{MD_CONTENT}` - The actual file content
- `{FILE_NAME}` - Name of the selected file
- `{CHAPTER_NUM}` - Extracted chapter number
- `{USER_NAME}` - Current user name
- `{CHAR_NAME}` - Current character name

## Example Usage

### For Interactive Fiction:
**Before Prompt:**
```
For your next message, narrate this story section:
```

**After Prompt:**
```
Present the story content above, then ask the user to choose from the available options by saying "Choice A", "Choice B", etc.
```

### For Character Background:
**Before Prompt:**
```
Use this as background context for your character:
```

**After Prompt:**
```
Respond in character based on this information.
```

## Troubleshooting

### Extension Not Loading
- Check file paths are correct
- Verify manifest.json is valid JSON
- Check browser console for errors (F12)

### Files Not Reading
- Ensure files are .md format
- Check file permissions
- Try selecting individual files instead of folders

### Templates Not Saving
- Check browser localStorage is enabled
- Clear browser cache and try again

### Chat Integration Issues
- Verify SillyTavern is fully loaded
- Try refreshing the page
- Check for conflicts with other extensions

## Support
If you encounter issues:
1. Check the browser console (F12) for error messages
2. Verify all files are in the correct location
3. Try disabling other extensions temporarily
4. Restart SillyTavern completely

## Uninstalling
1. Go to Extensions tab in SillyTavern
2. Toggle "CHYOA Navigator" OFF
3. Delete the `chyoa-navigator` folder from extensions directory
4. Restart SillyTavern