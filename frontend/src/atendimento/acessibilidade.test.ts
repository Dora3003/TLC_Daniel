import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function ler(caminho: string): string {
  return readFileSync(new URL(caminho, import.meta.url), 'utf8');
}

describe('acessibilidade e responsividade', () => {
  it('deve anunciar erro e status com texto, além da cor', () => {
    const areas = ler('../paginas/areas.tsx');
    const entrada = ler('./entrada-pagina.tsx');
    assert.match(areas, /role="alert"/);
    assert.match(entrada, /role="alert"/);
    assert.match(entrada, /aria-describedby=\{lotado \? 'aviso-lotacao'/);
    assert.match(ler('../planos/checkout.tsx'), /role="status"/);
  });

  it('deve manter foco visível, atalho de teclado e página atual identificada', () => {
    const css = ler('../App.css');
    assert.match(css, /focus-visible/);
    assert.match(css, /aria-current='page'/);
    assert.match(ler('../paginas/areas.tsx'), /Ir para o conteúdo/);
    assert.match(ler('../rotas/navegacao.tsx'), /aria-current/);
  });

  it('deve adaptar o layout estreito e a tabela de alocações', () => {
    const css = ler('../App.css');
    assert.match(css, /max-width: 40rem/);
    assert.match(css, /tabela-rolagem/);
    const html = ler('../../index.html');
    assert.match(html, /lang="pt-BR"/);
    assert.match(html, /viewport/);
    const lista = ler('./alocacoes-pagina.tsx');
    assert.match(lista, /scope="col"/);
    assert.match(lista, /<caption>/);
  });
});
