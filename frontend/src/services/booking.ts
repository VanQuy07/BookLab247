import { getApiBaseUrl } from "./api-client";

export type BookingStatus =
  | "CHO_DUYET"
  | "DA_DUYET"
  | "BI_TU_CHOI"
  | "DA_HUY"
  | "DANG_MUON"
  | "DA_XONG";

export interface StatusHistoryEntry {
  status: string;
  changed_at?: string;
  reason?: string | null;
}

export interface BookingItem {
  id: string;
  room_id: string;
  room_name?: string;
  room_building?: string;
  room_floor?: string;
  customer_name: string;
  phone: string;
  date: string;
  start_time: string;
  duration_mins: number;
  buffer_mins: number;
  note?: string;
  equipments?: Array<{ id?: string; name: string; quantity: number; price?: number }>;
  status: BookingStatus | string;
  rejection_reason?: string | null;
  status_history?: StatusHistoryEntry[];
  created_at?: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("access_token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

export const normalizeBookingStatus = (status: string): BookingStatus => {
  switch (status) {
    case "pending":
      return "CHO_DUYET";
    case "confirmed":
      return "DA_DUYET";
    case "checked-in":
      return "DANG_MUON";
    case "cancelled":
      return "DA_HUY";
    case "rejected":
      return "BI_TU_CHOI";
    case "completed":
      return "DA_XONG";
    default:
      return (status as BookingStatus) || "CHO_DUYET";
  }
};

export const fetchMyBookings = async (params?: {
  status?: BookingStatus;
  group?: "request" | "borrow";
}): Promise<BookingItem[]> => {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.group) searchParams.set("group", params.group);

  const query = searchParams.toString();
  const response = await fetch(
    `${getApiBaseUrl()}/bookings${query ? `?${query}` : ""}`,
    { headers: getAuthHeaders() },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Không tải được lịch sử đặt phòng");
  }

  const data = await response.json();
  return Array.isArray(data) ? data : data.data || data.items || [];
};

export const cancelBooking = async (
  bookingId: string,
  cancelReason?: string,
): Promise<BookingItem> => {
  const response = await fetch(`${getApiBaseUrl()}/bookings/${bookingId}/cancel`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ cancel_reason: cancelReason || null }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Không thể hủy đơn lúc này.");
  }

  return response.json();
};
