# Learn Programming Through CHYOA Navigator - Tutorial Path

## Overview
This is the step-by-step learning path for building the CHYOA Navigator extension while learning programming from scratch. Perfect for when you have more time and want to understand how everything works!

## Learning Philosophy
- **Learn by doing** - Build real features, not toy examples
- **Understand every line** - No copy-paste without explanation
- **Start simple** - Begin with "Hello World", build complexity gradually
- **Practical focus** - Learn what you need for this project

---

## Week 1: Programming Fundamentals

### Day 1: HTML Basics
**Goal**: Create a simple webpage that displays text

**What you'll learn**:
- What HTML tags are (`<div>`, `<button>`, `<textarea>`)
- How to structure a basic webpage
- How to create forms and inputs

**Project**: Create the basic UI layout for the extension panel

**Example**:
```html
<div id="chyoa-navigator">
    <h2>CHYOA Navigator</h2>
    <button>Select File</button>
    <textarea placeholder="Your story content will appear here"></textarea>
</div>
```

### Day 2: CSS Styling
**Goal**: Make your HTML look good

**What you'll learn**:
- How to change colors, fonts, sizes
- Layout with flexbox
- Making responsive designs

**Project**: Style the extension panel to match SillyTavern's theme

### Day 3: JavaScript Basics
**Goal**: Make buttons do things

**What you'll learn**:
- Variables and functions
- Event listeners (click, change, etc.)
- Basic DOM manipulation

**Project**: Make the "Select File" button show an alert when clicked

**Example**:
```javascript
document.getElementById('select-file').addEventListener('click', function() {
    alert('Button clicked!');
});
```

### Day 4: File Operations
**Goal**: Read files from the computer

**What you'll learn**:
- File API basics
- Async/await (handling delays)
- Error handling

**Project**: Actually read a .md file and display its content

### Day 5: SillyTavern Integration
**Goal**: Connect your extension to SillyTavern

**What you'll learn**:
- Extension manifest files
- SillyTavern's API
- Sending messages to chat

**Project**: Send your first message from the extension to SillyTavern chat

---

## Week 2: Building Core Features

### Day 6-7: File Browser
**Goal**: Create a proper file selection interface

**What you'll learn**:
- Directory browsing
- File filtering (.md only)
- Dynamic HTML generation

**Project**: Build a file list that shows all .md files in a folder

### Day 8-9: Template System
**Goal**: Add before/after prompt wrapping

**What you'll learn**:
- String manipulation
- Template literals
- Local storage (saving user data)

**Project**: Create the template editor with save/load functionality

### Day 10-11: Variable Substitution
**Goal**: Replace {MD_CONTENT} with actual content

**What you'll learn**:
- Regular expressions (pattern matching)
- String replacement
- Object manipulation

**Project**: Implement the variable system ({FILE_NAME}, {CHAPTER_NUM}, etc.)

### Day 12: Integration Testing
**Goal**: Make sure everything works together

**What you'll learn**:
- Debugging techniques
- Browser developer tools
- Testing workflows

**Project**: Test the complete workflow with your Bondage-in-Space story

---

## Week 3: Advanced Features

### Day 13-15: Story Navigation
**Goal**: Parse choices and enable navigation

**What you'll learn**:
- Markdown parsing
- Link detection
- State management

**Project**: Auto-detect story choices and create navigation buttons

### Day 16-17: UI Polish
**Goal**: Make it look professional

**What you'll learn**:
- Advanced CSS
- User experience principles
- Responsive design

**Project**: Create a polished, intuitive interface

### Day 18-19: Error Handling
**Goal**: Handle things going wrong gracefully

**What you'll learn**:
- Try/catch blocks
- User feedback systems
- Defensive programming

**Project**: Add proper error messages and recovery

---

## Week 4: Polish and Distribution

### Day 20-21: Performance Optimization
**Goal**: Handle large stories efficiently

**What you'll learn**:
- Performance profiling
- Memory management
- Lazy loading

**Project**: Optimize for 131+ chapter stories

### Day 22-24: Documentation
**Goal**: Help others use your extension

**What you'll learn**:
- Technical writing
- User guides
- Code documentation

**Project**: Write user manual and setup instructions

### Day 25-26: Testing and Debugging
**Goal**: Make sure it works for everyone

**What you'll learn**:
- Cross-platform testing
- Bug tracking
- Quality assurance

**Project**: Test on different systems and fix issues

### Day 27-28: Release Preparation
**Goal**: Share your creation with the world

**What you'll learn**:
- Version control (Git)
- Release packaging
- Community engagement

**Project**: Prepare for public release

---

## Learning Resources

### Essential Concepts
1. **HTML**: Structure and content
2. **CSS**: Styling and layout
3. **JavaScript**: Logic and interactivity
4. **APIs**: Connecting to other systems
5. **File Systems**: Reading and writing files

### Recommended Tools
- **Code Editor**: Visual Studio Code (free)
- **Browser**: Chrome/Firefox with developer tools
- **Testing**: SillyTavern development environment

### When You Get Stuck
1. **Read error messages carefully** - they usually tell you what's wrong
2. **Use console.log()** - print values to see what's happening
3. **Break problems into smaller pieces** - solve one thing at a time
4. **Google specific error messages** - someone else has had this problem
5. **Ask for help** - programming communities are very helpful

---

## Project Milestones

### Milestone 1: "Hello World" Extension
- Extension loads in SillyTavern
- Shows a simple panel
- Can send one message to chat

### Milestone 2: Basic File Reader
- Can select and read .md files
- Displays content in extension
- Basic template wrapping works

### Milestone 3: Full Template System
- Save/load custom templates
- Variable substitution working
- Preset templates available

### Milestone 4: Story Navigation
- Parses story choices
- Navigation between chapters
- Complete story experience

### Milestone 5: Production Ready
- Error handling
- Performance optimized
- User documentation
- Ready for community use

---

## Why This Approach Works

### Learning Benefits
- **Immediate results** - see your code working right away
- **Real project** - not just tutorials, but something you'll actually use
- **Progressive complexity** - each day builds on the previous
- **Practical skills** - learn what you need, when you need it

### Programming Skills You'll Gain
- **Web development** (HTML/CSS/JavaScript)
- **API integration** (SillyTavern)
- **File system operations** (reading/writing files)
- **User interface design** (making things user-friendly)
- **Problem solving** (debugging and optimization)

### Career Relevance
These are the same skills used in:
- Web development
- Browser extensions
- Desktop applications
- API integrations
- User interface design

---

## Getting Started When Ready

### Prerequisites
- Computer with internet access
- SillyTavern installed
- Text editor (VS Code recommended)
- Willingness to learn and experiment

### First Steps
1. Set up development environment
2. Create your first HTML file
3. Open it in a browser
4. Start with "Hello World"
5. Build complexity day by day

### Support System
- Daily check-ins to review progress
- Code explanations for every line
- Debugging help when stuck
- Encouragement when frustrated
- Celebration when things work!

---

**Remember**: Every expert programmer started exactly where you are now. The only difference is they kept going when things got confusing. You can do this! 🚀