import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import {
    ChatPromptTemplate,
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
} from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import type { Response } from 'express';
import { ChatRequestDto } from './chat.dto';
import { createStreamEventHandler } from '../helper/stream-event.helper';

@Injectable()
export class ChatService {
    // 系统提示词
    private readonly systemPrompt = `你是一个友好、专业的 AI 助手。
你的特点：
- 回答问题时简洁明了
- 善于用通俗易懂的语言解释复杂概念
- 当不确定答案时会诚实地表明
- 乐于帮助用户解决各种问题`;

    // 创建提示词模板
    private readonly prompt = ChatPromptTemplate.fromMessages([
        SystemMessagePromptTemplate.fromTemplate(this.systemPrompt),
        HumanMessagePromptTemplate.fromTemplate('{message}'),
    ]);

    // 创建 LangChain 模型
    private createModel(apiUrl: string, apiKey: string, model: string) {
        return new ChatOpenAI({
            modelName: model,
            apiKey: apiKey,
            configuration: {
                baseURL: apiUrl,
            },
            streaming: true,
        });
    }

    // 非流式聊天
    async chat(chatRequest: ChatRequestDto): Promise<string> {
        const { apiUrl, apiKey, message, model = 'gpt-3.5-turbo' } = chatRequest;

        const llm = this.createModel(apiUrl, apiKey, model);
        const chain = this.prompt.pipe(llm).pipe(new StringOutputParser());

        const result = await chain.invoke({ message });
        return result || '抱歉，我无法生成回复。';
    }

    // 流式聊天
    async chatStream(chatRequest: ChatRequestDto, res: Response): Promise<void> {

        const { apiUrl, apiKey, message, model = 'gpt-3.5-turbo' } = chatRequest;

        // 创建流式事件处理器
        const handler = createStreamEventHandler(res);
        handler.setupStreamHeaders();

        try {
            const llm = this.createModel(apiUrl, apiKey, model);
            const chain = this.prompt.pipe(llm);

            // 使用 streamEvents 获取完整的流式事件（包含 usage 信息）
            const eventStream = chain.streamEvents({ message }, { version: 'v2' });

            for await (const event of eventStream) {
                handler.handleLLMStreamEvent(event);
            }

            // 发送 usage 统计
            handler.sendUsageEvent();
            // 发送完成事件
            handler.sendCompleteEvent();
        } catch (error) {
            handler.sendErrorEvent(error.message);
        }
    }
}
