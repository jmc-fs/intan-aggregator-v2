# Intan Aggregator (Deno)

Small Deno service that:

- Talks to Intan gRPC servers (protobuf in `protos/`).
- Streams data over Socket.IO.
- Exposes a minimal REST API via Oak.
- Reads controller metadata from MongoDB.

## Quick Start

1. Install Deno (https://deno.land/).
2. Update the MongoDB connection string in `main.ts` to your environment.
3. Generate TypeScript types from protobuf (only needed if you changed `.proto` files):

```bash
deno task proto
```

4. Run the server:

```bash
deno task dev
```

## Ports

- HTTP API (Oak): `http://localhost:8000`
- Socket.IO: `http://localhost:3000`

## API

- `GET /api` -> `{ message: "Hello, REST API!" }`
- `GET /sample` -> `{ numbersample: 160 * NUMBER_X_SAMPLE }`
- `GET /controllers` -> lists controllers from MongoDB with runtime state

## Socket.IO

Events:

- Client -> Server: `start` with payload `IntanChannel`:

```ts
{
  id_intan: string;
  mea_index: number;
  channel_index: number[];
}
```

- Server -> Client: `data` with flattened float array
- Server -> Client: `maintenance` with `{ id_intan, maintenance }`

## Protobuf / gRPC

Protos live in `protos/` and generated TS lives in `proto/`.

Generate types:

```bash
deno task proto
```

## Notes

- The MongoDB connection string is currently hardcoded in `main.ts`.
- If the gRPC server has no channels available, the app switches to “maintenance” mode and streams from a recorded file.

