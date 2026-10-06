type SessionEvent = "changed" | "ended";
const listeners = new Set<(event: SessionEvent) => void>();
let channel: BroadcastChannel | null = null;
let references = 0;

export function subscribeCustomerSessionEvents(listener: (event: SessionEvent) => void) {
  listeners.add(listener);
  references += 1;
  if (!channel && typeof window !== "undefined" && "BroadcastChannel" in window) {
    channel = new BroadcastChannel("orderly-customer-session");
    channel.onmessage = (message: MessageEvent<unknown>) => {
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
