# Story Reader - Dynamic Multi-Story Platform

Một trang web đọc truyện với dark theme hiện đại, hỗ trợ **đa truyện động** từ file YAML.

## 🌟 Tính năng

- ✨ **Dark/Light Theme**: Chuyển đổi dễ dàng giữa theme tối và sáng
- 📚 **Multi-Story Support**: Hỗ trợ nhiều truyện cùng lúc
- 🔄 **Dynamic Loading**: Tự động detect file YAML mới
- 📱 **Responsive Design**: Tương thích hoàn hảo trên mọi thiết bị
- 🔤 **Tùy chỉnh Font Size**: 4 cấp độ cỡ chữ khác nhau
- 📖 **Mục lục tương tác**: Điều hướng nhanh chóng giữa các chương
- 📊 **Thanh tiến độ đọc**: Theo dõi tiến độ đọc
- 💾 **Auto-save**: Tự động lưu vị trí đọc
- ⚡ **GitHub Action**: Tự động build khi thêm file mới
- ⌨️ **Phím tắt**: Hỗ trợ điều khiển bằng bàn phím

## 🚀 Cách sử dụng

### 1. **Thêm truyện mới (Siêu dễ!)**

```bash
# Chỉ cần copy file YAML vào thư mục stories/
cp your_story.yaml stories/

# Chạy script build (hoặc GitHub Action tự động chạy)
python build-stories.py

# Website tự động update! 🎉
```

### 2. **Format file YAML**

```yaml
- id: Chapter_1_Segment_1
  title: "Tiêu đề chương"
  content: |-
    Nội dung chương ở đây...
    
    Đoạn văn thứ hai...
    
    "Dialogue sẽ được format đặc biệt"
    
    (Thoughts sẽ được style khác)

- id: Chapter_1_Segment_2
  title: "Chương tiếp theo"
  content: |-
    Nội dung tiếp...
```

### 3. **Tự động với GitHub Action**

File sẽ được tự động build khi:
- Push file `.yaml` vào thư mục `stories/`
- GitHub Action chạy `build-stories.py`
- Website tự động cập nhật danh sách truyện

## 🎯 Phím tắt

- `Ctrl + T`: Chuyển đổi theme
- `Ctrl + R`: Refresh danh sách truyện
- `Ctrl + +`: Tăng cỡ chữ
- `Ctrl + -`: Giảm cỡ chữ
- `Alt + ↑/↓`: Chuyển truyện
- `Esc`: Đóng modal

## 📁 Cấu trúc dự án

```
waltz1809.github.io/
├── index.html              # File HTML chính
├── style.css               # CSS với dark theme
├── script.js               # JavaScript logic
├── build-stories.py        # Script build tự động
├── stories/                # 📂 Thư mục chứa file YAML
│   ├── index.json         #    (Auto-generated)
│   ├── README.md          #    Hướng dẫn
│   ├── story1.yaml        #    📖 Truyện 1
│   ├── story2.yaml        #    📖 Truyện 2
│   └── ...                #    📖 Các truyện khác
├── .github/workflows/      # GitHub Actions
│   └── build-stories.yml  #    Auto-build workflow
└── README.md               # Tài liệu này
```

## 🔧 Hệ thống Dynamic Story

### **Hoạt động như thế nào:**

1. **Script scan** thư mục `stories/` tìm file `.yaml`
2. **Parse metadata** từ mỗi file (số chương, kích thước, etc.)
3. **Generate** file `stories/index.json` với thông tin tất cả truyện
4. **Website load** index.json và tạo dropdown
5. **User chọn** truyện → Load YAML → Hiển thị content

### **Auto-categorization:**

Script tự động phân loại truyện theo tên file:
- `boardgame_*.yaml` → "Board Game"
- `junna_*.yaml` → "Junna Series"  
- `vol*.yaml` → "Noucome"
- `genben_*.yaml` → "Genben"
- etc...

## 🎨 Tùy chỉnh

### **Thêm series mới:**

Chỉnh sửa function `categorize_stories()` trong `build-stories.py`:

```python
elif 'your_series' in filename.lower():
    series = 'Your Series Name'
```

### **Custom title format:**

Chỉnh sửa function `format_story_title()`:

```python
def format_story_title(filename):
    # Your custom logic here
    return formatted_title
```

### **Màu sắc theme:**

```css
:root {
    --bg-primary: #your-color;
    --accent-primary: #your-accent;
}
```

## 🤖 GitHub Action Setup

Action sẽ tự động chạy khi:

```yaml
on:
  push:
    paths:
      - 'stories/*.yaml'      # File YAML mới
      - 'build-stories.py'    # Script thay đổi
  workflow_dispatch:          # Manual trigger
```

**Permissions cần thiết:**
- `contents: write` (để commit file index.json)

## 📊 Tính năng nâng cao

### **Auto-save Reading Position**
- Tự động lưu vị trí đọc cho mỗi truyện
- Restore khi quay lại truyện

### **Smart Caching**
- LocalStorage cache cho cài đặt
- Browser cache cho file YAML

### **Reading Progress**
- Progress bar theo scroll
- Chapter highlight trong TOC

### **Responsive Design**
- Desktop: Full sidebar layout
- Tablet: Collapsed navigation  
- Mobile: Stack layout

## 🚀 Triển khai

### **GitHub Pages (Recommend):**

1. Push code lên repository `username.github.io`
2. Enable GitHub Pages trong Settings
3. Website tự động deploy tại `https://username.github.io`

### **Local Development:**

```bash
# Clone repo
git clone https://github.com/username/username.github.io.git
cd username.github.io

# Add stories
cp your_stories/*.yaml stories/

# Build index
python build-stories.py

# Serve locally (Python)
python -m http.server 8000

# Hoặc (Node.js)
npx serve .
```

## 🔍 Troubleshooting

### **Truyện không hiện trong dropdown:**
1. Kiểm tra file YAML có đúng format
2. Chạy `python build-stories.py` để rebuild
3. Check `stories/index.json` có được tạo

### **Lỗi load truyện:**
1. Mở Developer Console (F12)
2. Check lỗi CORS (cần serve qua HTTP)
3. Kiểm tra path file trong `index.json`

### **GitHub Action không chạy:**
1. Check workflow permissions
2. Verify Python dependencies
3. Check file paths trong trigger

## 📝 Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 🎉 Example Usage

```bash
# Thêm truyện mới
echo "- id: test
  title: Test Chapter
  content: Hello World!" > stories/test.yaml

# Build và deploy
python build-stories.py
git add . && git commit -m "Add new story" && git push

# Website tự động update! 🚀
```

---

**Made with ❤️ for Vietnamese story readers**

*Hỗ trợ unlimited stories, unlimited possibilities!* ✨ 