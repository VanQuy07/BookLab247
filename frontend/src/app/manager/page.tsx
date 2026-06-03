"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, CalendarDays, LogOut,
  X, Clock, MapPin, ShieldCheck, Search, FileText, Users, Plus, ChevronLeft, ChevronRight, Package
} from "lucide-react";

import { labService } from "../../services/lab";

// ================= INTERFACES (Strict Type - Không dùng any) =================
interface ManagerRoom {
  id?: string;
  _id?: string;
  title?: string;
  name?: string;
  building?: string;
  floor?: string;
  capacity?: number | string;
}

interface EquipmentItem {
  id?: string;
  _id?: string;
  name: string;
  totalQuantity: number;
  inUseQuantity: number;
}

interface BorrowedEquipment {
  id: string;
  name: string;
  quantity: number;
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
}

type MenuTab = "dashboard" | "timeline" | "reports" | "lookup";
type TimeFilter = "today" | "yesterday" | "7days" | "month" | "custom";

const COLORS = ["#3b82f6", "#ef4444", "#f59e0b"];

// ================= DỮ LIỆU MẪU ĐẶT PHÒNG =================
const INITIAL_BOOKINGS: BookingItem[] = [
  { 
    id: "b1", roomId: "r1", customerName: "Nguyễn Văn Quý", phone: "0901234567", status: "checked-in", 
    startTime: "08:00", durationMins: 120, bufferMins: 15, note: "Khách ca sáng",
    equipments: [{ id: "eq1", name: "máy chiếu", quantity: 2 }]
  },
  { 
    id: "b2", roomId: "r2", customerName: "Lê Thị B", phone: "0987654321", status: "confirmed", 
    startTime: "13:00", durationMins: 180, bufferMins: 15, note: "Học nhóm hội thảo",
    equipments: []
  },
];

