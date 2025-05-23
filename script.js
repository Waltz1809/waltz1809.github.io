// ==================== GLOBAL VARIABLES ====================
let storyData = [];
let rawData = [];
let availableStories = [];
let currentStory = '';
let currentTheme = localStorage.getItem('theme') || 'dark';
let currentFontSize = localStorage.getItem('fontSize') || 'medium';
let isComparisonMode = false;
let isLazyLoading = false;

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
    fontButtons: document.querySelectorAll('.font-btn'),
    navigation: document.getElementById('navigation'),
    toggleSidebar: document.getElementById('toggleSidebar'),
    toggleSidebarMain: document.getElementById('toggleSidebarMain'),
    singleViewBtn: document.getElementById('singleViewBtn'),
    splitViewBtn: document.getElementById('splitViewBtn'),
    container: document.querySelector('.container')
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    initializeFontSize();
    initializeEventListeners();
    initializeSidebar();
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
        
        // Try to load from index.json first (with cache busting)
        try {
            const timestamp = Date.now();
            const indexResponse = await fetch(`stories/index.json?v=${timestamp}`);
            if (indexResponse.ok) {
                const storyIndex = await indexResponse.json();
                availableStories = storyIndex.stories || [];
                
                console.log('Loaded stories from index.json:', availableStories);
                
                // Add raw support info
                if (storyIndex.has_raw_support) {
                    console.log(`📄 Raw support enabled: ${storyIndex.raw_count} raw files`);
                }
                
                updateStoryDropdown();
                hideLoading();
                return;
            }
        } catch (error) {
            console.log('No index.json found, scanning manually...', error);
        }
        
        // Fallback: Manual file detection
        const potentialStories = [
            'boardgame_1_edit.yaml',
            'junna_edit.yaml',
            'test_genben_vol3_edit.yaml',
            // Add more as needed...
        ];
        
        availableStories = [];
        
        for (const fileName of potentialStories) {
            try {
                const response = await fetch(`stories/${fileName}`, { method: 'HEAD' });
                if (response.ok) {
                    availableStories.push({
                        id: fileName.replace('.yaml', '').replace('_edit', ''),
                        title: formatStoryTitle(fileName),
                        fileName: fileName,
                        hasRaw: false
                    });
                }
            } catch (error) {
                continue;
            }
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
    
    console.log('Updating dropdown with stories:', availableStories);
    
    // Add available stories
    availableStories.forEach(story => {
        console.log(`Story: ${story.title}, hasRaw: ${story.hasRaw}, isLarge: ${story.isLarge}`);
        
        const option = document.createElement('option');
        option.value = story.fileName;
        
        // Add indicators for large files and raw support
        let title = story.title;
        if (story.isLarge) title += ' ⚠️';
        if (story.hasRaw) title += ' 🔄';
        
        option.textContent = title;
        option.dataset.hasRaw = story.hasRaw || false;
        option.dataset.isLarge = story.isLarge || false;
        
        elements.storySelect.appendChild(option);
    });
    
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
        let title = story.title;
        let info = `${storyData.length} chương`;
        
        if (story.description) {
            info = story.description;
        }
        
        if (isComparisonMode) {
            title += ' (So sánh)';
            info += ' • Raw vs Edited';
        }
        
        elements.currentStoryTitle.textContent = title;
        elements.currentStoryInfo.textContent = info;
    }
}

async function loadSelectedStory(fileName, forceReload = false) {
    if (!fileName) {
        clearStoryContent();
        return;
    }
    
    try {
        showLoading();
        currentStory = fileName;
        isComparisonMode = false;
        
        // Save selection to localStorage
        localStorage.setItem('lastSelectedStory', fileName);
        
        // Check if it's a large file
        const story = availableStories.find(s => s.fileName === fileName);
        const isLarge = story?.isLarge || false;
        
        if (isLarge && !forceReload) {
            await loadStoryWithLazyLoading(fileName);
        } else {
            await loadStoryNormal(fileName);
        }
        
        updateStoryInfo();
        updateViewControls();
        
        hideLoading();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error loading story:', error);
        showError(`Lỗi tải truyện: ${error.message}`);
        currentStory = '';
        updateStoryInfo();
    }
}

