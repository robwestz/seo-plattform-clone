# seo-plattform-clone

## Git Kommandon för att Committa till detta Repo

Denna guide visar de exakta kommandona för att arbeta med detta repository.

### 1. Klona Repository (första gången)

```bash
git clone https://github.com/robwestz/seo-plattform-clone.git
cd seo-plattform-clone
```

### 2. Skapa en ny Branch

```bash
# Se alla befintliga branches
git branch -a

# Skapa och växla till en ny branch
git checkout -b din-branch-namn
```

### 3. Gör dina ändringar

Redigera filer med din favorit editor eller IDE.

### 4. Kontrollera ändringar

```bash
# Se vilka filer som har ändrats
git status

# Se exakta ändringar i filerna
git diff
```

### 5. Lägg till filer för commit (staging)

```bash
# Lägg till alla ändrade filer
git add .

# ELLER lägg till specifika filer
git add filnamn.txt

# ELLER lägg till flera specifika filer
git add fil1.txt fil2.txt fil3.txt
```

### 6. Commit dina ändringar

```bash
# Commit med ett meddelande
git commit -m "Ditt commit-meddelande här"

# Exempel på bra commit-meddelanden:
git commit -m "Lägg till ny funktion för sökmotoroptimering"
git commit -m "Fixa bugg i användarinloggning"
git commit -m "Uppdatera README med instruktioner"
```

### 7. Push till GitHub

```bash
# Push till din branch (första gången)
git push -u origin din-branch-namn

# Push efterföljande ändringar
git push
```

### 8. Skapa Pull Request

1. Gå till: https://github.com/robwestz/seo-plattform-clone
2. Klicka på "Pull requests"
3. Klicka på "New pull request"
4. Välj din branch
5. Klicka på "Create pull request"
6. Fyll i titel och beskrivning
7. Klicka på "Create pull request"

### Komplett Workflow Exempel

```bash
# 1. Klona repo (om du inte redan gjort det)
git clone https://github.com/robwestz/seo-plattform-clone.git
cd seo-plattform-clone

# 2. Skapa en ny branch
git checkout -b min-nya-funktion

# 3. Gör ändringar i filer...

# 4. Kontrollera vad som ändrats
git status
git diff

# 5. Lägg till ändringar
git add .

# 6. Commit ändringar
git commit -m "Lägg till min nya funktion"

# 7. Push till GitHub
git push -u origin min-nya-funktion

# 8. Gå till GitHub och skapa Pull Request
```

### Uppdatera din lokala branch

```bash
# Hämta senaste ändringar från GitHub
git fetch origin

# Växla till main branch
git checkout main

# Hämta och merge senaste ändringar
git pull origin main

# Växla tillbaka till din branch
git checkout din-branch-namn

# Merge in ändringar från main (om behövs)
git merge main
```

### Användbara Git Kommandon

```bash
# Se commit-historik
git log

# Se commit-historik (kompakt)
git log --oneline

# Se vilken branch du är på
git branch

# Växla mellan branches
git checkout branch-namn

# Ta bort en lokal branch
git branch -d branch-namn

# Ångra ändringar i en fil (innan staging)
git checkout -- filnamn.txt

# Ta bort fil från staging (behåll ändringar)
git reset HEAD filnamn.txt

# Se remote repositories
git remote -v
```

### Tips

- **Commit ofta**: Gör små, frekventa commits istället för stora sällsynta
- **Tydliga meddelanden**: Skriv beskrivande commit-meddelanden
- **Testa innan commit**: Se till att din kod fungerar innan du committar
- **Pull regelbundet**: Håll din branch uppdaterad med senaste ändringarna
- **En feature per branch**: Skapa en ny branch för varje ny funktion eller buggfix