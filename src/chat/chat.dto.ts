import { ApiProperty } from '@nestjs/swagger';

export class ChatRequestDto {
  @ApiProperty({ description: 'OpenAI API 地址', example: 'https://turingai.plus/v1' })
  apiUrl: string;

  @ApiProperty({ description: 'OpenAI API 密钥', example: 'sk-sUaXRAuNp2A0vAs9DkR2NQmM0dsj2AULODdRvXq6GTYOleTE' })
  apiKey: string;

  @ApiProperty({ description: '用户消息', example: '你好，请介绍一下你自己' })
  message: string;

  @ApiProperty({ description: '模型名称', example: 'claude-sonnet-4-5-20250929', required: false })
  model?: string;
}

export class ChatResponseDto {
  @ApiProperty({ description: 'AI 回复内容' })
  reply: string;
}
