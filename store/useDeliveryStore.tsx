// store/useDeliveryStore.ts
import { create } from 'zustand';
import { toast } from 'sonner';
import { deliveryService } from '@/services/delivery.service';
import {
  Driver,
  DriverStatus,
  DriverLocation,
  CreateDriverPayload,
  AdminDelivery,
  AssignDeliveryPayload,
  ChowdeckFeeEstimate,
  ChowdeckTrackingStatus,
  DeliveryZone,
  CreateDeliveryZonePayload,
  UpdateDeliveryZonePayload,
} from '@/types/delivery.types';

function extractErrorMessage(error: unknown, fallback: string) {
  const anyErr = error as any;
  return anyErr?.response?.data?.message ?? anyErr?.message ?? fallback;
}

interface DeliveryState {
  // Drivers (confirmed live)
  drivers: Driver[] | null;
  driversLoading: boolean;
  driversError: boolean;
  isCreatingDriver: boolean;

  driverLocation: DriverLocation | null;
  driverLocationLoading: boolean;

  // Active deliveries (confirmed live)
  activeDeliveries: AdminDelivery[] | null;
  activeDeliveriesLoading: boolean;
  activeDeliveriesError: boolean;
  isAssigningDelivery: boolean;

  // Chowdeck (confirmed live)
  chowdeckEstimate: ChowdeckFeeEstimate | null;
  isEstimatingChowdeck: boolean;
  isDispatchingChowdeck: boolean;
  chowdeckTracking: ChowdeckTrackingStatus | null;
  isTrackingChowdeck: boolean;
  isCancellingChowdeck: boolean;

  // Delivery Zones (speculative)
  zones: DeliveryZone[] | null;
  zonesLoading: boolean;
  zonesError: boolean;
  isSavingZone: boolean;

  fetchDrivers: (status?: DriverStatus) => Promise<void>;
  createDriver: (payload: CreateDriverPayload) => Promise<boolean>;
  fetchDriverLocation: (id: string) => Promise<void>;
  clearDriverLocation: () => void;

  fetchActiveDeliveries: () => Promise<void>;
  assignDelivery: (orderId: string, payload: AssignDeliveryPayload) => Promise<boolean>;

  estimateChowdeckFee: (orderId: string) => Promise<ChowdeckFeeEstimate | null>;
  clearChowdeckEstimate: () => void;
  dispatchViaChowdeck: (orderId: string, feeId: number) => Promise<boolean>;
  trackChowdeckDelivery: (reference: string) => Promise<void>;
  cancelChowdeckDelivery: (reference: string, reason: string) => Promise<boolean>;

  fetchZones: (branchId?: string) => Promise<void>;
  createZone: (payload: CreateDeliveryZonePayload) => Promise<boolean>;
  updateZone: (id: string, payload: UpdateDeliveryZonePayload) => Promise<boolean>;
  deleteZone: (id: string) => Promise<void>;
}

