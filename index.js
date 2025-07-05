// CHYOA Navigator - Debug Version
console.log('CHYOA Navigator: Script loaded!');

// Test if we can access SillyTavern
console.log('SillyTavern available:', typeof SillyTavern);
console.log('jQuery available:', typeof jQuery);
console.log('$ available:', typeof $);

// Simple test function
function testExtension() {
    console.log('CHYOA Navigator: Test function called!');
    
    // Try to add something simple to the page
    if (typeof $ !== 'undefined') {
        $('body').append('<div id="chyoa-test" style="position: fixed; top: 10px; right: 10px; background: red; color: white; padding: 10px; z-index: 9999;">CHYOA Navigator Loaded!</div>');
        
        setTimeout(() => {
            $('#chyoa-test').remove();
        }, 3000);
    }
}

// Try multiple initialization methods
console.log('CHYOA Navigator: Setting up initialization...');

// Method 1: Immediate
if (typeof $ !== 'undefined') {
    console.log('CHYOA Navigator: jQuery available, testing immediately');
    testExtension();
}

// Method 2: jQuery ready
if (typeof jQuery !== 'undefined') {
    jQuery(() => {
        console.log('CHYOA Navigator: jQuery ready fired');
        testExtension();
    });
}

// Method 3: Window load
window.addEventListener('load', () => {
    console.log('CHYOA Navigator: Window load fired');
    testExtension();
});

// Method 4: DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('CHYOA Navigator: DOMContentLoaded fired');
    testExtension();
});

// Method 5: Timeout
setTimeout(() => {
    console.log('CHYOA Navigator: Timeout fired');
    testExtension();
}, 2000);

console.log('CHYOA Navigator: Script setup complete!');