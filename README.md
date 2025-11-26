# CMS Bundle Service

Dịch vụ backend hỗ trợ đóng gói (bundle) và thực thi mã JavaScript an toàn trong môi trường cô lập (isolated environment), được xây dựng trên nền tảng Node.js và Express.

## 📋 Tính năng chính

- **JavaScript Bundling**: Đóng gói source code JavaScript sử dụng `esbuild` sang định dạng tối ưu (IIFE).
- **Secure Execution**: Thực thi mã người dùng trong sandbox an toàn sử dụng `isolated-vm`.
- **API Service**: Cung cấp RESTful API để tương tác với các dịch vụ khác.

## 🚀 Yêu cầu hệ thống

### Chạy Local

- **Node.js**: 22.x hoặc 24.x (Khuyến nghị **24.x** hoặc 22.x LTS).
  > **Lưu ý quan trọng**: `isolated-vm` hiện chưa tương thích hoàn toàn với Node.js 25. Vui lòng sử dụng Node 20, 22 hoặc 24.
- **Python**: 3.x (Yêu cầu để build `isolated-vm`).
- **C++ Compiler**: GCC/Clang (Yêu cầu để build native modules).

### Chạy với Docker

- **Docker**: Phiên bản 20.x trở lên
- **Docker Compose**: Phiên bản 2.x trở lên
- **Node.js**: Container sử dụng Node.js 24 (đã được cấu hình sẵn trong Dockerfile)

## 📦 Cài đặt & Chạy ứng dụng

### 1. Chạy trực tiếp (Local)

#### Sử dụng Makefile (Khuyến nghị)

Dự án có sẵn Makefile với các lệnh tiện ích. Xem tất cả các lệnh có sẵn:

```bash
make help
```

```bash
# Clone repository
git clone <repository-url>
cd cms_bundle

# Sử dụng phiên bản Node.js phù hợp (ví dụ nvm)
# Khuyến nghị sử dụng Node 24 (hoặc Node 22 LTS)
nvm install 24
nvm use 24

# Cài đặt dependencies
make install
# hoặc: npm install

# Cấu hình môi trường
cp .env.example .env
# (Chỉnh sửa file .env nếu cần thiết)

# Chạy ở chế độ Development (Auto-reload)
make dev
# hoặc: npm run dev

# Chạy ở chế độ Production
make start
# hoặc: npm start
```

#### Các lệnh Makefile hữu ích khác

```bash
# Code Quality
make lint          # Kiểm tra lỗi ESLint
make lint-fix      # Tự động sửa lỗi ESLint
make format        # Format code với Prettier
make format-check  # Kiểm tra format code

# Cleanup
make clean         # Xóa node_modules và các file tạm

# Testing
make test          # Chạy tests
```

### 2. Chạy với Docker

Dự án hỗ trợ chạy với Docker sử dụng **Node.js 24**, đã được cấu hình sẵn trong Dockerfile. Dự án cung cấp Makefile để đơn giản hóa việc quản lý Docker containers.

#### Sử dụng Makefile (Khuyến nghị)

Dự án có sẵn Makefile với các lệnh tiện ích. Xem tất cả các lệnh có sẵn:

```bash
make help
```

##### Development Mode (với hot-reload)

```bash
# Build và chạy container development
make docker-build-dev
make docker-dev

# Xem logs
make docker-logs-dev

# Dừng container
make docker-stop-dev

# Vào trong container để debug
make docker-bash-dev
```

##### Production Mode

```bash
# Build Docker image
make docker-build

# Chạy container ở background
make docker-up

# Xem logs
make docker-logs

# Dừng container
make docker-down

# Restart container
make docker-restart
```

##### Các lệnh Docker hữu ích khác

```bash
# Xóa tất cả containers, images và volumes
make docker-clean

# Xem tất cả các lệnh có sẵn
make help
```

#### Sử dụng Docker Compose trực tiếp (Tùy chọn)

Nếu bạn muốn sử dụng docker-compose trực tiếp thay vì Makefile:

##### Development Mode

