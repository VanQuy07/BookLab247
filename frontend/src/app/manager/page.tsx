"use client";

import { deviceService, DeviceData } from "../../services/device";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Layers,
  Cpu,
  Users,
  Wrench,
  LogOut,
  Banknote,
} from "lucide-react"; // Đã thêm Banknote

// Đảm bảo đường dẫn import đúng với cấu trúc thư mục của bạn
import { LabRoom } from "../../types/lab";
import { labService } from "../../services/lab";

export default function ManagerDashboardPage() {
  const router = useRouter();

 const [activeTab, setActiveTab] = useState<"labs" | "devices" | "status" | "deviceStatus">("labs");
  const [labs, setLabs] = useState<LabRoom[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Đã bổ sung trường price vào state
  const [newLab, setNewLab] = useState<Omit<LabRoom, "id">>({
    title: "",
    capacity: "",
    priceText: "",
    price: "",
    imageUrl: "",
  });
  // Thêm state để lưu thông tin phòng đang được chọn để sửa
  const [editingLabId, setEditingLabId] = useState<string | null>(null);

  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [newDevice, setNewDevice] = useState<Omit<DeviceData, "id">>({
    name: "",
    status: "Available",
    lab_id: "",
    imageUrl: "",
  });
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
  const [uploadingDeviceImage, setUploadingDeviceImage] = useState(false);
  const [deviceStatusFilter, setDeviceStatusFilter] = useState<string>("all");
  const [labStatusFilter, setLabStatusFilter] = useState<string>("all");
  
  
  // State phân trang
  const [skip, setSkip] = useState(0);
  const [totalLabs, setTotalLabs] = useState(0);
  const LIMIT = 6;

  // useEffect(() => {
  //   const token = localStorage.getItem("access_token");
  //   if (!token) {
  //     router.push("/login");
  //   } else {
  //     loadLabs();
  //   }
  // }, [router]);


  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
    } else {
      if (activeTab === "labs" || activeTab === "status") {
        loadLabs();
      } else if (activeTab === "devices" || activeTab === "deviceStatus") {
        loadDevices(); 
      }
    }
  }, [router, activeTab]);


  const loadDevices = async () => {
    try {
      setLoading(true);
      const data = await deviceService.getAllDevices();
      setDevices(data);
    } catch (error) {
      console.error(error);
      alert("Không thể tải danh sách thiết bị!");
    } finally {
      setLoading(false);
    }
  };

  // const loadLabs = async () => {
  //   try {
  //     setLoading(true);
  //     const data = await labService.getAllLabs();
  //     setLabs(data);
  //   } catch (error) {
  //     console.error(error);
  //     alert("Không thể kết nối đến máy chủ!");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const loadLabs = async (isLoadMore = false) => {
    try {
      if (!isLoadMore) setLoading(true);
      
      const currentSkip = isLoadMore ? skip + LIMIT : 0;
      const response = await labService.getAllLabs(currentSkip, LIMIT);
      
      if (isLoadMore) {
        setLabs((prev) => [...prev, ...response.data]); // Nối dữ liệu cũ và mới
      } else {
        setLabs(response.data); // Load lần đầu
      }
      
      setSkip(currentSkip);
      setTotalLabs(response.total);
    } catch (error) {
      console.error(error);
      alert("Không thể kết nối đến máy chủ!");
    } finally {
      setLoading(false);
    }
  };

  // const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (!file) return;

  //   // Gói file lại để gửi đi
  //   const formData = new FormData();
  //   formData.append("file", file);

  //   setUploadingImage(true);
  //   try {
  //     const response = await fetch(
  //       "http://127.0.0.1:8000/api/v1/labs/upload-image",
  //       {
  //         method: "POST",
  //         body: formData, // KHÔNG set Content-Type, trình duyệt sẽ tự động làm
  //       },
  //     );

  //     if (!response.ok) throw new Error("Lỗi upload");

  //     const data = await response.json();
  //     // Lấy link ảnh Backend trả về, tự động điền vào state newLab
  //     setNewLab((prev) => ({ ...prev, imageUrl: data.imageUrl }));
  //   } catch (error) {
  //     console.error(error);
  //     alert("Không thể tải ảnh lên!");
  //   } finally {
  //     setUploadingImage(false);
  //   }
  // };


  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const imageUrl = await labService.uploadImage(file);
      
      setNewLab((prev) => ({ ...prev, imageUrl }));
    } catch (error) {
      console.error(error);
      alert("Không thể tải ảnh lên!");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeviceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDeviceImage(true);
    try {
      // Tái sử dụng hàm uploadImage từ labService vì cùng đẩy lên thư mục uploads của Backend
      const imageUrl = await labService.uploadImage(file);
      
      // Đổ link ảnh nhận được vào state của thiết bị
      setNewDevice((prev) => ({ ...prev, imageUrl }));
    } catch (error) {
      console.error(error);
      alert("Không thể tải ảnh thiết bị lên!");
    } finally {
      setUploadingDeviceImage(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewLab((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddLab = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Validate thêm trường price
    if (
      !newLab.title ||
      !newLab.capacity ||
      !newLab.price ||
      !newLab.imageUrl
    ) {
      alert("Vui lòng điền các thông tin bắt buộc (có dấu *)");
      return;
    }
    try {
      const createdLab = await labService.createLab(newLab);
      setLabs((prev) => [...prev, createdLab]);
      setNewLab({
        title: "",
        capacity: "",
        priceText: "",
        price: "",
        imageUrl: "",
      });
      alert("Đã lưu thành công!");
    } catch (error) {
      console.error(error);
      alert("Thêm phòng thất bại!");
    }
  };

  const handleEditClick = (lab: LabRoom) => {
    setEditingLabId(lab.id);
    setNewLab({
      title: lab.title,
      capacity: lab.capacity,
      priceText: lab.priceText || "",
      price: lab.price || "",
      imageUrl: lab.imageUrl,
    });
  };

  const handleUpdateLab = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingLabId) return;

    try {
      // Gọi API update từ labService
      await labService.updateLab(editingLabId, newLab);
      
      // Cập nhật lại state danh sách phòng ở client để hiển thị luôn không cần reload trang
      setLabs((prev) =>
        prev.map((lab) => (lab.id === editingLabId ? { ...lab, ...newLab } : lab))
      );

      setEditingLabId(null);
      setNewLab({title: "", capacity: "", priceText: "", price: "", imageUrl: ""});
      alert("Cập nhật phòng thành công!");
      
    } catch (error) {
      console.error(error);
      alert("Cập nhật phòng thất bại!");
    }
  }

  const handleDeleteLab = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa phòng này?")) return;
    try {
      await labService.deleteLab(id);
      setLabs((prev) => prev.filter((lab) => lab.id !== id));
    } catch (error) {
      console.error(error);
      alert("Không thể xóa dữ liệu!");
    }
  };

  const handleDeviceInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewDevice((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDevice.name) return alert("Vui lòng nhập tên thiết bị!");
    try {
      const created = await deviceService.createDevice(newDevice);
      setDevices((prev) => [...prev, created]);
      setNewDevice({ name: "", status: "Available", lab_id: "", imageUrl: "" });
      alert("Thêm thiết bị thành công!");
    } catch (error) {
      alert("Thêm thất bại!");
    }
  };

  const handleDeviceEditClick = (device: DeviceData) => {
    setEditingDeviceId(device.id || null);
    setNewDevice({
      name: device.name,
      status: device.status,
      lab_id: device.lab_id,
      imageUrl: device.imageUrl || "",
    });
  };

  const handleUpdateDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDeviceId) return;
    try {
      await deviceService.updateDevice(editingDeviceId, newDevice);
      setDevices((prev) => prev.map((d) => (d.id === editingDeviceId ? { ...d, ...newDevice } : d)));
      setEditingDeviceId(null);
      setNewDevice({ name: "", status: "Available", lab_id: "", imageUrl: "" });
      alert("Cập nhật thiết bị thành công!");
    } catch (error) {
      alert("Cập nhật thất bại!");
    }
  };

  const handleDeleteDevice = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa thiết bị này?")) return;
    try {
      await deviceService.deleteDevice(id);
      setDevices((prev) => prev.filter((d) => d.id !== id));
    } catch (error) {
      alert("Xóa thất bại!");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    router.push("/login");
  };

  const filteredDevices = devices.filter((device) => {
    if (deviceStatusFilter === "all") return true;
    return device.status === deviceStatusFilter;
  });

  const filteredLabs = labs.filter((lab) => {
    if (labStatusFilter === "all") return true;
    
    const isAvailable = (lab as any).status !== "Booked"; 
    if (labStatusFilter === "Available") return isAvailable;   // Lọc phòng rảnh
    if (labStatusFilter === "Booked") return !isAvailable;      // Lọc phòng đã đặt
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10 text-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* Header Manager (Đã đổi tên để phân biệt với Admin) */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            BẢNG QUẢN LÝ (MANAGER)
          </h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm bg-red-50 text-red-600 px-4 py-2.5 rounded-xl font-bold hover:bg-red-100 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Đăng xuất
          </button>
        </div>

        {/* Tabs Điều hướng
        <div className="flex gap-4 border-b border-gray-200 mb-8">
          <button
            onClick={() => setActiveTab("labs")}
            className={`flex items-center gap-2 pb-4 font-semibold border-b-2 px-2 transition-colors ${
              activeTab === "labs"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Layers className="w-5 h-5" /> Quản lý Phòng Lab
          </button>
          <button
            onClick={() => setActiveTab("devices")}
            className={`flex items-center gap-2 pb-4 font-semibold border-b-2 px-2 transition-colors ${
              activeTab === "devices"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Cpu className="w-5 h-5" /> Quản lý Thiết bị
          </button>
        </div> */}

        {/* Tabs Điều hướng */}
        <div className="flex gap-4 border-b border-gray-200 mb-8 overflow-x-auto whitespace-nowrap pb-1">
          <button
            onClick={() => setActiveTab("labs")}
            className={`flex items-center gap-2 pb-4 font-semibold border-b-2 px-2 flex-shrink-0 transition-colors ${
              activeTab === "labs"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Layers className="w-5 h-5" /> Quản lý Phòng Lab
          </button>
          
          <button
            onClick={() => setActiveTab("devices")}
            className={`flex items-center gap-2 pb-4 font-semibold border-b-2 px-2 flex-shrink-0 transition-colors ${
              activeTab === "devices"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Cpu className="w-5 h-5" /> Quản lý Thiết bị
          </button>

          <button
            onClick={() => setActiveTab("status")}
            className={`flex items-center gap-2 pb-4 font-semibold border-b-2 px-2 flex-shrink-0 transition-colors ${
              activeTab === "status"
                ? "border-green-600 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Layers className="w-5 h-5" /> Trạng thái Phòng
          </button>

          <button
            onClick={() => setActiveTab("deviceStatus")}
            className={`flex items-center gap-2 pb-4 font-semibold border-b-2 px-2 flex-shrink-0 transition-colors ${
              activeTab === "deviceStatus"
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Cpu className="w-5 h-5" /> Trạng thái Thiết bị
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500 font-medium flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            Đang tải dữ liệu...
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === "labs" && (
              <motion.div
                key="labs-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* Form Thêm */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
                  {/* <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-blue-900">
                    <Plus className="w-5 h-5 text-blue-600" /> Thêm Phòng Mới
                  </h2> */}

                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-blue-900">
                    <Plus className="w-5 h-5 text-blue-600" /> 
                    {editingLabId ? "Cập Nhật Phòng Lab" : "Thêm Phòng Mới"}
                  </h2>

                  {/* <form onSubmit={handleAddLab} className="space-y-4"> */}
                  <form onSubmit={editingLabId ? handleUpdateLab : handleAddLab} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Tên phòng Lab *
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={newLab.title}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Sức chứa *
                      </label>
                      <input
                        type="text"
                        name="capacity"
                        value={newLab.capacity}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
                        placeholder="VD: 40 Sinh viên"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Cấu hình / Thiết bị
                      </label>
                      <input
                        type="text"
                        name="priceText"
                        value={newLab.priceText}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
                        placeholder="VD: Màn chiếu, Đèn LED"
                      />
                    </div>

                    {/* KHỐI NHẬP GIÁ TIỀN */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Giá tiền *
                      </label>
                      <input
                        type="text"
                        name="price"
                        value={newLab.price}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
                        placeholder="VD: 400.000đ/giờ"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Hình ảnh phòng Lab *
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                      />
                      {uploadingImage && (
                        <p className="text-xs text-blue-500 mt-2 font-medium animate-pulse">
                          Đang tải ảnh lên server...
                        </p>
                      )}
                      {newLab.imageUrl && !uploadingImage && (
                        <div className="mt-3 relative w-full h-32 rounded-xl overflow-hidden border border-gray-200">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={newLab.imageUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                    {/* <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-sm mt-2 shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all"
                    >
                      LƯU PHÒNG LAB
                    </button>
                  </form>
                </div> */}


                {editingLabId ? (
                      <div className="flex gap-2 mt-2">
                        <button
                          type="submit"
                          className="w-2/3 bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl text-sm shadow-lg shadow-green-600/20 active:scale-[0.98] transition-all"
                        >
                          CẬP NHẬT
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingLabId(null);
                            setNewLab({ title: "", capacity: "", priceText: "", price: "", imageUrl: "" });
                          }}
                          className="w-1/3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3.5 rounded-xl text-sm active:scale-[0.98] transition-all"
                        >
                          HỦY
                        </button>
                      </div>
                    ) : (
                      <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-sm mt-2 shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all"
                      >
                        LƯU PHÒNG LAB
                      </button>
                    )}
                  </form>
                </div>

                {/* Danh Sách */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h2 className="text-xl font-bold mb-6 text-gray-900">
                    Danh Sách Phòng
                  </h2>
                  <div className="space-y-4">
                    {labs.map((lab) => (
                      <div
                        key={lab.id}
                        className="flex items-center justify-between p-4 border border-gray-100 rounded-xl gap-4 hover:bg-gray-50 transition-colors group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={lab.imageUrl}
                              alt={lab.title}
                              className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                            />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-base">
                              {lab.title}
                            </h3>
                            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500 mt-2">
                              <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" /> {lab.capacity}
                              </span>
                              {lab.priceText && (
                                <span className="flex items-center gap-1">
                                  <Wrench className="w-3.5 h-3.5" />{" "}
                                  {lab.priceText}
                                </span>
                              )}
                              {lab.price && (
                                <span className="flex items-center gap-1 font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                  <Banknote className="w-3.5 h-3.5" />{" "}
                                  {lab.price}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {/* NÚT SỬA MỚI THÊM */}
                          <button
                            onClick={() => handleEditClick(lab)}
                            className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                            title="Sửa thông tin"
                          >
                            <Wrench className="w-5 h-5" /> {/* Sử dụng tạm icon Wrench có sẵn trong file của bạn */}
                          </button>

                          <button
                            onClick={() => handleDeleteLab(lab.id)}
                            className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>

                        {/* <button
                          onClick={() => handleDeleteLab(lab.id)}
                          className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button> */}
                      </div>
                    ))}
                    {labs.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <Layers className="w-12 h-12 mb-3 text-gray-200" />
                        <p className="text-sm font-medium">
                          Chưa có phòng nào trong cơ sở dữ liệu.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* ======================= TAB THEO DÕI TRẠNG THÁI PHÒNG ======================= */}
            {activeTab === "status" && (
              <motion.div
                key="status-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
              >
                {/* Tiêu đề & Thanh bộ lọc nhanh phòng */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-50">
                  <h2 className="text-xl font-bold text-gray-900">
                    Theo Dõi Trạng Thái Phòng
                  </h2>
                  
                  {/* THANH NÚT BẤM BỘ LỌC NHANH PHÒNG LAB */}
                  <div className="flex flex-wrap gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100 w-fit">
                    <button
                      type="button"
                      onClick={() => setLabStatusFilter("all")}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                        labStatusFilter === "all"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Tất cả ({labs.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setLabStatusFilter("Available")}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                        labStatusFilter === "Available"
                          ? "bg-green-500 text-white shadow-sm"
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      Phòng Rảnh ({labs.filter(l => (l as any).status !== "Booked").length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setLabStatusFilter("Booked")}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                        labStatusFilter === "Booked"
                          ? "bg-red-500 text-white shadow-sm"
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      Đã Được Đặt ({labs.filter(l => (l as any).status === "Booked").length})
                    </button>
                  </div>
                </div>
                
                {/* Lưới hiển thị phòng (Đã đổi từ labs sang filteredLabs) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredLabs.map((lab) => {
                    const isAvailable = (lab as any).status !== "Booked"; 
                    
                    return (
                      <div key={`status-${lab.id}`} className="border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                        <div className="h-40 relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={lab.imageUrl} alt={lab.title} className="w-full h-full object-cover" />
                          <div className={`absolute top-3 right-3 px-3 py-1 text-xs font-bold rounded-full text-white shadow-sm ${isAvailable ? 'bg-green-500' : 'bg-red-500'}`}>
                            {isAvailable ? "Phòng Rảnh" : "Đã Được Đặt"}
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-gray-900 mb-2">{lab.title}</h3>
                          <p className="text-sm text-gray-500 flex items-center gap-2"><Users className="w-4 h-4"/> Sức chứa: {lab.capacity}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {filteredLabs.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <Layers className="w-12 h-12 mb-3 text-gray-200" />
                    <p className="text-sm font-medium">Không tìm thấy phòng nào thuộc trạng thái này.</p>
                  </div>
                )}

                {/* NÚT LOAD MORE (Chỉ hiện khi xem ở chế độ "Tất cả") */}
                {labStatusFilter === "all" && labs.length < totalLabs && (
                  <div className="flex justify-center mt-8">
                    <button 
                      onClick={() => loadLabs(true)}
                      className="px-6 py-2.5 bg-white border-2 border-blue-100 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors"
                    >
                      Xem thêm các phòng khác ({labs.length}/{totalLabs})
                    </button>
                  </div>
                )}
              </motion.div>
            )}
            
            {/* ======================= TAB QUẢN LÝ THIẾT BỊ ======================= */}
            {activeTab === "devices" && (
              <motion.div
                key="devices-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* Form Thêm / Sửa Thiết bị */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-blue-900">
                    <Cpu className="w-5 h-5 text-blue-600" /> 
                    {editingDeviceId ? "Cập Nhật Thiết Bị" : "Thêm Thiết Bị Mới"}
                  </h2>
                  <form onSubmit={editingDeviceId ? handleUpdateDevice : handleAddDevice} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Tên thiết bị *</label>
                      <input
                        type="text"
                        name="name"
                        value={newDevice.name}
                        onChange={handleDeviceInputChange}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
                        placeholder="VD: Máy chiếu Sony B"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Trạng thái hoạt động</label>
                      <select
                        name="status"
                        value={newDevice.status}
                        onChange={handleDeviceInputChange}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
                      >
                        <option value="Available">Sẵn sàng sử dụng </option>
                        <option value="Maintenance">Đang bảo trì </option>
                        <option value="Broken">Đang hỏng </option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Thuộc Phòng Lab</label>
                      <select
                        name="lab_id"
                        value={newDevice.lab_id}
                        onChange={handleDeviceInputChange}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
                      >
                        <option value="">Để trong kho (Chưa gán phòng)</option>
                        {labs.map((lab) => (
                          <option key={lab.id} value={lab.id}>{lab.title}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Hình ảnh thiết bị *
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleDeviceImageUpload}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                      />
                      {uploadingDeviceImage && (
                        <p className="text-xs text-blue-500 mt-2 font-medium animate-pulse">
                          Đang tải ảnh lên server...
                        </p>
                      )}
                      {newDevice.imageUrl && !uploadingDeviceImage && (
                        <div className="mt-3 relative w-full h-32 rounded-xl overflow-hidden border border-gray-200">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={newDevice.imageUrl}
                            alt="Device Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>

                    {editingDeviceId ? (
                      <div className="flex gap-2 mt-2">
                        <button type="submit" className="w-2/3 bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl text-sm transition-all">CẬP NHẬT</button>
                        <button type="button" onClick={() => { setEditingDeviceId(null); setNewDevice({ name: "", status: "Available", lab_id: "", imageUrl: "" }); }} className="w-1/3 bg-gray-200 text-gray-700 font-bold py-3.5 rounded-xl text-sm transition-all">HỦY</button>
                      </div>
                    ) : (
                      <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-sm shadow-lg shadow-blue-600/20 transition-all">LƯU THIẾT BỊ</button>
                    )}
                  </form>
                </div>

                {/* Danh Sách Thiết Bị */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h2 className="text-xl font-bold mb-6 text-gray-900">Danh Sách Thiết Bị Toàn Hệ Thống</h2>
                  <div className="space-y-4">
                    {devices.map((device) => (
                      <div key={device.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl gap-4 hover:bg-gray-50 transition-colors group">
                        <div className="flex items-center gap-4">
                          
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={(device as any).imageUrl || "https://placehold.co/150?text=No+Image"}
                              alt={device.name}
                              className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                            />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-base">{device.name}</h3>
                            <div className="flex gap-3 text-xs mt-2">
                              <span className={`px-2.5 py-0.5 rounded-md font-medium text-white ${device.status === 'Available' ? 'bg-green-500' : device.status === 'Maintenance' ? 'bg-yellow-500' : 'bg-red-500'}`}>
                                {device.status}
                              </span>
                              <span className="text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                                Thuộc Phòng Lab: {labs.find(l => l.id === device.lab_id)?.title || "Trong kho"}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleDeviceEditClick(device)} className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"><Wrench className="w-5 h-5" /></button>
                          <button onClick={() => handleDeleteDevice(device.id || "")} className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Trash2 className="w-5 h-5" /></button>
                        </div>
                      </div>
                    ))}

                    {devices.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <Cpu className="w-12 h-12 mb-3 text-gray-200" />
                        <p className="text-sm font-medium">Chưa có thiết bị nào trong kho dữ liệu.</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}


            {/* ======================= TAB THEO DÕI TRẠNG THÁI THIẾT BỊ ======================= */}
            {activeTab === "deviceStatus" && (
              <motion.div
                key="device-status-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
              >
                {/* Tiêu đề & Thanh bộ lọc nhanh */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-50">
                  <h2 className="text-xl font-bold text-gray-900">
                    Theo Dõi Trạng Thái Thiết Bị Toàn Hệ Thống
                  </h2>
                  
                  {/* THANH NÚT BẤM BỘ LỌC NHANH (FILTER) */}
                  <div className="flex flex-wrap gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100 w-fit">
                    <button
                      type="button"
                      onClick={() => setDeviceStatusFilter("all")}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                        deviceStatusFilter === "all"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Tất cả ({devices.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeviceStatusFilter("Available")}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                        deviceStatusFilter === "Available"
                          ? "bg-green-500 text-white shadow-sm"
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      Đang hoạt động ({devices.filter(d => d.status === "Available").length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeviceStatusFilter("Maintenance")}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                        deviceStatusFilter === "Maintenance"
                          ? "bg-yellow-500 text-white shadow-sm"
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      Đang bảo trì ({devices.filter(d => d.status === "Maintenance").length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeviceStatusFilter("Broken")}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                        deviceStatusFilter === "Broken"
                          ? "bg-red-500 text-white shadow-sm"
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      Đang hỏng ({devices.filter(d => d.status === "Broken").length})
                    </button>
                  </div>
                </div>
                
                {/* Lưới hiển thị danh sách thiết bị (Đổi từ devices sang filteredDevices) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredDevices.map((device) => {
                    const statusConfig = 
                      device.status === "Available" 
                        ? { text: "Sẵn sàng sử dụng", color: "bg-green-500" }
                        : device.status === "Maintenance"
                        ? { text: "Đang bảo trì", color: "bg-yellow-500" }
                        : { text: "Đang hỏng", color: "bg-red-500" };
                    
                    return (
                      <div key={`status-dev-${device.id}`} className="border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group">
                        <div className="h-40 relative bg-gray-50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={(device as any).imageUrl || "https://placehold.co/150?text=No+Image"} 
                            alt={device.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          />
                          <div className={`absolute top-3 right-3 px-3 py-1 text-xs font-bold rounded-full text-white shadow-sm ${statusConfig.color}`}>
                            {statusConfig.text}
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-gray-900 mb-2 text-base">{device.name}</h3>
                          <p className="text-sm text-gray-500 flex items-center gap-2">
                            <Layers className="w-4 h-4"/> 
                            Vị trí: {labs.find(l => l.id === device.lab_id)?.title || "Chưa xác định (Trong kho)"}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {filteredDevices.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <Cpu className="w-12 h-12 mb-3 text-gray-200" />
                    <p className="text-sm font-medium">Không tìm thấy thiết bị nào thuộc trạng thái này.</p>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
