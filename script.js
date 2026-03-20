const keys = document.querySelectorAll('.key');

// Create a map for easier key lookup
const keyMap = new Map();
keys.forEach(key => {
    const keyValue = key.getAttribute('data-key');
    if (keyValue) {
        keyMap.set(keyValue.toLowerCase(), key);
    }
});

// Store original content and custom images for keys
const keyOriginalContent = new Map();
const keyImages = new Map();

// Store original content and custom images for calculator buttons
const calcBtnOriginalContent = new Map();
const calcBtnImages = new Map();

// Topic management
let currentTopic = null;
let topics = [];

// Store original content for each key
keys.forEach(key => {
    keyOriginalContent.set(key, key.innerHTML);
});

// Create hidden file input for image uploads
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = 'image/*';
fileInput.style.display = 'none';
document.body.appendChild(fileInput);

let currentElementForImage = null;
let currentElementType = null; // 'key' or 'calcBtn'

// Function to apply image to key
function applyImageToKey(key, imgUrl) {
    key.style.backgroundImage = `url('${imgUrl}')`;
    key.style.backgroundSize = 'cover';
    key.style.backgroundPosition = 'center';
    key.style.backgroundRepeat = 'no-repeat';
    key.style.color = 'transparent';
    key.setAttribute('data-has-image', 'true');
}

// Function to apply image to calculator button
function applyImageToCalcBtn(btn, imgUrl) {
    btn.style.backgroundImage = `url('${imgUrl}')`;
    btn.style.backgroundSize = 'cover';
    btn.style.backgroundPosition = 'center';
    btn.style.backgroundRepeat = 'no-repeat';
    btn.style.color = 'transparent';
    btn.setAttribute('data-has-image', 'true');
}

// Function to reset key to original appearance
function resetKeyToOriginal(key, save = true) {
    key.style.backgroundImage = '';
    key.style.backgroundSize = '';
    key.style.backgroundRepeat = '';
    key.style.backgroundPosition = '';
    key.style.color = '';
    key.innerHTML = keyOriginalContent.get(key);
    key.removeAttribute('data-has-image');
    keyImages.delete(key);
    if (save) {
        saveImagesToStorage();
    }
}

// Function to reset calculator button to original appearance
function resetCalcBtnToOriginal(btn, save = true) {
    btn.style.backgroundImage = '';
    btn.style.backgroundSize = '';
    btn.style.backgroundRepeat = '';
    btn.style.backgroundPosition = '';
    btn.style.color = '';
    btn.innerHTML = calcBtnOriginalContent.get(btn);
    btn.removeAttribute('data-has-image');
    calcBtnImages.delete(btn);
    if (save) {
        saveCalcBtnImagesToStorage();
    }
}

// Save images to localStorage
function saveImagesToStorage() {
    const imagesData = {};
    keys.forEach(key => {
        const keyValue = key.getAttribute('data-key');
        if (keyValue && keyImages.has(key)) {
            imagesData[keyValue] = keyImages.get(key);
        }
    });
    localStorage.setItem(`logoboardImages_${currentTopic}`, JSON.stringify(imagesData));
    console.log('Saved images for topic', currentTopic, ':', imagesData);
}

// Save calculator button images to localStorage
function saveCalcBtnImagesToStorage() {
    const imagesData = {};
    const calcButtons = document.querySelectorAll('.calc-btn');
    calcButtons.forEach(btn => {
        const action = btn.getAttribute('data-action');
        const value = btn.getAttribute('data-value');
        const identifier = action || value;
        if (identifier && calcBtnImages.has(btn)) {
            imagesData[identifier] = calcBtnImages.get(btn);
        }
    });
    localStorage.setItem('calcBtnImages', JSON.stringify(imagesData));
    console.log('Saved calculator button images:', imagesData);
}

// Load saved images from localStorage
function loadSavedImages() {
    // Clear current images first
    keys.forEach(key => {
        resetKeyToOriginal(key, false);
    });
    keyImages.clear();
    
    const savedImages = localStorage.getItem(`logoboardImages_${currentTopic}`);
    console.log('Loading saved images for topic', currentTopic, ':', savedImages);
    if (savedImages) {
        try {
            const imagesData = JSON.parse(savedImages);
            keys.forEach(key => {
                const keyValue = key.getAttribute('data-key');
                if (keyValue && imagesData[keyValue]) {
                    keyImages.set(key, imagesData[keyValue]);
                    applyImageToKey(key, imagesData[keyValue]);
                }
            });
        } catch (e) {
            console.error('Error loading saved images:', e);
        }
    }
}

