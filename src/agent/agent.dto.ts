import { ApiProperty } from '@nestjs/swagger';

/**
 * 生成系分请求 DTO
 */
export class GenerateSystemSpecDto {
  @ApiProperty({
    description: '用户需求描述',
    example: '开发一个用户登录注册功能，支持手机号和邮箱登录',
  })
  message: string;
}

/**
 * 生成原子任务请求 DTO
 */
export class GenerateTaskDto {
  @ApiProperty({
    description: '系分文档内容',
    example: '系统设计：用户登录模块包括...',
  })
  message: string;
}

/**
 * Schoober AI SDK Agent 请求 DTO
 */
export class SchooberAgentDto {
  @ApiProperty({
    description: '用户输入消息',
    example: '帮我分析一下这段代码的性能问题',
  })
  message: string;

  @ApiProperty({
    description: 'Agent 名称（可选）',
    example: 'code-analyzer',
    required: false,
  })
  agentName?: string;
}

// 流式输出事件类型
export interface StreamEvent {
  eventType: 'message' | 'usage' | 'complete' | 'error' | 'tool_call' | 'tool_result' | 'task_state';
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
