import { TextClient } from './generated/text.client';
import { TextResponse } from './generated/text';
import { MediaClient } from './generated/media.client';
import { BlogClient } from './generated/blog.client';
import { Empty } from './generated/google/protobuf/empty';
import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport';
import type { UnaryCall, ServerStreamingCall, RpcOptions } from '@protobuf-ts/runtime-rpc';
import type { Chunk } from './generated/media';

const transport = new GrpcWebFetchTransport({
  baseUrl: 'https://localhost:7178',
});

// Define Clients
const textClient = new TextClient(transport);
const mediaClient = new MediaClient(transport);
const blogClient = new BlogClient(transport);

export async function fetchGrpcWeb(service: string, size: string): Promise<string> {
  // ##### FETCH TEXT #####
  if (service.toLowerCase() === 'text') {
    let grpcMethod: (input: Empty) => UnaryCall<Empty, TextResponse>;
    switch (size.toLowerCase()) {
      case 'small':
        grpcMethod = textClient.getSmall.bind(textClient);
        break;
      case 'medium':
        grpcMethod = textClient.getMedium.bind(textClient);
        break;
      case 'large':
        grpcMethod = textClient.getLarge.bind(textClient);
        break;
      default:
        throw new Error(`Invalid text size: ${size}`);
    }
    const req = Empty.create();
    const start = performance.now();
    const call = grpcMethod(req);
    const response = await call.response;
    const end = performance.now();
    const content = response.content ?? '';
    const encoder = new TextEncoder();
    const byteSize = encoder.encode(content).length;
    return `Response Time: ${ (end - start).toFixed(2) } ms\nPayload Size: ${ byteSize } bytes\n\nPayload:\n${ content }`;
  }

  // ##### FETCH MEDIA #####
  if (service.toLowerCase() === 'media') {
    let grpcMethod: (input: Empty, options?: RpcOptions) => ServerStreamingCall<Empty, Chunk>;
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
    const start = performance.now();
    const call = grpcMethod(req);
    const chunks: Uint8Array[] = [];
    for await (const msg of call.responses) {
      chunks.push(msg.data);
    }
    const end = performance.now();
    const full = chunks.reduce((acc, cur) => {
      const buffer = new Uint8Array(acc.length + cur.length);
      buffer.set(acc, 0);
      buffer.set(cur, acc.length);
      return buffer;
    }, new Uint8Array());
    const blob = new Blob([full], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    return `Response Time: ${ (end - start).toFixed(2) } ms\nPayload Size: ${ full.byteLength } bytes\n\nMedia URL: ${ url }`;
  }

  // FETCH BLOG
  // ##### FETCH BLOG #####
  if (service.toLowerCase() === 'blog') {
    const req = Empty.create();
    const start = performance.now();
    const resp = await blogClient.getAll(req).response;
    const end = performance.now();

    const posts = resp.posts ?? [];
    const lines: string[] = [];

    for (const p of posts) {
      lines.push(`Id: ${p.id}`);
      lines.push(`Title: ${p.title}`);
      if (p.author) lines.push(`Author: ${p.author.name} <${p.author.email}>`);

      if (p.publishedAt) {
  lines.push(`PublishedAt: ${new Date(Number(p.publishedAt.seconds) * 1000).toISOString()}`);
}


      if (p.sections) {
        for (const s of p.sections) {
          lines.push(`\n### ${s.heading}`);
          lines.push(s.body);
        }
      }

      if (p.numbers) {
        lines.push(`\nNumbers:`);
        lines.push(`  NumberOne: ${p.numbers.numberOne}`);
        lines.push(`  NumberTwo: ${p.numbers.numberTwo}`);
        lines.push(`  NumberThree: ${p.numbers.numberThree}`);
        lines.push(`  NumberFour: ${p.numbers.numberFour}`);
      }

      if (p.metadata) {
        lines.push(`\nMetadata:`);
        lines.push(`  Tags: ${(p.metadata.tags ?? []).join(', ')}`);
        lines.push(`  WordCount: ${p.metadata.wordCount}`);
      }

      lines.push('\n---');
    }

    const content = lines.join('\n');
    const byteSize = new TextEncoder().encode(content).length;
    return `Response Time: ${(end - start).toFixed(2)} ms\nPayload Size: ${byteSize} bytes\n\n${content}`;
  }

  throw new Error(`Service not implemented: ${service}`);
}