// Load saved calculator button images from localStorage
function loadSavedCalcBtnImages() {
    const calcButtons = document.querySelectorAll('.calc-btn');
    
    // Clear current images first
    calcButtons.forEach(btn => {
        resetCalcBtnToOriginal(btn, false);
    });
    calcBtnImages.clear();
    
    const savedImages = localStorage.getItem('calcBtnImages');
    console.log('Loading saved calculator button images:', savedImages);
    if (savedImages) {
        try {
            const imagesData = JSON.parse(savedImages);
            calcButtons.forEach(btn => {
                const action = btn.getAttribute('data-action');
                const value = btn.getAttribute('data-value');
                const identifier = action || value;
                if (identifier && imagesData[identifier]) {
                    calcBtnImages.set(btn, imagesData[identifier]);
                    applyImageToCalcBtn(btn, imagesData[identifier]);
                }
            });
        } catch (e) {
            console.error('Error loading saved calculator button images:', e);
        }
    }
}

// Initialize topics
function initTopics() {
    const savedTopics = localStorage.getItem('logoboardTopics');
    if (savedTopics) {
        topics = JSON.parse(savedTopics);
    }
    
    if (topics.length === 0) {
        topics.push({ id: Date.now(), name: 'Default' });
        saveTopics();
    }
    
    currentTopic = topics[0].id;
    renderTopics();
    loadSavedImages();
    updateTitle();
}

// Save topics to localStorage
function saveTopics() {
    localStorage.setItem('logoboardTopics', JSON.stringify(topics));
}

// Render topic tabs
function renderTopics() {
    const topicsList = document.getElementById('topicsList');
    topicsList.innerHTML = '';
    
    topics.forEach(topic => {
        const tab = document.createElement('div');
        tab.className = 'topic-tab' + (topic.id === currentTopic ? ' active' : '');
        tab.innerHTML = `
            <span class="topic-name" data-topic-id="${topic.id}">${topic.name}</span>
            ${topics.length > 1 ? `<button class="delete-topic" data-topic-id="${topic.id}">×</button>` : ''}
        `;
        
        tab.addEventListener('click', (e) => {
            if (!e.target.classList.contains('delete-topic')) {
                switchTopic(topic.id);
            }
        });
        
        const topicName = tab.querySelector('.topic-name');
        topicName.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            renameTopic(topic.id);
        });
        
        const deleteBtn = tab.querySelector('.delete-topic');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteTopic(topic.id);
            });
        }
        
        topicsList.appendChild(tab);
    });
}

// Update title with current topic name
function updateTitle() {
    const topic = topics.find(t => t.id === currentTopic);
    if (topic) {
        document.querySelector('.title').textContent = topic.name;
    }
}

// Switch to a different topic
function switchTopic(topicId) {
    currentTopic = topicId;
    renderTopics();
    loadSavedImages();
    updateTitle();
}

// Add new topic
function addTopic() {
    const topicName = prompt('Enter topic name:');
    if (topicName && topicName.trim()) {
        const newTopic = {
            id: Date.now(),
            name: topicName.trim()
        };
        topics.push(newTopic);
        saveTopics();
        switchTopic(newTopic.id);
    }
}

// Rename topic
function renameTopic(topicId) {
    const topic = topics.find(t => t.id === topicId);
    if (!topic) return;
    
    const newName = prompt('Enter new topic name:', topic.name);
    if (newName && newName.trim() && newName.trim() !== topic.name) {
        topic.name = newName.trim();
        saveTopics();
        renderTopics();
        updateTitle();
    }
}

// Delete topic
function deleteTopic(topicId) {
    if (topics.length === 1) {
        alert('Cannot delete the last topic!');
        return;
    }
    
    if (confirm('Are you sure you want to delete this topic?')) {
        topics = topics.filter(t => t.id !== topicId);
        
        // Delete topic images from localStorage
        localStorage.removeItem(`logoboardImages_${topicId}`);
        
        if (currentTopic === topicId) {
            currentTopic = topics[0].id;
        }
        
        saveTopics();
        renderTopics();
        loadSavedImages();
    }
}

// Add topic button handler
document.getElementById('addTopicBtn').addEventListener('click', addTopic);

// Load saved images on page load
initTopics();

