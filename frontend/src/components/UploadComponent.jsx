import { useRef, useState } from 'react';
import { uploadDocument } from '../services/documentsApi.js';

export default function UploadComponent({ userId, onUploaded }) {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedFile) {
      setError('Selecione um arquivo para enviar.');
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccessMessage('');

    try {
      await uploadDocument(userId, selectedFile);
      setSuccessMessage(`Arquivo "${selectedFile.name}" enviado com sucesso.`);
      setSelectedFile(null);
      fileInputRef.current.value = '';
      onUploaded();
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '1.5rem' }}>
      <h2>Enviar documento</h2>
      <input
        ref={fileInputRef}
        type="file"
        disabled={isUploading}
        onChange={(event) => setSelectedFile(event.target.files[0] ?? null)}
      />
      <button type="submit" disabled={isUploading || !selectedFile}>
        {isUploading ? 'Enviando...' : 'Enviar'}
      </button>
      {error && <p role="alert" style={{ color: 'crimson' }}>{error}</p>}
      {successMessage && <p role="status">{successMessage}</p>}
    </form>
  );
}
