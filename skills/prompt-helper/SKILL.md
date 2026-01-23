# Prompt Helper Skill

## Overview

The Prompt Helper skill is an interactive assistant that guides users through crafting effective, detailed prompts for SiftCoder commands. It acts as a "prompt engineer" that helps users:

1. Select the appropriate SiftCoder command
2. Provide all necessary context and details
3. Structure the information optimally
4. Generate production-ready prompts
5. Understand why the prompt is structured that way

## When to Use

✅ **Perfect for:**
- New users learning SiftCoder
- Complex commands requiring detailed specifications
- Ensuring prompt quality and completeness
- Learning prompt engineering patterns
- Crafting prompts for critical operations

❌ **Not needed for:**
- Simple, straightforward commands
- Experienced users who know prompt patterns
- Quick exploratory commands

## How It Works

### 1. Command Selection
```
You: /siftcoder:prompt

Helper: Which SiftCoder command do you want to generate a prompt for?

Available commands:
• build      - Build new projects from specifications
• fix        - Fix bugs and issues
• test       - Generate tests
• document   - Generate documentation
• improve    - Improve code quality
• refactor   - Refactor code
• debug      - Debug issues
• investigate - Investigate codebase

You: build
```

### 2. Information Gathering
```
Helper: Great choice! Let me ask you some questions about your project.

Question 1: What type of project do you want to build?
(e.g., web app, API, mobile app, microservice)

You: A REST API for task management

Question 2: What are the main features? (list them)

You:
1. User authentication
2. Create, read, update, delete tasks
3. Task categories and tags
4. Due dates and reminders
5. User-specific task lists

Question 3: What tech stack do you prefer? (optional)

You: Node.js, Express, TypeScript, PostgreSQL

Question 4: Any specific requirements or constraints?

You: Need to handle 10,000 concurrent users, include rate limiting
```

### 3. Prompt Generation
```
Helper: Generating your optimized prompt...

# REST API for Task Management Specification

## Requirements
Need to build a REST API for task management that can handle
10,000 concurrent users with rate limiting.

## Features
1. User authentication
2. Create, read, update, delete tasks
3. Task categories and tags
4. Due dates and reminders
5. User-specific task lists

## Tech Stack
Node.js, Express, TypeScript, PostgreSQL

## Implementation Notes
- Include comprehensive tests
- Follow best practices and design patterns
- Add error handling and validation
- Generate API documentation
- Include setup instructions
```

### 4. Explanation
```
Helper: Your prompt is structured for the **build** command.

Why this structure works:

1. Clear project title sets context immediately
2. Requirements define what needs to be built
3. Features list provides implementation scope
4. Tech stack guides implementation choices
5. Implementation notes ensure quality and completeness

Tips for using this prompt:
- Copy the entire prompt as-is
- Run: /siftcoder:build <your-prompt>
- The AI will use all the context you provided
```

## Improve Existing Prompts

You can also use the prompt helper to analyze and improve existing prompts:

### 1. Submit Existing Prompt
```
You: /siftcoder:prompt improve "Fix the login bug"

Helper: Analyzing your prompt...

**Prompt Analysis**

Score: 35/100

**Weaknesses:**
✗ Too short - lacks necessary details
✗ Uses vague pronouns without clear antecedents
✗ Missing specific file locations

**Missing Elements:**
• Error messages or stack traces
• Expected behavior
• Actual behavior
• File paths or specific locations

Let me ask you some questions to improve this prompt...
```

### 2. Answer Clarifying Questions
```
Helper: What error message are you seeing?
You: No error message, just accepts invalid emails

Helper: What did you expect to happen?
You: Should validate email format before submission

Helper: What file contains the login form?
You: src/components/Login.tsx

Helper: What's the full context?
You: Using React Hook Form with Zod validation
```

### 3. Get Improved Prompt
```
Helper: Here's your improved prompt:

# Bug Report

**Issue:**
Fix the login form email validation in src/components/Login.tsx

**Expected Behavior:**
Should validate email format before form submission

**Actual Behavior:**
Form submits with invalid email addresses, no validation occurs

**Context:**
Using React Hook Form with Zod validation schema in src/components/Login.tsx
Email field should match Zod's email regex but validation isn't being applied

**Improvements Made:**
✓ Added clear title and structure
✓ Specified exact file location
✓ Clarified expected vs actual behavior
✓ Included technical context (React Hook Form, Zod)
✓ Removed vague pronouns

Score: 85/100 (up from 35/100)

You: Perfect! Now I can use this with /siftcoder:fix
```

## When to Use Improve Mode

✅ **Use improve mode when:**
- You have a quick/vague prompt that needs more detail
- You're not sure if your prompt is complete
- You want to optimize an existing prompt
- You want to learn what makes a good prompt
- You need to add structure to an unorganized prompt

### Example Transformations

**Before (Vague):**
```
"Make it faster"
```

**After (Improved):**
```
# Code Improvement Request

**Target:**
src/utils/dataProcessor.ts - processLargeDataset function

**Improvement Goals:**
1. Reduce execution time (currently takes 30s for 10K records)
2. Optimize memory usage
3. Add caching where beneficial

**Constraints:**
- Must maintain identical output
- Keep function signature unchanged
- Add tests to verify performance improvement

**Current Performance:**
- Input: 10,000 records
- Time: ~30 seconds
- Memory: Peaks at 2GB
```

**Before (Missing Details):**
```
"Add tests for user service"
```

