import { TextClient } from './generated/text.client';
import { TextResponse } from './generated/text';
import { MediaClient } from './generated/media.client';
import { MediaResponse } from './generated/media';
import { BlogClient } from './generated/blog.client';
import { BlogPostsResponse } from './generated/blog';
import { Empty } from './generated/google/protobuf/empty';
import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport';
import type { UnaryCall } from '@protobuf-ts/runtime-rpc';

// Set up the gRPC-Web transport and client
const transport = new GrpcWebFetchTransport({
  baseUrl: 'http://localhost:5109',
});
const grpcClient = new TextClient(transport);
const mediaClient = new MediaClient(transport); 
const blogClient = new BlogClient(transport); 

fetch("http://localhost:5109/test-cors").then(res => res.text()).then(console.log)

export async function fetchGrpcWeb(service: string, size: string): Promise<string> {
  const start = performance.now();

  if (service.toLowerCase() === 'text') {
    let grpcMethod: (input: Empty) => UnaryCall<Empty, TextResponse>;

    switch (size.toLowerCase()) {
      case 'small':
        grpcMethod = grpcClient.getSmall.bind(grpcClient);
        break;
      case 'medium':
        grpcMethod = grpcClient.getMedium.bind(grpcClient);
        break;
      case 'large':
        grpcMethod = grpcClient.getLarge.bind(grpcClient);
        break;
      default:
        throw new Error(`Invalid text size: ${size}`);
    }

    const req = Empty.create();

    // Call the method and get the response (now works with protobuf-ts)
    const call = grpcMethod(req);
    const response = await call.response;

    const end = performance.now();
    const timeMs = end - start;

    const content = response.content ?? '';
    const encoder = new TextEncoder();
    const byteSize = encoder.encode(content).length;

    return `Response Time: ${timeMs.toFixed(2)} ms\nPayload Size: ${byteSize} bytes\n\nPayload:\n${content}`;
  }

    if (service.toLowerCase() === 'media') {
    let grpcMethod: (input: Empty) => UnaryCall<Empty, MediaResponse>;

    switch (size.toLowerCase()) {
      case 'image':
        grpcMethod = mediaClient.getImage.bind(mediaClient);
        break;
      case 'audio':
        grpcMethod = mediaClient.getAudio.bind(mediaClient);
        break;
      case 'video':
        grpcMethod = mediaClient.getVideo.bind(mediaClient);
        break;
      default:
        throw new Error(`Invalid media type: ${size}`);
    }

    const req = Empty.create();
    const call = grpcMethod(req);
    const response = await call.response;

    const end = performance.now();
    const timeMs = end - start;

    const { data, contentType } = response;
    // Convert bytes to Blob, then to Object URL
    const blob = new Blob([data], { type: contentType });
    const url = URL.createObjectURL(blob);

    return `Response Time: ${timeMs.toFixed(2)} ms\nPayload Size: ${blob.size} bytes\nContent-Type: ${contentType}\n\nMedia URL: ${url}`;
  }

  if (service.toLowerCase() === 'blog') {
    const call = blogClient.getAll(Empty.create());
    const response: BlogPostsResponse = await call.response;

    const end = performance.now();
    const timeMs = end - start;

    const posts = response.posts ?? [];
    const encoder = new TextEncoder();

    const content = posts.map(p => {
      const sections = (p.sections ?? []).map(s => `### ${s.heading}\n${s.body}`).join('\n\n');
      return `Title: ${p.title}
Author: ${p.author?.name} <${p.author?.email}>
Published: ${p.publishedAt}
Tags: ${(p.metadata?.tags ?? []).join(', ')}
Word Count: ${p.metadata?.wordCount ?? 0}

${sections}`;
    }).join('\n\n---\n\n');

    const byteSize = encoder.encode(content).length;
    return `Response Time: ${timeMs.toFixed(2)} ms\nPayload Size: ${byteSize} bytes\n\n${content}`;
  }

  throw new Error(`Service not implemented: ${service}`);
}