```bash
# Build và chạy container development
docker-compose -f docker-compose.dev.yml up --build

# Chạy ở background (detached mode)
docker-compose -f docker-compose.dev.yml up --build -d

# Xem logs
docker-compose -f docker-compose.dev.yml logs -f

# Dừng container
docker-compose -f docker-compose.dev.yml down

# Vào trong container để debug
docker-compose -f docker-compose.dev.yml exec cms-bundle-dev bash
```

##### Production Mode

```bash
# Build và chạy container production
docker-compose -f docker-compose.yml up --build

# Chạy ở background
docker-compose -f docker-compose.yml up --build -d

# Xem logs
docker-compose -f docker-compose.yml logs -f

# Dừng container
docker-compose -f docker-compose.yml down
```

#### Lưu ý khi sử dụng Docker

- **Volume Mounting**:
  - Development: Source code (`./src`) được mount để hỗ trợ hot-reload
  - Bundle directory (`./bundle`) được mount để lưu trữ các file đã bundle
  - `node_modules` được mount riêng để tránh conflict giữa host và container

- **Network**:
  - Development: Sử dụng network `pancake_network` (external network)
  - Production: Sử dụng network `cms-network` (bridge network)

- **Environment Variables**:
  - Tạo file `.env` trong root directory
  - File `.env` sẽ được tự động load vào container

## 📁 Cấu trúc dự án

```
cms_bundle/
├── src/
│   ├── controllers/     # Xử lý request/response
│   ├── core/            # Các class xử lý logic cốt lõi (Error/Success Response)
│   ├── helpers/         # Các hàm tiện ích chung
│   ├── routers/         # Định nghĩa API routes
│   ├── services/        # Business logic (Bundling, Execution)
│   ├── utils/           # Tiện ích hệ thống (Sandbox, Run wrapper)
│   └── index.js         # Entry point
├── bundle/              # Thư mục chứa các file đã được đóng gói
├── Dockerfile           # Cấu hình build Docker Production
├── Dockerfile.dev       # Cấu hình build Docker Development
├── docker-compose.yml   # Docker Compose Production
├── docker-compose.dev.yml # Docker Compose Development
└── Makefile             # Makefile với các lệnh tiện ích
```

## 🔌 API Endpoints

| Method | Endpoint          | Mô tả                           | Payload Body (Example)                                                         |
| ------ | ----------------- | ------------------------------- | ------------------------------------------------------------------------------ |
| POST   | `/api/v1/bundle`  | Đóng gói source code JS         | `{ "content": "...", "site_id": "...", "file_id": "..." }`                     |
| POST   | `/api/v1/execute` | Thực thi function trong sandbox | `{ "functionName": "main", "params": {}, "site_id": "...", "file_id": "..." }` |
| POST   | `/api/v1/debug`   | Thực thi function với log debug | `{ "functionName": "main", "params": {}, "site_id": "...", "file_id": "..." }` |

## 🛠️ Công cụ phát triển (Dev Tools)

Dự án tích hợp sẵn các công cụ để đảm bảo chất lượng code và cung cấp Makefile để đơn giản hóa các tác vụ thường dùng.

### Makefile Commands

Dự án cung cấp Makefile với các lệnh tiện ích. Chạy `make help` để xem danh sách đầy đủ:

- **Development**: `make dev`, `make start`
- **Code Quality**: `make lint`, `make lint-fix`, `make format`, `make format-check`
- **Docker**: `make docker-dev`, `make docker-up`, `make docker-down`, `make docker-logs-dev`
- **Cleanup**: `make clean`, `make docker-clean`

### Code Quality Tools

- **Linting**: `make lint` hoặc `npm run lint` (Kiểm tra lỗi code với ESLint)
- **Formatting**: `make format` hoặc `npm run format` (Định dạng code với Prettier)
- **Git Hooks**: Sử dụng `husky` để tự động kiểm tra code trước khi commit.

## 🤝 Đóng góp

1. Fork dự án
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit thay đổi (`git commit -m 'Add some AmazingFeature'`)
4. Push lên branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request
