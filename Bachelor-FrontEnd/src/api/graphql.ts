// src/api/graphql.ts

export async function fetchGraphQL(
  service: string,
  size: string
): Promise<string | Blob> {
  const url = 'http://localhost:5244/graphql';
  const start = performance.now();

  service = service.toLowerCase();
  size = size.toLowerCase();

  //
  // ─── BUILD THE QUERY STRING ──────────────────────────────────────────────────────
  //
  let gqlQuery: string;

  switch (service) {
    case 'text': {
      // We expect size ∈ { "small", "medium", "large" }.
      const validSizes = ['small', 'medium', 'large'];
      if (!validSizes.includes(size)) {
        throw new Error(`Invalid text size: ${size}`);
      }

      // The actual GraphQL field name is just “small”/“medium”/“large” (HotChocolate strips “Get”).
      gqlQuery = `
        query {
          ${size} {
            content
          }
        }
      `;
      break;
    }

    case 'blog': {
      // Your schema must have a root field called “blog” (or “getBlog”, depending on how you registered it).
      // If you wrote [ExtendObjectType(typeof(Query))] public class BlogQuery { public BlogPost[] Blog() … },
      // then the field is likely named “blog”. Adjust if needed.
      gqlQuery = `
        query {
          blog {
            title
            author {
              name
              email
            }
            sections {
              heading
              body
            }
          }
        }
      `;
      break;
    }

    case 'media': {
      // In your C# you probably have something like:
      //     public MediaPayload GetMedia(string type) { … }
      // But HotChocolate will register that field as just “media(type: String!)”.
      // So we call “media(type: "${size}")”
      const validMedia = ['image', 'audio', 'video'];
      if (!validMedia.includes(size)) {
        throw new Error(`Invalid media type: ${size}`);
      }
      gqlQuery = `
        query {
          media(type: "${size}") {
            url
          }
        }
      `;
      break;
    }

    default:
      throw new Error(`Unknown service for GraphQL: ${service}`);
  }

  //
  // ─── SEND THE REQUEST ─────────────────────────────────────────────────────────
  //
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

  //
  // ─── PROCESS “TEXT” CASE ──────────────────────────────────────────────────────
  //
  if (service === 'text') {
    // data[size] is { content: string }
    const textContent: string = data[size].content;
    const encoder = new TextEncoder();
    const byteSize = encoder.encode(textContent).length;

    return (
      `Response Time: ${timeMs.toFixed(2)} ms\n` +
      `Payload Size: ${byteSize} bytes\n\n` +
      `Payload:\n${textContent}`
    );
  }

  //
  // ─── PROCESS “BLOG” CASE ──────────────────────────────────────────────────────
  //
  if (service === 'blog') {
    type Section = { heading: string; body: string };
    type Author = { name: string; email: string };
    type BlogPost = { title: string; author: Author; sections: Section[] };

    // data.blog is an array of BlogPost
    const posts: BlogPost[] = data.blog;
    const content = posts
      .map((p) => {
        const allSections = p.sections
          .map((s) => `### ${s.heading}\n${s.body}`)
          .join('\n\n');
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

  //
  // ─── PROCESS “MEDIA” CASE ──────────────────────────────────────────────────────
  //
  if (service === 'media') {
    // data.media.url is something like “http://localhost:5244/files/xyz.png”
    const mediaUrl: string = data.media.url;
    const mediaResponse = await fetch(mediaUrl);
    if (!mediaResponse.ok) {
      throw new Error(`Failed to download media from ${mediaUrl}`);
    }
    const blob = await mediaResponse.blob();
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
