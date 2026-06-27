export interface Report {
    _id: string;
  
    type: "ROOM" | "EQUIPMENT";
  
    title: string;
    description: string;
  
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  
    roomId?: string;
    roomName?: string;
  
    equipmentId?: string;
    equipmentName?: string;
  
    status: string;
  
    createdBy: string;
  
    assignedTo?: string;
  
    createdAt: string;
    updatedAt: string;
  }