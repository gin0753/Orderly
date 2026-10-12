type SessionEvent = "changed" | "ended" | { type: "deleted"; customerId: string };
const listeners = new Set<(event: SessionEvent) => void>();
let channel: BroadcastChannel | null = null;
let references = 0;

export function subscribeCustomerSessionEvents(listener: (event: SessionEvent) => void) {
  listeners.add(listener);
  references += 1;
  if (!channel && typeof window !== "undefined" && "BroadcastChannel" in window) {
    channel = new BroadcastChannel("orderly-customer-session");
    channel.onmessage = (message: MessageEvent<unknown>) => {
      if (message.data && typeof message.data === "object" && 'type' in message.data && message.data.type === 'deleted' && 'customerId' in message.data && typeof message.data.customerId === 'string') {
        listeners.forEach((callback) => callback(message.data as SessionEvent)); return;
      }
      if (message.data === "changed" || message.data === "ended") listeners.forEach((callback) => callback(message.data as SessionEvent));
    };
  }
  return () => {
    listeners.delete(listener);
    references -= 1;
    if (!references) { channel?.close(); channel = null; }
  };
}

export function publishCustomerSessionEvent(event: SessionEvent) { channel?.postMessage(event); }
