export async function fetchRest(service: string, size: string): Promise<string | Blob> {
  let url = `http://localhost:5125/${service.toLowerCase()}/${size.toLowerCase()}`;

  if (service.toLowerCase() === 'media') {
    const validTypes = ['image', 'audio', 'video'];
    if (!validTypes.includes(size.toLowerCase())) {
      throw new Error(`Invalid media type: ${size}`);
    }

    url = `http://localhost:5125/media/${size.toLowerCase()}`;
  }

  if (service.toLowerCase() === 'blog') {
    // Always get all blog posts
    url = `http://localhost:5125/api/blog`;
  }

  const start = performance.now();
  const response = await fetch(url);
  const end = performance.now();

  const timeMs = end - start;

  if (!response.ok) {
    throw new Error(`REST fetch failed with status ${response.status}`);
  }

  /// TEXT

  if (service.toLowerCase() === 'text') {
    const json = await response.json();
    const encoder = new TextEncoder();
    const byteSize = encoder.encode(json.content).length;

    return `Response Time: ${timeMs.toFixed(2)} ms\nPayload Size: ${byteSize} bytes\n\nPayload:\n${json.content}`;
  }

  /// BLOG
  if (service.toLowerCase() === 'blog') {
    const posts = await response.json();
    const encoder = new TextEncoder();

    const content = posts.map((p: any) => {
      const sections = p.sections.map((s: any) => `### ${s.heading}\n${s.body}`).join('\n\n');
      return `Title: ${p.title}\nAuthor: ${p.author.name} <${p.author.email}>\n\n${sections}`;
    }).join('\n\n---\n\n');

    const byteSize = encoder.encode(content).length;

    return `Response Time: ${timeMs.toFixed(2)} ms\nPayload Size: ${byteSize} bytes\n\n${content}`;
  }

  /// MEDIA
  const blob = await response.blob();
  const byteSize = blob.size;
  const objectUrl = URL.createObjectURL(blob);

  return `Response Time: ${timeMs.toFixed(2)} ms\nPayload Size: ${byteSize} bytes\n\nMedia URL: ${objectUrl}`;
}
