# TransmitPie

A simple REST API for the Build Logic HTTP Transmitter used in the Roblox game by Tomtom4500.

This API lets you:
- send data like `01101101`
- read the current stored value
- change it anytime
- add custom headers like `Cookie: test=1`
- inspect the two incoming outputs: received GET and received POST
- ignore User-Agent completely, as requested

## Features

- `GET /api/transmitters/:id/data` — read the current stored data
- `POST /api/transmitters/:id/data` — set new data
- `PATCH /api/transmitters/:id/data` — update the current data
- `GET /api/transmitters/:id/headers` — read headers
- `POST /api/transmitters/:id/headers` — add headers
- `DELETE /api/transmitters/:id/headers/:headerName` — remove a header
- `GET /api/transmitters/:id/received/get` — list GET captures
- `GET /api/transmitters/:id/received/post` — list POST captures
- `POST /api/transmitters/:id/receive/get` — simulate a received GET request
- `POST /api/transmitters/:id/receive/post` — simulate a received POST request
- `GET /api/transmitters/:id/send` — quick data send helper
- `POST /api/transmitters/:id/send` — set data through a send route

## Quick start

```bash
npm install
npm start
```

Then open:

```text
http://localhost:3000/health
```

## Example usage

### Set data

```bash
curl -X POST http://localhost:3000/api/transmitters/test/data \
  -H "Content-Type: application/json" \
  -d '{"data":"01101101"}'
```

### Read data

```bash
curl http://localhost:3000/api/transmitters/test/data
```

### Change data

```bash
curl -X PATCH http://localhost:3000/api/transmitters/test/data \
  -H "Content-Type: application/json" \
  -d '{"data":"01101000"}'
```

### Add a header

```bash
curl -X POST http://localhost:3000/api/transmitters/test/headers \
  -H "Content-Type: application/json" \
  -d '{"Cookie":"test=1"}'
```

### Simulate a received GET

```bash
curl -X POST http://localhost:3000/api/transmitters/test/receive/get \
  -H "Content-Type: application/json" \
  -d '{"data":"from-get"}'
```

### Simulate a received POST

```bash
curl -X POST http://localhost:3000/api/transmitters/test/receive/post \
  -H "Content-Type: application/json" \
  -d '{"data":"from-post"}'
```

### Read received outputs

```bash
curl http://localhost:3000/api/transmitters/test/received/get
curl http://localhost:3000/api/transmitters/test/received/post
```

## Notes

- This project does not accept or process `User-Agent` values.
- Header storage is intentionally limited to custom headers like `Cookie`, `Authorization`, etc.
- The API is in-memory only. It is meant to emulate Build Logic HTTP Transmitter behavior in a simple local development environment.

## Example response

```json
{
  "id": "test",
  "data": "01101101",
  "headers": {
    "Cookie": "test=1"
  },
  "received": {
    "get": [],
    "post": []
  },
  "updatedAt": "2026-10-01T01:00:00.000Z"
}
```

Made for the Build Logic Roblox game by Tomtom4500.
