export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { answers, userId } = req.body;

    const solutionStatement = generateSolutionStatement(answers);
    const uspStatement = generateUSPStatement(answers);

    return res.status(200).json({
      statements: {
        solutionStatement: solutionStatement,
        uspStatement: uspStatement
      },
      userId: userId
    });

  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to generate statements',
      details: error.message 
    });
  }
}

function generateSolutionStatement(answers) {
  // Generate three-verb alliteration solution statements
  const verbSets = [
    ['conceive', 'create', 'convert'],
    ['build', 'boost', 'breakthrough'],
    ['design', 'develop', 'deliver'],
    ['plan', 'produce', 'profit'],
    ['scale', 'streamline', 'succeed'],
    ['attract', 'acquire', 'accelerate'],
    ['master', 'monetize', 'multiply'],
    ['launch', 'leverage', 'lead'],
    ['optimize', 'organize', 'operate'],
    ['transform', 'target', 'thrive']
  ];

  const randomVerbSet = verbSets[Math.floor(Math.random() * verbSets.length)];
  const targetAudience = extractTargetAudience(answers);
  const outcome = extractDesiredOutcome(answers);
  const mechanism = answers.uniqueFramework || 'proven strategies';
  const promise = extractPromise(answers);

  const templates = [
    `I help ${targetAudience} ${randomVerbSet[0]}, ${randomVerbSet[1]}, and ${randomVerbSet[2]} ${outcome} using ${mechanism} that ${promise}.`,
    
    `I enable ${targetAudience} to ${randomVerbSet[0]}, ${randomVerbSet[1]}, and ${randomVerbSet[2]} their way to ${outcome} through ${mechanism} that ${promise}.`,
    
    `I guide ${targetAudience} to ${randomVerbSet[0]}, ${randomVerbSet[1]}, and ${randomVerbSet[2]} ${outcome} with ${mechanism} that ${promise}.`
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

function generateUSPStatement(answers) {
  // Format: "[The new opportunity] is the key to [ICP desire] and is only attainable through [the unique new mechanism name]"
  
  const newOpportunity = answers.uniqueFramework || generateNewOpportunity(answers);
  const icpDesire = extractCoreDesire(answers);
  const mechanism = answers.uniqueFramework || newOpportunity;

  return `${newOpportunity} is the key to ${icpDesire} and is only attainable through ${mechanism}.`;
}

function extractTargetAudience(answers) {
  if (answers.icpDesire?.includes('entrepreneur')) return 'ambitious entrepreneurs';
  if (answers.icpDesire?.includes('business owner')) return 'business owners';
  if (answers.icpDesire?.includes('coach')) return 'coaches and consultants';
  if (answers.icpDesire?.includes('corporate')) return 'corporate professionals';
  if (answers.icpDesire?.includes('freelancer')) return 'freelancers and solopreneurs';
  return 'driven professionals';
}

function extractDesiredOutcome(answers) {
  if (answers.icpDestination) {
    let outcome = answers.icpDestination.toLowerCase()
      .replace(/^they have /i, '')
      .replace(/^they work /i, '')
      .replace(/^they enjoy /i, '')
      .replace(/^they /i, '')
      .replace(/\.$/, '');
    
    // Convert to actionable outcome format
    if (outcome.includes('business')) return 'high-converting business systems';
    if (outcome.includes('income') || outcome.includes('revenue')) return 'profitable income streams';
    if (outcome.includes('freedom') || outcome.includes('time')) return 'time and location freedom';
    if (outcome.includes('authority') || outcome.includes('expert')) return 'industry authority and influence';
    
    return outcome;
  }
  return 'sustainable business success';
}

function extractCoreDesire(answers) {
  if (answers.icpDesire) {
    let desire = answers.icpDesire.toLowerCase()
      .replace(/^they want to /i, '')
      .replace(/^they desire to /i, '')
      .replace(/^they crave /i, '')
      .replace(/^they /i, '')
      .replace(/\.$/, '');
    
    return desire;
  }
  return 'achieving their business goals';
}

function extractPromise(answers) {
  if (answers.promisedResult) {
    let promise = answers.promisedResult.toLowerCase()
      .replace(/^they can /i, '')
      .replace(/^they will /i, '')
      .replace(/^they get /i, '')
      .replace(/^they /i, '')
      .replace(/\.$/, '');
    
    return promise;
  }
  return 'deliver results faster than any other method';
}

function generateNewOpportunity(answers) {
  const opportunities = [
    'The Authority Acceleration Method',
    'The Freedom Framework System',
    'The Scale Smart Protocol',
    'The Impact Amplifier Strategy',
    'The Revenue Optimization Blueprint',
    'The Expert Positioning System',
    'The Growth Catalyst Framework',
    'The Success Multiplication Method'
  ];
  
  return opportunities[Math.floor(Math.random() * opportunities.length)];
}
