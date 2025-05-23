# Stories Directory

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