async function loadStoryNormal(fileName) {
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
    initializeScrollSpy();
}

async function loadStoryWithLazyLoading(fileName) {
    isLazyLoading = true;
    
    // Show warning for large files
    showLargeFileWarning();
    
    // Load first 50 chapters only
    const response = await fetch(`stories/${fileName}`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const yamlText = await response.text();
    const fullData = jsyaml.load(yamlText);
    
    if (!Array.isArray(fullData)) {
        throw new Error('Invalid YAML format: expected an array of chapters');
    }
    
    // Load first batch
    storyData = fullData.slice(0, 50);
    
    // Store full data for lazy loading
    window.fullStoryData = fullData;
    
    renderTableOfContents(true); // Indicate more content available
    renderStoryContent();
    initializeScrollSpy();
    
    // Add load more button
    addLoadMoreButton();
}

function showLargeFileWarning() {
    const warning = document.createElement('div');
    warning.className = 'large-file-warning';
    warning.innerHTML = `
        <div class="warning-content">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>File lớn được phát hiện</h3>
            <p>Truyện này có nhiều chương. Chúng tôi sẽ tải từng phần để tăng hiệu suất.</p>
        </div>
    `;
    
    elements.storyContent.appendChild(warning);
    
    setTimeout(() => warning.remove(), 3000);
}

function addLoadMoreButton() {
    if (!window.fullStoryData || storyData.length >= window.fullStoryData.length) {
        return;
    }
    
    const loadMoreBtn = document.createElement('button');
    loadMoreBtn.className = 'load-more-btn';
    loadMoreBtn.innerHTML = `
        <i class="fas fa-plus"></i>
        Tải thêm chương (${storyData.length}/${window.fullStoryData.length})
    `;
    
    loadMoreBtn.addEventListener('click', loadMoreChapters);
    
    elements.storyContent.appendChild(loadMoreBtn);
}

function loadMoreChapters() {
    if (!window.fullStoryData) return;
    
    const currentLength = storyData.length;
    const nextBatch = window.fullStoryData.slice(currentLength, currentLength + 50);
    
    storyData = storyData.concat(nextBatch);
    
    // Re-render
    renderTableOfContents(storyData.length < window.fullStoryData.length);
    renderStoryContent();
    initializeScrollSpy();
    
    // Update load more button
    const existingBtn = document.querySelector('.load-more-btn');
    if (existingBtn) existingBtn.remove();
    addLoadMoreButton();
    
    updateStoryInfo();
}

async function loadRawComparisonOptimized() {
    const story = availableStories.find(s => s.fileName === currentStory);
    if (!story?.hasRaw) return;
    
    try {
        showLoading();
        
        console.log(`🔄 Loading raw file with optimization: ${story.rawFileName}`);
        
        // Get unique IDs from current story to reduce search space
        const currentStoryIds = new Set(storyData.map(item => item.id).filter(Boolean));
        console.log(`🎯 Looking for ${currentStoryIds.size} specific IDs`);
        
        // Show progress for large files
        const progressContainer = document.createElement('div');
        progressContainer.className = 'raw-loading-progress';
        progressContainer.innerHTML = `
            <div class="progress-content">
                <i class="fas fa-search"></i>
                <h3>Đang tìm kiếm segments...</h3>
                <p>Filtering ${currentStoryIds.size} IDs từ file raw lớn</p>
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
                <div id="progressText">Đang tải...</div>
            </div>
        `;
        document.body.appendChild(progressContainer);
        
        // Load and parse raw data with streaming approach
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for large files
        
        const rawResponse = await fetch(`raw/${story.rawFileName}`, {
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!rawResponse.ok) {
            throw new Error(`HTTP error! status: ${rawResponse.status}`);
        }
        
        const fileSize = rawResponse.headers.get('content-length');
        console.log(`📦 Raw file size: ${fileSize ? (fileSize / 1024 / 1024).toFixed(1) : 'Unknown'} MB`);
        
        // Update progress
        const progressText = document.getElementById('progressText');
        if (progressText) progressText.textContent = 'Đang tải raw data...';
        
        const rawYamlText = await rawResponse.text();
        console.log(`📝 Raw YAML text length: ${(rawYamlText.length / 1024 / 1024).toFixed(1)} MB`);
        
        // Update progress
        if (progressText) progressText.textContent = 'Đang parse YAML...';
        
        // Parse in chunks to avoid blocking UI
        const fullRawData = await parseYamlInChunks(rawYamlText, progressText);
        
        if (!Array.isArray(fullRawData)) {
            throw new Error('Invalid raw YAML format - not an array');
        }
        
        console.log(`📊 Full raw data: ${fullRawData.length} segments`);
        
        // Filter only needed segments
        if (progressText) progressText.textContent = 'Đang filter segments...';
        
        rawData = fullRawData.filter(segment => currentStoryIds.has(segment.id));
        
        console.log(`✅ Filtered raw data: ${rawData.length}/${fullRawData.length} segments`);
        
        // Log matching statistics
        const matchCount = rawData.length;
        const totalNeeded = currentStoryIds.size;
        console.log(`🎯 Match rate: ${matchCount}/${totalNeeded} (${(matchCount/totalNeeded*100).toFixed(1)}%)`);
        
        // Remove progress indicator
        progressContainer.remove();
        
        isComparisonMode = true;
        renderComparisonView();
        updateStoryInfo();
        
        hideLoading();
        
    } catch (error) {
        console.error('❌ Error loading optimized raw data:', error);
        
        // Remove progress indicator if exists
        const progressContainer = document.querySelector('.raw-loading-progress');
        if (progressContainer) progressContainer.remove();
        
        if (error.name === 'AbortError') {
            showError('⏱️ Timeout: File raw quá lớn, vui lòng thử lại sau hoặc liên hệ admin');
        } else {
            showError(`Lỗi tải raw data: ${error.message}`);
        }
        hideLoading();
    }
}

async function parseYamlInChunks(yamlText, progressElement) {
    return new Promise((resolve, reject) => {
        // Use setTimeout to yield control and update UI
        setTimeout(() => {
            try {
                if (progressElement) progressElement.textContent = 'Parsing YAML (có thể mất vài giây)...';
                
                const result = jsyaml.load(yamlText);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        }, 100);
    });
}

function normalizeId(id) {
    if (!id) return '';
    
    // Normalize common patterns
    return id
        .toLowerCase()
        .replace(/[_\-\s]+/g, '_')  // Standardize separators
        .replace(/^volume_?/i, 'vol_')  // volume -> vol
        .replace(/chapter_?/i, 'ch_')   // chapter -> ch  
        .replace(/segment_?/i, 'seg_')  // segment -> seg
        .trim();
}

function findBestMatch(targetId, rawData) {
    const normalizedTarget = normalizeId(targetId);
    
    // 1. Exact match
    let match = rawData.find(item => item.id === targetId);
    if (match) return { match, type: 'exact' };
    
    // 2. Normalized match
    match = rawData.find(item => normalizeId(item.id) === normalizedTarget);
    if (match) return { match, type: 'normalized' };
    
    // 3. Partial match (for volume/chapter patterns)
    const targetParts = normalizedTarget.split('_');
    if (targetParts.length >= 3) {
        const partialPattern = targetParts.slice(0, 3).join('_'); // vol_x_ch_y
        match = rawData.find(item => {
            const itemNormalized = normalizeId(item.id);
            return itemNormalized.startsWith(partialPattern);
        });
        if (match) return { match, type: 'partial' };
    }
    
    return { match: null, type: 'none' };
}

function renderComparisonView() {
    // Create a map of raw data by ID for efficient lookup
    const rawDataMap = new Map();
    const normalizedRawMap = new Map();
    
    rawData.forEach(segment => {
        if (segment.id) {
            rawDataMap.set(segment.id, segment);
            normalizedRawMap.set(normalizeId(segment.id), segment);
        }
    });
    
    console.log(`Raw data map created with ${rawDataMap.size} segments`);
    
    let exactMatches = 0;
    let normalizedMatches = 0;
    let partialMatches = 0;
    let noMatches = 0;
    
    // Render comparison content
    const contentHtml = storyData.map((chapter, index) => {
        const chapterId = generateChapterId(chapter.id);
        
        // Try different matching strategies
        const matchResult = findBestMatch(chapter.id, rawData);
        const rawChapter = matchResult.match;
        const matchType = matchResult.type;
        
        // Count match types
        switch(matchType) {
            case 'exact': exactMatches++; break;
            case 'normalized': normalizedMatches++; break;
            case 'partial': partialMatches++; break;
            default: noMatches++; break;
        }
        
        let matchStatusHtml = '';
        if (rawChapter) {
            const matchTypeText = {
                'exact': '✓ Exact',
                'normalized': '≈ Normalized', 
                'partial': '~ Partial'
            }[matchType] || '?';
            
            matchStatusHtml = `<span class="match-status match-found">${matchTypeText}</span>`;
        } else {
            matchStatusHtml = `<span class="match-status match-missing">✗ Missing</span>`;
        }
        
        return `
            <div class="chapter comparison-chapter" id="${chapterId}">
                <h1 class="chapter-title">
                    ${escapeHtml(chapter.title)}
                    <span class="chapter-id">ID: ${escapeHtml(chapter.id)}</span>
                </h1>
                <div class="comparison-container">
                    <div class="comparison-panel edited-panel">
                        <h3><i class="fas fa-edit"></i> Đã chỉnh sửa</h3>
                        <div class="chapter-content">${formatContent(chapter.content)}</div>
                    </div>
                    <div class="comparison-panel raw-panel">
                        <h3>
                            <i class="fas fa-file-alt"></i> Raw 
                            ${matchStatusHtml}
                        </h3>
                        <div class="chapter-content">
                            ${rawChapter ? 
                                `<div class="raw-id">Raw ID: ${escapeHtml(rawChapter.id)}</div>
                                 ${formatContent(rawChapter.content)}` : 
                                `<p class="no-raw">Không tìm thấy segment raw với ID: <code>${escapeHtml(chapter.id)}</code></p>`
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Log match statistics
    console.log(`📊 Match Statistics:
        ✓ Exact: ${exactMatches}
        ≈ Normalized: ${normalizedMatches}  
        ~ Partial: ${partialMatches}
        ✗ Missing: ${noMatches}
        Total: ${storyData.length}`);
    
    elements.storyContent.innerHTML = contentHtml;
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
    
    // Sidebar toggle - cả hai nút
    elements.toggleSidebar.addEventListener('click', (e) => {
        console.log('🔘 Main sidebar toggle clicked');
        toggleSidebar();
    });
    
    elements.toggleSidebarMain.addEventListener('click', (e) => {
        console.log('🔘 Backup sidebar toggle clicked');
        toggleSidebar();
    });
    
    // View controls
    elements.singleViewBtn.addEventListener('click', switchToSingleView);
    elements.splitViewBtn.addEventListener('click', switchToSplitView);
    
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
        
        // Ctrl+B to toggle sidebar
        if (e.ctrlKey && e.key === 'b') {
            e.preventDefault();
            console.log('⌨️ Keyboard shortcut: Ctrl+B sidebar toggle');
            toggleSidebar();
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
        
        // Ctrl+1/2 for view switching
        if (e.ctrlKey && e.key === '1') {
            e.preventDefault();
            switchToSingleView();
        }
        
        if (e.ctrlKey && e.key === '2') {
            e.preventDefault();
            switchToSplitView();
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
function renderTableOfContents(hasMoreContent = false) {
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
    
    let finalHtml = tocHtml;
    
    if (hasMoreContent) {
        finalHtml += `
            <li class="toc-item more-content">
                <span class="toc-more">
                    <i class="fas fa-ellipsis-h"></i> Còn nhiều chương khác...
                </span>
            </li>
        `;
    }
    
    elements.tableOfContents.innerHTML = finalHtml;
}

function renderStoryContent() {
    const contentHtml = storyData.map(chapter => {
        const chapterId = generateChapterId(chapter.id);
        
        return `
            <div class="chapter" id="${chapterId}">
                <h1 class="chapter-title">
                    ${escapeHtml(chapter.title)}
                    <span class="chapter-id">ID: ${escapeHtml(chapter.id)}</span>
                </h1>
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

function clearStoryContent() {
    currentStory = '';
    storyData = [];
    rawData = [];
    isComparisonMode = false;
    isLazyLoading = false;
    
    // Clear any existing data
    if (window.fullStoryData) {
        delete window.fullStoryData;
    }
    
    // Reset view controls
    elements.singleViewBtn.classList.add('active');
    elements.splitViewBtn.classList.remove('active');
    elements.splitViewBtn.style.display = 'none';
    
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
                    <i class="fas fa-columns"></i>
                    <p>So sánh raw vs edited với folder <code>raw/</code></p>
                </div>
            </div>
        </div>
    `;
    
    updateStoryInfo();
}

// ==================== SIDEBAR MANAGEMENT ====================
function initializeSidebar() {
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (sidebarCollapsed) {
        elements.container.classList.add('sidebar-collapsed');
        updateSidebarToggleState(true);
    }
}

function toggleSidebar() {
    const isCollapsed = elements.container.classList.toggle('sidebar-collapsed');
    localStorage.setItem('sidebarCollapsed', isCollapsed);
    
    updateSidebarToggleState(isCollapsed);
    
    // Add some visual feedback
    if (isCollapsed) {
        console.log('📱 Sidebar collapsed - nút backup xuất hiện');
    } else {
        console.log('📱 Sidebar expanded - nút backup ẩn đi');
    }
}

function updateSidebarToggleState(isCollapsed) {
    // Update main sidebar toggle button
    const mainIcon = elements.toggleSidebar.querySelector('i');
    const mainButton = elements.toggleSidebar;
    
    // Update backup sidebar toggle button  
    const backupIcon = elements.toggleSidebarMain.querySelector('i');
    const backupButton = elements.toggleSidebarMain;
    
    if (isCollapsed) {
        // Sidebar ẩn - cập nhật nút backup
        mainIcon.className = 'fas fa-chevron-right';
        mainButton.title = 'Hiện mục lục';
        
        backupIcon.className = 'fas fa-chevron-right';
        backupButton.title = 'Hiện mục lục';
        backupButton.setAttribute('data-tooltip', 'Click để hiện sidebar');
    } else {
        // Sidebar hiện - cập nhật nút chính
        mainIcon.className = 'fas fa-bars';
        mainButton.title = 'Ẩn mục lục';
        
        backupIcon.className = 'fas fa-chevron-right';
        backupButton.title = 'Hiện mục lục';
        backupButton.removeAttribute('data-tooltip');
    }
}

// ==================== VIEW MANAGEMENT ====================
function updateViewControls() {
    const story = availableStories.find(s => s.fileName === currentStory);
    const hasRaw = story?.hasRaw || false;
    
    console.log('Updating view controls, hasRaw:', hasRaw);
    
    if (hasRaw) {
        elements.splitViewBtn.style.display = 'flex';
    } else {
        elements.splitViewBtn.style.display = 'none';
        // Switch back to single view if no raw
        if (isComparisonMode) {
            switchToSingleView();
        }
    }
}

function switchToSingleView() {
    isComparisonMode = false;
    rawData = [];
    
    elements.singleViewBtn.classList.add('active');
    elements.splitViewBtn.classList.remove('active');
    
    renderTableOfContents();
    renderStoryContent();
    updateStoryInfo();
    
    console.log('Switched to single view');
}

function switchToSplitView() {
    const story = availableStories.find(s => s.fileName === currentStory);
    if (!story?.hasRaw) {
        console.log('No raw file available for split view');
        return;
    }
    
    elements.singleViewBtn.classList.remove('active');
    elements.splitViewBtn.classList.add('active');
    
    // Use optimized loading
    loadRawComparisonOptimized();
    
    console.log('Switching to split view with optimization');
}