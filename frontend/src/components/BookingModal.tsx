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
} from "lucide-react";

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
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    startTime: "07:30",
    endTime: "09:30",
    phone: "",
    note: "",
  });

  const [equipments, setEquipments] = useState<any[]>([]);
  const [selectedEqs, setSelectedEqs] = useState<Record<string, any>>({});

  // State MỚI: Dành riêng cho thanh Search thiết bị
  const [eqSearchQuery, setEqSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetch("https://booklab247.onrender.com/api/v1/equipments")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setEquipments(data);
        })
        .catch((err) => console.error("Lỗi tải thiết bị:", err));

      setSelectedEqs({});
      setEqSearchQuery(""); // Reset lại ô search mỗi khi mở Modal
    }
  }, [isOpen]);

  if (!isOpen || !room) return null;

  const getDurationHours = () => {
    const start = new Date(`${formData.date}T${formData.startTime}`);
    const end = new Date(`${formData.date}T${formData.endTime}`);
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

    if (currentList[eqId]) {
      delete currentList[eqId];
    } else {
      currentList[eqId] = {
        name: eq.name,
        quantity: 1,
        max: availableQty,
        price: eq.price || 0,
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
    const hours = getDurationHours();
    if (hours <= 0) return alert("⛔ Giờ kết thúc phải sau giờ bắt đầu!");
    if (!formData.phone) return alert("⛔ Vui lòng nhập số điện thoại!");

    const borrowedEquipments = Object.entries(selectedEqs).map(
      ([id, data]) => ({
        id: id,
        name: data.name,
        quantity: data.quantity,
        price: data.price,
      }),
    );

    const payload = {
      room_id: room.id || room._id,
      customer_name: "Kiên Lê Trung",
      phone: formData.phone,
      date: formData.date,
      start_time: formData.startTime,
      duration_mins: hours * 60,
      buffer_mins: 15,
      note: formData.note,
      equipments: borrowedEquipments,
    };

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        "https://booklab247.onrender.com/api/v1/bookings",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) throw new Error("Lỗi hệ thống, không thể đặt phòng!");

      alert("🎉 Đặt phòng thành công! Đơn của bạn đang chờ Admin duyệt.");
      onClose();
    } catch (error: any) {
      alert(`⛔ Thất bại: ${error.message}`);
    }
  };

  // Logic MỚI: Lọc danh sách thiết bị dựa trên chữ người dùng gõ
  const filteredEquipments = equipments.filter((eq) =>
    (eq.name || "").toLowerCase().includes(eqSearchQuery.toLowerCase()),
  );

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
            <h4 className="font-bold text-violet-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-violet-500" /> Thời gian sử dụng
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Ngày đặt *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Từ giờ *
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Đến giờ *
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-violet-500"
                />
              </div>
            </div>
            {getDurationHours() > 0 && (
              <p className="text-xs font-bold text-violet-600 mt-3 flex items-center gap-1">
                <Info className="w-4 h-4" /> Tổng thời lượng:{" "}
                {getDurationHours()} giờ
              </p>
            )}
          </div>

          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <h4 className="font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-gray-500" /> Thiết bị mượn kèm
              </h4>

              {/* THANH SEARCH HIỂN THỊ Ở ĐÂY */}
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
                {/* Đã thay map(equipments) thành map(filteredEquipments) */}
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
                          <span className="text-sm font-bold text-gray-900 line-clamp-1">
                            {eq.name}
                          </span>
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

        <div className="bg-slate-50 p-5 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
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
              className="flex-1 md:flex-none px-8 py-2.5 bg-violet-700 hover:bg-violet-800 text-white font-black rounded-xl shadow-lg shadow-violet-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" /> Gửi yêu cầu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
