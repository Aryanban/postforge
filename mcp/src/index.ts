import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
} from '@modelcontextprotocol/sdk/types.js';
import {
  AI_FRAMEWORKS,
  calculateHeavyRankerScore,
  frameworkById,
  lintPostContent,
  type PlatformType,
  type PostItem,
} from '@postforge/core';

const API_URL = process.env.POSTFORGE_API_URL ?? 'http://localhost:3001/api';

/**
 * Routes a request to the PostForge backend. Pure operations (score/lint) run
 * locally against @postforge/core; stateful ones (ingest/generate/dispatch)
 * require the running API server.
 */
async function callBackend<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'content-type': 'application/json' },
    ...init,
  });
  const raw = await res.text();
  let body: unknown = raw;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    /* keep raw text */
  }
  if (!res.ok) {
    const message =
      (typeof body === 'object' && body !== null && 'error' in body
        ? String((body as { error: unknown }).error)
        : `HTTP ${res.status}`) ?? `HTTP ${res.status}`;
    throw new Error(`PostForge API (${path}): ${message}`);
  }
  return body as T;
}

function asText(value: unknown) {
  return {
    content: [{ type: 'text' as const, text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }],
  };
}

const TOOLS = [
  {
    name: 'postforge_health',
    description: 'Report PostForge backend status, configured providers, and dry-run mode.',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'postforge_ai_frameworks',
    description: 'List the available AI content-generation frameworks and the platforms each supports.',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'postforge_ingest',
    description: 'Ingest a website domain or GitHub repo into a project profile (tech stack, value props, SimClusters). Requires the backend.',
    inputSchema: {
      type: 'object' as const,
      required: ['url'],
      properties: { url: { type: 'string', description: 'e.g. react.dev or github.com/facebook/react' } },
    },
  },
  {
    name: 'postforge_projects',
    description: 'List all ingested projects.',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'postforge_generate',
    description: 'Generate template posts for a project (morning + evening pair, or a specific framework). Requires the backend.',
    inputSchema: {
      type: 'object' as const,
      required: ['projectId'],
      properties: {
        projectId: { type: 'string' },
        framework: { type: 'string', description: 'e.g. post-mortem, thread-hook, reddit-story' },
      },
    },
  },
  {
    name: 'postforge_generate_ai',
    description: 'Generate a post with Gemini, scored in a loop by the real Heavy Ranker until it clears 80 or the round budget is spent. Requires GEMINI_API_KEY on the backend.',
    inputSchema: {
      type: 'object' as const,
      required: ['projectId', 'framework'],
      properties: {
        projectId: { type: 'string' },
        framework: { type: 'string', description: 'one of the postforge_ai_frameworks ids' },
        platform: { type: 'string', enum: ['x', 'reddit', 'linkedin'] },
      },
    },
  },
  {
    name: 'postforge_score',
    description: 'Score draft copy against the X Heavy Ranker model. Runs locally; no backend needed.',
    inputSchema: {
      type: 'object' as const,
      required: ['content'],
      properties: {
        content: { type: 'string', description: 'the root post body' },
        replyContent: { type: 'string', description: 'the delayed first reply (link quarantine)' },
        keywords: { type: 'array', items: { type: 'string' }, description: 'project vocabulary for SimCluster alignment' },
        platform: { type: 'string', enum: ['x', 'reddit', 'linkedin'] },
      },
    },
  },
  {
    name: 'postforge_lint',
    description: 'Run the 7-point anti-shadowban linter over draft copy. Runs locally; no backend needed.',
    inputSchema: {
      type: 'object' as const,
      required: ['content'],
      properties: {
        content: { type: 'string' },
        replyContent: { type: 'string' },
        keywords: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  {
    name: 'postforge_schedule',
    description: 'Save a post and approve it for the backend scheduler to dispatch at its jittered time. Requires the backend.',
    inputSchema: {
      type: 'object' as const,
      required: ['post'],
      properties: { post: { type: 'object', description: 'a full PostItem object' } },
    },
  },
  {
    name: 'postforge_queue',
    description: 'List scheduled/queued posts. Requires the backend.',
    inputSchema: {
      type: 'object' as const,
      properties: { status: { type: 'string', description: 'filter: draft | approved | scheduled | published | failed' } },
    },
  },
  {
    name: 'postforge_dispatch',
    description: 'Dispatch a post immediately, bypassing its scheduled time. Requires the backend (simulated in dry-run mode).',
    inputSchema: {
      type: 'object' as const,
      required: ['id'],
      properties: { id: { type: 'string', description: 'the post id' } },
    },
  },
];

async function handleCall(request: CallToolRequest) {
  const name = request.params.name;
  const args = (request.params.arguments ?? {}) as Record<string, unknown>;

  switch (name) {
    case 'postforge_health':
      return asText(await callBackend('/health'));

    case 'postforge_ai_frameworks':
      return asText(AI_FRAMEWORKS);

    case 'postforge_ingest':
      return asText(
        await callBackend('/projects/ingest', {
          method: 'POST',
          body: JSON.stringify({ url: String(args.url) }),
        })
      );

    case 'postforge_projects':
      return asText(await callBackend('/projects'));

    case 'postforge_generate':
      return asText(
        await callBackend('/posts/generate', {
          method: 'POST',
          body: JSON.stringify({ projectId: String(args.projectId), framework: args.framework }),
        })
      );

    case 'postforge_generate_ai': {
      const framework = String(args.framework);
      const known = frameworkById(framework);
      if (!known) {
        return asText({
          error: `unknown framework "${framework}"`,
          available: AI_FRAMEWORKS.map(f => f.id),
        });
      }
      const platform = (args.platform as PlatformType) ?? known.platforms[0];
      if (!known.platforms.includes(platform)) {
        return asText({
          error: `framework "${framework}" does not support platform "${platform}"`,
          supported: known.platforms,
        });
      }
      return asText(
        await callBackend('/posts/generate-ai', {
          method: 'POST',
          body: JSON.stringify({ projectId: String(args.projectId), framework, platform }),
        })
      );
    }

    case 'postforge_score': {
      const keywords = Array.isArray(args.keywords)
        ? (args.keywords as string[]).map(String)
        : undefined;
      const platform = (args.platform as PlatformType) ?? 'x';
      return asText(
        calculateHeavyRankerScore(String(args.content), args.replyContent as string | undefined, {
          keywords,
          platform,
        })
      );
    }

    case 'postforge_lint': {
      const keywords = Array.isArray(args.keywords)
        ? (args.keywords as string[]).map(String)
        : undefined;
      return asText(
        lintPostContent(
          String(args.content),
          args.replyContent as string | undefined,
          { keywords }
        )
      );
    }

    case 'postforge_schedule': {
      const post = args.post as PostItem;
      await callBackend('/posts', { method: 'POST', body: JSON.stringify(post) });
      return asText(
        await callBackend(`/posts/${post.id}/approve`, { method: 'POST' })
      );
    }

    case 'postforge_queue':
      return asText(
        await callBackend(args.status ? `/posts?status=${encodeURIComponent(String(args.status))}` : '/posts')
      );

    case 'postforge_dispatch':
      return asText(
        await callBackend(`/posts/${String(args.id)}/dispatch`, { method: 'POST' })
      );

    default:
      throw new Error(`unknown tool: ${name}`);
  }
}

async function main(): Promise<void> {
  const server = new Server(
    { name: 'postforge', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

  server.setRequestHandler(CallToolRequestSchema, async request => {
    try {
      return await handleCall(request);
    } catch (err) {
      return {
        content: [
          {
            type: 'text',
            text: `error: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
        isError: true,
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

void main().catch(err => {
  console.error(err);
  process.exit(1);
});
