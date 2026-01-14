# Docker Configuration for Cinema Application

## Prerequisites
- Docker Desktop installed
- Docker Compose installed

## Quick Start

1. **Build and start all services:**
   ```bash
   docker-compose up --build
   ```

2. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - PostgreSQL: localhost:5432

## Available Commands

### Start services
```bash
docker-compose up
```

### Start services in detached mode (background)
```bash
docker-compose up -d
```

### Stop services
```bash
docker-compose down
```

### Stop services and remove volumes (delete database data)
```bash
docker-compose down -v
```

### View logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db
```

### Rebuild services after changes
```bash
docker-compose up --build
```

## Database Management

### Run Django migrations
```bash
docker-compose exec backend python manage.py migrate
```

### Create superuser
```bash
docker-compose exec backend python manage.py createsuperuser
```

### Access PostgreSQL shell
```bash
docker-compose exec db psql -U cinema_user -d cinema_db
```

### Run database inserts
```bash
docker-compose exec db psql -U cinema_user -d cinema_db -f /docker-entrypoint-initdb.d/cinema_inserts.sql
```

## Development

### Backend (Django)
The backend code is mounted as a volume, so changes will be reflected immediately (hot reload).

### Frontend (React)
The frontend code is also mounted as a volume with hot reload enabled.

### Install new Python package
```bash
# Add package to requirements.txt
docker-compose exec backend pip install package-name
# Or rebuild the backend container
docker-compose up --build backend
```

### Install new npm package
```bash
docker-compose exec frontend npm install package-name
```

## Environment Variables

Copy `.env.example` to `.env` and adjust values as needed:
```bash
cp .env.example .env
```

## Troubleshooting

### Database connection issues
- Ensure the database service is healthy: `docker-compose ps`
- Check logs: `docker-compose logs db`

### Port already in use
If ports 5173, 8000, or 5432 are already in use, modify the port mappings in `docker-compose.yml`

### Reset everything
```bash
docker-compose down -v
docker-compose up --build
```

## Production Deployment

For production:
1. Update `DEBUG=False` in environment variables
2. Set a secure `SECRET_KEY`
3. Configure `ALLOWED_HOSTS` in Django settings
4. Use production-ready web server (Gunicorn/Nginx)
5. Build optimized frontend: `npm run build`
6. Set up proper database backups
