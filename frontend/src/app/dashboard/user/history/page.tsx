"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Package,
  Hexagon,
  User,
  LogOut,
  ChevronDown,
  History,
  ClipboardList,
  Lock,
  ArrowLeft,
} from "lucide-react";
import {
  BookingItem,
  cancelBooking,
  fetchMyBookings,
  normalizeBookingStatus,
} from "../../../../services/booking";

type ViewMode = "request" | "borrow";
type RequestTab = "ALL" | "CHO_DUYET" | "DA_DUYET" | "BI_TU_CHOI" | "DA_HUY";
type BorrowTab = "ALL" | "DANG_MUON" | "DA_XONG" | "DA_HUY";

const getTimeRange = (booking: BookingItem) => {
  const startTime = booking.start_time || "00:00";
  const durationMins = booking.duration_mins || 0;
  const startMinutes =
    parseInt(startTime.split(":")[0]) * 60 + parseInt(startTime.split(":")[1]);
  const endTimeMins = startMinutes + durationMins;
  const endHour = Math.floor(endTimeMins / 60).toString().padStart(2, "0");
  const endMin = (endTimeMins % 60).toString().padStart(2, "0");
  return { startTime, endTime: `${endHour}:${endMin}` };
};

const getStatusDisplay = (status: string) => {
  const normalizedStatus = normalizeBookingStatus(status);

  switch (normalizedStatus) {
    case "CHO_DUYET":
      return {
        text: "Chờ duyệt",
        color: "text-amber-600 bg-amber-50 border-amber-200",
        icon: AlertTriangle,
      };
    case "DA_DUYET":
      return {
        text: "Đã duyệt",
        color: "text-blue-600 bg-blue-50 border-blue-200",
        icon: CheckCircle2,
      };
    case "BI_TU_CHOI":
      return {
        text: "Bị từ chối",
        color: "text-rose-600 bg-rose-50 border-rose-200",
        icon: XCircle,
      };
    case "DA_HUY":
      return {
        text: "Đã hủy",
        color: "text-red-600 bg-red-50 border-red-200",
        icon: XCircle,
      };
    case "DANG_MUON":
      return {
        text: "Đang mượn",
        color: "text-emerald-600 bg-emerald-50 border-emerald-200",
        icon: CheckCircle2,
      };
    case "DA_XONG":
      return {
        text: "Đã xong",
        color: "text-slate-600 bg-slate-50 border-slate-200",
        icon: CheckCircle2,
      };
    default:
      return {
        text: normalizedStatus,
        color: "text-gray-600 bg-gray-50 border-gray-200",
        icon: Clock,
      };
  }
};

const formatHistoryStatus = (status: string) =>
  getStatusDisplay(status).text;

