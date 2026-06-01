// ====================================================================
// CONFIGURAÇÕES GLOBAIS
// ====================================================================
const ID_PASTA_ANEXOS_ACIDENTES = "1vvjL8WtPMJKYsMfWaUdzYHHbKisOwbwF"; 

// ====================================================================
// CRIAÇÃO DAS ABAS NECESSÁRIAS (executar uma vez)
// ====================================================================
function criarAbasAcidente() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (!ss.getSheetByName("Ocorrencias_acidentes")) {
    var sheet = ss.insertSheet("Ocorrencias_acidentes");
    sheet.appendRow(["ID", "Status", "DataCriacao", "DataAtualizacao", "FiscalCriador",
                     "DataAcidente", "HoraAcidente", "Local", "DescricaoAnalise",
                     "AnexosPrincipais", "Prefixo", "MotoristaChapa", "Finalizado"]);
  }
  if (!ss.getSheetByName("BensAvariados")) {
    var sheet2 = ss.insertSheet("BensAvariados");
    sheet2.appendRow(["ID_Acidente", "TipoBem", "Placa", "Ano", "Cor", "Modelo", "Renavan",
                      "Proprietario", "Telefone", "Danos", "Anexos"]);
  }
  if (!ss.getSheetByName("VitimasTestemunhas")) {
    var sheet3 = ss.insertSheet("VitimasTestemunhas");
    sheet3.appendRow(["ID_Acidente", "Tipo", "Nome", "Documento", "Contato", "Observacoes"]);
  }
}

// ====================================================================
// FUNÇÕES DE HASH (LOGIN)
// ====================================================================
function gerarHashComSalt(senha, salt) {
  const stringCombinada = senha + salt;
  const hashBytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, stringCombinada, Utilities.Charset.UTF_8);
  return hashBytes.map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
}

// ====================================================================
// LISTAR TERMINAIS (mantido)
// ====================================================================
function listarTerminais() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("Terminais");
    if (!sheet) {
      sheet = ss.insertSheet("Terminais");
      sheet.appendRow(["Terminal", "Status"]);
      sheet.appendRow(["Terminal A", "SIM"]);
      sheet.appendRow(["Terminal B", "SIM"]);
      sheet.appendRow(["Terminal C", "SIM"]);
      sheet.appendRow(["Terminal D", "SIM"]);
    }
    const dados = sheet.getDataRange().getValues();
    const terminais = [];
    for (let i = 1; i < dados.length; i++) {
      const terminal = dados[i][0];
      const status = dados[i][1] ? String(dados[i][1]).trim().toUpperCase() : "";
      if (terminal && status === "SIM") {
        terminais.push(String(terminal).trim());
      }
    }
    return terminais;
  } catch (err) {
    Logger.log("ERRO em listarTerminais: " + err.message);
    return ["Terminal A", "Terminal B", "Terminal C", "Terminal D"];
  }
}

function listarTodosTerminais() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("Terminais");
    if (!sheet) {
      sheet = ss.insertSheet("Terminais");
      sheet.appendRow(["Terminal", "Status"]);
      sheet.appendRow(["Terminal A", "SIM"]);
      sheet.appendRow(["Terminal B", "SIM"]);
      sheet.appendRow(["Terminal C", "SIM"]);
      sheet.appendRow(["Terminal D", "SIM"]);
    }
    const dados = sheet.getDataRange().getValues();
    const terminais = [];
    for (let i = 1; i < dados.length; i++) {
      const terminal = dados[i][0];
      if (terminal) terminais.push(String(terminal).trim());
    }
    return terminais;
  } catch (err) {
    return ["Terminal A", "Terminal B", "Terminal C", "Terminal D"];
  }
}

// ====================================================================
// FUNÇÕES DE CADASTRO (AUTOCOMPLETE)
// ====================================================================
function buscarVeiculoPorPrefixo(prefixo) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Cadastro_Veiculos");
  if (!sheet) return null;
  var dados = sheet.getDataRange().getValues();
  for (var i = 1; i < dados.length; i++) {
    if (String(dados[i][0]).toUpperCase() === String(prefixo).toUpperCase()) {
      return {
        prefixo: dados[i][0],
        placa: dados[i][1],
        renavam: dados[i][2],
        tipoVeiculo: dados[i][3],
        modeloChassi: dados[i][7],
        cor: dados[i][11]
      };
    }
  }
  return null;
}

