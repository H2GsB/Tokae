import React, { useState, useEffect } from 'react';
import PublicView from '../components/PublicView';
import ArtistView from '../components/ArtistView';
import '../App.css'; // <--- AQUI ESTÁ A CORREÇÃO DE CAMINHO

function App() {
  const [view, setView] = useState('public'); // 'public' or 'artist'

  const toggleView = () => {
    setView(view === 'public' ? 'artist' : 'public');
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>TOCAE - Live Request</h1>
        <button onClick={toggleView} className="view-toggle-button">
          {view === 'public' ? 'Ir para Artista' : 'Ir para Público'}
        </button>
      </header>
      <main className="app-main">
        {view === 'public' ? <PublicView /> : <ArtistView />}
      </main>
    </div>
  );
}

export default App;
