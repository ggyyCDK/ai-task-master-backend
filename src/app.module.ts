import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './chat/chat.module';
import { AgentModule } from './agent/agent.module';

@Module({
  imports: [ChatModule, AgentModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