function buscarOperadorPorChapaOuNome(termo) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Cadastro_operadores");
  if (!sheet) return [];
  var dados = sheet.getDataRange().getValues();
  var resultados = [];
  for (var i = 1; i < dados.length; i++) {
    var chapa = String(dados[i][0]);
    var nome = String(dados[i][1]);
    if (chapa === termo || nome.toLowerCase().includes(termo.toLowerCase())) {
      resultados.push({ chapa: chapa, nome: nome, apelido: dados[i][2], funcao: dados[i][4] });
    }
  }
  return resultados;
}

function buscarLinhas(termo) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Cadastro_Linhas");
  if (!sheet) return [];
  var dados = sheet.getDataRange().getValues();
  var resultados = [];
  for (var i = 1; i < dados.length; i++) {
    var descricao = String(dados[i][1]);
    var numero = String(dados[i][2]);
    if (descricao.toLowerCase().includes(termo.toLowerCase()) || numero.includes(termo)) {
      resultados.push({ id: dados[i][0], descricao: descricao, numero: numero });
    }
  }
  return resultados;
}

// ====================================================================
// TRUNCAR TEXTO
// ====================================================================
function truncarTexto(texto, maxCaracteres = 1400, maxLinhas = 16) {
  if (!texto) return '';
  let textoFinal = texto;
  let linhas = textoFinal.split(/\r?\n/);
  if (linhas.length > maxLinhas) {
    linhas = linhas.slice(0, maxLinhas);
    textoFinal = linhas.join('\n');
  }
  if (textoFinal.length > maxCaracteres) {
    textoFinal = textoFinal.substring(0, maxCaracteres);
    const ultimoEspaco = textoFinal.lastIndexOf(' ');
    if (ultimoEspaco > 0 && ultimoEspaco > maxCaracteres - 50) {
      textoFinal = textoFinal.substring(0, ultimoEspaco);
    }
  }
  return textoFinal;
}

