// ===== STORY READER ENGINE =====
class StoryReader {
    constructor() {
        this.currentStory = null;
        this.currentChapter = null;
        this.currentPage = 1;
        this.totalPages = 1;
        this.chapterData = null;
        this.pageContent = []; // Store content split into pages
        this.stories = [];
        this.chapters = [];
        this.settings = {
            fontSize: 16,
            theme: 'dark',
            wordsPerPage: 800 // Approximately words per page
        };
        
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Story Reader...');
        try {
            this.loadSettings();
            this.bindEvents();
            this.handleRouting();
            
            // Add timeout for loading stories
            const loadingPromise = this.loadStories();
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Loading timeout')), 10000)
            );
            
            await Promise.race([loadingPromise, timeoutPromise]);
            console.log('✅ Story Reader initialized successfully');
        } catch (error) {
            console.error('❌ Story Reader initialization failed:', error);
            this.showError(`Lỗi khởi tạo: ${error.message}`);
        }
    }

    // ===== SETTINGS MANAGEMENT =====
    loadSettings() {
        const saved = localStorage.getItem('storyReaderSettings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
        this.applySettings();
    }

    saveSettings() {
        localStorage.setItem('storyReaderSettings', JSON.stringify(this.settings));
    }

    applySettings() {
        document.body.className = `${this.settings.theme}-theme`;
        document.documentElement.style.setProperty('--reading-font-size', `${this.settings.fontSize}px`);
        
        // Update active buttons
        document.querySelectorAll('.btn-font-size').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.size == this.settings.fontSize);
        });
        document.querySelectorAll('.btn-theme').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === this.settings.theme);
        });
        document.querySelectorAll('.btn-words-per-page').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.words == this.settings.wordsPerPage);
        });
    }

    // ===== EVENT BINDING =====
    bindEvents() {
        // Navigation
        document.getElementById('back-to-stories').addEventListener('click', () => this.showStorySelection());
        document.getElementById('back-to-chapters').addEventListener('click', () => this.showChapterSelection());
        
        // Reader controls
        document.getElementById('prev-page').addEventListener('click', () => this.previousPage());
        document.getElementById('next-page').addEventListener('click', () => this.nextPage());
        document.getElementById('touch-left').addEventListener('click', () => this.previousPage());
        document.getElementById('touch-right').addEventListener('click', () => this.nextPage());
        
        // Settings
        document.getElementById('settings-toggle').addEventListener('click', () => this.toggleSettings());
        document.getElementById('close-settings').addEventListener('click', () => this.toggleSettings());
        
        // Settings controls
        document.querySelectorAll('.btn-font-size').forEach(btn => {
            btn.addEventListener('click', () => this.changeFontSize(parseInt(btn.dataset.size)));
        });
        
        document.querySelectorAll('.btn-theme').forEach(btn => {
            btn.addEventListener('click', () => this.changeTheme(btn.dataset.theme));
        });
        
        document.querySelectorAll('.btn-words-per-page').forEach(btn => {
            btn.addEventListener('click', () => this.changeWordsPerPage(parseInt(btn.dataset.words)));
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (this.isReaderActive()) {
                switch(e.key) {
                    case 'ArrowLeft':
                    case 'ArrowUp':
                        e.preventDefault();
                        this.previousPage();
                        break;
                    case 'ArrowRight':
                    case 'ArrowDown':
                    case ' ':
                        e.preventDefault();
                        this.nextPage();
                        break;
                    case 'Escape':
                        this.showChapterSelection();
                        break;
                }
            }
        });

        // Touch events for mobile
        let touchStartX = 0;
        let touchStartY = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            if (!this.isReaderActive()) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const diffX = touchStartX - touchEndX;
            const diffY = touchStartY - touchEndY;
            
            // Only process horizontal swipes (ignore vertical scrolling)
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                e.preventDefault();
                if (diffX > 0) {
                    this.nextPage(); // Swipe left = next page
                } else {
                    this.previousPage(); // Swipe right = previous page
                }
            }
        }, { passive: false });
    }

    // ===== ROUTING =====
    handleRouting() {
        const hash = window.location.hash.slice(1);
        if (hash) {
            const parts = hash.split('/');
            if (parts.length >= 2) {
                const story = parts[0];
                const chapter = parseInt(parts[1]);
                const page = parts[2] ? parseInt(parts[2]) : 1;
                
                this.loadStoryFromUrl(story, chapter, page);
            }
        }
    }

    updateUrl() {
        if (this.currentStory && this.currentChapter) {
            const hash = `#${this.currentStory}/${this.currentChapter}/${this.currentPage}`;
            window.history.replaceState(null, '', hash);
        }
    }

    // ===== DATA LOADING =====
    async loadStories() {
        console.log('Loading stories...');
        this.showLoading(true);
        try {
            // Try multiple URL patterns for GitHub Pages compatibility
            const urlPatterns = [
                'data/stories.json',
                './data/stories.json'
            ];
            
            let response = null;
            let lastError = null;
            
            for (const url of urlPatterns) {
                try {
                    console.log('Trying stories URL:', url);
                    response = await fetch(url);
                    console.log(`Stories response for ${url}:`, response.status, response.ok);
                    
                    if (response.ok) {
                        console.log('✅ Success loading stories from:', url);
                        break;
                    } else {
                        lastError = new Error(`HTTP ${response.status} for ${url}`);
                    }
                } catch (fetchError) {
                    console.log(`❌ Error loading stories from ${url}:`, fetchError.message);
                    lastError = fetchError;
                    response = null;
                }
            }
            
            if (!response || !response.ok) {
                throw lastError || new Error('Cannot load stories configuration');
            }
            
            const config = await response.json();
            console.log('Stories config loaded:', config);
            this.stories = config.stories;
            
            // Use chapter count from stories.json, only count if needed
            for (const story of this.stories) {
                console.log(`Checking chapters for story: ${story.id}`);
                if (!story.chapters || story.chapters === 0) {
                    console.log(`Need to count chapters for: ${story.id}`);
                    story.chapters = await this.getChapterCount(story.id);
                } else {
                    console.log(`Using existing chapter count for ${story.id}: ${story.chapters}`);
                }
                console.log(`Story ${story.id} has ${story.chapters} chapters`);
            }
            
            console.log('Rendering story list...');
            this.renderStoryList();
        } catch (error) {
            console.error('Error loading stories:', error);
            console.log('Trying fallback data...');
            
            // Fallback: create default story data
            try {
                this.stories = [
                    {
                        id: 'marriage',
                        title: 'Marriage Novel - Truyện Hôn Nhân',
                        description: 'Một câu chuyện tình yêu đầy cảm động về hành trình tìm lại bản thân và tình yêu đích thực...',
                        author: 'Tác giả ẩn danh',
                        status: 'Đang cập nhật',
                        chapters: 1,
                        tags: ['Romance', 'Drama', 'Modern']
                    }
                ];
                
                // Update chapter count
                for (const story of this.stories) {
                    story.chapters = await this.getChapterCount(story.id);
                }
                
                this.renderStoryList();
                console.log('Fallback data loaded successfully');
            } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError);
                
                // Ultimate fallback - create test data
                console.log('Using ultimate fallback data...');
                this.stories = [
                    {
                        id: 'marriage',
                        title: 'Marriage Novel - Truyện Hôn Nhân',
                        description: 'Một câu chuyện tình yêu đầy cảm động...',
                        author: 'Tác giả ẩn danh',
                        status: 'Đang cập nhật - 494 chương',
                        chapters: 494, // Known from file structure
                        tags: ['Romance', 'Drama', 'Modern']
                    }
                ];
                
                this.renderStoryList();
                console.log('Ultimate fallback data loaded successfully');
            }
        } finally {
            this.showLoading(false);
        }
    }

    async getChapterCount(storyId) {
        console.log(`Checking chapters for story: ${storyId}`);
        try {
            // Try different URL patterns for first chapter
            const urlPatterns = [
                `data/${storyId}/chapter_001.json`,
                `./data/${storyId}/chapter_001.json`
            ];
            
            let testResponse = null;
            for (const url of urlPatterns) {
                try {
                    testResponse = await fetch(url);
                    if (testResponse.ok) {
                        console.log(`✅ Found chapters using pattern: ${url}`);
                        break;
                    }
                } catch (e) {
                    console.log(`❌ Pattern failed: ${url}`);
                }
            }
            
            if (!testResponse || !testResponse.ok) {
                console.log(`No chapters found for story: ${storyId}`);
                return 0;
            }
            
            // Fast counting by using known values
            let count = 0;
            if (storyId === 'marriage') {
                count = 494; // Known from your file structure
                console.log(`Using known chapter count for ${storyId}: ${count}`);
            } else {
                // For new stories, count properly but with limits
                console.log(`Counting chapters for unknown story: ${storyId}...`);
                for (let i = 1; i <= 100; i++) { // Limit to 100 for performance
                    const chapterNum = String(i).padStart(3, '0');
                    try {
                        const response = await fetch(`data/${storyId}/chapter_${chapterNum}.json`);
                        if (response.ok) {
                            count = i;
                        } else {
                            console.log(`Chapter ${i} not found for ${storyId}, stopping count at ${count}`);
                            break;
                        }
                    } catch (fetchError) {
                        console.log(`Error fetching chapter ${i}:`, fetchError);
                        break;
                    }
                }
            }
            
            console.log(`Total chapters for ${storyId}: ${count}`);
            return count;
        } catch (error) {
            console.error('Error counting chapters:', error);
            return 0;
        }
    }

    async loadChapterList(storyId) {
        this.showLoading(true);
        try {
            const story = this.stories.find(s => s.id === storyId);
            if (!story) throw new Error('Story not found');
            
            this.chapters = [];
            for (let i = 1; i <= story.chapters; i++) {
                const chapterNum = String(i).padStart(3, '0');
                try {
                    const response = await fetch(`data/${storyId}/chapter_${chapterNum}.json`);
                    if (response.ok) {
                        const data = await response.json();
                        this.chapters.push({
                            number: i,
                            title: data.chapter_title,
                            segments: data.total_segments
                        });
                    }
                } catch (error) {
                    console.error(`Error loading chapter ${i}:`, error);
                }
            }
            
            this.currentStory = storyId;
            this.renderChapterList();
        } catch (error) {
            console.error('Error loading chapters:', error);
            this.showError('Không thể tải danh sách chương');
        } finally {
            this.showLoading(false);
        }
    }

    async loadChapter(chapterNumber) {
        console.log(`=== Loading Chapter ${chapterNumber} ===`);
        console.log('Current story:', this.currentStory);
        
        if (!this.currentStory) {
            throw new Error('No story selected');
        }
        
        this.showLoading(true);
        try {
            const chapterNum = String(chapterNumber).padStart(3, '0');
            
            // Try multiple URL patterns for GitHub Pages compatibility
            const urlPatterns = [
                `data/${this.currentStory}/chapter_${chapterNum}.json`,
                `./data/${this.currentStory}/chapter_${chapterNum}.json`
            ];
            
            let response = null;
            let lastError = null;
            
            for (const url of urlPatterns) {
                try {
                    console.log('Trying URL:', url);
                    response = await fetch(url);
                    console.log(`Response for ${url}:`, response.status, response.ok);
                    
                    if (response.ok) {
                        console.log('✅ Success with URL:', url);
                        break;
                    } else {
                        lastError = new Error(`HTTP ${response.status} for ${url}`);
                    }
                } catch (fetchError) {
                    console.log(`❌ Error with ${url}:`, fetchError.message);
                    lastError = fetchError;
                    response = null;
                }
            }
            
            if (!response || !response.ok) {
                throw lastError || new Error(`Chapter ${chapterNumber} not found`);
            }
            
            this.chapterData = await response.json();
            console.log('Chapter data loaded:', this.chapterData);
            console.log('Segments:', this.chapterData.segments?.length);
            
            if (!this.chapterData.segments || this.chapterData.segments.length === 0) {
                throw new Error('Chapter data is empty or invalid');
            }
            
            this.currentChapter = chapterNumber;
            this.currentPage = 1;
            
            console.log('Calling calculatePagination...');
            this.calculatePagination();
            
            console.log('Calling renderChapter...');
            this.renderChapter();
            
            console.log('Updating URL...');
            this.updateUrl();
            
            console.log('=== Chapter Loading Completed ===');
            
        } catch (error) {
            console.error('Error loading chapter:', error);
            throw error; // Re-throw to be handled by caller
        } finally {
            this.showLoading(false);
        }
    }

    async loadStoryFromUrl(storyId, chapterNumber, page) {
        try {
            await this.loadStories();
            this.currentStory = storyId;
            await this.loadChapter(chapterNumber);
            this.currentPage = page;
            this.renderChapter();
            this.showReader();
        } catch (error) {
            console.error('Error loading from URL:', error);
            this.showStorySelection();
        }
    }

    // ===== PAGINATION =====
    calculatePagination() {
        if (!this.chapterData) {
            console.error('No chapterData available for pagination');
            return;
        }
        
        console.log('Calculating pagination for:', this.chapterData);
        console.log('Segments count:', this.chapterData.segments?.length);
        
        // Extract all text content
        const fullText = this.chapterData.segments.map(segment => segment.content).join('\n\n');
        
        // Split content into paragraphs
        const paragraphs = fullText.split('\n\n').filter(p => p.trim().length > 0);
        
        // Split into pages based on word count
        this.pageContent = [];
        let currentPage = [];
        let currentWordCount = 0;
        
        for (const paragraph of paragraphs) {
            const wordCount = paragraph.trim().split(/\s+/).length;
            
            if (currentWordCount + wordCount > this.settings.wordsPerPage && currentPage.length > 0) {
                // Start new page
                this.pageContent.push(currentPage.join('\n\n'));
                currentPage = [paragraph];
                currentWordCount = wordCount;
            } else {
                currentPage.push(paragraph);
                currentWordCount += wordCount;
            }
        }
        
        // Add last page if it has content
        if (currentPage.length > 0) {
            this.pageContent.push(currentPage.join('\n\n'));
        }
        
        this.totalPages = Math.max(1, this.pageContent.length);
        
        console.log('Pagination calculated:', {
            totalPages: this.totalPages,
            wordsPerPage: this.settings.wordsPerPage,
            pagesGenerated: this.pageContent.length
        });
    }

    // ===== RENDERING =====
    renderStoryList() {
        const container = document.getElementById('story-list');
        container.innerHTML = this.stories.map(story => `
            <div class="story-card" data-story="${story.id}">
                <h3>${story.title}</h3>
                <div class="story-meta">${story.chapters} chương • ${story.status}</div>
                <div class="story-description">${story.description}</div>
                <div class="story-tags">${story.tags ? story.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : ''}</div>
            </div>
        `).join('');
        
        // Bind click events
        container.querySelectorAll('.story-card').forEach(card => {
            card.addEventListener('click', async () => {
                console.log('Story card clicked:', card.dataset.story);
                this.currentStory = card.dataset.story;
                
                // Show loading and switch to reader first
                this.showLoading(true);
                this.showReader();
                
                try {
                    await this.loadChapter(1);
                } catch (error) {
                    console.error('Error loading chapter:', error);
                    this.showError(`Không thể tải chương 1: ${error.message}`);
                    this.showStorySelection();
                } finally {
                    this.showLoading(false);
                }
            });
        });
    }

    renderChapterList() {
        const container = document.getElementById('chapter-list');
        const storyTitle = document.getElementById('selected-story-title');
        
        const story = this.stories.find(s => s.id === this.currentStory);
        storyTitle.textContent = story ? story.title : 'Unknown Story';
        
        container.innerHTML = this.chapters.map(chapter => `
            <div class="chapter-card" data-chapter="${chapter.number}">
                <div class="chapter-number">Chương ${chapter.number}</div>
                <div class="chapter-title">${chapter.title}</div>
            </div>
        `).join('');
        
        // Bind click events
        container.querySelectorAll('.chapter-card').forEach(card => {
            card.addEventListener('click', () => {
                this.loadChapter(parseInt(card.dataset.chapter));
                this.showReader();
            });
        });
    }

    renderChapter() {
        console.log('renderChapter called');
        
        if (!this.chapterData || !this.pageContent.length) {
            console.error('No chapterData or pageContent in renderChapter');
            return;
        }
        
        console.log('Rendering chapter:', this.chapterData.chapter_title);
        console.log('Page content available:', this.pageContent.length, 'pages');
        
        const titleElement = document.getElementById('chapter-title');
        const contentElement = document.getElementById('chapter-content');
        const pageIndicator = document.getElementById('page-indicator');
        const progressFill = document.getElementById('progress-fill');
        
        if (!titleElement || !contentElement) {
            console.error('Required DOM elements not found:', {
                titleElement: !!titleElement,
                contentElement: !!contentElement
            });
            return;
        }
        
        titleElement.textContent = this.chapterData.chapter_title;
        console.log('Title set:', this.chapterData.chapter_title);
        
        // Display current page content
        const currentPageContent = this.pageContent[this.currentPage - 1] || '';
        const formattedContent = currentPageContent.split('\n\n')
            .map(p => `<p>${p.trim()}</p>`)
            .join('');
        
        contentElement.innerHTML = formattedContent;
        contentElement.style.transform = 'none'; // Remove any previous transforms
        
        console.log('Content set for page:', this.currentPage);
        
        // Update UI
        if (pageIndicator) {
            pageIndicator.textContent = `${this.currentPage}/${this.totalPages}`;
        }
        if (progressFill) {
            progressFill.style.width = `${(this.currentPage / this.totalPages) * 100}%`;
        }
        
        // Update navigation buttons
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        
        if (prevBtn) prevBtn.disabled = this.currentPage === 1 && this.isFirstChapter();
        if (nextBtn) nextBtn.disabled = this.currentPage === this.totalPages && this.isLastChapter();
        
        console.log('Chapter rendering completed');
    }

    // ===== NAVIGATION =====
    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderChapter();
            this.updateUrl();
        } else if (!this.isFirstChapter()) {
            // Go to previous chapter, last page
            this.showLoading(true);
            this.loadChapter(this.currentChapter - 1).then(() => {
                this.currentPage = this.totalPages;
                this.renderChapter();
                this.showLoading(false);
            }).catch(() => {
                this.showLoading(false);
            });
        }
    }

    async nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.renderChapter();
            this.updateUrl();
        } else if (!this.isLastChapter()) {
            // Go to next chapter, first page
            this.showLoading(true);
            try {
                await this.loadChapter(this.currentChapter + 1);
                this.showLoading(false);
            } catch (error) {
                this.showLoading(false);
                console.error('Error loading next chapter:', error);
                
                // If can't load next chapter, we've reached the end
                this.showError(`Đã đến cuối truyện! Không thể tải chương ${this.currentChapter + 1}`);
                
                // Update story chapters count to current chapter
                const story = this.stories.find(s => s.id === this.currentStory);
                if (story) {
                    story.chapters = this.currentChapter;
                }
            }
        } else {
            // Already at last chapter and last page
            this.showError('Bạn đã đọc hết truyện! 🎉');
        }
    }

    isFirstChapter() {
        return this.currentChapter === 1;
    }

    isLastChapter() {
        // Check if we've reached the last available chapter by trying to load the next one
        const story = this.stories.find(s => s.id === this.currentStory);
        return story ? this.currentChapter >= story.chapters : true;
    }

    isReaderActive() {
        return document.getElementById('reader').classList.contains('active');
    }

    // ===== SETTINGS =====
    changeFontSize(size) {
        this.settings.fontSize = size;
        this.applySettings();
        this.saveSettings();
        if (this.chapterData) {
            this.calculatePagination();
            this.renderChapter();
        }
    }

    changeTheme(theme) {
        this.settings.theme = theme;
        this.applySettings();
        this.saveSettings();
    }

    changeWordsPerPage(words) {
        this.settings.wordsPerPage = words;
        this.applySettings();
        this.saveSettings();
        if (this.chapterData) {
            this.calculatePagination();
            this.renderChapter();
        }
    }

    toggleSettings() {
        document.getElementById('settings-panel').classList.toggle('active');
    }

    // ===== SCREEN MANAGEMENT =====
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    showStorySelection() {
        this.showScreen('story-selection');
        window.history.replaceState(null, '', '#');
    }

    showChapterSelection() {
        this.showScreen('chapter-selection');
    }

    showReader() {
        this.showScreen('reader');
    }

    showLoading(show) {
        document.getElementById('loading').classList.toggle('active', show);
    }

    showError(message) {
        console.error('Showing error:', message);
        
        // Create error overlay if not exists
        let errorDiv = document.getElementById('error-overlay');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'error-overlay';
            errorDiv.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(13, 17, 23, 0.9);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                color: #f0f6fc;
                font-family: Inter, sans-serif;
            `;
            document.body.appendChild(errorDiv);
        }
        
        errorDiv.innerHTML = `
            <div style="
                background: #161b22;
                border: 1px solid #f85149;
                border-radius: 12px;
                padding: 2rem;
                max-width: 500px;
                text-align: center;
            ">
                <h3 style="color: #f85149; margin-bottom: 1rem;">❌ Lỗi</h3>
                <p style="margin-bottom: 1.5rem; line-height: 1.6;">${message}</p>
                <button onclick="document.getElementById('error-overlay').remove()" style="
                    background: #238636;
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.9rem;
                ">Đóng</button>
            </div>
        `;
        
        errorDiv.style.display = 'flex';
    }
}

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', () => {
    window.storyReader = new StoryReader();
});

// Handle browser back/forward
window.addEventListener('popstate', () => {
    if (window.storyReader) {
        window.storyReader.handleRouting();
    }
});