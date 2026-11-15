const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Bắt đầu làm sạch dữ liệu và nạp dữ liệu mẫu công ty IT chuẩn mực...");

  // Xóa dữ liệu cũ theo thứ tự quan hệ khóa ngoại
  await prisma.evaluation.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.application.deleteMany({});
  await prisma.candidate.deleteMany({});
  await prisma.job.deleteMany({});

  // 1. Tạo 3 tài khoản nội bộ (Admin, HR, Hiring Manager)
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@recoverx.career" },
    update: { passwordHash: "Admin@123" },
    create: {
      fullName: "Nguyễn Văn An (Quản Trị Hệ Thống)",
      email: "admin@recoverx.career",
      passwordHash: "Admin@123",
      role: "ADMIN",
      isActive: true,
    },
  });

  const hrUser = await prisma.user.upsert({
    where: { email: "hr@recoverx.career" },
    update: { passwordHash: "Hr@123456" },
    create: {
      fullName: "Nguyễn Thu Hà (Trưởng Phòng Tuyển Dụng)",
      email: "hr@recoverx.career",
      passwordHash: "Hr@123456",
      role: "HR",
      isActive: true,
    },
  });

  const hiringManager = await prisma.user.upsert({
    where: { email: "techlead@recoverx.career" },
    update: { passwordHash: "Manager@123" },
    create: {
      fullName: "Trần Minh Quân (Engineering Lead)",
      email: "techlead@recoverx.career",
      passwordHash: "Manager@123",
      role: "HIRING_MANAGER",
      isActive: true,
    },
  });

  console.log("✅ Khởi tạo 3 tài khoản nội bộ RecoverX thành công.");

  // 2. Tạo danh mục 8 Vị trí Tuyển dụng Công nghệ Chân thật (Realistic IT Jobs)
  const jobsData = [
    {
      title: "Software Engineer Trainee (Java / Spring Boot & React) — Khóa 2026",
      department: "Phát triển Phần mềm",
      location: "Quận 1, TP. Hồ Chí Minh (Hybrid)",
      employmentType: "Toàn thời gian",
      minExperienceYears: 0,
      requiredSkills: JSON.stringify(["Java", "Spring Boot", "OOP", "SQL", "Git", "React", "HTML/CSS"]),
      requirementsJd: `VỀ CHƯƠNG TRÌNH TRAINEE FAST-TRACK:
RecoverX tuyển chọn 10 Kỹ sư phần mềm tiềm năng tham gia chương trình đào tạo chuyên sâu 3 tháng có lương, huấn luyện trực tiếp bởi các Software Architect giàu kinh nghiệm và tham gia dự án phần mềm cho khách hàng Thụy Sĩ/Singapore.

TRÁCH NHIỆM CHÍNH:
- Tham gia các khóa đào tạo chuyên sâu về Clean Code, Design Patterns, Spring Boot, Microservices và React.
- Thực hành phát triển các tính năng module thực tế dưới sự hướng dẫn 1-1 của Senior Mentor.
- Tham gia đầy đủ các nghi thức Agile/Scrum (Daily standup, Sprint planning, Code review).

YÊU CẦU ỨNG VIÊN:
- Sinh viên năm cuối hoặc mới tốt nghiệp chuyên ngành CNTT, Kỹ thuật Phần mềm, Khoa học Máy tính.
- Nắm vững lập trình hướng đối tượng (OOP), cấu trúc dữ liệu và giải thuật.
- Có kiến thức cơ bản về Java, CSDL quan hệ (SQL) và HTML/CSS/JavaScript.
- Tư duy logic tốt, chủ động học hỏi và ham thích công nghệ mới.
- Tiếng Anh giao tiếp hoặc đọc hiểu tài liệu kỹ thuật tốt.

QUYỀN LỢI ĐÃI NGỘ:
- Trợ cấp thực tập & đào tạo cạnh tranh: 8,000,000 – 12,000,000 VNĐ/tháng.
- Cam kết ký hợp đồng lao động chính thức (Junior Engineer) ngay sau khi tốt nghiệp khóa đào tạo.
- Trang bị máy tính xách tay cao cấp, phụ cấp ăn trưa và gửi xe.`,
      status: "ACTIVE",
    },
    {
      title: "Fullstack Developer (Node.js & React / TypeScript)",
      department: "Phát triển Phần mềm",
      location: "Quận 1, TP. Hồ Chí Minh",
      employmentType: "Toàn thời gian",
      minExperienceYears: 2,
      requiredSkills: JSON.stringify(["React", "Node.js", "TypeScript", "Tailwind CSS", "PostgreSQL", "Docker", "REST API"]),
      requirementsJd: `MÔ TẢ CÔNG VIỆC:
- Trực tiếp tham gia thiết kế và xây dựng các nền tảng Web Application quy mô lớn phục vụ doanh nghiệp quốc tế.
- Phát triển giao diện người dùng tương tác cao với React 18+, Next.js và Tailwind CSS.
- Xây dựng các dịch vụ Backend bảo mật, hiệu năng cao bằng Node.js / Express hoặc NestJS.
- Tối ưu hóa truy vấn CSDL PostgreSQL và triển khai container hóa với Docker.

YÊU CẦU ỨNG VIÊN:
- Tối thiểu 2 năm kinh nghiệm thực chiến phát triển ứng dụng web Fullstack (React & Node.js).
- Thành thạo TypeScript, am hiểu State Management, Server Components và tối ưu Web Vitals.
- Kinh nghiệm thiết kế RESTful API chuẩn mực và bảo mật JWT/OAuth2.
- Quen thuộc với Git flow, CI/CD pipeline và làm việc theo mô hình Agile/Scrum.

QUYỀN LỢI ĐÃI NGỘ:
- Thu nhập hấp dẫn: 22,000,000 – 35,000,000 VNĐ/tháng tùy năng lực.
- Lương tháng 13 + Thưởng hiệu suất dự án (Performance Bonus).
- Cung cấp MacBook Pro M-series + Màn hình 4K làm việc.
- Gói bảo hiểm chăm sóc sức khỏe cao cấp (Bảo Việt / PVI Health Insurance).`,
      status: "ACTIVE",
    },
    {
      title: "Senior Backend Engineer (Java / Microservices & Cloud AWS)",
      department: "Kiến trúc & Backend",
      location: "Quận 1, TP. Hồ Chí Minh (Hybrid)",
      employmentType: "Toàn thời gian",
      minExperienceYears: 4,
      requiredSkills: JSON.stringify(["Java", "Spring Boot", "Microservices", "Kafka", "AWS", "Docker", "Kubernetes", "Redis"]),
      requirementsJd: `MÔ TẢ CÔNG VIỆC:
- Định hình kiến trúc Backend chịu tải cao (High Concurrency & Low Latency) cho hệ thống tài chính - ngân hàng quốc tế.
- Xây dựng các Microservices trên nền Java 17/21, Spring Boot, Spring Cloud.
- Tích hợp Message Broker phân tán (Apache Kafka / RabbitMQ) và bộ nhớ đệm Redis Cluster.
- Thiết kế hệ thống Cloud-native trên hạ tầng AWS (ECS, EKS, RDS, S3, CloudFront).
- Hướng dẫn, phản biện giải pháp và thực hiện Code Review chất lượng cho đội ngũ kỹ sư.

YÊU CẦU ỨNG VIÊN:
- Tối thiểu 4 năm kinh nghiệm chuyên sâu với Java Backend và Spring Framework.
- Thành thạo kiến trúc Microservices, Clean Architecture, Domain-Driven Design (DDD).
- Kinh nghiệm thực tế vận hành Kafka, Redis và xử lý Transaction phân tán.
- Am hiểu dịch vụ điện toán đám mây AWS hoặc GCP, containerization với Docker & Kubernetes.
- Kỹ năng giao tiếp tiếng Anh lưu loát trong môi trường làm việc đa quốc gia.

QUYỀN LỢI ĐÃI NGỘ:
- Mức lương cạnh tranh: 45,000,000 – 65,000,000 VNĐ/tháng.
- Xét duyệt tăng lương định kỳ 2 lần/năm.
- Tài trợ 100% kinh phí thi các chứng chỉ quốc tế (AWS Solutions Architect, CKA, TOGAF).
- Cơ hội làm việc hoặc công tác ngắn hạn tại Thụy Sĩ và Singapore.`,
      status: "ACTIVE",
    },
    {
      title: "QA / QC Tester Trainee (Manual & Automation Basics) — Khóa 2026",
      department: "Đảm bảo Chất lượng",
      location: "Quận 1, TP. Hồ Chí Minh",
      employmentType: "Toàn thời gian",
      minExperienceYears: 0,
      requiredSkills: JSON.stringify(["Manual Testing", "Test Case Design", "SQL", "Postman", "Jira", "Bug Tracking", "English"]),
      requirementsJd: `VỀ CHƯƠNG TRÌNH QA TRAINEE:
Khóa đào tạo kỹ sư kiểm thử phần mềm chuyên nghiệp tại RecoverX trang bị cho bạn tư duy kiểm thử chuẩn quốc tế (ISTQB), quy trình đảm bảo chất lượng phần mềm và nền tảng bước đầu về Automation Testing.

TRÁCH NHIỆM CHÍNH:
- Phân tích tài liệu yêu cầu (Software Requirements Specification - SRS) để thiết kế Test Case.
- Thực hiện kiểm thử tính năng (Functional Testing), giao diện (UI Testing) và tích hợp (Integration Testing).
- Báo cáo lỗi chi tiết trên hệ thống Jira và theo dõi vòng đời bug.
- Làm quen với kiểm thử API qua Postman và công cụ kiểm thử tự động Playwright/Selenium.

YÊU CẦU ỨNG VIÊN:
- Tốt nghiệp đại học chuyên ngành CNTT, Toán Tin, Hệ thống Thông tin hoặc ngành kỹ thuật liên quan.
- Tỉ mỉ, cẩn thận, có tư duy phản biện và khả năng phát hiện khiếm khuyết phần mềm.
- Nắm vững kiến thức cơ bản về quy trình kiểm thử phần mềm (STLC, Test Levels, Test Types).
- Kỹ năng đọc hiểu tài liệu tiếng Anh tốt.

QUYỀN LỢI ĐÃI NGỘ:
- Trợ cấp đào tạo 7,000,000 – 10,000,000 VNĐ/tháng trong 3 tháng.
- Miễn phí đào tạo chuẩn bị thi chứng chỉ quốc tế ISTQB Foundation.
- Nhận việc chính thức với lộ trình phát triển rõ ràng thành Automation QA Engineer.`,
      status: "ACTIVE",
    },
    {
      title: "Senior Automation QA Engineer (Playwright / Selenium & CI/CD)",
      department: "Đảm bảo Chất lượng",
      location: "Quận 1, TP. Hồ Chí Minh (Hybrid)",
      employmentType: "Toàn thời gian",
      minExperienceYears: 3,
      requiredSkills: JSON.stringify(["Automation Testing", "Playwright", "Selenium", "TypeScript", "CI/CD", "Postman", "k6"]),
      requirementsJd: `MÔ TẢ CÔNG VIỆC:
- Thiết kế, xây dựng và duy trì Automation Test Framework từ đầu cho các dự án Web và API quy mô lớn.
- Lập trình kịch bản kiểm thử tự động với Playwright hoặc Selenium WebDriver (TypeScript/Java).
- Tích hợp kiểm thử tự động vào quy trình CI/CD (GitHub Actions / GitLab CI) chạy tự động theo từng commit.
- Phối hợp với đội ngũ phát triển thực hiện kiểm thử hiệu năng (Performance Testing với k6 / JMeter).

YÊU CẦU ỨNG VIÊN:
- Tối thiểu 3 năm kinh nghiệm trong lĩnh vực Automation Testing.
- Thành thạo ngôn ngữ TypeScript/JavaScript hoặc Java; sử dụng thành thạo Playwright/Cypress/Selenium.
- Có kinh nghiệm kiểm thử API tự động (RestAssured, SuperTest, Newman).
- Hiểu biết sâu sắc về kiểm thử hiệu năng, tải và bảo mật cơ bản.
- Khả năng giao tiếp tiếng Anh tốt khi làm việc với đối tác quốc tế.

QUYỀN LỢI ĐÃI NGỘ:
- Mức lương: 30,000,000 – 45,000,000 VNĐ/tháng.
- Lương tháng 13 + Thưởng dự án.
- Thiết bị MacBook Pro cao cấp, màn hình phụ chuyên dụng.
- Bảo hiểm sức khỏe quốc tế cao cấp toàn diện.`,
      status: "ACTIVE",
    },
    {
      title: "UI/UX Designer (Design System & Enterprise SaaS)",
      department: "Thiết kế Sản phẩm",
      location: "Quận 1, TP. Hồ Chí Minh",
      employmentType: "Toàn thời gian",
      minExperienceYears: 2,
      requiredSkills: JSON.stringify(["Figma", "UI/UX Design", "Design System", "Wireframing", "Prototyping", "User Research"]),
      requirementsJd: `MÔ TẢ CÔNG VIỆC:
- Nghiên cứu người dùng, thiết kế trải nghiệm người dùng (UX) và giao diện trực quan (UI) cho các ứng dụng phần mềm doanh nghiệp phức tạp.
- Xây dựng, quản lý và nhân rộng Design System (Figma Components, Variants, Design Tokens).
- Phối hợp chặt chẽ với Product Owner và Frontend Engineers để đảm bảo thiết kế được triển khai hoàn hảo.
- Tạo Wireframe, User Flow, Interactive Prototype và thực hiện kiểm thử người dùng (Usability Testing).

YÊU CẦU ỨNG VIÊN:
- Tối thiểu 2 năm kinh nghiệm thiết kế UI/UX cho ứng dụng Web / SaaS hoặc nền tảng di động.
- Thành thạo Figma (Auto Layout, Component Properties, Variables, Interactive Components).
- Hiểu biết về nguyên lý thiết kế, Typography, Color Theory và Accessibility (WCAG).
- Bắt buộc có Portfolio đính kèm thể hiện quy trình thiết kế và sản phẩm đã ra mắt.

QUYỀN LỢI ĐÃI NGỘ:
- Mức lương: 25,000,000 – 40,000,000 VNĐ/tháng.
- Trang bị màn hình 4K màu chuẩn đồ họa + Bảng vẽ Wacom (nếu cần).
- Môi trường sáng tạo, tôn trọng ý tưởng mới, giờ giấc làm việc linh hoạt.`,
      status: "ACTIVE",
    },
    {
      title: "DevOps & Cloud Platform Engineer (AWS, Kubernetes, Terraform)",
      department: "Hạ tầng & Cloud",
      location: "Quận 1, TP. Hồ Chí Minh (Hybrid)",
      employmentType: "Toàn thời gian",
      minExperienceYears: 3,
      requiredSkills: JSON.stringify(["AWS", "Docker", "Kubernetes", "Terraform", "CI/CD", "Linux", "Prometheus", "Grafana"]),
      requirementsJd: `MÔ TẢ CÔNG VIỆC:
- Thiết kế, triển khai và tự động hóa hạ tầng Cloud trên AWS bằng mô hình Infrastructure as Code (Terraform).
- Vận hành và giám sát hệ thống Kubernetes cluster (EKS) môi trường Production với độ sẵn sàng cao (High Availability 99.99%).
- Xây dựng và tối ưu hóa các pipeline CI/CD (GitHub Actions / GitLab CI) phục vụ quy trình GitOps.
- Triển khai hệ thống giám sát và cảnh báo tập trung (Prometheus, Grafana, ELK Stack, Datadog).

YÊU CẦU ỨNG VIÊN:
- Tối thiểu 3 năm kinh nghiệm trong vai trò DevOps / Cloud Engineer.
- Quản trị vững vàng hệ điều hành Linux và mạng máy tính (VPC, Subnet, Routing, Security Groups).
- Thành thạo Kubernetes, Helm Charts và công cụ IaC Terraform.
- Có chứng chỉ AWS Certified Solutions Architect hoặc CKA là lợi thế lớn.

QUYỀN LỢI ĐÃI NGỘ:
- Mức lương: 35,000,000 – 55,000,000 VNĐ/tháng.
- Lương tháng 13 + Thưởng hiệu suất cuối năm.
- Tài trợ 100% kinh phí thi các chứng chỉ quốc tế Cloud/DevOps.`,
      status: "ACTIVE",
    },
    {
      title: "IT Business Analyst (ITBA - Enterprise Solutions)",
      department: "Phân tích Nghiệp vụ",
      location: "Quận 1, TP. Hồ Chí Minh",
      employmentType: "Toàn thời gian",
      minExperienceYears: 3,
      requiredSkills: JSON.stringify(["Business Analysis", "BPMN 2.0", "UML", "Requirement Engineering", "Agile/Scrum", "Jira", "User Stories"]),
      requirementsJd: `MÔ TẢ CÔNG VIỆC:
- Khảo sát, thu thập và phân tích yêu cầu nghiệp vụ từ khách hàng doanh nghiệp quốc tế.
- Xây dựng mô hình quy trình nghiệp vụ, sơ đồ Use Case, Activity Diagram và User Stories chi tiết.
- Soạn thảo tài liệu đặc tả yêu cầu phần mềm (BRD, SRS) chuẩn mực và quản lý Product Backlog.
- Đóng vai trò cầu nối chiến lược giữa Product Owner và đội ngũ kỹ sư phát triển phần mềm.

YÊU CẦU ỨNG VIÊN:
- Tối thiểu 3 năm kinh nghiệm làm IT Business Analyst trong các dự án phần mềm doanh nghiệp.
- Kỹ năng phân tích logic xuất sắc, thành thạo công cụ vẽ quy trình (Enterprise Architect, Miro, Draw.io).
- Hiểu biết sâu sắc về quy trình phát triển phần mềm Agile/Scrum.
- Kỹ năng tiếng Anh giao tiếp và viết tài liệu lưu loát (tương đương IELTS 6.5+).

QUYỀN LỢI ĐÃI NGỘ:
- Mức lương: 28,000,000 – 45,000,000 VNĐ/tháng.
- Cơ hội làm việc trực tiếp với các chuyên gia nghiệp vụ quốc tế tại Châu Âu và Singapore.
- Lương tháng 13, thưởng dự án, bảo hiểm sức khỏe VIP.`,
      status: "ACTIVE",
    },
  ];

  const createdJobs = [];
  for (const jData of jobsData) {
    const job = await prisma.job.create({
      data: {
        creatorId: hrUser.id,
        ...jData,
      },
    });
    createdJobs.push(job);
  }

  console.log(`✅ Khởi tạo thành công ${createdJobs.length} vị trí việc làm IT chân thật.`);

  // 3. Tạo các Ứng viên (Candidates) và Đơn ứng tuyển mẫu
  const candidate1 = await prisma.candidate.create({
    data: {
      fullName: "Đặng Hoàng Long",
      email: "hoanglong.dang@gmail.com",
      phone: "0901234567",
      experienceYears: 4,
      parsedSkills: JSON.stringify(["React", "Node.js", "TypeScript", "PostgreSQL", "Docker", "Tailwind CSS"]),
      parsedEducation: JSON.stringify([
        {
          institution: "Đại học Bách Khoa TP.HCM",
          degree: "Kỹ sư Kỹ thuật Phần mềm",
          grad_year: 2021,
        },
      ]),
      parsedExperience: JSON.stringify([
        {
          company: "Công ty Phần mềm KMS Solutions",
          position: "Fullstack Engineer",
          duration: "2021 - 2024",
          summary: "Xây dựng các hệ sinh thái Web App doanh nghiệp với React và Node.js.",
        },
      ]),
      cvFileUrl: "/uploads/sample_cv_long.pdf",
      cvText: "Kỹ sư phần mềm 4 năm kinh nghiệm chuyên sâu React, Node.js, TypeScript và PostgreSQL...",
    },
  });

  const candidate2 = await prisma.candidate.create({
    data: {
      fullName: "Vũ Thị Bích Ngọc",
      email: "bichngoc.vu@gmail.com",
      phone: "0912345678",
      experienceYears: 2,
      parsedSkills: JSON.stringify(["React", "TypeScript", "Tailwind CSS", "HTML5", "REST API"]),
      parsedEducation: JSON.stringify([
        {
          institution: "Đại học Khoa học Tự nhiên TP.HCM",
          degree: "Cử nhân Công nghệ Thông tin",
          grad_year: 2023,
        },
      ]),
      cvFileUrl: "/uploads/sample_cv_ngoc.pdf",
      cvText: "Frontend Developer 2 năm kinh nghiệm với React, TypeScript và Responsive UI...",
    },
  });

  const candidate3 = await prisma.candidate.create({
    data: {
      fullName: "Phạm Quốc Tuấn",
      email: "quoctuan.pham@outlook.com",
      phone: "0987654321",
      experienceYears: 1,
      parsedSkills: JSON.stringify(["PHP", "MySQL", "jQuery", "Bootstrap"]),
      cvFileUrl: "/uploads/sample_cv_tuan.pdf",
      cvText: "Lập trình viên web PHP 1 năm kinh nghiệm...",
    },
  });

  const candidate4 = await prisma.candidate.create({
    data: {
      fullName: "Nguyễn Lê Quỳnh Anh",
      email: "quynhanh.nguyen@gmail.com",
      phone: "0934567890",
      experienceYears: 3,
      parsedSkills: JSON.stringify(["Playwright", "Selenium", "TypeScript", "CI/CD", "Postman"]),
      parsedEducation: JSON.stringify([
        {
          institution: "Đại học FPT",
          degree: "Cử nhân Kỹ thuật Phần mềm",
          grad_year: 2022,
        },
      ]),
      cvFileUrl: "/uploads/sample_cv_quynhanh.pdf",
      cvText: "Kỹ sư kiểm thử tự động 3 năm kinh nghiệm với Playwright và CI/CD...",
    },
  });

  // 4. Tạo Đơn ứng tuyển (Applications) phân bổ vào các cột Kanban
  // App 1: INTERVIEW có lịch hẹn
  const app1 = await prisma.application.create({
    data: {
      candidateId: candidate1.id,
      jobId: createdJobs[1].id, // Fullstack Developer
      currentStage: "INTERVIEW",
      aiMatchScore: 92.0,
      aiMatchRationale: "Ứng viên đáp ứng xuất sắc 6/7 kỹ năng trọng yếu của vị trí Fullstack Developer. Có 4 năm kinh nghiệm thực tế vượt mức yêu cầu 2 năm.",
      aiMatchedSkills: JSON.stringify(["React", "Node.js", "TypeScript", "Tailwind CSS", "PostgreSQL", "Docker"]),
      aiMissingSkills: JSON.stringify([]),
      interviewDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 ngày nữa
      interviewFormat: "ONLINE",
      interviewLocation: "https://meet.google.com/rec-meet-demo",
      interviewNotes: "Vui lòng chuẩn bị slide thuyết trình kiến trúc dự án gần nhất và demo code trực tiếp.",
    },
  });

  // Phiếu đánh giá Scorecard cho App 1
  await prisma.evaluation.create({
    data: {
      applicationId: app1.id,
      evaluatorId: hiringManager.id,
      round: "Vòng 1 — Đánh giá Kỹ thuật & Chuyên môn",
      technicalScore: 5,
      communicationScore: 4,
      culturalFitScore: 5,
      overallScore: 4.7,
      levelRecommendation: "SENIOR",
      strengths: "Nắm rất vững kiến trúc Microservices & Next.js Server Components, kinh nghiệm xử lý hệ thống tải cao thực tế, thiết kế Clean Architecture mẫu mực.",
      weaknesses: "Cần làm quen thêm với quy trình triển khai multi-cloud theo chuẩn Châu Âu trong giai đoạn onboarding.",
      technicalNotes: "Thiết kế database tối ưu, tối ưu truy vấn SQL, giải quyết thuật toán concurrency hoàn hảo.",
      communicationNotes: "Thuyết trình tự tin, phản biện sắc sảo, tiếng Anh giao tiếp lưu loát trôi chảy.",
      cultureNotes: "Thái độ tích cực, tinh thần làm chủ công việc cao, phù hợp 100% với giá trị cốt lõi của công ty.",
      hireReason: "Đạt chuẩn vượt kỳ vọng cho vị trí Senior Fullstack Developer, hội đồng chuyên môn nhất trí đề xuất tuyển dụng ngay.",
      comments: "Ứng viên nắm rất vững kiến trúc React & Node.js, phong cách giao tiếp chuyên nghiệp và tư duy giải quyết vấn đề xuất sắc.",
      recommendation: "STRONG_HIRE",
    },
  });

  // App 2: SCREENING
  await prisma.application.create({
    data: {
      candidateId: candidate2.id,
      jobId: createdJobs[1].id, // Fullstack Developer
      currentStage: "SCREENING",
      aiMatchScore: 75.0,
      aiMatchRationale: "Ứng viên có nền tảng React và TypeScript tốt, tuy nhiên phần Backend Node.js và CSDL PostgreSQL cần được đánh giá sâu hơn.",
      aiMatchedSkills: JSON.stringify(["React", "TypeScript", "Tailwind CSS"]),
      aiMissingSkills: JSON.stringify(["Node.js", "PostgreSQL", "Docker"]),
    },
  });

  // App 3: REJECTED (với Delay Buffer 12h)
  await prisma.application.create({
    data: {
      candidateId: candidate3.id,
      jobId: createdJobs[1].id,
      currentStage: "REJECTED",
      aiMatchScore: 35.0,
      aiMatchRationale: "Kỹ năng công nghệ không tương thích (chủ yếu PHP/jQuery thay vì React/TypeScript/Node.js) và số năm kinh nghiệm chưa đạt yêu cầu.",
      aiMatchedSkills: JSON.stringify([]),
      aiMissingSkills: JSON.stringify(["React", "Node.js", "TypeScript", "Tailwind CSS", "PostgreSQL", "Docker"]),
      emailScheduledAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
      isEmailSent: false,
    },
  });

  // App 4: NEW (QA Automation)
  await prisma.application.create({
    data: {
      candidateId: candidate4.id,
      jobId: createdJobs[4].id, // Senior Automation QA
      currentStage: "NEW",
      aiMatchScore: 88.0,
      aiMatchRationale: "Ứng viên có kinh nghiệm thực chiến vững chắc với Playwright, TypeScript và tích hợp CI/CD tự động.",
      aiMatchedSkills: JSON.stringify(["Playwright", "Selenium", "TypeScript", "CI/CD", "Postman"]),
      aiMissingSkills: JSON.stringify(["k6"]),
    },
  });

  console.log("✅ Hoàn tất nạp dữ liệu mẫu công ty IT RecoverX sạch sẽ và chân thật!");
}

main()
  .catch((e) => {
    console.error("Lỗi khi nạp dữ liệu:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
