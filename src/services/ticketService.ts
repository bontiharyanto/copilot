export interface Ticket {
  ticketId: string;
  status: 'Created';
  ticketUrl: string;
  description: string;
}

/**
 * Simulates creating a support ticket through a Power Automate webhook.
 */
export async function createTicket(description: string): Promise<Ticket> {
  const normalizedDescription = description.trim();

  if (!normalizedDescription) {
    throw new Error('A ticket description is required.');
  }

  await new Promise((resolve) => setTimeout(resolve, 150));

  const ticketId = `MOCK-${Date.now()}`;
  const ticketBaseUrl =
    process.env.TICKETING_BASE_URL ?? 'https://example.invalid/tickets';

  return {
    ticketId,
    status: 'Created',
    ticketUrl: `${ticketBaseUrl.replace(/\/$/, '')}/${ticketId}`,
    description: normalizedDescription,
  };
}
