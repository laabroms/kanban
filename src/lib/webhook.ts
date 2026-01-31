// Webhook utility for notifying external services of task changes

type WebhookEvent = 'task.created' | 'task.updated' | 'task.deleted' | 'task.moved';

interface TaskData {
  id: string;
  title: string;
  description?: string | null;
  priority: string;
  columnId: string;
  epicId?: string | null;
}

interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  task: TaskData;
  changes?: {
    from?: string;
    to?: string;
  };
}

// Format event for Telegram message
function formatTelegramMessage(event: WebhookEvent, task: TaskData, changes?: WebhookPayload['changes']): string {
  const priorityEmoji = { low: '🟢', medium: '🟡', high: '🔴' }[task.priority] || '⚪';
  const columnEmoji = {
    'backlog': '📋',
    'in-progress': '🔨',
    'review': '👀',
    'done': '✅'
  }[task.columnId] || '📝';

  switch (event) {
    case 'task.created':
      return `📌 *New Task Created*\n\n*${task.title}*${task.description ? `\n${task.description}` : ''}\n\n${priorityEmoji} Priority: ${task.priority}\n${columnEmoji} Column: ${task.columnId}`;
    case 'task.moved':
      return `${columnEmoji} *Task Moved*\n\n*${task.title}*\n\n${changes?.from} → ${changes?.to}`;
    case 'task.updated':
      return `✏️ *Task Updated*\n\n*${task.title}*\n${priorityEmoji} ${task.priority} | ${columnEmoji} ${task.columnId}`;
    case 'task.deleted':
      return `🗑️ *Task Deleted*\n\n~${task.title}~`;
    default:
      return `📝 Task event: ${event}\n${task.title}`;
  }
}

// Format message for Clawdbot agent
function formatClawdbotMessage(event: WebhookEvent, task: TaskData, changes?: WebhookPayload['changes']): string {
  const priorityLabel = { low: 'Low', medium: 'Medium', high: 'High' }[task.priority] || task.priority;
  
  switch (event) {
    case 'task.created':
      return `New Kanban task created: "${task.title}"${task.description ? ` - ${task.description}` : ''}. Priority: ${priorityLabel}. Column: ${task.columnId}. Please pick up this task if appropriate based on priority and your current workload.`;
    case 'task.moved':
      if (changes?.to === 'backlog' || changes?.to === 'ready') {
        return `Task "${task.title}" moved to ${changes.to}. This task is now available to pick up.`;
      }
      return `Task "${task.title}" moved from ${changes?.from} to ${changes?.to}.`;
    case 'task.updated':
      return `Task "${task.title}" was updated. Priority: ${priorityLabel}. Column: ${task.columnId}.`;
    case 'task.deleted':
      return `Task "${task.title}" was deleted from the Kanban board.`;
    default:
      return `Kanban event: ${event} for task "${task.title}"`;
  }
}

// Send notification to Clawdbot via /hooks/agent endpoint
async function sendClawdbotNotification(event: WebhookEvent, task: TaskData, changes?: WebhookPayload['changes']) {
  const clawdbotUrl = process.env.CLAWDBOT_WEBHOOK_URL;
  const clawdbotToken = process.env.CLAWDBOT_HOOK_TOKEN;

  if (!clawdbotUrl || !clawdbotToken) {
    console.log('Clawdbot not configured, skipping notification');
    return;
  }

  // Skip notifications for tasks moved to 'done' (bot already handled it)
  // and for tasks moved to 'in-progress' (bot is already working on it)
  if (event === 'task.moved' && (changes?.to === 'done' || changes?.to === 'in-progress')) {
    console.log(`Skipping Clawdbot notification for task moved to ${changes?.to}`);
    return;
  }

  const message = formatClawdbotMessage(event, task, changes);

  try {
    const response = await fetch(`${clawdbotUrl}/hooks/agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${clawdbotToken}`,
      },
      body: JSON.stringify({
        message,
        name: 'Kanban',
        sessionKey: `hook:kanban:task-${task.id}`,
        deliver: false, // Don't echo to chat, just process
        model: 'anthropic/claude-sonnet-4-5',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`Clawdbot notification failed: ${error}`);
    } else {
      console.log(`Clawdbot notification sent: ${event} for task ${task.id}`);
    }
  } catch (error) {
    console.error('Clawdbot notification error:', error);
  }
}

// Send notification to Telegram
async function sendTelegramNotification(event: WebhookEvent, task: TaskData, changes?: WebhookPayload['changes']) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.log('Telegram not configured, skipping notification');
    return;
  }

  const message = formatTelegramMessage(event, task, changes);

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`Telegram notification failed: ${error}`);
    } else {
      console.log(`Telegram notification sent: ${event} for task ${task.id}`);
    }
  } catch (error) {
    console.error('Telegram notification error:', error);
  }
}

export async function sendWebhook(event: WebhookEvent, task: TaskData, changes?: WebhookPayload['changes']) {
  // Send to custom webhook URL if configured
  const webhookUrl = process.env.WEBHOOK_URL;
  const webhookToken = process.env.WEBHOOK_TOKEN;

  if (webhookUrl) {
    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      task,
      changes,
    };

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (webhookToken) {
        headers['Authorization'] = `Bearer ${webhookToken}`;
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error(`Webhook failed: ${response.status} ${response.statusText}`);
      } else {
        console.log(`Webhook sent: ${event} for task ${task.id}`);
      }
    } catch (error) {
      console.error('Webhook error:', error);
    }
  }

  // Send to Clawdbot if configured
  await sendClawdbotNotification(event, task, changes);

  // Send to Telegram if configured
  await sendTelegramNotification(event, task, changes);
}
