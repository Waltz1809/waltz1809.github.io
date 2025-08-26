# 📚 Story Reader - Dark Mode Web Reader

Một website đọc truyện responsive với giao diện dark mode, hỗ trợ AJAX navigation và auto-pagination.

## ✨ Tính năng

- 🌙 **Dark Mode mặc định** - Giao diện tối thoải mái cho mắt
- 📱 **Responsive Design** - Tối ưu cho cả desktop và mobile
- 🚀 **AJAX Navigation** - Chuyển trang mượt mà không reload
- 📖 **Auto Pagination** - Tự động chia trang theo chiều cao màn hình
- ⚙️ **Tùy chỉnh** - Cỡ chữ, theme, chiều cao trang
- 🔗 **URL Routing** - Bookmark được vị trí đang đọc
- 👆 **Touch Navigation** - Hỗ trợ swipe trên mobile

## 🚀 Cách sử dụng

### 1. Cấu trúc thư mục

```
waltz1809.github.io/
├── index.html
├── css/style.css
├── js/reader.js
└── data/
    ├── stories.json          # Cấu hình danh sách truyện
    ├── story1/
    │   ├── chapter_001.json
    │   ├── chapter_002.json
    │   └── ...
    └── story2/
        ├── chapter_001.json
        └── ...
```

### 2. Format JSON

**stories.json:**
```json
{
  "stories": [
    {
      "id": "marriage",
      "title": "Marriage Novel",
      "description": "Mô tả truyện...",
      "author": "Tác giả",
      "status": "Đang cập nhật",
      "chapters": 10,
      "tags": ["Romance", "Drama"]
    }
  ]
}
```

**chapter_XXX.json:**
```json
{
  "chapter_number": 1,
  "chapter_title": "Tiêu đề chương",
  "total_segments": 1,
  "segments": [
    {
      "id": "Chapter_1_Segment_1",
      "title": "Tiêu đề segment",
      "content": "Nội dung chương..."
    }
  ]
}
```

### 3. Thêm truyện mới

1. Tạo thư mục trong `data/` với tên story ID
2. Copy các file JSON chapter vào thư mục
3. Cập nhật `data/stories.json` với thông tin truyện mới

### 4. Deploy

#### GitHub Pages:
1. Push code lên repository `username.github.io`
2. Enable GitHub Pages trong Settings
3. Truy cập `https://username.github.io`

#### Netlify:
1. Connect repository với Netlify
2. Deploy settings: Build command: none, Publish directory: ./
3. Truy cập URL được cung cấp

## 🎮 Điều khiển

### Desktop:
- **← →** hoặc **↑ ↓**: Chuyển trang
- **Escape**: Quay về danh sách chương
- **Click** các nút Previous/Next

### Mobile:
- **Swipe trái/phải**: Chuyển trang
- **Tap vùng trái/phải màn hình**: Chuyển trang
- **Tap nút điều khiển**: Navigation

## ⚙️ Cài đặt

- **Cỡ chữ**: Nhỏ (14px) → Rất lớn (20px)
- **Theme**: Dark / Light / Sepia
- **Chiều cao trang**: Ngắn (80%) → Dài (95%)

## 🔧 Tính năng kỹ thuật

- **Single Page Application** - Không reload page
- **Auto-pagination** - Tính toán tự động số trang
- **Lazy loading** - Chỉ load chapter khi cần
- **Local storage** - Lưu settings
- **URL routing** - Hash-based navigation
- **Touch gestures** - Mobile-friendly

## 📊 Performance

- ✅ Hỗ trợ hàng trăm chapter
- ✅ Fast loading với AJAX
- ✅ Responsive design
- ✅ Cross-browser compatible
- ✅ PWA-ready structure

## 🐛 Troubleshooting

1. **Không load được truyện**: Kiểm tra file `stories.json` và đường dẫn
2. **CORS errors**: Chạy local server, không mở file trực tiếp
3. **Mobile không swipe được**: Kiểm tra touch events

## 💡 Lưu ý

- File JSON phải đúng format và encoding UTF-8
- Tên file chapter theo format `chapter_XXX.json` (3 chữ số)
- Test trên local server trước khi deploy

---

Made with ❤️ for Vietnamese story readers