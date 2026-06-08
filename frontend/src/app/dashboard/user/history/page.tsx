"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  CreditCard,
  Package,
} from "lucide-react";

type FilterTab = "ALL" | "PENDING" | "CONFIRMED" | "CANCELLED";

export default function UserBookingHistoryPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const fetchMyBookings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      // Gọi API lấy danh sách đơn đặt phòng của User hiện tại
      const response = await fetch(
        "https://booklab247.onrender.com/api/v1/bookings/my-bookings",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        // Giả sử API trả về mảng, nếu trả về { data: [...] } thì dùng data.data
        setBookings(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error("Lỗi khi tải lịch sử:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy yêu cầu đặt phòng này?"))
      return;

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `https://booklab247.onrender.com/api/v1/bookings/${bookingId}/cancel`,
        {
          method: "PATCH", // Hoặc PUT/DELETE tùy cấu hình Backend của bạn
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) throw new Error("Không thể hủy đơn lúc này.");

      alert("Đã hủy đơn thành công!");
      fetchMyBookings(); // Tải lại danh sách
    } catch (error: any) {
      alert(`⛔ Lỗi: ${error.message}`);
    }
  };

  // Logic lọc đơn theo Tab
  const filteredBookings = bookings.filter((b) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "PENDING") return b.status === "pending";
    if (activeTab === "CONFIRMED")
      return b.status === "confirmed" || b.status === "checked-in";
    if (activeTab === "CANCELLED") return b.status === "cancelled";
    return true;
  });

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "confirmed":
      case "checked-in":
        return {
          text: "Đã duyệt",
          color: "text-emerald-600 bg-emerald-50 border-emerald-200",
          icon: CheckCircle2,
        };
      case "pending":
        return {
          text: "Chờ duyệt",
          color: "text-amber-600 bg-amber-50 border-amber-200",
          icon: AlertTriangle,
        };
      case "cancelled":
        return {
          text: "Đã hủy",
          color: "text-red-600 bg-red-50 border-red-200",
          icon: XCircle,
        };
      default:
        return {
          text: status,
          color: "text-gray-600 bg-gray-50 border-gray-200",
          icon: Clock,
        };
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">Lịch sử Đặt phòng</h1>
        <p className="text-gray-500 mt-2">
          Theo dõi và quản lý các yêu cầu mượn phòng Lab của bạn.
        </p>
      </div>

      {/* TABS LỌC TRẠNG THÁI */}
      <div className="flex overflow-x-auto gap-2 mb-6 pb-2 scrollbar-hide">
        {[
          { id: "ALL", label: "Tất cả đơn" },
          { id: "PENDING", label: "Chờ duyệt" },
          { id: "CONFIRMED", label: "Đã duyệt" },
          { id: "CANCELLED", label: "Đã hủy" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as FilterTab)}
            className={`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-colors border ${
              activeTab === tab.id
                ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20"
                : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* DANH SÁCH ĐƠN */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
          <Calendar className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            Không có đơn nào
          </h3>
          <p className="text-gray-500">
            Bạn chưa có yêu cầu đặt phòng nào trong mục này.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence>
            {filteredBookings.map((booking) => {
              const StatusObj = getStatusDisplay(booking.status);
              const endTimeMins =
                parseInt(booking.start_time.split(":")[0]) * 60 +
                parseInt(booking.start_time.split(":")[1]) +
                booking.duration_mins;
              const endHour = Math.floor(endTimeMins / 60)
                .toString()
                .padStart(2, "0");
              const endMin = (endTimeMins % 60).toString().padStart(2, "0");

              return (
                <motion.div
                  key={booking.id || booking._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      {/* Xử lý nếu Backend join bảng Lab hoặc chỉ trả id */}
                      <h3 className="text-lg font-black text-gray-900 line-clamp-1">
                        {booking.room?.name ||
                          booking.room?.title ||
                          "Phòng Lab (Chưa rõ tên)"}
                      </h3>
                      <p className="text-sm font-medium text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-4 h-4" />{" "}
                        {booking.room?.building || "Tòa nhà"} -{" "}
                        {booking.room?.floor || "Tầng"}
                      </p>
                    </div>
                    <span
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${StatusObj.color}`}
                    >
                      <StatusObj.icon className="w-4 h-4" /> {StatusObj.text}
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4 mb-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                        Ngày sử dụng
                      </p>
                      <p className="font-bold text-gray-900 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-500" />{" "}
                        {booking.date}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                        Thời gian
                      </p>
                      <p className="font-bold text-gray-900 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />{" "}
                        {booking.start_time} - {`${endHour}:${endMin}`}
                      </p>
                    </div>
                  </div>

                  {booking.equipments && booking.equipments.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-bold text-gray-400 uppercase mb-2">
                        Thiết bị mượn kèm
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {booking.equipments.map((eq: any, i: number) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-xs font-bold border border-blue-100"
                          >
                            <Package className="w-3 h-3" /> {eq.name} (x
                            {eq.quantity})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase mb-0.5">
                        Mục đích
                      </p>
                      <p className="text-sm font-medium text-gray-700 truncate max-w-[150px]">
                        {booking.note || "Không có ghi chú"}
                      </p>
                    </div>

                    {/* Chỉ cho phép Hủy nếu đơn đang chờ duyệt */}
                    {booking.status === "pending" && (
                      <button
                        onClick={() =>
                          handleCancelBooking(booking.id || booking._id)
                        }
                        className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm rounded-xl transition-colors"
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
    </div>
  );
}
