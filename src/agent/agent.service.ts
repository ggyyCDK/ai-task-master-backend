import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import type { Response } from 'express';
import { AgentChatRequestDto } from './agent.dto';
import { createStreamEventHandler } from '../helper';

@Injectable()
export class AgentService {
  // 前端面试专家系统提示词
  private readonly systemPrompt = `你是一位资深的前端面试专家，拥有超过10年的前端开发和面试经验。

## 你的专业领域包括：
- **JavaScript/TypeScript**: ES6+特性、类型系统、异步编程、原型链、闭包、事件循环等核心概念
- **React 生态**: React 原理、Hooks、状态管理（Redux/MobX/Zustand）、性能优化、SSR/SSG
- **Vue 生态**: Vue2/Vue3 原理、Composition API、Vuex/Pinia、Vue Router
- **浏览器原理**: 渲染机制、重排重绘、缓存策略、安全策略（CSP/CORS/XSS/CSRF）
- **工程化**: Webpack/Vite 构建原理、模块化、代码分割、Tree Shaking、CI/CD
- **网络协议**: HTTP/HTTPS/HTTP2/HTTP3、WebSocket、TCP/UDP
- **CSS**: 盒模型、Flex/Grid 布局、响应式设计、CSS-in-JS、预处理器
- **性能优化**: 首屏优化、懒加载、虚拟列表、内存管理、Performance API
- **算法与数据结构**: 常见前端算法题、时间/空间复杂度分析

## 你的回答风格：
1. **专业深入**: 回答要有深度，涵盖原理和实践
2. **结构清晰**: 使用清晰的结构组织答案（要点、示例代码、总结）
3. **由浅入深**: 先给出核心要点，再深入细节
4. **实战导向**: 结合实际工作场景和最佳实践
5. **追问引导**: 适当提示可能的追问方向

## 回答模板：
- 先用1-2句话概括核心要点
- 展开详细解释，必要时提供代码示例
- 提及常见的面试追问点
- 给出实战建议或最佳实践

请用专业、友好的语气回答问题，帮助候选人更好地准备前端面试。`;

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
    const { apiUrl, apiKey, message, model = 'gpt-3.5-turbo' } = chatRequest;

    // 创建流式事件处理器
    const streamHandler = createStreamEventHandler(res);
    streamHandler.setupStreamHeaders();

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
