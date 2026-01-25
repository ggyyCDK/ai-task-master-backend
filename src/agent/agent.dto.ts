import { ApiProperty } from '@nestjs/swagger';
import { AgentType } from './prompts';

export class AgentChatRequestDto {
  @ApiProperty({ description: '用户消息', example: '帮我拆解一下开发一个用户登录注册功能的任务' })
  message: string;

  @ApiProperty({
    description: 'Agent 类型',
    example: 'task-breakdown',
    enum: AgentType,
    required: false,
    default: AgentType.TASK_BREAKDOWN,
  })
  agentType?: AgentType;
}

// 流式输出事件类型
export interface StreamEvent {
  eventType: 'message' | 'usage' | 'complete' | 'error' | 'tool_call' | 'tool_result';
  content: string;
}

// Token 使用统计
export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  prompt_tokens_details?: {
    cached_tokens: number;
    text_tokens: number;
    audio_tokens: number;
    image_tokens: number;
  };
  completion_tokens_details?: {
    text_tokens: number;
    audio_tokens: number;
    reasoning_tokens: number;
  };
  input_tokens: number;
  output_tokens: number;
  input_tokens_details: null;
  claude_cache_creation_5_m_tokens: number;
  claude_cache_creation_1_h_tokens: number;
}
