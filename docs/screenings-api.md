# API dla seansów (screenings)

Ten dokument opisuje endpointy API związane z seansami filmowymi. Skupia się na tym, czego potrzebuje frontend: jakie żądania wysłać, jakie parametry są dostępne i jak wyglądają odpowiedzi.

## Podstawy
- Bazowy URL (backend dev): `http://127.0.0.1:8000/api/`
- Zasób: `/screenings/`
- Format: JSON
- Strefa czasu: daty/czasy w ISO 8601, timezone-aware (UTC lub lokalna wg konfiguracji). 
- Autoryzacja dla modyfikacji: Bearer JWT (SimpleJWT). Dla żądań POST/PATCH/PUT/DELETE dodaj nagłówek: 
  - `Authorization: Bearer <access_token>`

## Walidacje i zasady biznesowe (ważne dla UI)
- `start_time`
  - musi być w przyszłości,
  - sekundy i mikrosekundy = 0,
  - dozwolone minuty tylko: 0, 10, 20, 30, 40, 50 (krok co 10 minut),
  - unikalność: w tej samej sali (`auditorium`) nie może istnieć seans o identycznym `start_time`.
- Bufory czasowe (harmonogram):
  - minimum 30 minut przerwy po zakończeniu poprzedniego seansu (w tej samej sali),
  - minimum 30 minut przerwy przed kolejnym seansem (w tej sameej sali),
  - długość seansu wynika z `movie.duration_minutes`.
- `published_at`
  - opcjonalne; jeśli nie podasz, backend ustawi bieżący czas,
  - jeśli jawnie podasz wartość, nie może być w przeszłości,
  - jeśli podasz `null`, zostanie potraktowane jako „opublikuj teraz”.

---

## Lista seansów (GET /screenings/)
Publiczne. Zwraca wyniki pogrupowane per film, a paginacja odbywa się po unikalnych filmach (nie pojedynczych seansach).

- Metoda: GET `/api/screenings/`
- Query params (filtry):
  - `movie_title`: fragment tytułu (case-insensitive),
  - `auditorium_id`: ID sali,
  - `auditorium`: nazwa sali (fragment),
  - `genre`: nazwa gatunku (dokładna lub fragment, zależnie od implementacji filtra),
  - `start_after`: ISO datetime; zwróć seanse po tej dacie,
  - `start_before`: ISO datetime; zwróć seanse przed tą datą,
  - `published_after`: ISO datetime,
  - `published_before`: ISO datetime,
  - `page`: numer strony (paginacja po filmach, domyślnie 10 filmów na stronę).

Przykład żądania:
```http
GET /api/screenings/?movie_title=Matrix&start_after=2025-12-01T00:00:00Z&page=1
```

Struktura odpowiedzi (paginacja DRF):
```json
{
  "count": 12,              // liczba unikalnych filmów spełniających kryteria
  "next": "http://.../api/screenings/?page=2",
  "previous": null,
  "results": [
    {
      "movie": {
        "id": 7,
        "title": "Matrix",
        "original_title": "The Matrix",
        "release_date": "1999-03-31",
        "duration_minutes": 136,
        "genres": [ { "id": 1, "name": "Sci-Fi" } ]
      },
      "projection_types": [
        {
          "projection_type": "2D", // lub null jeśli brak typu
          "screenings": [
            {
              "id": 101,
              "auditorium": { "id": 3, "name": "Sala 1" },
              "published_at": "2025-12-02T10:00:00Z",
              "start_time": "2025-12-03T18:20:00Z",
              "created_at": "2025-11-15T12:00:00Z",
              "updated_at": "2025-11-15T12:00:00Z"
            }
          ]
        }
      ]
    }
  ]
}
```
Uwagi:
- `count` dotyczy liczby filmów (grup), a nie wszystkich seansów.
- Wewnątrz filmu seanse są dalej zgrupowane per `projection_type`.
- Domyślne sortowanie: po tytule filmu, następnie po typie projekcji i `start_time`.

---

## Utworzenie seansu (POST /screenings/)
Wymaga uprawnień admina (Bearer JWT).

- Metoda: POST `/api/screenings/`
- Body (JSON):
  - `movie_id` (int) — wymagane,
  - `auditorium_id` (int) — wymagane,
  - `start_time` (ISO datetime) — wymagane; patrz zasady wyżej,
  - `projection_type_id` (int|null) — opcjonalne,
  - `published_at` (ISO datetime|null) — opcjonalne.

