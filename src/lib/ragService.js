import { base44 } from '@/api/base44Client';

/**
 * RAG Service for the Divine Bratan chatbot.
 * Retrieves relevant passages from the archive and generates grounded answers.
 */

export async function searchArchive(query) {
  // Search book sections for relevant content using keyword matching
  const allSections = await base44.entities.BookSection.list('order_index', 500);
  
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
  
  // Score each section by relevance
  const scored = allSections.map(section => {
    const contentLower = (section.content || '').toLowerCase();
    const titleLower = (section.chapter_title || '').toLowerCase();
    const refLower = (section.verse_reference || '').toLowerCase();
    const bookLower = (section.book_title || '').toLowerCase();
    
    let score = 0;
    for (const word of queryWords) {
      if (contentLower.includes(word)) score += 2;
      if (titleLower.includes(word)) score += 3;
      if (refLower.includes(word)) score += 1;
      if (bookLower.includes(word)) score += 2;
    }
    // Boost for exact phrase match
    if (contentLower.includes(queryLower)) score += 10;
    
    return { section, score };
  });
  
  // Return top relevant passages
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(s => s.section);
}

export async function generateGroundedAnswer(question, retrievedSections) {
  // Build context from retrieved passages
  const passageTexts = retrievedSections.map((s, i) => 
    `[Source ${i + 1}] ${s.book_title || 'Unknown Book'}, ${s.verse_reference || `Ch ${s.chapter_number}`}:\n"${s.content}"`
  ).join('\n\n');

  const hasEvidence = retrievedSections.length > 0;

  const systemPrompt = `You are The Divine Bratan, an archive-grounded religious and spiritual literature guide. You operate under strict rules:

1. ONLY answer using the passages provided below. Do NOT use any knowledge outside these passages.
2. CITE every factual claim with the source number [Source X].
3. If the passages do not contain enough information to answer, respond EXACTLY: "I could not find enough support in the archive to answer that truthfully."
4. Do NOT hallucinate, invent verses, books, prophets, doctrines, translations, or historical facts.
5. Do NOT claim all religions agree unless citations support it.
6. Do NOT make medical, legal, or dangerous claims.
7. Be respectful to all traditions.
8. When comparing traditions, only use what the passages explicitly say.
9. Keep answers concise and clear.

${hasEvidence ? `RETRIEVED PASSAGES:\n${passageTexts}` : 'NO PASSAGES WERE FOUND IN THE ARCHIVE FOR THIS QUERY.'}`;

  const response = await base44.integrations.Core.InvokeLLM({
    prompt: `${systemPrompt}\n\nUser question: ${question}`,
    response_json_schema: {
      type: "object",
      properties: {
        answer: {
          type: "string",
          description: "The direct answer grounded in citations"
        },
        citations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              source_index: { type: "number" },
              book_title: { type: "string" },
              chapter: { type: "string" },
              verse: { type: "string" },
              quote: { type: "string" }
            }
          },
          description: "Exact citations from the passages used"
        },
        confidence: {
          type: "string",
          enum: ["high", "medium", "low", "insufficient"],
          description: "Confidence based on evidence quality"
        }
      }
    }
  });

  return response;
}