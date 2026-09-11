export type PaymentMethodType = "CARD" | "BKASH" | "NAGAD";

export interface SavedPaymentMethod {
  id: string;
  type: PaymentMethodType;
  title: string;
  subtitle: string;
  isDefault: boolean;
  brand?: "visa" | "mastercard" | "bkash" | "nagad";
  holderName?: string;
  lastDigits?: string;
  expiry?: string;
}
