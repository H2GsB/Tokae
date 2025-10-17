import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Search, Music, Heart, Send, Instagram, Youtube, Share2, CheckCircle2, Clock, Sparkles, DollarSign, Gift, TrendingUp } from 'lucide-react'

const API_URL = '/api'

function PublicView() {
  const [songs, setSongs] = useState([])
  const [requests, setRequests] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSong, setSelectedSong] = useState(null)
  const [userName, setUserName] = useState('')
  const [userSocial, setUserSocial] = useState('')
  const [message, setMessage] = useState('')
  const [socialPlatforms, setSocialPlatforms] = useState({
    instagram: false,
    tiktok: false,
    youtube: false
  })
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [hasFreeRequest, setHasFreeRequest] = useState(false)
  const [isCheckingUser, setIsCheckingUser] = useState(false)

  // Carregar músicas do backend
  useEffect(() => {
    fetchSongs()
    fetchRequests()
    // Atualizar pedidos a cada 5 segundos
    const interval = setInterval(fetchRequests, 5000)
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
      const response = await fetch(`${API_URL}/requests?status=pending,queue,playing`)
      const data = await response.json()
      setRequests(data.slice(0, 10)) // Mostrar apenas os 10 primeiros
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error)
    }
  }

  const checkFreeRequest = async (social) => {
    if (!social || social.trim() === '') return
    
    setIsCheckingUser(true)
    try {
      const cleanSocial = social.startsWith('@') ? social : `@${social}`
      const response = await fetch(`${API_URL}/check-free-request/${encodeURIComponent(cleanSocial)}`)
      const data = await response.json()
      setHasFreeRequest(data.has_free_request)
    } catch (error) {
      console.error('Erro ao verificar pedido gratuito:', error)
    } finally {
      setIsCheckingUser(false)
    }
  }

  const filteredSongs = songs.filter(song =>
    song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSongSelect = (song) => {
    setSelectedSong(song)
    setShowRequestForm(true)
  }

  const handleUserSocialChange = (value) => {
    setUserSocial(value)
    // Verificar pedido gratuito quando o usuário digitar o @
    if (value.length > 2) {
      checkFreeRequest(value)
    }
  }

  const handleSubmitRequest = async (e) => {
    e.preventDefault()
    
    // Validar se seguiu pelo menos uma rede social
    const followedPlatforms = Object.values(socialPlatforms).filter(v => v).length
    if (followedPlatforms === 0) {
      alert('Por favor, siga o artista em pelo menos uma rede social para fazer seu pedido!')
      return
    }

    const cleanSocial = userSocial.startsWith('@') ? userSocial : `@${userSocial}`

    // 1. Enviar o pedido inicial (o backend vai definir se é gratuito ou pago)
    try {
      const response = await fetch(`${API_URL}/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          song_id: selectedSong.id,
          user_name: userName,
          user_social: cleanSocial,
          message,
          social_platforms: socialPlatforms
        })
      })

      if (!response.ok) {
        const error = await response.json()
        alert(`Erro ao enviar pedido: ${error.error}`)
        return
      }

      const newRequest = await response.json()

      if (newRequest.is_free) {
        alert('Pedido gratuito enviado com sucesso! Acompanhe o status na lista de pedidos.')
        // Resetar formulário
        setShowRequestForm(false)
        setSelectedSong(null)
        setMessage('')
        fetchRequests()
      } else {
        // 2. Se for pago, simular a tela de pagamento
        const paymentSuccess = await simulatePayment(newRequest)
        
        if (paymentSuccess) {
          alert('Pagamento confirmado! Seu pedido foi enviado para a fila. Acompanhe o status.')
          // Resetar formulário
          setShowRequestForm(false)
          setSelectedSong(null)
          setMessage('')
          fetchRequests()
        } else {
          alert('Pagamento cancelado ou falhou. Seu pedido não foi enviado.')
          // O pedido foi criado no backend com status 'pending' e payment_status 'pending'.
          // Se o pagamento falhar, o pedido deve ser removido ou marcado como falho.
          // Para simplificar a simulação, vamos apenas alertar e não enviar.
          // Em um sistema real, o pedido ficaria como 'pending' até o pagamento.
          // Vamos simular o cancelamento do pedido no backend.
          await fetch(`${API_URL}/requests/${newRequest.id}`, { method: 'DELETE' })
        }
      }
    } catch (error) {
      console.error('Erro ao enviar pedido:', error)
      alert('Erro ao enviar pedido. Tente novamente.')
    }
  }

  const simulatePayment = async (request) => {
    const paymentMethods = ['Pix', 'Cartão de Crédito', 'Cartão de Débito']
    const selectedMethod = prompt(
      `Seu pedido de R$ ${request.price_paid.toFixed(2)} para a música "${request.song}" requer pagamento.
      
      Escolha o método de pagamento (simulação):
      1. ${paymentMethods[0]}
      2. ${paymentMethods[1]}
      3. ${paymentMethods[2]}
      
      Digite o número da opção ou 'cancelar'.`
    )

    if (selectedMethod === '1' || selectedMethod === '2' || selectedMethod === '3') {
      // Simular sucesso do pagamento
      // Atualizar o status de pagamento no backend para 'completed'
      try {
        await fetch(`${API_URL}/requests/${request.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ payment_status: 'completed' })
        })
        return true
      } catch (error) {
        console.error('Erro ao simular sucesso de pagamento:', error)
        return false
      }
    } else {
      return false // Pagamento cancelado
    }
  }

  const handleLikeRequest = async (requestId) => {
    try {
      await fetch(`${API_URL}/requests/${requestId}/like`, {
        method: 'POST'
      })
      fetchRequests()
    } catch (error) {
      console.error('Erro ao curtir pedido:', error)
    }
  }

  const getStatusBadge = (status) => {
    switch(status) {
      case 'playing':
        return <Badge className="bg-green-500"><Music className="w-3 h-3 mr-1" /> Tocando Agora</Badge>
      case 'queue':
        return <Badge className="bg-blue-500"><Clock className="w-3 h-3 mr-1" /> Na Fila</Badge>
      default:
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" /> Pendente</Badge>
    }
  }

  const calculatePriority = () => {
    const followCount = Object.values(socialPlatforms).filter(v => v).length
    return followCount
  }

  const getRelevanceBadge = (relevance) => {
    const config = {
      high: { label: 'Alta', color: 'bg-red-500' },
      medium: { label: 'Média', color: 'bg-yellow-500' },
      low: { label: 'Baixa', color: 'bg-green-500' }
    }
    const { label, color } = config[relevance] || config.medium
    return <Badge className={color}>{label}</Badge>
  }

  const getPriceDisplay = (song) => {
    if (hasFreeRequest) {
      return (
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-green-500" />
          <span className="text-green-600 font-bold">GRÁTIS</span>
          <span className="text-sm text-muted-foreground line-through">R$ {song.price.toFixed(2)}</span>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-1">
        <DollarSign className="w-5 h-5 text-green-600" />
        <span className="text-lg font-bold text-green-600">R$ {song.price.toFixed(2)}</span>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Coluna Principal - Lista de Músicas */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="shadow-xl border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="w-6 h-6 text-purple-500" />
              Repertório Disponível
            </CardTitle>
            <CardDescription>
              Escolha sua música favorita e faça seu pedido
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar música ou artista..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Lista de Músicas */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredSongs.map((song) => (
                <Card
                  key={song.id}
                  className="hover:shadow-lg transition-all cursor-pointer hover:border-purple-300"
                  onClick={() => handleSongSelect(song)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{song.title}</h3>
                      <p className="text-sm text-muted-foreground">{song.artist}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{song.genre}</Badge>
                      {getRelevanceBadge(song.relevance)}
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="font-bold text-green-600">R$ {song.price.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Formulário de Pedido */}
        {showRequestForm && selectedSong && (
          <Card className="shadow-xl border-2 border-purple-300 animate-in slide-in-from-bottom">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-500" />
                Fazer Pedido: {selectedSong.title}
              </CardTitle>
              <CardDescription>
                {hasFreeRequest ? (
                  <span className="text-green-600 font-semibold flex items-center gap-2">
                    <Gift className="w-4 h-4" />
                    Parabéns! Seu primeiro pedido é GRÁTIS!
                  </span>
                ) : (
                  <span>Valor deste pedido: <strong className="text-green-600">R$ {selectedSong.price.toFixed(2)}</strong></span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitRequest} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Seu Nome</label>
                  <Input
                    placeholder="Digite seu nome"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Seu @ nas Redes Sociais</label>
                  <Input
                    placeholder="@seunome"
                    value={userSocial}
                    onChange={(e) => handleUserSocialChange(e.target.value)}
                    required
                  />
                  {isCheckingUser && (
                    <p className="text-xs text-muted-foreground mt-1">Verificando...</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Siga o Artista (obrigatório pelo menos 1) 
                    {calculatePriority() > 0 && (
                      <span className="text-purple-600 ml-2">
                        ⭐ Prioridade: {calculatePriority()}/3
                      </span>
                    )}
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-accent">
                      <input
                        type="checkbox"
                        checked={socialPlatforms.instagram}
                        onChange={(e) => setSocialPlatforms({...socialPlatforms, instagram: e.target.checked})}
                        className="w-4 h-4"
                      />
                      <Instagram className="w-5 h-5 text-pink-500" />
                      <span>Instagram</span>
                    </label>
                    <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-accent">
                      <input
                        type="checkbox"
                        checked={socialPlatforms.tiktok}
                        onChange={(e) => setSocialPlatforms({...socialPlatforms, tiktok: e.target.checked})}
                        className="w-4 h-4"
                      />
                      <Music className="w-5 h-5 text-black" />
                      <span>TikTok</span>
                    </label>
                    <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-accent">
                      <input
                        type="checkbox"
                        checked={socialPlatforms.youtube}
                        onChange={(e) => setSocialPlatforms({...socialPlatforms, youtube: e.target.checked})}
                        className="w-4 h-4"
                      />
                      <Youtube className="w-5 h-5 text-red-500" />
                      <span>YouTube</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Mensagem para o Artista (opcional)</label>
                  <Textarea
                    placeholder="Deixe uma mensagem especial..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <p className="text-sm">
                    <strong>Resumo do Pedido:</strong><br/>
                    Música: {selectedSong.title}<br/>
                    {getPriceDisplay(selectedSong)}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1 gap-2">
                    <Send className="w-4 h-4" />
                    {hasFreeRequest ? 'Enviar Pedido Grátis' : `Enviar Pedido e Pagar (R$ ${selectedSong.price.toFixed(2)})`}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowRequestForm(false)
                      setSelectedSong(null)
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Coluna Lateral - Feed de Pedidos */}
      <div className="space-y-6">
        <Card className="shadow-xl border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-green-500" />
              Fila de Pedidos
            </CardTitle>
            <CardDescription>
              Pedidos em ordem de prioridade
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {requests.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Nenhum pedido na fila
              </p>
            ) : (
              requests.map((request) => (
                <Card key={request.id} className="bg-accent/50">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{request.song}</h4>
                        <p className="text-sm text-muted-foreground">{request.user_social}</p>
                        {!request.is_free && (
                          <div className="flex items-center gap-1 mt-1">
                            <DollarSign className="w-3 h-3 text-green-600" />
                            <span className="text-xs font-bold text-green-600">
                              R$ {request.price_paid.toFixed(2)}
                            </span>
                          </div>
                        )}
                        {request.is_free && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            <Gift className="w-3 h-3 mr-1" /> Gratuito
                          </Badge>
                        )}
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleLikeRequest(request.id)}
                        className="gap-1"
                      >
                        <Heart className="w-4 h-4 text-red-500" />
                        <span>{request.likes}</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>

        {/* Card de Compartilhamento */}
        <Card className="shadow-xl border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="w-6 h-6 text-blue-500" />
              Compartilhe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">
              Compartilhe este app com seus amigos e peçam músicas juntos!
            </p>
            <Button className="w-full gap-2" variant="outline">
              <Share2 className="w-4 h-4" />
              Compartilhar nas Redes
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default PublicView

