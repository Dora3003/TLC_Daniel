import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  codigoCopiavel,
  codigosDoPagamento,
  imagemQrDaUrl,
  pagamentoConfirmado,
  podeIniciarPagamento,
  qrEhImagem,
  urlConfirmacaoMulta,
  urlConfirmacaoPagamento,
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

  it('deve montar URL e imagem de QR para confirmar o pagamento', () => {
    assert.equal(
      urlConfirmacaoPagamento('https://tlc-daniel.onrender.com', 'u3t98lx'),
      'https://tlc-daniel.onrender.com/pagar?token=U3T98LX',
    );
    assert.equal(
      urlConfirmacaoMulta('https://tlc-daniel.onrender.com/', 'U3T98LX'),
      'https://tlc-daniel.onrender.com/pagar-multa?token=U3T98LX',
    );
    const imagem = imagemQrDaUrl('https://tlc-daniel.onrender.com/pagar?token=U3T98LX');
    assert.match(imagem, /^https:\/\/api\.qrserver\.com\//);
    assert.equal(qrEhImagem(imagem), true);
  });
});
