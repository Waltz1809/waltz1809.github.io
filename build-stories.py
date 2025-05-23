#!/usr/bin/env python3
"""
Story Index Builder
Tự động scan thư mục stories/ và raw/ và tạo file index.json cho website
"""

import os
import json
import yaml
import re
from pathlib import Path
from datetime import datetime

# Get script directory to ensure relative paths work correctly
SCRIPT_DIR = Path(__file__).parent.absolute()
STORIES_DIR = SCRIPT_DIR / 'stories'
RAW_DIR = SCRIPT_DIR / 'raw'

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
        file_size_kb = os.path.getsize(filepath) // 1024
        
        # Performance warning for large files
        is_large = file_size_kb > 5000 or chapter_count > 1000
        
        # Try to get story info from first chapter
        first_chapter = data[0] if data else {}
        
        return {
            'chapter_count': chapter_count,
            'first_chapter_title': first_chapter.get('title', 'Unknown'),
            'file_size_kb': file_size_kb,
            'is_large': is_large,
            'size_mb': round(file_size_kb / 1024, 1) if file_size_kb > 1024 else None
        }
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return None

def find_raw_counterpart(story_filename):
    """Tìm file raw tương ứng với story file"""
    if not RAW_DIR.exists():
        return None
        
    # Try exact match first
    raw_file = RAW_DIR / story_filename
    if raw_file.exists():
        return story_filename
    
    # Try without _edit suffix
    base_name = story_filename.replace('_edit', '')
    raw_file = RAW_DIR / base_name
    if raw_file.exists():
        return base_name
        
    # Try with different extensions
    base_without_ext = story_filename.replace('.yaml', '').replace('.yml', '')
    for ext in ['.yaml', '.yml']:
        raw_file = RAW_DIR / f"{base_without_ext}{ext}"
        if raw_file.exists():
            return f"{base_without_ext}{ext}"
    
    return None

def scan_stories_directory():
    """Scan thư mục stories và raw và tạo index"""
    
    # Create directories if they don't exist
    STORIES_DIR.mkdir(exist_ok=True)
    RAW_DIR.mkdir(exist_ok=True)
    
    print(f"Đang scan thư mục stories/...")
    
    stories = []
    yaml_files = list(STORIES_DIR.glob('*.yaml')) + list(STORIES_DIR.glob('*.yml'))
    
    for filepath in yaml_files:
        filename = filepath.name
        print(f"  Tìm thấy: {filename}")
        
        # Get story info
        story_info = get_story_info(filepath)
        
        # Find raw counterpart
        raw_filename = find_raw_counterpart(filename)
        has_raw = raw_filename is not None
        
        story = {
            'id': filename.replace('.yaml', '').replace('.yml', '').replace('_edit', ''),
            'title': format_story_title(filename),
            'fileName': filename,
            'size': f"{filepath.stat().st_size // 1024}KB",
            'hasRaw': has_raw
        }
        
        if has_raw:
            story['rawFileName'] = raw_filename
            print(f"    📄 Raw: {raw_filename}")
        
        if story_info:
            story.update({
                'chapters': story_info['chapter_count'],
                'isLarge': story_info['is_large'],
                'description': f"{story_info['chapter_count']} chương • {story['size']}"
            })
            
            if story_info['size_mb']:
                story['description'] += f" • {story_info['size_mb']}MB"
                
            if story_info['is_large']:
                story['description'] += " • File lớn"
                print(f"    ⚠️  File lớn: {story_info['chapter_count']} chương, {story['size']}")
        
        stories.append(story)
    
    # Sort stories by title
    stories.sort(key=lambda x: x['title'])
    
    # Count raw files
    raw_count = 0
    if RAW_DIR.exists():
        raw_files = list(RAW_DIR.glob('*.yaml')) + list(RAW_DIR.glob('*.yml'))
        raw_count = len(raw_files)
    
    return {
        'stories': stories,
        'total_count': len(stories),
        'raw_count': raw_count,
        'has_raw_support': raw_count > 0,
        'last_updated': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'build_date': datetime.now().isoformat(),
        'version': '2.0',
        'generator': 'build-stories.py'
    }

def generate_index():
    """Tạo file index.json"""
    print("🔍 Story Index Builder v2.0")
    print("============================")
    print(f"📁 Stories: stories/")
    print(f"📁 Raw: raw/")
    
    # Scan directory
    index_data = scan_stories_directory()
    
    # Write index.json
    index_file = STORIES_DIR / 'index.json'
    with open(index_file, 'w', encoding='utf-8') as file:
        json.dump(index_data, file, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Đã tạo index.json")
    print(f"📚 Tổng cộng: {index_data['total_count']} truyện")
    
    if index_data['has_raw_support']:
        print(f"📄 Raw files: {index_data['raw_count']} files")
        raw_supported = sum(1 for story in index_data['stories'] if story.get('hasRaw'))
        print(f"🔄 Có raw: {raw_supported}/{index_data['total_count']} truyện")
    
    # Print stories list
    print("\n📖 Danh sách truyện:")
    for story in index_data['stories']:
        desc = story.get('description', story['size'])
        raw_icon = " 🔄" if story.get('hasRaw') else ""
        large_icon = " ⚠️" if story.get('isLarge') else ""
        print(f"  • {story['title']} ({desc}){raw_icon}{large_icon}")
    
    return index_data

def create_example_structure():
    """Tạo cấu trúc thư mục ví dụ"""
    
    # Create README for stories
    stories_readme = """# Stories Directory

Thả file YAML đã chỉnh sửa (tiếng Việt) vào đây!

## Format file YAML:

```yaml
- id: Chapter_1
  title: "Tên chương"
  content: |-
    Nội dung chương...
```
"""
    
    # Create README for raw
    raw_readme = """# Raw Directory

Thả file YAML gốc (chưa chỉnh sửa) vào đây để so sánh!

## Tính năng:
- Website sẽ tự động detect file raw
- Hiển thị nút "So sánh" nếu có raw
- Có thể xem song song edited vs raw

## Naming convention:
- `story.yaml` trong stories/ → `story.yaml` trong raw/
- `story_edit.yaml` trong stories/ → `story.yaml` trong raw/
"""
    
    with open(STORIES_DIR / 'README.md', 'w', encoding='utf-8') as f:
        f.write(stories_readme)
    
    with open(RAW_DIR / 'README.md', 'w', encoding='utf-8') as f:
        f.write(raw_readme)
    
    print(f"✅ Đã tạo README.md cho stories/ và raw/")

if __name__ == "__main__":
    try:
        # Generate index
        generate_index()
        
        # Create example structure if needed
        create_example_structure()
        
        print(f"\n🎉 Hoàn tất!")
        print("📚 Stories: Bản tiếng Việt đã chỉnh sửa")
        print("📄 Raw: Bản gốc để so sánh")
        print("💡 Tip: Thêm script này vào GitHub Action để auto-build!")
        
    except KeyboardInterrupt:
        print("\n❌ Đã hủy")
    except Exception as e:
        print(f"\n❌ Lỗi: {e}")
        import traceback
        traceback.print_exc()