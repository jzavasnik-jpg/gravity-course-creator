function buildContextualPrompt(step, userAnswers) {
  const baseInstruction = "You are an expert marketing strategist helping create an Ideal Client Profile. Generate 7-8 realistic, specific, detailed suggestions that sound natural and human. Each suggestion should be 15-25 words long and paint a vivid picture. Return ONLY a JSON array of strings, no other text or formatting.";
  
  // Build context from previous answers
  let context = "CONTEXT from previous answers:\n";
  if (userAnswers?.icpDesire) context += `- Their deepest desire: "${userAnswers.icpDesire}"\n`;
  if (userAnswers?.icpDecision) context += `- Decision they've made: "${userAnswers.icpDecision}"\n`;
  if (userAnswers?.currentProblem) context += `- Current problem/belief: "${userAnswers.currentProblem}"\n`;
  if (userAnswers?.icpDestination) context += `- Ultimate destination: "${userAnswers.icpDestination}"\n`;
  if (userAnswers?.uniqueFramework) context += `- Unique framework: "${userAnswers.uniqueFramework}"\n`;
  
  switch (step) {
    case 1:
      return `${baseInstruction}

Question: What is your ideal client's deepest desire?
Format each suggestion as a complete, vivid sentence starting with "They want to" or "They desire to" or "They crave".
Focus on deep emotional needs like freedom, recognition, security, growth, impact, or fulfillment.
Make them specific to business/entrepreneurship context and paint a picture of their emotional state.

Example format: ["They want to achieve complete financial freedom so they can spend quality time with their family without constant money stress", "They desire to build a meaningful business that creates lasting positive impact while providing personal fulfillment and recognition"]`;

    case 2:
      return `${baseInstruction}

${context}

Question: What key decision have they made or are about to make?
Format each suggestion as a complete, specific sentence starting with "They've decided to" or "They've chosen to" or "They've committed to".
Make the decisions logically connected to their desire and build upon the context above.
Include timeframes, specific actions, and emotional drivers.

Example format: ["They've decided to leave their corporate job within the next 12 months to start their own consulting practice", "They've chosen to invest heavily in their personal brand and online presence to build authority in their niche"]`;

    case 3:
      return `${baseInstruction}

${context}

Question: What is one thing they're currently feeling or believing that is NOT working?
Format each suggestion as "They feel like..." or "They believe that..." 
Focus on current frustrations, limiting beliefs, or obstacles preventing them from reaching their desire.
Build upon the context of their desire and decision above. Make them emotionally resonant and specific.

Example format: ["They feel like they're spinning their wheels with endless to-do lists but not making real progress toward financial freedom", "They believe they lack the technical skills and industry connections needed to succeed in their chosen field"]`;

    case 4:
      return `${baseInstruction}

${context}

Question: What does their ultimate destination or 'after' state look like?
Format each suggestion starting with "They have" or "They've built" or "They work" or "They enjoy".
Paint a vivid picture of their ideal future state - be specific and inspiring.
Build upon all the context above, especially addressing how they've overcome their current problem.

Example format: ["They have a thriving 6-figure business that runs smoothly without their constant involvement, giving them true time freedom", "They work only 25 hours per week while earning more than their previous corporate salary and having complete location independence"]`;

    case 5:
      return `${baseInstruction}

${context}

Question: What is a unique framework or methodology that could help them get there?
Return a JSON array of objects with "name" and "description" properties.
Make the names catchy, memorable, and related to their specific problem and destination. 
Descriptions should be one compelling sentence that connects to their journey from problem to destination.
Build upon all the context above.

Example format: [{"name": "The Freedom Formula", "description": "A step-by-step system for creating multiple passive income streams that work around the clock without constant oversight."}, {"name": "The Authority Accelerator", "description": "A unique framework for rapidly establishing expertise and credibility that attracts high-value clients organically."}]`;

    case 8:
      return `${baseInstruction}

${context}

Question: What specific result can you promise that's faster, easier, or more complete than competitors?
Format each suggestion starting with "They can" or "They will" or "They get".
Focus on speed, ease, or completeness advantages that directly address their journey from problem to destination.
Build upon all the context above, especially their unique framework and destination.
Make the promises specific and compelling.

Example format: ["They can build a profitable business 3x faster than traditional methods using our proven step-by-step system", "They get guaranteed results in 90 days or less with our comprehensive support system and proven framework"]`;

    default:
      return '';
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { step, userId, userAnswers } = req.body;

    // Fixed suggestions for steps 6 & 7
    if (step === 6) {
      return res.status(200).json({
        suggestions: [
          { label: 'Money', description: 'The desire for financial freedom, wealth, and security.' },
          { label: 'Time', description: 'The desire for more freedom, efficiency, and a better work-life balance.' },
          { label: 'Experiences', description: 'The desire for personal growth, adventure, and new challenges.' },
          { label: 'Relationships', description: 'The desire for deeper connections with others, community, or a romantic partner.' }
        ]
      });
    }

    if (step === 7) {
      return res.status(200).json({
        suggestions: [
          { label: 'Significance', description: 'The desire to be seen, heard, and acknowledged as important.' },
          { label: 'Safe', description: 'The desire for security, protection, and stability.' },
          { label: 'Supported', description: 'The desire to feel cared for, understood, and part of a community.' },
          { label: 'Successful', description: 'The desire for accomplishment, achievement, and recognition.' },
          { label: 'Surprise-and-delight', description: 'The desire for novelty, unexpected joy, and excitement.' },
          { label: 'Sharing', description: 'The desire to contribute, give back, and be a positive force in the world.' }
        ]
      });
    }

    // Real AI for other steps
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('Google API key not configured');
    }

    const contextualPrompt = buildContextualPrompt(step, userAnswers);

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: contextualPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('No content generated from Gemini');
    }

    // Parse the JSON response from Gemini
    let suggestions;
    try {
      suggestions = JSON.parse(generatedText);
    } catch (parseError) {
      // If JSON parsing fails, try to extract JSON from the text
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse suggestions from AI response');
      }
    }

    return res.status(200).json({
      suggestions: suggestions || [],
      step: step,
      userId: userId
    });

  } catch (error) {
    console.error('Error generating suggestions:', error);
    return res.status(500).json({ 
      error: 'Failed to generate suggestions',
      details: error.message 
    });
  }
}
