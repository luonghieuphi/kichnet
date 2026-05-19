const SECRET_SALT = "SHARPIX_SECURE_ACTIVATION_SALT_2026_PRO_KEY";

function generateHash(input) {
  let hash = 0;
  const salted = input + SECRET_SALT;
  for (let i = 0; i < salted.length; i++) {
    hash = (hash << 5) - hash + salted.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36).toUpperCase().padStart(6, "0").slice(0, 6);
}

function generateRandomPart1() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function createActivationCode() {
  const part1 = generateRandomPart1();
  const expiry = "PERM";
  const signature = generateHash(part1 + "-" + expiry + "_GENERAL_KEY_VALIDATION");
  return `SHARPIX-GEN-${part1}-${expiry}-${signature}`;
}

const countArg = process.argv[2];
const count = parseInt(countArg) || 1;

console.log(`\n🔑 SHARPIX AI - TRÌNH TẠO MÃ KÍCH HOẠT CHÍNH HÃNG`);
console.log(`===============================================`);
console.log(`Đang tạo ${count} mã bản quyền hợp lệ...\n`);

for (let i = 0; i < count; i++) {
  console.log(`  Code ${String(i + 1).padStart(2, '0')}:  \x1b[36m\x1b[1m${createActivationCode()}\x1b[0m`);
}

console.log(`\n===============================================`);
console.log(`👉 Bạn có thể dán mã trên vào ứng dụng để mở khóa!`);
console.log(`👉 Nhận hỗ trợ tại: https://sharpix.me\n`);
