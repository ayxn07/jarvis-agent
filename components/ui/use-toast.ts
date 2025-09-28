import * as React from "react";

export type ToastMessage = {
  id?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  duration?: number;
  action?: React.ReactNode;
  variant?: "base" | "success" | "error";
};

type ToasterToast = ToastMessage & {
  id: string;
};

const TOAST_LIMIT = 5;

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string, duration: number | undefined) => {
  if (toastTimeouts.has(toastId)) return;

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({ type: "REMOVE_TOAST", toastId });
  }, duration ?? 5000);

  toastTimeouts.set(toastId, timeout);
};

const toastReducer = (state: ToasterToast[], action: ToastAction): ToasterToast[] => {
  switch (action.type) {
    case "ADD_TOAST":
      return [action.toast, ...state].slice(0, TOAST_LIMIT);
    case "REMOVE_TOAST":
      return state.filter((toast) => toast.id !== action.toastId);
    default:
      return state;
  }
};

type ToastAction =
  | { type: "ADD_TOAST"; toast: ToasterToast }
  | { type: "REMOVE_TOAST"; toastId?: string };

const listeners: Array<(state: ToasterToast[]) => void> = [];
let memoryState: ToasterToast[] = [];

const dispatch = (action: ToastAction) => {
  memoryState = toastReducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
};

export function toast({ ...props }: ToastMessage) {
  const id = (Math.random() * 1e9).toString(36);

  const toastState: ToasterToast = {
    ...props,
    id
  };

  dispatch({ type: "ADD_TOAST", toast: toastState });
  addToRemoveQueue(id, props.duration);

  return {
    id,
    dismiss: () => dispatch({ type: "REMOVE_TOAST", toastId: id })
  };
}

export function useToast() {
  const [state, setState] = React.useState<ToasterToast[]>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) listeners.splice(index, 1);
    };
  }, [state]);

  return {
    toasts: state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "REMOVE_TOAST", toastId })
  };
}
