
export interface GeneratedCard {
  name: string;
  type: 'trait' | 'dominant' | 'age' | 'catastrophe' | 'trinket' | 'treasure';
  color?: 'red' | 'green' | 'blue' | 'purple' | 'colorless';
  faceValue?: number;
  effect?: string;
  action?: string;
  points?: number;
  expansion?: string;
  rarity?: string;
  tiers?: { [key: string]: string };
  objective?: string;
  power?: string;
  worldsEnd?: string;
  description?: string;
}

export class OpenAIDeveloperService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateCardFromImage(base64Image: string): Promise<GeneratedCard> {
    const prompt = `
You are an expert Doomlings card designer. Your task is to identify the card in the provided image and extract its properties into a very strictly defined JSON format.

### CARD TYPES AND SCHEMAS:

1. **Dominants Guide & Format**:
For Dominant cards, generate exactly 5 'tiers'. Tiers represent escalating power. As the tier goes from 1 to 5, the effect must get mathematically stronger, broader, or offer significantly more points, while maintaining the same core mechanical theme. Tier 1 MUST be the exact text found on the card. Use exactly this JSON format:
{
  "name": "Card Name",
  "type": "dominant",
  "tiers": {
    "1": "Tier 1 text (weakest version, lowest points)",
    "2": "Tier 2 text (slightly stronger)",
    "3": "Tier 3 text (moderate strength)",
    "4": "Tier 4 text (very strong)",
    "5": "Tier 5 text (maximum power, highest points)"
  }
}

2. **Standard Traits (Including Tech/Swarm/Mythic)**:
For standard Traits, determine the color, face value (usually 1-4, or negative), and points. Sort abilities into 'effect' (passives/end of game) or 'action' (tap effects). Use exactly this JSON format:
{
    "name": "Card Name",
    "type": "trait",
    "color": "red | blue | green | purple | colorless",
    "faceValue": 1,
    "points": 1,
    "effect": "Passive or End-of-game effect text (Leave empty if none)",
    "action": "Active tap-effect text (Leave empty if none)"
}

3. **Ages**:
For Ages, determine the table-wide rule that applies to all players for this round. Use exactly this JSON format:
{
    "name": "Age Name",
    "type": "age",
    "description": "Rules or modifiers that apply to players during this round."
}

4. **Catastrophes**:
For Catastrophes, determine the devastating effect applied at World's End (end of the game). Use exactly this JSON format:
{
    "name": "Catastrophe Name",
    "type": "catastrophe",
    "description": "Optional theme or flavor text",
    "worldsEnd": "The negative effect penalty or scoring reduction applied at the end of the game."
}

5. **Meaning of Life**:
For Meaning of Life cards, define the specific endgame bonus scoring logic. Use exactly this JSON format:
{
    "name": "MOL Name",
    "type": "meaningOfLife",
    "description": "The specific condition required to gain bonus points at the end of the game."
}

6. **Trinkets (Magical Merchants)**:
For Trinkets, delineate the passive power and the objective required. Use exactly this JSON format:
{
    "name": "Trinket Name",
    "type": "trinket",
    "power": "The ongoing passive bonus this trinket provides.",
    "objective": "The condition needed to play it or trigger it.",
    "points": 3
}

### INSTRUCTIONS:
- Return ONLY valid JSON block matching the exact structure for the type of card you identify in the image. No markdown blocks, just the parseable JSON string.
- Ensure the JSON fields match the schema exactly.
`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: handleOpenAIRequest(prompt, base64Image)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'OpenAI API request failed');
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Extract JSON if AI wrapped it in markdown
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('AI did not return valid JSON');
      
      return JSON.parse(jsonMatch[0]);
    } catch (err) {
      console.error('OpenAI Service Error:', err);
      throw err;
    }
  }
}

function handleOpenAIRequest(prompt: string, base64Image: string) {
  // If the image string already includes the data URI scheme, use it as is.
  // Otherwise, prepend the default jpeg prefix.
  const imageUrl = base64Image.startsWith('data:image/') 
    ? base64Image 
    : `data:image/jpeg;base64,${base64Image}`;

  return JSON.stringify({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: {
              url: imageUrl
            }
          }
        ]
      }
    ],
    max_tokens: 1500,
    response_format: { type: "json_object" }
  });
}
