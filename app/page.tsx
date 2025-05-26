"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Plus,
  Trash2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  CalendarDays,
  Download,
  Upload,
  Save,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface Item {
  id: string
  nome: string
  valor: number
  categoria?: string
}

interface DadosMensais {
  ganhos: Item[]
  despesasFixas: Item[]
  despesasVariaveis: Item[]
}

type DadosPorMes = Record<string, DadosMensais>

const STORAGE_KEY = "controle-financeiro-dados"

export default function ControleFinanceiro() {
  const { toast } = useToast()

  const [mesAtual, setMesAtual] = useState(() => {
    const agora = new Date()
    return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`
  })

  const [dadosPorMes, setDadosPorMes] = useState<DadosPorMes>({})
  const [novoItem, setNovoItem] = useState({ nome: "", valor: "", categoria: "" })
  const [tipoDialog, setTipoDialog] = useState<"ganho" | "fixa" | "variavel">("ganho")
  const [dialogAberto, setDialogAberto] = useState(false)
  const [dialogSeletorMes, setDialogSeletorMes] = useState(false)
  const [anoSelecionado, setAnoSelecionado] = useState("")
  const [mesSelecionado, setMesSelecionado] = useState("")

  // Carregar dados do localStorage na inicialização
  useEffect(() => {
    try {
      const dadosSalvos = localStorage.getItem(STORAGE_KEY)
      if (dadosSalvos) {
        const dados = JSON.parse(dadosSalvos)
        setDadosPorMes(dados)
        toast({
          title: "Dados carregados!",
          description: "Seus dados financeiros foram restaurados com sucesso.",
        })
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados salvos.",
        variant: "destructive",
      })
    }
  }, [toast])

  // Salvar dados no localStorage sempre que houver mudanças
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dadosPorMes))
    } catch (error) {
      console.error("Erro ao salvar dados:", error)
    }
  }, [dadosPorMes])

  // Inicializar dados do mês se não existir
  useEffect(() => {
    if (!dadosPorMes[mesAtual]) {
      setDadosPorMes((prev) => ({
        ...prev,
        [mesAtual]: {
          ganhos: [],
          despesasFixas: [],
          despesasVariaveis: [],
        },
      }))
    }
  }, [mesAtual, dadosPorMes])

  const dadosDoMes = dadosPorMes[mesAtual] || {
    ganhos: [],
    despesasFixas: [],
    despesasVariaveis: [],
  }

  const totalGanhos = dadosDoMes.ganhos.reduce((sum, item) => sum + item.valor, 0)
  const totalDespesasFixas = dadosDoMes.despesasFixas.reduce((sum, item) => sum + item.valor, 0)
  const totalDespesasVariaveis = dadosDoMes.despesasVariaveis.reduce((sum, item) => sum + item.valor, 0)
  const totalDespesas = totalDespesasFixas + totalDespesasVariaveis
  const saldo = totalGanhos - totalDespesas

  const salvarManualmente = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dadosPorMes))
      toast({
        title: "Dados salvos!",
        description: "Seus dados financeiros foram salvos com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar os dados.",
        variant: "destructive",
      })
    }
  }

  const exportarDados = () => {
    try {
      const dados = JSON.stringify(dadosPorMes, null, 2)
      const blob = new Blob([dados], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `controle-financeiro-backup-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Backup criado!",
        description: "Arquivo de backup baixado com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro no backup",
        description: "Não foi possível criar o backup.",
        variant: "destructive",
      })
    }
  }

  const importarDados = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const dados = JSON.parse(e.target?.result as string)
        setDadosPorMes(dados)
        toast({
          title: "Dados importados!",
          description: "Backup restaurado com sucesso.",
        })
      } catch (error) {
        toast({
          title: "Erro na importação",
          description: "Arquivo de backup inválido.",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)
    event.target.value = ""
  }

  const adicionarItem = () => {
    if (!novoItem.nome || !novoItem.valor) return

    const item: Item = {
      id: Date.now().toString(),
      nome: novoItem.nome,
      valor: Number.parseFloat(novoItem.valor),
      categoria: novoItem.categoria || undefined,
    }

    setDadosPorMes((prev) => {
      const dadosAtuais = prev[mesAtual] || {
        ganhos: [],
        despesasFixas: [],
        despesasVariaveis: [],
      }

      const novosDados = { ...dadosAtuais }

      if (tipoDialog === "ganho") {
        novosDados.ganhos = [...dadosAtuais.ganhos, item]
      } else if (tipoDialog === "fixa") {
        novosDados.despesasFixas = [...dadosAtuais.despesasFixas, item]
      } else {
        novosDados.despesasVariaveis = [...dadosAtuais.despesasVariaveis, item]
      }

      return {
        ...prev,
        [mesAtual]: novosDados,
      }
    })

    setNovoItem({ nome: "", valor: "", categoria: "" })
    setDialogAberto(false)

    toast({
      title: "Item adicionado!",
      description: `${novoItem.nome} foi adicionado com sucesso.`,
    })
  }

  const removerItem = (id: string, tipo: "ganho" | "fixa" | "variavel") => {
    setDadosPorMes((prev) => {
      const dadosAtuais = prev[mesAtual] || {
        ganhos: [],
        despesasFixas: [],
        despesasVariaveis: [],
      }

      const novosDados = { ...dadosAtuais }

      if (tipo === "ganho") {
        novosDados.ganhos = dadosAtuais.ganhos.filter((item) => item.id !== id)
      } else if (tipo === "fixa") {
        novosDados.despesasFixas = dadosAtuais.despesasFixas.filter((item) => item.id !== id)
      } else {
        novosDados.despesasVariaveis = dadosAtuais.despesasVariaveis.filter((item) => item.id !== id)
      }

      return {
        ...prev,
        [mesAtual]: novosDados,
      }
    })

    toast({
      title: "Item removido!",
      description: "Item foi removido com sucesso.",
    })
  }

  const navegarMes = (direcao: "anterior" | "proximo") => {
    const [ano, mes] = mesAtual.split("-").map(Number)
    let novoAno = ano
    let novoMes = mes

    if (direcao === "anterior") {
      novoMes -= 1
      if (novoMes < 1) {
        novoMes = 12
        novoAno -= 1
      }
    } else {
      novoMes += 1
      if (novoMes > 12) {
        novoMes = 1
        novoAno += 1
      }
    }

    setMesAtual(`${novoAno}-${String(novoMes).padStart(2, "0")}`)
  }

  const abrirSeletorMes = () => {
    const [ano, mes] = mesAtual.split("-")
    setAnoSelecionado(ano)
    setMesSelecionado(mes)
    setDialogSeletorMes(true)
  }

  const confirmarSelecaoMes = () => {
    if (anoSelecionado && mesSelecionado) {
      setMesAtual(`${anoSelecionado}-${mesSelecionado.padStart(2, "0")}`)
      setDialogSeletorMes(false)
    }
  }

  const formatarMesAno = (mesAno: string) => {
    const [ano, mes] = mesAno.split("-")
    const meses = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ]
    return `${meses[Number.parseInt(mes) - 1]} ${ano}`
  }

  const abrirDialog = (tipo: "ganho" | "fixa" | "variavel") => {
    setTipoDialog(tipo)
    setDialogAberto(true)
  }

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor)
  }

  // Gerar anos (5 anos atrás até 2 anos à frente)
  const gerarAnos = () => {
    const anoAtual = new Date().getFullYear()
    const anos = []
    for (let i = anoAtual - 5; i <= anoAtual + 2; i++) {
      anos.push(i.toString())
    }
    return anos
  }

  const mesesNomes = [
    { valor: "1", nome: "Janeiro" },
    { valor: "2", nome: "Fevereiro" },
    { valor: "3", nome: "Março" },
    { valor: "4", nome: "Abril" },
    { valor: "5", nome: "Maio" },
    { valor: "6", nome: "Junho" },
    { valor: "7", nome: "Julho" },
    { valor: "8", nome: "Agosto" },
    { valor: "9", nome: "Setembro" },
    { valor: "10", nome: "Outubro" },
    { valor: "11", nome: "Novembro" },
    { valor: "12", nome: "Dezembro" },
  ]

  const ItemLista = ({
    items,
    tipo,
    onRemover,
  }: {
    items: Item[]
    tipo: "ganho" | "fixa" | "variavel"
    onRemover: (id: string) => void
  }) => (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex-1">
            <p className="font-medium">{item.nome}</p>
            {item.categoria && (
              <Badge variant="secondary" className="text-xs mt-1">
                {item.categoria}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{formatarMoeda(item.valor)}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemover(item.id)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="text-muted-foreground text-center py-4">Nenhum item adicionado</p>}
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">Controle Financeiro</h1>
          <p className="text-gray-600">Gerencie suas finanças mensais de forma simples e intuitiva</p>
        </div>

        {/* Barra de Ferramentas */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={salvarManualmente}
                  className="flex items-center gap-2 text-green-600 border-green-200 hover:bg-green-50"
                >
                  <Save className="h-4 w-4" />
                  Salvar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportarDados}
                  className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <Download className="h-4 w-4" />
                  Backup
                </Button>
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={importarDados}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 text-purple-600 border-purple-200 hover:bg-purple-50"
                  >
                    <Upload className="h-4 w-4" />
                    Restaurar
                  </Button>
                </div>
              </div>
              <div className="text-sm text-gray-500">Dados salvos automaticamente</div>
            </div>
          </CardContent>
        </Card>

        {/* Navegação de Mês */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navegarMes("anterior")}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Mês Anterior
              </Button>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-center">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900">{formatarMesAno(mesAtual)}</h2>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={abrirSeletorMes}
                  className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <CalendarDays className="h-4 w-4" />
                  Escolher Mês
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navegarMes("proximo")}
                className="flex items-center gap-2"
              >
                Próximo Mês
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resumo Financeiro */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">Resumo de {formatarMesAno(mesAtual)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-green-600 font-medium">Total Ganhos</p>
                <p className="text-2xl font-bold text-green-700">{formatarMoeda(totalGanhos)}</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <TrendingDown className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <p className="text-sm text-red-600 font-medium">Despesas Fixas</p>
                <p className="text-2xl font-bold text-red-700">{formatarMoeda(totalDespesasFixas)}</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <TrendingDown className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <p className="text-sm text-orange-600 font-medium">Despesas Variáveis</p>
                <p className="text-2xl font-bold text-orange-700">{formatarMoeda(totalDespesasVariaveis)}</p>
              </div>
              <div className={`text-center p-4 rounded-lg ${saldo >= 0 ? "bg-blue-50" : "bg-red-50"}`}>
                <DollarSign className={`h-8 w-8 mx-auto mb-2 ${saldo >= 0 ? "text-blue-600" : "text-red-600"}`} />
                <p className={`text-sm font-medium ${saldo >= 0 ? "text-blue-600" : "text-red-600"}`}>Saldo Final</p>
                <p className={`text-2xl font-bold ${saldo >= 0 ? "text-blue-700" : "text-red-700"}`}>
                  {formatarMoeda(saldo)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards de Controle */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ganhos */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="bg-green-50 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-green-700">Ganhos</CardTitle>
                  <CardDescription>Salários, freelances, etc.</CardDescription>
                </div>
                <Button onClick={() => abrirDialog("ganho")} size="sm" className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <ItemLista items={dadosDoMes.ganhos} tipo="ganho" onRemover={(id) => removerItem(id, "ganho")} />
            </CardContent>
          </Card>

          {/* Despesas Fixas */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="bg-red-50 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-red-700">Despesas Fixas</CardTitle>
                  <CardDescription>Aluguel, internet, etc.</CardDescription>
                </div>
                <Button onClick={() => abrirDialog("fixa")} size="sm" className="bg-red-600 hover:bg-red-700">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <ItemLista items={dadosDoMes.despesasFixas} tipo="fixa" onRemover={(id) => removerItem(id, "fixa")} />
            </CardContent>
          </Card>

          {/* Despesas Variáveis */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="bg-orange-50 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-orange-700">Despesas Variáveis</CardTitle>
                  <CardDescription>Compras, lazer, etc.</CardDescription>
                </div>
                <Button onClick={() => abrirDialog("variavel")} size="sm" className="bg-orange-600 hover:bg-orange-700">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <ItemLista
                items={dadosDoMes.despesasVariaveis}
                tipo="variavel"
                onRemover={(id) => removerItem(id, "variavel")}
              />
            </CardContent>
          </Card>
        </div>

        {/* Dialog para Escolher Mês */}
        <Dialog open={dialogSeletorMes} onOpenChange={setDialogSeletorMes}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Escolher Mês e Ano</DialogTitle>
              <DialogDescription>Selecione o mês e ano que deseja visualizar.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="ano">Ano</Label>
                <Select value={anoSelecionado} onValueChange={setAnoSelecionado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {gerarAnos().map((ano) => (
                      <SelectItem key={ano} value={ano}>
                        {ano}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="mes">Mês</Label>
                <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {mesesNomes.map((mes) => (
                      <SelectItem key={mes.valor} value={mes.valor}>
                        {mes.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={confirmarSelecaoMes} className="flex-1" disabled={!anoSelecionado || !mesSelecionado}>
                  Ir para{" "}
                  {anoSelecionado && mesSelecionado
                    ? formatarMesAno(`${anoSelecionado}-${mesSelecionado.padStart(2, "0")}`)
                    : "Mês"}
                </Button>
                <Button variant="outline" onClick={() => setDialogSeletorMes(false)} className="flex-1">
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog para Adicionar Item */}
        <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Adicionar{" "}
                {tipoDialog === "ganho" ? "Ganho" : tipoDialog === "fixa" ? "Despesa Fixa" : "Despesa Variável"}
              </DialogTitle>
              <DialogDescription>Preencha as informações do item para {formatarMesAno(mesAtual)}.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Salário, Aluguel, Supermercado..."
                  value={novoItem.nome}
                  onChange={(e) => setNovoItem({ ...novoItem, nome: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="valor">Valor (R$)</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={novoItem.valor}
                  onChange={(e) => setNovoItem({ ...novoItem, valor: e.target.value })}
                />
              </div>
              {tipoDialog === "variavel" && (
                <div>
                  <Label htmlFor="categoria">Categoria (opcional)</Label>
                  <Select
                    value={novoItem.categoria}
                    onValueChange={(value) => setNovoItem({ ...novoItem, categoria: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alimentacao">Alimentação</SelectItem>
                      <SelectItem value="transporte">Transporte</SelectItem>
                      <SelectItem value="lazer">Lazer</SelectItem>
                      <SelectItem value="saude">Saúde</SelectItem>
                      <SelectItem value="educacao">Educação</SelectItem>
                      <SelectItem value="vestuario">Vestuário</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <Button onClick={adicionarItem} className="flex-1">
                  Adicionar
                </Button>
                <Button variant="outline" onClick={() => setDialogAberto(false)} className="flex-1">
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
