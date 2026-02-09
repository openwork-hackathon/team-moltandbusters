/**
 * Maze generation using recursive backtracking.
 * Each cell has walls: { north, south, east, west }.
 * The maze is guaranteed to have a path from start to cheese.
 */

const SIZE = 10;

export function createMaze() {
  // Initialize grid with all walls
  const grid = [];
  for (let r = 0; r < SIZE; r++) {
    grid[r] = [];
    for (let c = 0; c < SIZE; c++) {
      grid[r][c] = { north: true, south: true, east: true, west: true };
    }
  }

  // Recursive backtracking to carve maze
  const visited = Array.from({ length: SIZE }, () => Array(SIZE).fill(false));

  function carve(r, c) {
    visited[r][c] = true;
    const dirs = shuffle(["north", "south", "east", "west"]);

    for (const dir of dirs) {
      const [nr, nc] = neighbor(r, c, dir);
      if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && !visited[nr][nc]) {
        // Remove wall between current cell and neighbor
        grid[r][c][dir] = false;
        grid[nr][nc][opposite(dir)] = false;
        carve(nr, nc);
      }
    }
  }

  carve(0, 0);

  // Pick start and cheese positions (far apart for interesting paths)
  const start = { row: 0, col: 0 };
  const cheese = { row: SIZE - 1, col: SIZE - 1 };

  // Calculate optimal path length via BFS
  const optimal = bfs(grid, start, cheese);

  return { grid, start, cheese, size: SIZE, optimalLength: optimal };
}

function neighbor(r, c, dir) {
  switch (dir) {
    case "north": return [r - 1, c];
    case "south": return [r + 1, c];
    case "east": return [r, c + 1];
    case "west": return [r, c - 1];
  }
}

function opposite(dir) {
  switch (dir) {
    case "north": return "south";
    case "south": return "north";
    case "east": return "west";
    case "west": return "east";
  }
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function bfs(grid, start, end) {
  const queue = [{ r: start.row, c: start.col, dist: 0 }];
  const visited = Array.from({ length: SIZE }, () => Array(SIZE).fill(false));
  visited[start.row][start.col] = true;

  while (queue.length > 0) {
    const { r, c, dist } = queue.shift();
    if (r === end.row && c === end.col) return dist;

    for (const dir of ["north", "south", "east", "west"]) {
      if (!grid[r][c][dir]) {
        // No wall in this direction
        const [nr, nc] = neighbor(r, c, dir);
        if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && !visited[nr][nc]) {
          visited[nr][nc] = true;
          queue.push({ r: nr, c: nc, dist: dist + 1 });
        }
      }
    }
  }

  return -1; // unreachable (shouldn't happen with recursive backtracking)
}

/**
 * Validate a move: returns true if the agent can move in that direction.
 */
export function canMove(grid, row, col, direction) {
  if (!["north", "south", "east", "west"].includes(direction)) return false;
  if (grid[row][col][direction]) return false; // wall blocks movement
  const [nr, nc] = neighbor(row, col, direction);
  return nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE;
}

/**
 * Get new position after moving.
 */
export function getNewPosition(row, col, direction) {
  const [nr, nc] = neighbor(row, col, direction);
  return { row: nr, col: nc };
}

/**
 * Calculate points for completing the maze.
 */
export function calculateMazePoints(moveCount) {
  return Math.max(1, 101 - moveCount);
}