Przykład:
```json
{
  "movie_id": 7,
  "auditorium_id": 3,
  "start_time": "2025-12-03T18:20:00Z",
  "projection_type_id": 2
}
```

Odpowiedź (201 Created) — pojedynczy obiekt seansu (nie pogrupowany):
```json
{
  "id": 101,
  "movie": { "id": 7, "title": "Matrix", ... },
  "auditorium": { "id": 3, "name": "Sala 1" },
  "published_at": "2025-11-15T12:00:00Z",
  "start_time": "2025-12-03T18:20:00Z",
  "genres": [ { "id": 1, "name": "Sci-Fi" } ],
  "projection_type": { "id": 2, "name": "2D" },
  "created_at": "2025-11-15T12:00:00Z",
  "updated_at": "2025-11-15T12:00:00Z"
}
```

Typowe błędy (400):
```json
{ "start_time": ["start_time must be in the future"] }
{ "start_time": ["start_time must be aligned to full hour or 10/20/30/40/50 minutes (seconds must be 0)"] }
{ "non_field_errors": ["Start time is too early: must be at least 30 minutes after the previous screening ends."] }
{ "non_field_errors": ["Screening would overlap or leave insufficient gap before the next screening (need 30 minutes buffer)."] }
{ "non_field_errors": ["A screening in this auditorium at the given start_time already exists."] }
{ "published_at": ["published_at must be in the present or future"] }
```

---

## Szczegóły seansu (GET /screenings/{id}/)
Publiczne. Zwraca pojedynczy seans.

- Metoda: GET `/api/screenings/{id}/`
- Odpowiedź (200): taki sam kształt jak przy POST 201 (pojedynczy obiekt seansu).
- 404 jeśli brak rekordu.

---

## Aktualizacja seansu (PATCH/PUT /screenings/{id}/)
Wymaga uprawnień admina (Bearer JWT). Walidacje dokładnie jak przy POST. 

- PATCH — częściowa aktualizacja; możesz podać tylko zmieniane pola (`movie_id`, `auditorium_id`, `projection_type_id`, `start_time`, `published_at`). Backend bierze brakujące wartości z bieżącego stanu seansu i sprawdza reguły buforów „na całościowym, nowym” stanie.
- PUT — pełna aktualizacja; oczekujemy pełnego payloadu jak przy POST.

Odpowiedzi:
- 200 — zaktualizowany seans (pojedynczy obiekt).
- 400 — te same kody błędów, co przy POST (w tym konflikty harmonogramu).
- 401 — brak tokenu,
- 403 — token bez uprawnień admina.

Przykład (PATCH):
```json
{
  "projection_type_id": null
}
```

---

## Usunięcie seansu (DELETE /screenings/{id}/)
Wymaga uprawnień admina (Bearer JWT).

- Metoda: DELETE `/api/screenings/{id}/`
- Odpowiedź: 204 No Content.
- Błędy: 401/403/404.

---

## Przykłady (frontend)

### Pobranie pierwszej strony seansów z filtrem po tytule
```js
// fetch
const res = await fetch('/api/screenings/?movie_title=Matrix&page=1');
const data = await res.json();
```

### Utworzenie seansu (admin)
```js
import dayjs from 'dayjs';

const token = '<ACCESS_TOKEN>';
const start = dayjs().add(1, 'day').set('minute', 20).set('second', 0).set('millisecond', 0).toISOString();

const res = await fetch('/api/screenings/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    movie_id: 7,
    auditorium_id: 3,
    start_time: start,
    projection_type_id: 2,
  }),
});
const data = await res.json();
```

### Zmiana (PATCH) samego typu projekcji (admin)
```js
const res = await fetch('/api/screenings/101/', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({ projection_type_id: null }),
});
const data = await res.json();
```

### Usunięcie seansu (admin)
```js
await fetch('/api/screenings/101/', {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${token}` },
});
```

---

## Wskazówki dla UI
- Przy wyborze godzin w kalendarzu/datepickerze ogranicz minuty do: 0/10/20/30/40/50 i zeruj sekundy.
- Komunikaty 400 typu `non_field_errors` przedstawiaj w UI jako ogólny konflikt z harmonogramem (zawierają już zrozumiały tekst).
- Pamiętaj, że lista jest pogrupowana po filmie: `results` to tablica filmów, a nie płaska lista seansów. Jeśli potrzebujesz płaskiej listy na froncie — spłaszcz `projection_types[*].screenings`.
- Paginacja operuje na liczbie filmów — wskaźnik `count` to liczba grup (filmów), a nie seansów.
