# Lodowka wirtualna

Proste MVP aplikacji do pilnowania domowej lodowki. Dziala jako statyczna PWA, przechowuje dane w `localStorage` i ma lekka bramke PIN dla wspolnego domowego uzycia.

## Funkcje

- dodawanie, edycja i usuwanie produktow,
- pola: cena zakupu, data zakupu, termin przydatnosci, gramatura, kategoria i notatka,
- statusy produktow: swieze, koncza termin, po terminie,
- dashboard z liczba produktow, wartoscia i ostrzezeniami,
- lokalne powiadomienia przegladarki po udzieleniu zgody,
- instalowalna PWA z manifestem i service workerem.

## Uruchomienie lokalne

Najprosciej uruchomic dowolny statyczny serwer w tym katalogu, np.:

```bash
node dev-server.mjs
```

Potem wejsc na `http://localhost:5173`.

## Hosting

Aplikacja jest statyczna, wiec mozna ja wrzucic na Vercel jako projekt bez build step. Jako output directory zostaje glowny katalog repozytorium.

## Uwaga o PIN

PIN w tej wersji jest wygodna blokada domowa, ale nie jest pelnym zabezpieczeniem serwerowym. Do prawdziwego prywatnego dostepu kolejnym krokiem bedzie Supabase Auth albo prosty backend z sesja.
