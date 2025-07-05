# CHYOA Navigator

A SillyTavern extension for navigating CHYOA (Choose Your Own Adventure) stories with configurable prompt templates.

## Features

- 📁 **File Browser** - Select story folders or individual markdown files
- 📝 **Template System** - Built-in presets for different story types
- 👁️ **Live Preview** - See exactly what gets sent to the AI
- 🔧 **Configurable** - Custom before/after prompts with variable substitution
- 💾 **Save Templates** - Create and reuse your own prompt templates

## Installation

1. Download the extension files
2. Copy to `SillyTavern/public/scripts/extensions/chyoa-navigator/`
3. Enable in SillyTavern Extensions tab
4. See [INSTALLATION.md](INSTALLATION.md) for detailed instructions

## Quick Start

1. Click "Select Story Folder" to choose your CHYOA story directory
2. Select a template (Interactive Fiction recommended)
3. Choose a chapter file from the list
4. Click "Send to Chat" to inject the content

## Templates

### Built-in Templates
- **Interactive Fiction** - For choice-based narratives
- **Character Background** - For character context
- **World Building** - For scene/lore information
- **Raw Injection** - No additional prompts

### Template Variables
- `{MD_CONTENT}` - The actual file content
- `{FILE_NAME}` - Name of the selected file
- `{CHAPTER_NUM}` - Extracted chapter number
- `{USER_NAME}` - Current user name
- `{CHAR_NAME}` - Current character name

## Example Usage

Perfect for extracted CHYOA stories with branching narratives. Handles large story collections (100+ chapters) that exceed World Info limitations.

## Files

- `manifest.json` - Extension configuration
- `index.js` - Main extension code
- `style.css` - UI styling
- `INSTALLATION.md` - Setup instructions
- `ROADMAP.md` - Development plan
- `TECHNICAL_SPEC.md` - Technical documentation

## Requirements

- SillyTavern (latest version recommended)
- Story files in Markdown (.md) format
- Modern web browser with file system access

## Support

See [INSTALLATION.md](INSTALLATION.md) for troubleshooting and detailed usage instructions.

## License

MIT License - Feel free to modify and distribute

## Contributing

This extension was built for the CHYOA community. Contributions, bug reports, and feature requests are welcome!

---

**Created for handling large interactive fiction stories that exceed traditional World Info limitations.**