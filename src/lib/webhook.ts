// Webhook utility for notifying external services of task changes

type WebhookEvent = 'task.created' | 'task.updated' | 'task.deleted' | 'task.moved';

interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  task: {
    id: string;
    title: string;
    description?: string | null;
    priority: string;
    columnId: string;
  };
  changes?: {
    from?: string;
    to?: string;
  };
}

export async function sendWebhook(event: WebhookEvent, task: WebhookPayload['task'], changes?: WebhookPayload['changes']) {
  const webhookUrl = process.env.WEBHOOK_URL;
  const webhookToken = process.env.WEBHOOK_TOKEN;

  if (!webhookUrl) {
    console.log('No WEBHOOK_URL configured, skipping webhook');
    return;
  }

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
