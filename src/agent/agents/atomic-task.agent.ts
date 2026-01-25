import { ATOMIC_TASK_PROMPT } from '../prompts/atomic-task.prompt';
import { ToolName } from '../tools';
import { AgentConfig } from './task-breakdown.agent';

/**
 * 原子任务拆解 Agent 配置选项
 */
export interface AtomicTaskAgentOptions {
  /** 项目名称，用于提示词定制 */
  projectName?: string;
  /** 系分文档内容 */
  designDoc?: string;
  /** 额外的上下文信息 */
  extraContext?: string;
  /** 额外的工具 */
  extraTools?: ToolName[];
}

/**
 * 创建原子任务拆解 Agent 配置
 * 支持动态定制 systemPrompt 和 tools
 */
export function createAtomicTaskAgent(options: AtomicTaskAgentOptions = {}): AgentConfig {
  const { projectName, designDoc, extraContext, extraTools = [] } = options;

  // 动态拼接 systemPrompt
  let systemPrompt = ATOMIC_TASK_PROMPT;

  const contextParts: string[] = [];

  if (projectName) {
    contextParts.push('当前项目名称：' + projectName);
  }

  if (designDoc) {
    contextParts.push('系分文档：\n' + designDoc);
  }

  if (extraContext) {
    contextParts.push(extraContext);
  }

  if (contextParts.length > 0) {
    systemPrompt = ATOMIC_TASK_PROMPT + '\n\n## 当前上下文：\n' + contextParts.join('\n\n');
  }

  // 动态注册工具
  const tools: ToolName[] = ['queryRepoContext', ...extraTools];

  return {
    name: '原子任务拆解 Agent',
    description: '将系统设计/系分拆解为具体的可执行原子任务',
    systemPrompt,
    tools,
  };
}

/**
 * 默认的原子任务拆解 Agent 配置
 */
export const DEFAULT_ATOMIC_TASK_CONFIG = createAtomicTaskAgent();
