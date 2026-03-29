const keys = [...document.querySelectorAll('.key')];
const calcButtons = [...document.querySelectorAll('.calc-btn')];

const state = {
    currentTopic: null,
    topics: [],
    currentMode: 'logoboard',
    currentValue: '0',
    shouldResetDisplay: false,
    currentElementForImage: null,
    currentElementType: null
};

const storageKeys = {
    topics: 'logoboardTopics',
    topicImages: id => `logoboardImages_${id}`,
    calcImages: 'calcBtnImages'
};

const keyOriginalContent = new Map();
const calcBtnOriginalContent = new Map();
const keyImages = new Map();
const calcBtnImages = new Map();

const keyMap = new Map();
keys.forEach(key => {
    const keyValue = key.dataset.key;
    if (keyValue) keyMap.set(keyValue.toLowerCase(), key);
    keyOriginalContent.set(key, key.innerHTML);
});

calcButtons.forEach(btn => {
    calcBtnOriginalContent.set(btn, btn.innerHTML);
});

const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = 'image/*';
fileInput.hidden = true;
document.body.appendChild(fileInput);

const calcDisplay = document.getElementById('calcDisplay');

const functionActions = new Set(['sin', 'cos', 'tan', 'sqrt', 'log', 'ln']);
const operatorMap = {
    add: '+',
    subtract: '-',
    multiply: '*',
    divide: '/',
    power: '^'
};

function getIdentifier(el, type) {
    return type === 'key'
        ? el.dataset.key
        : el.dataset.action || el.dataset.value;
}

function getOriginalContent(el, type) {
    return type === 'key'
        ? keyOriginalContent.get(el)
        : calcBtnOriginalContent.get(el);
}

function getImageMap(type) {
    return type === 'key' ? keyImages : calcBtnImages;
}

function getElements(type) {
    return type === 'key' ? keys : calcButtons;
}

function getStorageKey(type) {
    return type === 'key'
        ? storageKeys.topicImages(state.currentTopic)
        : storageKeys.calcImages;
}

