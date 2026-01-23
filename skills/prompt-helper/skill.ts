import {
  ToolDefinition,
  MCPTool,
  createMCPToolMetadata,
} from "../../model/ToolDefinition.js"

/**
 * SiftCoder Prompt Helper Skill
 *
 * Interactive prompt generation helper that guides users through crafting
 * effective prompts for SiftCoder commands.
 */

export interface PromptHelperOptions {
  command?: string
  existingPrompt?: string
  context?: Record<string, any>
  improve?: boolean
}

export interface PromptHelperResult {
  success: boolean
  generatedPrompt?: string
  explanation?: string
  questionsAsked?: string[]
  nextSteps?: string[]
  improvements?: string[]
  analysis?: string
  error?: string
}

/**
 * Generate optimized prompt for SiftCoder command
 *
 * This is an interactive helper that:
 * 1. Asks which command to generate a prompt for
 * 2. Guides through providing necessary details
 * 3. Asks clarifying questions
 * 4. Generates optimized prompt
 * 5. Explains the structure
 */
export async function generatePrompt(
  options: PromptHelperOptions = {}
): Promise<PromptHelperResult> {
  try {
    // This will be called interactively by the orchestrator
    // The orchestrator will handle the conversation flow
    return {
      success: true,
      questionsAsked: [
        "Which SiftCoder command do you want to use?",
        "What are you trying to accomplish?",
      ],
      nextSteps: [
        "Answer the questions to provide context",
        "Review the generated prompt",
        "Use the prompt with the selected command",
      ],
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Build prompt for build command
 */
export async function buildBuildPrompt(
  details: Record<string, any>
): Promise<string> {
  const {
    projectType,
    features,
    techStack,
    requirements,
  } = details

  let prompt = `# ${projectType || 'Project'} Specification\n\n`

  if (requirements) {
    prompt += `## Requirements\n${requirements}\n\n`
  }

  if (features) {
    prompt += `## Features\n${Array.isArray(features) ? features.map((f, i) => `${i + 1}. ${f}`).join('\n') : features}\n\n`
  }

  if (techStack) {
    prompt += `## Tech Stack\n${techStack}\n\n`
  }

  prompt += `## Implementation Notes\n`
  prompt += `- Include comprehensive tests\n`
  prompt += `- Follow best practices and design patterns\n`
  prompt += `- Add error handling and validation\n`
  prompt += `- Generate API documentation\n`
  prompt += `- Include setup instructions\n`

  return prompt
}

/**
 * Build prompt for fix command
 */
export async function buildFixPrompt(
  details: Record<string, any>
): Promise<string> {
  const {
    issue,
    expectedBehavior,
    actualBehavior,
    errorMessages,
    context,
  } = details

  let prompt = `Fix the following issue:\n\n`

  prompt += `**Issue:** ${issue || 'Described below'}\n\n`

  if (expectedBehavior) {
    prompt += `**Expected Behavior:**\n${expectedBehavior}\n\n`
  }

  if (actualBehavior) {
    prompt += `**Actual Behavior:**\n${actualBehavior}\n\n`
  }

  if (errorMessages) {
    prompt += `**Error Messages:**\n${errorMessages}\n\n`
  }

  if (context) {
    prompt += `**Context:**\n${context}\n\n`
  }

  prompt += `Please:\n`
  prompt += `1. Analyze the root cause\n`
  prompt += `2. Implement a fix\n`
  prompt += `3. Add tests to prevent regression\n`
  prompt += `4. Verify the fix resolves the issue\n`

  return prompt
}

/**
 * Build prompt for test command
 */
export async function buildTestPrompt(
  details: Record<string, any>
): Promise<string> {
  const {
    target,
    testType,
    scenarios,
    edgeCases,
  } = details

  let prompt = `Generate tests for: ${target || 'code'}\n\n`

  if (testType) {
    prompt += `**Test Type:** ${testType}\n\n`
  }

  if (scenarios) {
    prompt += `**Test Scenarios:**\n${Array.isArray(scenarios) ? scenarios.join('\n') : scenarios}\n\n`
  }

  if (edgeCases) {
    prompt += `**Edge Cases to Cover:**\n${Array.isArray(edgeCases) ? edgeCases.join('\n') : edgeCases}\n\n`
  }

  prompt += `Please include:\n`
  prompt += `- Unit tests for all functions\n`
  prompt += `- Edge case and error condition tests\n`
  prompt += `- Integration tests if applicable\n`
  prompt += `- Clear test descriptions\n`
  prompt += `- Setup and teardown as needed\n`

  return prompt
}

/**
 * Build prompt for document command
 */
export async function buildDocumentPrompt(
  details: Record<string, any>
): Promise<string> {
  const {
    targetType,
    audience,
    includeSections,
  } = details

  let prompt = `Generate documentation for: ${targetType || 'code'}\n\n`

  if (audience) {
    prompt += `**Target Audience:** ${audience}\n\n`
  }

  if (includeSections) {
    prompt += `**Include Sections:**\n${Array.isArray(includeSections) ? includeSections.join(', ') : includeSections}\n\n`
  }

  prompt += `Please provide:\n`
  prompt += `- Clear explanations\n`
  prompt += `- Code examples\n`
  prompt += `- Usage instructions\n`
  prompt += `- Parameter descriptions\n`
  prompt += `- Return value documentation\n`

  return prompt
}

/**
 * Build prompt for improve command
 */
export async function buildImprovePrompt(
  details: Record<string, any>
): Promise<string> {
  const {
    target,
    improvementGoals,
    constraints,
  } = details

  let prompt = `Improve the code in: ${target || 'target'}\n\n`

  if (improvementGoals) {
    prompt += `**Improvement Goals:**\n${Array.isArray(improvementGoals) ? improvementGoals.map((g, i) => `${i + 1}. ${g}`).join('\n') : improvementGoals}\n\n`
  }

  if (constraints) {
    prompt += `**Constraints:**\n${constraints}\n\n`
  }

  prompt += `Focus on:\n`
  prompt += `- Code readability\n`
  prompt += `- Performance optimization\n`
  prompt += `- Best practices\n`
  prompt += `- Type safety\n`
  prompt += `- Error handling\n`
  prompt += `- Add tests for improvements\n`

  return prompt
}

/**
 * Build prompt for refactor command
 */
export async function buildRefactorPrompt(
  details: Record<string, any>
): Promise<string> {
  const {
    target,
    goals,
    patterns,
  } = details

  let prompt = `Refactor: ${target || 'code'}\n\n`

  if (goals) {
    prompt += `**Refactoring Goals:**\n${Array.isArray(goals) ? goals.join(', ') : goals}\n\n`
  }

  if (patterns) {
    prompt += `**Apply Patterns:**\n${Array.isArray(patterns) ? patterns.join(', ') : patterns}\n\n`
  }

  prompt += `Please:\n`
  prompt += `- Improve code structure\n`
  prompt += `- Reduce duplication\n`
  prompt += `- Enhance readability\n`
  prompt += `- Apply design patterns\n`
  prompt += `- Preserve all functionality\n`
  prompt += `- Add tests to verify behavior is preserved\n`

  return prompt
}

/**
 * Build prompt for debug command
 */
export async function buildDebugPrompt(
  details: Record<string, any>
): Promise<string> {
  const {
    error,
    reproductionSteps,
    context,
    recentChanges,
  } = details

  let prompt = `Debug the following issue:\n\n`

  if (error) {
    prompt += `**Error:** ${error}\n\n`
  }

  if (reproductionSteps) {
    prompt += `**Reproduction Steps:**\n${Array.isArray(reproductionSteps) ? reproductionSteps.map((s, i) => `${i + 1}. ${s}`).join('\n') : reproductionSteps}\n\n`
  }

  if (context) {
    prompt += `**Context:**\n${context}\n\n`
  }

  if (recentChanges) {
    prompt += `**Recent Changes:**\n${recentChanges}\n\n`
  }

  prompt += `Please:\n`
  prompt += `1. Analyze the error and stack trace\n`
  prompt += `2. Identify the root cause\n`
  prompt += `3. Explain what's happening\n`
  prompt += `4. Suggest fixes\n`
  prompt += `5. Help prevent similar issues\n`

  return prompt
}

/**
 * Build prompt for investigate command
 */
export async function buildInvestigatePrompt(
  details: Record<string, any>
): Promise<string> {
  const {
    query,
    focusAreas,
  } = details

  let prompt = `Investigate: ${query || 'codebase'}\n\n`

  if (focusAreas) {
    prompt += `**Focus Areas:**\n${Array.isArray(focusAreas) ? focusAreas.join(', ') : focusAreas}\n\n`
  }

  prompt += `Please explore:\n`
  prompt += `- How the code works\n`
  prompt += `- Dependencies and relationships\n`
  prompt += `- Data flow\n`
  prompt += `- Key components and their roles\n`
  prompt += `- Potential issues or improvements\n`
  prompt += `- Read-only analysis, no modifications\n`

  return prompt
}

/**
 * Map command names to their prompt builders
 */
const promptBuilders: Record<string, (details: Record<string, any>) => Promise<string>> = {
  build: buildBuildPrompt,
  fix: buildFixPrompt,
  test: buildTestPrompt,
  document: buildDocumentPrompt,
  improve: buildImprovePrompt,
  refactor: buildRefactorPrompt,
  debug: buildDebugPrompt,
  investigate: buildInvestigatePrompt,
}

/**
 * Get list of supported commands
 */
export function getSupportedCommands(): Array<{name: string, description: string}> {
  return [
    { name: "build", description: "Build new projects from specifications" },
    { name: "fix", description: "Fix bugs and issues" },
    { name: "test", description: "Generate tests" },
    { name: "document", description: "Generate documentation" },
    { name: "improve", description: "Improve code quality" },
    { name: "refactor", description: "Refactor code" },
    { name: "debug", description: "Debug issues" },
    { name: "investigate", description: "Investigate codebase" },
  ]
}

/**
 * Get questions for a specific command
 */
export function getQuestionsForCommand(command: string): string[] {
  const questions: Record<string, string[]> = {
    build: [
      "What type of project do you want to build? (e.g., web app, API, mobile app)",
      "What are the main features? (list them)",
      "What tech stack do you prefer? (optional)",
      "Are there any specific requirements or constraints?",
    ],
    fix: [
      "What issue are you experiencing?",
      "What did you expect to happen?",
      "What actually happened?",
      "Are there any error messages? (paste them)",
      "What context should I know about?",
    ],
    test: [
      "What code do you want to test? (file, function, component)",
      "What type of tests? (unit, integration, e2e)",
      "What scenarios should be tested?",
      "Any edge cases to focus on?",
    ],
    document: [
      "What do you want to document? (code, API, feature)",
      "Who is the audience? (developers, users, mixed)",
      "What sections should be included?",
    ],
    improve: [
      "What code do you want to improve? (file, directory, component)",
      "What are your improvement goals? (performance, readability, maintainability)",
      "Any constraints I should know about?",
    ],
    refactor: [
      "What code needs refactoring? (file, function, component)",
      "What are the refactoring goals?",
      "Any design patterns to apply?",
    ],
    debug: [
      "What error are you seeing? (paste error message)",
      "How can this be reproduced?",
      "What context is relevant?",
      "Any recent changes that might be related?",
    ],
    investigate: [
      "What do you want to investigate or understand?",
      "Any specific areas to focus on?",
    ],
  }

  return questions[command] || [
    "What are you trying to accomplish?",
    "What context should I know?",
    "Any specific requirements?",
  ]
}

/**
 * Generate explanation for a prompt
 */
export function explainPrompt(command: string, details: Record<string, any>): string {
  let explanation = `Your prompt is structured for the **${command}** command.\n\n`

  explanation += `**Why this structure works:**\n\n`

  const reasons: Record<string, string[]> = {
    build: [
      "Clear project title sets context immediately",
      "Requirements define what needs to be built",
      "Features list provides implementation scope",
      "Tech stack guides implementation choices",
      "Implementation notes ensure quality and completeness",
    ],
    fix: [
      "Clear issue statement focuses the fix",
      "Expected vs actual behavior helps identify the gap",
      "Error messages provide technical details",
      "Context prevents similar issues",
      "Step-by-step approach ensures comprehensive fix",
    ],
    test: [
      "Clear target identifies what to test",
      "Test type determines test strategy",
      "Scenarios define test coverage",
      "Edge cases ensure robust testing",
      "Specific requirements guide test generation",
    ],
    document: [
      "Clear target defines documentation scope",
      "Audience determines tone and depth",
      "Sections ensure completeness",
      "Specific requirements guide documentation style",
    ],
    improve: [
      "Clear target focuses improvements",
      "Goals drive improvement strategy",
      "Constraints prevent over-engineering",
      "Specific areas guide optimization",
    ],
    refactor: [
      "Clear target identifies refactoring scope",
      "Goals drive refactoring strategy",
      "Patterns ensure consistency",
      "Preservation requirement maintains functionality",
    ],
    debug: [
      "Error statement provides technical details",
      "Reproduction steps enable diagnosis",
      "Context provides relevant background",
      "Recent changes help identify root cause",
    ],
    investigate: [
      "Clear query focuses investigation",
      "Focus areas guide exploration",
      "Read-only requirement ensures safety",
    ],
  }

  const commandReasons = reasons[command] || [
    "Structured information ensures clarity",
    "Specific details enable better results",
    "Clear context prevents misunderstandings",
  ]

  explanation += commandReasons.map((r, i) => `${i + 1}. ${r}`).join('\n')

  explanation += `\n\n**Tips for using this prompt:**\n\n`
  explanation += `- Copy the entire prompt as-is\n`
  explanation += `- Run: /siftcoder:${command} <your-prompt>\n`
  explanation += `- The AI will use all the context you provided\n`

  return explanation
}

/**
 * Analyze an existing prompt for weaknesses
 */
export function analyzePrompt(prompt: string): {
  score: number
  weaknesses: string[]
  strengths: string[]
  missingElements: string[]
  command: string | null
} {
  const weaknesses: string[] = []
  const strengths: string[] = []
  const missingElements: string[] = []
  let score = 50
  let detectedCommand: string | null = null

  // Detect command
  const commandPatterns: Record<string, RegExp> = {
    build: /build|create|generate|project|application|spec/i,
    fix: /fix|bug|error|issue|broken|not working/i,
    test: /test|spec|coverage|unit test|integration/i,
    document: /document|doc|api reference|guide|readme/i,
    improve: /improve|optimize|enhance|better|refactor/i,
    refactor: /refactor|restructure|reorganize/i,
    debug: /debug|investigate|analyze|diagnose/i,
  }

  for (const [cmd, pattern] of Object.entries(commandPatterns)) {
    if (pattern.test(prompt)) {
      detectedCommand = cmd
      break
    }
  }

  if (!detectedCommand) {
    weaknesses.push("No clear command or intent detected")
    score -= 20
  } else {
    strengths.push(`Clear intent: ${detectedCommand} command`)
    score += 10
  }

  // Check length
  const wordCount = prompt.split(/\s+/).length
  if (wordCount < 10) {
    weaknesses.push("Too short - lacks necessary details")
    score -= 20
  } else if (wordCount > 50) {
    strengths.push("Good length - provides substantial context")
    score += 10
  }

  // Check for specific elements based on detected command
  if (detectedCommand === 'fix') {
    if (!/error|exception|stack trace/i.test(prompt)) {
      missingElements.push("Error messages or stack traces")
      score -= 15
    }
    if (!/expect|should|expected/i.test(prompt)) {
      missingElements.push("Expected behavior")
      score -= 10
    }
    if (!/actually|happening|current|instead/i.test(prompt)) {
      missingElements.push("Actual behavior")
      score -= 10
    }
    if (/error|exception/i.test(prompt)) {
      strengths.push("Includes error information")
      score += 10
    }
  }

  if (detectedCommand === 'build') {
    if (!/feature|functionality|requirement/i.test(prompt)) {
      missingElements.push("Feature list or requirements")
      score -= 20
    }
    if (!/stack|technology|framework|language/i.test(prompt)) {
      missingElements.push("Tech stack (optional but helpful)")
      score -= 5
    }
    if (/feature|requirement/i.test(prompt)) {
      strengths.push("Includes feature requirements")
      score += 15
    }
  }

  if (detectedCommand === 'test') {
    if (!/scenario|case|test|what/i.test(prompt)) {
      missingElements.push("Test scenarios or what to test")
      score -= 20
    }
    if (!/edge|boundary|corner case/i.test(prompt)) {
      missingElements.push("Edge cases (improves test quality)")
      score -= 10
    }
    if (/scenario|test case/i.test(prompt)) {
      strengths.push("Includes test scenarios")
      score += 15
    }
  }

  if (detectedCommand === 'document') {
    if (!/api|endpoint|function|class|module/i.test(prompt)) {
      missingElements.push("Target of documentation")
      score -= 15
    }
    if (!/audience|user|developer/i.test(prompt)) {
      missingElements.push("Target audience (helps determine depth)")
      score -= 10
    }
  }

  // Check for specificity
  if (/it|this|that|the thing/i.test(prompt)) {
    weaknesses.push("Uses vague pronouns without clear antecedents")
    score -= 15
  }

  // Check for context
  if (!/src\/|file|component|function|class|line|at/i.test(prompt)) {
    missingElements.push("File paths or specific locations")
    score -= 10
  } else {
    strengths.push("Includes specific locations or files")
    score += 10
  }

  // Ensure score is in range
  score = Math.max(0, Math.min(100, score))

  return {
    score,
    weaknesses,
    strengths,
    missingElements,
    command: detectedCommand,
  }
}

/**
 * Improve an existing prompt
 */
export async function improvePrompt(
  existingPrompt: string,
  additionalContext?: Record<string, any>
): Promise<{
  improved: string
  analysis: string
  improvements: string[]
  questions: string[]
}> {
  const analysis = analyzePrompt(existingPrompt)
  const improvements: string[] = []
  const questions: string[] = []

  // Build analysis text
  let analysisText = `**Prompt Analysis**\n\n`
  analysisText += `Score: ${analysis.score}/100\n\n`

  if (analysis.strengths.length > 0) {
    analysisText += `**Strengths:**\n${analysis.strengths.map(s => `✓ ${s}`).join('\n')}\n\n`
  }

  if (analysis.weaknesses.length > 0) {
    analysisText += `**Weaknesses:**\n${analysis.weaknesses.map(w => `✗ ${w}`).join('\n')}\n\n`
    improvements.push(...analysis.weaknesses)
  }

  if (analysis.missingElements.length > 0) {
    analysisText += `**Missing Elements:**\n${analysis.missingElements.map(m => `• ${m}`).join('\n')}\n\n`
    questions.push(...analysis.missingElements.map(m => `Can you provide: ${m}?`))
  }

  // Generate questions based on missing elements
  if (analysis.command === 'fix') {
    if (analysis.missingElements.includes('Error messages or stack traces')) {
      questions.push("What error message are you seeing?")
      questions.push("Can you copy the exact error?")
    }
    if (analysis.missingElements.includes('Expected behavior')) {
      questions.push("What did you expect to happen?")
    }
    if (analysis.missingElements.includes('Actual behavior')) {
      questions.push("What actually happened instead?")
    }
  }

  if (analysis.command === 'build') {
    if (analysis.missingElements.includes('Feature list or requirements')) {
      questions.push("What are the main features you need?")
      questions.push("Can you list the requirements?")
    }
    if (analysis.missingElements.includes('Tech stack (optional but helpful)')) {
      questions.push("What tech stack do you prefer? (optional)")
    }
  }

  if (analysis.command === 'test') {
    if (analysis.missingElements.includes('Test scenarios or what to test')) {
      questions.push("What code should be tested?")
      questions.push("What scenarios should be covered?")
    }
    if (analysis.missingElements.includes('Edge cases (improves test quality)')) {
      questions.push("Any edge cases to test?")
      questions.push("What boundary conditions exist?")
    }
  }

  // Generate improved prompt version
  let improved = existingPrompt

  // Add structure if missing
  if (!/^#+\s/i.test(existingPrompt) && analysis.command) {
    const titles: Record<string, string> = {
      build: '# Project Specification',
      fix: '# Bug Report',
      test: '# Test Requirements',
      document: '# Documentation Request',
      improve: '# Code Improvement Request',
      refactor: '# Refactoring Request',
      debug: '# Debug Request',
    }
    improved = `${titles[analysis.command] || '# Request'}\n\n${improved}`
    improvements.push('Added clear title/heading')
  }

  // Organize into sections if not already
  if (!/\*\*[^*]+\*\*/.test(existingPrompt)) {
    if (analysis.command === 'fix') {
      improved = restructureFixPrompt(improved)
      improvements.push('Organized into clear sections')
    } else if (analysis.command === 'build') {
      improved = restructureBuildPrompt(improved)
      improvements.push('Organized into structured sections')
    }
  }

  // Add specific call-to-action if missing
  if (!/please|can you|should/i.test(existingPrompt)) {
    improved += '\n\nPlease:\n'
    if (analysis.command === 'fix') {
      improved += '- Analyze the root cause\n- Implement a fix\n- Add tests\n- Verify the solution\n'
      improvements.push('Added clear action items')
    } else if (analysis.command === 'build') {
      improved += '- Include comprehensive tests\n- Follow best practices\n- Add documentation\n- Ensure quality\n'
      improvements.push('Added quality requirements')
    }
  }

  return {
    improved,
    analysis: analysisText,
    improvements,
    questions,
  }
}

/**
 * Restructure a fix prompt into proper sections
 */
function restructureFixPrompt(prompt: string): string {
  const lines = prompt.split('\n').filter(l => l.trim())

  // Check if already has sections
  if (lines.some(l => /^\*\*(?:Issue|Error|Expected|Actual|Context)\):\*\*/i.test(l))) {
    return prompt
  }

  // Try to extract information
  let issue = ''
  let error = ''
  let expected = ''
  let actual = ''
  let context = ''

  for (const line of lines) {
    if (/error|exception|bug|issue|problem/i.test(line) && !issue) {
      issue = line
    } else if (/expect|should|should've/i.test(line) && !expected) {
      expected = line
    } else if (/actually|happen instead|instead/i.test(line) && !actual) {
      actual = line
    } else if (/src\/|file|component|function/i.test(line) && !context) {
      context = line
    }
  }

  let restructured = '**Issue:**\n'
  restructured += issue || lines.slice(0, Math.ceil(lines.length / 2)).join('\n')
  restructured += '\n\n'

  if (expected) {
    restructured += '**Expected Behavior:**\n'
    restructured += expected + '\n\n'
  }

  if (actual) {
    restructured += '**Actual Behavior:**\n'
    restructured += actual + '\n\n'
  }

  if (context) {
    restructured += '**Context:**\n'
    restructured += context + '\n\n'
  }

  return restructured
}

/**
 * Restructure a build prompt into proper sections
 */
function restructureBuildPrompt(prompt: string): string {
  const lines = prompt.split('\n').filter(l => l.trim())

  // Check if already has sections
  if (lines.some(l => /^\*\*(?:Requirements|Features|Tech Stack|Notes)\):\*\*/i.test(l))) {
    return prompt
  }

  // Simple restructuring
  let restructured = '**Requirements:**\n'
  restructured += lines.join('\n')
  restructured += '\n\n'

  restructured += '**Features:**\n'
  restructured += '• (Please specify main features)\n\n'

  restructured += '**Implementation Notes:**\n'
  restructured += '• Include comprehensive tests\n'
  restructured += '• Follow best practices\n'
  restructured += '• Add documentation\n'

  return restructured
}

// Export the skill as MCP tool metadata
export const promptHelperTool: MCPTool = {
  name: "prompt_helper",
  description: "Interactive prompt generation helper for SiftCoder commands",
  inputSchema: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "The SiftCoder command to generate a prompt for",
      },
      details: {
        type: "object",
        description: "Details provided by the user through interactive questioning",
      },
    },
  },
}

export const toolMetadata = createMCPToolMetadata(promptHelperTool)
