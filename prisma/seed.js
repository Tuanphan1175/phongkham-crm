const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu seed dữ liệu...');

  // Users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const doctorPassword = await bcrypt.hash('doctor123', 10);
  const nursePassword = await bcrypt.hash('nurse123', 10);
  const letanPassword = await bcrypt.hash('letan123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@phongkham.vn' },
    update: {},
    create: {
      email: 'admin@phongkham.vn',
      password: adminPassword,
      name: 'Quản trị viên',
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin user created');

  await prisma.user.upsert({
    where: { email: 'bacsi@phongkham.vn' },
    update: { name: 'Phan Anh Tuấn' },
    create: {
      email: 'bacsi@phongkham.vn',
      password: doctorPassword,
      name: 'Phan Anh Tuấn',
      role: 'DOCTOR',
      phone: '0901234567',
    },
  });
  console.log('✅ Doctor 1 created: Phan Anh Tuấn');

  await prisma.user.upsert({
    where: { email: 'bacsi2@phongkham.vn' },
    update: { name: 'Trần Thị Thanh Vy' },
    create: {
      email: 'bacsi2@phongkham.vn',
      password: doctorPassword,
      name: 'Trần Thị Thanh Vy',
      role: 'DOCTOR',
      phone: '0902345678',
    },
  });
  console.log('✅ Doctor 2 created: Trần Thị Thanh Vy');

  await prisma.user.upsert({
    where: { email: 'nurse@phongkham.vn' },
    update: {},
    create: {
      email: 'nurse@phongkham.vn',
      password: nursePassword,
      name: 'Trần Thị Lan',
      role: 'NURSE',
    },
  });
  console.log('✅ Nurse user created');

  await prisma.user.upsert({
    where: { email: 'letan@phongkham.vn' },
    update: {},
    create: {
      email: 'letan@phongkham.vn',
      password: letanPassword,
      name: 'Lê Thị Hoa',
      role: 'RECEPTIONIST',
    },
  });
  console.log('✅ Receptionist user created');

  // Medicines
  const medicines = [
    { code: 'TH001', name: 'Men vi sinh Lactobacillus', unit: 'Gói', dosageForm: 'Bột', stockQty: 200, costPrice: 15000, sellPrice: 25000 },
    { code: 'TH002', name: 'Smecta', unit: 'Gói', dosageForm: 'Bột', stockQty: 150, costPrice: 8000, sellPrice: 15000 },
    { code: 'TH003', name: 'Motilium-M 10mg', unit: 'Viên', dosageForm: 'Viên nén', stockQty: 300, costPrice: 3000, sellPrice: 5000 },
    { code: 'TH004', name: 'Pantoprazole 40mg', unit: 'Viên', dosageForm: 'Viên nén', stockQty: 500, costPrice: 5000, sellPrice: 10000 },
    { code: 'TH005', name: 'Buscopan 10mg', unit: 'Viên', dosageForm: 'Viên nén', stockQty: 200, costPrice: 4000, sellPrice: 8000 },
    { code: 'TH006', name: 'Vitamin C 500mg', unit: 'Viên', dosageForm: 'Viên sủi', stockQty: 400, costPrice: 2000, sellPrice: 4000 },
    { code: 'TH007', name: 'Creon 10000', unit: 'Viên', dosageForm: 'Viên nang', stockQty: 100, costPrice: 20000, sellPrice: 35000 },
  ];

  for (const med of medicines) {
    await prisma.medicine.upsert({
      where: { code: med.code },
      update: {},
      create: med,
    });
  }
  console.log('✅ Medicines created (7 items)');

  // Services
  const services = [
    { code: 'DV001', name: 'Khám tổng quát', category: 'Khám bệnh', price: 150000 },
    { code: 'DV002', name: 'Khám chuyên khoa', category: 'Khám bệnh', price: 200000 },
    { code: 'DV003', name: 'Xét nghiệm máu cơ bản', category: 'Xét nghiệm', price: 250000 },
    { code: 'DV004', name: 'Siêu âm ổ bụng', category: 'Chẩn đoán hình ảnh', price: 300000 },
    { code: 'DV005', name: 'Tư vấn dinh dưỡng', category: 'Tư vấn', price: 100000 },
    { code: 'DV006', name: 'Đo điện tim', category: 'Chẩn đoán', price: 120000 },
  ];

  for (const svc of services) {
    await prisma.service.upsert({
      where: { code: svc.code },
      update: {},
      create: svc,
    });
  }
  console.log('✅ Services created (6 items)');

  // Programs — 3 gói liệu trình 21 ngày
  const programs = [
    {
      code: 'GOI_CO_BAN',
      name: 'Gói Cơ Bản',
      price: 1500000,
      description: 'Liệu trình 21 ngày phục hồi đường ruột cơ bản. Phù hợp cho người mới bắt đầu, bao gồm thực đơn ăn uống và thực phẩm chức năng thiết yếu.',
      durationWeeks: 3,
    },
    {
      code: 'GOI_NANG_CAO',
      name: 'Gói Nâng Cao',
      price: 2800000,
      description: 'Liệu trình 21 ngày phục hồi đường ruột nâng cao. Bổ sung tư vấn dinh dưỡng 1-1, theo dõi chỉ số sức khoẻ hàng tuần và thực phẩm chức năng cao cấp.',
      durationWeeks: 3,
    },
    {
      code: 'GOI_VIP',
      name: 'Gói VIP',
      price: 5000000,
      description: 'Liệu trình 21 ngày phục hồi đường ruột VIP. Dịch vụ toàn diện: tư vấn riêng với bác sĩ, xét nghiệm vi sinh đường ruột, thực đơn cá nhân hoá và hỗ trợ 24/7.',
      durationWeeks: 3,
    },
  ];

  for (const prog of programs) {
    await prisma.program.upsert({
      where: { code: prog.code },
      update: { name: prog.name, description: prog.description },
      create: prog,
    });
  }
  console.log('✅ Programs created (3 gói: Cơ Bản, Nâng Cao, VIP)');

  // Sample patient
  await prisma.patient.upsert({
    where: { code: 'BN000001' },
    update: {},
    create: {
      code: 'BN000001',
      fullName: 'Nguyễn Thị Mai',
      dateOfBirth: new Date('1985-05-15'),
      gender: 'FEMALE',
      phone: '0912345678',
      address: 'Hà Nội',
    },
  });
  console.log('✅ Sample patient created');

  console.log('\n🎉 Seed hoàn thành! Đăng nhập với:');
  console.log('   Email: admin@phongkham.vn');
  console.log('   Mật khẩu: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
