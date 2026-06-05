"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, CalendarDays, LogOut,
  X, AlertTriangle, Clock, MapPin, 
  ShieldCheck, TrendingUp, QrCode, Search, FileText, CheckCircle2, Users, Wrench, DoorOpen, Package
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

import { labService } from "../../services/lab";

type MenuTab = "dashboard" |"labs" | "equipments" |"timeline" | "reports" | "lookup";
type TimeFilter = "today" | "yesterday" | "7days" | "month" | "custom";

const COLORS = ["#3b82f6", "#ef4444", "#f59e0b"];

interface EquipmentItem {
  id: string;
  _id?: string;
  name: string;
  category: string;
  managementType: string;
  totalQuantity: number;
  inUseQuantity: number;
  status: string;
  roomId: string;
  imageUrl?: string;
}

// ================= DỮ LIỆU MẪU ĐẶT PHÒNG =================
const INITIAL_BOOKINGS = [
  { id: "b1", roomId: "r1", customerName: "Nguyễn Văn A", phone: "0901234567", status: "checked-in", startTime: "07:30", durationMins: 120, bufferMins: 15, note: "Khách VIP" },
  { id: "b2", roomId: "r2", customerName: "Lê Thị B", phone: "0987654321", status: "confirmed", startTime: "10:00", durationMins: 90, bufferMins: 15, note: "Học nhóm" },
];

