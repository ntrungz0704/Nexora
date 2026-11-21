# 03. Source Code Deep Analysis (100% Source File Inventory)

- **Tổng số file source code & test TS/TSX/JS được phân tích:** 119 file
- **Tổng số dòng viết tay (Source + Tests + Seed):** 32,881 LOC
- **Phương pháp trích xuất:** Quét tĩnh 100% tệp tin kết hợp đọc chi tiết toàn bộ module cốt lõi (Auth, Order, Payment, AI, Admin, AppRoutes, Cart, Checkout, Profile).

---

### 1. `apps/api/src/common/errors.ts`

- **File Name:** `errors.ts` | **Lines:** 16 | **Size:** 0.4 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Core application bootstrap / configuration / utility module
- **Imports (1):** `@nexora/shared`
- **Exports (1):** `AppError`
- **Classes:** `AppError`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (20):** `apps/api/src/middleware/errorHandler.ts`, `apps/api/src/middleware/notFoundHandler.ts`, `apps/api/src/middleware/validateRequest.ts`, `apps/api/src/modules/admin/admin.controller.ts`, `apps/api/src/modules/admin/admin.service.ts`, `apps/api/src/modules/ai/ai.controller.ts`, `apps/api/src/modules/ai/ai.service.ts`, `apps/api/src/modules/auth/auth.middleware.ts`, `apps/api/src/modules/auth/auth.service.ts`, `apps/api/src/modules/cart/cart.service.ts`, `apps/api/src/modules/catalog/catalog.service.ts`, `apps/api/src/modules/marketing/marketing.controller.ts`, `apps/api/src/modules/marketing/marketing.service.ts`, `apps/api/src/modules/order/order.controller.ts`, `apps/api/src/modules/order/order.service.ts`, `apps/api/src/modules/payment/payment.controller.ts`, `apps/api/src/modules/payment/payment.service.ts`, `apps/api/src/modules/system/system.service.ts`, `apps/api/src/modules/wishlist/wishlist.controller.ts`, `apps/api/src/modules/wishlist/wishlist.service.ts`

### 2. `apps/api/src/common/http.ts`

- **File Name:** `http.ts` | **Lines:** 14 | **Size:** 0.4 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Core application bootstrap / configuration / utility module
- **Imports (2):** `@nexora/shared`, `express`
- **Exports (1):** `sendSuccess`
- **Symbols:** _Script / declarative module_
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (9):** `apps/api/src/modules/admin/admin.controller.ts`, `apps/api/src/modules/ai/ai.controller.ts`, `apps/api/src/modules/auth/auth.controller.ts`, `apps/api/src/modules/cart/cart.controller.ts`, `apps/api/src/modules/catalog/catalog.controller.ts`, `apps/api/src/modules/marketing/marketing.controller.ts`, `apps/api/src/modules/order/order.controller.ts`, `apps/api/src/modules/payment/payment.controller.ts`, `apps/api/src/modules/system/system.controller.ts`

### 3. `apps/api/src/common/prisma.ts`

- **File Name:** `prisma.ts` | **Lines:** 18 | **Size:** 0.4 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Core application bootstrap / configuration / utility module
- **Imports (1):** `@prisma/client`
- **Exports (2):** `getPrismaClient`, `disconnectPrisma`
- **Functions:** `getPrismaClient`, `disconnectPrisma`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (7):** `apps/api/src/modules/auth/auth.service.ts`, `apps/api/src/modules/cart/cart.service.ts`, `apps/api/src/modules/catalog/catalog.repository.ts`, `apps/api/src/modules/system/system.repository.ts`, `apps/api/src/modules/wishlist/wishlist.service.ts`, `apps/api/src/server.ts`, `apps/api/tests/db.integration.test.ts`

### 4. `apps/api/src/config/env.ts`

- **File Name:** `env.ts` | **Lines:** 59 | **Size:** 1.8 KB | **Inspection:** `FULL_MANUAL`
- **Purpose:** Core application bootstrap / configuration / utility module
- **Imports (2):** `dotenv`, `zod`
- **Exports (4):** `EnvSchema`, `AppEnv`, `parseEnv`, `getEnv`
- **Components:** `EnvSchema`
- **Functions:** `parseEnv`, `getEnv`
- **Types:** `AppEnv`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (9):** `apps/api/src/modules/auth/auth.middleware.ts`, `apps/api/src/modules/auth/auth.service.ts`, `apps/api/src/modules/email/email.service.ts`, `apps/api/src/app.ts`, `apps/api/src/server.ts`, `apps/api/tests/app.test.ts`, `apps/api/tests/auth_password_reset_security.test.ts`, `apps/api/tests/db.integration.test.ts`, `apps/api/tests/storefront.integration.test.ts`

### 5. `apps/api/src/config/swagger.ts`

- **File Name:** `swagger.ts` | **Lines:** 75 | **Size:** 2.0 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Core application bootstrap / configuration / utility module
- **Imports (1):** `@nexora/config`
- **Exports (1):** `buildOpenApiSpec`
- **Functions:** `buildOpenApiSpec`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (1):** `apps/api/src/app.ts`

### 6. `apps/api/src/middleware/errorHandler.ts`

- **File Name:** `errorHandler.ts` | **Lines:** 35 | **Size:** 0.9 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Express request/auth/validation/error middleware
- **Imports (3):** `@nexora/shared`, `express`, `../common/errors.js`
- **Exports (1):** `errorHandler`
- **Functions:** `errorHandler`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (1):** `apps/api/src/app.ts`

### 7. `apps/api/src/middleware/notFoundHandler.ts`

- **File Name:** `notFoundHandler.ts` | **Lines:** 7 | **Size:** 0.3 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Express request/auth/validation/error middleware
- **Imports (2):** `express`, `../common/errors.js`
- **Exports (1):** `notFoundHandler`
- **Functions:** `notFoundHandler`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (1):** `apps/api/src/app.ts`

### 8. `apps/api/src/middleware/validateRequest.ts`

- **File Name:** `validateRequest.ts` | **Lines:** 21 | **Size:** 0.6 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Express request/auth/validation/error middleware
- **Imports (3):** `express`, `zod`, `../common/errors.js`
- **Exports (1):** `validateBody`
- **Symbols:** _Script / declarative module_
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (1):** `apps/api/src/modules/system/system.routes.ts`

### 9. `apps/api/src/modules/admin/admin.controller.ts`

- **File Name:** `admin.controller.ts` | **Lines:** 497 | **Size:** 15.1 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** HTTP request parsing, Zod validation & response envelope formatting
- **Imports (6):** `express`, `./admin.service.js`, `../order/order.service.js`, `../../common/http.js`, `../../common/errors.js`, `@prisma/client`
- **Exports (1):** `AdminController`
- **Classes:** `AdminController`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (1):** `apps/api/src/modules/admin/admin.routes.ts`

### 10. `apps/api/src/modules/admin/admin.routes.ts`

- **File Name:** `admin.routes.ts` | **Lines:** 82 | **Size:** 3.0 KB | **Inspection:** `FULL_MANUAL`
- **Purpose:** Express router endpoint registration & middleware binding
- **Imports (3):** `express`, `./admin.controller.js`, `../auth/auth.middleware.js`
- **Exports (1):** `createAdminRouter`
- **Functions:** `createAdminRouter`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (1):** `apps/api/src/routes/index.ts`

### 11. `apps/api/src/modules/admin/admin.service.ts`

- **File Name:** `admin.service.ts` | **Lines:** 1002 | **Size:** 33.4 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Domain business logic, transactions & orchestration
- **Imports (3):** `@prisma/client`, `../../common/errors.js`, `@nexora/shared`
- **Exports (5):** `CreateProductInput`, `UpdateProductInput`, `CreateCategoryInput`, `UpdateCategoryInput`, `AdminService`
- **Classes:** `AdminService`
- **Methods:** `getDashboardSummary`, `getProducts`, `createProduct`, `updateProduct`, `deleteProduct`, `generateAiProductDescription`, `getCategories`, `createCategory`, `updateCategory`, `generateAiCategory`, `getInventoryLogs`, `adjustStock`, `getOrderDetail`, `getCoupons`, `normalizeCouponType`, `createCoupon`, `updateCoupon`, `deleteCoupon`, `toggleCouponStatus`, `getFlashSales`, `createFlashSale`, `toggleFlashSaleStatus`, `deleteFlashSale`, `updateFlashSale`, `getBanners (+20)`
- **Interfaces:** `CreateProductInput`, `UpdateProductInput`, `CreateCategoryInput`, `UpdateCategoryInput`
- **Types:** `ProductWithRelations`
- **Prisma DB Models Touched:** `prisma.order`, `prisma.user`, `prisma.product`, `prisma.orderItem`, `prisma.category`, `prisma.inventoryLog`, `prisma.coupon`, `prisma.flashSale`, `prisma.flashSaleItem`, `prisma.banner`, `prisma.post`, `prisma.brand`, `prisma.review`
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (1):** `apps/api/src/modules/admin/admin.controller.ts`

### 12. `apps/api/src/modules/ai/ai.controller.ts`

- **File Name:** `ai.controller.ts` | **Lines:** 71 | **Size:** 2.4 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** HTTP request parsing, Zod validation & response envelope formatting
- **Imports (4):** `express`, `./ai.service.js`, `../../common/http.js`, `../../common/errors.js`
- **Exports (1):** `AiController`
- **Classes:** `AiController`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (1):** `apps/api/src/modules/ai/ai.routes.ts`

### 13. `apps/api/src/modules/ai/ai.routes.ts`

- **File Name:** `ai.routes.ts` | **Lines:** 22 | **Size:** 0.6 KB | **Inspection:** `FULL_MANUAL`
- **Purpose:** Express router endpoint registration & middleware binding
- **Imports (2):** `express`, `./ai.controller.js`
- **Exports (1):** `createAiRouter`
- **Functions:** `createAiRouter`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (1):** `apps/api/src/routes/index.ts`

### 14. `apps/api/src/modules/ai/ai.service.ts`

- **File Name:** `ai.service.ts` | **Lines:** 512 | **Size:** 21.6 KB | **Inspection:** `FULL_MANUAL`
- **Purpose:** Domain business logic, transactions & orchestration
- **Imports (2):** `@prisma/client`, `../../common/errors.js`
- **Exports (1):** `AiService`
- **Classes:** `AiService`
- **Methods:** `queryFloatingChatbot`, `runSurveyRecommendation`, `compareProducts`, `queryProductChat`, `callGeminiIfConfigured`, `mapProductToDto`
- **Types:** `ProductWithCatAndBrand`
- **Prisma DB Models Touched:** `prisma.product`, `prisma.aiAssistantLog`, `prisma.productAiChatHistory`
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (1):** `apps/api/src/modules/ai/ai.controller.ts`

### 15. `apps/api/src/modules/auth/auth.controller.ts`

- **File Name:** `auth.controller.ts` | **Lines:** 60 | **Size:** 1.9 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** HTTP request parsing, Zod validation & response envelope formatting
- **Imports (4):** `express`, `./auth.service.js`, `../../common/http.js`, `@nexora/shared`
- **Exports (1):** `AuthController`
- **Classes:** `AuthController`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (1):** `apps/api/src/modules/auth/auth.routes.ts`

### 16. `apps/api/src/modules/auth/auth.middleware.ts`

- **File Name:** `auth.middleware.ts` | **Lines:** 67 | **Size:** 2.1 KB | **Inspection:** `FULL_MANUAL`
- **Purpose:** Express request/auth/validation/error middleware
- **Imports (5):** `express`, `jsonwebtoken`, `../../config/env.js`, `../../common/errors.js`, `@nexora/shared`
- **Exports (3):** `AuthenticatedUserPayload`, `optionalAuth`, `requireAuth`
- **Functions:** `optionalAuth`, `requireAuth`
- **Interfaces:** `AuthenticatedUserPayload`, `Request`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (6):** `apps/api/src/modules/admin/admin.routes.ts`, `apps/api/src/modules/auth/auth.routes.ts`, `apps/api/src/modules/cart/cart.routes.ts`, `apps/api/src/modules/order/order.routes.ts`, `apps/api/src/modules/payment/payment.routes.ts`, `apps/api/src/modules/wishlist/wishlist.routes.ts`

### 17. `apps/api/src/modules/auth/auth.routes.ts`

