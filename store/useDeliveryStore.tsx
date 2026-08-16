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
  DeliveryPartner,
  UpdateDeliveryPartnerPayload,
  DeliveryPartnersSummary,
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

  // Delivery Zones (confirmed live)
  zones: DeliveryZone[] | null;
  zonesLoading: boolean;
  zonesError: boolean;
  isSavingZone: boolean;

  // Delivery Partners (confirmed live)
  partners: DeliveryPartner[] | null;
  partnersLoading: boolean;
  partnersError: boolean;
  isSavingPartner: boolean;

  // Delivery Partners summary (new — endpoint confirmed live, response shape provisional)
  partnersSummary: DeliveryPartnersSummary | null;
  partnersSummaryLoading: boolean;
  partnersSummaryError: boolean;

  fetchDrivers: (status?: DriverStatus) => Promise<void>;
  createDriver: (payload: CreateDriverPayload) => Promise<boolean>;
  fetchDriverLocation: (id: string) => Promise<void>;
  clearDriverLocation: () => void;

  // CHANGED — branchId added. See note in delivery.service.ts on
  // getActiveDeliveries/getDeliveryPartners for why.
  fetchActiveDeliveries: (branchId?: string) => Promise<void>;
  assignDelivery: (orderId: string, payload: AssignDeliveryPayload, branchId?: string) => Promise<boolean>;

  estimateChowdeckFee: (orderId: string) => Promise<ChowdeckFeeEstimate | null>;
  clearChowdeckEstimate: () => void;
  dispatchViaChowdeck: (orderId: string, feeId: number, branchId?: string) => Promise<boolean>;
  trackChowdeckDelivery: (reference: string) => Promise<void>;
  cancelChowdeckDelivery: (reference: string, reason: string) => Promise<boolean>;

  fetchZones: (branchId?: string) => Promise<void>;
  createZone: (payload: CreateDeliveryZonePayload) => Promise<boolean>;
  updateZone: (id: string, payload: UpdateDeliveryZonePayload) => Promise<boolean>;
  deleteZone: (id: string) => Promise<void>;

  fetchPartners: (branchId?: string) => Promise<void>;
  fetchPartnersSummary: (branchId?: string) => Promise<void>;
  updatePartner: (id: string, payload: UpdateDeliveryPartnerPayload) => Promise<boolean>;
  togglePartner: (id: string) => Promise<void>;
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

  partners: null,
  partnersLoading: false,
  partnersError: false,
  isSavingPartner: false,

  partnersSummary: null,
  partnersSummaryLoading: false,
  partnersSummaryError: false,

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

  fetchActiveDeliveries: async (branchId) => {
    set({ activeDeliveriesLoading: true, activeDeliveriesError: false });
    try {
      const activeDeliveries = await deliveryService.getActiveDeliveries(branchId);
      set({ activeDeliveries, activeDeliveriesLoading: false });
    } catch {
      set({ activeDeliveriesLoading: false, activeDeliveriesError: true });
    }
  },

  // The assign response is flat (RawDeliveryAssignment) and doesn't
  // include driver.fullName/order.orderNumber the way the active-list
  // rows need — so instead of trying to splice a mismatched shape in,
  // just refetch the active list. One extra request, correct data.
  // branchId is threaded through so the refetch stays scoped to
  // whatever branch was selected when the assign happened.
  assignDelivery: async (orderId, payload, branchId) => {
    set({ isAssigningDelivery: true });
    try {
      await deliveryService.assignDelivery(orderId, payload);
      const activeDeliveries = await deliveryService.getActiveDeliveries(branchId);
      set({ isAssigningDelivery: false, activeDeliveries });
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

  // IMPORTANT: dispatchViaChowdeck() in the real service never creates a
  // DeliveryAssignment row — it only updates the order's status/provider.
  // GET /admin/deliveries/active queries the DeliveryAssignment table only,
  // so a Chowdeck-dispatched order will NEVER appear there — it's tracked
  // separately via GET /admin/deliveries/chowdeck/:reference instead.
  // Refetching here just keeps the internal-driver list accurate; it will
  // not reflect this Chowdeck dispatch in any way. See backend request
  // doc note on this — the two delivery paths don't share a table.
  dispatchViaChowdeck: async (orderId, feeId, branchId) => {
    set({ isDispatchingChowdeck: true });
    try {
      await deliveryService.dispatchViaChowdeck(orderId, { feeId });
      const activeDeliveries = await deliveryService.getActiveDeliveries(branchId);
      set({ isDispatchingChowdeck: false, chowdeckEstimate: null, activeDeliveries });
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

  // ── Delivery Zones ──────────────────────────────────────────────

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

  // ── Delivery Partners ───────────────────────────────────────────

  fetchPartners: async (branchId) => {
    set({ partnersLoading: true, partnersError: false });
    try {
      const partners = await deliveryService.getDeliveryPartners(branchId);
      set({ partners, partnersLoading: false });
    } catch {
      set({ partnersLoading: false, partnersError: true });
    }
  },

  // NEW — separate loading/error state so the summary stat cards can
  // resolve independently of the partner cards list below them.
  fetchPartnersSummary: async (branchId) => {
    set({ partnersSummaryLoading: true, partnersSummaryError: false });
    try {
      const partnersSummary = await deliveryService.getDeliveryPartnersSummary(branchId);
      set({ partnersSummary, partnersSummaryLoading: false });
    } catch {
      set({ partnersSummaryLoading: false, partnersSummaryError: true });
    }
  },

  updatePartner: async (id, payload) => {
    set({ isSavingPartner: true });
    try {
      const partner = await deliveryService.updateDeliveryPartner(id, payload);
      set((state) => ({
        isSavingPartner: false,
        partners: state.partners ? state.partners.map((p) => (p.id === id ? partner : p)) : state.partners,
      }));
      toast.success('Partner settings saved.');
      return true;
    } catch (error) {
      set({ isSavingPartner: false });
      toast.error(extractErrorMessage(error, 'Could not save partner settings.'));
      return false;
    }
  },

  // Optimistic toggle — mirrors deleteZone's rollback-on-failure pattern.
  togglePartner: async (id) => {
    const { partners } = get();
    const previous = partners;
    set({
      partners: partners
        ? partners.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
        : partners,
    });
    try {
      const partner = await deliveryService.toggleDeliveryPartner(id);
      set((state) => ({
        partners: state.partners ? state.partners.map((p) => (p.id === id ? partner : p)) : state.partners,
      }));
    } catch (error) {
      set({ partners: previous });
      toast.error(extractErrorMessage(error, 'Could not toggle partner.'));
    }
  },
}));