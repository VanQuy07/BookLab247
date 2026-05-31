export interface LabRoom {
  id: string;
  title: string;
  capacity: string;
  priceText: string;
  price?: string;
  imageUrl: string;
}
export interface Device {
  id: string;
  name: string;
  status: 'Sẵn sàng' | 'Đang mượn' | 'Bảo trì';
  labId: string;
}