import { GoogleGenAI, Type } from "@google/genai";
import { Move, Difficulty, GameType } from "../types";

const apiKey = process.env.API_KEY || '';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey });

/**
 * Asks Gemini for the best next move based on game type and difficulty.
 */
export const getStrategyMove = async (
  grid: number[][], 
  gameType: GameType, 
  difficulty: Difficulty = Difficulty.MEDIUM
): Promise<Move> => {
  if (!apiKey) {
    console.warn("No API Key found. Returning random move.");
    return getRandomMove(grid);
  }

  const modelId = "gemini-2.5-flash"; 
  const isGo = gameType === GameType.GO;
  const gameName = isGo ? "Go (Weiqi)" : "Gomoku (Five-in-a-Row)";

  // Convert grid to a readable string representation
  // 0: Empty, 1: User (Black), 2: AI (White)
  const boardStr = grid.map(row => row.join(',')).join('\n');

  let persona = "";
  if (difficulty === Difficulty.EASY) {
    persona = `You are a beginner ${gameName} player. You make occasional mistakes.`;
  } else if (difficulty === Difficulty.MEDIUM) {
    persona = `You are a competent ${gameName} player. You play strategically.`;
  } else {
    persona = `You are a Grandmaster ${gameName} expert. You play perfectly and aggressively.`;
  }

  const gomokuRules = `
    - Win by getting 5 in a row horizontally, vertically, or diagonally.
    - Block the opponent if they have 3 or 4 in a row.
  `;

  const goRules = `
    - Surrounded opposing stones are captured and removed.
    - Do not make suicide moves (moves with no liberties) unless it captures.
    - Focus on surrounding territory and keeping your groups alive (two eyes).
    - If a move is suicidal or strictly forbidden by Ko, choose another.
  `;

  const prompt = `
    ${persona}
    
    You are playing as Player 2 (White). Player 1 (Black) is the opponent.
    Analyze the current board state and determine the coordinate for your next move.
    
    Rules:
    - The board is 15x15.
    - 0 is empty, 1 is opponent, 2 is you.
    ${isGo ? goRules : gomokuRules}
    
    Current Board (csv format):
    ${boardStr}
    
    Return the result strictly in JSON format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            row: { type: Type.INTEGER },
            col: { type: Type.INTEGER },
            reasoning: { type: Type.STRING } 
          },
          required: ["row", "col"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");

    const result = JSON.parse(jsonText);
    
    // Validate move is within bounds and cell is empty
    if (
      result.row >= 0 && result.row < 15 &&
      result.col >= 0 && result.col < 15 &&
      grid[result.row][result.col] === 0
    ) {
      return { row: result.row, col: result.col };
    } else {
      console.warn("AI returned invalid move:", result);
      return getRandomMove(grid);
    }

  } catch (error) {
    console.error("Gemini Error:", error);
    return getRandomMove(grid);
  }
};

export const getGomokuMove = async (grid: number[][], difficulty: Difficulty = Difficulty.MEDIUM): Promise<Move> => {
  return getStrategyMove(grid, GameType.GOMOKU, difficulty);
}

const getRandomMove = (grid: number[][]): Move => {
  const emptyCells: Move[] = [];
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      if (grid[r][c] === 0) emptyCells.push({ row: r, col: c });
    }
  }
  if (emptyCells.length === 0) return { row: -1, col: -1 };
  const randomIndex = Math.floor(Math.random() * emptyCells.length);
  return emptyCells[randomIndex];
};

/**
 * Get a quick tip or encouragement
 */
export const getGameCoachTip = async (gameName: string, stateDescription: string, lang: string = 'en'): Promise<string> => {
  if (!apiKey) return lang === 'zh' ? "保持专注！你做得很好。" : "Keep focusing! You're doing great.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Provide a very short (max 15 words) witty or helpful tip for a player playing ${gameName}. Language: ${lang === 'zh' ? 'Chinese' : 'English'}. Context: ${stateDescription}`,
    });
    return response.text || (lang === 'zh' ? "加油！" : "Play smart!");
  } catch (e) {
    return lang === 'zh' ? "保持敏锐！" : "Stay sharp!";
  }
}

/**
 * Generates pixel art grid based on prompt
 */
export const generatePixelArt = async (prompt: string, rows: number, cols: number): Promise<string[][]> => {
  if (!apiKey) {
    throw new Error("No API Key");
  }

  const systemInstruction = `
    You are a pixel artist AI.
    Your task is to generate a ${rows}x${cols} grid of Hex Color Codes based on the user's description.
    Return ONLY a JSON object containing the grid.
    The grid should be a 2D array of strings (hex codes).
    Use '#ffffff' for empty/background space if not specified.
    Make the art simple and recognizable at this resolution.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate pixel art for: "${prompt}"`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            grid: {
              type: Type.ARRAY,
              items: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            }
          }
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    
    // Basic validation
    if (result.grid && Array.isArray(result.grid) && result.grid.length > 0) {
      // Ensure dimensions match roughly (or resize logic handled by caller, but here we just return what AI gave)
      return result.grid;
    }
    throw new Error("Invalid format from AI");
  } catch (error) {
    console.error("AI Pixel Gen Error:", error);
    throw error;
  }
};