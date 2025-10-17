import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Plus, Trash2, Music, Users, TrendingUp, CheckCircle, Clock, X, QrCode, Instagram, Youtube, MessageSquare, DollarSign, Gift, Wallet } from 'lucide-react'

const API_URL = '/api'

function ArtistView() {
  const [songs, setSongs] = useState([])
  const [requests, setRequests] = useState([])
  const [newSong, setNewSong] = useState({ title: '', artist: '', genre: '', relevance: 'medium' })
  const [stats, setStats] = useState({
    totalRequests: 0,
    newFollowers: 0,
    activeUsers: 0,
    totalRevenue: 0,
    paidRequests: 0,
    freeRequests: 0
  })

  // Carregar dados do backend
  useEffect(() => {
    fetchSongs()
    fetchRequests()
    fetchStats()
    
    // Atualizar a cada 5 segundos
    const interval = setInterval(() => {
      fetchRequests()
      fetchStats()
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchSongs = async () => {
    try {
      const response = await fetch(`${API_URL}/songs`)
      const data = await response.json()
      setSongs(data)
    } catch (error) {
      console.error('Erro ao carregar músicas:', error)
    }
  }

  const fetchRequests = async () => {
    try {
      const response = await fetch(`${API_URL}/requests`)
      const data = await response.json()
      setRequests(data)
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/stats`)
      const data = await response.json()
      setStats({
        totalRequests: data.total_requests,
        newFollowers: data.new_followers,
        activeUsers: data.active_users,
        totalRevenue: data.total_revenue,
        paidRequests: data.paid_requests,
        freeRequests: data.free_requests
      })
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const handleAddSong = async (e) => {
    e.preventDefault()
    if (!newSong.title || !newSong.artist || !newSong.genre) {
      alert('Preencha todos os campos!')
      return
    }

    try {
      const response = await fetch(`${API_URL}/songs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSong)
      })

      if (response.ok) {
        alert('Música adicionada com sucesso!')
        setNewSong({ title: '', artist: '', genre: '', relevance: 'medium' })
        fetchSongs()
      } else {
        const error = await response.json()
        alert(`Erro: ${error.error}`)
      }
    } catch (error) {
      console.error('Erro ao adicionar música:', error)
      alert('Erro ao adicionar música. Tente novamente.')
    }
  }

  const handleDeleteSong = async (songId) => {
    if (!confirm('Tem certeza que deseja remover esta música?')) return

    try {
      const response = await fetch(`${API_URL}/songs/${songId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchSongs()
      } else {
        const error = await response.json()
        alert(`Erro: ${error.error}`)
      }
    } catch (error) {
      console.error('Erro ao deletar música:', error)
    }
  }

  const handleUpdateRequestStatus = async (requestId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        fetchRequests()
        fetchStats()
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    }
  }

  const handleDeleteRequest = async (requestId) => {
    try {
      const response = await fetch(`${API_URL}/requests/${requestId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchRequests()
        fetchStats()
      }
    } catch (error) {
      console.error('Erro ao deletar pedido:', error)
    }
  }

  const getStatusBadge = (status) => {
    switch(status) {
      case 'playing':
        return <Badge className="bg-green-500"><Music className="w-3 h-3 mr-1" /> Tocando</Badge>
      case 'queue':
        return <Badge className="bg-blue-500"><Clock className="w-3 h-3 mr-1" /> Na Fila</Badge>
      case 'completed':
        return <Badge className="bg-gray-500"><CheckCircle className="w-3 h-3 mr-1" /> Concluído</Badge>
      default:
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" /> Pendente</Badge>
    }
  }

  const getRelevanceBadge = (relevance) => {
    const config = {
      high: { label: 'Alta - R$ 8,00', color: 'bg-red-500' },
      medium: { label: 'Média - R$ 5,00', color: 'bg-yellow-500' },
      low: { label: 'Baixa - R$ 3,00', color: 'bg-green-500' }
    }
    const { label, color } = config[relevance] || config.medium
    return <Badge className={color}>{label}</Badge>
  }

  const getPriorityStars = (priority) => {
    return '⭐'.repeat(priority)
  }

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const queueRequests = requests.filter(r => r.status === 'queue')
  const playingRequests = requests.filter(r => r.status === 'playing')
  const completedRequests = requests.filter(r => r.status === 'completed')

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-lg border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receita Total</p>
                <p className="text-3xl font-bold text-green-600">R$ {stats.totalRevenue.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.paidRequests} pagos / {stats.freeRequests} grátis
                </p>
              </div>
              <Wallet className="w-12 h-12 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-2 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Pedidos</p>
                <p className="text-3xl font-bold text-purple-600">{stats.totalRequests}</p>
              </div>
              <Music className="w-12 h-12 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-2 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Novos Seguidores</p>
                <p className="text-3xl font-bold text-orange-600">{stats.newFollowers}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-2 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Usuários Ativos</p>
                <p className="text-3xl font-bold text-blue-600">{stats.activeUsers}</p>
              </div>
              <Users className="w-12 h-12 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Principal */}
      <Tabs defaultValue="requests" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="requests">
            Pedidos ({pendingRequests.length + queueRequests.length})
          </TabsTrigger>
          <TabsTrigger value="repertoire">Repertório ({songs.length})</TabsTrigger>
          <TabsTrigger value="qrcode">QR Code</TabsTrigger>
        </TabsList>

        {/* Tab de Pedidos */}
        <TabsContent value="requests" className="space-y-4">
          <Card className="shadow-xl border-2">
            <CardHeader>
              <CardTitle>Fila de Pedidos (Ordenada por Pagamento e Prioridade)</CardTitle>
              <CardDescription>
                Pedidos pagos aparecem primeiro, seguidos por valor e prioridade de redes sociais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Pedidos Pendentes */}
              {pendingRequests.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Pendentes ({pendingRequests.length})
                  </h3>
                  {pendingRequests.map((request) => (
                    <Card key={request.id} className="bg-yellow-50 dark:bg-yellow-950 border-2 border-yellow-200">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-lg">{request.song}</h3>
                              <span className="text-lg">{getPriorityStars(request.priority)}</span>
                              {!request.is_free && (
                                <Badge className="bg-green-600 gap-1">
                                  <DollarSign className="w-3 h-3" />
                                  R$ {request.price_paid.toFixed(2)}
                                </Badge>
                              )}
                              {request.is_free && (
                                <Badge variant="outline" className="gap-1">
                                  <Gift className="w-3 h-3" />
                                  Gratuito
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Por: {request.user_name} ({request.user_social})
                            </p>
                            {request.message && (
                              <div className="mt-2 p-3 bg-background rounded-lg flex gap-2 border-l-4 border-purple-500">
                                <MessageSquare className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm italic">{request.message}</p>
                              </div>
                            )}
                            <div className="flex gap-2 mt-2">
                              {request.social_platforms.instagram && (
                                <Badge variant="outline" className="gap-1">
                                  <Instagram className="w-3 h-3" /> Instagram
                                </Badge>
                              )}
                              {request.social_platforms.tiktok && (
                                <Badge variant="outline" className="gap-1">
                                  <Music className="w-3 h-3" /> TikTok
                                </Badge>
                              )}
                              {request.social_platforms.youtube && (
                                <Badge variant="outline" className="gap-1">
                                  <Youtube className="w-3 h-3" /> YouTube
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {getStatusBadge(request.status)}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteRequest(request.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateRequestStatus(request.id, 'queue')}
                            className="gap-1"
                          >
                            <Clock className="w-4 h-4" />
                            Adicionar à Fila
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateRequestStatus(request.id, 'playing')}
                            className="gap-1"
                          >
                            <Music className="w-4 h-4" />
                            Tocar Agora
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Pedidos na Fila */}
              {queueRequests.length > 0 && (
                <div className="space-y-3 mt-6">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-500" />
                    Na Fila ({queueRequests.length})
                  </h3>
                  {queueRequests.map((request) => (
                    <Card key={request.id} className="bg-blue-50 dark:bg-blue-950 border-2 border-blue-200">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-lg">{request.song}</h3>
                              {!request.is_free && (
                                <Badge className="bg-green-600 gap-1">
                                  <DollarSign className="w-3 h-3" />
                                  R$ {request.price_paid.toFixed(2)}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {request.user_name} ({request.user_social})
                            </p>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateRequestStatus(request.id, 'playing')}
                            className="gap-1"
                          >
                            <Music className="w-4 h-4" />
                            Tocar Agora
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateRequestStatus(request.id, 'completed')}
                            className="gap-1"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Concluir
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Tocando Agora */}
              {playingRequests.length > 0 && (
                <div className="space-y-3 mt-6">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Music className="w-5 h-5 text-green-500 animate-pulse" />
                    Tocando Agora
                  </h3>
                  {playingRequests.map((request) => (
                    <Card key={request.id} className="bg-green-50 dark:bg-green-950 border-2 border-green-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-lg">{request.song}</h3>
                            <p className="text-sm text-muted-foreground">
                              {request.user_name}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleUpdateRequestStatus(request.id, 'completed')}
                            className="gap-1"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Concluir
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {pendingRequests.length === 0 && queueRequests.length === 0 && playingRequests.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum pedido ativo no momento
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Repertório */}
        <TabsContent value="repertoire" className="space-y-4">
          <Card className="shadow-xl border-2">
            <CardHeader>
              <CardTitle>Adicionar Nova Música</CardTitle>
              <CardDescription>
                Defina a relevância da música para determinar o preço (Baixa: R$ 3,00 | Média: R$ 5,00 | Alta: R$ 8,00)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddSong} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Input
                    placeholder="Título da música"
                    value={newSong.title}
                    onChange={(e) => setNewSong({...newSong, title: e.target.value})}
                    required
                  />
                  <Input
                    placeholder="Artista original"
                    value={newSong.artist}
                    onChange={(e) => setNewSong({...newSong, artist: e.target.value})}
                    required
                  />
                  <Input
                    placeholder="Gênero"
                    value={newSong.genre}
                    onChange={(e) => setNewSong({...newSong, genre: e.target.value})}
                    required
                  />
                  <Select
                    value={newSong.relevance}
                    onValueChange={(value) => setNewSong({...newSong, relevance: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Relevância" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa (R$ 3,00)</SelectItem>
                      <SelectItem value="medium">Média (R$ 5,00)</SelectItem>
                      <SelectItem value="high">Alta (R$ 8,00)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Adicionar Música
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-2">
            <CardHeader>
              <CardTitle>Repertório Atual ({songs.length} músicas)</CardTitle>
              <CardDescription>
                Gerencie as músicas disponíveis e seus preços
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {songs.map((song) => (
                  <Card key={song.id} className="bg-accent/30">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{song.title}</h3>
                        <p className="text-sm text-muted-foreground">{song.artist}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{song.genre}</Badge>
                        {getRelevanceBadge(song.relevance)}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteSong(song.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de QR Code */}
        <TabsContent value="qrcode">
          <Card className="shadow-xl border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-6 h-6" />
                QR Code para Compartilhar
              </CardTitle>
              <CardDescription>
                Exiba este QR Code no palco ou telão para que o público acesse o app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white p-8 rounded-lg flex flex-col items-center justify-center border-4 border-dashed">
                <div className="w-64 h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                  <QrCode className="w-32 h-32 text-gray-400" />
                  <p className="absolute text-sm text-gray-500 mt-48">QR Code será gerado aqui</p>
                </div>
                <p className="mt-4 text-center font-mono text-sm">
                  URL: {window.location.origin}
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <p className="text-sm">
                  <strong>Dica:</strong> Projete este QR Code em um telão ou imprima em cartazes para facilitar o acesso do público ao aplicativo durante sua apresentação.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ArtistView

