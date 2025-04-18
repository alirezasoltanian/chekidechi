import { create } from "zustand";

// Define the type for our chat user state
interface ChatUserState {
  userBaleInfo: {
    username: string;
    token: number;
    id: number;
    first_name: string;
    allows_write_to_pm: boolean;
    initData: string;
  } | null;
  setUserBaleInfo: (UserBaleInfo: ChatUserState["userBaleInfo"]) => void;
  clearUserBaleInfo: () => void;
}

// Create the store with the specified fields
export const useChatStore = create<ChatUserState>((set) => ({
  // Initial state with null user
  userBaleInfo: null,

  // Set UserBaleInfo function
  setUserBaleInfo: (userBaleInfo) => set({ userBaleInfo }),

  // Clear user function
  clearUserBaleInfo: () => set({ userBaleInfo: null }),
}));
