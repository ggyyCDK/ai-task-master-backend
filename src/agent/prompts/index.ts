import { TASK_BREAKDOWN_PROMPT } from './task-breakdown.prompt';
import { ToolName } from '../tools';

/**
 * Agent 类型枚举
 */
export enum AgentType {
  TASK_BREAKDOWN = 'task-breakdown',
}

/**
 * Agent 配置接口
 */
export interface AgentConfig {
  name: string;
  description: string;
  systemPrompt: string;
  tools?: ToolName[];  // 该 Agent 可使用的工具列表
}

/**
 * Agent 提示词注册表
 */
export const AGENT_REGISTRY: Record<AgentType, AgentConfig> = {
  [AgentType.TASK_BREAKDOWN]: {
    name: '任务细分 Agent',
    description: '将复杂任务拆解为清晰、可执行的子任务',
    systemPrompt: TASK_BREAKDOWN_PROMPT,
    tools: ['queryRepoContext'],  // 配置仓库上下文查询工具
  },
};

/**
 * 获取 Agent 配置
 */
export function getAgentConfig(agentType: AgentType): AgentConfig | undefined {
  return AGENT_REGISTRY[agentType];
}

/**
 * 获取所有可用的 Agent 类型
 */
export function getAvailableAgentTypes(): AgentType[] {
  return Object.keys(AGENT_REGISTRY) as AgentType[];
}

export { TASK_BREAKDOWN_PROMPT };
