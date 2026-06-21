"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, X } from "lucide-react";
import { getApiBaseUrl } from "../../../../services/api-client";

interface Report {
  _id: string;
  type: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  roomId?: string;
  roomName?: string;
  equipmentId?: string;
  equipmentName?: string;
  createdBy: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

interface Lab {
  _id: string;
  id?: string;
  name: string;
  building?: string;
}

interface Equipment {
  _id: string;
  id?: string;
  name: string;
  labId?: string;
}

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [labs, setLabs] = useState<Lab[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);

  const [formData, setFormData] = useState({
    type: "ROOM",
    roomId: "",
    equipmentId: "",
    title: "",
    description: "",
    severity: "LOW",
  });

  useEffect(() => {
    fetchReports();
    fetchLabs();
    fetchEquipments();
  }, []);

  const getToken = () => localStorage.getItem("access_token") || "";
  const getUserName = () => localStorage.getItem("user_name") || "anonymous";

  const fetchReports = async () => {
    try {
      const token = getToken();
      if (!token) {
        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
        router.push("/login");
        return;
    }
      console.log("Đang gọi tới URL:", `${getApiBaseUrl()}/reports/`);
      const res = await fetch(`${getApiBaseUrl()}/reports/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Lỗi khi lấy danh sách báo cáo");
      const data = await res.json();
      // Lọc chỉ hiển thị báo cáo của user hiện tại
      const userName = getUserName();
      // const myReports = data.filter(
      //   (r: Report) => r.createdBy === userName
      // );
      const myReports = Array.isArray(data)
        ? data.filter((r: Report) => r.createdBy === userName)
        : [];

      setReports(myReports);
    } catch (error) {
      console.error("Lỗi fetch reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLabs = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/labs`);
      if (res.ok) {
        const data = await res.json();
        setLabs(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Lỗi fetch labs:", error);
    }
  };

  const fetchEquipments = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/equipments`);
      if (res.ok) {
        const data = await res.json();
        setEquipments(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Lỗi fetch equipments:", error);
    }
  };

  const handleCreateReport = async () => {
    if (!formData.title.trim()) {
      alert("Vui lòng nhập tiêu đề");
      return;
    }
    if (!formData.description.trim()) {
      alert("Vui lòng nhập mô tả");
      return;
    }
    if (formData.type === "ROOM" && !formData.roomId) {
      alert("Vui lòng chọn phòng");
      return;
    }
    if (formData.type === "EQUIPMENT" && !formData.equipmentId) {
      alert("Vui lòng chọn thiết bị");
      return;
    }

    try {
      const token = getToken();
      if (!token) {
        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
        router.push("/login");
        return;
    }
      const payload = {
        ...formData,
        createdBy: getUserName(),
      };

      const res = await fetch(`${getApiBaseUrl()}/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.detail || "Tạo báo cáo thất bại");
        return;
      }

      alert(data.message || "Tạo báo cáo thành công");
      setShowCreateModal(false);
      setFormData({
        type: "ROOM",
        roomId: "",
        equipmentId: "",
        title: "",
        description: "",
        severity: "LOW",
      });
      fetchReports();
    } catch (error) {
      console.error("Lỗi tạo báo cáo:", error);
      alert("Có lỗi xảy ra");
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "LOW": return "bg-green-100 text-green-700";
      case "MEDIUM": return "bg-yellow-100 text-yellow-700";
      case "HIGH": return "bg-orange-100 text-orange-700";
      case "CRITICAL": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUBMITTED": return "bg-blue-100 text-blue-700";
      case "IN_REVIEW": return "bg-yellow-100 text-yellow-700";
      case "APPROVED": return "bg-green-100 text-green-700";
      case "IN_PROGRESS": return "bg-purple-100 text-purple-700";
      case "RESOLVED": return "bg-emerald-100 text-emerald-700";
      case "REJECTED": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "SUBMITTED": return "Chờ duyệt";
      case "IN_REVIEW": return "Đang xem xét";
      case "APPROVED": return "Đã duyệt";
      case "IN_PROGRESS": return "Đang xử lý";
      case "RESOLVED": return "Đã xử lý xong";
      case "REJECTED": return "Từ chối";
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Báo cáo sự cố</h1>
            <p className="text-gray-500 mt-1">Quản lý báo cáo của bạn</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-5 h-5" />
            Tạo báo cáo
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Tổng số</p>
            <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Chờ duyệt</p>
            <p className="text-2xl font-bold text-blue-600">
              {reports.filter(r => r.status === "SUBMITTED").length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Đang xử lý</p>
            <p className="text-2xl font-bold text-purple-600">
              {reports.filter(r => ["IN_REVIEW", "IN_PROGRESS", "APPROVED"].includes(r.status)).length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Đã xử lý</p>
            <p className="text-2xl font-bold text-green-600">
              {reports.filter(r => ["RESOLVED", "REJECTED"].includes(r.status)).length}
            </p>
          </div>
        </div>

        {/* Reports List */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {reports.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-4">Bạn chưa có báo cáo nào</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
              >
                Tạo báo cáo đầu tiên
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {reports.map((report) => (
                <div
                  key={report._id}
                  className="p-5 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/dashboard/user/reports/${report._id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{report.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(report.severity)}`}>
                          {report.severity}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                          {getStatusLabel(report.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2">{report.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span>{report.type === "ROOM" ? "📍 Phòng" : "🔧 Thiết bị"}</span>
                        <span>{report.roomName || report.equipmentName || "-"}</span>
                        <span>{new Date(report.createdAt).toLocaleDateString("vi-VN")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-xl font-bold">Tạo báo cáo mới</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loại báo cáo</label>
                <select
                  className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value, roomId: "", equipmentId: "" })}
                >
                  <option value="ROOM">📍 Báo cáo phòng</option>
                  <option value="EQUIPMENT">🔧 Báo cáo thiết bị</option>
                </select>
              </div>

              {/* Room */}
              {formData.type === "ROOM" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Chọn phòng</label>
                  <select
                    className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.roomId}
                    onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                  >
                    <option value="">-- Chọn phòng --</option>
                    {labs.map((lab) => (
                      <option key={lab._id || lab.id} value={lab._id || lab.id}>
                        {lab.name} {lab.building ? `- ${lab.building}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Equipment */}
              {formData.type === "EQUIPMENT" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Chọn thiết bị</label>
                  <select
                    className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.equipmentId}
                    onChange={(e) => setFormData({ ...formData, equipmentId: e.target.value })}
                  >
                    <option value="">-- Chọn thiết bị --</option>
                    {equipments.map((eq) => (
                      <option key={eq._id || eq.id} value={eq._id || eq.id}>
                        {eq.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tiêu đề</label>
                <input
                  className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Mô tả ngắn gọn vấn đề"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả chi tiết</label>
                <textarea
                  className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  rows={4}
                  placeholder="Mô tả chi tiết tình trạng sự cố..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Severity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mức độ nghiêm trọng</label>
                <select
                  className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                >
                  <option value="LOW">🟢 LOW - Bình thường</option>
                  <option value="MEDIUM">🟡 MEDIUM - Trung bình</option>
                  <option value="HIGH">🟠 HIGH - Nghiêm trọng</option>
                  <option value="CRITICAL">🔴 CRITICAL - Khẩn cấp</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-5 border-t bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-5 py-2 border rounded-lg font-medium hover:bg-gray-100"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateReport}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Gửi báo cáo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}