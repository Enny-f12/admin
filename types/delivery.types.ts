// types/delivery.types.ts

export type DriverStatus = 'ACTIVE' | 'OFFLINE' | 'UNAVAILABLE' | 'SUSPENDED';

export interface Driver {
  userId: string;
  vehicleType: string;
  vehiclePlateNumber: string;
  status: DriverStatus;
  emergencyContactPhone: string | null;
  bankName: string;
  payoutAccountName: string;
  payoutAccountNumber: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
  };
}


export interface DriverLocation {
  driverId: string;
  latitude: number;
  longitude: number;
  recordedAt: string;
  assignmentId: string | null;
}


export type DeliveryAssignmentStatus =
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED';


export interface CreateDriverPayload {
  userId: string;
  vehicleType?: string;
  vehiclePlateNumber?: string;
  emergencyContactPhone?: string;
  bankName?: string;
  payoutAccountName?: string;
  payoutAccountNumber?: string;
}


export interface AssignDeliveryPayload {
  driverId: string;
  etaMinutes?: number;
  deliveryFee?: number;
}


export interface AdminDelivery {
  id: string;
  orderId: string;
  driverId: string;
  status: DeliveryAssignmentStatus;
  etaMinutes: number | null;
  deliveryFee: string; 
  assignedAt: string;
  acceptedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  failedAt: string | null;
  driverNotes: string | null;
  proofOfDeliveryUrl: string | null;
  driver: {
    id: string;
    fullName: string;
    phone: string;
  };
  order: {
    orderNumber: string;
    totalAmount: string;
    deliveryAddressLine1: string | null;
    deliveryCity: string | null;
    branch: { name: string } | null;
  };
}


export interface RawDeliveryAssignment {
  id: string;
  orderId: string;
  driverId: string;
  status: DeliveryAssignmentStatus;
  etaMinutes: number | null;
  deliveryFee: string;
  assignedAt: string;
  acceptedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  failedAt: string | null;
  driverNotes: string | null;
  proofOfDeliveryUrl: string | null;
}


export interface ChowdeckFeeEstimate {
  feeId: number;
  fee: number;
  etaMinutes?: number;
}


export interface DispatchChowdeckPayload {
  feeId: number;
}


export interface ChowdeckTrackingStatus {
  reference: string;
  status: string;
  driverName?: string | null;
  driverPhone?: string | null;
  eta?: string | null;
}


export interface CancelChowdeckPayload {
  reason: string;
}


export interface DeliveryZone {
  id: string;
  branchId: string;
  name: string;
  radiusKm: number;
  baseFee: number;
  minOrder: number;
  enabled: boolean;
}

export interface CreateDeliveryZonePayload {
  branchId: string;
  name: string;
  radiusKm: number;
  baseFee: number;
  minOrder: number;
}

export type UpdateDeliveryZonePayload = Partial<CreateDeliveryZonePayload> & { enabled?: boolean };



export interface DeliveryPartner {
  id: string;
  key: string;              
  name: string;
  enabled: boolean;
  online: boolean;          
  active: number;           
  today: number;            
  avgMin: number;           
  commission: number;
  apiKey: string | null;
  webhookUrl: string | null;
}

export interface UpdateDeliveryPartnerPayload {
  commission?: number;
  apiKey?: string;
  webhookUrl?: string;
  enabled?: boolean;
}


export interface DeliveryPartnersSummary {
  activePartners: number;
  liveOrders: number;
  completedToday: number;
  avgDeliveryMin: number;
}


export interface ChowdeckDispatchResponse {
  reference: string;
  status?: string;
  [key: string]: unknown; 
}


export type ChowdeckCancelResponse = Record<string, unknown>;