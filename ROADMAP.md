# CHYOA Navigator - Development Roadmap

## Phase 1: Core File Reader (Week 1-2)

### 1.1 Extension Setup
- [ ] Create extension manifest.json
- [ ] Set up basic HTML/CSS/JS structure
- [ ] Register with SillyTavern extension system
- [ ] Create basic UI panel

### 1.2 File System Integration
- [ ] Implement file browser component
- [ ] Add folder selection functionality
- [ ] Create .md file filter and display
- [ ] Build file content reader

### 1.3 Basic Content Display
- [ ] Markdown rendering in extension panel
- [ ] Content preview window
- [ ] Basic send-to-chat functionality
- [ ] Error handling for file operations

### 1.4 MVP Testing
- [ ] Test with Bondage-in-Space story files
- [ ] Verify file reading accuracy
- [ ] Test chat integration
- [ ] Basic bug fixes and stability

---

## Phase 2: Template System (Week 3-4)

### 2.1 Prompt Configuration UI
- [ ] Before prompt text area
- [ ] After prompt text area
- [ ] Live preview of final output
- [ ] Template name/description fields

### 2.2 Template Management
- [ ] Save template functionality
- [ ] Load saved templates
- [ ] Delete/edit existing templates
- [ ] Import/export template files

### 2.3 Preset Templates
- [ ] Interactive Fiction template
- [ ] Character Background template
- [ ] World Building template
- [ ] Raw Injection template
- [ ] Custom template option

### 2.4 Variable System
- [ ] {MD_CONTENT} placeholder
- [ ] {FILE_NAME} variable
- [ ] {CHAPTER_NUM} extraction
- [ ] {USER_NAME} and {CHAR_NAME} integration
- [ ] Custom variable support

---

## Phase 3: Advanced Features (Week 5-6)

### 3.1 Story Structure Detection
- [ ] Auto-parse choice links in markdown
- [ ] Detect chapter numbering systems
- [ ] Identify story branching points
- [ ] Build internal navigation map

### 3.2 Navigation System
- [ ] Click-to-navigate choice buttons
- [ ] Breadcrumb trail display
- [ ] Back/forward navigation
- [ ] Jump to specific chapter

### 3.3 Multi-File Coordination
- [ ] Handle related files (character sheets, etc.)
- [ ] Batch processing capabilities
- [ ] Story state tracking
- [ ] Session persistence

### 3.4 Advanced Prompting
- [ ] Conditional prompt logic
- [ ] Context-aware templates
- [ ] Dynamic variable generation
- [ ] AI model-specific optimizations

---

## Phase 4: Polish & Distribution (Week 7-8)

### 4.1 UI/UX Improvements
- [ ] Responsive design
- [ ] Keyboard shortcuts
- [ ] Drag-and-drop file support
- [ ] Visual theme integration

### 4.2 Documentation
- [ ] User manual
- [ ] Template creation guide
- [ ] API documentation
- [ ] Video tutorials

### 4.3 Community Features
- [ ] Template sharing system
- [ ] Community template repository
- [ ] User feedback integration
- [ ] Extension update system

### 4.4 Performance & Stability
- [ ] Large file handling optimization
- [ ] Memory usage optimization
- [ ] Error recovery systems
- [ ] Cross-platform testing

---

## Technical Architecture

### File Structure
```
CHYOA-Navigator/
├── manifest.json
├── index.js (main extension logic)
├── ui/
│   ├── panel.html
│   ├── styles.css
│   └── components/
├── templates/
│   ├── presets.json
│   └── user-templates/
├── utils/
│   ├── file-reader.js
│   ├── markdown-parser.js
│   └── template-engine.js
└── docs/
    ├── README.md
    └── user-guide.md
```

### Key Dependencies
- SillyTavern Extension API
- Markdown parser (marked.js or similar)
- File system access APIs
- Local storage for templates

### Integration Points
- SillyTavern chat system
- Extension panel UI
- Local file system
- Template storage system

---

## Success Metrics

### Phase 1 Success
- [ ] Can read and display .md files
- [ ] Successfully sends content to chat
- [ ] Works with test story files

### Phase 2 Success
- [ ] Template system fully functional
- [ ] Can save/load custom templates
- [ ] Variable substitution working

### Phase 3 Success
- [ ] Navigation through story tree
- [ ] Choice detection and parsing
- [ ] Multi-chapter coordination

### Phase 4 Success
- [ ] Production-ready extension
- [ ] Community adoption
- [ ] Positive user feedback

---

## Risk Mitigation

### Technical Risks
- **File system access limitations**: Research SillyTavern's file API capabilities
- **Performance with large files**: Implement lazy loading and chunking
- **Cross-platform compatibility**: Test on Windows/Mac/Linux

### User Experience Risks
- **Complex UI**: Keep interface simple and intuitive
- **Learning curve**: Provide clear documentation and examples
- **Template complexity**: Start with simple presets, add complexity gradually

### Project Risks
- **Scope creep**: Stick to roadmap phases, resist feature bloat
- **SillyTavern API changes**: Monitor for updates, maintain compatibility
- **Community adoption**: Engage with SillyTavern community early