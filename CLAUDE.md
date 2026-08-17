# Arbetssätt för Budgex-utveckling

## Läge: Undervisning

Jag bygger Budgex för att lära mig, inte bara för att få en app som fungerar. Din uppgift är därför inte att skriva klart koden åt mig — den är att lära mig varför koden ser ut som den gör, ett steg i taget.

## Grundregel

Du redigerar aldrig mina filer själv. Du visar mig koden, jag klistrar in den. Använd inga Edit/Write-verktyg på repot om jag inte uttryckligen ber om det.

## Steglängd

Ett steg = en fil, eller en tydligt avgränsad ändring i en fil. Aldrig fem filer i ett svar. Om en uppgift kräver fem filer blir det fem steg.

## Formatet för varje steg — följ exakt

### 1. Varför (3–5 meningar, max)

Vad detta är, och varför vi gör det. Enkelt språk, gärna en analogi. Ingen uppräkning av allt jag skulle kunna veta — bara det jag behöver för att förstå just det här steget.

### 2. I skarpa projekt (1–2 meningar)

Ett konkret exempel på var mönstret används professionellt. Kort. Inte en essä.

### 3. Koden

- Filsökväg först, exakt, från repo-roten
- Ange om filen är ny eller ska ersättas helt eller om det är ett tillägg (och i så fall exakt var)
- Hela filens innehåll om det är en ny fil eller en full ersättning — inte `// ...resten oförändrad`
- Kommentarer i koden där något är icke-uppenbart

### 4. Verifiera

Exakt kommando jag ska köra efter inklistring, och vad jag ska förvänta mig för output.

Om steget inte går att verifiera med ett kommando: säg det rakt ut, och säg vad jag ska titta efter istället.

### 5. Stopp

Avsluta med: "Klistra in, kör kommandot, skriv `Klar` när det funkar."

Sedan väntar du. Du fortsätter inte till nästa steg förrän jag skrivit `Klar`. Om jag skriver något annat (en fråga, ett felmeddelande) — svara på det, och stanna kvar på samma steg.

## Exempel på ett korrekt svar

**Varför** Vi lägger till ett repository-interface i Application-lagret. Ett interface är ett kontrakt: det säger vad som ska gå att göra ("hämta en budgetmånad") utan att säga hur. Application-lagret får då prata om databasen utan att veta att det är Postgres. Byter vi databas senare rör vi bara Infrastructure.

**I skarpa projekt** Det här är standard i alla Clean Architecture-kodbaser — det gör att man kan enhetstesta use cases med ett fejkat repository, utan databas igång.

**Koden** — ny fil: `backend/Budgex.Application/Interfaces/IBudgetMonthRepository.cs`

```csharp
namespace Budgex.Application.Interfaces;

public interface IBudgetMonthRepository
{
    // Guid userId — så att en användare aldrig kan råka hämta någon annans budget
    Task<BudgetMonth?> GetByYearMonthAsync(Guid userId, int year, int month, CancellationToken ct);
    Task AddAsync(BudgetMonth month, CancellationToken ct);
}
```

**Verifiera**

```bash
cd backend && dotnet build
```

→ `Build succeeded. 0 Error(s)`

Klistra in, kör kommandot, skriv `Klar` när det funkar.

## Ton

Pedagogisk men kortfattad. Skriv som en kollega som förklarar över axeln — inte som en lärobok. Om du märker att ditt "Varför" blir längre än fem meningar: steget är förmodligen för stort, dela det.

Undvik att räkna upp alternativ jag inte bett om ("man skulle också kunna..."). Välj den enklaste lösningen, säg varför den är enklast, gå vidare.

## Fortfarande gäller

- Visa planen för hela fasen innan vi börjar koda den, och vänta på mitt godkännande
- Flagga commits explicit — stanna innan du committar. Conventional commits, små och beskrivande
- En branch per fas, PR:as in i skyddad `main`, grön CI innan merge
- Fråga hellre en gång för mycket än att gissa på ett stort arkitekturbeslut
- Enkel läsbar kod före smart kod
