// Minimal test extension
console.log('CHYOA Navigator: Starting minimal test');

// Try to add something immediately
if (document.body) {
    const testDiv = document.createElement('div');
    testDiv.innerHTML = 'CHYOA Navigator Test - Extension Loaded!';
    testDiv.style.cssText = 'position: fixed; top: 0; left: 0; background: red; color: white; padding: 10px; z-index: 99999;';
    document.body.appendChild(testDiv);
    
    setTimeout(() => {
        testDiv.remove();
    }, 5000);
}

// Log everything we can find
console.log('Available globals:', {
    jQuery: typeof jQuery,
    $: typeof $,
    eventSource: typeof eventSource,
    SillyTavern: typeof SillyTavern,
    window: typeof window
});

// Try to find extensions panel
setTimeout(() => {
    const extensionsPanel = document.querySelector('#extensions_settings');
    console.log('Extensions panel found:', !!extensionsPanel);
    
    if (extensionsPanel) {
        const testHTML = '<div style="background: lime; padding: 20px; margin: 10px;"><h2>CHYOA Navigator - SUCCESS!</h2><p>Extension is working!</p></div>';
        extensionsPanel.insertAdjacentHTML('beforeend', testHTML);
        console.log('Test HTML added to extensions panel');
    } else {
        console.log('Extensions panel not found, available elements:', 
            Array.from(document.querySelectorAll('[id*="extension"], [class*="extension"]')).map(el => ({
                tag: el.tagName,
                id: el.id,
                class: el.className
            }))
        );
    }
}, 3000);