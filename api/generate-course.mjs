export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { answers, statements, avatars, userId } = req.body;

    if (!answers || !statements || !avatars) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const prompt = `You are an expert course creator specializing in the Gravity Culture methodology. Create a course outline (structure only, no detailed lesson content) based on the provided data.

CORE METHODOLOGY:
The entire course must be designed around ONE CORE BELIEF: that the "new opportunity" (USP) is the key to achieving the desired result, and this opportunity is only attainable through the specific framework provided.

ICP FOUNDATION:
- Deepest Desire: ${answers.icpDesire}
- Current Problem: ${answers.currentProblem}
- Ultimate Destination: ${answers.icpDestination}
- Unique Framework: ${answers.uniqueFramework}
- Primary Emotion (Six S's): ${answers.sixSs}
- Promised Result: ${answers.promisedResult}

MARKETING STATEMENTS:
- Solution Statement: ${statements.solutionStatement}
- USP Statement: ${statements.uspStatement}

TARGET AVATARS:
- Male Avatar: ${avatars.male.name} (${avatars.male.age || 'age unspecified'})
- Female Avatar: ${avatars.female.name} (${avatars.female.age || 'age unspecified'})

REQUIREMENTS:
1. Create a compelling course title that reflects the unique framework
2. Write a course description emphasizing the "new opportunity" concept
3. Create a core belief statement for the entire course
4. Design 6 modules that systematically dismantle false beliefs and build belief in the new opportunity
5. Each module should have 3-5 lesson titles with brief descriptions
6. Focus on the overall structure and learning progression - detailed lesson content will be generated separately

Generate a course outline that will transform ${avatars.male.name} and ${avatars.female.name} from "${answers.currentProblem}" to believing they can achieve "${answers.icpDestination}" through "${answers.uniqueFramework}".

Return as JSON with this structure:
{
  "title": "Course Title",
  "description": "Course description emphasizing new opportunity",
  "coreBeliefStatement": "The one thing students must believe",
  "estimatedHours": "X-Y hours",
  "modules": [
    {
      "title": "Module Title",
      "description": "Module description and purpose",
      "learningObjective": "What belief this module installs",
      "lessons": [
        {
          "title": "Lesson Title",
          "description": "Brief lesson overview",
          "coreConcept": "The one crucial concept this lesson teaches",
          "hasDetailedContent": false
        }
      ]
    }
  ]
}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
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
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING" },
              description: { type: "STRING" },
              coreBeliefStatement: { type: "STRING" },
              estimatedHours: { type: "STRING" },
              modules: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    title: { type: "STRING" },
                    description: { type: "STRING" },
                    learningObjective: { type: "STRING" },
                    lessons: {
                      type: "ARRAY",
                      items: {
                        type: "OBJECT",
                        properties: {
                          title: { type: "STRING" },
                          description: { type: "STRING" },
                          coreConcept: { type: "STRING" },
                          hasDetailedContent: { type: "BOOLEAN" }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        })
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      throw new Error('No content generated');
    }

    const courseData = JSON.parse(generatedText);

    console.log(`Generated course structure "${courseData.title}" for user ${userId || 'anonymous'} with ${courseData.modules.length} modules`);

    return res.status(200).json({ 
      course: courseData,
      timestamp: new Date().toISOString(),
      generatedFor: {
        avatars: [avatars.male.name, avatars.female.name],
        framework: answers.uniqueFramework,
        primaryEmotion: answers.sixSs
      }
    });

  } catch (error) {
    console.error('Error generating course structure:', error);
    return res.status(500).json({ 
      error: `Failed to generate course structure: ${error.message}` 
    });
  }
}
