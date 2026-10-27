# CantinaControl — protótipo de controle de estoque

Interface responsiva para demonstrar a gestão do estoque da cantina escolar, com estética aconchegante inspirada nas imagens de referência enviadas.

## Como abrir
1. Extraia o arquivo ZIP.
2. Abra `index.html` no Chrome, Edge ou Firefox.
3. Não precisa instalar nada para testar a interface.

## Funcionalidades disponíveis
- Painel com resumo de produtos, estoque baixo e alertas de validade.
- Cadastro e edição de produtos, categoria, unidade, quantidade, mínimo, lote e validade.
- Registro de entradas, saídas e ajustes.
- Bloqueio de saídas maiores que a quantidade disponível.
- Histórico de movimentações.
- Filtros por nome, categoria, situação do estoque e validade.
- Relatório geral e exportação do estoque para CSV.
- Layout adaptável a celular, tablet e computador.
- Dados guardados no `localStorage` do navegador.

## Importante antes de usar de verdade
Esta versão é um **protótipo front-end**. Os dados ficam apenas no navegador/dispositivo em que foram registrados; não há login real, perfis de acesso, banco de dados compartilhado ou cópia de segurança no servidor. Para a equipe usar o mesmo estoque em vários celulares/computadores, a próxima etapa é integrar uma API (por exemplo, PHP) e um banco de dados MySQL, implementar autenticação segura e backups.

Os seis produtos iniciais são apenas exemplos para demonstrar a interface. Edite ou exclua-os e cadastre os produtos reais da cantina.

## Estrutura
- `index.html` — estrutura das telas.
- `style.css` — visual responsivo.
- `app.js` — funcionalidades e armazenamento local.
- `assets/` — imagens de inspiração fornecidas pela usuária.
