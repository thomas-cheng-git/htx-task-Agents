import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function identifySkills(
  title: string,
  availableSkills: { id: number; name: string }[]
): Promise<number[]> {
  try {
    if (!process.env.GEMINI_API_KEY) return [];

    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const skillList = availableSkills.map(s => `${s.id}: ${s.name}`).join(', ');
    const prompt = `You are a task classifier. Given a task title, identify which skills from the provided list are required.

Task title: "${title}"
Available skills: ${skillList}

Return ONLY a JSON array of skill IDs (numbers) that are required for this task. Example: [1, 2]
If no skills match, return [].
Return ONLY the JSON array, nothing else.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Extract JSON array from response
    const match = text.match(/\[[\d,\s]*\]/);
    if (!match) return [];

    const ids: number[] = JSON.parse(match[0]);
    // Validate IDs are in available skills
    const validIds = availableSkills.map(s => s.id);
    return ids.filter(id => validIds.includes(id));
  } catch (error) {
    console.error('Gemini skill identification error:', error);
    return [];
  }
}
