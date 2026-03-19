import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface UIState {
  // Sidebar/collapsible states
  isReasoningVisible: boolean;
  isToolsPanelOpen: boolean;
  toggleReasoning: () => void;
  toggleToolsPanel: () => void;
  setReasoningVisible: (visible: boolean) => void;
  setToolsPanelOpen: (open: boolean) => void;

  // Input state
  inputValue: string;
  setInputValue: (value: string) => void;
  clearInput: () => void;

  // Scroll state
  shouldScrollToBottom: boolean;
  setShouldScrollToBottom: (shouldScroll: boolean) => void;

  // Theme (for future use)
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      // Initial state
      isReasoningVisible: true,
      isToolsPanelOpen: false,
      inputValue: "",
      shouldScrollToBottom: true,
      isDarkMode: true,

      // Actions
      toggleReasoning: () =>
        set((state) => ({ isReasoningVisible: !state.isReasoningVisible })),

      toggleToolsPanel: () =>
        set((state) => ({ isToolsPanelOpen: !state.isToolsPanelOpen })),

      setReasoningVisible: (visible) => set({ isReasoningVisible: visible }),
      setToolsPanelOpen: (open) => set({ isToolsPanelOpen: open }),

      setInputValue: (value) => set({ inputValue: value }),
      clearInput: () => set({ inputValue: "" }),

      setShouldScrollToBottom: (shouldScroll) =>
        set({ shouldScrollToBottom: shouldScroll }),

      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
    }),
    { name: "ui-store" }
  )
);
