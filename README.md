# ❤️ LoveQuest — Your Couple’s Journey

![GitHub repo size](https://img.shields.io/github/repo-size/ScoltBr/lovequest-your-couple-s-journey)
![GitHub stars](https://img.shields.io/github/stars/ScoltBr/lovequest-your-couple-s-journey?style=social)
![GitHub forks](https://img.shields.io/github/forks/ScoltBr/lovequest-your-couple-s-journey?style=social)
![License](https://img.shields.io/badge/license-MIT-green)
![Python](https://img.shields.io/badge/backend-Python-blue)
![FastAPI](https://img.shields.io/badge/framework-FastAPI-009688)
![React](https://img.shields.io/badge/frontend-React-61DAFB)

LoveQuest é uma aplicação que transforma o relacionamento de um casal em uma **jornada gamificada**, utilizando desafios, recompensas e experiências personalizadas.

O projeto demonstra como um **backend inteligente pode gerar experiências emocionais dinâmicas**, utilizando lógica de progressão, geração de conteúdo e personalização com IA.

---

# ✨ Preview

### Interface da aplicação

![Preview App](docs/images/app-preview.gif)

### Fluxo da jornada

![Flow](docs/images/journey-flow.png)

*(Substitua essas imagens pelos seus screenshots ou GIFs do projeto.)*

---

# 🎯 Objetivo do Projeto

LoveQuest foi criado para demonstrar conceitos importantes de engenharia de software:

- Backend modular
- Geração dinâmica de conteúdo
- APIs para aplicações interativas
- Gamificação de experiências humanas
- Integração com IA

O projeto explora como **tecnologia pode incentivar momentos positivos entre pessoas**.

---

# 🧠 Conceito

A aplicação transforma interações entre um casal em **quests (missões)**.

Cada missão representa uma atividade real que fortalece o relacionamento.

Exemplos:

- preparar um jantar juntos
- escrever uma carta romântica
- planejar um encontro surpresa
- assistir um filme escolhido pelo parceiro

Ao completar quests, os usuários recebem **recompensas e progresso na jornada**.

---

# 🏗️ Arquitetura do Sistema

O sistema segue uma arquitetura separada entre **frontend e backend**.

```
Frontend (React)
        │
        │ REST API
        ▼
Backend (FastAPI)
        │
        │ Quest Engine
        │ Personalization Engine
        ▼
Experience Generation
```

---

# ⚙️ Backend — Core do Projeto

O backend é responsável por **toda a inteligência do sistema**.

Ele funciona como um **motor de experiências**, gerando desafios, controlando progresso e personalizando interações.

### Tecnologias

- Python
- FastAPI
- Motor de geração de quests
- Integração com IA (LLMs)

### Responsabilidades

- geração de quests
- personalização de conteúdo
- controle de progresso
- sistema de recompensas
- API para consumo do frontend

---

# 🧩 Componentes do Backend

## Quest Generation Engine

Responsável por gerar desafios românticos.

Exemplo:

```
Quest:
Prepare um jantar surpresa para seu parceiro(a)
```

Outro exemplo:

```
Quest:
Escreva três coisas que você admira na pessoa.
```

O sistema permite **geração praticamente infinita de conteúdo**.

---

## Personalization Engine

Sistema que adapta a experiência ao casal.

Possibilidades:

- geração de mensagens personalizadas
- adaptação do tipo de desafio
- recomendações de atividades

Integrações possíveis:

- OpenAI
- Gemini
- LLMs locais

---

## Relationship Progression System

A progressão funciona como um **RPG de relacionamento**.

Fluxo:

```
Completar missão
↓
Ganhar moedas
↓
Desbloquear recompensa
↓
Avançar na jornada
```

Esse sistema incentiva interação constante.

---

## Reward System

Recompensas incentivam a participação nas quests.

Exemplos:

- escolher o próximo filme
- escolher o restaurante
- planejar um encontro
- ganhar uma surpresa romântica

---

# 📡 API

O backend expõe endpoints para o frontend.

### Buscar quests

```
GET /quests
```

### Completar quest

```
POST /quests/complete
```

### Listar recompensas

```
GET /rewards
```

---

# 📂 Estrutura do Projeto

```
lovequest/
│
├── src/
│   ├── pages/
│   │   └── Home.tsx
│   │
│   ├── store/
│   │   ├── questStore.ts
│   │   └── currencyStore.ts
│
├── kat_engine/
│   ├── api_server.py
│   └── quest_engine.py
│
├── docs/
│   └── images/
│
└── README.md
```

---

# 🚀 Como Executar

## Backend

Instalar dependências

```
pip install fastapi uvicorn
```

Rodar servidor

```
uvicorn api_server:app --reload
```

Servidor disponível em:

```
http://localhost:8000
```

---

## Frontend

Instalar dependências

```
npm install
```

Executar aplicação

```
npm run dev
```

---

# 🧪 Melhorias Futuras

Planejamentos para evolução do projeto:

- autenticação de usuários
- suporte para múltiplos casais
- banco de dados (PostgreSQL / Supabase)
- notificações push
- geração de quests com IA
- sistema de memórias do casal
- analytics de relacionamento

---

# 💡 Categoria do Projeto

LoveQuest se encaixa em uma área emergente chamada:

**Relationship Technology**

Apps dessa categoria usam tecnologia para incentivar:

- comunicação
- conexão emocional
- experiências compartilhadas

---

# 🤝 Contribuindo

Contribuições são bem-vindas.

Passos:

1. Fork do projeto
2. Crie uma branch

```
git checkout -b feature/minha-feature
```

3. Commit das mudanças

```
git commit -m "nova feature"
```

4. Push

```
git push origin feature/minha-feature
```

5. Abra um Pull Request

---

# 📜 Licença

Este projeto está sob licença MIT.

---

# ❤️ Autor

Desenvolvido por **ScoltBr**

Se gostou do projeto, considere dar uma ⭐ no repositório.
