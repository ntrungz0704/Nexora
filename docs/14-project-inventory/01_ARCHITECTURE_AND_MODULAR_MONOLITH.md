# KIẾN TRÚC HỆ THỐNG & NGUYÊN TẮC MODULAR MONOLITH
**Tài liệu:** `01_ARCHITECTURE_AND_MODULAR_MONOLITH.md`  
**Dự án:** Nexora — Single-Vendor Hardware E-Commerce  

---

## 1. Triết Lý Kiến Trúc Modular Monolith

Nexora kiên định triển khai mô hình kiến trúc **Modular Monolith** thay vì phân mảnh thành microservices sớm hoặc duy trì khối monolith spaghetti:
1. **Một cơ sở dữ liệu duy nhất (Single Source of Truth):** Toàn bộ giao dịch bán hàng, người dùng, tồn kho và chiết khấu tập trung tại MySQL 8.4 LTS, đảm bảo tính toàn vẹn ACID tuyệt đối.
2. **Các mô-đun nghiệp vụ độc lập:** Mỗi mô-đun trong `apps/api/src/modules/` (auth, catalog, cart, orders, payment, admin, ai) tự sở hữu routes, controllers, services, repositories và validations riêng.
3. **Không phụ thuộc vòng (No Circular Dependencies):** Không có sự giao thoa trực tiếp giữa tầng lưu trữ dữ liệu với frontend React; mọi tương tác phải thông qua API RESTful.
4. **Hợp đồng kiểu dữ liệu dùng chung (Shared Contracts):** Gói `packages/shared` định nghĩa duy nhất các Zod Schemas và TypeScript DTOs, đảm bảo tính đồng bộ hoàn hảo giữa máy chủ và trình duyệt.
