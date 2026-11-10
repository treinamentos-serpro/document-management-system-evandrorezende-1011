import { useEffect, useState } from 'react';
import UploadComponent from './components/UploadComponent.jsx';
import DocumentList from './components/DocumentList.jsx';
import { listDocuments } from './services/documentsApi.js';

const USER_STORAGE_KEY = 'dms.userId';

export default function App() {
  const [userInput, setUserInput] = useState(() => localStorage.getItem(USER_STORAGE_KEY) ?? '');
  const userId = userInput.trim();
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [listError, setListError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!userId) {
      return undefined;
    }

    let ignore = false;
    setDocuments([]);
    setIsLoading(true);
    setListError('');

    listDocuments(userId)
      .then((data) => {
        if (!ignore) setDocuments(data);
      })
      .catch((error) => {
        if (!ignore) setListError(error.message);
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [userId, reloadToken]);

  function handleUserChange(event) {
    const value = event.target.value;
    localStorage.setItem(USER_STORAGE_KEY, value);
    setUserInput(value);
  }

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
      <h1>Document Management System</h1>

      <div style={{ marginBottom: '1.5rem' }}>
        <label htmlFor="user-id">Usuário: </label>
        <input
          id="user-id"
          value={userInput}
          onChange={handleUserChange}
          placeholder="Ex.: maria"
        />
      </div>

      {userId ? (
        <>
          <UploadComponent userId={userId} onUploaded={() => setReloadToken((token) => token + 1)} />
          <h2>Meus documentos</h2>
          <DocumentList
            userId={userId}
            documents={documents}
            isLoading={isLoading}
            error={listError}
          />
        </>
      ) : (
        <p>Informe o usuário para enviar e listar documentos.</p>
      )}
    </main>
  );
}
