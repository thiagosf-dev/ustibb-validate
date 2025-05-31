import PdfIcon from '@/assets/svg/pdf-60x60.svg?react'
import { Acoes } from '@/constants/acoes'
import { pontuacaoPorNome, pontuacaoPorTipo } from '@/constants/pontuacao'
import { cn } from '@/lib/utils'
import jsPDF from 'jspdf'
import {
  Check,
  ClipboardCopy,
  Info,
  MoreVertical,
  TerminalSquare,
  Trash,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GitCommand, GitCommandConfig } from './GitCommand'

const readFilesAsText = async (files: File[]): Promise<string[]> => {
  const readers = files.map(
    (file) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () =>
          reject(new Error(`Erro ao ler o arquivo ${file.name}`))
        reader.readAsText(file)
      }),
  )
  return Promise.all(readers)
}

const removerLinhasDeCabecalhoGit = (linhas: string[]): string[] => {
  return linhas.filter((linha) => /^(D|A|M)\b/.test(linha.trim()))
}

const removerLinhasDeArquivosDeletados = (linhas: string[]): string[] => {
  return linhas.filter((linha) => !/^D\b/.test(linha.trim()))
}

type LinhaPontuada = {
  linhaOriginal: string
  pontos: number
  codigoGuia: string
  descricao: string
}

