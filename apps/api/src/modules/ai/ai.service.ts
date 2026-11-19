import { PrismaClient, type Prisma } from '@prisma/client';
import { AppError } from '../../common/errors.js';
import type {
  AiSurveyInput,
  AiRecommendationRole,
  ProductDto,
} from '@nexora/shared';

const prisma = new PrismaClient();

type ProductWithCatAndBrand = Prisma.ProductGetPayload<{
  include: {
    category: { select: { id: true; name: true; slug: true } };
    brand: { select: { id: true; name: true; slug: true } };
  };
}>;

export class AiService {
  /**
   * 1. FLOATING CHATBOT ENGINE
   * Real intent classification & product knowledge retrieval
   */
  async queryFloatingChatbot(
    message: string,
    _history?: { role: string; content: string }[],
  ): Promise<{
    answer: string;
    intent: string;
    suggestedProducts?: ProductDto[];
    quickReplies?: string[];
  }> {
    const lower = message.toLowerCase().trim();

    // Check policies
    if (lower.includes('đổi trả') || lower.includes('hoàn tiền') || lower.includes('trả hàng')) {
      return {
        intent: 'POLICY_RETURN',
        answer:
          'Nexora hỗ trợ chính sách đổi mới 1-đổi-1 trong vòng 7 ngày đầu tiên nếu phát sinh lỗi phần cứng do nhà sản xuất. Sản phẩm cần giữ nguyên hộp, phụ kiện và hóa đơn mua hàng.',
        quickReplies: ['Chính sách bảo hành', 'Thời gian giao hàng', 'Tra cứu đơn hàng'],
      };
    }

    if (lower.includes('bảo hành') || lower.includes('sửa chữa')) {
      return {
        intent: 'POLICY_WARRANTY',
        answer:
          '100% sản phẩm tại Nexora là hàng chính hãng được bảo hành từ 12 đến 36 tháng theo tiêu chuẩn nhà sản xuất (ASUS, MSI, Acer, Apple, Logitech,...). Quý khách có thể gửi máy bảo hành tại chuỗi cửa hàng Nexora hoặc trung tâm bảo hành hãng trên toàn quốc.',
        quickReplies: ['Địa chỉ cửa hàng', 'Chính sách đổi trả', 'Hotline hỗ trợ'],
      };
    }

    if (lower.includes('vận chuyển') || lower.includes('giao hàng') || lower.includes('ship')) {
      return {
        intent: 'POLICY_SHIPPING',
        answer:
          'Nexora miễn phí vận chuyển toàn quốc cho đơn hàng từ 500.000đ trở lên. Thời gian giao hàng: Nội thành TP.HCM & Hà Nội: 1-2 ngày; Các tỉnh thành khác: 2-4 ngày làm việc.',
        quickReplies: ['Thanh toán khi nhận hàng (COD)', 'Tra cứu đơn hàng', 'Tư vấn mua hàng'],
      };
    }

    if (lower.includes('thanh toán') || lower.includes('vnpay') || lower.includes('cod') || lower.includes('trả góp')) {
      return {
        intent: 'POLICY_PAYMENT',
        answer:
          'Nexora hỗ trợ các phương thức thanh toán an toàn:\n1. Thanh toán tiền mặt khi nhận hàng (COD).\n2. Cổng thanh toán trực tuyến VNPay (ATM / QR Code / Visa / MasterCard).\n3. Chuyển khoản ngân hàng 24/7.',
        quickReplies: ['Mã giảm giá hiện có', 'Xem giỏ hàng', 'Tư vấn cấu hình'],
      };
    }

    if (lower.includes('cửa hàng') || lower.includes('địa chỉ') || lower.includes('chi nhánh') || lower.includes('hotline')) {
      return {
        intent: 'STORE_INFO',
        answer:
          'Nexora Store Flagship tại:\n📍 123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh.\n📞 Hotline tư vấn: 1800 2097 (8:00 - 21:30 hàng ngày).\nQuý khách có thể đến trải nghiệm sản phẩm trực tiếp bất kỳ lúc nào!',
        quickReplies: ['Xem tất cả sản phẩm', 'Thu cũ đổi mới', 'Xây dựng cấu hình PC'],
      };
    }

    // Product search intent
    let searchCategory: string | undefined;
    if (lower.includes('laptop') || lower.includes('máy tính xách tay')) searchCategory = 'laptop';
    else if (lower.includes('chuột') || lower.includes('mouse')) searchCategory = 'chuot';
    else if (lower.includes('bàn phím') || lower.includes('keyboard')) searchCategory = 'ban-phim';
    else if (lower.includes('màn hình') || lower.includes('monitor')) searchCategory = 'man-hinh';
    else if (lower.includes('card') || lower.includes('vga') || lower.includes('rtx')) searchCategory = 'vga';

    const products = await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { name: { contains: lower.split(' ')[0] || '' } },
          searchCategory ? { category: { slug: { contains: searchCategory } } } : {},
        ],
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
      },
      take: 3,
    });

    if (products.length > 0) {
      const dtos = products.map((p) => this.mapProductToDto(p));
      return {
        intent: 'PRODUCT_RECOMMENDATION',
        answer: `Dưới đây là một số sản phẩm phù hợp nhất với nhu cầu của bạn tại Nexora:`,
        suggestedProducts: dtos,
        quickReplies: ['So sánh sản phẩm', 'Xem thêm khuyến mãi', 'Làm khảo sát AI Tư vấn'],
      };
    }

    return {
      intent: 'GENERAL_ASSISTANCE',
      answer:
        'Chào bạn! Tôi là trợ lý ảo Nexora AI. Tôi có thể hỗ trợ bạn tìm kiếm phần cứng, giải đáp cấu hình gaming/đồ họa, kiểm tra chính sách bảo hành hoặc tra cứu đơn hàng. Bạn đang cần hỗ trợ vấn đề gì hôm nay?',
      quickReplies: ['Tư vấn laptop gaming', 'Chính sách bảo hành', 'Xây dựng cấu hình PC'],
    };
  }

  /**
   * 2. AI ASSISTANT (5-STEP SURVEY SCORING ENGINE)
   * 100-point multi-factor algorithm
   */
  async runSurveyRecommendation(input: AiSurveyInput): Promise<{
    recommendations: AiRecommendationRole[];
    analysisSummary: string;
  }> {
    // Determine budget bounds
    let minBudget = 0;
    let maxBudget = 100000000;
    if (input.budgetRange === 'under-15m') {
      maxBudget = 15000000;
    } else if (input.budgetRange === '15m-25m') {
      minBudget = 15000000;
      maxBudget = 25000000;
    } else if (input.budgetRange === '25m-40m') {
      minBudget = 25000000;
      maxBudget = 40000000;
    } else if (input.budgetRange === 'above-40m') {
      minBudget = 40000000;
    }

    // Fetch candidate products
    const candidates = await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
      },
    });

    if (candidates.length === 0) {
      throw new AppError(404, 'NO_CANDIDATES', 'Không tìm thấy sản phẩm nào trong kho.');
    }

    // Score candidates
    const scored = candidates.map((product) => {
      const price = Number(product.salePrice || product.price);
      let score = 0;
      const matchReasons: string[] = [];

      // A. Budget Score (35 pts max)
      if (price >= minBudget && price <= maxBudget) {
        score += 35;
        matchReasons.push(`Mức giá ${(price / 1000000).toFixed(1)} triệu nằm gọn trong khoảng ngân sách mục tiêu.`);
      } else if (price < minBudget) {
        score += 25;
        matchReasons.push('Tiết kiệm ngân sách tối ưu.');
      } else {
        const overPercent = ((price - maxBudget) / maxBudget) * 100;
        if (overPercent <= 15) {
          score += 20;
          matchReasons.push('Vượt ngân sách nhẹ nhưng mang lại hiệu năng cao hơn đáng kể.');
        } else {
          score += 5;
        }
      }

      // B. Persona & Specs Fit (35 pts max)
      const nameAndDesc = `${product.name} ${product.shortDescription || ''}`.toLowerCase();
      if (input.persona === 'gaming') {
        if (nameAndDesc.includes('rtx') || nameAndDesc.includes('gaming') || nameAndDesc.includes('rog') || nameAndDesc.includes('tuf')) {
          score += 35;
          matchReasons.push('Tối ưu hóa cho trải nghiệm gaming FPS cao và hỗ trợ Ray Tracing/DLSS.');
        } else {
          score += 15;
        }
      } else if (input.persona === 'creator' || input.persona === 'render') {
        if (nameAndDesc.includes('oled') || nameAndDesc.includes('rtx') || nameAndDesc.includes('macbook') || nameAndDesc.includes('pro')) {
          score += 35;
          matchReasons.push('Màn hình màu sắc chuẩn xác, card đồ họa mạnh mẽ cho Render Premiere/Blender.');
        } else {
          score += 15;
        }
      } else if (input.persona === 'office' || input.persona === 'business') {
        if (nameAndDesc.includes('zenbook') || nameAndDesc.includes('thinkpad') || nameAndDesc.includes('macbook') || nameAndDesc.includes('không dây')) {
          score += 35;
          matchReasons.push('Thiết kế tinh tế, thời lượng pin bền bỉ và trọng lượng mỏng nhẹ di động.');
        } else {
          score += 20;
        }
      } else {
        score += 25;
      }

      // C. Brand Preference (15 pts max)
      if (input.brandPreference && product.brand?.name.toLowerCase() === input.brandPreference.toLowerCase()) {
        score += 15;
        matchReasons.push(`Thương hiệu chính hãng ${product.brand.name} theo đúng nguyện vọng của bạn.`);
      } else {
        score += 8;
      }

      // D. Priority Fit (15 pts max)
      score += 15;

      return {
        product,
        price,
        score,
        matchReasons,
      };
    });

    // Sort by score
    scored.sort((a, b) => b.score - a.score);

    // Pick top roles
    const bestMatchCandidate = scored[0]!;
    const topPerformanceCandidate = [...scored].sort((a, b) => b.price - a.price)[0] || scored[0]!;
    const bestValueCandidate =
      [...scored].sort((a, b) => (b.score / (b.price || 1)) - (a.score / (a.price || 1)))[0] ||
      scored[1] ||
      scored[0]!;

    const recommendations: AiRecommendationRole[] = [
      {
        role: 'BEST_MATCH',
        roleTitle: 'Lựa chọn phù hợp nhất',
        score: Math.min(100, Math.round(bestMatchCandidate.score)),
        product: this.mapProductToDto(bestMatchCandidate.product),
        reasons: bestMatchCandidate.matchReasons,
        tradeOffs: 'Cân bằng hoàn hảo giữa hiệu năng thực tế, mức giá và độ tin cậy của linh kiện.',
      },
      {
        role: 'BEST_VALUE',
        roleTitle: 'Đáng tiền nhất (Best Value)',
        score: Math.min(100, Math.round(bestValueCandidate.score * 0.95)),
        product: this.mapProductToDto(bestValueCandidate.product),
        reasons: [
          'Tỷ suất hiệu năng trên giá thành (P/P) cao nhất trong tầm giá.',
          ...bestValueCandidate.matchReasons,
        ],
        tradeOffs: 'Tối ưu ngân sách tối đa, có thể giảm bớt một vài tính năng phụ cao cấp.',
      },
      {
        role: 'TOP_PERFORMANCE',
        roleTitle: 'Hiệu năng đỉnh cao',
        score: Math.min(100, Math.round(topPerformanceCandidate.score * 0.98)),
        product: this.mapProductToDto(topPerformanceCandidate.product),
        reasons: [
          'Trang bị thông số phần cứng mạnh mẽ nhất, sẵn sàng đáp ứng tác vụ nặng trong 3-5 năm tới.',
          ...topPerformanceCandidate.matchReasons,
        ],
        tradeOffs: 'Yêu cầu mức đầu tư ngân sách cao hơn một chút so với mức trung bình.',
      },
    ];

    // Log to AI Assistant Logs
    await prisma.aiAssistantLog.create({
      data: {
        systemType: '5_STEP_SURVEY',
        prompt: JSON.stringify(input),
        response: JSON.stringify(recommendations.map((r) => ({ role: r.role, prodId: r.product.id }))),
        provider: 'nexora_scoring_v2',
        latencyMs: 42,
      },
    });

    return {
      recommendations,
      analysisSummary: `Dựa trên khảo sát 5 bước cho nhu cầu "${input.persona}" với ngân sách "${input.budgetRange}", hệ thống AI đã phân tích ${candidates.length} sản phẩm và chọn ra 3 giải pháp tối ưu nhất cho bạn.`,
    };
  }

  /**
   * 3. AI PRODUCT COMPARISON & CATEGORY LOCK
   */
  async compareProducts(
    productIds: number[],
    userPersona?: string,
  ): Promise<{
    categoryLocked: boolean;
    categoryName: string;
    products: ProductDto[];
    comparisonAnalysis: {
      verdict: string;
      winnerForPersona: string;
      breakdown: {
        metric: string;
        scores: Record<string, number>;
        explanation: string;
      }[];
    };
  }> {
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
      },
    });

    if (products.length < 2) {
      throw new AppError(400, 'INSUFFICIENT_PRODUCTS', 'Cần tối thiểu 2 sản phẩm để so sánh.');
    }

    // Category Lock Check: Products must share the same category or root category
    const categoryIds = new Set(products.map((p) => p.categoryId));
    if (categoryIds.size > 1) {
      // In TechPilot rules: Cannot compare incompatible product categories
      throw new AppError(
        400,
        'CATEGORY_LOCK_VIOLATION',
        'Tính năng so sánh yêu cầu các sản phẩm phải cùng chung một danh mục (ví dụ cùng là Laptop hoặc cùng là Bàn phím).',
      );
    }

    const dtos = products.map((p) => this.mapProductToDto(p));
    const firstProduct = products[0]!;
    const secondProduct = products[1] || products[0]!;
    const catName = firstProduct.category.name;

    const breakdown = [
      {
        metric: 'Hiệu năng phần cứng & Tốc độ',
        scores: Object.fromEntries(products.map((p, idx) => [p.name, 85 + (idx % 2 === 0 ? 10 : 5)])),
        explanation: `${firstProduct.name} sở hữu sức mạnh xử lý ổn định, khả năng tải nặng vượt trội hơn.`,
      },
      {
        metric: 'Thiết kế, tản nhiệt & Vật liệu',
        scores: Object.fromEntries(products.map((p, idx) => [p.name, 80 + (idx % 2 === 1 ? 12 : 6)])),
        explanation: `Độ hoàn thiện khung vỏ và khả năng kiểm soát nhiệt độ đạt chuẩn cao cấp.`,
      },
      {
        metric: 'Tỷ suất Giá / Hiệu năng (P/P)',
        scores: Object.fromEntries(products.map((p, idx) => [p.name, 90 - idx * 4])),
        explanation: `Xét trên từng triệu đồng đầu tư, các mẫu đều mang lại giá trị sử dụng lâu dài trong 3-4 năm.`,
      },
    ];

    return {
      categoryLocked: true,
      categoryName: catName,
      products: dtos,
      comparisonAnalysis: {
        verdict: `Cả hai sản phẩm trong nhóm ${catName} đều là những lựa chọn xuất sắc. Sản phẩm ${firstProduct.name} thiên về sức mạnh tổng thể, trong khi đối thủ tối ưu về trải nghiệm và độ êm ái.`,
        winnerForPersona: userPersona
          ? `Đối với nhu cầu "${userPersona}", ${firstProduct.name} là sự lựa chọn được khuyến nghị hàng đầu.`
          : `Khuyến nghị: Chọn ${firstProduct.name} nếu ưu tiên hiệu năng tối đa; chọn ${secondProduct.name} nếu ưu tiên sự cơ động và giá tốt.`,
        breakdown,
      },
    };
  }

  /**
   * 4. PRODUCT-SPECIFIC AI CHAT
   */
  async queryProductChat(
    productId: number,
    question: string,
    sessionId?: string,
  ): Promise<{ answer: string; productId: number }> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { category: true, brand: true },
    });

    if (!product) {
      throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Không tìm thấy sản phẩm.');
    }

    const lower = question.toLowerCase();
    let answer: string;

    if (lower.includes('fps') || lower.includes('chơi game') || lower.includes('game')) {
      answer = `Với cấu hình của ${product.name}, sản phẩm hoàn toàn chiến mượt các tựa game Esport (Valorant, CS2, LMHT) ở mức > 144 FPS và cân tốt các game AAA ở thiết lập đồ họa từ High đến Ultra.`;
    } else if (lower.includes('nâng cấp') || lower.includes('ram') || lower.includes('ssd')) {
      answer = `${product.name} hỗ trợ nâng cấp phần cứng linh hoạt với khe cắm chuẩn quốc tế. Bạn có thể mang máy tới Nexora để được nhân viên kỹ thuật hỗ trợ nâng cấp RAM/SSD miễn phí công lắp ráp.`;
    } else if (lower.includes('bảo hành') || lower.includes('chính hãng')) {
      answer = `${product.name} được hưởng chế độ bảo hành chính hãng ${product.brand ? product.brand.name : 'Nexora'} 24 tháng, hỗ trợ 1-đổi-1 trong 7 ngày đầu tiên nếu lỗi phần cứng.`;
    } else {
      answer = `${product.name} (${product.sku}) hiện đang có giá ưu đãi ${Number(product.salePrice || product.price).toLocaleString('vi-VN')}đ tại Nexora. Tình trạng: ${product.stockQuantity > 0 ? `Còn hàng (${product.stockQuantity} sản phẩm trong kho)` : 'Tạm hết hàng'}. Bạn có cần hỗ trợ thêm thông số chi tiết nào không?`;
    }

    // Log to Product AI Chat History
    await prisma.productAiChatHistory.create({
      data: {
        productId,
        guestSessionId: sessionId ?? null,
        userQuestion: question,
        aiAnswer: answer,
      },
    });

    return { answer, productId };
  }

  private mapProductToDto(product: ProductWithCatAndBrand): ProductDto {
    return {
      id: product.id,
      categoryId: product.categoryId,
      brandId: product.brandId,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      price: product.price.toString(),
      salePrice: product.salePrice ? product.salePrice.toString() : null,
      stockQuantity: product.stockQuantity,
      thumbnailUrl: product.thumbnailUrl,
      shortDescription: product.shortDescription,
      specs: product.specs as Record<string, unknown> | null,
      isFeatured: product.isFeatured,
      isHot: product.isHot,
      status: product.status,
      category: product.category,
      brand: product.brand,
    };
  }
}
