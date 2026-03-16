import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Bắt đầu seed dữ liệu...");

  // =============================================
  // Users
  // =============================================
  const adminPassword = await hash("admin123", 10);
  const doctorPassword = await hash("doctor123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@phongkham.vn" },
    update: {},
    create: {
      email: "admin@phongkham.vn",
      password: adminPassword,
      name: "Quản trị viên",
      role: "ADMIN",
    },
  });

  const doctor = await prisma.user.upsert({
    where: { email: "bacsi@phongkham.vn" },
    update: {},
    create: {
      email: "bacsi@phongkham.vn",
      password: doctorPassword,
      name: "Nguyễn Văn Minh",
      role: "DOCTOR",
      phone: "0901234567",
    },
  });

  await prisma.user.upsert({
    where: { email: "nurse@phongkham.vn" },
    update: {},
    create: {
      email: "nurse@phongkham.vn",
      password: await hash("nurse123", 10),
      name: "Trần Thị Lan",
      role: "NURSE",
    },
  });

  await prisma.user.upsert({
    where: { email: "letan@phongkham.vn" },
    update: {},
    create: {
      email: "letan@phongkham.vn",
      password: await hash("letan123", 10),
      name: "Lê Thị Hoa",
      role: "RECEPTIONIST",
    },
  });

  console.log("✅ Đã tạo users");

  // =============================================
  // Services
  // =============================================
  const services = [
    { code: "DV001", name: "Khám tổng quát", category: "Khám", price: 150000 },
    { code: "DV002", name: "Khám chuyên khoa", category: "Khám", price: 200000 },
    { code: "DV003", name: "Xét nghiệm máu cơ bản", category: "Xét nghiệm", price: 250000 },
    { code: "DV004", name: "Siêu âm ổ bụng", category: "Chẩn đoán hình ảnh", price: 300000 },
    { code: "DV005", name: "Tư vấn dinh dưỡng", category: "Tư vấn", price: 100000 },
    { code: "DV006", name: "Đo điện tim", category: "Chẩn đoán", price: 120000 },
  ];

  for (const svc of services) {
    await prisma.service.upsert({
      where: { code: svc.code },
      update: {},
      create: svc,
    });
  }

  console.log("✅ Đã tạo services");

  // =============================================
  // Medicines
  // =============================================
  const medicines = [
    { code: "TH001", name: "Men vi sinh Lactobacillus", genericName: "Lactobacillus acidophilus", unit: "gói", dosageForm: "Bột", concentration: "1 tỷ CFU", manufacturer: "Imexpharm", stockQty: 200, minStockQty: 20, costPrice: 8000, sellPrice: 15000 },
    { code: "TH002", name: "Smecta", genericName: "Diosmectite", unit: "gói", dosageForm: "Bột", concentration: "3g", manufacturer: "Ipsen", stockQty: 150, minStockQty: 20, costPrice: 15000, sellPrice: 25000 },
    { code: "TH003", name: "Motilium-M", genericName: "Domperidone", unit: "viên", dosageForm: "Viên nén", concentration: "10mg", manufacturer: "Janssen", stockQty: 300, minStockQty: 30, costPrice: 5000, sellPrice: 8000 },
    { code: "TH004", name: "Pantoprazole 40mg", genericName: "Pantoprazole", unit: "viên", dosageForm: "Viên nén", concentration: "40mg", manufacturer: "Various", stockQty: 500, minStockQty: 50, costPrice: 4000, sellPrice: 7000 },
    { code: "TH005", name: "Buscopan", genericName: "Hyoscine-N-butylbromide", unit: "viên", dosageForm: "Viên nén", concentration: "10mg", manufacturer: "Sanofi", stockQty: 200, minStockQty: 20, costPrice: 6000, sellPrice: 10000 },
    { code: "TH006", name: "Vitamin C 500mg", genericName: "Ascorbic acid", unit: "viên", dosageForm: "Viên nén sủi", concentration: "500mg", manufacturer: "DHG", stockQty: 400, minStockQty: 40, costPrice: 2000, sellPrice: 4000 },
    { code: "TH007", name: "Enzyme tiêu hóa Creon", genericName: "Pancrelipase", unit: "viên", dosageForm: "Viên nang", concentration: "10000 UI", manufacturer: "Abbott", stockQty: 100, minStockQty: 10, costPrice: 25000, sellPrice: 40000 },
  ];

  for (const med of medicines) {
    await prisma.medicine.upsert({
      where: { code: med.code },
      update: {},
      create: med,
    });
  }

  console.log("✅ Đã tạo medicines");

  // =============================================
  // Program: 21 ngày phục hồi đường ruột
  // =============================================
  const program = await prisma.program.upsert({
    where: { code: "PHDR21" },
    update: {},
    create: {
      code: "PHDR21",
      name: "Phục Hồi Sức Khoẻ Đường Ruột 21 Ngày",
      durationWeeks: 3,
      price: 3500000,
      description: "Chương trình phục hồi toàn diện sức khoẻ đường ruột trong 21 ngày với thực đơn khoa học, men vi sinh, và hướng dẫn từ chuyên gia.",
    },
  });

  // Week templates
  const weekTemplates = [
    {
      weekNumber: 1,
      title: "Tuần 1: Làm sạch & Cân bằng",
      goals: "Loại bỏ thực phẩm gây hại, khởi động hệ vi sinh đường ruột, giảm viêm nhẹ",
      mealPlan: {
        mon: { breakfast: "Cháo yến mạch + chuối", lunch: "Cơm lứt + ức gà luộc + rau xào", dinner: "Súp rau củ", snack: "Sữa chua không đường" },
        tue: { breakfast: "Bánh mì ngũ cốc + bơ", lunch: "Cơm gạo lứt + cá hấp + salad", dinner: "Canh rau củ + đậu phụ", snack: "Chuối" },
        wed: { breakfast: "Cháo trắng + trứng luộc", lunch: "Bún gạo + thịt nạc luộc + rau sống", dinner: "Rau củ hấp + cơm lứt", snack: "Táo" },
        thu: { breakfast: "Yến mạch + việt quất", lunch: "Cơm lứt + lòng trắng trứng + rau cải", dinner: "Cháo đậu xanh", snack: "Hạt điều không muối" },
        fri: { breakfast: "Bánh gạo + mật ong", lunch: "Gà luộc + cơm lứt + dưa leo", dinner: "Canh cá + rau", snack: "Sữa chua" },
        sat: { breakfast: "Granola + sữa hạt", lunch: "Cơm gạo lứt + đậu hũ + rau", dinner: "Súp gà rau củ", snack: "Lê" },
        sun: { breakfast: "Smoothie rau xanh", lunch: "Cơm + cá + salad rau", dinner: "Canh chua cá + rau muống", snack: "Cà rốt baby" },
      },
      supplements: [
        { name: "Men vi sinh Lactobacillus", dosage: "1 gói", timing: "Buổi sáng, trước ăn 30 phút" },
        { name: "Vitamin C 500mg", dosage: "1 viên", timing: "Sau ăn trưa" },
      ],
      activities: "Đi bộ nhẹ 20-30 phút/ngày, yoga nhẹ, tránh vận động mạnh",
      tips: "Uống ít nhất 2L nước mỗi ngày. Tránh rượu bia, cà phê, thực phẩm cay nóng và chế biến sẵn. Ngủ đủ 7-8 tiếng.",
    },
    {
      weekNumber: 2,
      title: "Tuần 2: Nuôi dưỡng & Tái tạo",
      goals: "Tăng cường lợi khuẩn, cải thiện tiêu hóa, giảm triệu chứng đầy hơi và táo bón",
      mealPlan: {
        mon: { breakfast: "Cháo yến mạch + hạt chia", lunch: "Cơm lứt + cá hồi + rau bina", dinner: "Súp miso + đậu hũ", snack: "Kefir" },
        tue: { breakfast: "Bánh mì ngũ cốc + bơ hạt", lunch: "Salad quinoa + gà nướng", dinner: "Canh đậu lăng + rau", snack: "Quả bơ" },
        wed: { breakfast: "Nước ép celery", lunch: "Cơm lứt + thịt nạc + măng tây", dinner: "Cháo hành + gừng", snack: "Kimchi (ít muối)" },
        thu: { breakfast: "Smoothie banana + spinach", lunch: "Cơm + cá + rau củ hấp", dinner: "Canh gà rau củ", snack: "Sữa chua Hy Lạp" },
        fri: { breakfast: "Yến mạch + quả mọng", lunch: "Đậu phụ xào rau + cơm lứt", dinner: "Súp rau củ ngũ cốc", snack: "Táo + bơ hạt" },
        sat: { breakfast: "Trứng bác + rau + bánh mì ngũ cốc", lunch: "Cá hấp + rau muống + cơm gạo lứt", dinner: "Canh hến + rau cải", snack: "Hạt mix" },
        sun: { breakfast: "Cháo cá + hành ngò", lunch: "Cơm + thịt bò nạc + salad", dinner: "Canh rau củ hầm", snack: "Quả mọng" },
      },
      supplements: [
        { name: "Men vi sinh Lactobacillus", dosage: "1 gói", timing: "Buổi sáng, trước ăn 30 phút" },
        { name: "Enzyme tiêu hóa Creon", dosage: "1 viên", timing: "Trước ăn chính 15 phút" },
        { name: "Vitamin C 500mg", dosage: "1 viên", timing: "Sau ăn trưa" },
      ],
      activities: "Đi bộ 30 phút/ngày, yoga tiêu hóa 15 phút/ngày",
      tips: "Ăn chậm, nhai kỹ. Bổ sung thêm thực phẩm lên men (sữa chua, kimchi nhẹ). Tránh stress.",
    },
    {
      weekNumber: 3,
      title: "Tuần 3: Củng cố & Duy trì",
      goals: "Ổn định hệ vi sinh, duy trì thành quả, xây dựng thói quen ăn lành mạnh bền vững",
      mealPlan: {
        mon: { breakfast: "Cháo quinoa + hoa quả", lunch: "Cơm lứt + protein (gà/cá) + rau đa dạng", dinner: "Canh rau củ nhẹ", snack: "Sữa chua + hạt" },
        tue: { breakfast: "Omelet rau + bánh mì ngũ cốc", lunch: "Buddha bowl: quinoa + rau + đậu + hạt", dinner: "Súp đậu lăng", snack: "Táo + bơ" },
        wed: { breakfast: "Smoothie xanh đầy đủ", lunch: "Cá hồi + khoai lang nướng + salad", dinner: "Canh gà nhẹ", snack: "Kefir + việt quất" },
        thu: { breakfast: "Yến mạch nấu với sữa hạt", lunch: "Cơm lứt + đậu phụ + rau cải", dinner: "Canh rau củ hải sản", snack: "Hạt điều + chuối" },
        fri: { breakfast: "Bánh mì nướng + bơ + trứng", lunch: "Gà nướng + khoai lang + rau xanh", dinner: "Súp miso + rau", snack: "Cà rốt + hummus" },
        sat: { breakfast: "Granola homemade + sữa chua", lunch: "Cơm + cá + rau đa dạng", dinner: "Lẩu rau củ nhẹ", snack: "Trái cây hỗn hợp" },
        sun: { breakfast: "Cháo bổ dưỡng + hạt", lunch: "Bữa ăn gia đình lành mạnh", dinner: "Canh nhẹ + rau luộc", snack: "Sữa chua Hy Lạp" },
      },
      supplements: [
        { name: "Men vi sinh Lactobacillus", dosage: "1 gói", timing: "Buổi sáng, trước ăn 30 phút" },
        { name: "Vitamin C 500mg", dosage: "1 viên", timing: "Sau ăn trưa" },
      ],
      activities: "Duy trì đi bộ 30 phút/ngày, bắt đầu tập thể dục nhẹ đều đặn",
      tips: "Giữ thói quen tốt đã xây dựng. Tiếp tục ăn đa dạng rau củ quả. Hạn chế đường và thực phẩm chế biến sẵn vĩnh viễn.",
    },
  ];

  for (const wt of weekTemplates) {
    const existing = await prisma.programWeekTemplate.findFirst({
      where: { programId: program.id, weekNumber: wt.weekNumber },
    });

    if (!existing) {
      await prisma.programWeekTemplate.create({
        data: { programId: program.id, ...wt },
      });
    }
  }

  console.log("✅ Đã tạo chương trình 21 ngày phục hồi đường ruột");

  // =============================================
  // Sample patient
  // =============================================
  const samplePatient = await prisma.patient.upsert({
    where: { code: "BN000001" },
    update: {},
    create: {
      code: "BN000001",
      fullName: "Nguyễn Thị Mai",
      dateOfBirth: new Date("1985-05-15"),
      gender: "FEMALE",
      phone: "0912345678",
      email: "mai.nguyen@email.com",
      address: "123 Đường Lê Lợi, Quận 1, TP.HCM",
      occupation: "Nhân viên văn phòng",
    },
  });

  console.log("✅ Đã tạo sample patient");
  console.log("\n🎉 Seed hoàn thành!");
  console.log("\n📋 Tài khoản đăng nhập:");
  console.log("   Admin:       admin@phongkham.vn / admin123");
  console.log("   Bác sĩ:      bacsi@phongkham.vn / doctor123");
  console.log("   Điều dưỡng:  nurse@phongkham.vn / nurse123");
  console.log("   Lễ tân:      letan@phongkham.vn / letan123");
}

main()
  .catch((e) => {
    console.error("❌ Seed thất bại:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
