import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AgentService } from './agent.service';
import { SchooberAgentService } from './schoober-agent.service';
import { GenerateSystemSpecDto, GenerateTaskDto, SchooberAgentDto } from './agent.dto';

@ApiTags('Agent')
@Controller('agent')
export class AgentController {
  constructor(
    private readonly agentService: AgentService,
    private readonly schooberAgentService: SchooberAgentService,
  ) {}

  @Get('types')
  @ApiOperation({ summary: '获取所有可用的 Agent 类型' })
  @ApiResponse({
    status: 200,
    description: '返回可用的 Agent 类型列表',
  })
  getAgentTypes() {
    return this.agentService.getAvailableAgents();
  }

  @Post('generate-system-spec')
  @ApiOperation({ summary: '生成系统设计/系分（流式输出）' })
  @ApiResponse({
    status: 200,
    description: '流式返回系分结果，格式为 JSON 行',
    content: {
      'text/plain': {
        example: `{"eventType":"message","content":"系统设计..."}
{"eventType":"tool_call","content":"{...}"}
{"eventType":"tool_result","content":"{...}"}
{"eventType":"usage","content":"{...}"}
{"eventType":"complete","content":"[DONE]"}`,
      },
    },
  })
  async generateSystemSpec(
    @Body() dto: GenerateSystemSpecDto,
    @Res() res: Response,
  ): Promise<void> {
    await this.agentService.generateSystemSpec(dto.message, res);
  }

  @Post('generate-task')
  @ApiOperation({ summary: '将系分拆解为原子任务（流式输出）' })
  @ApiResponse({
    status: 200,
    description: '流式返回原子任务列表，格式为 JSON 行',
    content: {
      'text/plain': {
        example: `{"eventType":"message","content":"任务 1: ..."}
{"eventType":"tool_call","content":"{...}"}
{"eventType":"tool_result","content":"{...}"}
{"eventType":"usage","content":"{...}"}
{"eventType":"complete","content":"[DONE]"}`,
      },
    },
  })
  async generateTask(
    @Body() dto: GenerateTaskDto,
    @Res() res: Response,
  ): Promise<void> {
    await this.agentService.generateTask(dto.message, res);
  }

  @Post('schoober-invoke')
  @ApiOperation({ summary: '使用 Schoober AI SDK 执行 Agent 任务（流式输出）' })
  @ApiResponse({
    status: 200,
    description: '流式返回 Agent 执行结果，格式为 JSON 行',
    content: {
      'text/plain': {
        example: `{"eventType":"message","content":"思考中..."}
{"eventType":"tool_call","content":"{...}"}
{"eventType":"tool_result","content":"{...}"}
{"eventType":"usage","content":"{...}"}
{"eventType":"complete","content":"[DONE]"}`,
      },
    },
  })
  async schooberInvoke(
    @Body() dto: SchooberAgentDto,
    @Res() res: Response,
  ): Promise<void> {
    await this.schooberAgentService.invokeAgent(dto.message, res, dto.agentName);
  }
}
