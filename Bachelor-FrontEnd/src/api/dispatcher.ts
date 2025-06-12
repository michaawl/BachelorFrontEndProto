import { fetchRest } from './rest';
import { fetchGraphQL } from './graphql';
import { fetchGrpcWeb } from './grpcweb';

export async function fetchService(
  api: string,
  service: string,
  size: string
): Promise<string | Blob> {
  switch (api) {
    case 'REST':
      return await fetchRest(service, size);
    case 'GraphQL':
      return await fetchGraphQL(service, size);
    case 'gRPC-Web':
      return await fetchGrpcWeb(service, size);
    default:
      throw new Error(`Unknown API type: ${api}`);
  }
}

// Parallel helper for N requests at once!
export async function fetchServiceParallel(
  api: string,
  service: string,
  size: string,
  count: number
): Promise<Array<string | Blob>> {
  return await Promise.all(
    Array.from({ length: count }, () => fetchService(api, service, size))
  );
}
