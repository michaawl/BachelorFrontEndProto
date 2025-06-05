import { useState, useEffect } from 'react';
import './App.css';
import { fetchService } from './api/dispatcher.ts';

function App() {
  const [apiType, setApiType] = useState('REST');
  const [serviceType, setServiceType] = useState('Text');
  const [payloadSize, setPayloadSize] = useState('large');
  const [output, setOutput] = useState<string>('');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'audio' | 'video' | null>(null);

  // Reset payload size when switching service type
  useEffect(() => {
    if (serviceType === 'Media') {
      setPayloadSize('image');
    } else {
      setPayloadSize('large');
    }
  }, [serviceType]);

  const handleFetch = async () => {
    setOutput(`Fetching ${serviceType} (${payloadSize}) via ${apiType}...`);
    setMediaUrl(null);
    setMediaType(null);

    try {
      const result = await fetchService(apiType, serviceType, payloadSize);

      if (typeof result === 'string') {
        // Media handling
        if (serviceType.toLowerCase() === 'media' && result.includes('Media URL:')) {
          const url = result.split('Media URL: ')[1].trim();
          const type = payloadSize.toLowerCase();

          if (type === 'image' || type === 'audio' || type === 'video') {
            setMediaType(type as 'image' | 'audio' | 'video');
            setMediaUrl(url);
          }
        }

        setOutput(result);
      } else {
        setOutput('Received unknown format');
      }
    } catch (err) {
      setOutput(`Error: ${String(err)}`);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial', maxWidth: '600px' }}>
      <h1>API Performance Benchmark</h1>

      <div style={{ marginBottom: '1rem' }}>
        <label>
          API Type:
          <select value={apiType} onChange={(e) => setApiType(e.target.value)} style={{ marginLeft: '0.5rem' }}>
            <option value="REST">REST</option>
            <option value="GraphQL">GraphQL</option>
            <option value="gRPC-Web">gRPC-Web</option>
          </select>
        </label>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>
          Service Type:
          <select value={serviceType} onChange={(e) => setServiceType(e.target.value)} style={{ marginLeft: '0.5rem' }}>
            <option value="Text">Text</option>
            <option value="Media">Media</option>
            <option value="Blog">Blog</option>
          </select>
        </label>
      </div>

      {serviceType !== 'Blog' && (
  <div style={{ marginBottom: '1rem' }}>
    <label>
      {serviceType === 'Media' ? 'Media Type:' : 'Payload Size:'}
      <select
        value={payloadSize}
        onChange={(e) => setPayloadSize(e.target.value)}
        style={{ marginLeft: '0.5rem' }}
      >
        {serviceType === 'Media' ? (
          <>
            <option value="image">Image</option>
            <option value="audio">Audio</option>
            <option value="video">Video</option>
          </>
        ) : (
          <>
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </>
        )}
      </select>
    </label>
  </div>
)}


      <button onClick={handleFetch} style={{ marginBottom: '1rem' }}>
        Fetch
      </button>

      <div>
        <label>Output:</label>
        <textarea
          value={output}
          readOnly
          rows={10}
          style={{ width: '100%', marginTop: '0.5rem', resize: 'none' }}
        />
      </div>

      {/* Media previews */}
      {mediaUrl && mediaType === 'image' && (
        <div style={{ marginTop: '1rem' }}>
          <label>Image Preview:</label>
          <img src={mediaUrl} alt="Preview" style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }} />
        </div>
      )}

      {mediaUrl && mediaType === 'audio' && (
        <div style={{ marginTop: '1rem' }}>
          <label>Audio Preview:</label>
          <audio controls src={mediaUrl} style={{ width: '100%' }} />
        </div>
      )}

      {mediaUrl && mediaType === 'video' && (
        <div style={{ marginTop: '1rem' }}>
          <label>Video Preview:</label>
          <video controls src={mediaUrl} style={{ width: '100%', maxHeight: '400px' }} />
        </div>
      )}
    </div>
  );
}

export default App;
