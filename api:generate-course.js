// api/generate-course.js
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { answers, statements, avatars, userId } = req.body;

    // Validate required data
    if (!answers || !statements || !avatars) {
      return res.status(400).json({ error: 'Missing required data (answers, statements, or avatars)' });
    }

    // Get API key from environment variable (secure)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Create the comprehensive prompt for course generation
    const prompt = `You are an expert course creator and instructional designer specializing in the Gravity Culture methodology. Create a comprehensive 6-module course based on the provided ICP data, marketing statements, and customer avatars.

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
- Primary Emotion to Elicit: ${answers.sixSs}

COURSE STRUCTURE REQUIREMENTS:

1. COURSE TITLE & DESCRIPTION:
   - Create a compelling course title that reflects the unique framework
   - Write a course description that emphasizes the "new opportunity" concept

2. SIX MODULES (each with 3-5 lessons):
   - Each module should support the core thesis of the USP
   - Address different aspects of dismantling false beliefs
   - Build progressive belief in the new opportunity

3. LESSON STRUCTURE (for each lesson):
   - One Core Concept: The single most crucial understanding for that lesson
   - Origin Story Hook: Engaging narrative that introduces the need for this concept
   - Three Secrets Framework:
     * Secret 1: Addresses false belief about the vehicle/framework itself
     * Secret 2: Addresses false belief about external factors preventing success
     * Secret 3: Addresses false belief about internal factors preventing success
   - Tactics: 2-3 practical implementation tactics
   - Exercise: Hands-on activity to reinforce the lesson

4. EMOTIONAL ALIGNMENT:
   - All content should elicit feelings that align with "${answers.sixSs}"
   - Language and tone should resonate with both ${avatars.male.name} and ${avatars.female.name}

5. BELIEF TRANSFORMATION:
   - Each module should systematically replace old beliefs with new ones
   - Focus on emotional connection first, then logical justification
   - Address the specific pain points identified in the avatar analysis

Generate a complete course that will transform ${avatars.male.name} and ${avatars.female.name} from their current state of "${answers.currentProblem}" to believing they can achieve "${answers.icpDestination}" through "${answers.uniqueFramework}".`;

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
    const courseData = JSON.parse(generatedText);

    // Log for debugging (optional)
    console.log(`Generated course "${courseData.title}" for user ${userId || 'anonymous'} with ${courseData.modules.length} modules`);

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
    console.error('Error generating course:', error);
    return res.status(500).json({ 
      error: `Failed to generate course: ${error.message}` 
    });
  }
}