// Handle logoboard events
document.addEventListener('keydown', (e) => {
    let keyElement = null;
    
    // Special handling for different key types
    if (e.key === ' ') {
        keyElement = keyMap.get(' ');
    } else if (e.code === 'ShiftLeft') {
        keyElement = keyMap.get('shiftleft');
    } else if (e.code === 'ShiftRight') {
        keyElement = keyMap.get('shiftright');
    } else if (e.code === 'ControlLeft') {
        keyElement = keyMap.get('controlleft');
    } else if (e.code === 'ControlRight') {
        keyElement = keyMap.get('controlright');
    } else if (e.code === 'AltLeft') {
        keyElement = keyMap.get('altleft');
    } else if (e.code === 'AltRight') {
        keyElement = keyMap.get('altright');
    } else if (e.code === 'MetaLeft') {
        keyElement = keyMap.get('metaleft');
    } else if (e.code === 'MetaRight') {
        keyElement = keyMap.get('metaright');
    } else {
        keyElement = keyMap.get(e.key.toLowerCase());
    }
    
    if (keyElement && !keyElement.classList.contains('active')) {
        keyElement.classList.add('active');
    }
});

document.addEventListener('keyup', (e) => {
    let keyElement = null;
    
    // Special handling for different key types
    if (e.key === ' ') {
        keyElement = keyMap.get(' ');
    } else if (e.code === 'ShiftLeft') {
        keyElement = keyMap.get('shiftleft');
    } else if (e.code === 'ShiftRight') {
        keyElement = keyMap.get('shiftright');
    } else if (e.code === 'ControlLeft') {
        keyElement = keyMap.get('controlleft');
    } else if (e.code === 'ControlRight') {
        keyElement = keyMap.get('controlright');
    } else if (e.code === 'AltLeft') {
        keyElement = keyMap.get('altleft');
    } else if (e.code === 'AltRight') {
        keyElement = keyMap.get('altright');
    } else if (e.code === 'MetaLeft') {
        keyElement = keyMap.get('metaleft');
    } else if (e.code === 'MetaRight') {
        keyElement = keyMap.get('metaright');
    } else {
        keyElement = keyMap.get(e.key.toLowerCase());
    }
    
    if (keyElement) {
        keyElement.classList.remove('active');
    }
});

// Handle mouse clicks
keys.forEach(key => {
    key.addEventListener('mousedown', () => {
        key.classList.add('active');
    });
    
    key.addEventListener('mouseup', () => {
        key.classList.remove('active');
    });
    
    key.addEventListener('mouseleave', () => {
        key.classList.remove('active');
    });
    
    // Double-click to upload image
    key.addEventListener('dblclick', (e) => {
        e.preventDefault();
        currentElementForImage = key;
        currentElementType = 'key';
        fileInput.click();
    });
    
    // Right-click to reset to original
    key.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        resetKeyToOriginal(key);
    });
});

// Handle file selection
fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0] && currentElementForImage) {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = (event) => {
            const imgUrl = event.target.result;
            
            if (currentElementType === 'key') {
                keyImages.set(currentElementForImage, imgUrl);
                applyImageToKey(currentElementForImage, imgUrl);
                saveImagesToStorage();
            } else if (currentElementType === 'calcBtn') {
                calcBtnImages.set(currentElementForImage, imgUrl);
                applyImageToCalcBtn(currentElementForImage, imgUrl);
                saveCalcBtnImagesToStorage();
            }
        };
        
        reader.readAsDataURL(file);
    }
    // Reset file input
    fileInput.value = '';
});

// ============================================
// CALCULATOR FUNCTIONALITY
// ============================================

let currentMode = 'logoboard'; // 'logoboard' or 'calculator'
let calcDisplay = null;
let currentValue = '0';
let previousValue = null;
let operation = null;
let shouldResetDisplay = false;

// Initialize calculator when DOM is ready
function initCalculator() {
    calcDisplay = document.getElementById('calcDisplay');
    const calcButtons = document.querySelectorAll('.calc-btn');
    
    // Store original content for each button
    calcButtons.forEach(btn => {
        calcBtnOriginalContent.set(btn, btn.innerHTML);
    });
    
    calcButtons.forEach(button => {
        button.addEventListener('click', handleCalculatorClick);
        
        // Double-click to upload image
        button.addEventListener('dblclick', (e) => {
            e.preventDefault();
            e.stopPropagation();
            currentElementForImage = button;
            currentElementType = 'calcBtn';
            fileInput.click();
        });
        
        // Right-click to reset to original
        button.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            resetCalcBtnToOriginal(button);
        });
    });
    
    // Load saved images
    loadSavedCalcBtnImages();
}