- **File Name:** `auth.routes.ts` | **Lines:** 17 | **Size:** 0.5 KB | **Inspection:** `FULL_MANUAL`
- **Purpose:** Express router endpoint registration & middleware binding
- **Imports (3):** `express`, `./auth.controller.js`, `./auth.middleware.js`
- **Exports (1):** `createAuthRouter`
- **Functions:** `createAuthRouter`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (1):** `apps/api/src/routes/index.ts`

### 18. `apps/api/src/modules/auth/auth.service.ts`

- **File Name:** `auth.service.ts` | **Lines:** 288 | **Size:** 10.4 KB | **Inspection:** `FULL_MANUAL`
- **Purpose:** Domain business logic, transactions & orchestration
- **Imports (8):** `bcryptjs`, `jsonwebtoken`, `../../common/prisma.js`, `../../common/errors.js`, `../../config/env.js`, `../email/email.service.js`, `@nexora/shared`, `@prisma/client`
- **Exports (2):** `AuthResult`, `AuthService`
- **Classes:** `AuthService`
- **Functions:** `escapeHtml`
- **Methods:** `generateToken`, `login`, `register`, `getCurrentUser`, `forgotPassword`, `generatePasswordResetTokenForTest`, `resetPassword`
- **Interfaces:** `AuthResult`
- **Prisma DB Models Touched:** `prisma.user`, `prisma.cart`
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (1):** `apps/api/src/modules/auth/auth.controller.ts`

### 19. `apps/api/src/modules/cart/cart.controller.ts`

- **File Name:** `cart.controller.ts` | **Lines:** 79 | **Size:** 2.3 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** HTTP request parsing, Zod validation & response envelope formatting
- **Imports (3):** `express`, `./cart.service.js`, `../../common/http.js`
- **Exports (1):** `CartController`
- **Classes:** `CartController`
- **Methods:** `getSessionIds`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (1):** `apps/api/src/modules/cart/cart.routes.ts`

### 20. `apps/api/src/modules/cart/cart.routes.ts`

- **File Name:** `cart.routes.ts` | **Lines:** 18 | **Size:** 0.5 KB | **Inspection:** `FULL_MANUAL`
- **Purpose:** Express router endpoint registration & middleware binding
- **Imports (3):** `express`, `./cart.controller.js`, `../auth/auth.middleware.js`
- **Exports (1):** `createCartRouter`
- **Functions:** `createCartRouter`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (1):** `apps/api/src/routes/index.ts`

### 21. `apps/api/src/modules/cart/cart.service.ts`

- **File Name:** `cart.service.ts` | **Lines:** 202 | **Size:** 5.5 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Domain business logic, transactions & orchestration
- **Imports (4):** `@prisma/client`, `../../common/prisma.js`, `../../common/errors.js`, `@nexora/shared`
- **Exports (1):** `CartService`
- **Classes:** `CartService`
- **Methods:** `getOrCreateCart`, `getCartSummary`, `addItem`, `updateItem`, `removeItem`
- **Prisma DB Models Touched:** `prisma.user`, `prisma.cart`, `prisma.cartItem`, `prisma.product`
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (1):** `apps/api/src/modules/cart/cart.controller.ts`

### 22. `apps/api/src/modules/catalog/catalog.controller.ts`

- **File Name:** `catalog.controller.ts` | **Lines:** 98 | **Size:** 3.2 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** HTTP request parsing, Zod validation & response envelope formatting
- **Imports (3):** `express`, `./catalog.service.js`, `../../common/http.js`
- **Exports (1):** `CatalogController`
- **Classes:** `CatalogController`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (1):** `apps/api/src/modules/catalog/catalog.routes.ts`

### 23. `apps/api/src/modules/catalog/catalog.repository.ts`

- **File Name:** `catalog.repository.ts` | **Lines:** 148 | **Size:** 4.3 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Prisma ORM database persistence & query abstraction
- **Imports (2):** `@prisma/client`, `../../common/prisma.js`
- **Exports (2):** `ProductFilterOptions`, `CatalogRepository`
- **Classes:** `CatalogRepository`
- **Methods:** `getCategories`, `getBanners`, `getBrands`, `getProducts`, `getProductBySlug`
- **Interfaces:** `ProductFilterOptions`
- **Prisma DB Models Touched:** `prisma.category`, `prisma.banner`, `prisma.brand`, `prisma.product`
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (1):** `apps/api/src/modules/catalog/catalog.service.ts`

### 24. `apps/api/src/modules/catalog/catalog.routes.ts`

- **File Name:** `catalog.routes.ts` | **Lines:** 18 | **Size:** 0.6 KB | **Inspection:** `FULL_MANUAL`
- **Purpose:** Express router endpoint registration & middleware binding
- **Imports (2):** `express`, `./catalog.controller.js`
- **Exports (1):** `createCatalogRouter`
- **Functions:** `createCatalogRouter`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (1):** `apps/api/src/routes/index.ts`

### 25. `apps/api/src/modules/catalog/catalog.service.ts`

- **File Name:** `catalog.service.ts` | **Lines:** 137 | **Size:** 3.8 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Domain business logic, transactions & orchestration
- **Imports (4):** `@nexora/shared`, `./catalog.repository.js`, `../../common/errors.js`, `@prisma/client`
- **Exports (1):** `CatalogService`
- **Classes:** `CatalogService`
- **Methods:** `getCategoryTree`, `getBanners`, `getBrands`, `mapProductToDto`, `getProducts`, `getFlashSaleProducts`, `getFeaturedProducts`, `getProductBySlug`
- **Types:** `ProductWithRelations`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (1):** `apps/api/src/modules/catalog/catalog.controller.ts`

### 26. `apps/api/src/modules/email/email.service.ts`

- **File Name:** `email.service.ts` | **Lines:** 156 | **Size:** 4.4 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Domain business logic, transactions & orchestration
- **Imports (2):** `nodemailer`, `../../config/env.js`
- **Exports (3):** `SendEmailOptions`, `SentEmailRecord`, `EmailService`
- **Classes:** `EmailService`
- **Methods:** `initTransporter`, `isConfigured`, `sendEmail`, `sendViaResend`, `getSentEmails`, `getLastEmail`, `clearSentEmails`, `setMockFailure`
- **Interfaces:** `SendEmailOptions`, `SentEmailRecord`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** `https://api.resend.com/emails`
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (3):** `apps/api/src/modules/auth/auth.service.ts`, `apps/api/tests/auth_password_reset_security.test.ts`, `apps/api/tests/commerce_and_ai.integration.test.ts`

### 27. `apps/api/src/modules/marketing/marketing.controller.ts`

- **File Name:** `marketing.controller.ts` | **Lines:** 73 | **Size:** 2.3 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** HTTP request parsing, Zod validation & response envelope formatting
- **Imports (4):** `express`, `./marketing.service.js`, `../../common/http.js`, `../../common/errors.js`
- **Exports (1):** `MarketingController`
- **Classes:** `MarketingController`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (1):** `apps/api/src/modules/marketing/marketing.routes.ts`

### 28. `apps/api/src/modules/marketing/marketing.routes.ts`

- **File Name:** `marketing.routes.ts` | **Lines:** 17 | **Size:** 0.6 KB | **Inspection:** `FULL_MANUAL`
- **Purpose:** Express router endpoint registration & middleware binding
- **Imports (2):** `express`, `./marketing.controller.js`
- **Exports (1):** `createMarketingRouter`
- **Functions:** `createMarketingRouter`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (1):** `apps/api/src/routes/index.ts`

### 29. `apps/api/src/modules/marketing/marketing.service.ts`

- **File Name:** `marketing.service.ts` | **Lines:** 222 | **Size:** 6.6 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Domain business logic, transactions & orchestration
- **Imports (3):** `@prisma/client`, `../../common/errors.js`, `@nexora/shared`
- **Exports (1):** `MarketingService`
- **Classes:** `MarketingService`
- **Methods:** `getActiveCoupons`, `validateCoupon`, `getActiveFlashSale`, `getPublishedPosts`, `getPostBySlug`, `getPublicReviews`
- **Prisma DB Models Touched:** `prisma.coupon`, `prisma.flashSale`, `prisma.post`, `prisma.review`
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (1):** `apps/api/src/modules/marketing/marketing.controller.ts`

### 30. `apps/api/src/modules/order/order.controller.ts`

- **File Name:** `order.controller.ts` | **Lines:** 92 | **Size:** 2.9 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** HTTP request parsing, Zod validation & response envelope formatting
- **Imports (5):** `express`, `./order.service.js`, `../../common/http.js`, `@nexora/shared`, `../../common/errors.js`
- **Exports (1):** `OrderController`
- **Classes:** `OrderController`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (1):** `apps/api/src/modules/order/order.routes.ts`

### 31. `apps/api/src/modules/order/order.routes.ts`

- **File Name:** `order.routes.ts` | **Lines:** 20 | **Size:** 0.6 KB | **Inspection:** `FULL_MANUAL`
- **Purpose:** Express router endpoint registration & middleware binding
- **Imports (3):** `express`, `./order.controller.js`, `../auth/auth.middleware.js`
- **Exports (1):** `createOrderRouter`
- **Functions:** `createOrderRouter`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (1):** `apps/api/src/routes/index.ts`

### 32. `apps/api/src/modules/order/order.service.ts`

- **File Name:** `order.service.ts` | **Lines:** 509 | **Size:** 16.6 KB | **Inspection:** `FULL_MANUAL`
- **Purpose:** Domain business logic, transactions & orchestration
- **Imports (3):** `@prisma/client`, `../../common/errors.js`, `@nexora/shared`
- **Exports (1):** `OrderService`
- **Classes:** `OrderService`
- **Methods:** `createOrder`, `getOrderByCode`, `trackOrder`, `getUserOrders`, `cancelOrder`, `adminGetOrders`, `adminUpdateOrderStatus`, `mapOrderToDto`
- **Types:** `OrderWithItems`
- **Prisma DB Models Touched:** `prisma.cart`, `prisma.product`, `prisma.coupon`, `prisma.order`
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (2):** `apps/api/src/modules/admin/admin.controller.ts`, `apps/api/src/modules/order/order.controller.ts`

### 33. `apps/api/src/modules/payment/payment.controller.ts`

- **File Name:** `payment.controller.ts` | **Lines:** 56 | **Size:** 1.8 KB | **Inspection:** `FULL_MANUAL`
- **Purpose:** HTTP request parsing, Zod validation & response envelope formatting
- **Imports (4):** `express`, `./payment.service.js`, `../../common/http.js`, `../../common/errors.js`
- **Exports (1):** `PaymentController`
- **Classes:** `PaymentController`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (1):** `apps/api/src/modules/payment/payment.routes.ts`

### 34. `apps/api/src/modules/payment/payment.routes.ts`

- **File Name:** `payment.routes.ts` | **Lines:** 19 | **Size:** 0.6 KB | **Inspection:** `FULL_MANUAL`
- **Purpose:** Express router endpoint registration & middleware binding
- **Imports (3):** `express`, `./payment.controller.js`, `../auth/auth.middleware.js`
- **Exports (1):** `createPaymentRouter`
- **Functions:** `createPaymentRouter`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (1):** `apps/api/src/routes/index.ts`

### 35. `apps/api/src/modules/payment/payment.service.ts`

- **File Name:** `payment.service.ts` | **Lines:** 282 | **Size:** 9.3 KB | **Inspection:** `FULL_MANUAL`
- **Purpose:** Domain business logic, transactions & orchestration
- **Imports (3):** `node:crypto`, `@prisma/client`, `../../common/errors.js`
- **Exports (1):** `PaymentService`
- **Classes:** `PaymentService`
- **Methods:** `getHashSecret`, `createVnpayPaymentUrl`, `verifyVnpayCallback`, `simulatePaymentSuccess`, `sortObject`, `formatDate`
- **Prisma DB Models Touched:** `prisma.order`
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (2):** `apps/api/src/modules/payment/payment.controller.ts`, `apps/api/tests/payment_security.test.ts`

### 36. `apps/api/src/modules/system/system.controller.ts`

- **File Name:** `system.controller.ts` | **Lines:** 30 | **Size:** 0.9 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** HTTP request parsing, Zod validation & response envelope formatting
- **Imports (4):** `@nexora/shared`, `express`, `../../common/http.js`, `./system.service.js`
- **Exports (1):** `SystemController`
- **Classes:** `SystemController`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (1):** `apps/api/src/modules/system/system.routes.ts`

