import CardDataService from './cardDataService';

const SYSTEM_PROMPT = `You are an expert game designer and card templating engine for a custom card game.  
You know the complete rules of the game, including how power, cost, interactions, and balance work.  
Your only job is to generate valid JSON card definitions that exactly match the existing schema and naming conventions provided in this prompt.  
You must always follow the game rules, respect balance, and ensure every generated card or card tier is playable and coherent within the game.

You must respond with JSON only, with no explanations and no extra text.  
If anything is unclear, make the safest, most conservative assumption that keeps the card balanced and valid.`;

export async function generateCardFromJson(base64Image: string, apiKey: string) {
    const cardService = CardDataService.getInstance();
    const gameData = await cardService.loadAllData();

    // Limit to 10 dominant examples due to prompt limits
    const dominantExamples = gameData.dominants?.slice(0, 10) || [];

    const schemaNotes = `
Below is the exact JSON structure for different card types:

1. Trait (Includes standard traits and expansions like moonlings, glitterlings, etc)
{
  "name": "Card Name",
  "type": "trait",
  "color": "red" | "green" | "blue" | "purple" | "colorless",
  "faceValue": number,
  "effect": "Card effect description",
  "action": "Card action description (if any)",
  "expansion": "base" | "treasures" | "magical_merchants" | "glitterlings" | "moonlings" | "deeplings" | "fuzelings" | "base_extended",
  "points": number (if fixed points needed besides faceValue)
}

2. Dominant Trait (These must ALWAYS have tiers 1-5 defined in exactly this format)
{
  "name": "Card Name",
  "type": "dominant",
  "tiers": {
    "1": "• Tier 1: [Exact physical card text, no stronger]",
    "2": "• Tier 2: [Improved, balanced variant]",
    "3": "• Tier 3: [Further improved]",
    "4": "• Tier 4: [Further improved]",
    "5": "• Tier 5: [Ultimate version]"
  }
}

3. Age
{
  "name": "Age Name",
  "type": "age",
  "description": "Rule for this age",
  "expansion": "base" | "merchants" | "imaginary_ends"
}

4. Catastrophe
{
  "name": "Catastrophe Name",
  "type": "catastrophe",
  "description": "What happens when this is played",
  "worldsEnd": "What happens at the end of the game",
  "expansion": "base" | "imaginary_ends"
}

5. Trinket
{
  "name": "Trinket Name",
  "type": "trinket",
  "power": "Passive power it grants",
  "objective": "How to score this trinket",
  "points": number
}

6. Treasure
{
  "name": "Treasure Name",
  "type": "treasure",
  "effect": "Effect description",
  "points": number,
  "expansion": "treasures",
  "rarity": "rare" | "epic" | "legendary"
}
`;

    const userPrompt = `
<context>
Here are the core rules of the game and how cards work:
${gameData.rules.join('\n')}
${gameData.catastropheRules.join('\n')}
</context>

<context>
Here is the exact JSON schema and conventions for cards in this game. Follow this format exactly, including field names, types, and nesting:
${schemaNotes}
</context>

<context>
Here are 10 existing examples of **dominant** cards with all tiers 1-5 fully defined. Use them as inspiration for style, balance, and progression, but do not copy them verbatim:
${JSON.stringify(dominantExamples, null, 2)}
</context>

<instructions>
1. First, determine the card type (trait, dominant, age, catastrophe, trinket, treasure) based on the image provided.
   - If the card contains tiers or specifically acts as a Dominant, choose "dominant". Wait, the physical cards don't have tiers printed, they are just single dominants. If the card has a star/icon indicating dominance, or feels like a powerful "one per player" card, it's dominant.
   - If the card is completely novel and doesn't fit ANY of the 6 schemas above, do NOT hallucinate a new schema. Output a JSON object with {"error": "Unknown card type/mechanic"} and nothing else.

2. If the card is NOT dominant:
   - Generate a single JSON card object using the provided schema.  
   - Accurately capture the effect, costs, conditions, and any other properties implied by the physical card image.  

3. If the card IS a dominant card:
   - You must generate tiers 1 through 5 for this card.  
   - Tier 1 must be a faithful representation of the real card: it should capture what is effectively written on the physical card "word for word" in terms of game effect and strength, translated into the JSON schema. Do not make Tier 1 stronger than the real card.  
   - Tiers 2-5 must be new, progressively stronger variants of the same card.  
     - Use the game rules and the provided examples as inspiration for how power scales from T1 to T5.  
     - Each higher tier should feel clearly stronger or more flexible than the previous one, but still balanced and legal.  
     - Do NOT just rephrase the text; change the actual mechanics to make the card better in a meaningful way.

4. Output format:
   - Output ONLY a single JSON object.  
   - Do NOT wrap the JSON in markdown blocks (like \`\`\`json). Just the raw JSON string.
   - The top-level JSON must be directly parseable by \`JSON.parse(...)\` without modification.
</instructions>
`;

    // Make API Call
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "gpt-4o", // Must use vision-capable model
            messages: [
                {
                    role: "system",
                    content: SYSTEM_PROMPT
                },
                {
                    role: "user",
                    content: [
                        { type: "text", text: userPrompt },
                        { type: "image_url", image_url: { url: base64Image } }
                    ]
                }
            ],
            temperature: 0.2
        })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'Failed to communicate with OpenAI');
    }

    const data = await response.json();
    let choiceContent = data.choices[0].message.content.trim();

    // Sometimes OpenAI insists on markdown code blocks despite instructions
    if (choiceContent.startsWith('```json')) {
        choiceContent = choiceContent.substring(7);
        if (choiceContent.endsWith('```')) {
            choiceContent = choiceContent.substring(0, choiceContent.length - 3);
        }
    } else if (choiceContent.startsWith('```')) {
       choiceContent = choiceContent.substring(3);
       if (choiceContent.endsWith('```')) {
           choiceContent = choiceContent.substring(0, choiceContent.length - 3);
       }
    }

    try {
        const parsed = JSON.parse(choiceContent);
        if (parsed.error) {
            throw new Error(parsed.error);
        }
        // Small validation
        if (!parsed.name) throw new Error("Parsed JSON lacks a 'name' field.");
        if (!parsed.type) throw new Error("Parsed JSON lacks a 'type' field.");
        return parsed;
    } catch (e: any) {
        console.error("Failed to parse OpenAI response: ", choiceContent);
        throw new Error('Failed to parse the card JSON from OpenAI: ' + e.message);
    }
}
