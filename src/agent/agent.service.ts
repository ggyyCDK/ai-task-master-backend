import { Injectable } from '@nestjs/common';
import type { Response } from 'express';
import { AgentFactory } from './agent.factory';
import { AgentType, getAgentList } from './agents';
import { createStreamEventHandler } from '../helper';

@Injectable()
export class AgentService {
  constructor(private readonly agentFactory: AgentFactory) {}

  /**
   * 获取所有可用的 Agent 类型
   */
  getAvailableAgents() {
    return getAgentList();
  }

  /**
   * 生成系统设计/系分
   * 使用 TASK_BREAKDOWN Agent
   */
  async generateSystemSpec(message: string, res: Response): Promise<void> {
    await this.invokeAgent(AgentType.TASK_BREAKDOWN, message, res);
  }

  /**
   * 将系分拆解为原子任务
   * 使用 ATOMIC_TASK Agent
   */
  async generateTask(message: string, res: Response): Promise<void> {
    await this.invokeAgent(AgentType.ATOMIC_TASK, message, res);
  }

  /**
   * 通用 Agent 调用方法
   */
  private async invokeAgent(
    agentType: AgentType,
    message: string,
    res: Response,
  ): Promise<void> {
    const streamHandler = createStreamEventHandler(res);
    streamHandler.setupStreamHeaders();

    const configValidation = this.agentFactory.validateConfig();
    if (!configValidation.valid) {
      streamHandler.sendErrorEvent(configValidation.error!);
      return;
    }

    try {
      const agent = this.agentFactory.createAgent(agentType);
      const stream = agent.invoke(message);

      for await (const event of stream) {
        streamHandler.handleLLMStreamEvent(event);
      }

      streamHandler.sendUsageEvent();
      streamHandler.sendCompleteEvent();
    } catch (error) {
      streamHandler.sendErrorEvent(error.message);
    }
  }
}
