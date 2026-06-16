"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  Lock,
  PlusCircle,
  ArrowLeft,
  RotateCcw,
  Info,
  Loader2,
  RefreshCw,
  GitBranch,
  ChevronDown,
} from "lucide-react";
import { getMyBookings, cancelMyBooking, Booking } from "../../../../services/booking";

type FilterTab =
  | "ALL"
  | "CHO_DUYET"
  | "DA_DUYET"
  | "DA_TU_CHOI"
  | "DA_XONG"
  | "DANG_MUON"
  | "DA_HUY";

type StatusConfig = {
  text: string;
  color: string;
  bgColor: string;
  icon: React.ElementType;
};

const STATUS_MAP: Record<string, StatusConfig> = {
  // --- Cũ ---
  pending: {
    text: "Chờ duyệt",
    color: "text-amber-600",
    bgColor: "bg-amber-50 border-amber-200",
    icon: AlertTriangle,
  },
  confirmed: {
    text: "Đã duyệt",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 border-emerald-200",
    icon: CheckCircle2,
  },
  cancelled: {
    text: "Đã hủy",
    color: "text-red-600",
    bgColor: "bg-red-50 border-red-200",
    icon: XCircle,
  },
  // --- Mới ---
  CHO_DUYET: {
    text: "Chờ duyệt",
    color: "text-amber-600",
    bgColor: "bg-amber-50 border-amber-200",
    icon: AlertTriangle,
  },
  DA_DUYET: {
    text: "Đã duyệt",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 border-emerald-200",
    icon: CheckCircle2,
  },
  DANG_MUON: {
    text: "Đang mượn",
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200",
    icon: Loader2,
  },
  DA_TU_CHOI: {
    text: "Bị từ chối",
    color: "text-red-600",
    bgColor: "bg-red-50 border-red-200",
    icon: XCircle,
  },
  DA_XONG: {
    text: "Đã xong",
    color: "text-slate-600",
    bgColor: "bg-slate-50 border-slate-200",
    icon: CheckCircle2,
  },
  DA_HUY: {
    text: "Đã hủy",
    color: "text-red-600",
    bgColor: "bg-red-50 border-red-200",
    icon: XCircle,
  },
};

const TABS: { id: FilterTab; label: string }[] = [
  { id: "ALL", label: "Tất cả" },
  { id: "CHO_DUYET", label: "Chờ duyệt" },
  { id: "DA_DUYET", label: "Đã duyệt" },
  { id: "DANG_MUON", label: "Đang mượn" },
  { id: "DA_XONG", label: "Đã xong" },
  { id: "DA_TU_CHOI", label: "Bị từ chối" },
  { id: "DA_HUY", label: "Đã hủy" },
];

