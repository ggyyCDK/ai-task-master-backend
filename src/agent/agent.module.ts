import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { AgentFactory } from './agent.factory';

@Module({
  controllers: [AgentController],
  providers: [AgentFactory, AgentService],
  exports: [AgentService, AgentFactory],
})
export class AgentModule {}
