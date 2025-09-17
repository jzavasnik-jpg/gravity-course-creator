export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { step } = req.body;
    const apiKey = process.env.GOOGLE_API_KEY;

    // Test data that works
    const testSuggestions = [
      "They want to achieve financial freedom and escape the corporate grind",
      "They desire to build a meaningful business that creates lasting impact",
      "They crave the flexibility to work from anywhere in the world",
      "They want to become recognized experts in their field",
      "They desire to create generational wealth for their family"
    ];

    return res.status(200).json({
      suggestions: testSuggestions,
      step: step,
      hasApiKey: !!apiKey,
      keyLength: apiKey ? apiKey.length : 0,
      status: 'testing'
    });

  } catch (error) {
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
}
