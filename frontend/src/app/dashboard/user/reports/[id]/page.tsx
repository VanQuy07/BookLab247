"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getReportById } from "../../../../../services/report";

export default function ReportDetailPage() {
    const params = useParams();
    const router = useRouter();

    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "SUBMITTED":
                return "bg-yellow-100 text-yellow-700";

            case "IN_REVIEW":
                return "bg-blue-100 text-blue-700";

            case "APPROVED":
                return "bg-green-100 text-green-700";

            case "IN_PROGRESS":
                return "bg-purple-100 text-purple-700";

            case "RESOLVED":
                return "bg-green-100 text-green-700";

            case "REJECTED":
                return "bg-red-100 text-red-700";

            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    const getStatusLabel = (status: string) => {
        const statusMap: Record<string, string> = {
            "SUBMITTED": "Đã gửi",
            "IN_REVIEW": "Đang xem xét",
            "APPROVED": "Đã phê duyệt",
            "IN_PROGRESS": "Đang xử lý",
            "RESOLVED": "Đã giải quyết",
            "REJECTED": "Từ chối",
            "ESCALATED": "Đã chuyển cấp cao hơn",
            "PENDING": "Đang chờ",
        };
        return statusMap[status] || status;
    };

    const getSeverityLabel = (severity: string) => {
        const severityMap: Record<string, string> = {
            "LOW": "Thấp",
            "MEDIUM": "Trung bình",
            "HIGH": "Cao",
            "CRITICAL": "Cực cao",
        };
        return severityMap[severity] || severity;
    };

    const translateMessage = (message: string) => {
        const replacements: Record<string, string> = {
            "SUBMITTED": "Đã gửi",
            "IN_REVIEW": "Đang xem xét",
            "APPROVED": "Đã phê duyệt",
            "IN_PROGRESS": "Đang xử lý",
            "RESOLVED": "Đã giải quyết",
            "REJECTED": "Từ chối",
            "pending": "Đang chờ",
            "resolved": "Đã giải quyết",
            "escalated": "Đã chuyển cấp cao hơn",
            "in_progress": "Đang xử lý",
            "approved": "Đã phê duyệt",
            "rejected": "Từ chối",
        };
    
        let result = message;
        for (const [eng, vie] of Object.entries(replacements)) {
            // Thay không phân biệt hoa thường
            result = result.replace(new RegExp(eng, "gi"), vie);
        }
        return result;
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case "LOW":
                return "bg-green-100 text-green-700";

            case "MEDIUM":
                return "bg-yellow-100 text-yellow-700";

            case "HIGH":
                return "bg-orange-100 text-orange-700";

            case "CRITICAL":
                return "bg-red-100 text-red-700";

            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    useEffect(() => {
        if (params?.id) {
            fetchReport();
        }
    }, [params?.id]);

    const fetchReport = async () => {
        try {
            setLoading(true);

            const data = await getReportById(
                params.id as string
            );

            setReport(data);
        } catch (error) {
            console.error("Lỗi lấy report:", error);
            setReport(null);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-10">
                Đang tải...
            </div>
        );
    }

    if (!report) {
        return (
            <div className="p-10 text-red-500">
                Không tìm thấy báo cáo
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-10">
            <div className="max-w-5xl mx-auto bg-white rounded-2xl p-8">
                <button
                    onClick={() => router.push("/dashboard/user/reports")}
                    className="flex items-center gap-2 text-gray-500 hover:text-violet-600 font-bold mb-4 transition-colors w-fit group outline-none"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    Quay lại
                </button>

                <h1 className="text-3xl font-bold mb-4">
                    {report.title}
                </h1>

                <p className="text-gray-600 mb-6">
                    {report.description}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-8">

                    <div>
                        <strong>Loại:</strong>{" "}
                        {report.type}
                    </div>

                    <div>
                        <strong>Mức độ:</strong>{" "}
                        <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${getSeverityColor(
                                report.severity
                            )}`}
                        >
                            {getSeverityLabel(report.severity)}
                        </span>
                    </div>

                    <div>
                        <strong>Trạng thái:</strong>{" "}
                        <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                                report.status
                            )}`}
                        >
                            {getStatusLabel(report.status)}
                        </span>
                    </div>

                    <div>
                        <strong>Người báo:</strong>{" "}
                        {report.createdBy}
                    </div>

                    {report.roomName && (
                        <div>
                            <strong>Phòng:</strong>{" "}
                            {report.roomName}
                        </div>
                    )}

                    {report.equipmentName && (
                        <div>
                            <strong>Thiết bị:</strong>{" "}
                            {report.equipmentName}
                        </div>
                    )}

                </div>

                <div>
                    <strong>Ngày tạo:</strong>{" "}
                    {new Date(report.createdAt).toLocaleString(
                        "vi-VN"
                    )}
                </div>

                <div>
                    <strong>Người xử lý:</strong>{" "}
                    {report.assignedTo || "Chưa phân công"}
                </div>

                {/* Ảnh sự cố */}
                {report.images?.length > 0 && (
                    <div className="mt-8 mb-8">

                        <h2 className="text-xl font-bold mb-4">
                            Hình ảnh sự cố
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                            {report.images.map(
                                (
                                    image: string,
                                    index: number
                                ) => (
                                    <img
                                        key={index}
                                        src={image}
                                        alt={`report-${index}`}
                                        className="w-full h-56 object-cover rounded-lg border shadow"
                                    />
                                )
                            )}

                        </div>

                    </div>
                )}

                {/* Timeline */}
                <h2 className="text-xl font-bold mb-4">
                    Timeline xử lý
                </h2>

                <div className="space-y-4">

                    {report.logs?.map(
                        (log: any, index: number) => (
                            <div
                                key={index}
                                className="border-l-4 border-blue-500 pl-4"
                            >
                                <div className="font-semibold">
                                    {getStatusLabel(log.status)}
                                </div>

                                <div>
                                    {translateMessage(log.message)}
                                </div>

                                <div className="text-sm text-gray-500">
                                    {new Date(
                                        log.createdAt
                                    ).toLocaleString("vi-VN")}
                                </div>
                            </div>
                        )
                    )}

                </div>
            </div>
        </div>
    );
}