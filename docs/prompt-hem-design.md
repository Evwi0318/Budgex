# Prompt att klistra in i Claude Code

---

Jag vill införa ett nytt scroll- och hero-beteende på Hem-sidan i Budgex.
Designen är beslutad. Det här är en **ren presentations- och layoutändring** —
ingen domänlogik, inget API, inga migrationer, inga beräkningar.

## Viktigast av allt

Appen fungerar redan och jag är nöjd med den. **Förstör ingenting.**
Ser du dig själv redigera något i `Kvar.Domain`, `Kvar.Application`,
`Kvar.Infrastructure` eller `Kvar.Api` — stanna, det är fel spår.
Allt nedan sker i `frontend/src`.

Jag har redan gjort jämförelsen mellan designen och koden, så du behöver inte
föreslå saker som redan finns. Läs listan under "Ska INTE röras" lika noga som
den under "Ska byggas".

---

## Ska byggas

### 1. Riktig scroll-padding i botten — obligatoriskt

Det här är själva buggen. I dag har varje `SwiperSlide` i
`components/layout/AppShell.tsx` en inre `<div className="pb-24">` (96 px).
FAB:en sitter på `calc(5.5rem + env(safe-area-inset-bottom))` = 88 px och är
58 px hög, så dess ovankant hamnar på ~146 px. Sista raden i listan hamnar
under knappen och går inte att nå.

Botten-utrymmet ska vara navbarens höjd + FAB:ens överhäng +
`env(safe-area-inset-bottom)`, ungefär 150 px, och det ska definieras **på ett
ställe** — en CSS-variabel i `@theme` i `src/index.css` (t.ex.
`--space-scroll-bottom`) som både `AppShell` och FAB:en läser. Inga magiska tal
utspridda i komponenter.

### 2. Uttoningsmask i botten av scroll-ytan

```css
mask-image: linear-gradient(
  to bottom,
  #000 0,
  #000 calc(100% - 96px),
  transparent 100%
);
-webkit-mask-image: /* samma */;
```

Måste ligga på det element som faktiskt scrollar — `SwiperSlide` med
`overflow-y-auto` — **inte** på den inre `pb-24`-diven. Kontrollera att den inte
klipper något när listan är kortare än skärmen.

### 3. Sticky hero på Hem

`components/home/HeroCard.tsx` ska fastna högst upp i scroll-ytan.
`components/savings/SavingsTopCard.tsx` är redan `sticky top-3` — Hem ska bli
konsekvent med Sparande, inte tvärtom. Titta på hur den är gjord först.

`position: sticky` fungerar bara mot närmaste scrollande förälder. Med Swiper i
mellanrummet: verifiera att inget led har `overflow: hidden` eller `transform`
som bryter stickyn, och lös det på HeroCard-elementet självt — inte genom att
lägga till en ny wrapper runt Swiper.

### 4. Hero komprimeras vid scroll

Vid `scrollTop > 24`:

- hero-siffran går från 42 px till ~22 px (`HeroAmount`)
- rubriken ("Kvar att spendera") och flikarnas belopp tonar ut
- flikraden med understrykningen **blir kvar** — den är navigation
- kortets padding minskar

Använd `max-height` + `opacity`, aldrig `display: none` — annars hoppar det
i stället för att glida. Behåll `transition`-tider runt .24 s och
`cubic-bezier(.2,.7,.3,1)`.

**Etiketten måste överleva komprimeringen.** En naken grön siffra är tvetydig.
I komprimerat läge: `Kvar · 37 150 kr` på en rad.

### 5. Navbar som gömmer sig vid scroll ner

`components/layout/BottomNav.tsx` glider ut vid scroll nedåt och kommer
tillbaka vid minsta scroll uppåt.

Scroll-lyssnaren hör hemma i **`AppShell`**, på slide-elementet som äger
scrollen — inte i `BottomNav`, som inte har någon scroll att lyssna på.
Ett state, härlett till både navbar, hero-kollaps och FAB.