**After (Improved):**
```
# Test Requirements

**Target:**
src/services/UserService.ts

**Test Scenarios:**
1. User creation with valid data
2. User creation with duplicate email (should fail)
3. User retrieval by ID
4. User retrieval with invalid ID (should handle gracefully)
5. User update with partial data
6. User deletion

**Edge Cases:**
- Null/undefined parameters
- Empty strings
- Invalid email formats
- Non-existent user IDs
- Database connection failures

**Test Types:**
- Unit tests for all methods
- Integration tests with database
- Error handling tests
```

## Command-Specific Questions

### /siftcoder:build
1. What type of project?
2. What are the main features?
3. What tech stack? (optional)
4. Any specific requirements?

### /siftcoder:fix
1. What issue are you experiencing?
2. What did you expect to happen?
3. What actually happened?
4. Any error messages?
5. What context should I know?

### /siftcoder:test
1. What code do you want to test?
2. What type of tests? (unit, integration, e2e)
3. What scenarios should be tested?
4. Any edge cases to focus on?

### /siftcoder:document
1. What do you want to document?
2. Who is the audience?
3. What sections should be included?

### /siftcoder:improve
1. What code do you want to improve?
2. What are your improvement goals?
3. Any constraints?

### /siftcoder:refactor
1. What code needs refactoring?
2. What are the refactoring goals?
3. Any design patterns to apply?

### /siftcoder:debug
1. What error are you seeing?
2. How can this be reproduced?
3. What context is relevant?
4. Any recent changes?

### /siftcoder:investigate
1. What do you want to investigate?
2. Any specific areas to focus on?

## Best Practices

### 1. Be Specific
❌ Bad: "Fix my code"
✅ Good: "Fix the login form validation that's not checking email format correctly"

### 2. Provide Context
❌ Bad: "Add tests"
✅ Good: "Add tests for src/utils/validation.ts, covering all validation functions and edge cases"

### 3. Include Error Messages
❌ Bad: "It's broken"
✅ Good: "Error: TypeError: Cannot read property 'email' of undefined at line 45"

### 4. Describe Expected Behavior
❌ Bad: "Not working"
✅ Good: "Expected: Form validates email format before submission. Actual: Form submits with invalid email"

### 5. Set Clear Goals
❌ Bad: "Improve it"
✅ Good: "Improve rendering performance by reducing re-renders and memoizing expensive calculations"

## Integration with Workflow

The prompt helper fits naturally into the SiftCoder workflow:

1. **Planning Phase**
   - Use prompt helper to craft build specification
   - Generate clear feature requirements

2. **Development Phase**
   - Use prompt helper to describe fix requirements
   - Generate improvement prompts

3. **Testing Phase**
   - Use prompt helper to define test scenarios
   - Generate comprehensive test requirements

4. **Documentation Phase**
   - Use prompt helper to outline documentation needs
   - Generate structured documentation prompts

## Learning Mode

Over time, users will learn prompt patterns by:

1. Seeing the structure of generated prompts
2. Reading the explanations
3. Noticing which details are important
4. Understanding how information is organized

This enables users to eventually write their own prompts without assistance.

## Tips for Success

1. **Answer All Questions**: Even optional questions add valuable context
2. **Be Detailed**: More information leads to better results
3. **Think Aloud**: Share your thought process, not just conclusions
4. **Include Examples**: Screenshots, error messages, sample data
5. **Review Generated Prompt**: Make sure it captures your intent
6. **Save Good Prompts**: Reuse successful prompt patterns

## Common Pitfalls

### Too Vague
❌ "Make it better"
✅ "Improve error handling by adding try-catch blocks and user-friendly error messages"

### Missing Context
❌ "Fix the bug"
✅ "Fix the bug in src/auth/login.ts where the session token isn't being stored in localStorage"

### Contradictory Requirements
❌ "Make it faster but don't change the algorithm"
✅ "Optimize the sorting algorithm while maintaining O(n log n) complexity"

### Unreasonable Scope
❌ "Rewrite the entire codebase"
✅ "Refactor the user authentication module for better maintainability"

## Example Session

```
User: /siftcoder:prompt

Helper: Which command?
User: fix

Helper: What issue are you experiencing?
User: The search feature is returning wrong results

Helper: What did you expect to happen?
User: Should return exact matches first, then partial matches

Helper: What actually happens?
User: Returns results in random order, doesn't prioritize exact matches

Helper: Any error messages?
User: No errors, just wrong behavior

Helper: What context?
User: It's in src/components/SearchBar.tsx, uses a simple array filter
    No backend, all client-side filtering

Helper: [Generates optimized prompt]

You: [Reviews prompt] This looks good!

Helper: Great! Now run:
    /siftcoder:fix <generated-prompt>

    The AI will:
    1. Analyze the search implementation
    2. Fix the sorting logic
    3. Add tests
    4. Verify the fix works
```

## Technical Implementation

The prompt helper uses:

- **Question Templates**: Pre-defined questions for each command
- **Context Gathering**: Interactive dialogue to collect information
- **Prompt Builders**: Command-specific prompt generation functions
- **Explanation Generator**: Explains why prompts are structured certain ways
- **Best Practices**: Ensures generated prompts follow SiftCoder conventions

## Future Enhancements

Potential improvements:

1. **Prompt History**: Save and reuse successful prompts
2. **Prompt Templates**: Quick-start templates for common scenarios
3. **Prompt Analytics**: Track which prompts work best
4. **Collaborative Prompts**: Share prompts with team
5. **Prompt Validation**: Check for common issues before generating
