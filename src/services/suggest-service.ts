/**
 * Suggest Service
 *
 * Analyzes user requests and suggests appropriate SiftCoder commands.
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { glob } from 'glob';

export interface CommandMatch {
  command: string;
  name: string;
  description: string;
  confidence: number;
  reason: string;
  category?: string;
  arguments?: string[];
}

export interface SuggestionResult {
  primary: CommandMatch;
  alternatives: CommandMatch[];
  userIntent: string;
  keywords: string[];
}

export class SuggestService {
  private commandsDir: string;
  private commandCache: Map<string, any> = new Map();

  constructor(rootPath?: string) {
    this.commandsDir = rootPath || process.cwd();
  }

  /**
   * Load all command definitions
   */
  private async loadCommands(): Promise<Map<string, any>> {
    if (this.commandCache.size > 0) {
      return this.commandCache;
    }

    const commandFiles = await glob('*.md', { cwd: join(this.commandsDir, 'commands') });

    for (const file of commandFiles) {
      const content = await readFile(join(this.commandsDir, 'commands', file), 'utf-8');
      // Extract command name from filename (remove .md)
      const commandName = file.replace('.md', '');
      this.commandCache.set(commandName, {
        name: commandName,
        content
      });
    }

    return this.commandCache;
  }

  /**
   * Analyze user request and suggest commands
   */
  async suggestRequest(userRequest: string, context?: {
    currentFile?: string;
    projectType?: string;
    recentCommands?: string[];
  }): Promise<SuggestionResult> {
    const commands = await this.loadCommands();
    const matches: CommandMatch[] = [];

    // Analyze the request
    const analysis = this.analyzeRequest(userRequest, context);

    // Score each command
    for (const [cmdName, cmdData] of commands) {
      const score = this.scoreCommand(cmdName, cmdData, analysis, context);
      if (score.confidence > 0) {
        matches.push(score);
      }
    }

    // Sort by confidence
    matches.sort((a, b) => b.confidence - a.confidence);

    return {
      primary: matches[0] || this.getDefaultSuggestion(),
      alternatives: matches.slice(1, 4),
      userIntent: analysis.intent,
      keywords: analysis.keywords
    };
  }

  /**
   * Analyze the user's request
   */
  private analyzeRequest(request: string, context?: any): {
    intent: string;
    keywords: string[];
    categories: string[];
    urgency: 'low' | 'medium' | 'high';
  } {
    const lowerRequest = request.toLowerCase();

    // Extract keywords
    const keywords = this.extractKeywords(request);

    // Determine intent
    const intent = this.determineIntent(lowerRequest, keywords, context);

    return {
      intent,
      keywords,
      categories: [],
      urgency: 'low'
    };
  }

  /**
   * Extract keywords from request
   */
  private extractKeywords(request: string): string[] {
    const patterns = {
      // Actions
      action: ['add', 'create', 'build', 'generate', 'implement', 'write', 'develop', 'new'],
      fix: ['fix', 'debug', 'resolve', 'repair', 'correct', 'solve', 'issue', 'bug', 'error'],
      refactor: ['refactor', 'improve', 'clean', 'optimize', 'restructure', 'reorganize'],
      document: ['document', 'docs', 'readme', 'explain', 'guide', 'manual'],
      test: ['test', 'testing', 'spec', 'tdd', 'coverage'],
      understand: ['understand', 'learn', 'explain', 'how', 'what', 'why', 'how does'],
      review: ['review', 'check', 'audit', 'analyze', 'inspect'],

      // Domains
      auth: ['auth', 'login', 'user', 'authentication', 'security', 'password'],
      api: ['api', 'endpoint', 'route', 'controller', 'backend', 'server'],
      ui: ['ui', 'interface', 'frontend', 'component', 'view', 'page', 'screen'],
      data: ['data', 'database', 'model', 'schema', 'migration', 'query'],
      deployment: ['deploy', 'deploy', 'ci/cd', 'release', 'publish', 'ship'],
      performance: ['slow', 'performance', 'optimize', 'speed', 'fast', 'latency'],
      security: ['security', 'vulnerability', 'hack', 'exploit', 'secure'],

      // Salesforce-specific
      salesforce: ['salesforce', 'sf', 'apex', 'visualforce', 'lwc', 'lightning'],
      apex: ['apex', 'trigger', 'class', 'controller', 'soql'],
      lwc: ['lwc', 'lightning', 'component', 'wire', 'service'],
      integrations: ['integration', 'api', 'rest', 'callout']
    };

    const found: string[] = [];
    const lowerRequest = request.toLowerCase();

    for (const [category, words] of Object.entries(patterns)) {
      for (const word of words) {
        if (lowerRequest.includes(word)) {
          found.push(category);
          found.push(word);
        }
      }
    }

    return [...new Set(found)];
  }

  /**
   * Determine primary intent
   */
  private determineIntent(_request: string, keywords: string[], _context?: any): string {
    // Check for specific patterns
    if (keywords.includes('add') || keywords.includes('create') || keywords.includes('build') || keywords.includes('new')) {
      return 'Create new feature or functionality';
    }
    if (keywords.includes('fix') || keywords.includes('debug') || keywords.includes('bug') || keywords.includes('error')) {
      return 'Fix or debug existing code';
    }
    if (keywords.includes('refactor') || keywords.includes('improve') || keywords.includes('clean')) {
      return 'Refactor or improve existing code';
    }
    if (keywords.includes('document') || keywords.includes('docs') || keywords.includes('explain')) {
      return 'Generate documentation';
    }
    if (keywords.includes('test') || keywords.includes('spec') || keywords.includes('coverage')) {
      return 'Test or add test coverage';
    }
    if (keywords.includes('understand') || keywords.includes('learn') || keywords.includes('how does') || keywords.includes('what is')) {
      return 'Understand or learn codebase';
    }
    if (keywords.includes('review') || keywords.includes('check') || keywords.includes('audit')) {
      return 'Review or analyze code';
    }
    if (keywords.includes('deploy') || keywords.includes('release') || keywords.includes('ship')) {
      return 'Deploy or release';
    }
    if (keywords.includes('security') || keywords.includes('vulnerability') || keywords.includes('secure')) {
      return 'Security review or fix';
    }
    if (keywords.includes('performance') || keywords.includes('slow') || keywords.includes('optimize')) {
      return 'Performance optimization';
    }

    return 'General assistance';
  }

  /**
   * Score a command against the analyzed request
   */
  private scoreCommand(
    cmdName: string,
    cmdData: any,
    analysis: { intent: string; keywords: string[] },
    context?: any
  ): CommandMatch {
    let score = 0;
    const reasons: string[] = [];

    // Get command description and keywords
    const description = cmdData.content
      .split('\n')
      .find((line: string) => line.toLowerCase().includes('description:'))
      ?.split('description:')[1]?.trim() || '';

    const cmdNameLower = cmdName.toLowerCase();

    // Extract keywords from command description
    const cmdKeywords = this.extractCommandKeywords(cmdName, cmdData.content);

    // Keyword matching
    for (const keyword of analysis.keywords) {
      if (cmdKeywords.includes(keyword)) {
        score += 20;
        reasons.push(`Matches keyword: "${keyword}"`);
      } else if (cmdNameLower.includes(keyword) || description.toLowerCase().includes(keyword)) {
        score += 10;
        reasons.push(`Partial match: "${keyword}"`);
      }
    }

    // Intent matching
    const intentMap: Record<string, string[]> = {
      'Create new feature or functionality': ['build', 'add-feature', 'spec-from-stories', 'ideate'],
      'Fix or debug existing code': ['fix', 'debug', 'investigate', 'chroot'],
      'Refactor or improve existing code': ['refactor', 'improve-spec', 'optimize', 'perf'],
      'Generate documentation': ['document', 'narrator', 'website'],
      'Test or add test coverage': ['test', 'tdd', 'sf-test', 'pair'],
      'Understand or learn codebase': ['understand', 'learn', 'search', 'semantic-searcher', 'read'],
      'Review or analyze code': ['review', 'inspect', 'analyze'],
      'Deploy or release': ['deploy', 'sf-deploy'],
      'Security review or fix': ['security', 'comply', 'sf-security'],
      'Performance optimization': ['perf', 'optimize']
    };

    if (intentMap[analysis.intent]) {
      for (const relatedCmd of intentMap[analysis.intent]) {
        if (cmdNameLower === relatedCmd || cmdNameLower.includes(relatedCmd)) {
          score += 30;
          reasons.push(`Matches intent: "${analysis.intent}"`);
        }
      }
    }

    // Context awareness
    if (context?.currentFile) {
      // Check if command is relevant to the current file type
      if (this.isRelevantTo(cmdName, context.currentFile)) {
        score += 15;
        reasons.push(`Relevant to current file`);
      }
    }

    return {
      command: `/siftcoder:${cmdName}`,
      name: cmdName,
      description,
      confidence: Math.min(score, 100),
      reason: reasons.join('; ') || 'General purpose command',
      category: this.getCommandCategory(cmdName)
    };
  }

  /**
   * Extract keywords from a command definition
   */
  private extractCommandKeywords(cmdName: string, content: string): string[] {
    const keywords: string[] = [];

    // Keywords from command name
    keywords.push(cmdName.toLowerCase());

    // Keywords from first heading or description
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.startsWith('description:')) {
        const desc = line.split('description:')[1]?.toLowerCase() || '';
        // Extract meaningful words
        const words = desc.match(/\b[a-z]{3,}\b/g) || [];
        keywords.push(...words.slice(0, 10)); // First 10 words
        break;
      }
    }

    return [...new Set(keywords)];
  }

  /**
   * Check if command is relevant to current file
   */
  private isRelevantTo(command: string, filePath: string): boolean {
    const ext = filePath.split('.').pop()?.toLowerCase();

    const relevanceMap: Record<string, string[]> = {
      'js': ['test', 'document', 'refactor', 'understand', 'analyze'],
      'ts': ['test', 'document', 'refactor', 'understand', 'analyze', 'lint'],
      'tsx': ['test', 'document', 'refactor', 'lwc'],
      'py': ['document', 'analyze'],
      'apex': ['sf-deploy', 'sf-test'],
      'cls': ['sf-deploy'],
      'trigger': ['sf-deploy'],
      'md': ['document', 'website']
    };

    const relevantCommands = relevanceMap[ext || ''] || [];
    return relevantCommands.includes(command) || command.includes('all');
  }

  /**
   * Get command category
   */
  private getCommandCategory(command: string): string {
    if (command.startsWith('/sf-')) return 'Salesforce';
    if (['build', 'fix', 'refactor', 'document', 'test', 'understand', 'review'].includes(command)) {
      return 'Core';
    }
    if (['autonomous', 'wizard', 'smart-retry'].includes(command)) {
      return 'AI';
    }
    return 'Utility';
  }

  /**
   * Get default suggestion when no match found
   */
  private getDefaultSuggestion(): CommandMatch {
    return {
      command: '/siftcoder:wizard',
      name: 'wizard',
      description: 'Guided walkthrough to help you get started',
      confidence: 50,
      reason: 'Interactive guide - helps determine what you need',
      category: 'Core'
    };
  }
}

