import { expose } from "comlink";

class WebSocketClient {
  private connections: Map<string, WebSocket> = new Map();
  private reconnectInterval: number = 5000;
  private shouldReconnect: Map<string, boolean> = new Map();

  /**
   * Connects to a WebSocket channel.
   *
   * @param {string} channel - The WebSocket channel to connect to.
   * @param {string} url - The WebSocket server URL.
   */
  connect(channel: string, url: string): void {
    if (this.connections.has(channel)) {
      console.warn(`Already connected to channel: ${channel}`);

      return;
    }

    const ws = new WebSocket(url);

    ws.onmessage = (event: MessageEvent) => {
      // console.log("MESSAGE EVENT", event);

      self.postMessage({ channel, data: event.data });
    };

    ws.onclose = () => {
      this.connections.delete(channel);

      this.reconnect(channel, url);
    };

    ws.onerror = () => {
      this.connections.delete(channel);

      this.reconnect(channel, url);
    };

    this.connections.set(channel, ws);
    this.shouldReconnect.set(channel, true);
  }

  /**
   * Attempts to reconnect to a WebSocket channel after a specified interval.
   *
   * @param {string} channel - The WebSocket channel to reconnect to.
   * @param {string} url - The WebSocket server URL.
   */
  private reconnect(channel: string, url: string): void {
    if (this.shouldReconnect.get(channel)) {
      setTimeout(() => {
        console.log(`Reconnecting to channel: ${channel}`);

        this.connect(channel, url);
      }, this.reconnectInterval);
    }
  }

  /**
   * Disconnects from a WebSocket channel.
   *
   * @param {string} channel - The WebSocket channel to disconnect from.
   */
  disconnect(channel: string): void {
    const ws = this.connections.get(channel);
    if (ws) {
      this.shouldReconnect.set(channel, false);
      ws.close();
      this.connections.delete(channel);
    }
  }

  /**
   * Sends a message to a WebSocket channel.
   *
   * @param {string} channel - The WebSocket channel to send the message to.
   * @param {string} message - The message to send.
   */
  send(channel: string, message: string): void {
    const ws = this.connections.get(channel);

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    } else {
      console.error(`No open connection for channel: ${channel}`);
    }
  }
}

expose(new WebSocketClient());

export type { WebSocketClient };
