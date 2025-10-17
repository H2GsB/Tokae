import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Music, User, Settings } from 'lucide-react'
import PublicView from './PublicView' // Caminho corrigido para o arquivo na mesma pasta
import ArtistView from './ArtistView' // Caminho corrigido para o arquivo na mesma pasta
import './App.css'

function App() {
  const [view, setView] = useState('public') // 'public' ou 'artist'

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900">
      {/* Cabeçalho */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-xl shadow-lg">
                <Music className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Live Request
                </h1>
                <p className="text-sm text-muted-foreground">Peça sua música favorita</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={view === 'public' ? 'default' : 'outline'}
                onClick={() => setView('public')}
                className="gap-2"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Público</span>
              </Button>
              <Button
                variant={view === 'artist' ? 'default' : 'outline'}
                onClick={() => setView('artist')}
                className="gap-2"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Artista</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="container mx-auto px-4 py-8">
        {view === 'public' ? <PublicView /> : <ArtistView />}
      </main>

      {/* Rodapé */}
      <footer className="mt-16 py-6 text-center text-sm text-muted-foreground">
        <p>Live Request © 2025 - Conectando artistas e fãs ao vivo</p>
      </footer>
    </div>
  )
}

export default App
