# HẠ TẦNG DEVOPS, DOCKER VÀ TỰ ĐỘNG HÓA CI/CD

**Tài liệu:** `13_DEVOPS_DOCKER_AND_CI_CD.md`  
**Dự án:** Nexora

---

## 1. Môi Trường Docker Container

- Dịch vụ cơ sở dữ liệu: `docker-compose.yml` định nghĩa container `nexora-mysql-1` sử dụng hình ảnh chính thức `mysql:8.4.3`.
- Cấu hình cổng: `3306:3306` gắn kết volume lưu trữ dữ liệu an toàn `mysql_data`.
- Chế độ kiểm tra sức khỏe (Healthcheck): Đảm bảo MySQL sẵn sàng tiếp nhận kết nối trước khi khởi động ứng dụng backend API.

---

## 2. Quy Trình Tự Động Hóa CI/CD (GitHub Actions)

Tệp workflow `.github/workflows/ci.yml` tự động kích hoạt trên mỗi Pull Request và Commit vào nhánh `main`:

1. **Kiểm tra cú pháp & quy chuẩn:** Chạy `npm run lint` (ESLint 9).
2. **Kiểm tra kiểu dữ liệu tĩnh:** Chạy `npm run typecheck` (`tsc --noEmit`).
3. **Khởi tạo dịch vụ MySQL:** Chạy MySQL service container, tự động nạp `prisma migrate deploy`.
4. **Thực thi bộ kiểm thử:** Chạy toàn bộ 64 integration tests với Vitest.
5. **Đóng gói sản xuất:** Chạy `npm run build` xác nhận không có lỗi build artifacts.
