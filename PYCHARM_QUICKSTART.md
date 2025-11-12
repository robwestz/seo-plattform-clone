
---

**Projektet är klart att öppnas i PyCharm!** 🎉
# SEO Intelligence Platform - Klonkopia

Detta är en färsk klon av SEO Intelligence Platform-repot.

## 📂 Öppna i PyCharm

### Alternativ 1: Använd batch-filen
Dubbelklicka på:
```
open-in-pycharm.bat
```

### Alternativ 2: Manuellt
1. Öppna PyCharm
2. Välj **File > Open**
3. Navigera till: `C:\Users\robin\Downloads\seo-platform-clone`
4. Klicka **OK**

### Alternativ 3: Via kommandoraden
Om du har PyCharm i PATH:
```cmd
cd C:\Users\robin\Downloads\seo-platform-clone
charm .
```
eller
```cmd
pycharm .
```

## 🚀 Snabbstart

### Python/ML-service
```bash
cd ml-service
pip install -r requirements.txt
python app/main.py
```

### Backend (NestJS)
```bash
cd backend
npm install
npm run start:dev
```

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```

### Crawler (Go)
```bash
cd crawler
go mod download
make build
```

## 📁 Projektstruktur

```
seo-platform-clone/
├── backend/          # NestJS backend API
├── frontend/         # Next.js frontend
├── crawler/          # Go-baserad web crawler
├── ml-service/       # Python ML/AI service
├── infrastructure/   # Docker, Kubernetes, Terraform
├── docs/            # Dokumentation
└── sdks/            # JavaScript & Python SDKs
```

## 🔧 Utvecklingsmiljö

PyCharm rekommenderade inställningar:
- Python Interpreter: Välj Python 3.11+
- Enable Node.js support för frontend/backend
- Install Go plugin för crawler
- Install Docker plugin

## 📖 Dokumentation

- `README.md` - Huvuddokumentation
- `PLATFORM_OVERVIEW.md` - Plattformsöversikt
- `TESTING_GUIDE.md` - Testguide
- `docs/` - Detaljerad API-dokumentation

## ⚙️ Konfiguration

Huvudkonfigurationsfiler:
- `backend/package.json` - Backend dependencies
- `frontend/package.json` - Frontend dependencies
- `ml-service/requirements.txt` - Python dependencies
- `crawler/go.mod` - Go dependencies

