// Battleship game engine

const SHIPS = [
  { name: "Carrier", size: 5 },
  { name: "Battleship", size: 4 },
  { name: "Cruiser", size: 3 },
  { name: "Submarine", size: 3 },
  { name: "Destroyer", size: 2 },
];

const GRID = 10; // 10x10

export function createBoard() {
  const occupied = new Set();
  const ships = [];

  for (const ship of SHIPS) {
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 200) {
      attempts++;
      const horizontal = Math.random() < 0.5;
      const startRow = Math.floor(Math.random() * (horizontal ? GRID : GRID - ship.size + 1));
      const startCol = Math.floor(Math.random() * (horizontal ? GRID - ship.size + 1 : GRID));

      const cells = [];
      let valid = true;

      for (let i = 0; i < ship.size; i++) {
        const r = horizontal ? startRow : startRow + i;
        const c = horizontal ? startCol + i : startCol;
        const key = `${r},${c}`;
        if (occupied.has(key)) {
          valid = false;
          break;
        }
        cells.push({ row: r, col: c });
      }

      if (valid) {
        for (const cell of cells) {
          occupied.add(`${cell.row},${cell.col}`);
        }
        ships.push({
          name: ship.name,
          size: ship.size,
          cells,
          hits: 0,
          sunk: false,
        });
        placed = true;
      }
    }
  }

  return { ships, totalCells: 17 };
}

export function processShot(board, row, col) {
  // Check if any ship occupies this cell
  for (const ship of board.ships) {
    const cellIndex = ship.cells.findIndex(
      (c) => c.row === row && c.col === col
    );
    if (cellIndex !== -1) {
      ship.hits++;
      if (ship.hits >= ship.size) {
        ship.sunk = true;
        return { result: "sunk", ship: ship.name, shipCells: ship.cells };
      }
      return { result: "hit" };
    }
  }
  return { result: "miss" };
}

export function allShipsSunk(board) {
  return board.ships.every((s) => s.sunk);
}

export function calculateBattleshipPoints(shotCount) {
  // 17 minimum shots (all cells), 100 max shots
  // Points: max(1, 101 - shotCount)
  return Math.max(1, 101 - shotCount);
}

// Build a safe board view for spectators (no hidden ship positions)
export function safeBoard(board, shots) {
  // Only reveal ship positions for sunk ships
  const sunkShips = board.ships.filter((s) => s.sunk).map((s) => ({
    name: s.name,
    size: s.size,
    cells: s.cells,
  }));

  return { sunkShips, totalShips: SHIPS.length };
}
