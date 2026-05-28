import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import { useAuth } from './AuthContext';

interface WebsocketContextType {
  connected: boolean;
  subscribe: (destination: string, callback: (body: any) => void) => () => void;
  send: (destination: string, body: any) => void;
}

const WebsocketContext = createContext<WebsocketContextType | undefined>(undefined);

export const WebsocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [connected, setConnected] = useState(false);
  const stompClientRef = useRef<Client | null>(null);

  useEffect(() => {
    // Only connect if the user is authenticated and token is available
    if (!isAuthenticated || !token) {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
        setConnected(false);
      }
      return;
    }

    const host = window.location.host;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    
    // Construct STOMP client
    const client = new Client({
      brokerURL: `${protocol}//${host}/ws`,
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: (str) => {
        console.debug('STOMP: ' + str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      console.log('STOMP: Connected to WebSocket Broker');
      setConnected(true);
    };

    client.onDisconnect = () => {
      console.log('STOMP: Disconnected');
      setConnected(false);
    };

    client.onStompError = (frame) => {
      console.error('STOMP: Broker error: ' + frame.headers['message']);
      console.error('STOMP: Additional details: ' + frame.body);
    };

    stompClientRef.current = client;
    client.activate();

    return () => {
      if (stompClientRef.current) {
        console.log('STOMP: Deactivating client connection...');
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
        setConnected(false);
      }
    };
  }, [token, isAuthenticated]);

  // Unified subscription helper returning a cleanup un-subscription method!
  const subscribe = (destination: string, callback: (body: any) => void) => {
    if (!stompClientRef.current || !connected) {
      console.warn('STOMP: Cannot subscribe, client is not connected.');
      return () => {};
    }

    console.log(`STOMP: Subscribing to ${destination}`);
    const subscription = stompClientRef.current.subscribe(destination, (message) => {
      try {
        const body = JSON.parse(message.body);
        callback(body);
      } catch (e) {
        console.error('Failed to parse STOMP message body:', e);
      }
    });

    return () => {
      console.log(`STOMP: Unsubscribing from ${destination}`);
      subscription.unsubscribe();
    };
  };

  const send = (destination: string, body: any) => {
    if (!stompClientRef.current || !connected) {
      console.warn('STOMP: Cannot publish, client is not connected.');
      return;
    }
    
    console.log(`STOMP: Publishing to ${destination}`);
    stompClientRef.current.publish({
      destination,
      body: JSON.stringify(body)
    });
  };

  return (
    <WebsocketContext.Provider value={{ connected, subscribe, send }}>
      {children}
    </WebsocketContext.Provider>
  );
};

export const useWebsocket = () => {
  const context = useContext(WebsocketContext);
  if (context === undefined) {
    throw new Error('useWebsocket must be used within a WebsocketProvider');
  }
  return context;
};
