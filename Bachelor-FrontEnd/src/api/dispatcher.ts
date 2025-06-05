import { fetchRest } from './rest';
import { fetchGraphQL } from './graphql';

export async function fetchService(api: string, service: string, size: string): Promise<string | Blob> {

  switch (api) {
    case 'REST':
      return await fetchRest(service, size);
 case 'GraphQL':
      return await fetchGraphQL(service, size);
    default:
      throw new Error(`Unknown API type: ${api}`);
  }
}
