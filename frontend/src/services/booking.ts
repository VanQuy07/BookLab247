import { getApiBaseUrl } from "./api-client";

export interface BookingRoom {
  id?: string;
  _id?: string;
  name: string;
  building?: string;
  floor?: string;
  type?: string;
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

  // Fetch rooms for populating room info
  let roomsMap: Record<string, BookingRoom> = {};
  try {
    const roomsRes = await fetch(`${getApiBaseUrl()}/labs`);
    if (roomsRes.ok) {
      const rooms = await roomsRes.json();
      if (Array.isArray(rooms)) {
        rooms.forEach((r: any) => {
          roomsMap[r.id || r._id] = {
            id: r.id || r._id,
            _id: r._id,
            name: r.name || r.title || "Phòng Lab",
            building: r.building || "",
            floor: r.floor || "",
            type: r.type || "",
          };
        });
      }
    }
  } catch (e) {
    console.warn("Không lấy được danh sách phòng:", e);
  }

  const populateRoom = (booking: Booking): Booking => {
    if (roomsMap[booking.room_id]) {
      return { ...booking, room: roomsMap[booking.room_id] };
    }
    return booking;
  };

  // Ưu tiên: gọi endpoint /me (chỉ trả đơn của user này)
  const meRes = await fetch(
    `${getApiBaseUrl()}/bookings/me?user_id=${encodeURIComponent(userId)}`,
    { headers },
  );

  if (meRes.ok) {
    const data = await meRes.json();
    const bookings: Booking[] = Array.isArray(data) ? data : [];
    return bookings.map(populateRoom);
  }

  // Fallback: endpoint /me chưa có (server cũ) → lấy tất cả rồi lọc local
  if (meRes.status === 404 || meRes.status === 405) {
    const allRes = await fetch(`${getApiBaseUrl()}/bookings`, { headers });
    if (!allRes.ok) {
      const data = await allRes.json().catch(() => ({}));
      throw new Error(data.detail || "Không thể tải lịch sử đặt phòng");
    }
    const allData = await allRes.json();
    const allBookings: Booking[] = Array.isArray(allData) ? allData : [];
    const uid = userId.trim().toLowerCase();
    return allBookings
      .filter((b) => {
        const bUid = (b.user_id || "").trim().toLowerCase();
        const bCname = (b.customer_name || "").trim().toLowerCase();
        return bUid === uid || bCname === uid || b.user_id === userId || b.customer_name === userId;
      })
      .map(populateRoom);
  }

  const data = await meRes.json().catch(() => ({}));
  throw new Error(data.detail || "Không thể tải lịch sử đặt phòng");
};

export const cancelMyBooking = async (
  bookingId: string,
  cancelReason?: string,
): Promise<Booking> => {
  const token = localStorage.getItem("access_token");
  const headers = {
    Authorization: `Bearer ${token || ""}`,
    "Content-Type": "application/json",
  };
  const body = cancelReason ? JSON.stringify({ cancel_reason: cancelReason }) : "{}";

  // Ưu tiên: endpoint /cancel (server mới)
  const res = await fetch(
    `${getApiBaseUrl()}/bookings/${bookingId}/cancel`,
    { method: "PATCH", headers, body },
  );

  // Fallback: server cũ chưa có /cancel → dùng /status thành "cancelled"
  if (res.status === 404 || res.status === 405) {
    const fallbackRes = await fetch(
      `${getApiBaseUrl()}/bookings/${bookingId}/status`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: "cancelled" }),
      },
    );
    if (!fallbackRes.ok) {
      const data = await fallbackRes.json().catch(() => ({}));
      throw new Error(data.detail || "Không thể hủy đơn đặt phòng");
    }
    return fallbackRes.json();
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Không thể hủy đơn đặt phòng");
  }
  return res.json();
};