```tsx
const [compact, setCompact] = useState(false);
const [hidden, setHidden] = useState(false);
const last = useRef(0);

function onScroll(e: React.UIEvent<HTMLDivElement>) {
  const y = e.currentTarget.scrollTop;
  setCompact(y > 24);
  if (Math.abs(y - last.current) > 6) {
    setHidden(y > last.current && y > 40);
    last.current = y;
  }
}
```

Tröskeln 6 px hindrar fladder vid studs-scroll; `y > 40` gör att baren alltid
är synlig högst upp. Transition: `transform .26s cubic-bezier(.2,.7,.3,1)`.

Varje slide har sin egen scroll. Antingen delas state per slide, eller så
återställs det vid sidbyte — **baren får aldrig ligga kvar utgliden när man
svepat till en annan sida.**

### 6. FAB:en stannar kvar när baren gömmer sig

`components/ui/Fab.tsx` portas redan till `document.body`, så den ärver ingen
transform från navbaren — strukturen är alltså redan rätt. Endast `bottom`
behöver reagera: från `calc(5.5rem + env(safe-area-inset-bottom))` till
ungefär `calc(1.2rem + env(safe-area-inset-bottom))` när baren är ute, med
samma transition-kurva.

FAB:en ska **aldrig** gömmas, krympas eller dockas i baren.

### 7. UndoToast måste följa med

`components/ui/UndoToast.tsx` ligger hårdkodad på
`bottom: calc(158px + env(safe-area-inset-bottom))`. Gömmer sig baren utan att
toasten flyttas svävar den mitt i tomma intet. Den ska alltid ligga direkt
ovanför FAB:en, i båda lägena. Härled från samma variabler.

### 8. Extended FAB med synlig etikett

FAB:en är i dag en rund 58 px-knapp med bara `+`. Etiketterna finns redan i
koden — `"Lägg till inkomst"` / `"Lägg till utgift"` / `"Lägg till sparkonto"` —
men bara som `aria-label` och `title`. Gör dem synliga: en pill-formad knapp
med `+` och en kort text (`Utgift`, `Inkomst`, `Sparkonto`).

Behåll `aria-label` i sin fulla form. Kontrollera att den bredare knappen inte
täcker navbarens ikoner — navbaren har redan en tom `slot` i mitten,
kolla att den räcker.

### 9. Fixa Sparande-fliken i hero-kortet

I `HeroCard` filtrerar `Inkomst` och `Utgifter` listan, medan `Sparande ›`
navigerar till en annan sida — men alla tre ser likadana ut. Det är en fälla:
användaren lär sig att kortet är ett filter och blir förflyttad utan att ha
bett om det.

**Fråga mig innan du väljer** hur den ska lösas — jag vill se alternativen
först. Ändra ingenting här utan mitt svar.

### 10. Etiketten "Inkomst" i hero-kortet

Enligt projektets spec ingår CSN-lånet aldrig i det spenderbara, men
användarens konto har tagit emot hela beloppet. Två siffror som båda heter
"inkomst" är förvirrande.

**Undersök först och rapportera:** kan `summary` / API:t i dag skilja på
CSN-bidrag och CSN-lån, eller är det bara ett totalbelopp? Föreslå sedan
det minsta möjliga greppet — troligen bara en etikettändring till
`Disponibelt`, utan att röra beräkningen. **Bygg inget här förrän jag godkänt.**

### 11. Samma beteende på Sparande-sidan

`SavingsTopCard` är redan sticky men krymper inte. Får Hem en kollapsande hero
och Sparande inte, känns sidorna som två olika appar. Återanvänd samma
kollaps-mekanism på båda — gärna en delad hook.

---

## Ska INTE röras — beslutat, föreslå inte annat

**Typsnittet.** Appen använder rubik, laddad i `index.html` och satt som
`--font-sans`. Det ska den fortsätta göra. Byt inte typsnitt, föreslå inte
typsnittsbyte.

**Färgtokens.** `@theme` i `src/index.css` gäller. Allt nytt använder
`var(--color-mint)`, `var(--color-danger)`, `var(--color-savings)` osv.
Hårdkoda aldrig hex i komponenter.

**Hero-siffrans betydelse.** Den stora siffran är alltid `safeToSpend`, i alla
lägen. Den ska inte byta betydelse när man byter flik. Flikarna visar sina egna
belopp under sig — så är det byggt, och så ska det förbli.