const formatDateTime = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function UserBookingHistoryPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("request");
  const [requestTab, setRequestTab] = useState<RequestTab>("ALL");
  const [borrowTab, setBorrowTab] = useState<BorrowTab>("ALL");
  const [userName, setUserName] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const storedName = localStorage.getItem("user_name");

    if (!token) {
      setIsLoggedIn(false);
      setLoading(false);
      return;
    }

    setIsLoggedIn(true);
    if (storedName) setUserName(storedName);
    fetchMyBookingsData();
  }, []);

  const fetchMyBookingsData = async () => {
    setLoading(true);
    try {
      const data = await fetchMyBookings();
      setBookings(data);
    } catch (error) {
      console.error("Lỗi khi tải lịch sử:", error);
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_name");
    router.push("/");
  };

  const handleCancelBooking = async (bookingId: string) => {
    const cancelReason = window.prompt(
      "Bạn có thể nhập lý do hủy (không bắt buộc):",
      "",
    );
    if (cancelReason === null) return;

    if (!window.confirm("Bạn có chắc chắn muốn hủy yêu cầu đặt phòng này?"))
      return;

    try {
      await cancelBooking(bookingId, cancelReason.trim() || undefined);
      alert("Đã hủy đơn thành công!");
      fetchMyBookingsData();
    } catch (error: any) {
      alert(`⛔ Lỗi: ${error.message}`);
    }
  };

  const requestStatuses = new Set(["CHO_DUYET", "DA_DUYET", "BI_TU_CHOI", "DA_HUY"]);
  const borrowStatuses = new Set(["DANG_MUON", "DA_XONG", "DA_HUY"]);

  const filteredBookings = bookings.filter((booking) => {
    const status = normalizeBookingStatus(booking.status);

    if (viewMode === "request") {
      if (!requestStatuses.has(status)) return false;
      if (requestTab === "ALL") return true;
      return status === requestTab;
    }

    if (!borrowStatuses.has(status)) return false;
    if (borrowTab === "ALL") return true;
    return status === borrowTab;
  });

  const stats = {
    pending: bookings.filter((b) => normalizeBookingStatus(b.status) === "CHO_DUYET").length,
    approved: bookings.filter((b) => normalizeBookingStatus(b.status) === "DA_DUYET").length,
    rejected: bookings.filter((b) => normalizeBookingStatus(b.status) === "BI_TU_CHOI").length,
    borrowing: bookings.filter((b) => normalizeBookingStatus(b.status) === "DANG_MUON").length,
    completed: bookings.filter((b) => normalizeBookingStatus(b.status) === "DA_XONG").length,
    cancelled: bookings.filter((b) => normalizeBookingStatus(b.status) === "DA_HUY").length,
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-2xl font-black text-blue-600 tracking-tight">
            <Hexagon className="w-8 h-8 fill-blue-600" /> BookLab247
          </Link>
          <nav className="hidden md:flex gap-8 text-sm font-bold text-gray-600">
            <Link href="/" className="hover:text-blue-600 transition-colors">Trang chủ</Link>
            <Link href="/dashboard/user/labs" className="hover:text-blue-600 transition-colors">Danh sách phòng</Link>
            <Link href="/dashboard/user/device" className="hover:text-blue-600 transition-colors">Thiết bị</Link>
            <Link href="/dashboard/user/history" className="text-blue-600">Lịch sử đặt phòng</Link>
          </nav>
          <div className="flex items-center gap-4 relative z-50">
            {userName ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 font-semibold rounded-full hover:bg-blue-100 transition-colors"
                >
                  <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  {userName}
                  <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-50">
                    <div className="p-2">
                      <Link href="/dashboard/user/profile" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-xl transition-colors">
                        <User className="w-4 h-4" /> Hồ sơ cá nhân
                      </Link>
                      <div className="h-px bg-gray-100 my-1" />
                      <button onClick={handleLogout} className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                        <LogOut className="w-4 h-4" /> Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="px-5 py-2 text-sm font-bold bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shadow-md">
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4 md:p-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-bold mb-4 transition-colors w-fit group outline-none"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Quay lại
          </button>
          <h1 className="text-3xl font-black text-gray-900">Lịch sử mượn phòng & thiết bị</h1>
          <p className="text-gray-500 mt-2">
            Theo dõi trạng thái yêu cầu, lý do từ chối và tiến trình mượn trả.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : !isLoggedIn ? (
          <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto shadow-sm">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Yêu cầu đăng nhập</h3>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              Vui lòng đăng nhập tài khoản sinh viên để xem lịch sử các phòng bạn đã đặt.
            </p>
            <button
              onClick={() => (window.location.href = "/login")}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
              Đăng nhập ngay
            </button>
          </div>
        ) : (
          <>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {[
            { label: "Chờ duyệt", value: stats.pending, color: "text-amber-600 bg-amber-50 border-amber-100" },
            { label: "Đã duyệt", value: stats.approved, color: "text-blue-600 bg-blue-50 border-blue-100" },
            { label: "Bị từ chối", value: stats.rejected, color: "text-rose-600 bg-rose-50 border-rose-100" },
            { label: "Đang mượn", value: stats.borrowing, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
            { label: "Đã xong", value: stats.completed, color: "text-slate-600 bg-slate-50 border-slate-100" },
            { label: "Đã hủy", value: stats.cancelled, color: "text-red-600 bg-red-50 border-red-100" },
          ].map((item) => (
            <div key={item.label} className={`rounded-2xl border p-4 ${item.color}`}>
              <p className="text-xs font-bold uppercase tracking-wide opacity-80">{item.label}</p>
              <p className="text-2xl font-black mt-1">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setViewMode("request")}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold border transition-colors ${
              viewMode === "request"
                ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20"
                : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <ClipboardList className="w-4 h-4" /> Theo dõi yêu cầu
          </button>
          <button
            onClick={() => setViewMode("borrow")}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold border transition-colors ${
              viewMode === "borrow"
                ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20"
                : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <History className="w-4 h-4" /> Lịch sử mượn
          </button>
        </div>

        <div className="flex overflow-x-auto gap-2 mb-6 pb-2 scrollbar-hide">
          {(viewMode === "request"
            ? [
                { id: "ALL", label: "Tất cả yêu cầu" },
                { id: "CHO_DUYET", label: "Chờ duyệt" },
                { id: "DA_DUYET", label: "Đã duyệt" },
                { id: "BI_TU_CHOI", label: "Bị từ chối" },
                { id: "DA_HUY", label: "Đã hủy" },
              ]
            : [
                { id: "ALL", label: "Tất cả" },
                { id: "DANG_MUON", label: "Đang mượn" },
                { id: "DA_XONG", label: "Đã xong" },
                { id: "DA_HUY", label: "Đã hủy" },
              ]
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() =>
                viewMode === "request"
                  ? setRequestTab(tab.id as RequestTab)
                  : setBorrowTab(tab.id as BorrowTab)
              }
              className={`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-colors border ${
                (viewMode === "request" ? requestTab : borrowTab) === tab.id
                  ? "bg-white text-blue-600 border-blue-200 shadow-sm"
                  : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filteredBookings.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
            <Calendar className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-1">Không có đơn nào</h3>
            <p className="text-gray-500 mb-6">
              {viewMode === "request"
                ? "Bạn chưa có yêu cầu đặt phòng nào trong mục này."
                : "Bạn chưa có lịch sử mượn phòng/thiết bị trong mục này."}
            </p>
            <Link href="/dashboard/user/labs" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
              Đặt phòng ngay
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence>
              {filteredBookings.map((booking) => {
                const StatusObj = getStatusDisplay(booking.status);
                const { startTime, endTime } = getTimeRange(booking);
                const bookingId = booking.id;
                const normalizedStatus = normalizeBookingStatus(booking.status);
                const roomTitle = booking.room_name || booking.room_id || "Phòng Lab";
                const rejectionReason = booking.rejection_reason || "";
                const isExpanded = expandedId === bookingId;

                return (
                  <motion.div
                    key={bookingId}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-black text-gray-900 line-clamp-1">{roomTitle}</h3>
                        <p className="text-sm font-medium text-gray-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-4 h-4" />
                          {booking.room_building || "Tòa nhà"} - {booking.room_floor || "Tầng"}
                        </p>
                      </div>
                      <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${StatusObj.color}`}>
                        <StatusObj.icon className="w-4 h-4" /> {StatusObj.text}
                      </span>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-4 mb-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Ngày sử dụng</p>
                        <p className="font-bold text-gray-900 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-500" /> {booking.date}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Thời gian</p>
                        <p className="font-bold text-gray-900 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-500" /> {startTime} - {endTime}
                        </p>
                      </div>
                    </div>

                    {booking.equipments && booking.equipments.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Thiết bị mượn kèm</p>
                        <div className="flex flex-wrap gap-2">
                          {booking.equipments.map((eq, i) => (
                            <span key={i} className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-xs font-bold border border-blue-100">
                              <Package className="w-3 h-3" /> {eq.name} (x{eq.quantity})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {normalizedStatus === "BI_TU_CHOI" && rejectionReason && (
                      <div className="mb-4 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
                        <p className="font-bold mb-1">Lý do từ chối</p>
                        <p>{rejectionReason}</p>
                      </div>
                    )}

                    {normalizedStatus === "DA_HUY" && booking.status_history?.length ? (
                      <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                        <p className="font-bold mb-1">Lý do hủy</p>
                        <p>
                          {[...booking.status_history]
                            .reverse()
                            .find((entry) => normalizeBookingStatus(entry.status) === "DA_HUY")?.reason ||
                            "Người dùng hủy đơn"}
                        </p>
                      </div>
                    ) : null}

                    {booking.status_history && booking.status_history.length > 0 && (
                      <div className="mb-4">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : bookingId)}
                          className="text-sm font-bold text-blue-600 hover:text-blue-800"
                        >
                          {isExpanded ? "Ẩn tiến trình trạng thái" : "Xem tiến trình trạng thái"}
                        </button>
                        {isExpanded && (
                          <div className="mt-3 space-y-2 border-l-2 border-blue-100 pl-4">
                            {booking.status_history.map((entry, index) => (
                              <div key={`${bookingId}-history-${index}`} className="text-sm">
                                <p className="font-bold text-gray-800">{formatHistoryStatus(entry.status)}</p>
                                <p className="text-gray-500 text-xs">{formatDateTime(entry.changed_at)}</p>
                                {entry.reason && (
                                  <p className="text-gray-600 text-xs mt-0.5">{entry.reason}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-0.5">Mục đích</p>
                        <p className="text-sm font-medium text-gray-700 truncate">{booking.note || "Không có ghi chú"}</p>
                      </div>

                      {(normalizedStatus === "CHO_DUYET" || normalizedStatus === "DA_DUYET") && (
                        <button
                          onClick={() => handleCancelBooking(bookingId)}
                          className="shrink-0 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm rounded-xl transition-colors"
                        >
                          Hủy yêu cầu
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}
