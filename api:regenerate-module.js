// api/regenerate-module.js
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { answers, statements, avatars, moduleIndex, existingCourse, userId } = req.body;

    // Validate required data
    if (!answers || !statements || !avatars || moduleIndex === undefined || !existingCourse) {
      return res.status(400).json({ error: 'Missing required data for module regeneration' });
    }

    // Get API key from environment variable (secure)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Create context about the existing course and specific module to regenerate
    const moduleNumber = moduleIndex + 1;
    const existingModuleTitles = existingCourse.modules.map((m, i) => `Module ${i + 1}: ${m.title}`).join(', ');

    const prompt = `You are an expert course creator specializing in the Gravity Culture methodology. Regenerate Module ${moduleNumber} for an existing course, ensuring it fits seamlessly with the overall course structure while providing fresh content.

EXISTING COURSE CONTEXT:
- Course Title: ${existingCourse.title}
- Course Description: ${existingCourse.description}
- Core Belief Statement: ${existingCourse.coreBeliefStatement}
- Existing Modules: ${existingModuleTitles}

REGENERATION TARGET:
- Module to Regenerate: Module ${moduleNumber}
- Current Title: ${existingCourse.modules[moduleIndex]?.title || 'Unknown'}

ICP FOUNDATION:
- Deepest Desire: ${answers.icpDesire}
- Current Problem: ${answers.currentProblem}
- Ultimate Destination: ${answers.icpDestination}
- Unique Framework: ${answers.uniqueFramework}
- Primary Emotion (Six S's): ${answers.sixSs}

MARKETING STATEMENTS:
- Solution Statement: ${statements.solutionStatement}
- USP Statement: ${statements.uspStatement}

TARGET AVATARS:
- Male Avatar: ${avatars.male.name}
- Female Avatar: ${avatars.female.name}
- Primary Emotion to Elicit: ${answers.sixSs}

REQUIREMENTS:
1. Create a fresh Module ${moduleNumber} that serves the same purpose in the course progression but with new content
2. Ensure it logically fits between the surrounding modules
3. Maintain the Gravity Culture methodology (one core belief, three secrets structure)
4. Include 3-5 lessons following the established lesson structure
5. Focus on belief transformation and emotional alignment with "${answers.sixSs}"

Generate a completely fresh Module ${moduleNumber} that maintains course coherence while providing new insights and approaches.`;

    // Call Google Gemini API
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
              learningObjective: { type: "STRING" },
              lessons: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    title: { type: "STRING" },
                    description: { type: "STRING" },
                    coreConcept: { type: "STRING" },
                    structure: {
                      type: "OBJECT",
                      properties: {
                        originStory: { type: "STRING" },
                        falseBeliefs: {
                          type: "ARRAY",
                          items: { type: "STRING" }
                        },
                        secrets: {
                          type: "ARRAY",
                          items: {
                            type: "OBJECT",
                            properties: {
                              title: { type: "STRING" },
                              description: { type: "STRING" },
                              explanation: { type: "STRING" }
                            }
                          }
                        },
                        tactics: {
                          type: "ARRAY",
                          items: { type: "STRING" }
                        },
                        exercise: { type: "STRING" }
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
    
    // Extract the generated content
    const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      throw new Error('No content generated');
    }

    // Parse the JSON response
    const moduleData = JSON.parse(generatedText);

    // Log for debugging (optional)
    console.log(`Regenerated Module ${moduleNumber} "${moduleData.title}" for user ${userId || 'anonymous'}`);

    return res.status(200).json({ 
      module: moduleData,
      moduleIndex: moduleIndex,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error regenerating module:', error);
    return res.status(500).json({ 
      error: `Failed to regenerate module: ${error.message}` 
    });
  }
}