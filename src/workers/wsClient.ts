import { expose } from "comlink";

export interface WebSocketClient {
  connect(channel: string, url: string): void;
  disconnect(channel: string): void;
  send(channel: string, message: string): void;
}

class WebSocketClientImpl implements WebSocketClient {
  private connections: Map<string, WebSocket> = new Map();

  connect(channel: string, url: string): void {
    if (this.connections.has(channel)) {
      console.warn(`Already connected to channel: ${channel}`);
      return;
    }

    const ws = new WebSocket(url);

    ws.onmessage = (event: MessageEvent) => {
      self.postMessage({ channel, data: event.data });
    };

    ws.onclose = () => {
      this.connections.delete(channel);
    };

    this.connections.set(channel, ws);
  }

  disconnect(channel: string): void {
    const ws = this.connections.get(channel);
    if (ws) {
      ws.close();
      this.connections.delete(channel);
    }
  }

  send(channel: string, message: string): void {
    console.log({ message, channel });

    const ws = this.connections.get(channel);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    } else {
      console.error(`No open connection for channel: ${channel}`);
    }
  }
}

expose(new WebSocketClientImpl());
