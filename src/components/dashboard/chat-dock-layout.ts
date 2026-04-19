/** Legacy width clamp (older panel storage). */
export const CHAT_PANEL_WIDTH_MIN = 280;
export const CHAT_PANEL_WIDTH_MAX = 1200;
export const CHAT_PANEL_WIDTH_DEFAULT = 420;
export const CHAT_PANEL_WIDTH_STORAGE_KEY = "dala-chat-panel-width";

/** Intercom-style floating widget bounds. */
export const CHAT_WIDGET_MIN_W = 320;
export const CHAT_WIDGET_MIN_H = 400;
export const CHAT_WIDGET_DEFAULT_W = 380;
export const CHAT_WIDGET_DEFAULT_H = 520;
export const CHAT_WIDGET_W_KEY = "dala-chat-widget-w";
export const CHAT_WIDGET_H_KEY = "dala-chat-widget-h";
export const CHAT_INPUT_MIN_H = 44;
export const CHAT_INPUT_MAX_H = 220;
export const CHAT_INPUT_DEFAULT_H = 88;
export const CHAT_INPUT_H_KEY = "dala-chat-input-h";

export function clampChatPanelWidth(px: number): number {
  if (typeof window === "undefined") {
    return Math.min(Math.max(px, CHAT_PANEL_WIDTH_MIN), CHAT_PANEL_WIDTH_MAX);
  }
  const cap = Math.min(CHAT_PANEL_WIDTH_MAX, Math.floor(window.innerWidth * 0.96));
  return Math.min(Math.max(px, CHAT_PANEL_WIDTH_MIN), cap);
}

export function clampWidgetSize(w: number, h: number): { w: number; h: number } {
  if (typeof window === "undefined") {
    return {
      w: Math.min(Math.max(w, CHAT_WIDGET_MIN_W), 1200),
      h: Math.min(Math.max(h, CHAT_WIDGET_MIN_H), 900),
    };
  }
  const maxW = Math.floor(window.innerWidth * 0.9);
  const maxH = Math.floor(window.innerHeight * 0.85);
  return {
    w: Math.min(Math.max(w, CHAT_WIDGET_MIN_W), maxW),
    h: Math.min(Math.max(h, CHAT_WIDGET_MIN_H), maxH),
  };
}

export function clampInputHeight(px: number): number {
  return Math.min(Math.max(px, CHAT_INPUT_MIN_H), CHAT_INPUT_MAX_H);
}