export default function ManagerDashboardPage() {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState<MenuTab>("timeline"); 
  const [loading, setLoading] = useState<boolean>(true);
  
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("today");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [rooms, setRooms] = useState<ManagerRoom[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>(INITIAL_BOOKINGS);
  const [equipments, setEquipments] = useState<EquipmentItem[]>([]);
  const [buildingFilter, setBuildingFilter] = useState<string>("all");

  // ================= STATES QUICK BOOK & VIEW BOOKING =================
  const [showQuickBook, setShowQuickBook] = useState(false);
  const [quickBookData, setQuickBookData] = useState({
    roomId: "", customerName: "", phone: "", capacity: 1, startTime: "08:00", endTime: "10:00", note: "",
    equipments: {} as Record<string, { name: string, quantity: number, max: number }>
  });

  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);

  const API_URL = "http://localhost:8000/api/v1";

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
    try {
      setLoading(true);
      const [roomsData, eqRes] = await Promise.all([
        labService.getAllLabs(),
        fetch(`${API_URL}/equipments`)
      ]);
      
      if(roomsData.length > 0) setRooms(roomsData); 
      else setRooms([
        { id: "r1", title: "FANMEETING KIENTHUHAI", building: "Khác", floor: "", capacity: 10000 },
        { id: "r2", title: "Lab Hóa - Sinh 02", building: "Tòa B", floor: "Tầng 1", capacity: 20 },
        { id: "r3", title: "Phòng VIP Học Máy (Trống)", building: "Tòa A", floor: "Tầng 2", capacity: 30 }
      ]);

      if(eqRes.ok) setEquipments(await eqRes.json());
      else setEquipments([
        { id: "eq1", name: "máy chiếu", totalQuantity: 10, inUseQuantity: 2 },
        { id: "eq2", name: "bảng viết", totalQuantity: 300, inUseQuantity: 67 }
      ]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    router.push("/login");
  };

  const timeToMins = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const minsToTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const toggleEquipment = (eqId: string, eqName: string, available: number) => {
    const currentEqs = { ...quickBookData.equipments };
    if (currentEqs[eqId]) {
      delete currentEqs[eqId];
    } else {
      currentEqs[eqId] = { name: eqName, quantity: 1, max: available };
    }
    setQuickBookData({ ...quickBookData, equipments: currentEqs });
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

  // Chuyển hàm thành async để gọi API
  const handleQuickBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. KIỂM TRA THỜI LƯỢNG
    const durationMins = timeToMins(quickBookData.endTime) - timeToMins(quickBookData.startTime);
    if(durationMins <= 0) return alert("Giờ kết thúc phải lớn hơn giờ bắt đầu!");

    // 2. KIỂM TRA QUÁ KHỨ (Ghép selectedDate và startTime)
    const bookingDateTime = new Date(`${selectedDate}T${quickBookData.startTime}`);
    const now = new Date();
    if (bookingDateTime < now) {
      return alert("⛔ LỖI THỜI GIAN!\nKhông thể đặt lịch cho một thời điểm trong quá khứ. Vui lòng chọn khung giờ khác.");
    }

    const targetId = quickBookData.roomId || rooms[0]?.id || rooms[0]?._id || "";
    
    // 3. KIỂM TRA TRÙNG LỊCH (FRONTEND VALIDATION)
    const newStart = timeToMins(quickBookData.startTime);
    const newEndWithBuffer = newStart + durationMins + 15;
    const roomBookings = bookings.filter(b => b.roomId === targetId);

    for (const existBooking of roomBookings) {
      const existStart = timeToMins(existBooking.startTime);
      const existEndMins = existStart + existBooking.durationMins;
      const existEndWithBuffer = existEndMins + (existBooking.bufferMins || 15);
      
      if (newStart < existEndWithBuffer && newEndWithBuffer > existStart) {
        const existEndTimeStr = minsToTime(existEndMins);
        const existEndBufferStr = minsToTime(existEndWithBuffer);
        
        return alert(
          `⛔ LỖI TRÙNG LỊCH PHÒNG!\n\n` +
          `Phòng này đã có lịch đặt từ ${existBooking.startTime} đến ${existEndTimeStr} ` +
          `(Dọn dẹp tới ${existEndBufferStr}).\n` +
          `Bởi khách hàng: [${existBooking.customerName}]`
        );
      }
    }

    // 4. CHUẨN BỊ DỮ LIỆU ĐỂ GỬI LÊN BACKEND
    const borrowedEquipments: BorrowedEquipment[] = Object.entries(quickBookData.equipments).map(
      ([id, data]) => ({ id, name: data.name, quantity: data.quantity })
    );

    const payload = {
      room_id: targetId,
      customer_name: quickBookData.customerName,
      phone: quickBookData.phone,
      date: selectedDate, // Phải gửi kèm ngày đang chọn
      start_time: quickBookData.startTime,
      duration_mins: durationMins,
      buffer_mins: 15,
      note: quickBookData.note || "Khách vãng lai",
      equipments: borrowedEquipments
    };

    // 5. GỌI API LƯU VÀO MONGODB
    try {
      // Hiển thị trạng thái đang xử lý (tùy chọn)
      const submitBtn = document.getElementById("btn-submit-quickbook") as HTMLButtonElement;
      if(submitBtn) { submitBtn.disabled = true; submitBtn.innerText = "Đang lưu..."; }

      const response = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // "Authorization": `Bearer ${localStorage.getItem("access_token")}` // Mở dòng này nếu API yêu cầu token
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Bắt lỗi 409 Conflict từ Redis/MongoDB mà Backend trả về
        throw new Error(errorData.detail || "Có lỗi xảy ra khi lưu vào Database");
      }

      const responseData = await response.json();

      // 6. CẬP NHẬT LẠI GIAO DIỆN SAU KHI LƯU THÀNH CÔNG
      // Tạo object booking mới cho UI dựa trên dữ liệu trả về từ DB
      const newBooking: BookingItem = {
        id: responseData.data?.id || `b${Date.now()}`,
        roomId: targetId,
        customerName: quickBookData.customerName,
        phone: quickBookData.phone,
        status: "checked-in", 
        startTime: quickBookData.startTime,
        durationMins: durationMins,
        bufferMins: 15, 
        note: quickBookData.note || "Khách vãng lai",
        equipments: borrowedEquipments
      };

      // Tự động trừ số lượng thiết bị trên giao diện
      const updatedEquipments = equipments.map(eq => {
        const eqId = eq.id || eq._id || "";
        if (quickBookData.equipments[eqId]) {
          return { ...eq, inUseQuantity: (eq.inUseQuantity || 0) + quickBookData.equipments[eqId].quantity };
        }
        return eq;
      });

      setEquipments(updatedEquipments);
      setBookings([...bookings, newBooking]);
      setShowQuickBook(false);
      
      // Xóa trắng form sau khi xong
      setQuickBookData({ ...quickBookData, customerName: "", phone: "", equipments: {} });
      alert("✅ Đã lưu ca đặt phòng vào Database thành công!");

    } catch (err: any) {
      alert(`⛔ LỖI SERVER:\n${err.message}`);
    } finally {
      // Nhả nút submit
      const submitBtn = document.getElementById("btn-submit-quickbook") as HTMLButtonElement;
      if(submitBtn) { submitBtn.disabled = false; submitBtn.innerText = "Xác nhận Check-in"; }
    }
  };

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  // ================= GIAO DIỆN TIMELINE EXCEL LỌC ẨN PHÒNG TRỐNG =================
  const renderTimeline = () => {
    const startHour = 7;
    const endHour = 21;
    const totalMins = (endHour - startHour) * 60;
    
    const timeHeaders:string[] = [];
    for (let i = startHour; i <= endHour; i++) timeHeaders.push(`${i.toString().padStart(2, '0')}:00`);

    const uniqueBuildings = Array.from(new Set(rooms.map(r => r.building || "Khác"))).filter(Boolean);

    // CRITICAL: CHỈ hiển thị những phòng đang có khách đặt lịch, phòng nào không được đặt thì ẩn đi
    const filteredRooms = rooms.filter(room => {
       const roomIdStr = room.id || room._id || "";
       const hasBooking = bookings.some(b => b.roomId === roomIdStr);
       if (!hasBooking) return false; // Ẩn hoàn toàn nếu không có lịch đặt

       if(buildingFilter !== "all" && (room.building || "Khác") !== buildingFilter) return false;
       return true;
    });

    const getStatusColor = (status: string) => {
      if (status === 'checked-in') return 'bg-emerald-500 border-emerald-600 text-white shadow-sm';
      if (status === 'confirmed') return 'bg-blue-500 border-blue-600 text-white shadow-sm';
      if (status === 'pending') return 'bg-amber-400 border-amber-500 text-amber-950 shadow-sm';
      return 'bg-gray-400 text-white';
    };

    const currentHour = currentTime.getHours();
    const currentMin = currentTime.getMinutes();
    let currentLinePct: number | null = null;
    if (currentHour >= startHour && currentHour <= endHour) {
       currentLinePct = ((currentHour - startHour) * 60 + currentMin) / totalMins * 100;
    }

    return (
      <div className="space-y-6 flex flex-col h-[calc(100vh-6rem)] relative">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4 shrink-0">
          <div>
            <h2 className="text-2xl font-black text-gray-900">Lịch Điều Phối Vận Hành</h2>
            <p className="text-gray-500 mt-1 flex gap-4 text-sm font-medium">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Đang dùng</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Đã duyệt</span>
              <span className="text-xs text-gray-400 font-semibold self-center bg-gray-100 px-2.5 py-0.5 rounded-md">Đang tự động ẩn phòng trống</span>
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            <select 
              value={buildingFilter} onChange={e => setBuildingFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold bg-white outline-none focus:border-emerald-500"
            >
              <option value="all">Tất cả khu vực tòa nhà</option>
              {uniqueBuildings.map((b, i) => <option key={i} value={b}>{b}</option>)}
            </select>

            <button onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-200">Hôm nay</button>
            <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
               <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-100 text-gray-500"><ChevronLeft className="w-5 h-5"/></button>
               <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="px-2 py-1 text-sm font-bold outline-none cursor-pointer" />
               <button onClick={() => changeDate(1)} className="p-2 hover:bg-gray-100 text-gray-500"><ChevronRight className="w-5 h-5"/></button>
            </div>

            <button onClick={() => setShowQuickBook(true)} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-md">
              <Plus className="w-4 h-4"/> Đặt lịch nhanh
            </button>
          </div>
        </div>

        {/* LƯỚI TIMELINE */}
        <div className="flex-1 bg-white border border-gray-200 rounded-2xl overflow-auto relative shadow-sm">
          <div className="min-w-[1200px] h-full flex flex-col relative">
            
            {currentLinePct !== null && (
              <div className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-40 pointer-events-none" style={{ left: `calc(16rem + ${currentLinePct} * (100% - 16rem) / 100)` }}>
                 <div className="absolute -top-1 -left-[5px] w-3 h-3 bg-red-500 rotate-45 rounded-sm shadow-sm"></div>
              </div>
            )}

            <div className="flex sticky top-0 z-30 bg-slate-50 border-b border-gray-200 shadow-sm">
              <div className="w-64 shrink-0 sticky left-0 z-40 bg-slate-50 border-r border-gray-200 p-4 font-black text-gray-700">Không gian phòng Lab</div>
              <div className="flex-1 relative flex">
                {timeHeaders.map((time, idx) => (
                  <div key={idx} className="flex-1 border-r border-gray-100 p-3 text-xs font-bold text-gray-400 text-center relative">
                    <span className="absolute -left-3 top-3 bg-slate-50 px-1">{time}</span>
                  </div>
                ))}
              </div>
            </div>

            {filteredRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 py-20 text-gray-400">
                 <CalendarDays className="w-12 h-12 mb-3 text-gray-200" />
                 <p className="font-medium text-sm">Hiện tại không có phòng nào có lịch đặt trùng khớp.</p>
              </div>
            ) : (
              filteredRooms.map((room) => {
                const roomIdStr = room.id || room._id || "";
                const roomBookings = bookings.filter(b => b.roomId === roomIdStr);

                return (
                  <div key={roomIdStr} className="flex border-b border-gray-100 group hover:bg-slate-50/50 transition-colors h-24 relative">
                    <div className="w-64 shrink-0 sticky left-0 z-20 bg-white group-hover:bg-slate-50 border-r border-gray-200 p-4 flex flex-col justify-center">
                      <h3 className="font-bold text-gray-900 leading-tight truncate">{room.title || room.name || "Chưa đặt tên"}</h3>
                      <p className="text-xs text-gray-500 font-medium mt-1">
                        <MapPin className="w-3 h-3 inline mr-1" /> {room.building || "Tòa khác"} - {room.floor || ""}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5"><Users className="w-3 h-3 inline mr-1" /> Sức chứa: {room.capacity} chỗ</p>
                    </div>

                    <div className="flex-1 relative bg-white">
                      <div className="absolute inset-0 flex pointer-events-none">
                         {timeHeaders.map((_, idx) => <div key={idx} className="flex-1 border-r border-gray-100/60 border-dashed"></div>)}
                      </div>

                      {roomBookings.map((booking) => {
                        const startMins = timeToMins(booking.startTime) - timeToMins("07:00");
                        const leftPct = (startMins / totalMins) * 100;
                        const widthPct = (booking.durationMins / totalMins) * 100;
                        const bufferWidthPct = (booking.bufferMins / totalMins) * 100;
                        const endTimeStr = minsToTime(timeToMins(booking.startTime) + booking.durationMins);

                        return (
                          <React.Fragment key={booking.id}>
                            <div 
                              className={`absolute top-2 bottom-2 ${getStatusColor(booking.status)} border rounded-xl px-3 py-1 overflow-hidden z-10 flex flex-col justify-center cursor-pointer hover:brightness-110 transition-all`}
                              style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                              onClick={() => setSelectedBooking(booking)}
                            >
                              <p className="text-xs font-black truncate leading-tight">{booking.customerName}</p>
                              <p className="text-[10px] opacity-90 truncate font-semibold mt-0.5">{booking.startTime} - {endTimeStr}</p>
                            </div>

                            {booking.bufferMins > 0 && (
                              <div 
                                className="absolute top-2 bottom-2 z-0 bg-slate-50 border-y border-r border-slate-200 rounded-r-lg opacity-60 flex items-center justify-center overflow-hidden"
                                style={{ 
                                  left: `${leftPct + widthPct}%`, width: `${bufferWidthPct}%`,
                                  backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.03) 5px, rgba(0,0,0,0.03) 10px)"
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

        {/* ================= MODAL QUICK BOOK ================= */}
        <AnimatePresence>
          {showQuickBook && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-emerald-600 p-5 flex justify-between items-center text-white shrink-0">
                  <h3 className="font-black text-xl flex items-center gap-2"><Clock className="w-5 h-5"/> Đặt Phòng Vãng Lai (Walk-in)</h3>
                  <button onClick={() => setShowQuickBook(false)} className="hover:bg-emerald-700 p-1 rounded-full"><X className="w-6 h-6" /></button>
                </div>
                
                <form onSubmit={handleQuickBookSubmit} className="p-6 overflow-y-auto space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Chọn Phòng Lab *</label>
                    <select required value={quickBookData.roomId} onChange={e => setQuickBookData({...quickBookData, roomId: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium outline-none focus:border-emerald-500">
                      <option value="" disabled>-- Hãy chọn một phòng --</option>
                      {rooms.map(r => <option key={r.id||r._id} value={r.id||r._id}>{r.title || r.name} - {r.building || "Khác"} (Sức chứa: {r.capacity})</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Họ Tên Khách/GV *</label>
                      <input type="text" required value={quickBookData.customerName} onChange={e => setQuickBookData({...quickBookData, customerName: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500" placeholder="VD: Nguyễn Văn A" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Số điện thoại liên hệ *</label>
                      <input type="text" required value={quickBookData.phone} onChange={e => setQuickBookData({...quickBookData, phone: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500" placeholder="VD: 0901234567" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Số lượng người</label>
                      <input type="number" min="1" value={quickBookData.capacity} onChange={e => setQuickBookData({...quickBookData, capacity: parseInt(e.target.value)})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Giờ bắt đầu *</label>
                      <input type="time" required value={quickBookData.startTime} onChange={e => setQuickBookData({...quickBookData, startTime: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Giờ kết thúc *</label>
                      <input type="time" required value={quickBookData.endTime} onChange={e => setQuickBookData({...quickBookData, endTime: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500" />
                    </div>
                  </div>

                  <div>
                     <label className="block text-sm font-bold text-gray-700 mb-2">Mượn kèm thiết bị (Tự động lọc kho)</label>
                     <div className="border border-gray-200 rounded-xl p-4 max-h-48 overflow-y-auto bg-gray-50 space-y-2">
                        {equipments.length === 0 ? <p className="text-sm text-gray-400">Không có thiết bị khả dụng.</p> : equipments.map(eq => {
                           const eqId = eq.id || eq._id || "";
                           const available = (eq.totalQuantity || 0) - (eq.inUseQuantity || 0);
                           const isOutOfStock = available <= 0;
                           const isSelected = !!quickBookData.equipments[eqId];
                           const selectedQty = isSelected ? quickBookData.equipments[eqId].quantity : 0;

                           return (
                             <div key={eqId} className={`flex items-center justify-between p-2 rounded-lg ${isSelected ? 'bg-emerald-100/50 border border-emerald-200' : 'hover:bg-gray-100'} ${isOutOfStock && !isSelected ? 'opacity-50' : ''}`}>
                               <label className="flex items-center gap-3 cursor-pointer flex-1">
                                 <input 
                                    type="checkbox" 
                                    checked={isSelected} 
                                    onChange={() => toggleEquipment(eqId, eq.name, available)} 
                                    disabled={isOutOfStock && !isSelected} 
                                    className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer" 
                                 />
                                 <div>
                                    <span className="text-sm font-bold text-gray-800">{eq.name}</span>
                                    <p className="text-xs text-gray-500 mt-0.5">Sẵn kho: <span className={isOutOfStock ? "text-red-500 font-bold" : "text-emerald-600 font-bold"}>{available} chiếc</span></p>
                                 </div>
                               </label>
                               
                               {isSelected && (
                                 <div className="flex items-center gap-3 bg-white border border-emerald-200 rounded-lg p-1 shadow-sm">
                                   <button type="button" onClick={() => updateEqQuantity(eqId, -1)} className="w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded text-gray-600 font-bold">-</button>
                                   <span className="text-sm font-bold w-4 text-center text-emerald-700">{selectedQty}</span>
                                   <button type="button" onClick={() => updateEqQuantity(eqId, 1)} disabled={selectedQty >= available} className="w-6 h-6 flex items-center justify-center bg-emerald-100 hover:bg-emerald-200 disabled:opacity-50 rounded text-emerald-700 font-bold">+</button>
                                 </div>
                               )}
                             </div>
                           )
                        })}
                     </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                     <button type="button" onClick={() => setShowQuickBook(false)} className="px-6 py-2.5 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">Hủy bỏ</button>
                     <button type="submit" className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all">Xác nhận Check-in</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ================= MODAL XEM CHI TIẾT CA ĐẶT ================= */}
        <AnimatePresence>
          {selectedBooking && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedBooking(null)}>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                <div className="bg-slate-900 p-5 flex justify-between items-center text-white shrink-0">
                  <h3 className="font-black text-xl flex items-center gap-2"><FileText className="w-5 h-5 text-blue-400"/> Chi tiết Ca đặt phòng</h3>
                  <button onClick={() => setSelectedBooking(null)} className="hover:bg-slate-700 p-1 rounded-full"><X className="w-6 h-6" /></button>
                </div>
                
                <div className="p-6 space-y-6">
                  <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                    <div>
                      <h4 className="text-2xl font-black text-gray-900">{selectedBooking.customerName}</h4>
                      <p className="text-sm font-medium text-gray-500 mt-1">SĐT: {selectedBooking.phone}</p>
                    </div>
                    <span className="bg-emerald-100 text-emerald-700 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider">
                      {selectedBooking.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <p className="text-xs font-bold text-gray-400 uppercase mb-1">Thời gian mượn</p>
                      <p className="text-lg font-black text-gray-900">{selectedBooking.startTime} - {minsToTime(timeToMins(selectedBooking.startTime) + selectedBooking.durationMins)}</p>
                      <p className="text-xs font-medium text-amber-600 mt-1 flex items-center gap-1"><Clock className="w-3 h-3"/> Dọn dẹp: {selectedBooking.bufferMins} phút</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <p className="text-xs font-bold text-gray-400 uppercase mb-1">Phòng Lab</p>
                      <p className="text-lg font-black text-gray-900 line-clamp-1">{rooms.find(r => r.id === selectedBooking.roomId || r._id === selectedBooking.roomId)?.title || "Phòng học"}</p>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><Package className="w-4 h-4 text-blue-500"/> Thiết bị mượn kèm</h5>
                    {(!selectedBooking.equipments || selectedBooking.equipments.length === 0) ? (
                      <p className="text-sm text-gray-500 italic bg-gray-50 p-3 rounded-lg border border-gray-100">Không mượn thêm thiết bị.</p>
                    ) : (
                      <ul className="space-y-2">
                        {selectedBooking.equipments.map((eq, idx) => (
                          <li key={idx} className="flex justify-between items-center bg-blue-50/50 border border-blue-100 p-3 rounded-xl">
                            <span className="font-bold text-gray-800 text-sm">{eq.name}</span>
                            <span className="bg-blue-100 text-blue-700 font-black px-3 py-1 rounded-lg text-xs">x{eq.quantity}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {selectedBooking.note && (
                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
                       <p className="text-xs font-bold text-amber-800 uppercase mb-1">Ghi chú vận hành:</p>
                       <p className="text-sm font-medium text-amber-900">{selectedBooking.note}</p>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-end">
                   <button onClick={() => setSelectedBooking(null)} className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-md">Đóng lại</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    );
  };

  // ================= GIAO DIỆN APP SHELL =================

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

          { id: "dashboard", icon: LayoutDashboard, label: "Giám sát Vận hành" },

          { id: "timeline", icon: CalendarDays, label: "Lịch Điều phối" },

          { id: "reports", icon: FileText, label: "Báo cáo Sự cố" },

          { id: "lookup", icon: Search, label: "Tra cứu Thông tin" },

        ].map(item => (

          <button key={item.id} onClick={() => setActiveMenu(item.id as MenuTab)}

            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeMenu === item.id ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20" : "hover:bg-slate-800"}`}

          >

            <item.icon className="w-5 h-5" /> {item.label}

          </button>

        ))}

      </nav>

    </aside>

  );

  const renderDashboard = () => <div className="p-6 bg-white rounded-2xl border border-gray-100 text-center py-20 text-gray-400">Giao diện Giám sát vận hành</div>;
  const renderReports = () => <div className="p-6 bg-white rounded-2xl border border-gray-100 text-center py-20 text-gray-400">Giao diện Báo cáo sự cố</div>;
  const renderLookup = () => <div className="p-6 bg-white rounded-2xl border border-gray-100 text-center py-20 text-gray-400">Giao diện Tra cứu thông tin</div>;

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {renderSidebar()}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 relative">
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="flex justify-center items-center h-full">
               <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
            </div>
          ) : (
            <motion.div key={activeMenu} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              {activeMenu === "dashboard" && renderDashboard()}
              {activeMenu === "timeline" && renderTimeline()}
              {activeMenu === "reports" && renderReports()}
              {activeMenu === "lookup" && renderLookup()}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}