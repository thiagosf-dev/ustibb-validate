import { RegrasPontuacao } from '../models/Regras'
import {
  regra5_10_18,
  regra5_10_21,
  regra5_10_7,
  regra5_10_8,
  regra5_26_2,
  regra5_26_3,
} from './regras'

export const pontuacaoPorNome: Record<string, RegrasPontuacao> = {
  'karma.conf.js': { ...regra5_10_7, ...regra5_10_8 },
  Jenkinsfile: { ...regra5_10_7, ...regra5_10_8 },
  'package.json': { ...regra5_10_7, ...regra5_10_8 },
  'tsconfig.json': { ...regra5_10_7, ...regra5_10_8 },
  '.eslintrc.json': { ...regra5_10_7, ...regra5_10_8 },
  '.gitignore': { ...regra5_10_7, ...regra5_10_8 },
  '.prettierignore': { ...regra5_10_7, ...regra5_10_8 },
  '.prettierrc': { ...regra5_10_7, ...regra5_10_8 },
  'webpack.config.js': { ...regra5_10_7, ...regra5_10_8 },
  'settings.json': { ...regra5_10_7, ...regra5_10_8 },
  'README.md': { ...regra5_26_2 },
  'values.yaml': { ...regra5_26_3 },
}

export const pontuacaoPorTipo: Record<string, RegrasPontuacao> = {
  'spec.ts': { ...regra5_10_18, ...regra5_10_21 },
  'spec.js': { ...regra5_10_18, ...regra5_10_21 },
  'test.js': { ...regra5_10_18, ...regra5_10_21 },
  'test.ts': { ...regra5_10_18, ...regra5_10_21 },
  'spec.json': { ...regra5_10_18, ...regra5_10_21 },
  html: {
    A: {
      pontos: 10,
      codigoGuia: '5.10.1',
      descricao:
        'Criação de tela HTML ou XHTML ou JSP ou XML ou VTL ou XSL ou Swing ou AWT ou XUI ou PHP',
      unidadeMedida: 'Por arquivo alterado',
      temNivelComplexidade: false,
    },
    M: {
      pontos: 5,
      codigoGuia: '5.10.2',
      descricao:
        'Alteração de tela HTML ou XHTML ou JSP ou XML ou VTL ou XSL ou Swing ou AWT ou XUI ou PHP',
      unidadeMedida: 'Por arquivo alterado',
      temNivelComplexidade: false,
    },
  },
  xhtml: {
    A: {
      pontos: 10,
      codigoGuia: '5.10.1',
      descricao:
        'Criação de tela HTML ou XHTML ou JSP ou XML ou VTL ou XSL ou Swing ou AWT ou XUI ou PHP',
      unidadeMedida: 'Por arquivo alterado',
      temNivelComplexidade: false,
    },
    M: {
      pontos: 5,
      codigoGuia: '5.10.2',
      descricao:
        'Alteração de tela HTML ou XHTML ou JSP ou XML ou VTL ou XSL ou Swing ou AWT ou XUI ou PHP',
      unidadeMedida: 'Por arquivo alterado',
      temNivelComplexidade: false,
    },
  },
  css: {
    A: {
      pontos: 8,
      codigoGuia: '5.10.3',
      descricao: 'Criação CSS ou SCSS',
      unidadeMedida: 'Por arquivo alterado',
      temNivelComplexidade: true,
      niveisComplexidade: [
        { label: 'baixa', value: 8 },
        { label: 'media', value: 16 },
        { label: 'alta', value: 24 },
      ],
    },
    M: {
      pontos: 4,
      codigoGuia: '5.10.4',
      descricao: 'Alteração CSS ou SCSS',
      unidadeMedida: 'Por arquivo alterado',
      temNivelComplexidade: true,
      niveisComplexidade: [
        { label: 'baixa', value: 4 },
        { label: 'media', value: 8 },
        { label: 'alta', value: 12 },
      ],
    },
  },
  scss: {
    A: {
      pontos: 8,
      codigoGuia: '5.10.3',
      descricao: 'Criação CSS ou SCSS',
      unidadeMedida: 'Por arquivo alterado',
      temNivelComplexidade: true,
      niveisComplexidade: [
        { label: 'baixa', value: 8 },
        { label: 'media', value: 16 },
        { label: 'alta', value: 24 },
      ],
    },
    M: {
      pontos: 4,
      codigoGuia: '5.10.4',
      descricao: 'Alteração CSS ou SCSS',
      unidadeMedida: 'Por arquivo alterado',
      temNivelComplexidade: true,
      niveisComplexidade: [
        { label: 'baixa', value: 4 },
        { label: 'media', value: 8 },
        { label: 'alta', value: 12 },
      ],
    },
  },
  js: {
    A: {
      pontos: 10,
      codigoGuia: '5.10.5',
      descricao: 'Criação JavaScript',
      unidadeMedida: 'Por arquivo alterado',
      temNivelComplexidade: false,
    },
    M: {
      pontos: 5,
      codigoGuia: '5.10.6',
      descricao: 'Alteração JavaScript',
      unidadeMedida: 'Por arquivo alterado',
      temNivelComplexidade: false,
    },
  },
  ts: {
    A: {
      pontos: 10,
      codigoGuia: '5.10.5',
      descricao: 'Criação JavaScript',
      unidadeMedida: 'Por arquivo alterado',
      temNivelComplexidade: false,
    },
    M: {
      pontos: 5,
      codigoGuia: '5.10.6',
      descricao: 'Alteração JavaScript',
      unidadeMedida: 'Por arquivo alterado',
      temNivelComplexidade: false,
    },
  },
  tsx: {
    A: {
      pontos: 10,
      codigoGuia: '5.10.5',
      descricao: 'Criação JavaScript',
      unidadeMedida: 'Por arquivo alterado',
      temNivelComplexidade: false,
    },
    M: {
      pontos: 5,
      codigoGuia: '5.10.6',
      descricao: 'Alteração JavaScript',
      unidadeMedida: 'Por arquivo alterado',
      temNivelComplexidade: false,
    },
  },
  xml: {
    A: {
      pontos: 2.5,
      codigoGuia: '5.10.7',
      descricao: 'Criação de arquivo chave/valor ou tipo XML',
      unidadeMedida: 'Por arquivo alterado',
      temNivelComplexidade: false,
    },
    M: {
      pontos: 1.5,
      codigoGuia: '5.10.8',
      descricao:
        'Alteração de arquivo chave/valor ou tipo XML (jenkinfiles, pom.xml, package.json)',
      unidadeMedida: 'Por arquivo alterado',
      temNivelComplexidade: false,
    },
  },
  java: {
    A: {
      pontos: 5.5,
      codigoGuia: '5.10.9',
      descricao: 'Criação de objetos de Integração e Negócio Java',
      unidadeMedida: 'Por arquivo alterado',
      temNivelComplexidade: false,
    },
    M: {
      pontos: 3.5,
      codigoGuia: '5.10.10',
      descricao: 'Alteração de Objetos de Integração e Negócio Java',
      unidadeMedida: 'Por arquivo alterado',
      temNivelComplexidade: false,
    },
  },
  Dockerfile: {
    A: {
      pontos: 2,
      codigoGuia: '5.15.8',
      descricao: 'Alteração de arquivo de definição "Dockerfile"',
      unidadeMedida: 'Por arquivo alterado',
      temNivelComplexidade: false,
    },
    M: {
      pontos: 2,
      codigoGuia: '5.15.8',
      descricao: 'Alteração de arquivo de definição "Dockerfile"',
      unidadeMedida: 'Por arquivo alterado',
      temNivelComplexidade: false,
    },
  },
  'docker-compose': {
    A: {
      pontos: 2,
      codigoGuia: '5.15.8',
      descricao: 'Alteração de arquivo de definição "Docker Compose"',
      unidadeMedida: 'Por arquivo alterado',
      temNivelComplexidade: false,
    },
    M: {
      pontos: 2,
      codigoGuia: '5.15.8',
      descricao: 'Alteração de arquivo de definição "Docker Compose"',
      unidadeMedida: 'Por arquivo alterado',
      temNivelComplexidade: false,
    },
  },
}
