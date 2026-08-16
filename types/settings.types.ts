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

export interface Branch {
  id: string;
  label: string;
  name: string;
  location: string;
  phone: string;
  email: string;
  pickupEnabled: boolean;
}

export interface CreateBranchPayload {
  name: string;
  location: string;
  phone: string;
  email: string;
  pickupEnabled: boolean;
}

export type UpdateBranchPayload = Partial<CreateBranchPayload>;