### 37. `apps/api/src/modules/system/system.repository.ts`

- **File Name:** `system.repository.ts` | **Lines:** 33 | **Size:** 0.9 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Prisma ORM database persistence & query abstraction
- **Imports (2):** `@prisma/client`, `../../common/prisma.js`
- **Exports (2):** `SystemRepository`, `PrismaSystemRepository`
- **Classes:** `PrismaSystemRepository`
- **Methods:** `ping`, `getFoundationCounts`
- **Interfaces:** `SystemRepository`
- **Prisma DB Models Touched:** `prisma.storeSetting`, `prisma.user`
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (5):** `apps/api/src/modules/system/system.routes.ts`, `apps/api/src/modules/system/system.service.ts`, `apps/api/src/routes/index.ts`, `apps/api/src/app.ts`, `apps/api/tests/app.test.ts`

### 38. `apps/api/src/modules/system/system.routes.ts`

- **File Name:** `system.routes.ts` | **Lines:** 21 | **Size:** 0.8 KB | **Inspection:** `FULL_MANUAL`
- **Purpose:** Express router endpoint registration & middleware binding
- **Imports (6):** `@nexora/shared`, `express`, `../../middleware/validateRequest.js`, `./system.controller.js`, `./system.repository.js`, `./system.service.js`
- **Exports (1):** `createSystemRouter`
- **Functions:** `createSystemRouter`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (1):** `apps/api/src/routes/index.ts`

### 39. `apps/api/src/modules/system/system.service.ts`

- **File Name:** `system.service.ts` | **Lines:** 51 | **Size:** 1.4 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Domain business logic, transactions & orchestration
- **Imports (4):** `@nexora/config`, `@nexora/shared`, `../../common/errors.js`, `./system.repository.js`
- **Exports (1):** `SystemService`
- **Classes:** `SystemService`
- **Methods:** `getHealth`, `getMeta`, `performEchoCheck`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (2):** `apps/api/src/modules/system/system.controller.ts`, `apps/api/src/modules/system/system.routes.ts`

### 40. `apps/api/src/modules/wishlist/wishlist.controller.ts`

- **File Name:** `wishlist.controller.ts` | **Lines:** 65 | **Size:** 2.2 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** HTTP request parsing, Zod validation & response envelope formatting
- **Imports (3):** `express`, `./wishlist.service.js`, `../../common/errors.js`
- **Exports (2):** `WishlistController`, `wishlistController`
- **Classes:** `WishlistController`
- **Methods:** `getWishlist`, `toggleWishlist`, `removeFromWishlist`, `getCount`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (1):** `apps/api/src/modules/wishlist/wishlist.routes.ts`

### 41. `apps/api/src/modules/wishlist/wishlist.routes.ts`

- **File Name:** `wishlist.routes.ts` | **Lines:** 15 | **Size:** 0.7 KB | **Inspection:** `FULL_MANUAL`
- **Purpose:** Express router endpoint registration & middleware binding
- **Imports (3):** `express`, `./wishlist.controller.js`, `../auth/auth.middleware.js`
- **Exports (1):** `createWishlistRouter`
- **Functions:** `createWishlistRouter`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (1):** `apps/api/src/routes/index.ts`

### 42. `apps/api/src/modules/wishlist/wishlist.service.ts`

- **File Name:** `wishlist.service.ts` | **Lines:** 131 | **Size:** 3.0 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Domain business logic, transactions & orchestration
- **Imports (2):** `../../common/prisma.js`, `../../common/errors.js`
- **Exports (2):** `WishlistService`, `wishlistService`
- **Classes:** `WishlistService`
- **Methods:** `getWishlist`, `toggleWishlist`, `removeFromWishlist`, `getCount`
- **Prisma DB Models Touched:** `prisma.wishlist`, `prisma.product`
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (1):** `apps/api/src/modules/wishlist/wishlist.controller.ts`

### 43. `apps/api/src/routes/index.ts`

- **File Name:** `index.ts` | **Lines:** 41 | **Size:** 1.7 KB | **Inspection:** `FULL_MANUAL`
- **Purpose:** Express router endpoint registration & middleware binding
- **Imports (12):** `express`, `../modules/system/system.repository.js`, `../modules/system/system.routes.js`, `../modules/catalog/catalog.routes.js`, `../modules/auth/auth.routes.js`, `../modules/cart/cart.routes.js`, `../modules/order/order.routes.js`, `../modules/payment/payment.routes.js`, `../modules/marketing/marketing.routes.js`, `../modules/ai/ai.routes.js`, `../modules/admin/admin.routes.js`, `../modules/wishlist/wishlist.routes.js`
- **Exports (1):** `createV1Router`
- **Functions:** `createV1Router`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (1):** `apps/api/src/app.ts`

### 44. `apps/api/src/app.ts`

- **File Name:** `app.ts` | **Lines:** 62 | **Size:** 1.8 KB | **Inspection:** `FULL_MANUAL`
- **Purpose:** Core application bootstrap / configuration / utility module
- **Imports (11):** `@nexora/config`, `cors`, `express`, `helmet`, `swagger-ui-express`, `./config/env.js`, `./config/swagger.js`, `./middleware/errorHandler.js`, `./middleware/notFoundHandler.js`, `./modules/system/system.repository.js`, `./routes/index.js`
- **Exports (2):** `CreateAppOptions`, `createApp`
- **Functions:** `createApp`
- **Interfaces:** `CreateAppOptions`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (9):** `apps/api/src/server.ts`, `apps/api/tests/app.test.ts`, `apps/api/tests/auth_password_reset_security.test.ts`, `apps/api/tests/commerce_and_ai.integration.test.ts`, `apps/api/tests/db.integration.test.ts`, `apps/api/tests/payment_security.test.ts`, `apps/api/tests/rbac_and_concurrency.test.ts`, `apps/api/tests/seed_and_auth_credentials.test.ts`, `apps/api/tests/storefront.integration.test.ts`

### 45. `apps/api/src/server.ts`

- **File Name:** `server.ts` | **Lines:** 22 | **Size:** 0.6 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Core application bootstrap / configuration / utility module
- **Imports (3):** `./app.js`, `./common/prisma.js`, `./config/env.js`
- **Exports (0):** _Default/Side-effect only_
- **Functions:** `shutdown`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (0):** _Entry point / Route / Test / Standalone_

### 46. `apps/api/tests/app.test.ts`

- **File Name:** `app.test.ts` | **Lines:** 86 | **Size:** 3.2 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Automated Vitest/Supertest test suite
- **Imports (5):** `supertest`, `vitest`, `../src/app.js`, `../src/config/env.js`, `../src/modules/system/system.repository.js`
- **Exports (0):** _Default/Side-effect only_
- **Functions:** `makeFakeRepo`
- **Methods:** `ping`, `getFoundationCounts`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (0):** _Entry point / Route / Test / Standalone_

### 47. `apps/api/tests/auth_password_reset_security.test.ts`

- **File Name:** `auth_password_reset_security.test.ts` | **Lines:** 232 | **Size:** 8.6 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Automated Vitest/Supertest test suite
- **Imports (7):** `vitest`, `supertest`, `jsonwebtoken`, `../src/app.js`, `../src/modules/email/email.service.js`, `../src/config/env.js`, `express`
- **Exports (0):** _Default/Side-effect only_
- **Symbols:** _Script / declarative module_
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (0):** _Entry point / Route / Test / Standalone_

### 48. `apps/api/tests/commerce_and_ai.integration.test.ts`

- **File Name:** `commerce_and_ai.integration.test.ts` | **Lines:** 322 | **Size:** 11.5 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Automated Vitest/Supertest test suite
- **Imports (6):** `vitest`, `supertest`, `@prisma/client`, `../src/app.js`, `../src/modules/email/email.service.js`, `express`
- **Exports (0):** _Default/Side-effect only_
- **Symbols:** _Script / declarative module_
- **Prisma DB Models Touched:** `prisma.order`, `prisma.inventoryLog`, `prisma.orderItem`, `prisma.product`
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (0):** _Entry point / Route / Test / Standalone_

### 49. `apps/api/tests/db.integration.test.ts`

- **File Name:** `db.integration.test.ts` | **Lines:** 29 | **Size:** 1.1 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Automated Vitest/Supertest test suite
- **Imports (5):** `supertest`, `vitest`, `../src/app.js`, `../src/common/prisma.js`, `../src/config/env.js`
- **Exports (0):** _Default/Side-effect only_
- **Symbols:** _Script / declarative module_
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (0):** _Entry point / Route / Test / Standalone_

### 50. `apps/api/tests/payment_security.test.ts`

- **File Name:** `payment_security.test.ts` | **Lines:** 364 | **Size:** 13.0 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Automated Vitest/Supertest test suite
- **Imports (7):** `vitest`, `node:crypto`, `supertest`, `@prisma/client`, `../src/app.js`, `../src/modules/payment/payment.service.js`, `express`
- **Exports (0):** _Default/Side-effect only_
- **Symbols:** _Script / declarative module_
- **Prisma DB Models Touched:** `prisma.order`, `prisma.inventoryLog`, `prisma.orderItem`, `prisma.product`, `prisma.user`, `prisma.cart`, `prisma.cartItem`, `prisma.wishlist`
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (0):** _Entry point / Route / Test / Standalone_

### 51. `apps/api/tests/rbac_and_concurrency.test.ts`

- **File Name:** `rbac_and_concurrency.test.ts` | **Lines:** 259 | **Size:** 9.5 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Automated Vitest/Supertest test suite
- **Imports (5):** `vitest`, `supertest`, `@prisma/client`, `../src/app.js`, `express`
- **Exports (0):** _Default/Side-effect only_
- **Symbols:** _Script / declarative module_
- **Prisma DB Models Touched:** `prisma.order`, `prisma.orderItem`, `prisma.inventoryLog`, `prisma.product`
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (0):** _Entry point / Route / Test / Standalone_

### 52. `apps/api/tests/seed_and_auth_credentials.test.ts`

- **File Name:** `seed_and_auth_credentials.test.ts` | **Lines:** 109 | **Size:** 3.7 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Automated Vitest/Supertest test suite
- **Imports (6):** `vitest`, `supertest`, `@prisma/client`, `bcryptjs`, `../src/app.js`, `express`
- **Exports (0):** _Default/Side-effect only_
- **Functions:** `simulateProductionBootstrap`
- **Prisma DB Models Touched:** `prisma.user`
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (0):** _Entry point / Route / Test / Standalone_

### 53. `apps/api/tests/storefront.integration.test.ts`

- **File Name:** `storefront.integration.test.ts` | **Lines:** 97 | **Size:** 3.9 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Automated Vitest/Supertest test suite
- **Imports (5):** `supertest`, `vitest`, `../src/app.js`, `../src/config/env.js`, `@nexora/shared`
- **Exports (0):** _Default/Side-effect only_
- **Symbols:** _Script / declarative module_
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (0):** _Entry point / Route / Test / Standalone_

### 54. `apps/web/src/app/App.tsx`

- **File Name:** `App.tsx` | **Lines:** 11 | **Size:** 0.2 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Core application bootstrap / configuration / utility module
- **Imports (2):** `./providers`, `../routes/AppRoutes`
- **Exports (1):** `App`
- **Components:** `App`
- **Functions:** `App`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (1):** `apps/web/src/main.tsx`

### 55. `apps/web/src/app/providers.tsx`

- **File Name:** `providers.tsx` | **Lines:** 24 | **Size:** 0.6 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Core application bootstrap / configuration / utility module
- **Imports (3):** `@tanstack/react-query`, `react`, `react-router-dom`
- **Exports (1):** `AppProviders`
- **Components:** `AppProviders`
- **Functions:** `AppProviders`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (1):** `apps/web/src/app/App.tsx`

### 56. `apps/web/src/components/StatusCard.tsx`

- **File Name:** `StatusCard.tsx` | **Lines:** 26 | **Size:** 0.9 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Core application bootstrap / configuration / utility module
- **Imports (1):** `../types`
- **Exports (1):** `StatusCard`
- **Components:** `StatusCard`
- **Functions:** `StatusCard`
- **Interfaces:** `StatusCardProps`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 3 | Inline `style={{}}`: 0
- **Used By (1):** `apps/web/src/features/system/FoundationDashboard.tsx`

