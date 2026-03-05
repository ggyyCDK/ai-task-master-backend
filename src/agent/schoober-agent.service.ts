import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import {
    Agent,
    OpenAIProvider,
    BaseTool,
    ToolStatus,
    type ToolContext,
    type PersistenceManager,
    type ApiMessage,
    type TaskState,
} from 'schoober-ai-sdk';
import { z } from 'zod';
import { createStreamEventHandler } from '../helper';

// 内部类型定义
interface TaskInput {
    message: string;
    attachments?: any[];
    params?: Record<string, any>;
    stream?: boolean;
}

interface UserMessage {
    id: string;
    taskId: string;
    type: 'text' | 'tool' | 'error' | 'system';
    role: 'user' | 'assistant' | 'system';
    content?: string;
    toolInfo?: {
        requestId: string;
        toolName: string;
        displayName: string;
        status: ToolStatus;
        showTip?: string;
        params?: Record<string, any>;
        result?: any;
        error?: string;
    };
    ts: number;
}

/**
 * 内存持久化管理器
 * 简单实现，用于卑个任务执行，不需要真正的持久化
 */
class InMemoryPersistenceManager implements PersistenceManager {
    private apiMessages = new Map<string, ApiMessage[]>();
    private userMessages = new Map<string, UserMessage[]>();
    private taskStates = new Map<string, TaskState>();
    private taskInputs = new Map<string, TaskInput>();

    async saveApiMessages(taskId: string, messages: ApiMessage[]): Promise<void> {
        this.apiMessages.set(taskId, messages);
    }

    async loadApiMessages(taskId: string): Promise<ApiMessage[]> {
        return this.apiMessages.get(taskId) || [];
    }

    async appendApiMessage(taskId: string, message: ApiMessage): Promise<void> {
        const messages = this.apiMessages.get(taskId) || [];
        messages.push(message);
        this.apiMessages.set(taskId, messages);
    }

    async deleteApiMessages(taskId: string): Promise<void> {
        this.apiMessages.delete(taskId);
    }

    async saveUserMessages(taskId: string, messages: UserMessage[]): Promise<void> {
        this.userMessages.set(taskId, messages);
    }

    async loadUserMessages(taskId: string): Promise<UserMessage[]> {
        return this.userMessages.get(taskId) || [];
    }

    async deleteUserMessages(taskId: string): Promise<void> {
        this.userMessages.delete(taskId);
    }

    async saveTaskState(taskId: string, state: TaskState): Promise<void> {
        this.taskStates.set(taskId, state);
    }

    async loadTaskState(taskId: string): Promise<TaskState | null> {
        return this.taskStates.get(taskId) || null;
    }

    async updateTaskState(taskId: string, updates: Partial<TaskState>): Promise<void> {
        const state = this.taskStates.get(taskId);
        if (state) {
            this.taskStates.set(taskId, { ...state, ...updates });
        }
    }

    async deleteTaskState(taskId: string): Promise<void> {
        this.taskStates.delete(taskId);
    }

    async listTaskStates(): Promise<TaskState[]> {
        return Array.from(this.taskStates.values());
    }

    async saveTaskInput(taskId: string, input: TaskInput): Promise<void> {
        this.taskInputs.set(taskId, input);
    }

    async loadTaskInput(taskId: string): Promise<TaskInput | null> {
        return this.taskInputs.get(taskId) || null;
    }

    async deleteTaskInput(taskId: string): Promise<void> {
        this.taskInputs.delete(taskId);
    }
}

/**
 * 示例工具：获取当前时间
 */
class GetCurrentTimeTool extends BaseTool {
    name = 'get_current_time';
    displayName = '获取时间';

    async getDescription() {
        return {
            description: '获取当前的日期和时间',
        };
    }

    async getParameters() {
        return z.object({
            timezone: z.string().optional().describe('时区，例如 "Asia/Shanghai"'),
        });
    }

