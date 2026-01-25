import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { AgentType, getAgentConfig } from './prompts';
import { getTools } from './tools';

/**
 * Agent 实例接口
 */
export interface AgentInstance {
  agentType: AgentType;
  name: string;
  invoke: (message: string) => AsyncGenerator<{ event: string; data?: unknown }>;
}

/**
 * Agent 工厂
 * 负责创建不同类型的 Agent 实例
 */
@Injectable()
export class AgentFactory {
  constructor(private readonly configService: ConfigService) {}

  /**
   * 创建 LangChain 模型
   */
  private createModel(): ChatOpenAI {
    const apiUrl = this.configService.get<string>('LLM_API_URL');
    const apiKey = this.configService.get<string>('LLM_API_KEY');
    const model = this.configService.get<string>('LLM_MODEL') || 'gpt-3.5-turbo';

    return new ChatOpenAI({
      modelName: model,
      apiKey: apiKey,
      configuration: {
        baseURL: apiUrl,
      },
      streaming: true,
    });
  }

  /**
   * 创建指定类型的 Agent
   */
  createAgent(agentType: AgentType): AgentInstance {
    const config = getAgentConfig(agentType);

    if (!config) {
      throw new Error(`Unknown agent type: ${agentType}`);
    }

    const llm = this.createModel();

    // 根据配置获取该 Agent 的工具集
    const tools = config.tools ? getTools(config.tools) : [];

    const agent = createReactAgent({
      llm,
      tools,
    });

    return {
      agentType,
      name: config.name,
      invoke: (message: string) => {
        const messages = [
          new SystemMessage(config.systemPrompt),
          new HumanMessage(message),
        ];

        return agent.streamEvents({ messages }, { version: 'v2' });
      },
    };
  }

  /**
   * 检查 API 配置是否有效
   */
  validateConfig(): { valid: boolean; error?: string } {
    const apiUrl = this.configService.get<string>('LLM_API_URL');
    const apiKey = this.configService.get<string>('LLM_API_KEY');

    if (!apiUrl || !apiKey) {
      return {
        valid: false,
        error: '缺少 API 配置，请在 .env 中配置 LLM_API_URL 和 LLM_API_KEY',
      };
    }

    return { valid: true };
  }
}
