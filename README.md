# Multi Tool – jelenlegi csomag

## Van benne
- Bal oldali menüs, moduláris alap
- Főoldalon log betöltés
- Közös store
- Pontozó modul
- Lefoglaló modul modalos szerkesztéssel
- Előző hetek mentése a Pontozónál (localStorage)

## Jelenlegi logika
- Normál csekkek: a Pontozóban jelennek meg és +2 pontot érnek
- + kiváltás csekkek: a Lefoglalóban jelennek meg és nem számolnak pontot
- Pontozó számol:
  - normál csekk
  - traffipax
  - lefoglalás
  - kiváltás
- Lefoglaló:
  - lefoglalt autók
  - szerkeszthető indok és kép link
  - kiváltások listája a + kiváltás csekk adataival

## Futtatás
Live Serverrel ajánlott.
