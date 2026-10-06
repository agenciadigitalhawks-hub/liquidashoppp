## Objetivo
- Iniciar o site localizado em ` /Users/dd/Downloads/up ` num servidor HTTP local e abrir em `http://localhost:8000/`.

## Passos
- Executar `python3 -m http.server 8000` com diretório de trabalho em ` /Users/dd/Downloads/up `.
- Manter o processo como não bloqueante para permitir navegação e inspeção.
- Abrir `http://localhost:8000/` no navegador.

## Validações
- Verificar se `index.html` carrega sem erros.
- Conferir carregamento dos recursos: `css/styles.css`, `js/script.js`, `js/mangofy-config.js`, `js/latest.js`, `js/utm-handler.js` e a logo da Kwai.
- Clicar em “Gerar PIX” para confirmar que `createTransaction()` inicia sem erros (apenas validação de front-end).

## Alternativas/Fallback
- Caso a porta 8000 esteja ocupada, usar `python3 -m http.server 8080` e abrir `http://localhost:8080/`.
- Se `python3` não estiver disponível, usar `python -m http.server 8000`.

## Observações
- Nenhum arquivo será modificado; apenas inicialização do servidor local.
- Após confirmar, exibirei a prévia no navegador e reportarei qualquer erro.

## Confirmação
- Posso executar estes passos agora?