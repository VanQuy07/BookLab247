import { getApiBaseUrl } from "./api-client";

export async function getReportById(id: string) {
  const token = localStorage.getItem("access_token") || "";
  const response = await fetch(
    `${getApiBaseUrl()}/reports/${id}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) {
    throw new Error("Không lấy được báo cáo");
  }

  return response.json();
}

export async function getReports() {
  const token = localStorage.getItem("access_token") || "";
  const response = await fetch(
    `${getApiBaseUrl()}/reports/`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) {
    throw new Error("Không lấy được danh sách báo cáo");
  }

  return response.json();
}

export async function createReport(data: any) {
  const token = localStorage.getItem("access_token") || "";
  const response = await fetch(
    `${getApiBaseUrl()}/reports/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }
  );

  return response.json();
}

export async function updateReportStatus(
  reportId: string,
  status: string,
  changedBy: string,
  message = ""
) {
  const token = localStorage.getItem("access_token") || "";
  const response = await fetch(
    `${getApiBaseUrl()}/reports/${reportId}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status, changedBy, message }),
    }
  );

  return response.json();
}

export async function assignReport(
  reportId: string,
  assignedTo: string
) {
  const token = localStorage.getItem("access_token") || "";
  const response = await fetch(
    `${getApiBaseUrl()}/reports/${reportId}/assign`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ assignedTo }),
    }
  );

  return response.json();
}

export async function addComment(
  reportId: string,
  userId: string,
  content: string
) {
  const token = localStorage.getItem("access_token") || "";
  const response = await fetch(
    `${getApiBaseUrl()}/reports/${reportId}/comment`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId, content }),
    }
  );

  return response.json();
}