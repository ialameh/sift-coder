---
name: prompt
short_desc: Generate optimized prompts for SiftCoder commands
long_desc: |
  Interactive prompt helper that guides you through crafting effective, detailed prompts
  for any SiftCoder command. Asks targeted questions to understand your intent, then
  generates a production-ready prompt optimized for the selected command.

  Perfect for:
  - New users learning SiftCoder command syntax
  - Crafting complex specifications for build commands
  - Describing issues clearly for fix commands
  - Creating detailed test requirements
  - Writing comprehensive documentation requests

  The prompt helper will:
  1. Ask which SiftCoder command you want to use
  2. Guide you through providing necessary details
  3. Ask clarifying questions to fill gaps
  4. Generate an optimized, ready-to-use prompt
  5. Explain why the prompt is structured this way

usage: |
  /siftcoder:prompt [existing-prompt]

  Or with an existing prompt to improve:
  /siftcoder:prompt improve "<your-existing-prompt>"

examples:
  - Example 1 - Generate a new prompt from scratch:
    /siftcoder:prompt
    # System asks: Which command?
    You: build
    # System asks: What do you want to build?
    You: An e-commerce API
    # System generates: Complete specification prompt

  - Example 2 - Improve an existing prompt:
    /siftcoder:prompt improve "Fix the login bug"
    # System analyzes: Prompt is too vague
    # System asks: What's the bug? Expected behavior? Error messages?
    # System generates: "Fix the login form validation where email format
    # checking is not working correctly. Expected: Should validate email
    # format before submission. Actual: Form submits with invalid emails.
    # Error: No error shown, just accepts invalid email. Context: Using
    # React Hook Form with Zod validation in src/components/Login.tsx"

  - Example 3 - Enhance a prompt with more details:
    /siftcoder:prompt improve "Add tests for user service"
    # System asks: What service? What scenarios? Edge cases?
    # System generates: Comprehensive test prompt with multiple scenarios,
    # edge cases, error conditions, and test types

parameters:
  - existing-prompt (optional) - An existing prompt to improve or enhance

workflow_steps:
  1. Command Selection
     - Choose which SiftCoder command to generate a prompt for
     - System shows available commands with descriptions

  2. Information Gathering
     - System asks targeted questions based on selected command
     - Questions are specific to the command's requirements
     - Asks for all necessary details

  3. Clarification
     - System identifies missing or unclear information
     - Asks follow-up questions to fill gaps
     - Ensures prompt has all required context

  4. Prompt Generation
     - Generates optimized prompt using gathered information
     - Structures prompt according to command best practices
     - Includes all relevant details in proper format

  5. Explanation
     - Explains why the prompt is structured this way
     - Points out key elements included
     - Suggests potential improvements or variations

related_commands:
  - build - Use generated prompts to build projects
  - fix - Use generated prompts to fix issues
  - test - Use generated prompts to generate tests
  - document - Use generated prompts to create documentation
  - improve - Use generated prompts to enhance code

tips:
  - Be as specific as possible when answering questions
  - The more detail you provide, the better the generated prompt
  - Don't worry about perfect grammar - the helper will optimize it
  - You can regenerate prompts with different answers
  - Use the explanation to understand prompt structure for future use

notes: |
  The prompt helper is designed to teach you how to write effective prompts
  while generating immediate results. Over time, you'll learn the patterns
  and can write your own prompts without assistance.

  Generated prompts follow SiftCoder best practices and include all
  information needed for successful command execution.
