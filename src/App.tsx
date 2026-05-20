import React from 'react';
import { useEffect, useState, useRef } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Download, Search, KeyRound, AlertCircle, Loader2 } from 'lucide-react';

interface ResultItem {
  link: string;
}

interface TopicResult {
  topic: string;
  items: ResultItem[];
}

export default function App() {
  const [isSetup, setIsSetup] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [cx, setCx] = useState('');
  const [topicsText, setTopicsText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<TopicResult[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('school_api_key');
    const savedCx = localStorage.getItem('school_cx');
    if (savedKey && savedCx) {
      setApiKey(savedKey);
      setCx(savedCx);
      setIsSetup(true);
    }
  }, []);

  const handleSetup = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!apiKey.trim() || !cx.trim()) {
      alert('Por favor, completa ambos campos.');
      return;
    }
    localStorage.setItem('school_api_key', apiKey.trim());
    localStorage.setItem('school_cx', cx.trim());
    setIsSetup(true);
  };

  const handleLogout = () => {
    if (confirm('¿Quieres cambiar las llaves de configuración?')) {
      localStorage.removeItem('school_api_key');
      localStorage.removeItem('school_cx');
      setIsSetup(false);
      setApiKey('');
      setCx('');
      setResults([]);
      setTopicsText('');
    }
  };

  const getTopics = (text: string) => {
    return text.split(/,|\n|  +/).map(t => t.trim()).filter(t => t.length > 0);
  };

  const handleSearch = async () => {
    const topics = getTopics(topicsText);
    if (topics.length === 0) {
      alert('Escribe al menos un tema.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);
    const newResults: TopicResult[] = [];

    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i];
      setLoadingText(`Buscando "${topic}" (${i + 1}/${topics.length})...`);

      try {
        const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(topic)}&searchType=image&num=10`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
          throw new Error(`Google dice: ${data.error.message} (${data.error.status})`);
        }

        if (data.items && data.items.length > 0) {
          newResults.push({ topic, items: data.items });
        } else {
          newResults.push({ topic, items: [] });
        }
      } catch (err: any) {
        setError(prev => (prev ? prev + '\n' : '') + `Error en "${topic}": ${err.message}`);
      }
    }

    setResults(newResults);
    setIsLoading(false);
  };

  const handleDownload = async () => {
    if (results.length === 0) return;

    setIsDownloading(true);
    const zip = new JSZip();

    for (const res of results) {
      if (res.items.length === 0) continue;
      const folderName = res.topic.replace(/[^a-z0-9]/gi, '_');
      const folder = zip.folder(folderName);

      if (!folder) continue;

      for (let i = 0; i < res.items.length; i++) {
        try {
          const imgUrl = res.items[i].link;
          const response = await fetch(imgUrl);
          const blob = await response.blob();
          const ext = imgUrl.split('.').pop()?.split(/[?#]/)[0] || 'jpg';
          folder.file(`imagen_${i + 1}.${ext}`, blob);
        } catch (e) {
          console.warn('No se pudo descargar una imagen', e);
        }
      }
    }

    try {
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "investigacion_escolar.zip");
    } catch (e) {
      console.error("Error generating zip", e);
      alert("Hubo un error al generar el archivo zip.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isSetup) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <img
            src="https://www.gstatic.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png"
            alt="Google"
            className="h-8 mx-auto mb-6"
          />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Configuración del Buscador</h2>
          <p className="text-gray-600 mb-6 text-sm">
            Para que la app funcione, pega la <strong>API Key</strong> y el <strong>CX</strong> que funcionaron en tu prueba de Claude.
          </p>

          <form onSubmit={handleSetup} className="space-y-4">
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="Pega aquí tu API Key (AIza...)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
            <input
              type="text"
              value={cx}
              onChange={e => setCx(e.target.value)}
              placeholder="Pega aquí tu CX (Search Engine ID)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />

            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              🚀 Guardar y Empezar
            </button>
          </form>

          <div className="mt-6 text-xs text-gray-500 flex justify-center gap-2">
            <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="hover:text-blue-500 underline">Obtener API Key</a>
            <span>|</span>
            <a href="https://programmablesearchengine.google.com/controlpanel/all" target="_blank" rel="noreferrer" className="hover:text-blue-500 underline">Obtener CX</a>
          </div>
        </div>
      </div>
    );
  }

  const hasImagesToDownload = results.some(r => r.items.length > 0);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <div className="fixed top-4 right-4 z-10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 transition-colors"
        >
          <KeyRound size={16} />
          Cambiar Llaves
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <header className="text-center mb-8 pb-6 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-blue-500 mb-2">Buscador Escolar Pro</h1>
          <p className="text-gray-600">Investigación Multi-tema para Alumnos</p>
        </header>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm flex items-start gap-3 whitespace-pre-wrap shadow-sm border border-red-100">
            <AlertCircle className="shrink-0 mt-0.5" size={18} />
            <div>{error}</div>
          </div>
        )}

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <textarea
            value={topicsText}
            onChange={e => setTopicsText(e.target.value)}
            placeholder="Escribe tus temas aquí (ej: Sistema Solar, Célula animal, Volcanes)..."
            className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-700"
          />
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="flex-2 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-3 px-6 rounded-lg transition-colors flex-grow"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
              {isLoading ? 'Buscando...' : 'Buscar Imágenes'}
            </button>
            <button
              onClick={handleDownload}
              disabled={!hasImagesToDownload || isDownloading || isLoading}
              className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:text-gray-500 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              {isDownloading ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
              {isDownloading ? 'Comprimiendo...' : 'Descargar Todo (.zip)'}
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <Loader2 className="animate-spin text-blue-500 mx-auto mb-4" size={40} />
            <p className="text-gray-600 font-medium">{loadingText}</p>
          </div>
        )}

        <div className="space-y-6">
          {results.map((result, idx) => (
            <div key={idx} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4 pb-3 border-b-2 border-gray-50">
                <h3 className="text-xl font-semibold text-gray-800 capitalize">{result.topic}</h3>
                <span className="text-sm text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full">
                  {result.items.length} imágenes
                </span>
              </div>

              {result.items.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {result.items.map((img, imgIdx) => (
                    <div key={imgIdx} className="relative rounded-lg overflow-hidden aspect-4/3 bg-gray-100 group">
                      <img
                        src={img.link}
                        alt={result.topic}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200?text=Error+Carga';
                        }}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-gray-500 text-sm bg-gray-50 rounded-lg flex items-center gap-2">
                  <AlertCircle size={16} />
                  No se encontraron imágenes para "{result.topic}".
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
