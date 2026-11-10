import { useState } from 'react';
import { downloadDocument } from '../services/documentsApi.js';

// Um link direto não envia o cabeçalho X-User-Id, então o arquivo é obtido via fetch
// e salvo a partir de um object URL temporário.
function saveBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export default function DownloadButton({ userId, documentId, fileName }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');

  async function handleClick() {
    setIsDownloading(true);
    setError('');

    try {
      const blob = await downloadDocument(userId, documentId);
      saveBlob(blob, fileName);
    } catch (downloadError) {
      setError(downloadError.message);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <>
      <button type="button" onClick={handleClick} disabled={isDownloading}>
        {isDownloading ? 'Baixando...' : 'Baixar'}
      </button>
      {error && <span role="alert" style={{ color: 'crimson', marginLeft: '0.5rem' }}>{error}</span>}
    </>
  );
}
