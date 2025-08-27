// ===== STORY READER APPLICATION =====
class StoryReader {
    constructor() {
        this.currentStory = null;
        this.currentChapter = 1;
        this.stories = [];
        this.settings = {
            theme: 'dark',
            fontSize: 16,
            fontFamily: 'Bookerly'
        };
        this.init();
    }

    async init() {
        console.log('🚀 Khởi tạo Story Reader...');

        // Load settings from localStorage
        this.loadSettings();

        // Apply theme
        this.applyTheme();

        // Load stories data
        await this.loadStories();

        // Bind events
        this.bindEvents();

        // Handle URL routing
        this.handleRouting();

        console.log('✅ Story Reader sẵn sàng!');
    }

    loadSettings() {
        const saved = localStorage.getItem('storyReaderSettings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
    }

    saveSettings() {
        localStorage.setItem('storyReaderSettings', JSON.stringify(this.settings));
    }

    applyTheme() {
        document.body.className = `${this.settings.theme}-theme`;

        // Update font size
        document.documentElement.style.setProperty('--reading-font-size', `${this.settings.fontSize}px`);

        // Update font family
        const fontFamilyMap = {
            'Bookerly': "'Bookerly', 'Amazon Ember', Georgia, 'Times New Roman', serif",
            'Inter': "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            'Poppins': "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            'Nunito': "'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            'Roboto': "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            'Comic': "'Comic Neue', 'Comic Sans MS', cursive"
        };
        document.documentElement.style.setProperty('--reading-font-family', fontFamilyMap[this.settings.fontFamily]);

        // Update theme buttons
        document.querySelectorAll('.btn-theme').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === this.settings.theme);
        });

        // Update font size buttons
        document.querySelectorAll('.btn-font-size').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.size) === this.settings.fontSize);
        });

        // Update font family buttons
        document.querySelectorAll('.btn-font-family').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.font === this.settings.fontFamily);
        });
    }

    async loadStories() {
        try {
            const response = await fetch('data/stories.json');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            this.stories = data.stories;
            console.log('✅ Đã tải danh sách truyện:', this.stories.length, 'truyện');
            console.log('📚 Danh sách truyện:', this.stories.map(s => s.id));
        } catch (error) {
            console.error('❌ Lỗi tải danh sách truyện:', error);
            this.stories = [];
        }
    }

    handleRouting() {
        const hash = window.location.hash;
        console.log('🔗 Xử lý routing:', hash);

        if (hash.startsWith('#story-')) {
            const storyId = hash.replace('#story-', '');
            this.selectStory(storyId);
            this.showChapterList();
        } else if (hash.startsWith('#chapter-')) {
            const parts = hash.split('-');
            if (parts.length >= 3) {
                const storyId = parts[1];
                const chapterNum = parseInt(parts[2]);
                this.selectStory(storyId);
                this.loadChapter(chapterNum);
            }
        } else {
            console.log('📚 Hiển thị trang chọn truyện mặc định');
            this.showStorySelection();
        }
    }

    async loadChapter(chapterNumber) {
        if (!this.currentStory) {
            console.error('❌ Chưa chọn truyện');
            return;
        }

        console.log(`📖 Đang tải chương ${chapterNumber}...`);
        this.showLoading(true);

        try {
            const chapterNum = String(chapterNumber).padStart(3, '0');
            const url = `data/${this.currentStory.id}/chapter_${chapterNum}.json`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Không tìm thấy chương ${chapterNumber}`);
            }

            const data = await response.json();
            console.log(`✅ Đã tải chương: ${data.chapter_title}`);

            this.currentChapter = chapterNumber;

            // Update chapter title
            const titleElement = document.getElementById('chapter-title');
            if (titleElement) {
                titleElement.textContent = `Chương ${chapterNumber}: ${data.chapter_title}`;
            }

            // Display chapter content
            const fullText = data.segments.map(s => s.content).join('\n\n');
            this.renderChapter(fullText);

            // Update URL
            window.location.hash = `chapter-${this.currentStory.id}-${chapterNumber}`;

            // Show reader
            this.showReader();

            // Update navigation buttons
            this.updateNavButtons();

        } catch (error) {
            console.error('❌ Lỗi tải chương:', error);
            this.showError(`Không thể tải chương ${chapterNumber}: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    renderChapter(text) {
        const contentElement = document.getElementById('chapter-content');
        if (!contentElement) return;

        // Split into paragraphs and format
        const paragraphs = text.split('\n\n')
            .filter(p => p.trim())
            .map(p => `<p>${p.trim().replace(/\n/g, '<br>')}</p>`);

        contentElement.innerHTML = paragraphs.join('');

        // Scroll to top
        contentElement.scrollTop = 0;

        console.log(`📖 Đã hiển thị chương với ${paragraphs.length} đoạn văn`);
    }

    updateNavButtons() {
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');

        if (prevBtn) {
            prevBtn.disabled = this.currentChapter === 1;
            prevBtn.textContent = '← Chương trước';
        }
        if (nextBtn) {
            const maxChapter = this.currentStory ? this.currentStory.chapters : 494;
            nextBtn.disabled = this.currentChapter >= maxChapter;
            nextBtn.textContent = 'Chương tiếp →';
        }
    }

    async previousChapter() {
        if (this.currentChapter > 1) {
            await this.loadChapter(this.currentChapter - 1);
        }
    }

    async nextChapter() {
        const maxChapter = this.currentStory ? this.currentStory.chapters : 494;
        if (this.currentChapter < maxChapter) {
            await this.loadChapter(this.currentChapter + 1);
        } else {
            this.showError('Đã đến cuối truyện! 🎉');
        }
    }

    bindEvents() {
        console.log('🎮 Đang gắn kết sự kiện...');

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.bindEventListeners();
            });
        } else {
            this.bindEventListeners();
        }
    }

    bindEventListeners() {
        // Navigation buttons
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        const backToChapters = document.getElementById('back-to-chapters');
        const backToStories = document.getElementById('back-to-stories');
        const settingsToggle = document.getElementById('settings-toggle');
        const closeSettings = document.getElementById('close-settings');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousChapter());
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextChapter());
        }
        if (backToChapters) {
            backToChapters.addEventListener('click', () => this.showChapterList());
        }
        if (backToStories) {
            backToStories.addEventListener('click', () => this.showStorySelection());
        }
        if (settingsToggle) {
            settingsToggle.addEventListener('click', () => this.toggleSettings());
        }
        if (closeSettings) {
            closeSettings.addEventListener('click', () => this.toggleSettings());
        }

        // Settings controls
        this.bindSettingsEvents();

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            const reader = document.getElementById('reader');
            if (reader && reader.classList.contains('active')) {
                switch(e.key) {
                    case 'ArrowLeft':
                        e.preventDefault();
                        this.previousChapter();
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        this.nextChapter();
                        break;
                    case 'Escape':
                        e.preventDefault();
                        this.showChapterList();
                        break;
                }
            }
        });

        console.log('✅ Đã gắn kết tất cả sự kiện');
    }

    bindSettingsEvents() {
        // Theme buttons
        document.querySelectorAll('.btn-theme').forEach(btn => {
            btn.addEventListener('click', () => {
                this.settings.theme = btn.dataset.theme;
                this.applyTheme();
                this.saveSettings();
            });
        });

        // Font size buttons
        document.querySelectorAll('.btn-font-size').forEach(btn => {
            btn.addEventListener('click', () => {
                this.settings.fontSize = parseInt(btn.dataset.size);
                this.applyTheme();
                this.saveSettings();
            });
        });

        // Font family buttons
        document.querySelectorAll('.btn-font-family').forEach(btn => {
            btn.addEventListener('click', () => {
                this.settings.fontFamily = btn.dataset.font;
                this.applyTheme();
                this.saveSettings();
            });
        });
    }

    selectStory(storyId) {
        console.log('🔍 Đang tìm truyện:', storyId);
        console.log('📚 Danh sách có sẵn:', this.stories.map(s => s.id));

        this.currentStory = this.stories.find(s => s.id === storyId);
        if (!this.currentStory) {
            console.error('❌ Không tìm thấy truyện:', storyId);
            console.error('❌ Danh sách truyện hiện tại:', this.stories);
            this.showStorySelection();
            return false;
        }
        console.log('✅ Đã chọn truyện:', this.currentStory.title);
        return true;
    }

    showStorySelection() {
        console.log('📚 Hiển thị danh sách truyện...');

        // Show story selection screen first
        const storySelection = document.getElementById('story-selection');
        const chapterSelection = document.getElementById('chapter-selection');
        const reader = document.getElementById('reader');

        console.log('🔍 Elements found:', {
            storySelection: !!storySelection,
            chapterSelection: !!chapterSelection,
            reader: !!reader
        });

        if (chapterSelection) chapterSelection.classList.remove('active');
        if (reader) reader.classList.remove('active');
        if (storySelection) {
            storySelection.classList.add('active');
            console.log('✅ Đã hiển thị trang story-selection');
        } else {
            console.error('❌ Không tìm thấy #story-selection element');
        }

        // Update story grid with dynamic data
        this.renderStoryGrid();

        window.location.hash = '';
    }

    renderStoryGrid() {
        const storyGrid = document.querySelector('.story-grid');
        if (!storyGrid) {
            console.error('❌ Không tìm thấy .story-grid element');
            return;
        }

        if (this.stories.length === 0) {
            storyGrid.innerHTML = '<p>Đang tải danh sách truyện...</p>';
            return;
        }

        console.log('🎨 Đang render', this.stories.length, 'truyện');

        let storiesHTML = '';
        this.stories.forEach(story => {
            storiesHTML += `
                <div class="story-card" onclick="window.storyReader.handleStoryClick('${story.id}')">
                    <h3>${story.title}</h3>
                    <div class="story-meta">${story.chapters} chương • ${story.status}</div>
                    <div class="story-description">${story.description}</div>
                    <div class="story-tags">
                        ${story.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                    <div style="margin-top: 1rem;">
                        <button onclick="event.stopPropagation(); testStory('${story.id}')"
                                style="background: #f79708; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; margin-right: 0.5rem;">
                            🧪 Test
                        </button>
                        <button onclick="event.stopPropagation(); startReading('${story.id}')"
                                style="background: #238636; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">
                            🚀 Bắt đầu đọc
                        </button>
                    </div>
                </div>
            `;
        });

        storyGrid.innerHTML = storiesHTML;
        console.log('✅ Đã render story grid');
    }

    handleStoryClick(storyId) {
        console.log('🖱️ Click vào truyện:', storyId);
        if (this.selectStory(storyId)) {
            this.showChapterList();
        }
    }

    showChapterList() {
        if (!this.currentStory) {
            console.log('❌ Chưa chọn truyện, quay về danh sách truyện');
            this.showStorySelection();
            return;
        }

        console.log('Hiển thị danh sách chương cho:', this.currentStory.title);

        // Update story title
        const storyTitle = document.getElementById('selected-story-title');
        if (storyTitle) {
            storyTitle.textContent = this.currentStory.title;
        }

        // Generate chapter list
        const chapterList = document.getElementById('chapter-list');
        if (chapterList) {
            let chaptersHTML = '';
            for (let i = 1; i <= this.currentStory.chapters; i++) {
                const isCurrentChapter = i === this.currentChapter;
                chaptersHTML += `
                    <div class="chapter-card ${isCurrentChapter ? 'current' : ''}" onclick="jumpToChapter(${i})">
                        <div class="chapter-number">Chương ${i}</div>
                        <div class="chapter-title">${isCurrentChapter ? '📖 Đang đọc' : `Chương ${i}`}</div>
                    </div>
                `;
            }
            chapterList.innerHTML = chaptersHTML;

            // Scroll to current chapter
            setTimeout(() => {
                const currentCard = chapterList.querySelector('.current');
                if (currentCard) {
                    currentCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        }

        // Show chapter selection screen
        const storySelection = document.getElementById('story-selection');
        const chapterSelection = document.getElementById('chapter-selection');
        const reader = document.getElementById('reader');

        if (storySelection) storySelection.classList.remove('active');
        if (reader) reader.classList.remove('active');
        if (chapterSelection) chapterSelection.classList.add('active');

        // Update URL
        window.location.hash = `story-${this.currentStory.id}`;
    }

    showReader() {
        const storySelection = document.getElementById('story-selection');
        const chapterSelection = document.getElementById('chapter-selection');
        const reader = document.getElementById('reader');

        if (storySelection) storySelection.classList.remove('active');
        if (chapterSelection) chapterSelection.classList.remove('active');
        if (reader) reader.classList.add('active');
    }

    toggleSettings() {
        const settingsPanel = document.getElementById('settings-panel');
        if (settingsPanel) {
            settingsPanel.classList.toggle('active');
            console.log('Đã bật/tắt bảng cài đặt');
        }
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.toggle('active', show);
        }
    }

    showError(message) {
        console.error('Hiển thị lỗi:', message);
        alert(message);
    }
}

// ===== GLOBAL FUNCTIONS =====
function selectStory(storyId) {
    console.log('🌐 Global selectStory:', storyId);
    if (window.storyReader) {
        if (window.storyReader.selectStory(storyId)) {
            window.storyReader.showChapterList();
        }
    } else {
        console.error('❌ window.storyReader chưa sẵn sàng');
    }
}

function startReading(storyId) {
    console.log('🌐 Global startReading:', storyId);
    if (window.storyReader) {
        if (window.storyReader.selectStory(storyId)) {
            window.storyReader.loadChapter(1);
        }
    } else {
        console.error('❌ window.storyReader chưa sẵn sàng');
    }
}

function testStory(storyId) {
    console.log('Test truyện:', storyId);

    fetch(`data/${storyId}/chapter_001.json`)
        .then(response => {
            console.log('Test fetch response:', response.status, response.ok);
            if (response.ok) {
                return response.json();
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        })
        .then(data => {
            console.log('✅ Test thành công!', data.chapter_title);
            alert(`✅ Test OK: ${data.chapter_title}`);
        })
        .catch(error => {
            console.error('❌ Test thất bại:', error);
            alert(`❌ Test thất bại: ${error.message}`);
        });
}

function jumpToChapter(chapterNumber) {
    console.log(`Nhảy đến chương ${chapterNumber}...`);
    if (window.storyReader) {
        window.storyReader.loadChapter(chapterNumber);
    }
}

// Legacy functions for backward compatibility
function testChapter() {
    testStory('marriage');
}

// Debug function to force show story selection
function showStories() {
    console.log('🔧 Debug: Force show stories');
    if (window.storyReader) {
        window.storyReader.showStorySelection();
    }
}

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM đã tải, đang tạo StoryReader...');
    window.storyReader = new StoryReader();
});