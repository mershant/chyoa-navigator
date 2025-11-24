# CHYOA Navigator

A SillyTavern extension for navigating and modifying Choose Your Own Adventure (CYOA) stories with advanced text selection and mobile compatibility.

## Features

- **Manual Text Selection**: Find and select text from pasted content
- **Mobile Compatible**: Works on both desktop and mobile devices
- **Selection History**: Undo/redo text selections
- **Smart Text Matching**: Handles mobile copy/paste formatting differences
- **Flexible Injection**: Customizable prompt injection depth

## Installation

1. Open SillyTavern
2. Extensions → Install Extension
3. Paste GitHub URL (or manually place in `scripts/extensions/third-party/chyoa-navigator`)
4. Refresh page

## Mobile Compatibility

The extension now includes enhanced mobile support:

- **Touch Event Handling**: Proper touch event support for mobile devices
- **Mobile Text Selection**: Improved text selection on mobile browsers
- **Focus Management**: Better focus handling with mobile keyboards
- **Scroll Optimization**: Mobile-friendly scrolling to selected text

### Manual Selection (Mobile)

The "Manual Selection (Paste Text)" feature now works reliably on mobile devices:

1. Copy text from any source
2. Paste into the "Manual Paste Input" field
3. Click "Find & Select in Source"
4. The extension will find and highlight the text in the source area

## Testing

Look for "Chyoa Navigator" in Extensions settings (right panel).

### Mobile Testing

Use the included `test-mobile-selection.html` file to test mobile functionality:

1. Open `test-mobile-selection.html` in a mobile browser
2. Follow the test instructions to verify manual selection works
3. Check the mobile compatibility report

## Troubleshooting

**Mobile Selection Not Working?**
- Try copying smaller chunks of text
- Ensure the source text area contains the text you're searching for
- Check for formatting differences (mobile copy may change whitespace)

**Selection Not Visible?**
- The extension saves selection metadata even if visual highlighting fails
- Try using the "Jump to Selection" button to scroll to the selected area

## Development

This extension is developed in the `dev` branch with ongoing mobile compatibility improvements.
