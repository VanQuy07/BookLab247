"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  CalendarDays,
  LogOut,
  X,
  Clock,
  MapPin,
  ShieldCheck,
  Search,
  FileText,
  Users,
  Plus,
  ChevronLeft,
  ChevronRight,
  Package,
  AlertTriangle,
  TrendingUp,
  QrCode,
  CheckCircle2,
  Wrench,
  DoorOpen,
  Banknote,
} from "lucide-react";

import { labService } from "../../services/lab";

// ================= INTERFACES (Merged Strict Types) =================
interface ManagerRoom {
  id?: string;
  _id?: string;
  title?: string;
  name?: string;
  building?: string;
  floor?: string;
  capacity?: number | string;
  imageUrl?: string;
  maintenanceMode?: boolean;
  isBooked?: boolean;
  price?: number;
  pricePerHour?: number;
}

interface EquipmentItem {
  id?: string;
  _id?: string;
  name: string;
  category?: string;
  managementType?: string;
  totalQuantity: number;
  inUseQuantity: number;
  status?: string;
  roomId?: string;
  imageUrl?: string;
  price?: number;
}

interface BorrowedEquipment {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface BookingItem {
  id: string;
  roomId: string;
  customerName: string;
  phone: string;
  status: string;
  startTime: string;
  durationMins: number;
  bufferMins: number;
  note: string;
  equipments?: BorrowedEquipment[];
  date?: string;
  is_urgent?: boolean;
  is_conflict?: boolean;
  conflict_with?: string;
  cancel_reason?: string;
}

type MenuTab =
  | "dashboard"
  | "labs"
  | "equipments"
  | "timeline"
  | "reports"
  | "lookup";
type TimeFilter = "today" | "yesterday" | "7days" | "month" | "custom";

const COLORS = ["#3b82f6", "#ef4444", "#f59e0b"];

// ================= DỮ LIỆU MẪU ĐẶT PHÒNG =================
const INITIAL_BOOKINGS: BookingItem[] = [
  {
    id: "b1",
    roomId: "r1",
    customerName: "Nguyễn Văn Quý",
    phone: "0901234567",
    status: "checked-in",
    startTime: "08:00",
    durationMins: 120,
    bufferMins: 15,
    note: "Khách ca sáng",
    equipments: [{ id: "eq1", name: "máy chiếu", quantity: 2, price: 50000 }],
  },
  {
    id: "b2",
    roomId: "r2",
    customerName: "Lê Thị B",
    phone: "0987654321",
    status: "confirmed",
    startTime: "13:00",
    durationMins: 180,
    bufferMins: 15,
    note: "Học nhóm hội thảo",
    equipments: [],
  },
];

const SectionHeader = ({ title, description, action }: { title: string, description: string, action?: React.ReactNode }) => (
  <div className="flex justify-between items-end mb-6">
    <div>
      <h2 className="text-2xl font-black text-gray-900 tracking-tight">{title}</h2>
      <p className="text-gray-500 font-medium text-sm mt-1">{description}</p>
    </div>
    {action && <div>{action}</div>}
  </div>
);

export default function ManagerDashboardPage() {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState<MenuTab>("timeline");
  const [loading, setLoading] = useState<boolean>(true);

  const [timeFilter, setTimeFilter] = useState<TimeFilter>("today");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [customDate, setCustomDate] = useState<string>("");
  const [currentTime, setCurrentTime] = useState(new Date());

  const [rooms, setRooms] = useState<ManagerRoom[]>([]);
  //const [bookings, setBookings] = useState<BookingItem[]>(INITIAL_BOOKINGS);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [equipments, setEquipments] = useState<EquipmentItem[]>([]);
  const [buildingFilter, setBuildingFilter] = useState<string>("all");
  const [roomSearchQuery, setRoomSearchQuery] = useState("");
  // ================= STATES CHO THÔNG BÁO GIAO DIỆN (TOAST & MODAL) =================
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({
    show: false,
    message: "",
    type: "success",
  });
  const [confirmCancel, setConfirmCancel] = useState<{
    isOpen: boolean;
    bookingId: string;
  }>({
    isOpen: false,
    bookingId: "",
  });

  // Hàm gọi thông báo nổi (tự tắt sau 3 giây)
  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  // ================= STATES QUICK BOOK & VIEW BOOKING =================
  const [showQuickBook, setShowQuickBook] = useState(false);
  const [quickBookData, setQuickBookData] = useState({
    roomId: "",
    customerName: "",
    phone: "",
    capacity: 1,
    startDate: selectedDate,
    startTime: "08:00",
    endDate: selectedDate,
    endTime: "10:00",
    note: "",
    equipments: {} as Record<
      string,
      { name: string; quantity: number; max: number; price: number }
    >,
  });
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(
    null,
  );

  // ================= STATES MAINTENANCE REPORT =================
  const [reportModal, setReportModal] = useState<{
    isOpen: boolean;
    type: "room" | "equipment";
    itemId: string;
    itemName: string;
    reason: string;
  }>({ isOpen: false, type: "room", itemId: "", itemName: "", reason: "" });

  //const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/v1`;
  //const API_URL = //"https://booklab247.onrender.com/api/v1";
  const API_URL = "http://127.0.0.1:8000/api/v1";
  


  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) router.push("/login");
    else loadData();
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    const token = localStorage.getItem("access_token");
    const API_URL = "https://booklab247.onrender.com/api/v1"; // Giữ nguyên link Cloud chạy đúng của bạn