### 57. `apps/web/src/features/admin/AdminDashboardPage.tsx`

- **File Name:** `AdminDashboardPage.tsx` | **Lines:** 5924 | **Size:** 296.2 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Single-vendor Backoffice Admin Portal UI & CRUD management
- **Imports (5):** `react`, `react-router-dom`, `@tanstack/react-query`, `../../services/authService`, `@nexora/shared`
- **Exports (2):** `AdminTab`, `AdminDashboardPage`
- **Components:** `AdminPagination`, `AdminDashboardPage`
- **Functions:** `getPaginationItems`, `AdminPagination`, `getTabFromPath`, `toggleTheme`, `handleTabChange`, `showToast`, `normalizeImgUrl`, `getUserInitials`, `getApiErrorMessage`, `handleAdminLogin`, `handleGlobalSearchSubmit`, `handleOpenOrderDetail`, `handleUpdateOrderStatus`, `handleToggleProductStatus`, `handleOpenEditProduct`, `handleUpdateProduct`, `handleOpenEditCategory`, `handleUpdateCategory`, `handleToggleCategoryStatus`, `handleOpenEditBrand (+27)`
- **Methods:** `setEditProductSalePrice`, `setEditProductCategory`, `setEditProductBrand`, `setEditCouponMaxDiscount`, `setEditCouponUsageLimit`, `setEditCouponStartsAt`, `setEditCouponExpiresAt`, `setEditFsStart`, `setEditFsEnd`
- **Interfaces:** `InventoryLogItem`, `AdminCategoryItem`, `AdminBrandItem`, `AdminCouponItem`, `AdminFlashSaleItem`, `AdminBannerItem`, `AdminPostItem`, `AdminUserItem`, `AdminReviewItem`
- **Types:** `AdminTab`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** `${apiUrl}/admin/dashboard/summary`, `${apiUrl}/admin/orders?limit=100`, `${apiUrl}/admin/products?limit=1000`, `${apiUrl}/admin/categories`, `${apiUrl}/admin/inventory/logs?limit=50`, `${apiUrl}/admin/brands`, `${apiUrl}/admin/coupons`, `${apiUrl}/admin/flash-sales`, `${apiUrl}/admin/banners`, `${apiUrl}/admin/posts`, `${apiUrl}/admin/users`, `${apiUrl}/admin/reviews`, `${apiUrl}/admin/orders/${order.id}`, `${apiUrl}/admin/orders/${orderId}/status`, `${apiUrl}/admin/products/${id}`, `${apiUrl}/admin/products/${editingProduct.id}`, `${apiUrl}/admin/categories/${editingCategory.id}`, `${apiUrl}/admin/categories/${id}`, `${apiUrl}/admin/brands/${editingBrand.id}`, `${apiUrl}/admin/brands/${id}`, `${apiUrl}/admin/coupons/${editingCoupon.id}`, `${apiUrl}/admin/flash-sales/${editingFlashSale.id}`, `${apiUrl}/admin/posts/${editingPost.id}`, `${apiUrl}/admin/banners/${editingBanner.id}`, `${apiUrl}/admin/users/${id}/toggle`, `${apiUrl}/admin/users/${id}/role`, `${apiUrl}/admin/coupons/${id}/toggle`, `${apiUrl}/admin/flash-sales/${id}/toggle`, `${apiUrl}/admin/banners/${id}/toggle`, `${apiUrl}/admin/posts/${id}/toggle`, `${apiUrl}/admin/reviews/${id}`, `${apiUrl}/admin/products/ai-generate-description`, `${apiUrl}/admin/products`, `${apiUrl}/admin/inventory/adjust`
- **Styling Signals:** Tailwind matches: 984 | Inline `style={{}}`: 1
- **Used By (1):** `apps/web/src/routes/AppRoutes.tsx`

### 58. `apps/web/src/features/ai/AiAssistantPage.tsx`

- **File Name:** `AiAssistantPage.tsx` | **Lines:** 1233 | **Size:** 55.8 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** AI assistant survey & floating chatbot frontend interface
- **Imports (11):** `react`, `react-router-dom`, `@tanstack/react-query`, `../storefront/StorefrontHeader`, `../storefront/StorefrontFooter`, `../../services/storefrontService`, `../../services/cartService`, `../../services/authService`, `../../services/wishlistService`, `../../lib/productImage`, `@nexora/shared`
- **Exports (1):** `AiAssistantPage`
- **Components:** `GEAR_SUBCATS`, `AiAssistantPage`
- **Functions:** `showToast`, `handleNextStep`, `handlePrevStep`, `handleSubmitSurvey`, `resetWizard`, `handleAddToCart`, `formatPrice`
- **Interfaces:** `BudgetOption`, `CategoryOption`, `PurposeOption`, `PriorityOption`
- **Constants:** `GEAR_SUBCATS`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** `${apiUrl}/ai/assistant/survey`
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 106
- **Used By (1):** `apps/web/src/routes/AppRoutes.tsx`

### 59. `apps/web/src/features/ai/FloatingChatbot.tsx`

- **File Name:** `FloatingChatbot.tsx` | **Lines:** 323 | **Size:** 12.3 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** AI assistant survey & floating chatbot frontend interface
- **Imports (3):** `react`, `react-router-dom`, `@nexora/shared`
- **Exports (1):** `FloatingChatbot`
- **Components:** `FloatingChatbot`
- **Functions:** `scrollToBottom`, `handleSend`, `handleKeyDown`
- **Interfaces:** `ChatMessage`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** `${apiUrl}/ai/chatbot/query`
- **Styling Signals:** Tailwind matches: 19 | Inline `style={{}}`: 12
- **Used By (1):** `apps/web/src/routes/AppRoutes.tsx`

### 60. `apps/web/src/features/auth/ForgotPasswordPage.tsx`

- **File Name:** `ForgotPasswordPage.tsx` | **Lines:** 152 | **Size:** 5.0 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Customer & Admin authentication pages (Login/Register/Reset)
- **Imports (2):** `react`, `react-router-dom`
- **Exports (1):** `ForgotPasswordPage`
- **Components:** `ForgotPasswordPage`
- **Functions:** `handleSubmit`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 17
- **Used By (1):** `apps/web/src/routes/AppRoutes.tsx`

### 61. `apps/web/src/features/auth/LoginPage.tsx`

- **File Name:** `LoginPage.tsx` | **Lines:** 209 | **Size:** 8.1 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Customer & Admin authentication pages (Login/Register/Reset)
- **Imports (7):** `react`, `react-router-dom`, `../../services/authService`, `../storefront/StorefrontHeader`, `../storefront/StorefrontFooter`, `@tanstack/react-query`, `../../services/storefrontService`
- **Exports (1):** `LoginPage`
- **Components:** `LoginPage`
- **Functions:** `handleLogin`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 2 | Inline `style={{}}`: 2
- **Used By (1):** `apps/web/src/routes/AppRoutes.tsx`

### 62. `apps/web/src/features/auth/RegisterPage.tsx`

- **File Name:** `RegisterPage.tsx` | **Lines:** 353 | **Size:** 13.9 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Customer & Admin authentication pages (Login/Register/Reset)
- **Imports (7):** `react`, `react-router-dom`, `../../services/authService`, `../storefront/StorefrontHeader`, `../storefront/StorefrontFooter`, `@tanstack/react-query`, `../../services/storefrontService`
- **Exports (1):** `RegisterPage`
- **Components:** `RegisterPage`
- **Functions:** `handleRegister`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 1 | Inline `style={{}}`: 4
- **Used By (1):** `apps/web/src/routes/AppRoutes.tsx`

### 63. `apps/web/src/features/auth/ResetPasswordPage.tsx`

- **File Name:** `ResetPasswordPage.tsx` | **Lines:** 307 | **Size:** 10.1 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Customer & Admin authentication pages (Login/Register/Reset)
- **Imports (3):** `react`, `react-router-dom`, `../../services/authService`
- **Exports (1):** `ResetPasswordPage`
- **Components:** `ResetPasswordPage`
- **Functions:** `handleSubmit`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 26
- **Used By (1):** `apps/web/src/routes/AppRoutes.tsx`

### 64. `apps/web/src/features/cart/CartPage.tsx`

- **File Name:** `CartPage.tsx` | **Lines:** 755 | **Size:** 30.9 KB | **Inspection:** `FULL_MANUAL`
- **Purpose:** Shopping cart, coupon application & checkout/payment UI
- **Imports (11):** `react`, `react-router-dom`, `../storefront/StorefrontHeader`, `../storefront/StorefrontFooter`, `@tanstack/react-query`, `../../services/storefrontService`, `../../services/cartService`, `../../services/authService`, `../../services/wishlistService`, `../../lib/productImage`, `@nexora/shared`
- **Exports (1):** `CartPage`
- **Components:** `CartPage`
- **Functions:** `showToast`, `formatPrice`, `applySpecificCoupon`, `handleApplyCoupon`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 73
- **Used By (1):** `apps/web/src/routes/AppRoutes.tsx`

### 65. `apps/web/src/features/catalog/ProductDetailPage.tsx`

- **File Name:** `ProductDetailPage.tsx` | **Lines:** 951 | **Size:** 36.8 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Catalog browsing, filtering, search & product detail pages
- **Imports (12):** `react`, `react-router-dom`, `../storefront/StorefrontHeader`, `../storefront/StorefrontFooter`, `../storefront/ProductCard`, `@tanstack/react-query`, `../../services/storefrontService`, `../../services/cartService`, `../../services/authService`, `../../services/wishlistService`, `../../lib/productImage`, `@nexora/shared`
- **Exports (1):** `ProductDetailPage`
- **Components:** `IGNORED_SPEC_KEYS`, `ProductDetailPage`
- **Functions:** `parseSpecs`, `addSpec`, `traverse`, `handleAskProductAi`, `showToast`, `handleBuyNow`, `formatPrice`
- **Interfaces:** `FormattedSpec`
- **Constants:** `IGNORED_SPEC_KEYS`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** `${apiUrl}/ai/product-chat`
- **Styling Signals:** Tailwind matches: 1 | Inline `style={{}}`: 85
- **Used By (1):** `apps/web/src/routes/AppRoutes.tsx`

### 66. `apps/web/src/features/catalog/SearchPage.tsx`

- **File Name:** `SearchPage.tsx` | **Lines:** 993 | **Size:** 40.4 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Catalog browsing, filtering, search & product detail pages
- **Imports (11):** `react`, `react-router-dom`, `../storefront/StorefrontHeader`, `../storefront/StorefrontFooter`, `../storefront/ProductCard`, `@tanstack/react-query`, `../../services/storefrontService`, `../../services/cartService`, `../../services/authService`, `../../services/wishlistService`, `@nexora/shared`
- **Exports (1):** `SearchPage`
- **Components:** `BRANDS`, `PRICE_RANGES`, `SearchPage`, `PAGE_SIZE`
- **Functions:** `removeVietnameseTones`, `handleClickOutside`, `showToast`, `handleSidebarSearch`, `handleClearAllFilters`, `handlePageChange`
- **Interfaces:** `SubcategoryDef`
- **Constants:** `BRANDS`, `PRICE_RANGES`, `PAGE_SIZE`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 1 | Inline `style={{}}`: 37
- **Used By (1):** `apps/web/src/routes/AppRoutes.tsx`

### 67. `apps/web/src/features/checkout/CheckoutPage.tsx`

- **File Name:** `CheckoutPage.tsx` | **Lines:** 787 | **Size:** 33.7 KB | **Inspection:** `FULL_MANUAL`
- **Purpose:** Shopping cart, coupon application & checkout/payment UI
- **Imports (10):** `react`, `react-router-dom`, `../storefront/StorefrontHeader`, `../storefront/StorefrontFooter`, `@tanstack/react-query`, `../../services/storefrontService`, `../../services/cartService`, `../../services/authService`, `../../lib/productImage`, `@nexora/shared`
- **Exports (1):** `CheckoutPage`
- **Components:** `CheckoutPage`
- **Functions:** `handleApplyCoupon`, `applySpecificCoupon`, `formatPrice`, `handlePlaceOrder`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** `${apiUrl}/orders`
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 80
- **Used By (1):** `apps/web/src/routes/AppRoutes.tsx`

