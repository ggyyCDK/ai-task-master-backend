import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { AgentFactory } from './agent.factory';
import { SchooberAgentService } from './schoober-agent.service';

@Module({
  controllers: [AgentController],
  providers: [AgentFactory, AgentService, SchooberAgentService],
  exports: [AgentService, AgentFactory, SchooberAgentService],
})
export class AgentModule {}
