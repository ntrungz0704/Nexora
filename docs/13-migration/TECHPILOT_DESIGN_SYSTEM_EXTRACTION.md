# TECHPILOT_DESIGN_SYSTEM_EXTRACTION.md — Trích Xuất Hệ Thống Thiết Kế Gốc

Tài liệu này trích xuất toàn bộ biến màu sắc, typography, component tokens, khoảng cách, bóng đổ và quy tắc giao diện từ hệ thống TechPilot gốc (`public/assets/css/style.css`, `category-mega-menu.css`, `news.css`, `search-filters.css`) sang hệ thống Nexora.

---

## 1. Bảng Màu Thương Hiệu (Color Palette)

| Biến CSS               | Giá trị HEX / HSL | Mục đích sử dụng                                                             |
| :--------------------- | :---------------- | :--------------------------------------------------------------------------- |
| `--primary`            | `#0A5BFF`         | Màu xanh chủ đạo thương hiệu (Brand Blue), nút bấm chính, link active, badge |
| `--primary-hover`      | `#0047D4`         | Trạng thái hover của nút bấm chính                                           |
| `--secondary`          | `#F8FAFC`         | Nền phụ, background của thẻ phụ                                              |
| `--accent`             | `#FF424E`         | Màu đỏ khuyến mãi, Flash sale, giảm giá, badge -%                            |
| `--success`            | `#22C55E`         | Màu xanh lá xác nhận thành công, bảo hành, cam kết                           |
| `--warning`            | `#FACC15`         | Màu vàng sao đánh giá, nút cấu hình PC, điểm nổi bật                         |
| `--info`               | `#00C8FF`         | Xanh ngọc thông tin, tra cứu, công nghệ                                      |
| `--techpilot-graphite` | `#111827`         | Màu xám than của thanh topbar, nền thẻ tối                                   |
| `--surface-card`       | `#FFFFFF`         | Nền thẻ sản phẩm, thẻ đăng nhập, modal                                       |
| `--surface-muted`      | `#F3F4F6`         | Nền ô input, nền dropdown hover, bảng phụ                                    |
| `--text-primary`       | `#111827`         | Màu chữ tiêu đề và nội dung chính                                            |
| `--text-secondary`     | `#6B7280`         | Màu chữ phụ, mô tả, thông số kỹ thuật                                        |
| `--border`             | `#E5E7EB`         | Đường viền thẻ, viền input, đường phân cách                                  |

---

## 2. Typography & Phông Chữ

- **Font Family chính:** `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Font Sizes:**
  - Tiêu đề Hero: `32px` (Weight: `800`, Line-height: `1.2`)
  - Tiêu đề Section (`Sản phẩm nổi bật`): `22px` (Weight: `800`)
  - Tiêu đề Card: `14px` (Weight: `600`, Line-height: `1.4`)
  - Giá bán hiện tại: `16px - 18px` (Weight: `800`, Color: `--primary`)
  - Giá gốc gạch ngang: `12px` (Text-decoration: `line-through`, Color: `--text-secondary`)
  - Specs Pill: `11px` (Weight: `500`, Background: `#F1F5F9`)
  - Badge giảm giá: `11px` (Weight: `700`, Color: `#FFFFFF`)

---

## 3. Component Specs & Classes Chuẩn

### 3.1. Thẻ Xác Thực (`.auth-card`)

```css
.auth-card {
  background-color: var(--surface-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.07);
  width: 100%;
  max-width: 480px;
  padding: 28px 24px;
}
```

### 3.2. Nút Bấm Chính (`.auth-btn-primary`, `.btn--primary`)

```css
.auth-btn-primary {
  width: 100%;
  height: 50px;
  background: linear-gradient(135deg, #0a5bff, #3b82f6);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(10, 91, 255, 0.3);
}
```

### 3.3. Thẻ Sản Phẩm (`.product-card`)

```css
.product-card {
  background: var(--surface-card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 14px;
  position: relative;
  display: flex;
  flex-direction: column;
  transition: all 0.25s ease;
}
.product-card:hover {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
  border-color: #cbd5e1;
}
```

### 3.4. Hero Carousel Slide (`.carousel-slide`)

```css
.carousel-slide {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.5s ease-in-out;
  background-size: cover;
  background-position: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 40px 60px;
  color: #fff;
  z-index: 1;
}
.carousel-slide.is-active {
  opacity: 1;
  z-index: 2;
}
```

---

## 4. Quy Chuẩn Dark Mode

- Sử dụng class `dark-mode` trên phần tử `<html>`.
- Khi kích hoạt `dark-mode`:
  - `--surface-card` chuyển sang `#1E293B`
  - `--border` chuyển sang `#334155`
  - `--text-primary` chuyển sang `#F8FAFC`
  - Nền toàn trang chuyển sang `#0F172A`
  - Thẻ sản phẩm thumbnail chuyển nền sang `#0F172A`
