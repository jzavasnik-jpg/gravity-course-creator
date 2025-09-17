export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { answers, statementType, userId } = req.body;

    const alternativeStatements = {
      solution: [
        `${answers.uniqueFramework || 'Our proven system'} is specifically designed for ${getTargetAudience(answers)} who want to ${getDesirePhrase(answers)} without ${getProblemPhrase(answers)}.`,
        `We help ${getTargetAudience(answers)} transform from ${getProblemPhrase(answers)} to ${getOutcomePhrase(answers)} using our ${answers.uniqueFramework || 'step-by-step methodology'}.`,
        `If you're ${getProblemPhrase(answers)}, our ${answers.uniqueFramework || 'proven framework'} is the fastest path to ${getOutcomePhrase(answers)}.`
      ],
      usp: [
        `What makes us different: while others ${getCompetitorProblem(answers)}, we deliver ${answers.promisedResult || 'real results'} through our exclusive ${answers.uniqueFramework || 'methodology'}.`,
        `The ${answers.uniqueFramework || 'proven system'} advantage: ${answers.promisedResult || 'guaranteed results'} in less time with our ${answers.sixSs || 'unique'} approach.`,
        `Unlike traditional methods that ${getCompetitorProblem(answers)}, our clients ${answers.promisedResult || 'see results fast'} because of our focus on ${answers.fourDesires || 'what truly matters'}.`
      ]
    };

    const randomStatement = alternativeStatements[statementType][
      Math.floor(Math.random() * alternativeStatements[statementType].length)
    ];

    return res.status(200).json({
      statement: randomStatement,
      userId: userId
    });

  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to regenerate statement',
      details: error.message 
    });
  }
}

// Include the same helper functions as above
function getTargetAudience(answers) {
  if (answers.icpDesire?.includes('entrepreneur')) return 'ambitious entrepreneurs';
  if (answers.icpDesire?.includes('business')) return 'business owners';
  if (answers.icpDesire?.includes('freedom')) return 'freedom-seeking professionals';
  return 'motivated individuals';
}

function getProblemPhrase(answers) {
  if (answers.currentProblem) {
    return answers.currentProblem.toLowerCase()
      .replace('they feel like ', '')
      .replace('they believe that ', '')
      .replace('they ', '');
  }
  return 'struggle with common challenges';
}

function getDesirePhrase(answers) {
  if (answers.icpDesire) {
    return answers.icpDesire.toLowerCase()
      .replace('they want to ', '')
      .replace('they desire to ', '')
      .replace('they crave ', '')
      .replace('they ', '');
  }
  return 'achieve their goals';
}

function getOutcomePhrase(answers) {
  if (answers.icpDestination) {
    return answers.icpDestination.toLowerCase()
      .replace('they have ', '')
      .replace('they work ', '')
      .replace('they enjoy ', '')
      .replace('they ', '');
  }
  return 'achieve their goals';
}

function getCompetitorProblem(answers) {
  if (answers.currentProblem) {
    return answers.currentProblem.toLowerCase()
      .replace('they feel like ', 'leave you feeling like ')
      .replace('they believe that ', 'make you believe ')
      .replace('they ', 'leave you ');
  }
  return 'leave you overwhelmed';
}
