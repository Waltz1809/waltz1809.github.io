# Board Game Story Reader

Một trang web đọc truyện với dark theme hiện đại, được tối ưu hóa để hiển thị nội dung từ file YAML.

## 🌟 Tính năng

- ✨ **Dark/Light Theme**: Chuyển đổi dễ dàng giữa theme tối và sáng
- 📱 **Responsive Design**: Tương thích hoàn hảo trên mọi thiết bị
- 🔤 **Tùy chỉnh Font Size**: 4 cấp độ cỡ chữ khác nhau
- 📖 **Mục lục tương tác**: Điều hướng nhanh chóng giữa các chương
- 📊 **Thanh tiến độ đọc**: Theo dõi tiến độ đọc
- ⚡ **Tải nhanh**: Tối ưu hiệu suất với lazy loading
- 🎨 **Hiệu ứng mượt mà**: Animations và transitions đẹp mắt
- 💾 **Lưu cài đặt**: Ghi nhớ theme và cỡ chữ
- ⌨️ **Phím tắt**: Hỗ trợ điều khiển bằng bàn phím

## 🎯 Phím tắt

- `Ctrl + T`: Chuyển đổi theme
- `Ctrl + +`: Tăng cỡ chữ
- `Ctrl + -`: Giảm cỡ chữ
- `Esc`: Đóng modal

## 📁 Cấu trúc file

```
waltz1809.github.io/
├── index.html          # File HTML chính
├── style.css           # CSS với dark theme
├── script.js           # JavaScript logic
├── data.yaml           # Dữ liệu nội dung truyện
└── README.md           # Tài liệu hướng dẫn
```

## 🚀 Cách triển khai

### 1. GitHub Pages (Tự động)

Website sẽ tự động được triển khai tại: `https://waltz1809.github.io`

### 2. Cập nhật nội dung

Để thêm/sửa nội dung, chỉnh sửa file `data.yaml` theo format:

```yaml
- id: Chapter_1_Segment_1
  title: "Tiêu đề chương"
  content: |-
    Nội dung chương ở đây...
    
    Đoạn văn thứ hai...

- id: Chapter_1_Segment_2
  title: "Tiêu đề chương 2"
  content: |-
    Nội dung chương 2...
```

## 🎨 Tùy chỉnh giao diện

### Màu sắc

Chỉnh sửa CSS variables trong file `style.css`:

```css
:root {
    --bg-primary: #0d1117;      /* Màu nền chính */
    --accent-primary: #58a6ff;   /* Màu accent */
    --text-primary: #f0f6fc;     /* Màu chữ chính */
}
```

### Typography

```css
:root {
    --font-family: 'Inter', sans-serif;
    --font-size-base: 1rem;
}
```

## 🔧 Tính năng kỹ thuật

- **Responsive Grid Layout**: CSS Grid với breakpoints tối ưu
- **Intersection Observer**: Scroll spy cho navigation
- **Local Storage**: Lưu trữ cài đặt người dùng
- **YAML Parser**: Sử dụng js-yaml để parse dữ liệu
- **Performance Optimized**: Debounced scroll events
- **Accessibility**: ARIA labels và keyboard navigation

## 📱 Responsive Breakpoints

- **Desktop**: > 768px - Full layout với sidebar
- **Tablet**: ≤ 768px - Collapsed navigation
- **Mobile**: ≤ 480px - Optimized mobile layout

## 🎭 Theme System

Website hỗ trợ 2 theme:

### Dark Theme (Mặc định)
- Background: GitHub Dark
- Accent: Blue tones
- High contrast cho dễ đọc

### Light Theme
- Background: Clean white
- Accent: Consistent blue
- Eye-friendly cho ban ngày

## 📊 Cấu trúc dữ liệu YAML

```yaml
- id: unique_chapter_id       # ID duy nhất cho chapter
  title: "Chapter Title"      # Tiêu đề hiển thị
  content: |-                 # Nội dung (multiline)
    Paragraph 1
    
    Paragraph 2
    
    "Dialogue text"           # Tự động format italic
    
    (Internal thoughts)       # Tự động format as thoughts
```

## 🚀 Tối ưu hóa

- **CSS**: Minified và optimized
- **JavaScript**: ES6+ với polyfills
- **Images**: Lazy loading (nếu có)
- **Fonts**: Preload critical fonts
- **Caching**: Browser caching headers

## 🐛 Troubleshooting

### Website không tải
- Kiểm tra file `data.yaml` có đúng format
- Mở Developer Console để xem lỗi

### Theme không chuyển đổi
- Clear browser cache
- Kiểm tra Local Storage

### Mobile không responsive
- Kiểm tra viewport meta tag
- Test trên nhiều thiết bị

## 📝 License

MIT License - Tự do sử dụng và chỉnh sửa.

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push và tạo Pull Request

---

Được tạo bởi AI Assistant với ❤️ cho cộng đồng đọc truyện Việt Nam. 