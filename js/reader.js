// ===== VERTICAL SCROLL READER =====
class StoryReader {
    constructor() {
        this.currentChapter = 1;
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Vertical Reader...');
        
        // Get chapter from URL or start from chapter 1
        const hash = window.location.hash;
        if (hash.includes('chapter-')) {
            const chapterNum = parseInt(hash.replace('#chapter-', ''));
            if (chapterNum && chapterNum > 0) {
                this.currentChapter = chapterNum;
            }
        }
        
        this.bindEvents();
        console.log('✅ Vertical Reader ready!');
    }

    async loadChapter(chapterNumber) {
        console.log(`📖 Loading Chapter ${chapterNumber}...`);
        this.showLoading(true);
        
        try {
            const chapterNum = String(chapterNumber).padStart(3, '0');
            const url = `data/marriage/chapter_${chapterNum}.json`;
            
            console.log('Fetching:', url);
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Chapter ${chapterNumber} not found (${response.status})`);
            }

            const data = await response.json();
            console.log(`✅ Chapter loaded: ${data.chapter_title}`);

            this.currentChapter = chapterNumber;

            // Update chapter title
            const titleElement = document.getElementById('chapter-title');
            if (titleElement) {
                titleElement.textContent = data.chapter_title;
            }

            // Display full chapter content
            const fullText = data.segments.map(s => s.content).join('\n\n');
            this.renderFullChapter(fullText);

            // Update URL
            window.location.hash = `chapter-${chapterNumber}`;

            // Show reader
            this.showReader();

            // Update navigation buttons
            this.updateNavButtons();

        } catch (error) {
            console.error('❌ Failed to load chapter:', error);
            this.showError(`Không thể tải chương ${chapterNumber}: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    renderFullChapter(text) {
        const contentElement = document.getElementById('chapter-content');
        if (!contentElement) return;

        // Format content as paragraphs
        const formattedContent = text.split('\n\n')
            .filter(p => p.trim())
            .map(p => `<p>${p.trim()}</p>`)
            .join('');

        contentElement.innerHTML = formattedContent;
        
        // Scroll to top
        contentElement.scrollTop = 0;

        console.log(`📖 Full chapter rendered`);
    }

    updateNavButtons() {
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        
        if (prevBtn) {
            prevBtn.disabled = this.currentChapter === 1;
            prevBtn.textContent = '← Chương trước';
        }
        if (nextBtn) {
            nextBtn.disabled = this.currentChapter >= 494;
            nextBtn.textContent = 'Chương tiếp →';
        }
    }

    async previousChapter() {
        if (this.currentChapter > 1) {
            await this.loadChapter(this.currentChapter - 1);
        }
    }

    async nextChapter() {
        if (this.currentChapter < 494) {
            await this.loadChapter(this.currentChapter + 1);
        } else {
            this.showError('Đã đến cuối truyện! 🎉');
        }
    }

    bindEvents() {
        console.log('🎮 Binding events...');
        
        // Wait for DOM to be ready
        document.addEventListener('DOMContentLoaded', () => {
            this.bindEventListeners();
        });
        
        // If DOM is already ready
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
            console.log('✅ Prev chapter button bound');
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextChapter());
            console.log('✅ Next chapter button bound');
        }
        if (backToChapters) {
            backToChapters.addEventListener('click', () => this.showChapterList());
            console.log('✅ Back to chapters button bound');
        }
        if (backToStories) {
            backToStories.addEventListener('click', () => this.showStoryList());
            console.log('✅ Back to stories button bound');
        }
        if (settingsToggle) {
            settingsToggle.addEventListener('click', () => this.toggleSettings());
            console.log('✅ Settings toggle bound');
        }
        if (closeSettings) {
            closeSettings.addEventListener('click', () => this.toggleSettings());
            console.log('✅ Close settings bound');
        }

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
                }
            }
        });
    }

    showReader() {
        const storySelection = document.getElementById('story-selection');
        const chapterSelection = document.getElementById('chapter-selection');
        const reader = document.getElementById('reader');
        
        if (storySelection) storySelection.classList.remove('active');
        if (chapterSelection) chapterSelection.classList.remove('active');
        if (reader) reader.classList.add('active');
    }

    showChapterList() {
        console.log('Showing chapter list...');
        
        // Generate chapter list
        const chapterList = document.getElementById('chapter-list');
        const storyTitle = document.getElementById('selected-story-title');
        
        if (storyTitle) {
            storyTitle.textContent = 'Marriage Novel - Truyện Hôn Nhân';
        }
        
        if (chapterList) {
            let chaptersHTML = '';
            for (let i = 1; i <= 494; i++) {
                const isCurrentChapter = i === this.currentChapter;
                chaptersHTML += `
                    <div class="chapter-card ${isCurrentChapter ? 'current' : ''}" onclick="jumpToChapter(${i})">
                        <div class="chapter-number">Chương ${i}</div>
                        <div class="chapter-title">${isCurrentChapter ? '📖 Đang đọc' : 'Chapter ' + i}</div>
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
    }

    showStoryList() {
        console.log('Showing story list...');
        
        const storySelection = document.getElementById('story-selection');
        const chapterSelection = document.getElementById('chapter-selection');
        const reader = document.getElementById('reader');
        
        if (chapterSelection) chapterSelection.classList.remove('active');
        if (reader) reader.classList.remove('active');
        if (storySelection) storySelection.classList.add('active');
        
        window.location.hash = '';
    }

    toggleSettings() {
        const settingsPanel = document.getElementById('settings-panel');
        if (settingsPanel) {
            settingsPanel.classList.toggle('active');
            console.log('Settings panel toggled');
        }
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.toggle('active', show);
        }
    }

    showError(message) {
        console.error('Showing error:', message);
        alert(message);
    }
}

// ===== GLOBAL FUNCTIONS =====
function startReading() {
    console.log('Start reading clicked!');
    if (window.storyReader) {
        window.storyReader.loadChapter(1);
    }
}

function testChapter() {
    console.log('Testing chapter loading...');
    
    fetch('data/marriage/chapter_001.json')
        .then(response => {
            console.log('Test fetch response:', response.status, response.ok);
            if (response.ok) {
                return response.json();
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        })
        .then(data => {
            console.log('✅ Test successful!', data.chapter_title);
            alert(`✅ Test OK: ${data.chapter_title}`);
        })
        .catch(error => {
            console.error('❌ Test failed:', error);
            alert(`❌ Test failed: ${error.message}`);
        });
}

function jumpToChapter(chapterNumber) {
    console.log(`Jumping to chapter ${chapterNumber}...`);
    if (window.storyReader) {
        window.storyReader.loadChapter(chapterNumber);
    }
}

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, creating StoryReader...');
    window.storyReader = new StoryReader();
});
});