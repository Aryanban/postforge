import { ProjectProfile, PostItem } from '../../types';
import { calculateHeavyRankerScore } from '../algorithm/heavyRanker';
import { lintPostContent } from '../algorithm/shadowbanLinter';
import { calculateJitteredSchedule } from '../algorithm/optimalTimes';

export function generateDailyPostBatch(project: ProjectProfile): PostItem[] {
  const primaryTech = project.techStack.slice(0, 3).join(', ');
  const firstValueProp = project.valueProps[0] || 'high-performance systems engineering';
  const secondValueProp = project.valueProps[1] || 'decoupled modular architecture';
  const projectDomain = project.domain.startsWith('http') ? project.domain : `https://${project.domain}`;

  // Slot 1: Morning Velocity Post (Scheduled ~8:45 AM + Jitter)
  const morningSchedule = calculateJitteredSchedule('morning');
  const morningContent = `Most developers overcomplicate ${primaryTech}.

Here is the exact architecture we used to build ${project.name}:

• 0 unnecessary dependencies
• ${firstValueProp}
• Clean state isolation with zero lag
• Responsive dark-mode brutalist design

The entire breakdown & open-source blueprint below.

What is your #1 rule when structuring clean systems?`;

  const morningReply = `Inspect the live platform & system documentation here:\n${projectDomain}\n\nBookmark this thread if you're building with ${project.techStack[0] || 'TypeScript'}! 🔖`;

  const morningScore = calculateHeavyRankerScore(morningContent, morningReply);
  const morningLints = lintPostContent(morningContent, morningReply);

  const morningPost: PostItem = {
    id: `post-${Date.now()}-morning`,
    projectId: project.id,
    platform: 'x',
    slot: 'morning',
    framework: 'contrarian-engineering',
    frameworkName: 'Morning Velocity Breakdown',
    hook: `Most developers overcomplicate ${primaryTech}.`,
    mainContent: morningContent,
    hasRootLink: false,
    replyContent: morningReply,
    scheduledDate: morningSchedule.scheduledDate.toISOString(),
    jitterMinutes: morningSchedule.jitterMinutes,
    status: 'draft',
    whyAlgorithmLikes: 'Maximizes early-morning bookmarks and retweets with bulleted dwell-time structure. Detaches the link into the first reply to bypass the 50% root-link penalty.',
    algorithmScore: morningScore,
    linterChecks: morningLints.checks,
  };

  // Slot 2: Evening Discussion / Debate Post (Scheduled ~7:15 PM + Jitter)
  const eveningSchedule = calculateJitteredSchedule('evening');
  const eveningContent = `Unpopular opinion:

A slick UI won't save a project if the underlying systems logic is fragile.

While engineering ${project.name}, we prioritized:
1. ${firstValueProp}
2. ${secondValueProp}
3. Sub-50ms interaction latency

Would you rather ship faster with technical debt, or take 2x longer to get the architecture right?`;

  const eveningReply = `Explore the live build and system specs at:\n${projectDomain}\n\nDrop your perspective below — replying to every comment! 👇`;

  const eveningScore = calculateHeavyRankerScore(eveningContent, eveningReply);
  const eveningLints = lintPostContent(eveningContent, eveningReply);

  const eveningPost: PostItem = {
    id: `post-${Date.now()}-evening`,
    projectId: project.id,
    platform: 'x',
    slot: 'evening',
    framework: 'evening-debate',
    frameworkName: 'Evening Discussion Catalyst',
    hook: `Unpopular opinion: A slick UI won't save a project if the underlying systems logic is fragile.`,
    mainContent: eveningContent,
    hasRootLink: false,
    replyContent: eveningReply,
    scheduledDate: eveningSchedule.scheduledDate.toISOString(),
    jitterMinutes: eveningSchedule.jitterMinutes,
    status: 'draft',
    whyAlgorithmLikes: 'Capitalizes on the 150x Author-Reply multiplier. The binary dilemma question ("Ship fast vs Architecture") triggers active debate during peak mobile hours.',
    algorithmScore: eveningScore,
    linterChecks: eveningLints.checks,
  };

  return [morningPost, eveningPost];
}

