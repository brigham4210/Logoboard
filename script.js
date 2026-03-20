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

let currentKeyForImage = null;

// Function to apply image to key
function applyImageToKey(key, imgUrl) {
    key.style.backgroundImage = `url('${imgUrl}')`;
    key.style.backgroundSize = 'cover';
    key.style.backgroundPosition = 'center';
    key.style.backgroundRepeat = 'no-repeat';
    key.style.color = 'transparent';
    key.setAttribute('data-has-image', 'true');
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
        currentKeyForImage = key;
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
    if (e.target.files && e.target.files[0] && currentKeyForImage) {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = (event) => {
            const imgUrl = event.target.result;
            keyImages.set(currentKeyForImage, imgUrl);
            applyImageToKey(currentKeyForImage, imgUrl);
            saveImagesToStorage();
        };
        
        reader.readAsDataURL(file);
    }
    // Reset file input
    fileInput.value = '';
});
