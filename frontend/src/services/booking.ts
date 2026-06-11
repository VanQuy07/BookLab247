import { getApiBaseUrl } from "./api-client";

export interface BookingRoom {
  id?: string;
  _id?: string;
  name: string;
  building?: string;
  floor?: string;
}

export interface BookingEquipment {
  name: string;
  quantity: number;
}

export interface Booking {
  id: string;
  _id?: string;
  room_id: string;
  user_id?: string;
  customer_name: string;
  phone: string;
  date: string;
  start_time: string;
  duration_mins: number;
  buffer_mins: number;
  note?: string;
  status: string;
  rejection_reason?: string;
  cancel_reason?: string;
  created_at: string;
  updated_at?: string;
  room?: BookingRoom;
  equipments?: BookingEquipment[];
}

export const getMyBookings = async (userId: string): Promise<Booking[]> => {
  const token = localStorage.getItem("access_token");
  const headers = { Authorization: `Bearer ${token || ""}` };

  // Ưu tiên: gọi endpoint /me (chỉ trả đơn của user này)
  const meRes = await fetch(
    `${getApiBaseUrl()}/bookings/me?user_id=${encodeURIComponent(userId)}`,
    { headers },
  );

  if (meRes.ok) {
    const data = await meRes.json();
    return Array.isArray(data) ? data : [];
  }

  // Fallback: endpoint /me chưa có (server cũ) → lấy tất cả rồi lọc local
  if (meRes.status === 404) {
    const allRes = await fetch(`${getApiBaseUrl()}/bookings`, { headers });
    if (!allRes.ok) {
      const data = await allRes.json().catch(() => ({}));
      throw new Error(data.detail || "Không thể tải lịch sử đặt phòng");
    }
    const allData = await allRes.json();
    const allBookings: Booking[] = Array.isArray(allData) ? allData : [];
    return allBookings.filter(
      (b) =>
        b.user_id === userId ||
        b.customer_name === userId ||
        (b.customer_name || "").toLowerCase() === userId.toLowerCase(),
    );
  }

  const data = await meRes.json().catch(() => ({}));
  throw new Error(data.detail || "Không thể tải lịch sử đặt phòng");
};

export const cancelMyBooking = async (
  bookingId: string,
  cancelReason?: string,
): Promise<Booking> => {
  const token = localStorage.getItem("access_token");
  const body = cancelReason ? JSON.stringify({ cancel_reason: cancelReason }) : "{}";
  const response = await fetch(
    `${getApiBaseUrl()}/bookings/${bookingId}/cancel`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token || ""}`,
        "Content-Type": "application/json",
      },
      body,
    },
  );
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || "Không thể hủy đơn đặt phòng");
  }
  return response.json();
};
