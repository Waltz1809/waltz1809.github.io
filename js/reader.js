// ===== SIMPLE STORY READER =====
class StoryReader {
    constructor() {
        this.currentChapter = 1;
        this.currentPage = 1;
        this.totalPages = 1;
        this.pageContent = [];
        this.wordsPerPage = 800;
        
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Simple Reader...');
        this.bindEvents();
        
        // Get chapter from URL or start from chapter 1
        const hash = window.location.hash;
        if (hash.includes('chapter-')) {
            const chapterNum = parseInt(hash.replace('#chapter-', ''));
            if (chapterNum && chapterNum > 0) {
                this.currentChapter = chapterNum;
            }
        }
        
        console.log('✅ Simple Reader ready!');
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
            this.currentPage = 1;

            // Update chapter title
            const titleElement = document.getElementById('chapter-title');
            if (titleElement) {
                titleElement.textContent = data.chapter_title;
            }

            // Split content into pages
            const fullText = data.segments.map(s => s.content).join('\n\n');
            this.splitIntoPages(fullText);

            // Render first page
            this.renderCurrentPage();

            // Update URL
            window.location.hash = `chapter-${chapterNumber}`;

            // Show reader
            this.showReader();

        } catch (error) {
            console.error('❌ Failed to load chapter:', error);
            this.showError(`Không thể tải chương ${chapterNumber}: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    splitIntoPages(text) {
        console.log('📄 Splitting content into pages...');
        
        const paragraphs = text.split('\n\n').filter(p => p.trim());
        this.pageContent = [];
        
        let currentPage = [];
        let currentWordCount = 0;

        for (const paragraph of paragraphs) {
            const wordCount = paragraph.trim().split(/\s+/).length;
            
            if (currentWordCount + wordCount > this.wordsPerPage && currentPage.length > 0) {
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
        if (!this.pageContent.length) {
            console.log('No page content to render');
            return;
        }
        
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
        
        if (prevBtn) prevBtn.disabled = this.currentPage === 1 && this.currentChapter === 1;
        if (nextBtn) nextBtn.disabled = false; // Always allow next

        console.log(`📖 Showing page ${this.currentPage}/${this.totalPages} of chapter ${this.currentChapter}`);
    }

    async previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderCurrentPage();
        } else if (this.currentChapter > 1) {
            // Go to previous chapter, last page
            console.log('Going to previous chapter...');
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
            console.log('Trying to load next chapter...');
            try {
                await this.loadChapter(this.currentChapter + 1);
            } catch (error) {
                console.log('Cannot load next chapter, probably reached end');
                this.showError('Đã đến cuối truyện! 🎉');
            }
        }
    }

    bindEvents() {
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
                }
            }
        });

        // Navigation buttons
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        const touchLeft = document.getElementById('touch-left');
        const touchRight = document.getElementById('touch-right');

        if (prevBtn) prevBtn.addEventListener('click', () => this.previousPage());
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextPage());
        if (touchLeft) touchLeft.addEventListener('click', () => this.previousPage());
        if (touchRight) touchRight.addEventListener('click', () => this.nextPage());

        // Touch/swipe events
        let touchStartX = 0;
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            if (!this.isReaderActive()) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const diff = touchStartX - touchEndX;
            
            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    this.nextPage();
                } else {
                    this.previousPage();
                }
            }
        }, { passive: true });
    }

    isReaderActive() {
        const reader = document.getElementById('reader');
        return reader && reader.classList.contains('active');
    }

    showReader() {
        const storySelection = document.getElementById('story-selection');
        const reader = document.getElementById('reader');
        
        if (storySelection) storySelection.classList.remove('active');
        if (reader) reader.classList.add('active');
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.toggle('active', show);
        }
    }

    showError(message) {
        console.error('Showing error:', message);
        alert(message); // Simple error display
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
    
    // Test direct fetch
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

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, creating StoryReader...');
    window.storyReader = new StoryReader();
});