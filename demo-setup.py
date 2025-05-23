#!/usr/bin/env python3
"""
Demo Setup Script
Tạo các file YAML ví dụ để test hệ thống
"""

import os
from pathlib import Path

def create_demo_stories():
    """Tạo các file YAML demo"""
    
    stories_dir = Path('stories')
    stories_dir.mkdir(exist_ok=True)
    
    # Demo Story 1: Board Game
    boardgame_content = """- id: Chapter_1_Segment_1
  title: "Khởi đầu cuộc chơi"
  content: |-
    Tôi ngồi đối diện với cô ấy, giữa chúng tôi là bàn cờ vua cổ kính.
    
    "Bạn có chắc muốn chơi không?" cô hỏi, giọng điệu thách thức.
    
    Tôi mỉm cười, nhặt quân vua trắng lên. "Tất nhiên. Nhưng tôi cảnh báo trước, tôi không dễ thắng đâu."
    
    (Thực ra tôi chỉ biết luật cơ bản thôi...)

- id: Chapter_1_Segment_2
  title: "Nước đi đầu tiên"
  content: |-
    Cô di chuyển quân tốt e2 lên e4 một cách tự tin.
    
    "King's Pawn opening," cô nói. "Cổ điển nhưng hiệu quả."
    
    Tôi suy nghĩ một lúc rồi đáp lại bằng e5. An toàn và ổn định.
    
    "Hmm, không tệ," cô gật đầu tán thưởng. "Ít nhất bạn biết phản ứng cơ bản."
    
    (Cảm giác như cô ấy đang đánh giá tôi...)

- id: Chapter_1_Segment_3
  title: "Cuộc chiến trí tuệ"
  content: |-
    Mười lăm phút trôi qua, bàn cờ đã trở nên phức tạp hơn nhiều.
    
    Tôi nhận ra cô ấy đang dần giành được thế thượng phong. Mỗi nước đi của cô đều có mục đích rõ ràng, trong khi tôi chỉ đang phản ứng thụ động.
    
    "Chiếu tướng," cô nói nhẹ nhàng, di chuyển quân hậu.
    
    Tôi nhìn xuống bàn cờ, cảm thấy hoảng sợ. Vua của tôi đang bị đe dọa từ ba hướng khác nhau.
    
    (Mình đã thua rồi sao?)
"""

    # Demo Story 2: School Life
    school_content = """- id: School_Day_1
  title: "Ngày đầu tiên"
  content: |-
    Tiếng chuông báo hiệu giờ học đầu tiên vang lên.
    
    Tôi bước vào lớp học mới với cảm giác lo lắng. Đây là trường mới, bạn bè mới, tất cả đều xa lạ.
    
    "Các em chào cô!" Giọng cô giáo nghe rất hiền.
    
    "Chào cô ạ!" Cả lớp đồng thanh đáp lại.

- id: School_Day_2  
  title: "Bạn mới"
  content: |-
    Giờ ra chơi, tôi ngồi một mình ở góc sân trường.
    
    "Chào bạn! Mình là Minh, còn bạn tên gì?"
    
    Tôi ngẩng đầu lên, thấy một cậu bạn trai đang mỉm cười thân thiện.
    
    "Mình là... Hà," tôi đáp một cách ngập ngừng.
    
    "Bạn mới chuyển đến à? Muốn đi chơi với nhóm mình không?"
    
    (Cuối cùng cũng có người bạn đầu tiên...)
"""

    # Demo Story 3: Fantasy Adventure
    fantasy_content = """- id: Adventure_Begin
  title: "Khởi hành"
  content: |-
    Mặt trời mọc sau dãy núi xa, nhuộm màu vàng rực cả khu rừng.
    
    "Đã đến lúc rồi," Eldrin nói, kiểm tra lại thanh kiếm của mình lần cuối. "Hành trình đến thành phố Luminari sẽ mất ba ngày."
    
    Tôi đeo ba lô lên vai, cảm thấy hồi hộp. Đây là lần đầu tiên tôi rời khỏi làng.
    
    "Đừng lo," cô pháp sư Luna nói, ánh mắt dịu dàng. "Chúng ta sẽ bảo vệ nhau."
    
    (Cuộc phiêu lưu của tôi bắt đầu từ đây...)

- id: Adventure_Forest
  title: "Khu rừng bí ẩn"
  content: |-
    Chúng tôi đi sâu vào rừng, ánh sáng mặt trời chỉ có thể xuyên qua được vài tia.
    
    "Có gì đó không ổn," Eldrin dừng lại, tay đặt lên chuôi kiếm.
    
    Bỗng nhiên, tiếng gầm rú vang lên từ bụi rậm. Một con sói khổng lồ xuất hiện, mắt đỏ như máu.
    
    "Shadow Wolf!" Luna thốt lên. "Cẩn thận, chúng có thể sử dụng ma thuật!"
    
    Trận chiến đầu tiên của chúng tôi bắt đầu...
"""

    # Write demo files
    demos = [
        ('boardgame_demo.yaml', boardgame_content),
        ('school_life_demo.yaml', school_content),
        ('fantasy_adventure_demo.yaml', fantasy_content)
    ]
    
    for filename, content in demos:
        filepath = stories_dir / filename
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Tạo {filepath}")
    
    return len(demos)

def main():
    print("🎬 Demo Setup Script")
    print("====================")
    
    # Create demo stories
    count = create_demo_stories()
    
    print(f"\n📚 Đã tạo {count} file demo")
    print("\n🚀 Chạy lệnh sau để build:")
    print("   python build-stories.py")
    print("\n🌐 Sau đó mở website để xem kết quả!")
    
    # Run build script if it exists
    build_script = Path('build-stories.py')
    if build_script.exists():
        print("\n🔨 Tự động chạy build script...")
        import subprocess
        try:
            result = subprocess.run(['python', 'build-stories.py'], 
                                 capture_output=True, text=True)
            if result.returncode == 0:
                print("✅ Build thành công!")
            else:
                print(f"❌ Build lỗi: {result.stderr}")
        except Exception as e:
            print(f"❌ Không thể chạy build script: {e}")

if __name__ == "__main__":
    main() 