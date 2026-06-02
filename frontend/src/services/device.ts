const API_URL = 'http://127.0.0.1:8000/api/v1/devices';

export interface DeviceData {
  id?: string;
  name: string;
  status: string; // Available, Maintenance, Broken
  lab_id: string;
  imageUrl: string; 
}

export const deviceService = {
  // Lấy toàn bộ thiết bị
  getAllDevices: async (): Promise<DeviceData[]> => {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Lỗi tải danh sách thiết bị');
    return response.json();
  },

  // Thêm thiết bị mới
  createDevice: async (data: Omit<DeviceData, 'id'>): Promise<DeviceData> => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Lỗi thêm thiết bị');
    return response.json();
  },

  // Cập nhật thiết bị
  updateDevice: async (id: string, data: Partial<DeviceData>): Promise<any> => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Lỗi cập nhật thiết bị');
    return response.json();
  },

  // Xóa thiết bị
  deleteDevice: async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Lỗi xóa thiết bị');
    return response.json();
  }
};