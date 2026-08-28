import { ConfidentialClientApplication } from '@azure/msal-node';
import { Client } from '@microsoft/microsoft-graph-client';

const GRAPH_SCOPE = 'https://graph.microsoft.com/.default';

export interface KnowledgeBaseDocument {
  title: string;
  snippet: string;
  webUrl: string;
}

interface GraphSearchFields {
  [key: string]: unknown;
}

interface GraphSearchResource {
  name?: string;
  webUrl?: string;
  fields?: GraphSearchFields;
  listItem?: {
    fields?: GraphSearchFields;
  };
}

interface GraphSearchHit {
  summary?: string;
  hitHighlights?: string | string[];
  resource?: GraphSearchResource;
}

interface GraphSearchResponse {
  value?: Array<{
    hitsContainers?: Array<{
      hits?: GraphSearchHit[];
    }>;
  }>;
}

export class GraphService {
  private readonly client: Client;
  private readonly siteId: string;
  private readonly msalClient: ConfidentialClientApplication;

  constructor() {
    const tenantId = requiredEnvironmentVariable('GRAPH_TENANT_ID');
    const clientId = requiredEnvironmentVariable('GRAPH_CLIENT_ID');
    const clientSecret = requiredEnvironmentVariable('GRAPH_CLIENT_SECRET');

    this.siteId = requiredEnvironmentVariable('SHAREPOINT_SITE_ID');
    this.msalClient = new ConfidentialClientApplication({
      auth: {
        authority: `https://login.microsoftonline.com/${tenantId}`,
        clientId,
        clientSecret,
      },
    });

    this.client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: async () => this.getAccessToken(),
      },
    });
  }

  /**
   * Searches the configured SharePoint site using Microsoft Graph Search.
   */
  async searchKnowledgeBase(query: string): Promise<KnowledgeBaseDocument[]> {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return [];
    }

    try {
      const response = (await this.client
        .api('/search/query')
        .version('v1.0')
        .post({
          requests: [
            {
              entityTypes: ['driveItem'],
              from: 0,
              query: {
                queryString: `${normalizedQuery} AND SiteID:${this.siteId}`,
              },
              size: 3,
              fields: ['name', 'webUrl', 'title', 'FileName', 'Url'],
            },
          ],
        })) as GraphSearchResponse;

      return this.extractDocuments(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Knowledge base search failed: ${message}`, {
        cause: error,
      });
    }
  }

  private async getAccessToken(): Promise<string> {
    const result = await this.msalClient.acquireTokenByClientCredential({
      scopes: [GRAPH_SCOPE],
    });

    if (!result?.accessToken) {
      throw new Error('Microsoft Graph did not return an access token.');
    }

    return result.accessToken;
  }

  private extractDocuments(
    response: GraphSearchResponse,
  ): KnowledgeBaseDocument[] {
    const hits =
      response.value?.flatMap((container) =>
        container.hitsContainers?.flatMap((hitsContainer) => hitsContainer.hits ?? []) ?? [],
      ) ?? [];

    return hits.slice(0, 3).map((hit) => {
      const resource = hit.resource ?? {};
      const fields = resource.listItem?.fields ?? resource.fields ?? {};

      return {
        title:
          textValue(fields.title) ??
          textValue(fields.name) ??
          textValue(fields.FileName) ??
          textValue(resource.name) ??
          'Untitled document',
        snippet: this.extractSnippet(hit),
        webUrl:
          textValue(fields.webUrl) ??
          textValue(fields.Url) ??
          textValue(resource.webUrl) ??
          '',
      };
    });
  }

  private extractSnippet(hit: GraphSearchHit): string {
    if (Array.isArray(hit.hitHighlights)) {
      return hit.hitHighlights.join(' … ');
    }

    return hit.hitHighlights ?? hit.summary ?? '';
  }
}

function requiredEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function textValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}
