import { LabRoom } from '../types/lab';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1/labs';

export const labService = {
  getAllLabs: async (): Promise<LabRoom[]> => {
    const response = await fetch(`${API_URL}/`);
    if (!response.ok) {
      throw new Error('Lỗi khi tải danh sách phòng lab');
    }
    return response.json();
  },

  createLab: async (labData: Omit<LabRoom, 'id'>): Promise<LabRoom> => {
    const response = await fetch(`${API_URL}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(labData),
    });
    if (!response.ok) {
      throw new Error('Lỗi khi thêm mới phòng lab');
    }
    return response.json();
  },

  deleteLab: async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Lỗi khi xóa phòng lab');
    }
  }
};