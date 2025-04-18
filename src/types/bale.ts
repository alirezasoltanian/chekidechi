// types/bale.ts

// تایپ برای اطلاعات کاربر
export interface BaleWebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  allows_write_to_pm?: boolean;
  photo_url?: string;
}

// تایپ برای اطلاعات چت (در صورت شروع از چت)
export interface BaleWebAppChat {
  id: number;
  type: "private" | "group" | "supergroup" | "channel";
  title?: string;
  username?: string;
  photo_url?: string;
}

// تایپ برای اطلاعات اولیه مینی‌اپ بله
export interface BaleWebAppInitData {
  query_id?: string;
  user?: BaleWebAppUser;
  receiver?: BaleWebAppUser;
  chat?: BaleWebAppChat;
  start_param?: string;
  auth_date: number;
  hash: string;
}

// تایپ برای کل آبجکت Bale.WebApp
export interface BaleWebApp {
  initData: string;
  initDataUnsafe: BaleWebAppInitData;
  version: string;
  platform: string;
  colorScheme: "light" | "dark";
  themeParams: {
    bg_color: string;
    text_color: string;
    hint_color: string;
    link_color: string;
    button_color: string;
    button_text_color: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;

  // متدهای اصلی
  ready(): Promise<void>;
  expand(): void;
  close(): void;

  // متدهای مربوط به داده‌ها
  sendData(data: string): void;
  openLink(url: string, options?: { try_instant_view?: boolean }): void;
  openTelegramLink(url: string): void;

  // متدهای مربوط به رابط کاربری
  showAlert(message: string): Promise<void>;
  showConfirm(message: string): Promise<boolean>;
  showPopup(params: {
    title?: string;
    message: string;
    buttons?: Array<{
      id?: string;
      type?: "default" | "ok" | "close" | "cancel" | "destructive";
      text: string;
    }>;
  }): Promise<string>;

  // متدهای مربوط به رویدادها
  onEvent(eventType: string, eventHandler: Function): void;
  offEvent(eventType: string, eventHandler: Function): void;

  // متدهای مربوط به پرداخت
  openInvoice(
    url: string
  ): Promise<{ status: "paid" | "cancelled" | "failed" }>;

  // متدهای مربوط به اسکن
  showScanQrPopup(params?: { text?: string }): Promise<{ data: string }>;
  closeScanQrPopup(): void;

  // متدهای مربوط به پیام‌ها
  switchInlineQuery(query: string, choose_chat_types?: string[]): void;

  // متدهای مربوط به تنظیمات
  setHeaderColor(color: string): void;
  setBackgroundColor(color: string): void;
  enableClosingConfirmation(): void;
  disableClosingConfirmation(): void;

  // متدهای مربوط به داده‌های اضافی
  isVersionAtLeast(version: string): boolean;
  setBackButton(params: { is_visible: boolean }): void;

  // متدهای مربوط به کلیپ‌بورد
  readTextFromClipboard(): Promise<string>;

  // متدهای مربوط به مکان
  requestLocation(): Promise<{ latitude: number; longitude: number }>;
}

// تایپ برای آبجکت Bale در window
export interface BaleGlobal {
  WebApp: BaleWebApp;
}

// اضافه کردن تایپ به window
declare global {
  interface Window {
    Bale: BaleGlobal;
  }
}
