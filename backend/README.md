# cookify backend

Quarkus-Backend mit JDBI, PostgreSQL und Liquibase.

## Lokale Entwicklung

Im `dev`-Profil startet Quarkus automatisch eine frische PostgreSQL-Datenbank per Testcontainers/Dev Services.
Dafuer muss lokal Docker laufen.

Start:

```bash
mvn quarkus:dev
```

In IntelliJ kann dafuer die Run-Config `Cookify Backend (Dev)` verwendet werden.

Beim Start wird die Datenbank hochgezogen und Liquibase spielt das Schema automatisch ein.
Die manuelle lokale Postgres-Konfiguration wird nur noch im `prod`-Profil ueber `DB_URL`, `DB_USERNAME` und `DB_PASSWORD` verwendet.

Wenn beim Start weder Eintraege in `invite` noch in `user_account` vorhanden sind, erzeugt der Server automatisch einen initialen `ADMIN`-Invite und schreibt dessen Token ins Log.

Fuer manuelle API-Tests liegt eine Bruno-Collection unter `backend/bruno`.
Die Collection kann direkt in Bruno importiert werden; das lokale Environment verwendet standardmaessig `http://localhost:8080`.
Der Login-Request aktualisiert in Bruno automatisch `sessionId` und `authorizationHeader` fuer die nachfolgenden User-Requests.
Der Admin-Invite-Request verwendet separat `adminAuthorizationHeader`, damit die `ADMIN`-geschuetzte Route nicht versehentlich mit einer `USER`-Session aufgerufen wird.

## Rollen

Liquibase legt diese Rollen fest:

- `ADMIN` mit `c0a8012e-8b7d-4f5b-9c59-7f8f15a0b201`
- `USER` mit `d3b55f57-8e11-4b5d-8d6a-8f4b7b6f2c42`

## Endpunkte

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/invite`
- `POST /api/invite/{id}`
- `GET /api/user`
- `GET /api/user/{id}`
- `PUT /api/user/{id}`
- `DELETE /api/user/{id}`

## Authentifizierung

Alle Endpunkte sind standardmaessig gesichert.
Oeffentlich sind nur `POST /api/auth/login` und `POST /api/invite/{id}`.

Beim Login sendet der Client `username` und `password`.
Das Passwort wird serverseitig gegen den gespeicherten bcrypt-Hash geprueft.
Bei erfolgreichem Login wird eine Session-ID als UUID erzeugt und als Bearer-Token fuer weitere Requests verwendet.
`POST /api/auth/logout` beendet die aktuelle Session wieder.

Beispiel fuer den Header:

```text
Authorization: Bearer 11111111-1111-1111-1111-111111111111
```

Alle geschuetzten Endpunkte akzeptieren aktuell nur Sessions von Usern mit der Rolle `USER`.
`POST /api/invite` ist die Ausnahme und erfordert die Rolle `ADMIN`.

## Beispiel fuer `POST /api/auth/login`

```json
{
  "username": "jane.doe",
  "password": "super-secret-password"
}
```

Beispiel-Response:

```json
{
  "sessionId": "33333333-3333-3333-3333-333333333333",
  "user": {
    "id": "22222222-2222-2222-2222-222222222222",
    "username": "jane.doe",
    "displayName": "Jane Doe",
    "created": "2026-06-07T18:00:00Z",
    "roleId": "d3b55f57-8e11-4b5d-8d6a-8f4b7b6f2c42"
  }
}
```

## Beispiel fuer `POST /api/invite`

```json
{
  "roleName": "USER"
}
```

## Beispiel fuer `POST /api/invite/{id}`

```json
{
  "username": "jane.doe",
  "password": "super-secret-password",
  "displayName": "Jane Doe"
}
```

Die Rolle kommt dabei aus dem Invite und nicht aus dem Request.

## Beispiel fuer `PUT /api/user/{id}`

```json
{
  "username": "jane.doe",
  "password": "new-secret-password",
  "displayName": "Jane Doe",
  "roleId": "d3b55f57-8e11-4b5d-8d6a-8f4b7b6f2c42"
}
```

Wenn `password` bei einem Update nicht gesendet wird, bleibt das bestehende Passwort erhalten.

## Datenmodell

- `role.id` ist ein Postgres-`UUID`
- `user_account.id` ist ein Postgres-`UUID`
- `user_account.role_id` ist ein Postgres-`UUID` mit Foreign Key auf `role.id`
- `invite.id` ist ein Postgres-`UUID`
- `invite.role_id` ist ein Postgres-`UUID` mit Foreign Key auf `role.id`
- `session.id` ist ein Postgres-`UUID`
- `session.user_id` ist ein Postgres-`UUID` mit Foreign Key auf `user_account.id`
