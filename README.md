Ở ĐÂY CÓ CẤU TRÚC THƯ MỤC, MỌI NGƯỜI LẤY XUỐNG VÀ LÀM VÀO ĐÚNG FILE ĐÚNG THƯ MỤC ĐỂ TIỆN CHO MỌI NGƯỜI CÙNG DÙNG  NHÉ

backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # File chạy chính (Khởi tạo FastAPI/Django app)
│   ├── config.py            # Đọc biến môi trường, cấu hình JWT, Database
│   │
│   ├── api/                 # Lớp Định tuyến (Routing / Endpoints)
│   │   ├── v1/
│   │   │   ├── auth.py      # Đăng nhập, đăng ký, cấp quyền
│   │   │   ├── users.py     # API quản lý user
│   │   │   ├── labs.py      # API đặt phòng, xem lịch, check phòng trống
│   │   │   ├── devices.py   # API mượn/trả, kiểm kê, báo hỏng thiết bị
│   │   │   └── router.py    # Gom tất cả các router lại
│   │
│   ├── core/                # Các cấu hình core, bảo mật hệ thống
│   │   ├── security.py      # Mã hóa mật khẩu, tạo/gỡ token JWT
│   │   ├── database.py      # Kết nối Database (SQLAlchemy / Tortoise ORM / Django ORM)
│   │   └── middlewares.py   # Xử lý CORS, Logging, Thống kê thời gian phản hồi
│   │
│   ├── models/              # Database Models (Định nghĩa bảng trong CSDL)
│   │   ├── user.py          # Bảng User (id, name, role, email...)
│   │   ├── lab.py           # Bảng Lab (id, name, status, capacity...)
│   │   ├── booking.py       # Bảng Lịch đặt (id, user_id, lab_id, start_time, end_time...)
│   │   └── device.py        # Bảng Thiết bị (id, name, status, lab_id...)
│   │
│   ├── schemas/             # Data Validation (Pydantic Models hoặc Serializers)
│   │   ├── user.py          # Định nghĩa dữ liệu đầu vào/đầu ra khi tạo/xem User
│   │   ├── lab.py
│   │   └── booking.py
│   │
│   ├── services/            # Lớp xử lý Business Logic (Tầng quan trọng nhất)
│   │   ├── auth_service.py
│   │   ├── booking_service.py # Xử lý logic check trùng lịch, giữ phòng, cọc tiền
│   │   ├── device_service.py  # Xử lý logic kiểm kê, cập nhật trạng thái khi bảo trì
│   │   └── report_service.py  # Xử lý tính toán doanh thu, thiết bị dùng nhiều cho Admin
│   │
│   └── utils/               # Các hàm bổ trợ (Gửi email nhắc lịch, export excel báo cáo)
│
├── migrations/              # Thư mục lưu lịch sử thay đổi database (Alembic / Django)
├── requirements.txt         # Danh sách các thư viện Python cần cài đặt
├── .env                     # Biến môi trường ở local (DB_URL, JWT_SECRET)
└── Dockerfile               # Dockerize backend để dễ deploy lên VPS/AWS/Render

frontend/
├── public/                  # Static assets (images, icons, favicons)
├── src/
│   ├── app/                 # App Router (Routing chính)
│   │   ├── layout.tsx       # Root layout toàn hệ thống
│   │   ├── page.tsx         # Landing page giới thiệu BookLab247
│   │   │
│   │   ├── (auth)/          # Group route cho Đăng nhập/Đăng ký (không hiện layout chính)
│   │   │   ├── login/
│   │   │   └── register/
│   │   │
│   │   ├── (dashboard)/     # Group route dùng chung Dashboard Layout (Sidebar, Header)
│   │   │   ├── layout.tsx   # Layout có Sidebar điều hướng theo Role
│   │   │   ├── profile/     # Hồ sơ cá nhân, lịch sử mượn (Dùng chung)
│   │   │   │
│   │   │   ├── user/        # Các tính năng riêng của User
│   │   │   │   ├── booking/ # Đặt lịch phòng / thiết bị
│   │   │   │   └── labs/    # Xem danh sách phòng trống
│   │   │   │
│   │   │   ├── manager/     # Giao diện dành cho Quản lý
│   │   │   │   ├── approval/# Duyệt yêu cầu mượn
│   │   │   │   ├── walk-in/ # Đặt phòng nhanh cho khách vãng lai
│   │   │   │   └── report/  # Báo cáo sự cố phòng lab
│   │   │   │
│   │   │   └── admin/       # Giao diện của Admin tối cao
│   │   │       ├── users/   # Quản lý người dùng, phân quyền
│   │   │       ├── devices/ # Quản lý, kiểm kê thiết bị
│   │   │       └── revenue/ # Thống kê doanh thu, tần suất sử dụng
│   │   │
│   │   └── api/             # Next.js Route Handlers (nếu cần làm BFF hoặc proxy)
│   │
│   ├── components/          # Components dùng chung toàn hệ thống
│   │   ├── ui/              # Atom components (Button, Input, Modal, Table...)
│   │   ├── common/          # Sidebar, Navbar, Footer, LoadingSpinner
│   │   └── forms/           # Các form phức tạp (Form đặt phòng, Form thêm thiết bị)
│   │
│   ├── hooks/               # Custom React Hooks (useAuth, useSocket, useFetch)
│   ├── services/            # Lớp gọi API xuống Python Backend (Axios/Fetch setup)
│   │   ├── api-client.ts    # Cấu hình Axios instance (gắn Token, handling error)
│   │   ├── auth.ts
│   │   ├── lab.ts
│   │   └── device.ts
│   │
│   ├── store/               # Quản lý State toàn cục (Zustand hoặc Redux Toolkit)
│   ├── types/               # Strict TypeScript definitions (Tuyệt đối không dùng any)
│   │   ├── index.ts
│   │   ├── user.ts          # Type cho User, Role
│   │   ├── lab.ts           # Type cho Phòng Lab, Lịch đặt
│   │   └── device.ts        # Type cho Thiết bị, Trạng thái bảo trì
│   │
│   └── utils/               # Helper functions (formatDate, formatCurrency, validators)
│
├── .env.local               # Biến môi trường (chứa URL của Python Backend)
├── next.config.js
├── package.json
└── tsconfig.json
