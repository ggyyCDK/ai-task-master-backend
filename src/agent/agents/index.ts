import {
  AgentConfig,
  createTaskBreakdownAgent,
  TaskBreakdownAgentOptions,
  DEFAULT_TASK_BREAKDOWN_CONFIG,
} from './task-breakdown.agent';
import {
  createAtomicTaskAgent,
  AtomicTaskAgentOptions,
  DEFAULT_ATOMIC_TASK_CONFIG,
} from './atomic-task.agent';

/**
 * Agent 类型枚举
 */
export enum AgentType {
  TASK_BREAKDOWN = 'task-breakdown',
  ATOMIC_TASK = 'atomic-task',
}

/**
 * Agent 创建选项联合类型
 */
export type AgentOptions = TaskBreakdownAgentOptions | AtomicTaskAgentOptions;

/**
 * Agent 创建器映射
 */
const AGENT_CREATORS: Record<AgentType, (options?: AgentOptions) => AgentConfig> = {
  [AgentType.TASK_BREAKDOWN]: createTaskBreakdownAgent,
  [AgentType.ATOMIC_TASK]: createAtomicTaskAgent,
};

/**
 * 默认 Agent 配置映射
 */
const DEFAULT_AGENT_CONFIGS: Record<AgentType, AgentConfig> = {
  [AgentType.TASK_BREAKDOWN]: DEFAULT_TASK_BREAKDOWN_CONFIG,
  [AgentType.ATOMIC_TASK]: DEFAULT_ATOMIC_TASK_CONFIG,
};

/**
 * 获取 Agent 配置（支持动态创建）
 * @param agentType Agent 类型
 * @param options 可选的配置选项
 */
export function getAgentConfig(agentType: AgentType, options?: AgentOptions): AgentConfig | undefined {
  if (options) {
    const creator = AGENT_CREATORS[agentType];
    return creator ? creator(options) : undefined;
  }
  return DEFAULT_AGENT_CONFIGS[agentType];
}

/**
 * 获取所有可用的 Agent 类型
 */
export function getAvailableAgentTypes(): AgentType[] {
  return Object.keys(DEFAULT_AGENT_CONFIGS) as AgentType[];
}

/**
 * 获取所有 Agent 的基本信息
 */
export function getAgentList() {
  return Object.entries(DEFAULT_AGENT_CONFIGS).map(([type, config]) => ({
    type,
    name: config.name,
    description: config.description,
  }));
}

// 导出类型和配置
export type { AgentConfig, TaskBreakdownAgentOptions, AtomicTaskAgentOptions };
export { createTaskBreakdownAgent, createAtomicTaskAgent };
