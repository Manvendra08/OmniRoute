// Polyfill worker_threads.markAsUncloneable for Node.js < 21 compatibility (specifically Node 20.20.2)
import worker_threads from "node:worker_threads";
import { WebSocket } from "ws";

if (worker_threads && !worker_threads.markAsUncloneable) {
  (worker_threads as any).markAsUncloneable = function (obj: any) {
    if (worker_threads.markAsUntransferable) {
      try {
        worker_threads.markAsUntransferable(obj);
      } catch {
        // no-op
      }
    }
  };
}

// Polyfill Promise.withResolvers for Node.js < 22 compatibility (specifically Node 20.20.2)
if (typeof Promise.withResolvers === "undefined") {
  Promise.withResolvers = function <T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: any) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  } as any;
}

import dns from "node:dns";

// Prefer IPv4 over IPv6 for all DNS lookups to prevent outbound timeouts on broken IPv6 routes
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {
  // Ignore for older Node versions
}

// Polyfill WebSocket for Node.js < 22 compatibility (specifically Node 20.20.2)
if (typeof globalThis.WebSocket === "undefined") {
  (globalThis as any).WebSocket = WebSocket;
}
