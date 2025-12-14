/**
 * Calculates the group and number of liberties for a stone at (r, c).
 */
export const getGroup = (board: number[][], r: number, c: number) => {
  const color = board[r][c];
  if (color === 0) return { group: [], liberties: 0 };
  
  const group: {r: number, c: number}[] = [];
  const visited = new Set<string>();
  const liberties = new Set<string>();
  const queue = [{r, c}];
  
  const startKey = `${r},${c}`;
  visited.add(startKey);
  group.push({r, c});

  let ptr = 0;
  while(ptr < group.length){
      const {r: curR, c: curC} = group[ptr++];
      const neighbors = [
        {r: curR - 1, c: curC}, {r: curR + 1, c: curC},
        {r: curR, c: curC - 1}, {r: curR, c: curC + 1}
      ];
      for(const n of neighbors){
          if(n.r >= 0 && n.r < 15 && n.c >= 0 && n.c < 15){
              const key = `${n.r},${n.c}`;
              const val = board[n.r][n.c];
              if(val === 0){
                  liberties.add(key);
              } else if(val === color && !visited.has(key)){
                  visited.add(key);
                  group.push(n);
              }
          }
      }
  }
  return { group, liberties: liberties.size };
};

/**
 * Applies a move to the board, handling captures and suicide rule.
 * Returns the new board state, validity, and number of captured stones.
 */
export const applyGoMove = (board: number[][], r: number, c: number, player: number) => {
    // Deep copy to simulate
    const nextBoard = board.map(row => [...row]);
    
    // Position must be empty
    if(nextBoard[r][c] !== 0) return { board, invalid: true, captured: 0 }; 

    nextBoard[r][c] = player;
    const opponent = player === 1 ? 2 : 1;
    let totalCaptured = 0;

    // Check 4 neighbors for opponent groups that lost all liberties
    const neighbors = [
        {r: r - 1, c: c}, {r: r + 1, c: c},
        {r: r, c: c - 1}, {r: r, c: c + 1}
    ];

    for(const n of neighbors){
        if(n.r >= 0 && n.r < 15 && n.c >= 0 && n.c < 15){
            if(nextBoard[n.r][n.c] === opponent){
                const { group, liberties } = getGroup(nextBoard, n.r, n.c);
                if(liberties === 0){
                    totalCaptured += group.length;
                    // Remove captured stones
                    for(const s of group) nextBoard[s.r][s.c] = 0;
                }
            }
        }
    }

    // Check Self Liberties (Suicide Rule)
    // We check this AFTER removing captured stones, because capturing might create liberties.
    const { liberties: selfLiberties } = getGroup(nextBoard, r, c);
    if(selfLiberties === 0){
        // Move is suicide, invalid.
        return { board, invalid: true, captured: 0 };
    }

    return { board: nextBoard, invalid: false, captured: totalCaptured };
}