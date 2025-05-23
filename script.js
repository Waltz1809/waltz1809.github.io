// ==================== GLOBAL VARIABLES ====================
let storyData = [];
let availableStories = [];
let currentStory = '';
let currentTheme = localStorage.getItem('theme') || 'dark';
let currentFontSize = localStorage.getItem('fontSize') || 'medium';

// ==================== DOM ELEMENTS ====================
const elements = {
    loadingSpinner: document.getElementById('loadingSpinner'),
    tableOfContents: document.getElementById('tableOfContents'),
    storyContent: document.getElementById('storyContent'),
    storySelect: document.getElementById('storySelect'),
    currentStoryTitle: document.getElementById('currentStoryTitle'),
    currentStoryInfo: document.getElementById('currentStoryInfo'),
    themeToggle: document.getElementById('themeToggle'),
    fontSizeBtn: document.getElementById('fontSizeBtn'),
    refreshBtn: document.getElementById('refreshBtn'),
    fontSizeModal: document.getElementById('fontSizeModal'),
    closeFontModal: document.getElementById('closeFontModal'),
    fontButtons: document.querySelectorAll('.font-btn')
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    initializeFontSize();
    initializeEventListeners();
    loadAvailableStories();
    
    // Load last selected story from localStorage
    const lastStory = localStorage.getItem('lastSelectedStory');
    if (lastStory) {
        elements.storySelect.value = lastStory;
        loadSelectedStory(lastStory);
    }
});

// ==================== STORY MANAGEMENT ====================
async function loadAvailableStories() {
    try {
        showLoading();
        
        // List of potential story files to check
        const potentialStories = [
            'boardgame_1_edit.yaml',
            'junna_edit.yaml',
            'junna_1000_1.0_edit.yaml', 
            'junna_gmn_edit.yaml',
            'vol1_edit.yaml',
            'vol1_2_edit.yaml',
            'vol_2_gmn_edit.yaml',
            'vol3_4_ds_r1_edit.yaml',
            // Add more as needed...
        ];
        
        availableStories = [];
        
        // Check each potential story file
        for (const fileName of potentialStories) {
            try {
                const response = await fetch(`stories/${fileName}`, { method: 'HEAD' });
                if (response.ok) {
                    availableStories.push({
                        id: fileName.replace('.yaml', '').replace('_edit', ''),
                        title: formatStoryTitle(fileName),
                        fileName: fileName
                    });
                }
            } catch (error) {
                // File doesn't exist, skip
                continue;
            }
        }
        
        // Scan for any .yaml files in stories directory
        try {
            const indexResponse = await fetch('stories/index.json');
            if (indexResponse.ok) {
                const storyIndex = await indexResponse.json();
                availableStories = storyIndex.stories || availableStories;
            }
        } catch (error) {
            console.log('No index.json found, using default file list');
        }
        
        updateStoryDropdown();
        hideLoading();
        
    } catch (error) {
        console.error('Error loading available stories:', error);
        hideLoading();
        showError('Không thể tải danh sách truyện');
    }
}

