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

## Supabase

Zeby wlaczyc wspolne dane dla kilku telefonow:

1. Wejdz w Supabase -> SQL Editor.
2. Wklej i uruchom zawartosc `supabase-schema.sql`.
3. Wejdz w Authentication -> Providers -> Email.
4. Do testow najprosciej wylaczyc email confirmation albo potwierdzic adres z maila przed pierwszym logowaniem.
5. Wejdz w Project Settings -> API i skopiuj:
   - Project URL,
   - anon public key.
6. Wpisz je w `supabase-config.js`:

```js
window.SUPABASE_CONFIG = {
  url: "https://twoj-projekt.supabase.co",
  anonKey: "twoj-anon-public-key",
};
```

Po wdrozeniu aplikacja pokaze logowanie email/haslo i kod domu. Pierwsza osoba z danym kodem utworzy wspolny dom, kolejna osoba z tym samym kodem dolaczy do tych samych danych.
