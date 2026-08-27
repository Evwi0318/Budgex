# Prompt att klistra in i Claude Code

*(Ersätter `docs/prompt-hem-design.md` och tidigare versioner av den här filen.)*

---

Jag vill införa en omstrukturering av Budgex frontend. Designen är beslutad och
verifierad i mockup — den ska inte omförhandlas. Din uppgift är att införa den
i den befintliga koden **utan att förstöra något som fungerar**, på enklaste
möjliga sätt.

## Så här vill jag att du arbetar

- **Enklaste lösningen som fungerar.** Ingen abstraktion i förväg, inga nya
  bibliotek, inga nya mönster. Ser du två vägar, ta den kortare.
- **Ren och läsbar kod framför smart kod.** Hellre en tydlig `useState` än en
  generisk hook ingen behöver.
- **En branch per fas.** Conventional commits. **Säg till när en fas är klar och
  redo för PR** — öppna den inte själv, och börja inte på nästa fas förrän jag
  sagt till.
- **Fråga hellre en gång för mycket.** Krockar designen med koden: stanna,
  beskriv konflikten, låt mig välja. Gissa aldrig.
- **Ingenting i backend ska röras.** Inte `Kvar.Domain`, `Kvar.Application`,
  `Kvar.Infrastructure` eller `Kvar.Api`. Inga migrationer, inga beräkningar,
  inga API-kontrakt. Ser du dig själv redigera backend — stanna, det är fel
  spår. Allt nedan sker i `frontend/src`.

---

# Funktioner som INTE får gå sönder

Läs den här listan lika noga som resten. Allt här fungerar i dag och ska
fungera **exakt likadant** efteråt. Kan du inte bevara något — stanna och
fråga, bygg inte runt det.

### Utgiftslistan

- **Betald-krysset.** Utgifter som inte är autogiro har en kryssruta som
  markerar posten som betald (`onTogglePaid` → `useSetPaidMutation`). Betald
  post får genomstruket namn, dämpat belopp och `aria-pressed`.
- **Autogiro-symbolen** `↻` visas i stället för kryssrutan på autogirorader.
- **`PaymentRow`** — den gula raden ovanför utgiftslistan:
  `"N kvar att betala själv · X kr"` i `--color-unpaid`. Autogiro räknas alltid
  som betalt och ingår aldrig i den siffran. Är allt betalt byts raden mot den
  gröna `"Allt är betalt i {månad}"`. Den ska ligga kvar överst i
  utgiftsfliken, inte inuti hero-kortet.
- **`SwipeRow`** — svep vänster på en rad avslöjar "Ta bort".
- **Ångra-fönstret**: 5 s fördröjd radering, commit vid unmount,
  `ConfirmDialog` med "Bara {månad} {år}" / "Den här och kommande månader" för
  återkommande poster.
- **Kategoriikoner** via `categoryOf`, och undertexten
  "Autogiro · Varje månad" / "Varje månad" / "Bara {månad}".

### Sparandet

- **Överföringsbocken** per konto (`role="switch"`, `useTransferMutation`) och
  den dämpade raden när kontot är överfört.
- **"Markera alla som överförda · X kr"** (`useTransferAllMutation`), som byts
  mot "Allt överfört i {månad}" med "Ångra alla överföringar" under.
- **`showTransferred`-växlingen** — `"✓ N överförda"` / `"‹ N kvar"` — och
  fallbacken som byter tillbaka när sista bocken tas bort. Den är kommenterad i
  koden för att den var en bugg en gång.
- **Hinten** "Bocka av när du gjort överföringen" med cirkeln, som bara visas
  när inget är överfört ännu och månaden är olåst.
- **Sparmålen**: progressbaren med två segment (sparat + nästa månads
  avsättning), texten `"X av Y"` och ETA `"ungefär mars 2027"` /
  `"Målet är nått 🎉"` / `"inget avsatt"` (`goalProgress` i `lib/savings.ts`).
