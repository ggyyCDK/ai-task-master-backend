import { TASK_BREAKDOWN_PROMPT } from '../prompts/task-breakdown.prompt';
import { ToolName } from '../tools';

/**
 * Agent 配置接口
 */
export interface AgentConfig {
  name: string;
  description: string;
  systemPrompt: string;
  tools?: ToolName[];
}

/**
 * 任务细分 Agent 配置选项
 */
export interface TaskBreakdownAgentOptions {
  /** 项目名称，用于提示词定制 */
  projectName?: string;
  /** 额外的上下文信息 */
  extraContext?: string;
  /** 额外的工具 */
  extraTools?: ToolName[];
}

/**
 * 创建任务细分 Agent 配置
 * 支持动态定制 systemPrompt 和 tools
 */
export function createTaskBreakdownAgent(options: TaskBreakdownAgentOptions = {}): AgentConfig {
  const { projectName, extraContext, extraTools = [] } = options;

  // 动态拼接 systemPrompt
  let systemPrompt = TASK_BREAKDOWN_PROMPT;

  if (projectName || extraContext) {
    const contextParts: string[] = [];

    if (projectName) {
      contextParts.push('当前项目名称：' + projectName);
    }

    if (extraContext) {
      contextParts.push(extraContext);
    }

    systemPrompt = TASK_BREAKDOWN_PROMPT + '\n\n## 当前上下文：\n' + contextParts.join('\n');
  }

  // 动态注册工具
  const tools: ToolName[] = ['queryRepoContext', ...extraTools];

  return {
    name: '任务细分 Agent',
    description: '将复杂任务拆解为清晰、可执行的子任务',
    systemPrompt,
    tools,
  };
}

/**
 * 默认的任务细分 Agent 配置
 */
export const DEFAULT_TASK_BREAKDOWN_CONFIG = createTaskBreakdownAgent();
