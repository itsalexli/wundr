/**
 * Question Bank Service
 * 
 * Pre-generates questions from learning material to avoid repetition,
 * tracks results to identify weak areas, and supports age-level difficulty.
 */

import { generateQuestion, type Question } from './questionGenerator';

// Age level brackets for difficulty adjustment
export type AgeLevel = '0-1' | '2-3' | '4-5' | '6-7' | '8-9' | '10-11' | '12+';

export const AGE_LEVELS: AgeLevel[] = ['0-1', '2-3', '4-5', '6-7', '8-9', '10-11', '12+'];

export interface QuestionResult {
    question: Question;
    wasCorrect: boolean;
    timestamp: number;
}

export interface QuestionBankState {
    questions: Question[];
    usedIndices: Set<number>;
    results: QuestionResult[];
    ageLevel: AgeLevel;
    learningMaterial: string;
    isGenerating: boolean;
}

// Singleton state for the question bank
let bankState: QuestionBankState = {
    questions: [],
    usedIndices: new Set(),
    results: [],
    ageLevel: '6-7',
    learningMaterial: '',
    isGenerating: false,
};

/**
 * Initialize or reset the question bank with new material
 */
export async function initializeQuestionBank(
    learningMaterial: string,
    ageLevel: AgeLevel,
    questionCount: number = 15
): Promise<void> {
    // If same material and age level, don't regenerate
    if (
        learningMaterial === bankState.learningMaterial &&
        ageLevel === bankState.ageLevel &&
        bankState.questions.length > 0
    ) {
        console.log('Question bank already initialized with this material');
        return;
    }

    console.log(`Initializing question bank with ${questionCount} questions for age level ${ageLevel}`);

    bankState = {
        questions: [],
        usedIndices: new Set(),
        results: [],
        ageLevel,
        learningMaterial,
        isGenerating: true,
    };

    // Generate questions in parallel batches
    const batchSize = 5;
    const batches = Math.ceil(questionCount / batchSize);

    for (let i = 0; i < batches; i++) {
        const batchPromises: Promise<Question>[] = [];
        const remaining = questionCount - bankState.questions.length;
        const currentBatchSize = Math.min(batchSize, remaining);

        for (let j = 0; j < currentBatchSize; j++) {
            batchPromises.push(generateQuestion(learningMaterial, ageLevel));
        }

        const batchResults = await Promise.all(batchPromises);

        // Filter out duplicates (by question text similarity)
        for (const q of batchResults) {
            if (!isDuplicateQuestion(q, bankState.questions)) {
                bankState.questions.push(q);
            }
        }

        console.log(`Generated batch ${i + 1}/${batches}, total questions: ${bankState.questions.length}`);
    }

    bankState.isGenerating = false;
    console.log(`Question bank ready with ${bankState.questions.length} unique questions`);
}

/**
 * Check if a question is a duplicate of existing questions
 */
function isDuplicateQuestion(newQ: Question, existing: Question[]): boolean {
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const newNorm = normalize(newQ.question);

    for (const q of existing) {
        const existingNorm = normalize(q.question);
        // Check for high similarity (80%+ overlap)
        if (similarity(newNorm, existingNorm) > 0.8) {
            return true;
        }
    }
    return false;
}

/**
 * Simple string similarity check (Jaccard-like)
 */
function similarity(a: string, b: string): number {
    if (a === b) return 1;
    if (a.length === 0 || b.length === 0) return 0;

    // Use 3-grams for comparison
    const getGrams = (s: string) => {
        const grams = new Set<string>();
        for (let i = 0; i <= s.length - 3; i++) {
            grams.add(s.slice(i, i + 3));
        }
        return grams;
    };

    const aGrams = getGrams(a);
    const bGrams = getGrams(b);

    let intersection = 0;
    for (const g of aGrams) {
        if (bGrams.has(g)) intersection++;
    }

    const union = aGrams.size + bGrams.size - intersection;
    return intersection / union;
}

/**
 * Get the next question from the bank
 * Prioritizes questions from weak areas (topics user got wrong)
 */
export function getNextQuestion(): Question | null {
    if (bankState.questions.length === 0) {
        console.warn('Question bank is empty');
        return null;
    }

    // Find unused questions
    const unusedIndices: number[] = [];
    for (let i = 0; i < bankState.questions.length; i++) {
        if (!bankState.usedIndices.has(i)) {
            unusedIndices.push(i);
        }
    }

    if (unusedIndices.length === 0) {
        // All questions used, reset the used tracking (but keep results)
        console.log('All questions used, resetting pool');
        bankState.usedIndices.clear();
        return getNextQuestion();
    }

    // Prioritize questions similar to ones user got wrong
    const weakAreas = getWeakAreaKeywords();
    let selectedIndex = unusedIndices[0];

    if (weakAreas.length > 0) {
        // Try to find a question matching weak areas
        for (const idx of unusedIndices) {
            const q = bankState.questions[idx];
            const qText = q.question.toLowerCase();
            if (weakAreas.some(keyword => qText.includes(keyword))) {
                selectedIndex = idx;
                break;
            }
        }
    } else {
        // Random selection if no weak areas identified
        selectedIndex = unusedIndices[Math.floor(Math.random() * unusedIndices.length)];
    }

    bankState.usedIndices.add(selectedIndex);
    return bankState.questions[selectedIndex];
}

/**
 * Record the result of a question attempt
 */
export function recordResult(question: Question, wasCorrect: boolean): void {
    bankState.results.push({
        question,
        wasCorrect,
        timestamp: Date.now(),
    });

    console.log(`Recorded result: ${wasCorrect ? '✓ Correct' : '✗ Incorrect'}`);
}

/**
 * Get keywords from questions the user got wrong
 */
function getWeakAreaKeywords(): string[] {
    const incorrectQuestions = bankState.results
        .filter(r => !r.wasCorrect)
        .map(r => r.question.question.toLowerCase());

    if (incorrectQuestions.length === 0) return [];

    // Extract common nouns/keywords (simple approach)
    const stopWords = new Set(['what', 'which', 'who', 'how', 'when', 'where', 'why', 'the', 'a', 'an', 'is', 'are', 'was', 'were', 'of', 'to', 'in', 'for', 'on', 'with']);
    const wordCounts = new Map<string, number>();

    for (const qText of incorrectQuestions) {
        const words = qText.split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));
        for (const word of words) {
            wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
        }
    }

    // Get top 5 most frequent words from wrong answers
    return Array.from(wordCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word]) => word);
}

/**
 * Get current bank stats (for debugging/display)
 */
export function getQuestionBankStats() {
    return {
        totalQuestions: bankState.questions.length,
        usedQuestions: bankState.usedIndices.size,
        remainingQuestions: bankState.questions.length - bankState.usedIndices.size,
        totalAttempts: bankState.results.length,
        correctCount: bankState.results.filter(r => r.wasCorrect).length,
        incorrectCount: bankState.results.filter(r => !r.wasCorrect).length,
        ageLevel: bankState.ageLevel,
        isGenerating: bankState.isGenerating,
    };
}

/**
 * Check if the bank is ready (has questions and isn't generating)
 */
export function isQuestionBankReady(): boolean {
    return bankState.questions.length > 0 && !bankState.isGenerating;
}

/**
 * Get the current age level setting
 */
export function getCurrentAgeLevel(): AgeLevel {
    return bankState.ageLevel;
}
