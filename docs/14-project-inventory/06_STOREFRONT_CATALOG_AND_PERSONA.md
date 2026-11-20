# CỬA HÀNG TRỰC TUYẾN, DANH MỤC VÀ HỆ THỐNG GỢI Ý PERSONA
**Tài liệu:** `06_STOREFRONT_CATALOG_AND_PERSONA.md`  
**Dự án:** Nexora  

---

## 1. Trình Diễn Danh Mục 16 Ngành Hàng Phần Cứng

Nexora phân loại rõ ràng 16 nhóm ngành hàng công nghệ:
1. Laptop / Gaming Laptop
2. Máy tính để bàn PC đồng bộ & Workstation
3. Bộ vi xử lý (CPU) Intel / AMD
4. Card đồ họa (VGA) NVIDIA GeForce / AMD Radeon
5. Bo mạch chủ (Mainboard)
6. Bộ nhớ trong (RAM) DDR4 / DDR5
7. Ổ cứng lưu trữ SSD NVMe / HDD
8. Nguồn máy tính (PSU) 80 Plus
9. Vỏ thùng máy (Case)
10. Hệ thống tản nhiệt (Tản khí, Tản nước AIO/Custom)
11. Màn hình máy tính chuyên game & đồ họa
12. Bàn phím cơ & Chuột gaming
13. Tai nghe & Loa máy tính
14. Ghế công thái học & Bàn gaming
15. Thiết bị mạng (Router Wi-Fi 6, Switch)
16. Phụ kiện & Dây cáp chuyển đổi

---

## 2. Thuật Toán Chấm Điểm Persona Động

Thay vì gán điểm tĩnh cố định, Nexora sử dụng thuật toán tính điểm Persona động dựa trên thông số phần cứng thực tế:
- **Gamer Persona:** Ưu tiên hiệu năng card đồ họa (VGA VRAM >= 8GB, TGP), xung nhịp đơn nhân CPU và tần số quét màn hình (>= 144Hz).
- **Creator Persona:** Ưu tiên dung lượng RAM (>= 32GB), độ phủ màu màn hình (100% sRGB/DCI-P3) và dung lượng ổ cứng SSD NVMe tốc độ cao.
- **Office / Student Persona:** Ưu tiên trọng lượng mỏng nhẹ (< 1.5kg), thời lượng pin lâu và giá thành tối ưu dưới 20 triệu đồng.
- **Coder / Engineer Persona:** Ưu tiên số nhân/luồng CPU (>= 8 nhân 16 luồng), RAM dung lượng lớn và khả năng nâng cấp linh kiện linh hoạt.