// ====================================================================
// SALVAR RASCUNHO DE ACIDENTE (com segurança contra linhas vazias)
// ====================================================================
function salvarRascunhoAcidente(dados) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetOcorrencias = ss.getSheetByName("Ocorrencias_acidentes");
  var sheetBens = ss.getSheetByName("BensAvariados");
  var sheetPessoas = ss.getSheetByName("VitimasTestemunhas");
  
  // Garantir que as abas existam com cabeçalhos
  if (!sheetOcorrencias) {
    sheetOcorrencias = ss.insertSheet("Ocorrencias_acidentes");
    sheetOcorrencias.appendRow(["ID", "Status", "DataCriacao", "DataAtualizacao", "FiscalCriador",
                                "DataAcidente", "HoraAcidente", "Local", "DescricaoAnalise",
                                "AnexosPrincipais", "Prefixo", "MotoristaChapa", "Finalizado"]);
  }
  if (!sheetBens) {
    sheetBens = ss.insertSheet("BensAvariados");
    sheetBens.appendRow(["ID_Acidente", "TipoBem", "Placa", "Ano", "Cor", "Modelo", "Renavan",
                         "Proprietario", "Telefone", "Danos", "Anexos"]);
  }
  if (!sheetPessoas) {
    sheetPessoas = ss.insertSheet("VitimasTestemunhas");
    sheetPessoas.appendRow(["ID_Acidente", "Tipo", "Nome", "Documento", "Contato", "Observacoes"]);
  }
  
  var id = dados.id;
  var agora = Utilities.formatDate(new Date(), "America/Sao_Paulo", "dd/MM/yyyy HH:mm:ss");
  var fiscal = dados.fiscal;
  var status = dados.status || "EM_ANDAMENTO";
  
  // === Buscar linha existente (mais robusto) ===
  var lastRow = sheetOcorrencias.getLastRow();
  var linhaExistente = null;
  if (lastRow > 1) {
    var idsRange = sheetOcorrencias.getRange(2, 1, lastRow - 1, 1);
    var ids = idsRange.getValues().map(function(row) { return String(row[0]); });
    var index = ids.indexOf(String(id));
    if (index !== -1) {
      linhaExistente = index + 2; // +2 porque as linhas começam em 2 (1 é cabeçalho)
    }
  }
  
  var dataCriacao = linhaExistente ? sheetOcorrencias.getRange(linhaExistente, 3).getValue() : agora;
  
  var linhaDados = [
    id, status, dataCriacao, agora, fiscal,
    dados.dataAcidente || "", dados.horaAcidente || "", dados.local || "", truncarTexto(dados.descricaoAnalise || "", 1400, 16),
    dados.anexosPrincipais || "", dados.prefixo || "", dados.motoristaChapa || "", dados.finalizado ? "SIM" : "NÃO"
  ];
  
  if (linhaExistente) {
    sheetOcorrencias.getRange(linhaExistente, 1, 1, linhaDados.length).setValues([linhaDados]);
  } else {
    sheetOcorrencias.appendRow(linhaDados);
  }
  
  // === Bens (remove antigos e insere novos) ===
  if (sheetBens.getLastRow() > 1) {
    var allBens = sheetBens.getDataRange().getValues();
    for (var i = allBens.length - 1; i >= 1; i--) {
      if (String(allBens[i][0]) === String(id)) {
        sheetBens.deleteRow(i + 1);
      }
    }
  }
  if (dados.bens && dados.bens.length) {
    dados.bens.forEach(function(bem) {
      sheetBens.appendRow([id, bem.tipoBem, bem.placa, bem.ano, bem.cor, bem.modelo, bem.renavan,
                           bem.proprietario, bem.telefone, truncarTexto(bem.danos, 500, 5), bem.anexos || ""]);
    });
  }
  
  // === Pessoas ===
  if (sheetPessoas.getLastRow() > 1) {
    var allPessoas = sheetPessoas.getDataRange().getValues();
    for (var j = allPessoas.length - 1; j >= 1; j--) {
      if (String(allPessoas[j][0]) === String(id)) {
        sheetPessoas.deleteRow(j + 1);
      }
    }
  }
  if (dados.pessoas && dados.pessoas.length) {
    dados.pessoas.forEach(function(pessoa) {
      sheetPessoas.appendRow([id, pessoa.tipo, pessoa.nome, pessoa.documento, pessoa.contato, truncarTexto(pessoa.observacoes, 300, 5)]);
    });
  }
  
  return { success: true, id: id };
}
// ====================================================================
// CONSULTAR ACIDENTES
// ====================================================================
function consultarAcidentes(filtros, papel, apelido) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Ocorrencias_acidentes");
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var dados = sheet.getDataRange().getValues();
  
  var cabecalhos = dados[0];
  var idxId = cabecalhos.indexOf("ID");
  var idxStatus = cabecalhos.indexOf("Status");
  var idxFiscal = cabecalhos.indexOf("FiscalCriador");
  var idxDataAcidente = cabecalhos.indexOf("DataAcidente");
  var idxLocal = cabecalhos.indexOf("Local");
  var idxPrefixo = cabecalhos.indexOf("Prefixo");
  var idxMotoristaChapa = cabecalhos.indexOf("MotoristaChapa");
  var idxFinalizado = cabecalhos.indexOf("Finalizado");
  
  var resultados = [];
  
  for (var i=1; i<dados.length; i++) {
    var linha = dados[i];
    var fiscalLinha = linha[idxFiscal];
    var status = linha[idxStatus];
    var finalizado = linha[idxFinalizado] === "SIM";
    
    if (filtros.prefixo && linha[idxPrefixo] !== filtros.prefixo) continue;
    if (filtros.motorista && linha[idxMotoristaChapa] !== filtros.motorista) continue;
    if (filtros.dataInicio || filtros.dataFim) {
      var dataAcidenteStr = linha[idxDataAcidente];
      if (dataAcidenteStr) {
        var partes = dataAcidenteStr.split('/');
        if (partes.length === 3) {
          var dataRegistro = new Date(partes[2], partes[1]-1, partes[0]);
          if (filtros.dataInicio && dataRegistro < filtros.dataInicio) continue;
          if (filtros.dataFim && dataRegistro > filtros.dataFim) continue;
        }
      }
    }
    if (filtros.status && status !== filtros.status) continue;
    
    var permitido = false;
    switch(papel) {
      case 'ADMIN':
      case 'SAF':
      case 'ENCARREGADO':
        permitido = true;
        break;
      default:
        permitido = (fiscalLinha === apelido);
    }
    if (!permitido) continue;
    
    resultados.push({
      id: linha[idxId],
      status: status,
      finalizado: finalizado,
      fiscal: fiscalLinha,
      dataAcidente: linha[idxDataAcidente],
      local: linha[idxLocal],
      prefixo: linha[idxPrefixo],
      motorista: linha[idxMotoristaChapa]
    });
  }
  
  resultados.sort((a,b) => {
    var da = a.dataAcidente.split('/').reverse().join('');
    var db = b.dataAcidente.split('/').reverse().join('');
    return db.localeCompare(da);
  });
  return resultados;
}