// Handle calculator button clicks
function handleCalculatorClick(e) {
    const button = e.target;
    const action = button.getAttribute('data-action');
    const value = button.getAttribute('data-value');
    
    if (value !== null) {
        handleNumber(value);
    } else if (action) {
        handleAction(action);
    }
}

// Handle number inputs
function handleNumber(num) {
    // If the display shows an error, reset it
    if (currentValue === 'Error') {
        currentValue = num === '.' ? '0.' : num;
        shouldResetDisplay = false;
        updateDisplay();
        return;
    }
    
    // If we should reset display and it's not a parenthesis
    if (shouldResetDisplay && num !== '(' && num !== ')') {
        currentValue = num === '.' ? '0.' : num;
        shouldResetDisplay = false;
        updateDisplay();
        return;
    }
    
    // If starting fresh with '0'
    if (currentValue === '0' && num !== '.' && num !== '(' && num !== ')') {
        currentValue = num;
        updateDisplay();
        return;
    }
    
    // Append to current value
    if (num === '.' && !shouldResetDisplay) {
        // Check if we already have a decimal in the current number segment
        const lastNumMatch = currentValue.match(/[\d.]+$/);
        if (lastNumMatch && lastNumMatch[0].includes('.')) {
            return; // Already has decimal
        }
    }
    
    currentValue += num;
    shouldResetDisplay = false;
    updateDisplay();
}

// Handle calculator actions
function handleAction(action) {
    const current = parseFloat(currentValue);
    
    switch(action) {
        case 'clear':
            currentValue = '0';
            previousValue = null;
            operation = null;
            shouldResetDisplay = false;
            break;
            
        case 'backspace':
            if (currentValue.length > 1) {
                currentValue = currentValue.slice(0, -1);
            } else {
                currentValue = '0';
            }
            break;
            
        case 'percent':
            currentValue = (current / 100).toString();
            break;
            
        case 'sin':
            if (currentValue === '0' || shouldResetDisplay) {
                currentValue = 'sin(';
            } else {
                currentValue += 'sin(';
            }
            shouldResetDisplay = false;
            break;
            
        case 'cos':
            if (currentValue === '0' || shouldResetDisplay) {
                currentValue = 'cos(';
            } else {
                currentValue += 'cos(';
            }
            shouldResetDisplay = false;
            break;
            
        case 'tan':
            if (currentValue === '0' || shouldResetDisplay) {
                currentValue = 'tan(';
            } else {
                currentValue += 'tan(';
            }
            shouldResetDisplay = false;
            break;
            
        case 'sqrt':
            if (currentValue === '0' || shouldResetDisplay) {
                currentValue = 'sqrt(';
            } else {
                currentValue += 'sqrt(';
            }
            shouldResetDisplay = false;
            break;
            
        case 'log':
            if (currentValue === '0' || shouldResetDisplay) {
                currentValue = 'log(';
            } else {
                currentValue += 'log(';
            }
            shouldResetDisplay = false;
            break;
            
        case 'ln':
            if (currentValue === '0' || shouldResetDisplay) {
                currentValue = 'ln(';
            } else {
                currentValue += 'ln(';
            }
            shouldResetDisplay = false;
            break;
            
        case 'e':
            currentValue = Math.E.toString();
            shouldResetDisplay = true;
            break;
            
        case 'pi':
            currentValue = Math.PI.toString();
            shouldResetDisplay = true;
            break;
            
        case 'add':
        case 'subtract':
        case 'multiply':
        case 'divide':
        case 'power':
            const opSymbol = action === 'add' ? '+' : 
                            action === 'subtract' ? '-' : 
                            action === 'multiply' ? '*' : 
                            action === 'divide' ? '/' : '^';
            
            // Always append operator to build expression
            if (currentValue === '0') {
                currentValue = '0' + opSymbol;
            } else {
                currentValue += opSymbol;
            }
            shouldResetDisplay = false;
            break;
            
        case 'equals':
            // Always evaluate as an expression
            try {
                const result = evaluateExpression(currentValue);
                currentValue = result.toString();
                shouldResetDisplay = true;
                previousValue = null;
                operation = null;
            } catch (e) {
                console.error('Evaluation error:', e);
                currentValue = 'Error';
                shouldResetDisplay = true;
                previousValue = null;
                operation = null;
            }
            break;
    }
    
    updateDisplay();
}

