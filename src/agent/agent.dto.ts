import { ApiProperty } from '@nestjs/swagger';

export class AgentChatRequestDto {
  @ApiProperty({ description: 'OpenAI API 地址', example: 'https://turingai.plus/v1' })
  apiUrl: string;

  @ApiProperty({ description: 'OpenAI API 密钥', example: 'sk-xxx' })
  apiKey: string;

  @ApiProperty({ description: '用户消息', example: '帮我拆解一下开发一个用户登录注册功能的任务' })
  message: string;

  @ApiProperty({ description: '模型名称', example: 'claude-sonnet-4-5-20250929', required: false })
  model?: string;
}

// 流式输出事件类型
export interface StreamEvent {
  eventType: 'message' | 'usage' | 'complete' | 'error' | 'ttft';
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
