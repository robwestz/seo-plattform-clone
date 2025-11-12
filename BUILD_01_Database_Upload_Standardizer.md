# BUILD 01: Database Upload & Semantic Standardizer

## 🎯 Mål
Bygg ett komplett system där användare kan ladda upp sina egna spreadsheets (CSV/Excel/Google Sheets) med SEO-data, och systemet automatiskt standardiserar, berikar och integrerar datan med plattformens alla verktyg.

## 🏗️ Arkitektur

### Backend (Node.js/Python hybrid)
```
/backend/services/database-uploader/
├── upload-handler.ts          # File upload & parsing
├── column-detector.ts          # AI-powered column detection
├── standardizer.ts             # Data standardization engine
├── semantic-enricher.ts        # LLM-based data enrichment
├── validator.ts                # Data quality validation
├── integrator.ts               # Integration med plattformens databaser
└── backlink-processor.ts       # Special processor för backlink data (LinkDB integration)
```

### Frontend (Next.js)
```
/frontend/app/(dashboard)/dashboard/database-upload/
├── page.tsx                    # Main upload page
├── components/
│   ├── FileUploader.tsx        # Drag & drop + file picker
│   ├── ColumnMapper.tsx        # Visual column mapping UI
│   ├── DataPreview.tsx         # Preview before import
│   ├── StandardizationProgress.tsx  # Real-time progress
│   └── IntegrationSelector.tsx # Välj vilka verktyg som ska använda datan
```

## 📊 Databas Schema

### uploaded_datasets table
```sql
CREATE TABLE uploaded_datasets (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    project_id UUID,
    name VARCHAR(255),
    original_filename VARCHAR(255),
    file_type ENUM('csv', 'excel', 'google_sheets'),
    upload_date TIMESTAMP,
    row_count INTEGER,
    column_count INTEGER,
    detected_data_type ENUM('backlinks', 'keywords', 'content', 'rankings', 'mixed'),
    standardization_status ENUM('pending', 'processing', 'completed', 'failed'),
    metadata JSONB
);
```

### dataset_columns table
```sql
CREATE TABLE dataset_columns (
    id UUID PRIMARY KEY,
    dataset_id UUID REFERENCES uploaded_datasets(id),
    original_column_name VARCHAR(255),
    detected_column_type VARCHAR(100),
    standardized_column_name VARCHAR(100),
    mapping_confidence FLOAT,
    sample_values TEXT[],
    transformation_rules JSONB
);
```

### backlinks_uploaded table (LinkDB integration)
```sql
CREATE TABLE backlinks_uploaded (
    id UUID PRIMARY KEY,
    dataset_id UUID REFERENCES uploaded_datasets(id),
    source_url TEXT NOT NULL,
    source_domain VARCHAR(255),
    target_url TEXT NOT NULL,
    target_domain VARCHAR(255),
    anchor_text TEXT,
    anchor_type ENUM('exact', 'partial', 'branded', 'generic', 'naked'),
    link_type ENUM('dofollow', 'nofollow', 'sponsored', 'ugc'),
    context_excerpt TEXT,
    topic_tags TEXT[],
    language VARCHAR(10),
    published_at TIMESTAMP,
    first_seen TIMESTAMP,
    last_checked TIMESTAMP,
    status ENUM('active', 'lost', 'redirect', 'broken'),

    -- Semantic enrichment (LLM-generated)
    detected_intent VARCHAR(100),
    semantic_relevance_score FLOAT,
    entity_mentions TEXT[],
    topic_clusters TEXT[],

    -- Quality metrics
    domain_rating INTEGER,
    page_authority INTEGER,
    spam_score INTEGER,

    metadata JSONB
);
```

## 🤖 AI-Powered Features

### 1. Smart Column Detection
```typescript
// Uses LLM to detect column types from headers + sample data
async function detectColumns(headers: string[], sampleRows: any[][]): Promise<ColumnMapping[]> {
  const prompt = `
  Analyze these spreadsheet columns and detect their purpose:

  Headers: ${headers.join(', ')}

  Sample data:
  ${sampleRows.map(row => row.join(' | ')).join('\n')}

  Classify each column as one of:
  - source_url, target_url, anchor_text, domain, link_type
  - keyword, search_volume, difficulty, position
  - url, title, meta_description, word_count
  - date, timestamp, status, metric_value
  - custom (describe what it is)

  Return JSON array with: {column_index, detected_type, confidence, reasoning}
  `;

  return await llm.analyze(prompt);
}
```

### 2. Semantic Data Enrichment (LinkDB-style)
```typescript
async function enrichBacklinkData(link: BacklinkRow): Promise<EnrichedBacklink> {
  // Scrape link context if missing
  if (!link.context_excerpt) {
    link.context_excerpt = await scrapeContext(link.source_url, link.target_url);
  }

  // LLM analyzes context for semantic understanding
  const analysis = await llm.analyze(`
    Analyze this backlink context:

    Source: ${link.source_domain}
    Target: ${link.target_domain}
    Anchor: "${link.anchor_text}"
    Context: "${link.context_excerpt}"

    Extract:
    1. Primary intent (informational/commercial/transactional/navigational)
    2. Semantic relevance score (0-100)
    3. Entity mentions (brands, products, concepts)
    4. Topic clusters this link supports
    5. Link quality assessment
  `);

  return {
    ...link,
    ...analysis,
    enrichment_timestamp: new Date()
  };
}
```