### 68. `apps/web/src/features/checkout/CheckoutSuccessPage.tsx`

- **File Name:** `CheckoutSuccessPage.tsx` | **Lines:** 223 | **Size:** 9.0 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Shopping cart, coupon application & checkout/payment UI
- **Imports (7):** `react`, `react-router-dom`, `../storefront/StorefrontHeader`, `../storefront/StorefrontFooter`, `@tanstack/react-query`, `../../services/storefrontService`, `../../services/authService`
- **Exports (1):** `CheckoutSuccessPage`
- **Components:** `CheckoutSuccessPage`
- **Functions:** `formatPrice`
- **Interfaces:** `OrderSummary`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 38
- **Used By (1):** `apps/web/src/routes/AppRoutes.tsx`

### 69. `apps/web/src/features/compare/ComparePage.tsx`

- **File Name:** `ComparePage.tsx` | **Lines:** 927 | **Size:** 43.3 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Feature-specific frontend page/component
- **Imports (11):** `react`, `react-router-dom`, `@tanstack/react-query`, `../storefront/StorefrontHeader`, `../storefront/StorefrontFooter`, `../../services/storefrontService`, `../../services/cartService`, `../../services/authService`, `../../services/wishlistService`, `../../lib/productImage`, `@nexora/shared`
- **Exports (1):** `ComparePage`
- **Components:** `ComparePage`
- **Functions:** `showToast`, `handleClickOutside`, `handleAddProduct`, `handleRemoveProduct`, `handleSelectCategory`, `handleRunAiAnalysis`
- **Interfaces:** `CompareCategoryDef`, `PersonaOption`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 9 | Inline `style={{}}`: 81
- **Used By (1):** `apps/web/src/routes/AppRoutes.tsx`

### 70. `apps/web/src/features/errors/NotFoundPage.tsx`

- **File Name:** `NotFoundPage.tsx` | **Lines:** 75 | **Size:** 2.9 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Feature-specific frontend page/component
- **Imports (10):** `react`, `react-router-dom`, `@tanstack/react-query`, `../storefront/StorefrontHeader`, `../storefront/StorefrontFooter`, `../../services/storefrontService`, `../../services/cartService`, `../../services/authService`, `../../services/wishlistService`, `@nexora/shared`
- **Exports (1):** `NotFoundPage`
- **Components:** `NotFoundPage`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 9 | Inline `style={{}}`: 0
- **Used By (1):** `apps/web/src/routes/AppRoutes.tsx`

### 71. `apps/web/src/features/info/AboutPage.tsx`

- **File Name:** `AboutPage.tsx` | **Lines:** 176 | **Size:** 10.8 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Feature-specific frontend page/component
- **Imports (9):** `react`, `react-router-dom`, `@tanstack/react-query`, `../storefront/StorefrontHeader`, `../storefront/StorefrontFooter`, `../../services/storefrontService`, `../../services/cartService`, `../../services/authService`, `../../services/wishlistService`
- **Exports (1):** `AboutPage`
- **Components:** `AboutPage`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 50 | Inline `style={{}}`: 0
- **Used By (1):** `apps/web/src/routes/AppRoutes.tsx`

### 72. `apps/web/src/features/info/CareersPage.tsx`

- **File Name:** `CareersPage.tsx` | **Lines:** 365 | **Size:** 17.2 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Feature-specific frontend page/component
- **Imports (9):** `react`, `react-router-dom`, `@tanstack/react-query`, `../storefront/StorefrontHeader`, `../storefront/StorefrontFooter`, `../../services/storefrontService`, `../../services/cartService`, `../../services/authService`, `../../services/wishlistService`
- **Exports (1):** `CareersPage`
- **Components:** `CareersPage`
- **Functions:** `handleSubmit`
- **Interfaces:** `JobPosition`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 46 | Inline `style={{}}`: 0
- **Used By (1):** `apps/web/src/routes/AppRoutes.tsx`

### 73. `apps/web/src/features/info/ContactPage.tsx`

- **File Name:** `ContactPage.tsx` | **Lines:** 293 | **Size:** 14.1 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Feature-specific frontend page/component
- **Imports (9):** `react`, `react-router-dom`, `@tanstack/react-query`, `../storefront/StorefrontHeader`, `../storefront/StorefrontFooter`, `../../services/storefrontService`, `../../services/cartService`, `../../services/authService`, `../../services/wishlistService`
- **Exports (1):** `ContactPage`
- **Components:** `ContactPage`
- **Functions:** `handleSubmit`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 50 | Inline `style={{}}`: 0
- **Used By (1):** `apps/web/src/routes/AppRoutes.tsx`

### 74. `apps/web/src/features/info/GuidePage.tsx`

- **File Name:** `GuidePage.tsx` | **Lines:** 187 | **Size:** 9.9 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Feature-specific frontend page/component
- **Imports (9):** `react`, `react-router-dom`, `@tanstack/react-query`, `../storefront/StorefrontHeader`, `../storefront/StorefrontFooter`, `../../services/storefrontService`, `../../services/cartService`, `../../services/authService`, `../../services/wishlistService`
- **Exports (1):** `GuidePage`
- **Components:** `GuidePage`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 35 | Inline `style={{}}`: 0
- **Used By (1):** `apps/web/src/routes/AppRoutes.tsx`

### 75. `apps/web/src/features/info/TechnicalSupportPage.tsx`

- **File Name:** `TechnicalSupportPage.tsx` | **Lines:** 315 | **Size:** 16.5 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Feature-specific frontend page/component
- **Imports (9):** `react`, `react-router-dom`, `@tanstack/react-query`, `../storefront/StorefrontHeader`, `../storefront/StorefrontFooter`, `../../services/storefrontService`, `../../services/cartService`, `../../services/authService`, `../../services/wishlistService`
- **Exports (1):** `TechnicalSupportPage`
- **Components:** `TechnicalSupportPage`
- **Functions:** `handleSubmit`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 56 | Inline `style={{}}`: 0
- **Used By (1):** `apps/web/src/routes/AppRoutes.tsx`

### 76. `apps/web/src/features/news/articlesData.ts`

- **File Name:** `articlesData.ts` | **Lines:** 102 | **Size:** 4.1 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Feature-specific frontend page/component
- **Imports (0):** _None_
- **Exports (2):** `ArticleItem`, `ARTICLES_SEED`
- **Interfaces:** `ArticleItem`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (2):** `apps/web/src/features/news/NewsPage.tsx`, `apps/web/src/features/news/PostDetailPage.tsx`

### 77. `apps/web/src/features/news/NewsPage.tsx`

- **File Name:** `NewsPage.tsx` | **Lines:** 448 | **Size:** 18.7 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Feature-specific frontend page/component
- **Imports (11):** `react`, `react-router-dom`, `@tanstack/react-query`, `../storefront/StorefrontHeader`, `../storefront/StorefrontFooter`, `../../services/storefrontService`, `../../services/cartService`, `../../services/authService`, `../../services/wishlistService`, `./articlesData`, `@nexora/shared`
- **Exports (1):** `NewsPage`
- **Components:** `FILTER_PILLS`, `NewsPage`
- **Functions:** `handleSearchSubmit`, `handleSelectPill`
- **Constants:** `FILTER_PILLS`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 1 | Inline `style={{}}`: 16
- **Used By (1):** `apps/web/src/routes/AppRoutes.tsx`

### 78. `apps/web/src/features/news/PostDetailPage.tsx`

- **File Name:** `PostDetailPage.tsx` | **Lines:** 377 | **Size:** 18.3 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Feature-specific frontend page/component
- **Imports (11):** `react`, `react-router-dom`, `@tanstack/react-query`, `../storefront/StorefrontHeader`, `../storefront/StorefrontFooter`, `../../services/storefrontService`, `../../services/cartService`, `../../services/authService`, `../../services/wishlistService`, `./articlesData`, `@nexora/shared`
- **Exports (1):** `PostDetailPage`
- **Components:** `PostDetailPage`
- **Functions:** `showToast`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 54
- **Used By (1):** `apps/web/src/routes/AppRoutes.tsx`

### 79. `apps/web/src/features/orderTracking/OrderTrackingPage.tsx`

- **File Name:** `OrderTrackingPage.tsx` | **Lines:** 295 | **Size:** 13.6 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Feature-specific frontend page/component
- **Imports (10):** `react`, `react-router-dom`, `@tanstack/react-query`, `../storefront/StorefrontHeader`, `../storefront/StorefrontFooter`, `../../services/storefrontService`, `../../services/cartService`, `../../services/authService`, `../../services/wishlistService`, `@nexora/shared`
- **Exports (1):** `OrderTrackingPage`
- **Components:** `OrderTrackingPage`
- **Functions:** `handleTrackOrder`
- **Interfaces:** `TrackedOrder`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 49
- **Used By (1):** `apps/web/src/routes/AppRoutes.tsx`

### 80. `apps/web/src/features/pcBuilder/PcBuilderPage.tsx`

- **File Name:** `PcBuilderPage.tsx` | **Lines:** 990 | **Size:** 40.0 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Feature-specific frontend page/component
- **Imports (11):** `react`, `react-router-dom`, `@tanstack/react-query`, `../storefront/StorefrontHeader`, `../storefront/StorefrontFooter`, `../../services/storefrontService`, `../../services/cartService`, `../../services/authService`, `../../services/wishlistService`, `../../lib/productImage`, `@nexora/shared`
- **Exports (1):** `PcBuilderPage`
- **Components:** `PcBuilderPage`
- **Functions:** `extractSocket`, `extractRamType`, `showToast`, `saveConfig`, `handleSelectProduct`, `handleToggleOwned`, `handleRemovePart`, `handleResetConfig`, `handleSelectPrebuilt`, `getProductCompatibility`, `handleAddToCart`
- **Interfaces:** `BuilderPartCategory`, `SelectedPartInfo`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 5 | Inline `style={{}}`: 52
- **Used By (1):** `apps/web/src/routes/AppRoutes.tsx`

### 81. `apps/web/src/features/policy/PolicyPage.tsx`

- **File Name:** `PolicyPage.tsx` | **Lines:** 291 | **Size:** 12.4 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Feature-specific frontend page/component
- **Imports (9):** `react`, `react-router-dom`, `../storefront/StorefrontHeader`, `../storefront/StorefrontFooter`, `@tanstack/react-query`, `../../services/storefrontService`, `../../services/cartService`, `../../services/authService`, `../../services/wishlistService`
- **Exports (1):** `PolicyPage`
- **Components:** `PolicyPage`
- **Functions:** `getPolicyContent`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 20
- **Used By (1):** `apps/web/src/routes/AppRoutes.tsx`

### 82. `apps/web/src/features/profile/ProfilePage.tsx`

- **File Name:** `ProfilePage.tsx` | **Lines:** 634 | **Size:** 28.8 KB | **Inspection:** `FULL_MANUAL`
- **Purpose:** Feature-specific frontend page/component
- **Imports (10):** `react`, `react-router-dom`, `@tanstack/react-query`, `../storefront/StorefrontHeader`, `../storefront/StorefrontFooter`, `../../services/storefrontService`, `../../services/cartService`, `../../services/authService`, `../../services/wishlistService`, `@nexora/shared`
- **Exports (2):** `ProfileTab`, `ProfilePage`
- **Components:** `ProfilePage`
- **Functions:** `getTabFromPath`, `handleTabChange`, `showToast`, `handleUpdateProfile`, `handleLogout`
- **Types:** `ProfileTab`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** `${apiUrl}/orders/my-orders`
- **Styling Signals:** Tailwind matches: 1 | Inline `style={{}}`: 77
- **Used By (1):** `apps/web/src/routes/AppRoutes.tsx`

### 83. `apps/web/src/features/storefront/AuthModal.tsx`

- **File Name:** `AuthModal.tsx` | **Lines:** 424 | **Size:** 14.5 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Customer Storefront landing & shared UI components
- **Imports (4):** `react`, `react-router-dom`, `../../services/authService`, `@nexora/shared`
- **Exports (1):** `AuthModal`
- **Components:** `AuthModal`
- **Functions:** `handleLogin`, `handleRegister`
- **Interfaces:** `AuthModalProps`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 1 | Inline `style={{}}`: 14
- **Used By (0):** _Entry point / Route / Test / Standalone_

