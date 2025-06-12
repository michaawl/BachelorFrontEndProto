import { useState, useEffect } from 'react';
import './App.css';
import { fetchService, fetchServiceParallel } from './api/dispatcher';

function App() {

  /// #### State Variablen ####

  const [apiType, setApiType] = useState('REST'); // gibt den API Typen: REST, GraphQL oder gRPC Web
  const [serviceType, setServiceType] = useState('Text'); // gibt den Service Type an: Test, Media oder Blog
  const [payloadSize, setPayloadSize] = useState('large'); // Services schicken verschiedene Datengrößen, gibt an wie groß die daten sein sollen
  const [output, setOutput] = useState<string>(''); // geinhaltet die Daten der Anfrage + Respond Time
  const [mediaUrl, setMediaUrl] = useState<string | null>(null); // Bei Media Anfrage: Extrahierte Media URL zur Anzeige des Mediums in Output
  const [mediaType, setMediaType] = useState<'image' | 'audio' | 'video' | null>(null); // Bei dedia Abfrage, können image, audio oder video daten abgefragt werden
  const [parallelCount, setParallelCount] = useState(1); // es können mehrere parallele requests gesendet werden, gibt Anzahl der zu sendenden Requests an

  // Wird Media ausgewählt oder abgewählt, muss der serviceType geändert werden
  useEffect(() => {
  if (serviceType === 'Media') {
    setPayloadSize('image');
  } else {
    setPayloadSize('large');
  }
}, [serviceType]);

  // Wird beim Klick auf den Fetch button aufgerufen und für den Response durch
  const handleFetch = async () => {
    setOutput(`Daten werden geladen: ${serviceType} (${payloadSize}) via ${apiType}...`);
    setMediaUrl(null);
    setMediaType(null);

    // Für parallele Requests
    if (parallelCount > 1) {
      const start = performance.now();

      try {
        const results = await fetchServiceParallel(
          apiType,
          serviceType,
          payloadSize,
          parallelCount
        );

        const end = performance.now();
        const timeMs = end - start;

        let resultText = '';
        let firstMediaUrl: string | null = null;
        let firstMediaType: 'image' | 'audio' | 'video' | null = null;

        results.forEach((result: string | Blob, idx) => {
          if (
            typeof result === 'string' &&
            serviceType.toLowerCase() === 'media' &&
            result.includes('Media URL:')
          ) {
            const url = result.split('Media URL: ')[1].trim();
            if (!firstMediaUrl) {
              firstMediaUrl = url;
              const type = payloadSize.toLowerCase();
              if (type === 'image' || type === 'audio' || type === 'video') {
                firstMediaType = type as 'image' | 'audio' | 'video';
              }
            }
          }
          resultText += `Request #${idx + 1}\n${typeof result === 'string' ? result : 'Unbekanntes Format'}\n\n`;
        });

        setOutput(
          `Parallel fetch (${parallelCount} requests):\nTotal Time: ${timeMs.toFixed(2)} ms\n\n` +
            resultText.trim()
        );

        if (firstMediaUrl && firstMediaType) {
          setMediaType(firstMediaType);
          setMediaUrl(firstMediaUrl);
        }
      } catch (err) {
        setOutput(`Error: ${String(err)}`);
      }
      return;
    }

    // Für einzelne Requests
    try {
      const result = await fetchService(apiType, serviceType, payloadSize);

      if (typeof result === 'string') {
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
    <div style={{ padding: '1rem', fontFamily: 'Arial', maxWidth: '600px' }}>
      <h1>API Performance Benchmark</h1>

      <div style={{ marginBottom: '1rem' }}>
        <label>
          API Type:
          <select value={apiType} onChange={(e) => setApiType(e.target.value)} style={{ marginLeft: '1rem' }}>
            <option value="REST">REST</option>
            <option value="GraphQL">GraphQL</option>
            <option value="gRPC-Web">gRPC-Web</option>
          </select>
        </label>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>
          Service Type:
          <select value={serviceType} onChange={(e) => setServiceType(e.target.value)} style={{ marginLeft: '1rem' }}>
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

      <div style={{ marginBottom: '1rem' }}>
        <label>
          Parallel Requests:&nbsp;
          <input
            type="number"
            min={1}
            max={20}
            value={parallelCount}
            onChange={e => setParallelCount(Number(e.target.value))}
            style={{ width: '4rem' }}
          />
        </label>
      </div>

      <button onClick={handleFetch} style={{ marginBottom: '1rem' }}>
        Fetch
      </button>

      <div>
        <label>Output:</label>
        <textarea
          value={output}
          readOnly
          rows={10}
          style={{ width: '100%', marginTop: '1rem', resize: 'none' }}
        />
      </div>

      {mediaUrl && mediaType === 'image' && (
        <div>
          <label>Image Preview:</label>
          <img src={mediaUrl} alt="Preview" style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }} />
        </div>
      )}

      {mediaUrl && mediaType === 'audio' && (
        <div>
          <label>Audio Preview:</label>
          <audio controls src={mediaUrl} style={{ width: '100%' }} />
        </div>
      )}

      {mediaUrl && mediaType === 'video' && (
        <div>
          <label>Video Preview:</label>
          <video controls src={mediaUrl} style={{ width: '100%', maxHeight: '400px' }} />
        </div>
      )}
    </div>
  );
}

export default App;
