import {
  Entity,
  spawnConfusionScroll,
  spawnFireballScroll,
  spawnHealthPotion,
  spawnLightningScroll,
  spawnOrc,
  spawnTroll
} from './entity';
import { FLOOR_TILE, Tile, WALL_TILE } from './tile-types';
import { Display } from 'rot-js';
import { GameMap } from './game-map';

interface Bounds {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

class RectangularRoom {
  tiles: Tile[][];

  constructor(public x: number, public y: number, public width: number, public height: number) {
    this.tiles = new Array(this.height);
    this.buildRoom();
  }

  get bounds(): Bounds {
    return {
      x1: this.x,
      y1: this.y,
      x2: this.x + this.width - 1,
      y2: this.y + this.height - 1
    };
  }

  buildRoom() {
    for (let y = 0; y < this.height; y++) {
      const row = new Array(this.width);
      for (let x = 0; x < this.width; x++) {
        const isWall = x === 0 || x === this.width - 1 || y === 0 || this.height - 1;
        row[x] = isWall ? { ...FLOOR_TILE } : { ...WALL_TILE };
      }
      this.tiles[y] = row;
    }
  }

  public get center(): [number, number] {
    const centerX = this.x + Math.floor(this.width / 2);
    const centerY = this.y + Math.floor(this.height / 2);
    return [centerX, centerY];
  }

  intersects(other: RectangularRoom): boolean {
    return (
      this.x <= other.x + other.width &&
      this.x + this.width >= other.x &&
      this.y <= other.y + other.height &&
      this.y + this.width >= other.y
    );
  }
}

export function generateRandomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function placeEntities(
  room: RectangularRoom,
  dungeon: GameMap,
  maxMonsters: number,
  maxItems: number
) {
  const numberOfMonstersToAdd = generateRandomNumber(0, maxMonsters);
  const numberOfItemsToAdd = generateRandomNumber(0, maxItems);
  const bounds = room.bounds;

  for (let i = 0; i < numberOfMonstersToAdd; i++) {
    const x = generateRandomNumber(bounds.x1 + 1, bounds.x2 - 1);
    const y = generateRandomNumber(bounds.y1 + 1, bounds.y2 - 1);
    if (!dungeon.entities.some(e => e.x === x && e.y === y)) {
      if (Math.random() < 0.8) {
        dungeon.entities.push(spawnOrc(dungeon, x, y));
      } else {
        dungeon.entities.push(spawnTroll(dungeon, x, y));
      }
    }
  }

  for (let i = 0; i < numberOfItemsToAdd; i++) {
    const x = generateRandomNumber(bounds.x1 + 1, bounds.x2 - 1);
    const y = generateRandomNumber(bounds.y1 + 1, bounds.y2 - 1);

    if (!dungeon.entities.some(e => e.x === x && e.y === y)) {
      const itemChance = Math.random();
      if (itemChance < 0.7) {
        spawnHealthPotion(dungeon, x, y);
      } else if (itemChance < 0.8) {
        spawnFireballScroll(dungeon, x, y);
      } else if (itemChance < 0.9) {
        spawnConfusionScroll(dungeon, x, y);
      } else {
        spawnLightningScroll(dungeon, x, y);
      }
    }
  }
}

export function generateDungeon(
  mapWidth: number,
  mapHeight: number,
  maxRooms: number,
  minSize: number,
  maxSize: number,
  maxMonsters: number,
  maxItems: number,
  player: Entity,
  display: Display
): GameMap {
  const dungeon = new GameMap(mapWidth, mapHeight, display, [player]);

  const rooms: RectangularRoom[] = [];

  // generate rooms up to the given parameters and add them to the room array
  for (let count = 0; count < maxRooms; count++) {
    const width = generateRandomNumber(minSize, maxSize);
    const height = generateRandomNumber(minSize, maxSize);
    const x = generateRandomNumber(0, mapWidth - width - 1);
    const y = generateRandomNumber(0, mapHeight - height - 1);
    const newRoom = new RectangularRoom(x, y, width, height);

    if (rooms.some(r => r.intersects(newRoom))) {
      continue;
    }
    dungeon.addRoom(x, y, newRoom.tiles);
    placeEntities(newRoom, dungeon, maxMonsters, maxItems);
    rooms.push(newRoom);
  }

  // finding a start point for the player
  const startPoint = rooms[0].center;
  player.x = startPoint[0];
  player.y = startPoint[1];

  // connect up all of the rooms we generated
  for (let index = 0; index < rooms.length - 1; index++) {
    const first = rooms[index];
    const second = rooms[index + 1];

    for (const tile of connectRooms(first, second)) {
      dungeon.tiles[tile[1]][tile[0]] = { ...FLOOR_TILE };
    }
  }

  return dungeon;
}

function* connectRooms(
  a: RectangularRoom,
  b: RectangularRoom
): Generator<[number, number], void, void> {
  // set the start point of our tunnel at the center of the first room
  const current = a.center;
  // set the end point at the center of the second room
  const end = b.center;

  // flip a coin to see if we go horizontally first or vertically
  const horizontal = Math.random() < 0.5;
  // set our axisIndex to 0 (x axis) if horizontal or 1 (y axis) if vertical
  let axisIndex = horizontal ? 0 : 1;

  // we'll loop until our current is the same as the end point
  while (current[0] !== end[0] || current[1] !== end[1]) {
    // are we tunneling in the positive or negative direction?

    // if direction is 0 we have hit the destination in one direction
    const direction = Math.sign(end[axisIndex] - current[axisIndex]);
    if (direction !== 0) {
      current[axisIndex] += direction;
      yield current;
    } else {
      // we've finished in this direction so switch to the other
      axisIndex = axisIndex === 0 ? 1 : 0;
      yield current;
    }
  }
}
