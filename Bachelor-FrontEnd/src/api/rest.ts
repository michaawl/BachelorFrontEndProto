export async function fetchRest(service: string, size: string): Promise<string | Blob> {
  
  // Define URL
  let url = `https://localhost:7001/${service.toLowerCase()}/${size.toLowerCase()}`;

  if (service.toLowerCase() === 'media') {
    const mediaType = ['image', 'audio', 'video'];
    if (!mediaType.includes(size.toLowerCase())) {
      throw new Error(`Invalid media type: ${size}`);
    }

    url = `https://localhost:7001/media/${size.toLowerCase()}`;
  }

  if (service.toLowerCase() === 'blog') {
    url = `https://localhost:7001/api/blog`;
  }

  // Fetch data 
  const start = performance.now();
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`REST fetch failed with status ${response.status}`);
  }

  /// Parse TEXT
  if (service.toLowerCase() === 'text') {
    const json = await response.json();
    const end = performance.now();

    const timeInMs = end - start;
    const encoder = new TextEncoder();
    const byteSize = encoder.encode(json.content).length;

    return `Response Time: ${timeInMs.toFixed(2)} ms\nPayload Size: ${byteSize} bytes\n\nPayload:\n${json.content}`;
  }

// PARSE BLOG
  if (service.toLowerCase() === 'blog') {
    const posts: any[] = await response.json();
    const end = performance.now();

    const timeInMs = end - start;
    const lines: string[] = [];

    for (const p of posts) {
      lines.push(`Id: ${p.id}`);
      lines.push(`Title: ${p.title}`);
      if (p.author) {
        lines.push(`Author: ${p.author.name} <${p.author.email}>`);
      }
      if (p.publishedAt) {
        lines.push(`PublishedAt: ${p.publishedAt}`);
      }

      if (Array.isArray(p.sections)) {
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

    return `Response Time: ${timeInMs} ms\n` +
           `Payload Size: ${byteSize} bytes\n\n` +
           content;
  }

  /// Parse MEDIA
  const blob = await response.blob();
  const byteSize = blob.size;
  const end = performance.now();

  const timeInMs = end - start;

  const objectUrl = URL.createObjectURL(blob);

  return `Response Time: ${timeInMs.toFixed(2)} ms\nPayload Size: ${byteSize} bytes\n\nMedia URL: ${objectUrl}`;
}
