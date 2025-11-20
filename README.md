# CMS Bundle

Dự án bundle file JavaScript sang WebAssembly (WASM) sử dụng Node.js và Express.

## 📋 Mô tả

CMS Bundle là một ứng dụng Node.js được xây dựng với Express framework, hỗ trợ bundle các file JavaScript thành WebAssembly format.

## 🚀 Yêu cầu hệ thống

- Node.js >= 14.x
- npm >= 6.x

## 📦 Cài đặt

1. Clone repository:
```bash
git clone <repository-url>
cd cms_bundle
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Tạo file `.env` (nếu cần):
```bash
PORT=3000
```

## 🏃 Chạy ứng dụng

### Development mode (với auto-reload):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

Server sẽ chạy tại `http://localhost:3000` (hoặc port được cấu hình trong `.env`)

## 📁 Cấu trúc thư mục

```
cms_bundle/
├── src/
│   ├── controllers/     # Controllers xử lý logic
│   ├── routers/         # Định nghĩa routes
│   └── index.js         # Entry point của ứng dụng
├── .husky/              # Git hooks (Husky)
├── .eslintrc.json       # Cấu hình ESLint
├── .prettierrc          # Cấu hình Prettier
├── .lintstagedrc.json   # Cấu hình lint-staged
├── package.json
└── README.md
```

## 🛠️ Scripts có sẵn

### Development
- `npm start` - Chạy ứng dụng ở production mode
- `npm run dev` - Chạy ứng dụng ở development mode với auto-reload

### Code Quality
- `npm run lint` - Kiểm tra lỗi ESLint
- `npm run lint:fix` - Tự động sửa lỗi ESLint
- `npm run format` - Format toàn bộ code với Prettier
- `npm run format:check` - Kiểm tra format code (không tự động sửa)

### Testing
- `npm test` - Chạy tests (chưa được cấu hình)

## 🔧 Code Quality Tools

Dự án được tích hợp các công cụ đảm bảo chất lượng code:

### Prettier
- Format code tự động theo chuẩn đã cấu hình
- Cấu hình: `.prettierrc`
- File bỏ qua: `.prettierignore`

### ESLint
- Kiểm tra và đảm bảo code quality
- Cấu hình: `.eslintrc.json`
- File bỏ qua: `.eslintignore`

### Husky
- Git hooks tự động chạy lint và format trước khi commit
- Pre-commit hook: Tự động chạy `lint-staged` để format và lint các file đã thay đổi

### Lint-staged
- Chỉ format/lint các file đã thay đổi trong commit
- Cấu hình: `.lintstagedrc.json`

## 📝 Quy trình làm việc

1. Tạo branch mới cho feature/bugfix
2. Viết code và commit
3. Trước khi commit, Husky sẽ tự động:
   - Chạy ESLint để kiểm tra lỗi
   - Format code với Prettier
4. Nếu có lỗi, commit sẽ bị chặn cho đến khi sửa xong

## 🔐 Environment Variables

Tạo file `.env` trong root directory với các biến sau:

```env
PORT=3000
```

## 📄 License

ISC

## 👤 Author

---

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng tạo issue hoặc pull request.

