import { tool } from '@langchain/core/tools';
import { z } from 'zod';

/**
 * 延迟函数
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock 仓库 Wiki 数据
 */
const REPO_WIKI = `
# AI Task Master 项目 Wiki

## 项目概述
AI Task Master 是一个基于 NestJS 的 AI Agent 服务后端，提供智能任务拆解和对话服务。

## 技术栈
- **后端框架**: NestJS 11.0.1
- **运行时**: Node.js + TypeScript
- **AI 能力**: 
  - @langchain/core & @langchain/langgraph: LLM 工作流与状态图
  - @langchain/openai: OpenAI 模型集成
- **配置管理**: @nestjs/config
- **API 文档**: @nestjs/swagger

## 项目结构
\`\`\`
src/
├── agent/                    # Agent 模块
│   ├── prompts/              # 提示词管理
│   │   ├── index.ts          # Agent 注册表、类型枚举
│   │   └── task-breakdown.prompt.ts  # 任务细分提示词
│   ├── tools/                # 工具集
│   │   ├── index.ts          # 工具注册表
│   │   └── query-repo-context.tool.ts  # 仓库上下文查询工具
│   ├── agent.controller.ts   # Agent 控制器
│   ├── agent.service.ts      # Agent 服务
│   ├── agent.factory.ts      # Agent 工厂
│   ├── agent.dto.ts          # 数据传输对象
│   └── agent.module.ts       # Agent 模块
├── chat/                     # 对话模块
│   ├── chat.controller.ts    # 对话控制器
│   ├── chat.service.ts       # 对话服务
│   ├── chat.dto.ts           # 数据传输对象
│   └── chat.module.ts        # 对话模块
├── helper/                   # 工具函数
│   ├── index.ts              # 导出入口
│   └── stream-event.helper.ts  # 流式事件处理器
├── app.module.ts             # 根模块
└── main.ts                   # 应用入口
\`\`\`

## 核心模块说明

### Agent 模块
- **工厂模式**: AgentFactory 负责创建不同类型的 Agent
- **提示词外部化**: prompts/ 目录统一管理提示词
- **工具集可配置**: 每个 Agent 可配置专属工具集
- **当前 Agent 类型**: task-breakdown（任务细分）

### Chat 模块
- 支持流式/非流式对话
- SSE 流式输出

## API 接口

### Agent 接口
- \`GET /agent/types\` - 获取可用 Agent 类型
- \`POST /agent/chat\` - Agent 对话（流式输出）

### Chat 接口
- \`POST /chat\` - 普通对话
- \`POST /chat/stream\` - 流式对话

## 环境配置
配置文件: .env
\`\`\`
LLM_API_URL=https://turingai.plus/v1
LLM_API_KEY=sk-xxx
LLM_MODEL=claude-sonnet-4-5-20250929
\`\`\`

## 开发规范
- TypeScript 严格模式
- ESLint + Prettier 代码风格
- 单引号、尾随逗号
- 模块化设计，职责分离
`;

/**
 * 查询仓库上下文工具
 * 用于获取代码仓库的结构、文件内容等上下文信息
 */
export const queryRepoContextTool = tool(
  async ({ query, path }) => {
    console.log(`[Tool] 查询仓库上下文: query="${query}", path="${path || '/'}"`);

    // 模拟查询延迟 2 秒
    await sleep(2000);

    // 返回 Mock 的仓库 Wiki
    return REPO_WIKI;
  },
  {
    name: 'query_repo_context',
    description: '查询代码仓库的上下文信息，包括项目结构、技术栈、文件内容等。当需要了解项目情况以便更好地拆解任务时使用此工具。',
    schema: z.object({
      query: z.string().describe('查询内容，描述你想了解的项目信息'),
      path: z.string().optional().describe('可选的路径过滤，限定查询范围'),
    }),
  }
);
