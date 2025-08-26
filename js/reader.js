// ===== SIMPLE STORY READER =====
class StoryReader {
    constructor() {
        this.currentStory = 'marriage'; // Fixed story
        this.currentChapter = 1;
        this.currentPage = 1;
        this.totalPages = 1;
        this.pageContent = [];
        this.settings = {
            fontSize: 16,
            theme: 'dark',
            wordsPerPage: 800
        };
        
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Simple Reader...');
        this.loadSettings();
        this.bindEvents();
        
        // Get chapter from URL or start from chapter 1
        const hash = window.location.hash;
        if (hash.includes('chapter-')) {
            const chapterNum = parseInt(hash.replace('#chapter-', ''));
            if (chapterNum && chapterNum > 0) {
                this.currentChapter = chapterNum;
            }
        }
        
        // Load chapter directly
        await this.loadChapter(this.currentChapter);
        this.showReader();
        
        console.log('✅ Simple Reader ready!');
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

    // Simple URL update for bookmarking
    updateUrl() {
        window.location.hash = `chapter-${this.currentChapter}`;
    }



    async loadChapter(chapterNumber) {
        console.log(`📖 Loading Chapter ${chapterNumber}...`);
        this.showLoading(true);
        
        try {
            const chapterNum = String(chapterNumber).padStart(3, '0');
            const url = `data/marriage/chapter_${chapterNum}.json`;
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Chapter ${chapterNumber} not found`);
            }

            const data = await response.json();
            console.log(`✅ Chapter loaded: ${data.chapter_title}`);

            this.currentChapter = chapterNumber;
            this.currentPage = 1;

            // Split content into pages
            const fullText = data.segments.map(s => s.content).join('\n\n');
            this.splitIntoPages(fullText);

            // Update chapter title
            const titleElement = document.getElementById('chapter-title');
            if (titleElement) {
                titleElement.textContent = data.chapter_title;
            }

            // Render first page
            this.renderCurrentPage();

            // Update URL
            window.location.hash = `chapter-${chapterNumber}`;

        } catch (error) {
            console.error('❌ Failed to load chapter:', error);
            this.showError(`Không thể tải chương ${chapterNumber}: ${error.message}`);
            throw error;
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
    splitIntoPages(text) {
        console.log('📄 Splitting content into pages...');
        
        const paragraphs = text.split('\n\n').filter(p => p.trim());
        this.pageContent = [];
        
        let currentPage = [];
        let currentWordCount = 0;

        for (const paragraph of paragraphs) {
            const wordCount = paragraph.trim().split(/\s+/).length;
            
            if (currentWordCount + wordCount > this.settings.wordsPerPage && currentPage.length > 0) {
                this.pageContent.push(currentPage.join('\n\n'));
                currentPage = [paragraph];
                currentWordCount = wordCount;
            } else {
                currentPage.push(paragraph);
                currentWordCount += wordCount;
            }
        }

        if (currentPage.length > 0) {
            this.pageContent.push(currentPage.join('\n\n'));
        }

        this.totalPages = this.pageContent.length;
        console.log(`📚 Split into ${this.totalPages} pages`);
    }



    renderCurrentPage() {
        if (!this.pageContent.length) return;
        
        const content = this.pageContent[this.currentPage - 1] || 'Không có nội dung';
        const formattedContent = content.split('\n\n')
            .map(p => `<p>${p.trim()}</p>`)
            .join('');

        const contentElement = document.getElementById('chapter-content');
        if (contentElement) {
            contentElement.innerHTML = formattedContent;
        }

        // Update page info
        const pageIndicator = document.getElementById('page-indicator');
        if (pageIndicator) {
            pageIndicator.textContent = `${this.currentPage}/${this.totalPages}`;
        }
        
        // Update progress bar
        const progressFill = document.getElementById('progress-fill');
        if (progressFill) {
            const progress = (this.currentPage / this.totalPages) * 100;
            progressFill.style.width = `${progress}%`;
        }

        // Update buttons
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        
        if (prevBtn) prevBtn.disabled = this.currentPage === 1;
        if (nextBtn) nextBtn.disabled = this.currentPage === this.totalPages;

        console.log(`📖 Showing page ${this.currentPage}/${this.totalPages}`);
    }

    // ===== NAVIGATION =====
    async previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderCurrentPage();
        } else if (this.currentChapter > 1) {
            // Go to previous chapter, last page
            await this.loadChapter(this.currentChapter - 1);
            this.currentPage = this.totalPages;
            this.renderCurrentPage();
        }
    }

    async nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.renderCurrentPage();
        } else {
            // Try to load next chapter
            try {
                await this.loadChapter(this.currentChapter + 1);
            } catch (error) {
                this.showError('Đã đến cuối truyện! 🎉');
            }
        }
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
    showReader() {
        // Hide story selection, show reader
        const storySelection = document.getElementById('story-selection');
        const reader = document.getElementById('reader');
        
        if (storySelection) storySelection.classList.remove('active');
        if (reader) reader.classList.add('active');
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

// ===== GLOBAL FUNCTIONS =====
function startReading() {
    if (window.storyReader) {
        window.storyReader.loadChapter(1);
        window.storyReader.showReader();
    }
}

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', () => {
    window.storyReader = new StoryReader();
});