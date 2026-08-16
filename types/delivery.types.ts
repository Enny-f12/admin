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

/** CONFIRMED — matches DriverService.getDriverLocation() return exactly. */
export interface DriverLocation {
  driverId: string;
  latitude: number;
  longitude: number;
  recordedAt: string;
  assignmentId: string | null;
}

/** CONFIRMED — full enum from VALID_TRANSITIONS in DriverService. */
export type DeliveryAssignmentStatus =
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED';

/** CONFIRMED — matches DriverService.createProfile's DTO exactly. Only userId is required. */
export interface CreateDriverPayload {
  userId: string;
  vehicleType?: string;
  vehiclePlateNumber?: string;
  emergencyContactPhone?: string;
  bankName?: string;
  payoutAccountName?: string;
  payoutAccountNumber?: string;
}

/** CONFIRMED — matches AssignDeliveryDto exactly. Only driverId is required. */
export interface AssignDeliveryPayload {
  driverId: string;
  etaMinutes?: number;
  deliveryFee?: number;
}

/**
 * CONFIRMED — matches the exact `include` shape in
 * DriverService.getActiveDeliveries(). Note the nested `driver` and `order`
 * objects — this is NOT flat like the earlier guess.
 */
export interface AdminDelivery {
  id: string;
  orderId: string;
  driverId: string;
  status: DeliveryAssignmentStatus;
  etaMinutes: number | null;
  deliveryFee: string; // Prisma Decimal — likely serializes as a string, same pattern as Orders' totalAmount
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

/** Confirmed — matches POST /admin/deliveries/:orderId/chowdeck/dispatch request body exactly. */
export interface DispatchChowdeckPayload {
  feeId: number;
}

/**
 * Response shape for GET /admin/deliveries/chowdeck/:reference is NOT
 * confirmed — guessed pending a real example.
 */
export interface ChowdeckTrackingStatus {
  reference: string;
  status: string;
  driverName?: string | null;
  driverPhone?: string | null;
  eta?: string | null;
}

/** Confirmed — matches POST /admin/deliveries/chowdeck/:reference/cancel request body exactly. */
export interface CancelChowdeckPayload {
  reason: string;
}

/* ─────────────────────────────────────────────────────────────
   Delivery Zones — CONFIRMED LIVE. All four endpoints
   (GET/POST /admin/delivery-zones, PATCH/DELETE /admin/delivery-zones/:id)
   match Swagger exactly, verified field-for-field.
   ───────────────────────────────────────────────────────────── */

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

/* ─────────────────────────────────────────────────────────────
   Delivery Partners — CONFIRMED LIVE (GET/PATCH endpoints verified
   against Swagger). The summary endpoint below is now confirmed live
   too — see DeliveryPartnersSummary.
   ───────────────────────────────────────────────────────────── */

export interface DeliveryPartner {
  id: string;
  key: string;              // "chowdeck" | "glovo" — maps to DeliveryProvider enum
  name: string;
  enabled: boolean;
  online: boolean;          // derived server-side, not stored
  active: number;           // derived — count of non-terminal assignments
  today: number;            // derived — delivered count today
  avgMin: number;           // derived — avg deliveredAt - assignedAt today
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

/**
 * CONFIRMED — matches the real GET /admin/delivery-partners/summary
 * response exactly:
 * { activePartners: 2, liveOrders: 0, completedToday: 0, avgDeliveryMin: 0 }
 *
 * Field names were previously guessed as totalCompleted/avgDeliveryMinutes
 * (neither exists on the real payload), which is why the stat cards in
 * PartnersTab silently showed 0/blank even though the endpoint was
 * working correctly — the frontend was reading fields that never existed
 * on the response. Corrected to match live data.
 */
export interface DeliveryPartnersSummary {
  activePartners: number;
  liveOrders: number;
  completedToday: number;
  avgDeliveryMin: number;
}

/* ─────────────────────────────────────────────────────────────
   Chowdeck response types — corrected
   ───────────────────────────────────────────────────────────── */

/**
 * NOT CONFIRMED. dispatchViaChowdeck() returns chowdeckService.createDelivery()
 * untouched — no DeliveryAssignment row is created, so this is NOT AdminDelivery.
 * The only certainty (from DriverService using it for notifications/history):
 * there is a `.reference` field. Everything else is a guess pending either a
 * live hit or chowdeck.service.ts.
 */
export interface ChowdeckDispatchResponse {
  reference: string;
  status?: string;
  [key: string]: unknown; // unconfirmed fields — don't assume shape beyond `reference`
}

/** NOT CONFIRMED — cancelDelivery()'s return value is unknown, proxied raw. */
export type ChowdeckCancelResponse = Record<string, unknown>;