export function generateCustomAngle(project: ProjectProfile, framework: string): PostItem {
  const primaryTech = project.techStack[0] || 'TypeScript';
  const projectDomain = project.domain.startsWith('http') ? project.domain : `https://${project.domain}`;
  const timing = calculateJitteredSchedule(Math.random() > 0.5 ? 'morning' : 'evening');

  let content = '';
  let reply = `Source code and project details:\n${projectDomain}\n\nBookmark for your next build! 🔖`;
  let frameworkName = 'Custom Growth Angle';
  let why = 'Structured for high dwell-time and organic conversational velocity.';

  if (framework === 'post-mortem') {
    frameworkName = 'Engineering Post-Mortem';
    content = `I spent 3 weeks refactoring ${project.name}.

3 mistakes I made so you don't have to:

1. Underestimating state synchronization latency
2. Over-abstracting simple component trees
3. Forgetting SEO sitemap automation until the very end

Fixed all 3 with ${project.techStack.slice(0, 2).join(' + ')}.

What was your most painful refactor this year?`;
    why = 'Vulnerability and engineering failures trigger 3x higher comment rates than self-congratulatory launch posts.';
  } else if (framework === 'thread-hook') {
    frameworkName = '5-Part Architecture Thread';
    content = `How to engineer a modern, zero-latency digital platform in 2026.

A breakdown of the architecture powering ${project.name}:

1/ Datapath & State Flow
2/ Layout Ergonomics & Glassmorphism
3/ Anti-Shadowban Algorithm Compliance
4/ Production Deployment on the Edge

🧵 Mini-thread below:`;
    reply = `Live implementation: ${projectDomain}\n\n1/ Datapath: Using ${primaryTech} to ensure zero runtime overhead and immediate DOM reconciliation.`;
    why = 'Threads trigger multi-click dwell metrics. Users expanding the thread signal strong intent to the recommendation neural network.';
  } else if (framework === 'reddit-story') {
    frameworkName = 'Reddit 9:1 Value Showcase';
    content = `[Showcase] Built an open-source systems platform after struggling with bloated tooling

Hey everyone,

I've been working on ${project.name} because I was frustrated with how sluggish and bloated modern web apps have become.

Key challenges we solved:
• ${project.valueProps[0] || 'Low latency data flow'}
• ${project.valueProps[1] || 'Decoupled architecture'}
• Clean dark-mode brutalist design without 50 extra npm libraries

Stack: ${project.techStack.join(', ')}.

Code and live demo are completely free and open. Would love honest feedback on the architecture!`;
    reply = `Live site: ${projectDomain}\nFeedback on code structure is deeply appreciated!`;
    why = 'Complies with Reddit 9:1 self-promotion guidelines by focusing 90% on engineering problems and community value.';
  } else {
    content = `Building ${project.name} taught me one core lesson:

Simplicity always outperforms clever code.

Stack:
• ${project.techStack.join('\n• ')}

The complete setup is running live. What stack are you betting on right now?`;
  }

  const score = calculateHeavyRankerScore(content, reply);
  const lints = lintPostContent(content, reply);

  return {
    id: `custom-${Date.now()}`,
    projectId: project.id,
    platform: framework === 'reddit-story' ? 'reddit' : 'x',
    slot: 'custom',
    framework,
    frameworkName,
    hook: content.split('\n')[0],
    mainContent: content,
    hasRootLink: false,
    replyContent: reply,
    subreddit: framework === 'reddit-story' ? project.recommendedSubreddits[0] : undefined,
    scheduledDate: timing.scheduledDate.toISOString(),
    jitterMinutes: timing.jitterMinutes,
    status: 'draft',
    whyAlgorithmLikes: why,
    algorithmScore: score,
    linterChecks: lints.checks,
  };
}
