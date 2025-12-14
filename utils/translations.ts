import { Language } from '../types';

export const translations = {
  en: {
    appTitle: "Logic Board AI",
    subtitle: "Super Brain Training Hub",
    back: "Back",
    reset: "Reset Game",
    clear: "Clear Board",
    turns: "Turns",
    playAgain: "Play Again",
    victory: "YOU WIN!",
    defeat: "GAME OVER",
    draw: "DRAW",
    score: "Score",
    highScore: "Best",
    newRecord: "NEW RECORD!",
    aiWin: "AI WINS!",
    p1Win: "P1 WINS!",
    p2Win: "P2 WINS!",
    you: "You",
    ai: "AI",
    opponent: "Opponent",
    player1: "Player 1",
    player2: "Player 2",
    thinking: "Thinking...",
    waiting: "Waiting...",
    tutorial: "Tutorial",
    close: "Close",
    startGame: "Start Game",
    singlePlayer: "Vs AI",
    localMulti: "Pass & Play",
    onlineMulti: "Online Match",
    difficulty: "Difficulty",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    searching: "Searching for opponent...",
    matchFound: "Match Found!",
    connecting: "Connecting...",
    hint: "Hint",
    timeUp: "Time's Up!",
    save: "Save",
    load: "Load",
    saved: "Saved!",
    emptySlots: "No saved drawings",
    undo: "Undo",
    redo: "Redo",
    pass: "Pass",
    gameEnded: "Game Ended",
    finalScore: "Final Score",
    stones: "Stones",
    captures: "Captures",
    total: "Total",
    gomokuDesc: "Five-in-a-row strategy.",
    goDesc: "Surround and capture strategy.",
    memoryDesc: "Test your cognitive recall.",
    drawDesc: "Pixel art canvas.",
    snakeDesc: "Classic snake arcade game.",
    gomokuRules: [
      "The goal is to be the first to get 5 pieces in a row.",
      "You can win horizontally, vertically, or diagonally.",
      "Black (You/P1) plays first.",
      "Players alternate turns placing one stone at a time.",
      "You have 30 seconds per turn!"
    ],
    goRules: [
      "Place stones on intersections to surround territory.",
      "Stones with no 'liberties' (empty adjacent points) are captured.",
      "Suicide moves are forbidden unless they capture.",
      "The game ends when both players pass."
    ],
    memoryRules: [
      "Tap a card to flip it over.",
      "Find the matching pair for each card.",
      "Remember card locations to reduce turns.",
      "Clear the board to win."
    ],
    drawRules: [
      "Select a color from the palette.",
      "Tap or drag on the grid to paint pixels.",
      "Use 'Save' to keep your art.",
      "Be creative!"
    ],
    snakeRules: [
      "Use arrow keys or buttons to move.",
      "Eat the red food to grow and earn points.",
      "Avoid hitting the walls or your own tail.",
      "Survive as long as you can!"
    ]
  },
  zh: {
    appTitle: "逻辑棋盘 AI",
    subtitle: "超级大脑训练中心",
    back: "返回",
    reset: "重置游戏",
    clear: "清空画板",
    turns: "回合数",
    playAgain: "再玩一次",
    victory: "你赢了！",
    defeat: "游戏结束",
    draw: "平局",
    score: "得分",
    highScore: "最高分",
    newRecord: "新纪录！",
    aiWin: "AI 获胜！",
    p1Win: "玩家1 获胜！",
    p2Win: "玩家2 获胜！",
    you: "你",
    ai: "AI",
    opponent: "对手",
    player1: "玩家1",
    player2: "玩家2",
    thinking: "思考中...",
    waiting: "等待中...",
    tutorial: "游戏教程",
    close: "关闭",
    startGame: "开始游戏",
    singlePlayer: "人机对战",
    localMulti: "本地双人",
    onlineMulti: "在线匹配",
    difficulty: "难度选择",
    easy: "简单",
    medium: "中等",
    hard: "困难",
    searching: "正在寻找对手...",
    matchFound: "找到对手！",
    connecting: "连接中...",
    hint: "提示",
    timeUp: "时间到！",
    save: "保存",
    load: "读取",
    saved: "已保存！",
    emptySlots: "暂无存档",
    undo: "撤销",
    redo: "重做",
    pass: "停一手",
    gameEnded: "游戏结束",
    finalScore: "最终得分",
    stones: "盘面",
    captures: "提子",
    total: "总计",
    gomokuDesc: "经典五子棋策略对战。",
    goDesc: "围地吃子的黑白博弈。",
    memoryDesc: "考验记忆力的配对游戏。",
    drawDesc: "像素艺术创作画板。",
    snakeDesc: "经典贪吃蛇街机模式。",
    gomokuRules: [
      "目标是率先在横、竖或斜线上连成5个棋子。",
      "黑棋（你/玩家1）先行。",
      "双方轮流落子，每次一枚。",
      "率先连成五子者获胜。",
      "每回合限时30秒！"
    ],
    goRules: [
      "棋子下在交叉点上，目标是围得比对方更多的地盘。",
      "气尽子亡：失去所有气的棋子会被提子（吃掉）。",
      "禁止自杀：不能下在没有气且不能提子的地方。",
      "双方都停一手（Pass）时游戏结束。"
    ],
    memoryRules: [
      "点击卡片将其翻转。",
      "找到每张卡片对应的配对。",
      "记住卡片位置以减少回合数。",
      "消除所有卡片即可获胜。"
    ],
    drawRules: [
      "从调色板选择颜色。",
      "点击或拖动网格进行绘制。",
      "使用“保存”按钮储存你的作品。",
      "尽情发挥创意！"
    ],
    snakeRules: [
      "使用方向键或屏幕按钮移动。",
      "吃掉红色食物变长并得分。",
      "避免撞到墙壁或自己的尾巴。",
      "尽可能生存更久！"
    ]
  }
};

export const t = (lang: Language, key: keyof typeof translations.en) => {
  return translations[lang][key] || translations['en'][key];
};

export const tRules = (lang: Language, key: 'gomokuRules' | 'memoryRules' | 'drawRules' | 'snakeRules' | 'goRules') => {
  return translations[lang][key];
}