    // ==========================================
    // 1. LUỒNG TẢI LỊCH ĐẶT PHÒNG (BOOKINGS) -> ĐÃ BỔ SUNG
    // ==========================================
    try {
      const bkRes = await fetch(`${API_URL}/bookings`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (bkRes.ok) {
        const bkData = await bkRes.json();
        const rawBookings = Array.isArray(bkData) ? bkData : bkData.data || [];

        const formattedBookings = rawBookings.map((b: any) => ({
          id: b.id || b._id,
          roomId: b.room_id || b.roomId,
          customerName:
            b.customer_name || b.customerName || "Khách chưa rõ tên",
          phone: b.phone || "",
          status: b.status || "pending",
          date: b.date || "",
          startTime: b.start_time || b.startTime || "00:00",
          durationMins: Number(b.duration_mins || b.durationMins || 0),
          bufferMins: Number(b.buffer_mins || b.bufferMins || 15),
          note: b.note || "",
          equipments: b.equipments || [],
          is_urgent: b.is_urgent || false,
          is_conflict: b.is_conflict || false,
          conflict_with: b.conflict_with || "",
          cancel_reason: b.cancel_reason || "",
        }));
        setBookings(formattedBookings);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error("Lỗi khi tải Đơn đặt phòng:", error);
      setBookings([]);
    }

    // ==========================================
    // 2. LUỒNG TẢI PHÒNG LAB (Giữ nguyên của bạn)
    // ==========================================
    try {
      const roomsRes = await fetch(`${API_URL}/labs`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const roomsData = roomsRes.ok ? await roomsRes.json() : [];

      if (roomsData && roomsData.length > 0) {
        setRooms(
          roomsData.map((room: any) => ({
            id: room.id || room._id,
            title: room.name || room.title,
            building: room.building || "Chưa gán",
            floor: room.floor || "Chưa gán",
            capacity: room.capacity || 0,
            imageUrl: room.imageUrl,
            price: room.pricePerHour || room.price || 0,
            maintenanceMode: room.maintenanceMode || false,
            isBooked: room.isBooked || false,
          })),
        );
      } else {
        setRooms([]);
      }
    } catch (error) {
      console.error("Lỗi khi tải Phòng Lab:", error);
      setRooms([]);
    }

    // ==========================================
    // 3. LUỒNG TẢI THIẾT BỊ (Giữ nguyên của bạn)
    // ==========================================
    try {
      const eqRes = await fetch(`${API_URL}/equipments`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const equipmentsData = eqRes.ok ? await eqRes.json() : [];

      if (equipmentsData && equipmentsData.length > 0) {
        setEquipments(equipmentsData);
      } else {
        setEquipments([]);
      }
    } catch (error) {
      console.error("Lỗi khi tải Thiết bị:", error);
      setEquipments([]);
    }

    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    router.push("/login");
  };

  const timeToMins = (timeStr: string) => {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };

  const minsToTime = (mins: number) => {
    const h = Math.floor(mins / 60) % 24;
    const m = Math.floor(mins % 60);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  const toggleEquipment = (
    eqId: string,
    eqName: string,
    available: number,
    price: number,
  ) => {
    const currentEqs = { ...quickBookData.equipments };
    if (currentEqs[eqId]) delete currentEqs[eqId];
    else
      currentEqs[eqId] = {
        name: eqName,
        quantity: 1,
        max: available,
        price: price,
      };
    setQuickBookData({ ...quickBookData, equipments: currentEqs });
  };

  const calculateTotalCost = () => {
const startObj = new Date(
      `${quickBookData.startDate}T${quickBookData.startTime}`
    );
    const endObj = new Date(
      `${quickBookData.endDate}T${quickBookData.endTime}`
    );
    const diffMins = Math.max(
      0,
      (endObj.getTime() - startObj.getTime()) / 60000
    );

    const selectedRoom = rooms.find(
      (r) => (r.id || r._id) === quickBookData.roomId
    );
    // Giữ lại logic ưu tiên lấy pricePerHour của bạn
    const roomPricePerHour = Number(
      selectedRoom?.pricePerHour || selectedRoom?.price || 100000
    );
    const roomTotal = (diffMins / 60) * roomPricePerHour;
    const eqTotal = Object.values(quickBookData.equipments).reduce(
      (sum, eq) => sum + eq.price * eq.quantity,
      0,
    );

    return roomTotal + eqTotal;
  };


  const updateEqQuantity = (eqId: string, delta: number) => {
    const currentEqs = { ...quickBookData.equipments };
    if (currentEqs[eqId]) {
      const nextQty = currentEqs[eqId].quantity + delta;
      if (nextQty >= 1 && nextQty <= currentEqs[eqId].max) {
        currentEqs[eqId].quantity = nextQty;
        setQuickBookData({ ...quickBookData, equipments: currentEqs });
      }
    }
  };

  const handleQuickBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const startDateTime = new Date(
      `${quickBookData.startDate}T${quickBookData.startTime}`,
    );
    const endDateTime = new Date(
      `${quickBookData.endDate}T${quickBookData.endTime}`,
    );

    const durationMins =
      (endDateTime.getTime() - startDateTime.getTime()) / 60000;

    if (durationMins <= 30)
      return alert(
        "⛔ LỖI:\nThời gian đặt phòng tối thiểu phải từ 30 phút trở lên!",
      );

    const now = new Date();
    if (startDateTime < now) {
      return alert("⛔ LỖI THỜI GIAN:\nKhông thể đặt lịch ở quá khứ.");
    }

    const targetId = quickBookData.roomId;
    if (!targetId) return alert("Vui lòng chọn phòng!");

    const newStartMs = startDateTime.getTime();
    const newEndMsWithBuffer = endDateTime.getTime() + 15 * 60000;

    const roomBookings = bookings.filter((b) => b.roomId === targetId);
    for (const exist of roomBookings) {
      const existDate = exist.date || quickBookData.startDate;
      const existStartMs = new Date(
        `${existDate}T${exist.startTime}`,
      ).getTime();
      const existEndMsWithBuffer =
        existStartMs + (exist.durationMins + exist.bufferMins) * 60000;

      if (
        newStartMs < existEndMsWithBuffer &&
        newEndMsWithBuffer > existStartMs
      ) {
        return alert(
          `⛔ LỖI TRÙNG LỊCH!\nPhòng đã có khách [${exist.customerName}] đặt vào khoảng thời gian này.`,
        );
      }
    }

    const borrowedEquipments: BorrowedEquipment[] = Object.entries(
      quickBookData.equipments,
    ).map(([id, data]) => ({
      id,
      name: data.name,
      quantity: data.quantity,
      price: data.price,
    }));

    const payload = {
      room_id: targetId,
      customer_name: quickBookData.customerName,
      phone: quickBookData.phone,
      date: quickBookData.startDate,
      start_time: quickBookData.startTime,
      duration_mins: durationMins,
      buffer_mins: 15,
      note: quickBookData.note,
      equipments: borrowedEquipments,
    };

    try {
      const submitBtn = document.getElementById(
        "btn-submit-quickbook",
      ) as HTMLButtonElement;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = "Đang lưu...";
      }

      const response = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Lỗi lưu Database");

      const responseData = await response.json();

      const newBooking: BookingItem = {
        id: responseData.data?.id || `b${Date.now()}`,
        roomId: targetId,
        customerName: quickBookData.customerName,
        phone: quickBookData.phone,
        status: "checked-in",
        date: quickBookData.startDate,
        startTime: quickBookData.startTime,
        durationMins: durationMins,
        bufferMins: 15,
        note: quickBookData.note,
        equipments: borrowedEquipments,
      };

      const updatedEquipments = equipments.map((eq) => {
        const eqId = eq.id || eq._id || "";
        if (quickBookData.equipments[eqId]) {
          return {
            ...eq,
            inUseQuantity:
              (eq.inUseQuantity || 0) + quickBookData.equipments[eqId].quantity,
          };
        }
        return eq;
      });

      setEquipments(updatedEquipments);
      setBookings([...bookings, newBooking]);
      setShowQuickBook(false);
      setQuickBookData({
        ...quickBookData,
        customerName: "",
        phone: "",
        equipments: {},
      });
      alert("✅ Đã lưu ca đặt phòng thành công!");
    } catch (err: any) {
      alert(`⛔ LỖI SERVER:\n${err.message}`);
    } finally {
      const submitBtn = document.getElementById(
        "btn-submit-quickbook",
      ) as HTMLButtonElement;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = "Xác nhận Check-in & Thanh toán";
      }
    }
  };

  // ================= XỬ LÝ DUYỆT / TỪ CHỐI ĐƠN =================
  // ================= XỬ LÝ DUYỆT / TỪ CHỐI ĐƠN =================
  const handleUpdateStatus = (bookingId: string, newStatus: string) => {
    // Nếu bấm từ chối, mở bảng Xác nhận đẹp thay vì dùng window.confirm
    if (newStatus === "cancelled") {
      setConfirmCancel({ isOpen: true, bookingId });
      return;
    }
    // Nếu duyệt, gọi thẳng hàm xử lý
    executeUpdateStatus(bookingId, newStatus);
  };

  const executeUpdateStatus = async (bookingId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("access_token");
      //const API_URL = "https://booklab247.onrender.com/api/v1";
      const API_URL = "http://localhost:8000/api/v1";

      const response = await fetch(`${API_URL}/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Lỗi HTTP ${response.status}`);
      }

      // Cập nhật lại UI ngay lập tức
      setBookings((prevBookings) =>
        prevBookings.map((b) =>
          b.id === bookingId ? { ...b, status: newStatus } : b,
        ),
      );

      // Hiển thị thông báo nổi xịn sò
      showToast(
        newStatus === "confirmed"
          ? "Đã duyệt đơn thành công!"
          : "Đã từ chối đơn hàng.",
        "success",
      );
    } catch (error: any) {
      showToast(`Lỗi chi tiết: ${error.message}`, "error");
    }
  };

  // ================= XỬ LÝ BÁO CÁO BẢO TRÌ =================
  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportModal.reason.trim()) return alert("Vui lòng nhập lý do!");

    if (reportModal.type === "room") {
      setRooms(
        rooms.map((r) =>
          r.id === reportModal.itemId || r._id === reportModal.itemId
            ? { ...r, maintenanceMode: true }
            : r,
        ),
      );
    } else {
      setEquipments(
        equipments.map((eq) =>
          eq.id === reportModal.itemId || eq._id === reportModal.itemId
            ? { ...eq, status: "maintenance" }
            : eq,
        ),
      );
    }

    alert(`✅ Đã gửi báo cáo bảo trì cho: ${reportModal.itemName}`);
    setReportModal({ ...reportModal, isOpen: false, reason: "" });
  };

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  // ================= GIAO DIỆN LABS & EQUIPMENTS =================
  const renderLabsTable = () => (
    <>
    <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Quản lý Phòng Lab</h2>
          <p className="text-gray-500 font-medium text-sm mt-1">Kiểm soát trạng thái phòng Lab của hệ thống.</p>
        </div>
        <button className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-md">+ Thêm Phòng</button>
      </div>
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm">
              <th className="p-4 font-bold text-gray-600">Tên Phòng</th>
              <th className="p-4 font-bold text-gray-600">
                Vị trí(Tòa Nhà - Tầng)
              </th>
              <th className="p-4 font-bold text-gray-600">Sức chứa</th>
              <th className="p-4 font-bold text-gray-600">Trạng thái</th>
              <th className="p-4 font-bold text-gray-600 text-center">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rooms.map((room) => (
              <tr
                key={room.id || room._id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="p-4 font-bold text-gray-900 flex items-center gap-3">
                  {room.imageUrl ? (
                    <img
                      src={room.imageUrl}
                      alt={room.name || room.title}
                      className="w-10 h-10 rounded-lg object-cover border border-gray-200 shadow-sm"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                      <DoorOpen className="w-5 h-5" />
                    </div>
                  )}
                  {room.name || room.title}
                </td>
                <td className="p-4 text-gray-600">
                  {room.building || "Chưa gán"} - {room.floor || "Chưa gán"}
                </td>
                <td className="p-4 text-gray-600">
                  {room.capacity || 0} người
                </td>
                <td className="p-4">
                  {room.maintenanceMode ? (
                    <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-100">
                      <Wrench className="w-3.5 h-3.5" /> Bảo trì
                    </span>
                  ) : room.isBooked ? (
                    <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-100">
                      <Clock className="w-3.5 h-3.5" /> Đã đặt
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Sẵn sàng
                    </span>
                  )}
                </td>
                <td className="p-4 text-center">
                  {/* YÊU CẦU 4: Bật/Tắt bảo trì cho Phòng */}
                  {room.maintenanceMode ? (
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            `Xác nhận hoàn tất bảo trì phòng ${room.name || room.title}?`,
                          )
                        ) {
                          const currentRoomId = room.id || room._id;
                          setRooms(
                            rooms.map((r) =>
                              (r.id || r._id) === currentRoomId
                                ? { ...r, maintenanceMode: false }
                                : r,
                            ),
                          );
                        }
                      }}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Hoàn tất bảo trì"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        setReportModal({
                          isOpen: true,
                          type: "room",
                          itemId: room.id || room._id || "",
                          itemName: room.title || room.name || "",
                          reason: "",
                        })
                      }
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Báo cáo bảo trì/sửa chữa"
                    >
                      <Wrench className="w-5 h-5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </>
  );

  const renderEquipmentsTable = () => (
    <>
    
    <div className="flex justify-between items-end mb-6">
      <div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Quản lý Thiết bị</h2>
        <p className="text-gray-500 font-medium text-sm mt-1">Kiểm soát trạng thái Thiết bị của hệ thống.</p>
      </div>
      <button className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-md">+ Thêm Phòng</button>
    </div>
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm">
              <th className="p-4 font-bold text-gray-600">Tên Thiết bị</th>
              <th className="p-4 font-bold text-gray-600">Danh mục</th>
              <th className="p-4 font-bold text-gray-600">Số lượng (Kho)</th>
              <th className="p-4 font-bold text-gray-600">Trạng thái</th>
              <th className="p-4 font-bold text-gray-600">Vị trí phòng</th>
              <th className="p-4 font-bold text-gray-600 text-center">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {equipments.map((eq) => {
              const matchedRoom = rooms.find(
                (r) => (r.id || r._id) === eq.roomId,
              );
              const roomName = matchedRoom
                ? matchedRoom.name || matchedRoom.title
                : "Trong kho";
              const availableQty =
                (eq.totalQuantity || 0) - (eq.inUseQuantity || 0);

              return (
                <tr
                  key={eq.id || eq._id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="p-4 font-bold text-gray-900 flex items-center gap-3">
                    {eq.imageUrl ? (
                      <img
                        src={eq.imageUrl}
                        alt={eq.name}
                        className="w-10 h-10 rounded-lg object-cover border border-gray-200 shadow-sm"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <Package className="w-5 h-5" />
                      </div>
                    )}
                    {eq.name}
                  </td>
                  <td className="p-4">
                    <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-xs font-bold">
                      {eq.category || "Vật tư"}
                    </span>
                  </td>

                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">
                      Còn: {availableQty}/{eq.totalQuantity}
                    </span>
                  </td>

                  <td className="p-4">
                    {eq.status === "available" ? (
                      <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Sẵn sàng
                      </span>
                    ) : eq.status === "maintenance" ? (
                      <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-100">
                        <Wrench className="w-3.5 h-3.5" /> Bảo trì
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold border border-gray-200">
                        Thanh lý
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-gray-600 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-gray-400" /> {roomName}
                  </td>
                  <td className="p-4 text-center">
                    {/* YÊU CẦU 4: Bật/Tắt sửa chữa cho Thiết bị */}
                    {eq.status === "maintenance" ? (
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              `Xác nhận hoàn tất sửa chữa thiết bị ${eq.name}?`,
                            )
                          ) {
                            const currentEqId = eq.id || eq._id;
                            setEquipments(
                              equipments.map((e) =>
                                (e.id || e._id) === currentEqId
                                  ? { ...e, status: "available" }
                                  : e,
                              ),
                            );
                          }
                        }}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Hoàn tất sửa chữa"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          setReportModal({
                            isOpen: true,
                            type: "equipment",
                            itemId: eq.id || eq._id || "",
                            itemName: eq.name,
                            reason: "",
                          })
                        }
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Báo cáo bảo trì/sửa chữa"
                      >
                        <Wrench className="w-5 h-5" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
    </>
  );

  const renderDashboard = () => {
    // 1. TÍNH TOÁN CÁC CHỈ SỐ THỐNG KÊ
    const usedRoomsCount = rooms.filter((l) => l.isBooked).length;
    const maintenanceRoomsCount = rooms.filter((l) => l.maintenanceMode).length;
    const maintenanceEqsCount = equipments.filter(
      (e) => e.status === "maintenance",
    ).length;
    const totalMaintenance = maintenanceRoomsCount + maintenanceEqsCount;
    const itemsOut = equipments.reduce(
      (sum, eq) => sum + (eq.inUseQuantity || 0),
      0,
    );

    // 2. HÀM TÌM TÊN PHÒNG CHO ĐƠN ĐẶT
    const getRoomName = (bookingRoomId: string) => {
      if (!bookingRoomId) return "Phòng chưa xác định";
      const cleanBookingId = String(bookingRoomId).trim();
      const foundRoom = rooms.find(
        (r) => String(r.id || r._id).trim() === cleanBookingId,
      );
      return foundRoom
        ? foundRoom.title || foundRoom.name
        : "Phòng chưa xác định";
    };

    // 3. LỌC ĐƠN HÀNG CHỜ DUYỆT VÀ CA HÔM NAY
    const pendingBookings = bookings.filter((b) => b.status === "pending");
    const pendingCount = pendingBookings.length;

    const todayStr = new Date().toISOString().split("T")[0];
    const upcomingBookings = bookings
      .filter(
        (b) =>
          (b.date === todayStr || !b.date) &&
          (b.status === "confirmed" || b.status === "checked-in"),
      )
      .sort((a, b) => timeToMins(a.startTime) - timeToMins(b.startTime));

    return (
      <div className="space-y-6 pb-10">
        {/* THANH TOP BAR */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h2 className="text-2xl font-black text-gray-900">
              Giám sát Trực tiếp
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Cập nhật trạng thái phòng và thiết bị realtime.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-black transition-colors">
              <QrCode className="w-4 h-4" /> Quét mã QR
            </button>
            <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 w-full sm:w-auto items-center overflow-x-auto scrollbar-hide">
              {[
                { id: "today", label: "Hôm nay" },
                { id: "yesterday", label: "Hôm qua" },
                { id: "7days", label: "7 Ngày" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    setTimeFilter(f.id as TimeFilter);
                    setCustomDate("");
                  }}
                  className={`px-4 py-1.5 text-sm font-bold rounded-lg whitespace-nowrap transition-all ${timeFilter === f.id && !customDate ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                  {f.label}
                </button>
              ))}
              <div className="h-4 w-px bg-gray-300 mx-2"></div>
              <input
                type="date"
                value={customDate}
                onChange={(e) => {
                  setCustomDate(e.target.value);
                  setTimeFilter("custom");
                }}
                className={`px-3 py-1 text-sm font-bold rounded-lg bg-transparent outline-none cursor-pointer ${customDate ? "text-emerald-600 bg-white shadow-sm" : "text-gray-500"}`}
              />
            </div>
          </div>
        </div>

        {/* THỐNG KÊ TỔNG QUAN */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in duration-300">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-500 mb-1">ĐANG SỬ DỤNG</p>
            <h3 className="text-2xl font-black text-emerald-600">
              {usedRoomsCount}/{rooms.length}{" "}
              <span className="text-sm font-medium text-gray-400">Phòng</span>
            </h3>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-500 mb-1">CHỜ DUYỆT</p>
            <h3 className="text-2xl font-black text-amber-500">
              {pendingCount}{" "}
              <span className="text-sm font-medium text-gray-400">Đơn</span>
            </h3>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-500 mb-1">
              THIẾT BỊ RỜI KHO
            </p>
            <h3 className="text-2xl font-black text-blue-600">
              {itemsOut}{" "}
              <span className="text-sm font-medium text-gray-400">Món</span>
            </h3>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-500 mb-1">
              BẢO TRÌ ĐỘT XUẤT
            </p>
            <h3 className="text-2xl font-black text-red-500">
              {totalMaintenance}{" "}
              <span className="text-sm font-medium text-gray-400">Sự cố</span>
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
          {/* CỘT 1: LỊCH CA HÔM NAY */}
          {/* <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[350px]">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-500" /> Các ca hoạt động
                hôm nay
              </h3>
            </div>
            <div className="p-4 overflow-y-auto space-y-3">
              {upcomingBookings.length === 0 ? (
                <div className="text-center text-sm text-gray-500 py-10">
                  Không có lịch học nào hôm nay.
                </div>
              ) : (
                upcomingBookings.map((booking) => {
                  const roomName = getRoomName(booking.roomId);
                  return (
                    <div
                      key={booking.id}
                      className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => setSelectedBooking(booking)}
                    >
                      <div>
                        <p className="font-bold text-gray-900 text-sm">
                          {booking.customerName}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Phòng:{" "}
                          <span className="font-bold text-gray-700">
                            {roomName}
                          </span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg text-sm shadow-sm">
                          {booking.startTime}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* CỘT 2: ĐƠN CHỜ DUYỆT KHẨN */}
          {/* <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[350px]">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" /> Đơn chờ
                duyệt khẩn
              </h3>
            </div>
            <div className="p-4 overflow-y-auto space-y-3">
              {pendingBookings.length === 0 ? (
                <div className="text-center text-sm text-gray-500 py-10">
                  Không có đơn chờ duyệt.
                </div>
              ) : (
                pendingBookings.map((booking) => {
                  const roomName = getRoomName(booking.roomId);
                  return (
                    <div
                      key={booking.id}
                      className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex flex-col gap-3"
                    >
                      <div
                        className="flex justify-between items-start cursor-pointer hover:opacity-80"
                        onClick={() => setSelectedBooking(booking)}
                      >
                        <div>
                          <p className="font-bold text-gray-900 text-sm">
                            {booking.customerName}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {booking.date} |{" "}
                            <span className="font-bold text-amber-600">
                              {booking.startTime}
                            </span>{" "}
                            ({booking.durationMins}p)
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Phòng:{" "}
                            <span className="font-bold text-gray-700">
                              {roomName}
                            </span>
                          </p>
                        </div>
                        <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider">
                          Chờ duyệt
                        </span>
                      </div>
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() =>
                            handleUpdateStatus(booking.id, "confirmed")
                          }
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-2 rounded-lg transition-colors shadow-sm"
                        >
                          Duyệt đơn
                        </button>
                        <button
                          onClick={() =>
                            handleUpdateStatus(booking.id, "cancelled")
                          }
                          className="flex-1 bg-white hover:bg-red-50 text-red-500 border border-red-200 text-xs font-bold py-2 rounded-lg transition-colors shadow-sm"
                        >
                          Từ chối
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div> */}


          {/* CỘT 1: LỊCH CA HÔM NAY (Hiển thị Timeline kèm trạng thái hủy) */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[350px]">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-500" /> Các ca hoạt động hôm nay
              </h3>
            </div>
            <div className="p-4 overflow-y-auto space-y-3">
              {bookings.filter(b => b.date === todayStr && ['confirmed', 'checked-in', 'cancelled'].includes(b.status)).length === 0 ? (
                <div className="text-center text-sm text-gray-500 py-10">Không có hoạt động nào hôm nay.</div>
              ) : (
                bookings
                  .filter(b => b.date === todayStr && ['confirmed', 'checked-in', 'cancelled'].includes(b.status))
                  .sort((a, b) => timeToMins(a.startTime) - timeToMins(b.startTime))
                  .map((booking) => {
                    const roomName = getRoomName(booking.roomId);
                    const isCancelled = booking.status === 'cancelled';
                    return (
                      <div
                        key={booking.id}
                        className={`border p-3 rounded-xl flex justify-between items-center cursor-pointer transition-colors ${
                          isCancelled ? "bg-gray-50 border-dashed border-gray-200 opacity-60" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                        }`}
                        onClick={() => setSelectedBooking(booking)}
                      >
                        <div className={isCancelled ? "line-through text-gray-400" : ""}>
                          <p className={`font-bold text-sm ${isCancelled ? "text-gray-500" : "text-gray-900"}`}>{booking.customerName}</p>
                          <p className="text-xs mt-0.5">Phòng: <span className="font-bold">{roomName}</span></p>
                          {isCancelled && <p className="text-[10px] text-red-500 font-bold mt-1">❌ Đã hủy</p>}
                        </div>
                        <div className="text-right">
                          <span className={`font-black px-2 py-1 rounded-lg text-sm shadow-sm ${
                            isCancelled ? "bg-gray-200 text-gray-500" : "bg-emerald-50 text-emerald-600"
                          }`}>
                            {booking.startTime}
                          </span>
                        </div>
                      </div>
                    );
                })
              )}
            </div>
          </div>

          {/* CỘT 2: ĐƠN CHỜ DUYỆT KHẨN (Hiển thị Tag Khẩn cấp & Cảnh báo trùng lịch) */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[350px]">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" /> Đơn chờ duyệt
              </h3>
            </div>
            <div className="p-4 overflow-y-auto space-y-3">
              {pendingBookings.length === 0 ? (
                <div className="text-center text-sm text-gray-500 py-10">Không có đơn chờ duyệt.</div>
              ) : (
                pendingBookings.map((booking) => {
                  const roomName = getRoomName(booking.roomId);
                  
                  // 1. TÍNH TOÁN GIỜ KẾT THÚC CHÍNH XÁC
                  const endTimeStr = minsToTime(timeToMins(booking.startTime) + booking.durationMins);

                  return (
                    <div key={booking.id} className={`p-5 rounded-2xl flex flex-col gap-4 relative overflow-hidden transition-all ${
                      booking.is_conflict 
                        ? "bg-red-50 border border-red-200" 
                        : "bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300"
                    }`}>
                      {booking.is_urgent && (
                        <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl animate-pulse shadow-sm">
                          DÙNG HÔM NAY
                        </div>
                      )}
                      
                      <div className="flex justify-between items-start">
                        <div className="w-full">
                          {/* 2. HIỂN THỊ TÊN NGƯỜI ĐẶT (To, rõ và đậm hơn) */}
                          <p className="font-black text-slate-900 text-lg">
                            {booking.customerName || "Khách chưa có tên"}
                          </p>
                          
                          {/* 3. HIỂN THỊ NGÀY VÀ KHOẢNG THỜI GIAN (Tăng size, thêm Icon) */}
                          <p className="text-sm font-medium text-slate-500 mt-2 flex items-center gap-1.5 flex-wrap">
                            <CalendarDays className="w-4 h-4 text-slate-400" /> {booking.date} 
                            <span className="text-slate-300 mx-1">|</span> 
                            <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100/50 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> {booking.startTime} - {endTimeStr}
                            </span>
                          </p>
                          
                          <p className="text-sm font-medium text-slate-500 mt-2 flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            Phòng: <span className="font-black text-slate-800">{roomName}</span>
                          </p>

                          {/* 4. HIỂN THỊ DANH SÁCH THIẾT BỊ MƯỢN KÈM (Tăng size tag) */}
                          {booking.equipments && booking.equipments.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-100">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Thiết bị mượn kèm:</p>
                              <div className="flex flex-wrap gap-2">
                                {booking.equipments.map((eq: any, idx: number) => (
                                  <span key={idx} className="bg-slate-50 border border-slate-200 text-slate-700 text-xs px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 shadow-sm">
                                    <Package className="w-3.5 h-3.5 text-slate-500" />
                                    {eq.name} <span className="font-black text-blue-600 ml-0.5">x{eq.quantity}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Cảnh báo trùng lịch */}
                      {booking.is_conflict && (
                        <div className="bg-red-50 text-red-700 text-sm p-3 rounded-xl font-medium border border-red-200 mt-1">
                          <AlertTriangle className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                          <b>Trùng lịch:</b> Khung giờ này đã được duyệt cho khách <b>{booking.conflict_with}</b>.
                        </div>
                      )}

                      {/* Nút hành động (To hơn, bo góc mạnh hơn) */}
                      <div className="flex gap-3 mt-2 pt-2">
                        <button
                          onClick={() => handleUpdateStatus(booking.id, "confirmed")}
                          disabled={booking.is_conflict}
                          className={`flex-1 text-white text-sm font-black py-3 rounded-xl transition-all shadow-sm ${
                            booking.is_conflict ? "bg-slate-300 cursor-not-allowed" : "bg-emerald-500 hover:bg-emerald-600 hover:shadow-md active:scale-95"
                          }`}
                        >
                          Duyệt đơn
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(booking.id, "cancelled")}
                          className="flex-1 bg-white hover:bg-red-50 text-red-600 border-2 border-red-100 hover:border-red-200 text-sm font-black py-3 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95"
                        >
                          Từ chối
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };
  const renderReports = () => (
    <div className="p-6 bg-white rounded-2xl border border-gray-100 text-center py-20 text-gray-400">
      Giao diện Báo cáo sự cố
    </div>
  );
  const renderLookup = () => (
    <div className="p-6 bg-white rounded-2xl border border-gray-100 text-center py-20 text-gray-400">
      Giao diện Tra cứu thông tin
    </div>
  );

  // ================= GIAO DIỆN TIMELINE EXCEL XUYÊN NGÀY =================
  // ================= GIAO DIỆN TIMELINE XUYÊN NGÀY (FULL 24H) =================
  const renderTimeline = () => {
    const startHour = 0;
    const endHour = 24;
    const totalMins = 24 * 60; // Khung nhìn 1440 phút (Đủ 24 tiếng)

    // Tạo Timestamp cho ngày đang chọn để bắt khoảng thời gian xem (View Port)
    const viewStartMs = new Date(`${selectedDate}T00:00:00`).getTime();
    const viewEndMs = viewStartMs + 24 * 60 * 60 * 1000;

    const uniqueBuildings = Array.from(
      new Set(rooms.map((r) => r.building || "Khác")),
    ).filter(Boolean);

    // CHỈ hiển thị những phòng có lịch đặt GIAO NHAU với NGÀY ĐANG CHỌN
    const filteredRooms = rooms.filter((room) => {
      const roomIdStr = room.id || room._id || "";
      const hasBooking = bookings.some((b) => {
        if (b.roomId !== roomIdStr) return false;
        if (b.status === "cancelled") return false; // Không hiển thị ca đã từ chối/hủy
        const existDate = b.date || selectedDate;
        const bStartMs = new Date(`${existDate}T${b.startTime}`).getTime();
        const bEndMsWithBuffer =
          bStartMs + (b.durationMins + b.bufferMins) * 60000;

        // Thuật toán kiểm tra giao nhau (Overlap) với View Port
        return bStartMs < viewEndMs && bEndMsWithBuffer > viewStartMs;
      });

      if (!hasBooking) return false;

      if (
        buildingFilter !== "all" &&
        (room.building || "Khác") !== buildingFilter
      )
        return false;
      return true;
    });

    const getStatusColor = (status: string) => {
      if (status === "checked-in")
        return "bg-emerald-500 border-emerald-600 text-white shadow-sm";
      if (status === "confirmed")
        return "bg-blue-500 border-blue-600 text-white shadow-sm";
      if (status === "pending")
        return "bg-amber-400 border-amber-500 text-amber-950 shadow-sm";
      return "bg-gray-400 text-white";
    };

    const currentHour = currentTime.getHours();
    const currentMin = currentTime.getMinutes();
    let currentLinePct: number | null = null;

    // Chỉ vẽ thanh đỏ Real-time nếu ngày đang xem là Hôm Nay
    if (selectedDate === new Date().toISOString().split("T")[0]) {
      currentLinePct = ((currentHour * 60 + currentMin) / totalMins) * 100;
    }

    return (
      <div className="space-y-6 flex flex-col h-[calc(100vh-6rem)] relative animate-in fade-in duration-300">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4 shrink-0">
          <div>
            <h2 className="text-2xl font-black text-gray-900">
              Lịch Điều Phối Vận Hành
            </h2>
            <p className="text-gray-500 mt-1 flex gap-4 text-sm font-medium">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>{" "}
                Đang dùng
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span> Đã
                duyệt
              </span>
              <span className="text-xs text-gray-400 font-semibold self-center bg-gray-100 px-2.5 py-0.5 rounded-md">
                Đang tự động bóc tách xuyên ngày
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            <select
              value={buildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold bg-white outline-none focus:border-emerald-500"
            >
              <option value="all">Tất cả khu vực tòa nhà</option>
              {uniqueBuildings.map((b, i) => (
                <option key={i} value={b}>
                  {b}
                </option>
              ))}
            </select>

            <button
              onClick={() =>
                setSelectedDate(new Date().toISOString().split("T")[0])
              }
              className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-200"
            >
              Hôm nay
            </button>
            <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={() => changeDate(-1)}
                className="p-2 hover:bg-gray-100 text-gray-500"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2 py-1 text-sm font-bold outline-none cursor-pointer"
              />
              <button
                onClick={() => changeDate(1)}
                className="p-2 hover:bg-gray-100 text-gray-500"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={() => setShowQuickBook(true)}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-md"
            >
              <Plus className="w-4 h-4" /> Đặt lịch nhanh
            </button>
          </div>
        </div>

        {/* LƯỚI TIMELINE */}
        <div className="flex-1 bg-white border border-gray-200 rounded-2xl overflow-auto relative shadow-sm">
          {/* Mở rộng chiều ngang min-w để 24 tiếng không bị ép dính vào nhau */}
          <div className="min-w-[1600px] h-full flex flex-col relative">
            {currentLinePct !== null && (
              <div
                className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-40 pointer-events-none"
                style={{
                  left: `calc(16rem + ${currentLinePct} * (100% - 16rem) / 100)`,
                }}
              >
                <div className="absolute -top-1 -left-[5px] w-3 h-3 bg-red-500 rotate-45 rounded-sm shadow-sm"></div>
              </div>
            )}

            <div className="flex sticky top-0 z-30 bg-slate-50 border-b border-gray-200 shadow-sm">
              <div className="w-64 shrink-0 sticky left-0 z-40 bg-slate-50 border-r border-gray-200 p-4 font-black text-gray-700">
                Không gian phòng Lab
              </div>
              <div className="flex-1 relative flex">
                {/* Vẽ 24 mốc giờ */}
                {Array.from({ length: 24 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex-1 border-r border-gray-100 p-3 text-xs font-bold text-gray-400 relative box-border"
                  >
                    <span className="absolute -left-3 top-3 bg-slate-50 px-1">
                      {idx.toString().padStart(2, "0")}:00
                    </span>
                  </div>
                ))}
                {/* Mốc 24:00 ở viền cuối cùng */}
                <span className="absolute right-0 top-3 bg-slate-50 px-1 text-xs font-bold text-gray-400 translate-x-1/2">
                  24:00
                </span>
              </div>
            </div>

            {filteredRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 py-20 text-gray-400">
                <CalendarDays className="w-12 h-12 mb-3 text-gray-200" />
                <p className="font-medium text-sm">
                  Hiện tại không có phòng nào có lịch đặt trùng khớp.
                </p>
              </div>
            ) : (
              filteredRooms.map((room) => {
                const roomIdStr = room.id || room._id || "";

                const roomBookings = bookings.filter((b) => {
                  if (b.roomId !== roomIdStr) return false;
                  if (b.status === "cancelled") return false;
                  const existDate = b.date || selectedDate;
                  const bStartMs = new Date(
                    `${existDate}T${b.startTime}`,
                  ).getTime();
                  const bEndMsWithBuffer =
                    bStartMs + (b.durationMins + b.bufferMins) * 60000;
                  return bStartMs < viewEndMs && bEndMsWithBuffer > viewStartMs;
                });

                return (
                  <div
                    key={roomIdStr}
                    className="flex border-b border-gray-100 group hover:bg-slate-50/50 transition-colors h-24 relative"
                  >
                    <div className="w-64 shrink-0 sticky left-0 z-20 bg-white group-hover:bg-slate-50 border-r border-gray-200 p-4 flex flex-col justify-center">
                      <h3 className="font-bold text-gray-900 leading-tight truncate">
                        {room.title || room.name || "Chưa đặt tên"}
                      </h3>
                      <p className="text-xs text-gray-500 font-medium mt-1">
                        <MapPin className="w-3 h-3 inline mr-1" />{" "}
                        {room.building || "Tòa khác"} - {room.floor || ""}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        <Users className="w-3 h-3 inline mr-1" /> Sức chứa:{" "}
                        {room.capacity} chỗ
                      </p>
                    </div>

                    <div className="flex-1 relative bg-white">
                      <div className="absolute inset-0 flex pointer-events-none">
                        {Array.from({ length: 24 }).map((_, idx) => (
                          <div
                            key={idx}
                            className="flex-1 border-r border-gray-100/60 border-dashed"
                          ></div>
                        ))}
                      </div>

                      {roomBookings.map((booking) => {
                        const existDate = booking.date || selectedDate;
                        const bStartMs = new Date(
                          `${existDate}T${booking.startTime}`,
                        ).getTime();
                        const bEndMs = bStartMs + booking.durationMins * 60000;
                        const bBufferEndMs =
                          bEndMs + booking.bufferMins * 60000;

                        const visibleStartMs = Math.max(bStartMs, viewStartMs);
                        const visibleEndMs = Math.min(bEndMs, viewEndMs);

                        let leftPct = 0,
                          widthPct = 0,
                          bufferLeftPct = 0,
                          bufferWidthPct = 0;

                        if (visibleStartMs < visibleEndMs) {
                          leftPct =
                            ((visibleStartMs - viewStartMs) /
                              60000 /
                              totalMins) *
                            100;
                          widthPct =
                            ((visibleEndMs - visibleStartMs) /
                              60000 /
                              totalMins) *
                            100;
                        }

                        const visibleBufferStartMs = Math.max(
                          bEndMs,
                          viewStartMs,
                        );
                        const visibleBufferEndMs = Math.min(
                          bBufferEndMs,
                          viewEndMs,
                        );
                        if (visibleBufferStartMs < visibleBufferEndMs) {
                          bufferLeftPct =
                            ((visibleBufferStartMs - viewStartMs) /
                              60000 /
                              totalMins) *
                            100;
                          bufferWidthPct =
                            ((visibleBufferEndMs - visibleBufferStartMs) /
                              60000 /
                              totalMins) *
                            100;
                        }

                        const trueEndTimeObj = new Date(bEndMs);
                        const endTimeStr = minsToTime(
                          trueEndTimeObj.getHours() * 60 +
                            trueEndTimeObj.getMinutes(),
                        );

                        return (
                          <React.Fragment key={booking.id}>
                            {widthPct > 0 && (
                              <div
                                className={`absolute top-2 bottom-2 ${getStatusColor(
                                  booking.status,
                                )} border rounded-xl px-3 py-1 overflow-hidden z-10 flex flex-col justify-center cursor-pointer hover:brightness-110 transition-all shadow-sm`}
                                style={{
                                  left: `${leftPct}%`,
                                  width: `${widthPct}%`,
                                }}
                                onClick={() => setSelectedBooking(booking)}
                              >
                                <p className="text-xs font-black truncate leading-tight">
                                  {booking.customerName}
                                </p>
                                <p className="text-[10px] opacity-90 truncate font-semibold mt-0.5">
                                  {booking.startTime} - {endTimeStr}
                                </p>
                              </div>
                            )}

                            {bufferWidthPct > 0 && (
                              <div
                                className="absolute top-2 bottom-2 z-0 bg-slate-50 border-y border-r border-slate-200 rounded-r-lg opacity-60 flex items-center justify-center overflow-hidden"
                                style={{
                                  left: `${bufferLeftPct}%`,
                                  width: `${bufferWidthPct}%`,
                                  backgroundImage:
                                    "repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.03) 5px, rgba(0,0,0,0.03) 10px)",
                                }}
                              />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  // ================= SIDEBAR =================
  const renderSidebar = () => (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 shrink-0 shadow-2xl z-30 hidden md:flex">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-emerald-500" />
          Manager<span className="text-emerald-500">Ops</span>
        </h1>
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {[
          {
            id: "dashboard",
            icon: LayoutDashboard,
            label: "Giám sát Vận hành",
          },
          { id: "labs", icon: DoorOpen, label: "Phòng Thực hành" },
          { id: "equipments", icon: Package, label: "Thiết Bị" },
          { id: "timeline", icon: CalendarDays, label: "Lịch Điều phối" },
          { id: "reports", icon: FileText, label: "Báo cáo Sự cố" },
          { id: "lookup", icon: Search, label: "Tra cứu Thông tin" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveMenu(item.id as MenuTab)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeMenu === item.id ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20" : "hover:bg-slate-800"}`}
          >
            <item.icon className="w-5 h-5" /> {item.label}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold bg-slate-800 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" /> Đăng xuất
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {renderSidebar()}

      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 relative">
        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <h1 className="text-xl font-black flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-500" /> Manager
            <span className="text-emerald-500">Ops</span>
          </h1>
          <button
            onClick={handleLogout}
            className="p-2 text-red-500 bg-red-50 rounded-lg"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Nav Tabs */}
        <div className="md:hidden flex overflow-x-auto gap-2 mb-6 pb-2 scrollbar-hide">
          {[
            { id: "dashboard", label: "Giám sát" },
            { id: "timeline", label: "Điều phối" },
            { id: "labs", label: "Phòng" },
            { id: "equipments", label: "Thiết bị" },
            { id: "reports", label: "Báo cáo" },
            { id: "lookup", label: "Tra cứu" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveMenu(t.id as MenuTab)}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${activeMenu === t.id ? "bg-emerald-600 text-white" : "bg-white text-gray-500 border border-gray-200"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
            </div>
          ) : (
            <motion.div
              key={activeMenu}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {activeMenu === "dashboard" && renderDashboard()}
              {activeMenu === "labs" && renderLabsTable()}
              {activeMenu === "equipments" && renderEquipmentsTable()}
              {activeMenu === "timeline" && renderTimeline()}
              {activeMenu === "reports" && renderReports()}
              {activeMenu === "lookup" && renderLookup()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ================= MODAL QUICK BOOK CAO CẤP ================= */}
        <AnimatePresence>
          {showQuickBook && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh]"
              >
                <div className="bg-emerald-600 p-5 flex justify-between items-center text-white shrink-0">
                  <h3 className="font-black text-xl flex items-center gap-2">
                    <Clock className="w-5 h-5" /> Đặt Phòng Nhanh (POS)
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowQuickBook(false)}
                    className="hover:bg-emerald-700 p-1 rounded-full"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form
                  onSubmit={handleQuickBookSubmit}
                  className="p-6 overflow-y-auto space-y-6"
                >
                  {/* Tìm Kiếm và Chọn Phòng */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center justify-between">
                      Chọn Phòng Lab *
                      <div className="relative w-48">
                        <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Tìm tên phòng..."
                          value={roomSearchQuery}
                          onChange={(e) => setRoomSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </label>
                    <select
                      required
                      value={quickBookData.roomId}
                      onChange={(e) =>
                        setQuickBookData({
                          ...quickBookData,
                          roomId: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl font-bold text-emerald-800 outline-none focus:border-emerald-500 shadow-sm"
                    >
                      <option value="" disabled>
                        -- Vui lòng chọn một phòng --
                      </option>
                      {rooms
                        .filter((r) =>
                          (r.title || r.name || "")
                            .toLowerCase()
                            .includes(roomSearchQuery.toLowerCase()),
                        )
                        .map((r) => (
                          <option key={r.id || r._id} value={r.id || r._id}>
                            {r.title || r.name} - Sức chứa: {r.capacity} (
                            {Number(r.price || 100000).toLocaleString("vi-VN")}
                            đ/h)
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Họ Tên Người Thuê *
                      </label>
                      <input
                        type="text"
                        required
                        value={quickBookData.customerName}
                        onChange={(e) =>
                          setQuickBookData({
                            ...quickBookData,
                            customerName: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500"
                        placeholder="VD: Nguyễn Văn A"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Số điện thoại liên hệ *
                      </label>
                      <input
                        type="text"
                        required
                        value={quickBookData.phone}
                        onChange={(e) =>
                          setQuickBookData({
                            ...quickBookData,
                            phone: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500"
                        placeholder="VD: 0901234567"
                      />
                    </div>
                  </div>

                  {/* Cho phép chọn lịch xuyên ngày */}
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-blue-900 mb-1">
                        Bắt đầu từ *
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          required
                          value={quickBookData.startDate}
                          onChange={(e) =>
                            setQuickBookData({
                              ...quickBookData,
                              startDate: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm outline-none focus:border-blue-500"
                        />
                        <input
                          type="time"
                          required
                          value={quickBookData.startTime}
                          onChange={(e) =>
                            setQuickBookData({
                              ...quickBookData,
                              startTime: e.target.value,
                            })
                          }
                          className="w-24 px-2 py-2 bg-white border border-blue-200 rounded-lg text-sm outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-blue-900 mb-1">
                        Đến khi *
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          required
                          value={quickBookData.endDate}
                          onChange={(e) =>
                            setQuickBookData({
                              ...quickBookData,
                              endDate: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm outline-none focus:border-blue-500"
                        />
                        <input
                          type="time"
                          required
                          value={quickBookData.endTime}
                          onChange={(e) =>
                            setQuickBookData({
                              ...quickBookData,
                              endTime: e.target.value,
                            })
                          }
                          className="w-24 px-2 py-2 bg-white border border-blue-200 rounded-lg text-sm outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* THIẾT BỊ & GIÁ TIỀN */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Thêm thiết bị (Trừ kho tự động)
                    </label>
                    <div className="border border-gray-200 rounded-xl p-4 max-h-48 overflow-y-auto bg-gray-50 space-y-2">
                      {equipments.map((eq) => {
                        const eqId = eq.id || eq._id || "";
                        const available =
                          (eq.totalQuantity || 0) - (eq.inUseQuantity || 0);
                        const isOutOfStock = available <= 0;
                        const isSelected = !!quickBookData.equipments[eqId];
                        const selectedQty = isSelected
                          ? quickBookData.equipments[eqId].quantity
                          : 0;
                        const eqPrice = Number(eq.price || 50000);

                        return (
                          <div
                            key={eqId}
                            className={`flex items-center justify-between p-3 rounded-lg border ${isSelected ? "bg-emerald-50 border-emerald-300" : "bg-white border-transparent hover:border-gray-300"} ${isOutOfStock && !isSelected ? "opacity-40" : "shadow-sm"}`}
                          >
                            <label className="flex items-center gap-3 cursor-pointer flex-1">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() =>
                                  toggleEquipment(
                                    eqId,
                                    eq.name,
                                    available,
                                    eqPrice,
                                  )
                                }
                                disabled={isOutOfStock && !isSelected}
                                className="w-5 h-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                              />
                              <div>
                                <span className="text-sm font-black text-gray-900">
                                  {eq.name}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded-md font-bold ${isOutOfStock ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}
                                  >
                                    {isOutOfStock
                                      ? "Hết hàng"
                                      : `Còn: ${available}`}
                                  </span>
                                  <span className="text-xs text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <Banknote className="w-3 h-3" />{" "}
                                    {eqPrice.toLocaleString("vi-VN")}đ / lượt
                                  </span>
                                </div>
                              </div>
                            </label>

                            {isSelected && (
                              <div className="flex items-center gap-2 bg-white border border-emerald-300 rounded-lg p-1 shadow-inner">
                                <button
                                  type="button"
                                  onClick={() => updateEqQuantity(eqId, -1)}
                                  className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 font-black"
                                >
                                  -
                                </button>
                                <span className="text-base font-black w-6 text-center text-emerald-700">
                                  {selectedQty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateEqQuantity(eqId, 1)}
                                  disabled={selectedQty >= available}
                                  className="w-7 h-7 bg-emerald-100 hover:bg-emerald-200 disabled:opacity-50 rounded text-emerald-700 font-black"
                                >
                                  +
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* TỔNG HÓA ĐƠN */}
                  <div className="bg-slate-900 rounded-xl p-5 flex items-center justify-between shadow-lg">
                    <div>
                      <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">
                        Tổng tiền tạm tính
                      </p>
                      <p className="text-gray-300 text-xs">
                        (Bao gồm Phòng + Thiết bị)
                      </p>
                    </div>
                    <div className="text-3xl font-black text-emerald-400">
                      {calculateTotalCost().toLocaleString("vi-VN")}đ
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowQuickBook(false)}
                      className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      id="btn-submit-quickbook"
                      className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-xl transition-all active:scale-95 text-lg"
                    >
                      Xác nhận Check-in
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ================= MODAL XEM CHI TIẾT CA ĐẶT ================= */}
        <AnimatePresence>
          {selectedBooking && (
            <div
              className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
              onClick={() => setSelectedBooking(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
              >
                <div className="bg-slate-900 p-5 flex justify-between items-center text-white shrink-0">
                  <h3 className="font-black text-xl flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-400" /> Chi tiết Ca
                    đặt phòng
                  </h3>
                  <button
                    type="button"
                    onClick={() => setSelectedBooking(null)}
                    className="hover:bg-slate-700 p-1 rounded-full"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                    <div>
                      <h4 className="text-2xl font-black text-gray-900">
                        {selectedBooking.customerName}
                      </h4>
                      <p className="text-sm font-medium text-gray-500 mt-1">
                        SĐT: {selectedBooking.phone}
                      </p>
                    </div>
                    <span className="bg-emerald-100 text-emerald-700 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider">
                      {selectedBooking.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                        Thời gian mượn
                      </p>
                      <p className="text-lg font-black text-gray-900">
                        {selectedBooking.startTime} -{" "}
                        {minsToTime(
                          timeToMins(selectedBooking.startTime) +
                            selectedBooking.durationMins,
                        )}
                      </p>
                      <p className="text-xs font-medium text-amber-600 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Dọn dẹp:{" "}
                        {selectedBooking.bufferMins} phút
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                        Phòng Lab
                      </p>
                      <p className="text-lg font-black text-gray-900 line-clamp-1">
                        {rooms.find(
                          (r) =>
                            r.id === selectedBooking.roomId ||
                            r._id === selectedBooking.roomId,
                        )?.title ||
                          rooms.find(
                            (r) =>
                              r.id === selectedBooking.roomId ||
                              r._id === selectedBooking.roomId,
                          )?.name ||
                          "Phòng học"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-500" /> Thiết bị
                      mượn kèm
                    </h5>
                    {!selectedBooking.equipments ||
                    selectedBooking.equipments.length === 0 ? (
                      <p className="text-sm text-gray-500 italic bg-gray-50 p-3 rounded-lg border border-gray-100">
                        Không mượn thêm thiết bị.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {selectedBooking.equipments.map((eq, idx) => (
                          <li
                            key={idx}
                            className="flex justify-between items-center bg-blue-50/50 border border-blue-100 p-3 rounded-xl"
                          >
                            <span className="font-bold text-gray-800 text-sm">
                              {eq.name}
                            </span>
                            <span className="bg-blue-100 text-blue-700 font-black px-3 py-1 rounded-lg text-xs">
                              x{eq.quantity}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {selectedBooking.note && (
                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
                      <p className="text-xs font-bold text-amber-800 uppercase mb-1">
                        Ghi chú vận hành:
                      </p>
                      <p className="text-sm font-medium text-amber-900">
                        {selectedBooking.note}
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedBooking(null)}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-md"
                  >
                    Đóng lại
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* === MODAL BÁO CÁO BẢO TRÌ (ĐÃ CHUYỂN RA NGOÀI VÀ SẼ HIỂN THỊ Ở MỌI TAB) === */}
        <AnimatePresence>
          {reportModal.isOpen && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm z-[999]">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
              >
                <div className="bg-red-600 p-5 flex justify-between items-center text-white shrink-0">
                  <h3 className="font-black text-xl flex items-center gap-2">
                    <Wrench className="w-5 h-5" /> Báo Cáo Sửa Chữa
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      setReportModal({ ...reportModal, isOpen: false })
                    }
                    className="hover:bg-red-700 p-1 rounded-full"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <form onSubmit={handleReportSubmit} className="p-6 space-y-4">
                  <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                    <p className="text-sm text-red-800 font-bold">
                      Đối tượng: {reportModal.itemName}
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                      Hệ thống sẽ chuyển trạng thái của đối tượng này sang Bảo
                      trì/Sửa chữa.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Mô tả tình trạng hỏng hóc *
                    </label>
                    <textarea
                      required
                      value={reportModal.reason}
                      onChange={(e) =>
                        setReportModal({
                          ...reportModal,
                          reason: e.target.value,
                        })
                      }
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-red-500 resize-none"
                      placeholder="Ví dụ: Điều hòa không mát, máy chiếu mờ..."
                    ></textarea>
                  </div>
                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setReportModal({ ...reportModal, isOpen: false })
                      }
                      className="px-5 py-2.5 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
                    >
                      Xác nhận Báo hỏng
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        {/* ================= GIAO DIỆN XÁC NHẬN TỪ CHỐI ĐƠN ================= */}
        <AnimatePresence>
          {confirmCancel.isOpen && (
            <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center"
              >
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">
                  Xác nhận từ chối
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Bạn có chắc chắn muốn từ chối và hủy đơn đặt phòng này không?
                  Hành động này không thể hoàn tác.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      setConfirmCancel({ isOpen: false, bookingId: "" })
                    }
                    className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                  >
                    Quay lại
                  </button>
                  <button
                    onClick={() => {
                      executeUpdateStatus(confirmCancel.bookingId, "cancelled");
                      setConfirmCancel({ isOpen: false, bookingId: "" });
                    }}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-md"
                  >
                    Từ chối đơn
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ================= THÔNG BÁO NỔI (TOAST MESSAGE) ================= */}
        <AnimatePresence>
          {toast.show && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className={`fixed bottom-8 right-8 z-[9999] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${
                toast.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-red-600" />
              )}
              <span className="font-bold text-sm">{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
