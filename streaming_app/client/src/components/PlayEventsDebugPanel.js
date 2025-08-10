import React, { useEffect, useState } from 'react';
import { useSocket } from '../contexts/SocketContext_enhanced';

const panelStyle = {
  position: 'fixed',
  bottom: 24,
  right: 24,
  width: 340,
  maxHeight: 320,
  background: 'rgba(24,28,36,0.98)',
  color: '#fff',
  border: '1px solid #333',
  borderRadius: 10,
  zIndex: 9999,
  fontSize: 13,
  boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
  padding: 12,
  overflowY: 'auto',
  fontFamily: 'monospace',
};

export default function PlayEventsDebugPanel() {
  const { socket } = useSocket();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!socket) return;
    const handler = (payload) => {
      setEvents((prev) => [
        { type: 'socket', ts: Date.now(), payload },
        ...prev.slice(0, 49)
      ]);
    };
    socket.on('track:play-count-updated', handler);
    return () => socket.off('track:play-count-updated', handler);
  }, [socket]);

  // Listen for local play-count POSTs (window event)
  useEffect(() => {
    const handler = (e) => {
      if (e.detail && e.detail.type === 'play-increment') {
        setEvents((prev) => [
          { type: 'local', ts: Date.now(), payload: e.detail },
          ...prev.slice(0, 49)
        ]);
      }
    };
    window.addEventListener('play-debug', handler);
    return () => window.removeEventListener('play-debug', handler);
  }, []);

  return (
    <div style={panelStyle}>
      <div style={{ fontWeight: 'bold', marginBottom: 6 }}>Play Events Debug</div>
      {events.length === 0 && <div style={{ color: '#aaa' }}>No play events yet.</div>}
      {events.map((ev, i) => (
        <div key={i} style={{ marginBottom: 4 }}>
          <span style={{ color: ev.type === 'socket' ? '#1DB954' : '#ffb300' }}>
            [{ev.type === 'socket' ? 'SOCKET' : 'LOCAL'}]
          </span>{' '}
          <span style={{ color: '#888' }}>{new Date(ev.ts).toLocaleTimeString()}</span>{' '}
          <span style={{ wordBreak: 'break-all' }}>{JSON.stringify(ev.payload)}</span>
        </div>
      ))}
    </div>
  );
}
