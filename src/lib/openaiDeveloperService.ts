
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
You are an expert Doomlings card designer. Your task is to identify the card in the provided image and extract its properties into a JSON format.

### CARD TYPES AND SCHEMAS:

1. **Trait Card**:
   - color: 'red', 'green', 'blue', 'purple', or 'colorless'
   - faceValue: number (the large number in the circle)
   - effect: the main ability text (exclude keyword 'Action:')
   - action: if it has an "Action:", extract it here
   - points: the star value at the bottom

2. **Dominant Card**:
   - name: The card name
   - tiers: An object with keys "1", "2", "3", "4", "5".
     - Tier 1 MUST be the exact text found on the card.
     - Tiers 2-5 must be extrapolated by you. They should follow the scaling pattern of existing Dominants (e.g., Slumbering, Titanic). They should make sense within the game balance.
     - Format: "• Tier X: [Ability Text] +[Points]pt."

3. **Age Card**:
   - name: The card name
   - description: The effect text of the age.

4. **Catastrophe**:
   - name: The card name
   - description: The immediate effect text.
   - worldsEnd: The "World's End" effect text at the bottom.

5. **Trinket**:
   - name: The card name
   - power: The passive power text.
   - objective: The pocketing objective text.
   - points: The point value.

### INSTRUCTIONS:
- Return ONLY valid JSON.
- If the card is a Dominant, create all 5 tiers based on the text of the first tier and common game patterns.
- Ensure the JSON fields match the schema exactly.
- If the card does not fit any existing type or seems to be a custom card with unknown mechanics, do your best to map it to 'trait' or 'treasure'.

### RESPONSE FORMAT:
{
  "name": "Card Name",
  "type": "trait | dominant | age | catastrophe | trinket | treasure",
  ... (type specific fields)
}
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
              url: `data:image/jpeg;base64,${base64Image}`
            }
          }
        ]
      }
    ],
    max_tokens: 1500,
    response_format: { type: "json_object" }
  });
}
