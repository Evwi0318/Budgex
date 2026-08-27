# Fyra fixar — klistra in i Claude Code

Fyra fel efter senaste ändringen. Ta enklaste lösningen på varje, rör inget
annat, och säg till när allt är klart och redo för PR.

**Branch:** `fix/layout-details`

---

## 1. Profilknappen sitter i skärmens högerkant

Den ska sitta i **appens** högerkant — inne i mobil-layouten, bredvid FAB:en —
inte längst ut på desktop-skärmen.

Appen ligger i en centrerad behållare på `max-w-[420px]` i `AppShell`. FAB:en
och profilknappen ska positioneras mot **den** behållaren, inte mot fönstret.

`Fab.tsx` portar sig i dag till `document.body` med kommentaren att `fixed`
inuti en Swiper-slide mäts mot sliden. **Swiper är borta — det skälet gäller
inte längre.** Enklaste lösningen: sluta porta, ge appbehållaren `relative` och
placera båda knapparna `absolute` inuti den. FAB:en centrerad, profilen i
högerkanten med samma avstånd från kanten som listans marginal.

Kontrollera att inget annat portat element (BottomSheet, UndoToast,
ConfirmDialog) påverkas av ändringen.

## 2. Röda "Ta bort" syns runt kortets kanter

I `SwipeRow` skymtar den röda knappen utanför radens hörn när raden ligger
still. Klippningen matchar inte radens faktiska form längre.

Se till att det röda lagret ligger **exakt** innanför samma yta och samma radie
som raden, och att klippningen sitter på det element som faktiskt har radens
radie. Får raden en ram eller marginal som det röda lagret inte har, syns
skillnaden i hörnen. Inget rött ska synas förrän man börjar svepa.

## 3. Svep mellan flikarna fungerar inte

Jag vill kunna svepa vänster/höger mellan Inkomst, Utgifter och Sparande — inte
bara trycka. Med samma korta oskärpe-övergång som vid tryck (~150 ms blur +
fade när listan byts).

Regler:

- Lås riktningen vid första rörelsen: `|dx| > |dy|` = flikbyte, annars vertikal
  scroll. Tröskel ~50 px.
- **Svepet ska bara starta på tomma ytor** — bakgrund, hero-kortet, listrubriken,
  tomma tillstånd. Startar svepet på en `SwipeRow` är det radens egen
  ta-bort-gest som gäller, inte flikbytet. Enklast: ignorera pointer-händelser
  vars target ligger inuti en rad.
- Månadsraden har redan sin egen horisontella gest — rör den inte.
- Inget nytt bibliotek. `motion` finns redan, annars räcker
  `pointerdown/move/up` och `touch-action: pan-y`.

## 4. Siffrorna i komprimerat hero är för små

Höj dem ett steg:

- huvudsiffran: ~21 → **26 px**
- flikbeloppen: ~13 → **15 px**

Behåll allt annat i komprimerat läge som det är — ingen text, bara siffrorna,
understrykningen kvar, samma glas och skugga. Justera kortets padding så att
det fortfarande ser balanserat ut med de större siffrorna.

---

## Innan du säger att det är klart

- Profilknappen och FAB:en ligger rätt på både mobilbredd och desktop, och
  FAB:en är fortfarande centrerad.
- Inget rött syns runt raderna förrän man sveper.
- Svep byter flik, men inte när man sveper på en rad — och radens ta-bort
  fungerar precis som förut.
- Vertikal scroll triggar aldrig flikbyte.
- `npm run build` och `npm run lint` rena, befintliga tester gröna.
