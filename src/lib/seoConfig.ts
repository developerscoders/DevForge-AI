export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[] | string;
  canonical?: string;
  ogType?: 'website' | 'article' | 'product';
  ogImage?: string;
  noindex?: boolean;
  structuredData?: Record<string, any> | Array<Record<string, any>>;
}

export const SITE_CONFIG = {
  name: 'DevForge AI',
  shortName: 'DevForge',
  domain: 'https://devforge.ai',
  tagline: 'Autonomous Multi-Agent Software Engineering Platform',
  defaultDescription:
    'Generate full-stack production-ready software with autonomous AI agent swarms. Real-time code generation, interactive sandbox preview, GitHub synchronization, and 1-click Vercel edge deployment.',
  defaultKeywords: [
    'AI software engineer',
    'autonomous coding agents',
    'AI app builder',
    'full-stack code generator',
    'multi-agent swarm',
    'AI code generator',
    'vibe coding',
    'react code generator',
    'automated devops',
    'AST code self-healing',
    'Vercel edge deployment',
    'GitHub repo sync'
  ],
  defaultOgImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&h=630&q=80',
  twitterHandle: '@DevForgeAI'
};

export const PAGE_SEO: Record<string, SEOProps> = {
  home: {
    title: 'DevForge AI | Autonomous Multi-Agent Software Engineering Platform',
    description:
      'Turn natural language into production-grade full-stack web applications with an autonomous swarm of AI agents. Code streaming, live sandbox, GitHub sync, and 1-click deployment.',
    keywords: [
      'AI software engineer',
      'autonomous coding agents',
      'AI app builder',
      'full stack app builder',
      'prompt to web app',
      'vibe coding platform',
      'multi-agent dev team'
    ],
    canonical: '/',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'DevForge AI',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Web, Cloud',
      offers: {
        '@type': 'Offer',
        price: '0.00',
        priceCurrency: 'USD'
      },
      description:
        'Autonomous multi-agent software engineering platform with a collaborative AI agent swarm, real-time code streaming, visual app builder, sandboxed code viewer, and one-click cloud deployments.'
    }
  },
  features: {
    title: 'Platform Features | Autonomous Multi-Agent Swarm - DevForge AI',
    description:
      'Explore DevForge AI features: Specialized agent swarms (Architect, Tech Lead, Senior Coder, QA Engineer), AST code healing, real-time telemetry, and edge deployments.',
    keywords: [
      'AI agent swarm architecture',
      'autonomous code generation',
      'self healing code',
      'AST error validation',
      'real-time code streaming',
      'automated software testing',
      'github continuous integration'
    ],
    canonical: '/features',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'DevForge AI Features',
      description: 'Comprehensive overview of DevForge AI multi-agent software development capabilities.'
    }
  },
  templates: {
    title: 'App Starter Templates & Blueprint Gallery | DevForge AI',
    description:
      'Browse production-ready full-stack application blueprints crafted by autonomous AI agents. SaaS starter kits, real-time dashboards, e-commerce storefronts, and AI APIs.',
    keywords: [
      'AI app templates',
      'SaaS starter blueprints',
      'React dashboard templates',
      'full-stack starter kits',
      'AI chatbot boilerplate',
      'e-commerce starter app'
    ],
    canonical: '/templates',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'DevForge AI Application Templates',
      description: 'Gallery of production-ready full-stack software blueprints crafted by AI agents.'
    }
  },
  docs: {
    title: 'Documentation & Architecture Guides | DevForge AI Knowledge Base',
    description:
      'Developer documentation, prompt engineering guides, agent swarm architecture specifications, API references, and deployment pipelines.',
    keywords: [
      'DevForge AI documentation',
      'prompt engineering for coding',
      'AI software architecture guide',
      'developer API docs',
      'autonomous agent orchestration'
    ],
    canonical: '/docs',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How does the DevForge AI agent swarm collaborate?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'DevForge AI uses a hierarchical swarm: a Product Manager synthesizes requirements, a System Architect designs module interfaces, a Tech Lead enforces code standards, Senior Coders generate implementations in parallel, and a QA Automation agent validates syntax and heals errors.'
          }
        },
        {
          '@type': 'Question',
          name: 'Can I export the generated code to GitHub or deploy directly?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. DevForge AI provides native GitHub repository synchronization and 1-click Vercel Edge deployment, as well as full ZIP source download.'
          }
        },
        {
          '@type': 'Question',
          name: 'What AI models power DevForge AI?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'DevForge utilizes intelligent model routing across Google Gemini 2.5/Flash, Claude 3.5 Sonnet, GPT-4o, and DeepSeek via unified high-throughput providers.'
          }
        }
      ]
    }
  },
  marketplace: {
    title: 'AI Swarm Marketplace & Plugins | DevForge AI Ecosystem',
    description:
      'Discover and publish specialized AI agents, prompt blueprints, architectural plugins, and development toolchains built for the DevForge ecosystem.',
    keywords: [
      'AI agent marketplace',
      'autonomous coder plugins',
      'software engineering blueprints',
      'developer tool marketplace',
      'AI prompt templates'
    ],
    canonical: '/marketplace',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'DevForge AI Marketplace',
      description: 'Marketplace for specialized AI developer agents, code generation plugins, and automated architecture modules.'
    }
  },
  billing: {
    title: 'Pricing & SRE Developer Plans | DevForge AI',
    description:
      'Transparent pricing for autonomous software generation. Flexible credit tiers, team collaboration, GST-compliant invoicing, and dedicated enterprise compute.',
    keywords: [
      'DevForge AI pricing',
      'AI coding subscription',
      'developer credits',
      'enterprise AI software engineering',
      'GST invoicing SaaS'
    ],
    canonical: '/billing',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'PriceSpecification',
      name: 'DevForge AI Subscription Tiers',
      description: 'Pricing tiers for DevForge AI autonomous software engineering.'
    }
  },
  projects: {
    title: 'Workspace & Cloud Projects Dashboard | DevForge AI',
    description:
      'Manage, monitor, duplicate, and deploy your autonomous AI-engineered software projects and live applications.',
    keywords: [
      'cloud codebases',
      'AI project manager',
      'workspace projects',
      'live application deployments'
    ],
    canonical: '/projects'
  }
};
