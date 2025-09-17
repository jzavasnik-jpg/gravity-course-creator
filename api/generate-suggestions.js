export default async function handler(req, res) {
  try {
    // Debug environment variable
    const apiKey = process.env.GOOGLE_API_KEY;
    
    return res.status(200).json({
      hasApiKey: !!apiKey,
      keyLength: apiKey ? apiKey.length : 0,
      keyStart: apiKey ? apiKey.substring(0, 5) : 'none',
      allEnvKeys: Object.keys(process.env).filter(key => key.includes('GOOGLE')),
      step: req.body.step
    });
    
  } catch (error) {
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack
    });
  }
}
