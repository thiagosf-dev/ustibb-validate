export type RegrasPontuacao = {
  [key: string]: {
    pontos: number
    codigoGuia: string
    descricao: string
    unidadeMedida: string
    descricaoComplexidade?: string
    temNivelComplexidade: boolean
    niveisComplexidade?: { label: string; value: number }[]
  }
}
