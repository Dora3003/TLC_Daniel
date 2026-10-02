import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { decidirAcesso } from './acesso.ts';
import type { Sessao } from './sessao.ts';

const cliente: Sessao = { papel: 'cliente', token: 'U3T98LX' };
const atendente: Sessao = { papel: 'atendente' };

describe('decidirAcesso', () => {
  it('deve abrir o ticket quando a URL traz o token do login', () => {
    assert.deepEqual(decidirAcesso('/', '?token=u3t98lx', null), {
      permitido: true,
      destino: '/cliente/planos',
      sessao: cliente,
    });
  });

  it('deve impedir o cliente de abrir o painel operacional', () => {
    assert.deepEqual(decidirAcesso('/atendimento', '', cliente), {
      permitido: false,
      destino: '/cliente/planos',
      sessao: cliente,
      motivo: 'cliente_sem_acesso_operacional',
    });
  });

  it('deve impedir o cliente de registrar entrada', () => {
    assert.equal(decidirAcesso('/atendimento/entrada', '', cliente).permitido, false);
  });

  it('deve manter o cliente na rota de planos', () => {
    assert.equal(decidirAcesso('/cliente/planos', '', cliente).permitido, true);
  });

  it('deve manter o cliente na rota de revisão', () => {
    assert.equal(decidirAcesso('/cliente/revisao', '', cliente).permitido, true);
  });

  it('deve manter o cliente na rota de contratações', () => {
    assert.equal(decidirAcesso('/cliente/contratacoes', '', cliente).permitido, true);
    assert.equal(decidirAcesso('/cliente/comprovante', '', cliente).permitido, true);
  });

  it('deve manter o cliente na rota de pagamento do próprio ticket', () => {
    assert.deepEqual(decidirAcesso('/cliente/pagamento', '', cliente), {
      permitido: true,
      destino: '/cliente/pagamento',
      sessao: cliente,
    });
  });

  it('deve recusar token fora do formato da API', () => {
    assert.deepEqual(decidirAcesso('/', '?token=abc', cliente), {
      permitido: false,
      destino: '/',
      sessao: null,
      motivo: 'token_invalido',
    });
  });

  it('deve exigir token para a área do cliente', () => {
    assert.deepEqual(decidirAcesso('/cliente/multa', '', null), {
      permitido: false,
      destino: '/',
      sessao: null,
      motivo: 'token_ausente',
    });
  });

  it('deve exigir e-mail e senha para abrir o painel', () => {
    assert.deepEqual(decidirAcesso('/atendimento/veiculos', '', null), {
      permitido: false,
      destino: '/atendimento',
      sessao: null,
      motivo: 'login_obrigatorio',
    });
  });

  it('deve manter o atendente autenticado no painel', () => {
    assert.equal(decidirAcesso('/atendimento', '', atendente).permitido, true);
    assert.equal(decidirAcesso('/', '', atendente).destino, '/atendimento');
  });

  it('deve impedir o atendente de abrir o pagamento do cliente', () => {
    assert.deepEqual(decidirAcesso('/cliente/pagamento', '', atendente), {
      permitido: false,
      destino: '/atendimento',
      sessao: atendente,
      motivo: 'atendente_sem_acesso_pagamento',
    });
  });

  it('deve impedir o atendente de abrir a multa do cliente', () => {
    assert.equal(decidirAcesso('/cliente/multa', '', atendente).motivo, 'atendente_sem_acesso_pagamento');
  });

  it('deve trocar a sessão do atendente quando o link do ticket é aberto', () => {
    assert.equal(decidirAcesso('/', '?token=U3T98LX', atendente).sessao?.papel, 'cliente');
  });

  it('deve devolver o cliente à própria área a partir da entrada pública', () => {
    assert.equal(decidirAcesso('/', '', cliente).destino, '/cliente/planos');
  });

  it('deve rejeitar rota desconhecida sem inventar destino operacional', () => {
    assert.deepEqual(decidirAcesso('/planos', '', null), {
      permitido: false,
      destino: '/',
      sessao: null,
      motivo: 'rota_inexistente',
    });
  });

  it('deve abrir a página de confirmação do QR com o token', () => {
    assert.deepEqual(decidirAcesso('/pagar', '?token=U3T98LX', null), {
      permitido: true,
      destino: '/pagar',
      sessao: cliente,
    });
    assert.equal(decidirAcesso('/pagar-multa', '?token=U3T98LX', null).destino, '/pagar-multa');
    assert.equal(decidirAcesso('/pagar', '', null).motivo, 'token_ausente');
  });

  it('deve ignorar barra final na rota do cliente', () => {
    assert.equal(decidirAcesso('/cliente/', '', cliente).destino, '/cliente');
  });
});
