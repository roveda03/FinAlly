# FinAlly

> Organize suas finanças, conquiste seus objetivos.

O **FinAlly** é um aplicativo móvel multiplataforma (Android, iOS e Web) de **gestão financeira pessoal**, desenvolvido com **React Native**, **Expo** e **TypeScript**. Seu objetivo é ajudar o usuário a acompanhar receitas, despesas, limites de gastos por categoria, metas financeiras e obter análises rápidas por meio de um assistente financeiro integrado.

---

## O que o projeto faz

### Autenticação e Sessão
- **Login e Cadastro:** acesso à conta por e-mail e senha, além de criação de nova conta diretamente pelo aplicativo.
- **Gerenciamento de Sessão:** manutenção da sessão autenticada com armazenamento seguro de credenciais no dispositivo.

### Dashboard (Visão Geral)
- **Resumo Financeiro:** exibição destacada do **Saldo Atual**, além dos totais de **Receitas** e **Despesas**.
- **Despesas por Categoria:** visualização gráfica da distribuição dos gastos com percentuais por categoria.
- **Movimentações Recentes:** acesso rápido aos últimos lançamentos registrados.

### Movimentações
- **Registro Completo:** criação, edição e exclusão de receitas e despesas com descrição, valor, data e categoria.
- **Categorização:** suporte a categorias de receita (*Salário*, *Freelance*, *Investimentos*) e de despesa (*Alimentação*, *Moradia*, *Transporte*, *Lazer*, *Saúde*, *Educação*).
- **Busca e Filtros:** pesquisa por descrição e filtragem por tipo (*Todos*, *Despesas*, *Receitas*), período (*Tudo*, *Este mês*, *Últimos 30 dias*, *Últimos 3 meses*) e categorias, com resumo dinâmico do período filtrado.

### Limites de Gastos
- **Controle Mensal por Categoria:** definição e edição de tetos de gastos mensais para cada categoria de despesa.
- **Acompanhamento Visual:** indicador circular de progresso para o limite em destaque e barras de progresso com valor gasto e percentual utilizado para cada categoria.
- **Alertas Inteligentes:** avisos visuais quando os gastos se aproximam do limite definido ou o ultrapassam no mês.

### Metas Financeiras
- **Planejamento de Objetivos:** criação, edição e exclusão de metas com título, descrição, valor desejado, valor acumulado e prazo.
- **Progresso:** acompanhamento percentual do quanto já foi acumulado em direção a cada objetivo.

### Assistente Financeiro (Chatbot)
- **Atendimento Interativo:** chat integrado para tirar dúvidas e receber orientações sobre finanças pessoais.
- **Análise de Gastos:** leitura do resumo financeiro mensal (receitas, principais categorias de despesa e alertas de limites) para gerar diagnósticos e sugestões personalizadas, utilizando apenas dados agregados.
- **Ações Rápidas:** atalhos para solicitar dicas de economia, analisar os gastos do mês ou iniciar a criação de uma nova meta.

---

## Tecnologias Utilizadas

- **React Native** e **Expo** (SDK 58)
- **Expo Router** (navegação baseada em arquivos)
- **TypeScript**
- **Expo Secure Store** (armazenamento seguro de sessão)
- **Ionicons** (`@expo/vector-icons`)