- **Överfördelningsvarningen**: när en källas `status === "Over"` visas
  regeltexten i gult med förklaringen
  `"Du fördelar X från Lön som ger Y"` / `"Lön gav 0 kr den här månaden"`.
- **Regeltexten** per konto: `"500 kr från Lön"` / `"10 % av CSN"`, flera
  regler sammanfogade med `·`, och `"Ingen källa vald"`.
- **`SourcePicker`** i formuläret: kryssa i källa, välj Fast/Procent per källa,
  varning vid överfördelning, och tomtexten när det inte finns inkomster.
- **Emoji-ikonen** på sparkontot och sparmålsfälten i `SavingsForm`.

### Genomgående

- **Månadslåset** (`useMonthLock`): gångna månader är skrivskyddade men kan
  låsas upp, och upplåsningen återgår vid månadsbyte, vid `blur` och när fliken
  döljs. Lås-knappen finns på båda listrubrikerna. `dimmed`-läget på hero.
  **Alla nya lägen måste respektera `isLocked`** — även komprimerat hero.
- **`MonthNav`**: pilar + horisontellt svep för månadsbyte, `canGoNext` som
  hindrar framtida månader, och den animerade textväxlingen.
- **BottomSheet-formulären** och deras dirty-hantering (`onDirtyChange`,
  "Kasta ändringarna?"), samt att bara greppstrecket startar draget.
- **Alla `EmptyState`-varianter** — fem på Hem, två i sparandet, plus
  "🎉 Allt är överfört".
- **Skelettladdningen** och felmeddelandet när data saknas.
- **Auth, `PrivateRoute`, `Login`, `useApi`.** CI och deploy.

---

# Vad som ändras — översikt

Sparkonton tillhör månaden precis som utgifter gör. De blir därför en tredje
flik i hero-kortet i stället för en egen sida. Då har navbaren bara två ikoner
kvar och tas bort helt, TopBaren likaså. Profilen nås via en cirkelknapp som
svävar bredvid FAB:en. Hero-kortet blir sticky, krymper vid scroll och får
frostat glas bakom sig.

---

# Fas 1 — Sparande blir flik, navbaren och Swiper försvinner

**Branch:** `refactor/savings-as-tab`

1. **Sparande blir en tredje flik i `HeroCard`**: `Inkomst · Utgifter ·
   Sparande`, alla tre filtrerar listan under kortet. Chevronen på Sparande
   försvinner — den navigerar inte längre. Beloppen per flik
   (`summary.income`, `summary.totalExpenses`, `summary.totalSavings`) och
   `motion` layoutId-understrykningen behålls som de är.

2. **Innehållet från `Savings.tsx` flyttar in som fliksvy.** Hela
   sparandevyn följer med: `SavingsRow`, bockarna, "Markera alla som
   överförda", `showTransferred`-växlingen, hinten, sparmålen, varningarna,
   `SavingsForm` i sitt ark. Placera "Markera alla som överförda" och
   `showTransferred` i listrubriken för sparandefliken, i samma stil som
   utgiftsflikens rubrik. **Föreslå placeringen för mig innan du bygger** —
   det är den enda delen av flödet som är en uppgift och inte en vy.

3. **`SavingsTopCard` blir troligen överflödig** — dess två siffror finns redan
   i hero-kortet. Kontrollera, och ta bort komponenten om inget använder den.

4. **`BottomNav` tas bort.** Komponenten raderas.

5. **`TopBar` tas bort.** Månadsraden blir sidans enda topp. Ordmärket
   "Budgex" finns kvar på inloggningsskärmen och i PWA-manifestet.

6. **Profilen når man via en cirkelknapp**, och `/profile` **förblir en riktig
   sida**. `Profile.tsx` har egna BottomSheets (namn, lösenord) och en
   ConfirmDialog för radera konto — att lägga hela sidan i ett ark ger ark i
   ark. Lägg i stället till en bakåtpil bredvid "Profil"-rubriken som går till
   `/`. Rör inget annat i `Profile.tsx`.

