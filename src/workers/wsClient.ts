import { expose } from "comlink";

class WebSocketClient {
  private connections: Map<string, WebSocket> = new Map();

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
    };

    this.connections.set(channel, ws);
  }

  /**
   * Disconnects from a WebSocket channel.
   *
   * @param {string} channel - The WebSocket channel to disconnect from.
   */
  disconnect(channel: string): void {
    const ws = this.connections.get(channel);
    if (ws) {
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
