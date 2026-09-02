// types/settings.types.ts

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  startDate: string;
  endDate: string;
  active: boolean;
  clicks: number;
  imageUrl: string;
}

export interface BannerFormData {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  startDate: string;
  endDate: string;
  active: boolean;
  imageFile: File | null;
}

export interface NotifSetting {
  id: string;
  label: string;
  description: string;
  on: boolean;
}

export interface NotificationSettings {
  email: NotifSetting[];
  sms: NotifSetting[];
}

export interface UpdateNotificationSettingsPayload {
  email: { id: string; on: boolean }[];
  sms: { id: string; on: boolean }[];
}

// ── Branches — matches backend schema (Swagger: SettingsController) ──
export interface Branch {
  id: string;
  name: string;
  location: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  pickupEnabled: boolean;
  isActive: boolean;
}

export type CreateBranchPayload = Omit<Branch, 'id'>;
export type UpdateBranchPayload = Partial<CreateBranchPayload>;