function applyImage(el, imgUrl) {
    Object.assign(el.style, {
        backgroundImage: `url('${imgUrl}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        color: 'transparent'
    });
    el.dataset.hasImage = 'true';
}

function resetElement(el, type, save = true) {
    Object.assign(el.style, {
        backgroundImage: '',
        backgroundSize: '',
        backgroundPosition: '',
        backgroundRepeat: '',
        color: ''
    });
    el.innerHTML = getOriginalContent(el, type);
    el.removeAttribute('data-has-image');
    getImageMap(type).delete(el);

    if (save) saveImages(type);
}

function saveImages(type) {
    const elements = getElements(type);
    const images = getImageMap(type);
    const data = {};

    elements.forEach(el => {
        const id = getIdentifier(el, type);
        if (id && images.has(el)) data[id] = images.get(el);
    });

    localStorage.setItem(getStorageKey(type), JSON.stringify(data));
}

function loadImages(type) {
    const elements = getElements(type);
    const images = getImageMap(type);

    elements.forEach(el => resetElement(el, type, false));
    images.clear();

    const raw = localStorage.getItem(getStorageKey(type));
    if (!raw) return;

    try {
        const data = JSON.parse(raw);
        elements.forEach(el => {
            const id = getIdentifier(el, type);
            if (id && data[id]) {
                images.set(el, data[id]);
                applyImage(el, data[id]);
            }
        });
    } catch (err) {
        console.error(`Error loading ${type} images:`, err);
    }
}

function saveTopics() {
    localStorage.setItem(storageKeys.topics, JSON.stringify(state.topics));
}

function renderTopics() {
    const topicsList = document.getElementById('topicsList');
    topicsList.innerHTML = '';

    state.topics.forEach(topic => {
        const tab = document.createElement('div');
        tab.className = `topic-tab${topic.id === state.currentTopic ? ' active' : ''}`;
        tab.innerHTML = `
            <span class="topic-name" data-topic-id="${topic.id}">${topic.name}</span>
            ${state.topics.length > 1 ? `<button class="delete-topic" data-topic-id="${topic.id}">×</button>` : ''}
        `;

        tab.addEventListener('click', e => {
            if (!e.target.classList.contains('delete-topic')) switchTopic(topic.id);
        });

        tab.querySelector('.topic-name').addEventListener('dblclick', e => {
            e.stopPropagation();
            renameTopic(topic.id);
        });

        const deleteBtn = tab.querySelector('.delete-topic');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', e => {
                e.stopPropagation();
                deleteTopic(topic.id);
            });
        }

        topicsList.appendChild(tab);
    });
}

function updateTitle() {
    const topic = state.topics.find(t => t.id === state.currentTopic);
    if (topic) document.querySelector('.title').textContent = topic.name;
}

function switchTopic(topicId) {
    state.currentTopic = topicId;
    renderTopics();
    loadImages('key');
    updateTitle();
}

function addTopic() {
    const name = prompt('Enter topic name:')?.trim();
    if (!name) return;

    const topic = { id: Date.now(), name };
    state.topics.push(topic);
    saveTopics();
    switchTopic(topic.id);
}

function renameTopic(topicId) {
    const topic = state.topics.find(t => t.id === topicId);
    if (!topic) return;

    const name = prompt('Enter new topic name:', topic.name)?.trim();
    if (!name || name === topic.name) return;

    topic.name = name;
    saveTopics();
    renderTopics();
    updateTitle();
}

function deleteTopic(topicId) {
    if (state.topics.length === 1) {
        alert('Cannot delete the last topic!');
        return;
    }

    if (!confirm('Are you sure you want to delete this topic?')) return;

    state.topics = state.topics.filter(t => t.id !== topicId);
    localStorage.removeItem(storageKeys.topicImages(topicId));

    if (state.currentTopic === topicId) {
        state.currentTopic = state.topics[0].id;
    }

    saveTopics();
    renderTopics();
    loadImages('key');
    updateTitle();
}

function initTopics() {
    state.topics = JSON.parse(localStorage.getItem(storageKeys.topics) || '[]');

    if (state.topics.length === 0) {
        state.topics.push({ id: Date.now(), name: 'Default' });
        saveTopics();
    }

    state.currentTopic = state.topics[0].id;
    renderTopics();
    loadImages('key');
    updateTitle();
}

function getPressedKeyElement(e) {
    const specialMap = {
        ' ': ' ',
        ShiftLeft: 'shiftleft',
        ShiftRight: 'shiftright',
        ControlLeft: 'controlleft',
        ControlRight: 'controlright',
        AltLeft: 'altleft',
        AltRight: 'altright',
        MetaLeft: 'metaleft',
        MetaRight: 'metaright'
    };

    const keyName = e.key === ' '
        ? ' '
        : specialMap[e.code] || e.key.toLowerCase();

    return keyMap.get(keyName);
}

function setActiveKey(e, isActive) {
    const keyEl = getPressedKeyElement(e);
    if (keyEl) keyEl.classList.toggle('active', isActive);
}

function setupImageableElements(elements, type, clickHandler = null) {
    elements.forEach(el => {
        if (clickHandler) el.addEventListener('click', clickHandler);

        el.addEventListener('dblclick', e => {
            e.preventDefault();
            e.stopPropagation();
            state.currentElementForImage = el;
            state.currentElementType = type;
            fileInput.click();
        });

        el.addEventListener('contextmenu', e => {
            e.preventDefault();
            e.stopPropagation();
            resetElement(el, type);
        });

        if (type === 'key') {
            el.addEventListener('mousedown', () => el.classList.add('active'));
            el.addEventListener('mouseup', () => el.classList.remove('active'));
            el.addEventListener('mouseleave', () => el.classList.remove('active'));
        }
    });
}

function updateDisplay() {
    if (!calcDisplay) return;

    if (state.currentValue === 'Error' || /[a-z()+\-*/^]/.test(state.currentValue)) {
        calcDisplay.textContent = state.currentValue;
        return;
    }

    if (state.currentValue.includes('.') && state.currentValue.endsWith('.')) {
        calcDisplay.textContent = state.currentValue;
        return;
    }

    const num = parseFloat(state.currentValue);
    calcDisplay.textContent = isNaN(num)
        ? state.currentValue
        : (Math.round(num * 1e9) / 1e9).toString();
}

function handleNumber(input) {
    if (state.currentValue === 'Error') {
        state.currentValue = input === '.' ? '0.' : input;
        state.shouldResetDisplay = false;
        return updateDisplay();
    }

    if (state.shouldResetDisplay && input !== '(' && input !== ')') {
        state.currentValue = input === '.' ? '0.' : input;
        state.shouldResetDisplay = false;
        return updateDisplay();
    }

    if (state.currentValue === '0' && !['.', '(', ')'].includes(input)) {
        state.currentValue = input;
        return updateDisplay();
    }

    if (input === '.') {
        const lastNumMatch = state.currentValue.match(/[\d.]+$/);
        if (lastNumMatch?.[0].includes('.')) return;
    }

    state.currentValue += input;
    state.shouldResetDisplay = false;
    updateDisplay();
}

function evaluateExpression(expr) {
    let processed = expr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-')
        .replace(/\^/g, '**')
        .replace(/sin\(([^)]+)\)/g, 'Math.sin((Math.PI/180)*($1))')
        .replace(/cos\(([^)]+)\)/g, 'Math.cos((Math.PI/180)*($1))')
        .replace(/tan\(([^)]+)\)/g, 'Math.tan((Math.PI/180)*($1))')
        .replace(/sqrt\(([^)]+)\)/g, 'Math.sqrt($1)')
        .replace(/log\(([^)]+)\)/g, 'Math.log10($1)')
        .replace(/ln\(([^)]+)\)/g, 'Math.log($1)')
        .replace(/π/g, 'Math.PI')
        .replace(/\be\b/g, 'Math.E');

    const result = Function(`"use strict"; return (${processed})`)();
    if (!isFinite(result) || isNaN(result)) throw new Error('Invalid expression');
    return result;
}

function handleAction(action) {
    const current = parseFloat(state.currentValue);

    if (action === 'clear') {
        state.currentValue = '0';
        state.shouldResetDisplay = false;
    } else if (action === 'backspace') {
        state.currentValue = state.currentValue.length > 1
            ? state.currentValue.slice(0, -1)
            : '0';
    } else if (action === 'percent') {
        state.currentValue = (current / 100).toString();
    } else if (functionActions.has(action)) {
        state.currentValue =
            state.currentValue === '0' || state.shouldResetDisplay
                ? `${action}(`
                : `${state.currentValue}${action}(`;
        state.shouldResetDisplay = false;
    } else if (action === 'e') {
        state.currentValue = Math.E.toString();
        state.shouldResetDisplay = true;
    } else if (action === 'pi') {
        state.currentValue = Math.PI.toString();
        state.shouldResetDisplay = true;
    } else if (action in operatorMap) {
        state.currentValue =
            state.currentValue === '0'
                ? `0${operatorMap[action]}`
                : `${state.currentValue}${operatorMap[action]}`;
        state.shouldResetDisplay = false;
    } else if (action === 'equals') {
        try {
            state.currentValue = evaluateExpression(state.currentValue).toString();
            state.shouldResetDisplay = true;
        } catch {
            state.currentValue = 'Error';
            state.shouldResetDisplay = true;
        }
    }

    updateDisplay();
}

function handleCalculatorClick(e) {
    const button = e.currentTarget;
    const { action, value } = button.dataset;

    if (value != null) handleNumber(value);
    else if (action) handleAction(action);
}

function switchMode() {
    const logoboard = document.getElementById('logoboardContainer');
    const calculator = document.getElementById('calculatorContainer');
    const isLogoboard = state.currentMode === 'logoboard';

    logoboard.style.display = isLogoboard ? 'none' : 'block';
    calculator.style.display = isLogoboard ? 'block' : 'none';
    state.currentMode = isLogoboard ? 'calculator' : 'logoboard';
}

function init() {
    initTopics();
    loadImages('calcBtn');

    setupImageableElements(keys, 'key');
    setupImageableElements(calcButtons, 'calcBtn', handleCalculatorClick);

    document.addEventListener('keydown', e => setActiveKey(e, true));
    document.addEventListener('keyup', e => setActiveKey(e, false));

    fileInput.addEventListener('change', e => {
        const file = e.target.files?.[0];
        const el = state.currentElementForImage;
        const type = state.currentElementType;

        if (!file || !el || !type) return;

        const reader = new FileReader();
        reader.onload = event => {
            const imgUrl = event.target.result;
            getImageMap(type).set(el, imgUrl);
            applyImage(el, imgUrl);
            saveImages(type);
        };
        reader.readAsDataURL(file);

        fileInput.value = '';
    });

    document.getElementById('addTopicBtn').addEventListener('click', addTopic);
    document.getElementById('modeSwitchBtn').addEventListener('click', switchMode);
    document.getElementById('modeSwitchBtn2').addEventListener('click', switchMode);

    updateDisplay();
}

init();
