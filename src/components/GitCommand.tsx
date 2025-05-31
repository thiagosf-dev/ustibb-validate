import { Check, Copy, Send, X, RotateCcw, Eraser, Info } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Tooltip } from './ui/Tooltip'

export interface GitCommandConfig {
  since: string
  until: string
  author: string
  message: string
}

interface GitCommandModalProps {
  visible: boolean
  onClose: () => void
  onConfirm: (config: GitCommandConfig) => void
}

const getDefaultDateRange = (): { since: string; until: string } => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  const format = (date: Date) => date.toISOString().split('T')[0]

  return {
    since: format(new Date(year, month, 1)),
    until: format(new Date(year, month + 1, 0)),
  }
}

export const GitCommand = ({
  visible,
  onClose,
  onConfirm,
}: GitCommandModalProps) => {
  const defaultDates = useMemo(() => getDefaultDateRange(), [])

  const [since, setSince] = useState('')
  const [until, setUntil] = useState('')
  const [author, setAuthor] = useState('')
  const [ofMessage, setOfMessage] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (visible) {
      setSince(defaultDates.since)
      setUntil(defaultDates.until)
      setAuthor('Seu nome aqui')
      setOfMessage('')
    }
  }, [visible, defaultDates])

  const handleResetDates = useCallback(() => {
    const { since, until } = getDefaultDateRange()
    setSince(since)
    setUntil(until)
  }, [])

  const handleClearTextFields = useCallback(() => {
    setAuthor('')
    setOfMessage('')
  }, [])

  const comando = `REPO_NAME=$(basename $(git rev-parse --show-toplevel)) && \\
BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD) && \\
BRANCH_SHORT=$(echo "$BRANCH_NAME" | sed 's|/|_|g' | cut -c1-50) && \\
HU_DETAILS=$(echo "$BRANCH_NAME" | sed -E 's|.*/||') && \\
OUTPUT_FILE='commits_"$BRANCH_SHORT".txt' && \\
git log \\
  --author="${author}" \\
  --since="${since}" \\
  --until="${until}" \\
  --abbrev-commit --abbrev=10 \\
  --pretty=format:"%h %ad %s" --date=short --name-status | \\
awk -v repo="$REPO_NAME" -v branch="$BRANCH_NAME" -v hu="$HU_DETAILS" '
{
  if (NF >= 3 && $2 !~ /^[A-Z]$/) {
    if (commit_number != "") { print "" }
    commit_number = $1
    commit_date = $2
    commit_message = substr($0, index($0, $3))
    print repo " : " commit_number " : " branch " : " commit_message " : " commit_date
  } else if ($0 != "") {
    status = $1
    file = $2
    print status " " repo "/" file "#" commit_number ";" hu
  }
}
' > "$OUTPUT_FILE"`

  const handleCopyCommand = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(comando)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Erro ao copiar para a área de transferência', err)
    }
  }, [comando])

  const isValid = useMemo(
    () => since && until && author,
    [since, until, author],
  )

  const handleConfirm = useCallback(() => {
    if (isValid) {
      onConfirm({ since, until, author, message: ofMessage })
      onClose()
    }
  }, [isValid, since, until, author, ofMessage, onClose, onConfirm])

  if (!visible) return null

  return createPortal(
    <div className="fixed inset-0 z-50 bg-[rgba(0,0,0,0.5)] flex items-center justify-center p-4">
      <div className="relative bg-gray-600 w-full max-w-2xl rounded-xl shadow-xl p-6 max-h-screen h-auto overflow-y-auto overflow-x-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 hover:bg-black/10 text-red-600 rounded-full cursor-pointer text-xl font-bold transition-transform transform hover:scale-125 p-2"
          aria-label="Fechar modal"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-center text-gray-950">
          Configurações do comando Git
        </h2>

        {/* Campos de configuração */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 flex gap-4 items-end">
            {/* Data inicial */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-950">
                Data inicial
              </label>
              <input
                type="date"
                inputMode="none"
                className="mt-1 w-full border border-gray-950 text-cyan-400 rounded px-3 py-2 outline-none cursor-pointer"
                value={since}
                onChange={(e) => setSince(e.target.value)}
                onKeyDown={(e) => e.preventDefault()}
              />
            </div>

            {/* Data final */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-950">
                Data final
              </label>
              <input
                type="date"
                inputMode="none"
                className="mt-1 w-full border border-gray-950 text-cyan-400 rounded px-3 py-2 outline-none cursor-pointer"
                value={until}
                onChange={(e) => setUntil(e.target.value)}
                onKeyDown={(e) => e.preventDefault()}
              />
            </div>
          </div>

          {/* Autor */}
          <div>
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-950">
                Autor
              </label>
              <Tooltip text="Campo obrigatório que deve ser o mesmo nome de 'author' registrado no arquivo de configuração do Git">
                <Info className="w-4 h-4 text-yellow-500 cursor-help" />
              </Tooltip>
            </div>
            <input
              type="text"
              placeholder="Nome do author nas configurações do git"
              className="mt-1 w-full border border-gray-950 text-cyan-400 rounded px-3 py-2 outline-none"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </div>

          {/* Mensagem na OF */}
          <div>
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-950">
                Mensagem na OF
              </label>
              <Tooltip
                text="ATENÇÃO: O texto informado aqui será o texto que irá como a mensagem de TODO para todos os artefatos de todos os arquivos selecionado"
                position="right"
              >
                <Info className="w-4 h-4 text-yellow-500 cursor-help" />
              </Tooltip>
            </div>
            <input
              type="text"
              placeholder="Mensagem da OF caso queira substituir a padrão do commit..."
              className="mt-1 w-full border border-gray-950 text-cyan-400 rounded px-3 py-2 outline-none"
              value={ofMessage}
              onChange={(e) => setOfMessage(e.target.value)}
            />
          </div>
        </div>

        {/* Ações e Botões */}
        <div className="flex justify-between items-center mt-6">
          <div className="flex gap-3">
            <Tooltip text="Resetar datas para o mês atual" position="left">
              <button
                onClick={handleResetDates}
                className="p-2 rounded-full hover:bg-gray-200 transition cursor-pointer"
              >
                <RotateCcw className="text-black" size={20} />
              </button>
            </Tooltip>

            <Tooltip text="Limpar campos de texto" position="left">
              <button
                onClick={handleClearTextFields}
                className="p-2 rounded-full hover:bg-gray-200 transition cursor-pointer"
              >
                <Eraser className="text-black" size={20} />
              </button>
            </Tooltip>
          </div>

          <button
            onClick={handleConfirm}
            disabled={!isValid}
            className={`flex items-center gap-2 px-4 py-2 font-semibold rounded transition ${
              isValid
                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                : 'bg-gray-400 text-white cursor-not-allowed'
            }`}
          >
            <Send size={16} />
            Confirmar configuração
          </button>
        </div>

        {/* Comando do gerado */}
        <div className="relative mt-6 p-4 bg-gray-300 text-sm rounded overflow-y-auto whitespace-pre-wrap font-mono border border-gray-950 text-gray-800">
          <button
            onClick={handleCopyCommand}
            className="absolute top-2 right-2 text-gray-700 hover:text-black cursor-pointer transition"
            title={copied ? 'Copiado!' : 'Copiar'}
          >
            {copied ? (
              <Check size={18} className="text-green-600" />
            ) : (
              <Copy size={18} />
            )}
          </button>
          {comando}
        </div>
      </div>
    </div>,
    document.body,
  )
}
