# LinkDB - Advanced SEO Link Planning & Analysis System

## Instruktioner från användaren inför detta projekt:
 i detta projekt har jag en start till ett projekt där samtliga av de backlinks vi någonsin byggt till våra kunder finns inlagda i en databas och filtrerade så att det går att se per kund i mapparna under 
data/output/customers. Det är en start, men just nu går det bara att se link history och en flik som heter "priority_pages" som egentligen bara visar en score över hur ofta länkarna gått till en viss url. Jag 
har ett produktägarmöte idag där jag ska presentera produktutvecklingspotential, och jag vill dels kunna visa lite mer än bara vilken målsida som fått flest länkar. Det kanske inte hinns med redan till dagens 
möte att göra databasen så smart att den kan komma med förslag, varningar, potential och annat värdefullt, men statistik av värde för en seo-expert på den data som redan finns borde vara möjlig. Varje länk (med 
några undantag) har dessa datakolumner (jag inkluderar alla kolumner, även de som inte är relevanta för seo) Kolumnerna kommaseparerade från vänster: id, customer_id, pub_page_url, pub_domain, target_url, 
target_domain, anchor_text, link_type, language, published_at, topic_tags, context_excerpt, anchor_type. Vissa av dessa är fortfarande tomma, i synnerhet de sista tre som ännu inte har någon lösning för hur de 
ska laddas in. Jag ser stor potential för att skapa ett smart system där jag planerar att lägga in inte bara de länkar vi byggt utan samtliga från ahrefs (exempelvis) och runt detta vill jag bygga ett smart 
semantiskt system som exempelvis skrapar alla länkars omgivning (text alltså) och bara genom detta med hjälp av llm-analys kunna jämföra mot ett antal sökfrasers topprankade metadata där vi då kan få fram exakta
 sökintentioner som google ser som mest relevanta. Låt oss säga att man skulle göra tre sökningar: en entitetssökning och två klustersökningar - en llm kan utifrån detta förstå rätt så mycket om den sammantagna 
entitetens betydelse. Och om du inte redan tänkt föreslå det så säger jag det: vips så har vi ett slags reverse-engineering-system för att kunna skapa ett verktyg som talar om vad rätt approach är om man vill 
skapa en text med länk som är utformad för att målsidan ska stärkas i Googles "ögon" för en entitet, dess kluster och sökintentioner. Jag vill att du påbörjar arbetet med att göra detta till verklighet och ser 
detta som en utgångspunkt, inte någon slutgiltigt eller färdigutvecklat - din fortsatta utveckling av mina mere-human-thoughts är central för att kunna skapa detta och mycket mer. Så inled med att skapa 
.md-filer och agenter du behöver och så drar du igång! 


## 🎯 Overview

LinkDB is an advanced SEO link planning and analysis system designed to automate and optimize backlink strategies using semantic SEO principles and topical authority concepts. The system helps plan, track, and analyze link building campaigns with AI-powered insights.

## ✨ Key Features

### 📊 Link Planning System
- **Automatic Monthly Planning**: Generate complete monthly link plans automatically
- **Semantic Link Coordination**: Plan links that work together to strengthen topical authority
- **Customer Database Management**: Track all links for each customer with history
- **Monthly History Viewer**: View and analyze links grouped by publication month

### 🤖 AI-Powered Intelligence
- **Semantic Analysis**: AI agents analyze link patterns and suggest optimal anchor texts
- **Target URL Optimization**: Smart selection of target pages based on site structure
- **Preflight Validation**: Self-correcting system validates plans before execution
- **Customer-Specific Agents**: AI agents created per customer for personalized planning

### 📈 Analytics & Insights
- **Link History Analysis**: Track performance and patterns over time
- **Temporal Pattern Analysis**: Identify trends in link building strategies
- **Anchor Quality Analysis**: Evaluate anchor text diversity and quality
- **Domain Quality Analysis**: Assess the quality of publication domains
- **Competitive Comparison**: Compare strategies across customers

### 🔄 Integration
- **Google Sheets Integration**: Import/export data directly from Google Sheets
- **Airtable CSV Export**: Export customer data for Airtable workflows
- **Customer Database Builder**: Automatically generate per-customer databases

