// src/api/graphql.ts

/**
 * Fetch from GraphQL the same way your REST fetch does,
 * but adapted for Text (small/medium/large), Blog, and now Image|Audio|Video.
 */

export async function fetchGraphQL(
  service: string,
  size: string
): Promise<string | Blob> {
  // Your HotChocolate endpoint
  const url = 'http://localhost:5244/graphql';

  const start = performance.now();
  service = service.toLowerCase();
  size = size.toLowerCase();

  let gqlQuery: string;

  switch (service) {
    // ─── TEXT CASE ─────────────────────────────────────────────────────
    case 'text': {
      const validSizes = ['small', 'medium', 'large'];
      if (!validSizes.includes(size)) {
        throw new Error(`Invalid text size: ${size}`);
      }
      gqlQuery = `
        query {
          ${size} {
            content
          }
        }
      `;
      break;
    }

    // ─── BLOG CASE ─────────────────────────────────────────────────────
    case 'blog': {
      // We now query `posts { … }` instead of `blog { … }`
      gqlQuery = `
        query {
          posts {
            id
            title
            author {
              name
              email
            }
            sections {
              heading
              body
            }
            media {
              imageUrl
              audioUrl
              videoUrl
            }
            metadata {
              tags
              wordCount
            }
            publishedAt
          }
        }
      `;
      break;
    }

   // ─── MEDIA CASE ────────────────────────────────────────────────────
    case 'media': {
      const validMedia = ['image', 'audio', 'video'];
      if (!validMedia.includes(size)) {
        throw new Error(`Invalid media type: ${size}`);
      }
      gqlQuery = `
        query {
          ${size}
        }
      `;
      break;
    }

    default:
      throw new Error(`Unknown service for GraphQL: ${service}`);
  }

  // ─── SEND GRAPHQL REQUEST ─────────────────────────────────────────────
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: gqlQuery }),
  });

  const end = performance.now();
  const timeMs = end - start;

  if (!response.ok) {
    throw new Error(`GraphQL fetch failed with status ${response.status}`);
  }

  const payload = await response.json();
  if (payload.errors && Array.isArray(payload.errors)) {
    console.error('GraphQL errors:', payload.errors);
    throw new Error(
      `GraphQL error: ${payload.errors.map((e: any) => e.message).join('; ')}`
    );
  }

  const data = payload.data;

  // ─── HANDLE TEXT SERVICE ────────────────────────────────────────────────
  if (service === 'text') {
    const textContent: string = data[size].content;
    const encoder = new TextEncoder();
    const byteSize = encoder.encode(textContent).length;
    return (
      `Response Time: ${timeMs.toFixed(2)} ms\n` +
      `Payload Size: ${byteSize} bytes\n\n` +
      `Payload:\n${textContent}`
    );
  }

  /// ─── HANDLE BLOG SERVICE ────────────────────────────────────────────────
  if (service === 'blog') {
    type Section = { heading: string; body: string };
    type Author = { name: string; email: string };
    type Media = { imageUrl: string | null; audioUrl: string | null; videoUrl: string | null };
    type Metadata = { tags: string[]; wordCount: number };
    type BlogPost = {
      id: number;
      title: string;
      author: Author;
      sections: Section[];
      media: Media;
      metadata: Metadata;
      publishedAt: string;
    };

    // Pull "posts" out of the GraphQL response
    const posts: BlogPost[] = data.posts;

    // Re‐assemble into the same plain‐text format your REST version used
    const content = posts
      .map((p) => {
        // Join all sections as Markdown‐style subsections
        const allSections =
          p.sections
            .map((s) => `### ${s.heading}\n${s.body}`)
            .join('\n\n');

        // (Optionally, if you care, you could also include media URLs or metadata tags here.
        //  For parity with your REST formatting, I'm only doing title/author/sections.)

        return (
          `Title: ${p.title}\n` +
          `Author: ${p.author.name} <${p.author.email}>\n\n` +
          allSections
        );
      })
      .join('\n\n---\n\n');

    const encoder = new TextEncoder();
    const byteSize = encoder.encode(content).length;

    return (
      `Response Time: ${timeMs.toFixed(2)} ms\n` +
      `Payload Size: ${byteSize} bytes\n\n` +
      content
    );
  }


  // ─── HANDLE MEDIA SERVICE ───────────────────────────────────────────────
  if (service === 'media') {
    const raw = data[size]; // Could be a URL-safe Base64 string or an array of numbers
    let blob: Blob;

    if (typeof raw === 'string') {
      // 1) Convert URL-safe Base64 → standard Base64
      let base64 = raw.replace(/-/g, '+').replace(/_/g, '/');
      // Add padding so length % 4 === 0
      switch (base64.length % 4) {
        case 2:
          base64 += '==';
          break;
        case 3:
          base64 += '=';
          break;
      }
      // 2) Decode to a binary string
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      // 3) Create a blob with the correct MIME type:
      if (size === 'image') {
        // JPG or PNG in your Common project—use "image/jpeg" if it's a JPG
        blob = new Blob([byteArray], { type: 'image/jpeg' });
      } else if (size === 'audio') {
        // WAV
        blob = new Blob([byteArray], { type: 'audio/wav' });
      } else {
        // size === 'video'  → MP4
        blob = new Blob([byteArray], { type: 'video/mp4' });
      }
    } else if (Array.isArray(raw)) {
      // If raw is already an array of bytes (number[]), directly wrap it
      const byteArray = new Uint8Array(raw);
      if (size === 'image') {
        blob = new Blob([byteArray], { type: 'image/jpeg' });
      } else if (size === 'audio') {
        blob = new Blob([byteArray], { type: 'audio/wav' });
      } else {
        blob = new Blob([byteArray], { type: 'video/mp4' });
      }
    } else {
      throw new Error('Unexpected media payload format');
    }

    const byteSize = blob.size;
    const objectUrl = URL.createObjectURL(blob);

    return (
      `Response Time: ${timeMs.toFixed(2)} ms\n` +
      `Payload Size: ${byteSize} bytes\n\n` +
      `Media URL: ${objectUrl}`
    );
  }

  throw new Error('Unreachable: unknown service');
}
