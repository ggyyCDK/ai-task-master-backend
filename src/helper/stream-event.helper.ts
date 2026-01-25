import type { Response } from 'express';
import { AIMessageChunk } from '@langchain/core/messages';
import { StreamEvent, TokenUsage } from '../agent/agent.dto';

/**
 * 流式事件处理器
 * 用于处理 LangChain Agent 的流式输出事件
 */
export class StreamEventHandler {
  private tokenUsage: TokenUsage;
  private response: Response;
  private startTime: number; // 请求开始时间
  private firstTokenTime: number | null = null; // 首词输出时间
  private hasFirstToken: boolean = false; // 是否已输出首词

  constructor(res: Response) {
    this.response = res;
    this.tokenUsage = this.createInitialTokenUsage();
    this.startTime = Date.now();
  }

  /**
   * 创建初始化的 Token 使用统计对象
   */
  private createInitialTokenUsage(): TokenUsage {
    return {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
      prompt_tokens_details: {
        cached_tokens: 0,
        text_tokens: 0,
        audio_tokens: 0,
        image_tokens: 0,
      },
      completion_tokens_details: {
        text_tokens: 0,
        audio_tokens: 0,
        reasoning_tokens: 0,
      },
      input_tokens: 0,
      output_tokens: 0,
      input_tokens_details: null,
      claude_cache_creation_5_m_tokens: 0,
      claude_cache_creation_1_h_tokens: 0,
    };
  }

  /**
   * 设置流式响应头
   */
  setupStreamHeaders(): void {
    this.response.setHeader('Content-Type', 'text/plain; charset=utf-8');
    this.response.setHeader('Cache-Control', 'no-cache');
    this.response.setHeader('Connection', 'keep-alive');
    this.response.setHeader('Transfer-Encoding', 'chunked');
  }

  /**
   * 发送流式事件
   */
  sendEvent(event: StreamEvent): void {
    this.response.write(JSON.stringify(event) + '\n\n');
  }

  /**
   * 处理 LLM 流式输出事件
   * @param event LangChain 的流式事件
   * @returns 是否成功处理了内容
   */
  handleLLMStreamEvent(event: { event: string; data?: unknown; name?: string }): boolean {
    // 处理 LLM 流式输出
    if (event.event === 'on_chat_model_stream') {
      const data = event.data as { chunk?: AIMessageChunk };
      const chunk = data?.chunk;

      // 处理文本内容
      if (chunk?.content) {
        const content = typeof chunk.content === 'string'
          ? chunk.content
          : JSON.stringify(chunk.content);

        if (content) {
          // 记录首词时间
          if (!this.hasFirstToken) {
            this.firstTokenTime = Date.now();
            this.hasFirstToken = true;
          }

          this.sendEvent({
            eventType: 'message',
            content: content,
          });
          return true;
        }
      }

      // 处理工具调用片段
      const toolCallChunks = (chunk as any)?.tool_call_chunks;
      if (toolCallChunks && toolCallChunks.length > 0) {
        for (const toolChunk of toolCallChunks) {
          if (toolChunk.name) {
            // 工具调用开始
            this.sendEvent({
              eventType: 'tool_call',
              content: JSON.stringify({
                id: toolChunk.id,
                name: toolChunk.name,
                args: toolChunk.args,
              }),
            });
          }
        }
      }
    }

    // 处理工具开始执行事件
    if (event.event === 'on_tool_start') {
      const data = event.data as { input?: unknown };
      this.sendEvent({
        eventType: 'tool_call',
        content: JSON.stringify({
          status: 'start',
          name: event.name,
          input: data?.input,
        }),
      });
    }

    // 处理工具执行结束事件
    if (event.event === 'on_tool_end') {
      const data = event.data as { output?: unknown };
      this.sendEvent({
        eventType: 'tool_result',
        content: JSON.stringify({
          status: 'end',
          name: event.name,
          output: data?.output,
        }),
      });
    }

    // 处理 LLM 结束事件，获取 token 使用统计
    if (event.event === 'on_chat_model_end') {
      const data = event.data as { output?: AIMessageChunk };
      const output = data?.output;

      if (output?.usage_metadata) {
        this.tokenUsage.prompt_tokens = output.usage_metadata.input_tokens || 0;
        this.tokenUsage.completion_tokens = output.usage_metadata.output_tokens || 0;
        this.tokenUsage.total_tokens = output.usage_metadata.total_tokens || 0;
        this.tokenUsage.input_tokens = output.usage_metadata.input_tokens || 0;
        this.tokenUsage.output_tokens = output.usage_metadata.output_tokens || 0;
      }
    }

    return false;
  }

  /**
   * 发送 Token 使用统计
   */
  sendUsageEvent(): void {
    this.sendEvent({
      eventType: 'usage',
      content: JSON.stringify(this.tokenUsage),
    });
  }

  /**
   * 发送完成事件并结束响应
   */
  sendCompleteEvent(): void {
    this.sendEvent({
      eventType: 'complete',
      content: '[DONE]',
    });
    this.response.end('OK');
  }

  /**
   * 发送错误事件并结束响应
   */
  sendErrorEvent(errorMessage: string): void {
    this.sendEvent({
      eventType: 'error',
      content: errorMessage || 'Unknown error occurred',
    });
    this.response.end();
  }

  /**
   * 获取当前的 Token 使用统计
   */
  getTokenUsage(): TokenUsage {
    return this.tokenUsage;
  }

  /**
   * 获取 TTFT（Time To First Token）毫秒数
   */
  getTTFT(): number | null {
    if (this.firstTokenTime) {
      return this.firstTokenTime - this.startTime;
    }
    return null;
  }

  /**
   * 获取请求开始时间
   */
  getStartTime(): number {
    return this.startTime;
  }
}

/**
 * 创建流式事件处理器的工厂函数
 */
export function createStreamEventHandler(res: Response): StreamEventHandler {
  return new StreamEventHandler(res);
}
