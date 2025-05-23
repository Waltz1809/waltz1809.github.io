// ==================== GLOBAL VARIABLES ====================
let storyData = [];
let currentTheme = localStorage.getItem('theme') || 'dark';
let currentFontSize = localStorage.getItem('fontSize') || 'medium';

// ==================== DOM ELEMENTS ====================
const elements = {
    loadingSpinner: document.getElementById('loadingSpinner'),
    tableOfContents: document.getElementById('tableOfContents'),
    storyContent: document.getElementById('storyContent'),
    themeToggle: document.getElementById('themeToggle'),
    fontSizeBtn: document.getElementById('fontSizeBtn'),
    fontSizeModal: document.getElementById('fontSizeModal'),
    closeFontModal: document.getElementById('closeFontModal'),
    fontButtons: document.querySelectorAll('.font-btn')
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    initializeFontSize();
    initializeEventListeners();
    loadStoryData();
});

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

// ==================== DATA LOADING ====================
async function loadStoryData() {
    try {
        showLoading();
        
        // Fetch YAML file
        const response = await fetch('data.yaml');
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
        
        // Add scroll spy for TOC
        initializeScrollSpy();
        
        hideLoading();
        
    } catch (error) {
        console.error('Error loading story data:', error);
        showError(error.message);
    }
}

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
            ">Thử lại</button>
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

// ==================== ADDITIONAL STYLES FOR CONTENT ====================
// Add these styles dynamically
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

.error-message {
    animation: shake 0.5s ease-in-out;
}

@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
}

/* Reading progress indicator */
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

/* Smooth animations for content */
.chapter {
    scroll-margin-top: 100px;
}

/* Print styles */
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

// Add reading progress indicator
document.addEventListener('DOMContentLoaded', function() {
    // Add additional styles
    document.head.insertAdjacentHTML('beforeend', additionalStyles);
    
    // Add reading progress bar
    const progressBar = document.createElement('div');
    progressBar.className = 'reading-progress';
    document.body.appendChild(progressBar);
    
    // Update progress on scroll
    window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        progressBar.style.width = scrolled + '%';
    });
});

// ==================== PERFORMANCE OPTIMIZATIONS ====================
// Debounce function for scroll events
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

// Optimize scroll events
window.addEventListener('scroll', debounce(() => {
    // Update reading progress
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    const progressBar = document.querySelector('.reading-progress');
    if (progressBar) {
        progressBar.style.width = scrolled + '%';
    }
}, 10));

// Service Worker for offline support (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
} 