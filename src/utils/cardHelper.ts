import answerCardTemplate from '../cards/answerCard.json';
import ticketSuccessCardTemplate from '../cards/ticketSuccess.json';

export interface AdaptiveCard {
  type: string;
  [property: string]: unknown;
}

export interface AnswerCardData {
  title: string;
  explanation: string;
  citationUrl: string;
}

export interface TicketSuccessCardData {
  successMessage: string;
  ticketId: string;
  status: string;
  ticketUrl: string;
}

/**
 * Replaces `${property}` placeholders in an Adaptive Card template.
 */
export function populateCardTemplate<T extends object>(
  template: T,
  data: object,
): T {
  return populateValue(
    JSON.parse(JSON.stringify(template)) as T,
    data,
  ) as T;
}

export function createAnswerCard(data: AnswerCardData): AdaptiveCard {
  return populateCardTemplate(answerCardTemplate, data) as AdaptiveCard;
}

export function createTicketSuccessCard(
  data: TicketSuccessCardData,
): AdaptiveCard {
  return populateCardTemplate(
    ticketSuccessCardTemplate,
    data,
  ) as AdaptiveCard;
}

function populateValue(value: unknown, data: object): unknown {
  if (typeof value === 'string') {
    return value.replace(/\$\{([^}]+)\}/g, (_, property: string) => {
      const replacement = (data as Record<string, unknown>)[property];
      return replacement === undefined ? '' : String(replacement);
    });
  }

  if (Array.isArray(value)) {
    return value.map((item) => populateValue(item, data));
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, childValue]) => [
        key,
        populateValue(childValue, data),
      ]),
    );
  }

  return value;
}
