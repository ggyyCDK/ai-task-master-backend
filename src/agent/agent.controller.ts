import { Body, Controller, Post, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AgentService } from './agent.service';
import { AgentChatRequestDto } from './agent.dto';

@ApiTags('任务细分 Agent')
@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post('chat')
  @ApiOperation({ summary: '任务细分 Agent 聊天接口（流式输出）' })
  @ApiResponse({
    status: 200,
    description: '流式返回 AI 回复，格式为 JSON 行',
    content: {
      'text/plain': {
        example: `{"eventType":"message","content":"你"}
{"eventType":"message","content":"好"}
{"eventType":"usage","content":"{\\"prompt_tokens\\":100,\\"completion_tokens\\":50}"}
{"eventType":"complete","content":"[DONE]"}
OK`,
      },
    },
  })
  async agentChat(
    @Body() chatRequest: AgentChatRequestDto,
    @Res() res: Response,
  ): Promise<void> {
    await this.agentService.agentChatStream(chatRequest, res);
  }
}
