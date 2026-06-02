import { LabRoom } from '../types/lab';

// // CHÚ Ý: Đã thêm dấu "/" vào cuối đường dẫn để khớp với FastAPI
// const API_URL = 'http://127.0.0.1:8000/api/v1/labs';

// export const labService = {
//   getAllLabs: async (): Promise<LabRoom[]> => {
//     const response = await fetch(API_URL);
//     if (!response.ok) {
//       throw new Error('Lỗi khi tải danh sách phòng từ server');
//     }
//     return response.json();
//   },

const API_URL = 'http://127.0.0.1:8000/api/v1/labs';

// Định nghĩa lại kiểu dữ liệu trả về
export interface PagedLabResponse {
  data: LabRoom[];
  total: number;
}

export const labService = {
  // Thêm tham số skip và limit vào hàm gọi API
  getAllLabs: async (skip: number = 0, limit: number = 6): Promise<PagedLabResponse> => {
    const response = await fetch(`${API_URL}?skip=${skip}&limit=${limit}`);
    if (!response.ok) {
      throw new Error('Lỗi khi tải danh sách phòng từ server');
    }
    return response.json();
  },

  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch (`${API_URL}/upload-image`, {
      method: 'POST',
      body: formData,
      // Lưu ý: Để trình duyệt tự động set Content-Type cho multipart/form-data
    });

    if (!response.ok) {
      throw new Error('Lỗi khi upload ảnh lên server');
    }

    const data = await response.json();
    return data.imageUrl; // Trả về đường dẫn ảnh
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

  updateLab: async (id: string, data: Partial<LabRoom>): Promise<any> => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok){
      throw new Error('Lỗi khi cập nhật phòng trên server');
    }
    return response.json();
  },
  

  deleteLab: async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Lỗi khi xóa phòng khỏi server');
    }
    return response.json();
  }
};
  //   console.log("Xóa lab id:", id);
  // }