### 84. `apps/web/src/features/storefront/BottomFeatures.tsx`

- **File Name:** `BottomFeatures.tsx` | **Lines:** 31 | **Size:** 1.2 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Customer Storefront landing & shared UI components
- **Imports (1):** `react`
- **Exports (1):** `BottomFeatures`
- **Components:** `BottomFeatures`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 6 | Inline `style={{}}`: 1
- **Used By (1):** `apps/web/src/features/storefront/StorefrontFooter.tsx`

### 85. `apps/web/src/features/storefront/CategorySidebar.tsx`

- **File Name:** `CategorySidebar.tsx` | **Lines:** 484 | **Size:** 16.2 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Customer Storefront landing & shared UI components
- **Imports (3):** `react`, `react-router-dom`, `@nexora/shared`
- **Exports (2):** `CategorySidebarProps`, `CategorySidebar`
- **Components:** `CategorySidebar`
- **Interfaces:** `MegaColumn`, `MenuItemDef`, `CategorySidebarProps`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 4 | Inline `style={{}}`: 5
- **Used By (2):** `apps/web/src/features/storefront/StorefrontHeader.tsx`, `apps/web/src/features/storefront/StorefrontHome.tsx`

### 86. `apps/web/src/features/storefront/FlashSaleSection.tsx`

- **File Name:** `FlashSaleSection.tsx` | **Lines:** 118 | **Size:** 3.5 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Customer Storefront landing & shared UI components
- **Imports (4):** `react`, `react-router-dom`, `@nexora/shared`, `./ProductCard`
- **Exports (1):** `FlashSaleSection`
- **Components:** `FlashSaleSection`
- **Functions:** `calcRemaining`
- **Interfaces:** `FlashSaleSectionProps`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 1 | Inline `style={{}}`: 2
- **Used By (1):** `apps/web/src/features/storefront/StorefrontHome.tsx`

### 87. `apps/web/src/features/storefront/HeroCarousel.tsx`

- **File Name:** `HeroCarousel.tsx` | **Lines:** 177 | **Size:** 5.8 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Customer Storefront landing & shared UI components
- **Imports (5):** `react`, `react-router-dom`, `@tanstack/react-query`, `../../services/storefrontService`, `@nexora/shared`
- **Exports (1):** `HeroCarousel`
- **Components:** `HeroCarousel`
- **Functions:** `goPrev`, `goNext`
- **Interfaces:** `SlideItem`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 10
- **Used By (1):** `apps/web/src/features/storefront/StorefrontHome.tsx`

### 88. `apps/web/src/features/storefront/ProductCard.tsx`

- **File Name:** `ProductCard.tsx` | **Lines:** 341 | **Size:** 11.7 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Customer Storefront landing & shared UI components
- **Imports (5):** `react`, `react-router-dom`, `@nexora/shared`, `../../lib/productImage`, `../../services/authService`
- **Exports (1):** `ProductCard`
- **Components:** `ProductCard`
- **Functions:** `extractProductPills`, `formatPrice`
- **Interfaces:** `ProductCardProps`, `SpecPill`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 1 | Inline `style={{}}`: 12
- **Used By (5):** `apps/web/src/features/catalog/ProductDetailPage.tsx`, `apps/web/src/features/catalog/SearchPage.tsx`, `apps/web/src/features/storefront/FlashSaleSection.tsx`, `apps/web/src/features/storefront/ProductCatalogSection.tsx`, `apps/web/src/features/wishlist/WishlistPage.tsx`

### 89. `apps/web/src/features/storefront/ProductCatalogSection.tsx`

- **File Name:** `ProductCatalogSection.tsx` | **Lines:** 919 | **Size:** 38.3 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Customer Storefront landing & shared UI components
- **Imports (5):** `react`, `react-router-dom`, `@nexora/shared`, `../../services/storefrontService`, `./ProductCard`
- **Exports (1):** `ProductCatalogSection`
- **Components:** `ProductSliderRow`, `POPULAR_CATEGORIES`, `BEST_SELLER_TABS`, `BRAND_LOGOS`, `CUSTOMER_REVIEWS`, `ProductCatalogSection`
- **Functions:** `scroll`, `getFilteredBestSellers`
- **Interfaces:** `ProductCatalogSectionProps`, `ProductSliderRowProps`
- **Constants:** `POPULAR_CATEGORIES`, `BEST_SELLER_TABS`, `BRAND_LOGOS`, `CUSTOMER_REVIEWS`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 4 | Inline `style={{}}`: 88
- **Used By (1):** `apps/web/src/features/storefront/StorefrontHome.tsx`

### 90. `apps/web/src/features/storefront/PromoCards.tsx`

- **File Name:** `PromoCards.tsx` | **Lines:** 96 | **Size:** 3.0 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Customer Storefront landing & shared UI components
- **Imports (4):** `react`, `react-router-dom`, `@tanstack/react-query`, `../../services/storefrontService`
- **Exports (1):** `PromoCards`
- **Components:** `DEFAULT_SIDEBAR_CARDS`, `PromoCards`
- **Constants:** `DEFAULT_SIDEBAR_CARDS`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 6
- **Used By (1):** `apps/web/src/features/storefront/StorefrontHome.tsx`

### 91. `apps/web/src/features/storefront/PromoPopup.tsx`

- **File Name:** `PromoPopup.tsx` | **Lines:** 221 | **Size:** 6.8 KB | **Inspection:** `FULL_MANUAL`
- **Purpose:** Customer Storefront landing & shared UI components
- **Imports (4):** `react`, `react-router-dom`, `@tanstack/react-query`, `../../services/storefrontService`
- **Exports (1):** `PromoPopup`
- **Components:** `PromoPopup`
- **Functions:** `handleKeyDown`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 8 | Inline `style={{}}`: 9
- **Used By (1):** `apps/web/src/features/storefront/StorefrontHome.tsx`

### 92. `apps/web/src/features/storefront/ServicePolicyBar.tsx`

- **File Name:** `ServicePolicyBar.tsx` | **Lines:** 71 | **Size:** 1.9 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Customer Storefront landing & shared UI components
- **Imports (1):** `react`
- **Exports (1):** `ServicePolicyBar`
- **Components:** `ServicePolicyBar`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (1):** `apps/web/src/features/storefront/StorefrontHome.tsx`

### 93. `apps/web/src/features/storefront/StorefrontFooter.tsx`

- **File Name:** `StorefrontFooter.tsx` | **Lines:** 99 | **Size:** 4.1 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Customer Storefront landing & shared UI components
- **Imports (3):** `react`, `react-router-dom`, `./BottomFeatures`
- **Exports (1):** `StorefrontFooter`
- **Components:** `StorefrontFooter`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 1 | Inline `style={{}}`: 5
- **Used By (25):** `apps/web/src/features/ai/AiAssistantPage.tsx`, `apps/web/src/features/auth/LoginPage.tsx`, `apps/web/src/features/auth/RegisterPage.tsx`, `apps/web/src/features/cart/CartPage.tsx`, `apps/web/src/features/catalog/ProductDetailPage.tsx`, `apps/web/src/features/catalog/SearchPage.tsx`, `apps/web/src/features/checkout/CheckoutPage.tsx`, `apps/web/src/features/checkout/CheckoutSuccessPage.tsx`, `apps/web/src/features/compare/ComparePage.tsx`, `apps/web/src/features/errors/NotFoundPage.tsx`, `apps/web/src/features/info/AboutPage.tsx`, `apps/web/src/features/info/CareersPage.tsx`, `apps/web/src/features/info/ContactPage.tsx`, `apps/web/src/features/info/GuidePage.tsx`, `apps/web/src/features/info/TechnicalSupportPage.tsx`, `apps/web/src/features/news/NewsPage.tsx`, `apps/web/src/features/news/PostDetailPage.tsx`, `apps/web/src/features/orderTracking/OrderTrackingPage.tsx`, `apps/web/src/features/pcBuilder/PcBuilderPage.tsx`, `apps/web/src/features/policy/PolicyPage.tsx`, `apps/web/src/features/profile/ProfilePage.tsx`, `apps/web/src/features/storefront/StorefrontHome.tsx`, `apps/web/src/features/stores/StoresPage.tsx`, `apps/web/src/features/tradeIn/TradeInPage.tsx`, `apps/web/src/features/wishlist/WishlistPage.tsx`

### 94. `apps/web/src/features/storefront/StorefrontHeader.tsx`

- **File Name:** `StorefrontHeader.tsx` | **Lines:** 721 | **Size:** 30.3 KB | **Inspection:** `FULL_MANUAL`
- **Purpose:** Customer Storefront landing & shared UI components
- **Imports (7):** `react`, `react-router-dom`, `@tanstack/react-query`, `../../services/storefrontService`, `../../lib/productImage`, `./CategorySidebar`, `@nexora/shared`
- **Exports (1):** `StorefrontHeader`
- **Components:** `StorefrontHeader`
- **Functions:** `highlightMatch`, `handleClickOutside`, `handleKeyDown`, `handleToggleCategoryMenu`, `toggleTheme`, `handleSearch`
- **Interfaces:** `StorefrontHeaderProps`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 17 | Inline `style={{}}`: 26
- **Used By (25):** `apps/web/src/features/ai/AiAssistantPage.tsx`, `apps/web/src/features/auth/LoginPage.tsx`, `apps/web/src/features/auth/RegisterPage.tsx`, `apps/web/src/features/cart/CartPage.tsx`, `apps/web/src/features/catalog/ProductDetailPage.tsx`, `apps/web/src/features/catalog/SearchPage.tsx`, `apps/web/src/features/checkout/CheckoutPage.tsx`, `apps/web/src/features/checkout/CheckoutSuccessPage.tsx`, `apps/web/src/features/compare/ComparePage.tsx`, `apps/web/src/features/errors/NotFoundPage.tsx`, `apps/web/src/features/info/AboutPage.tsx`, `apps/web/src/features/info/CareersPage.tsx`, `apps/web/src/features/info/ContactPage.tsx`, `apps/web/src/features/info/GuidePage.tsx`, `apps/web/src/features/info/TechnicalSupportPage.tsx`, `apps/web/src/features/news/NewsPage.tsx`, `apps/web/src/features/news/PostDetailPage.tsx`, `apps/web/src/features/orderTracking/OrderTrackingPage.tsx`, `apps/web/src/features/pcBuilder/PcBuilderPage.tsx`, `apps/web/src/features/policy/PolicyPage.tsx`, `apps/web/src/features/profile/ProfilePage.tsx`, `apps/web/src/features/storefront/StorefrontHome.tsx`, `apps/web/src/features/stores/StoresPage.tsx`, `apps/web/src/features/tradeIn/TradeInPage.tsx`, `apps/web/src/features/wishlist/WishlistPage.tsx`

### 95. `apps/web/src/features/storefront/StorefrontHome.tsx`

- **File Name:** `StorefrontHome.tsx` | **Lines:** 188 | **Size:** 6.1 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Customer Storefront landing & shared UI components
- **Imports (16):** `react`, `@tanstack/react-query`, `./StorefrontHeader`, `./CategorySidebar`, `./HeroCarousel`, `./PromoCards`, `./ServicePolicyBar`, `./FlashSaleSection`, `./ProductCatalogSection`, `./PromoPopup`, `./StorefrontFooter`, `../../services/storefrontService`, `../../services/cartService`, `../../services/authService`, `../../services/wishlistService`, `@nexora/shared`
- **Exports (1):** `StorefrontHome`
- **Components:** `StorefrontHome`
- **Functions:** `showToast`, `handleLogout`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 2
- **Used By (1):** `apps/web/src/routes/AppRoutes.tsx`

### 96. `apps/web/src/features/stores/StoresPage.tsx`

- **File Name:** `StoresPage.tsx` | **Lines:** 260 | **Size:** 9.8 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Feature-specific frontend page/component
- **Imports (10):** `react`, `react-router-dom`, `@tanstack/react-query`, `../storefront/StorefrontHeader`, `../storefront/StorefrontFooter`, `../../services/storefrontService`, `../../services/cartService`, `../../services/authService`, `../../services/wishlistService`, `@nexora/shared`
- **Exports (1):** `StoresPage`
- **Components:** `StoresPage`
- **Interfaces:** `StoreItem`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 29
- **Used By (1):** `apps/web/src/routes/AppRoutes.tsx`

