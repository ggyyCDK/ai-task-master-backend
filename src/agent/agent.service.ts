import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import type { Response } from 'express';
import { AgentChatRequestDto } from './agent.dto';
import { createStreamEventHandler } from '../helper';

@Injectable()
export class AgentService {
  constructor(private readonly configService: ConfigService) { }
  // 任务细分专家系统提示词
  private readonly systemPrompt = `你是一位专业的任务分解专家，擅长将复杂的项目或目标拆解为清晰、可执行的子任务。

## 你的核心能力：
- **任务分析**: 理解用户的核心目标和隐含需求
- **结构化拆解**: 将大任务拆解为有序、可管理的子任务
- **依赖识别**: 识别任务之间的依赖关系和执行顺序
- **优先级排序**: 根据重要性和紧迫性排列任务优先级
- **时间估算**: 为每个子任务提供合理的时间估算

## 工作流程：
1. **理解目标**: 首先确认用户的最终目标是什么
2. **识别阶段**: 将任务划分为主要阶段或里程碑
3. **细化子任务**: 在每个阶段内拆解具体的执行步骤
4. **设定标准**: 为每个子任务定义完成标准
5. **优化排序**: 根据依赖关系调整执行顺序

## 输出格式：
对于每个任务分解，请提供：
- **任务编号**: 用于追踪和引用
- **任务名称**: 简洁明了的任务描述
- **任务详情**: 具体的执行内容
- **预计时间**: 完成所需时间
- **前置任务**: 依赖的其他任务（如果有）
- **完成标准**: 如何判定任务完成

## 回答原则：
1. **MECE原则**: 任务拆解要相互独立、完全穷尽
2. **可执行性**: 每个子任务都应该是可操作的
3. **可验证性**: 每个子任务都有明确的完成标准
4. **适度粒度**: 不要太粗（难以执行）或太细（过于繁琐）

请用清晰、结构化的方式帮助用户将复杂任务拆解为可管理的子任务。`;

  // 创建 LangChain 模型
  private createModel(apiUrl: string, apiKey: string, model: string) {
    return new ChatOpenAI({
      modelName: model,
      apiKey: apiKey,
      configuration: {
        baseURL: apiUrl,
      },
      streaming: true,
    });
  }

  // 创建 Agent
  private createAgent(llm: ChatOpenAI) {
    // 创建一个简单的 ReAct Agent（目前不带工具，后续可扩展）
    const agent = createReactAgent({
      llm,
      tools: [], // 可以在这里添加工具，如搜索代码、查询文档等
    });
    return agent;
  }

  // 流式聊天 - Agent 模式
  async agentChatStream(
    chatRequest: AgentChatRequestDto,
    res: Response,
  ): Promise<void> {
    // 从环境变量获取配置
    const apiUrl = this.configService.get<string>('LLM_API_URL');
    const apiKey = this.configService.get<string>('LLM_API_KEY');
    const model = this.configService.get<string>('LLM_MODEL') || 'gpt-3.5-turbo';
    console.log('apiUrl', apiUrl, 'apiKey', apiKey, 'model', model,);
    const { message } = chatRequest;
    // 创建流式事件处理器
    const streamHandler = createStreamEventHandler(res);
    streamHandler.setupStreamHeaders();

    // 校验必要参数
    if (!apiUrl || !apiKey) {
      streamHandler.sendErrorEvent('缺少 API 配置，请在请求中提供 apiUrl 和 apiKey，或在 .env 中配置 LLM_API_URL 和 LLM_API_KEY');
      return;
    }

    try {
      const llm = this.createModel(apiUrl, apiKey, model);
      const agent = this.createAgent(llm);

      // 构建消息
      const messages = [
        new SystemMessage(this.systemPrompt),
        new HumanMessage(message),
      ];

      // 使用 streamEvents 获取流式输出
      const stream = agent.streamEvents(
        { messages },
        { version: 'v2' },
      );

      for await (const event of stream) {
        // 使用 helper 处理 LLM 事件
        streamHandler.handleLLMStreamEvent(event);
      }

      // 发送 token 使用统计和完成事件
      streamHandler.sendUsageEvent();
      streamHandler.sendCompleteEvent();
    } catch (error) {
      streamHandler.sendErrorEvent(error.message);
    }
  }
}
