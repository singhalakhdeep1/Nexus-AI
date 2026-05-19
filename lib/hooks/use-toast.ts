"use client";

import * as React from "react";
import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 4000;

type ToasterToast = ToastProps & {
    id: string;
    title?: React.ReactNode;
    description?: React.ReactNode;
    action?: ToastActionElement;
};

type Action =
    | { type: "ADD_TOAST"; toast: ToasterToast }
    | { type: "UPDATE_TOAST"; toast: Partial<ToasterToast> & { id: string } }
    | { type: "DISMISS_TOAST"; toastId?: string }
    | { type: "REMOVE_TOAST"; toastId?: string };

interface State {
    toasts: ToasterToast[];
}

let count = 0;
const genId = () => (++count).toString();

const timeouts = new Map<string, ReturnType<typeof setTimeout>>();

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case "ADD_TOAST":
            return { toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) };
        case "UPDATE_TOAST":
            return {
                toasts: state.toasts.map((t) =>
                    t.id === action.toast.id ? { ...t, ...action.toast } : t
                ),
            };
        case "DISMISS_TOAST": {
            const { toastId } = action;
            if (toastId) {
                if (!timeouts.has(toastId)) {
                    timeouts.set(
                        toastId,
                        setTimeout(() => {
                            timeouts.delete(toastId);
                            dispatch({ type: "REMOVE_TOAST", toastId });
                        }, TOAST_REMOVE_DELAY)
                    );
                }
            } else {
                state.toasts.forEach((t) => {
                    if (!timeouts.has(t.id)) {
                        timeouts.set(
                            t.id,
                            setTimeout(() => {
                                timeouts.delete(t.id);
                                dispatch({ type: "REMOVE_TOAST", toastId: t.id });
                            }, TOAST_REMOVE_DELAY)
                        );
                    }
                });
            }
            return {
                toasts: state.toasts.map((t) =>
                    t.id === toastId || toastId === undefined ? { ...t, open: false } : t
                ),
            };
        }
        case "REMOVE_TOAST":
            return {
                toasts: action.toastId
                    ? state.toasts.filter((t) => t.id !== action.toastId)
                    : [],
            };
    }
}

const listeners: Array<(state: State) => void> = [];
let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
    memoryState = reducer(memoryState, action);
    listeners.forEach((l) => l(memoryState));
}

function toast({
    ...props
}: Omit<ToasterToast, "id">) {
    const id = genId();
    const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });
    dispatch({
        type: "ADD_TOAST",
        toast: { ...props, id, open: true, onOpenChange: (open) => { if (!open) dismiss(); } },
    });
    // Auto-dismiss
    setTimeout(dismiss, TOAST_REMOVE_DELAY);
    return { id, dismiss };
}

function useToast() {
    const [state, setState] = React.useState<State>(memoryState);

    React.useEffect(() => {
        listeners.push(setState);
        return () => {
            const idx = listeners.indexOf(setState);
            if (idx > -1) listeners.splice(idx, 1);
        };
    }, []);

    return {
        ...state,
        toast,
        dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
    };
}

export { useToast, toast };
