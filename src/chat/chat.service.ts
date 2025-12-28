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

        // 设置 SSE 响应头
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        try {
            const llm = this.createModel(apiUrl, apiKey, model);
            const chain = this.prompt.pipe(llm).pipe(new StringOutputParser());

            const stream = await chain.stream({ message });
            let fullContent = '';

            for await (const chunk of stream) {
                if (chunk) {
                    fullContent += chunk;
                    res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
                }
            }

            // 输出完整消息
            res.write(`data: ${JSON.stringify({ type: 'done', content: fullContent })}\n\n`);
            res.end();
        } catch (error) {
            res.write(`data: ${JSON.stringify({ type: 'error', content: error.message })}\n\n`);
            res.end();
        }
    }
}
