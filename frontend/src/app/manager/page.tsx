"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, CalendarDays, LogOut,
  X, AlertTriangle, Clock, MapPin, 
  ShieldCheck, TrendingUp, QrCode, Search, FileText, Users, Wrench, Plus, ChevronLeft, ChevronRight
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

import { labService } from "../../services/lab";

type MenuTab = "dashboard" | "timeline" | "reports" | "lookup";

const COLORS = ["#3b82f6", "#ef4444", "#f59e0b"];

// ================= DỮ LIỆU MẪU ĐẶT PHÒNG =================
const INITIAL_BOOKINGS = [
  { id: "b1", roomId: "r1", customerName: "Nguyễn Văn A", phone: "0901234567", status: "checked-in", startTime: "07:30", durationMins: 120, bufferMins: 15, note: "Khách VIP" },
  { id: "b2", roomId: "r2", customerName: "Lê Thị B", phone: "0987654321", status: "confirmed", startTime: "10:00", durationMins: 90, bufferMins: 15, note: "Học nhóm" },
];

export default function ManagerDashboardPage() {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState<MenuTab>("timeline"); // Đặt mặc định là Timeline để dễ xem
  const [loading, setLoading] = useState<boolean>(true);
  
  // ================= STATES BỘ LỌC THỜI GIAN =================
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // ================= STATES DỮ LIỆU =================
  const [rooms, setRooms] = useState<any[]>([]);
  const [equipments, setEquipments] = useState<any[]>([]);
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);
  const [buildingFilter, setBuildingFilter] = useState("all");

  // ================= STATES QUICK BOOK =================
  const [showQuickBook, setShowQuickBook] = useState(false);
  const [quickBookData, setQuickBookData] = useState({
    roomId: "", customerName: "", phone: "", capacity: 1, startTime: "08:00", endTime: "09:00", note: "", equipments: [] as string[]
  });

  const API_URL = "http://localhost:8000/api/v1";

  // Cập nhật giờ hiện tại mỗi 1 phút để vẽ thanh Timeline đỏ
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
      // Fetch đồng thời cả Phòng và Thiết bị để dùng cho Form Đặt nhanh
      const [roomsData, eqRes] = await Promise.all([
        labService.getAllLabs(),
        fetch(`${API_URL}/equipments`)
      ]);
      
      if(roomsData.length > 0) setRooms(roomsData); 
      
      if(eqRes.ok) {
        const eqData = await eqRes.json();
        setEquipments(eqData);
      }
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

  // Tính toán phút từ chuỗi giờ HH:mm
  const timeToMins = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const minsToTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const handleQuickBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const durationMins = timeToMins(quickBookData.endTime) - timeToMins(quickBookData.startTime);
    if(durationMins <= 0) return alert("Giờ kết thúc phải lớn hơn giờ bắt đầu!");

    const newBooking = {
      id: `b${Date.now()}`,
      roomId: quickBookData.roomId || rooms[0]?.id || rooms[0]?._id, // Mặc định phòng đầu tiên nếu quên chọn
      customerName: quickBookData.customerName,
      phone: quickBookData.phone,
      status: "checked-in", 
      startTime: quickBookData.startTime,
      durationMins: durationMins,
      bufferMins: 15, // Mặc định dọn dẹp 15p
      note: quickBookData.note || "Khách Vãng lai"
    };
    setBookings([...bookings, newBooking]);
    setShowQuickBook(false);
    alert("Đã tạo lịch nhanh thành công!");
  };

  // ================= CÁC HÀM TIỆN ÍCH ĐIỀU HƯỚNG NGÀY =================
  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };
  const goToToday = () => setSelectedDate(new Date().toISOString().split('T')[0]);

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
      <div className="p-4 border-t border-slate-800">
        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold bg-slate-800 text-red-400 hover:bg-red-500 hover:text-white transition-colors">
          <LogOut className="w-4 h-4" /> Đăng xuất
        </button>
      </div>
    </aside>
  );

  // ================= TAB 1: GIÁM SÁT VẬN HÀNH (Rút gọn để tập trung Tab 2) =================
  const renderDashboard = () => (
    <div className="text-center py-20 text-gray-500 font-medium bg-white rounded-2xl border border-gray-100">
      <LayoutDashboard className="w-16 h-16 mx-auto mb-4 text-gray-300"/>
      Giao diện Dashboard ở đây
    </div>
  );

  // ================= TAB 2: LỊCH ĐIỀU PHỐI (EXCEL TIMELINE ĐÃ TỐI ƯU) =================
  const renderTimeline = () => {
    const startHour = 7;
    const endHour = 20; // SỬA TẠI ĐÂY: Lưới chạy từ 07:00 đến khung giờ 20:00 (kết thúc lúc 21:00)
    const totalMins = (endHour + 1 - startHour) * 60; // Tổng số phút thực tế từ 07:00 -> 21:00 là 840 phút
    
    // Mảng khung giờ Header
    // Định nghĩa rõ ràng đây là mảng chứa các chuỗi (string)
const timeHeaders: string[] = []; 
for (let i = startHour; i <= endHour; i++) {
  timeHeaders.push(`${i.toString().padStart(2, '0')}:00`);
}

    // Danh sách Tòa nhà để Filter
    const uniqueBuildings = Array.from(new Set(rooms.map(r => r.building || "Khác"))).filter(Boolean);

    // Filter mảng Phòng: CHỈ hiện những phòng có booking + Lọc theo tòa nhà
    const filteredRooms = rooms.filter(room => {
       const hasBooking = bookings.some(b => b.roomId === room.id || b.roomId === room._id);
       if(!hasBooking) return false;
       if(buildingFilter !== "all" && (room.building || "Khác") !== buildingFilter) return false;
       return true;
    });

    const getStatusColor = (status: string) => {
      if (status === 'checked-in') return 'bg-emerald-500 border-emerald-600 text-white';
      if (status === 'confirmed') return 'bg-blue-500 border-blue-600 text-white';
      if (status === 'pending') return 'bg-amber-400 border-amber-500 text-amber-950';
      return 'bg-gray-400 text-white';
    };

    // Tính toán vị trí Line đỏ Giờ hiện tại
    const currentHour = currentTime.getHours();
    const currentMin = currentTime.getMinutes();
    let currentLinePct = null;
    if (currentHour >= startHour && currentHour < (endHour + 1)) {
       currentLinePct = ((currentHour - startHour) * 60 + currentMin) / totalMins * 100;
    }

    return (
      <div className="space-y-6 flex flex-col h-[calc(100vh-6rem)] relative">
        
        {/* THANH TOP BAR ĐIỀU HƯỚNG VÀ BỘ LỌC */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4 shrink-0">
          <div>
            <h2 className="text-2xl font-black text-gray-900">Lịch Điều Phối</h2>
            <p className="text-gray-500 mt-1 flex gap-4 text-sm font-medium">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Đang dùng</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Đã duyệt</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-400"></span> Chờ duyệt</span>
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            {/* Lọc Theo Tòa Nhà */}
            <select 
              value={buildingFilter} onChange={e => setBuildingFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold bg-white outline-none focus:border-emerald-500"
            >
              <option value="all">Tất cả khu vực</option>
              {uniqueBuildings.map((b, i) => <option key={i} value={b}>{b}</option>)}
            </select>

            {/* Điều hướng Ngày */}
            <button onClick={goToToday} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-200 transition-colors">Hôm nay</button>
            <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
               <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-100 text-gray-500"><ChevronLeft className="w-5 h-5"/></button>
               <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="px-2 py-1 text-sm font-bold outline-none cursor-pointer" />
               <button onClick={() => changeDate(1)} className="p-2 hover:bg-gray-100 text-gray-500"><ChevronRight className="w-5 h-5"/></button>
            </div>

            {/* Nút Walk-in / Quick Book */}
            <button 
              onClick={() => setShowQuickBook(true)} 
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4"/> Đặt lịch nhanh
            </button>
          </div>
        </div>

        {/* ================= BẢNG LƯỚI TIMELINE (EXCEL VIEW) ================= */}
        <div className="flex-1 bg-white border border-gray-200 rounded-2xl overflow-auto relative shadow-sm">
          <div className="min-w-[1200px] h-full flex flex-col relative">
            
            {/* Thanh Chỉ Báo Giờ Hiện Tại (Real-time Line) */}
            {currentLinePct !== null && (
              <div className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-40 pointer-events-none" style={{ left: `calc(16rem + ${currentLinePct} * (100% - 16rem) / 100)` }}>
                 <div className="absolute -top-1 -left-[5px] w-3 h-3 bg-red-500 rotate-45 rounded-sm shadow-sm"></div>
              </div>
            )}

            {/* Header Khung giờ (Sticky Top) */}
            <div className="flex sticky top-0 z-30 bg-slate-50 border-b border-gray-200 shadow-sm">
              <div className="w-64 shrink-0 sticky left-0 z-40 bg-slate-50 border-r border-gray-200 p-4 font-black text-gray-700">
                Danh sách Phòng
              </div>
              <div className="flex-1 relative flex">
                {timeHeaders.map((time, idx) => (
                  <div key={idx} className="flex-1 border-r border-gray-200 p-3 text-xs font-bold text-gray-400 text-center relative">
                    <span className="absolute -left-3 top-3 bg-slate-50 px-1">{time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hiển thị Trạng thái nếu mảng bị rỗng do lọc */}
            {filteredRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 py-20 text-gray-400">
                 <CalendarDays className="w-12 h-12 mb-3 text-gray-200" />
                 <p className="font-medium text-sm">Chưa có lịch đặt phòng nào cho bộ lọc này.</p>
              </div>
            ) : (
              /* Map Các Phòng có lịch đặt */
              filteredRooms.map((room) => {
                const roomBookings = bookings.filter(b => b.roomId === room.id || b.roomId === room._id);

                return (
                  <div key={room.id || room._id} className="flex border-b border-gray-100 group hover:bg-emerald-50/20 transition-colors h-24 relative">
                    
                    {/* Cột trái: Tên phòng (Sticky Left) */}
                    <div className="w-64 shrink-0 sticky left-0 z-20 bg-white group-hover:bg-emerald-50/50 border-r border-gray-200 p-4 flex flex-col justify-center">
                      <h3 className="font-bold text-gray-900 leading-tight">{room.title || room.name || "Chưa đặt tên"}</h3>
                      <p className="text-xs text-gray-500 font-medium mt-1">
                        <MapPin className="w-3 h-3 inline" /> {room.building || "Khác"} - {room.floor || ""}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5"><Users className="w-3 h-3 inline" /> Sức chứa: {room.capacity}</p>
                    </div>

                    {/* Vùng Lưới Khung Giờ */}
                    <div className="flex-1 relative bg-white">
                      {/* Lưới dọc mờ làm nền */}
                      <div className="absolute inset-0 flex pointer-events-none">
                         {timeHeaders.map((_, idx) => (
                           <div key={idx} className="flex-1 border-r border-gray-100/50 border-dashed"></div>
                         ))}
                      </div>

                      {/* Render Booking Blocks */}
                      {roomBookings.map((booking) => {
                        // SỬA TẠI ĐÂY: Trừ chính xác mốc giờ khởi đầu là 07:00
                        const startMins = timeToMins(booking.startTime) - timeToMins("07:00");
                        const leftPct = (startMins / totalMins) * 100;
                        const widthPct = (booking.durationMins / totalMins) * 100;
                        const bufferWidthPct = (booking.bufferMins / totalMins) * 100;
                        const endTimeStr = minsToTime(timeToMins(booking.startTime) + booking.durationMins);

                        return (
                          <React.Fragment key={booking.id}>
                            {/* Khối Booking Chính */}
                            <div 
                              className={`absolute top-2 bottom-2 ${getStatusColor(booking.status)} border rounded-lg px-3 py-1 shadow-sm z-10 flex flex-col justify-center cursor-pointer hover:brightness-110 transition-all group/block`}
                              style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                            >
                              <p className="text-xs font-bold truncate leading-tight">{booking.customerName}</p>
                              <p className="text-[10px] opacity-90 truncate font-medium mt-0.5">{booking.startTime} - {endTimeStr}</p>

                              {/* Hover Tooltip */}
                              <div className="hidden group-hover/block:block absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 bg-slate-900 text-white p-4 rounded-xl shadow-2xl scale-100 cursor-default">
                                 <h4 className="font-bold text-sm border-b border-slate-700 pb-2 mb-2">{booking.customerName}</h4>
                                 <div className="space-y-1 text-xs text-slate-300">
                                   <p><span className="text-slate-400">SĐT:</span> {booking.phone}</p>
                                   <p><span className="text-slate-400">Thời gian:</span> {booking.startTime} - {endTimeStr}</p>
                                   <p><span className="text-slate-400">Ghi chú:</span> {booking.note}</p>
                                 </div>
                                 <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-slate-900"></div>
                              </div>
                            </div>

                            {/* Khối Thời gian đệm */}
                            {booking.bufferMins > 0 && (
                              <div 
                                className="absolute top-2 bottom-2 z-0 bg-gray-100 border-y border-r border-gray-200 rounded-r-lg opacity-60 flex items-center justify-center overflow-hidden"
                                style={{ 
                                  left: `${leftPct + widthPct}%`, 
                                  width: `${bufferWidthPct}%`,
                                  backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.05) 5px, rgba(0,0,0,0.05) 10px)"
                                }}
                                title="Thời gian dọn dẹp"
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

        {/* ================= MODAL FORM ĐẶT PHÒNG NHANH ================= */}
        {showQuickBook && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="bg-emerald-600 p-5 flex justify-between items-center text-white shrink-0">
                <h3 className="font-black text-xl flex items-center gap-2"><Clock className="w-5 h-5"/> Đặt Phòng Vãng Lai (Walk-in)</h3>
                <button onClick={() => setShowQuickBook(false)} className="hover:bg-emerald-700 p-1 rounded-full transition-colors"><X className="w-6 h-6" /></button>
              </div>
              
              <form onSubmit={handleQuickBookSubmit} className="p-6 overflow-y-auto space-y-6">
                
                {/* Chọn Phòng */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Chọn Phòng Lab *</label>
                  <select required value={quickBookData.roomId} onChange={e => setQuickBookData({...quickBookData, roomId: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium outline-none focus:border-emerald-500">
                    <option value="" disabled>-- Hãy chọn một phòng --</option>
                    {rooms.map(r => <option key={r.id||r._id} value={r.id||r._id}>{r.title || r.name} - {r.building || "Khác"} (Sức chứa: {r.capacity})</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Họ Tên Khách/GV *</label>
                    <input type="text" required value={quickBookData.customerName} onChange={e => setQuickBookData({...quickBookData, customerName: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500" placeholder="VD: Nguyễn Văn A" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Số điện thoại *</label>
                    <input type="text" required value={quickBookData.phone} onChange={e => setQuickBookData({...quickBookData, phone: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500" placeholder="VD: 0901234567" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Số người</label>
                    <input type="number" min="1" value={quickBookData.capacity} onChange={e => setQuickBookData({...quickBookData, capacity: parseInt(e.target.value)})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Giờ bắt đầu *</label>
                    <input type="time" required value={quickBookData.startTime} onChange={e => setQuickBookData({...quickBookData, startTime: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Giờ kết thúc *</label>
                    <input type="time" required value={quickBookData.endTime} onChange={e => setQuickBookData({...quickBookData, endTime: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500" />
                  </div>
                </div>

                {/* Chọn Thiết bị mượn kèm */}
                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-2">Kèm thiết bị (Tùy chọn)</label>
                   <div className="border border-gray-200 rounded-xl p-4 max-h-40 overflow-y-auto bg-gray-50 space-y-3">
                      {equipments.length === 0 ? <p className="text-sm text-gray-400">Không có thiết bị trong kho.</p> : equipments.map(eq => {
                         const available = (eq.totalQuantity || 0) - (eq.inUseQuantity || 0);
                         const isOutOfStock = available <= 0;
                         return (
                           <label key={eq.id || eq._id} className={`flex items-center gap-3 cursor-pointer ${isOutOfStock ? 'opacity-40 cursor-not-allowed' : ''}`}>
                             <input type="checkbox" disabled={isOutOfStock} className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500" />
                             <span className="text-sm font-bold text-gray-800">{eq.name}</span>
                             <span className={`text-xs px-2 py-0.5 rounded-full ${isOutOfStock ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>
                               {isOutOfStock ? 'Hết hàng' : `Còn ${available}`}
                             </span>
                           </label>
                         )
                      })}
                   </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                   <button type="button" onClick={() => setShowQuickBook(false)} className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">Hủy bỏ</button>
                   <button type="submit" className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95">Xác nhận Check-in</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    );
  };

  // ================= TAB 3 & 4 (Rút gọn) =================
  const renderReports = () => (
    <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
       <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
       <h2 className="text-xl font-bold text-gray-900">Báo cáo Sự cố</h2>
    </div>
  );

  const renderLookup = () => (
    <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
       <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
       <h2 className="text-xl font-bold text-gray-900">Tra cứu Thông tin</h2>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {renderSidebar()}
      
      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 relative">
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="flex justify-center items-center py-20">
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