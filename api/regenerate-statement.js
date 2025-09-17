export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { answers, statementType, userId } = req.body;

    let statement;
    if (statementType === 'solution') {
      statement = generateAlternateSolutionStatement(answers);
    } else {
      statement = generateAlternateUSPStatement(answers);
    }

    return res.status(200).json({
      statement: statement,
      userId: userId
    });

  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to regenerate statement',
      details: error.message 
    });
  }
}

function generateAlternateSolutionStatement(answers) {
  const verbSets = [
    ['amplify', 'automate', 'accelerate'],
    ['discover', 'develop', 'dominate'],
    ['capture', 'convert', 'compound'],
    ['establish', 'elevate', 'excel'],
    ['generate', 'grow', 'guarantee'],
    ['identify', 'implement', 'increase'],
    ['maximize', 'master', 'monetize']
  ];

  const randomVerbSet = verbSets[Math.floor(Math.random() * verbSets.length)];
  const targetAudience = extractTargetAudience(answers);
  const outcome = extractDesiredOutcome(answers);
  const mechanism = answers.uniqueFramework || 'cutting-edge strategies';
  const promise = extractPromise(answers);

  return `I help ${targetAudience} ${randomVerbSet[0]}, ${randomVerbSet[1]}, and ${randomVerbSet[2]} ${outcome} through ${mechanism} that ${promise}.`;
}

function generateAlternateUSPStatement(answers) {
  const newOpportunity = answers.uniqueFramework || generateNewOpportunity(answers);
  const icpDesire = extractCoreDesire(answers);
  const mechanism = answers.uniqueFramework || newOpportunity;

  return `${newOpportunity} is the key to ${icpDesire} and is only attainable through ${mechanism}.`;
}

// Include the same helper functions from the main statements API
function extractTargetAudience(answers) {
  if (answers.icpDesire?.includes('entrepreneur')) return 'ambitious entrepreneurs';
  if (answers.icpDesire?.includes('business owner')) return 'business owners';
  if (answers.icpDesire?.includes('coach')) return 'coaches and consultants';
  return 'driven professionals';
}

function extractDesiredOutcome(answers) {
  if (answers.icpDestination) {
    let outcome = answers.icpDestination.toLowerCase()
      .replace(/^they have /i, '').replace(/^they work /i, '').replace(/^they enjoy /i, '')
      .replace(/^they /i, '').replace(/\.$/, '');
    
    if (outcome.includes('business')) return 'high-converting business systems';
    if (outcome.includes('income')) return 'profitable income streams';
    if (outcome.includes('freedom')) return 'time and location freedom';
    return outcome;
  }
  return 'sustainable business success';
}

function extractCoreDesire(answers) {
  if (answers.icpDesire) {
    return answers.icpDesire.toLowerCase()
      .replace(/^they want to /i, '').replace(/^they desire to /i, '').replace(/^they crave /i, '')
      .replace(/^they /i, '').replace(/\.$/, '');
  }
  return 'achieving their business goals';
}

function extractPromise(answers) {
  if (answers.promisedResult) {
    return answers.promisedResult.toLowerCase()
      .replace(/^they can /i, '').replace(/^they will /i, '').replace(/^they get /i, '')
      .replace(/^they /i, '').replace(/\.$/, '');
  }
  return 'deliver results faster than any other method';
}

function generateNewOpportunity(answers) {
  const opportunities = [
    'The Authority Acceleration Method',
    'The Freedom Framework System', 
    'The Scale Smart Protocol',
    'The Impact Amplifier Strategy'
  ];
  return opportunities[Math.floor(Math.random() * opportunities.length)];
}
