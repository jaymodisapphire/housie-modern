'use client';

import { useState, useEffect } from 'react';
import Pusher from 'pusher-js';

export default function HousieGame() {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState('');
  const [me, setMe] = useState(null);

  useEffect(() => {
    if (!me?.code) return;
    
    // Connect to Pusher for real-time events
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });
    
    const channel = pusher.subscribe(`room-${me.code}`);
    channel.bind('game-update', (data) => {
      setGameState(data);
    });

    return () => {
      pusher.unsubscribe(`room-${me.code}`);
    };
  }, [me]);

  const joinGame = async (action) => {
    if (!name) return setError('Enter your name first.');
    const res = await fetch(`/api/${action}`, {
      method: 'POST',
      body: JSON.stringify({ name, code: roomCode }),
    });
    const data = await res.json();
    if (data.error) return setError(data.error);
    
    setMe({ code: data.code, pid: data.pid });
    setError('');
  };

  const callNumber = async () => {
    await fetch('/api/call', { method: 'POST', body: JSON.stringify(me) });
  };

  if (!me) {
    return (
      <main className="min-h-screen bg-slate-900 text-slate-100 p-6 font-sans">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-4xl font-bold text-amber-500">Office Housie</h1>
          <p className="text-slate-400">One person hosts, everyone else joins with the room code.</p>
          
          <div className="bg-slate-800 p-6 rounded-xl space-y-4">
            <h2 className="text-xl font-semibold text-emerald-400">Your Name</h2>
            <input 
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 outline-none focus:border-emerald-500"
              value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jay Modi" 
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-800 p-6 rounded-xl space-y-4">
              <h2 className="text-xl font-semibold text-amber-400">Host a game</h2>
              <button onClick={() => joinGame('create')} className="w-full bg-amber-500 text-slate-900 font-bold py-3 rounded-lg hover:bg-amber-400">
                Host New Game
              </button>
            </div>
            
            <div className="bg-slate-800 p-6 rounded-xl space-y-4">
              <h2 className="text-xl font-semibold text-amber-400">Join a game</h2>
              <input 
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 outline-none focus:border-emerald-500 uppercase"
                value={roomCode} onChange={(e) => setRoomCode(e.target.value)} placeholder="Room Code" 
              />
              <button onClick={() => joinGame('join')} className="w-full bg-amber-500 text-slate-900 font-bold py-3 rounded-lg hover:bg-amber-400">
                Join Game
              </button>
            </div>
          </div>
          {error && <p className="text-rose-400 font-medium">{error}</p>}
        </div>
      </main>
    );
  }

  // Active Game UI
  const isHost = gameState?.hostId === me.pid;
  const lastNumber = gameState?.called?.[gameState.called.length - 1];

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700">
          <div>
            <p className="text-slate-400 text-sm">Room Code</p>
            <p className="text-3xl font-mono font-bold text-amber-500 tracking-widest">{gameState?.code || me.code}</p>
          </div>
          <button onClick={() => setMe(null)} className="text-slate-400 hover:text-white">Leave Game</button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-slate-800 p-6 rounded-xl text-center space-y-6 border border-slate-700">
            <h2 className="text-xl font-bold text-emerald-400">Current Number</h2>
            <div className="w-32 h-32 mx-auto bg-rose-500 rounded-full flex items-center justify-center text-5xl font-bold text-white shadow-inner">
              {lastNumber || '-'}
            </div>
            {isHost && (
              <button onClick={callNumber} className="w-full bg-emerald-500 text-slate-900 font-bold py-3 rounded-lg hover:bg-emerald-400">
                Call Next Number
              </button>
            )}
          </div>
          
          <div className="md:col-span-2 bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h2 className="text-xl font-bold text-emerald-400 mb-4">Players ({gameState?.players?.length || 0})</h2>
            <div className="flex flex-wrap gap-2">
              {gameState?.players?.map(p => (
                <span key={p.id} className="bg-slate-950 px-4 py-1.5 rounded-full text-sm font-medium text-slate-300">
                  {p.name} {p.id === gameState?.hostId && '(Host)'}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}