/**
 * @typedef {'EASY' | 'MEDIUM' | 'HARD'} ProblemDifficulty
 */

/**
 * @typedef {'JAVA' | 'CPP' | 'PYTHON' | 'GO'} ProgrammingLanguage
 */

/**
 * @typedef {Object} ProblemExample
 * @property {string} inputData - Example input
 * @property {string} outputData - Expected output
 * @property {string} explanation - HTML explanation
 * @property {number} orderIndex - Display order
 */

/**
 * @typedef {Object} ProblemTemplate
 * @property {ProgrammingLanguage} language - Programming language
 * @property {string} codeTemplate - Template code for user
 * @property {string} driverCode - Driver code for execution
 */

/**
 * @typedef {Object} CreateProblemRequest
 * @property {string} title - Problem title
 * @property {string} slug - URL-friendly slug
 * @property {string} description - HTML description with images
 * @property {string} constraints - HTML constraints
 * @property {ProblemDifficulty} difficulty - Difficulty level
 * @property {number} timeLimitMs - Time limit in milliseconds
 * @property {number} memoryLimitKb - Memory limit in kilobytes
 * @property {ProblemExample[]} examples - Example test cases
 * @property {string[]} temporaryImageKeys - Temp image object keys to commit
 * @property {ProblemTemplate[]} templates - Code templates
 */

/**
 * @typedef {Object} ProblemResponse
 * @property {string} id - Problem UUID
 * @property {string} title - Problem title
 * @property {string} slug - URL slug
 * @property {ProblemDifficulty} difficulty - Difficulty level
 * @property {string} createdDate - ISO date string
 * @property {string} updatedDate - ISO date string
 */

/**
 * @typedef {Object} ProblemDetails
 * @property {string} id - Problem UUID
 * @property {string} title - Problem title
 * @property {string} slug - URL slug
 * @property {string} description - HTML description
 * @property {string} constraints - HTML constraints
 * @property {ProblemDifficulty} difficulty - Difficulty level
 * @property {number} timeLimitMs - Time limit
 * @property {number} memoryLimitKb - Memory limit
 * @property {string} createdDate - ISO date string
 * @property {string} updatedDate - ISO date string
 * @property {Array<{id: string, language: string}>} templates - Template summaries
 * @property {Array<{id: string, isSample: boolean, isHidden: boolean, orderIndex: number}>} testCases - Test case summaries
 * @property {ProblemExample[]} examples - Examples
 */

/**
 * @typedef {Object} ImageUploadResponse
 * @property {string} objectKey - MinIO object key (e.g. "temp/abc.png")
 * @property {string} url - Presigned URL (valid 2 hours)
 * @property {string} originalFilename - Original filename
 * @property {number} fileSize - File size in bytes
 * @property {string} uploadedAt - ISO date string
 */

export { }
