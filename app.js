/* ============================================================
   Lume . Protótipo
   Tudo em memória: ao recarregar a página, volta ao estado inicial.
   Para virar produto, PRODUTOS e PEDIDOS viram coleções do Firestore
   e st.logado vira Firebase Auth.
   ============================================================ */

(function () {
  'use strict';

  /* =================== dados de demonstração =================== */

  // Confecção fictícia de propósito. Para uma visita, troque nome e cidade
  // pelos da confecção que vai receber a demonstração.
  var LOJA = {
    nome: 'Alecrim Jeans',
    cidade: 'Toritama, PE',
    minimo: 400,        // pedido mínimo em reais
    // Regra do mínimo: 'valor', 'pecas' ou 'ambos'. minModelo é o mínimo de
    // peças por modelo (somando as cores); 0 desliga.
    minTipo: 'valor',
    minPecas: 30,
    minModelo: 0,
    colecao: 'Verão 27',
    chamada: 'Lavagens novas, modelagem alta e grade fechada do 36 ao 46.',
    // O plano decide como o pedido fecha. Básico: mensagem pronta para o
    // WhatsApp do comercial. Pro: Pix e cartão dentro do próprio catálogo.
    // Quem troca o plano é a 42.dev, no painel de operação.
    plano: 'basico',
    // Vazio de propósito: com número, o link já abre a conversa certa;
    // sem número, o WhatsApp pergunta para quem mandar.
    whats: '',
    descontoPix: 3,     // % de desconto para quem paga no Pix
    parcSemJuros: 3,    // até quantas vezes sem juros no cartão
    parcMax: 6,         // parcelamento máximo
    jurosMes: 2.49,     // % ao mês acima das parcelas sem juros
    // Identidade do lojista no catálogo. logo: 'demo' desenha a logo de
    // exemplo; uma imagem enviada vira { src }; null mostra o nome escrito.
    logo: 'demo',
    logoTopo: 'logo',   // 'logo' ou 'nome': o que aparece no topo
    logoTam: 'm',       // p, m ou g
    trocaSeg: 6         // segundos entre um banner e outro; 0 = não troca sozinho
  };

  var PLANOS = {
    basico: { nome: 'Básico', preco: 299 },
    pro: { nome: 'Pro', preco: 649 }
  };
  var IMPLANTACAO = 699;

  /* ---------- operação da 42.dev ----------
     Dados simulados para a terceira visão da demonstração. A Alecrim Jeans
     é a mesma loja das outras duas visões: o plano dela aqui é LOJA.plano,
     então trocar aqui muda o fechamento do pedido no catálogo na hora.
     As outras confecções são inventadas e não têm painel próprio.        */
  var CONFECCOES = [
    { id: 'alecrim', desde: 'set 2026', sit: 'ativo', cob: 'dia' },
    { id: 't2', nome: 'Dunas Índigo', cidade: 'Toritama, PE', plano: 'pro', desde: 'set 2026',
      sit: 'ativo', cob: 'dia', pedidos: 64, produtos: 88 },
    { id: 't3', nome: 'Bordô Confecções', cidade: 'Santa Cruz do Capibaribe, PE', plano: 'basico', desde: 'out 2026',
      sit: 'ativo', cob: 'atraso', venc: '10 nov', pedidos: 19, produtos: 41 },
    { id: 't4', nome: 'Fio de Prumo Malharia', cidade: 'Caruaru, PE', plano: 'basico', desde: 'out 2026',
      sit: 'ativo', cob: 'dia', pedidos: 23, produtos: 36 },
    { id: 't5', nome: 'Cajá Moda Praia', cidade: 'Toritama, PE', plano: 'pro', desde: 'nov 2026',
      sit: 'impl', cob: 'impl', pedidos: 0, produtos: 12,
      etapas: { contrato: true, impl: true, produtos: false, vitrine: false, whats: false, treino: false } }
  ];

  var ETAPAS_IMPL = [
    ['contrato', 'Contrato assinado'],
    ['impl', 'Implantação paga'],
    ['produtos', 'Produtos e tabelas de tamanho cadastrados'],
    ['vitrine', 'Logo e banners na Vitrine'],
    ['whats', 'WhatsApp do comercial configurado'],
    ['treino', 'Treinamento da equipe feito']
  ];

  // Registro de cada vez que a 42.dev entra no painel de um cliente.
  // O lojista vê os dele em Ajustes.
  var ACESSOS = [
    { conf: 'alecrim', quem: 'Suporte 42.dev', motivo: 'ajudar a importar a planilha de produtos', data: '12 nov', ini: '14:05', fim: '14:32' },
    { conf: 't3', quem: 'Suporte 42.dev', motivo: 'conferir um pedido que entrou duplicado', data: '08 nov', ini: '10:10', fim: '10:18' }
  ];

  /* ---------- cores ----------
     A plataforma vende qualquer peça, não só jeans. Por isso a cor é um
     catálogo aberto: cada entrada tem só o nome e o hex, e os tons claro e
     escuro do desenho saem de conta em cima do hex. Para pôr uma cor nova,
     basta acrescentar uma linha aqui.                                      */

  var CORES = {
    // Jeans
    indigo:    { nome: 'Índigo',          hex: '#4C5D79', grupo: 'Jeans' },
    jeansclaro:{ nome: 'Jeans claro',     hex: '#9DB0C7', grupo: 'Jeans' },
    jeansmedio:{ nome: 'Jeans médio',     hex: '#6E82A0', grupo: 'Jeans' },
    jeansesc:  { nome: 'Jeans escuro',    hex: '#313D51', grupo: 'Jeans' },
    blackjeans:{ nome: 'Black jeans',     hex: '#33333B', grupo: 'Jeans' },
    delave:    { nome: 'Delavê',          hex: '#B9C6D6', grupo: 'Jeans' },
    // Neutros
    branco:    { nome: 'Branco',          hex: '#FBFBF9', grupo: 'Neutros' },
    offwhite:  { nome: 'Off white',       hex: '#F0EBE0', grupo: 'Neutros' },
    cru:       { nome: 'Cru',             hex: '#E4DAC6', grupo: 'Neutros' },
    bege:      { nome: 'Bege',            hex: '#D6C3A5', grupo: 'Neutros' },
    areia:     { nome: 'Areia',           hex: '#C9B391', grupo: 'Neutros' },
    caqui:     { nome: 'Caqui',           hex: '#A89372', grupo: 'Neutros' },
    cinzaclaro:{ nome: 'Cinza claro',     hex: '#D2D2D0', grupo: 'Neutros' },
    mescla:    { nome: 'Cinza mescla',    hex: '#A9A9A6', grupo: 'Neutros' },
    chumbo:    { nome: 'Chumbo',          hex: '#55555A', grupo: 'Neutros' },
    preto:     { nome: 'Preto',           hex: '#232326', grupo: 'Neutros' },
    // Terrosos
    marrom:    { nome: 'Marrom',          hex: '#6B4A33', grupo: 'Terrosos' },
    cafe:      { nome: 'Café',            hex: '#4A3326', grupo: 'Terrosos' },
    caramelo:  { nome: 'Caramelo',        hex: '#B07A42', grupo: 'Terrosos' },
    terracota: { nome: 'Terracota',       hex: '#B5674A', grupo: 'Terrosos' },
    ferrugem:  { nome: 'Ferrugem',        hex: '#9C4F2E', grupo: 'Terrosos' },
    mostarda:  { nome: 'Mostarda',        hex: '#D2A33C', grupo: 'Terrosos' },
    // Quentes
    vermelho:  { nome: 'Vermelho',        hex: '#C1292E', grupo: 'Quentes' },
    vinho:     { nome: 'Vinho',           hex: '#7A2432', grupo: 'Quentes' },
    coral:     { nome: 'Coral',           hex: '#E8705A', grupo: 'Quentes' },
    laranja:   { nome: 'Laranja',         hex: '#E07B2E', grupo: 'Quentes' },
    salmao:    { nome: 'Salmão',          hex: '#F0A694', grupo: 'Quentes' },
    rosa:      { nome: 'Rosa',            hex: '#E59BB4', grupo: 'Quentes' },
    pink:      { nome: 'Pink',            hex: '#D4357E', grupo: 'Quentes' },
    rose:      { nome: 'Rosê',            hex: '#C98B86', grupo: 'Quentes' },
    // Frios
    marinho:   { nome: 'Azul marinho',    hex: '#243356', grupo: 'Frios' },
    royal:     { nome: 'Azul royal',      hex: '#2A52A0', grupo: 'Frios' },
    serenity:  { nome: 'Azul serenity',   hex: '#90AFD4', grupo: 'Frios' },
    turquesa:  { nome: 'Turquesa',        hex: '#2E9BA3', grupo: 'Frios' },
    militar:   { nome: 'Verde militar',   hex: '#4A5240', grupo: 'Frios' },
    oliva:     { nome: 'Verde oliva',     hex: '#7A7F45', grupo: 'Frios' },
    bandeira:  { nome: 'Verde bandeira',  hex: '#1F7A4C', grupo: 'Frios' },
    agua:      { nome: 'Verde água',      hex: '#9CC9B8', grupo: 'Frios' },
    lilas:     { nome: 'Lilás',           hex: '#B59BD1', grupo: 'Frios' },
    roxo:      { nome: 'Roxo',            hex: '#6B3F8C', grupo: 'Frios' },
    // Pastéis
    amarelobb: { nome: 'Amarelo bebê',    hex: '#F3E3A3', grupo: 'Pastéis' },
    azulbb:    { nome: 'Azul bebê',       hex: '#B8D3E8', grupo: 'Pastéis' },
    menta:     { nome: 'Verde menta',     hex: '#B7DEC8', grupo: 'Pastéis' },
    lavanda:   { nome: 'Lavanda',         hex: '#D3C7E6', grupo: 'Pastéis' }
  };

  var GRUPOS_COR = ['Jeans', 'Neutros', 'Terrosos', 'Quentes', 'Frios', 'Pastéis'];

  function rgb(hex) {
    return [parseInt(hex.substr(1, 2), 16), parseInt(hex.substr(3, 2), 16), parseInt(hex.substr(5, 2), 16)];
  }
  function hx(n) { var s = Math.round(Math.min(255, Math.max(0, n))).toString(16); return s.length < 2 ? '0' + s : s; }
  function mistura(hex, alvo, p) {
    var c = rgb(hex);
    return '#' + hx(c[0] + (alvo[0] - c[0]) * p) + hx(c[1] + (alvo[1] - c[1]) * p) + hx(c[2] + (alvo[2] - c[2]) * p);
  }
  function clarear(hex, p) { return mistura(hex, [255, 255, 255], p); }
  function escurecer(hex, p) { return mistura(hex, [0, 0, 0], p); }
  // Luminância relativa, para saber se a cor é clara ou escura.
  function lum(hex) {
    var c = rgb(hex).map(function (v) {
      v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }

  var cacheTom = {};

  // Devolve a cor pronta para desenhar: base, claro, escuro, linha de costura
  // e cor de botão. Em jeans a costura é dourada; nas outras peças ela é
  // tom sobre tom, senão toda camiseta pareceria jeans.
  function cor(chave, tecido) {
    var ck = chave + '|' + (tecido || 'plano');
    if (cacheTom[ck]) return cacheTom[ck];

    var def = CORES[chave] || CORES.indigo;
    var h = def.hex, L = lum(h), claro = L > 0.72, escuro = L < 0.06;

    var t = {
      chave: chave,
      nome: def.nome,
      hex: h,
      base: h,
      cla: clarear(h, claro ? 0.05 : 0.17),
      // Em cor muito escura, o tom "escuro" clareia um pouco: senão o cós
      // e a gola somem dentro da peça.
      esc: escuro ? clarear(h, 0.14) : escurecer(h, claro ? 0.13 : 0.21),
      linha: tecido === 'jeans' ? '#E2C080' : (claro ? escurecer(h, 0.26) : clarear(h, 0.30)),
      metal: tecido === 'jeans' ? '#C6B189' : (claro ? escurecer(h, 0.40) : clarear(h, 0.40)),
      // Peça quase branca precisa de contorno para não sumir no fundo creme.
      borda: L > 0.86 ? escurecer(h, 0.16) : null
    };
    cacheTom[ck] = t;
    return t;
  }

  /* ---------- tabelas de tamanho ----------
     A grade é configuração, não código: o produto aponta para uma tabela e
     o lojista pode criar as dele em Ajustes.                              */

  var TABELAS = {
    'num-fem':  { nome: 'Numérica feminina', tams: ['36', '38', '40', '42', '44', '46'] },
    'num-masc': { nome: 'Numérica masculina', tams: ['38', '40', '42', '44', '46', '48'] },
    'num-plus': { nome: 'Numérica plus', tams: ['48', '50', '52', '54', '56'] },
    'letra':    { nome: 'Letra P ao XG', tams: ['P', 'M', 'G', 'GG', 'XG'] },
    'letra-pp': { nome: 'Letra PP ao XG', tams: ['PP', 'P', 'M', 'G', 'GG', 'XG'] },
    'infantil': { nome: 'Infantil', tams: ['2', '4', '6', '8', '10', '12', '14'] },
    'unico':    { nome: 'Tamanho único', tams: ['U'] }
  };

  // forma: como a peça é desenhada. cat: filtro do catálogo.
  // tams: t = tamanho, e = estoque daquele tamanho.
  // visivel: false tira do catálogo sem apagar o cadastro.
  // Monta o estoque por SKU a partir de um padrão por tamanho. Cada cor
  // seguinte entra com um pouco menos, para a grade não ficar artificial.
  function montaEst(cores, tams, padrao) {
    var o = {};
    cores.forEach(function (c, ci) {
      tams.forEach(function (t, ti) {
        var base = padrao[ti] === undefined ? 0 : padrao[ti];
        o[c + '|' + t] = Math.max(0, base - ci * 3);
      });
    });
    return o;
  }

  function montaProdutos(lista) {
    return lista.map(function (p) {
      p.est = montaEst(p.cores, TABELAS[p.grade].tams, p.padrao);
      delete p.padrao;
      return p;
    });
  }

  // tecido: muda só o desenho. Em jeans a costura sai dourada e o botão
  // metálico; nas outras peças tudo fica tom sobre tom.
  var PRODUTOS = montaProdutos([
    { id: 'p1', nome: 'Calça wide leg', ref: 'AL-1042', preco: 48.90, forma: 'calca', cat: 'calcas',
      tecido: 'jeans', grade: 'num-fem', cores: ['indigo', 'jeansclaro', 'jeansesc'],
      fundo: '#EAE5D6', novo: true, padrao: [18, 24, 22, 15, 9, 0] },
    { id: 'p2', nome: 'Calça skinny', ref: 'AL-1051', preco: 44.90, forma: 'calca', cat: 'calcas',
      tecido: 'jeans', grade: 'num-fem', cores: ['jeansclaro', 'indigo', 'preto'],
      fundo: '#F0EADB', padrao: [12, 30, 28, 20, 11, 6] },
    { id: 'p3', nome: 'Short cintura alta', ref: 'AL-2017', preco: 32.90, forma: 'short', cat: 'shorts',
      tecido: 'jeans', grade: 'num-fem', cores: ['indigo', 'jeansclaro', 'blackjeans'],
      fundo: '#E8E3D3', padrao: [26, 34, 30, 18, 7, 0] },
    { id: 'p4', nome: 'Jaqueta oversized', ref: 'AL-3008', preco: 69.90, forma: 'jaqueta', cat: 'jaquetas',
      tecido: 'jeans', grade: 'letra', cores: ['indigo', 'jeansesc'],
      fundo: '#EDE6D5', novo: true, padrao: [14, 19, 16, 8, 4] },
    { id: 'p5', nome: 'Saia midi', ref: 'AL-2044', preco: 39.90, forma: 'saia', cat: 'saias',
      tecido: 'plano', grade: 'num-fem', cores: ['preto', 'marinho', 'caramelo'],
      fundo: '#E7E1D0', padrao: [10, 17, 15, 12, 4, 0] },
    { id: 'p6', nome: 'Camisa social', ref: 'AL-3021', preco: 52.90, forma: 'camisa', cat: 'camisas',
      tecido: 'plano', grade: 'letra-pp', cores: ['branco', 'azulbb', 'rosa', 'marinho'],
      fundo: '#F0EBDC', padrao: [9, 22, 18, 11, 6, 3] },
    { id: 'p7', nome: 'Macacão longo', ref: 'AL-4003', preco: 79.90, forma: 'macacao', cat: 'calcas',
      tecido: 'jeans', grade: 'num-fem', cores: ['indigo', 'jeansesc'],
      fundo: '#EAE4D4', padrao: [7, 13, 11, 6, 0, 0] },
    { id: 'p8', nome: 'Bermuda masculina', ref: 'AL-5010', preco: 38.90, forma: 'bermuda', cat: 'shorts',
      tecido: 'jeans', grade: 'num-masc', cores: ['jeansesc', 'indigo', 'blackjeans'],
      fundo: '#EDE7D7', padrao: [20, 25, 23, 16, 10, 5] },
    // Peças que não são jeans, para a demonstração não dar a impressão de
    // que a plataforma só serve para confecção de denim.
    { id: 'p9', nome: 'Camiseta básica malha', ref: 'AL-6002', preco: 19.90, forma: 'camiseta', cat: 'camisas',
      tecido: 'malha', grade: 'letra', novo: true,
      cores: ['branco', 'preto', 'mescla', 'vermelho', 'militar', 'mostarda', 'rosa', 'marinho'],
      fundo: '#F1ECDD', padrao: [40, 56, 50, 32, 18] },
    { id: 'p10', nome: 'Vestido midi', ref: 'AL-7001', preco: 64.90, forma: 'vestido', cat: 'vestidos',
      tecido: 'plano', grade: 'num-fem', novo: true,
      cores: ['vinho', 'preto', 'oliva', 'terracota', 'marinho'],
      fundo: '#EEE7D7', padrao: [9, 16, 15, 11, 5, 2] },
    { id: 'p11', nome: 'Moletom canguru', ref: 'AL-8004', preco: 74.90, forma: 'moletom', cat: 'jaquetas',
      tecido: 'malha', grade: 'letra-pp',
      cores: ['mescla', 'preto', 'chumbo', 'bege', 'lilas', 'menta'],
      fundo: '#EDE8D9', padrao: [12, 20, 24, 19, 10, 5] },
    { id: 'p12', nome: 'Blusa manga longa', ref: 'AL-6015', preco: 36.90, forma: 'blusa', cat: 'camisas',
      tecido: 'malha', grade: 'letra',
      cores: ['offwhite', 'caramelo', 'roxo', 'turquesa'],
      fundo: '#F0EBDB', padrao: [14, 26, 22, 13, 7] }
  ]);

  /* ---------- coleções ----------
     Etiquetas que o lojista cria e marca nos produtos. Servem de filtro
     no catálogo e de destino para os banners da capa. destaque: aparece
     como selo no card do produto.                                       */
  var COLECOES = [
    { id: 'verao27', nome: 'Verão 27' },
    { id: 'basicos', nome: 'Básicos de giro' },
    { id: 'promo', nome: 'Promoção', destaque: true }
  ];
  var TAGS_INICIAIS = {
    p1: ['verao27'], p3: ['verao27'], p4: ['verao27'], p10: ['verao27'], p7: ['verao27'],
    p6: ['basicos'], p9: ['basicos'], p12: ['basicos'], p11: ['basicos'],
    p2: ['promo'], p5: ['promo'], p8: ['promo']
  };
  PRODUTOS.forEach(function (p) { p.tags = (TAGS_INICIAIS[p.id] || []).slice(); });

  function colecao(id) { return COLECOES.filter(function (c) { return c.id === id; })[0] || null; }

  var CATS = [
    ['todos', 'Tudo'], ['calcas', 'Calças'], ['shorts', 'Shorts'],
    ['camisas', 'Camisas e blusas'], ['vestidos', 'Vestidos'],
    ['jaquetas', 'Jaquetas e moletons'], ['saias', 'Saias']
  ];

  /* ---------- carrossel da capa ----------
     Quem alimenta é o lojista, pela aba Vitrine do painel. Os banners de
     exemplo não têm foto: arte é um desenho montado com as peças do
     catálogo. Banner enviado pelo lojista tem img (computador) e, se ele
     quiser, imgMob (celular). Sem imgMob, o celular recorta a img pelo foco.
     texto: false é para arte que já vem com o texto escrito na imagem.     */
  var BANNERS = [
    { id: 'b1', arte: 'jeans', tag: 'Nova coleção', titulo: 'Verão 27',
      sub: 'Lavagens novas, modelagem alta e grade fechada do 36 ao 46.',
      botao: 'Ver a coleção', destino: 'col:verao27', texto: true, foco: 'centro', ativo: true },
    { id: 'b2', arte: 'malhas', tag: 'Reposição semanal', titulo: 'Malha do P ao XG',
      sub: 'Camiseta básica em oito cores, com estoque reposto toda semana.',
      botao: 'Ver camisas e blusas', destino: 'camisas', texto: true, foco: 'centro', ativo: true },
    { id: 'b3', arte: 'vestidos', tag: '', titulo: 'Vestido midi',
      sub: 'Tecido plano em cinco cores, do 36 ao 46.',
      botao: 'Ver vestidos', destino: 'vestidos', texto: true, foco: 'centro', ativo: true },
    { id: 'b4', arte: 'inverno', tag: 'Em breve', titulo: 'Moletons de inverno',
      sub: 'A coleção de frio chega em março. Já dá para reservar a grade.',
      botao: 'Ver moletons', destino: 'jaquetas', texto: true, foco: 'centro', ativo: false }
  ];
  var MAX_BANNERS = 8;

  // itens: cor é a chave do catálogo de cores; g é a grade pedida por tamanho.
  var PEDIDOS = [
    { id: 'ped-3', n: '1042', quem: 'Magazine Rosa', cidade: 'Fortaleza, CE', data: '15 nov', hora: '09:12',
      sit: 'env', itens: [{ id:'p1', cor:'indigo', g:{'38':6,'40':6,'42':4} }, { id:'p9', cor:'branco', g:{'M':10,'G':8} }] },
    { id: 'ped-2', n: '1041', quem: 'Loja Dani', cidade: 'Juazeiro do Norte, CE', data: '14 nov', hora: '16:40',
      sit: 'sep', itens: [{ id:'p4', cor:'indigo', g:{'M':5,'G':5,'GG':2} }, { id:'p11', cor:'mescla', g:{'M':4,'G':4} }] },
    { id: 'ped-1', n: '1040', quem: 'Ponto Chic', cidade: 'Natal, RN', data: '13 nov', hora: '11:05',
      sit: 'env', itens: [{ id:'p2', cor:'jeansclaro', g:{'38':12,'40':12,'42':8} }, { id:'p10', cor:'vinho', g:{'40':4,'42':4} }] },
    // Histórico da Boutique Avenida, que é quem entra do lado de quem compra.
    { id: 'ped-h3', n: '1036', quem: 'Boutique Avenida', cidade: 'Campina Grande, PB', data: '28 out', hora: '10:22',
      sit: 'env', itens: [{ id:'p1', cor:'indigo', g:{'38':8,'40':8,'42':6} }, { id:'p5', cor:'preto', g:{'38':6,'40':6} }] },
    { id: 'ped-m2', n: '1033', quem: 'Magazine Rosa', cidade: 'Fortaleza, CE', data: '21 out', hora: '14:30',
      sit: 'env', itens: [{ id:'p1', cor:'jeansclaro', g:{'38':8,'40':8,'42':6} }, { id:'p10', cor:'vinho', g:{'38':4,'40':4,'42':2} }] },
    { id: 'ped-h2', n: '1029', quem: 'Boutique Avenida', cidade: 'Campina Grande, PB', data: '09 out', hora: '15:48',
      sit: 'env', itens: [{ id:'p9', cor:'preto', g:{'M':12,'G':12,'GG':6} }] },
    { id: 'ped-m1', n: '1025', quem: 'Magazine Rosa', cidade: 'Fortaleza, CE', data: '30 set', hora: '10:12',
      sit: 'env', itens: [{ id:'p1', cor:'indigo', g:{'36':6,'38':10,'40':10,'42':6} }, { id:'p9', cor:'branco', g:{'P':8,'M':12,'G':10} }] },
    { id: 'ped-h1', n: '1021', quem: 'Boutique Avenida', cidade: 'Campina Grande, PB', data: '22 set', hora: '09:05',
      sit: 'env', itens: [{ id:'p3', cor:'jeansclaro', g:{'36':10,'38':12,'40':10} }, { id:'p8', cor:'jeansesc', g:{'40':6,'42':6,'44':4} }] },
    { id: 'ped-i2', n: '1014', quem: 'Império Jeans', cidade: 'Mossoró, RN', data: '20 ago', hora: '11:40',
      sit: 'env', itens: [{ id:'p8', cor:'blackjeans', g:{'40':8,'42':8,'44':6} }] },
    { id: 'ped-i1', n: '1009', quem: 'Império Jeans', cidade: 'Mossoró, RN', data: '12 jul', hora: '16:15',
      sit: 'env', itens: [{ id:'p1', cor:'indigo', g:{'38':6,'40':6,'42':6} }, { id:'p3', cor:'indigo', g:{'38':8,'40':8} }] }
  ];

  // Os pedidos de antes desta semana não entram nos números do Início,
  // que fala da semana. Eles continuam na lista de pedidos e na ficha do cliente.
  ['ped-h3', 'ped-m2', 'ped-h2', 'ped-m1', 'ped-h1', 'ped-i2', 'ped-i1'].forEach(function (id) {
    PEDIDOS.forEach(function (p) { if (p.id === id) { p.antigo = true; p.sit = 'ent'; } });
  });

  // pag: como o pedido foi pago.
  //   forma: whats (combinado no WhatsApp), pix ou cartao
  //   sit:   combinar (falta acertar), aguardando (cobrança gerada) ou pago
  // A loja começa no Básico, então o histórico todo fechou pelo WhatsApp.
  // O pedido 1041 ainda está esperando o acerto, para o painel ter o que mostrar.
  var EM_ABERTO = ['ped-2', 'ped-1', 'ped-i2', 'ped-i1'];
  PEDIDOS.forEach(function (p) {
    p.pag = { forma: 'whats', sit: EM_ABERTO.indexOf(p.id) >= 0 ? 'combinar' : 'pago' };
  });

  var PAG_FORMA = { whats: 'WhatsApp', pix: 'Pix', cartao: 'Cartão' };
  var PAG_SIT = {
    combinar: ['A combinar', 'sel-novo'],
    aguardando: ['Aguardando', 'sel-sep'],
    pago: ['Pago', 'sel-env']
  };

  // sit: ok = aprovado (vê preço e fecha pedido), esp = aguardando
  // aprovação, bloq = bloqueado.
  // resp e fone: contato do comprador. Os telefones são de mentira de
  // propósito (9 0000-0000), só o DDD bate com a cidade.
  // origem: como o cliente chegou. obs: anotação interna do lojista.
  var CLIENTES = [
    { id: 'c1', nome: 'Magazine Rosa', doc: '12.345.678/0001-90', cidade: 'Fortaleza, CE', desde: 'mar 2026', sit: 'ok',
      resp: 'Rosângela Freitas', fone: '(85) 9 0000-0000', origem: 'Feira de Toritama',
      obs: 'Prefere fechar no começo do mês. Pede nota fiscal separada por coleção.' },
    { id: 'c2', nome: 'Loja Dani', doc: '23.456.789/0001-01', cidade: 'Juazeiro do Norte, CE', desde: 'mai 2026', sit: 'ok',
      resp: 'Daniela Brito', fone: '(88) 9 0000-0000', origem: 'Indicação da Magazine Rosa', obs: '' },
    { id: 'c3', nome: 'Ponto Chic', doc: '34.567.890/0001-12', cidade: 'Natal, RN', desde: 'jun 2026', sit: 'ok',
      resp: 'Marcos Tavares', fone: '(84) 9 0000-0000', origem: 'Instagram', obs: 'Só recebe por transportadora, nunca por ônibus.' },
    { id: 'c4', nome: 'Boutique Avenida', doc: '45.678.901/0001-23', cidade: 'Campina Grande, PB', desde: 'ago 2026', sit: 'ok',
      origem: 'Cadastro pelo catálogo', obs: '' },
    { id: 'c5', nome: 'Casa das Malhas', doc: '56.789.012/0001-34', cidade: 'Petrolina, PE', desde: 'hoje', sit: 'esp',
      resp: 'Joana Lima', fone: '(87) 9 0000-0000', origem: 'Cadastro pelo catálogo', obs: '' },
    { id: 'c6', nome: 'Vitória Modas', doc: '67.890.123/0001-45', cidade: 'Arapiraca, AL', desde: 'ontem', sit: 'esp',
      resp: 'Vitória Nunes', fone: '(82) 9 0000-0000', origem: 'Cadastro pelo catálogo', obs: '' },
    { id: 'c7', nome: 'Império Jeans', doc: '78.901.234/0001-56', cidade: 'Mossoró, RN', desde: 'fev 2026', sit: 'bloq',
      resp: 'Carlos Medeiros', fone: '(84) 9 0000-0000', origem: 'Feira de Toritama',
      obs: 'Bloqueado em out/2026 por dois pedidos sem pagamento.' }
  ];

  /* ---------- carrinhos guardados ----------
     O pedido montado fica salvo por cliente: sai, volta outro dia e a
     grade está lá. O lojista vê quem montou e não fechou, para chamar.
     No sistema de verdade isso mora no Firestore, junto do cadastro.    */
  var CARRINHOS = {
    c1: { quando: 'ontem, 21:14', itens: {
      'p10|vinho|38': 4, 'p10|vinho|40': 4, 'p10|vinho|42': 3, 'p10|preto|38': 3, 'p10|preto|40': 3,
      'p6|branco|M': 6, 'p6|branco|G': 6 } },
    c2: { quando: 'há 3 dias', itens: { 'p9|preto|M': 10, 'p9|preto|G': 10, 'p9|mescla|M': 8, 'p9|mescla|G': 8 } }
  };
  var FAVS = {};

  var SITC = { ok: ['Aprovado', 'sel-env'], esp: ['Aguardando', 'sel-novo'], bloq: ['Bloqueado', 'sel-bloq'] };

  // Quem está logado do lado de quem compra é um dos clientes da lista
  // acima. Por isso bloquear esse cliente no painel trava o preço no
  // catálogo: é o mesmo cadastro.
  var EU = {
    id: 'c4',
    responsavel: 'Patrícia Alves',
    fone: '(83) 9 0000-0000',
    email: 'compras@boutiqueavenida.com.br',
    endereco: 'Rua das Palmeiras, 180 . Centro . Campina Grande, PB . 58400-000'
  };
  function euCliente() { return cli(EU.id) || CLIENTES[0]; }


  // O gráfico distribui o total real dos pedidos pelos sete dias, para
  // nunca contradizer os cartões de número acima dele.
  var DIAS7 = [
    { d: 'seg', peso: .09 }, { d: 'ter', peso: .14 }, { d: 'qua', peso: .08 },
    { d: 'qui', peso: .18 }, { d: 'sex', peso: .21 }, { d: 'sáb', peso: .24 }, { d: 'dom', peso: .06 }
  ];

  // env = saiu da loja e está em trânsito. ent = o cliente recebeu.
  var SIT = {
    novo: ['Novo', 'sel-novo'], sep: ['Em separação', 'sel-sep'],
    env: ['Em trânsito', 'sel-transito'], ent: ['Entregue', 'sel-env']
  };
  var PASSOS = [['novo', 'Recebido'], ['sep', 'Em separação'], ['env', 'Enviado'], ['ent', 'Entregue']];
  var ORDEM_SIT = ['novo', 'sep', 'env', 'ent'];
  function passoAtual(sit) { return Math.max(0, ORDEM_SIT.indexOf(sit)); }

  /* =================== estado =================== */

  var st = {
    modo: 'catalogo',
    tela: 'vitrine',
    pnl: 'inicio',
    logado: false,
    prod: null,
    contaAba: 'pedidos',
    meuPedido: null,
    vista: 'frente',
    corSel: {},           // idProduto => chave da cor escolhida
    favoritos: {},
    busca: '',
    filtro: 'todos',
    ordem: 'destaque',
    pedidoAberto: null,
    carrinho: {},         // 'idProduto|lavagem|tamanho' => quantidade
    proxN: 1043,
    proxId: 9,
    ultimoN: null,
    modal: null,          // { tipo, id }
    menu: null,           // 'cat' ou 'pnl': gaveta lateral do celular
    buscaAberta: false,   // no celular a busca abre por toque na lupa
    pnlBusca: '',
    cliBusca: '',
    cliFiltro: 'todos',
    cliOrdem: 'total',
    pnlSit: 'todos',
    pagForma: null,       // pix, cartao ou whats na tela de pagamento (plano Pro)
    parcSel: 1,           // parcelas escolhidas no cartão
    cc: null,             // o que foi digitado no cartão, para sobreviver a um redesenho
    processando: false,   // cartão "na operadora"
    ultimoPed: null,      // id do último pedido fechado, para a tela de confirmação
    ultimaMsg: '',        // mensagem do último pedido fechado pelo WhatsApp
    copiou: false,        // fechou copiando a mensagem em vez de abrir o WhatsApp
    suporte: null,        // acesso de suporte da 42.dev aberto no painel do lojista
    slide: 0,             // banner da capa que está na tela
    fl: { col: [], cor: [], tam: [], novos: false, preco: '' },  // filtros do catálogo
    flFechado: {},        // grupos de filtro recolhidos
    banRasc: null,        // rascunho do banner aberto no modal
    aviso: null           // mensagem curta no topo do painel
  };

  var uid = 0;

  /* =================== utilidades =================== */

  function brl(n) {
    var p = n.toFixed(2).split('.');
    return 'R$ ' + p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + p[1];
  }
  function brlCurto(n) {
    if (n >= 1000) return 'R$ ' + (n / 1000).toFixed(1).replace('.', ',') + ' mil';
    return brl(n);
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function prod(id) {
    for (var i = 0; i < PRODUTOS.length; i++) if (PRODUTOS[i].id === id) return PRODUTOS[i];
    return null;
  }
  function cli(id) {
    for (var i = 0; i < CLIENTES.length; i++) if (CLIENTES[i].id === id) return CLIENTES[i];
    return null;
  }
  function ban(id) {
    for (var i = 0; i < BANNERS.length; i++) if (BANNERS[i].id === id) return BANNERS[i];
    return null;
  }
  function ped(id) {
    for (var i = 0; i < PEDIDOS.length; i++) if (PEDIDOS[i].id === id) return PEDIDOS[i];
    return null;
  }
  // O catálogo só enxerga o que o lojista deixou visível.
  function visiveis() {
    return PRODUTOS.filter(function (p) { return p.visivel !== false; });
  }
  // Preço e pedido só para quem entrou e está aprovado pelo lojista.
  function podePreco() { return st.logado && euCliente().sit === 'ok'; }
  function meusPedidos() {
    var eu = euCliente();
    return PEDIDOS.filter(function (p) { return p.quem === eu.nome; });
  }
  /* ---------- estoque por SKU ----------
     A chave é cor|tamanho. Antes o estoque era só por tamanho, então pedir
     12 do 38 na índigo derrubava o 38 da lavagem clara junto.             */

  function corDe(p) {
    return (p.cores.indexOf(st.corSel[p.id]) >= 0) ? st.corSel[p.id] : p.cores[0];
  }
  function tamsDe(p) { return (TABELAS[p.grade] || TABELAS.letra).tams; }
  function sku(corChave, tam) { return corChave + '|' + tam; }
  function est(p, corChave, tam) { return p.est[sku(corChave, tam)] || 0; }
  function setEst(p, corChave, tam, q) { p.est[sku(corChave, tam)] = Math.max(0, q); }

  function estoqueTotal(p) {
    var n = 0;
    for (var k in p.est) n += p.est[k];
    return n;
  }
  function estoqueCor(p, corChave) {
    var n = 0;
    tamsDe(p).forEach(function (t) { n += est(p, corChave, t); });
    return n;
  }
  // "36 ao 46" ou "P ao XG", conforme a tabela do produto.
  function faixaTams(p) {
    var t = tamsDe(p);
    return t.length === 1 ? t[0] : t[0] + ' ao ' + t[t.length - 1];
  }
  function semAcento(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }

  /* =================== desenho das peças =================== */
  /* Ilustrações no lugar de foto. Quando houver foto de verdade,
     troque svgPeca() por uma <img> e apague este bloco.            */

  function costuras(c, d) {
    return '<g stroke="' + c.linha + '" stroke-width="1.15" fill="none" stroke-dasharray="3 2.4" ' +
      'stroke-linecap="round" opacity=".85">' + d + '</g>';
  }

  function arteCalca(c, g, vista, ate, barra) {
    ate = ate || 164;
    var meio = 88;
    var corpo = '<path d="M26 29 H94 L' + (94 - 6) + ' ' + ate + ' H64 L60 ' + meio + ' L56 ' + ate + ' H' + (26 + 6) + ' Z" fill="url(#' + g + ')"/>';
    var cos = '<path d="M24 14 H96 V30 H24 Z" fill="' + c.esc + '"/>' +
      '<rect x="30" y="11" width="4.5" height="7" fill="' + c.esc + '"/>' +
      '<rect x="57.8" y="11" width="4.5" height="7" fill="' + c.esc + '"/>' +
      '<rect x="85.5" y="11" width="4.5" height="7" fill="' + c.esc + '"/>' +
      '<circle cx="60" cy="22" r="3.1" fill="' + c.metal + '"/>';

    if (vista === 'costas') {
      return corpo + cos +
        '<path d="M26 37 L60 47 L94 37 L94 29 H26 Z" fill="' + c.esc + '" opacity=".55"/>' +
        '<path d="M35 51 H53 L50.5 72 H37.5 Z" fill="' + c.esc + '" opacity=".5"/>' +
        '<path d="M85 51 H67 L69.5 72 H82.5 Z" fill="' + c.esc + '" opacity=".5"/>' +
        costuras(c,
          '<path d="M24 30.8 H96"/>' +
          '<path d="M26 37 L60 47 L94 37"/>' +
          '<path d="M35 51 H53 L50.5 72 H37.5 Z"/>' +
          '<path d="M85 51 H67 L69.5 72 H82.5 Z"/>' +
          '<path d="M31.5 32 L' + (26 + 9) + ' ' + (ate - 3) + '"/>' +
          '<path d="M88.5 32 L' + (94 - 9) + ' ' + (ate - 3) + '"/>'
        );
    }

    if (vista === 'detalhe') {
      return corpo + cos +
        costuras(c,
          '<path d="M24 30.8 H96"/><path d="M60 31 V58"/>' +
          '<path d="M34 31 Q43 45 51 31"/><path d="M86 31 Q77 45 69 31"/>' +
          '<path d="M69 31 Q74 38 78.5 31"/>'
        ) +
        '<circle cx="34.5" cy="32" r="1.5" fill="' + c.metal + '"/>' +
        '<circle cx="85.5" cy="32" r="1.5" fill="' + c.metal + '"/>';
    }

    return corpo + cos +
      '<path d="M40 34 L38 ' + (ate - 6) + ' H46 L47 34 Z" fill="' + c.cla + '" opacity=".28"/>' +
      '<path d="M74 34 L76 ' + (ate - 6) + ' H68 L67 34 Z" fill="' + c.cla + '" opacity=".28"/>' +
      costuras(c,
        '<path d="M24 30.8 H96"/>' +
        '<path d="M60 31 V58"/>' +
        '<path d="M34 31 Q43 45 51 31"/>' +
        '<path d="M86 31 Q77 45 69 31"/>' +
        '<path d="M69 31 Q74 38 78.5 31"/>' +
        '<path d="M31.5 32 L' + (26 + 9) + ' ' + (ate - 3) + '"/>' +
        '<path d="M88.5 32 L' + (94 - 9) + ' ' + (ate - 3) + '"/>' +
        '<path d="M58.3 ' + (meio + 6) + ' L' + (56 - 2.5) + ' ' + (ate - 4) + '"/>' +
        '<path d="M61.7 ' + (meio + 6) + ' L' + (64 + 2.5) + ' ' + (ate - 4) + '"/>' +
        (barra ? '<path d="M' + (26 + 7) + ' ' + (ate - 9) + ' H' + (56 + 1) + '"/><path d="M' + (64 - 1) + ' ' + (ate - 9) + ' H' + (94 - 7) + '"/>' : '')
      ) +
      '<circle cx="34.5" cy="32" r="1.5" fill="' + c.metal + '"/>' +
      '<circle cx="85.5" cy="32" r="1.5" fill="' + c.metal + '"/>';
  }

  function arteSaia(c, g, vista) {
    var corpo = '<path d="M30 29 H90 L100 152 H20 Z" fill="url(#' + g + ')"/>';
    var cos = '<path d="M28 14 H92 V30 H28 Z" fill="' + c.esc + '"/>' +
      '<circle cx="60" cy="22" r="3.1" fill="' + c.metal + '"/>';

    if (vista === 'costas') {
      return corpo + cos +
        '<path d="M30 29 L60 39 L90 29 Z" fill="' + c.esc + '" opacity=".5"/>' +
        costuras(c, '<path d="M28 30.8 H92"/><path d="M30 29 L60 39 L90 29"/><path d="M60 39 V150"/><path d="M22 143 H98"/>');
    }
    if (vista === 'detalhe') {
      return corpo + cos + costuras(c, '<path d="M28 30.8 H92"/><path d="M60 31 V58"/><path d="M34 31 Q43 44 51 31"/>');
    }
    return corpo + cos +
      '<path d="M54 32 L50 150 H70 L66 32 Z" fill="' + c.cla + '" opacity=".22"/>' +
      costuras(c, '<path d="M28 30.8 H92"/><path d="M60 31 V60"/><path d="M34 31 Q43 44 51 31"/><path d="M86 31 Q77 44 69 31"/><path d="M22 143 H98"/>');
  }

  function arteJaqueta(c, g, vista, curta) {
    // curta = camisa: corpo mais comprido, sem barra de cós. Jaqueta é cropped.
    var base = curta ? 138 : 126;
    var botoes = curta ? [54, 74, 94, 114] : [54, 76, 98];
    // Mangas e tronco são caminhos separados, para a cava aparecer.
    var mangas =
      '<path d="M40 30 L24 38 L16 90 L33 96 L40 62 Z" fill="url(#' + g + ')"/>' +
      '<path d="M80 30 L96 38 L104 90 L87 96 L80 62 Z" fill="url(#' + g + ')"/>';
    var tronco = '<path d="M40 30 H80 L85 ' + base + ' H35 Z" fill="url(#' + g + ')"/>';
    var corpo = mangas + tronco;
    var gola = '<path d="M46 30 L60 43 L74 30 L68 22 H52 Z" fill="' + c.esc + '"/>';
    var punhos = '<path d="M16 90 L33 96 L31 104 L14 98 Z" fill="' + c.esc + '"/>' +
      '<path d="M104 90 L87 96 L89 104 L106 98 Z" fill="' + c.esc + '"/>';
    var barra = curta ? '' : '<path d="M36.6 ' + (base - 9) + ' H83.4 L85 ' + base + ' H35 Z" fill="' + c.esc + '"/>';

    var cava = '<path d="M40 30 V62"/><path d="M80 30 V62"/>';

    if (vista === 'costas') {
      return corpo + gola + punhos + barra +
        '<path d="M38 50 L60 58 L82 50 L81 42 H39 Z" fill="' + c.esc + '" opacity=".5"/>' +
        costuras(c, cava + '<path d="M38 50 L60 58 L82 50"/><path d="M60 58 V' + (base - 12) + '"/>' +
          '<path d="M17 88 L33 94"/><path d="M103 88 L87 94"/>' +
          (curta ? '' : '<path d="M36.6 ' + (base - 7) + ' H83.4"/>'));
    }

    if (vista === 'detalhe') {
      return corpo + gola +
        '<path d="M56 43 H64 V' + (base - 14) + ' H56 Z" fill="' + c.esc + '"/>' +
        '<path d="M42 62 H56 V75 H42 Z" fill="' + c.esc + '" opacity=".75"/>' +
        '<path d="M78 62 H64 V75 H78 Z" fill="' + c.esc + '" opacity=".75"/>' +
        costuras(c, '<path d="M46 30 L60 43 L74 30"/><path d="M56 44 V' + (base - 15) + '"/><path d="M64 44 V' + (base - 15) + '"/>' +
          '<path d="M42 62 H56 V75 H42"/><path d="M78 62 H64 V75 H78"/>') +
        '<circle cx="60" cy="54" r="2.4" fill="' + c.metal + '"/>' +
        '<circle cx="60" cy="80" r="2.4" fill="' + c.metal + '"/>';
    }

    return corpo + gola + punhos + barra +
      '<path d="M56 43 H64 V' + (base - 14) + ' H56 Z" fill="' + c.esc + '"/>' +
      '<path d="M42 62 H56 V76 H42 Z" fill="' + c.esc + '" opacity=".7"/>' +
      '<path d="M78 62 H64 V76 H78 Z" fill="' + c.esc + '" opacity=".7"/>' +
      '<path d="M46 46 L44.5 ' + (base - 16) + ' H51 L52 46 Z" fill="' + c.cla + '" opacity=".2"/>' +
      costuras(c,
        cava +
        '<path d="M46 30 L60 43 L74 30"/>' +
        '<path d="M56 44 V' + (base - 15) + '"/><path d="M64 44 V' + (base - 15) + '"/>' +
        '<path d="M42 62 H56 V76 H42"/><path d="M78 62 H64 V76 H78"/>' +
        '<path d="M17 88 L33 94"/><path d="M103 88 L87 94"/>' +
        (curta ? '' : '<path d="M36.6 ' + (base - 7) + ' H83.4"/>')
      ) +
      botoes.map(function (y) {
        return '<circle cx="60" cy="' + y + '" r="2.3" fill="' + c.metal + '"/>';
      }).join('');
  }

  function arteMacacao(c, g, vista) {
    var corpo = '<path d="M38 60 H82 L88 164 H64 L60 96 L56 164 H32 Z" fill="url(#' + g + ')"/>';
    var bib = '<path d="M42 30 H78 V62 H42 Z" fill="url(#' + g + ')"/>';
    var alcas = '<path d="M42 32 L34 18 L40 15 L48 30 Z" fill="' + c.esc + '"/>' +
      '<path d="M78 32 L86 18 L80 15 L72 30 Z" fill="' + c.esc + '"/>';
    var cinto = '<path d="M36 60 H84 V70 H36 Z" fill="' + c.esc + '"/>';

    if (vista === 'detalhe') {
      return bib + alcas + cinto +
        costuras(c, '<path d="M42 30 H78"/><path d="M46 38 H74 V56 H46 Z"/><path d="M36 61.5 H84"/>') +
        '<rect x="37" y="28" width="7" height="7" fill="' + c.metal + '"/>' +
        '<rect x="76" y="28" width="7" height="7" fill="' + c.metal + '"/>';
    }
    if (vista === 'costas') {
      return corpo + bib + alcas + cinto +
        costuras(c, '<path d="M42 30 H78"/><path d="M36 61.5 H84"/><path d="M60 70 V96"/>' +
          '<path d="M37 72 L35 161"/><path d="M83 72 L85 161"/>');
    }
    return corpo + bib + alcas + cinto +
      '<path d="M46 38 H74 V56 H46 Z" fill="' + c.esc + '" opacity=".45"/>' +
      costuras(c,
        '<path d="M42 30 H78"/><path d="M46 38 H74 V56 H46 Z"/><path d="M36 61.5 H84"/>' +
        '<path d="M37 72 L35 161"/><path d="M83 72 L85 161"/>' +
        '<path d="M57.5 100 L54 161"/><path d="M62.5 100 L66 161"/>'
      ) +
      '<rect x="37" y="28" width="7" height="7" fill="' + c.metal + '"/>' +
      '<rect x="76" y="28" width="7" height="7" fill="' + c.metal + '"/>';
  }

  // Camiseta e blusa de malha: gola careca, sem botoeira.
  function arteCamiseta(c, g, vista, longa) {
    var mangas = longa
      ? '<path d="M41 31 L23 40 L10 96 L25 102 L41 58 Z" fill="url(#' + g + ')"/>' +
        '<path d="M79 31 L97 40 L110 96 L95 102 L79 58 Z" fill="url(#' + g + ')"/>'
      : '<path d="M41 31 L22 41 L15 70 L31 77 L41 56 Z" fill="url(#' + g + ')"/>' +
        '<path d="M79 31 L98 41 L105 70 L89 77 L79 56 Z" fill="url(#' + g + ')"/>';
    var tronco = '<path d="M41 31 H49 Q60 43 71 31 H79 L83 124 H37 Z" fill="url(#' + g + ')"/>';
    var gola = '<path d="M48.5 30 Q60 43.5 71.5 30 L75 33 Q60 49 45 33 Z" fill="' + c.esc + '"/>';
    var punhos = longa
      ? '<path d="M10 96 L25 102 L22 110 L7 104 Z" fill="' + c.esc + '"/>' +
        '<path d="M110 96 L95 102 L98 110 L113 104 Z" fill="' + c.esc + '"/>'
      : '';
    var corpo = mangas + tronco;

    if (vista === 'detalhe') {
      return corpo + gola +
        costuras(c, '<path d="M48.5 30 Q60 43.5 71.5 30"/><path d="M45 33 Q60 49 75 33"/>' +
          '<path d="M41 31 V58"/><path d="M79 31 V58"/>');
    }
    if (vista === 'costas') {
      return corpo + punhos +
        '<path d="M44 31 Q60 38 76 31 L75 27 H45 Z" fill="' + c.esc + '"/>' +
        costuras(c, '<path d="M44 31 Q60 38 76 31"/><path d="M41 31 V58"/><path d="M79 31 V58"/>' +
          '<path d="M37 118 H83"/>');
    }
    return corpo + gola + punhos +
      '<path d="M47 36 L45 118 H52 L53 36 Z" fill="' + c.cla + '" opacity=".22"/>' +
      costuras(c,
        '<path d="M45 33 Q60 49 75 33"/>' +
        '<path d="M41 31 V58"/><path d="M79 31 V58"/>' +
        '<path d="M37 118 H83"/>' +
        (longa ? '<path d="M11 94 L24 99"/><path d="M109 94 L96 99"/>'
               : '<path d="M17 68 L30 74"/><path d="M103 68 L90 74"/>')
      );
  }

  // Moletom: corpo largo, capuz, bolso canguru e punho em ribana.
  function arteMoletom(c, g, vista) {
    var base = 134;
    var mangas = '<path d="M39 34 L21 43 L11 96 L27 103 L39 62 Z" fill="url(#' + g + ')"/>' +
      '<path d="M81 34 L99 43 L109 96 L93 103 L81 62 Z" fill="url(#' + g + ')"/>';
    var tronco = '<path d="M39 34 H81 L86 ' + base + ' H34 Z" fill="url(#' + g + ')"/>';
    var capuz = '<path d="M39 36 Q60 19 81 36 Q60 45 39 36 Z" fill="' + c.esc + '"/>';
    var punhos = '<path d="M11 96 L27 103 L24 112 L8 105 Z" fill="' + c.esc + '"/>' +
      '<path d="M109 96 L93 103 L96 112 L112 105 Z" fill="' + c.esc + '"/>';
    var barra = '<path d="M35 ' + (base - 11) + ' H85 L86 ' + base + ' H34 Z" fill="' + c.esc + '"/>';
    var bolso = '<path d="M41 84 H79 L77 110 H43 Z" fill="' + c.esc + '" opacity=".6"/>';
    var corpo = mangas + tronco;

    if (vista === 'detalhe') {
      return corpo + capuz +
        '<path d="M56 44 V60" stroke="' + c.esc + '" stroke-width="2.4" stroke-linecap="round"/>' +
        '<path d="M64 44 V60" stroke="' + c.esc + '" stroke-width="2.4" stroke-linecap="round"/>' +
        '<circle cx="56" cy="61" r="2.2" fill="' + c.metal + '"/>' +
        '<circle cx="64" cy="61" r="2.2" fill="' + c.metal + '"/>' +
        costuras(c, '<path d="M39 36 Q60 45 81 36"/>');
    }
    if (vista === 'costas') {
      return corpo + punhos + barra + capuz +
        costuras(c, '<path d="M39 36 Q60 45 81 36"/><path d="M39 34 V62"/><path d="M81 34 V62"/>' +
          '<path d="M35 ' + (base - 9) + ' H85"/>');
    }
    return corpo + capuz + bolso + punhos + barra +
      '<path d="M45 40 L43 ' + (base - 14) + ' H50 L51 40 Z" fill="' + c.cla + '" opacity=".2"/>' +
      '<path d="M56 44 V60" stroke="' + c.esc + '" stroke-width="2.2" stroke-linecap="round"/>' +
      '<path d="M64 44 V60" stroke="' + c.esc + '" stroke-width="2.2" stroke-linecap="round"/>' +
      costuras(c,
        '<path d="M39 36 Q60 45 81 36"/>' +
        '<path d="M41 84 H79 L77 110 H43 Z"/>' +
        '<path d="M39 34 V62"/><path d="M81 34 V62"/>' +
        '<path d="M13 94 L26 99"/><path d="M107 94 L94 99"/>' +
        '<path d="M35 ' + (base - 9) + ' H85"/>'
      );
  }

  // Vestido: busto com manguinha, cintura marcada e saia rodada.
  function arteVestido(c, g, vista) {
    var mangas = '<path d="M41 32 L29 39 L26 54 L40 58 Z" fill="url(#' + g + ')"/>' +
      '<path d="M79 32 L91 39 L94 54 L80 58 Z" fill="url(#' + g + ')"/>';
    var corpo = '<path d="M41 32 H49 Q60 45 71 32 H79 L82 74 L99 158 H21 L38 74 Z" fill="url(#' + g + ')"/>';
    var gola = '<path d="M48.5 31 Q60 45 71.5 31 L75 34 Q60 51 45 34 Z" fill="' + c.esc + '"/>';
    var cinto = '<path d="M38 72 H82 V83 H37.6 Z" fill="' + c.esc + '"/>';

    if (vista === 'detalhe') {
      return mangas + corpo + gola +
        costuras(c, '<path d="M45 34 Q60 51 75 34"/><path d="M41 32 V58"/><path d="M79 32 V58"/>');
    }
    if (vista === 'costas') {
      return mangas + corpo + cinto +
        '<path d="M44 32 Q60 39 76 32 L75 28 H45 Z" fill="' + c.esc + '"/>' +
        costuras(c, '<path d="M44 32 Q60 39 76 32"/><path d="M60 39 V72"/>' +
          '<path d="M60 83 V154"/><path d="M38 73.5 H82"/><path d="M23 150 H97"/>');
    }
    return mangas + corpo + gola + cinto +
      '<path d="M52 36 L50 72 H58 L59 36 Z" fill="' + c.cla + '" opacity=".2"/>' +
      '<path d="M68 85 L64 154 H78 L80 85 Z" fill="' + c.cla + '" opacity=".14"/>' +
      costuras(c,
        '<path d="M45 34 Q60 51 75 34"/>' +
        '<path d="M38 73.5 H82"/>' +
        '<path d="M41 32 V58"/><path d="M79 32 V58"/>' +
        '<path d="M28 52 L39 55"/><path d="M92 52 L81 55"/>' +
        '<path d="M23 150 H97"/>'
      );
  }

  var VISTAS = { frente: 'Frente', costas: 'Costas', detalhe: 'Detalhe' };

  var FORMAS = [
    ['calca', 'Calça'], ['short', 'Short'], ['bermuda', 'Bermuda'], ['saia', 'Saia'],
    ['vestido', 'Vestido'], ['camiseta', 'Camiseta'], ['blusa', 'Blusa manga longa'],
    ['camisa', 'Camisa'], ['jaqueta', 'Jaqueta'], ['moletom', 'Moletom'], ['macacao', 'Macacão']
  ];
  var TECIDOS = [['jeans', 'Jeans'], ['malha', 'Malha'], ['plano', 'Tecido plano']];

  function svgPeca(p, corChave, vista, opts) {
    opts = opts || {};
    var c = cor(p.cores.indexOf(corChave) >= 0 ? corChave : p.cores[0], p.tecido);
    var g = 'gr' + (++uid);
    var corpo;

    if (p.forma === 'calca') corpo = arteCalca(c, g, vista, 164, false);
    else if (p.forma === 'short') corpo = arteCalca(c, g, vista, 100, true);
    else if (p.forma === 'bermuda') corpo = arteCalca(c, g, vista, 126, true);
    else if (p.forma === 'saia') corpo = arteSaia(c, g, vista);
    else if (p.forma === 'vestido') corpo = arteVestido(c, g, vista);
    else if (p.forma === 'camiseta') corpo = arteCamiseta(c, g, vista, false);
    else if (p.forma === 'blusa') corpo = arteCamiseta(c, g, vista, true);
    else if (p.forma === 'moletom') corpo = arteMoletom(c, g, vista);
    else if (p.forma === 'jaqueta') corpo = arteJaqueta(c, g, vista, false);
    else if (p.forma === 'camisa') corpo = arteJaqueta(c, g, vista, true);
    else corpo = arteMacacao(c, g, vista);

    // Peça quase branca ganha contorno, senão some no fundo claro do card.
    if (c.borda) {
      corpo = '<g stroke="' + c.borda + '" stroke-width="0.9" stroke-linejoin="round">' + corpo + '</g>';
    }

    var caixa = vista === 'detalhe' ? '22 8 76 76' : '0 0 120 174';

    return '<svg viewBox="' + caixa + '" width="100%" height="100%" ' +
      (opts.mudo ? 'aria-hidden="true"' : 'role="img" aria-label="' + esc(p.nome + ', cor ' + c.nome + ', ' + (VISTAS[vista] || '').toLowerCase()) + '"') +
      ' style="display:block;max-height:100%">' +
      '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="1" y2="0.25">' +
        '<stop offset="0" stop-color="' + c.cla + '"/>' +
        '<stop offset=".42" stop-color="' + c.base + '"/>' +
        '<stop offset="1" stop-color="' + c.esc + '"/>' +
      '</linearGradient></defs>' + corpo + '</svg>';
  }

  /* =================== contas =================== */

  function totalCarrinho() {
    var t = 0, pecas = 0;
    for (var k in st.carrinho) {
      var q = st.carrinho[k];
      if (!q) continue;
      var p = prod(k.split('|')[0]);
      if (p) { t += p.preco * q; pecas += q; }
    }
    return { valor: t, pecas: pecas };
  }

  // Agrupa o carrinho por produto e lavagem: [{ id, lav, g: { tamanho: qtd } }]
  function itensCarrinho() {
    var mapa = {}, ordem = [];
    for (var k in st.carrinho) {
      var q = st.carrinho[k];
      if (!q) continue;
      var pt = k.split('|'), chave = pt[0] + '|' + pt[1];
      if (!mapa[chave]) { mapa[chave] = {}; ordem.push(chave); }
      mapa[chave][pt[2]] = q;
    }
    return ordem.map(function (ch) {
      var pt = ch.split('|');
      return { id: pt[0], cor: pt[1], g: mapa[ch] };
    });
  }

  function resumoItens(mapa) {
    var pecas = 0, valor = 0;
    for (var k in mapa) {
      var p = prod(k.split('|')[0]);
      if (!p || !mapa[k]) continue;
      pecas += mapa[k]; valor += p.preco * mapa[k];
    }
    return { pecas: pecas, valor: valor };
  }

  // Guarda o carrinho de quem está logado; vazio apaga o guardado.
  function guardarCarrinho() {
    if (!EU || !EU.id) return;
    var tem = Object.keys(st.carrinho).some(function (k) { return st.carrinho[k] > 0; });
    if (tem) CARRINHOS[EU.id] = { quando: 'hoje, ' + dataHora().hora, itens: JSON.parse(JSON.stringify(st.carrinho)) };
    else delete CARRINHOS[EU.id];
    FAVS[EU.id] = st.favoritos;
  }

  // Devolve o carrinho guardado, conferindo o estoque de agora: o que
  // acabou sai, o que diminuiu é ajustado, e o cliente fica sabendo.
  function restaurarCarrinho() {
    st.favoritos = FAVS[EU.id] || {};
    var c = CARRINHOS[EU.id];
    if (!c || Object.keys(st.carrinho).length) return;
    var novo = {}, ajustes = 0, pecas = 0;
    for (var k in c.itens) {
      var pt = k.split('|'), p = prod(pt[0]);
      var tem = p && p.visivel !== false ? est(p, pt[1], pt[2]) : 0;
      var q = Math.min(c.itens[k], tem);
      if (q < c.itens[k]) ajustes++;
      if (q > 0) { novo[k] = q; pecas += q; }
    }
    st.carrinho = novo;
    if (pecas) {
      st.aviso = { txt: 'Seu pedido montado ' + c.quando + ' voltou: ' + pecas + ' peças.' +
        (ajustes ? ' ' + ajustes + (ajustes === 1 ? ' tamanho foi ajustado' : ' tamanhos foram ajustados') + ' porque o estoque mudou.' : '') };
    }
  }

  // Quem montou pedido e não fechou. Quem está no catálogo agora entra
  // com o carrinho ao vivo.
  function carrinhosAbertos() {
    var l = [];
    Object.keys(CARRINHOS).forEach(function (id) {
      if (st.logado && id === EU.id) return;
      var c = cli(id); if (!c) return;
      var r = resumoItens(CARRINHOS[id].itens);
      if (r.pecas) l.push({ c: c, pecas: r.pecas, valor: r.valor, quando: CARRINHOS[id].quando, agora: false });
    });
    if (st.logado) {
      var r2 = resumoItens(st.carrinho);
      if (r2.pecas) l.unshift({ c: euCliente(), pecas: r2.pecas, valor: r2.valor, quando: 'agora', agora: true });
    }
    return l;
  }

  function montadoDe(c) {
    return carrinhosAbertos().filter(function (x) { return x.c.id === c.id; })[0] || null;
  }

  function linkChamar(x) {
    var ct = contatoCliente(x.c);
    var num = soDigitos(ct.fone);
    if (num && num.length <= 11) num = '55' + num;
    var nome = (ct.resp || x.c.nome).split(' ')[0];
    var msg = 'Oi, ' + nome + '! Aqui é da ' + LOJA.nome + '. Vi que você montou um pedido de ' + x.pecas +
      ' peças no nosso catálogo e ainda não fechou. Posso ajudar com alguma coisa? Se quiser, separo a grade para você.';
    return 'https://wa.me/' + num + '?text=' + encodeURIComponent(msg);
  }

  function quadroMontados() {
    var l = carrinhosAbertos();
    var h = '<div class="quadro" style="margin-top:22px"><div class="quadro-h"><span>Pedidos montados e não fechados</span>' +
      '<span>' + (l.length ? brlCurto(l.reduce(function (a, x) { return a + x.valor; }, 0)) + ' parados' : '') + '</span></div>';
    if (!l.length) return h + '<div class="vazio" style="padding:28px 18px">Ninguém com pedido montado agora.</div></div>';
    l.forEach(function (x) {
      h += '<div class="linha-cli mont-l">' +
        '<span class="cli-ini">' + esc(iniciais(x.c.nome)) + '</span>' +
        '<span class="lp-corpo">' +
          '<button class="lp-nome cli-link" data-acao="modal" data-v="cliente" data-id="' + x.c.id + '">' + esc(x.c.nome) + '</button>' +
          '<span class="lp-meta">' + x.pecas + ' peças . ' + brl(x.valor) + ' . ' +
            (x.agora ? '<b class="mont-agora">montando agora no catálogo</b>' : 'mexeu ' + esc(x.quando)) + '</span></span>' +
        (x.agora ? '' : '<a class="btn btn-sec btn-peq" href="' + linkChamar(x) + '" target="_blank" rel="noopener">' + IC.whats + 'Chamar no WhatsApp</a>') +
        '</div>';
    });
    return h + '<p class="pq-nota">O pedido fica guardado no cadastro do cliente. Uma mensagem no dia seguinte costuma fechar boa parte deles.</p></div>';
  }

  function valorPedido(ped) {
    var t = 0;
    ped.itens.forEach(function (it) {
      var p = prod(it.id);
      if (!p) return;
      for (var tam in it.g) t += p.preco * it.g[tam];
    });
    return t;
  }
  function pecasPedido(ped) {
    var n = 0;
    ped.itens.forEach(function (it) { for (var tam in it.g) n += it.g[tam]; });
    return n;
  }
  function gradeTexto(g) {
    return Object.keys(g).map(function (tam) { return tam + ': ' + g[tam]; }).join('  .  ');
  }
  function somaGrade(g) {
    var n = 0; for (var tam in g) n += g[tam]; return n;
  }

  /* =================== ícones =================== */

  var IC = {
    busca: '<svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="8" cy="8" r="5.6"/><path d="M12.2 12.2L16 16"/></svg>',
    coracao: '<svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="#6B6757" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="M9 15.2S2.4 11.3 2.4 6.9A3.6 3.6 0 019 5.1a3.6 3.6 0 016.6 1.8c0 4.4-6.6 8.3-6.6 8.3z"/></svg>',
    sacola: '<svg width="19" height="19" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M3.6 6.4h12.8l-1 10.2H4.6z"/><path d="M7 6.4V4.9a3 3 0 016 0v1.5"/></svg>',
    cadeado: '<svg width="11" height="13" viewBox="0 0 12 14" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="1" y="6" width="10" height="7"/><path d="M3.5 6V3.5a2.5 2.5 0 015 0V6"/></svg>',
    volta: '<svg width="7" height="12" viewBox="0 0 7 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 1L1 6l5 5"/></svg>',
    menu: '<svg width="20" height="14" viewBox="0 0 20 14" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><path d="M1 1h18M1 7h18M1 13h18"/></svg>',
    fecha: '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><path d="M2 2l12 12M14 2L2 14"/></svg>',
    alerta: '<svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="7" cy="7" r="5.6"/><path d="M7 4.2v3.4M7 9.7v.1"/></svg>',
    // Balão de conversa genérico: a marca do WhatsApp não entra no produto.
    whats: '<svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M9 2.2a6.8 6.8 0 0 0-5.9 10.2L2.2 15.8l3.5-.9A6.8 6.8 0 1 0 9 2.2z"/><path d="M6.6 6.4c.2 1.9 1.6 3.5 3.6 4.4l1-.9 1.3.7-.4 1.2c-2.8-.3-5-2.5-5.4-5.3l1.2-.4.6 1.3z" fill="currentColor" stroke="none"/></svg>',
    pix: '<svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="M11 2.5l3.6 3.6-3.6 3.6-3.6-3.6zM11 12.3l3.6 3.6-3.6 3.6-3.6-3.6zM2.5 11l3.6-3.6 3.6 3.6-3.6 3.6zM12.3 11l3.6-3.6 3.6 3.6-3.6 3.6z"/></svg>',
    cartao: '<svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="2.5" y="5" width="17" height="12"/><path d="M2.5 9h17M5.5 13.5h4"/></svg>',
    segue: '<svg width="7" height="12" viewBox="0 0 7 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M1 1l5 5-5 5"/></svg>',
    certoP: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12.5l5.5 5.5L20 7"/></svg>',
    certo: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#2B2A1E" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12.5l5.5 5.5L20 7"/></svg>',
    sobe: '<svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 10V2M2.6 5.4L6 2l3.4 3.4"/></svg>',
    pega: '<svg width="12" height="18" viewBox="0 0 12 18" fill="currentColor" aria-hidden="true"><circle cx="3" cy="3" r="1.6"/><circle cx="9" cy="3" r="1.6"/><circle cx="3" cy="9" r="1.6"/><circle cx="9" cy="9" r="1.6"/><circle cx="3" cy="15" r="1.6"/><circle cx="9" cy="15" r="1.6"/></svg>',
    filtro: '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M2 4h12M4.5 8h7M7 12h2"/></svg>',
    desce: '<svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2v8M2.6 6.6L6 10l3.4-3.4"/></svg>'
  };

  /* =================== catálogo: quem compra =================== */

  // Cabeçalho de largura cheia, com navegação por categoria. No celular ele
  // quebra em linhas; no desktop vira a barra única de um site de loja.
  function topoLoja() {
    var tot = totalCarrinho();
    var favs = Object.keys(st.favoritos).length;

    var nav = '<nav class="site-nav" aria-label="Categorias">';
    CATS.forEach(function (c) {
      nav += '<button class="nav-l" data-acao="filtro" data-v="' + c[0] + '"' +
        (st.filtro === c[0] && st.tela === 'vitrine' ? ' aria-current="page"' : '') + '>' + c[1] + '</button>';
    });
    nav += '</nav>';

    // No celular a navegação sai do cabeçalho e vai para a gaveta; a busca
    // abre por toque na lupa. No desktop tudo fica na mesma linha.
    return '<header class="site-topo"><div class="site-topo-in">' +
      '<button class="so-mob ham" data-acao="abrir-menu" data-v="cat" aria-label="Abrir o menu">' + IC.menu + '</button>' +
      '<button class="site-marca' + (temLogo() ? ' com-logo' : '') + '" data-acao="inicio-loja" aria-label="' + esc(LOJA.nome) + ', página inicial">' +
        (temLogo() ? logoLoja()
          : '<span class="site-nome serif">' + esc(LOJA.nome) + '</span>' +
            '<span class="site-sub">ATACADO . ' + esc(LOJA.cidade.toUpperCase()) + '</span>') +
      '</button>' + nav +
      '<div class="busca site-busca' + (st.buscaAberta ? ' aberta' : '') + '">' + IC.busca +
        '<input id="qbusca" type="search" placeholder="Buscar no catálogo" value="' + esc(st.busca) + '" aria-label="Buscar modelo ou referência">' +
        (st.busca ? '<button class="busca-x so-desk" data-acao="limpar-busca" aria-label="Limpar a busca">' + IC.fecha + '</button>' : '') +
      '</div>' +
      '<div class="site-acoes">' +
        '<button class="so-mob icone" data-acao="busca-mob" aria-label="' + (st.buscaAberta ? 'Fechar a busca' : 'Buscar no catálogo') + '" aria-expanded="' + st.buscaAberta + '">' +
          (st.buscaAberta ? IC.fecha : IC.busca) + '</button>' +
        (favs && st.logado
          ? '<button class="site-fav" data-acao="conta" data-v="favoritos" aria-label="Ver os ' + favs + ' favoritos">' + IC.coracao + '<b>' + favs + '</b></button>'
          : '') +
        (podePreco() && tot.pecas > 0
          ? '<button class="pino" data-acao="ir-carrinho" aria-label="Ver o pedido, ' + tot.pecas + ' peças">' + IC.sacola + '<b>' + tot.pecas + '</b></button>'
          : '') +
        (st.logado
          ? '<button class="site-conta" data-acao="conta" data-v="pedidos">' +
              '<i>' + esc(iniciais(euCliente().nome)) + '</i>' +
              '<span><b>' + esc(euCliente().nome) + '</b>Minha conta</span></button>'
          : '<button class="btn btn-peq so-desk" data-acao="ir-entrar">Entrar</button>') +
      '</div></div></header>';
  }

  /* ---------- gaveta lateral do celular ----------
     Cada área tem o próprio menu: o catálogo mostra categorias e conta,
     o painel mostra as seções da gestão.                                 */

  function gavLinha(acao, v, rotulo, n, atual) {
    return '<button class="gav-l' + (atual ? ' on' : '') + '" data-acao="' + acao + '" data-v="' + v + '">' +
      rotulo + (n ? '<i>' + n + '</i>' : '') + '</button>';
  }

  function gavetaCatalogo() {
    var eu = st.logado ? euCliente() : null;
    var meus = st.logado ? meusPedidos().length : 0;
    var favs = Object.keys(st.favoritos).length;

    var h = '<div class="gav-topo">' +
        '<div class="gav-marca">' + (temLogo() ? logoLoja('logo-gav') : '<b class="serif">' + esc(LOJA.nome) + '</b>') +
        '<span>ATACADO . ' + esc(LOJA.cidade.toUpperCase()) + '</span></div>' +
        '<button class="mod-x" data-acao="fechar-menu" aria-label="Fechar o menu">&times;</button>' +
      '</div><nav class="gav-corpo">';

    h += '<h4>Categorias</h4>';
    CATS.forEach(function (c) {
      h += gavLinha('filtro', c[0], c[1], 0, st.tela === 'vitrine' && st.filtro === c[0]);
    });

    if (st.logado) {
      h += '<h4>Minha conta</h4>' +
        gavLinha('conta', 'pedidos', 'Meus pedidos', meus, st.tela === 'conta' && st.contaAba === 'pedidos') +
        gavLinha('conta', 'favoritos', 'Favoritos', favs, st.tela === 'conta' && st.contaAba === 'favoritos') +
        gavLinha('conta', 'dados', 'Meus dados', 0, st.tela === 'conta' && st.contaAba === 'dados');
    }

    h += '<h4>Atendimento</h4>' +
      '<span class="gav-t">WhatsApp comercial</span>' +
      '<span class="gav-t">Segunda a sexta, 8h às 17h</span>' +
      '<span class="gav-t">Pedido mínimo de ' + minimoTexto() + '</span>' +
      '</nav><div class="gav-pe">' +
      (st.logado
        ? '<div class="gav-quem"><i>' + esc(iniciais(eu.nome)) + '</i><span><b>' + esc(eu.nome) + '</b>' + esc(SITC[eu.sit][0]) + '</span></div>' +
          '<button class="btn btn-sec btn-bloco" data-acao="sair">Sair da conta</button>'
        : '<button class="btn btn-bloco" data-acao="ir-entrar">Entrar como revendedor</button>') +
      '</div>';
    return h;
  }

  function gavetaPainel() {
    var esperando = CLIENTES.filter(function (c) { return c.sit === 'esp'; }).length;
    var novos = PEDIDOS.filter(function (p) { return p.sit === 'novo'; }).length;
    var aba = st.pnl === 'detalhe' ? 'pedidos' : st.pnl;

    return '<div class="gav-topo">' +
        '<div class="gav-marca gav-lume">' +
          '<svg width="16" height="22" style="color:var(--lume);display:block"><use href="#lume"/></svg>' +
          '<b class="serif">lume</b></div>' +
        '<button class="mod-x" data-acao="fechar-menu" aria-label="Fechar o menu">&times;</button>' +
      '</div><nav class="gav-corpo">' +
        '<h4>Gestão</h4>' +
        gavLinha('aba', 'inicio', 'Início', 0, aba === 'inicio') +
        gavLinha('aba', 'pedidos', 'Pedidos', novos, aba === 'pedidos') +
        gavLinha('aba', 'produtos', 'Produtos', 0, aba === 'produtos') +
        gavLinha('aba', 'clientes', 'Clientes', esperando, aba === 'clientes') +
        gavLinha('aba', 'vitrine', 'Vitrine', 0, aba === 'vitrine') +
        gavLinha('aba', 'ajustes', 'Ajustes', 0, aba === 'ajustes') +
        '<h4>Atalhos</h4>' +
        '<button class="gav-l" data-acao="modal" data-v="novo-produto">Novo produto</button>' +
        '<button class="gav-l" data-acao="modal" data-v="importar">Importar planilha</button>' +
      '</nav><div class="gav-pe">' +
        '<div class="gav-quem"><i>' + esc(iniciais(LOJA.nome)) + '</i>' +
        '<span><b>' + esc(LOJA.nome) + '</b>Painel do lojista</span></div>' +
      '</div>';
  }

  function gaveta() {
    if (!st.menu) return '';
    return '<div class="gav-fundo" data-acao="fechar-menu"></div>' +
      '<aside class="gav" role="dialog" aria-modal="true" aria-label="Menu">' +
      (st.menu === 'pnl' ? gavetaPainel() : gavetaCatalogo()) + '</aside>';
  }

  // A marca do Lume entra pequena, só no pé do rodapé: o catálogo é do cliente.
  function rodapeLoja() {
    var cols = '<div class="rod-col rod-sobre">' +
        '<div class="rod-marca serif">' + esc(LOJA.nome) + '</div>' +
        '<p>Confecção de jeans em ' + esc(LOJA.cidade) + '. Atacado para lojistas de todo o Brasil, com grade fechada e pedido mínimo de ' + minimoTexto() + '.</p>' +
      '</div><div class="rod-col"><h4>Comprar</h4>';
    CATS.forEach(function (c) {
      cols += '<button class="rod-l" data-acao="filtro" data-v="' + c[0] + '">' + c[1] + '</button>';
    });
    cols += '</div><div class="rod-col"><h4>Atendimento</h4>' +
        '<span class="rod-t">WhatsApp comercial</span>' +
        '<span class="rod-t">Segunda a sexta, 8h às 17h</span>' +
        '<span class="rod-t">Sábado, 8h às 12h</span>' +
      '</div><div class="rod-col"><h4>Como comprar</h4>' +
        '<span class="rod-t">Cadastro com CNPJ</span>' +
        '<span class="rod-t">Preço liberado após aprovação</span>' +
        '<span class="rod-t">Envio para todo o Brasil</span>' +
      '</div>';

    return '<footer class="rodape"><div class="rodape-in">' + cols + '</div>' +
      '<div class="rodape-pe"><span>' + esc(LOJA.nome) + ' . todos os direitos reservados</span>' +
      '<span class="rod-lume">' +
        '<svg width="12" height="17" style="color:var(--grafite-c);display:block"><use href="#lume"/></svg>' +
        'catálogo no Lume</span></div></footer>';
  }

  /* ---------- logo do lojista ----------
     O catálogo é da confecção, então a logo dela vai em destaque no topo.
     A logo de exemplo é um desenho em SVG; na visita, troque pela logo da
     confecção na aba Vitrine do painel.                                  */

  function logoDemo() {
    var folhas = '';
    [0.18, 0.34, 0.5, 0.66, 0.82].forEach(function (t, i) {
      var x = 13 + 13 * t, y = 48 - 42 * t, tam = 6.4 - i * 0.55;
      folhas +=
        '<ellipse cx="' + (x - 4.6).toFixed(1) + '" cy="' + (y - 1.2).toFixed(1) + '" rx="' + tam.toFixed(1) + '" ry="2" transform="rotate(-58 ' + (x - 4.6).toFixed(1) + ' ' + (y - 1.2).toFixed(1) + ')"/>' +
        '<ellipse cx="' + (x + 4.4).toFixed(1) + '" cy="' + (y - 3).toFixed(1) + '" rx="' + tam.toFixed(1) + '" ry="2" transform="rotate(-118 ' + (x + 4.4).toFixed(1) + ' ' + (y - 3).toFixed(1) + ')"/>';
    });
    return '<svg viewBox="0 0 196 54" role="img" aria-label="' + esc(LOJA.nome) + '">' +
      '<path d="M12 50 C 15 36, 19 22, 26.5 4" fill="none" stroke="#3E5A47" stroke-width="1.8" stroke-linecap="round"/>' +
      '<g fill="#5C7A62">' + folhas + '</g>' +
      '<ellipse cx="27" cy="4.6" rx="4.4" ry="1.9" transform="rotate(-70 27 4.6)" fill="#3E5A47"/>' +
      '<text x="42" y="32" font-family="Instrument Serif, Georgia, serif" font-size="33" letter-spacing="3.2" fill="#24261E">ALECRIM</text>' +
      '<text x="44" y="47" font-family="Inter, Arial, sans-serif" font-size="8.4" font-weight="600" letter-spacing="3.1" fill="#3E5A47">JEANS . TORITAMA</text>' +
      '</svg>';
  }

  function temLogo() { return !!LOJA.logo && LOJA.logoTopo === 'logo'; }

  // Mesma logo no topo, na gaveta e na prévia do painel.
  function logoLoja(extra) {
    if (!LOJA.logo) return '';
    return '<span class="logo-loja logo-' + LOJA.logoTam + (extra ? ' ' + extra : '') + '">' +
      (LOJA.logo === 'demo' ? logoDemo() : '<img src="' + LOJA.logo.src + '" alt="' + esc(LOJA.nome) + '">') +
      '</span>';
  }

  /* ---------- carrossel da capa ---------- */

  // Arte dos banners de exemplo: fundo de cor e peças do próprio catálogo.
  var ARTES = {
    jeans: { fundo: 'linear-gradient(112deg, #18213A 0%, #26355A 48%, #40527A 100%)',
      pecas: [['p1', 'jeansclaro'], ['p4', 'indigo'], ['p3', 'jeansesc']] },
    malhas: { fundo: 'linear-gradient(112deg, #5A2C1C 0%, #8E4A30 50%, #B5674A 100%)',
      pecas: [['p9', 'branco'], ['p9', 'mostarda'], ['p9', 'preto'], ['p9', 'militar'], ['p9', 'vermelho']] },
    vestidos: { fundo: 'linear-gradient(112deg, #2E1017 0%, #561A26 50%, #7A2432 100%)',
      pecas: [['p10', 'terracota'], ['p10', 'oliva'], ['p10', 'preto']] },
    inverno: { fundo: 'linear-gradient(112deg, #2C2F27 0%, #43483A 50%, #5E6450 100%)',
      pecas: [['p11', 'mescla'], ['p11', 'preto'], ['p11', 'lilas']] }
  };

  function arteBanner(k) {
    var a = ARTES[k] || ARTES.jeans;
    var pecas = a.pecas.filter(function (x) { return prod(x[0]); });
    return '<div class="arte" style="background:' + a.fundo + '" aria-hidden="true">' +
      '<div class="arte-pecas arte-n' + pecas.length + '">' +
      pecas.map(function (x, i) {
        return '<span class="ap ap-' + i + '">' + svgPeca(prod(x[0]), x[1], 'frente', { mudo: true }) + '</span>';
      }).join('') + '</div></div>';
  }

  function bannersAtivos() { return BANNERS.filter(function (b) { return b.ativo; }); }

  function nomeDestino(d) {
    if (!d) return 'Nenhum lugar';
    if (d.indexOf('col:') === 0) { var co = colecao(d.slice(4)); return co ? 'Coleção ' + co.nome : 'Nenhum lugar'; }
    var c = CATS.filter(function (x) { return x[0] === d; })[0];
    return c ? (d === 'todos' ? 'Catálogo inteiro' : c[1]) : 'Nenhum lugar';
  }

  // Imagem do banner: arte de exemplo ou foto do lojista. No celular entra
  // a imagem própria de celular, se houver; senão a do computador recortada.
  function midiaBanner(b) {
    if (!b.img) return arteBanner(b.arte);
    var pos = b.foco === 'esquerda' ? '20% 50%' : b.foco === 'direita' ? '80% 50%' : '50% 50%';
    return '<img class="sl-img sl-desk" src="' + b.img + '" alt="">' +
      '<img class="sl-img sl-mob" src="' + (b.imgMob || b.img) + '" alt="" style="object-position:' + (b.imgMob ? '50% 50%' : pos) + '">';
  }

  function slide(b, i, n) {
    var com = b.texto && (b.titulo || b.sub);
    var h = '<div class="slide' + (com ? ' com-texto' : '') + '" role="group" aria-roledescription="slide" aria-label="' + (i + 1) + ' de ' + n +
      (b.titulo ? ': ' + esc(b.titulo) : '') + '"' + (i === st.slide ? '' : ' aria-hidden="true"') + '>' +
      midiaBanner(b);
    if (com) {
      h += '<div class="sl-txt"><div class="sl-in">' +
        (b.tag ? '<span class="capa-tag">' + esc(b.tag.toUpperCase()) + '</span>' : '') +
        (b.titulo ? '<h2 class="serif">' + esc(b.titulo) + '</h2>' : '') +
        (b.sub ? '<p>' + esc(b.sub) + '</p>' : '') +
        (b.destino ? '<button class="btn btn-dest" data-acao="filtro" data-v="' + b.destino + '"' + (i === st.slide ? '' : ' tabindex="-1"') + '>' +
          esc(b.botao || 'Ver agora') + '</button>' : '') +
        '</div></div>';
    } else if (b.destino) {
      // Arte com texto na própria imagem: o banner inteiro vira o link.
      h += '<button class="sl-link" data-acao="filtro" data-v="' + b.destino + '" aria-label="' + esc(b.titulo || nomeDestino(b.destino)) + '"' +
        (i === st.slide ? '' : ' tabindex="-1"') + '></button>';
    }
    return h + '</div>';
  }

  function carrossel() {
    var l = bannersAtivos();
    var n = l.length;
    if (st.slide >= n) st.slide = 0;
    var h = '<section class="carr" aria-roledescription="carrossel" aria-label="Destaques da ' + esc(LOJA.nome) + '">' +
      '<div class="carr-trilho" style="transform:translateX(' + (-st.slide * 100) + '%)">' +
      l.map(function (b, i) { return slide(b, i, n); }).join('') + '</div>';
    if (n > 1) {
      h += '<button class="carr-seta carr-ant" data-acao="slide" data-v="-1" aria-label="Banner anterior">' + IC.volta + '</button>' +
        '<button class="carr-seta carr-prox" data-acao="slide" data-v="+1" aria-label="Próximo banner">' + IC.segue + '</button>' +
        '<div class="carr-pontos">' + l.map(function (b, i) {
          return '<button data-acao="slide" data-v="' + i + '" aria-label="Ir para o banner ' + (i + 1) + '"' +
            (i === st.slide ? ' aria-current="true"' : '') + '></button>';
        }).join('') + '</div>';
    }
    return h + '</section>';
  }

  // Os números que moravam na capa antiga descem para uma faixa logo abaixo.
  function faixaLoja() {
    var pecas = visiveis().reduce(function (a, p) { return a + estoqueTotal(p); }, 0);
    return '<div class="loja-faixa"><div class="loja-faixa-in">' +
      '<span><b>' + visiveis().length + '</b> modelos</span>' +
      '<span><b>' + pecas.toLocaleString('pt-BR') + '</b> peças a pronta entrega</span>' +
      '<span>Pedido mínimo de <b>' + minimoTexto() + '</b></span>' +
      '<span>Envio para todo o <b>Brasil</b></span>' +
      '</div></div>';
  }

  // Tres pecas de silhuetas diferentes, para a capa nao repetir o desenho.
  function destaquesCapa() {
    var vistas = {}, fora = [], escolhidas = [];
    visiveis().forEach(function (p) {
      if (vistas[p.forma]) { fora.push(p); return; }
      vistas[p.forma] = true;
      escolhidas.push(p);
    });
    return escolhidas.concat(fora).slice(0, 3);
  }

  function capaColecao() {
    var pecas = visiveis().reduce(function (a, p) { return a + estoqueTotal(p); }, 0);

    return '<section class="capa"><div class="capa-in">' +
      '<div class="capa-txt">' +
        '<span class="capa-tag">NOVA COLEÇÃO</span>' +
        '<h2 class="serif">' + esc(LOJA.colecao) + '</h2>' +
        '<p>' + esc(LOJA.chamada) + '</p>' +
        '<div class="capa-nums">' +
          '<div class="capa-num"><b>' + visiveis().length + '</b><span>MODELOS</span></div>' +
          '<div class="capa-num"><b>' + pecas + '</b><span>PEÇAS EM ESTOQUE</span></div>' +
          '<div class="capa-num"><b>' + (LOJA.minTipo === 'pecas' ? LOJA.minPecas + ' peças' : brl(LOJA.minimo).replace(',00', '')) + '</b>' +
            '<span>PEDIDO MÍNIMO' + (LOJA.minTipo === 'ambos' ? ' E ' + LOJA.minPecas + ' PEÇAS' : '') + '</span></div>' +
        '</div>' +
        '<button class="btn btn-dest" data-acao="filtro" data-v="todos">Ver a coleção</button>' +
      '</div>' +
      '<div class="capa-pecas" aria-hidden="true">' +
        destaquesCapa().map(function (p, i) {
          return '<span class="cp cp-' + i + '" style="background:' + p.fundo + '">' +
            svgPeca(p, p.cores[0], 'frente', { mudo: true }) +
            '<em>' + esc(p.nome) + '</em></span>';
        }).join('') +
      '</div></div></section>';
  }

  var ORDENS = [['destaque', 'Destaques'], ['menor', 'Menor preço'], ['maior', 'Maior preço']];

  /* ---------- filtros do catálogo ----------
     A categoria vem da barra de navegação; o resto vem da coluna de
     filtros. Cor e tamanho só contam se houver estoque: filtrar por GG e
     cair num modelo com GG esgotado frustra mais que ajuda.              */

  var FAIXAS_PRECO = [['ate30', 'Até R$ 30', 0, 30], ['30a60', 'De R$ 30 a R$ 60', 30, 60], ['acima60', 'Acima de R$ 60', 60, 1e9]];

  // Produtos da categoria e da busca, antes dos filtros da coluna.
  function baseCatalogo() {
    var b = semAcento(st.busca.trim());
    return visiveis().filter(function (p) {
      if (st.filtro !== 'todos' && p.cat !== st.filtro) return false;
      if (!b) return true;
      return semAcento(p.nome).indexOf(b) >= 0 || semAcento(p.ref).indexOf(b) >= 0;
    });
  }

  function passaFiltros(p, ignora) {
    var f = st.fl;
    if (ignora !== 'col' && f.col.length && !f.col.some(function (c) { return (p.tags || []).indexOf(c) >= 0; })) return false;
    var cores = ignora !== 'cor' && f.cor.length ? p.cores.filter(function (c) { return f.cor.indexOf(c) >= 0 && estoqueCor(p, c) > 0; }) : p.cores;
    if (ignora !== 'cor' && f.cor.length && !cores.length) return false;
    if (ignora !== 'tam' && f.tam.length && !tamsDe(p).some(function (t) {
      return f.tam.indexOf(t) >= 0 && cores.some(function (c) { return est(p, c, t) > 0; });
    })) return false;
    if (ignora !== 'novos' && f.novos && !p.novo) return false;
    if (ignora !== 'preco' && f.preco && podePreco()) {
      var fx = FAIXAS_PRECO.filter(function (x) { return x[0] === f.preco; })[0];
      if (fx && !(p.preco >= fx[2] && p.preco < fx[3])) return false;
    }
    return true;
  }

  function nFiltros() {
    var f = st.fl;
    return f.col.length + f.cor.length + f.tam.length + (f.novos ? 1 : 0) + (f.preco && podePreco() ? 1 : 0);
  }

  // Ordem dos tamanhos: números em ordem, depois letras do PP ao XGG,
  // depois o que o lojista inventar (G1, G2, U...) em ordem alfabética.
  var ORDEM_LETRAS = ['RN', 'PP', 'P', 'M', 'G', 'GG', 'XG', 'XGG', 'EG', 'EGG'];
  function pesoTam(t) {
    if (/^\d+$/.test(t)) return [0, +t];
    var i = ORDEM_LETRAS.indexOf(t);
    return i >= 0 ? [1, i] : [2, 0];
  }
  function ordemTams() {
    var l = [];
    Object.keys(TABELAS).forEach(function (k) { TABELAS[k].tams.forEach(function (t) { if (l.indexOf(t) < 0) l.push(t); }); });
    return l.sort(function (a, b) {
      var pa = pesoTam(a), pb = pesoTam(b);
      return pa[0] - pb[0] || pa[1] - pb[1] || a.localeCompare(b);
    });
  }

  // Título de cada grupo: abre e fecha, e mostra quantos estão marcados.
  function flTitulo(sec, rotulo, n) {
    var aberto = !st.flFechado[sec];
    return '<button class="fl-tit" data-acao="fl-sec" data-v="' + sec + '" aria-expanded="' + aberto + '">' +
      rotulo + (n ? '<span>' + n + '</span>' : '') + '<i aria-hidden="true"></i></button>';
  }
  function flCorpo(sec, html) {
    return st.flFechado[sec] ? '' : '<div class="fl-corpo">' + html + '</div>';
  }

  // Cada opção mostra quantos modelos aparecem se for marcada, contando
  // os outros filtros já ligados.
  function filtrosHTML() {
    var base = baseCatalogo(), f = st.fl;
    function conta(tipo, teste) {
      return base.filter(function (p) { return passaFiltros(p, tipo) && teste(p); }).length;
    }
    var h = '';

    var cols = COLECOES.map(function (c) {
      return { c: c, n: conta('col', function (p) { return (p.tags || []).indexOf(c.id) >= 0; }) };
    }).filter(function (x) { return x.n || f.col.indexOf(x.c.id) >= 0; });
    if (cols.length) {
      h += '<div class="fl-bloco">' + flTitulo('col', 'Coleção', f.col.length) + flCorpo('col', cols.map(function (x) {
        var on = f.col.indexOf(x.c.id) >= 0;
        return '<button class="fl-op" data-acao="fl" data-k="col" data-v="' + x.c.id + '" aria-pressed="' + on + '">' +
          '<i class="fl-cx"></i>' + esc(x.c.nome) + '<em>' + x.n + '</em></button>';
      }).join('')) + '</div>';
    }

    var coresTem = Object.keys(CORES).filter(function (k) {
      return f.cor.indexOf(k) >= 0 || base.some(function (p) { return p.cores.indexOf(k) >= 0 && estoqueCor(p, k) > 0; });
    });
    if (coresTem.length) {
      h += '<div class="fl-bloco">' + flTitulo('cor', 'Cor', f.cor.length) + flCorpo('cor', '<div class="fl-cores">' +
        coresTem.map(function (k) {
          var on = f.cor.indexOf(k) >= 0;
          var n = conta('cor', function (p) { return p.cores.indexOf(k) >= 0 && estoqueCor(p, k) > 0; });
          return '<button class="fl-cor' + (lum(CORES[k].hex) > 0.8 ? ' claro' : '') + '" data-acao="fl" data-k="cor" data-v="' + k + '" aria-pressed="' + on + '"' +
            ' title="' + esc(CORES[k].nome) + ', ' + n + (n === 1 ? ' modelo' : ' modelos') + '" aria-label="' + esc(CORES[k].nome) + '"' + (n || on ? '' : ' disabled') + '>' +
            '<i style="background:' + CORES[k].hex + '"></i></button>';
        }).join('') + '</div>' +
        (f.cor.length ? '<p class="fl-sel">' + f.cor.map(function (k) { return esc(CORES[k].nome); }).join(', ') + '</p>' : '')) + '</div>';
    }

    var tams = ordemTams().filter(function (t) {
      return f.tam.indexOf(t) >= 0 || base.some(function (p) { return tamsDe(p).indexOf(t) >= 0; });
    });
    if (tams.length) {
      // Números numa fileira, letras na outra: misturar 48 com PP confunde.
      var botaoTam = function (t) {
        var on = f.tam.indexOf(t) >= 0;
        var n = conta('tam', function (p) { return p.cores.some(function (c) { return est(p, c, t) > 0; }); });
        return '<button class="fl-tam" data-acao="fl" data-k="tam" data-v="' + esc(t) + '" aria-pressed="' + on + '"' + (n || on ? '' : ' disabled') + '>' + esc(t) + '</button>';
      };
      var nums = tams.filter(function (t) { return /^\d+$/.test(t); });
      var letras = tams.filter(function (t) { return !/^\d+$/.test(t); });
      h += '<div class="fl-bloco">' + flTitulo('tam', 'Tamanho', f.tam.length) + flCorpo('tam',
        (nums.length ? '<div class="fl-tams">' + nums.map(botaoTam).join('') + '</div>' : '') +
        (letras.length ? '<div class="fl-tams">' + letras.map(botaoTam).join('') + '</div>' : '')) + '</div>';
    }

    var nNovos = conta('novos', function (p) { return p.novo; });
    h += '<div class="fl-bloco">' + flTitulo('novos', 'Lançamentos', f.novos ? 1 : 0) + flCorpo('novos',
      '<button class="fl-op" data-acao="fl" data-k="novos" aria-pressed="' + f.novos + '"' + (nNovos || f.novos ? '' : ' disabled') + '>' +
      '<i class="fl-cx"></i>Só novidades<em>' + nNovos + '</em></button>') + '</div>';

    if (podePreco()) {
      h += '<div class="fl-bloco">' + flTitulo('preco', 'Preço por peça', f.preco ? 1 : 0) + flCorpo('preco', FAIXAS_PRECO.map(function (x) {
        var n = conta('preco', function (p) { return p.preco >= x[2] && p.preco < x[3]; });
        return '<button class="fl-op fl-radio" data-acao="fl" data-k="preco" data-v="' + x[0] + '" aria-pressed="' + (f.preco === x[0]) + '"' +
          (n || f.preco === x[0] ? '' : ' disabled') + '><i class="fl-cx"></i>' + x[1] + '<em>' + n + '</em></button>';
      }).join('')) + '</div>';
    }
    return h;
  }

  // Filtros ligados, em fichas que dá para tirar uma a uma.
  function fichasFiltros() {
    var f = st.fl, l = [];
    f.col.forEach(function (c) { var co = colecao(c); if (co) l.push(['col', c, co.nome]); });
    f.cor.forEach(function (c) { l.push(['cor', c, CORES[c].nome]); });
    f.tam.forEach(function (t) { l.push(['tam', t, 'Tam. ' + t]); });
    if (f.novos) l.push(['novos', '', 'Novidades']);
    if (f.preco && podePreco()) l.push(['preco', f.preco, FAIXAS_PRECO.filter(function (x) { return x[0] === f.preco; })[0][1]]);
    if (!l.length) return '';
    return '<div class="fl-fichas">' + l.map(function (x) {
      return '<button class="fl-ficha" data-acao="fl" data-k="' + x[0] + '" data-v="' + esc(x[1]) + '" aria-label="Tirar o filtro ' + esc(x[2]) + '">' +
        (x[0] === 'cor' ? '<i style="background:' + CORES[x[1]].hex + '"></i>' : '') + esc(x[2]) + IC.fecha + '</button>';
    }).join('') + '<button class="fl-limpar" data-acao="fl-limpar">Limpar filtros</button></div>';
  }

  function filtrados() {
    var l = baseCatalogo().filter(function (p) { return passaFiltros(p); });
    if (st.ordem === 'menor') l = l.slice().sort(function (a, c) { return a.preco - c.preco; });
    if (st.ordem === 'maior') l = l.slice().sort(function (a, c) { return c.preco - a.preco; });
    return l;
  }

  // O mesmo recado em todas as telas do catálogo: por que o preço não
  // aparece. Muda conforme a situação do cadastro no painel do lojista.
  function avisoCadastro() {
    if (podePreco()) return '';
    if (!st.logado) {
      return '<div class="aviso">' +
        '<p><strong>Preços só para revendedor.</strong> Entre com seu cadastro para ver valores e fechar pedido.</p>' +
        '<button class="btn btn-peq" data-acao="ir-entrar">Entrar</button></div>';
    }
    var eu = euCliente();
    if (eu.sit === 'esp') {
      return '<div class="aviso"><p><strong>Cadastro em análise.</strong> ' + esc(LOJA.nome) +
        ' ainda não aprovou o cadastro da ' + esc(eu.nome) + '. Assim que aprovar, o preço aparece aqui.</p></div>';
    }
    return '<div class="aviso ruim"><p><strong>Cadastro bloqueado.</strong> Fale com ' + esc(LOJA.nome) +
      ' para liberar a ' + esc(eu.nome) + ' de novo.</p></div>';
  }

  // Um selo só por card: coleção de destaque, depois novo, depois últimas peças.
  function seloCard(p, est) {
    var dest = (p.tags || []).map(colecao).filter(function (c) { return c && c.destaque; })[0];
    if (dest) return '<span class="selo selo-col">' + esc(dest.nome) + '</span>';
    if (p.novo) return '<span class="selo selo-novo">Novo</span>';
    return est < 60 ? '<span class="selo selo-poucas">Últimas</span>' : '';
  }

  function cardProduto(p) {
    var est = estoqueTotal(p);
    var lk = corDe(p);
    var fav = !!st.favoritos[p.id];
    return '<div class="card">' +
      seloCard(p, est) +
      '<button class="coracao" data-acao="fav" data-id="' + p.id + '" aria-pressed="' + fav + '" aria-label="Favoritar ' + esc(p.nome) + '">' + IC.coracao + '</button>' +
      '<button class="card-img" data-acao="abrir" data-id="' + p.id + '" style="background:' + p.fundo + '" aria-label="Abrir ' + esc(p.nome) + '">' +
        svgPeca(p, lk, 'frente', { mudo: true }) + '</button>' +
      '<button class="card-corpo" data-acao="abrir" data-id="' + p.id + '">' +
        '<span class="card-nome">' + esc(p.nome) + '</span>' +
        '<span class="card-meta">' + faixaTams(p) + ' . ' + est + ' peças</span>' +
        (podePreco()
          ? '<span class="card-preco">' + brl(p.preco) + ' <em>/ peça</em></span>'
          : '<span class="card-trava">' + IC.cadeado + 'Entre para ver o preço</span>') +
        '<span class="lavs">' + p.cores.map(function (l) {
          return '<span class="lav-ponto" style="background:' + CORES[l].hex + '"></span>';
        }).join('') + '</span>' +
      '</button></div>';
  }

  function telaVitrine() {
    var h = '';

    h += avisoCadastro();

    var lista = filtrados();
    var colUnica = st.fl.col.length === 1 && st.filtro === 'todos' && !st.busca ? colecao(st.fl.col[0]) : null;
    var titulo = st.busca ? 'Resultados para "' + esc(st.busca) + '"'
      : colUnica ? esc(colUnica.nome)
      : st.filtro === 'todos' ? 'Coleção ' + esc(LOJA.colecao.toLowerCase())
      : CATS.filter(function (c) { return c[0] === st.filtro; })[0][1];
    var nf = nFiltros();

    h += '<div class="vit-layout"><aside class="filtros" aria-label="Filtros">' +
        '<div class="fl-cab"><b>Filtrar</b>' + (nf ? '<button class="fl-limpar" data-acao="fl-limpar">Limpar</button>' : '') + '</div>' +
        filtrosHTML() + '</aside><div class="vit-main">';

    h += '<div class="faixa"><h2>' + titulo + '</h2>' +
      '<div class="faixa-dir"><span>' + lista.length + (lista.length === 1 ? ' modelo' : ' modelos') + '</span>' +
      '<button class="btn btn-sec btn-peq so-mob fl-abrir" data-acao="modal" data-v="filtros">' + IC.filtro + 'Filtrar' + (nf ? ' <b>' + nf + '</b>' : '') + '</button>' +
      '<div class="ordem" role="group" aria-label="Ordenar">';
    ORDENS.forEach(function (o) {
      h += '<button class="ord-b" data-acao="ordem" data-v="' + o[0] + '"' +
        (st.ordem === o[0] ? ' aria-pressed="true"' : ' aria-pressed="false"') + '>' + o[1] + '</button>';
    });
    h += '</div></div></div>' + fichasFiltros();

    if (!lista.length) {
      return h + '<div class="vazio"><b>Nenhum modelo encontrado</b>' +
        (nf ? 'Nenhum modelo tem tudo isso em estoque agora.<br><button class="btn btn-sec btn-peq" style="margin-top:14px" data-acao="fl-limpar">Limpar filtros</button>'
            : 'Tente outra busca ou volte para Tudo.') + '</div></div></div>';
    }

    h += '<div class="grid">';
    lista.forEach(function (p) { h += cardProduto(p); });
    return h + '</div></div></div>';
  }

  function telaEntrar() {
    return '<button class="voltar" data-acao="voltar-vitrine">' + IC.volta + 'Voltar ao catálogo</button>' +
      '<div class="caixa-forma">' +
        '<h2 class="serif" style="font-size:30px;font-weight:400;margin:0 0 9px">Entrar como revendedor</h2>' +
        '<p class="nota" style="margin:0 0 26px">Só quem tem cadastro aprovado pela ' + esc(LOJA.nome) + ' enxerga preço e fecha pedido.</p>' +
        '<form id="fentrar" novalidate>' +
          '<p id="entrar-erro" class="cc-erro" role="alert" style="margin:0 0 14px"></p>' +
          '<label for="cnpj" class="rotulo">CNPJ</label>' +
          '<input id="cnpj" name="cnpj" inputmode="numeric" autocomplete="off" placeholder="00.000.000/0001-00" ' +
            'style="width:100%;padding:14px;border:1px solid var(--casca);background:var(--branco);min-height:50px;margin-bottom:18px;outline-offset:2px">' +
          '<label for="senha" class="rotulo">Senha</label>' +
          '<input id="senha" name="senha" type="password" autocomplete="off" placeholder="••••••••" ' +
            'style="width:100%;padding:14px;border:1px solid var(--casca);background:var(--branco);min-height:50px;margin-bottom:24px;outline-offset:2px">' +
          '<button type="submit" class="btn btn-bloco">Entrar</button>' +
        '</form>' +
        '<p class="nota" style="margin:20px 0 0">É uma demonstração: em branco, entra como ' + esc(euCliente().nome) +
          '. Com o CNPJ de outro cliente do painel, entra como ele.</p>' +
        '<div class="entrar-novo"><span>Ainda não compra da ' + esc(LOJA.nome) + '?</span>' +
          '<button class="btn btn-dest btn-bloco" data-acao="ir-cadastro">Cadastrar minha loja</button></div>' +
      '</div>';
  }

  /* ---------- autocadastro ----------
     O lojista se cadastra sozinho pelo catálogo. O cadastro chega no
     painel como aguardando e só vê preço depois que a confecção aprova.
     No sistema de verdade, razão social e endereço vêm da Receita Federal
     assim que o CNPJ é digitado; aqui o lojista preenche, ou usa o
     exemplo.                                                             */

  // Confere os dois dígitos verificadores do CNPJ.
  function cnpjValido(v) {
    var c = soDigitos(v);
    if (c.length !== 14 || /^(\d)\1+$/.test(c)) return false;
    function dv(n) {
      var pesos = n === 12 ? [5,4,3,2,9,8,7,6,5,4,3,2] : [6,5,4,3,2,9,8,7,6,5,4,3,2], soma = 0;
      for (var i = 0; i < n; i++) soma += +c[i] * pesos[i];
      var r = soma % 11;
      return r < 2 ? 0 : 11 - r;
    }
    return dv(12) === +c[12] && dv(13) === +c[13];
  }

  function fmtCnpj(v) {
    var c = soDigitos(v).slice(0, 14);
    return c.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
  }

  function fmtFone(v) {
    var d = soDigitos(v).slice(0, 11);
    if (d.length < 3) return d;
    if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + (d.length > 6 ? '-' + d.slice(6) : '');
    return '(' + d.slice(0, 2) + ') ' + d[2] + ' ' + d.slice(3, 7) + '-' + d.slice(7);
  }

  function clientePorCnpj(v) {
    var d = soDigitos(v);
    return CLIENTES.filter(function (c) { return soDigitos(c.doc) === d; })[0] || null;
  }

  // Troca quem está logado do lado de quem compra, guardando o contato
  // de quem sai no cadastro dele.
  function trocarEu(id) {
    var atual = cli(EU.id);
    if (atual) { atual.resp = EU.responsavel; atual.fone = EU.fone; atual.email = EU.email; atual.endereco = EU.endereco; }
    if (st.logado) guardarCarrinho();
    var c = cli(id);
    EU = { id: id, responsavel: c.resp || '', fone: c.fone || '', email: c.email || '', endereco: c.endereco || '' };
    st.carrinho = {}; st.favoritos = {};
  }

  var COMO_CONHECEU = [['', 'Escolha uma opção'], ['Instagram', 'Instagram'], ['Feira de Toritama', 'Feira de Toritama'],
    ['Indicação de outro lojista', 'Indicação de outro lojista'], ['Google', 'Google'], ['Vendedor da confecção', 'Vendedor da confecção'], ['Outro', 'Outro']];

  function telaCadastro() {
    var c = st.cad || {};
    function cp(id, rot, extra, larga) {
      return '<label class="campo' + (larga ? ' larga' : '') + '"><span>' + rot + '</span>' +
        '<input id="cd-' + id + '" value="' + esc(c[id] || '') + '" ' + (extra || '') + '></label>';
    }
    return '<button class="voltar" data-acao="ir-entrar">' + IC.volta + 'Voltar para entrar</button>' +
      '<div class="cad-caixa">' +
        '<h2 class="serif cad-tit">Cadastrar minha loja</h2>' +
        '<p class="nota" style="margin:0 0 6px">Atacado só para CNPJ. A ' + esc(LOJA.nome) + ' confere o cadastro e libera os preços, normalmente no mesmo dia.</p>' +
        '<button type="button" class="link-alt" style="margin:0 0 18px" data-acao="cad-exemplo">Preencher com uma loja de exemplo</button>' +
        '<form id="fcadastro" class="caixa-form cad-form" novalidate>' +
          '<p id="cad-erro" class="cc-erro" role="alert"></p>' +
          '<div class="cad-sec larga">A empresa</div>' +
          cp('cnpj', 'CNPJ', 'inputmode="numeric" placeholder="00.000.000/0000-00" maxlength="18" autocomplete="off"') +
          cp('fantasia', 'Nome da loja', 'placeholder="Como os clientes conhecem"') +
          cp('razao', 'Razão social', 'placeholder="Como está no CNPJ"', true) +
          '<p class="aux campo-nota">No sistema de verdade, razão social e endereço chegam sozinhos pela Receita assim que o CNPJ é digitado.</p>' +
          '<div class="cad-sec larga">Quem compra</div>' +
          cp('resp', 'Responsável pelas compras', 'autocomplete="name"') +
          cp('fone', 'WhatsApp', 'inputmode="tel" placeholder="(00) 9 0000-0000" autocomplete="tel"') +
          cp('email', 'E-mail', 'type="email" autocomplete="email"', true) +
          '<div class="cad-sec larga">Entrega</div>' +
          cp('cidade', 'Cidade e estado', 'placeholder="Ex: Garanhuns, PE"') +
          seletor('cd-como', 'Como conheceu a ' + esc(LOJA.nome), COMO_CONHECEU, c.como || '') +
          cp('end', 'Endereço de entrega', 'placeholder="Rua, número, bairro e CEP"', true) +
          '<div class="cad-sec larga">Acesso</div>' +
          cp('senha', 'Crie uma senha', 'type="password" autocomplete="new-password" placeholder="Pelo menos 6 caracteres"') +
          '<label class="campo larga marcar"><input type="checkbox" id="cd-lgpd"' + (c.lgpd ? ' checked' : '') + '>' +
            '<span>Autorizo a ' + esc(LOJA.nome) + ' a usar estes dados para analisar o cadastro e falar comigo sobre pedidos.' +
            '<em>Os dados ficam só com a ' + esc(LOJA.nome) + '. Dá para pedir a exclusão a qualquer momento.</em></span></label>' +
          '<div class="campo-pe"><button type="submit" class="btn">Enviar cadastro</button>' +
          '<span>Depois de enviar você já navega no catálogo. O preço aparece quando o cadastro for aprovado.</span></div>' +
        '</form>' +
      '</div>';
  }

  function telaCadastrado() {
    var eu = euCliente();
    return '<div class="ok-tela">' +
        '<div class="ok-circ">' + IC.certo + '</div>' +
        '<h2>Cadastro enviado</h2>' +
        '<div class="ok-num"><b>' + esc(eu.nome) + '</b> . ' + esc(eu.doc) + '</div>' +
        '<p>A ' + esc(LOJA.nome) + ' vai conferir e liberar os preços. O aviso chega no WhatsApp ' + esc(EU.fone) + '.</p>' +
        '<div class="ok-bts"><button class="btn" data-acao="voltar-vitrine">Ver o catálogo</button></div>' +
        '<p class="nota" style="margin-top:30px">Agora troque para <strong>Quem vende</strong>: o cadastro está em Clientes, esperando aprovação.</p>' +
      '</div>';
  }

  function guardarCadastro() {
    if (!document.getElementById('fcadastro')) return;
    var c = st.cad || {};
    ['cnpj', 'fantasia', 'razao', 'resp', 'fone', 'email', 'cidade', 'end', 'como'].forEach(function (k) {
      var el = document.getElementById('cd-' + k); if (el) c[k] = el.value;
    });
    var lg = document.getElementById('cd-lgpd'); if (lg) c.lgpd = lg.checked;
    st.cad = c;
  }

  function enviarCadastro(e) {
    e.preventDefault();
    guardarCadastro();
    var c = st.cad, senha = (document.getElementById('cd-senha') || {}).value || '';
    var erro =
      !cnpjValido(c.cnpj) ? ['cnpj', 'Esse CNPJ não é válido. Confira os números.'] :
      clientePorCnpj(c.cnpj) ? ['cnpj', 'Esse CNPJ já tem cadastro aqui. Volte e entre com ele.'] :
      !c.fantasia.trim() && !c.razao.trim() ? ['fantasia', 'Escreva o nome da loja.'] :
      c.resp.trim().length < 3 ? ['resp', 'Escreva o nome de quem faz as compras.'] :
      soDigitos(c.fone).length < 10 ? ['fone', 'O WhatsApp precisa ter DDD e número.'] :
      !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.email.trim()) ? ['email', 'Confira o e-mail.'] :
      c.cidade.trim().length < 3 ? ['cidade', 'Escreva a cidade e o estado.'] :
      c.end.trim().length < 8 ? ['end', 'Escreva o endereço de entrega completo.'] :
      senha.length < 6 ? ['senha', 'A senha precisa ter pelo menos 6 caracteres.'] :
      !c.lgpd ? ['lgpd', 'Para enviar, autorize o uso dos dados para a análise do cadastro.'] : null;
    var campos = document.querySelectorAll('#fcadastro [aria-invalid]');
    for (var i = 0; i < campos.length; i++) campos[i].removeAttribute('aria-invalid');
    if (erro) {
      var el = document.getElementById('cd-' + erro[0]);
      if (el) { el.setAttribute('aria-invalid', 'true'); el.focus(); }
      document.getElementById('cad-erro').textContent = erro[1];
      return;
    }
    var novo = {
      id: 'c' + (++uid), nome: (c.fantasia.trim() || c.razao.trim()), razao: c.razao.trim(), doc: fmtCnpj(c.cnpj),
      cidade: c.cidade.trim(), desde: 'hoje', sit: 'esp',
      resp: c.resp.trim(), fone: fmtFone(c.fone), email: c.email.trim(), endereco: c.end.trim(),
      origem: 'Cadastro pelo catálogo' + (c.como ? ' . ' + c.como : ''), obs: ''
    };
    CLIENTES.push(novo);
    trocarEu(novo.id);
    st.logado = true; st.cad = null; st.tela = 'cadastrado';
    window.scrollTo(0, 0);
    render();
  }

  function preencherExemplo() {
    // 11.222.333/0001-81 é um CNPJ de exemplo com dígitos válidos.
    st.cad = { cnpj: '11.222.333/0001-81', fantasia: 'Ateliê da Mari', razao: 'Mariana Costa Modas LTDA',
      resp: 'Mariana Costa', fone: '(87) 9 0000-0000', email: 'compras@exemplo.com.br', cidade: 'Garanhuns, PE',
      end: 'Rua das Flores, 120 . Centro . Garanhuns, PE . 55290-000', como: 'Instagram', lgpd: true };
  }

  function telaProduto() {
    var p = prod(st.prod);
    if (!p) { st.tela = 'vitrine'; return telaVitrine(); }

    var lk = corDe(p);
    var tams = tamsDe(p);
    var tot = totalCarrinho();
    var noProd = 0;
    tams.forEach(function (t) { noProd += st.carrinho[p.id + '|' + lk + '|' + t] || 0; });
    var maxEst = Math.max.apply(null, tams.map(function (t) { return est(p, lk, t); })) || 1;

    var h = '<button class="voltar" data-acao="voltar-vitrine">' + IC.volta + 'Voltar ao catálogo</button>' +
      '<div class="prod-layout"><div class="galeria">' +
        '<div class="gal-palco" style="background:' + p.fundo + '">' + svgPeca(p, lk, st.vista) + '</div>' +
        '<div class="gal-tiras" role="group" aria-label="Vistas da peça">';

    Object.keys(VISTAS).forEach(function (v) {
      h += '<button class="gal-tira" data-acao="vista" data-v="' + v + '" style="background:' + p.fundo + '"' +
        (st.vista === v ? ' aria-pressed="true"' : ' aria-pressed="false"') +
        ' aria-label="' + VISTAS[v] + '">' + svgPeca(p, lk, v, { mudo: true }) + '</button>';
    });

    h += '</div></div><div class="prod-corpo">' +
      '<div class="prod-topo"><div>' +
        '<h2 class="prod-nome">' + esc(p.nome) + '</h2>' +
        '<div class="prod-ref">REF ' + esc(p.ref) + ' . ' + esc(CORES[lk].nome.toUpperCase()) + '</div>' +
      '</div></div>';

    if (podePreco()) {
      h += '<div class="prod-preco">' + brl(p.preco) + ' <small>por peça</small></div>';
    } else {
      h += '<div class="aviso-cx">' +
        '<strong>Preço só para revendedor.</strong><br>Entre com seu cadastro para ver o valor e montar a grade.</div>' +
        '<div style="margin-top:15px"><button class="btn btn-bloco" data-acao="ir-entrar">Entrar</button></div>';
    }

    h += '<div class="secao-lbl">Cor <em>' + esc(CORES[lk].nome) + '</em></div><div class="lav-lista">';
    p.cores.forEach(function (l) {
      var vazia = estoqueCor(p, l) === 0;
      h += '<button class="lav-btn' + (vazia ? ' off' : '') + '" data-acao="cor" data-id="' + p.id + '" data-v="' + l + '"' +
        (lk === l ? ' aria-pressed="true"' : ' aria-pressed="false"') + '>' +
        '<span class="lav-cor" style="background:' + CORES[l].hex + '"></span>' + esc(CORES[l].nome) +
        (vazia ? '<em>esgotada</em>' : '') + '</button>';
    });
    h += '</div>';

    h += '<div class="secao-lbl">Grade e estoque <em>' + estoqueCor(p, lk) + ' peças nesta cor' +
        (LOJA.minModelo > 0 ? ' . mínimo de ' + LOJA.minModelo + ' por modelo' : '') + '</em></div>' +
      '<div class="tams">';
    tams.forEach(function (t) {
      var k = p.id + '|' + lk + '|' + t;
      var e = est(p, lk, t);
      var q = st.carrinho[k] || 0;
      var fora = e === 0;
      var pct = Math.round((e / maxEst) * 100);
      h += '<div class="tam' + (q > 0 ? ' ativa' : '') + (fora ? ' off' : '') + '">' +
        '<div class="tam-n">' + esc(t) + '</div>' +
        '<div class="tam-est">' + (fora ? 'Esgotado' : e + ' em estoque') +
          (fora ? '' : '<span class="tam-barra"><i style="width:' + pct + '%"></i></span>') + '</div>';
      if (podePreco() && !fora) {
        h += '<div class="passo">' +
          '<button data-acao="menos" data-k="' + k + '" aria-label="Tirar uma peça do tamanho ' + esc(t) + '"' + (q === 0 ? ' disabled' : '') + '>&minus;</button>' +
          '<span aria-live="polite">' + q + '</span>' +
          '<button data-acao="mais" data-k="' + k + '" aria-label="Somar uma peça do tamanho ' + esc(t) + '"' + (q >= e ? ' disabled' : '') + '>+</button>' +
          '</div>';
      } else { h += '<div></div>'; }
      h += '</div>';
    });
    h += '</div>';

    if (podePreco()) {
      h += '<div style="margin-top:15px"><button class="btn btn-dest btn-bloco" data-acao="grade" data-id="' + p.id + '">Somar uma grade completa</button></div>' +
        '<p class="nota" style="margin:11px 0 0">A grade completa soma uma peça de cada tamanho disponível nesta cor. O estoque é por cor e tamanho: ' +
        esc(CORES[lk].nome) + ' e ' + esc(CORES[p.cores[p.cores.length - 1] === lk ? p.cores[0] : p.cores[p.cores.length - 1]].nome) + ' têm grades separadas.</p>';
    }

    h += '</div></div>';

    if (podePreco() && tot.pecas > 0) {
      h += '<div class="barra-fixa">' +
        '<div class="barra-info"><b>' + brl(tot.valor) + '</b><span>' + tot.pecas + ' peças no pedido' + (noProd ? ' . ' + noProd + ' desta cor' : '') + '</span></div>' +
        '<button class="btn" data-acao="ir-carrinho">Ver pedido</button></div>';
    }

    return h;
  }

  /* ---------- pedido mínimo ----------
     Cada confecção escolhe a regra: por valor, por quantidade de peças
     ou os dois. Pode ainda exigir um mínimo de peças por modelo, comum no
     atacado para não vender uma peça solta de cada referência.          */

  function minimoTexto() {
    var v = brl(LOJA.minimo).replace(',00', ''), p = LOJA.minPecas + ' peças';
    return LOJA.minTipo === 'pecas' ? p : LOJA.minTipo === 'ambos' ? v + ' e ' + p : v;
  }

  function checaMinimo() {
    var tot = totalCarrinho(), regras = [];
    if (LOJA.minTipo !== 'pecas' && LOJA.minimo > 0) {
      regras.push({ ok: tot.valor >= LOJA.minimo, pct: tot.valor / LOJA.minimo, falta: brl(Math.max(0, LOJA.minimo - tot.valor)) });
    }
    if (LOJA.minTipo !== 'valor' && LOJA.minPecas > 0) {
      var fp = Math.max(0, LOJA.minPecas - tot.pecas);
      regras.push({ ok: tot.pecas >= LOJA.minPecas, pct: tot.pecas / LOJA.minPecas, falta: fp + (fp === 1 ? ' peça' : ' peças') });
    }
    // Por modelo: soma as cores de cada produto.
    var porModelo = {}, modelos = [];
    if (LOJA.minModelo > 0) {
      itensCarrinho().forEach(function (it) { porModelo[it.id] = (porModelo[it.id] || 0) + somaGrade(it.g); });
      Object.keys(porModelo).forEach(function (id) {
        if (porModelo[id] < LOJA.minModelo) modelos.push({ id: id, n: porModelo[id], falta: LOJA.minModelo - porModelo[id] });
      });
    }
    var pct = regras.length ? Math.min.apply(null, regras.map(function (r) { return Math.min(1, r.pct); })) : 1;
    return {
      ok: regras.every(function (r) { return r.ok; }) && !modelos.length,
      regras: regras, modelos: modelos, porModelo: porModelo, pct: Math.round(pct * 100)
    };
  }

  function telaCarrinho() {
    var itens = itensCarrinho();
    var tot = totalCarrinho();
    var mn = checaMinimo();

    var h = '<button class="voltar" data-acao="voltar-vitrine">' + IC.volta + 'Continuar comprando</button>' +
      '<h2 class="tit-tela serif">Seu pedido</h2>';

    if (!itens.length) {
      return h + '<div class="vazio"><b>Nenhuma peça ainda</b>Volte ao catálogo e monte sua grade.</div>';
    }

    h += '<div class="car-layout"><div class="car-itens">';

    itens.forEach(function (it) {
      var p = prod(it.id);
      var n = somaGrade(it.g);
      h += '<div class="item">' +
        '<span class="item-img" style="background:' + p.fundo + '">' + svgPeca(p, it.cor, 'frente', { mudo: true }) + '</span>' +
        '<div class="item-corpo">' +
          '<div class="item-nome">' + esc(p.nome) + '</div>' +
          '<div class="item-lav"><i style="background:' + CORES[it.cor].hex + '"></i>' + esc(CORES[it.cor].nome) + '</div>' +
          '<div class="item-grade">' + esc(gradeTexto(it.g)) + '<br>' + n + ' peças a ' + brl(p.preco) + '</div>' +
          (mn.porModelo[it.id] !== undefined && mn.porModelo[it.id] < LOJA.minModelo
            ? '<div class="item-min">' + IC.alerta + 'Este modelo soma ' + mn.porModelo[it.id] + (mn.porModelo[it.id] === 1 ? ' peça' : ' peças') +
              ' no pedido. O mínimo é ' + LOJA.minModelo + ' por modelo.</div>' : '') +
          '<button class="btn btn-sec btn-peq" style="margin-top:10px" data-acao="tirar" data-k="' + it.id + '|' + it.cor + '">Tirar do pedido</button>' +
        '</div>' +
        '<div class="item-val">' + brl(p.preco * n) + '</div>' +
      '</div>';
    });

    h += '</div><aside class="car-resumo"><h3>Resumo</h3>' +
      '<div class="total"><span>Peças</span><b>' + tot.pecas + '</b></div>' +
      '<div class="total"><span>Modelos</span><b>' + itens.length + '</b></div>' +
      '<div class="total big"><span>Total</span><span>' + brl(tot.valor) + '</span></div>' +
      '<p class="car-salvo">' + IC.certoP + 'Pedido guardado na sua conta. Pode sair e terminar depois.</p>';

    var faltas = mn.regras.filter(function (r) { return !r.ok; }).map(function (r) { return r.falta; });
    if (!mn.ok) {
      h += '<div class="minimo">Pedido mínimo de ' + minimoTexto() + '.' +
        (faltas.length ? ' <strong>Faltam ' + faltas.join(' e ') + '</strong> para fechar.' : '') +
        (mn.modelos.length ? ' <strong>' + (mn.modelos.length === 1 ? 'Um modelo está' : mn.modelos.length + ' modelos estão') +
          ' abaixo de ' + LOJA.minModelo + ' peças</strong>, o mínimo por modelo.' : '') +
        '<span class="min-barra"><i style="width:' + mn.pct + '%"></i></span></div>';
    } else {
      h += '<div class="minimo ok">Pedido mínimo de ' + minimoTexto() + ' atingido.' +
        (LOJA.minModelo > 0 ? ' Todos os modelos com ' + LOJA.minModelo + ' peças ou mais.' : '') +
        '<span class="min-barra"><i style="width:100%"></i></span></div>';
    }

    // O plano da loja decide o caminho: Básico fecha pelo WhatsApp,
    // Pro vai para o pagamento com Pix e cartão.
    var pro = LOJA.plano === 'pro';
    return h + '<button class="btn btn-bloco' + (pro ? '' : ' btn-wa') + '" style="margin-top:18px" data-acao="fechar"' + (mn.ok ? '' : ' disabled') + '>' +
        (pro ? 'Ir para o pagamento' : IC.whats + 'Fechar pelo WhatsApp') + '</button>' +
      '<p class="nota" style="margin:13px 0 0">' +
        (pro
          ? 'Pix' + (LOJA.descontoPix ? ' com ' + String(LOJA.descontoPix).replace('.', ',') + '% de desconto' : '') +
            ' ou cartão em até ' + LOJA.parcMax + 'x. Se preferir, dá para combinar pelo WhatsApp.'
          : 'Você confere a mensagem com a grade e envia para o comercial da ' + esc(LOJA.nome) + '. Pagamento e frete são combinados na conversa.') +
      '</p></aside></div>';
  }

  /* =================== fechamento do pedido =================== */
  /* O plano da loja decide o caminho. Básico: mensagem pronta para o
     WhatsApp. Pro: Pix e cartão aqui mesmo, com a opção de combinar pelo
     WhatsApp para quem preferir negociar.                               */

  function dataHora() {
    var d = new Date();
    return {
      data: d.getDate() + ' ' + ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'][d.getMonth()],
      hora: String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
    };
  }

  function soDigitos(s) { return String(s || '').replace(/\D/g, ''); }

  // Texto do pedido no formato que o comercial lê no celular: negrito do
  // WhatsApp nos nomes, uma grade por linha, total no fim.
  function msgPedido() {
    var eu = euCliente();
    var itens = itensCarrinho();
    var tot = totalCarrinho();
    var linhas = [
      '*Pedido de ' + eu.nome + '*',
      'CNPJ ' + eu.doc + ' . ' + eu.cidade,
      ''
    ];
    itens.forEach(function (it) {
      var p = prod(it.id), n = somaGrade(it.g);
      linhas.push('*' + p.nome + '* . REF ' + p.ref);
      linhas.push('Cor: ' + CORES[it.cor].nome);
      linhas.push(gradeTexto(it.g));
      linhas.push(n + ' peças x ' + brl(p.preco) + ' = ' + brl(p.preco * n));
      linhas.push('');
    });
    linhas.push('*Total: ' + tot.pecas + ' peças . ' + brl(tot.valor) + '*');
    linhas.push('');
    linhas.push('Entrega: ' + EU.endereco);
    linhas.push('Pedido montado no catálogo da ' + LOJA.nome + '.');
    return linhas.join('\n');
  }

  function linkWhats(txt) {
    var num = soDigitos(LOJA.whats);
    if (num && num.length <= 11) num = '55' + num;
    return 'https://wa.me/' + (num || '') + '?text=' + encodeURIComponent(txt);
  }

  // Mostra o texto como o WhatsApp mostra: *negrito* vira negrito.
  function bolhaWhats(txt) {
    return esc(txt).replace(/\*([^*\n]+)\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
  }

  function valorPix(v) { return v * (1 - (LOJA.descontoPix || 0) / 100); }

  // Tabela de parcelas: sem juros até o limite da loja, juros compostos acima.
  function parcelas(v) {
    var out = [], i = (LOJA.jurosMes || 0) / 100;
    for (var n = 1; n <= LOJA.parcMax; n++) {
      if (n <= LOJA.parcSemJuros || !i) {
        out.push({ n: n, parc: v / n, total: v, juros: false });
      } else {
        var parc = v * i / (1 - Math.pow(1 + i, -n));
        out.push({ n: n, parc: parc, total: parc * n, juros: true });
      }
    }
    return out;
  }

  // QR desenhado só para a demonstração: tem os três quadrados de canto de
  // um QR de verdade, mas o miolo é sorteado e não codifica nada.
  function qrDemo(semente) {
    var tam = 25, cel = 6, h = '', s = semente;
    function rnd() { s = (s * 9301 + 49297) % 233280; return s / 233280; }
    function canto(x, y) {
      return '<rect x="' + x * cel + '" y="' + y * cel + '" width="' + 7 * cel + '" height="' + 7 * cel + '" fill="#2B2A1E"/>' +
        '<rect x="' + (x + 1) * cel + '" y="' + (y + 1) * cel + '" width="' + 5 * cel + '" height="' + 5 * cel + '" fill="#fff"/>' +
        '<rect x="' + (x + 2) * cel + '" y="' + (y + 2) * cel + '" width="' + 3 * cel + '" height="' + 3 * cel + '" fill="#2B2A1E"/>';
    }
    function noCanto(x, y) {
      return (x < 8 && y < 8) || (x > tam - 9 && y < 8) || (x < 8 && y > tam - 9);
    }
    for (var y = 0; y < tam; y++) {
      for (var x = 0; x < tam; x++) {
        if (!noCanto(x, y) && rnd() > 0.52) {
          h += '<rect x="' + x * cel + '" y="' + y * cel + '" width="' + cel + '" height="' + cel + '" fill="#2B2A1E"/>';
        }
      }
    }
    var lado = tam * cel;
    return '<svg viewBox="-12 -12 ' + (lado + 24) + ' ' + (lado + 24) + '" width="100%" height="100%" role="img" aria-label="QR de demonstração">' +
      '<rect x="-12" y="-12" width="' + (lado + 24) + '" height="' + (lado + 24) + '" fill="#fff"/>' +
      h + canto(0, 0) + canto(tam - 7, 0) + canto(0, tam - 7) + '</svg>';
  }

  function resumoFechamento(valorFinal, linhaExtra) {
    var tot = totalCarrinho();
    var itens = itensCarrinho();
    var h = '<aside class="car-resumo"><h3>Seu pedido</h3>';
    itens.forEach(function (it) {
      var p = prod(it.id);
      h += '<div class="fc-item">' +
        '<span class="cel-mini" style="background:' + p.fundo + '">' + svgPeca(p, it.cor, 'frente', { mudo: true }) + '</span>' +
        '<span class="fc-nome">' + esc(p.nome) + '<em>' + esc(CORES[it.cor].nome) + ' . ' + somaGrade(it.g) + ' peças</em></span>' +
        '<b>' + brl(p.preco * somaGrade(it.g)) + '</b></div>';
    });
    h += '<div class="total" style="margin-top:12px"><span>Itens</span><b>' + brl(tot.valor) + '</b></div>' +
      (linhaExtra || '') +
      '<div class="total big"><span>Total</span><span>' + brl(valorFinal) + '</span></div></aside>';
    return h;
  }

  function telaFechar() {
    if (!itensCarrinho().length) { st.tela = 'carrinho'; return telaCarrinho(); }
    return (LOJA.plano === 'pro' && st.pagForma !== 'whats') ? fecharPro() : fecharWhats();
  }

  function fecharWhats() {
    var txt = msgPedido();
    var tot = totalCarrinho();
    var tem = soDigitos(LOJA.whats).length >= 10;
    var pro = LOJA.plano === 'pro';

    return '<button class="voltar" data-acao="' + (pro ? 'pag-forma' : 'ir-carrinho') + '"' + (pro ? ' data-v="pix"' : '') + '>' +
        IC.volta + (pro ? 'Voltar ao pagamento' : 'Voltar ao pedido') + '</button>' +
      '<h2 class="tit-tela serif">Fechar pelo WhatsApp</h2>' +
      '<div class="car-layout"><div>' +
        '<div class="wa-tela">' +
          '<div class="wa-topo">' +
            '<span class="wa-av">' + esc(iniciais(LOJA.nome)) + '</span>' +
            '<span class="wa-quem"><b>Comercial ' + esc(LOJA.nome) + '</b>' +
              (tem ? esc(LOJA.whats) : 'número ainda não configurado') + '</span>' +
          '</div>' +
          '<div class="wa-fundo"><div class="wa-bolha">' + bolhaWhats(txt) +
            '<span class="wa-hora">' + dataHora().hora + '</span></div></div>' +
        '</div>' +
        '<p class="nota" style="margin:14px 0 0">É essa mensagem que vai para o comercial. ' +
          (tem ? 'O botão já abre a conversa com o número da loja.'
               : 'Como a loja ainda não cadastrou o número em Ajustes, o WhatsApp vai perguntar para quem enviar.') +
        '</p>' +
      '</div>' +
      '<div>' + resumoFechamento(tot.valor) +
        '<div class="fc-acoes">' +
          '<a class="btn btn-bloco btn-wa" data-acao="enviar-whats" href="' + linkWhats(txt) + '" target="_blank" rel="noopener">' +
            IC.whats + 'Enviar pelo WhatsApp</a>' +
          '<button class="btn btn-sec btn-bloco" data-acao="copiar-msg">Copiar mensagem</button>' +
        '</div>' +
        '<p class="nota" style="margin:12px 0 0">Ao enviar, o pedido entra no painel da ' + esc(LOJA.nome) +
          ' como <strong>a combinar</strong>. Pagamento e frete são acertados na conversa.</p>' +
      '</div></div>' +
      '<textarea id="msg-pedido" class="so-leitura" readonly aria-hidden="true" tabindex="-1">' + esc(txt) + '</textarea>';
  }

  function fecharPro() {
    var tot = totalCarrinho();
    var forma = st.pagForma === 'cartao' ? 'cartao' : 'pix';
    var vPix = valorPix(tot.valor);
    var desc = tot.valor - vPix;

    var h = '<button class="voltar" data-acao="ir-carrinho">' + IC.volta + 'Voltar ao pedido</button>' +
      '<h2 class="tit-tela serif">Pagamento</h2>' +
      '<div class="car-layout"><div>' +
        '<div class="pag-formas" role="tablist" aria-label="Forma de pagamento">' +
          '<button class="pag-f" role="tab" data-acao="pag-forma" data-v="pix" aria-selected="' + (forma === 'pix') + '">' +
            IC.pix + '<span><b>Pix</b>' + (LOJA.descontoPix ? LOJA.descontoPix + '% de desconto' : 'aprovação na hora') + '</span></button>' +
          '<button class="pag-f" role="tab" data-acao="pag-forma" data-v="cartao" aria-selected="' + (forma === 'cartao') + '">' +
            IC.cartao + '<span><b>Cartão de crédito</b>até ' + LOJA.parcMax + 'x' +
            (LOJA.parcSemJuros > 1 ? ', ' + LOJA.parcSemJuros + 'x sem juros' : '') + '</span></button>' +
        '</div>';

    if (st.processando) {
      h += '<div class="pag-caixa pag-proc"><span class="giro" aria-hidden="true"></span>' +
        '<b>Processando o pagamento</b><span class="nota">Consultando a operadora do cartão.</span></div>';
    } else if (forma === 'pix') {
      var codigo = 'LUME-DEMO-PIX-' + LOJA.nome.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 8) + '-' + st.proxN + '-' + Math.round(vPix * 100);
      h += '<div class="pag-caixa pix">' +
          '<div class="pix-qr">' + qrDemo(st.proxN * 7 + 13) + '</div>' +
          '<div class="pix-txt">' +
            '<span class="rotulo">Valor no Pix</span>' +
            '<div class="valor-forte">' + brl(vPix) + '</div>' +
            (desc > 0 ? '<span class="aux">' + brl(desc) + ' de desconto sobre ' + brl(tot.valor) + '</span>' : '') +
            '<ol class="pix-passos">' +
              '<li>Abra o app do seu banco e escolha pagar com Pix</li>' +
              '<li>Aponte a câmera para o QR ou cole o código abaixo</li>' +
              '<li>A confirmação chega aqui sozinha, em segundos</li>' +
            '</ol>' +
            '<div class="pix-cod"><input id="pix-cod" readonly value="' + esc(codigo) + '" aria-label="Código Pix copia e cola">' +
            '<button class="btn btn-sec btn-peq" data-acao="copiar-pix">Copiar</button></div>' +
            '<span class="aux">Válido por 30 minutos.</span>' +
          '</div>' +
        '</div>' +
        '<div class="demo-acao"><span>Na demonstração não existe banco do outro lado. Use o botão para fazer de conta que o Pix caiu.</span>' +
        '<button class="btn" data-acao="pix-pago">Simular Pix recebido</button></div>';
    } else {
      var ops = parcelas(tot.valor);
      var esc1 = Math.min(st.parcSel || 1, ops.length);
      h += '<form id="fcartao" class="pag-caixa cartao" novalidate autocomplete="off">' +
          '<label class="campo larga"><span>Número do cartão</span>' +
            '<div class="cc-num"><input id="cc-num" inputmode="numeric" placeholder="0000 0000 0000 0000" maxlength="19">' +
            '<em id="cc-band"></em></div></label>' +
          '<label class="campo larga"><span>Nome impresso no cartão</span><input id="cc-nome" placeholder="Como está no cartão"></label>' +
          '<label class="campo"><span>Validade</span><input id="cc-val" inputmode="numeric" placeholder="MM/AA" maxlength="5"></label>' +
          '<label class="campo"><span>Código de segurança</span><input id="cc-cvv" inputmode="numeric" placeholder="123" maxlength="4"></label>' +
          '<label class="campo larga"><span>Parcelas</span><select id="cc-parc">' +
            ops.map(function (o) {
              return '<option value="' + o.n + '"' + (o.n === esc1 ? ' selected' : '') + '>' +
                o.n + 'x de ' + brl(o.parc) + (o.juros ? ' (total ' + brl(o.total) + ')' : ' sem juros') + '</option>';
            }).join('') + '</select></label>' +
          '<p id="cc-erro" class="cc-erro" role="alert"></p>' +
          '<div class="campo-pe">' +
            '<button type="button" class="btn btn-sec btn-peq" data-acao="cc-teste">Preencher com cartão de teste</button>' +
            '<button type="submit" class="btn">Pagar ' + brl(ops[esc1 - 1].total) + '</button>' +
          '</div>' +
          '<p class="mod-nota" style="grid-column:1/-1">Demonstração: nada do que é digitado sai do navegador. No sistema de verdade, os dados do cartão vão direto para o gateway de pagamento e nunca passam pelos servidores da Lume nem da ' + esc(LOJA.nome) + '.</p>' +
        '</form>';
    }

    h += '<button class="link-alt" data-acao="pag-forma" data-v="whats">Prefiro combinar o pagamento pelo WhatsApp</button>' +
      '</div><div>';

    var extra = '';
    var final = tot.valor;
    if (forma === 'pix' && desc > 0) {
      extra = '<div class="total"><span>Desconto Pix</span><b class="pos">- ' + brl(desc) + '</b></div>';
      final = vPix;
    } else if (forma === 'cartao') {
      var op = parcelas(tot.valor)[Math.min(st.parcSel || 1, LOJA.parcMax) - 1];
      if (op && op.juros) {
        extra = '<div class="total"><span>Juros do parcelamento</span><b>' + brl(op.total - tot.valor) + '</b></div>';
        final = op.total;
      }
    }
    return h + resumoFechamento(final, extra) + '</div></div>';
  }

  /* ---------- cartão de crédito ----------
     Só demonstração: nada sai do navegador. No sistema de verdade os
     campos são do gateway (formulário dele dentro da página), e a Lume
     guarda só bandeira, final do cartão e parcelas.                    */

  function bandeira(n) {
    if (/^(4011|4312|4389|4514|4576|5041|5066|5067|509|6277|6362|6363|650|6516|6550)/.test(n)) return 'Elo';
    if (/^(606282|3841)/.test(n)) return 'Hipercard';
    if (/^3[47]/.test(n)) return 'Amex';
    if (/^4/.test(n)) return 'Visa';
    if (/^(5[1-5]|2[2-7])/.test(n)) return 'Mastercard';
    return '';
  }

  // Conta de verificação que todo número de cartão de verdade passa.
  function luhn(n) {
    var soma = 0, dobra = false;
    for (var i = n.length - 1; i >= 0; i--) {
      var d = +n[i];
      if (dobra) { d *= 2; if (d > 9) d -= 9; }
      soma += d; dobra = !dobra;
    }
    return n.length >= 13 && soma % 10 === 0;
  }

  function guardarCartao() {
    if (!document.getElementById('cc-num')) return;
    st.cc = {};
    ['num', 'nome', 'val', 'cvv'].forEach(function (c) { st.cc[c] = document.getElementById('cc-' + c).value; });
  }

  function mostrarBandeira() {
    var el = document.getElementById('cc-num'), b = document.getElementById('cc-band');
    if (el && b) b.textContent = bandeira(soDigitos(el.value));
  }

  function preencherCartaoTeste() {
    var v = { num: '4111 1111 1111 1111', nome: (EU.responsavel || euCliente().nome).toUpperCase(), val: '12/29', cvv: '123' };
    for (var c in v) { var el = document.getElementById('cc-' + c); if (el) { el.value = v[c]; el.removeAttribute('aria-invalid'); } }
    var er = document.getElementById('cc-erro'); if (er) er.textContent = '';
    mostrarBandeira();
  }

  function ligarCartao() {
    var f = document.getElementById('fcartao');
    if (!f) return;
    if (st.cc) for (var c in st.cc) { var el = document.getElementById('cc-' + c); if (el) el.value = st.cc[c]; }
    mostrarBandeira();
    var num = document.getElementById('cc-num');
    num.addEventListener('input', function () {
      num.value = soDigitos(num.value).slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
      mostrarBandeira();
    });
    var val = document.getElementById('cc-val');
    val.addEventListener('input', function () {
      var d = soDigitos(val.value).slice(0, 4);
      val.value = d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d;
    });
    var cvv = document.getElementById('cc-cvv');
    cvv.addEventListener('input', function () { cvv.value = soDigitos(cvv.value).slice(0, 4); });
    // Trocar parcela muda o total do resumo: guarda o que foi digitado e redesenha.
    document.getElementById('cc-parc').addEventListener('change', function (e) {
      guardarCartao(); st.parcSel = +e.target.value; render(true);
    });
    f.addEventListener('submit', pagarCartao);
  }

  function pagarCartao(e) {
    e.preventDefault();
    var n = soDigitos(document.getElementById('cc-num').value);
    var nome = document.getElementById('cc-nome').value.trim();
    var val = document.getElementById('cc-val').value;
    var cvv = soDigitos(document.getElementById('cc-cvv').value);
    var hoje = new Date(), mm = +val.slice(0, 2), aa = +val.slice(3, 5);
    var vencido = !(mm >= 1 && mm <= 12) || val.length !== 5 ||
      (2000 + aa) < hoje.getFullYear() || ((2000 + aa) === hoje.getFullYear() && mm < hoje.getMonth() + 1);
    var erro = !luhn(n) ? ['cc-num', 'Confira o número do cartão.'] :
      nome.length < 3 ? ['cc-nome', 'Escreva o nome como está impresso no cartão.'] :
      vencido ? ['cc-val', 'Validade inválida ou cartão vencido.'] :
      cvv.length < 3 ? ['cc-cvv', 'O código de segurança tem 3 ou 4 números, no verso do cartão.'] : null;
    ['cc-num', 'cc-nome', 'cc-val', 'cc-cvv'].forEach(function (id) { document.getElementById(id).removeAttribute('aria-invalid'); });
    if (erro) {
      document.getElementById(erro[0]).setAttribute('aria-invalid', 'true');
      document.getElementById(erro[0]).focus();
      document.getElementById('cc-erro').textContent = erro[1];
      return;
    }
    var tot = totalCarrinho().valor;
    var op = parcelas(tot)[Math.min(st.parcSel || 1, LOJA.parcMax) - 1];
    var pag = { forma: 'cartao', sit: 'pago', valor: op.total, parcelas: op.n, parcela: op.parc,
      bandeira: bandeira(n) || 'Cartão', final: n.slice(-4) };
    st.cc = null;
    st.processando = true;
    render(true);
    // Tempo de resposta de uma operadora de verdade, para a demonstração.
    setTimeout(function () {
      st.processando = false;
      st.copiou = false;
      registrarPedido(pag);
      window.scrollTo(0, 0);
      render();
    }, 1700);
  }

  function copiar(txt) {
    function plano() {
      var t = document.createElement('textarea');
      t.value = txt; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); } catch (x) {}
      document.body.removeChild(t);
    }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(txt).catch(plano);
    else plano();
  }

  // Como o pagamento aparece em texto, no painel e na área do cliente.
  function pagTexto(pg) {
    if (!pg) return '';
    if (pg.forma === 'pix') return 'Pix' + (pg.desconto > 0.004 ? ', com ' + brl(pg.desconto) + ' de desconto' : '');
    if (pg.forma === 'cartao') return (pg.bandeira || 'Cartão') + ' final ' + pg.final + ', ' + pg.parcelas + 'x de ' + brl(pg.parcela);
    if (pg.sit === 'aguardando' && pg.link) return 'Link de cobrança enviado, Pix ou cartão';
    return pg.sit === 'pago' ? 'Acertado pelo WhatsApp' : 'Combinar pelo WhatsApp';
  }

  // Grava o pedido no painel, baixa o estoque e limpa o carrinho.
  function registrarPedido(pag) {
    var itens = itensCarrinho();
    if (!itens.length) return null;
    var eu = euCliente();
    var dh = dataHora();
    st.ultimoN = String(st.proxN++);
    var novo = {
      id: 'novo-' + st.ultimoN,
      n: st.ultimoN,
      quem: eu.nome,
      cidade: eu.cidade,
      data: dh.data,
      hora: dh.hora,
      sit: 'novo',
      itens: itens,
      pag: pag
    };
    PEDIDOS.unshift(novo);
    baixarEstoque();
    delete CARRINHOS[EU.id];
    st.ultimoPed = novo.id;
    st.carrinho = {};
    st.pagForma = null;
    st.parcSel = 1;
    st.tela = 'enviado';
    return novo;
  }

  /* =================== área do cliente =================== */

  function telaConta() {
    var eu = euCliente();
    var s = SITC[eu.sit];
    var meus = meusPedidos();
    var gasto = meus.reduce(function (a, p) { return a + valorPedido(p); }, 0);
    var abas = [['pedidos', 'Meus pedidos', meus.length],
      ['favoritos', 'Favoritos', Object.keys(st.favoritos).length],
      ['dados', 'Meus dados', 0]];

    var h = '<h2 class="tit-tela serif">Minha conta</h2>' +
      '<div class="conta-layout"><aside class="conta-lado">' +
        '<div class="conta-cartao">' +
          '<span class="conta-ini">' + esc(iniciais(eu.nome)) + '</span>' +
          '<div><div class="conta-nome">' + esc(eu.nome) + '</div>' +
          '<div class="conta-doc">' + esc(eu.doc) + '</div>' +
          '<span class="sel ' + s[1] + '" style="margin-top:9px">' + s[0] + '</span></div>' +
        '</div>' +
        '<nav class="conta-nav" aria-label="Área do cliente">';
    abas.forEach(function (a) {
      h += '<button class="conta-l" data-acao="conta" data-v="' + a[0] + '"' +
        (st.contaAba === a[0] ? ' aria-current="page"' : '') + '>' + a[1] +
        (a[2] ? '<i>' + a[2] + '</i>' : '') + '</button>';
    });
    h += '</nav>' +
      (podePreco() ? '<div class="conta-resumo">' +
        '<div><b>' + meus.length + '</b><span>pedidos feitos</span></div>' +
        '<div><b>' + brlCurto(gasto) + '</b><span>comprado no total</span></div>' +
      '</div>' : '') +
      '<button class="btn btn-sec btn-bloco" style="margin-top:14px" data-acao="sair">Sair da conta</button>' +
      '</aside><div class="conta-miolo">';

    h += st.contaAba === 'favoritos' ? contaFavoritos() :
      st.contaAba === 'dados' ? contaDados() : contaPedidos(meus);

    return h + '</div></div>';
  }

  function contaPedidos(meus) {
    if (!meus.length) {
      return '<div class="vazio"><b>Você ainda não fez pedidos</b>Quando fechar o primeiro, ele aparece aqui com a grade e a situação.</div>';
    }
    var h = '<div class="quadro"><div class="quadro-h"><span>Pedidos anteriores</span><span>' +
      meus.length + (meus.length === 1 ? ' pedido' : ' pedidos') + '</span></div>';
    meus.forEach(function (p) {
      var s = SIT[p.sit];
      h += '<button class="linha-ped" data-acao="meu-ped" data-id="' + p.id + '">' +
        '<span class="sel ' + s[1] + '">' + s[0] + '</span>' +
        '<span class="lp-corpo"><span class="lp-nome">Pedido nº ' + p.n + '</span>' +
        '<span class="lp-meta">' + p.data + ', ' + p.hora + ' . ' + pecasPedido(p) + ' peças . ' +
          p.itens.length + (p.itens.length === 1 ? ' modelo' : ' modelos') + '</span></span>' +
        '<span class="lp-val">' + (podePreco() ? brl(valorPedido(p)) : '') + '</span>' +
        '<span class="lp-seta">' + IC.segue + '</span></button>';
    });
    return h + '</div>';
  }

  function contaFavoritos() {
    var favs = visiveis().filter(function (p) { return st.favoritos[p.id]; });
    if (!favs.length) {
      return '<div class="vazio"><b>Nenhum favorito ainda</b>Toque no coração de um modelo no catálogo para guardar aqui.</div>';
    }
    return '<div class="grid grid-conta">' + favs.map(cardProduto).join('') + '</div>';
  }

  function contaDados() {
    var eu = euCliente();
    return '<form id="fdados" class="quadro caixa-form">' +
      campo('me-nome', 'Razão social', eu.nome) +
      campo('me-doc', 'CNPJ', eu.doc) +
      campo('me-resp', 'Responsável pelas compras', EU.responsavel) +
      campo('me-fone', 'Telefone', EU.fone) +
      '<label class="campo larga"><span>E-mail</span><input id="me-email" type="email" value="' + esc(EU.email) + '"></label>' +
      '<label class="campo larga"><span>Endereço de entrega</span><input id="me-end" value="' + esc(EU.endereco) + '"></label>' +
      campo('me-cidade', 'Cidade', eu.cidade) +
      '<div class="campo-pe"><button type="submit" class="btn">Salvar dados</button>' +
      '<span>O lojista vê esses dados em <strong>Clientes</strong> no painel dele.</span></div>' +
    '</form>';
  }

  function telaMeuPedido() {
    var p = ped(st.meuPedido);
    if (!p) { st.tela = 'conta'; return telaConta(); }
    var s = SIT[p.sit];
    var atual = passoAtual(p.sit);

    var h = '<button class="voltar" data-acao="conta" data-v="pedidos">' + IC.volta + 'Voltar aos meus pedidos</button>' +
      '<div class="pnl-cab"><div>' +
        '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">' +
          '<h2 class="tit-tela serif" style="margin:0">Pedido nº ' + p.n + '</h2>' +
          '<span class="sel ' + s[1] + '">' + s[0] + '</span></div>' +
        '<p class="pnl-sub">Feito em ' + p.data + ', ' + p.hora + ' . entrega em ' + esc(p.cidade) + '</p>' +
        (p.pag ? '<p class="pnl-sub" style="margin-top:6px">Pagamento: ' + esc(pagTexto(p.pag)) + ' . ' +
          '<span class="pg pg-' + p.pag.sit + '">' + PAG_SIT[p.pag.sit][0] + '</span></p>' : '') +
      '</div>' +
      (podePreco() ? '<button class="btn btn-dest" data-acao="repetir" data-id="' + p.id + '">Repetir este pedido</button>' : '') +
      '</div><div class="quadro" style="margin-bottom:22px"><div class="tl">';

    PASSOS.forEach(function (ps, i) {
      h += '<div class="tl-p ' + (i < atual ? 'feito' : i === atual ? 'agora feito' : '') + '">' +
        '<span class="tl-ponto"><i></i></span>' +
        '<span class="tl-txt">' + ps[1] + '</span></div>';
    });

    h += '</div></div><div class="quadro"><div class="quadro-h">Peças do pedido</div>';

    p.itens.forEach(function (it) {
      var pr = prod(it.id);
      var n = somaGrade(it.g);
      h += '<div class="item" style="padding:15px 18px;margin:0">' +
        '<span class="item-img" style="background:' + (pr ? pr.fundo : 'var(--linha)') + '">' +
          (pr ? svgPeca(pr, it.cor, 'frente', { mudo: true }) : '') + '</span>' +
        '<div class="item-corpo">' +
          '<div class="item-nome">' + esc(pr ? pr.nome : 'Modelo fora de linha') + '</div>' +
          '<div class="item-lav"><i style="background:' + CORES[it.cor].hex + '"></i>' + esc(CORES[it.cor].nome) + '</div>' +
          '<div class="item-grade">' + esc(gradeTexto(it.g)) + '<br>' + n + ' peças</div>' +
        '</div>' +
        '<div class="item-val">' + (podePreco() && pr ? brl(pr.preco * n) : '') + '</div>' +
      '</div>';
    });

    return h + (podePreco()
      ? '<div style="padding:18px;border-top:1px solid var(--casca);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">' +
        '<div><div class="aux">Total do pedido</div>' +
        '<div class="valor-forte">' + brl(valorPedido(p)) + '</div></div>' +
        '<div class="aux">' + pecasPedido(p) + ' peças . ' + p.itens.length + ' modelos</div></div>'
      : '') + '</div>';
  }

  function telaEnviado() {
    var p = ped(st.ultimoPed);
    var pg = p ? p.pag : { forma: 'whats', sit: 'combinar' };
    var tit, txt, extra = '';

    if (pg.forma === 'pix') {
      tit = 'Pagamento confirmado';
      txt = 'O Pix de ' + brl(pg.valor) + ' caiu na conta da ' + esc(LOJA.nome) + ' e o pedido já está na fila de separação.';
    } else if (pg.forma === 'cartao') {
      tit = 'Pagamento aprovado';
      txt = esc(pg.bandeira) + ' final ' + pg.final + ', ' + pg.parcelas + 'x de ' + brl(pg.parcela) +
        '. O pedido já está na fila de separação da ' + esc(LOJA.nome) + '.';
    } else {
      tit = st.copiou ? 'Mensagem copiada' : 'Pedido enviado';
      txt = st.copiou
        ? 'Cole a mensagem na conversa com o comercial da ' + esc(LOJA.nome) + '. O pedido já entrou no painel deles, com pagamento a combinar.'
        : 'A mensagem com a grade abriu no WhatsApp do comercial da ' + esc(LOJA.nome) + '. Pagamento e frete são combinados na conversa.';
      extra = '<a class="btn btn-sec btn-wa-sec" href="' + linkWhats(st.ultimaMsg || '') + '" target="_blank" rel="noopener">' +
        IC.whats + (st.copiou ? 'Abrir o WhatsApp' : 'Abrir o WhatsApp de novo') + '</a>';
    }

    return '<div class="ok-tela">' +
        '<div class="ok-circ">' + IC.certo + '</div>' +
        '<h2>' + tit + '</h2>' +
        '<div class="ok-num">Pedido <b>nº ' + st.ultimoN + '</b></div>' +
        '<p>' + txt + '</p>' +
        '<div class="ok-bts">' +
          '<button class="btn" data-acao="conta" data-v="pedidos">Ver meus pedidos</button>' +
          extra +
          '<button class="btn btn-sec" data-acao="novo">Voltar ao catálogo</button>' +
        '</div>' +
        '<p class="nota" style="margin-top:30px">Agora troque para <strong>Quem vende</strong> na barra de cima: o pedido está lá' +
          (pg.sit === 'pago' ? ', já marcado como pago.' : ', com pagamento a combinar.') + '</p>' +
      '</div>';
  }

  /* =================== painel: quem vende =================== */

  var LIGACAO = ['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'no', 'na'];

  function iniciais(nome) {
    var ps = nome.split(/\s+/).filter(function (w) {
      return w.length > 1 && LIGACAO.indexOf(semAcento(w)) < 0;
    });
    if (!ps.length) ps = [nome];
    return ps.slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase();
  }

  function barrasPainel(aba) {
    var esperando = CLIENTES.filter(function (c) { return c.sit === 'esp'; }).length;
    var novos = PEDIDOS.filter(function (p) { return p.sit === 'novo'; }).length;
    var abas = [
      ['inicio', 'Início', 0],
      ['pedidos', 'Pedidos', novos],
      ['produtos', 'Produtos', 0],
      ['clientes', 'Clientes', esperando],
      ['vitrine', 'Vitrine', 0],
      ['ajustes', 'Ajustes', 0]
    ];
    var nome = abas.filter(function (a) { return a[0] === aba; })[0];
    var h = '<div class="pnl-barra"><div class="pnl-topo">' +
      '<button class="so-mob ham" data-acao="abrir-menu" data-v="pnl" aria-label="Abrir o menu">' + IC.menu + '</button>' +
      '<div class="pnl-marca">' +
        '<svg width="15" height="21" style="color:var(--lume);display:block"><use href="#lume"/></svg>' +
        '<span class="serif">lume</span>' +
        '<em class="so-mob pnl-onde">' + (nome ? nome[1] : '') + '</em></div>' +
      '<span class="pnl-quem"><i>' + esc(iniciais(LOJA.nome)) + '</i>' +
      '<span class="so-desk">' + esc(LOJA.nome) + '</span></span></div><div class="abas">';
    abas.forEach(function (a) {
      h += '<button class="aba" data-acao="aba" data-v="' + a[0] + '"' + (aba === a[0] ? ' aria-current="page"' : '') + '>' +
        a[1] + (a[2] ? '<i class="aba-n">' + a[2] + '</i>' : '') + '</button>';
    });
    return h + '</div></div>';
  }

  // Mensagem curta depois de uma ação, some na próxima.
  function avisoPainel() {
    if (!st.aviso) return '';
    var m = st.aviso;
    st.aviso = null;
    return '<div class="toast' + (m.erro ? ' erro' : '') + '" role="status">' + esc(m.txt) + '</div>';
  }

  function linhaPedido(p) {
    var s = SIT[p.sit];
    return '<button class="linha-ped" data-acao="ped" data-id="' + p.id + '">' +
      '<span class="sel ' + s[1] + '">' + s[0] + '</span>' +
      '<span class="lp-corpo"><span class="lp-nome">' + esc(p.quem) + '</span>' +
      '<span class="lp-meta">Nº ' + p.n + ' . ' + esc(p.cidade) + ' . ' + p.data + ', ' + p.hora + ' . ' + pecasPedido(p) + ' peças</span></span>' +
      '<span class="lp-val">' + brl(valorPedido(p)) +
        (p.pag ? '<em class="pg pg-' + p.pag.sit + '">' + (p.pag.sit === 'pago' ? 'Pago' + (p.pag.forma !== 'whats' ? ' no ' + PAG_FORMA[p.pag.forma] : '') : PAG_SIT[p.pag.sit][0]) + '</em>' : '') +
      '</span>' +
      '<span class="lp-seta">' + IC.segue + '</span></button>';
  }

  function grafico(tot) {
    var vals = DIAS7.map(function (d) { return Math.round(tot * d.peso); });
    var max = Math.max.apply(null, vals) || 1;
    var h = '<div class="gfx"><div class="gfx-cab">' +
      '<div><div class="secao-lbl" style="margin:0 0 7px">Vendas dos últimos 7 dias</div>' +
      '<div class="gfx-tot">' + brl(tot) + '</div></div>' +
      '<div class="num-var sobe" style="margin:0">' + IC.sobe + '18% sobre a semana passada</div>' +
      '</div><div class="gfx-barras">';

    DIAS7.forEach(function (d, i) {
      var alt = Math.max(5, Math.round((vals[i] / max) * 100));
      var hoje = i === DIAS7.length - 2;
      h += '<div class="gfx-col' + (hoje ? ' hoje' : '') + '" title="' + d.d + ': ' + brl(vals[i]) + '">' +
        '<span class="gfx-val">' + brlCurto(vals[i]).replace('R$ ', '') + '</span>' +
        '<span class="gfx-bar" style="height:' + alt + '%;animation-delay:' + (i * 45) + 'ms"></span>' +
        '<span class="gfx-dia">' + d.d + '</span></div>';
    });
    return h + '</div></div>';
  }

  function painelInicio() {
    // So a semana: os pedidos marcados como antigos ficam de fora dos numeros.
    var semana = PEDIDOS.filter(function (p) { return !p.antigo; });
    var aSeparar = PEDIDOS.filter(function (p) { return p.sit === 'novo' || p.sit === 'sep'; }).length;
    var valor = semana.reduce(function (a, p) { return a + valorPedido(p); }, 0);
    var pecas = semana.reduce(function (a, p) { return a + pecasPedido(p); }, 0);
    var ticket = semana.length ? valor / semana.length : 0;

    var h = '<div class="pnl-cab"><div>' +
        '<h1 class="pnl-h">Pedidos da semana</h1>' +
        '<p class="pnl-sub">Atualizado agora . ' + esc(LOJA.colecao) + '</p>' +
      '</div></div>' +
      '<div class="nums">' +
        '<div class="num"><b>' + semana.length + '</b><span>Pedidos</span><div class="num-var sobe">' + IC.sobe + '2 a mais</div></div>' +
        '<div class="num"><b>' + brlCurto(valor) + '</b><span>Valor</span><div class="num-var sobe">' + IC.sobe + '18%</div></div>' +
        '<div class="num claro"><b>' + brlCurto(ticket) + '</b><span>Ticket médio</span><div class="num-var desce">' + IC.desce + '4%</div></div>' +
        '<div class="num claro"><b>' + pecas + '</b><span>Peças vendidas</span><div class="num-var sobe">' + IC.sobe + '12%</div></div>' +
        '<div class="num claro"><b>' + aSeparar + '</b><span>A separar</span></div>' +
      '</div>' + grafico(valor) +
      '<div class="quadro"><div class="quadro-h"><span>Últimos pedidos</span>' +
      '<button class="btn btn-sec btn-peq" data-acao="aba" data-v="pedidos">Ver todos</button></div>';

    PEDIDOS.slice(0, 4).forEach(function (p) { h += linhaPedido(p); });
    return h + '</div>' + quadroMontados();
  }

  function pedidosFiltrados() {
    var b = semAcento(st.pnlBusca.trim());
    return PEDIDOS.filter(function (p) {
      if (st.pnlSit !== 'todos' && p.sit !== st.pnlSit) return false;
      if (!b) return true;
      return semAcento(p.quem).indexOf(b) >= 0 || p.n.indexOf(b) >= 0 || semAcento(p.cidade).indexOf(b) >= 0;
    });
  }

  function painelPedidos() {
    var lista = pedidosFiltrados();
    var sits = [['todos', 'Todos'], ['novo', 'Novos'], ['sep', 'Em separação'], ['env', 'Em trânsito'], ['ent', 'Entregues']];

    var h = '<div class="pnl-cab"><div><h1 class="pnl-h">Pedidos</h1>' +
      '<p class="pnl-sub">' + PEDIDOS.length + ' pedidos no total</p></div></div>' +
      '<div class="pnl-ferr">' +
        '<div class="busca"><input id="qpnl" type="search" placeholder="Buscar cliente, cidade ou número" value="' + esc(st.pnlBusca) + '" aria-label="Buscar pedido"></div>' +
        '<div class="ordem" role="group" aria-label="Filtrar por situação">';
    sits.forEach(function (s) {
      h += '<button class="ord-b" data-acao="pnl-sit" data-v="' + s[0] + '"' +
        (st.pnlSit === s[0] ? ' aria-pressed="true"' : ' aria-pressed="false"') + '>' + s[1] + '</button>';
    });
    h += '</div></div>';

    if (!lista.length) {
      return h + '<div class="vazio"><b>Nenhum pedido aqui</b>Troque o filtro ou limpe a busca.</div>';
    }

    h += '<div class="quadro">';
    lista.forEach(function (p) { h += linhaPedido(p); });
    return h + '</div>';
  }

  function painelDetalhe() {
    var ped = null;
    for (var i = 0; i < PEDIDOS.length; i++) if (PEDIDOS[i].id === st.pedidoAberto) ped = PEDIDOS[i];
    if (!ped) { st.pnl = 'pedidos'; return painelPedidos(); }

    var s = SIT[ped.sit];
    var atual = passoAtual(ped.sit);

    var h = '<button class="voltar" style="padding-left:0" data-acao="aba" data-v="pedidos">' + IC.volta + 'Voltar aos pedidos</button>' +
      '<div class="pnl-cab"><div>' +
        '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">' +
          '<h1 class="pnl-h">Pedido nº ' + ped.n + '</h1>' +
          '<span class="sel ' + s[1] + '">' + s[0] + '</span></div>' +
        '<p class="pnl-sub">' + esc(ped.quem) + ' . ' + esc(ped.cidade) + ' . ' + ped.data + ', ' + ped.hora + '</p>' +
      '</div>' +
      '<div class="pnl-acoes">' +
        '<button class="btn btn-sec btn-peq" data-acao="voltar-etapa" data-id="' + ped.id + '"' + (ped.sit === 'novo' ? ' disabled' : '') + '>Voltar etapa</button>' +
        '<button class="btn btn-perigo btn-peq" data-acao="modal" data-v="excluir-pedido" data-id="' + ped.id + '">Excluir pedido</button>' +
        '<button class="btn btn-dest" data-acao="avancar" data-id="' + ped.id + '"' + (ped.sit === 'ent' ? ' disabled' : '') + '>' +
          (ped.sit === 'novo' ? 'Marcar em separação' : ped.sit === 'sep' ? 'Marcar como enviado' :
           ped.sit === 'env' ? 'Marcar como entregue' : 'Pedido concluído') +
        '</button>' +
      '</div></div>' +
      '<div class="quadro" style="margin-bottom:22px"><div class="tl">';

    PASSOS.forEach(function (ps, i) {
      h += '<div class="tl-p ' + (i < atual ? 'feito' : i === atual ? 'agora feito' : '') + '">' +
        '<span class="tl-ponto"><i></i></span>' +
        '<span class="tl-txt">' + ps[1] + '</span></div>';
    });

    h += '</div></div>' + (ped.sit === 'sep' ? quadroConferencia(ped) : '') + quadroPagamento(ped) +
      '<div class="quadro"><div class="quadro-h">Grade do pedido</div><div class="rolagem">' +
      '<table class="tab"><thead><tr><th>Produto</th><th>Cor</th><th>Grade</th><th style="text-align:right">Peças</th><th style="text-align:right">Valor</th></tr></thead><tbody>';

    ped.itens.forEach(function (it) {
      var p = prod(it.id);
      var n = somaGrade(it.g);
      h += '<tr><td><span class="cel-prod">' +
          '<span class="cel-mini" style="background:' + p.fundo + '">' + svgPeca(p, it.cor, 'frente', { mudo: true }) + '</span>' +
          '<span><strong style="font-weight:500">' + esc(p.nome) + '</strong><br>' +
          '<span class="aux">' + esc(p.ref) + '</span></span></span></td>' +
        '<td><span class="item-lav"><i style="background:' + CORES[it.cor].hex + '"></i>' + esc(CORES[it.cor].nome) + '</span></td>' +
        '<td class="aux">' + esc(gradeTexto(it.g)) + '</td>' +
        '<td style="text-align:right">' + n + '</td>' +
        '<td style="text-align:right;font-weight:600">' + brl(p.preco * n) + '</td></tr>';
    });

    return h + '</tbody></table></div>' +
      '<div style="padding:18px 15px;border-top:1px solid var(--casca);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">' +
        '<div><div class="aux">Total do pedido</div>' +
        '<div class="valor-forte">' + brl(valorPedido(ped)) + '</div></div>' +
        '<div class="aux">' + pecasPedido(ped) + ' peças . ' + ped.itens.length + (ped.itens.length === 1 ? ' modelo' : ' modelos') + '</div>' +
      '</div></div>';
  }

  /* ---------- conferência da separação ----------
     Quem separa confere peça por peça no celular, no estoque. Cada linha
     é um modelo, numa cor, num tamanho. Enviar com peça faltando ajusta o
     pedido para o que saiu de verdade, e o cliente não paga pelo que não
     recebeu.                                                             */

  function linhasConf(p) {
    var l = [];
    p.itens.forEach(function (it) {
      var pr = prod(it.id);
      Object.keys(it.g).forEach(function (t) {
        if (it.g[t] > 0) l.push({ k: it.id + '|' + it.cor + '|' + t, it: it, pr: pr, t: t, q: it.g[t] });
      });
    });
    return l;
  }

  function estadoConf(p) {
    var l = linhasConf(p), conf = p.conf || {}, total = 0, feitas = 0, linhasOk = 0;
    l.forEach(function (x) {
      var n = Math.min(conf[x.k] || 0, x.q);
      total += x.q; feitas += n; if (n === x.q) linhasOk++;
    });
    return { linhas: l, total: total, feitas: feitas, linhasOk: linhasOk, completo: feitas === total, comecou: feitas > 0 };
  }

  function quadroConferencia(p) {
    var e = estadoConf(p), conf = p.conf || {};
    var h = '<div class="quadro conf-quadro"><div class="quadro-h"><span>Conferência da separação</span>' +
      '<span class="conf-prog-t">' + e.feitas + ' de ' + e.total + ' peças</span></div>' +
      '<span class="conf-prog"><i style="width:' + Math.round(e.feitas / Math.max(1, e.total) * 100) + '%"></i></span>' +
      '<div class="conf-topo"><p class="aux" style="margin:0">Marque cada peça quando ela sair da prateleira. ' +
        (e.completo ? '<strong class="conf-ok-t">Tudo conferido, pode enviar.</strong>' : 'O envio só fica liberado com tudo conferido.') + '</p>' +
        '<span class="conf-bts">' +
          '<button class="btn btn-sec btn-peq" data-acao="conf-imprimir">Imprimir lista</button>' +
          (e.completo
            ? '<button class="btn btn-sec btn-peq" data-acao="conf-limpar" data-id="' + p.id + '">Recomeçar</button>'
            : '<button class="btn btn-sec btn-peq" data-acao="conf-tudo" data-id="' + p.id + '">Conferir tudo</button>') +
        '</span></div><div class="conf-lista">';

    var ultimo = '';
    e.linhas.forEach(function (x) {
      var n = Math.min(conf[x.k] || 0, x.q), ok = n === x.q;
      var grupo = x.it.id + '|' + x.it.cor;
      if (grupo !== ultimo) {
        ultimo = grupo;
        h += '<div class="conf-grupo">' +
          '<span class="cel-mini" style="background:' + (x.pr ? x.pr.fundo : 'var(--linha)') + '">' + (x.pr ? svgPeca(x.pr, x.it.cor, 'frente', { mudo: true }) : '') + '</span>' +
          '<span><b>' + esc(x.pr ? x.pr.nome : 'Modelo fora de linha') + '</b>' +
          '<span class="aux">' + esc(x.pr ? x.pr.ref : '') + ' . <i class="cor-chip" style="background:' + CORES[x.it.cor].hex + '"></i>' + esc(CORES[x.it.cor].nome) + '</span></span></div>';
      }
      h += '<div class="conf-l' + (ok ? ' ok' : n ? ' parcial' : '') + '">' +
        '<span class="conf-tam">' + esc(x.t) + '</span>' +
        '<span class="conf-q">' + (ok ? IC.certoP + 'Conferido' : n + ' de ' + x.q) + '</span>' +
        '<span class="passo">' +
          '<button data-acao="conf-menos" data-id="' + p.id + '" data-k="' + x.k + '" aria-label="Tirar uma peça do ' + esc(x.t) + '"' + (n === 0 ? ' disabled' : '') + '>&minus;</button>' +
          '<span aria-live="polite">' + n + '</span>' +
          '<button data-acao="conf-mais" data-id="' + p.id + '" data-k="' + x.k + '" aria-label="Somar uma peça do ' + esc(x.t) + '"' + (ok ? ' disabled' : '') + '>+</button>' +
        '</span>' +
        '<button class="btn btn-peq ' + (ok ? 'btn-sec' : 'btn-dest') + ' conf-todas" data-acao="conf-linha" data-id="' + p.id + '" data-k="' + x.k + '"' + (ok ? ' disabled' : '') + '>' +
          (ok ? 'Pronto' : 'Separei as ' + x.q) + '</button>' +
        '</div>';
    });
    h += '</div>';

    // Lista para imprimir: só aparece no papel.
    h += '<div class="conf-impressa"><h2>Separação do pedido nº ' + p.n + '</h2>' +
      '<p>' + esc(p.quem) + ' . ' + esc(p.cidade) + ' . ' + p.data + ', ' + p.hora + ' . ' + e.total + ' peças</p>' +
      '<table><thead><tr><th>Modelo</th><th>REF</th><th>Cor</th><th>Tam.</th><th>Qtd.</th><th>Separado</th></tr></thead><tbody>' +
      e.linhas.map(function (x) {
        return '<tr><td>' + esc(x.pr ? x.pr.nome : '') + '</td><td>' + esc(x.pr ? x.pr.ref : '') + '</td><td>' + esc(CORES[x.it.cor].nome) +
          '</td><td>' + esc(x.t) + '</td><td>' + x.q + '</td><td class="caixinha"></td></tr>';
      }).join('') + '</tbody></table>' +
      '<p class="assina">Separado por ______________________ . Conferido por ______________________</p></div>';

    return h + '</div>';
  }

  // Envia só o que foi separado: o pedido passa a ter o que saiu de verdade.
  function enviarComFalta(p) {
    var conf = p.conf || {}, antes = valorPedido(p), faltou = [];
    p.itens.forEach(function (it) {
      Object.keys(it.g).forEach(function (t) {
        var k = it.id + '|' + it.cor + '|' + t, n = Math.min(conf[k] || 0, it.g[t]);
        if (n < it.g[t]) {
          var pr = prod(it.id);
          faltou.push((it.g[t] - n) + ' ' + (pr ? pr.nome : 'peça') + ' ' + CORES[it.cor].nome + ' ' + t);
        }
        if (n) it.g[t] = n; else delete it.g[t];
      });
    });
    p.itens = p.itens.filter(function (it) { return somaGrade(it.g) > 0; });
    var depois = valorPedido(p), dif = antes - depois;
    p.faltou = faltou;
    if (p.pag && p.pag.sit === 'pago' && dif > 0.004) p.pag.credito = (p.pag.credito || 0) + dif;
    else if (p.pag && p.pag.sit !== 'pago') p.pag.valor = undefined;
    p.sit = 'env';
    return dif;
  }

  // Pagamento do pedido, do lado de quem vende.
  function quadroPagamento(p) {
    var pg = p.pag || { forma: 'whats', sit: 'combinar' };
    var ic = pg.forma === 'pix' ? IC.pix : pg.forma === 'cartao' ? IC.cartao : IC.whats;
    var cobrado = pg.valor || valorPedido(p);
    var h = '<div class="quadro pag-quadro"><div class="quadro-h"><span>Pagamento</span>' +
      '<span class="sel ' + PAG_SIT[pg.sit][1] + '">' + PAG_SIT[pg.sit][0] + '</span></div>' +
      '<div class="pq-corpo"><span class="pq-ic">' + ic + '</span>' +
      '<div class="pq-txt"><b>' + esc(pagTexto(pg)) + '</b>' +
        '<span class="aux">' + (pg.sit === 'pago' ? 'Recebido: ' : 'A receber: ') + brl(cobrado) +
          (pg.forma === 'cartao' && pg.valor > valorPedido(p) + 0.004 ? ' (inclui ' + brl(pg.valor - valorPedido(p)) + ' de juros pagos pelo cliente)' : '') +
          (pg.forma === 'cartao' && pg.sit === 'pago' ? ' . antecipação e taxa seguem o contrato com o gateway' : '') +
        '</span></div>';

    if (pg.sit !== 'pago') {
      h += '<div class="pq-acoes">' +
        (LOJA.plano === 'pro' && pg.sit === 'combinar'
          ? '<button class="btn btn-sec btn-peq" data-acao="pag-link" data-id="' + p.id + '">Gerar link de cobrança</button>' : '') +
        '<button class="btn btn-dest btn-peq" data-acao="pag-marcar" data-id="' + p.id + '">Marcar como pago</button></div>';
    } else if (pg.forma === 'whats' || pg.manual) {
      h += '<div class="pq-acoes"><button class="link-alt" style="margin:0" data-acao="pag-desfazer" data-id="' + p.id + '">Desfazer, ainda não recebi</button></div>';
    }
    h += '</div>';

    if (pg.credito > 0) {
      h += '<p class="pq-nota pq-credito"><strong>Faltaram peças no envio e o cliente já tinha pago.</strong> ' +
        'Ele tem ' + brl(pg.credito) + ' a receber de volta: devolva ou deixe de crédito para o próximo pedido.</p>';
    }
    if (p.faltou && p.faltou.length) {
      h += '<p class="pq-nota">Saiu sem: ' + esc(p.faltou.join(', ')) + '.</p>';
    }
    if (pg.sit === 'aguardando' && pg.link) {
      h += '<div class="pq-link">' +
        '<span class="rotulo">Link de cobrança enviado ao cliente</span>' +
        '<div class="pix-cod"><input id="pag-link" readonly value="' + esc(pg.link) + '" aria-label="Link de cobrança">' +
        '<button class="btn btn-sec btn-peq" data-acao="copiar-link">Copiar</button></div>' +
        '<p class="aux" style="margin:8px 0 0">O cliente abre o link e paga com Pix ou cartão. Quando o pagamento cai, o pedido muda para pago sozinho.</p>' +
        '<div class="demo-acao"><span>Na demonstração ninguém vai abrir o link. Use o botão para fazer de conta que o cliente pagou no Pix.</span>' +
        '<button class="btn btn-peq" data-acao="pag-link-pago" data-id="' + p.id + '">Simular pagamento do link</button></div>' +
      '</div>';
    } else if (pg.forma === 'whats' && pg.sit === 'combinar' && LOJA.plano !== 'pro') {
      h += '<p class="pq-nota">No plano Básico o pagamento é combinado com o cliente. Quando o dinheiro cair, marque como pago para o pedido sair de <strong>a receber</strong>.</p>';
    }
    return h + '</div>';
  }

  function painelProdutos() {
    var escondidos = PRODUTOS.length - visiveis().length;
    var zerados = PRODUTOS.filter(function (p) { return estoqueTotal(p) === 0; }).length;

    var h = '<div class="pnl-cab"><div><h1 class="pnl-h">Produtos</h1>' +
        '<p class="pnl-sub">' + PRODUTOS.length + ' modelos cadastrados' +
        (escondidos ? ' . ' + escondidos + ' fora do catálogo' : '') +
        (zerados ? ' . ' + zerados + ' sem estoque' : '') + '</p></div>' +
      '<div class="pnl-acoes">' +
        '<button class="btn btn-sec btn-peq" data-acao="modal" data-v="importar">Importar planilha</button>' +
        '<button class="btn btn-dest" data-acao="modal" data-v="novo-produto">Novo produto</button>' +
      '</div></div>' +
      '<div class="quadro quadro-cartao"><div class="rolagem">' +
      '<table class="tab tab-cartao"><thead><tr><th>Produto</th><th>Cores</th><th>Preço</th><th>Estoque por tamanho</th>' +
      '<th style="text-align:right">Total</th><th>No catálogo</th><th></th></tr></thead><tbody>';

    PRODUTOS.forEach(function (p) {
      var tot = estoqueTotal(p);
      // No painel o estoque é somado por tamanho, com as cores por trás.
      var chips = tamsDe(p).map(function (t) {
        var n = p.cores.reduce(function (a, cc) { return a + est(p, cc, t); }, 0);
        var cls = n === 0 ? 'zero' : (n <= 8 ? 'baixo' : '');
        return '<i class="' + cls + '">' + esc(t) + ': ' + n + '</i>';
      }).join('');
      var vis = p.visivel !== false;
      h += '<tr' + (vis ? '' : ' class="apagada"') + '><td><span class="cel-prod">' +
          '<span class="cel-mini" style="background:' + p.fundo + '">' + svgPeca(p, p.cores[0], 'frente', { mudo: true }) + '</span>' +
          '<span><strong style="font-weight:500">' + esc(p.nome) + '</strong><br>' +
          '<span class="aux">' + esc(p.ref) + '</span></span></span></td>' +
        '<td data-rot="Cores"><span class="lavs">' + p.cores.map(function (l) {
          return '<span class="lav-ponto" style="background:' + CORES[l].hex + '" title="' + CORES[l].nome + '"></span>';
        }).join('') + '</span></td>' +
        '<td data-rot="Preço" style="white-space:nowrap">' + brl(p.preco) + '</td>' +
        '<td data-rot="Estoque por tamanho"><span class="est">' + chips + '</span></td>' +
        '<td data-rot="Total em estoque" style="text-align:right;font-weight:600">' + tot + '</td>' +
        '<td data-rot="No catálogo"><button class="chave" data-acao="visivel" data-id="' + p.id + '" role="switch" aria-checked="' + vis + '" ' +
          'aria-label="' + (vis ? 'Tirar' : 'Pôr') + ' ' + esc(p.nome) + ' do catálogo"><i></i></button></td>' +
        '<td style="text-align:right"><button class="btn btn-sec btn-bloco btn-peq" data-acao="modal" data-v="produto" data-id="' + p.id + '">Editar</button></td></tr>';
    });

    return h + '</tbody></table></div></div>' +
      '<p class="pnl-nota">O estoque baixa sozinho a cada pedido fechado e volta se o pedido for excluído. Em <strong>Editar</strong> dá para mexer no preço, na grade, nas coleções e no estoque de cada tamanho.</p>' +
      quadroColecoes();
  }

  function quadroColecoes() {
    var h = '<div class="pnl-cab" style="margin-top:34px"><div><h1 class="pnl-h">Coleções</h1>' +
      '<p class="pnl-sub">Agrupam produtos de categorias diferentes. Viram filtro no catálogo e destino de banner.</p></div></div>' +
      '<div class="quadro">';
    COLECOES.forEach(function (c) {
      var n = PRODUTOS.filter(function (p) { return (p.tags || []).indexOf(c.id) >= 0; }).length;
      h += '<div class="linha-tab">' +
        '<span class="lp-corpo"><span class="lp-nome">' + esc(c.nome) + (c.destaque ? ' <em class="op-demo">selo no card</em>' : '') + '</span>' +
        '<span class="lp-meta">' + n + (n === 1 ? ' produto' : ' produtos') + '</span></span>' +
        '<button class="btn btn-sec btn-peq" data-acao="col-destaque" data-id="' + c.id + '">' + (c.destaque ? 'Tirar selo' : 'Pôr selo no card') + '</button>' +
        '<button class="btn btn-sec btn-peq" data-acao="col-apagar" data-id="' + c.id + '">Apagar</button></div>';
    });
    return h + '</div>' +
      '<form id="fcolecao" class="quadro caixa-form" style="margin-top:18px">' +
        campo('co-nome', 'Nome da coleção', '', 'placeholder="Ex: Dia das Mães" maxlength="30"') +
        '<div class="campo-pe" style="border:0;padding-top:0;align-self:end"><button type="submit" class="btn btn-dest">Criar coleção</button>' +
        '<span>Depois marque os produtos em <strong>Editar</strong>.</span></div>' +
      '</form>';
  }

  /* ---------- ficha do cliente ----------
     Tudo é calculado a partir dos pedidos, nada é guardado à parte: se o
     lojista excluir ou um pedido novo entrar, a ficha muda junto.       */

  var MESES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

  // "15 nov" vira data. O protótipo não guarda ano: se a data cair no
  // futuro, é do ano passado.
  function lerData(txt) {
    var pt = String(txt).trim().split(/\s+/);
    var hoje = new Date();
    var d = new Date(hoje.getFullYear(), Math.max(0, MESES.indexOf(pt[1])), parseInt(pt[0], 10) || 1);
    if (d > hoje) d.setFullYear(d.getFullYear() - 1);
    return d;
  }
  function diasDesde(d) {
    var h = new Date(); h.setHours(0, 0, 0, 0);
    var x = new Date(d); x.setHours(0, 0, 0, 0);
    return Math.round((h - x) / 86400000);
  }
  function quando(n) {
    if (n === null || n === undefined) return '';
    return n <= 0 ? 'hoje' : n === 1 ? 'ontem' : 'há ' + n + ' dias';
  }

  function contatoCliente(c) {
    if (c.id === EU.id) return { resp: EU.responsavel, fone: EU.fone, email: EU.email, endereco: EU.endereco };
    return { resp: c.resp || '', fone: c.fone || '', email: c.email || '', endereco: c.endereco || '' };
  }

  function somar(obj, k, n) { obj[k] = (obj[k] || 0) + n; }
  function ranking(obj) {
    return Object.keys(obj).map(function (k) { return { k: k, n: obj[k] }; })
      .sort(function (a, b) { return b.n - a.n; });
  }

  function resumoCliente(c) {
    var pedidos = PEDIDOS.filter(function (p) { return p.quem === c.nome; });
    var r = {
      pedidos: pedidos, total: 0, pecas: 0, aReceber: 0, abertos: 0,
      andamento: 0, transito: 0,
      porProd: {}, valProd: {}, porCor: {}, porTam: {}, porCat: {},
      diasUltimo: null, freq: null
    };

    pedidos.forEach(function (p) {
      var v = valorPedido(p);
      r.total += v;
      r.pecas += pecasPedido(p);
      if (p.pag && p.pag.sit !== 'pago') { r.aReceber += v; r.abertos++; }
      if (p.sit === 'novo' || p.sit === 'sep') r.andamento++;
      if (p.sit === 'env') r.transito++;
      p.itens.forEach(function (it) {
        var pr = prod(it.id);
        var n = somaGrade(it.g);
        somar(r.porProd, it.id, n);
        somar(r.valProd, it.id, pr ? pr.preco * n : 0);
        somar(r.porCor, it.cor, n);
        if (pr) somar(r.porCat, pr.cat, n);
        for (var t in it.g) somar(r.porTam, t, it.g[t]);
      });
    });

    r.ticket = pedidos.length ? r.total / pedidos.length : 0;

    var datas = pedidos.map(function (p) { return lerData(p.data); })
      .sort(function (a, b) { return a - b; });
    if (datas.length) r.diasUltimo = diasDesde(datas[datas.length - 1]);
    if (datas.length > 1) {
      r.freq = Math.round((datas[datas.length - 1] - datas[0]) / 86400000 / (datas.length - 1));
    }
    // Sumido: já comprou, e está há mais tempo sem comprar do que o normal
    // dele (uma vez e meia o ritmo) ou há mais de 30 dias.
    r.sumido = r.diasUltimo !== null && r.diasUltimo > Math.max(30, r.freq ? r.freq * 1.5 : 0);
    return r;
  }

  // Barra horizontal com rótulo, usada em cores e tamanhos.
  function barraFicha(rotulo, n, max, cor) {
    var pct = max ? Math.max(4, Math.round(n / max * 100)) : 0;
    return '<div class="fb-linha">' +
      '<span class="fb-rot">' + (cor ? '<i style="background:' + cor + '"></i>' : '') + esc(rotulo) + '</span>' +
      '<span class="fb-trilho"><span style="width:' + pct + '%"></span></span>' +
      '<b>' + n + '</b></div>';
  }

  function modalCliente(c) {
    var r = resumoCliente(c);
    var s = SITC[c.sit];
    var ct = contatoCliente(c);
    var sumido = r.sumido;

    var h = '<div class="mod-corpo ficha">' +

      // Cabeçalho: quem é, desde quando, como chegou, contato
      '<div class="fi-cab">' +
        '<span class="fi-ini">' + esc(iniciais(c.nome)) + '</span>' +
        '<div class="fi-quem">' +
          '<div class="fi-linha1"><span class="sel ' + s[1] + '">' + s[0] + '</span>' +
            '<span class="aux">Cliente desde ' + esc(c.desde) + (c.origem ? ' . veio por ' + esc(c.origem.charAt(0).toLowerCase() + c.origem.slice(1)) : '') + '</span></div>' +
          '<div class="aux">' + (c.razao ? esc(c.razao) + ' . ' : '') + 'CNPJ ' + esc(c.doc) + ' . ' + esc(c.cidade) + '</div>' +
        '</div>' +
      '</div>' +

      '<dl class="fi-contato">' +
        '<div><dt>Comprador</dt><dd>' + (ct.resp ? esc(ct.resp) : '<em>não informado</em>') + '</dd></div>' +
        '<div><dt>Telefone</dt><dd>' + (ct.fone ? esc(ct.fone) : '<em>não informado</em>') + '</dd></div>' +
        (ct.email ? '<div><dt>E-mail</dt><dd>' + esc(ct.email) + '</dd></div>' : '') +
        (ct.endereco ? '<div class="largo"><dt>Entrega</dt><dd>' + esc(ct.endereco) + '</dd></div>' : '') +
      '</dl>';

    if (!r.pedidos.length) {
      h += '<div class="vazio fi-vazio"><b>Ainda sem pedidos</b>' +
        (c.sit === 'esp'
          ? 'O cadastro está esperando aprovação. Enquanto isso, ele vê o catálogo com o preço travado.'
          : 'Quando o primeiro pedido entrar, esta ficha mostra o que ele compra, as cores e os tamanhos.') + '</div>';
    } else {
      // Números
      h += '<div class="fi-nums">' +
        '<div class="fi-num forte"><b>' + brl(r.total) + '</b><span>Comprado no total</span></div>' +
        '<div class="fi-num"><b>' + r.pedidos.length + '</b><span>' + (r.pedidos.length === 1 ? 'Pedido' : 'Pedidos') + '</span></div>' +
        '<div class="fi-num"><b>' + brl(r.ticket) + '</b><span>Ticket médio</span></div>' +
        '<div class="fi-num"><b>' + r.pecas + '</b><span>Peças compradas</span></div>' +
        '<div class="fi-num"><b>' + quando(r.diasUltimo).replace(/^há /, '') + '</b><span>Desde o último pedido</span></div>' +
        '<div class="fi-num"><b>' + (r.freq ? r.freq + ' dias' : 'só 1 pedido') + '</b><span>' + (r.freq ? 'Compra a cada' : 'Ritmo de compra') + '</span></div>' +
      '</div>';

      // Dinheiro em aberto fica fora da grade, em destaque, porque pede ação.
      if (r.aReceber > 0) {
        h += '<div class="fi-alerta ruim"><b>' + brl(r.aReceber) + ' a receber.</b> ' +
          'Tem pedido com pagamento ainda a combinar. Confira no histórico abaixo.</div>';
      }

      if (sumido) {
        h += '<div class="fi-alerta">' +
          '<b>Está demorando mais que o normal para voltar.</b> ' +
          (r.freq ? 'Costuma comprar a cada ' + r.freq + ' dias e o' : 'O') +
          ' último pedido foi ' + quando(r.diasUltimo) + '. Vale mandar as novidades da coleção.' +
        '</div>';
      }

      // Peças que mais compra
      var topProd = ranking(r.porProd).slice(0, 5);
      h += '<section class="fi-sec"><h4>Peças que mais compra</h4><div class="fi-pecas">';
      topProd.forEach(function (x, i) {
        var p = prod(x.k);
        if (!p) {
          h += '<div class="fi-peca"><span class="fi-pos">' + (i + 1) + '</span><span class="cel-mini"></span>' +
            '<span class="fi-pn">Modelo fora de linha</span><b>' + x.n + ' pç</b></div>';
          return;
        }
        var corFav = ranking(r.porCor).filter(function (cc) { return p.cores.indexOf(cc.k) >= 0; })[0];
        h += '<div class="fi-peca">' +
          '<span class="fi-pos">' + (i + 1) + '</span>' +
          '<span class="cel-mini" style="background:' + p.fundo + '">' + svgPeca(p, corFav ? corFav.k : p.cores[0], 'frente', { mudo: true }) + '</span>' +
          '<span class="fi-pn">' + esc(p.nome) + '<em>' + esc(p.ref) + ' . ' + brl(r.valProd[x.k]) + '</em></span>' +
          '<b>' + x.n + ' pç</b></div>';
      });
      h += '</div></section>';

      // Cores e tamanhos
      var cores = ranking(r.porCor).slice(0, 6);
      var maxCor = cores.length ? cores[0].n : 0;
      var tamsR = ranking(r.porTam);
      var maxTam = tamsR.length ? tamsR[0].n : 0;
      var cats = ranking(r.porCat);
      var catNome = function (k) { var x = CATS.filter(function (cc) { return cc[0] === k; })[0]; return x ? x[1] : k; };

      h += '<div class="fi-duas">' +
        '<section class="fi-sec"><h4>Cores preferidas</h4>' +
          cores.map(function (x) { return barraFicha(CORES[x.k] ? CORES[x.k].nome : x.k, x.n, maxCor, CORES[x.k] ? CORES[x.k].hex : null); }).join('') +
        '</section>' +
        '<section class="fi-sec"><h4>Tamanhos mais pedidos</h4>' +
          tamsR.slice(0, 6).map(function (x) { return barraFicha(x.k, x.n, maxTam); }).join('') +
        '</section>' +
      '</div>';

      // Perfil em uma frase
      if (cats.length) {
        var pctCat = Math.round(cats[0].n / r.pecas * 100);
        var tamFav = tamsR.slice(0, 3).map(function (x) { return x.k; }).join(', ');
        h += '<p class="fi-perfil">Compra principalmente <b>' + esc(catNome(cats[0].k).toLowerCase()) + '</b> (' + pctCat + '% das peças), ' +
          'concentra a grade em <b>' + esc(tamFav) + '</b> e a cor que mais leva é <b>' + esc(CORES[cores[0].k].nome.toLowerCase()) + '</b>.</p>';
      }

      // O que oferecer: modelos da categoria favorita que ele ainda não comprou
      var jaComprou = r.porProd;
      var catsFav = cats.slice(0, 2).map(function (x) { return x.k; });
      var sugestao = visiveis().filter(function (p) {
        return !jaComprou[p.id] && estoqueTotal(p) > 0 && catsFav.indexOf(p.cat) >= 0;
      });
      if (sugestao.length < 3) {
        visiveis().forEach(function (p) {
          if (sugestao.length < 3 && !jaComprou[p.id] && p.novo && sugestao.indexOf(p) < 0 && estoqueTotal(p) > 0) sugestao.push(p);
        });
      }
      if (sugestao.length) {
        h += '<section class="fi-sec"><h4>Para oferecer</h4>' +
          '<p class="aux" style="margin:-4px 0 10px">Modelos com estoque, no estilo do que o cliente compra e que ele ainda não levou.</p>' +
          '<div class="fi-sug">';
        sugestao.slice(0, 3).forEach(function (p) {
          h += '<div class="fi-sug-i">' +
            '<span class="fi-sug-img" style="background:' + p.fundo + '">' + svgPeca(p, p.cores[0], 'frente', { mudo: true }) + '</span>' +
            '<span class="fi-pn">' + esc(p.nome) + '<em>' + brl(p.preco) + ' . ' + p.cores.length + (p.cores.length === 1 ? ' cor' : ' cores') + '</em></span></div>';
        });
        h += '</div></section>';
      }
    }

    // O que ele está fazendo agora no catálogo (só dá para saber de quem
    // está logado nesta demonstração, que é a Boutique Avenida)
    if (c.id === EU.id) {
      var favs = Object.keys(st.favoritos).map(prod).filter(Boolean);
      var car = totalCarrinho();
      if (favs.length || car.pecas) {
        h += '<section class="fi-sec"><h4>No catálogo agora</h4>' +
          (car.pecas
            ? '<p class="fi-car"><b>' + car.pecas + ' peças no carrinho, ' + brl(car.valor) + '</b>, ainda sem fechar. ' +
              'Um lembrete costuma destravar.</p>'
            : '') +
          (favs.length
            ? '<p class="aux" style="margin:6px 0 0">Favoritou: ' + favs.map(function (p) { return esc(p.nome); }).join(', ') + '.</p>'
            : '') +
        '</section>';
      }
    }

    // Histórico
    if (r.pedidos.length) {
      h += '<section class="fi-sec"><h4>Histórico de pedidos</h4><div class="fi-hist">';
      r.pedidos.forEach(function (p) {
        var sp = SIT[p.sit];
        var pg = p.pag ? PAG_SIT[p.pag.sit] : null;
        h += '<button class="fi-ped" data-acao="ficha-ped" data-id="' + p.id + '">' +
          '<span class="fi-pn">Nº ' + p.n + '<em>' + p.data + ' . ' + pecasPedido(p) + ' peças</em></span>' +
          '<span class="fi-tags"><span class="sel ' + sp[1] + '">' + sp[0] + '</span>' +
            (pg ? '<span class="sel ' + pg[1] + '">' + pg[0] + '</span>' : '') + '</span>' +
          '<b>' + brl(valorPedido(p)) + '</b>' +
          '<span class="lp-seta">' + IC.segue + '</span></button>';
      });
      h += '</div></section>';
    }

    // Anotação interna
    h += '<section class="fi-sec"><h4>Anotações da loja</h4>' +
      '<textarea id="fi-obs" class="fi-obs" rows="3" placeholder="Só a equipe da loja vê. Ex: prefere transportadora, paga sempre no Pix, aniversário da loja em março.">' +
      esc(c.obs || '') + '</textarea>' +
      '<div class="fi-obs-pe"><button class="btn btn-sec btn-peq" data-acao="salvar-obs" data-id="' + c.id + '">Salvar anotação</button>' +
      (st.obsSalva === c.id ? '<span class="fi-ok" role="status">Anotação salva</span>' : '') + '</div>' +
      '</section>';

    h += '</div>';

    // Rodapé de ações. Os telefones da demonstração são de mentira
    // (9 0000-0000): nesse caso o link vai sem número e o WhatsApp
    // pergunta para quem mandar, em vez de abrir uma conversa que não existe.
    var num = soDigitos(ct.fone);
    if (/0{8}$/.test(num)) num = '';
    var oi = 'Oi, ' + (ct.resp ? ct.resp.split(' ')[0] : 'tudo bem') + '! Aqui é da ' + LOJA.nome + '. ' +
      'Chegou a coleção ' + LOJA.colecao + ' e separei uns modelos no estilo do que vocês levam. Quer dar uma olhada no catálogo?';
    h += '<div class="mod-pe">' +
      (c.sit === 'esp'
        ? '<button class="btn btn-dest" data-acao="cli" data-id="' + c.id + '" data-v="ok">Aprovar cadastro</button>' +
          '<button class="btn btn-sec" data-acao="cli" data-id="' + c.id + '" data-v="bloq">Recusar</button>'
        : c.sit === 'ok'
          ? '<button class="btn btn-perigo btn-peq" data-acao="cli" data-id="' + c.id + '" data-v="bloq">Bloquear</button>'
          : '<button class="btn btn-sec" data-acao="cli" data-id="' + c.id + '" data-v="ok">Liberar cadastro</button>') +
      '<span class="mod-esp"></span>' +
      '<a class="btn btn-wa" href="https://wa.me/' + (num ? '55' + num : '') + '?text=' + encodeURIComponent(oi) + '" target="_blank" rel="noopener">' +
        IC.whats + 'Chamar no WhatsApp</a>' +
      '</div>';

    return h;
  }

  /* ---------- filtros da aba Clientes ----------
     Cada filtro é uma pergunta que o lojista faz no dia a dia: quem me
     deve, quem está esperando mercadoria, quem sumiu.                    */

  var FILTROS_CLI = [
    ['todos', 'Todos', function () { return true; }],
    ['devendo', 'Pagamento em aberto', function (c, r) { return r.aReceber > 0; }],
    ['andamento', 'Pedido em separação', function (c, r) { return r.andamento > 0; }],
    ['transito', 'Pedido em trânsito', function (c, r) { return r.transito > 0; }],
    ['sumidos', 'Sumidos', function (c, r) { return r.sumido; }],
    ['novos', 'Sem pedido ainda', function (c, r) { return !r.pedidos.length && c.sit === 'ok'; }],
    ['montou', 'Montou e não fechou', function (c) { return !!montadoDe(c); }],
    ['esp', 'Aguardando aprovação', function (c) { return c.sit === 'esp'; }],
    ['bloq', 'Bloqueados', function (c) { return c.sit === 'bloq'; }]
  ];

  var ORDENS_CLI = [
    ['total', 'Quem compra mais', function (a, b) { return b.r.total - a.r.total; }],
    ['receber', 'Quem deve mais', function (a, b) { return b.r.aReceber - a.r.aReceber; }],
    ['pedidos', 'Mais pedidos', function (a, b) { return b.r.pedidos.length - a.r.pedidos.length; }],
    ['ticket', 'Maior ticket médio', function (a, b) { return b.r.ticket - a.r.ticket; }],
    ['recente', 'Comprou mais recente', function (a, b) { return dU(a) - dU(b); }],
    ['parado', 'Mais tempo sem comprar', function (a, b) { return dU(b, -1) - dU(a, -1); }],
    ['nome', 'Nome de A a Z', function (a, b) { return a.c.nome.localeCompare(b.c.nome, 'pt-BR'); }]
  ];
  // Quem nunca comprou vai para o fim nas ordens por data.
  function dU(x, sem) { return x.r.diasUltimo === null ? (sem === -1 ? -1 : 1e9) : x.r.diasUltimo; }

  function clientesFiltrados() {
    var f = FILTROS_CLI.filter(function (x) { return x[0] === st.cliFiltro; })[0] || FILTROS_CLI[0];
    var o = ORDENS_CLI.filter(function (x) { return x[0] === st.cliOrdem; })[0] || ORDENS_CLI[0];
    var b = semAcento(st.cliBusca.trim());
    var bDig = soDigitos(st.cliBusca);
    return CLIENTES.map(function (c) { return { c: c, r: resumoCliente(c) }; })
      .filter(function (x) {
        if (!f[2](x.c, x.r)) return false;
        if (!b) return true;
        return semAcento(x.c.nome).indexOf(b) >= 0 || semAcento(x.c.cidade).indexOf(b) >= 0 ||
          (bDig.length >= 3 && soDigitos(x.c.doc).indexOf(bDig) >= 0);
      })
      .sort(o[2]);
  }

  function painelClientes() {
    var todos = CLIENTES.map(function (c) { return { c: c, r: resumoCliente(c) }; });
    var aReceber = todos.reduce(function (a, x) { return a + x.r.aReceber; }, 0);
    var devedores = todos.filter(function (x) { return x.r.aReceber > 0; }).length;
    var esperando = todos.filter(function (x) { return x.c.sit === 'esp'; }).length;
    var lista = clientesFiltrados();

    var h = '<div class="pnl-cab"><div><h1 class="pnl-h">Clientes</h1>' +
      '<p class="pnl-sub">' + todos.filter(function (x) { return x.c.sit === 'ok'; }).length + ' aprovados . ' +
      esperando + ' aguardando . ' + todos.length + ' cadastros</p></div></div>';

    // Faixa de resumo: o que pede atenção hoje
    h += '<div class="cli-resumo">' +
      '<button class="cr-item' + (aReceber > 0 ? ' ruim' : '') + '" data-acao="cli-filtro" data-v="devendo">' +
        '<b>' + brl(aReceber) + '</b><span>a receber de ' + devedores + (devedores === 1 ? ' cliente' : ' clientes') + '</span></button>' +
      '<button class="cr-item" data-acao="cli-filtro" data-v="transito">' +
        '<b>' + todos.reduce(function (a, x) { return a + x.r.transito; }, 0) + '</b><span>pedidos em trânsito</span></button>' +
      '<button class="cr-item" data-acao="cli-filtro" data-v="sumidos">' +
        '<b>' + todos.filter(function (x) { return x.r.sumido; }).length + '</b><span>clientes sumidos</span></button>' +
      '<button class="cr-item' + (esperando ? ' atencao' : '') + '" data-acao="cli-filtro" data-v="esp">' +
        '<b>' + esperando + '</b><span>esperando aprovação</span></button>' +
    '</div>';

    // Busca, filtros e ordem
    h += '<div class="cli-ferr">' +
      '<div class="busca">' + IC.busca +
        '<input id="qcli" type="search" placeholder="Buscar por nome, cidade ou CNPJ" value="' + esc(st.cliBusca) + '" aria-label="Buscar cliente"></div>' +
      '<label class="cli-ordem"><span>Ordenar</span><select id="cli-ordem">' +
        ORDENS_CLI.map(function (o) {
          return '<option value="' + o[0] + '"' + (st.cliOrdem === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
        }).join('') + '</select></label>' +
    '</div>' +
    '<div class="cli-filtros" role="group" aria-label="Filtrar clientes">';
    FILTROS_CLI.forEach(function (f) {
      var n = todos.filter(function (x) { return f[2](x.c, x.r); }).length;
      h += '<button class="cf" data-acao="cli-filtro" data-v="' + f[0] + '" aria-pressed="' + (st.cliFiltro === f[0]) + '"' +
        (n === 0 && f[0] !== 'todos' ? ' data-zero="1"' : '') + '>' +
        f[1] + '<i>' + n + '</i></button>';
    });
    h += '</div>';

    if (!lista.length) {
      return h + '<div class="vazio"><b>Nenhum cliente neste filtro</b>' +
        (st.cliBusca ? 'Limpe a busca ou troque o filtro.' : 'Boa notícia, na maioria dos casos.') + '</div>';
    }

    var fAtual = FILTROS_CLI.filter(function (x) { return x[0] === st.cliFiltro; })[0];
    h += '<div class="quadro"><div class="quadro-h"><span>' + (fAtual && fAtual[0] !== 'todos' ? fAtual[1] : 'Todos os cadastros') + '</span>' +
      '<span>' + lista.length + (lista.length === 1 ? ' cliente' : ' clientes') + '</span></div>';
    lista.forEach(function (x) { h += linhaCliente(x.c, x.r); });
    return h + '</div>' +
      '<p class="pnl-nota">Só cliente aprovado enxerga preço e fecha pedido. Quem está aguardando vê o catálogo com o preço travado. Clique no nome para abrir a ficha completa.</p>';
  }

  function linhaCliente(c, r) {
    var s = SITC[c.sit];
    r = r || resumoCliente(c);
    var avisos = '';
    if (r.aReceber > 0) {
      avisos += '<span class="cli-aviso ruim">' + IC.alerta + brl(r.aReceber) + ' a pagar' +
        (r.abertos > 1 ? ' . ' + r.abertos + ' pedidos' : '') + '</span>';
    }
    if (r.transito > 0) {
      avisos += '<span class="cli-aviso">' + r.transito + (r.transito === 1 ? ' pedido' : ' pedidos') + ' em trânsito</span>';
    }
    if (r.sumido && c.sit === 'ok') {
      avisos += '<span class="cli-aviso">Sem comprar ' + quando(r.diasUltimo) + '</span>';
    }
    var mont = montadoDe(c);
    if (mont) {
      avisos += '<span class="cli-aviso mont">' + IC.sacola + 'Pedido montado: ' + mont.pecas + ' peças, ' + brl(mont.valor) + '</span>';
    }
    return '<div class="linha-cli">' +
      '<span class="cli-ini">' + esc(iniciais(c.nome)) + '</span>' +
      '<span class="lp-corpo">' +
        '<button class="lp-nome cli-link" data-acao="modal" data-v="cliente" data-id="' + c.id + '">' + esc(c.nome) + '</button>' +
        '<span class="lp-meta">' + esc(c.cidade) + ' . ' +
          (r.pedidos.length
            ? brl(r.total) + ' em ' + r.pedidos.length + (r.pedidos.length === 1 ? ' pedido' : ' pedidos') +
              ' . último ' + quando(r.diasUltimo)
            : 'cadastro ' + esc(c.desde) + ' . ainda sem pedidos') +
        '</span>' + (avisos ? '<span class="cli-avisos">' + avisos + '</span>' : '') + '</span>' +
      '<span class="sel ' + s[1] + '">' + s[0] + '</span>' +
      '<span class="cli-bts">' +
        (c.sit === 'esp'
          ? '<button class="btn btn-dest btn-peq" data-acao="cli" data-id="' + c.id + '" data-v="ok">Aprovar</button>' +
            '<button class="btn btn-sec btn-peq" data-acao="cli" data-id="' + c.id + '" data-v="bloq">Recusar</button>'
          : c.sit === 'ok'
            ? '<button class="btn btn-sec btn-peq" data-acao="cli" data-id="' + c.id + '" data-v="bloq">Bloquear</button>'
            : '<button class="btn btn-sec btn-peq" data-acao="cli" data-id="' + c.id + '" data-v="ok">Liberar</button>') +
      '</span></div>';
  }

  function campo(id, rotulo, valor, extra) {
    return '<label class="campo"><span>' + rotulo + '</span>' +
      '<input id="' + id + '" value="' + esc(valor) + '" ' + (extra || '') + '></label>';
  }

  function painelAjustes() {
    return '<div class="pnl-cab"><div><h1 class="pnl-h">Ajustes da loja</h1>' +
        '<p class="pnl-sub">O que muda aqui muda no catálogo na hora</p></div></div>' +
      '<form id="fajustes" class="quadro caixa-form">' +
        campo('aj-nome', 'Nome da loja', LOJA.nome) +
        campo('aj-cidade', 'Cidade', LOJA.cidade) +
        campo('aj-colecao', 'Coleção em destaque', LOJA.colecao) +
        '<label class="campo larga"><span>Chamada da capa (aparece quando não há banner ativo na Vitrine)</span>' +
          '<input id="aj-chamada" value="' + esc(LOJA.chamada) + '"></label>' +
        '<fieldset class="campo-grupo"><legend>Pedido mínimo</legend>' +
          seletor('aj-mintipo', 'Regra', [['valor', 'Por valor'], ['pecas', 'Por quantidade de peças'], ['ambos', 'Valor e peças, os dois']], LOJA.minTipo) +
          campo('aj-minimo', 'Mínimo em reais (R$)', LOJA.minimo, 'type="number" min="0" step="10"') +
          campo('aj-minpecas', 'Mínimo de peças no pedido', LOJA.minPecas, 'type="number" min="0" step="1"') +
          campo('aj-minmodelo', 'Mínimo de peças por modelo', LOJA.minModelo, 'type="number" min="0" step="1"') +
          '<p class="aux campo-nota">Por modelo soma as cores da mesma referência. Deixe 0 para não exigir.</p>' +
        '</fieldset>' +
        '<div class="campo-pe"><button type="submit" class="btn">Salvar ajustes</button>' +
        '<span>Troque para <strong>Quem compra</strong> depois de salvar para ver a mudança.</span></div>' +
      '</form>' + quadroPagamentoAjustes() + quadroTabelas() + quadroAcessos();
  }

  // WhatsApp do comercial vale nos dois planos; Pix e cartão só no Pro.
  function quadroPagamentoAjustes() {
    var pro = LOJA.plano === 'pro';
    var pl = PLANOS[LOJA.plano];
    return '<div class="pnl-cab" style="margin-top:34px"><div>' +
        '<h1 class="pnl-h">Pagamento e WhatsApp</h1>' +
        '<p class="pnl-sub">Como o pedido fecha no catálogo</p></div></div>' +
      '<form id="fpagamento" class="quadro caixa-form">' +
        '<div class="campo larga plano-atual">' +
          '<span>Seu plano</span>' +
          '<div class="pa-caixa"><b>' + pl.nome + '</b><em>' + brl(pl.preco).replace(',00', '') + ' por mês</em>' +
          '<p>' + (pro
            ? 'O cliente paga com Pix ou cartão dentro do catálogo, e o pedido já chega pago. Quem preferir ainda pode combinar pelo WhatsApp.'
            : 'O pedido fecha com uma mensagem pronta, com a grade, enviada para o WhatsApp do seu comercial. Pagamento e frete são combinados na conversa.') +
          '</p><p class="aux" style="margin:0">Para mudar de plano, fale com a 42.dev. A troca vale na hora, sem perder pedidos.</p></div>' +
        '</div>' +
        '<label class="campo larga"><span>WhatsApp do comercial</span>' +
          '<input id="aj-whats" inputmode="tel" placeholder="(81) 9 0000-0000" value="' + esc(LOJA.whats) + '"></label>' +
        '<fieldset class="campo-grupo"' + (pro ? '' : ' disabled') + '>' +
          '<legend>Pix e cartão' + (pro ? '' : '<em>no plano Pro</em>') + '</legend>' +
          campo('aj-pix', 'Desconto no Pix (%)', String(LOJA.descontoPix).replace('.', ','), 'inputmode="decimal"') +
          campo('aj-juros', 'Juros ao mês acima disso (%)', String(LOJA.jurosMes).replace('.', ','), 'inputmode="decimal"') +
          seletor('aj-semjuros', 'Parcelas sem juros', [1,2,3,4,5,6,10,12].map(function (n) { return [String(n), n === 1 ? 'Só à vista' : 'Até ' + n + 'x']; }), String(LOJA.parcSemJuros)) +
          seletor('aj-parcmax', 'Parcelamento máximo', [1,2,3,4,5,6,10,12].map(function (n) { return [String(n), n === 1 ? 'Só à vista' : 'Até ' + n + 'x']; }), String(LOJA.parcMax)) +
        '</fieldset>' +
        '<div class="campo-pe"><button type="submit" class="btn">Salvar pagamento</button>' +
        '<span>' + (pro ? 'O catálogo já usa os valores novos no próximo pedido.' : 'Com o número salvo, o botão do catálogo abre a conversa certa.') + '</span></div>' +
      '</form>';
  }

  // Transparência: o lojista vê toda vez que a 42.dev entrou no painel dele.
  function quadroAcessos() {
    var meus = ACESSOS.filter(function (x) { return x.conf === 'alecrim'; });
    var h = '<div class="pnl-cab" style="margin-top:34px"><div>' +
        '<h1 class="pnl-h">Acessos de suporte</h1>' +
        '<p class="pnl-sub">Toda vez que a 42.dev entra no seu painel fica registrado aqui</p></div></div>' +
      '<div class="quadro">';
    if (!meus.length) return h + '<div class="vazio">Nenhum acesso de suporte até agora.</div></div>';
    meus.forEach(function (x) {
      h += '<div class="linha-tab">' +
        '<span class="lp-corpo"><span class="lp-nome">' + esc(x.quem) + ', ' + esc(x.motivo) + '</span>' +
        '<span class="lp-meta">' + esc(x.data) + ', das ' + esc(x.ini) + (x.fim ? ' às ' + esc(x.fim) : ' até agora') + '</span></span>' +
        (x.fim ? '' : '<span class="sel sel-sep">Em andamento</span>') + '</div>';
    });
    return h + '</div>';
  }

  // As tabelas de tamanho são configuração do lojista, não código.
  function quadroTabelas() {
    var h = '<div class="pnl-cab" style="margin-top:34px"><div>' +
        '<h1 class="pnl-h">Tabelas de tamanho</h1>' +
        '<p class="pnl-sub">Cada produto aponta para uma destas grades</p></div></div>' +
      '<div class="quadro">';

    Object.keys(TABELAS).forEach(function (k) {
      var usos = PRODUTOS.filter(function (p) { return p.grade === k; }).length;
      h += '<div class="linha-tab">' +
        '<span class="lp-corpo"><span class="lp-nome">' + esc(TABELAS[k].nome) + '</span>' +
        '<span class="lp-meta">' + usos + (usos === 1 ? ' modelo usa' : ' modelos usam') + '</span></span>' +
        '<span class="est">' + TABELAS[k].tams.map(function (t) { return '<i>' + esc(t) + '</i>'; }).join('') + '</span>' +
        (TABELAS[k].fixa === false && !usos
          ? '<button class="btn btn-sec btn-peq" data-acao="tab-apagar" data-v="' + k + '">Apagar</button>'
          : '') +
        '</div>';
    });

    return h + '</div>' +
      '<form id="ftabela" class="quadro caixa-form" style="margin-top:18px">' +
        campo('tb-nome', 'Nome da tabela', '', 'placeholder="Ex: Plus size feminino"') +
        '<label class="campo"><span>Tamanhos, separados por vírgula</span>' +
          '<input id="tb-tams" placeholder="Ex: G1, G2, G3, G4"></label>' +
        '<div class="campo-pe"><button type="submit" class="btn btn-dest">Criar tabela</button>' +
        '<span>A tabela nova aparece na hora no cadastro de produto.</span></div>' +
      '</form>';
  }

  /* =================== painel: vitrine =================== */

  function botoes(acao, lista, atual, rotulo, id) {
    return '<div class="seg" role="group" aria-label="' + rotulo + '">' + lista.map(function (o) {
      return '<button type="button" data-acao="' + acao + '"' + (id ? ' data-id="' + id + '"' : '') + ' data-v="' + o[0] + '" aria-pressed="' + (atual === o[0]) + '">' + o[1] + '</button>';
    }).join('') + '</div>';
  }

  // Botão de envio de arquivo: o input fica escondido dentro do rótulo.
  function botaoArquivo(alvo, rotulo, cls) {
    return '<label class="btn ' + (cls || 'btn-sec') + ' btn-peq arquivo">' + rotulo +
      '<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" data-up="' + alvo + '"></label>';
  }

  function miniBanner(b) {
    return '<span class="ban-mini">' + midiaBanner(b) + '</span>';
  }

  function painelVitrine() {
    var ativos = bannersAtivos().length;

    var h = '<div class="pnl-cab"><div><h1 class="pnl-h">Vitrine</h1>' +
        '<p class="pnl-sub">A cara da página inicial do catálogo: sua logo e os banners da capa</p></div>' +
        '<button class="btn btn-sec btn-peq" data-acao="modo" data-v="catalogo">Ver no catálogo</button></div>';

    // Logo
    h += '<div class="quadro vt-quadro"><div class="quadro-h"><h3>Logo da loja</h3></div>' +
      '<div class="vt-logo">' +
        '<div class="vt-previa" aria-label="Prévia do topo do catálogo">' +
          '<div class="vt-topo">' +
            (temLogo() ? logoLoja()
              : '<span class="vt-nome serif">' + esc(LOJA.nome) + '</span>') +
            '<span class="vt-busca">' + IC.busca + 'Buscar no catálogo</span>' +
            '<span class="vt-entrar">Entrar</span>' +
          '</div>' +
          '<span class="rotulo">Prévia do topo do catálogo</span>' +
        '</div>' +
        '<div class="vt-ctrl">' +
          '<div class="vt-acoes">' +
            botaoArquivo('logo', LOJA.logo ? 'Trocar logo' : 'Enviar logo', 'btn-dest') +
            (LOJA.logo ? '<button class="btn btn-sec btn-peq" data-acao="logo-remover">Remover</button>' : '') +
          '</div>' +
          '<div class="vt-op"><span class="rotulo">No topo do catálogo</span>' +
            (LOJA.logo
              ? botoes('logo-topo', [['logo', 'Logo'], ['nome', 'Nome escrito']], LOJA.logoTopo, 'O que aparece no topo')
              : '<p class="nota" style="margin:0">Sem logo enviada, o topo mostra o nome da loja escrito.</p>') +
          '</div>' +
          (temLogo()
            ? '<div class="vt-op"><span class="rotulo">Tamanho da logo</span>' +
                botoes('logo-tam', [['p', 'Pequena'], ['m', 'Média'], ['g', 'Grande']], LOJA.logoTam, 'Tamanho da logo') + '</div>'
            : '') +
          '<p class="nota" style="margin:0">PNG ou SVG com fundo transparente fica melhor. Logo deitada, mais larga que alta, aproveita melhor o topo.</p>' +
        '</div>' +
      '</div></div>';

    // Carrossel
    h += '<div class="quadro vt-quadro"><div class="quadro-h vt-h"><h3>Banners da capa</h3>' +
      '<label class="cli-ordem vt-troca"><span class="rotulo">Trocar a cada</span>' +
        '<select id="vt-troca">' + [[4, '4 segundos'], [6, '6 segundos'], [8, '8 segundos'], [0, 'Não trocar sozinho']].map(function (o) {
          return '<option value="' + o[0] + '"' + (LOJA.trocaSeg === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
        }).join('') + '</select></label></div>';

    if (!BANNERS.length) {
      h += '<div class="vazio" style="margin:0;border:0"><b>Nenhum banner ainda</b>Sem banner, a capa do catálogo mostra a coleção em destaque dos Ajustes.</div>';
    }
    BANNERS.forEach(function (b, i) {
      h += '<div class="ban-linha' + (b.ativo ? '' : ' oculto') + '">' +
        // Puxador: arrasta com mouse ou dedo; no teclado, setas para cima e para baixo.
        '<button class="ban-pega" data-pega="' + b.id + '" aria-label="Banner ' + (i + 1) + ' de ' + BANNERS.length +
          '. Arraste para mudar a ordem, ou use as setas para cima e para baixo." title="Arraste para mudar a ordem">' +
          IC.pega + '<b>' + (i + 1) + '</b></button>' +
        '<button class="ban-ver" data-acao="modal" data-v="banner" data-id="' + b.id + '" aria-label="Editar o banner ' + esc(b.titulo || i + 1) + '">' + miniBanner(b) + '</button>' +
        '<span class="lp-corpo"><span class="lp-nome">' + esc(b.titulo || 'Banner só com imagem') + '</span>' +
          '<span class="lp-meta">Leva para: ' + esc(nomeDestino(b.destino)) +
            (b.img ? (b.imgMob ? ' . imagem de celular própria' : ' . celular recortado ' + (b.foco === 'centro' ? 'no centro' : 'à ' + b.foco)) : ' . arte de exemplo') +
          '</span></span>' +
        '<span class="sel ' + (b.ativo ? 'sel-env' : 'sel-bloq') + '">' + (b.ativo ? 'Na capa' : 'Oculto') + '</span>' +
        '<span class="ban-btns">' +
          '<button class="btn btn-sec btn-peq" data-acao="ban-ativo" data-id="' + b.id + '">' + (b.ativo ? 'Ocultar' : 'Mostrar') + '</button>' +
          '<button class="btn btn-sec btn-peq" data-acao="modal" data-v="banner" data-id="' + b.id + '">Editar</button>' +
          '<button class="btn btn-sec btn-peq" data-acao="modal" data-v="excluir-banner" data-id="' + b.id + '" aria-label="Excluir o banner ' + esc(b.titulo || i + 1) + '">Excluir</button>' +
        '</span></div>';
    });

    h += '<div class="vt-pe">' +
      '<button class="btn btn-dest" data-acao="modal" data-v="banner"' + (BANNERS.length >= MAX_BANNERS ? ' disabled' : '') + '>Novo banner</button>' +
      '<span class="nota">Arraste pelo puxador para mudar a ordem da capa. ' + ativos + ' de ' + BANNERS.length + ' na capa . até ' + MAX_BANNERS + ' banners. ' +
        'Tamanho ideal: 1920 × 720 no computador e 1080 × 1350 no celular.</span></div></div>';

    return h;
  }

  function modalBanner() {
    var r = st.banRasc;
    var novo = !r.id;
    var cats = CATS.map(function (c) { return [c[0], c[0] === 'todos' ? 'Catálogo inteiro' : c[1]]; });
    COLECOES.forEach(function (c) { cats.push(['col:' + c.id, 'Coleção ' + c.nome]); });
    cats.push(['', 'Nenhum lugar']);

    return '<form id="fbanner"><div class="mod-corpo">' +
      '<div class="campo larga"><span>Imagem para computador</span>' +
        '<div class="ban-prev">' + ((r.img || r.arte) ? midiaBanner(r) : '<em>Nenhuma imagem escolhida</em>') + '</div>' +
        '<div class="vt-acoes">' + botaoArquivo('ban-desk', (r.img || r.arte) ? 'Trocar imagem' : 'Escolher imagem', (r.img || r.arte) ? 'btn-sec' : 'btn-dest') +
        '<span class="nota">1920 × 720, JPG ou PNG</span></div></div>' +
      '<div class="campo larga ban-mob-campo"><span>Imagem para celular (opcional)</span>' +
        '<div class="ban-mob-linha">' +
          '<div class="ban-prev-mob">' + (r.imgMob ? '<img src="' + r.imgMob + '" alt="">' : '<em>Usa a do computador</em>') + '</div>' +
          '<div class="ban-mob-ctrl">' +
            '<div class="vt-acoes">' + botaoArquivo('ban-mob', r.imgMob ? 'Trocar' : 'Escolher imagem') +
              (r.imgMob ? '<button type="button" class="btn btn-sec btn-peq" data-acao="ban-tira-mob">Remover</button>' : '') + '</div>' +
            '<p class="nota" style="margin:0">1080 × 1350, em pé. Sem ela, o celular recorta a imagem do computador.</p>' +
            (r.imgMob ? '' : seletor('bn-foco', 'Parte que aparece no celular', [['esquerda', 'Esquerda'], ['centro', 'Centro'], ['direita', 'Direita']], r.foco)) +
          '</div></div></div>' +
      '<label class="campo larga marcar"><input type="checkbox" id="bn-texto"' + (r.texto ? ' checked' : '') + '>' +
        '<span>Escrever título e botão por cima da imagem<em>Desmarque se a arte já vem com o texto. Aí o banner inteiro vira o link.</em></span></label>' +
      campo('bn-tag', 'Selo (opcional)', r.tag || '', 'placeholder="Ex: Nova coleção" maxlength="28"') +
      campo('bn-titulo', 'Título', r.titulo || '', 'placeholder="Ex: Verão 27" maxlength="40"') +
      '<label class="campo larga"><span>Texto de apoio</span><input id="bn-sub" value="' + esc(r.sub || '') + '" maxlength="110" placeholder="Uma linha sobre a coleção ou a promoção"></label>' +
      campo('bn-botao', 'Texto do botão', r.botao || '', 'placeholder="Ex: Ver a coleção" maxlength="28"') +
      seletor('bn-destino', 'Leva para', cats, r.destino) +
      '</div><div class="mod-pe">' +
      (novo ? '' : '<button type="button" class="btn btn-perigo btn-peq" data-acao="modal" data-v="excluir-banner" data-id="' + r.id + '">Excluir banner</button>') +
      '<span class="mod-esp"></span>' +
      '<button type="button" class="btn btn-sec" data-acao="fechar-modal">Cancelar</button>' +
      '<button type="submit" class="btn">' + (novo ? 'Pôr na capa' : 'Salvar') + '</button>' +
      '</div></form>';
  }

  /* =================== painel da 42.dev (operação) =================== */

  function confNome(c) { return c.id === 'alecrim' ? LOJA.nome : c.nome; }
  function confCidade(c) { return c.id === 'alecrim' ? LOJA.cidade : c.cidade; }
  function confPlano(c) { return c.id === 'alecrim' ? LOJA.plano : c.plano; }
  function confPedidos(c) {
    return c.id === 'alecrim' ? PEDIDOS.filter(function (p) { return /nov/.test(p.data); }).length : c.pedidos;
  }
  function confProdutos(c) { return c.id === 'alecrim' ? PRODUTOS.length : c.produtos; }
  function conf(id) { return CONFECCOES.filter(function (c) { return c.id === id; })[0] || null; }

  function barraOp() {
    return '<div class="pnl-barra op-barra"><div class="pnl-topo">' +
      '<div class="pnl-marca">' +
        '<svg width="15" height="21" style="color:var(--lume);display:block"><use href="#lume"/></svg>' +
        '<span class="serif">lume</span><em class="pnl-onde">Operação</em></div>' +
      '<span class="op-simul">Dados simulados</span>' +
      '<span class="pnl-quem"><i>42</i><span class="so-desk">42.dev</span></span>' +
      '</div></div>';
  }

  function painelOp() {
    var ativos = CONFECCOES.filter(function (c) { return c.sit === 'ativo'; });
    var mrr = ativos.reduce(function (a, c) { return a + PLANOS[confPlano(c)].preco; }, 0);
    var atraso = ativos.filter(function (c) { return c.cob === 'atraso'; });
    var impl = CONFECCOES.filter(function (c) { return c.sit === 'impl'; });
    var pedidos = CONFECCOES.reduce(function (a, c) { return a + confPedidos(c); }, 0);
    var pros = ativos.filter(function (c) { return confPlano(c) === 'pro'; }).length;

    var h = '<div class="pnl-cab"><div><h1 class="pnl-h">Operação do Lume</h1>' +
      '<p class="pnl-sub">Confecções clientes, mensalidades e implantação. Visão da 42.dev, o lojista não vê esta tela.</p></div></div>';

    h += '<div class="nums op-nums">' +
      cartaoOp(brl(mrr).replace(',00', ''), 'receita mensal recorrente', ativos.length + ' confecções ativas . ' + pros + ' no Pro') +
      cartaoOp(String(pedidos), 'pedidos em novembro', 'somando todas as confecções') +
      cartaoOp(String(impl.length), impl.length === 1 ? 'implantação em andamento' : 'implantações em andamento', brl(IMPLANTACAO).replace(',00', '') + ' cada, pago na assinatura') +
      cartaoOp(String(atraso.length), atraso.length === 1 ? 'mensalidade atrasada' : 'mensalidades atrasadas',
        atraso.length ? brl(atraso.reduce(function (a, c) { return a + PLANOS[confPlano(c)].preco; }, 0)).replace(',00', '') + ' em aberto' : 'tudo em dia', atraso.length ? 'ruim' : '') +
      '</div>';

    // Confecções
    h += '<div class="quadro" style="margin-bottom:22px"><div class="quadro-h"><span>Confecções clientes</span><span>' + CONFECCOES.length + '</span></div>';
    CONFECCOES.forEach(function (c) {
      var pl = confPlano(c);
      var cob = c.sit === 'impl' ? ['Em implantação', 'sel-sep'] : c.cob === 'atraso' ? ['Atrasada desde ' + c.venc, 'sel-bloq'] : ['Em dia', 'sel-env'];
      h += '<div class="op-linha">' +
        '<span class="cli-ini">' + esc(iniciais(confNome(c))) + '</span>' +
        '<span class="lp-corpo"><span class="lp-nome">' + esc(confNome(c)) + (c.id === 'alecrim' ? ' <em class="op-demo">loja da demonstração</em>' : '') + '</span>' +
          '<span class="lp-meta">' + esc(confCidade(c)) + ' . desde ' + c.desde + ' . ' + confProdutos(c) + ' produtos . ' + confPedidos(c) + ' pedidos no mês</span></span>' +
        '<span class="op-plano">' + botoes('op-plano', [['basico', 'Básico'], ['pro', 'Pro']], pl, 'Plano da ' + confNome(c), c.id) +
          '<em>' + brl(PLANOS[pl].preco).replace(',00', '') + '/mês</em></span>' +
        '<span class="sel ' + cob[1] + '">' + cob[0] + '</span>' +
        '<span class="op-acoes">' +
          (c.cob === 'atraso' ? '<button class="btn btn-sec btn-peq" data-acao="op-pago" data-id="' + c.id + '">Registrar pagamento</button>' : '') +
          (c.id === 'alecrim'
            ? '<button class="btn btn-peq" data-acao="modal" data-v="suporte" data-id="alecrim">Entrar como suporte</button>'
            : '<button class="btn btn-sec btn-peq" disabled title="Na demonstração só a ' + esc(LOJA.nome) + ' tem painel">Entrar como suporte</button>') +
        '</span></div>';
    });
    h += '<p class="pq-nota">Trocar o plano da ' + esc(LOJA.nome) + ' muda o catálogo na hora: no Básico o pedido fecha pelo WhatsApp, no Pro com Pix e cartão. Faça a troca e vá para <strong>Quem compra</strong>.</p></div>';

    // Implantação
    h += '<div class="op-cols"><div class="quadro"><div class="quadro-h"><span>Implantação</span><span>' + impl.length + '</span></div>';
    if (!impl.length) h += '<div class="vazio" style="padding:30px 18px">Nenhuma confecção em implantação.</div>';
    impl.forEach(function (c) {
      var feitas = ETAPAS_IMPL.filter(function (e) { return c.etapas[e[0]]; }).length;
      h += '<div class="op-impl"><div class="op-impl-cab"><b>' + esc(confNome(c)) + '</b>' +
        '<span class="aux">' + feitas + ' de ' + ETAPAS_IMPL.length + ' etapas</span></div>' +
        '<span class="op-barra-prog"><i style="width:' + Math.round(feitas / ETAPAS_IMPL.length * 100) + '%"></i></span>' +
        '<div class="op-etapas">' + ETAPAS_IMPL.map(function (e) {
          var ok = !!c.etapas[e[0]];
          return '<button class="op-etapa" data-acao="op-etapa" data-id="' + c.id + '" data-v="' + e[0] + '" aria-pressed="' + ok + '">' +
            '<i>' + (ok ? IC.certoP : '') + '</i>' + esc(e[1]) + (e[0] === 'impl' ? ' (' + brl(IMPLANTACAO).replace(',00', '') + ')' : '') + '</button>';
        }).join('') + '</div>' +
        '<button class="btn btn-dest btn-bloco" data-acao="op-ativar" data-id="' + c.id + '"' + (feitas < ETAPAS_IMPL.length ? ' disabled' : '') + '>' +
          (feitas < ETAPAS_IMPL.length ? 'Ativar quando terminar as etapas' : 'Ativar confecção') + '</button>' +
        '</div>';
    });
    h += '</div>';

    // Nova confecção
    h += '<form id="fop" class="quadro caixa-form op-nova">' +
      '<div class="campo larga"><span>Nova confecção</span><p class="aux" style="margin:0">Entra em implantação. A mensalidade começa no mês seguinte à ativação, sem fidelidade.</p></div>' +
      '<label class="campo larga"><span>Nome da confecção</span><input id="op-nome" required placeholder="Ex: Ateliê Barro Fino"></label>' +
      campo('op-cidade', 'Cidade', '', 'placeholder="Ex: Toritama, PE"') +
      seletor('op-plano', 'Plano', [['basico', 'Básico, ' + brl(PLANOS.basico.preco).replace(',00', '') + '/mês'], ['pro', 'Pro, ' + brl(PLANOS.pro.preco).replace(',00', '') + '/mês']], 'basico') +
      '<div class="campo-pe"><button type="submit" class="btn">Começar implantação</button></div>' +
      '</form></div>';

    // Acessos de suporte
    h += '<div class="quadro" style="margin-top:22px"><div class="quadro-h"><span>Acessos de suporte</span><span>o lojista vê os dele em Ajustes</span></div>';
    ACESSOS.forEach(function (x) {
      var c = conf(x.conf);
      h += '<div class="linha-tab"><span class="lp-corpo"><span class="lp-nome">' + esc(c ? confNome(c) : 'Confecção') + ': ' + esc(x.motivo) + '</span>' +
        '<span class="lp-meta">' + esc(x.quem) + ' . ' + esc(x.data) + ', das ' + esc(x.ini) + (x.fim ? ' às ' + esc(x.fim) : ' até agora') + '</span></span>' +
        (x.fim ? '' : '<span class="sel sel-sep">Em andamento</span>') + '</div>';
    });
    return h + '</div>';
  }

  function cartaoOp(num, rot, sub, cls) {
    return '<div class="num claro' + (cls ? ' ' + cls : '') + '"><b>' + num + '</b><span>' + rot + '</span>' +
      '<div class="num-s">' + sub + '</div></div>';
  }

  // Faixa no topo do painel do lojista enquanto a 42.dev está dentro dele.
  function faixaSuporte() {
    if (!st.suporte) return '';
    var x = ACESSOS[0];
    return '<div class="faixa-suporte" role="status"><span><b>Acesso de suporte da 42.dev.</b> Motivo: ' + esc(x.motivo) +
      '. Fica registrado em Ajustes da ' + esc(LOJA.nome) + '.</span>' +
      '<button class="btn btn-peq btn-dest" data-acao="sair-suporte">Encerrar acesso</button></div>';
  }

  function modalSuporte() {
    return '<form id="fsuporte"><div class="mod-corpo">' +
      '<p class="mod-nota">Você vai entrar no painel da <strong>' + esc(LOJA.nome) + '</strong> com acesso de suporte. ' +
      'O acesso fica registrado com o motivo e o horário, e a confecção vê esse registro em Ajustes.</p>' +
      '<label class="campo larga"><span>Motivo do acesso</span>' +
      '<input id="sp-motivo" required maxlength="90" placeholder="Ex: ajudar a configurar o WhatsApp do comercial"></label>' +
      '</div><div class="mod-pe"><span class="mod-esp"></span>' +
      '<button type="button" class="btn btn-sec" data-acao="fechar-modal">Cancelar</button>' +
      '<button type="submit" class="btn">Entrar no painel</button></div></form>';
  }

  /* =================== modais =================== */

  var CSV_EXEMPLO = [
    'AL-6001;Calça flare;54,90;calcas;jeans;num-fem;indigo;36:14,38:20,40:18,42:12,44:6,46:0',
    'AL-6002;Camiseta gola V;21,90;camisas;malha;letra;branco,preto,marinho;P:30,M:44,G:38,GG:22,XG:12',
    'AL-6003;Vestido longo;72,90;vestidos;plano;num-fem;vinho,oliva;36:8,38:14,40:12,42:9,44:4,46:2'
  ].join('\n');

  function seletor(id, rotulo, lista, atual) {
    return '<label class="campo"><span>' + rotulo + '</span><select id="' + id + '">' +
      lista.map(function (o) {
        return '<option value="' + o[0] + '"' + (atual === o[0] ? ' selected' : '') + '>' + esc(o[1]) + '</option>';
      }).join('') + '</select></label>';
  }

  function tabelasLista() {
    return Object.keys(TABELAS).map(function (k) {
      return [k, TABELAS[k].nome + ' (' + TABELAS[k].tams.join(', ') + ')'];
    });
  }

  function modalProduto(p) {
    var novo = !p;
    var base = p || { nome: '', ref: '', preco: '', cat: 'calcas', cores: ['indigo'], tecido: 'jeans', grade: 'num-fem', forma: 'calca' };
    var h = '<form id="fproduto" data-id="' + (p ? p.id : '') + '">' +
      '<div class="mod-corpo">' +
        '<label class="campo larga"><span>Nome do modelo</span><input id="pr-nome" value="' + esc(base.nome) + '" required></label>' +
        campo('pr-ref', 'Referência', base.ref) +
        campo('pr-preco', 'Preço por peça (R$)', base.preco === '' ? '' : Number(base.preco).toFixed(2).replace('.', ','),
          'inputmode="decimal" placeholder="0,00" required') +
        seletor('pr-cat', 'Categoria', CATS.filter(function (c) { return c[0] !== 'todos'; }), base.cat) +
        seletor('pr-forma', 'Desenho da peça', FORMAS, base.forma) +
        seletor('pr-tecido', 'Tecido', TECIDOS, base.tecido) +
        seletor('pr-grade', 'Tabela de tamanhos', tabelasLista(), base.grade);

    var tagsBase = p ? (p.tags || []) : [];
    h += '<div class="campo larga"><span>Coleções</span><div class="col-ed">' +
      (COLECOES.length ? COLECOES.map(function (c) {
        var on = tagsBase.indexOf(c.id) >= 0;
        return '<label class="col-op' + (on ? ' on' : '') + '"><input type="checkbox" class="pr-col" value="' + c.id + '"' + (on ? ' checked' : '') + '>' + esc(c.nome) + '</label>';
      }).join('') : '<em class="aux">Nenhuma coleção criada. Crie em Produtos, no quadro Coleções.</em>') +
      '</div></div>';

    h += '<div class="campo larga"><span>Cores deste modelo</span><div class="cores-ed">';
    GRUPOS_COR.forEach(function (gr) {
      var doGrupo = Object.keys(CORES).filter(function (k) { return CORES[k].grupo === gr; });
      if (!doGrupo.length) return;
      h += '<div class="cor-grupo"><b>' + esc(gr) + '</b><div class="cor-grade">';
      doGrupo.forEach(function (k) {
        var marcada = base.cores.indexOf(k) >= 0;
        h += '<label class="cor-op' + (marcada ? ' on' : '') + '" title="' + esc(CORES[k].nome) + '">' +
          '<input type="checkbox" class="pr-cor" value="' + k + '"' + (marcada ? ' checked' : '') + '>' +
          '<span style="background:' + CORES[k].hex + '"></span>' +
          '<em>' + esc(CORES[k].nome) + '</em></label>';
      });
      h += '</div></div>';
    });
    h += '</div></div>';

    if (novo) {
      h += '<p class="mod-nota">O estoque começa zerado. Depois de criar, abra o produto em <strong>Editar</strong> e lance as quantidades por cor e tamanho.</p>';
    } else {
      h += '<div class="campo larga"><span>Estoque por cor e tamanho</span><div class="rolagem">' +
        '<table class="tab-est"><thead><tr><th>Cor</th>' +
        tamsDe(p).map(function (t) { return '<th>' + esc(t) + '</th>'; }).join('') +
        '<th>Total</th></tr></thead><tbody>';
      p.cores.forEach(function (ck) {
        h += '<tr><th><span class="cor-chip" style="background:' + CORES[ck].hex + '"></span>' + esc(CORES[ck].nome) + '</th>';
        tamsDe(p).forEach(function (t) {
          h += '<td><input type="number" min="0" class="pr-est" data-sku="' + sku(ck, t) + '" value="' + est(p, ck, t) + '"></td>';
        });
        h += '<td class="tot-cor">' + estoqueCor(p, ck) + '</td></tr>';
      });
      h += '</tbody></table></div></div>' +
        '<p class="mod-nota">Cada cor tem a própria grade. Mexer no 38 da índigo não muda o 38 das outras cores.</p>';
    }

    return h + '</div><div class="mod-pe">' +
      (novo ? '' : '<button type="button" class="btn btn-perigo btn-peq" data-acao="modal" data-v="excluir-produto" data-id="' + p.id + '">Excluir produto</button>') +
      '<span class="mod-esp"></span>' +
      '<button type="button" class="btn btn-sec" data-acao="fechar-modal">Cancelar</button>' +
      '<button type="submit" class="btn">' + (novo ? 'Criar produto' : 'Salvar') + '</button>' +
      '</div></form>';
  }

  function modalImportar() {
    return '<form id="fimportar"><div class="mod-corpo">' +
      '<p class="mod-nota">Uma linha por modelo, separada por ponto e vírgula:<br>' +
      '<code>referência;nome;preço;categoria;tecido;tabela;cores;tamanho:qtd,tamanho:qtd</code><br>' +
      'Tabelas: ' + Object.keys(TABELAS).join(', ') + '.<br>' +
      'A quantidade informada vale para cada cor da linha.</p>' +
      '<label class="campo larga"><span>Linhas da planilha</span>' +
      '<textarea id="im-txt" rows="7" spellcheck="false">' + esc(CSV_EXEMPLO) + '</textarea></label>' +
      '<p class="mod-nota">No sistema de verdade isso vira upload de .xlsx ou .csv. Aqui o texto já é lido de verdade: pode editar as linhas antes de importar.</p>' +
      '</div><div class="mod-pe"><span class="mod-esp"></span>' +
      '<button type="button" class="btn btn-sec" data-acao="fechar-modal">Cancelar</button>' +
      '<button type="submit" class="btn">Importar</button></div></form>';
  }

  function modalConfirma(titulo, texto, acao, id, rotulo) {
    return '<div class="mod-corpo"><p class="mod-conf">' + texto + '</p></div>' +
      '<div class="mod-pe"><span class="mod-esp"></span>' +
      '<button type="button" class="btn btn-sec" data-acao="fechar-modal">Cancelar</button>' +
      '<button type="button" class="btn btn-perigo" data-acao="' + acao + '" data-id="' + id + '">' + rotulo + '</button></div>';
  }

  function modal() {
    if (!st.modal) return '';
    var m = st.modal, titulo = '', corpo = '', largo = false;

    if (m.tipo === 'produto') {
      var p = prod(m.id);
      if (!p) return '';
      titulo = 'Editar ' + p.nome;
      corpo = modalProduto(p);
    } else if (m.tipo === 'novo-produto') {
      titulo = 'Novo produto';
      corpo = modalProduto(null);
    } else if (m.tipo === 'importar') {
      titulo = 'Importar planilha';
      corpo = modalImportar();
    } else if (m.tipo === 'excluir-produto') {
      var pe = prod(m.id);
      if (!pe) return '';
      titulo = 'Excluir produto';
      corpo = modalConfirma(titulo,
        'O modelo <strong>' + esc(pe.nome) + '</strong> sai do catálogo e do cadastro. Os pedidos antigos que têm esse modelo continuam como estão.',
        'excluir-produto', pe.id, 'Excluir produto');
    } else if (m.tipo === 'cliente') {
      var cc = cli(m.id);
      if (!cc) return '';
      titulo = cc.nome;
      largo = true;
      corpo = modalCliente(cc);
    } else if (m.tipo === 'banner') {
      if (!st.banRasc) return '';
      titulo = st.banRasc.id ? 'Editar banner' : 'Novo banner';
      largo = true;
      corpo = modalBanner();
    } else if (m.tipo === 'excluir-banner') {
      var bx = ban(m.id);
      if (!bx) return '';
      titulo = 'Excluir banner';
      corpo = modalConfirma(titulo,
        'O banner <strong>' + esc(bx.titulo || 'só com imagem') + '</strong> sai da capa e da lista. Para tirar só da capa, use <strong>Ocultar</strong>.',
        'ban-excluir', bx.id, 'Excluir banner');
    } else if (m.tipo === 'enviar-conf') {
      var pe2 = ped(m.id);
      if (!pe2) return '';
      var ec = estadoConf(pe2);
      titulo = 'Enviar sem terminar a conferência?';
      corpo = '<div class="mod-corpo"><p class="mod-conf">' +
        (ec.comecou
          ? 'Foram conferidas <strong>' + ec.feitas + ' de ' + ec.total + ' peças</strong>. Se as que faltam não estão na prateleira, envie só o que foi separado: o pedido e o valor são ajustados e o cliente não paga pelo que não recebeu.'
          : 'A conferência do pedido <strong>nº ' + pe2.n + '</strong> não foi feita. Dá para enviar assim mesmo, mas ninguém confirmou que as ' + ec.total + ' peças saíram da prateleira.') +
        '</p>' + (ec.comecou ? '<p class="mod-nota">As peças que faltaram não voltam para o estoque do sistema, porque não estavam no estoque de verdade. Vale conferir o estoque desses modelos.</p>' : '') +
        '</div><div class="mod-pe"><span class="mod-esp"></span>' +
        '<button type="button" class="btn btn-sec" data-acao="fechar-modal">Voltar e conferir</button>' +
        (ec.comecou
          ? '<button type="button" class="btn btn-perigo" data-acao="enviar-com-falta" data-id="' + pe2.id + '">Enviar só o separado</button>'
          : '<button type="button" class="btn btn-perigo" data-acao="enviar-sem-conferir" data-id="' + pe2.id + '">Enviar sem conferir</button>') +
        '</div>';
    } else if (m.tipo === 'filtros') {
      var nl = filtrados().length;
      titulo = 'Filtrar';
      corpo = '<div class="mod-corpo mod-filtros">' + filtrosHTML() + '</div>' +
        '<div class="mod-pe">' + (nFiltros() ? '<button type="button" class="btn btn-sec" data-acao="fl-limpar">Limpar</button>' : '') +
        '<span class="mod-esp"></span><button type="button" class="btn" data-acao="fechar-modal">Ver ' + nl + (nl === 1 ? ' modelo' : ' modelos') + '</button></div>';
    } else if (m.tipo === 'suporte') {
      titulo = 'Entrar como suporte';
      corpo = modalSuporte();
    } else if (m.tipo === 'excluir-pedido') {
      var pd = ped(m.id);
      if (!pd) return '';
      titulo = 'Excluir pedido';
      corpo = modalConfirma(titulo,
        'O pedido <strong>nº ' + pd.n + '</strong> de ' + esc(pd.quem) + ' será apagado e as ' +
        pecasPedido(pd) + ' peças voltam para o estoque.',
        'excluir-pedido', pd.id, 'Excluir e devolver estoque');
    } else {
      return '';
    }

    return '<div class="mod-fundo" data-acao="fechar-modal"></div>' +
      '<div class="mod' + (largo ? ' mod-largo' : '') + '" role="dialog" aria-modal="true" aria-label="' + esc(titulo) + '">' +
        '<div class="mod-topo"><h3>' + esc(titulo) + '</h3>' +
        '<button class="mod-x" data-acao="fechar-modal" aria-label="Fechar">&times;</button></div>' +
        corpo + '</div>';
  }

  /* =================== desenho da tela =================== */

  function render(semAnimar) {
    var app = document.getElementById('app');
    var h;

    if (st.modo === 'catalogo') {
      var t = st.tela;
      // A capa sangra de ponta a ponta; o resto mora dentro de .cat-in.
      var miolo = t === 'entrar' ? telaEntrar() :
        t === 'produto' ? telaProduto() :
        t === 'carrinho' ? telaCarrinho() :
        t === 'fechar' ? telaFechar() :
        t === 'cadastro' ? telaCadastro() :
        t === 'cadastrado' ? telaCadastrado() :
        t === 'enviado' ? telaEnviado() :
        t === 'conta' ? telaConta() :
        t === 'meu-pedido' ? telaMeuPedido() : telaVitrine();
      // A capa é da entrada. Em busca ou categoria ela sai e a página
      // começa pelo título, como numa loja de verdade. Com banner ativo, a
      // capa é o carrossel do lojista; sem nenhum, volta a capa desenhada.
      var naCapa = t === 'vitrine' && !st.busca && st.filtro === 'todos' && !nFiltros();
      h = '<div class="tela-cat">' + topoLoja() +
        (naCapa ? (bannersAtivos().length ? carrossel() + faixaLoja() : capaColecao()) : '') +
        '<div class="cat-in' + (semAnimar ? '' : ' entra') + '">' + avisoPainel() + miolo + '</div>' +
        rodapeLoja() + '</div>';
    } else if (st.modo === 'op') {
      h = barraOp() + '<div class="tela-pnl' + (semAnimar ? '' : ' entra') + '">' + avisoPainel() + painelOp() + '</div>';
    } else {
      var conteudo = st.pnl === 'pedidos' ? painelPedidos() :
        st.pnl === 'detalhe' ? painelDetalhe() :
        st.pnl === 'produtos' ? painelProdutos() :
        st.pnl === 'clientes' ? painelClientes() :
        st.pnl === 'vitrine' ? painelVitrine() :
        st.pnl === 'ajustes' ? painelAjustes() : painelInicio();
      var aba = st.pnl === 'detalhe' ? 'pedidos' : st.pnl;
      h = faixaSuporte() + barrasPainel(aba) + '<div class="tela-pnl' + (semAnimar ? '' : ' entra') + '">' +
        avisoPainel() + conteudo + '</div>';
    }

    app.innerHTML = h + gaveta() + modal();

    // Gaveta ou modal aberto: trava a rolagem do fundo.
    document.body.classList.toggle('travado', !!(st.menu || st.modal));

    var btns = document.querySelectorAll('.demo-btn');
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute('aria-pressed', btns[i].getAttribute('data-v') === st.modo ? 'true' : 'false');
    }

    var f = document.getElementById('fentrar');
    if (f) {
      var fc = document.getElementById('cnpj');
      fc.addEventListener('input', function () { fc.value = fmtCnpj(fc.value); });
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        if (soDigitos(fc.value)) {
          var quem = clientePorCnpj(fc.value);
          if (!quem) {
            document.getElementById('entrar-erro').textContent = 'Não achamos cadastro com esse CNPJ. Confira ou cadastre sua loja.';
            fc.setAttribute('aria-invalid', 'true'); fc.focus();
            return;
          }
          if (quem.id !== EU.id) trocarEu(quem.id);
        }
        st.logado = true;
        restaurarCarrinho();
        st.tela = 'vitrine';
        render();
      });
    }

    // Busca do catálogo e busca do painel: redesenha e devolve o cursor.
    [['qbusca', 'busca'], ['qpnl', 'pnlBusca'], ['qcli', 'cliBusca']].forEach(function (par) {
      var el = document.getElementById(par[0]);
      if (!el) return;
      el.addEventListener('input', function () {
        st[par[1]] = el.value;
        render(true);
        var novo = document.getElementById(par[0]);
        if (novo) { novo.focus(); novo.setSelectionRange(novo.value.length, novo.value.length); }
      });
    });

    var fa = document.getElementById('fajustes');
    if (fa) fa.addEventListener('submit', salvarAjustes);

    var fpg = document.getElementById('fpagamento');
    if (fpg) fpg.addEventListener('submit', salvarPagamento);

    var fco = document.getElementById('fcolecao');
    if (fco) fco.addEventListener('submit', criarColecao);

    var fop = document.getElementById('fop');
    if (fop) fop.addEventListener('submit', novaConfeccao);

    var fsp = document.getElementById('fsuporte');
    if (fsp) fsp.addEventListener('submit', entrarSuporte);

    var so = document.getElementById('cli-ordem');
    if (so) so.addEventListener('change', function () { st.cliOrdem = so.value; render(true); });

    var fd = document.getElementById('fdados');
    if (fd) fd.addEventListener('submit', salvarDados);

    var ft = document.getElementById('ftabela');
    if (ft) ft.addEventListener('submit', criarTabela);

    var fp = document.getElementById('fproduto');
    if (fp) fp.addEventListener('submit', salvarProduto);

    var fi = document.getElementById('fimportar');
    if (fi) fi.addEventListener('submit', importarPlanilha);

    var vt = document.getElementById('vt-troca');
    if (vt) vt.addEventListener('change', function () {
      LOJA.trocaSeg = +vt.value;
      st.aviso = { txt: LOJA.trocaSeg ? 'Os banners trocam a cada ' + LOJA.trocaSeg + ' segundos.' : 'Os banners só trocam pelas setas e pelo dedo.' };
      render(true);
    });

    ligarCartao();

    var fcad = document.getElementById('fcadastro');
    if (fcad) {
      fcad.addEventListener('submit', enviarCadastro);
      var ccn = document.getElementById('cd-cnpj');
      ccn.addEventListener('input', function () { ccn.value = fmtCnpj(ccn.value); });
      var cfo = document.getElementById('cd-fone');
      cfo.addEventListener('blur', function () { if (soDigitos(cfo.value).length >= 10) cfo.value = fmtFone(cfo.value); });
    }

    var fb = document.getElementById('fbanner');
    if (fb) fb.addEventListener('submit', salvarBanner);

    ligarCarrossel();

    // Formulario: o cursor ja entra no primeiro campo. Ficha do cliente:
    // o foco vai para o X, senao a janela abre rolada ate as anotacoes.
    var prim = document.querySelector('.mod-largo .mod-x') ||
      document.querySelector('.mod input, .mod textarea, .mod .btn-sec');
    var chaveMod = st.modal ? st.modal.tipo + '|' + st.modal.id : '';
    if (prim && st.focoFeito !== chaveMod) prim.focus({ preventScroll: true });
    st.focoFeito = chaveMod;

    // Abriu a busca no celular: o cursor já entra no campo.
    if (st.buscaAberta && st.focarBusca) {
      st.focarBusca = false;
      var qb = document.getElementById('qbusca');
      if (qb) qb.focus();
    }
  }

  /* =================== salvar e importar =================== */

  function num(id, pad) {
    var el = document.getElementById(id);
    var v = parseFloat(String(el ? el.value : '').replace(',', '.'));
    return isNaN(v) ? pad : v;
  }
  function txt(id, pad) {
    var el = document.getElementById(id);
    var v = el ? el.value.trim() : '';
    return v || pad;
  }

  function salvarAjustes(e) {
    e.preventDefault();
    LOJA.nome = txt('aj-nome', LOJA.nome);
    LOJA.cidade = txt('aj-cidade', LOJA.cidade);
    LOJA.colecao = txt('aj-colecao', LOJA.colecao);
    LOJA.chamada = txt('aj-chamada', LOJA.chamada);
    LOJA.minimo = Math.max(0, num('aj-minimo', LOJA.minimo));
    LOJA.minTipo = txt('aj-mintipo', LOJA.minTipo);
    LOJA.minPecas = Math.max(0, Math.round(num('aj-minpecas', LOJA.minPecas)));
    LOJA.minModelo = Math.max(0, Math.round(num('aj-minmodelo', LOJA.minModelo)));
    st.aviso = { txt: 'Ajustes salvos. O catálogo já está com os dados novos.' };
    render(true);
  }

  // Guarda o que já foi digitado no modal antes de redesenhar (troca de
  // imagem redesenha o modal e apagaria os campos).
  function lerFormBanner() {
    var r = st.banRasc;
    if (!r || !document.getElementById('fbanner')) return;
    ['tag', 'titulo', 'sub', 'botao', 'destino', 'foco'].forEach(function (c) {
      var el = document.getElementById('bn-' + c);
      if (el) r[c] = el.value.trim();
    });
    var cx = document.getElementById('bn-texto');
    if (cx) r.texto = cx.checked;
  }

  function salvarBanner(e) {
    e.preventDefault();
    lerFormBanner();
    var r = st.banRasc;
    if (!r.img && !r.arte) {
      st.aviso = { txt: 'Escolha a imagem do banner antes de salvar.', erro: true };
      render(true); return;
    }
    if (r.texto && !r.titulo && !r.sub) r.texto = false;
    var dados = { arte: r.arte, img: r.img, imgMob: r.imgMob, tag: r.tag, titulo: r.titulo, sub: r.sub,
      botao: r.botao, destino: r.destino, texto: r.texto, foco: r.foco || 'centro' };
    var b = r.id ? ban(r.id) : null;
    if (b) {
      for (var c in dados) b[c] = dados[c];
      st.aviso = { txt: 'Banner salvo.' + (b.ativo ? ' A capa do catálogo já está com a versão nova.' : '') };
    } else {
      dados.id = 'b' + (++uid);
      dados.ativo = true;
      BANNERS.push(dados);
      st.aviso = { txt: 'Banner novo na capa. Ele entra no fim da fila: use as setas para mudar a ordem.' };
    }
    st.modal = null; st.banRasc = null; st.slide = 0;
    render(true);
  }

  /* ---------- movimento do carrossel ---------- */

  var timerCarr = null, carrParado = false, arrastouEm = 0;

  function irSlide(i) {
    var n = bannersAtivos().length;
    if (!n) return;
    st.slide = ((i % n) + n) % n;
    var tr = document.querySelector('.carr-trilho');
    if (!tr) return;
    tr.style.transform = 'translateX(' + (-st.slide * 100) + '%)';
    var sl = tr.querySelectorAll('.slide');
    for (var j = 0; j < sl.length; j++) {
      var on = j === st.slide;
      if (on) sl[j].removeAttribute('aria-hidden'); else sl[j].setAttribute('aria-hidden', 'true');
      var bts = sl[j].querySelectorAll('button');
      for (var q = 0; q < bts.length; q++) { if (on) bts[q].removeAttribute('tabindex'); else bts[q].setAttribute('tabindex', '-1'); }
    }
    var pts = document.querySelectorAll('.carr-pontos button');
    for (var k = 0; k < pts.length; k++) {
      if (k === st.slide) pts[k].setAttribute('aria-current', 'true'); else pts[k].removeAttribute('aria-current');
    }
  }

  function ligarTimer() {
    clearInterval(timerCarr); timerCarr = null;
    if (!document.querySelector('.carr') || bannersAtivos().length < 2 || !LOJA.trocaSeg) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    timerCarr = setInterval(function () {
      if (carrParado || document.hidden || st.modal || st.menu) return;
      irSlide(st.slide + 1);
    }, LOJA.trocaSeg * 1000);
  }

  // Pausa com o mouse em cima ou com o foco dentro; troca com o dedo.
  function ligarCarrossel() {
    var c = document.querySelector('.carr');
    carrParado = false;
    if (c) {
      c.addEventListener('mouseenter', function () { carrParado = true; });
      c.addEventListener('mouseleave', function () { carrParado = false; });
      c.addEventListener('focusin', function () { carrParado = true; });
      c.addEventListener('focusout', function () { carrParado = false; });
      var x0 = null, y0 = null;
      c.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
      c.addEventListener('touchend', function (e) {
        if (x0 === null) return;
        var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
        x0 = null;
        if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy)) return;
        arrastouEm = Date.now();
        irSlide(st.slide + (dx < 0 ? 1 : -1));
        ligarTimer();
      });
    }
    ligarTimer();
  }

  function novaConfeccao(e) {
    e.preventDefault();
    var nome = txt('op-nome', '');
    if (!nome) return;
    CONFECCOES.push({
      id: 't' + (++uid), nome: nome, cidade: txt('op-cidade', 'Cidade a definir'), plano: txt('op-plano', 'basico'),
      desde: dataHora().data.split(' ')[1] + ' ' + new Date().getFullYear(), sit: 'impl', cob: 'impl', pedidos: 0, produtos: 0,
      etapas: { contrato: false, impl: false, produtos: false, vitrine: false, whats: false, treino: false }
    });
    st.aviso = { txt: nome + ' entrou em implantação. Marque as etapas conforme forem ficando prontas.' };
    render(true);
  }

  function entrarSuporte(e) {
    e.preventDefault();
    var motivo = txt('sp-motivo', '');
    if (!motivo) return;
    var dh = dataHora();
    ACESSOS.unshift({ conf: 'alecrim', quem: 'Suporte 42.dev', motivo: motivo.replace(/\.$/, ''), data: dh.data, ini: dh.hora, fim: null });
    st.suporte = true; st.modal = null; st.modo = 'painel'; st.pnl = 'inicio';
    window.scrollTo(0, 0);
    render();
  }

  function criarColecao(e) {
    e.preventDefault();
    var nome = txt('co-nome', '');
    if (!nome) return;
    if (COLECOES.some(function (c) { return semAcento(c.nome) === semAcento(nome); })) {
      st.aviso = { txt: 'Já existe uma coleção com esse nome.', erro: true };
    } else {
      COLECOES.push({ id: 'col' + (++uid), nome: nome });
      st.aviso = { txt: 'Coleção ' + nome + ' criada. Marque os produtos dela em Editar.' };
    }
    render(true);
  }

  function salvarPagamento(e) {
    e.preventDefault();
    var w = txt('aj-whats', '');
    if (w && soDigitos(w).length < 10) {
      st.aviso = { txt: 'O WhatsApp precisa ter DDD e número. Ex: (81) 9 0000-0000.', erro: true };
      render(true); return;
    }
    LOJA.whats = w;
    if (LOJA.plano === 'pro') {
      LOJA.descontoPix = Math.min(20, Math.max(0, num('aj-pix', LOJA.descontoPix)));
      LOJA.jurosMes = Math.min(10, Math.max(0, num('aj-juros', LOJA.jurosMes)));
      LOJA.parcMax = +txt('aj-parcmax', LOJA.parcMax);
      // Sem juros nunca passa do máximo.
      LOJA.parcSemJuros = Math.min(+txt('aj-semjuros', LOJA.parcSemJuros), LOJA.parcMax);
    }
    st.aviso = { txt: 'Pagamento salvo. O catálogo já fecha pedido com os dados novos.' };
    render(true);
  }

  function salvarDados(e) {
    e.preventDefault();
    var eu = euCliente();
    var antigo = eu.nome;
    eu.nome = txt('me-nome', eu.nome);
    eu.doc = txt('me-doc', eu.doc);
    eu.cidade = txt('me-cidade', eu.cidade);
    EU.responsavel = txt('me-resp', EU.responsavel);
    EU.fone = txt('me-fone', EU.fone);
    EU.email = txt('me-email', EU.email);
    EU.endereco = txt('me-end', EU.endereco);
    // Os pedidos antigos continuam sendo meus mesmo se a razão social mudou.
    if (antigo !== eu.nome) {
      PEDIDOS.forEach(function (p) {
        if (p.quem === antigo) { p.quem = eu.nome; p.cidade = eu.cidade; }
      });
    }
    st.aviso = { txt: 'Dados salvos.' };
    render(true);
  }

  function criarTabela(e) {
    e.preventDefault();
    var nome = txt('tb-nome', '');
    var tams = (document.getElementById('tb-tams').value || '').split(',')
      .map(function (t) { return t.trim(); })
      .filter(function (t) { return t; });

    if (!nome || !tams.length) {
      st.aviso = { txt: 'Dê um nome à tabela e liste pelo menos um tamanho.', erro: true };
      return render(true);
    }

    var chave = semAcento(nome).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || ('tab' + Date.now());
    if (TABELAS[chave]) {
      st.aviso = { txt: 'Já existe uma tabela com esse nome.', erro: true };
      return render(true);
    }

    TABELAS[chave] = { nome: nome, tams: tams, fixa: false };
    st.aviso = { txt: 'Tabela ' + nome + ' criada com ' + tams.length + ' tamanhos.' };
    render(true);
  }

  // Repetir pedido: devolve a grade para o carrinho, limitada ao estoque
  // de hoje, e avisa o que não coube.
  function repetir(pedido) {
    var fora = [], cortados = [];
    pedido.itens.forEach(function (it) {
      var p = prod(it.id);
      if (!p || p.visivel === false) { fora.push(it.id); return; }
      var apertou = false;
      tamsDe(p).forEach(function (t) {
        var q = it.g[t];
        if (!q) return;
        var k = p.id + '|' + it.cor + '|' + t;
        var jaTem = st.carrinho[k] || 0;
        var cabe = Math.max(0, est(p, it.cor, t) - jaTem);
        var pos = Math.min(q, cabe);
        if (pos < q) apertou = true;
        if (pos > 0) st.carrinho[k] = jaTem + pos;
      });
      if (apertou) cortados.push(p.nome);
    });

    var partes = [];
    if (fora.length) partes.push(fora.length + ' modelo(s) saíram do catálogo');
    if (cortados.length) partes.push('estoque menor em ' + cortados.join(', '));
    return partes;
  }

  var FUNDOS = ['#EAE5D6', '#F0EADB', '#E8E3D3', '#EDE6D5', '#E7E1D0', '#F0EBDC', '#EAE4D4', '#EDE7D7'];

  function salvarProduto(e) {
    e.preventDefault();
    var id = e.currentTarget.getAttribute('data-id');
    var p = id ? prod(id) : null;

    var cores = [].slice.call(document.querySelectorAll('.pr-cor:checked')).map(function (c) { return c.value; });
    if (!cores.length) cores = ['indigo'];
    var tags = [].slice.call(document.querySelectorAll('.pr-col:checked')).map(function (c) { return c.value; });
    var grade = TABELAS[txt('pr-grade', 'num-fem')] ? txt('pr-grade', 'num-fem') : 'num-fem';

    if (p) {
      p.nome = txt('pr-nome', p.nome);
      p.ref = txt('pr-ref', p.ref);
      p.preco = Math.max(0, num('pr-preco', p.preco));
      p.cat = txt('pr-cat', p.cat);
      p.forma = txt('pr-forma', p.forma);
      p.tecido = txt('pr-tecido', p.tecido);
      p.cores = cores;
      p.tags = tags;

      [].slice.call(document.querySelectorAll('.pr-est')).forEach(function (el) {
        var v = parseInt(el.value, 10);
        p.est[el.getAttribute('data-sku')] = isNaN(v) || v < 0 ? 0 : v;
      });

      // Trocar a tabela de tamanhos remapeia o estoque: o que existe nos
      // dois lados é mantido, o resto entra zerado.
      if (grade !== p.grade) {
        var antes = p.est, depois = {};
        p.grade = grade;
        cores.forEach(function (ck) {
          TABELAS[grade].tams.forEach(function (t) { depois[sku(ck, t)] = antes[sku(ck, t)] || 0; });
        });
        p.est = depois;
      } else {
        // Cor nova entra com a grade zerada; cor retirada some do estoque.
        var limpo = {};
        cores.forEach(function (ck) {
          tamsDe(p).forEach(function (t) { limpo[sku(ck, t)] = p.est[sku(ck, t)] || 0; });
        });
        p.est = limpo;
      }

      if (st.corSel[p.id] && cores.indexOf(st.corSel[p.id]) < 0) delete st.corSel[p.id];
      // Tira do carrinho SKU que deixou de existir.
      Object.keys(st.carrinho).forEach(function (kk) {
        var pt = kk.split('|');
        if (pt[0] === p.id && p.est[sku(pt[1], pt[2])] === undefined) delete st.carrinho[kk];
      });

      st.aviso = { txt: p.nome + ' salvo. Estoque total: ' + estoqueTotal(p) + ' peças em ' + cores.length + (cores.length === 1 ? ' cor.' : ' cores.') };
    } else {
      var novo = {
        id: 'p' + (st.proxId++),
        nome: txt('pr-nome', 'Modelo sem nome'),
        ref: txt('pr-ref', 'AL-0000'),
        preco: Math.max(0, num('pr-preco', 0)),
        cat: txt('pr-cat', 'calcas'),
        forma: txt('pr-forma', 'calca'),
        tecido: txt('pr-tecido', 'jeans'),
        grade: grade,
        cores: cores,
        fundo: FUNDOS[PRODUTOS.length % FUNDOS.length],
        novo: true,
        visivel: true,
        tags: tags,
        est: montaEst(cores, TABELAS[grade].tams, [])
      };
      PRODUTOS.push(novo);
      st.aviso = { txt: novo.nome + ' criado com ' + cores.length + (cores.length === 1 ? ' cor' : ' cores') + '. Abra em Editar para lançar o estoque.' };
    }

    st.modal = null;
    render(true);
  }

  function importarPlanilha(e) {
    e.preventDefault();
    var linhas = (document.getElementById('im-txt').value || '').split('\n');
    var entraram = 0, pulou = 0;

    // ref ; nome ; preço ; categoria ; tecido ; tabela ; cores ; grade
    // A quantidade informada vale para cada cor da linha.
    linhas.forEach(function (linha) {
      var c = linha.split(';');
      if (c.length < 8 || !c[0].trim()) { if (linha.trim()) pulou++; return; }

      var tabela = c[5].trim();
      if (!TABELAS[tabela]) { pulou++; return; }

      var cores = c[6].split(',').map(function (x) { return x.trim(); })
        .filter(function (x) { return CORES[x]; });
      if (!cores.length) { pulou++; return; }

      var qtd = {};
      c[7].split(',').forEach(function (par) {
        var pt = par.split(':');
        var q = parseInt(pt[1], 10);
        var t = (pt[0] || '').trim();
        if (t) qtd[t] = isNaN(q) || q < 0 ? 0 : q;
      });
      if (!Object.keys(qtd).length) { pulou++; return; }

      var estoque = {};
      cores.forEach(function (ck) {
        TABELAS[tabela].tams.forEach(function (t) { estoque[sku(ck, t)] = qtd[t] || 0; });
      });

      var preco = parseFloat(c[2].replace(',', '.'));
      var cat = c[3].trim() || 'calcas';
      var tecido = c[4].trim();
      // O desenho sai da categoria: a planilha do lojista não traz isso.
      var forma = cat === 'shorts' ? 'short' : cat === 'jaquetas' ? 'jaqueta' :
        cat === 'saias' ? 'saia' : cat === 'vestidos' ? 'vestido' :
        cat === 'camisas' ? (tecido === 'malha' ? 'camiseta' : 'camisa') : 'calca';

      PRODUTOS.push({
        id: 'p' + (st.proxId++),
        ref: c[0].trim(),
        nome: c[1].trim(),
        preco: isNaN(preco) ? 0 : preco,
        cat: cat,
        forma: forma,
        tecido: TECIDOS.some(function (t) { return t[0] === tecido; }) ? tecido : 'plano',
        grade: tabela,
        cores: cores,
        fundo: FUNDOS[PRODUTOS.length % FUNDOS.length],
        novo: true,
        visivel: true,
        est: estoque
      });
      entraram++;
    });

    st.modal = null;
    st.aviso = entraram
      ? { txt: entraram + (entraram === 1 ? ' modelo importado' : ' modelos importados') + (pulou ? ' . ' + pulou + ' linha(s) fora do formato' : '') + '.' }
      : { txt: 'Nenhuma linha no formato esperado. Confira os pontos e vírgulas.', erro: true };
    render(true);
  }

  /* =================== ações =================== */

  // Excluir pedido devolve as peças para a grade de cada produto.
  function devolverEstoque(pedido) {
    pedido.itens.forEach(function (it) {
      var p = prod(it.id);
      if (!p) return;
      tamsDe(p).forEach(function (t) {
        if (it.g[t]) setEst(p, it.cor, t, est(p, it.cor, t) + it.g[t]);
      });
    });
  }

  function baixarEstoque() {
    for (var k in st.carrinho) {
      var q = st.carrinho[k];
      if (!q) continue;
      var pt = k.split('|'), p = prod(pt[0]);
      if (!p) continue;
      setEst(p, pt[1], pt[2], est(p, pt[1], pt[2]) - q);
    }
  }

  // Um ouvinte só, delegado. Cada botão diz o que faz pelo data-acao.
  document.addEventListener('click', function (e) {
    var alvo = e.target.closest('[data-acao]');
    if (!alvo) return;
    var a = alvo.getAttribute('data-acao');
    var id = alvo.getAttribute('data-id');
    var k = alvo.getAttribute('data-k');
    var v = alvo.getAttribute('data-v');
    var topo = true;

    // Arrastar o banner com o dedo não pode valer como toque no botão dele.
    if (alvo.closest('.carr') && Date.now() - arrastouEm < 400) return;

    // Setas e pontos do carrossel só movem o trilho: nada de redesenhar.
    if (a === 'slide') {
      irSlide(v === '+1' ? st.slide + 1 : v === '-1' ? st.slide - 1 : +v);
      ligarTimer();
      return;
    }

    if (a === 'modo') {
      st.modo = v;
    } else if (a === 'ir-entrar') {
      guardarCadastro();
      st.tela = 'entrar';
    } else if (a === 'ir-cadastro') {
      st.tela = 'cadastro';
    } else if (a === 'cad-exemplo') {
      preencherExemplo();
      topo = false;
    } else if (a === 'sair') {
      guardarCarrinho();
      st.logado = false; st.carrinho = {}; st.favoritos = {}; st.tela = 'vitrine';
    } else if (a === 'voltar-vitrine') {
      st.tela = 'vitrine';
    } else if (a === 'inicio-loja') {
      // A logo leva sempre para a página inicial, com a capa.
      st.tela = 'vitrine'; st.filtro = 'todos'; st.busca = ''; st.buscaAberta = false; st.slide = 0;
      st.fl = { col: [], cor: [], tam: [], novos: false, preco: '' };
    } else if (a === 'abrir') {
      st.prod = id; st.vista = 'frente'; st.tela = 'produto';
    } else if (a === 'fav') {
      if (st.favoritos[id]) delete st.favoritos[id]; else st.favoritos[id] = true;
      topo = false;
    } else if (a === 'fl') {
      if (k === 'novos') st.fl.novos = !st.fl.novos;
      else if (k === 'preco') st.fl.preco = st.fl.preco === v ? '' : v;
      else {
        var arr = st.fl[k], ix = arr.indexOf(v);
        if (ix >= 0) arr.splice(ix, 1); else arr.push(v);
      }
      topo = false;
    } else if (a === 'fl-sec') {
      st.flFechado[v] = !st.flFechado[v];
      topo = false;
    } else if (a === 'fl-limpar') {
      st.fl = { col: [], cor: [], tam: [], novos: false, preco: '' };
      topo = false;
    } else if (a === 'filtro' && v && v.indexOf('col:') === 0) {
      // Banner que leva para uma coleção: catálogo inteiro filtrado nela.
      st.filtro = 'todos'; st.busca = '';
      st.fl = { col: [v.slice(4)], cor: [], tam: [], novos: false, preco: '' };
      st.tela = 'vitrine';
    } else if (a === 'filtro') {
      // A navegação de categoria também traz de volta para o catálogo.
      st.filtro = v; st.busca = '';
      topo = st.tela !== 'vitrine';
      st.tela = 'vitrine';
    } else if (a === 'ordem') {
      st.ordem = v; topo = false;
    } else if (a === 'vista') {
      st.vista = v; topo = false;
    } else if (a === 'cor') {
      st.corSel[id] = v; topo = false;
    } else if (a === 'mais' || a === 'menos') {
      var pt = k.split('|'), pr = prod(pt[0]), lim = 0;
      lim = est(pr, pt[1], pt[2]);
      var atual = st.carrinho[k] || 0;
      st.carrinho[k] = a === 'mais' ? Math.min(lim, atual + 1) : Math.max(0, atual - 1);
      if (!st.carrinho[k]) delete st.carrinho[k];
      topo = false;
    } else if (a === 'grade') {
      var pg = prod(id), lg = corDe(pg);
      tamsDe(pg).forEach(function (t) {
        var e = est(pg, lg, t);
        if (e === 0) return;
        var kk = pg.id + '|' + lg + '|' + t;
        st.carrinho[kk] = Math.min(e, (st.carrinho[kk] || 0) + 1);
      });
      topo = false;
    } else if (a === 'tirar') {
      Object.keys(st.carrinho).forEach(function (kk) {
        var pt2 = kk.split('|');
        if (pt2[0] + '|' + pt2[1] === k) delete st.carrinho[kk];
      });
      topo = false;
    } else if (a === 'ir-carrinho') {
      st.tela = 'carrinho';
    } else if (a === 'conta') {
      st.contaAba = v || 'pedidos';
      st.tela = 'conta';
    } else if (a === 'meu-ped') {
      st.meuPedido = id; st.tela = 'meu-pedido';
    } else if (a === 'repetir') {
      var pr2 = ped(id);
      if (pr2) {
        var problemas = repetir(pr2);
        st.tela = 'carrinho';
        st.aviso = problemas.length
          ? { txt: 'Peças somadas ao pedido, com ajuste: ' + problemas.join(' . ') + '.', erro: true }
          : { txt: 'Grade do pedido nº ' + pr2.n + ' somada ao seu pedido.' };
      }
    } else if (a === 'fechar') {
      if (!itensCarrinho().length || !checaMinimo().ok) return;
      st.tela = 'fechar'; st.pagForma = null; st.parcSel = 1; st.cc = null; st.ccErro = null;
    } else if (a === 'pag-forma') {
      // Pix e cartão trocam no lugar; WhatsApp é outra tela, sobe para o topo.
      guardarCartao();
      topo = v === 'whats' || st.pagForma === 'whats';
      st.pagForma = v; st.tela = 'fechar'; st.ccErro = null;
    } else if (a === 'enviar-whats' || a === 'copiar-msg') {
      // O link do WhatsApp abre numa aba nova; o pedido entra no painel
      // como a combinar, porque pagamento e frete se acertam na conversa.
      e.preventDefault();
      var msg = msgPedido();
      if (a === 'enviar-whats') window.open(linkWhats(msg), '_blank', 'noopener');
      else copiar(msg);
      st.ultimaMsg = msg;
      st.copiou = a === 'copiar-msg';
      registrarPedido({ forma: 'whats', sit: 'combinar', valor: totalCarrinho().valor });
    } else if (a === 'copiar-pix') {
      var cod = document.getElementById('pix-cod');
      if (cod) copiar(cod.value);
      st.aviso = { txt: 'Código Pix copiado. Cole no app do banco, na opção Pix copia e cola.' };
      topo = false;
    } else if (a === 'pix-pago') {
      var tPix = totalCarrinho().valor, vp = valorPix(tPix);
      st.copiou = false;
      registrarPedido({ forma: 'pix', sit: 'pago', valor: vp, desconto: tPix - vp });
    } else if (a === 'cc-teste') {
      preencherCartaoTeste();
      return;
    } else if (a === 'novo') {
      st.tela = 'vitrine';
    } else if (a === 'aba') {
      st.pnl = v;
    } else if (a === 'ped') {
      st.pedidoAberto = id; st.pnl = 'detalhe';
    } else if (a === 'avancar') {
      var pa = ped(id);
      if (pa && pa.sit === 'sep' && !estadoConf(pa).completo) {
        // Separação sem conferir tudo: pergunta antes de enviar.
        st.modal = { tipo: 'enviar-conf', id: pa.id };
      } else if (pa) {
        pa.sit = ORDEM_SIT[Math.min(ORDEM_SIT.length - 1, passoAtual(pa.sit) + 1)];
      }
      topo = false;
    } else if (a === 'conf-mais' || a === 'conf-menos' || a === 'conf-linha') {
      var pc = ped(id);
      if (pc) {
        pc.conf = pc.conf || {};
        var lim = linhasConf(pc).filter(function (x) { return x.k === k; })[0];
        var atualC = pc.conf[k] || 0;
        pc.conf[k] = a === 'conf-linha' ? lim.q : Math.max(0, Math.min(lim.q, atualC + (a === 'conf-mais' ? 1 : -1)));
      }
      topo = false;
    } else if (a === 'conf-tudo') {
      var pt = ped(id);
      if (pt) { pt.conf = {}; linhasConf(pt).forEach(function (x) { pt.conf[x.k] = x.q; }); }
      topo = false;
    } else if (a === 'conf-limpar') {
      var pz = ped(id);
      if (pz) pz.conf = {};
      topo = false;
    } else if (a === 'conf-imprimir') {
      // Copia a lista para fora do app: assim o papel sai só com ela,
      // sem folhas em branco do resto da página.
      var lista = document.querySelector('.conf-impressa');
      var dest = document.getElementById('impressao');
      if (!dest) { dest = document.createElement('div'); dest.id = 'impressao'; document.body.appendChild(dest); }
      dest.innerHTML = lista ? lista.innerHTML : '';
      window.print();
      return;
    } else if (a === 'enviar-sem-conferir') {
      var ps = ped(id);
      if (ps) { ps.sit = 'env'; st.aviso = { txt: 'Pedido nº ' + ps.n + ' enviado sem conferência.' }; }
      st.modal = null; topo = false;
    } else if (a === 'enviar-com-falta') {
      var pf = ped(id);
      if (pf) {
        var dif = enviarComFalta(pf);
        st.aviso = { txt: 'Pedido nº ' + pf.n + ' enviado com o que foi separado. ' +
          (dif > 0.004 ? 'O valor caiu ' + brl(dif) + '.' : '') };
      }
      st.modal = null; topo = false;
    } else if (a === 'voltar-etapa') {
      var pv = ped(id);
      if (pv) pv.sit = ORDEM_SIT[Math.max(0, passoAtual(pv.sit) - 1)];
      topo = false;
    } else if (a === 'pnl-sit') {
      st.pnlSit = v; topo = false;
    } else if (a === 'tab-apagar') {
      // Só apaga tabela criada pelo lojista e que nenhum produto usa.
      if (TABELAS[v] && TABELAS[v].fixa === false && !PRODUTOS.some(function (p) { return p.grade === v; })) {
        st.aviso = { txt: 'Tabela ' + TABELAS[v].nome + ' apagada.' };
        delete TABELAS[v];
      }
      topo = false;
    } else if (a === 'modal') {
      if (v === 'banner') {
        // O modal trabalha num rascunho: só vira banner ao salvar.
        var bb = id ? ban(id) : null;
        st.banRasc = bb ? JSON.parse(JSON.stringify(bb)) :
          { id: null, arte: null, img: null, imgMob: null, tag: '', titulo: '', sub: '', botao: '', destino: 'todos', texto: true, foco: 'centro' };
      }
      st.modal = { tipo: v, id: id }; st.obsSalva = null; topo = false;
    } else if (a === 'logo-topo') {
      LOJA.logoTopo = v; topo = false;
    } else if (a === 'logo-tam') {
      LOJA.logoTam = v; topo = false;
    } else if (a === 'logo-remover') {
      LOJA.logo = null; LOJA.logoTopo = 'nome';
      st.aviso = { txt: 'Logo removida. O topo do catálogo volta a mostrar o nome escrito.' };
      topo = false;
    } else if (a === 'ban-ativo') {
      var ba = ban(id);
      if (ba) {
        ba.ativo = !ba.ativo;
        st.aviso = { txt: ba.ativo ? 'Banner de volta na capa do catálogo.' : 'Banner oculto. Ele continua salvo aqui na lista.' };
      }
      st.slide = 0; topo = false;
    } else if (a === 'ban-excluir') {
      BANNERS = BANNERS.filter(function (b) { return b.id !== id; });
      st.modal = null; st.banRasc = null; st.slide = 0;
      st.aviso = { txt: 'Banner excluído.' };
      topo = false;
    } else if (a === 'ban-tira-mob') {
      lerFormBanner();
      st.banRasc.imgMob = null; topo = false;
    } else if (a === 'fechar-modal') {
      st.modal = null; st.banRasc = null; topo = false;
    } else if (a === 'op-plano') {
      var co = conf(id);
      if (co && confPlano(co) !== v) {
        if (co.id === 'alecrim') {
          LOJA.plano = v;
          st.pagForma = null;
          st.aviso = { txt: LOJA.nome + ' agora está no ' + PLANOS[v].nome + '. ' +
            (v === 'pro' ? 'O catálogo já fecha pedido com Pix e cartão.' : 'O catálogo volta a fechar pedido pelo WhatsApp.') };
        } else {
          co.plano = v;
          st.aviso = { txt: co.nome + ' passou para o ' + PLANOS[v].nome + '. A mensalidade nova vale a partir da próxima fatura.' };
        }
      }
      topo = false;
    } else if (a === 'op-pago') {
      var cp = conf(id);
      if (cp) { cp.cob = 'dia'; st.aviso = { txt: 'Mensalidade da ' + confNome(cp) + ' registrada como paga.' }; }
      topo = false;
    } else if (a === 'op-etapa') {
      var ce = conf(id);
      if (ce) ce.etapas[v] = !ce.etapas[v];
      topo = false;
    } else if (a === 'op-ativar') {
      var ca = conf(id);
      if (ca) {
        ca.sit = 'ativo'; ca.cob = 'dia';
        st.aviso = { txt: confNome(ca) + ' ativada. A primeira mensalidade vence no mês que vem.' };
      }
      topo = false;
    } else if (a === 'sair-suporte') {
      if (ACESSOS[0] && !ACESSOS[0].fim) ACESSOS[0].fim = dataHora().hora;
      st.suporte = null; st.modo = 'op';
      st.aviso = { txt: 'Acesso de suporte encerrado e registrado.' };
    } else if (a === 'col-destaque') {
      var cd = colecao(id);
      if (cd) {
        // Um selo só por vez, para o card não virar uma árvore de Natal.
        var liga = !cd.destaque;
        COLECOES.forEach(function (c) { c.destaque = false; });
        cd.destaque = liga;
        st.aviso = { txt: liga ? 'Os produtos de ' + cd.nome + ' ganham selo no catálogo.' : 'Selo de ' + cd.nome + ' retirado.' };
      }
      topo = false;
    } else if (a === 'col-apagar') {
      var ca2 = colecao(id);
      if (ca2) {
        COLECOES = COLECOES.filter(function (c) { return c.id !== id; });
        PRODUTOS.forEach(function (p) { p.tags = (p.tags || []).filter(function (t) { return t !== id; }); });
        st.fl.col = st.fl.col.filter(function (t) { return t !== id; });
        BANNERS.forEach(function (b) { if (b.destino === 'col:' + id) b.destino = 'todos'; });
        st.aviso = { txt: 'Coleção ' + ca2.nome + ' apagada. Os produtos continuam no catálogo.' };
      }
      topo = false;
    } else if (a === 'pag-marcar') {
      var pm = ped(id);
      if (pm) {
        pm.pag.sit = 'pago'; pm.pag.manual = true;
        st.aviso = { txt: 'Pedido nº ' + pm.n + ' marcado como pago.' };
      }
      topo = false;
    } else if (a === 'pag-desfazer') {
      var pd2 = ped(id);
      if (pd2) { pd2.pag.sit = 'combinar'; pd2.pag.manual = false; st.aviso = { txt: 'Pedido nº ' + pd2.n + ' voltou para a receber.' }; }
      topo = false;
    } else if (a === 'pag-link') {
      var pl = ped(id);
      if (pl) {
        // Endereço de demonstração: o domínio .demo não existe de propósito.
        pl.pag.sit = 'aguardando';
        pl.pag.link = 'https://pagar.lume.demo/' + pl.n + '-' + Math.random().toString(36).slice(2, 7).toUpperCase();
        st.aviso = { txt: 'Link de cobrança gerado para o pedido nº ' + pl.n + '. Copie e mande para o cliente.' };
      }
      topo = false;
    } else if (a === 'copiar-link') {
      var lk = document.getElementById('pag-link');
      if (lk) copiar(lk.value);
      st.aviso = { txt: 'Link copiado.' };
      topo = false;
    } else if (a === 'pag-link-pago') {
      var pp = ped(id);
      if (pp) {
        var vt = valorPedido(pp), vpx = valorPix(vt);
        pp.pag = { forma: 'pix', sit: 'pago', valor: vpx, desconto: vt - vpx };
        st.aviso = { txt: 'O cliente pagou o link no Pix. Pedido nº ' + pp.n + ' marcado como pago.' };
      }
      topo = false;
    } else if (a === 'cli-filtro') {
      // Clicar no filtro que já está ativo volta para Todos.
      st.cliFiltro = (st.cliFiltro === v && v !== 'todos') ? 'todos' : v;
      if (st.pnl !== 'clientes') { st.pnl = 'clientes'; } else { topo = false; }
    } else if (a === 'ficha-ped') {
      // Da ficha do cliente direto para o pedido.
      st.modal = null; st.pedidoAberto = id; st.pnl = 'detalhe';
    } else if (a === 'salvar-obs') {
      var co = cli(id), cx = document.getElementById('fi-obs');
      if (co && cx) { co.obs = cx.value.trim(); st.obsSalva = id; }
      topo = false;
    } else if (a === 'abrir-menu') {
      st.menu = v; topo = false;
    } else if (a === 'fechar-menu') {
      st.menu = null; topo = false;
    } else if (a === 'busca-mob') {
      st.buscaAberta = !st.buscaAberta;
      if (st.buscaAberta) st.focarBusca = true; else st.busca = '';
      topo = false;
    } else if (a === 'limpar-busca') {
      st.busca = ''; st.focarBusca = true; topo = false;
    } else if (a === 'visivel') {
      var pz = prod(id);
      if (pz) {
        pz.visivel = pz.visivel === false;
        st.aviso = { txt: pz.nome + (pz.visivel ? ' voltou para o catálogo.' : ' saiu do catálogo. O cadastro continua aqui.') };
      }
      topo = false;
    } else if (a === 'excluir-produto') {
      var px = prod(id);
      if (px) {
        PRODUTOS = PRODUTOS.filter(function (x) { return x.id !== id; });
        // Tira do carrinho o que não existe mais.
        Object.keys(st.carrinho).forEach(function (kk) {
          if (kk.split('|')[0] === id) delete st.carrinho[kk];
        });
        st.aviso = { txt: px.nome + ' excluído.' };
      }
      st.modal = null; topo = false;
    } else if (a === 'excluir-pedido') {
      var pz2 = ped(id);
      if (pz2) {
        devolverEstoque(pz2);
        PEDIDOS = PEDIDOS.filter(function (x) { return x.id !== id; });
        st.aviso = { txt: 'Pedido nº ' + pz2.n + ' excluído. ' + pecasPedido(pz2) + ' peças voltaram para o estoque.' };
      }
      st.modal = null;
      if (st.pnl === 'detalhe') st.pnl = 'pedidos';
    } else if (a === 'cli') {
      var cc = cli(id);
      if (cc) {
        cc.sit = v;
        st.aviso = { txt: cc.nome + ' . ' + SITC[v][0].toLowerCase() + '.' };
      }
      topo = false;
    } else {
      return;
    }

    // Qualquer escolha dentro da gaveta fecha a gaveta.
    if (a !== 'abrir-menu' && a !== 'busca-mob' && a !== 'limpar-busca') st.menu = null;

    if (topo) window.scrollTo(0, 0);
    render(!topo);
  });

  /* ---------- arrastar e soltar os banners ----------
     Feito com pointer events, então o mesmo código vale para mouse e dedo.
     A linha segue o ponteiro; as outras abrem espaço; ao soltar, a ordem
     nova vale para a capa. Perto da borda da tela a página rola sozinha. */

  var arr = null;

  function moverBanner(de, para) {
    if (de === para || de < 0 || para < 0 || para >= BANNERS.length) return false;
    var b = BANNERS.splice(de, 1)[0];
    BANNERS.splice(para, 0, b);
    st.slide = 0;
    st.aviso = { txt: 'Ordem salva: ' + (b.titulo || 'o banner') + ' agora é o ' + (para + 1) + 'º de ' + BANNERS.length + '.' };
    return true;
  }

  function seguirArrasto() {
    var dy = arr.yAtual + window.scrollY - arr.y0;
    dy = Math.max(arr.limSobe, Math.min(arr.limDesce, dy));
    arr.linha.style.transform = 'translateY(' + dy + 'px)';
    var centro = arr.meios[arr.de] + dy, para = arr.de;
    arr.meios.forEach(function (m, i) {
      // <= e >=: no limite da lista a linha encosta no meio da primeira
      // (ou da última), e isso já tem que valer como trocar de lugar.
      if (i < arr.de && centro <= m) para = Math.min(para, i);
      if (i > arr.de && centro >= m) para = Math.max(para, i);
    });
    arr.para = para;
    arr.linhas.forEach(function (l, i) {
      if (i === arr.de) return;
      var d = (arr.de < para && i > arr.de && i <= para) ? -arr.alt :
        (para < arr.de && i >= para && i < arr.de) ? arr.alt : 0;
      l.style.transform = d ? 'translateY(' + d + 'px)' : '';
    });
  }

  function rolarArrasto() {
    if (!arr) return;
    var y = arr.yAtual, m = 70, v = 0;
    if (y < m) v = -Math.ceil((m - y) / 5);
    else if (y > window.innerHeight - m) v = Math.ceil((y - (window.innerHeight - m)) / 5);
    if (v) { window.scrollBy(0, v); seguirArrasto(); }
    arr.raf = requestAnimationFrame(rolarArrasto);
  }

  document.addEventListener('pointerdown', function (e) {
    var pega = e.target.closest && e.target.closest('.ban-pega');
    if (!pega || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault();
    pega.focus({ preventScroll: true });
    var linhas = [].slice.call(document.querySelectorAll('.ban-linha'));
    var linha = pega.closest('.ban-linha');
    var sy = window.scrollY;
    var rs = linhas.map(function (l) { return l.getBoundingClientRect(); });
    var de = linhas.indexOf(linha);
    arr = {
      id: pega.getAttribute('data-pega'), linha: linha, linhas: linhas, de: de, para: de,
      y0: e.clientY + sy, yAtual: e.clientY, alt: rs[de].height,
      meios: rs.map(function (r) { return r.top + sy + r.height / 2; }),
      limSobe: rs[0].top - rs[de].top, limDesce: rs[rs.length - 1].bottom - rs[de].bottom
    };
    linha.classList.add('arrastando');
    document.body.classList.add('arrastando-ban');
    try { pega.setPointerCapture(e.pointerId); } catch (x) {}
    arr.raf = requestAnimationFrame(rolarArrasto);
  });

  document.addEventListener('pointermove', function (e) {
    if (!arr) return;
    arr.yAtual = e.clientY;
    seguirArrasto();
  });

  function soltarArrasto() {
    if (!arr) return;
    cancelAnimationFrame(arr.raf);
    var a = arr; arr = null;
    document.body.classList.remove('arrastando-ban');
    moverBanner(a.de, a.para);
    render(true);
    var foco = document.querySelector('.ban-pega[data-pega="' + a.id + '"]');
    if (foco) foco.focus({ preventScroll: true });
  }
  document.addEventListener('pointerup', soltarArrasto);
  document.addEventListener('pointercancel', soltarArrasto);

  document.addEventListener('keydown', function (e) {
    var pega = e.target.closest && e.target.closest('.ban-pega');
    if (!pega || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
    e.preventDefault();
    var id = pega.getAttribute('data-pega');
    var de = BANNERS.indexOf(ban(id));
    if (!moverBanner(de, de + (e.key === 'ArrowUp' ? -1 : 1))) return;
    render(true);
    var foco = document.querySelector('.ban-pega[data-pega="' + id + '"]');
    if (foco) foco.focus();
  });

  /* ---------- envio de imagem ----------
     No protótipo a imagem fica na memória, em base64. No sistema de verdade
     ela sobe para o Firebase Storage e o banner guarda só o endereço.
     Foto grande é reduzida antes, para o catálogo abrir rápido no 4G.    */

  function lerImagem(arq, larguraMax, cb) {
    var leitor = new FileReader();
    leitor.onload = function () {
      var src = leitor.result;
      if (arq.type === 'image/svg+xml') { cb(src); return; }
      var im = new Image();
      im.onload = function () {
        if (im.naturalWidth <= larguraMax) { cb(src); return; }
        var cv = document.createElement('canvas');
        cv.width = larguraMax;
        cv.height = Math.round(im.naturalHeight * larguraMax / im.naturalWidth);
        cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
        // PNG mantém o fundo transparente da logo; foto vira JPG, que pesa menos.
        cb(arq.type === 'image/png' && larguraMax <= 900 ? cv.toDataURL('image/png') : cv.toDataURL('image/jpeg', 0.86));
      };
      im.onerror = function () { st.aviso = { txt: 'Não deu para ler essa imagem. Tente um JPG ou PNG.', erro: true }; render(true); };
      im.src = src;
    };
    leitor.readAsDataURL(arq);
  }

  document.addEventListener('change', function (e) {
    var inp = e.target;
    var alvo = inp.getAttribute && inp.getAttribute('data-up');
    if (!alvo) return;
    var arq = inp.files && inp.files[0];
    if (!arq) return;
    if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(arq.type)) {
      st.aviso = { txt: 'Esse arquivo não é imagem. Use JPG, PNG, WEBP ou SVG.', erro: true };
      render(true); return;
    }
    if (arq.size > 10 * 1024 * 1024) {
      st.aviso = { txt: 'Imagem acima de 10 MB. Exporte numa resolução menor e tente de novo.', erro: true };
      render(true); return;
    }
    if (alvo !== 'logo') lerFormBanner();
    lerImagem(arq, alvo === 'logo' ? 900 : 2400, function (src) {
      if (alvo === 'logo') {
        LOJA.logo = { src: src }; LOJA.logoTopo = 'logo';
        st.aviso = { txt: 'Logo atualizada. Ela já aparece no topo do catálogo.' };
      } else if (st.banRasc) {
        if (alvo === 'ban-desk') { st.banRasc.img = src; st.banRasc.arte = null; }
        else st.banRasc.imgMob = src;
      }
      render(true);
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (st.modal) { st.modal = null; st.banRasc = null; render(true); }
    else if (st.menu) { st.menu = null; render(true); }
    else if (st.buscaAberta) { st.buscaAberta = false; st.busca = ''; render(true); }
  });

  render();
})();