### 97. `apps/web/src/features/system/FoundationDashboard.tsx`

- **File Name:** `FoundationDashboard.tsx` | **Lines:** 160 | **Size:** 6.1 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Feature-specific frontend page/component
- **Imports (4):** `@hookform/resolvers/zod`, `@nexora/shared`, `react-hook-form`, `../../components/StatusCard`
- **Exports (1):** `FoundationDashboard`
- **Components:** `FoundationDashboard`
- **Functions:** `FoundationDashboard`, `onSubmit`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 19 | Inline `style={{}}`: 0
- **Used By (2):** `apps/web/src/routes/AppRoutes.tsx`, `apps/web/tests/FoundationDashboard.test.tsx`

### 98. `apps/web/src/features/tradeIn/TradeInPage.tsx`

- **File Name:** `TradeInPage.tsx` | **Lines:** 355 | **Size:** 15.2 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Feature-specific frontend page/component
- **Imports (10):** `react`, `react-router-dom`, `@tanstack/react-query`, `../storefront/StorefrontHeader`, `../storefront/StorefrontFooter`, `../../services/storefrontService`, `../../services/cartService`, `../../services/authService`, `../../services/wishlistService`, `@nexora/shared`
- **Exports (1):** `TradeInPage`
- **Components:** `TradeInPage`
- **Functions:** `showToast`, `handleCalculateEstimate`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 47
- **Used By (1):** `apps/web/src/routes/AppRoutes.tsx`

### 99. `apps/web/src/features/wishlist/WishlistPage.tsx`

- **File Name:** `WishlistPage.tsx` | **Lines:** 298 | **Size:** 10.1 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Feature-specific frontend page/component
- **Imports (11):** `react`, `react-router-dom`, `../storefront/StorefrontHeader`, `../storefront/StorefrontFooter`, `../storefront/ProductCard`, `@tanstack/react-query`, `../../services/storefrontService`, `../../services/cartService`, `../../services/authService`, `../../services/wishlistService`, `@nexora/shared`
- **Exports (1):** `WishlistPage`
- **Components:** `WishlistPage`
- **Functions:** `showToast`, `handleLogout`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 1 | Inline `style={{}}`: 25
- **Used By (1):** `apps/web/src/routes/AppRoutes.tsx`

### 100. `apps/web/src/hooks/useSystemHealth.ts`

- **File Name:** `useSystemHealth.ts` | **Lines:** 26 | **Size:** 0.6 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Core application bootstrap / configuration / utility module
- **Imports (3):** `@nexora/shared`, `@tanstack/react-query`, `../services/systemService`
- **Exports (3):** `useHealthQuery`, `useSystemMetaQuery`, `useEchoCheckMutation`
- **Custom Hooks:** `useHealthQuery`, `useSystemMetaQuery`, `useEchoCheckMutation`
- **Functions:** `useHealthQuery`, `useSystemMetaQuery`, `useEchoCheckMutation`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (0):** _Entry point / Route / Test / Standalone_

### 101. `apps/web/src/layouts/MainLayout.tsx`

- **File Name:** `MainLayout.tsx` | **Lines:** 38 | **Size:** 1.4 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Core application bootstrap / configuration / utility module
- **Imports (1):** `react-router-dom`
- **Exports (1):** `MainLayout`
- **Components:** `MainLayout`
- **Functions:** `MainLayout`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 10 | Inline `style={{}}`: 0
- **Used By (1):** `apps/web/src/routes/AppRoutes.tsx`

### 102. `apps/web/src/lib/apiClient.ts`

- **File Name:** `apiClient.ts` | **Lines:** 21 | **Size:** 0.5 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Core application bootstrap / configuration / utility module
- **Imports (1):** `axios`
- **Exports (1):** `apiClient`
- **Symbols:** _Script / declarative module_
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (4):** `apps/web/src/services/authService.ts`, `apps/web/src/services/cartService.ts`, `apps/web/src/services/storefrontService.ts`, `apps/web/src/services/systemService.ts`

### 103. `apps/web/src/lib/productImage.ts`

- **File Name:** `productImage.ts` | **Lines:** 124 | **Size:** 5.9 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Core application bootstrap / configuration / utility module
- **Imports (1):** `@nexora/shared`
- **Exports (1):** `getProductImage`
- **Functions:** `getProductImage`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (8):** `apps/web/src/features/ai/AiAssistantPage.tsx`, `apps/web/src/features/cart/CartPage.tsx`, `apps/web/src/features/catalog/ProductDetailPage.tsx`, `apps/web/src/features/checkout/CheckoutPage.tsx`, `apps/web/src/features/compare/ComparePage.tsx`, `apps/web/src/features/pcBuilder/PcBuilderPage.tsx`, `apps/web/src/features/storefront/ProductCard.tsx`, `apps/web/src/features/storefront/StorefrontHeader.tsx`

### 104. `apps/web/src/routes/AppRoutes.tsx`

- **File Name:** `AppRoutes.tsx` | **Lines:** 176 | **Size:** 9.2 KB | **Inspection:** `FULL_MANUAL`
- **Purpose:** Core application bootstrap / configuration / utility module
- **Imports (33):** `react`, `react-router-dom`, `../features/storefront/StorefrontHome`, `../features/catalog/SearchPage`, `../features/catalog/ProductDetailPage`, `../features/wishlist/WishlistPage`, `../features/cart/CartPage`, `../features/checkout/CheckoutPage`, `../features/checkout/CheckoutSuccessPage`, `../features/pcBuilder/PcBuilderPage`, `../features/compare/ComparePage`, `../features/ai/AiAssistantPage`, `../features/tradeIn/TradeInPage`, `../features/news/NewsPage`, `../features/news/PostDetailPage`, `../features/orderTracking/OrderTrackingPage`, `../features/stores/StoresPage`, `../features/profile/ProfilePage`, `../features/auth/LoginPage`, `../features/auth/RegisterPage`, `../features/auth/ForgotPasswordPage`, `../features/auth/ResetPasswordPage`, `../features/policy/PolicyPage`, `../features/info/AboutPage`, `../features/info/CareersPage`, `../features/info/ContactPage`, `../features/info/GuidePage`, `../features/info/TechnicalSupportPage`, `../features/admin/AdminDashboardPage`, `../features/system/FoundationDashboard`, `../features/errors/NotFoundPage`, `../layouts/MainLayout`, `../features/ai/FloatingChatbot`
- **Exports (1):** `AppRoutes`
- **Components:** `ArchitectureInfoPage`, `ScrollToTop`, `AppRoutes`
- **Functions:** `ArchitectureInfoPage`, `ScrollToTop`, `AppRoutes`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 3 | Inline `style={{}}`: 0
- **Used By (1):** `apps/web/src/app/App.tsx`

### 105. `apps/web/src/services/authService.ts`

- **File Name:** `authService.ts` | **Lines:** 63 | **Size:** 1.9 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Frontend Axios/Fetch API client wrapper
- **Imports (2):** `../lib/apiClient`, `@nexora/shared`
- **Exports (2):** `AuthSession`, `authService`
- **Methods:** `login`, `register`, `getMe`, `forgotPassword`, `resetPassword`, `logout`, `getToken`, `getCurrentUser`
- **Interfaces:** `AuthSession`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (30):** `apps/web/src/features/admin/AdminDashboardPage.tsx`, `apps/web/src/features/ai/AiAssistantPage.tsx`, `apps/web/src/features/auth/LoginPage.tsx`, `apps/web/src/features/auth/RegisterPage.tsx`, `apps/web/src/features/auth/ResetPasswordPage.tsx`, `apps/web/src/features/cart/CartPage.tsx`, `apps/web/src/features/catalog/ProductDetailPage.tsx`, `apps/web/src/features/catalog/SearchPage.tsx`, `apps/web/src/features/checkout/CheckoutPage.tsx`, `apps/web/src/features/checkout/CheckoutSuccessPage.tsx`, `apps/web/src/features/compare/ComparePage.tsx`, `apps/web/src/features/errors/NotFoundPage.tsx`, `apps/web/src/features/info/AboutPage.tsx`, `apps/web/src/features/info/CareersPage.tsx`, `apps/web/src/features/info/ContactPage.tsx`, `apps/web/src/features/info/GuidePage.tsx`, `apps/web/src/features/info/TechnicalSupportPage.tsx`, `apps/web/src/features/news/NewsPage.tsx`, `apps/web/src/features/news/PostDetailPage.tsx`, `apps/web/src/features/orderTracking/OrderTrackingPage.tsx`, `apps/web/src/features/pcBuilder/PcBuilderPage.tsx`, `apps/web/src/features/policy/PolicyPage.tsx`, `apps/web/src/features/profile/ProfilePage.tsx`, `apps/web/src/features/storefront/AuthModal.tsx`, `apps/web/src/features/storefront/ProductCard.tsx`, `apps/web/src/features/storefront/StorefrontHome.tsx`, `apps/web/src/features/stores/StoresPage.tsx`, `apps/web/src/features/tradeIn/TradeInPage.tsx`, `apps/web/src/features/wishlist/WishlistPage.tsx`, `apps/web/src/services/wishlistService.ts`

### 106. `apps/web/src/services/cartService.ts`

- **File Name:** `cartService.ts` | **Lines:** 55 | **Size:** 1.8 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Frontend Axios/Fetch API client wrapper
- **Imports (2):** `../lib/apiClient`, `@nexora/shared`
- **Exports (1):** `cartService`
- **Functions:** `getGuestSessionId`
- **Methods:** `getCart`, `addItem`, `addToCart`, `updateItem`, `removeItem`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (22):** `apps/web/src/features/ai/AiAssistantPage.tsx`, `apps/web/src/features/cart/CartPage.tsx`, `apps/web/src/features/catalog/ProductDetailPage.tsx`, `apps/web/src/features/catalog/SearchPage.tsx`, `apps/web/src/features/checkout/CheckoutPage.tsx`, `apps/web/src/features/compare/ComparePage.tsx`, `apps/web/src/features/errors/NotFoundPage.tsx`, `apps/web/src/features/info/AboutPage.tsx`, `apps/web/src/features/info/CareersPage.tsx`, `apps/web/src/features/info/ContactPage.tsx`, `apps/web/src/features/info/GuidePage.tsx`, `apps/web/src/features/info/TechnicalSupportPage.tsx`, `apps/web/src/features/news/NewsPage.tsx`, `apps/web/src/features/news/PostDetailPage.tsx`, `apps/web/src/features/orderTracking/OrderTrackingPage.tsx`, `apps/web/src/features/pcBuilder/PcBuilderPage.tsx`, `apps/web/src/features/policy/PolicyPage.tsx`, `apps/web/src/features/profile/ProfilePage.tsx`, `apps/web/src/features/storefront/StorefrontHome.tsx`, `apps/web/src/features/stores/StoresPage.tsx`, `apps/web/src/features/tradeIn/TradeInPage.tsx`, `apps/web/src/features/wishlist/WishlistPage.tsx`

### 107. `apps/web/src/services/storefrontService.ts`

