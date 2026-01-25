import { Injectable } from '@nestjs/common';
import type { Response } from 'express';
import { AgentFactory } from './agent.factory';
import { AgentChatRequestDto } from './agent.dto';
import { AgentType, AGENT_REGISTRY } from './prompts';
import { createStreamEventHandler } from '../helper';

@Injectable()
export class AgentService {
  constructor(private readonly agentFactory: AgentFactory) {}

  /**
   * 获取所有可用的 Agent 类型
   */
  getAvailableAgents() {
    return Object.entries(AGENT_REGISTRY).map(([type, config]) => ({
      type,
      name: config.name,
      description: config.description,
    }));
  }

  /**
   * 流式聊天 - Agent 模式
   */
  async agentChatStream(
    chatRequest: AgentChatRequestDto,
    res: Response,
  ): Promise<void> {
    const { message, agentType = AgentType.TASK_BREAKDOWN } = chatRequest;

    // 创建流式事件处理器
    const streamHandler = createStreamEventHandler(res);
    streamHandler.setupStreamHeaders();

    // 校验 API 配置
    const configValidation = this.agentFactory.validateConfig();
    if (!configValidation.valid) {
      streamHandler.sendErrorEvent(configValidation.error!);
      return;
    }

    try {
      // 使用工厂创建指定类型的 Agent
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
