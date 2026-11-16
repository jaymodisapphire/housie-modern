import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import Pusher from 'pusher';

const redis = Redis.fromEnv();
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  useTLS: true
});

export async function POST(req, { params }) {
  // Correctly await dynamic route params for Next.js 15
  const resolvedParams = await params;
  const { action } = resolvedParams;
  
  const b = await req.json();
  const code = (b.code || "").toUpperCase();
  
  let room = code ? await redis.get(`room:${code}`) : null;

  switch (action) {
    case "create":
      const newCode = Math.random().toString(36).substring(2, 6).toUpperCase();
      const pid = Math.random().toString(36).substring(2, 10);
      room = {
        code: newCode,
        hostId: pid,
        players: [{ id: pid, name: b.name }],
        called: [],
        pool: Array.from({ length: 90 }, (_, i) => i + 1).sort(() => Math.random() - 0.5),
        winners: {}
      };
      await redis.set(`room:${newCode}`, room);
      return NextResponse.json({ code: newCode, pid });

    case "join":
      if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
      const newPid = Math.random().toString(36).substring(2, 10);
      room.players.push({ id: newPid, name: b.name });
      await redis.set(`room:${code}`, room);
      await pusher.trigger(`room-${code}`, 'game-update', room);
      return NextResponse.json({ code, pid: newPid });

    case "call":
      if (!room || room.hostId !== b.pid) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      room.called.push(room.pool.pop());
      await redis.set(`room:${code}`, room);
      await pusher.trigger(`room-${code}`, 'game-update', room);
      return NextResponse.json({ ok: true });

    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
}