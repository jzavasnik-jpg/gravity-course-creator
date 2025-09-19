// pages/api/generate-course.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { answers, statements, avatars, userId } = req.body;

    if (!answers || !statements || !avatars || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const prompt = `You are an expert course creator specializing in the Gravity Culture methodology. Based on the comprehensive ICP research and customer avatars provided, create a detailed course outline.

ICP Research:
- Deepest Desire: "${answers.icpDesire}"
- Key Decision: "${answers.icpDecision}"
- Current Problem: "${answers.currentProblem}"
- Ultimate Destination: "${answers.icpDestination}"
- Unique Framework: "${answers.uniqueFramework}"
- Four Desires Category: "${answers.fourDesires}"
- Primary Six S's Emotion: "${answers.sixSs}"
- Promised Result: "${answers.promisedResult}"

Marketing Statements:
- Solution Statement: "${statements.solutionStatement}"
- USP Statement: "${statements.uspStatement}"

Customer Avatars:
- Male Avatar: ${avatars.male.name}, ${avatars.male.occupation}, ${avatars.male.age}
- Female Avatar: ${avatars.female.name}, ${avatars.female.occupation}, ${avatars.female.age}

Create a comprehensive course structure that addresses their deepest desires and transforms them from their current problem to their ultimate destination.

IMPORTANT: Return ONLY a JSON object with this exact structure, no other text:

{
  "title": "Compelling course title that speaks to their desire",
  "description": "2-3 sentence course description explaining the transformation",
  "coreBeliefStatement": "A powerful belief statement students will adopt",
  "estimatedHours": "X hours of content",
  "modules": [
    {
      "title": "Module 1 title",
      "description": "What this module covers",
      "learningObjective": "What students will achieve",
      "lessons": [
        {
          "title": "Lesson title",
          "description": "What this lesson teaches",
          "coreConcept": "Key concept covered",
          "hasDetailedContent": false
        }
      ]
    }
  ]
}

Create 4-6 modules with 3-5 lessons each. Focus on logical progression from problem to solution. Make titles engaging and benefit-focused. Ensure the course structure addresses the specific pain points and desires identified in the research.`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + process.env.GEMINI_API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH", 
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response from Gemini API');
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    
    // Clean and parse the JSON response
    const cleanedText = generatedText.replace(/```json\n?/, '').replace(/```\n?$/, '').trim();
    
    let course;
    try {
      course = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Generated Text:', generatedText);
      throw new Error('Failed to parse course data');
    }

    // Validate the response structure
    if (!course.title || !course.modules || !Array.isArray(course.modules)) {
      throw new Error('Invalid course data structure');
    }

    console.log(`[${userId}] Course outline generated: ${course.title}`);
    
    return res.status(200).json({ 
      course: course,
      success: true 
    });

  } catch (error) {
    console.error('Error in generate-course:', error);
    return res.status(500).json({ 
      error: 'Failed to generate course',
      details: error.message 
    });
  }
}
