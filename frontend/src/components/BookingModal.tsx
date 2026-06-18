import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Clock,
  Phone,
  FileText,
  CreditCard,
  Package,
  Info,
  CheckCircle2,
  Search,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { getApiBaseUrl } from "../services/api-client";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: any;
}

export default function BookingModal({
  isOpen,
  onClose,
  room,
}: BookingModalProps) {
  // 🚀 ĐÃ NÂNG CẤP: Tách riêng Ngày bắt đầu và Ngày kết thúc
  const [formData, setFormData] = useState({
    startDate: new Date().toISOString().split("T")[0],
    startTime: "07:30",
    endDate: new Date().toISOString().split("T")[0],
    endTime: "09:30",
    phone: "",
    note: "",
  });

  const [equipments, setEquipments] = useState<any[]>([]);
  const [selectedEqs, setSelectedEqs] = useState<Record<string, any>>({});
  const [eqSearchQuery, setEqSearchQuery] = useState("");

  const [roomBookings, setRoomBookings] = useState<any[]>([]);
  const [showTimeline, setShowTimeline] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_URL = getApiBaseUrl();
  //const API_URL = "http://127.0.0.1:8000/api/v1";

  useEffect(() => {
    if (isOpen && room) {
      fetch(`${API_URL}/equipments`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setEquipments(data);
        })
        .catch((err) => console.error("Lỗi tải thiết bị:", err));

      fetch(`${API_URL}/bookings`)
        .then((res) => res.json())
        .then((data) => {
          const allBookings = Array.isArray(data) ? data : data.data || [];
          const filtered = allBookings.filter(
            (b: any) =>
              (b.room_id === room.id ||
                b.room_id === room._id ||
                b.roomId === room.id) &&
              b.status !== "cancelled",
          );
          setRoomBookings(filtered);
        })
        .catch((err) => console.error("Lỗi tải lịch phòng:", err));

      const draftStr = localStorage.getItem("booking_draft");
      if (draftStr) {
        try {
          const draft = JSON.parse(draftStr);
          if (
            draft.room &&
            (draft.room.id === room.id || draft.room._id === room._id)
          ) {
            if (draft.formData) setFormData(draft.formData);
            if (draft.selectedEqs) setSelectedEqs(draft.selectedEqs);
          }
          localStorage.removeItem("booking_draft");
        } catch (e) {}
      } else {
        setSelectedEqs({});
        setFormData({
          startDate: new Date().toISOString().split("T")[0],
          startTime: "07:30",
          endDate: new Date().toISOString().split("T")[0],
          endTime: "09:30",
          phone: "",
          note: "",
        });
      }

      setEqSearchQuery("");
      setShowTimeline(false);
      setErrorMsg("");
      setIsSuccess(false);
    }
  }, [isOpen, room]);

  useEffect(() => {
    if (errorMsg) setErrorMsg("");
  }, [formData, selectedEqs]);

  if (!isOpen || !room) return null;

  const timeToMins = (timeStr: string) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };

  const minsToTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = Math.floor(mins % 60);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  // 🚀 ĐÃ NÂNG CẤP: Tính tổng thời gian dựa trên cả Ngày và Giờ
  const getDurationHours = () => {
    const start = new Date(`${formData.startDate}T${formData.startTime}`);
    const end = new Date(`${formData.endDate}T${formData.endTime}`);
    const diffMins = (end.getTime() - start.getTime()) / 60000;
    return diffMins > 0 ? diffMins / 60 : 0;
  };

  const calculateEstimate = () => {
    const hours = getDurationHours();
    const roomPrice = Number(room.pricePerHour || room.price || 0);
    const roomTotal = hours * roomPrice;

    let eqTotal = 0;
    Object.values(selectedEqs).forEach((eq: any) => {
      eqTotal += eq.quantity * (eq.price || 0);
    });

    return roomTotal + eqTotal;
  };

  const handleToggleEquipment = (eq: any, availableQty: number) => {
    const eqId = eq.id || eq._id;
    const currentList = { ...selectedEqs };

    const eqPrice = Number(
      eq.pricePerHour || eq.price_per_hour || eq.price || 0,
    );

    if (currentList[eqId]) {
      delete currentList[eqId];
    } else {
      currentList[eqId] = {
        name: eq.name,
        quantity: 1,
        max: availableQty,
        price: eqPrice,
      };
    }
    setSelectedEqs(currentList);
  };

  const updateEqQuantity = (eqId: string, delta: number) => {
    const currentList = { ...selectedEqs };
    if (currentList[eqId]) {
      const nextQty = currentList[eqId].quantity + delta;
      if (nextQty >= 1 && nextQty <= currentList[eqId].max) {
        currentList[eqId].quantity = nextQty;
        setSelectedEqs(currentList);
      }
    }
  };

  const handleSubmit = async () => {
    setErrorMsg("");
    const token = localStorage.getItem("access_token");

    if (!token) {
      setErrorMsg("Vui lòng đăng nhập để tiếp tục đặt phòng!");
      const draftData = { room, formData, selectedEqs };
      localStorage.setItem("booking_draft", JSON.stringify(draftData));
      localStorage.setItem("redirect_after_login", window.location.pathname);
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
      return;
    }

    const hours = getDurationHours();
    if (hours <= 0)
      return setErrorMsg("Thời gian kết thúc phải sau thời gian bắt đầu!");
    if (hours < 0.5) return setErrorMsg("Thời gian mượn tối thiểu là 30 phút!");
    if (!formData.phone)
      return setErrorMsg("Vui lòng nhập số điện thoại để chúng tôi liên hệ!");

    const now = new Date();
    const selectedStartDateTime = new Date(
      `${formData.startDate}T${formData.startTime}`,
    );

    if (selectedStartDateTime < now) {
      return setErrorMsg(
        "Không thể đặt phòng trong quá khứ! Vui lòng chọn giờ lớn hơn hiện tại.",
      );
    }

    const borrowedEquipments = Object.entries(selectedEqs).map(
      ([id, data]) => ({
        id,
        name: data.name,
        quantity: data.quantity,
        price: data.price,
      }),
    );

    const payload = {
      room_id: room.id || room._id,
      customer_name: localStorage.getItem("user_name") || "Khách Hàng",
      user_id:
        localStorage.getItem("user_id") ||
        localStorage.getItem("userId") ||
        localStorage.getItem("user_name") ||
        "",
      phone: formData.phone,
      date: formData.startDate,
      start_time: formData.startTime,
      duration_mins: hours * 60,
      buffer_mins: 15,
      note: formData.note,
      equipments: borrowedEquipments,
    };

    try {
      setIsSubmitting(true);
      const response = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok)
        throw new Error(
          "Khung giờ này đã có người đặt, vui lòng kiểm tra lại Lịch Trống!",
        );
      setIsSuccess(true);
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredEquipments = equipments.filter((eq) =>
    (eq.name || "").toLowerCase().includes(eqSearchQuery.toLowerCase()),
  );

  const renderMiniTimeline = () => {
    const startHour = 0;
    const endHour = 24;
    const totalMins = 24 * 60;
    // Timeline sẽ hiển thị lịch của Ngày Bắt Đầu
    const todaysBookings = roomBookings.filter(
      (b) => b.date === formData.startDate,
    );

    return (
      <div className="mt-4 p-4 bg-white border border-violet-100 rounded-xl shadow-inner animate-in slide-in-from-top-2">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
          Tình trạng phòng ngày{" "}
          {formData.startDate.split("-").reverse().join("/")}
        </h4>

        <div className="w-full overflow-x-auto pb-4 scrollbar-hide">
          <div className="min-w-[800px]">
            <div className="relative h-10 bg-gray-100 rounded-lg overflow-hidden flex border border-gray-200">
              {Array.from({ length: 24 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 border-r border-white/50 box-border"
                ></div>
              ))}

              {todaysBookings.map((b) => {
                const startTimeStr = b.start_time || b.startTime;
                const bStartMins = timeToMins(startTimeStr);
                const bDuration = b.duration_mins || b.durationMins || 0;
                const bBuffer = b.buffer_mins || b.bufferMins || 15;

                const startDateStr = b.date || formData.startDate;
                const startDateTime = new Date(
                  `${startDateStr}T${startTimeStr}`,
                );
                const endDateTime = new Date(
                  startDateTime.getTime() + bDuration * 60000,
                );

                const endHour = endDateTime
                  .getHours()
                  .toString()
                  .padStart(2, "0");
                const endMin = endDateTime
                  .getMinutes()
                  .toString()
                  .padStart(2, "0");
                const endTimeStr = `${endHour}:${endMin}`;

                const isNextDay =
                  startDateTime.getDate() !== endDateTime.getDate() ||
                  startDateTime.getMonth() !== endDateTime.getMonth();
                const endDateDisplay = isNextDay
                  ? ` (${endDateTime.getDate().toString().padStart(2, "0")}/${(endDateTime.getMonth() + 1).toString().padStart(2, "0")})`
                  : "";

                const leftPct = (bStartMins / totalMins) * 100;
                const widthPct = Math.min(
                  (bDuration / totalMins) * 100,
                  100 - leftPct,
                );
                const bufferWidthPct = Math.min(
                  (bBuffer / totalMins) * 100,
                  100 - (leftPct + widthPct),
                );

                return (
                  <React.Fragment key={b.id || b._id}>
                    <div
                      className="absolute top-0 bottom-0 bg-red-500/90 border-x border-red-600 flex items-center justify-center overflow-hidden z-10 shadow-sm transition-all hover:brightness-110"
                      style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                      title={`Đã đặt: ${startTimeStr} - ${endTimeStr}${endDateDisplay} (${bDuration} phút)`}
                    >
                      {widthPct > 4 && (
                        <span className="text-[10px] sm:text-xs font-black text-white whitespace-nowrap px-1 drop-shadow-md">
                          {startTimeStr} - {endTimeStr}
                          {endDateDisplay}
                        </span>
                      )}
                    </div>
                    <div
                      className="absolute top-0 bottom-0 bg-amber-300/60 z-0"
                      style={{
                        left: `${leftPct + widthPct}%`,
                        width: `${bufferWidthPct}%`,
                      }}
                      title="Dọn dẹp (15p)"
                    />
                  </React.Fragment>
                );
              })}
            </div>

            <div className="relative h-6 mt-1.5 text-[10px] text-gray-400 font-bold w-full">
              {Array.from({ length: 25 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0"
                  style={{
                    left: `${(i / 24) * 100}%`,
                    transform: "translateX(-50%)",
                  }}
                >
                  {i === 24 ? "24:00" : `${i.toString().padStart(2, "0")}:00`}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-2 text-[11px] font-bold text-gray-500 justify-end">
          <span className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded-sm"></div>{" "}
            Trống
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-red-500/90 rounded-sm shadow-sm"></div>{" "}
            Đã đặt
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-amber-300/60 rounded-sm"></div> Dọn dẹp
          </span>
        </div>
      </div>
    );
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div
          className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col items-center p-8 text-center animate-in zoom-in-95"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-5 shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-2">
            Đặt phòng thành công!
          </h3>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            Yêu cầu của bạn đã được gửi hệ thống. Vui lòng chờ Admin phê duyệt
            đơn nhé!
          </p>
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-black rounded-xl transition-all shadow-lg shadow-violet-600/30 active:scale-95"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-violet-700 p-5 flex justify-between items-center text-white shrink-0">
          <div>
            <h3 className="font-black text-xl">
              Đặt phòng: {room.name || room.title}
            </h3>
            <p className="text-violet-200 text-sm font-medium mt-1">
              Sức chứa: {room.capacity} người • Giá:{" "}
              {Number(room.pricePerHour || room.price || 0).toLocaleString()}
              đ/giờ
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-violet-800 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          <div className="bg-violet-50/50 p-5 rounded-2xl border border-violet-100">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-violet-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-violet-500" /> Thời gian sử
                dụng
              </h4>
              <button
                onClick={() => setShowTimeline(!showTimeline)}
                className="text-xs font-bold text-violet-600 bg-violet-100 hover:bg-violet-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
              >
                {showTimeline ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                Xem Lịch Trống
              </button>
            </div>

            {/* 🚀 ĐÃ NÂNG CẤP: Lưới 2x2 cho Ngày và Giờ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                    Từ Ngày *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-violet-500 text-sm"
                  />
                </div>
                <div className="w-28">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                    Từ Giờ *
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                    className="w-full px-2 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-violet-500 text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                    Đến Ngày *
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    min={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-violet-500 text-sm"
                  />
                </div>
                <div className="w-28">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                    Đến Giờ *
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                    className="w-full px-2 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-violet-500 text-sm"
                  />
                </div>
              </div>
            </div>

            {getDurationHours() > 0 && (
              <p className="text-xs font-bold text-violet-600 mt-3 flex items-center gap-1">
                <Info className="w-4 h-4" /> Tổng thời lượng:{" "}
                {getDurationHours().toFixed(1)} giờ
              </p>
            )}

            {showTimeline && renderMiniTimeline()}
          </div>

          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <h4 className="font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-gray-500" /> Thiết bị mượn kèm
              </h4>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm tên thiết bị..."
                  value={eqSearchQuery}
                  onChange={(e) => setEqSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-violet-500 transition-colors"
                />
              </div>
            </div>

            {equipments.length === 0 ? (
              <p className="text-sm text-gray-500 italic bg-gray-50 p-4 rounded-xl border border-gray-100">
                Đang tải danh sách thiết bị...
              </p>
            ) : filteredEquipments.length === 0 ? (
              <p className="text-sm text-gray-500 italic bg-gray-50 p-6 rounded-xl border border-gray-100 text-center font-medium">
                Không tìm thấy thiết bị nào khớp với "{eqSearchQuery}"
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2">
                {filteredEquipments.map((eq) => {
                  const eqId = eq.id || eq._id;
                  const availableQty =
                    (eq.totalQuantity || 0) - (eq.inUseQuantity || 0);
                  const isOutOfStock = availableQty <= 0;
                  const isSelected = !!selectedEqs[eqId];

                  return (
                    <div
                      key={eqId}
                      className={`flex flex-col justify-between p-3 rounded-xl border transition-colors ${isSelected ? "bg-violet-50 border-violet-300" : "bg-white border-gray-200 hover:border-violet-200"} ${isOutOfStock ? "opacity-50" : ""}`}
                    >
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isOutOfStock && !isSelected}
                          onChange={() =>
                            handleToggleEquipment(eq, availableQty)
                          }
                          className="w-4 h-4 mt-0.5 text-violet-600 rounded border-gray-300 focus:ring-violet-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-1">
                            <span className="text-sm font-bold text-gray-900 line-clamp-1">
                              {eq.name}
                            </span>
                            {(() => {
                              const displayPrice = Number(
                                eq.pricePerHour ||
                                  eq.price_per_hour ||
                                  eq.price ||
                                  0,
                              );
                              if (displayPrice > 0) {
                                return (
                                  <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                                    {displayPrice.toLocaleString("vi-VN")}đ/h
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </div>
                          <p
                            className={`text-xs mt-0.5 font-semibold ${isOutOfStock ? "text-red-500" : "text-green-600"}`}
                          >
                            {isOutOfStock
                              ? "Đã hết hàng"
                              : `Còn trống: ${availableQty}`}
                          </p>
                        </div>
                      </label>

                      {isSelected && (
                        <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-violet-100">
                          <span className="text-xs text-gray-500 font-medium">
                            Số lượng:
                          </span>
                          <button
                            type="button"
                            onClick={() => updateEqQuantity(eqId, -1)}
                            className="w-6 h-6 bg-white border border-gray-200 rounded text-gray-700 font-black flex items-center justify-center hover:bg-gray-100"
                          >
                            -
                          </button>
                          <span className="text-sm font-black w-4 text-center text-violet-700">
                            {selectedEqs[eqId].quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateEqQuantity(eqId, 1)}
                            disabled={
                              selectedEqs[eqId].quantity >= availableQty
                            }
                            className="w-6 h-6 bg-violet-100 disabled:opacity-50 rounded text-violet-700 font-black flex items-center justify-center hover:bg-violet-200"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-bold text-gray-900 mb-2 text-sm flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-gray-500" /> Số điện thoại *
              </h4>
              <input
                type="tel"
                placeholder="VD: 0901234567"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-violet-500 text-sm"
              />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-2 text-sm flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-gray-500" /> Ghi chú mượn
              </h4>
              <input
                type="text"
                placeholder="VD: Học nhóm..."
                value={formData.note}
                onChange={(e) =>
                  setFormData({ ...formData, note: e.target.value })
                }
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-violet-500 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border-t border-gray-200 flex flex-col shrink-0">
          {errorMsg && (
            <div className="bg-red-50 text-red-600 p-3 mx-6 mt-4 rounded-xl text-sm font-bold flex items-center gap-2 animate-in slide-in-from-top-2 border border-red-100">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </div>
          )}

          <div className="p-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
              <div className="w-10 h-10 bg-violet-100 text-violet-600 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  Tổng tạm tính
                </p>
                <p className="text-xl font-black text-violet-600 leading-none mt-0.5">
                  {calculateEstimate().toLocaleString()}đ
                </p>
              </div>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <button
                onClick={onClose}
                className="flex-1 md:flex-none px-6 py-2.5 font-bold text-gray-500 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 md:flex-none px-8 py-2.5 bg-violet-700 hover:bg-violet-800 disabled:opacity-70 disabled:cursor-not-allowed text-white font-black rounded-xl shadow-lg shadow-violet-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" /> Gửi yêu cầu
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