const pontuarLinha = (linha: string): LinhaPontuada | null => {
  const linhaLowerCase = linha.toLowerCase()
  const acaoMatch = linhaLowerCase.match(/^(A|M|a|m)\b/)

  if (!acaoMatch) return null

  const acao = acaoMatch[1].toUpperCase() as Acoes
  const caminhoCompletoMatch = linha.match(/\/([^\s#]+)(?=#)/)

  if (!caminhoCompletoMatch) return null

  const fileName = caminhoCompletoMatch[1]
  const partes = fileName.split('.')
  const isArquivoTeste: boolean =
    fileName.includes('.test') || fileName.includes('.spec')
  let extensao = partes.length > 1 ? partes.pop()! : ''

  if (isArquivoTeste) {
    extensao = fileName.split('.').slice(-2).join('.')
  }

  const regraPorNome = pontuacaoPorNome[fileName]?.[acao]
  if (regraPorNome) {
    return {
      linhaOriginal: linha,
      pontos: regraPorNome.pontos,
      codigoGuia: regraPorNome.codigoGuia,
      descricao: regraPorNome.descricao,
    }
  }

  const regraPorExtensao = pontuacaoPorTipo[extensao]?.[acao]
  if (regraPorExtensao) {
    return {
      linhaOriginal: linha,
      pontos: regraPorExtensao.pontos,
      codigoGuia: regraPorExtensao.codigoGuia,
      descricao: regraPorExtensao.descricao,
    }
  }

  return null
}

const calcularTotalArquivos = (categorias: CategoriaAgrupada[]): number => {
  return categorias.reduce(
    (total, categoria) => total + categoria.linhas.length,
    0,
  )
}

const removerAcaoDaLinha = (linha: string): string => {
  return linha.replace(/^(A|M)\s+/, '')
}

const removerDuplicadasPorArquivo = (fileContents: string[]): string[] => {
  const todasLinhasUnicasPorArquivo: string[][] = []

  fileContents.forEach((content) => {
    const linhas = content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
    todasLinhasUnicasPorArquivo.push(linhas)
  })

  const todasLinhas = todasLinhasUnicasPorArquivo.flat()
  const mapaDeLinhas = new Map<string, Map<string, string>>() // caminho -> (mensagem -> linha)

  todasLinhas.forEach((linha) => {
    const caminhoMatch = linha.match(/^[AM]\s+(.+?)(?=#)/)
    if (!caminhoMatch) return

    const caminho = caminhoMatch[1].trim()
    const mensagem = linha.includes(';') ? linha.split(';')[1].trim() : ''
    const acao = linha.charAt(0)

    const mensagensMap = mapaDeLinhas.get(caminho) ?? new Map<string, string>()
    const linhaExistente = mensagensMap.get(mensagem)

    if (!linhaExistente) {
      mensagensMap.set(mensagem, linha)
      mapaDeLinhas.set(caminho, mensagensMap)
      return
    }

    const acaoExistente = linhaExistente.charAt(0)

    if (acaoExistente === 'M' && acao === 'A') {
      mensagensMap.set(mensagem, linha)
      mapaDeLinhas.set(caminho, mensagensMap)
    }
  })

  return Array.from(mapaDeLinhas.values()).flatMap((map) =>
    Array.from(map.values()),
  )
}

type CategoriaAgrupada = {
  codigoGuia: string
  descricao: string
  pontos: number
  linhas: string[]
}

const agruparPorCategoria = (linhas: string[]): CategoriaAgrupada[] => {
  const categoriasMap = new Map<string, CategoriaAgrupada>()

  linhas.forEach((linha) => {
    const pontuacao = pontuarLinha(linha)
    if (!pontuacao) return

    const chave = pontuacao.codigoGuia
    const linhaSemAcao = removerAcaoDaLinha(linha)

    if (!categoriasMap.has(chave)) {
      categoriasMap.set(chave, {
        codigoGuia: pontuacao.codigoGuia,
        descricao: pontuacao.descricao,
        pontos: pontuacao.pontos,
        linhas: [linhaSemAcao],
      })
    } else {
      const categoriaExistente = categoriasMap.get(chave)!
      categoriaExistente.linhas.push(linhaSemAcao)
    }
  })

  return Array.from(categoriasMap.values())
}

const copiarLinhasParaClipboard = async (linhas: string[]) => {
  const conteudo = linhas.join('\n')
  await navigator.clipboard.writeText(conteudo)
}

const subcategorizarPorPontuacao = (
  categoria: CategoriaAgrupada,
  complexidadesSelecionadas: ComplexidadeSelecionada,
) => {
  const grupos: Record<number, { linha: string; idx: number }[]> = {}

  categoria.linhas.forEach((linha, idx) => {
    const config = complexidadesSelecionadas[categoria.codigoGuia]?.[idx]
    const pontos = config?.pontos ?? categoria.pontos

    if (!grupos[pontos]) {
      grupos[pontos] = []
    }
    grupos[pontos].push({ linha, idx })
  })

  return grupos
}

type ComplexidadeSelecionada = Record<
  string,
  Record<number, { pontos: number; deveContabilizar: boolean }>
>

export function FileUploader() {
  const menuRef = useRef<HTMLDivElement>(null)
  const toggleButtonRef = useRef<HTMLDivElement>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [categorias, setCategorias] = useState<CategoriaAgrupada[]>([])
  const [sprint1Selecionada, setSprint1Selecionada] = useState(false)
  const [sprint2Selecionada, setSprint2Selecionada] = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)
  const [complexidadesSelecionadas, setComplexidadesSelecionadas] =
    useState<ComplexidadeSelecionada>({})
  const [mostrarModalGit, setMostrarModalGit] = useState(false)
  const [gitConfigs, setGitConfigs] = useState<GitCommandConfig | null>(null)
  const [totalArquivos, setTotalArquivos] = useState(0)
  const [totalPontos, setTotalPontos] = useState(0)

  const calcularTotalPontosComRitos = useCallback((): number => {
    const pontosDasCategorias = categorias.reduce((total, categoria) => {
      return (
        total +
        categoria.linhas.reduce((soma, _, idx) => {
          const config = complexidadesSelecionadas[categoria.codigoGuia]?.[idx]
          const pontos = config?.pontos ?? categoria.pontos
          const contabilizar = config?.deveContabilizar ?? true
          return contabilizar ? soma + pontos : soma
        }, 0)
      )
    }, 0)

    const pontosRitos =
      (sprint1Selecionada ? 45 : 0) + (sprint2Selecionada ? 45 : 0)
    return pontosDasCategorias + pontosRitos
  }, [
    categorias,
    complexidadesSelecionadas,
    sprint1Selecionada,
    sprint2Selecionada,
  ])

  const atualizarTotais = useCallback(() => {
    setTotalArquivos(calcularTotalArquivos(categorias))
    setTotalPontos(calcularTotalPontosComRitos())
  }, [calcularTotalPontosComRitos, categorias])

  useEffect(() => {
    atualizarTotais()
  }, [categorias, atualizarTotais])

  const processarArquivos = useCallback(async (files: File[]) => {
    if (files.length === 0) {
      setCategorias([])
      return
    }

    try {
      const fileContents = await readFilesAsText(files)
      const linhasFiltradasPorArquivo =
        removerDuplicadasPorArquivo(fileContents)
      const linhasSemCabecalho = removerLinhasDeCabecalhoGit(
        linhasFiltradasPorArquivo,
      )
      const linhasSemDeletados =
        removerLinhasDeArquivosDeletados(linhasSemCabecalho)
      setCategorias(agruparPorCategoria(linhasSemDeletados))
    } catch (error) {
      console.error('Erro ao processar os arquivos:', error)
    }
  }, [])

  const handleFileSelection = useCallback(
    (files: FileList | null) => {
      if (!files) return

      const newFiles = Array.from(files).filter(
        (file) =>
          file.type === 'text/plain' &&
          !selectedFiles.some(
            (f) => f.name === file.name && f.size === file.size,
          ),
      )

      const allFiles = [...selectedFiles, ...newFiles]
      setSelectedFiles(allFiles)
      processarArquivos(allFiles)
    },
    [selectedFiles, processarArquivos],
  )

  const removerArquivo = useCallback(
    (fileToRemove: File) => {
      const arquivosAtuais = selectedFiles.filter(
        (file) => file.name !== fileToRemove.name,
      )
      setSelectedFiles(arquivosAtuais)
      processarArquivos(arquivosAtuais)
    },
    [processarArquivos, selectedFiles],
  )

  const atualizarComplexidade = useCallback(
    (codigoGuia: string, idx: number, pontos: number) => {
      setComplexidadesSelecionadas((prev) => ({
        ...prev,
        [codigoGuia]: {
          ...prev[codigoGuia],
          [idx]: {
            pontos,
            deveContabilizar: prev[codigoGuia]?.[idx]?.deveContabilizar ?? true,
          },
        },
      }))
    },
    [],
  )

  const atualizarContabilizacao = useCallback(
    (codigoGuia: string, idx: number, deveContabilizar: boolean) => {
      setComplexidadesSelecionadas((prev) => ({
        ...prev,
        [codigoGuia]: {
          ...prev[codigoGuia],
          [idx]: {
            pontos:
              prev[codigoGuia]?.[idx]?.pontos ??
              categorias.find((c) => c.codigoGuia === codigoGuia)?.pontos ??
              0,
            deveContabilizar,
          },
        },
      }))
    },
    [categorias],
  )

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      setIsDragging(false)
      handleFileSelection(event.dataTransfer.files)
    },
    [handleFileSelection],
  )

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      setIsDragging(true)
    },
    [],
  )

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleFileSelection(event.target.files)
    },
    [handleFileSelection],
  )

  const handleConfirmConfig = useCallback((config: GitCommandConfig) => {
    setGitConfigs(config)
  }, [])

  const hasAtLeastOneSelectedLine = useMemo(() => {
    return categorias.some((categoria) =>
      categoria.linhas.some((_, idx) => {
        const config = complexidadesSelecionadas[categoria.codigoGuia]?.[idx]
        return config?.deveContabilizar ?? true
      }),
    )
  }, [categorias, complexidadesSelecionadas])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        toggleButtonRef.current &&
        !toggleButtonRef.current.contains(target)
      ) {
        setMenuAberto(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const CategoriaHeader = ({
    categoria,
    totalPontosDaCategoria,
  }: {
    categoria: CategoriaAgrupada
    totalPontosDaCategoria: number
  }) => {
    const [copiado, setCopiado] = useState(false)
    const [menuAberto, setMenuAberto] = useState(false)
    const groupMenuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          groupMenuRef.current &&
          !groupMenuRef.current.contains(event.target as Node)
        ) {
          setMenuAberto(false)
        }
      }

      if (menuAberto) {
        document.addEventListener('mousedown', handleClickOutside)
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [menuAberto])

    const handleCopy = async () => {
      const linhasSelecionadas = categoria.linhas.filter(
        (_, idx) =>
          complexidadesSelecionadas[categoria.codigoGuia]?.[idx]
            ?.deveContabilizar ?? true,
      )

      if (linhasSelecionadas.length === 0) return
      await copiarLinhasParaClipboard(linhasSelecionadas)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 5000)
    }

    const linhasConfig = complexidadesSelecionadas[categoria.codigoGuia] || {}
    const todasMarcadas = categoria.linhas.every((_, idx) =>
      linhasConfig[idx] ? linhasConfig[idx].deveContabilizar : true,
    )

    const deveExibirPontosPorArquivo =
      categoria.codigoGuia !== '5.10.3' && categoria.codigoGuia !== '5.10.4'

    const linhasSelecionadas = categoria.linhas.filter(
      (_, idx) =>
        complexidadesSelecionadas[categoria.codigoGuia]?.[idx]
          ?.deveContabilizar ?? true,
    )

    const toggleTodasAsLinhas = (marcar: boolean) => {
      const novasConfigs = categoria.linhas.reduce(
        (acc, _, idx) => {
          acc[idx] = {
            pontos: linhasConfig[idx]?.pontos ?? categoria.pontos,
            deveContabilizar: marcar,
          }
          return acc
        },
        {} as Record<number, { pontos: number; deveContabilizar: boolean }>,
      )

      setComplexidadesSelecionadas((prev) => ({
        ...prev,
        [categoria.codigoGuia]: novasConfigs,
      }))
    }

    const handleApplyMessageToGroup = (categoria: CategoriaAgrupada) => {
      if (!gitConfigs?.message) return
      setCategorias((categorias) =>
        categorias.map((cat) =>
          cat.codigoGuia === categoria.codigoGuia
            ? {
                ...cat,
                linhas: cat.linhas.map((linha) => {
                  const [parte1] = linha.split(';')
                  return `${parte1}; ${gitConfigs.message}`
                }),
              }
            : cat,
        ),
      )
    }

    return (
      <div className="flex items-center gap-4 p-2 rounded-sm bg-gray-900">
        {/* Checkbox */}
        <div className="flex items-center">
          <input
            type="checkbox"
            className="cursor-pointer"
            checked={todasMarcadas}
            onChange={(e) => toggleTodasAsLinhas(e.target.checked)}
          />
        </div>

        {/* Título */}
        <div className="flex items-center">
          <h3 className="text-md font-semibold">
            {categoria.codigoGuia} - {categoria.descricao} (
            {categoria.linhas.length} arquivo(s)
            {deveExibirPontosPorArquivo &&
              `, ${categoria.pontos} pontos cada arquivo`}
            , {totalPontosDaCategoria} ponto(s) total)
          </h3>
        </div>

        {/* Menu */}
        <div
          className="relative flex items-center rounded-sm bg-zinc-800"
          ref={groupMenuRef}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              setMenuAberto((prev) => !prev)
            }}
            className="p-1 rounded-sm hover:bg-gray-700 transition cursor-pointer"
          >
            <MoreVertical className="w-4 h-4 text-white" />
          </button>

          {menuAberto && (
            <div
              className="absolute top-0 left-full ml-2 bg-zinc-800 text-white rounded shadow-lg z-30 py-1 w-max"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                disabled={
                  linhasSelecionadas.length === 0 || !gitConfigs?.message
                }
                onClick={() => {
                  handleApplyMessageToGroup(categoria)
                  setMenuAberto(false)
                }}
                className={cn(
                  'w-full px-4 py-2 text-sm text-left cursor-pointer',
                  linhasSelecionadas.length === 0 || !gitConfigs?.message
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-zinc-700',
                )}
              >
                Aplicar mensagem de OF
              </button>
            </div>
          )}
        </div>

        {/* Botão de copiar */}
        {deveExibirPontosPorArquivo && (
          <div className="ml-auto relative flex items-center group">
            <button
              onClick={handleCopy}
              className="flex items-center text-white hover:text-blue-400 transition cursor-pointer"
              aria-label={
                copiado
                  ? `${linhasSelecionadas.length} arquivo(s) selecionado(s)`
                  : `Copiar ${linhasSelecionadas.length} arquivo(s)`
              }
            >
              {copiado ? <Check size={18} /> : <ClipboardCopy size={18} />}
              <span className="ml-1">({linhasSelecionadas.length})</span>
            </button>
            <div className="absolute bottom-full mb-1 right-0 bg-gray-100 text-black text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
              {copiado
                ? `${linhasSelecionadas.length} arquivo(s) selecionado(s)`
                : `Copiar ${linhasSelecionadas.length} arquivo(s)`}
            </div>
          </div>
        )}
      </div>
    )
  }

  const SubcategoriaHeader = ({
    linhas,
    pontosStr,
    codigoGuia,
  }: {
    linhas: { linha: string; idx: number }[]
    pontosStr: string
    codigoGuia: string
  }) => {
    const [copiado, setCopiado] = useState(false)

    const linhasSelecionadas = linhas.filter(
      ({ idx }) =>
        complexidadesSelecionadas[codigoGuia]?.[idx]?.deveContabilizar ?? true,
    )

    const handleCopy = async () => {
      await copiarLinhasParaClipboard(linhasSelecionadas.map((l) => l.linha))
      setCopiado(true)
      setTimeout(() => setCopiado(false), 5000)
    }

    return (
      <div className="flex items-center justify-between mb-1 w-full">
        <h4 className="font-semibold">
          {linhas.length} arquivo(s), {pontosStr} ponto(s) cada,{' '}
          {Number(pontosStr) * linhas.length} ponto(s) total
        </h4>
        <div className="relative group">
          <button
            onClick={handleCopy}
            className="flex items-center text-white hover:text-blue-400 transition cursor-pointer"
            aria-label={
              copiado
                ? `${linhasSelecionadas.length} arquivo(s) selecionado(s)`
                : `Copiar ${linhasSelecionadas.length} arquivo(s)`
            }
          >
            {copiado ? <Check size={18} /> : <ClipboardCopy size={18} />}
            <span className="ml-1">({linhasSelecionadas.length})</span>
          </button>
          <div className="absolute bottom-full mb-1 right-0 bg-gray-100 text-black text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
            {copiado
              ? `${linhasSelecionadas.length} arquivo(s) selecionado(s)`
              : `Copiar ${linhasSelecionadas.length} arquivo(s)`}
          </div>
        </div>
      </div>
    )
  }

  const gerarPdfDasLinhasSelecionadas = (
    categorias: CategoriaAgrupada[],
    complexidadesSelecionadas: ComplexidadeSelecionada,
  ) => {
    const doc = new jsPDF({ orientation: 'portrait' })
    let y = 10

    categorias.forEach((categoria) => {
      const linhasSelecionadas = categoria.linhas
        .map((linha, idx) => {
          const config = complexidadesSelecionadas[categoria.codigoGuia]?.[idx]
          const contabilizar = config?.deveContabilizar ?? true
          return contabilizar ? linha : null
        })
        .filter(Boolean) as string[]

      if (linhasSelecionadas.length === 0) return

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      const titulo = `${categoria.codigoGuia} - ${categoria.descricao}`
      const tituloQuebrado: string[] = doc.splitTextToSize(titulo, 190)
      tituloQuebrado.forEach((linhaTitulo: string) => {
        if (y > 280) {
          doc.addPage()
          y = 10
        }
        doc.text(linhaTitulo, 10, y)
        y += 6
      })

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)

      linhasSelecionadas.forEach((linha, idx) => {
        const textoDividido: string[] = doc.splitTextToSize(
          `${idx + 1}. ${linha}`,
          190,
        )
        textoDividido.forEach((parte: string) => {
          if (y > 280) {
            doc.addPage()
            y = 10
          }
          doc.text(parte, 10, y)
          y += 6
        })
      })

      y += 8
    })

    doc.save('linhas-pontuadas.pdf')
  }

  return (
    <>
      <div className="flex flex-col gap-4 w-full max-w-[1440px] mx-auto p-4 bg-gray-700 rounded-lg shadow-lg">
        {/* Ações */}
        <div className="flex items-center justify-end bg-transparent gap-4">
          {/* Botão de gerar comando Git */}
          <div className="text-white bg-blue-500 rounded-lg">
            <button
              onClick={() => setMostrarModalGit(true)}
              className="flex items-center justify-center gap-2 bg-blue-950 hover:opacity-80 text-white font-bold px-4 py-2 rounded transition cursor-pointer"
            >
              <TerminalSquare className="w-5 h-5" />
              Gerar comando Git
            </button>
          </div>

          {/* Botão de gerar PDF */}
          <div className="text-white bg-red-400 rounded-lg">
            <button
              onClick={() =>
                gerarPdfDasLinhasSelecionadas(
                  categorias,
                  complexidadesSelecionadas,
                )
              }
              disabled={!hasAtLeastOneSelectedLine}
              className={`flex items-center justify-center gap-2 bg-red-400 text-white font-bold px-4 py-2 rounded transition ${
                hasAtLeastOneSelectedLine
                  ? 'hover:opacity-80 cursor-pointer'
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <PdfIcon className="w-5 h-5 text-white" />
              Gerar PDF dos selecionados
            </button>
          </div>
        </div>

        {/* Dropzone */}
        <div
          className={`relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            isDragging ? 'border-blue-400 bg-gray-700' : 'border-gray-500'
          }`}
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {/* Botão da lixeira */}
          {selectedFiles.length > 0 && (
            <div className="absolute top-2 right-2 text-white cursor-pointer z-20">
              <div
                ref={toggleButtonRef}
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuAberto(!menuAberto)
                }}
                className="flex items-center gap-1 bg-red-950 rounded px-2 py-1 hover:bg-red-500 hover:text-white transition"
              >
                <Trash className="w-4 h-4" />
                Remover arquivo
              </div>

              {menuAberto && (
                <div
                  ref={menuRef}
                  className="absolute right-0 mt-2 bg-gray-700 border border-gray-600 rounded shadow-lg p-2 z-50 whitespace-nowrap"
                >
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm text-white hover:bg-gray-600 px-2 py-1 rounded cursor-default"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>{file.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removerArquivo(file)
                        }}
                        className="text-yellow-500 hover:text-red-700 hover:bg-gray-300 rounded px-2 py-1 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* Conteúdo do Dropzone */}
          <span className="text-white text-center">
            {selectedFiles.length > 0 ? (
              <>
                <span className="block">
                  {selectedFiles.length} arquivo(s) selecionado(s):
                </span>
                <span className="block">
                  {selectedFiles.map((file) => file.name).join(', ')}
                </span>
              </>
            ) : (
              'Arraste e solte arquivos .txt aqui ou clique para selecionar'
            )}
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt"
            multiple
            hidden
            onChange={handleChange}
          />
        </div>

        {/* Checkboxes Sprint */}
        <div className="flex justify-center items-center gap-6 mt-4 mb-4 text-white">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={sprint1Selecionada}
              onChange={() => setSprint1Selecionada(!sprint1Selecionada)}
            />
            Adicionar pontuação de ritos ágeis da Sprint 1
          </label>
          <div className="relative group">
            <Info size={16} className="cursor-help pointer-events-auto" />
            <div className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 bg-gray-100 text-black text-xs rounded px-3 py-2 opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10 text-left pointer-events-none">
              <ul className="list-disc list-inside">
                <li>5.32.1 - Participar em “ritos” de sala ágil - 19 pontos</li>
                <li>5.32.2 - Realizar refinamento de requisitos - 17 pontos</li>
                <li>5.32.3 - Realizar refinamento de história - 19 pontos</li>
              </ul>
              <span>Total de pontos para cada Sprint: 45</span>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={sprint2Selecionada}
              onChange={() => setSprint2Selecionada(!sprint2Selecionada)}
            />
            Adicionar pontuação de ritos ágeis da Sprint 2
          </label>
        </div>

        {/* Totais */}
        <div className="flex justify-between items-center mb-4 text-white">
          <h2 className="text-lg font-bold">Arquivos: {totalArquivos}</h2>
          <h2 className="text-lg font-bold">Pontos: {totalPontos}</h2>
        </div>

        {/* Categorias */}
        {categorias.length > 0 && (
          <div className="mt-4 p-4 bg-gray-700 rounded-lg text-white">
            {categorias.map((categoria, categoriaIndex) => {
              const totalPontosDaCategoria = categoria.linhas.reduce(
                (acc, _, idx) => {
                  const config =
                    complexidadesSelecionadas[categoria.codigoGuia]?.[idx]
                  const pontos = config?.pontos ?? categoria.pontos
                  const contabilizar = config?.deveContabilizar ?? true
                  return contabilizar ? acc + pontos : acc
                },
                0,
              )

              const subcategorias =
                categoria.codigoGuia === '5.10.3' ||
                categoria.codigoGuia === '5.10.4'
                  ? subcategorizarPorPontuacao(
                      categoria,
                      complexidadesSelecionadas,
                    )
                  : null

              return (
                <div
                  key={categoria.codigoGuia}
                  className={
                    categoriaIndex > 0
                      ? 'border-t border-gray-600 mt-4 pt-4'
                      : ''
                  }
                >
                  <CategoriaHeader
                    categoria={categoria}
                    totalPontosDaCategoria={totalPontosDaCategoria}
                  />

                  {subcategorias ? (
                    Object.entries(subcategorias).map(([pontosStr, linhas]) => (
                      <div
                        key={pontosStr}
                        className="pl-4 border-l border-gray-500 ml-2 mt-2"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <SubcategoriaHeader
                            linhas={linhas}
                            pontosStr={pontosStr}
                            codigoGuia={categoria.codigoGuia}
                          />
                        </div>
                        <ol className="list-decimal list-inside mb-2">
                          {linhas.map(({ linha, idx }, localIndex) => (
                            <li key={idx} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                className="cursor-pointer"
                                checked={
                                  complexidadesSelecionadas[
                                    categoria.codigoGuia
                                  ]?.[idx]?.deveContabilizar ?? true
                                }
                                onChange={(e) =>
                                  atualizarContabilizacao(
                                    categoria.codigoGuia,
                                    idx,
                                    e.target.checked,
                                  )
                                }
                              />
                              <span className="font-semibold">
                                {localIndex + 1}.
                              </span>{' '}
                              {linha}
                              <select
                                className="bg-gray-600 text-white rounded px-0 py-0 cursor-pointer"
                                value={
                                  complexidadesSelecionadas[
                                    categoria.codigoGuia
                                  ]?.[idx]?.pontos ?? Number(pontosStr)
                                }
                                onChange={(e) =>
                                  atualizarComplexidade(
                                    categoria.codigoGuia,
                                    idx,
                                    parseInt(e.target.value, 10),
                                  )
                                }
                              >
                                {[
                                  { label: 'baixa', value: categoria.pontos },
                                  {
                                    label: 'media',
                                    value: categoria.pontos * 2,
                                  },
                                  {
                                    label: 'alta',
                                    value: categoria.pontos * 3,
                                  },
                                ].map((nivel) => (
                                  <option
                                    key={nivel.label}
                                    value={nivel.value}
                                    className="cursor-pointer"
                                  >
                                    {nivel.label} ({nivel.value} ponto(s))
                                  </option>
                                ))}
                              </select>
                            </li>
                          ))}
                        </ol>
                      </div>
                    ))
                  ) : (
                    <div className="pl-4 border-l border-gray-500 ml-2 mt-2">
                      <ol className="list-decimal list-inside mb-2">
                        {categoria.linhas.map((linha, idx) => {
                          const config =
                            complexidadesSelecionadas[categoria.codigoGuia]?.[
                              idx
                            ]

                          const deveContabilizar =
                            config?.deveContabilizar ?? true

                          return (
                            <li key={idx} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                className="cursor-pointer"
                                checked={deveContabilizar}
                                onChange={(e) =>
                                  atualizarContabilizacao(
                                    categoria.codigoGuia,
                                    idx,
                                    e.target.checked,
                                  )
                                }
                              />
                              <span className="font-semibold">{idx + 1}.</span>{' '}
                              {linha}
                            </li>
                          )
                        })}
                      </ol>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal GitCommand */}
      <GitCommand
        visible={mostrarModalGit}
        onConfirm={handleConfirmConfig}
        onClose={() => setMostrarModalGit(false)}
      />
    </>
  )
}