function computeEndTime(startTime: string,
  durationMins: number,
  bufferMins: number = 0): string {
  if (!startTime) return "--:--";
  const parts = startTime.split(":");
  if (parts.length < 2) return "--:--";
  const totalMins =
    parseInt(parts[0]) * 60 +
    parseInt(parts[1]) +
    durationMins +
    bufferMins;
  const h = Math.floor(totalMins / 60) % 24;
  const m = totalMins % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export default function UserBookingHistoryPage() {
  const router = useRouter();
  const [, forceUpdate] = useState(0);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(
    null,
  );
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [expandedTimeline, setExpandedTimeline] = useState<string | null>(null);

  const getUserId = useCallback((): string => {
    // Ưu tiên user_id từ localStorage (nếu có)
    return (
      localStorage.getItem("user_id") ||
      localStorage.getItem("userId") ||
      localStorage.getItem("user_name") ||
      ""
    );
  }, []);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    const userId = getUserId();
    if (!userId) {
      setIsLoggedIn(false);
      setLoading(false);
      return;
    }

    try {
      const data = await getMyBookings(userId);
      setBookings(data);
      setIsLoggedIn(true);
      console.log(
        "BOOKINGS DATA",
        JSON.stringify(data, null, 2)
      );
    } catch (err: any) {
      console.error("Lỗi tải lịch sử:", err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [getUserId]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    const timer = setInterval(() => {
      forceUpdate((v) => v + 1);
    }, 60000); // mỗi phút
  
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 3500);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const handleCancel = async (booking: Booking) => {
    const reason = window.prompt(
      "Bạn có muốn nhập lý do hủy không? (Bỏ trống = hủy không cần lý do)",
    );
    if (reason === null) return; // user nhấn Cancel

    setCancellingId(booking.id || booking._id || "");

    try {
      await cancelMyBooking(booking.id || booking._id || "", reason);
      setToastMsg({ text: "Đã hủy đơn thành công!", type: "success" });
      loadBookings();
    } catch (err: any) {
      setToastMsg({ text: err.message || "Không thể hủy đơn", type: "error" });
    } finally {
      setCancellingId(null);
    }
  };

  const normalizeStatus = (status: string) => {
    const s = (status || "").toUpperCase();
  
    if (s === "PENDING" || s === "CHO_DUYET") return "CHO_DUYET";
    if (s === "CONFIRMED" || s === "DA_DUYET") return "DA_DUYET";
    if (s === "DANG_MUON") return "DANG_MUON";
    if (s === "DA_XONG") return "DA_XONG";
    if (s === "DA_TU_CHOI" || s === "REJECTED") return "DA_TU_CHOI";
    if (s === "DA_HUY" || s === "CANCELLED") return "DA_HUY";
  
    return "CHO_DUYET"; // fallback an toàn
  };

  // const getDisplayStatus = (booking: Booking) => {
  //   const status = normalizeStatus(booking.status);
  
  //   // giữ nguyên các trạng thái cuối
  //   if (
  //     ["CHO_DUYET", "DA_HUY", "DA_TU_CHOI"].includes(status)
  //   ) {
  //     return status;
  //   }
  
  //   const now = new Date();
  
  //   const start = new Date(
  //     `${booking.date}T${booking.start_time}`
  //   );
  
  //   const end = new Date(
  //     start.getTime() +
  //       booking.duration_mins * 60 * 1000
  //   );
  
  //   if (now < start) {
  //     return "DA_DUYET";
  //   }
  
  //   if (now >= start && now <= end) {
  //     return "DANG_MUON";
  //   }
  
  //   return "DA_XONG";
  // };

  function getRuntimeStatus(booking: Booking): string {
    const baseStatus = normalizeStatus(booking.status);
  
    // các trạng thái không được tự đổi
    if (["CHO_DUYET", "DA_TU_CHOI", "DA_HUY"].includes(baseStatus)) {
      return baseStatus;
    }
  
    const now = new Date();
  
    const start = new Date(
      `${booking.date}T${booking.start_time}`
    );
  
    const end = new Date(
      start.getTime() +
      (booking.duration_mins + booking.buffer_mins) * 60 * 1000
    );
  
    if (now < start) {
      return "DA_DUYET";
    }
  
    if (now >= start && now <= end) {
      return "DANG_MUON";
    }
  
    return "DA_XONG";
  }

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === "ALL") return true;
    return getRuntimeStatus(b) === activeTab;
  });

  const getStatusInfo = (status: string): StatusConfig => {
    const key = normalizeStatus(status);
  
    return (
      STATUS_MAP[key] ?? {
        text: key,
        color: "text-gray-600",
        bgColor: "bg-gray-50 border-gray-200",
        icon: Info,
      }
    );
  };

  const getTimeline = (booking: Booking) => {
    const s = getRuntimeStatus(booking);
    const steps = [
      {
        label: "Đã gửi yêu cầu",
        done: true,
        // active: ["PENDING", "CHO_DUYET", "CONFIRMED"].includes(s),
        active: s === "CHO_DUYET" || s === "DA_DUYET",
        time: booking.created_at,
        icon: GitBranch,
      },
      // {
      //   label: "Đã duyệt",
      //   done: ["CONFIRMED", "DA_DUYET", "DANG_MUON", "DA_XONG", "DA_HUY", "CANCELLED"].includes(s),
      //   active: ["CONFIRMED", "DA_DUYET"].includes(s),
      //   time: ["CONFIRMED", "DA_DUYET"].includes(s)
      //     ? booking.updated_at
      //     : undefined,
      //   icon: CheckCircle2,
      // },
      // {
      //   label: "Đã duyệt",
      //   done: ["DA_DUYET", "DANG_MUON", "DA_XONG", "DA_HUY", "DA_TU_CHOI"].includes(s),
      //   active: s === "DA_DUYET",
      //   time: s === "DA_DUYET" ? booking.updated_at : undefined,
      //   icon: CheckCircle2,
      // },
      {
        label: "Đã duyệt",
        done: ["DA_DUYET", "DANG_MUON", "DA_XONG"].includes(s),
        active: s === "DA_DUYET",
        time: ["DA_DUYET", "DANG_MUON", "DA_XONG"].includes(s)
          ? booking.updated_at
          : undefined,
        icon: CheckCircle2,
      },
      {
        label: "Đang mượn",
        done: ["DANG_MUON", "DA_XONG"].includes(s),
        active: s === "DANG_MUON",
        icon: Loader2,
      },
      {
        label: "Hoàn tất",
        done: s === "DA_XONG",
        active: s === "DA_XONG",
        icon: CheckCircle2,
      },
    ];

      // if (["REJECTED", "DA_TU_CHOI", "CANCELLED", "DA_HUY"].includes(s)) {
      //   steps.push({
      //     label: s === "CANCELLED" || s === "DA_HUY" ? "Đã hủy" : "Bị từ chối",
      //     done: true,
      //     active: false,
      //     time: booking.updated_at,
      //     icon: XCircle,
      //   });
      // }
      // if (["DA_TU_CHOI", "DA_HUY"].includes(s)) {
      //   steps.push({
      //     label: s === "DA_HUY" ? "Đã hủy" : "Bị từ chối",
      //     done: true,
      //     active: false,
      //     time: booking.updated_at,
      //     icon: XCircle,
      //   });
      // }

      if (s === "DA_TU_CHOI") {
        return [
          steps[0], // Đã gửi yêu cầu
          {
            label: "Bị từ chối",
            done: true,
            active: false,
            time: booking.updated_at,
            icon: XCircle,
          },
        ];
      }
      
      // if (s === "DA_HUY") {
      //   steps.push({
      //     label: "Đã hủy",
      //     done: true,
      //     active: false,
      //     time: booking.updated_at,
      //     icon: XCircle,
      //   });
      // }

      if (s === "DA_HUY") {
        return [
          steps[0],
          {
            label: "Đã hủy",
            done: true,
            active: false,
            time: booking.updated_at,
            icon: XCircle,
          },
        ];
      }

    return steps;
  };

  const formatTime = (iso: string | undefined) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  // const canCancel = (booking: Booking) => {
  //   const status = getRuntimeStatus(booking);
  //   if (!["CHO_DUYET", "DA_DUYET", "DANG_MUON"].includes(status)) return false;
  //   const cancellableStatuses = ["PENDING", "CONFIRMED", "CHO_DUYET", "DA_DUYET", "DANG_MUON"];
  //   if (!cancellableStatuses.includes(status)) return false;

  //   const now = new Date();
  //   const bookingDate = new Date(`${booking.date}T${booking.start_time}`);
  //   return bookingDate.getTime() > Date.now();
  // };

  const canCancel = (booking: Booking) => {
    const status = getRuntimeStatus(booking);
  
    if (!["CHO_DUYET", "DA_DUYET"].includes(status))
      return false;
  
    const bookingDate = new Date(
      `${booking.date}T${booking.start_time}`
    );
  
    return bookingDate.getTime() > Date.now();
  };

  const tabsForDisplay = TABS.map((tab) => {
    const count =
      tab.id === "ALL"
        ? bookings.length
        : bookings.filter((b) => getRuntimeStatus(b) === tab.id).length;
    return { ...tab, count };
  });

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      {/* TOAST */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[9999] px-6 py-3 rounded-2xl shadow-xl font-bold text-sm flex items-center gap-2 ${
              toastMsg.type === "success"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {toastMsg.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 shrink-0" />
            )}
            {toastMsg.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-violet-600 font-bold mb-4 transition-colors w-fit group outline-none"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Quay lại
        </button>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900">
              Lịch sử Đặt phòng
            </h1>
            <p className="text-gray-500 mt-2">
              Theo dõi trạng thái và quản lý các yêu cầu mượn phòng Lab.
            </p>
          </div>
          <button
            onClick={loadBookings}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-violet-50 hover:bg-violet-100 text-violet-600 font-bold text-sm rounded-xl border border-violet-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
            />
            Làm mới
          </button>
        </div>
      </div>

      {/* LOADING */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
        </div>
      ) : !isLoggedIn ? (
        /* CHƯA ĐĂNG NHẬP */
        <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto shadow-sm">
          <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Yêu cầu đăng nhập
          </h3>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Vui lòng đăng nhập để xem lịch sử đặt phòng của bạn.
          </p>
          <button
            onClick={() => (window.location.href = "/login")}
            className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-black text-sm rounded-xl transition-all shadow-lg shadow-violet-600/20 active:scale-95"
          >
            Đăng nhập ngay
          </button>
        </div>
      ) : (
        <>
          {/* TABS */}
          <div className="flex overflow-x-auto gap-2 mb-6 pb-2 scrollbar-hide">
            {tabsForDisplay.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-colors border flex items-center gap-2 text-sm ${
                  activeTab === tab.id
                    ? "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-600/20"
                    : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {tab.label}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.id
                      ? "bg-violet-500 text-white"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* DANH SÁCH TRỐNG */}
          {filteredBookings.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
              <Calendar className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                Không có đơn nào
              </h3>
              <p className="text-gray-500 mb-6">
                {activeTab === "ALL"
                  ? "Bạn chưa có yêu cầu đặt phòng nào."
                  : "Không có đơn nào ở trạng thái này."}
              </p>
              {activeTab === "ALL" && (
                <button
                  onClick={() =>
                    (window.location.href = "/dashboard/user/labs")
                  }
                  className="px-5 py-2.5 bg-violet-50 hover:bg-violet-100 text-violet-600 border border-violet-200 font-bold text-sm rounded-xl transition-colors flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" /> Đặt phòng ngay
                </button>
              )}
            </div>
          ) : (
            /* GRID ĐƠN */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <AnimatePresence>
                {filteredBookings.map((booking) => {
                  const runtimeStatus = getRuntimeStatus(booking);
                  const si = getStatusInfo(runtimeStatus);
                  const StatusIcon = si.icon;
                  const timeline = getTimeline(booking);
                  const bookingId = booking.id || booking._id || "";
                  const endTime = computeEndTime(
                    booking.start_time,
                    booking.duration_mins,
                    booking.buffer_mins
                  );
                  console.log("BOOKING DEBUG:", {
                    id: booking.id,
                    status: booking.status,
                    rejection_reason: booking.rejection_reason,
                    cancel_reason: (booking as any).cancel_reason,
                  });
                  const hasRejection = !!(
                    booking.rejection_reason &&
                    ["DA_TU_CHOI", "DA_HUY"].includes(
                      normalizeStatus(booking.status)
                    )
                  );

                  return (
                    <motion.div
                      key={bookingId}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col"
                    >
                      {/* TOP ROW: Tên phòng + Badge trạng thái */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="min-w-0 mr-3">
                          <h3 className="text-base font-black text-gray-900 truncate">
                            {booking.room?.name || "Phòng Lab"}
                          </h3>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            {booking.room?.name ? `${booking.room.name} — ` : ""}
                            {booking.room?.building || "—"},{" "}
                            {booking.room?.floor ? `Tầng ${booking.room.floor}` : "—"}
                            {booking.room?.type ? ` • ${booking.room.type}` : ""}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${si.bgColor} ${si.color}`}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          {si.text}
                        </span>
                      </div>

                      {/* THÔNG TIN NGÀY/GIỜ */}
                      <div className="bg-gray-50 rounded-2xl p-3.5 mb-3 grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                            Ngày
                          </p>
                          <p className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                            {formatDate(booking.date)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                            Giờ
                          </p>
                          <p className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                            {booking.start_time} → {endTime}
                          </p>
                        </div>
                      </div>

                      {/* THIẾT BỊ MƯỢN KÈM */}
                      {booking.equipments && booking.equipments.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-bold text-gray-400 uppercase mb-1.5">
                            Thiết bị kèm
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {booking.equipments.map((eq, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 bg-violet-50 text-violet-700 px-2 py-1 rounded-md text-xs font-bold border border-violet-100"
                              >
                                <Package className="w-3 h-3" />
                                {eq.name} (x{eq.quantity})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* LÝ DO TỪ CHỐI / HỦY */}
                      {hasRejection && booking.rejection_reason && (
                        <div className="mb-3 bg-red-50 border border-red-100 rounded-xl p-3">
                          <p className="text-xs font-bold text-red-500 uppercase mb-1">
                            Lý do
                          </p>
                          <p className="text-sm text-red-700 leading-relaxed">
                            {booking.rejection_reason}
                          </p>
                        </div>
                      )}

                      {/* TIMELINE THEO DÕI */}
                      <div className="mb-3">
                        <button
                          onClick={() =>
                            setExpandedTimeline(
                              expandedTimeline === bookingId
                                ? null
                                : bookingId,
                            )
                          }
                          className="w-full flex items-center justify-between text-xs font-bold text-gray-400 uppercase mb-2 hover:text-violet-600 transition-colors"
                        >
                          <span>Theo dõi trạng thái</span>
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-200 ${
                              expandedTimeline === bookingId
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                        </button>
                        <AnimatePresence>
                          {expandedTimeline === bookingId && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="space-y-2 pt-1">
                                {timeline.map((step, idx) => {
                                  const Icon = step.icon;
                                  const isLast = idx === timeline.length - 1;
                                  return (
                                    <div key={idx} className="flex items-start gap-2.5">
                                      <div className="flex flex-col items-center">
                                        <div
                                          className={`w-6 h-6 rounded-full flex items-center justify-center border-2 shrink-0 ${
                                            step.active
                                              ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-300"
                                              : step.done
                                                ? "bg-emerald-500 border-emerald-500 text-white"
                                                : "bg-white border-gray-200 text-gray-300"
                                          }`}
                                        >
                                          <Icon className="w-3 h-3" />
                                        </div>
                                        {!isLast && (
                                          <div
                                            className={`w-0.5 flex-1 my-0.5 ${
                                              step.done ? "bg-emerald-400" : "bg-gray-200"
                                            }`}
                                          />
                                        )}
                                      </div>
                                      <div className="min-w-0 pb-1">
                                        <p
                                          className={`text-xs font-bold leading-tight ${
                                            step.active
                                              ? "text-emerald-700"
                                              : step.done
                                                ? "text-emerald-700"
                                                : "text-gray-400"
                                          }`}
                                        >
                                          {step.label}
                                        </p>
                                        {step.time && (
                                          <p className="text-xs text-gray-400 mt-0.5">
                                            {formatTime(step.time as unknown as string)}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* BOTTOM ROW: Mục đích + Actions */}
                      <div className="mt-auto pt-3.5 border-t border-gray-100 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-400 uppercase mb-0.5">
                            Mục đích
                          </p>
                          <p className="text-sm text-gray-700 truncate max-w-[160px]">
                            {booking.note || "—"}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setSelectedBooking(booking)}
                            className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-colors"
                            title="Xem chi tiết"
                          >
                            <Info className="w-4.5 h-4.5" />
                          </button>

                          {canCancel(booking) && (
                            <button
                              onClick={() => handleCancel(booking)}
                              disabled={cancellingId === bookingId}
                              className="flex items-center gap-1.5 px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm rounded-xl transition-colors disabled:opacity-50"
                            >
                              {cancellingId === bookingId ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5" />
                              )}
                              Hủy đơn
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      {/* MODAL CHI TIẾT */}
      <AnimatePresence>
        {selectedBooking && (
          <div
            className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setSelectedBooking(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* HEADER */}
              <div className="bg-violet-600 p-5 flex justify-between items-center text-white">
                <h3 className="font-black text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Chi tiết đơn đặt phòng
                </h3>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="hover:bg-violet-500 p-1 rounded-full transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* BODY */}
              <div className="p-6 space-y-4">
                {/* Phòng + Trạng thái */}
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                      Phòng
                    </p>
                    <p className="font-black text-gray-900 text-lg">
                      {selectedBooking.room?.name || "Phòng Lab"}
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {selectedBooking.room?.building || "—"} -{" "}
                      {selectedBooking.room?.floor || "—"}
                    </p>
                  </div>
                  {(() => {
                    const si = getStatusInfo(
                      getRuntimeStatus(selectedBooking)
                    );
                    const Icon = si.icon;
                    return (
                      <span
                        className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold border ${si.bgColor} ${si.color}`}
                      >
                        <Icon className="w-4 h-4" />
                        {si.text}
                      </span>
                    );
                  })()}
                </div>

                {/* Ngày + Giờ */}
                <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-2xl p-4">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                      Ngày sử dụng
                    </p>
                    <p className="font-bold text-gray-900">
                      {formatDate(selectedBooking.date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                      Thời gian
                    </p>
                    <p className="font-bold text-gray-900">
                      {selectedBooking.start_time} →{" "}
                      {computeEndTime(
                        selectedBooking.start_time,
                        selectedBooking.duration_mins,
                        selectedBooking.buffer_mins
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                      Thời lượng
                    </p>
                    <p className="font-bold text-gray-900">
                      {selectedBooking.duration_mins} phút
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                      Buffer
                    </p>
                    <p className="font-bold text-gray-900">
                      {selectedBooking.buffer_mins} phút
                    </p>
                  </div>
                </div>

                {/* Thiết bị */}
                {selectedBooking.equipments &&
                  selectedBooking.equipments.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase mb-2">
                        Thiết bị mượn kèm
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedBooking.equipments.map((eq, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 px-3 py-1.5 rounded-xl text-sm font-bold border border-violet-100"
                          >
                            <Package className="w-4 h-4" />
                            {eq.name} (x{eq.quantity})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Mục đích */}
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                    Mục đích
                  </p>
                  <p className="text-gray-700">
                    {selectedBooking.note || "—"}
                  </p>
                </div>

                {/* Lý do từ chối */}
                {selectedBooking.rejection_reason &&
              ["DA_TU_CHOI", "DA_HUY"].includes(normalizeStatus(selectedBooking.status)) && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                <p className="text-xs font-bold text-red-500 uppercase mb-1">
                  Lý do từ chối / hủy
                </p>
                <p className="text-sm text-red-700 leading-relaxed">
                  {selectedBooking.rejection_reason}
                </p>
              </div>
            )}

                {/* TIMELINE THEO DÕI */}
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase mb-3">
                    Theo dõi trạng thái
                  </p>
                  <div className="space-y-3">
                    {getTimeline(selectedBooking).map((step, idx) => {
                      const Icon = step.icon;
                      const isLast = idx === getTimeline(selectedBooking).length - 1;
                      return (
                        <div key={idx} className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center border-2 shrink-0 ${
                                step.active
                                  ? "bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-300"
                                  : step.done
                                    ? "bg-emerald-500 border-emerald-500 text-white"
                                    : "bg-white border-gray-200 text-gray-300"
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            {!isLast && (
                              <div
                                className={`w-0.5 flex-1 my-0.5 min-h-[20px] ${
                                  step.done ? "bg-emerald-400" : "bg-gray-200"
                                }`}
                              />
                            )}
                          </div>
                          <div className="min-w-0 pt-0.5">
                            <p
                              className={`text-sm font-bold leading-tight ${
                                step.active
                                  ? "text-violet-700"
                                  : step.done
                                    ? "text-emerald-700"
                                    : "text-gray-400"
                              }`}
                            >
                              {step.label}
                            </p>
                            {step.time && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                {formatTime(step.time as unknown as string)}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Thời gian tạo */}
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                    Ngày tạo đơn
                  </p>
                  <p className="text-gray-700">
                    {selectedBooking.created_at
                      ? new Date(selectedBooking.created_at).toLocaleString(
                          "vi-VN",
                        )
                      : "—"}
                  </p>
                </div>
              </div>

              {/* FOOTER */}
              <div className="p-5 border-t border-gray-100 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl transition-colors"
                >
                  Đóng
                </button>
                {canCancel(selectedBooking) && (
                  <button
                    onClick={() => {
                      const bk = selectedBooking;
                      setSelectedBooking(null);
                      setTimeout(() => handleCancel(bk), 100);
                    }}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm rounded-xl transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Hủy đơn
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