## 🏗️ Project Structure

```
linkdb/
├── app/                          # Core application modules
│   ├── analyzers/               # Analysis tools
│   │   ├── anchor_quality_analyzer.py
│   │   ├── domain_quality_analyzer.py
│   │   ├── temporal_pattern_analyzer.py
│   │   ├── link_history_analyzer.py
│   │   └── monthly_link_viewer.py
│   ├── planning/                # Planning system
│   │   ├── basic_plan_generator.py
│   │   ├── customer_grouper.py
│   │   ├── db_manager.py
│   │   └── volume_detector.py
│   ├── validators/              # Validation tools
│   │   └── target_url_validator.py
│   ├── build_all_customer_dbs.py
│   ├── build_history_db.py
│   └── schema.sql
├── gui/                         # GUI application
│   ├── backend/
│   │   └── app.py
│   └── gui_app.py
├── data/                        # Data files
│   ├── input/
│   └── output/
├── docs/                        # Documentation
│   ├── PRODUCT_VISION_2025.md
│   ├── SEMANTIC_SYSTEM_ARCHITECTURE.md
│   └── GUI_SPECIFICATION_FOR_GEMINI.md
└── templates/                   # Web templates

```

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- SQLite3
- Google Sheets API credentials (optional, for integration)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/robwestz/LinkDB.git
cd LinkDB
```

2. Create virtual environment:
```bash
python -m venv .venv
.venv\Scripts\activate  # On Windows
```

3. Install dependencies:
```bash
pip install -r requirements_planning.txt
```

### Quick Start

#### 1. Initialize Planning System
```bash
python init_planning_system.py
```

#### 2. Build Customer Databases
```bash
python app/build_all_customer_dbs.py
```

#### 3. Launch GUI
```bash
start_gui.bat
# Or: python gui_app.py
```

#### 4. Export Data
```bash
python export_customer_by_id.py
```

## 📖 Documentation

- **[Planning System Spec](PLANNING_SYSTEM_SPEC.md)** - Complete planning system documentation
- **[Planning Quickstart](PLANNING_QUICKSTART.md)** - Quick start guide
- **[GUI Documentation](GUI_README.md)** - GUI usage guide
- **[Export Guide](EXPORT_README.md)** - Data export documentation
- **[Google Sheets Setup](GOOGLE_SHEETS_SETUP.md)** - Integration setup
- **[AI Planning Guide](AI_PLANNING_GUIDE.md)** - AI features documentation

## 🔧 Core Workflows

### Planning Workflow
1. Load monthly data from Google Sheets
2. System detects link volume per customer
3. AI analyzes semantic opportunities
4. Generate coordinated link plan
5. Preflight validation and self-correction
6. Export to production format

### Analysis Workflow
1. View customer link history by month
2. Analyze anchor text patterns
3. Evaluate domain quality
4. Compare performance metrics
5. Generate insights report

## 🎨 GUI Features

The GUI application provides:
- **Main Sheet Viewer**: View and manage the main planning sheet
- **Planning Tab**: Create and manage monthly plans
- **Customer Management**: Add/edit customer links
- **Preflight Analysis**: Validate plans before execution
- **Export Tools**: Export to various formats

## 🔐 Security & Privacy

- All database files (*.db) are excluded from version control
- Credentials and API keys should be stored in `.env` files
- Customer data is stored locally and not transmitted

## 🤝 Contributing

This is a private project. For questions or issues, contact the project maintainer.

## 📝 License

Private/Proprietary - All rights reserved

## 👤 Author

**robwestz**

## 🔗 Links

- Repository: https://github.com/robwestz/LinkDB
- Planning Document: [Google Sheets](https://docs.google.com/spreadsheets/d/1KfON8-Y7lCW9XtYnnY9uxdmlojyCl5QxQALtn8FH5YE/edit?usp=sharing)

## 📊 Project Status

Active development - Advanced semantic planning features in progress

---

*Built with Python, SQLite, and AI-powered semantic analysis*

