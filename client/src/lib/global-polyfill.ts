/**
 * This file provides polyfills for Node.js global objects and modules that are used by libraries
 * like simple-peer in the browser environment
 */

// Define global object for browser environment
if (typeof window !== 'undefined') {
  // @ts-ignore - Setup global variable for browser
  if (typeof window.global === 'undefined') {
    // @ts-ignore
    window.global = window;
  }

  // @ts-ignore - Setup process for browser
  if (typeof window.process === 'undefined') {
    // @ts-ignore
    window.process = {
      env: {},
      nextTick: (callback: Function, ...args: any[]) => {
        setTimeout(() => callback(...args), 0);
      },
      browser: true
    };
  }

  // @ts-ignore - Minimal EventEmitter implementation
  if (typeof window.events === 'undefined' || typeof window.events.EventEmitter === 'undefined') {
    // @ts-ignore
    class EventEmitter {
      private events: Record<string, Function[]> = {};

      on(event: string, listener: Function) {
        if (!this.events[event]) {
          this.events[event] = [];
        }
        this.events[event].push(listener);
        return this;
      }

      removeListener(event: string, listener: Function) {
        if (this.events[event]) {
          this.events[event] = this.events[event].filter(l => l !== listener);
        }
        return this;
      }

      emit(event: string, ...args: any[]) {
        if (this.events[event]) {
          this.events[event].forEach(listener => listener(...args));
        }
        return this;
      }

      once(event: string, listener: Function) {
        const onceWrapper = (...args: any[]) => {
          listener(...args);
          this.removeListener(event, onceWrapper);
        };
        return this.on(event, onceWrapper);
      }
    }

    // @ts-ignore
    window.events = { EventEmitter };
    // @ts-ignore
    window.EventEmitter = EventEmitter;
  }

  // @ts-ignore - Basic util module
  if (typeof window.util === 'undefined') {
    // @ts-ignore
    window.util = {
      debuglog: () => () => {},
      inspect: (obj: any) => JSON.stringify(obj),
      inherits: (ctor: any, superCtor: any) => {
        ctor.super_ = superCtor;
        ctor.prototype = Object.create(superCtor.prototype, {
          constructor: {
            value: ctor,
            enumerable: false,
            writable: true,
            configurable: true
          }
        });
      }
    };
  }

  // @ts-ignore - Handle Buffer if needed
  if (typeof window.Buffer === 'undefined') {
    // @ts-ignore
    window.Buffer = {
      isBuffer: (obj: any) => false,
      from: (data: any) => {
        if (data instanceof Uint8Array) return data;
        if (Array.isArray(data)) return new Uint8Array(data);
        if (typeof data === 'string') return new TextEncoder().encode(data);
        return new Uint8Array();
      }
    };
  }
}

// Export dummy value to make this a module
export const globalPolyfillLoaded = true;