export default function ManagerDashboardPage() {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState<MenuTab>("dashboard");
  const [loading, setLoading] = useState<boolean>(true);
  
  // States cho Bộ lọc
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("today");
  const [customDate, setCustomDate] = useState<string>("");

  // States Dữ liệu
  //const [rooms, setRooms] = useState<any[]>([
    // // Mock phòng hiển thị trên lưới (Bao gồm phòng trống)
    // { id: "r1", name: "Lab Máy tính 01", building: "Tòa A", floor: "Tầng 3", capacity: 40 },
    // { id: "r2", name: "Lab Hóa - Sinh 02", building: "Tòa B", floor: "Tầng 1", capacity: 20 },
    // { id: "r3", name: "Phòng Hội thảo VIP", building: "Tòa C", floor: "Tầng 5", capacity: 100 },
    // { id: "r4", name: "Không gian học nhóm", building: "Tòa A", floor: "Tầng 1", capacity: 15 },
    // Tab nội bộ cho phần Giám sát
  const [activeInnerTab, setActiveInnerTab] = useState<"overview" | "labs" | "equipments">("overview");
  const [rooms, setRooms] = useState<any[]>([]);
  const [equipments, setEquipments] = useState<EquipmentItem[]>([]);
  
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);

  // States cho Quick Book
  const [showQuickBook, setShowQuickBook] = useState(false);
  const [quickBookData, setQuickBookData] = useState({
    roomId: "", roomName: "", customerName: "", phone: "", startTime: "08:00", durationMins: 60, note: ""
  });

  const API_URL = "http://localhost:8000/api/v1";

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) router.push("/login");
    else loadData();
  }, [router]);

  // const loadData = async () => {
  //   try {
  //     setLoading(true);
  //     const data = await labService.getAllLabs();
  //     if(data.length > 0) setRooms(data); 
  //   } catch (error) {
  //     console.error(error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const loadData = async () => {
    try {
      setLoading(true);
      const [labRes, eqRes] = await Promise.all([
        fetch(`${API_URL}/labs`),
        fetch(`${API_URL}/equipments`)
      ]);
      
      if (labRes.ok) setRooms(await labRes.json());
      if (eqRes.ok) setEquipments(await eqRes.json());
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

  const handleQuickBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newBooking = {
      id: `b${Date.now()}`,
      roomId: quickBookData.roomId,
      customerName: quickBookData.customerName,
      phone: quickBookData.phone,
      status: "checked-in", // Đơn tạo nhanh được tính là đang sử dụng luôn
      startTime: quickBookData.startTime,
      durationMins: quickBookData.durationMins,
      bufferMins: 15,
      note: quickBookData.note || "Khách Walk-in (Đặt nhanh)"
    };
    setBookings([...bookings, newBooking]);
    setShowQuickBook(false);
    alert("Đã tạo lịch nhanh và check-in thành công!");
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
          { id: "labs", icon: DoorOpen, label: "Phòng Thực hành" },
          { id: "equipments", icon: Package, label: "Thiết Bị" },
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

  // ================= TAB 1: GIÁM SÁT VẬN HÀNH (CÓ DATE PICKER) =================
  //const renderDashboard = () => {
  //   const utilizationData = [
  //     { name: "07:00", active: 10 }, { name: "09:00", active: 35 }, { name: "13:00", active: 40 }, { name: "15:00", active: 20 }
  //   ];
  //   const damageData = [
  //     { name: "Bình thường", value: 300 }, { name: "Hỏng do khách", value: 5 }, { name: "Hao mòn", value: 15 }
  //   ];

  //   return (
  //     <div className="space-y-6 pb-10">
  //       {/* Header & Lọc thời gian có Date Picker */}
  //       <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
  //         <div>
  //           <h2 className="text-2xl font-black text-gray-900">Giám sát Trực tiếp</h2>
  //           <p className="text-gray-500 text-sm mt-1">Cập nhật trạng thái phòng và thiết bị realtime.</p>
  //         </div>
  //         <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
  //           <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-black transition-colors">
  //             <QrCode className="w-4 h-4" /> Quét mã QR
  //           </button>
  //           <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 w-full sm:w-auto items-center overflow-x-auto scrollbar-hide">
  //             {[{ id: "today", label: "Hôm nay" }, { id: "yesterday", label: "Hôm qua" }, { id: "7days", label: "7 Ngày" }].map(f => (
  //               <button key={f.id} onClick={() => { setTimeFilter(f.id as TimeFilter); setCustomDate(""); }}
  //                 className={`px-4 py-1.5 text-sm font-bold rounded-lg whitespace-nowrap transition-all ${timeFilter === f.id && !customDate ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
  //               >{f.label}</button>
  //             ))}
  //             <div className="h-4 w-px bg-gray-300 mx-2"></div>
  //             {/* DATE PICKER TÙY CHỌN NGÀY */}
  //             <input 
  //               type="date" 
  //               value={customDate}
  //               onChange={(e) => { setCustomDate(e.target.value); setTimeFilter("custom"); }}
  //               className={`px-3 py-1 text-sm font-bold rounded-lg bg-transparent outline-none cursor-pointer ${customDate ? "text-emerald-600 bg-white shadow-sm" : "text-gray-500"}`}
  //             />
  //           </div>
  //         </div>
  //       </div>

  //       {/* Báo cáo thống kê... (Giữ nguyên như cũ) */}
  //       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  //         <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
  //           <p className="text-xs font-bold text-gray-500 mb-1">ĐANG SỬ DỤNG</p>
  //           <h3 className="text-2xl font-black text-emerald-600">18/25 <span className="text-sm font-medium text-gray-400">Phòng</span></h3>
  //         </div>
  //         <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
  //           <p className="text-xs font-bold text-gray-500 mb-1">CHỜ DUYỆT</p>
  //           <h3 className="text-2xl font-black text-amber-500">12 <span className="text-sm font-medium text-gray-400">Đơn</span></h3>
  //         </div>
  //         <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
  //           <p className="text-xs font-bold text-gray-500 mb-1">THIẾT BỊ RỜI KHO</p>
  //           <h3 className="text-2xl font-black text-blue-600">45 <span className="text-sm font-medium text-gray-400">Món</span></h3>
  //         </div>
  //         <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
  //           <p className="text-xs font-bold text-gray-500 mb-1">BẢO TRÌ ĐỘT XUẤT</p>
  //           <h3 className="text-2xl font-black text-red-500">2 <span className="text-sm font-medium text-gray-400">Sự cố</span></h3>
  //         </div>
  //       </div>

  //       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  //         <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[350px]">
  //           <div className="p-4 border-b border-gray-100"><h3 className="font-bold text-gray-900 flex items-center gap-2"><Clock className="w-5 h-5 text-emerald-500"/> Ca sắp diễn ra (Trong 2h)</h3></div>
  //           <div className="p-4 overflow-y-auto space-y-3">
  //              <div className="text-center text-sm text-gray-500 py-10">Hiển thị lịch sắp tới...</div>
  //           </div>
  //         </div>
  //         <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[350px]">
  //           <div className="p-4 border-b border-gray-100"><h3 className="font-bold text-gray-900 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500"/> Đơn chờ duyệt khẩn</h3></div>
  //           <div className="p-4 overflow-y-auto space-y-3">
  //               <div className="text-center text-sm text-gray-500 py-10">Không có đơn chờ duyệt.</div>
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // };

  const renderLabsTable = () => (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm">
                <th className="p-4 font-bold text-gray-600">Tên Phòng</th>
                <th className="p-4 font-bold text-gray-600">Vị trí(Tòa Nhà - Tầng)</th>
                <th className="p-4 font-bold text-gray-600">Sức chứa</th>
                <th className="p-4 font-bold text-gray-600">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rooms.map((room) => (
                <tr key={room.id || room._id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-bold text-gray-900 flex items-center gap-3">
                    {/* HÌNH ẢNH PHÒNG */}
                    {room.imageUrl ? (
                      <img src={room.imageUrl} alt={room.name} className="w-10 h-10 rounded-lg object-cover border border-gray-200 shadow-sm" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600"><DoorOpen className="w-5 h-5"/></div>
                    )}
                    {room.name}
                  </td>
                  <td className="p-4 text-gray-600">{room.building || "Chưa gán"} - {room.floor || "Chưa gán"}</td>
                  <td className="p-4 text-gray-600">{room.capacity || 0} người</td>
                  <td className="p-4">
                    {room.maintenanceMode ? (
                      <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-100"><Wrench className="w-3.5 h-3.5"/> Bảo trì</span>
                    ) : room.isBooked ? (
                      <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-100"><Clock className="w-3.5 h-3.5"/> Đã đặt</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100"><CheckCircle2 className="w-3.5 h-3.5"/> Sẵn sàng</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  const renderEquipmentsTable = () => (
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {equipments.map((eq) => {
                const matchedRoom = rooms.find(r => (r.id || r._id) === eq.roomId);
                const roomName = matchedRoom ? matchedRoom.name : "Trong kho";
                const availableQty = (eq.totalQuantity || 0) - (eq.inUseQuantity || 0);

                return (
                  <tr key={eq.id || eq._id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-bold text-gray-900 flex items-center gap-3">
                      {/* HÌNH ẢNH THIẾT BỊ */}
                      {eq.imageUrl ? (
                        <img src={eq.imageUrl} alt={eq.name} className="w-10 h-10 rounded-lg object-cover border border-gray-200 shadow-sm" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600"><Package className="w-5 h-5"/></div>
                      )}
                      {eq.name}
                    </td>
                    <td className="p-4"><span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-xs font-bold">{eq.category || "Vật tư"}</span></td>
                    
                    {/* CỘT SỐ LƯỢNG */}
                    <td className="p-4">
                      {eq.managementType === 'pool' ? (
                        <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">Còn: {availableQty}/{eq.totalQuantity}</span>
                      ) : (
                         <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold border border-gray-200">Đơn chiếc (Serial)</span>
                      )}
                    </td>

                    {/* CỘT TRẠNG THÁI RIÊNG BIỆT */}
                    <td className="p-4">
                      {eq.status === 'available' ? (
                         <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100"><CheckCircle2 className="w-3.5 h-3.5"/> Sẵn sàng</span>
                      ) : eq.status === 'maintenance' ? (
                        <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-100"><Wrench className="w-3.5 h-3.5"/> Bảo trì</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold border border-gray-200">Thanh lý</span>
                      )}
                    </td>

                    <td className="p-4 text-gray-600 flex items-center gap-1.5"><MapPin className="w-4 h-4 text-gray-400"/> {roomName}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );

  const renderDashboard = () => {
    // TÍNH TOÁN CON SỐ REAL-TIME TỪ DỮ LIỆU
    const usedRoomsCount = rooms.filter(l => l.isBooked).length;
    const maintenanceRoomsCount = rooms.filter(l => l.maintenanceMode).length;
    const maintenanceEqsCount = equipments.filter(e => e.status === 'maintenance').length;
    const totalMaintenance = maintenanceRoomsCount + maintenanceEqsCount;
    const itemsOut = equipments.reduce((sum, eq) => sum + (eq.inUseQuantity || 0), 0);

    const renderOverview = () => (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-500 mb-1">ĐANG SỬ DỤNG</p>
            <h3 className="text-2xl font-black text-emerald-600">{usedRoomsCount}/{rooms.length} <span className="text-sm font-medium text-gray-400">Phòng</span></h3>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-500 mb-1">CHỜ DUYỆT</p>
            <h3 className="text-2xl font-black text-amber-500">12 <span className="text-sm font-medium text-gray-400">Đơn</span></h3>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-500 mb-1">THIẾT BỊ RỜI KHO</p>
            <h3 className="text-2xl font-black text-blue-600">{itemsOut} <span className="text-sm font-medium text-gray-400">Món</span></h3>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-500 mb-1">BẢO TRÌ ĐỘT XUẤT</p>
            <h3 className="text-2xl font-black text-red-500">{totalMaintenance} <span className="text-sm font-medium text-gray-400">Sự cố</span></h3>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[350px]">
            <div className="p-4 border-b border-gray-100"><h3 className="font-bold text-gray-900 flex items-center gap-2"><Clock className="w-5 h-5 text-emerald-500"/> Ca sắp diễn ra (Trong 2h)</h3></div>
            <div className="p-4 overflow-y-auto space-y-3">
               <div className="text-center text-sm text-gray-500 py-10">Hiển thị lịch sắp tới...</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[350px]">
            <div className="p-4 border-b border-gray-100"><h3 className="font-bold text-gray-900 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500"/> Đơn chờ duyệt khẩn</h3></div>
            <div className="p-4 overflow-y-auto space-y-3">
                <div className="text-center text-sm text-gray-500 py-10">Không có đơn chờ duyệt.</div>
            </div>
          </div>
        </div>
      </div>
    );

    

    return (
      <div className="space-y-6 pb-10">
        {/* Header & Lọc thời gian có Date Picker */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h2 className="text-2xl font-black text-gray-900">Giám sát Trực tiếp</h2>
            <p className="text-gray-500 text-sm mt-1">Cập nhật trạng thái phòng và thiết bị realtime.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-black transition-colors">
              <QrCode className="w-4 h-4" /> Quét mã QR
            </button>
            <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 w-full sm:w-auto items-center overflow-x-auto scrollbar-hide">
              {[{ id: "today", label: "Hôm nay" }, { id: "yesterday", label: "Hôm qua" }, { id: "7days", label: "7 Ngày" }].map(f => (
                <button key={f.id} onClick={() => { setTimeFilter(f.id as TimeFilter); setCustomDate(""); }}
                  className={`px-4 py-1.5 text-sm font-bold rounded-lg whitespace-nowrap transition-all ${timeFilter === f.id && !customDate ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >{f.label}</button>
              ))}
              <div className="h-4 w-px bg-gray-300 mx-2"></div>
              {/* DATE PICKER TÙY CHỌN NGÀY */}
              <input 
                type="date" 
                value={customDate}
                onChange={(e) => { setCustomDate(e.target.value); setTimeFilter("custom"); }}
                className={`px-3 py-1 text-sm font-bold rounded-lg bg-transparent outline-none cursor-pointer ${customDate ? "text-emerald-600 bg-white shadow-sm" : "text-gray-500"}`}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ================= TAB 2: LỊCH ĐIỀU PHỐI (CÓ QUICK BOOK) =================
  const renderTimeline = () => {
    const startHour = 7;
    const endHour = 21;
    const totalMins = (endHour - startHour) * 60;
    const timeHeaders = [];
    for (let i = startHour; i <= endHour; i++) timeHeaders.push(`${i.toString().padStart(2, '0')}:00`);

    const getStatusColor = (status: string) => {
      if (status === 'checked-in') return 'bg-emerald-500 border-emerald-600 text-white';
      if (status === 'confirmed') return 'bg-blue-500 border-blue-600 text-white';
      if (status === 'pending') return 'bg-amber-400 border-amber-500 text-amber-950';
      return 'bg-gray-400 text-white';
    };

    return (
      <div className="space-y-6 flex flex-col h-[calc(100vh-6rem)]">
        <div className="flex justify-between items-end shrink-0">
          <div>
            <h2 className="text-2xl font-black text-gray-900">Lịch Điều Phối (Excel Grid)</h2>
            <p className="text-gray-500 mt-1 flex gap-4 text-sm font-medium">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Đang dùng</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Đã duyệt</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-200"></span> Lịch trống (Click để đặt)</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
             <input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold bg-white" />
          </div>
        </div>

        <div className="flex-1 bg-white border border-gray-200 rounded-2xl overflow-auto relative shadow-sm">
          <div className="min-w-[1200px]">
            {/* Header Khung giờ */}
            <div className="flex sticky top-0 z-20 bg-slate-50 border-b border-gray-200 shadow-sm">
              <div className="w-64 shrink-0 sticky left-0 z-30 bg-slate-50 border-r border-gray-200 p-4 font-black text-gray-700 flex items-center justify-between">
                Danh sách Phòng
              </div>
              <div className="flex-1 relative flex">
                {timeHeaders.map((time, idx) => (
                  <div key={idx} className="flex-1 border-r border-gray-100 p-3 text-xs font-bold text-gray-400 text-center relative">
                    <span className="absolute -left-3 top-3 bg-slate-50 px-1">{time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Các Hàng: Từng Phòng Lab (HIỂN THỊ CẢ PHÒNG TRỐNG) */}
            {rooms.map((room) => {
              const roomBookings = bookings.filter(b => b.roomId === room.id);

              return (
                <div key={room.id} className="flex border-b border-gray-100 group hover:bg-emerald-50/30 transition-colors h-24">
                  <div className="w-64 shrink-0 sticky left-0 z-10 bg-white group-hover:bg-emerald-50/50 border-r border-gray-200 p-4 flex flex-col justify-center">
                    <h3 className="font-bold text-gray-900 leading-tight">{room.name}</h3>
                    <p className="text-xs text-gray-500 font-medium mt-1"><MapPin className="w-3 h-3 inline" /> {room.building} - {room.floor}</p>
                    <p className="text-xs text-gray-400 mt-0.5"><Users className="w-3 h-3 inline" /> {room.capacity} người</p>
                  </div>

                  {/* Khu vực lưới: Click background để gọi Modal Quick Book */}
                  <div 
                    className="flex-1 relative bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABZJREFUeNpi2rVq1X8GBgYQwgcsAAgwAA9GA9/5o7wLAAAAAElFTkSuQmCC')] cursor-pointer hover:bg-emerald-50/20"
                    onClick={() => {
                      setQuickBookData(prev => ({ ...prev, roomId: room.id, roomName: room.name }));
                      setShowQuickBook(true);
                    }}
                    title="Click vào ô trống để Đặt phòng nhanh"
                  >
                    {roomBookings.map((booking) => {
                      const [h, m] = booking.startTime.split(':').map(Number);
                      const startMins = (h - startHour) * 60 + m;
                      const leftPct = (startMins / totalMins) * 100;
                      const widthPct = (booking.durationMins / totalMins) * 100;

                      return (
                        <div 
                          key={booking.id} 
                          className={`absolute top-2 bottom-2 ${getStatusColor(booking.status)} border rounded-lg p-2 shadow-sm z-10 flex flex-col justify-center cursor-default`}
                          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                          onClick={(e) => { e.stopPropagation(); /* Mở form sửa nếu cần */ }}
                        >
                          <p className="text-xs font-bold truncate leading-tight">{booking.customerName}</p>
                          <p className="text-[10px] opacity-90 truncate font-medium">{booking.startTime}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MODAL ĐẶT PHÒNG NHANH (QUICK BOOK) */}
        {showQuickBook && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="bg-emerald-600 p-4 flex justify-between items-center text-white">
                <h3 className="font-black text-lg">Đặt phòng nhanh (Walk-in)</h3>
                <button onClick={() => setShowQuickBook(false)}><X className="w-5 h-5 hover:bg-emerald-700 rounded-full" /></button>
              </div>
              <form onSubmit={handleQuickBookSubmit} className="p-6 space-y-4">
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl mb-4">
                  <p className="text-xs font-bold text-emerald-700 uppercase">Phòng được chọn:</p>
                  <p className="font-black text-emerald-900">{quickBookData.roomName}</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Tên khách hàng / GV *</label>
                  <input type="text" required value={quickBookData.customerName} onChange={e => setQuickBookData({...quickBookData, customerName: e.target.value})} className="w-full px-4 py-2 border rounded-lg" placeholder="Nhập tên..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Giờ bắt đầu</label>
                    <input type="time" required value={quickBookData.startTime} onChange={e => setQuickBookData({...quickBookData, startTime: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Thời lượng (Phút)</label>
                    <input type="number" required value={quickBookData.durationMins} onChange={e => setQuickBookData({...quickBookData, durationMins: parseInt(e.target.value)})} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                </div>
                <button type="submit" className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-md transition-all">
                  Tạo ca & Check-in ngay
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    );
  };

  // ================= TAB 3: BÁO CÁO (REPORTS) =================
  const renderReports = () => (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-black text-gray-900">Báo cáo Sự cố & Vận hành</h2>
        <p className="text-gray-500 mt-1">Gửi trực tiếp các vấn đề phát sinh lên Ban quản trị (Admin).</p>
      </div>

      <form className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Loại báo cáo</label>
              <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500">
                <option>Hỏng hóc thiết bị</option>
                <option>Cơ sở hạ tầng (Điện, Nước, Điều hòa)</option>
                <option>Phản ánh của Khách hàng</option>
                <option>Đề xuất mua sắm mới</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Mức độ nghiêm trọng</label>
              <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-red-500">
                <option>Bình thường</option>
                <option>Khẩn cấp (Cần xử lý ngay)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Tiêu đề báo cáo</label>
            <input type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500" placeholder="VD: Hỏng điều hòa phòng Lab 01" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Chi tiết mô tả</label>
            <textarea rows={5} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500" placeholder="Mô tả rõ tình trạng sự cố..."></textarea>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Đính kèm ảnh hiện trường</label>
            <input type="file" className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700" />
          </div>
          <button type="button" onClick={() => alert("Đã gửi báo cáo lên Admin!")} className="w-full md:w-auto px-8 py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-md">
            Gửi Báo Cáo
          </button>
        </div>
      </form>
    </div>
  );

  // ================= TAB 4: TRA CỨU (LOOKUP) =================
  const renderLookup = () => (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="text-center py-8">
        <h2 className="text-3xl font-black text-gray-900 mb-4">Hệ thống Tra cứu Nhanh</h2>
        <div className="relative max-w-2xl mx-auto">
          <Search className="w-6 h-6 absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" />
          <input 
            type="text" 
            placeholder="Nhập Số điện thoại, Mã đơn đặt phòng, hoặc Serial Thiết bị..." 
            className="w-full pl-12 pr-4 py-4 text-lg bg-white border-2 border-emerald-100 rounded-2xl focus:outline-none focus:border-emerald-500 shadow-sm"
          />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-600 text-white font-bold px-6 py-2 rounded-xl">Tìm</button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-gray-700">Kết quả tìm kiếm mẫu</div>
        <table className="w-full text-left text-sm">
          <tbody>
            <tr className="border-b hover:bg-gray-50">
              <td className="p-4"><span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">Mã Đơn</span></td>
              <td className="p-4 font-bold">BK-99120</td>
              <td className="p-4 text-gray-600">Khách: Lê Thị B - SĐT: 0987654321</td>
              <td className="p-4 text-emerald-600 font-bold">Hoàn tất</td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="p-4"><span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded">Thiết bị</span></td>
              <td className="p-4 font-bold">SN: PROJ-4K-01</td>
              <td className="p-4 text-gray-600">Máy chiếu 4K Sony</td>
              <td className="p-4 text-amber-600 font-bold">Đang cho mượn</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {renderSidebar()}
      
      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10">
        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
           <h1 className="text-xl font-black flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-emerald-500" /> Manager<span className="text-emerald-500">Ops</span></h1>
           <button onClick={handleLogout} className="p-2 text-red-500 bg-red-50 rounded-lg"><LogOut className="w-5 h-5"/></button>
        </div>
        
        {/* Mobile Nav Tabs */}
        <div className="md:hidden flex overflow-x-auto gap-2 mb-6 pb-2 scrollbar-hide">
          {[
            { id: "dashboard", label: "Giám sát" }, { id: "timeline", label: "Điều phối" },
            { id: "labs", label: "Phòng" }, { id: "equipments", label: "Thiết bị" },
            { id: "reports", label: "Báo cáo" }, { id: "lookup", label: "Tra cứu" }
          ].map(t => (
            <button key={t.id} onClick={() => setActiveMenu(t.id as MenuTab)}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${activeMenu === t.id ? "bg-emerald-600 text-white" : "bg-white text-gray-500 border border-gray-200"}`}
            >{t.label}</button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <div className="flex justify-center items-center py-20">
               <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
            </div>
          ) : (
            <motion.div key={activeMenu} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              {activeMenu === "dashboard" && renderDashboard()}
              {activeMenu === "labs" && renderLabsTable()} 
              {activeMenu === "equipments" && renderEquipmentsTable()} 
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