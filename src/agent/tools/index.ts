import { StructuredToolInterface } from '@langchain/core/tools';
import { queryRepoContextTool } from './query-repo-context.tool';

/**
 * 工具注册表
 * 集中管理所有可用的工具
 */
export const TOOL_REGISTRY = {
  queryRepoContext: queryRepoContextTool,
} as const;

/**
 * 工具名称类型
 */
export type ToolName = keyof typeof TOOL_REGISTRY;

/**
 * 根据名称获取工具
 */
export function getTool(name: ToolName): StructuredToolInterface {
  return TOOL_REGISTRY[name];
}

/**
 * 根据名称列表获取多个工具
 */
export function getTools(names: ToolName[]): StructuredToolInterface[] {
  return names.map((name) => TOOL_REGISTRY[name]);
}

export { queryRepoContextTool };
