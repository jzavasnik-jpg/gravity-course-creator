// pages/api/generate-lesson.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { answers, statements, avatars, courseData, moduleIndex, lessonIndex, userId } = req.body;

    if (!answers || !statements || !avatars || !courseData || moduleIndex === undefined || lessonIndex === undefined || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const module = courseData.modules[moduleIndex];
    const lesson = module.lessons[lessonIndex];

    const prompt = `You are an expert course creator specializing in the Gravity Culture methodology. Create detailed lesson content using the proven framework structure.

Course Context:
- Course: "${courseData.title}"
- Module: "${module.title}"
- Lesson: "${lesson.title}"
- Lesson Description: "${lesson.description}"
- Core Concept: "${lesson.coreConcept}"

ICP Research:
- Deepest Desire: "${answers.icpDesire}"
- Current Problem: "${answers.currentProblem}"
- Ultimate Destination: "${answers.icpDestination}"
- Unique Framework: "${answers.uniqueFramework}"
- Primary Six S's Emotion: "${answers.sixSs}"

Customer Avatar Pain Points:
- Male (${avatars.male.name}): Struggles with significance, safety, support issues
- Female (${avatars.female.name}): Faces similar emotional challenges in their context

Using the Gravity Culture methodology, create detailed lesson content with this structure:

IMPORTANT: Return ONLY a JSON object with this exact structure, no other text:

{
  "title": "${lesson.title}",
  "description": "${lesson.description}",
  "coreConcept": "${lesson.coreConcept}",
  "hasDetailedContent": true,
  "structure": {
    "originStory": "A compelling personal story hook that relates to the lesson topic and creates emotional connection",
    "falseBeliefs": [
      "False belief #1 that students currently hold",
      "False belief #2 that blocks their progress",
      "False belief #3 that needs to be addressed"
    ],
    "secrets": [
      {
        "title": "Secret #1 Title",
        "description": "Brief description of what this secret reveals",
        "explanation": "Detailed explanation of the secret and why it works"
      },
      {
        "title": "Secret #2 Title", 
        "description": "Brief description of what this secret reveals",
        "explanation": "Detailed explanation of the secret and why it works"
      },
      {
        "title": "Secret #3 Title",
        "description": "Brief description of what this secret reveals", 
        "explanation": "Detailed explanation of the secret and why it works"
      }
    ],
    "tactics": [
      "Specific actionable tactic #1 students can implement immediately",
      "Specific actionable tactic #2 with clear steps",
      "Specific actionable tactic #3 that builds on the secrets"
    ],
    "exercise": "A practical exercise or assignment that helps students apply the lesson content to their specific situation"
  }
}

Make the origin story personal and relatable. Address false beliefs that prevent progress. Create three secrets that provide genuine insight. Include practical tactics they can implement. Design an exercise that creates real transformation.`;

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
          temperature: 0.8,
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
    
    let lessonContent;
    try {
      lessonContent = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Generated Text:', generatedText);
      throw new Error('Failed to parse lesson data');
    }

    // Validate the response structure
    if (!lessonContent.structure || !lessonContent.structure.secrets || !Array.isArray(lessonContent.structure.secrets)) {
      throw new Error('Invalid lesson data structure');
    }

    console.log(`[${userId}] Detailed lesson content generated: ${lessonContent.title}`);
    
    return res.status(200).json({ 
      lesson: lessonContent,
      success: true 
    });

  } catch (error) {
    console.error('Error in generate-lesson:', error);
    return res.status(500).json({ 
      error: 'Failed to generate lesson',
      details: error.message 
    });
  }
}
