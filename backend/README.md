# FinAlly API

API REST em Django REST Framework para autenticação, dashboard, movimentações e metas.

## Executar localmente

No PowerShell, a partir desta pasta:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
py -m pip install -r requirements.txt
Copy-Item .env.example .env
py manage.py migrate
py manage.py createsuperuser
py manage.py runserver 0.0.0.0:8000
```

SQLite é usado por padrão no desenvolvimento. Para PostgreSQL, configure `DATABASE_URL` no `.env`, por exemplo `postgresql://usuario:senha@localhost:5432/finally`.

Configure `EXPO_PUBLIC_API_URL` no app com a URL que o dispositivo consegue acessar, terminando em `/api`. Exemplos: `http://localhost:8000/api` para web/iOS Simulator, `http://10.0.2.2:8000/api` para o emulador Android e `http://<IP-DA-MAQUINA>:8000/api` para um celular na mesma rede.

## Endpoints

- `POST /api/auth/register/`, `POST /api/auth/token/`, `POST /api/auth/refresh/`, `POST /api/auth/logout/`, `GET /api/auth/me/`
- `GET /api/dashboard/?month=AAAA-MM`
- `GET /api/categories/`
- `GET|POST /api/transactions/`, `GET|PUT|PATCH|DELETE /api/transactions/{uuid}/`
- `GET|POST /api/goals/`, `GET|PUT|PATCH|DELETE /api/goals/{uuid}/`

Todos os recursos financeiros exigem JWT. As consultas e alterações são limitadas ao usuário autenticado. O app envia `categoryId`, `targetAmount` e `currentAmount` no mesmo formato usado pelos tipos TypeScript.

## Testes

```powershell
py manage.py test
```

Antes de publicar, defina uma `DJANGO_SECRET_KEY` forte, `DJANGO_DEBUG=False`, hosts permitidos e `DATABASE_URL` PostgreSQL. Use HTTPS no ambiente publicado.