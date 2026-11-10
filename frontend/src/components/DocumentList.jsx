import DownloadButton from './DownloadButton.jsx';

const SIZE_UNITS = ['B', 'KB', 'MB', 'GB'];
const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

function formatSize(bytes) {
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < SIZE_UNITS.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return unitIndex === 0 ? `${value} B` : `${value.toFixed(1)} ${SIZE_UNITS[unitIndex]}`;
}

export default function DocumentList({ userId, documents, isLoading, error }) {
  if (isLoading) {
    return <p>Carregando documentos...</p>;
  }

  if (error) {
    return <p role="alert" style={{ color: 'crimson' }}>{error}</p>;
  }

  if (documents.length === 0) {
    return <p>Nenhum documento enviado ainda.</p>;
  }

  return (
    <table style={{ borderCollapse: 'collapse', width: '100%' }}>
      <thead>
        <tr>
          <th style={{ textAlign: 'left' }}>Nome</th>
          <th style={{ textAlign: 'left' }}>Tamanho</th>
          <th style={{ textAlign: 'left' }}>Enviado em</th>
          <th style={{ textAlign: 'left' }}>Ação</th>
        </tr>
      </thead>
      <tbody>
        {documents.map((document) => (
          <tr key={document.id}>
            <td>{document.originalName}</td>
            <td>{formatSize(document.size)}</td>
            <td>{dateFormatter.format(new Date(document.uploadedAt))}</td>
            <td>
              <DownloadButton
                userId={userId}
                documentId={document.id}
                fileName={document.originalName}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
