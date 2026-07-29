// types/delivery.types.ts

export type DriverStatus = 'ACTIVE' | 'OFFLINE' | 'UNAVAILABLE' | 'SUSPENDED';

/**
 * CONFIRMED — real response from GET /admin/drivers. Note: there is no
 * separate `id` field — the driver record is keyed by `userId`, and
 * display info (name, email, phone) lives on the nested `user` object.
 */
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

/**
 * Response shapes for the three Chowdeck endpoints below are STILL NOT
 * CONFIRMED — DriverService just proxies straight to `chowdeckService`
 * (getDeliveryFee / createDelivery / getDelivery / cancelDelivery) and
 * returns whatever that third-party client gives back, untouched. The only
 * certainty: the dispatch response has a `.reference` field (used directly
 * in DriverService for notifications/status history), and the estimate
 * response must contain something usable as `feeId` for the dispatch call.
 * Given the request DTOs to Chowdeck use snake_case (source_address,
 * destination_address), the raw response is likely snake_case too — these
 * types use camelCase as a guess and will need correcting once you either
 * hit these endpoints live or share chowdeck.service.ts.
 */
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
   Delivery Zones — still fully speculative. Nothing in what's
   been shared backs radius/fee/min-order config anywhere.
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