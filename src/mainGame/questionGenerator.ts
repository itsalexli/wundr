/**
 * AI Question Generator Service
 * 
 * Generates quiz questions from learning material using OpenAI.
 * Supports age-level difficulty adjustment.
 */

import type { AgeLevel } from './questionBank';

export interface Question {
    question: string;
    options: string[];
    correctIndex: number;
}

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

/**
 * Get age-appropriate language guidelines for the AI prompt
 */
function getAgeLevelGuidelines(ageLevel: AgeLevel): string {
    const guidelines: Record<AgeLevel, string> = {
        '0-1': `
TODDLER LEVEL (0-1 years):
- Use only the simplest words (1-2 syllables maximum)
- Questions about colors, animals, basic objects
- Example: "What color is a banana?" with options like "Yellow", "Blue"
- All answers should be single words
- Use very concrete, tangible concepts only`,

        '2-3': `
PRESCHOOL LEVEL (2-3 years):
- Simple vocabulary, very short sentences
- Questions about colors, shapes, animals, counting (1-5)
- Example: "How many legs does a dog have?" 
- Answers should be 1-3 words max
- Avoid abstract concepts entirely`,

        '4-5': `
KINDERGARTEN LEVEL (4-5 years):
- Simple but complete sentences
- Questions about nature, family, basic science, counting (1-20)
- Can include simple "why" questions
- Answers can be short phrases
- Begin introducing cause-and-effect`,

        '6-7': `
EARLY ELEMENTARY LEVEL (6-7 years):
- Clear, straightforward language
- Questions testing comprehension and recall
- Can include simple vocabulary from the material
- Answers can be full sentences if needed
- Include questions about sequences and order`,

        '8-9': `
ELEMENTARY LEVEL (8-9 years):
- Grade-appropriate vocabulary
- Questions requiring inference and analysis
- Can test understanding of main ideas
- Include questions about cause and effect
- Answers can be more detailed`,

        '10-11': `
UPPER ELEMENTARY LEVEL (10-11 years):
- More sophisticated vocabulary
- Questions requiring critical thinking
- Test deeper understanding of concepts
- Include application questions
- Can reference specific details from material`,

        '12+': `
MIDDLE SCHOOL+ LEVEL (12+ years):
- Advanced vocabulary appropriate to the subject
- Complex questions requiring synthesis
- Test application of concepts to new situations
- Include analytical and evaluative questions
- Can use subject-specific terminology`
    };

    return guidelines[ageLevel] || guidelines['6-7'];
}

/**
 * Generate a quiz question from learning material
 */
export async function generateQuestion(learningMaterial: string, ageLevel: AgeLevel = '6-7'): Promise<Question> {
    // If no API key, return a fallback question
    if (!OPENAI_API_KEY) {
        console.warn('No OpenAI API key found. Using fallback question.');
        return getFallbackQuestion(ageLevel);
    }

    if (!learningMaterial.trim()) {
        return getFallbackQuestion(ageLevel);
    }

    const ageLevelGuidelines = getAgeLevelGuidelines(ageLevel);

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert educational quiz question generator for children. Your task is to create age-appropriate multiple choice questions from study material.

${ageLevelGuidelines}

Respond ONLY in this exact JSON format (no markdown, no code blocks):
{
  "question": "Your question here?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctIndex": 0
}

CRITICAL RULES:
- correctIndex is 0-3 indicating which option is correct
- Shuffle the correct answer position (don't always put it first)
- STRICTLY follow the age guidelines above
- Make distractors (wrong answers) plausible but clearly incorrect
- Focus on key educational concepts from the material
- Each question should test a DIFFERENT aspect of the material
- Don't generate questions that require external knowledge`
                    },
                    {
                        role: 'user',
                        content: `Generate a unique quiz question for a ${ageLevel} year old based on this study material:\n\n${learningMaterial.slice(0, 2000)}`
                    }
                ],
                temperature: 0.9, // Higher for more variety
                max_tokens: 400,
            }),
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content?.trim();

        // Parse JSON response (handle potential markdown wrapping)
        let jsonContent = content;
        if (content.startsWith('```')) {
            jsonContent = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        }

        const parsed = JSON.parse(jsonContent);

        if (parsed.question && parsed.options && typeof parsed.correctIndex === 'number') {
            const question: Question = {
                question: parsed.question,
                options: parsed.options.slice(0, 4),
                correctIndex: Math.min(Math.max(0, parsed.correctIndex), 3)
            };

            console.log(`Generated question (age ${ageLevel}):`, question.question);
            return question;
        }

        throw new Error('Invalid response format');

    } catch (error) {
        console.error('Question generation failed:', error);
        return getFallbackQuestion(ageLevel);
    }
}

/**
 * Fallback questions when AI is unavailable, organized by age level
 */
function getFallbackQuestion(ageLevel: AgeLevel): Question {
    const fallbacksByAge: Record<AgeLevel, Question[]> = {
        '0-1': [
            { question: "What color is an apple?", options: ["Red", "Blue", "Green", "Yellow"], correctIndex: 0 },
            { question: "What says 'moo'?", options: ["Dog", "Cat", "Cow", "Bird"], correctIndex: 2 },
        ],
        '2-3': [
            { question: "How many fingers do you have on one hand?", options: ["3", "4", "5", "6"], correctIndex: 2 },
            { question: "What shape is a ball?", options: ["Square", "Circle", "Triangle", "Star"], correctIndex: 1 },
        ],
        '4-5': [
            { question: "What do plants need to grow?", options: ["Toys", "Water", "Candy", "TV"], correctIndex: 1 },
            { question: "Which animal has a long neck?", options: ["Dog", "Cat", "Giraffe", "Fish"], correctIndex: 2 },
        ],
        '6-7': [
            { question: "What is 5 + 3?", options: ["6", "7", "8", "9"], correctIndex: 2 },
            { question: "How many days are in a week?", options: ["5", "6", "7", "8"], correctIndex: 2 },
        ],
        '8-9': [
            { question: "What is the largest planet in our solar system?", options: ["Earth", "Mars", "Jupiter", "Saturn"], correctIndex: 2 },
            { question: "What do we call an animal that eats only plants?", options: ["Carnivore", "Herbivore", "Omnivore", "Insectivore"], correctIndex: 1 },
        ],
        '10-11': [
            { question: "What is the process by which plants make their own food?", options: ["Respiration", "Photosynthesis", "Digestion", "Fermentation"], correctIndex: 1 },
            { question: "What fraction is equivalent to 50%?", options: ["1/4", "1/3", "1/2", "2/3"], correctIndex: 2 },
        ],
        '12+': [
            { question: "What is the chemical symbol for Gold?", options: ["Go", "Gd", "Au", "Ag"], correctIndex: 2 },
            { question: "Which type of energy transfer occurs through direct contact?", options: ["Radiation", "Convection", "Conduction", "Evaporation"], correctIndex: 2 },
        ],
    };

    const questions = fallbacksByAge[ageLevel] || fallbacksByAge['6-7'];
    return questions[Math.floor(Math.random() * questions.length)];
}