7. **Swiper tas bort helt.** `AppShell` behöver inga slides när det bara finns
   en sida. `swiper` och `swiper/css` ut ur `package.json`, och
   `swiper-no-swiping` bort från `MonthNav`.

8. **`/savings` behålls som omdirigering** — sätter sparandefliken och skickar
   till `/`. Gamla bokmärken och PWA-genvägar ska fortsätta fungera.

9. **FAB:ens synlighetsvillkor.** I dag `!isLocked && activePath === "/"`.
   Med en sida gäller bara `!isLocked` — behåll låsvillkoret oförändrat.

## Om `view` och `EntryKind`

`view` i `MonthContext` är i dag `EntryKind` (`"Income" | "Expense"`), alltså
domänens posttyp. Med en tredje flik som inte är en posttyp blir den typen
missvisande. **Föreslå hur du vill lösa det och vänta på mitt svar** — jag vill
inte att UI-begreppet "vald flik" och domänbegreppet "posttyp" smälter samman
om de egentligen är två olika saker.

Ett state styr flik, lista och FAB. Inte tre parallella states — då hamnar de
förr eller senare i otakt och användaren ser "Utgifter" med inkomstlistan under.

## Innan du skriver kod i den här fasen

Redovisa och vänta på svar:

1. Vilket element scrollar i dag, och vad blir det när Swiper är borta?
2. Vilka filer försvinner helt, och vad i dem används på fler ställen?
3. Ditt förslag för `view`/`EntryKind`.
4. Var "Markera alla som överförda" och `showTransferred` hamnar.
5. Behöver `useSavingsQuery` anropas någon annanstans nu när sparandet
   renderas från Hem?

---

# Fas 2 — Sticky hero med glas, uttoningar och scroll-padding

**Branch:** `feat/sticky-hero`

Först här löses den ursprungliga buggen: listan går in under FAB:en och sista
raden går inte att nå.

1. **Botten-utrymme.** I dag `pb-24` (96 px), medan FAB:en sitter på 88 px och
   är 58 px hög. Nytt utrymme ≈ FAB-höjd + luft + `env(safe-area-inset-bottom)`,
   ca 108 px utan navbar. Definiera som **en** CSS-variabel i `@theme` i
   `src/index.css` och läs den där den behövs. Inga magiska tal i komponenter.

2. **Hero-kortet blir sticky** med ~8 px luft till toppen. Det förblir ett
   kort — rundade hörn, ram, marginaler — och ska **inte** bli en bar i kanten.
   Verifiera att inget led har `overflow: hidden` eller `transform` som bryter
   `position: sticky`, och lös det på kortet självt.

3. **Frostat glas bakom kortet.** Gradienten läggs med alpha ovanpå
   `backdrop-filter`, så raderna suddas när de glider in bakom:

   ```css
   background-image: linear-gradient(160deg,
     rgba(27, 44, 34, .82) 0%, rgba(20, 26, 23, .84) 55%);
   backdrop-filter: blur(22px) saturate(160%);
   -webkit-backdrop-filter: blur(22px) saturate(160%);
   ```

   Lägg värdena som tokens bredvid `--gradient-hero-card`.

4. **Kortet komprimeras vid `scrollTop > 24`:**
   - huvudsiffran 42 → 21 px, flikbeloppen 14,5 → 13 px
   - **all text tonas ut** — "Kvar att spendera" och flikarnas namn. Kvar blir
     fyra siffror: den vita huvudsiffran och tre färgade flikbelopp, med
     understrykningen under den aktiva fliken.
   - skuggan djupnar så kortet läses som lyft ovanför listan

   `max-height` + `opacity`, aldrig `display: none` — annars hoppar det.
   Övergångar ~.22 s, `cubic-bezier(.2,.7,.3,1)`.

