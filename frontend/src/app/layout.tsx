import React from 'react';
import './globals.css';

// Cấu hình thẻ meta SEO cho trang web
export const metadata = {
  title: 'BookLab247 | Hệ thống Đặt phòng Lab',
  description: 'Nền tảng quản lý phòng thực hành và mượn thiết bị nhanh chóng.',
};

// RootLayout bắt buộc phải là 'export default'
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        {/* Nơi nội dung của các trang (page.tsx) sẽ được hiển thị */}
        {children}
      </body>
    </html>
  );
}