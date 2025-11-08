# ML Service Quick Start Guide

## 🚀 Running the Service

### Option 1: Local Development

```bash
cd /home/user/seo-intelligence-platform/ml-service

# Install dependencies
pip install -r requirements.txt

# Download required NLP models
python -m spacy download en_core_web_sm
python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords'); nltk.download('wordnet')"

# Create logs directory
mkdir -p logs

# Run the service
python -m uvicorn app.main:app --host 0.0.0.0 --port 8003 --reload
```

### Option 2: Docker

```bash
cd /home/user/seo-intelligence-platform/ml-service

# Build image
docker build -t seo-ml-service .

# Run container
docker run -d \
  -p 8003:8003 \
  --name ml-service \
  -v $(pwd)/logs:/app/logs \
  seo-ml-service

# Check logs
docker logs -f ml-service
```

## 🔍 Testing the Service

### Health Check
```bash
curl http://localhost:8003/health
```

### API Documentation
Open in browser: http://localhost:8003/docs

### Test Intent Classification
```bash
curl -X POST "http://localhost:8003/api/v1/classify-intent" \
  -H "Content-Type: application/json" \
  -d '{"query": "buy best laptop 2024"}'
```

### Test Content Scoring
```bash
curl -X POST "http://localhost:8003/api/v1/score-content" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "<h1>SEO Guide</h1><p>This comprehensive guide covers all aspects of SEO optimization including keyword research, content creation, and link building strategies.</p>",
    "title": "Complete SEO Guide 2024",
    "keywords": ["seo", "optimization"]
  }'
```

### Test Topic Extraction
```bash
curl -X POST "http://localhost:8003/api/v1/extract-topics" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Search engine optimization is crucial for businesses. Google and Bing are the most popular search engines. SEO techniques include keyword research, content optimization, and link building.",
    "max_topics": 5
  }'
```

## 📊 Available Endpoints

- **Classification**: `/api/v1/classify-intent`
- **Scoring**: `/api/v1/score-content`
- **Clustering**: `/api/v1/cluster-keywords`
- **Prediction**: `/api/v1/predict-traffic`
- **Recommendations**: `/api/v1/generate-recommendations`
- **Topics**: `/api/v1/extract-topics`
- **Sentiment**: `/api/v1/analyze-sentiment`

## 🔧 Configuration

Create `.env` file:
```env
DEBUG=false
LOG_LEVEL=INFO
PORT=8003
MODEL_PATH=/app/models
```

## 📈 Monitoring

- **Metrics**: http://localhost:8003/metrics
- **Model Status**: http://localhost:8003/models/status

## 🎯 Integration

The ML service runs on port **8003** and can be called from:
- Backend Service (8000)
- Analysis Service (8002)
- Frontend (3000) via backend

## ⚡ Performance Tips

1. **First Request**: May be slower due to lazy model loading
2. **GPU**: Enable CUDA for faster BERT inference
3. **Workers**: Increase workers for higher throughput
4. **Caching**: Enable Redis for response caching

## 🛠️ Training Models

```bash
# Prepare datasets
python -m app.training.prepare_datasets

# Train intent classifier
python -m app.training.train_intent_model

# Train content scorer
python -m app.training.train_content_scorer
```

## 📚 Documentation

- Full README: `README.md`
- Complete guide: `ML_SERVICE_COMPLETE.md`
- API docs: http://localhost:8003/docs

---

**Service Ready!** 🎉
