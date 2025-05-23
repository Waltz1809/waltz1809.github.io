#!/usr/bin/env python3
"""
Story Index Builder
Tự động scan thư mục stories/ và tạo file index.json cho website
"""

import os
import json
import yaml
import re
from pathlib import Path

def format_story_title(filename):
    """Chuyển đổi tên file thành title đẹp"""
    # Remove extension and _edit suffix
    name = filename.replace('.yaml', '').replace('_edit', '')
    
    # Replace underscores with spaces
    name = name.replace('_', ' ')
    
    # Capitalize each word
    words = name.split(' ')
    formatted_words = []
    
    for word in words:
        if word.lower() in ['vol', 'v']:
            formatted_words.append(word.upper())
        elif word.isdigit():
            formatted_words.append(f"Tập {word}")
        elif '.' in word and word.replace('.', '').isdigit():
            formatted_words.append(f"Tập {word}")
        else:
            formatted_words.append(word.capitalize())
    
    return ' '.join(formatted_words)

def get_story_info(filepath):
    """Lấy thông tin từ file YAML"""
    try:
        with open(filepath, 'r', encoding='utf-8') as file:
            data = yaml.safe_load(file)
            
        if not isinstance(data, list):
            return None
            
        chapter_count = len(data)
        
        # Try to get story info from first chapter
        first_chapter = data[0] if data else {}
        
        return {
            'chapter_count': chapter_count,
            'first_chapter_title': first_chapter.get('title', 'Unknown'),
            'estimated_size': f"{os.path.getsize(filepath) // 1024}KB"
        }
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return None

def categorize_stories(stories):
    """Phân loại stories theo series"""
    categories = {}
    
    for story in stories:
        filename = story['fileName']
        
        # Detect series based on filename patterns
        if 'boardgame' in filename.lower():
            series = 'Board Game'
        elif 'junna' in filename.lower():
            series = 'Junna Series'
        elif 'noucome' in filename.lower() or 'vol' in filename.lower():
            series = 'Noucome'
        elif 'genben' in filename.lower():
            series = 'Genben'
        elif 'korezom' in filename.lower():
            series = 'Kore wa Zombie'
        elif 'daraku' in filename.lower():
            series = 'Daraku'
        elif 'twin' in filename.lower():
            series = 'Twin'
        elif 'chunni' in filename.lower():
            series = 'Chuunibyou'
        else:
            series = 'Khác'
        
        if series not in categories:
            categories[series] = []
        
        categories[series].append(story)
    
    # Sort stories within each category
    for series in categories:
        categories[series].sort(key=lambda x: x['fileName'])
    
    return categories

def scan_stories_directory():
    """Scan thư mục stories và tạo index"""
    stories_dir = Path('stories')
    
    if not stories_dir.exists():
        print("Tạo thư mục stories/...")
        stories_dir.mkdir()
        return {'stories': [], 'categories': {}}
    
    print("Đang scan thư mục stories/...")
    
    stories = []
    yaml_files = list(stories_dir.glob('*.yaml')) + list(stories_dir.glob('*.yml'))
    
    for filepath in yaml_files:
        filename = filepath.name
        print(f"  Tìm thấy: {filename}")
        
        # Get story info
        story_info = get_story_info(filepath)
        
        story = {
            'id': filename.replace('.yaml', '').replace('.yml', '').replace('_edit', ''),
            'title': format_story_title(filename),
            'fileName': filename,
            'path': str(filepath),
            'size': f"{filepath.stat().st_size // 1024}KB"
        }
        
        if story_info:
            story.update({
                'chapters': story_info['chapter_count'],
                'description': f"{story_info['chapter_count']} chương • {story_info['estimated_size']}"
            })
        
        stories.append(story)
    
    # Sort stories by title
    stories.sort(key=lambda x: x['title'])
    
    # Categorize stories
    categories = categorize_stories(stories)
    
    return {
        'stories': stories,
        'categories': categories,
        'total_count': len(stories),
        'last_updated': str(Path().absolute())
    }

def generate_index():
    """Tạo file index.json"""
    print("🔍 Story Index Builder")
    print("=====================")
    
    # Scan directory
    index_data = scan_stories_directory()
    
    # Write index.json
    index_file = Path('stories/index.json')
    with open(index_file, 'w', encoding='utf-8') as file:
        json.dump(index_data, file, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Đã tạo {index_file}")
    print(f"📚 Tổng cộng: {index_data['total_count']} truyện")
    
    # Print categories
    if index_data['categories']:
        print("\n📂 Phân loại:")
        for series, stories in index_data['categories'].items():
            print(f"  {series}: {len(stories)} truyện")
    
    # Print stories list
    print("\n📖 Danh sách truyện:")
    for story in index_data['stories']:
        desc = story.get('description', story['size'])
        print(f"  • {story['title']} ({desc})")
    
    return index_data

def create_example_structure():
    """Tạo cấu trúc thư mục ví dụ"""
    stories_dir = Path('stories')
    stories_dir.mkdir(exist_ok=True)
    
    # Create example README
    readme_content = """# Stories Directory

Thả file YAML vào đây để website tự động detect!

## Cách sử dụng:

1. Copy file .yaml vào thư mục này
2. Chạy `python build-stories.py` để update index
3. Refresh website để xem truyện mới

## Format file YAML:

```yaml
- id: Chapter_1
  title: "Tên chương"
  content: |-
    Nội dung chương...
```

## Tự động build:

Có thể setup GitHub Action để tự động build khi có file mới:
- Push file .yaml
- GitHub Action chạy build-stories.py
- Website tự động update
"""
    
    with open(stories_dir / 'README.md', 'w', encoding='utf-8') as f:
        f.write(readme_content)
    
    print(f"✅ Đã tạo {stories_dir}/README.md")

if __name__ == "__main__":
    try:
        # Generate index
        generate_index()
        
        # Create example structure if needed
        create_example_structure()
        
        print("\n🎉 Hoàn tất! Website sẽ tự động load các truyện từ stories/")
        print("💡 Tip: Thêm script này vào GitHub Action để auto-build!")
        
    except KeyboardInterrupt:
        print("\n❌ Đã hủy")
    except Exception as e:
        print(f"\n❌ Lỗi: {e}")
        import traceback
        traceback.print_exc()