- **File Name:** `storefrontService.ts` | **Lines:** 127 | **Size:** 3.5 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Frontend Axios/Fetch API client wrapper
- **Imports (1):** `../lib/apiClient`
- **Exports (4):** `ProductsResponse`, `PublicReviewDto`, `ValidateCouponResponse`, `storefrontService`
- **Methods:** `getCategories`, `getBanners`, `getBrands`, `getProducts`, `getFlashSale`, `getActiveFlashSale`, `getFeatured`, `getProductBySlug`, `getPosts`, `getPostBySlug`, `getPublicReviews`, `getActiveCoupons`, `validateCoupon`
- **Interfaces:** `ProductsResponse`, `PublicReviewDto`, `ValidateCouponResponse`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (30):** `apps/web/src/features/ai/AiAssistantPage.tsx`, `apps/web/src/features/auth/LoginPage.tsx`, `apps/web/src/features/auth/RegisterPage.tsx`, `apps/web/src/features/cart/CartPage.tsx`, `apps/web/src/features/catalog/ProductDetailPage.tsx`, `apps/web/src/features/catalog/SearchPage.tsx`, `apps/web/src/features/checkout/CheckoutPage.tsx`, `apps/web/src/features/checkout/CheckoutSuccessPage.tsx`, `apps/web/src/features/compare/ComparePage.tsx`, `apps/web/src/features/errors/NotFoundPage.tsx`, `apps/web/src/features/info/AboutPage.tsx`, `apps/web/src/features/info/CareersPage.tsx`, `apps/web/src/features/info/ContactPage.tsx`, `apps/web/src/features/info/GuidePage.tsx`, `apps/web/src/features/info/TechnicalSupportPage.tsx`, `apps/web/src/features/news/NewsPage.tsx`, `apps/web/src/features/news/PostDetailPage.tsx`, `apps/web/src/features/orderTracking/OrderTrackingPage.tsx`, `apps/web/src/features/pcBuilder/PcBuilderPage.tsx`, `apps/web/src/features/policy/PolicyPage.tsx`, `apps/web/src/features/profile/ProfilePage.tsx`, `apps/web/src/features/storefront/HeroCarousel.tsx`, `apps/web/src/features/storefront/ProductCatalogSection.tsx`, `apps/web/src/features/storefront/PromoCards.tsx`, `apps/web/src/features/storefront/PromoPopup.tsx`, `apps/web/src/features/storefront/StorefrontHeader.tsx`, `apps/web/src/features/storefront/StorefrontHome.tsx`, `apps/web/src/features/stores/StoresPage.tsx`, `apps/web/src/features/tradeIn/TradeInPage.tsx`, `apps/web/src/features/wishlist/WishlistPage.tsx`

### 108. `apps/web/src/services/systemService.ts`

- **File Name:** `systemService.ts` | **Lines:** 27 | **Size:** 0.8 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Frontend Axios/Fetch API client wrapper
- **Imports (1):** `../lib/apiClient`
- **Exports (3):** `fetchHealthStatus`, `fetchSystemMeta`, `submitEchoCheck`
- **Functions:** `fetchHealthStatus`, `fetchSystemMeta`, `submitEchoCheck`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (2):** `apps/web/src/hooks/useSystemHealth.ts`, `apps/web/tests/FoundationDashboard.test.tsx`

### 109. `apps/web/src/services/wishlistService.ts`

- **File Name:** `wishlistService.ts` | **Lines:** 96 | **Size:** 2.3 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Frontend Axios/Fetch API client wrapper
- **Imports (2):** `./authService`, `@nexora/shared`
- **Exports (2):** `WishlistItemDto`, `wishlistService`
- **Functions:** `getApiBase`
- **Methods:** `getWishlist`, `toggleWishlist`, `removeFromWishlist`, `getWishlistCount`
- **Interfaces:** `WishlistItemDto`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** `${getApiBase()}/wishlist`, `${getApiBase()}/wishlist/toggle`, `${getApiBase()}/wishlist/${productId}`, `${getApiBase()}/wishlist/count`
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (21):** `apps/web/src/features/ai/AiAssistantPage.tsx`, `apps/web/src/features/cart/CartPage.tsx`, `apps/web/src/features/catalog/ProductDetailPage.tsx`, `apps/web/src/features/catalog/SearchPage.tsx`, `apps/web/src/features/compare/ComparePage.tsx`, `apps/web/src/features/errors/NotFoundPage.tsx`, `apps/web/src/features/info/AboutPage.tsx`, `apps/web/src/features/info/CareersPage.tsx`, `apps/web/src/features/info/ContactPage.tsx`, `apps/web/src/features/info/GuidePage.tsx`, `apps/web/src/features/info/TechnicalSupportPage.tsx`, `apps/web/src/features/news/NewsPage.tsx`, `apps/web/src/features/news/PostDetailPage.tsx`, `apps/web/src/features/orderTracking/OrderTrackingPage.tsx`, `apps/web/src/features/pcBuilder/PcBuilderPage.tsx`, `apps/web/src/features/policy/PolicyPage.tsx`, `apps/web/src/features/profile/ProfilePage.tsx`, `apps/web/src/features/storefront/StorefrontHome.tsx`, `apps/web/src/features/stores/StoresPage.tsx`, `apps/web/src/features/tradeIn/TradeInPage.tsx`, `apps/web/src/features/wishlist/WishlistPage.tsx`

### 110. `apps/web/src/types/index.ts`

- **File Name:** `index.ts` | **Lines:** 2 | **Size:** 0.1 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Core application bootstrap / configuration / utility module
- **Imports (0):** _None_
- **Exports (1):** `CardTone`
- **Types:** `CardTone`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (1):** `apps/web/src/components/StatusCard.tsx`

### 111. `apps/web/src/main.tsx`

- **File Name:** `main.tsx` | **Lines:** 11 | **Size:** 0.2 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Core application bootstrap / configuration / utility module
- **Imports (3):** `react`, `react-dom/client`, `./app/App`
- **Exports (0):** _Default/Side-effect only_
- **Symbols:** _Script / declarative module_
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (0):** _Entry point / Route / Test / Standalone_

### 112. `apps/web/tests/FoundationDashboard.test.tsx`

- **File Name:** `FoundationDashboard.test.tsx` | **Lines:** 45 | **Size:** 1.6 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Automated Vitest/Supertest test suite
- **Imports (6):** `@tanstack/react-query`, `@testing-library/react`, `react-router-dom`, `vitest`, `../src/features/system/FoundationDashboard`, `../src/services/systemService`
- **Exports (0):** _Default/Side-effect only_
- **Symbols:** _Script / declarative module_
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (0):** _Entry point / Route / Test / Standalone_

### 113. `apps/web/vite.config.ts`

- **File Name:** `vite.config.ts` | **Lines:** 12 | **Size:** 0.2 KB | **Inspection:** `FULL_MANUAL`
- **Purpose:** Core application bootstrap / configuration / utility module
- **Imports (3):** `@tailwindcss/vite`, `@vitejs/plugin-react`, `vite`
- **Exports (0):** _Default/Side-effect only_
- **Symbols:** _Script / declarative module_
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (0):** _Entry point / Route / Test / Standalone_

### 114. `packages/config/src/index.ts`

- **File Name:** `index.ts` | **Lines:** 14 | **Size:** 0.5 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Shared monorepo runtime constants & role definitions
- **Imports (0):** _None_
- **Exports (7):** `NEXORA_APP_NAME`, `NEXORA_SLOGAN`, `NEXORA_BUSINESS_MODEL`, `NEXORA_API_V1_PREFIX`, `NEXORA_ROLES`, `NexoraRole`, `NEXORA_OFFICIAL_BRANCHES`
- **Components:** `NEXORA_APP_NAME`, `NEXORA_SLOGAN`, `NEXORA_BUSINESS_MODEL`, `NEXORA_API_V1_PREFIX`, `NEXORA_ROLES`, `NEXORA_OFFICIAL_BRANCHES`
- **Types:** `NexoraRole`
- **Constants:** `NEXORA_APP_NAME`, `NEXORA_SLOGAN`, `NEXORA_BUSINESS_MODEL`, `NEXORA_API_V1_PREFIX`, `NEXORA_ROLES`, `NEXORA_OFFICIAL_BRANCHES`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (0):** _Entry point / Route / Test / Standalone_

### 115. `packages/shared/src/index.ts`

- **File Name:** `index.ts` | **Lines:** 407 | **Size:** 12.5 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Shared Zod wire contracts, DTO types & persona scoring engine
- **Imports (1):** `zod`
- **Exports (69):** `UserRoleSchema`, `HealthStatusSchema`, `HealthStatus`, `SystemMetaSchema`, `SystemMeta`, `EchoCheckInputSchema`, `EchoCheckInput`, `EchoCheckResultSchema`, `EchoCheckResult`, `LoginInputSchema`, `LoginInput`, `RegisterInputSchema`, `RegisterInput`, `AuthUserSchema`, `AuthUser`, `CategorySchema`, `CategoryDto`, `BrandSchema`, `BrandDto`, `ProductSchema` (+49)
- **Components:** `UserRoleSchema`, `HealthStatusSchema`, `SystemMetaSchema`, `EchoCheckInputSchema`, `EchoCheckResultSchema`, `LoginInputSchema`, `RegisterInputSchema`, `AuthUserSchema`, `CategorySchema`, `BrandSchema`, `ProductSchema`, `BannerSchema`, `CartItemSchema`, `CartSummarySchema`, `OrderStatusEnum`, `PaymentMethodEnum`, `PaymentStatusEnum`, `CreateOrderItemInputSchema`, `CreateOrderInputSchema`, `TrackOrderInputSchema`, `OrderItemDtoSchema`, `OrderDtoSchema`, `CouponDtoSchema`, `PostDtoSchema`, `FlashSaleItemDtoSchema`, `FlashSaleDtoSchema`, `AiChatbotQueryInputSchema`, `AiSurveyInputSchema`, `AiRecommendationRoleSchema`, `AiCompareInputSchema`, `AiProductChatInputSchema`, `AdminRevenueDaySchema`, `AdminOrderStatusBreakdownSchema`, `AdminDashboardSummarySchema`
- **Interfaces:** `ApiSuccessEnvelope`, `ApiErrorDetail`, `ApiErrorEnvelope`
- **Types:** `HealthStatus`, `SystemMeta`, `EchoCheckInput`, `EchoCheckResult`, `LoginInput`, `RegisterInput`, `AuthUser`, `CategoryDto`, `BrandDto`, `ProductDto`, `BannerDto`, `CartItemDto`, `CartSummaryDto`, `OrderStatus`, `PaymentMethod (+17)`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (2):** `packages/shared/src/personaScoring.ts`, `packages/shared/tests/personaScoring.test.ts`

### 116. `packages/shared/src/personaScoring.ts`

- **File Name:** `personaScoring.ts` | **Lines:** 284 | **Size:** 8.5 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Shared Zod wire contracts, DTO types & persona scoring engine
- **Imports (1):** `./index.js`
- **Exports (5):** `PersonaScoreBreakdown`, `PersonaScoredProduct`, `cleanAndParseSpecs`, `calculateProductPersonaScore`, `rankComparedProducts`
- **Functions:** `cleanAndParseSpecs`, `calculateProductPersonaScore`, `rankComparedProducts`
- **Interfaces:** `PersonaScoreBreakdown`, `PersonaScoredProduct`
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (0):** _Entry point / Route / Test / Standalone_

### 117. `packages/shared/tests/personaScoring.test.ts`

- **File Name:** `personaScoring.test.ts` | **Lines:** 131 | **Size:** 4.7 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Automated Vitest/Supertest test suite
- **Imports (2):** `vitest`, `../src/index.js`
- **Exports (0):** _Default/Side-effect only_
- **Symbols:** _Script / declarative module_
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (0):** _Entry point / Route / Test / Standalone_

### 118. `packages/shared/tests/shared.test.ts`

- **File Name:** `shared.test.ts` | **Lines:** 33 | **Size:** 1.2 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Automated Vitest/Supertest test suite
- **Imports (1):** `vitest`
- **Exports (0):** _Default/Side-effect only_
- **Symbols:** _Script / declarative module_
- **Prisma DB Models Touched:** _None_
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (0):** _Entry point / Route / Test / Standalone_

### 119. `prisma/seed.ts`

- **File Name:** `seed.ts` | **Lines:** 1502 | **Size:** 52.0 KB | **Inspection:** `PROGRAMMATIC_SYMBOL_PARSE`
- **Purpose:** Idempotent synthetic & baseline database seeder
- **Imports (2):** `@prisma/client`, `bcryptjs`
- **Exports (0):** _Default/Side-effect only_
- **Components:** `DEV_DEFAULT_PASSWORD_HASH`
- **Functions:** `getAdminInitialPasswordHash`, `main`
- **Constants:** `DEV_DEFAULT_PASSWORD_HASH`
- **Prisma DB Models Touched:** `prisma.user`, `prisma.customerAddress`, `prisma.storeSetting`, `prisma.brand`, `prisma.category`, `prisma.banner`, `prisma.product`, `prisma.productImage`, `prisma.cart`, `prisma.cartItem`, `prisma.wishlist`, `prisma.coupon`, `prisma.flashSale`, `prisma.flashSaleItem`, `prisma.post`, `prisma.order`, `prisma.notification`, `prisma.auditLog`
- **API Endpoints Called:** _None_
- **Styling Signals:** Tailwind matches: 0 | Inline `style={{}}`: 0
- **Used By (0):** _Entry point / Route / Test / Standalone_
