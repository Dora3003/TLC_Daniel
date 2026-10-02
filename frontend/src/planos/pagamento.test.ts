import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  codigoCopiavel,
  codigosDoPagamento,
  pagamentoConfirmado,
  podeIniciarPagamento,
  qrEhImagem,
} from './pagamento.ts';

describe('pagamento', () => {
  it('deve confirmar somente o status pago', () => {
    assert.equal(pagamentoConfirmado('pago'), true);
    assert.equal(pagamentoConfirmado('ativo'), false);
    assert.equal(pagamentoConfirmado('pendente'), false);
    assert.equal(pagamentoConfirmado(undefined), false);
  });

  it('deve iniciar pagamento só com ticket ativo', () => {
    assert.equal(podeIniciarPagamento('ativo'), true);
    assert.equal(podeIniciarPagamento('pago'), false);
    assert.equal(podeIniciarPagamento('multa_pendente'), false);
  });

  it('deve ignorar QR e código ausentes ou vazios', () => {
    assert.deepEqual(codigosDoPagamento({}), { qrCode: null, codigo: null });
    assert.deepEqual(codigosDoPagamento({ qrCode: '  ', codigo: 10 }), { qrCode: null, codigo: null });
  });

  it('deve usar o código devolvido pela API', () => {
    const codigos = codigosDoPagamento({ qrCode: 'payload', codigo: ' ABC123 ' });
    assert.equal(codigos.codigo, 'ABC123');
    assert.equal(codigoCopiavel(codigos), 'ABC123');
    assert.equal(qrEhImagem('payload'), false);
    assert.equal(qrEhImagem('data:image/png;base64,aaa'), true);
  });
});
