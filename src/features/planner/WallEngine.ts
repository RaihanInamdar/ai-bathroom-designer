import { RoomConfig, WallOrientation, WallSegment } from '../../models/Room';

export function calculateWallSegments(room: RoomConfig, finishId: string = 'ceramic_artisan_glazed'): WallSegment[] {
  const L = room.length;
  const W = room.width;
  const H = room.height;

  const walls: { wall: WallOrientation; length: number; start: { x: number; y: number }; end: { x: number; y: number } }[] = [
    { wall: 'north', length: L, start: { x: 0, y: 0 }, end: { x: L, y: 0 } },
    { wall: 'east', length: W, start: { x: L, y: 0 }, end: { x: L, y: W } },
    { wall: 'south', length: L, start: { x: 0, y: W }, end: { x: L, y: W } },
    { wall: 'west', length: W, start: { x: 0, y: 0 }, end: { x: 0, y: W } },
  ];

  return walls.map((w) => {
    const grossArea = Number((w.length * H).toFixed(2));
    let openingArea = 0;

    if (room.door && room.door.wall === w.wall) {
      openingArea += (room.door.width || 2.5) * (room.door.height || 7.0);
    }
    if (room.window && room.window.wall === w.wall) {
      openingArea += (room.window.width || 3.0) * (room.window.height || 3.0);
    }

    const netArea = Number(Math.max(0, grossArea - openingArea).toFixed(2));

    return {
      id: `wall-${w.wall}`,
      wall: w.wall,
      start: w.start,
      end: w.end,
      length: w.length,
      height: H,
      grossArea,
      netArea,
      finishId
    };
  });
}

export function getWallSpan(wall: WallOrientation, room: RoomConfig): number {
  return (wall === 'west' || wall === 'east') ? room.width : room.length;
}