### 3. Automatic Standardization Rules
```typescript
const standardizationRules = {
  // URL normalization
  urls: {
    remove_tracking_params: true,
    lowercase_domain: true,
    add_protocol: true,
    validate_format: true
  },

  // Date standardization
  dates: {
    detect_format: 'auto', // Uses LLM if ambiguous
    output_format: 'ISO8601',
    timezone: 'UTC'
  },

  // Text cleaning
  text: {
    trim_whitespace: true,
    remove_special_chars: false,
    normalize_unicode: true
  },

  // Domain extraction
  domains: {
    extract_from_url: true,
    remove_subdomain: false,
    validate_tld: true
  }
};
```

## 🔄 Upload Workflow

### Step 1: File Upload
```typescript
POST /api/database-upload/upload
- Accept: CSV, XLSX, XLS, Google Sheets URL
- Max size: 50 MB
- Returns: upload_id, file_info
```

### Step 2: Column Detection (Auto)
```typescript
POST /api/database-upload/{upload_id}/detect
- Analyzes headers + 100 sample rows
- Returns: detected_columns[], confidence_scores[]
```

### Step 3: User Review & Mapping
```typescript
PUT /api/database-upload/{upload_id}/mapping
Body: {
  columns: [
    {original_name: "Link URL", maps_to: "source_url"},
    {original_name: "Destination", maps_to: "target_url"},
    {original_name: "Text", maps_to: "anchor_text"}
  ]
}
```

### Step 4: Standardization & Enrichment
```typescript
POST /api/database-upload/{upload_id}/process
- Applies standardization rules
- Enriches with LLM analysis (parallel processing)
- Validates data quality
- Progress updates via WebSocket
```

### Step 5: Integration
```typescript
POST /api/database-upload/{upload_id}/integrate
Body: {
  target_tools: ["backlinks", "rankings", "keywords"],
  project_id: "proj-123",
  merge_strategy: "append" | "replace" | "smart_merge"
}
```

## 🎨 Frontend Components

### FileUploader Component
```tsx
'use client'

export function FileUploader() {
  return (
    <div className="space-y-6">
      {/* Drag & Drop Zone */}
      <DropZone
        accept=".csv,.xlsx,.xls"
        maxSize={50 * 1024 * 1024}
        onUpload={handleUpload}
      />

      {/* Google Sheets URL Input */}
      <GoogleSheetsImporter
        onImport={handleGoogleSheets}
      />

      {/* Template Download */}
      <TemplateDownloader
        templates={['backlinks', 'keywords', 'rankings']}
      />
    </div>
  );
}
```

### ColumnMapper Component (Smart UI)
```tsx
export function ColumnMapper({ detectedColumns }) {
  return (
    <div className="space-y-4">
      {detectedColumns.map(col => (
        <div key={col.index} className="flex items-center gap-4">
          {/* Original column */}
          <div className="w-1/3">
            <Label>{col.original_name}</Label>
            <SampleData values={col.sample_values} />
          </div>

          {/* AI suggestion with confidence */}
          <div className="w-1/3">
            <Select
              value={col.suggested_mapping}
              options={standardColumnTypes}
              confidence={col.confidence}
            />
            <ConfidenceMeter value={col.confidence} />
          </div>

          {/* Preview of standardized data */}
          <div className="w-1/3">
            <StandardizedPreview
              original={col.sample_values}
              standardized={col.preview_standardized}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
```

## 📈 Integration Points

### 1. Backlink Tool Integration
```typescript
// Uploaded backlinks appear in Backlink Analysis dashboard
GET /api/backlinks?source=uploaded&dataset_id=xxx

// Can be filtered, analyzed, compared with discovered backlinks
// Semantic analysis från LinkDB-systemet appliceras automatiskt
```

### 2. Keyword Tool Integration
```typescript
// Uploaded keywords merge with keyword research tool
POST /api/keywords/import-from-dataset/{dataset_id}

// Enriches keywords with search volume, difficulty from APIs
```

### 3. Ranking Tool Integration
```typescript
// Uploaded ranking data becomes part of historical tracking
POST /api/rankings/import/{dataset_id}
```

## 🧪 Testing Requirements

### Data Quality Tests
- Handle malformed CSV/Excel files
- Detect encoding issues (UTF-8, Latin-1, etc.)
- Handle missing values gracefully
- Validate URLs, dates, numbers
- Test with 10K+ row files

### AI Detection Tests
- Test with various column naming conventions
- Test with multilingual headers
- Test with ambiguous data (dates in multiple formats)
- Measure detection accuracy (>90% target)

### Performance Tests
- Upload 50MB file in <30s
- Process 10,000 rows in <2 minutes
- Enrichment with LLM: batch processing, <5s per batch of 10 rows

## 🚀 Deployment

### Environment Variables
```env
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
GOOGLE_SHEETS_API_KEY=...
ANTHROPIC_API_KEY=...
MAX_UPLOAD_SIZE_MB=50
ENRICHMENT_BATCH_SIZE=10
```

### API Endpoints Summary
```
POST   /api/database-upload/upload
GET    /api/database-upload/{id}
POST   /api/database-upload/{id}/detect
PUT    /api/database-upload/{id}/mapping
POST   /api/database-upload/{id}/process
POST   /api/database-upload/{id}/integrate
DELETE /api/database-upload/{id}
GET    /api/database-upload/datasets (list all uploads)
```

## 💡 Success Criteria

✅ User can upload 10,000-row CSV in under 1 minute
✅ AI correctly detects column types with >90% accuracy
✅ Semantic enrichment adds value (intent, entities, topics)
✅ Integrated data appears in all relevant platform tools
✅ Real-time progress updates during processing
✅ User can re-map columns and re-process if needed
✅ LinkDB-style semantic analysis applied to backlink data
✅ Data quality validation prevents bad data from entering system

---

**Budget: Use all necessary tokens. Build for production. No shortcuts.**