function formatStoryTitle(fileName) {
    return fileName
        .replace('.yaml', '')
        .replace('_edit', '')
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function updateStoryDropdown() {
    // Clear existing options except the first one
    elements.storySelect.innerHTML = '<option value="">Chọn truyện...</option>';
    
    // Add available stories
    availableStories.forEach(story => {
        const option = document.createElement('option');
        option.value = story.fileName;
        option.textContent = story.title;
        elements.storySelect.appendChild(option);
    });
    
    // Update story info
    updateStoryInfo();
}

function updateStoryInfo() {
    if (!currentStory) {
        elements.currentStoryTitle.textContent = 'Chưa chọn truyện';
        elements.currentStoryInfo.textContent = '';
        return;
    }
    
    const story = availableStories.find(s => s.fileName === currentStory);
    if (story) {
        elements.currentStoryTitle.textContent = story.title;
        elements.currentStoryInfo.textContent = `${storyData.length} chương • Đang đọc`;
    }
}

async function loadSelectedStory(fileName) {
    if (!fileName) {
        clearStoryContent();
        return;
    }
    
    try {
        showLoading();
        currentStory = fileName;
        
        // Save selection to localStorage
        localStorage.setItem('lastSelectedStory', fileName);
        
        // Fetch YAML file
        const response = await fetch(`stories/${fileName}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const yamlText = await response.text();
        
        // Parse YAML
        storyData = jsyaml.load(yamlText);
        
        // Validate data
        if (!Array.isArray(storyData)) {
            throw new Error('Invalid YAML format: expected an array of chapters');
        }
        
        // Render content
        renderTableOfContents();
        renderStoryContent();
        updateStoryInfo();
        
        // Add scroll spy for TOC
        initializeScrollSpy();
        
        hideLoading();
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error loading story:', error);
        showError(`Lỗi tải truyện: ${error.message}`);
        currentStory = '';
        updateStoryInfo();
    }
}

function clearStoryContent() {
    currentStory = '';
    storyData = [];
    
    // Clear table of contents
    elements.tableOfContents.innerHTML = '<li class="no-story">Vui lòng chọn một truyện để đọc</li>';
    
    // Show welcome message
    elements.storyContent.innerHTML = `
        <div class="welcome-message">
            <i class="fas fa-book-reader"></i>
            <h2>Chào mừng đến với Story Reader!</h2>
            <p>Chọn một truyện từ dropdown menu ở trên để bắt đầu đọc.</p>
            <div class="features">
                <div class="feature">
                    <i class="fas fa-folder-plus"></i>
                    <p>Thả file YAML vào folder <code>stories/</code></p>
                </div>
                <div class="feature">
                    <i class="fas fa-magic"></i>
                    <p>Tự động detect và load truyện</p>
                </div>
                <div class="feature">
                    <i class="fas fa-palette"></i>
                    <p>Dark/Light theme với nhiều tính năng</p>
                </div>
            </div>
        </div>
    `;
    
    updateStoryInfo();
}

// ==================== THEME MANAGEMENT ====================
function initializeTheme() {
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon();
}

function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const icon = elements.themeToggle.querySelector('i');
    icon.className = currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// ==================== FONT SIZE MANAGEMENT ====================
function initializeFontSize() {
    document.body.className = document.body.className.replace(/font-\w+/g, '');
    if (currentFontSize !== 'medium') {
        document.body.classList.add(`font-${currentFontSize}`);
    }
    updateFontSizeButtons();
}

function updateFontSizeButtons() {
    elements.fontButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.size === currentFontSize);
    });
}

function changeFontSize(size) {
    currentFontSize = size;
    document.body.className = document.body.className.replace(/font-\w+/g, '');
    if (size !== 'medium') {
        document.body.classList.add(`font-${size}`);
    }
    localStorage.setItem('fontSize', size);
    updateFontSizeButtons();
}

// ==================== MODAL MANAGEMENT ====================
function showFontSizeModal() {
    elements.fontSizeModal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function hideFontSizeModal() {
    elements.fontSizeModal.classList.remove('show');
    document.body.style.overflow = '';
}

// ==================== EVENT LISTENERS ====================
function initializeEventListeners() {
    // Story selection
    elements.storySelect.addEventListener('change', (e) => {
        const selectedStory = e.target.value;
        if (selectedStory) {
            loadSelectedStory(selectedStory);
        } else {
            clearStoryContent();
        }
    });
    
    // Refresh stories
    elements.refreshBtn.addEventListener('click', () => {
        elements.refreshBtn.classList.add('loading');
        loadAvailableStories().finally(() => {
            elements.refreshBtn.classList.remove('loading');
        });
    });
    
    // Theme toggle
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // Font size modal
    elements.fontSizeBtn.addEventListener('click', showFontSizeModal);
    elements.closeFontModal.addEventListener('click', hideFontSizeModal);
    
    // Font size buttons
    elements.fontButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            changeFontSize(btn.dataset.size);
        });
    });
    
    // Close modal when clicking outside
    elements.fontSizeModal.addEventListener('click', (e) => {
        if (e.target === elements.fontSizeModal) {
            hideFontSizeModal();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // ESC to close modal
        if (e.key === 'Escape' && elements.fontSizeModal.classList.contains('show')) {
            hideFontSizeModal();
        }
        
        // Ctrl+T to toggle theme
        if (e.ctrlKey && e.key === 't') {
            e.preventDefault();
            toggleTheme();
        }
        
        // Ctrl+R to refresh stories
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            elements.refreshBtn.click();
        }
        
        // Ctrl+Plus/Minus for font size
        if (e.ctrlKey && (e.key === '+' || e.key === '=')) {
            e.preventDefault();
            const sizes = ['small', 'medium', 'large', 'xlarge'];
            const currentIndex = sizes.indexOf(currentFontSize);
            if (currentIndex < sizes.length - 1) {
                changeFontSize(sizes[currentIndex + 1]);
            }
        }
        
        if (e.ctrlKey && e.key === '-') {
            e.preventDefault();
            const sizes = ['small', 'medium', 'large', 'xlarge'];
            const currentIndex = sizes.indexOf(currentFontSize);
            if (currentIndex > 0) {
                changeFontSize(sizes[currentIndex - 1]);
            }
        }
        
        // Arrow keys for story navigation
        if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
            e.preventDefault();
            const currentIndex = Array.from(elements.storySelect.options).findIndex(
                option => option.value === currentStory
            );
            
            if (e.key === 'ArrowUp' && currentIndex > 1) {
                elements.storySelect.selectedIndex = currentIndex - 1;
                elements.storySelect.dispatchEvent(new Event('change'));
            } else if (e.key === 'ArrowDown' && currentIndex < elements.storySelect.options.length - 1) {
                elements.storySelect.selectedIndex = currentIndex + 1;
                elements.storySelect.dispatchEvent(new Event('change'));
            }
        }
    });
    
    // Smooth scrolling for TOC links
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('toc-link')) {
            e.preventDefault();
            const targetId = e.target.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                // Update active TOC link
                document.querySelectorAll('.toc-link').forEach(link => {
                    link.classList.remove('active');
                });
                e.target.classList.add('active');
                
                // Smooth scroll to target
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
}

// ==================== UI HELPERS ====================
function showLoading() {
    elements.loadingSpinner.style.display = 'flex';
    elements.loadingSpinner.classList.remove('hidden');
}

function hideLoading() {
    elements.loadingSpinner.classList.add('hidden');
    setTimeout(() => {
        elements.loadingSpinner.style.display = 'none';
    }, 300);
}

function showError(message) {
    hideLoading();
    elements.storyContent.innerHTML = `
        <div class="error-message" style="
            text-align: center; 
            padding: 3rem; 
            color: var(--accent-danger);
            background-color: var(--bg-secondary);
            border-radius: var(--radius-lg);
            border: 1px solid var(--accent-danger);
            animation: shake 0.5s ease-in-out;
        ">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
            <h2 style="margin-bottom: 1rem;">Lỗi tải dữ liệu</h2>
            <p>${message}</p>
            <button onclick="location.reload()" style="
                margin-top: 1rem;
                padding: 0.5rem 1rem;
                background-color: var(--accent-primary);
                color: white;
                border: none;
                border-radius: var(--radius-md);
                cursor: pointer;
                transition: all 0.3s ease;
            " onmouseover="this.style.backgroundColor='var(--accent-secondary)'" 
               onmouseout="this.style.backgroundColor='var(--accent-primary)'">Thử lại</button>
        </div>
    `;
}

// ==================== CONTENT RENDERING ====================
function renderTableOfContents() {
    const tocHtml = storyData.map(chapter => {
        const chapterId = generateChapterId(chapter.id);
        const shortTitle = truncateTitle(chapter.title, 30);
        
        return `
            <li class="toc-item">
                <a href="#${chapterId}" class="toc-link" title="${escapeHtml(chapter.title)}">
                    ${escapeHtml(shortTitle)}
                </a>
            </li>
        `;
    }).join('');
    
    elements.tableOfContents.innerHTML = tocHtml;
}

function renderStoryContent() {
    const contentHtml = storyData.map(chapter => {
        const chapterId = generateChapterId(chapter.id);
        
        return `
            <div class="chapter" id="${chapterId}">
                <h1 class="chapter-title">${escapeHtml(chapter.title)}</h1>
                <div class="chapter-content">${formatContent(chapter.content)}</div>
            </div>
        `;
    }).join('');
    
    elements.storyContent.innerHTML = contentHtml;
}

// ==================== UTILITY FUNCTIONS ====================
function generateChapterId(id) {
    return id.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
}

function truncateTitle(title, maxLength) {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatContent(content) {
    // Split content into paragraphs and format
    const paragraphs = content.split('\n\n').filter(p => p.trim());
    
    return paragraphs.map(paragraph => {
        const trimmed = paragraph.trim();
        if (!trimmed) return '';
        
        // Format dialogue with special styling
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
            return `<p class="dialogue">${escapeHtml(trimmed)}</p>`;
        }
        
        // Format thoughts/internal monologue
        if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
            return `<p class="thought">${escapeHtml(trimmed)}</p>`;
        }
        
        return `<p>${escapeHtml(trimmed)}</p>`;
    }).join('');
}

// ==================== SCROLL SPY ====================
function initializeScrollSpy() {
    const chapters = document.querySelectorAll('.chapter');
    const tocLinks = document.querySelectorAll('.toc-link');
    
    if (chapters.length === 0) return;
    
    const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const chapterId = entry.target.id;
                
                // Update active TOC link
                tocLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${chapterId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, observerOptions);
    
    chapters.forEach(chapter => {
        observer.observe(chapter);
    });
}

// ==================== ADDITIONAL FEATURES ====================
// Auto-save reading position
function saveReadingPosition() {
    if (!currentStory) return;
    
    const activeChapter = document.querySelector('.chapter:not([style*="display: none"])');
    if (activeChapter) {
        localStorage.setItem(`reading_position_${currentStory}`, activeChapter.id);
    }
}

function restoreReadingPosition() {
    if (!currentStory) return;
    
    const savedPosition = localStorage.getItem(`reading_position_${currentStory}`);
    if (savedPosition) {
        const targetElement = document.getElementById(savedPosition);
        if (targetElement) {
            setTimeout(() => {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 500);
        }
    }
}

// Save position on scroll
let savePositionTimeout;
window.addEventListener('scroll', () => {
    clearTimeout(savePositionTimeout);
    savePositionTimeout = setTimeout(saveReadingPosition, 1000);
});

// ==================== DYNAMIC STYLES ====================
const additionalStyles = `
<style>
.dialogue {
    font-style: italic;
    padding-left: 1rem;
    border-left: 3px solid var(--accent-primary);
    background-color: rgba(88, 166, 255, 0.05);
    margin: var(--spacing-md) 0;
    border-radius: 0 var(--radius-md) var(--radius-md) 0;
}

.thought {
    font-style: italic;
    color: var(--text-secondary);
    padding: var(--spacing-sm) var(--spacing-md);
    background-color: rgba(139, 148, 158, 0.1);
    border-radius: var(--radius-md);
    margin: var(--spacing-md) 0;
}

@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
}

.reading-progress {
    position: fixed;
    top: 0;
    left: 0;
    width: 0%;
    height: 3px;
    background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
    z-index: 1002;
    transition: width 0.3s ease;
}

.chapter {
    scroll-margin-top: 100px;
}

@media print {
    .header, .navigation, .footer, .controls {
        display: none !important;
    }
    
    .container {
        grid-template-areas: "main";
        grid-template-columns: 1fr;
    }
    
    .main-content {
        padding: 0;
    }
    
    .story-content {
        box-shadow: none;
        border: none;
    }
    
    .chapter {
        break-inside: avoid;
        page-break-inside: avoid;
    }
}
</style>
`;

// Initialize additional features
document.addEventListener('DOMContentLoaded', function() {
    // Add additional styles
    document.head.insertAdjacentHTML('beforeend', additionalStyles);
    
    // Add reading progress bar
    const progressBar = document.createElement('div');
    progressBar.className = 'reading-progress';
    document.body.appendChild(progressBar);
    
    // Update progress on scroll
    window.addEventListener('scroll', debounce(() => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        progressBar.style.width = scrolled + '%';
    }, 10));
});

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
} 