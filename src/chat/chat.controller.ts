import { Body, Controller, Post, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { ChatService } from './chat.service';
import { ChatRequestDto, ChatResponseDto } from './chat.dto';

@ApiTags('聊天')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiOperation({ summary: '发送消息给 AI 聊天机器人（非流式）' })
  @ApiResponse({ status: 200, description: '成功返回 AI 回复', type: ChatResponseDto })
  async chat(@Body() chatRequest: ChatRequestDto): Promise<ChatResponseDto> {
    const reply = await this.chatService.chat(chatRequest);
    return { reply };
  }

  @Post('stream')
  @ApiOperation({ summary: '发送消息给 AI 聊天机器人（流式输出）' })
  @ApiResponse({ status: 200, description: 'SSE 流式返回 AI 回复' })
  async chatStream(
    @Body() chatRequest: ChatRequestDto,
    @Res() res: Response,
  ): Promise<void> {
    await this.chatService.chatStream(chatRequest, res);
  }
}
