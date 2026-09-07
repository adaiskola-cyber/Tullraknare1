# Tullräknare

En fristående webbapp för att räkna ut tull, moms och totalkostnad vid import
till Sverige – enligt EU:s regler från 1 juli 2026 (då tullfriheten under
150 EUR togs bort).

Appen består av:
- en statisk frontend (`public/`) – HTML, CSS och JavaScript, ingen inloggning
- en liten backend-endpoint (`/api/rates`) som hämtar och cachar valutakurser
  från [open.er-api.com](https://open.er-api.com) en gång per dygn, så att
  besökare aldrig gör anrop direkt till valuta-API:et

Den här guiden är skriven för dig som **inte kodar** och vill få upp sidan
live på nätet på enklaste sätt.

---

## Snabbast: driftsätt med Vercel (rekommenderas)

Vercel klarar både den statiska sidan och `/api/rates`-funktionen automatiskt,
utan att du behöver konfigurera något.

### 1. Skapa ett GitHub-konto och ladda upp projektet
1. Gå till [github.com](https://github.com) och skapa ett konto om du inte
   redan har ett.
2. Klicka på **New repository**, ge det namnet `tullraknare` och klicka
   **Create repository**.
3. På nästa sida väljer du **uploading an existing file** och drar in alla
   filer och mappar från den här projektmappen (`public/`, `api/`, `lib/`,
   `server.js`, `package.json`, `.gitignore`, `README.md`).
4. Klicka **Commit changes** längst ner.

### 2. Koppla GitHub till Vercel
1. Gå till [vercel.com](https://vercel.com) och skapa ett konto – välj
   **Continue with GitHub** så kopplas kontona ihop automatiskt.
2. Klicka **Add New… → Project**.
3. Hitta repot `tullraknare` i listan och klicka **Import**.
4. Vercel känner automatiskt av att det här är ett vanligt projekt med en
   `public`-mapp och en `api`-mapp. Du behöver inte ändra några inställningar
   – klicka bara **Deploy**.
5. Efter ca en minut är sidan live på en adress som
   `https://tullraknare-ditt-namn.vercel.app`.

### 3. Klart
Besök länken. Testa att fylla i ett värde och en valuta – resultatet ska
uppdateras direkt, och texten "Kurser uppdaterade: …" ska visas under
valutalistan.

Vill du använda ett eget domännamn (t.ex. `tullraknare.se`)? Gå till
projektets **Settings → Domains** i Vercel och följ instruktionerna där.

---

## Alternativ: driftsätt med Render

Render kör sidan som en vanlig, alltid-igång webbserver (`server.js`), vilket
fungerar precis lika bra.

1. Ladda upp projektet till GitHub enligt steg 1 ovan (om du inte redan gjort
   det).
2. Gå till [render.com](https://render.com) och skapa ett konto, t.ex. med
   **Continue with GitHub**.
3. Klicka **New → Web Service**.
4. Välj ditt GitHub-repo `tullraknare`.
5. Fyll i inställningarna:
   - **Name**: valfritt, t.ex. `tullraknare`
   - **Runtime**: Node
   - **Build Command**: lämna tomt (eller `npm install`)
   - **Start Command**: `npm start`
   - **Instance Type**: Free räcker gott
6. Klicka **Create Web Service**.
7. Efter ett par minuter är sidan live på en adress som
   `https://tullraknare.onrender.com`.

Obs: på Renders gratisnivå kan tjänsten "somna" efter en stunds inaktivitet
och ta några sekunder extra att starta vid nästa besök. Det påverkar inte
funktionaliteten, bara laddningstiden för det första besöket.

---

## Testa lokalt på din egen dator (valfritt)

Kräver att [Node.js](https://nodejs.org) (version 18 eller senare) är
installerat.

```bash
npm start
```

Öppna sedan `http://localhost:3000` i webbläsaren.

---

## Hur valutakurserna hanteras

- Kurserna hämtas från det fria API:et `open.er-api.com` (ingen nyckel
  behövs) och täcker alla 160+ valutor i listan.
- Servern sparar kurserna i minnet tillsammans med en tidsstämpel. Vid varje
  förfrågan till `/api/rates` kontrolleras om kurserna är äldre än 24 timmar
  – i så fall hämtas nya automatiskt.
- Om hämtningen misslyckas (t.ex. att valuta-API:et är nere) visas ett
  tydligt felmeddelande i appen, och senast kända kurser används istället om
  sådana finns i minnet.
- Frontend anropar aldrig valuta-API:et direkt, utan alltid via din egen
  `/api/rates`-endpoint.

## Ansvarsfriskrivning

Beräkningarna i appen är en **uppskattning** för att ge en fingervisning om
kostnaden vid import – inte ett bindande tullbesked. Exakta tullsatser för
specifika varor finns i Tullverkets tulltaxa:
[tulltaxan.tullverket.se](https://tulltaxan.tullverket.se).