**Inga nya horisontella gester.** Appen har redan tre: Swiper byter sida,
`MonthNav` byter månad, `SwipeRow` raderar en rad. Lägg inte till svep för att
byta hero-flik. Flikarna trycker man på.

**Flikarna i hero-kortet** med `motion` layoutId-understrykningen fungerar och
ska bara ärva det nya komprimerade läget — inte byggas om.

**Sparande-sidans funktioner:** `useTransferMutation`, `useTransferAllMutation`,
`showTransferred`-växlingen och fallbacken när sista bocken tas bort
(den är kommenterad i koden för att den var en bugg en gång).

**Månadslåset:** `useMonthLock`, `dimmed`-läget på hero, lås-knappen i
listrubriken. Alla nya lägen måste respektera `isLocked` — hero i komprimerat
läge ska fortfarande dimmas när månaden är låst.

**BottomSheet-formulären** och deras dirty-hantering (`onDirtyChange`,
"Kasta ändringarna?"). Det är det ömtåligaste i appen.

**Ångra-fönstret** vid radering — 5 s fördröjd radering, commit vid unmount,
ConfirmDialog för återkommande poster. Bara toastens position ändras.

**EmptyState-varianterna** och `PaymentRow`. Kontrollera bara att hero-kollapsen
ser vettig ut när listan är tom.

**Inga nya bibliotek.** `motion` och `swiper` finns redan — använd dem.
Resten är CSS plus ett `useState`/`useRef`.

---

## Fas 1 — inventera och föreslå. Skriv INGEN kod ännu.

1. Bekräfta vilket element som faktiskt scrollar per sida, och om
   `position: sticky` fungerar där i dag eller blockeras av något led i Swiper.
2. Lista alla ställen med hårdkodade botten-avstånd (`pb-24`, `5.5rem`, `158px`,
   `h-16`) som ska ersättas av gemensamma tokens.
3. Svara på frågan i punkt 10 om CSN-uppdelningen i `summary`.
4. Visa alternativen för punkt 9 (Sparande-fliken) och vänta på mitt val.
5. Föreslå uppdelning i PR:ar — helst tre: (a) tokens + scroll-padding + mask,
   (b) sticky/kollapsande hero + navbar + FAB + toast, (c) extended FAB.
6. Vänta på mitt godkännande innan du skriver kod.

## Fas 2 — implementera, efter godkännande

- En branch per PR, conventional commits, grön CI innan merge.
- Rör inte auth, routing, CI eller deploy.
- Respektera `prefers-reduced-motion` — den finns redan i `index.css`,
  se till att de nya övergångarna omfattas.
- Tangentbordsfokus: den utglidna navbaren får inte fånga fokus
  (`inert` eller `visibility` vid behov).
- Alla befintliga tester ska vara gröna. Går ett gammalt test sönder — laga
  koden, ändra inte testet, om du inte förklarar varför testet var fel.

## Verifiering innan du föreslår merge

Redovisa att du kontrollerat:

- sista raden i den längsta listan är synlig och klickbar längst ner — på både
  Hem och Sparande, med och utan UndoToast framme,
- FAB:en är synlig och klickbar i båda navbar-lägena och glider mjukt mellan dem,
- FAB:ens etikett täcker inte navbarens ikoner,
- baren kommer tillbaka direkt vid scroll uppåt, utan fladder,
- baren är aldrig utgliden efter ett sidbyte via svep eller bottennavigering,
- hero fastnar och komprimeras korrekt, och etiketten syns i komprimerat läge,
- en låst månad ser fortfarande låst ut i komprimerat läge,
- tomma listor ser rimliga ut,
- masken klipper inget när listan är kortare än skärmen,
- inget horisontellt scroll uppstår, och de befintliga svep-gesterna
  (sidbyte, månadsbyte, radera rad) fungerar precis som förut.

## Om du blir osäker

Fråga hellre en gång för mycket. Krockar designen med hur koden fungerar i dag:
stanna, beskriv konflikten och låt mig välja. Gissa aldrig.

Börja med Fas 1.