// ====================================================================
// BUSCAR ACIDENTE POR ID
// ====================================================================
function buscarAcidentePorId(id) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetOcorrencias = ss.getSheetByName("Ocorrencias_acidentes");
  var sheetBens = ss.getSheetByName("BensAvariados");
  var sheetPessoas = ss.getSheetByName("VitimasTestemunhas");
  
  if (!sheetOcorrencias || sheetOcorrencias.getLastRow() <= 1) return null;
  var ocorrencias = sheetOcorrencias.getDataRange().getValues();
  var ocorrencia = null;
  for (var i=1; i<ocorrencias.length; i++) {
    if (ocorrencias[i][0] == id) {
      ocorrencia = {
        id: ocorrencias[i][0],
        status: ocorrencias[i][1],
        dataCriacao: ocorrencias[i][2],
        dataAtualizacao: ocorrencias[i][3],
        fiscal: ocorrencias[i][4],
        dataAcidente: ocorrencias[i][5],
        horaAcidente: ocorrencias[i][6],
        local: ocorrencias[i][7],
        descricaoAnalise: ocorrencias[i][8],
        anexosPrincipais: ocorrencias[i][9],
        prefixo: ocorrencias[i][10],
        motoristaChapa: ocorrencias[i][11],
        finalizado: ocorrencias[i][12] === "SIM"
      };
      break;
    }
  }
  if (!ocorrencia) return null;
  
  // Bens
  var bens = [];
  if (sheetBens && sheetBens.getLastRow() > 1) {
    var bensData = sheetBens.getDataRange().getValues();
    for (var j=1; j<bensData.length; j++) {
      if (bensData[j][0] == id) {
        bens.push({
          tipoBem: bensData[j][1], placa: bensData[j][2], ano: bensData[j][3],
          cor: bensData[j][4], modelo: bensData[j][5], renavan: bensData[j][6],
          proprietario: bensData[j][7], telefone: bensData[j][8], danos: bensData[j][9],
          anexos: bensData[j][10]
        });
      }
    }
  }
  ocorrencia.bens = bens;
  
  // Pessoas
  var pessoas = [];
  if (sheetPessoas && sheetPessoas.getLastRow() > 1) {
    var pessoasData = sheetPessoas.getDataRange().getValues();
    for (var k=1; k<pessoasData.length; k++) {
      if (pessoasData[k][0] == id) {
        pessoas.push({
          tipo: pessoasData[k][1], nome: pessoasData[k][2], documento: pessoasData[k][3],
          contato: pessoasData[k][4], observacoes: pessoasData[k][5]
        });
      }
    }
  }
  ocorrencia.pessoas = pessoas;
  return ocorrencia;
}

// ====================================================================
// UPLOAD DE ANEXOS (opcional)
// ====================================================================
function uploadAnexos(base64Array, idAcidente, prefixo) {
  var pasta = DriveApp.getFolderById(ID_PASTA_ANEXOS_ACIDENTES);
  var links = [];
  for (var i=0; i<base64Array.length; i++) {
    try {
      var anexo = base64Array[i];
      var dadosDecodificados = Utilities.base64Decode(anexo.base64);
      var sufixo = Utilities.formatDate(new Date(), "America/Sao_Paulo", "ddMMyyyy_HHmmss") + "_" + idAcidente + "_" + i;
      var extensao = anexo.mimeType.includes("pdf") ? ".pdf" : ".jpg";
      var nomeArquivo = (prefixo ? "Acidente_" + prefixo + "_" : "Acidente_") + sufixo + extensao;
      var blob = Utilities.newBlob(dadosDecodificados, anexo.mimeType, nomeArquivo);
      var arquivoDrive = pasta.createFile(blob);
      arquivoDrive.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      links.push(arquivoDrive.getUrl());
    } catch (err) {
      links.push("ERRO: " + err.message);
    }
  }
  return links;
}

