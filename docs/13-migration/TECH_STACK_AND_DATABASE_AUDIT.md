# BÁO CÁO KIỂM TOÁN CÔNG NGHỆ & CƠ SỞ DỮ LIỆU MYSQL 8.4
**Mã tài liệu:** `NEXORA-DOC-13-TECH-STACK-05`  
**Ngày cập nhật:** `21/11/2026`  
**Trạng thái:** `ĐÃ HOÀN TẤT & ĐÃ XÁC MINH (PASS)`  
**Tác giả:** System Architect & Database Engineer  

---

## 1. Kiểm Toán Tuân Thủ Tech Stack Đã Khóa (Locked Stack)

Căn cứ vào `AGENTS.md` mục 2, hệ thống Nexora tuân thủ 100% các công nghệ được chỉ định bắt buộc:

| Tầng Hệ Thống | Công Nghệ Bắt Buộc | Tình Trạng Hiện Tại Trong Nexora | Trạng Thái Kiểm Toán |
|---|---|---|---|
| **Frontend Framework** | ReactJS 18+ với Vite, TypeScript | React 18.3.1 + Vite 8.3.8 + TypeScript 5.8 | **TUÂN THỦ 100% (PASS)** |
| **Frontend Styling** | Tailwind CSS 3.4+, PostCSS, Lucide/FA | Tailwind CSS 3.4.17 + FontAwesome 6 | **TUÂN THỦ 100% (PASS)** |
| **State & Data Fetching**| TanStack Query (React Query) v5 | @tanstack/react-query v5.66.11 | **TUÂN THỦ 100% (PASS)** |
| **Backend Runtime** | Node.js v20+, TypeScript, Express.js | Node.js v22.12.0 + Express.js 4.21.2 | **TUÂN THỦ 100% (PASS)** |
| **API Architecture** | RESTful JSON Envelope, Zod Validation | Chuẩn REST Envelope `{ success, data, error }`, Zod v3.24 | **TUÂN THỦ 100% (PASS)** |
| **Database Engine** | MySQL 8.4 LTS | MySQL 8.4.3 LTS (Docker Container `nexora-mysql-1`) | **TUÂN THỦ 100% (PASS)** |
| **ORM & Migrations** | Prisma ORM 5.22+, Prisma Client | Prisma ORM 5.22.0 với 100% migrations quản lý tự động | **TUÂN THỦ 100% (PASS)** |
| **Testing Suite** | Vitest, Supertest | Vitest 5.1.1, Supertest 7.0.0 (64/64 tests PASS) | **TUÂN THỦ 100% (PASS)** |

### Danh Sách Công Nghệ Nghiêm Cấm (Không Được Phép Xuất Hiện):
- Không có bất kỳ file PHP, Laravel hay view engine nào trong mã nguồn Nexora.
- Không sử dụng Next.js hay SSR React phức tạp.
- Không sử dụng PostgreSQL, MongoDB hay NoSQL.
- Không sử dụng Microservices phân tán; giữ đúng mô hình Modular Monolith.

---

## 2. Kiểm Toán Lược Đồ Cơ Sở Dữ Liệu MySQL 8.4 & Tiền Tệ Decimal

Hệ thống bao gồm 24 bảng dữ liệu chuẩn hóa 3NF, toàn bộ trường tiền tệ được bảo vệ tuyệt đối:
- **Nguyên tắc tiền tệ:** Sử dụng `Decimal(12, 2)` cho toàn bộ giá bán (`price`, `salePrice`), giá vốn (`costPrice`), giá snapshot đơn hàng (`unitPrice`, `unitCostPrice`, `discountAmount`, `subtotal`, `shippingFee`, `totalAmount`).
- **Nghiêm cấm:** Không có bất kỳ trường tiền tệ nào sử dụng kiểu `FLOAT` hoặc `DOUBLE`.
- **Snapshot lịch sử đơn hàng:** Khi đơn hàng được tạo, `OrderItem` sao lưu toàn bộ thông số giá bán, giá vốn (COGS) và chiết khấu tại thời điểm mua. Hệ thống không bao giờ tính toán lại doanh thu hoặc lợi nhuận quá khứ dựa trên bảng giá sản phẩm hiện tại.
- **Tính toàn vẹn khóa ngoại (Foreign Keys):** 100% quan hệ giữa `Order` - `OrderItem` - `Product` - `Category` - `Brand` - `User` đều có ràng buộc Referential Integrity chặt chẽ (`ON DELETE RESTRICT` hoặc `CASCADE` có kiểm soát).