// CLI interface
// Check if this file is being run directly (CLI mode)
const isMainModule = process.argv[1]?.endsWith('/suggest-service.js') ||
                        process.argv[1]?.endsWith('suggest-service.js') ||
                        process.argv[1]?.endsWith('\\suggest-service.js');

if (isMainModule) {
  const service = new SuggestService();
  const request = process.argv[2] || '';

  if (!request) {
    console.error('Usage: suggest <your-request>');
    process.exit(1);
  }

  service.suggestRequest(request)
    .then(result => {
      console.log('\n🎯 Suggested Command:\n');
      console.log(`  ${result.primary.command}`);
      console.log(`  ${result.primary.description}`);
      console.log(`  Confidence: ${result.primary.confidence}%`);
      console.log(`  Reason: ${result.primary.reason}\n`);

      if (result.alternatives.length > 0) {
        console.log('📋 Alternative Commands:\n');
        result.alternatives.forEach((alt, i) => {
          console.log(`  ${i + 1}. ${alt.command} (${alt.confidence}%)`);
        });
        console.log('');
      }

      console.log(`📝 Your Intent: ${result.userIntent}`);
      console.log(`🔑 Keywords: ${result.keywords.join(', ')}\n`);
      console.log(`Run the suggested command directly to continue.\n`);
    })
    .catch(error => {
      console.error('Error:', error.message);
      process.exit(1);
    });
}
