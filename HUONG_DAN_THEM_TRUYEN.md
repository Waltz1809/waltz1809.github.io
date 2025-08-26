# 📚 Hướng dẫn thêm truyện mới

## 🔥 Bước 1: Tạo folder truyện

Tạo folder mới trong `data/`:
```
data/
├── marriage/           (truyện hiện tại)
├── your-new-story/     (truyện mới)
│   ├── chapter_001.json
│   ├── chapter_002.json
│   └── ...
```

## 📝 Bước 2: Cập nhật stories.json

Thêm truyện vào `data/stories.json`:

```json
{
  "stories": [
    {
      "id": "marriage",
      "title": "Marriage Novel - Truyện Hôn Nhân",
      "description": "Một câu chuyện tình yêu đầy cảm động...",
      "author": "Tác giả ẩn danh",
      "status": "Đang cập nhật",
      "chapters": 494,
      "tags": ["Romance", "Drama", "Modern"],
      "lastUpdate": "2025-08-27"
    },
    {
      "id": "your-new-story",
      "title": "Tên Truyện Mới",
      "description": "Mô tả ngắn về truyện...",
      "author": "Tên tác giả",
      "status": "Hoàn thành",
      "chapters": 0,
      "tags": ["Action", "Adventure"],
      "lastUpdate": "2025-01-15"
    }
  ]
}
```

## 📖 Bước 3: Format file chapter

Mỗi file `chapter_XXX.json` phải có format:

```json
{
  "chapter_number": 1,
  "chapter_title": "Tên chương",
  "total_segments": 1,
  "segments": [
    {
      "id": "Chapter_1_Segment_1",
      "title": "Tên chương",
      "content": "Nội dung chương...\n\nCác đoạn văn cách nhau bằng \\n\\n"
    }
  ]
}
```

## ⚡ Bước 4: Deploy

1. Push lên GitHub
2. GitHub Pages tự động deploy
3. Reader sẽ tự động:
   - Đếm số chapters
   - Hiển thị trong danh sách truyện
   - Support navigation

## 🎯 Lưu ý:

- **File naming:** Phải đúng format `chapter_001.json`, `chapter_002.json`...
- **Chapters field:** Để 0, reader sẽ tự đếm
- **ID unique:** Mỗi truyện phải có ID riêng
- **Content format:** Dùng `\n\n` để ngắt đoạn

## 🚀 Auto-features:

✅ **Auto counting:** Reader tự đếm chapters
✅ **Auto pagination:** Chia trang theo số từ  
✅ **Auto navigation:** Chuyển chapter tự động
✅ **Error handling:** Báo lỗi khi hết truyện
✅ **Multi-story support:** Support nhiều truyện

Reader đã sẵn sàng cho multi-story! 🎉