5. **Uttoningar i topp och botten** som egna absolut positionerade
   gradientlager — **inte** `mask-image` på scroll-ytan. En mask skapar en grupp
   som slår ut `backdrop-filter` hos barnen, och då försvinner glaset i kortet.
   Detta är testat; gör inte om det med mask. Topputtoningen ligger under kortet
   men över raderna, och är dold tills `scrollTop > 8`.

6. **Huvudsiffran blir vit** (`--color-text`) i stället för mint. Grönt betyder
   inkomst i resten av appen; samma färg på saldot gjorde att de lästes som
   samma sorts tal. Negativt saldo är fortfarande rött, och rubriken byter
   fortfarande till "Över budget". **Ta bort glöden** (`--glow-mint`) från
   hero-talet — med vit siffra blir en grön glöd fel, och glaset plus skuggan
   bär redan tyngden. Är tokenen oanvänd efteråt, städa bort den.

7. **`UndoToast`** ligger hårdkodad på `bottom: 158px`. Utan navbar stämmer det
   inte. Härled från samma variabel som FAB:en så att den alltid ligger precis
   ovanför knappen.

---

# Fas 3 — Extended FAB, färg per flik, profilknapp

**Branch:** `feat/contextual-fab`

1. **FAB:en blir en pill med synlig etikett** — `+ Utgift`, `+ Inkomst`,
   `+ Sparkonto`. Etiketterna finns redan i koden, men bara som `aria-label`
   och `title`. Behåll `aria-label` i full form ("Lägg till utgift").

2. **FAB:en byter färg med fliken:** mint / `--color-danger` /
   `--color-savings`, med mörk text i samma anda som `--color-on-mint`. Lägg
   till `--color-on-danger` och `--color-on-savings` som tokens. Skuggans glöd
   följer färgen. Övergång ~.22 s.

3. **Profilknappen** — en cirkel i samma storlek som FAB:en, svävande längst ner
   till höger, som navigerar till `/profile`. FAB:en stannar centrerad.
   Träffytan minst 44 px. Ikonen ska vara tydlig — avatar med initialer (samma
   `initials()` som Profile-sidan använder) eller ett kugghjul.

4. FAB:en ska aldrig gömmas på grund av scroll.

---

## Verifiering — redovisa detta innan du säger att en fas är redo för PR

- Sista raden i den längsta listan är synlig och klickbar längst ner, i alla
  tre flikar, med och utan UndoToast framme.
- Betald-krysset, autogiro-symbolen och den gula "kvar att betala själv"-raden
  fungerar och räknar rätt.
- Hela överföringsflödet fungerar: bocka av, markera alla, ångra alla, visa
  överförda, och fallbacken när sista bocken tas bort.
- Sparmålens progressbar, ETA-texten och överfördelningsvarningen ser ut och
  räknar som förut.
- En låst månad ser låst ut och beter sig likadant, även i komprimerat hero,
  och upplåsningen släpper fortfarande vid månadsbyte och fönsterbyte.
- Tomma listor ser rimliga ut i alla tre flikar, och kortet komprimeras inte
  konstigt när det inte finns något att scrolla.
- `/savings` landar rätt, `/profile` öppnas och bakåtpilen fungerar.
- Månadsbytet med svep och pilar fungerar, och `SwipeRow` raderar fortfarande.
- Glaset syns faktiskt bakom kortet vid scroll — inte bara en solid yta.
- Inget horisontellt scroll uppstår.
- `npm run build` och `npm run lint` är rena, alla befintliga tester gröna.
  Går ett gammalt test sönder: laga koden, ändra inte testet, om du inte
  förklarar varför testet var fel.
- `prefers-reduced-motion` omfattar de nya övergångarna.

Börja med att redovisa inventeringen för Fas 1 och vänta på mitt svar. Skriv
ingen kod förrän jag godkänt.
