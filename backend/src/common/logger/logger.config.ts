import { randomUUID } from 'crypto';
import { IncomingMessage, ServerResponse } from 'http';
import { Writable } from 'stream';
import { ConfigService } from '@nestjs/config';
import { Params } from 'nestjs-pino';

const REQUEST_ID_HEADER = 'x-request-id';

// Field names/paths that must never be written to logs in plaintext.
const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["set-cookie"]',
  'res.headers["set-cookie"]',
  'req.body.password',
  'req.body.newPassword',
  'req.body.currentPassword',
  'req.body.code',
  'req.body.token',
];

// ── ANSI helpers ───────────────────────────────────────────────────────────────
const R = '\x1b[0m'; // reset
const B = '\x1b[1m'; // bold
const D = '\x1b[2m'; // dim

const c = {
  gray:    '\x1b[90m',
  red:     '\x1b[31m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  magenta: '\x1b[35m',
  bred:    '\x1b[91m',
  bgreen:  '\x1b[92m',
  byellow: '\x1b[93m',
  bblue:   '\x1b[94m',
  bcyan:   '\x1b[96m',
  cyan:    '\x1b[36m',
  white:   '\x1b[97m',
} as const;

// ── Field formatters ───────────────────────────────────────────────────────────

function fmtTime(epochMs: number): string {
  const d = new Date(epochMs);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${D}${c.gray}${hh}:${mm}:${ss}${R}`;
}

function fmtLevel(n: number): string {
  switch (n) {
    case 10: return `${D}${c.gray} TRAC${R}`;
    case 20: return `${D}${c.gray} DBUG${R}`;
    case 30: return `${c.bblue}${B} INFO${R}`;
    case 40: return `${c.byellow}${B} WARN${R}`;
    case 50: return `${c.bred}${B}  ERR${R}`;
    case 60: return `${c.bred}${B}  FTL${R}`;
    default: return `${c.gray} ????${R}`;
  }
}

function fmtMethod(method: string): string {
  const p = method.padStart(7);
  switch (method) {
    case 'GET':     return `${c.cyan}${p}${R}`;
    case 'POST':    return `${c.bgreen}${p}${R}`;
    case 'PUT':     return `${c.yellow}${p}${R}`;
    case 'PATCH':   return `${c.magenta}${p}${R}`;
    case 'DELETE':  return `${c.red}${B}${p}${R}`;
    default:        return `${c.gray}${p}${R}`;
  }
}

function fmtStatus(code: number): string {
  const s = String(code).padStart(3);
  if (code >= 500) return `${c.bred}${B}${s}${R}`;
  if (code >= 400) return `${c.byellow}${B}${s}${R}`;
  if (code >= 300) return `${c.bcyan}${s}${R}`;
  if (code >= 200) return `${c.bgreen}${s}${R}`;
  return `${c.gray}${s}${R}`;
}

function fmtLatency(ms: number): string {
  const label = ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
  const color =
    ms < 50   ? c.bgreen  :
    ms < 200  ? c.byellow :
    ms < 1000 ? c.yellow  : c.bred;
  return `${color}${label.padStart(7)}${R}`;
}

// ── Log line builder ───────────────────────────────────────────────────────────

// Matches: "GET /api/auth/login 401 - 73ms"  (timing is optional — error
// responses may omit it depending on the pino-http version's callback arity).
const HTTP_RE =
  /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+(\S+)\s+(\d{3})(?:\s+-\s+(\d+)ms)?$/;

interface PinoLog {
  time: number;
  level: number;
  msg?: string;
  err?: { message?: string } | string;
  context?: string;
  req?: { id?: string };
}

function buildLine(obj: PinoLog): string {
  const time  = fmtTime(obj.time);
  const level = fmtLevel(obj.level);
  const msg   = obj.msg ?? '';

  const m = HTTP_RE.exec(msg);
  if (m) {
    const [, method, rawUrl, statusStr, msStr] = m;
    const qIdx    = rawUrl.indexOf('?');
    const path    = qIdx === -1 ? rawUrl : rawUrl.slice(0, qIdx);
    const query   = qIdx === -1 ? ''     : rawUrl.slice(qIdx);
    const trimmed = query.length > 50 ? query.slice(0, 47) + '…' : query;

    const urlCol = `${c.white}${path}${R}${D}${c.gray}${trimmed}${R}`;

    const extras: string[] = [];
    if (obj.err) {
      const e = typeof obj.err === 'string' ? obj.err : obj.err.message ?? '';
      if (e) extras.push(`${c.red}${e}${R}`);
    }
    if (obj.context) extras.push(`${D}${c.gray}[${obj.context}]${R}`);

    // msStr is undefined when customErrorMessage omits the timing segment.
    const latency = msStr !== undefined ? `  ${fmtLatency(Number(msStr))}` : '';

    return (
      `${time}  ${level}  ${fmtMethod(method)}  ` +
      `${urlCol.padEnd(45)}  ` +
      `${fmtStatus(Number(statusStr))}` +
      latency +
      (extras.length ? `  ${extras.join('  ')}` : '')
    );
  }

  // Non-HTTP line (bootstrap messages, DB queries, guard logs, …)
  const extras: string[] = [];
  if (obj.err) {
    const e = typeof obj.err === 'string' ? obj.err : obj.err.message ?? '';
    if (e) extras.push(`${c.red}${e}${R}`);
  }
  if (obj.context)  extras.push(`${D}${c.gray}[${obj.context}]${R}`);
  if (obj.req?.id)  extras.push(`${D}${c.gray}id:${obj.req.id}${R}`);

  return (
    `${time}  ${level}  ${c.white}${msg}${R}` +
    (extras.length ? `  ${extras.join('  ')}` : '')
  );
}

/**
 * A Writable stream that runs in the main thread (no worker threads, pure TS).
 * Pino writes newline-delimited JSON into it; we parse and pretty-print each line.
 */
function createDevStream(): Writable {
  return new Writable({
    write(chunk: Buffer, _enc: BufferEncoding, done: () => void) {
      const lines = chunk.toString().split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          process.stdout.write(buildLine(JSON.parse(trimmed) as PinoLog) + '\n');
        } catch {
          process.stdout.write(trimmed + '\n');
        }
      }
      done();
    },
  });
}

// ── Slim req/res serializers ───────────────────────────────────────────────────

/**
 * Slim serializer for the incoming request.
 * Keeps only the fields useful for tracing; all noisy headers are dropped.
 */
function reqSerializer(req: IncomingMessage & { id?: string }) {
  return {
    id: req.id,
    method: req.method,
    url: req.url,
    remoteAddress: req.socket?.remoteAddress,
  };
}

/**
 * Slim serializer for the outgoing response.
 * Keeps only the status code; the full header map is never written.
 */
function resSerializer(res: ServerResponse) {
  return { statusCode: res.statusCode };
}

// ── Main config factory ────────────────────────────────────────────────────────

/**
 * Builds the nestjs-pino module options. Every log line (across auth, users,
 * mail, prisma, etc.) is tagged with the same `req.id` for a given request,
 * so grepping one ID across services reconstructs the full request trace.
 *
 * Dev  → custom Writable stream (main thread, TypeScript, color-coded).
 * Prod → raw JSON to stdout so log shippers can parse it directly.
 */
export function createLoggerConfig(config: ConfigService): Params {
  const isProduction = config.get('nodeEnv') === 'production';

  const pinoHttpOptions = {
    level: isProduction ? 'info' : 'debug',

    // Slim serializers — drop all headers; keep only the fields we care about.
    serializers: {
      req: reqSerializer,
      res: resSerializer,
    },

    redact: { paths: REDACT_PATHS, censor: '[REDACTED]' },

    // Reuse an incoming x-request-id (e.g. set by a load balancer / gateway)
    // if present, otherwise mint one. Returned to the caller as a response
    // header so the same ID can be quoted back when reporting an issue.
    genReqId: (req: IncomingMessage, res: ServerResponse) => {
      const existing = req.headers[REQUEST_ID_HEADER];
      const id =
        (Array.isArray(existing) ? existing[0] : existing) || randomUUID();
      res.setHeader(REQUEST_ID_HEADER, id);
      return id;
    },

    customSuccessMessage: (req: IncomingMessage, res: ServerResponse, responseTime: number) =>
      `${req.method} ${(req as IncomingMessage & { originalUrl?: string }).originalUrl ?? req.url} ${res.statusCode} - ${responseTime}ms`,

    // pino-http types only expose (req, res, err) — no responseTime here.
    // The regex treats timing as optional so these lines are still colorized.
    customErrorMessage: (req: IncomingMessage, res: ServerResponse, _err: Error) =>
      `${req.method} ${(req as IncomingMessage & { originalUrl?: string }).originalUrl ?? req.url} ${res.statusCode}`,

    autoLogging: true,
  };

  // In dev, pipe pino's JSON output into our pretty-printer Writable.
  // The [options, stream] tuple is the nestjs-pino / pino-http API for this.
  if (!isProduction) {
    return { pinoHttp: [pinoHttpOptions, createDevStream()] };
  }

  return { pinoHttp: pinoHttpOptions };
}