export const useDeliveryStore = create<DeliveryState>((set, get) => ({
  drivers: null,
  driversLoading: false,
  driversError: false,
  isCreatingDriver: false,

  driverLocation: null,
  driverLocationLoading: false,

  activeDeliveries: null,
  activeDeliveriesLoading: false,
  activeDeliveriesError: false,
  isAssigningDelivery: false,

  chowdeckEstimate: null,
  isEstimatingChowdeck: false,
  isDispatchingChowdeck: false,
  chowdeckTracking: null,
  isTrackingChowdeck: false,
  isCancellingChowdeck: false,

  zones: null,
  zonesLoading: false,
  zonesError: false,
  isSavingZone: false,

  // ── Drivers ─────────────────────────────────────────────────────

  fetchDrivers: async (status) => {
    set({ driversLoading: true, driversError: false });
    try {
      const drivers = await deliveryService.getDrivers(status);
      set({ drivers, driversLoading: false });
    } catch {
      set({ driversLoading: false, driversError: true });
    }
  },

  createDriver: async (payload) => {
    set({ isCreatingDriver: true });
    try {
      const driver = await deliveryService.createDriver(payload);
      set((state) => ({
        isCreatingDriver: false,
        drivers: state.drivers ? [...state.drivers, driver] : [driver],
      }));
      toast.success('Driver added.');
      return true;
    } catch (error) {
      set({ isCreatingDriver: false });
      toast.error(extractErrorMessage(error, 'Could not add driver.'));
      return false;
    }
  },

  fetchDriverLocation: async (id) => {
    set({ driverLocationLoading: true, driverLocation: null });
    try {
      const driverLocation = await deliveryService.getDriverLocation(id);
      set({ driverLocation, driverLocationLoading: false });
    } catch (error) {
      set({ driverLocationLoading: false });
      toast.error(extractErrorMessage(error, 'Could not load driver location.'));
    }
  },

  clearDriverLocation: () => set({ driverLocation: null }),

  // ── Active deliveries ───────────────────────────────────────────

  fetchActiveDeliveries: async () => {
    set({ activeDeliveriesLoading: true, activeDeliveriesError: false });
    try {
      const activeDeliveries = await deliveryService.getActiveDeliveries();
      set({ activeDeliveries, activeDeliveriesLoading: false });
    } catch {
      set({ activeDeliveriesLoading: false, activeDeliveriesError: true });
    }
  },

  assignDelivery: async (orderId, payload) => {
    set({ isAssigningDelivery: true });
    try {
      const updated = await deliveryService.assignDelivery(orderId, payload);
      set((state) => ({
        isAssigningDelivery: false,
        activeDeliveries: state.activeDeliveries
          ? [...state.activeDeliveries.filter((d) => d.orderId !== orderId), updated]
          : [updated],
      }));
      toast.success('Delivery assigned.');
      return true;
    } catch (error) {
      set({ isAssigningDelivery: false });
      toast.error(extractErrorMessage(error, 'Could not assign delivery.'));
      return false;
    }
  },

  // ── Chowdeck ────────────────────────────────────────────────────

  estimateChowdeckFee: async (orderId) => {
    set({ isEstimatingChowdeck: true, chowdeckEstimate: null });
    try {
      const estimate = await deliveryService.estimateChowdeckFee(orderId);
      set({ chowdeckEstimate: estimate, isEstimatingChowdeck: false });
      return estimate;
    } catch (error) {
      set({ isEstimatingChowdeck: false });
      toast.error(extractErrorMessage(error, 'Could not get Chowdeck fee estimate.'));
      return null;
    }
  },

  clearChowdeckEstimate: () => set({ chowdeckEstimate: null }),

  dispatchViaChowdeck: async (orderId, feeId) => {
    set({ isDispatchingChowdeck: true });
    try {
      const updated = await deliveryService.dispatchViaChowdeck(orderId, { feeId });
      set((state) => ({
        isDispatchingChowdeck: false,
        chowdeckEstimate: null,
        activeDeliveries: state.activeDeliveries
          ? [...state.activeDeliveries.filter((d) => d.orderId !== orderId), updated]
          : [updated],
      }));
      toast.success('Dispatched via Chowdeck.');
      return true;
    } catch (error) {
      set({ isDispatchingChowdeck: false });
      toast.error(extractErrorMessage(error, 'Could not dispatch via Chowdeck.'));
      return false;
    }
  },

  trackChowdeckDelivery: async (reference) => {
    set({ isTrackingChowdeck: true, chowdeckTracking: null });
    try {
      const chowdeckTracking = await deliveryService.trackChowdeckDelivery(reference);
      set({ chowdeckTracking, isTrackingChowdeck: false });
    } catch (error) {
      set({ isTrackingChowdeck: false });
      toast.error(extractErrorMessage(error, 'Could not fetch tracking status.'));
    }
  },

  cancelChowdeckDelivery: async (reference, reason) => {
    set({ isCancellingChowdeck: true });
    try {
      await deliveryService.cancelChowdeckDelivery(reference, { reason });
      set({ isCancellingChowdeck: false });
      toast.success('Chowdeck delivery cancelled.');
      return true;
    } catch (error) {
      set({ isCancellingChowdeck: false });
      toast.error(extractErrorMessage(error, 'Could not cancel Chowdeck delivery.'));
      return false;
    }
  },

  // ── Delivery Zones (speculative) ───────────────────────────────

  fetchZones: async (branchId) => {
    set({ zonesLoading: true, zonesError: false });
    try {
      const zones = await deliveryService.getDeliveryZones(branchId);
      set({ zones, zonesLoading: false });
    } catch {
      set({ zonesLoading: false, zonesError: true });
    }
  },

  createZone: async (payload) => {
    set({ isSavingZone: true });
    try {
      const zone = await deliveryService.createDeliveryZone(payload);
      set((state) => ({ isSavingZone: false, zones: state.zones ? [...state.zones, zone] : [zone] }));
      toast.success('Zone added.');
      return true;
    } catch (error) {
      set({ isSavingZone: false });
      toast.error(extractErrorMessage(error, 'Could not add zone.'));
      return false;
    }
  },

  updateZone: async (id, payload) => {
    set({ isSavingZone: true });
    try {
      const zone = await deliveryService.updateDeliveryZone(id, payload);
      set((state) => ({
        isSavingZone: false,
        zones: state.zones ? state.zones.map((z) => (z.id === id ? zone : z)) : state.zones,
      }));
      toast.success('Zone updated.');
      return true;
    } catch (error) {
      set({ isSavingZone: false });
      toast.error(extractErrorMessage(error, 'Could not update zone.'));
      return false;
    }
  },

  deleteZone: async (id) => {
    const { zones } = get();
    const previous = zones;
    set({ zones: zones ? zones.filter((z) => z.id !== id) : zones });
    try {
      await deliveryService.deleteDeliveryZone(id);
      toast.success('Zone removed.');
    } catch (error) {
      set({ zones: previous });
      toast.error(extractErrorMessage(error, 'Could not remove zone.'));
    }
  },
}));