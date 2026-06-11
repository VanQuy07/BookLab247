import { getApiBaseUrl } from "./api-client";

const getAuthUrl = () => `${getApiBaseUrl()}/auth`;

export const authService = {
  getAllUsers: async (): Promise<any[]> => {
    const response = await fetch(`${getAuthUrl()}/users`);
    if (!response.ok) throw new Error("Lỗi khi tải danh sách người dùng");
    return response.json();
  },

  // Nơi định nghĩa các hàm API tương lai (đổi quyền, khóa tài khoản)
  toggleUserStatus: async (userId: string, currentStatus: boolean) => {
    console.log(`Gọi API khóa/mở tài khoản ${userId}`);
  },
};