    async execute(
        params: { timezone?: string },
        context: ToolContext,
        isPartial: boolean,
    ): Promise<void> {
        // 流式参数未完成时跳过
        if (isPartial) return;

        // 发送执行中状态
        await (this as any).sendToolStatus(context.requestId, ToolStatus.DOING, {
            showTip: '正在获取时间...',
            params,
        });

        const now = new Date();
        const options: Intl.DateTimeFormatOptions = {
            timeZone: params.timezone || 'Asia/Shanghai',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        };
        const formattedTime = now.toLocaleString('zh-CN', options);
        const result = `当前时间: ${formattedTime}`;

        // 设置工具结果给 LLM
        await (this as any).setToolResult(context.requestId, result);

        // 发送成功状态
        await (this as any).sendToolStatus(context.requestId, ToolStatus.SUCCESS, {
            result,
        });
    }
}

/**
 * Schoober AI SDK Agent 服务
 * 使用 schoober-ai-sdk 框架实现 ReAct 模式的 Agent
 */
@Injectable()
export class SchooberAgentService {
    private provider: OpenAIProvider | null = null;

    constructor(private readonly configService: ConfigService) { }

    /**
     * 获取或创建 LLM Provider
     */
    private getProvider(): OpenAIProvider {
        if (!this.provider) {
            const apiUrl = this.configService.get<string>('LLM_API_URL');
            const apiKey = this.configService.get<string>('LLM_API_KEY');
            const model = this.configService.get<string>('LLM_MODEL') || 'gpt-3.5-turbo';

            this.provider = new OpenAIProvider({
                provider: 'openai',
                apiKey: apiKey!,
                baseUrl: apiUrl,
                defaultModel: model,
            });
        }
        return this.provider;
    }

    /**
     * 创建 Agent 实例
     */
    private createAgent(name: string = 'schoober-agent'): Agent {
        const provider = this.getProvider();

        const agent = new Agent({
            name,
            description: '一个通用的 AI 助手，可以回答问题、分析代码、提供建议',
            llmProvider: provider,
            persistence: new InMemoryPersistenceManager(),
        });

        // 注册示例工具
        agent.registerTool(GetCurrentTimeTool);

        return agent;
    }

    /**
     * 检查 API 配置是否有效
     */
    validateConfig(): { valid: boolean; error?: string } {
        const apiUrl = this.configService.get<string>('LLM_API_URL');
        const apiKey = this.configService.get<string>('LLM_API_KEY');

        if (!apiUrl || !apiKey) {
            return {
                valid: false,
                error: '缺少 API 配置，请在 .env 中配置 LLM_API_URL 和 LLM_API_KEY',
            };
        }

        return { valid: true };
    }

    /**
     * 执行 Agent 任务（流式输出）
     * @param message 用户输入消息
     * @param res Express Response 对象
     * @param agentName 可选的 Agent 名称
     */
    async invokeAgent(
        message: string,
        res: Response,
        agentName?: string,
    ): Promise<void> {
        const streamHandler = createStreamEventHandler(res);
        streamHandler.setupStreamHeaders();

        const configValidation = this.validateConfig();
        if (!configValidation.valid) {
            streamHandler.sendErrorEvent(configValidation.error!);
            return;
        }

        try {
            const agent = this.createAgent(agentName);

            // 创建任务
            const task = await agent.createTask(
                {
                    name: 'schoober-task',
                    input: { message },
                },
                {
                    // TaskContext
                    sessionId: `session-${Date.now()}`,
                },
                {
                    // TaskCallbacks
                    onMessage: async (userMessage) => {
                        // 直接输出完整的 userMessage 对象
                        streamHandler.sendEvent({
                            eventType: userMessage.type,
                            content: JSON.stringify(userMessage),
                        });
                    },
                    onTaskStateUpdate: async (taskState) => {
                        streamHandler.sendEvent({
                            eventType: 'task_state',
                            content: JSON.stringify(taskState),
                        });
                    },
                },
            );

            // 启动任务并等待完成
            await task.start();

            // 发送使用统计和完成事件
            streamHandler.sendUsageEvent();
            streamHandler.sendCompleteEvent();
        } catch (error) {
            streamHandler.sendErrorEvent(
                error instanceof Error ? error.message : 'Unknown error occurred',
            );
        }
    }
}
