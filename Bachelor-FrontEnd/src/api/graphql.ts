export async function fetchGraphQL(
  service: string,
  size: string
): Promise<string | Blob> {

  // Define URL
  const url = 'https://localhost:7046/graphql';

  service = service.toLowerCase();
  size = size.toLowerCase();

  // Define query

  let gqlQuery: string;

  switch (service) {
    // ##### TEXT QUERY #####
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

    // ##### BLOG QUERY #####

    case 'blog': {
      gqlQuery = `
        query {
          posts {
            id
            title
            author { name email }
            sections { heading body }
            numbers { numberOne numberTwo numberThree numberFour }
            metadata { tags wordCount }
            publishedAt
          }
        }
      `;
      break;
    }

   // ##### MEDIA QUERY #####

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

  
  // Fetch Data

  const start = performance.now();
    
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: gqlQuery }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL fetch failed with status ${response.status}`);
  }

  const payload = await response.json();

  const end = performance.now();
  const timeInMs = end - start;

  const data = payload.data;


  // ##### HANDLE TEXT DATA #####

  if (service === 'text') {
    const textContent: string = data[size].content;
    const encoder = new TextEncoder();
    const byteSize = encoder.encode(textContent).length;
    return (
      `Response Time: ${timeInMs.toFixed(2)} ms\n` +
      `Payload Size: ${byteSize} bytes\n\n` +
      `Payload:\n${textContent}`
    );
  }

  // ##### HANDLE BLOG DATA ##### 

 if (service === 'blog') {
    type Section = { heading: string; body: string };
    type Author = { name: string; email: string };
    type Numbers = { numberOne: number; numberTwo: number; numberThree: number; numberFour: number };
    type Metadata = { tags: string[]; wordCount: number };
    type Post = {
      id: number;
      title: string;
      author: Author;
      sections: Section[];
      numbers: Numbers;
      metadata: Metadata;
      publishedAt: string;
    };

    const posts: Post[] = data.posts;
    const lines: string[] = [];
    for (const p of posts) {
      lines.push(`Id: ${p.id}`);
      lines.push(`Title: ${p.title}`);
      lines.push(`Author: ${p.author.name} <${p.author.email}>`);
      lines.push(`PublishedAt: ${p.publishedAt}`);
      for (const s of p.sections) {
        lines.push(`\n### ${s.heading}`);
        lines.push(s.body);
      }
      lines.push(`\nNumbers:`);
      lines.push(`  NumberOne: ${p.numbers.numberOne}`);
      lines.push(`  NumberTwo: ${p.numbers.numberTwo}`);
      lines.push(`  NumberThree: ${p.numbers.numberThree}`);
      lines.push(`  NumberFour: ${p.numbers.numberFour}`);
      lines.push(`\nMetadata:`);
      lines.push(`  Tags: ${p.metadata.tags.join(', ')}`);
      lines.push(`  WordCount: ${p.metadata.wordCount}`);
      lines.push('\n---');
    }
    const content = lines.join('\n');
    const byteSize = new TextEncoder().encode(content).length;
    return `Response Time: ${timeInMs} ms\n` +
           `Payload Size: ${byteSize} bytes\n\n` +
           content;
  }


    // ##### HANDLE MEDIA DATA #####
  if (service === 'media') {
    const raw = data[size];
    let byteArray: Uint8Array;

    if (typeof raw === 'string') {
      let fixedBase64 = raw.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '');
      while (fixedBase64.length % 4) fixedBase64 += '=';
      byteArray = Uint8Array.from(atob(fixedBase64), c => c.charCodeAt(0));
    } else if (Array.isArray(raw)) {
      byteArray = new Uint8Array(raw);
    } else {
      throw new Error(`Unexpected media type: ${typeof raw}`);
    }

  const mime = size === 'image' ? 'image/jpeg'
    : size === 'audio' ? 'audio/wav'
    : size === 'video' ? 'video/mp4'
    : 'application/octet-stream';

  const blob = new Blob([byteArray], { type: mime });
  const byteSize = blob.size;
  const objectUrl = URL.createObjectURL(blob);

  return `Response Time: ${timeInMs.toFixed(2)} ms\nPayload Size: ${byteSize} bytes\n\nMedia URL: ${objectUrl}`;
}

  throw new Error('Service unbekannt');
}
