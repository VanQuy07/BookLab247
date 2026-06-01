import { LabRoom } from '../types/lab';

// CHÚ Ý: Đã thêm dấu "/" vào cuối đường dẫn để khớp với FastAPI
const API_URL = 'https://booklab247.onrender.com/api/v1/labs';

export const labService = {
  getAllLabs: async (): Promise<LabRoom[]> => {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error('Lỗi khi tải danh sách phòng từ server');
    }
    return response.json();
  },

  createLab: async (data: Omit<LabRoom, 'id'>): Promise<LabRoom> => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Lỗi khi thêm phòng vào server');
    }
    return response.json();
  },

  deleteLab: async (id: string): Promise<void> => {
    console.log("Xóa lab id:", id);
  }
};