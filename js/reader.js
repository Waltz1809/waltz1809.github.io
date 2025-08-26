// ===== STORY READER ENGINE =====
class StoryReader {
    constructor() {
        this.currentStory = null;
        this.currentChapter = null;
        this.currentPage = 1;
        this.totalPages = 1;
        this.chapterData = null;
        this.stories = [];
        this.chapters = [];
        this.settings = {
            fontSize: 16,
            theme: 'dark',
            pageHeight: 90
        };
        
        this.init();
    }

    async init() {
        this.loadSettings();
        this.bindEvents();
        this.handleRouting();
        await this.loadStories();
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
        document.documentElement.style.setProperty('--page-width', `${this.settings.pageHeight}vh`);
        
        // Update active buttons
        document.querySelectorAll('.btn-font-size').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.size == this.settings.fontSize);
        });
        document.querySelectorAll('.btn-theme').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === this.settings.theme);
        });
        document.querySelectorAll('.btn-page-height').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.height == this.settings.pageHeight);
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
        
        document.querySelectorAll('.btn-page-height').forEach(btn => {
            btn.addEventListener('click', () => this.changePageHeight(parseInt(btn.dataset.height)));
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
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        });

        document.addEventListener('touchend', (e) => {
            if (!this.isReaderActive()) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const diff = touchStartX - touchEndX;
            
            if (Math.abs(diff) > 50) { // Minimum swipe distance
                if (diff > 0) {
                    this.nextPage(); // Swipe left = next page
                } else {
                    this.previousPage(); // Swipe right = previous page
                }
            }
        });
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
            // Load stories from configuration file
            console.log('Fetching stories.json...');
            const response = await fetch('data/stories.json');
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: Cannot load stories configuration`);
            }
            
            const config = await response.json();
            console.log('Stories config loaded:', config);
            this.stories = config.stories;
            
            // Update chapter count for each story
            for (const story of this.stories) {
                console.log(`Counting chapters for story: ${story.id}`);
                story.chapters = await this.getChapterCount(story.id);
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
                this.showError(`Không thể tải danh sách truyện: ${error.message}`);
            }
        } finally {
            this.showLoading(false);
        }
    }

    async getChapterCount(storyId) {
        console.log(`Checking chapters for story: ${storyId}`);
        try {
            // For performance, first check if chapter_001.json exists
            const testResponse = await fetch(`data/${storyId}/chapter_001.json`);
            if (!testResponse.ok) {
                console.log(`No chapters found for story: ${storyId}`);
                return 0;
            }
            
            // If chapter 1 exists, count sequentially
            let count = 0;
            for (let i = 1; i <= 999; i++) {
                const chapterNum = String(i).padStart(3, '0');
                try {
                    const response = await fetch(`data/${storyId}/chapter_${chapterNum}.json`);
                    if (response.ok) {
                        count = i;
                        console.log(`Found chapter ${i} for ${storyId}`);
                    } else {
                        console.log(`Chapter ${i} not found for ${storyId}, stopping count`);
                        break;
                    }
                } catch (fetchError) {
                    console.log(`Error fetching chapter ${i}:`, fetchError);
                    break;
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
        this.showLoading(true);
        try {
            const chapterNum = String(chapterNumber).padStart(3, '0');
            const response = await fetch(`data/${this.currentStory}/chapter_${chapterNum}.json`);
            
            if (!response.ok) {
                throw new Error(`Chapter ${chapterNumber} not found`);
            }
            
            this.chapterData = await response.json();
            this.currentChapter = chapterNumber;
            this.currentPage = 1;
            
            this.calculatePagination();
            this.renderChapter();
            this.updateUrl();
            
        } catch (error) {
            console.error('Error loading chapter:', error);
            this.showError(`Không thể tải chương ${chapterNumber}`);
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
        if (!this.chapterData) return;
        
        const content = this.chapterData.segments.map(segment => 
            segment.content.split('\n\n').map(p => `<p>${p.trim()}</p>`).join('')
        ).join('');
        
        // Create temporary element to measure content
        const temp = document.createElement('div');
        temp.style.cssText = `
            position: absolute;
            visibility: hidden;
            width: 700px;
            font-family: 'Merriweather', Georgia, serif;
            font-size: ${this.settings.fontSize}px;
            line-height: 1.8;
            padding: 2rem;
        `;
        temp.innerHTML = content;
        document.body.appendChild(temp);
        
        const pageHeight = window.innerHeight * (this.settings.pageHeight / 100);
        const contentHeight = temp.scrollHeight;
        this.totalPages = Math.max(1, Math.ceil(contentHeight / pageHeight));
        
        document.body.removeChild(temp);
        
        // Store content for pagination
        this.fullContent = content;
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
            card.addEventListener('click', () => {
                console.log('Story card clicked:', card.dataset.story);
                // Skip chapter selection, go directly to chapter 1
                this.currentStory = card.dataset.story;
                this.loadChapter(1);
                this.showReader();
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
        if (!this.chapterData) return;
        
        const titleElement = document.getElementById('chapter-title');
        const contentElement = document.getElementById('chapter-content');
        const pageIndicator = document.getElementById('page-indicator');
        const progressFill = document.getElementById('progress-fill');
        
        titleElement.textContent = this.chapterData.chapter_title;
        
        // Calculate content for current page
        const pageHeight = window.innerHeight * (this.settings.pageHeight / 100);
        const startPosition = (this.currentPage - 1) * pageHeight;
        
        // Create a scrollable div to find the right content
        const temp = document.createElement('div');
        temp.style.cssText = `
            position: absolute;
            visibility: hidden;
            width: 700px;
            height: ${pageHeight}px;
            overflow: hidden;
            font-family: 'Merriweather', Georgia, serif;
            font-size: ${this.settings.fontSize}px;
            line-height: 1.8;
        `;
        temp.innerHTML = this.fullContent;
        temp.scrollTop = startPosition;
        document.body.appendChild(temp);
        
        // Get visible content
        contentElement.innerHTML = this.fullContent;
        contentElement.style.transform = `translateY(-${startPosition}px)`;
        
        document.body.removeChild(temp);
        
        // Update UI
        pageIndicator.textContent = `${this.currentPage}/${this.totalPages}`;
        progressFill.style.width = `${(this.currentPage / this.totalPages) * 100}%`;
        
        // Update navigation buttons
        document.getElementById('prev-page').disabled = this.currentPage === 1;
        document.getElementById('next-page').disabled = this.currentPage === this.totalPages && this.isLastChapter();
    }

    // ===== NAVIGATION =====
    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderChapter();
            this.updateUrl();
        } else if (!this.isFirstChapter()) {
            // Go to previous chapter, last page
            this.loadChapter(this.currentChapter - 1).then(() => {
                this.currentPage = this.totalPages;
                this.renderChapter();
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
            await this.loadChapter(this.currentChapter + 1);
        }
    }

    isFirstChapter() {
        return this.currentChapter === 1;
    }

    isLastChapter() {
        return this.currentChapter === this.chapters.length;
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

    changePageHeight(height) {
        this.settings.pageHeight = height;
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