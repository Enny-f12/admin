// types/notification.ts

export type NotificationType = "ORDER_UPDATE" | "LOYALTY_UPDATE" | "MARKETING" | "SECURITY";
export type NotificationChannel = "IN_APP" | "SMS" | "EMAIL";
export type NotificationStatus = "SENT" | "FAILED" | "READ";

export interface Notification {
  id: string;
  userId: string;
  orderId: string | null;
  title: string;
  body: string;
  type: NotificationType;
  channel: NotificationChannel;
  status: NotificationStatus;
  sentAt: string | null;
  readAt: string | null;
  createdAt: string;
}