// Evaluate mathematical expressions with functions
function evaluateExpression(expr) {
    try {
        // Handle simple number case
        const simpleNum = parseFloat(expr);
        if (!isNaN(simpleNum) && !/[a-z\(\)\+\-\*\/\^]/.test(expr)) {
            return simpleNum;
        }
        
        // Replace display symbols with JavaScript operators
        let processedExpr = expr
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/−/g, '-')
            .replace(/\^/g, '**');
        
        // Handle trig functions with degree to radian conversion
        processedExpr = processedExpr.replace(/sin\(([^)]+)\)/g, (match, p1) => {
            return `Math.sin((Math.PI/180)*(${p1}))`;
        });
        processedExpr = processedExpr.replace(/cos\(([^)]+)\)/g, (match, p1) => {
            return `Math.cos((Math.PI/180)*(${p1}))`;
        });
        processedExpr = processedExpr.replace(/tan\(([^)]+)\)/g, (match, p1) => {
            return `Math.tan((Math.PI/180)*(${p1}))`;
        });
        
        // Handle other math functions
        processedExpr = processedExpr.replace(/sqrt\(([^)]+)\)/g, (match, p1) => {
            return `Math.sqrt(${p1})`;
        });
        processedExpr = processedExpr.replace(/log\(([^)]+)\)/g, (match, p1) => {
            return `Math.log10(${p1})`;
        });
        processedExpr = processedExpr.replace(/ln\(([^)]+)\)/g, (match, p1) => {
            return `Math.log(${p1})`;
        });
        
        // Replace constants
        processedExpr = processedExpr
            .replace(/π/g, 'Math.PI')
            .replace(/\be\b/g, 'Math.E');
        
        console.log('Original:', expr);
        console.log('Processed:', processedExpr);
        
        // Safely evaluate the expression
        const result = Function('"use strict"; return (' + processedExpr + ')')();
        
        if (isNaN(result) || !isFinite(result)) {
            throw new Error('Invalid result');
        }
        
        return result;
    } catch (e) {
        console.error('Expression evaluation error:', e);
        console.error('Expression:', expr);
        throw new Error('Invalid expression');
    }
}

// Perform calculation
function calculate() {
    const prev = previousValue;
    const current = parseFloat(currentValue);
    let result;
    
    switch(operation) {
        case 'add':
            result = prev + current;
            break;
        case 'subtract':
            result = prev - current;
            break;
        case 'multiply':
            result = prev * current;
            break;
        case 'divide':
            result = prev / current;
            break;
        case 'power':
            result = Math.pow(prev, current);
            break;
        default:
            return;
    }
    
    currentValue = result.toString();
    shouldResetDisplay = true;
}

// Update calculator display
function updateDisplay() {
    if (calcDisplay) {
        // Check if it's an expression or error - show as-is
        if (currentValue === 'Error' || /[a-z\(\)\+\-\*\/\^]/.test(currentValue)) {
            calcDisplay.textContent = currentValue;
        } else {
            // Show numbers formatted
            const displayValue = parseFloat(currentValue);
            if (currentValue.includes('.') && currentValue.endsWith('.')) {
                calcDisplay.textContent = currentValue;
            } else if (!isNaN(displayValue)) {
                // Round to avoid floating point errors
                const rounded = Math.round(displayValue * 1000000000) / 1000000000;
                calcDisplay.textContent = rounded.toString();
            } else {
                calcDisplay.textContent = currentValue;
            }
        }
    }
}

// Mode switching functionality
function switchMode() {
    const logoboardContainer = document.getElementById('logoboardContainer');
    const calculatorContainer = document.getElementById('calculatorContainer');
    
    if (currentMode === 'logoboard') {
        logoboardContainer.style.display = 'none';
        calculatorContainer.style.display = 'block';
        currentMode = 'calculator';
    } else {
        logoboardContainer.style.display = 'block';
        calculatorContainer.style.display = 'none';
        currentMode = 'logoboard';
    }
}

// Initialize calculator
initCalculator();

// Add event listeners for mode switch buttons
document.getElementById('modeSwitchBtn').addEventListener('click', switchMode);
document.getElementById('modeSwitchBtn2').addEventListener('click', switchMode);