// ====================================================================
// doPost
// ====================================================================
function doPost(e) {
  try {
    var { nome, acao, dados } = e.parameter;
    
    if (acao === "Login bem-sucedido" || (!dados && nome)) {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let logSheet = ss.getSheetByName("Log_Acessos");
      if (!logSheet) {
        logSheet = ss.insertSheet("Log_Acessos");
        logSheet.appendRow(["Data e Hora", "Apelido", "Nome Completo", "Cargo/Função", "Ação"]);
      }
      const sheetLogin = ss.getSheetByName("login");
      const data = sheetLogin.getDataRange().getValues();
      let nomeCompleto = "Não encontrado";
      let cargo = "Não informado";
      for (let i = 1; i < data.length; i++) {
        if (data[i][2] === nome) {
          nomeCompleto = data[i][1] || nome;
          cargo = data[i][4] || "";
          break;
        }
      }
      const dataHora = Utilities.formatDate(new Date(), "America/Sao_Paulo", "dd/MM/yyyy HH:mm:ss");
      logSheet.appendRow([dataHora, nome, nomeCompleto, cargo, acao]);
      return ContentService.createTextOutput("Log registrado com sucesso").setMimeType(ContentService.MimeType.TEXT);
    }
    
    if (acao === "salvar_rascunho_acidente" && dados) {
      var dadosObj = JSON.parse(dados);
      var result = salvarRascunhoAcidente(dadosObj);
      return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (acao === "finalizar_acidente" && dados) {
      var dadosObj = JSON.parse(dados);
      var result = finalizarAcidente(dadosObj.id);
      return ContentService.createTextOutput(JSON.stringify({success: result})).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput("Ação desconhecida").setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return ContentService.createTextOutput("Erro: " + err.message).setMimeType(ContentService.MimeType.TEXT);
  }
}

// ====================================================================
// doGet
// ====================================================================
function doGet(e) {
  var acao = e.parameter.acao;
  var callback = e.parameter.callback;
  
  function enviarResposta(dados) {
    if (callback) {
      var json = JSON.stringify(dados);
      var resposta = callback + '(' + json + ');';
      return ContentService.createTextOutput(resposta).setMimeType(ContentService.MimeType.JAVASCRIPT);
    } else {
      return ContentService.createTextOutput(JSON.stringify(dados)).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  function enviarErro(mensagem) {
    var erroObj = { erro: mensagem };
    if (callback) {
      var json = JSON.stringify(erroObj);
      var resposta = callback + '(' + json + ');';
      return ContentService.createTextOutput(resposta).setMimeType(ContentService.MimeType.JAVASCRIPT);
    } else {
      return ContentService.createTextOutput(JSON.stringify(erroObj)).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  try {
    if (acao === "terminais") return enviarResposta(listarTerminais());
    if (acao === "terminais_todos") return enviarResposta(listarTodosTerminais());
    
    if (acao === "login") {
      var senhaDigitada = e.parameter.senha;
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheetLogin = ss.getSheetByName("login");
      var data = sheetLogin.getDataRange().getValues();
      var usuarioEncontrado = { sucesso: false };
      for (var i = 1; i < data.length; i++) {
        var nome = data[i][1];
        var apelido = data[i][2];
        var funcao = data[i][4];
        var ativo = data[i][5];
        var hashPlanilha = data[i][6];
        if (apelido && ativo === "SIM") {
          var hashCalculado = gerarHashComSalt(senhaDigitada, apelido);
          if (hashCalculado === hashPlanilha) {
            usuarioEncontrado = { sucesso: true, nome: nome, apelido: apelido, funcao: funcao };
            break;
          }
        }
      }
      return enviarResposta(usuarioEncontrado);
    }
    
    if (acao === "consultar_acidentes") {
      var filtros = {
        prefixo: e.parameter.prefixo || null,
        motorista: e.parameter.motorista || null,
        dataInicio: e.parameter.dataInicio ? new Date(e.parameter.dataInicio) : null,
        dataFim: e.parameter.dataFim ? new Date(e.parameter.dataFim) : null,
        status: e.parameter.status || null
      };
      var papel = e.parameter.papel || '';
      var apelido = e.parameter.apelido || '';
      var resultado = consultarAcidentes(filtros, papel, apelido);
      return enviarResposta(resultado);
    }
    
    if (acao === "obter_acidente") {
      var id = e.parameter.id;
      var acidente = buscarAcidentePorId(id);
      return enviarResposta(acidente);
    }
    
    if (acao === "buscar_veiculo") {
      var prefixo = e.parameter.prefixo;
      var veiculo = buscarVeiculoPorPrefixo(prefixo);
      return enviarResposta(veiculo);
    }
    
    if (acao === "buscar_operador") {
      var termo = e.parameter.termo;
      var operadores = buscarOperadorPorChapaOuNome(termo);
      return enviarResposta(operadores);
    }
    
    if (acao === "buscar_linhas") {
      var termoLinha = e.parameter.termo;
      var linhas = buscarLinhas(termoLinha);
      return enviarResposta(linhas);
    }
    
    return enviarErro("Ação inválida: " + acao);
  } catch (err) {
    Logger.log("ERRO em doGet: " + err.message);
    return enviarErro("Erro interno: " + err.message);
  }
}
