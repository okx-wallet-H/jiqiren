require('dotenv').config();

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const Database = require('better-sqlite3');
const OpenAI = require('openai');
const { Telegraf, Markup } = require('telegraf');

const HOME = process.env.HOME || '/home/ubuntu';
const PROJECT_DIR = path.join(HOME, 'dolphin_ai');
const DATA_DIR = path.join(PROJECT_DIR, 'data');
const DB_PATH = path.join(DATA_DIR, 'users.db');
const OKX_CONFIG_DIR = path.join(HOME, '.okx');
const OKX_CONFIG_PATH = path.join(OKX_CONFIG_DIR, 'config.toml');
const ASSETS_DIR = path.join(PROJECT_DIR, 'assets');
const WELCOME_IMAGE = path.join(ASSETS_DIR, 'welcome.png');

if (!process.env.TELEGRAM_TOKEN) {
  throw new Error('缺少 TELEGRAM_TOKEN，请先写入 .env');
}

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(OKX_CONFIG_DIR, { recursive: true });

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const db = new Database(DB_PATH);
const client = new OpenAI();
const ENC_KEY = crypto
  .createHash('sha256')
  .update(String(process.env.BOT_ENCRYPTION_SECRET || 'dolphin-ai-default-secret'))
  .digest();

const MAIN_MENU = Markup.keyboard([
  ["行情分析", "现货交易"],
  ["合约杠杆", "网格策略"],
]).resize();

const BIND_MENU = Markup.inlineKeyboard([
  [Markup.button.callback('开始绑定', 'start_bind')],
]);

function buildAiActionMenu(symbol) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('现货买入', `ai_spot_${symbol}`),
      Markup.button.callback('创建网格', `ai_grid_${symbol}`),
    ],
  ]);
}

const HELP_TEXT = [
  '可用功能：',
  '1. 行情分析：直接发送“BTC怎么样”“OKB多少钱”“ETH现在如何”',
  '2. 现货交易：发送“买 BTC 100U”或“卖 ETH 0.5”',
  '3. 合约杠杆：发送“开多 BTC 100U 5倍”或“开空 ETH 2张 10倍”',
  '4. 网格策略：发送“推荐 BTC”或“合约网格 BTC”或“BTC 60000 70000 10格 100U 现货”',
  '5. 赚币理财：发送“查询”“申购 USDT 100”“赎回 USDT 50”',
  '6. 账户余额：点击“账户余额”直接查看',
  '7. 快捷命令：/market /trade /contract /grid',
].join('\n');

const SYMBOL_ALIASES = {
  比特币: 'BTC',
  btc: 'BTC',
  xbt: 'BTC',
  以太坊: 'ETH',
  eth: 'ETH',
  sol: 'SOL',
  狗狗: 'DOGE',
  doge: 'DOGE',
  瑞波: 'XRP',
  xrp: 'XRP',
  艾达: 'ADA',
  ada: 'ADA',
  bnb: 'BNB',
  sui: 'SUI',
  trx: 'TRX',
  avax: 'AVAX',
  link: 'LINK',
  ton: 'TON',
  ltc: 'LTC',
  bch: 'BCH',
  eos: 'EOS',
  pepe: 'PEPE',
  shib: 'SHIB',
};

const MARKET_KEYWORDS = ['怎么样', '如何', '涨了吗', '跌了吗', '今天', '现在', '行情', '价格', '多少', '多少钱', '怎么了', '分析', '适合', '能买吗', '值得', '建议', '怎么看', '评分', '涨', '跌', 'rsi', 'macd', '布林', 'boll', 'k线', '均线', '支撑', '压力'];
const AI_KEYWORDS = ['适合买吗', '能买吗', '值得买吗', '怎么看', '分析', '评分', '分析一下', '怎么样', '建议', '如何', '今天', '现在', '怎么了', '适合', '值得'];
const SYMBOL_STOPWORDS = new Set([
  'PRICE', 'RSI', 'MACD', 'BOLL', 'KLINE', 'OKX', 'USDT', 'USD', 'SWAP', 'PERP',
  'LONG', 'SHORT', 'BUY', 'SELL', 'SPOT', 'MARKET', 'LIMIT', 'BOT', 'GRID', 'AI',
]);
const CHINESE_SYMBOL_ALIASES = {
  平台币: 'OKB',
  欧易平台币: 'OKB',
  狗狗币: 'DOGE',
  柴犬币: 'SHIB',
  佩佩: 'PEPE',
  柚子: 'EOS',
  莱特币: 'LTC',
  太子: 'BCH',
  波场: 'TRX',
  雪崩: 'AVAX',
  币安币: 'BNB',
  链上: 'LINK',
};

initDb();

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_keys (
      telegram_id INTEGER PRIMARY KEY,
      profile_name TEXT NOT NULL,
      api_key TEXT NOT NULL,
      secret_key TEXT NOT NULL,
      passphrase TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_states (
      telegram_id INTEGER PRIMARY KEY,
      state TEXT,
      payload TEXT,
      updated_at TEXT NOT NULL
    );
  `);
}

function nowIso() {
  return new Date().toISOString();
}

function shQuote(value) {
  return `'${String(value).replace(/'/g, `'"'"'`)}'`;
}

function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENC_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decrypt(payload) {
  const [ivHex, tagHex, dataHex] = String(payload).split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', ENC_KEY, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

function setUserState(telegramId, state, payload = {}) {
  db.prepare(`
    INSERT INTO user_states (telegram_id, state, payload, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(telegram_id) DO UPDATE SET
      state=excluded.state,
      payload=excluded.payload,
      updated_at=excluded.updated_at
  `).run(telegramId, state, JSON.stringify(payload), nowIso());
}

function getUserState(telegramId) {
  const row = db.prepare('SELECT * FROM user_states WHERE telegram_id = ?').get(telegramId);
  if (!row) return null;
  return {
    state: row.state,
    payload: row.payload ? JSON.parse(row.payload) : {},
    updated_at: row.updated_at,
  };
}

function clearUserState(telegramId) {
  db.prepare('DELETE FROM user_states WHERE telegram_id = ?').run(telegramId);
}

function getProfileName(telegramId) {
  return `user_${telegramId}`;
}

function getUserKeyRow(telegramId) {
  return db.prepare('SELECT * FROM user_keys WHERE telegram_id = ?').get(telegramId) || null;
}

function userHasKey(telegramId) {
  return !!getUserKeyRow(telegramId);
}

function saveUserKeys(telegramId, apiKey, secretKey, passphrase) {
  const profileName = getProfileName(telegramId);
  const ts = nowIso();
  db.prepare(`
    INSERT INTO user_keys (telegram_id, profile_name, api_key, secret_key, passphrase, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(telegram_id) DO UPDATE SET
      profile_name=excluded.profile_name,
      api_key=excluded.api_key,
      secret_key=excluded.secret_key,
      passphrase=excluded.passphrase,
      updated_at=excluded.updated_at
  `).run(
    telegramId,
    profileName,
    encrypt(apiKey),
    encrypt(secretKey),
    encrypt(passphrase),
    ts,
    ts,
  );
}

function parseSimpleToml(content) {
  const result = { default_profile: '', profiles: {} };
  let currentProfile = null;
  const lines = String(content || '').split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const sectionMatch = line.match(/^\[profiles\.(.+?)\]$/);
    if (sectionMatch) {
      currentProfile = sectionMatch[1];
      result.profiles[currentProfile] = result.profiles[currentProfile] || {};
      continue;
    }
    const kvMatch = line.match(/^([A-Za-z0-9_]+)\s*=\s*(.+)$/);
    if (!kvMatch) continue;
    let [, key, value] = kvMatch;
    value = value.trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value === 'true') value = true;
    if (value === 'false') value = false;
    if (currentProfile) {
      result.profiles[currentProfile][key] = value;
    } else {
      result[key] = value;
    }
  }
  return result;
}

function toTomlString(config) {
  const lines = [];
  if (config.default_profile) {
    lines.push(`default_profile = "${String(config.default_profile).replace(/"/g, '\\"')}"`);
    lines.push('');
  }
  for (const [name, profile] of Object.entries(config.profiles || {})) {
    lines.push(`[profiles.${name}]`);
    lines.push(`api_key = "${String(profile.api_key || '').replace(/"/g, '\\"')}"`);
    lines.push(`secret_key = "${String(profile.secret_key || '').replace(/"/g, '\\"')}"`);
    lines.push(`passphrase = "${String(profile.passphrase || '').replace(/"/g, '\\"')}"`);
    lines.push(`demo = ${profile.demo ? 'true' : 'false'}`);
    if (profile.site) lines.push(`site = "${String(profile.site).replace(/"/g, '\\"')}"`);
    lines.push('');
  }
  return lines.join('\n').trim() + '\n';
}

function manualUpsertOkxProfile(profileName, apiKey, secretKey, passphrase) {
  const existing = fs.existsSync(OKX_CONFIG_PATH) ? fs.readFileSync(OKX_CONFIG_PATH, 'utf8') : '';
  const config = parseSimpleToml(existing);
  config.profiles[profileName] = {
    api_key: apiKey,
    secret_key: secretKey,
    passphrase,
    demo: false,
    site: 'global',
  };
  if (!config.default_profile) config.default_profile = profileName;
  fs.writeFileSync(OKX_CONFIG_PATH, toTomlString(config), 'utf8');
}

function ensureOkxProfile(profileName, apiKey, secretKey, passphrase) {
  const cmd = [
    'okx',
    'config',
    'add-profile',
    `AK=${apiKey}`,
    `SK=${secretKey}`,
    `PP=${passphrase}`,
    `name=${profileName}`,
    '--force',
  ].map(shQuote).join(' ');

  try {
    execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (error) {
    manualUpsertOkxProfile(profileName, apiKey, secretKey, passphrase);
  }
}

function runCommand(command) {
  try {
    return execSync(command, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 30000,
      maxBuffer: 1024 * 1024 * 10,
    }).trim();
  } catch (error) {
    const stderr = error.stderr ? String(error.stderr).trim() : '';
    const stdout = error.stdout ? String(error.stdout).trim() : '';
    throw new Error(stderr || stdout || error.message || '命令执行失败');
  }
}

function runOkx(args, options = {}) {
  const parts = ['okx'];
  if (options.profile) {
    parts.push('--profile', options.profile);
  }
  if (options.json !== false) {
    parts.push('--json');
  }
  parts.push(...args);
  const command = parts.map(shQuote).join(' ');
  const output = runCommand(command);
  if (options.json === false) return output;
  try {
    return JSON.parse(output || 'null');
  } catch (error) {
    throw new Error(output || 'OKX 返回结果解析失败');
  }
}

function safeNumber(value, digits = 2) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '--';
  return num.toLocaleString('zh-CN', { maximumFractionDigits: digits });
}

function toFixedIfFinite(value, digits = 2) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '--';
  return num.toFixed(digits);
}

function extractSymbol(text) {
  const raw = String(text || '').trim();
  if (!raw) return 'BTC';
  const lower = raw.toLowerCase();

  for (const [key, value] of Object.entries(CHINESE_SYMBOL_ALIASES)) {
    if (raw.includes(key)) return value;
  }

  for (const [key, value] of Object.entries(SYMBOL_ALIASES)) {
    if (lower.includes(key.toLowerCase())) return value;
  }

  const instIdMatch = raw.toUpperCase().match(/([A-Z]{2,15})-USDT(?:-SWAP)?/);
  if (instIdMatch) return instIdMatch[1];

  const candidates = raw.toUpperCase().match(/[A-Z]{2,15}/g) || [];
  for (const candidate of candidates) {
    if (!SYMBOL_STOPWORDS.has(candidate)) return candidate;
  }

  return 'BTC';
}

function extractExplicitSymbol(text) {
  const raw = String(text || '').trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();

  for (const [key, value] of Object.entries(CHINESE_SYMBOL_ALIASES)) {
    if (raw.includes(key)) return value;
  }

  for (const [key, value] of Object.entries(SYMBOL_ALIASES)) {
    if (lower.includes(key.toLowerCase())) return value;
  }

  const instIdMatch = raw.toUpperCase().match(/([A-Z]{2,15})-USDT(?:-SWAP)?/);
  if (instIdMatch) return instIdMatch[1];

  const candidates = raw.toUpperCase().match(/[A-Z]{2,15}/g) || [];
  for (const candidate of candidates) {
    if (!SYMBOL_STOPWORDS.has(candidate)) return candidate;
  }

  return null;
}

function parsePositiveNumberInput(text) {
  const match = String(text || '').match(/\d+(?:\.\d+)?/);
  if (!match) return null;
  const value = Number(match[0]);
  return Number.isFinite(value) && value > 0 ? match[0] : null;
}

function parsePositiveIntegerInput(text, min = 1, max = 1000) {
  const match = String(text || '').match(/\d+/);
  if (!match) return null;
  const value = parseInt(match[0], 10);
  if (!Number.isInteger(value) || value < min || value > max) return null;
  return String(value);
}

function parseGridDirection(text) {
  const input = String(text || '').trim().toLowerCase();
  if (/中|neutral/.test(input)) return 'neutral';
  if (/空|short/.test(input)) return 'short';
  if (/多|long/.test(input)) return 'long';
  return null;
}

function formatGridDirection(direction) {
  if (direction === 'long') return '做多';
  if (direction === 'short') return '做空';
  return '中性';
}

async function replyContractGridOrders(ctx, profile) {
  const data = runOkx(['bot', 'grid', 'orders', '--algoOrdType', 'contract_grid'], { profile });
  const list = Array.isArray(data) ? data.slice(0, 5) : [];
  await ctx.reply(
    ['━━━━━━━━━━━━━━━━━━', '合约网格列表', '━━━━━━━━━━━━━━━━━━', list.length ? list.map((x) => `${x.instId} | Algo ${x.algoId} | ${x.state || x.runningType || '--'}`).join('\n') : '暂无运行中的合约网格订单'].join('\n'),
    MAIN_MENU,
  );
}

async function createContractGridOrder(ctx, payload) {
  const profile = getUserProfile(ctx.from.id);
  const args = [
    'bot', 'grid', 'create',
    '--instId', payload.instId,
    '--algoOrdType', 'contract_grid',
    '--maxPx', payload.maxPx,
    '--minPx', payload.minPx,
    '--gridNum', payload.gridNum,
    '--direction', payload.direction,
    '--lever', payload.lever,
    '--sz', payload.sz,
  ];
  const data = runOkx(args, { profile });
  const row = Array.isArray(data) ? data[0] : data;
  clearUserState(ctx.from.id);
  await ctx.reply(
    [
      '━━━━━━━━━━━━━━━━━━',
      '合约网格创建结果',
      '━━━━━━━━━━━━━━━━━━',
      `交易对：${payload.instId}`,
      `方向：${formatGridDirection(payload.direction)}`,
      `上限：${payload.maxPx}`,
      `下限：${payload.minPx}`,
      `格数：${payload.gridNum}`,
      `投入：${payload.sz} USDT`,
      `杠杆：${payload.lever}倍`,
      `Algo ID：${row?.algoId || '--'}`,
      `状态：${row?.sCode === '0' ? '已创建' : row?.sMsg || '已返回'}`,
    ].join('\n'),
    MAIN_MENU,
  );
}

async function startGridConversation(ctx, presetSymbol = '') {
  const symbol = extractExplicitSymbol(presetSymbol);
  if (symbol) {
    if (!userHasKey(ctx.from.id)) return showBindPrompt(ctx);
    setUserState(ctx.from.id, 'await_contract_grid_direction', {
      symbol,
      instId: makeInstId(symbol, true),
    });
    await ctx.reply(`已选择 ${symbol} 合约网格。\n请输入方向：做多 / 做空 / 中性`, MAIN_MENU);
    return;
  }
  setUserState(ctx.from.id, 'await_grid_mode', {});
  await ctx.reply('请输入：\n推荐 BTC\n合约网格\n合约网格 BTC\n现货网格\n查询合约网格', MAIN_MENU);
}

async function processContractGridWizard(ctx, text, state) {
  const payload = state.payload || {};

  if (state.state === 'await_contract_grid_symbol') {
    const symbol = extractExplicitSymbol(text);
    if (!symbol) {
      await ctx.reply('币种无法识别，请输入币种，例如：BTC', MAIN_MENU);
      return true;
    }
    setUserState(ctx.from.id, 'await_contract_grid_direction', {
      ...payload,
      symbol,
      instId: makeInstId(symbol, true),
    });
    await ctx.reply(`交易对已设为 ${makeInstId(symbol, true)}。\n请输入方向：做多 / 做空 / 中性`, MAIN_MENU);
    return true;
  }

  if (state.state === 'await_contract_grid_direction') {
    const direction = parseGridDirection(text);
    if (!direction) {
      await ctx.reply('方向无法识别，请输入：做多 / 做空 / 中性', MAIN_MENU);
      return true;
    }
    setUserState(ctx.from.id, 'await_contract_grid_max_px', { ...payload, direction });
    await ctx.reply('请输入上限价，例如：100000', MAIN_MENU);
    return true;
  }

  if (state.state === 'await_contract_grid_max_px') {
    const maxPx = parsePositiveNumberInput(text);
    if (!maxPx) {
      await ctx.reply('上限价格式不正确，请输入大于 0 的数字。', MAIN_MENU);
      return true;
    }
    setUserState(ctx.from.id, 'await_contract_grid_min_px', { ...payload, maxPx });
    await ctx.reply('请输入下限价，例如：80000', MAIN_MENU);
    return true;
  }

  if (state.state === 'await_contract_grid_min_px') {
    const minPx = parsePositiveNumberInput(text);
    if (!minPx) {
      await ctx.reply('下限价格式不正确，请输入大于 0 的数字。', MAIN_MENU);
      return true;
    }
    if (Number(minPx) >= Number(payload.maxPx)) {
      await ctx.reply('下限价必须小于上限价，请重新输入下限价。', MAIN_MENU);
      return true;
    }
    setUserState(ctx.from.id, 'await_contract_grid_grid_num', { ...payload, minPx });
    await ctx.reply('请输入格数，例如：10', MAIN_MENU);
    return true;
  }

  if (state.state === 'await_contract_grid_grid_num') {
    const gridNum = parsePositiveIntegerInput(text, 2, 500);
    if (!gridNum) {
      await ctx.reply('格数格式不正确，请输入 2 到 500 的整数。', MAIN_MENU);
      return true;
    }
    setUserState(ctx.from.id, 'await_contract_grid_sz', { ...payload, gridNum });
    await ctx.reply('请输入投入金额，单位 USDT，例如：100', MAIN_MENU);
    return true;
  }

  if (state.state === 'await_contract_grid_sz') {
    const sz = parsePositiveNumberInput(text);
    if (!sz) {
      await ctx.reply('投入金额格式不正确，请输入大于 0 的数字。', MAIN_MENU);
      return true;
    }
    setUserState(ctx.from.id, 'await_contract_grid_lever', { ...payload, sz });
    await ctx.reply('请输入杠杆倍数，例如：3', MAIN_MENU);
    return true;
  }

  if (state.state === 'await_contract_grid_lever') {
    const lever = parsePositiveNumberInput(text);
    if (!lever) {
      await ctx.reply('杠杆倍数格式不正确，请输入大于 0 的数字。', MAIN_MENU);
      return true;
    }
    await createContractGridOrder(ctx, { ...payload, lever });
    return true;
  }

  return false;
}

function wantsSwap(text) {
  return /(合约|永续|杠杆|swap|perp)/i.test(String(text || ''));
}

function makeInstId(symbol, swap = false) {
  return swap ? `${symbol}-USDT-SWAP` : `${symbol}-USDT`;
}

function isMarketQuery(text) {
  const input = String(text || '').toLowerCase();
  return MARKET_KEYWORDS.some((k) => input.includes(k.toLowerCase()));
}

function isAiQuery(text) {
  const input = String(text || '').toLowerCase();
  return AI_KEYWORDS.some((k) => input.includes(k.toLowerCase()));
}

function sma(values, period) {
  if (values.length < period) return null;
  const slice = values.slice(values.length - period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function ema(values, period) {
  if (values.length < period) return null;
  const multiplier = 2 / (period + 1);
  let result = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < values.length; i += 1) {
    result = (values[i] - result) * multiplier + result;
  }
  return result;
}

function rsi(values, period = 14) {
  if (values.length <= period) return null;
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i += 1) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = period + 1; i < values.length; i += 1) {
    const diff = values[i] - values[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function macd(values) {
  if (values.length < 35) return null;
  const ema12Series = [];
  const ema26Series = [];
  const macdLineSeries = [];

  for (let i = 0; i < values.length; i += 1) {
    const slice = values.slice(0, i + 1);
    const e12 = ema(slice, 12);
    const e26 = ema(slice, 26);
    ema12Series.push(e12);
    ema26Series.push(e26);
    if (e12 !== null && e26 !== null) macdLineSeries.push(e12 - e26);
  }

  if (macdLineSeries.length < 9) return null;
  const signal = ema(macdLineSeries, 9);
  const line = macdLineSeries[macdLineSeries.length - 1];
  const prevLine = macdLineSeries[macdLineSeries.length - 2];
  const prevSignal = ema(macdLineSeries.slice(0, -1), 9);
  return {
    line,
    signal,
    histogram: line - signal,
    bullishCross: prevLine !== null && prevSignal !== null ? prevLine <= prevSignal && line > signal : false,
    bearishCross: prevLine !== null && prevSignal !== null ? prevLine >= prevSignal && line < signal : false,
  };
}

function bollinger(values, period = 20, multi = 2) {
  if (values.length < period) return null;
  const slice = values.slice(values.length - period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period;
  const sd = Math.sqrt(variance);
  return {
    upper: mean + multi * sd,
    middle: mean,
    lower: mean - multi * sd,
  };
}

function getTicker(instId) {
  const data = runOkx(['market', 'ticker', instId]);
  return Array.isArray(data) ? data[0] : data;
}

function getCandles(instId, bar = '1H', limit = 60) {
  const data = runOkx(['market', 'candles', instId, '--bar', bar, '--limit', String(limit)]);
  return Array.isArray(data) ? data : [];
}

function getFundingRate(instId) {
  const data = runOkx(['market', 'funding-rate', instId]);
  return Array.isArray(data) ? data[0] : data;
}

function getIndicators(instId) {
  const candles = getCandles(instId, '1H', 60).slice().reverse();
  const closes = candles.map((row) => Number(row[4])).filter((v) => Number.isFinite(v));
  if (!closes.length) {
    return { rsi: null, macd: null, boll: null, closes: [] };
  }
  return {
    rsi: rsi(closes, 14),
    macd: macd(closes),
    boll: bollinger(closes, 20, 2),
    closes,
  };
}

function formatUsd(value, digits = 4) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '$--';
  return `$${num.toLocaleString('en-US', { maximumFractionDigits: digits })}`;
}

function formatSignedPercent(value, digits = 2) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '--';
  const sign = num > 0 ? '+' : '';
  return `${sign}${num.toFixed(digits)}%`;
}

function formatStarRating(score) {
  const num = Number(score);
  if (!Number.isFinite(num)) return '☆☆☆☆☆';
  const filled = Math.max(0, Math.min(5, Math.round(num / 20)));
  return `${'★'.repeat(filled)}${'☆'.repeat(5 - filled)}`;
}

function classifyRsiLabel(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '未知';
  if (num >= 70) return '偏强';
  if (num <= 30) return '偏弱';
  return '中性';
}

function formatBeijingTime(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).filter((x) => x.type !== 'literal').map((x) => [x.type, x.value]));
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}

function calcAtr(candles, period = 14) {
  if (!Array.isArray(candles) || candles.length < 2) return null;
  const trueRanges = [];
  for (let i = 1; i < candles.length; i += 1) {
    const high = Number(candles[i][2]);
    const low = Number(candles[i][3]);
    const prevClose = Number(candles[i - 1][4]);
    if (![high, low, prevClose].every(Number.isFinite)) continue;
    trueRanges.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));
  }
  if (!trueRanges.length) return null;
  const slice = trueRanges.slice(-period);
  return slice.reduce((sum, value) => sum + value, 0) / slice.length;
}

function normalizeCandles(candles) {
  return (Array.isArray(candles) ? candles : []).slice().reverse().map((row) => ({
    ts: Number(row[0]),
    open: Number(row[1]),
    high: Number(row[2]),
    low: Number(row[3]),
    close: Number(row[4]),
    volume: Number(row[5]),
  }));
}

function buildAiMarketSnapshot(instId) {
  const ticker = getTicker(instId);
  const h1Candles = normalizeCandles(getCandles(instId, '1H', 24));
  const h4Candles = normalizeCandles(getCandles(instId, '4H', 30));
  const dailyCandles = normalizeCandles(getCandles(instId, '1D', 30));
  const h1Closes = h1Candles.map((row) => row.close).filter(Number.isFinite);
  const h4Closes = h4Candles.map((row) => row.close).filter(Number.isFinite);
  const dailyCloses = dailyCandles.map((row) => row.close).filter(Number.isFinite);
  const h1Highs = h1Candles.map((row) => row.high).filter(Number.isFinite);
  const h1Lows = h1Candles.map((row) => row.low).filter(Number.isFinite);
  const h1Volumes = h1Candles.map((row) => row.volume).filter(Number.isFinite);
  const price = Number(ticker?.last);
  const open24h = Number(ticker?.open24h);
  const changePct = open24h ? ((price - open24h) / open24h) * 100 : 0;
  const ma7 = sma(dailyCloses, Math.min(7, dailyCloses.length));
  const ma30 = sma(dailyCloses, Math.min(30, dailyCloses.length));
  const atr = calcAtr(h1Candles, 14);
  const rsi1h = rsi(h1Closes, 14);
  const rsi4h = rsi(h4Closes, 14);
  const dailyHigh = dailyCandles.length ? Math.max(...dailyCandles.map((row) => row.high).filter(Number.isFinite)) : null;
  const dailyLow = dailyCandles.length ? Math.min(...dailyCandles.map((row) => row.low).filter(Number.isFinite)) : null;
  const volumeAvg = h1Volumes.length ? h1Volumes.reduce((sum, value) => sum + value, 0) / h1Volumes.length : null;
  const lastVolume = h1Volumes.length ? h1Volumes[h1Volumes.length - 1] : null;
  const macd4h = macd(h4Closes);
  const fundingInstId = instId.endsWith('-SWAP') ? instId : `${instId}-SWAP`;
  let fundingRate = null;
  try {
    const funding = getFundingRate(fundingInstId);
    fundingRate = Number(funding?.fundingRate ?? funding?.nextFundingRate ?? funding?.settFundingRate);
  } catch (error) {
    fundingRate = null;
  }
  return {
    instId,
    fundingInstId,
    symbol: instId.replace(/-USDT(?:-SWAP)?$/, ''),
    ticker,
    price,
    open24h,
    changePct,
    dailyCandles,
    h4Candles,
    h1Candles,
    rsi1h,
    rsi4h,
    atr,
    ma7,
    ma30,
    dailyHigh,
    dailyLow,
    h1High24: h1Highs.length ? Math.max(...h1Highs) : null,
    h1Low24: h1Lows.length ? Math.min(...h1Lows) : null,
    volumeAvg,
    lastVolume,
    macd4h,
    fundingRate,
  };
}

function inferTrend(snapshot) {
  const ma7 = Number(snapshot?.ma7);
  const ma30 = Number(snapshot?.ma30);
  const price = Number(snapshot?.price);
  const changePct = Number(snapshot?.changePct);
  if ([ma7, ma30, price].every(Number.isFinite)) {
    if (price >= ma7 && ma7 >= ma30 && changePct >= 0) return '偏多';
    if (price <= ma7 && ma7 <= ma30 && changePct <= 0) return '偏空';
  }
  if (Number.isFinite(changePct)) {
    if (changePct >= 2) return '偏多';
    if (changePct <= -2) return '偏空';
  }
  return '中性';
}

function normalizeAction(value, score) {
  const text = String(value || '').trim();
  if (/轻仓买入|标准仓买入|观望等待|不建议买入/.test(text)) return text.match(/轻仓买入|标准仓买入|观望等待|不建议买入/)[0];
  if (/轻仓|标准仓|观望|谨慎/.test(text)) {
    const mapped = text.match(/轻仓|标准仓|观望|谨慎/)[0];
    if (mapped === '轻仓') return '轻仓买入';
    if (mapped === '标准仓') return '标准仓买入';
    if (mapped === '观望') return '观望等待';
    return '不建议买入';
  }
  if (score >= 80) return '标准仓买入';
  if (score >= 60) return '轻仓买入';
  if (score >= 40) return '观望等待';
  return '不建议买入';
}

function normalizeRisk(value, snapshot) {
  const text = String(value || '').trim();
  if (/低|中等|高/.test(text)) return text.match(/低|中等|高/)[0];
  const atr = Number(snapshot?.atr);
  const price = Number(snapshot?.price);
  if (Number.isFinite(atr) && Number.isFinite(price) && price > 0) {
    const ratio = atr / price;
    if (ratio >= 0.03) return '高';
    if (ratio >= 0.015) return '中等';
    return '低';
  }
  return '中等';
}

function normalizeConclusion(value, score, trend) {
  let text = String(value || '').replace(/\s+/g, '').trim();
  if (/[，。,；;：:]$/.test(text)) text = text.replace(/[，。,；;：:]+$/g, '');
  if (text.length > 18) {
    const parts = text.split(/[，。,；;：:]/).map((x) => x.trim()).filter(Boolean);
    if (parts.length) text = parts[0];
  }
  if (!text) {
    if (score >= 80) return '趋势强，可以直接买';
    if (score >= 60) return trend === '偏多' ? '趋势向上，现在可以买' : '可以轻仓试买';
    if (score >= 40) return '先观望，等更稳信号';
    return '暂时别买，风险偏大';
  }
  return text.slice(0, 18);
}

function calcGridRecommendation(snapshot) {
  const upperBase = Number(snapshot?.dailyHigh);
  const lowerBase = Number(snapshot?.dailyLow);
  const price = Number(snapshot?.price);
  let upper = Number.isFinite(upperBase) ? upperBase : price * 1.08;
  let lower = Number.isFinite(lowerBase) ? lowerBase : price * 0.92;
  if (!Number.isFinite(upper) || !Number.isFinite(lower) || upper <= lower) {
    upper = price * 1.08;
    lower = price * 0.92;
  }
  const spanRatio = price > 0 ? (upper - lower) / price : 0;
  const gridNum = spanRatio >= 0.25 ? 30 : spanRatio >= 0.12 ? 20 : 12;
  const gridInvest = price >= 50000 ? 500 : price >= 5000 ? 300 : 200;
  return {
    grid_upper: Number(upper.toFixed(2)),
    grid_lower: Number(lower.toFixed(2)),
    grid_num: gridNum,
    grid_invest: gridInvest,
  };
}

async function getOpenAiAiResult(snapshot) {
  const dailyPayload = snapshot.dailyCandles.map((row) => ({ ts: row.ts, o: row.open, h: row.high, l: row.low, c: row.close, v: row.volume }));
  const h4Payload = snapshot.h4Candles.map((row) => ({ ts: row.ts, o: row.open, h: row.high, l: row.low, c: row.close, v: row.volume }));
  const h1Payload = snapshot.h1Candles.map((row) => ({ ts: row.ts, o: row.open, h: row.high, l: row.low, c: row.close, v: row.volume }));
  const gridBase = calcGridRecommendation(snapshot);
  const prompt = `你是一个专业的加密货币交易分析师，风格直接果断，不说废话。\n\n币种：${snapshot.symbol}\n当前价格：${snapshot.price}，24h涨跌：${snapshot.changePct}%\n\n日线数据（近30天）：${JSON.stringify(dailyPayload)}\n4小时数据（近5天）：${JSON.stringify(h4Payload)}\n1小时数据（近24小时）：${JSON.stringify(h1Payload)}\n资金费率：${snapshot.fundingRate}\n\n补充指标：\n日线MA7：${snapshot.ma7}\n日线MA30：${snapshot.ma30}\n4H RSI：${snapshot.rsi4h}\n1H RSI：${snapshot.rsi1h}\n4H MACD：${JSON.stringify(snapshot.macd4h)}\nATR：${snapshot.atr}\n24h平均量：${snapshot.volumeAvg}\n最近1小时量：${snapshot.lastVolume}\n参考网格区间：上限 ${gridBase.grid_upper}，下限 ${gridBase.grid_lower}，格数 ${gridBase.grid_num}，投入 ${gridBase.grid_invest} USDT\n\n请分析以下4个维度（每项0-25分）：\n1. 大趋势（日线方向、均线位置）\n2. 中期动量（4H RSI、MACD方向）\n3. 短期信号（1H价格形态、量价配合）\n4. 市场情绪（资金费率、超买超卖）\n\n评分标准：\n- 80-100：强烈买入\n- 60-79：可以买入，轻仓\n- 40-59：观望等待\n- 0-39：不建议，风险大\n\n用JSON格式返回，结论必须是一句大白话，果断明确，并补充推荐网格区间：\n{\n  "score": 72,\n  "verdict": "买",\n  "conclusion": "趋势向上，现在可以买",\n  "action": "轻仓买入",\n  "trend": "偏多",\n  "rsi": 54.3,\n  "risk": "中等",\n  "grid_upper": 88000,\n  "grid_lower": 78000,\n  "grid_num": 20,\n  "grid_invest": 500\n}`;

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: '你只返回合法JSON，不要输出Markdown，不要输出代码块。结论必须果断直接。trend只能是偏多、中性、偏空。verdict只能是买、观望、不买。action只能是标准仓买入、轻仓买入、观望等待、不建议买入。risk只能是低、中等、高。grid_upper和grid_lower必须是数字，且grid_upper大于grid_lower；grid_num必须是12到50之间整数；grid_invest必须是建议投入USDT数字。' },
      { role: 'user', content: prompt },
    ],
  });

  const content = response.choices?.[0]?.message?.content || '{}';
  const parsed = JSON.parse(content);
  const score = Math.max(0, Math.min(100, Number(parsed.score) || 0));
  const trend = typeof parsed.trend === 'string' && /偏多|中性|偏空/.test(parsed.trend) ? parsed.trend.match(/偏多|中性|偏空/)[0] : inferTrend(snapshot);
  const localRsi = Number(snapshot.rsi4h);
  const parsedRsi = Number(parsed.rsi);
  const rsiValue = Number.isFinite(localRsi)
    ? localRsi
    : Number.isFinite(parsedRsi) && parsedRsi >= 0 && parsedRsi <= 100
      ? parsedRsi
      : snapshot.rsi1h;
  const gridBaseFinal = calcGridRecommendation(snapshot);
  const aiUpper = Number(parsed.grid_upper);
  const aiLower = Number(parsed.grid_lower);
  const aiGridNum = parseInt(parsed.grid_num, 10);
  const aiGridInvest = Number(parsed.grid_invest);
  return {
    score,
    verdict: typeof parsed.verdict === 'string' && /买|观望|不买/.test(parsed.verdict) ? parsed.verdict.match(/买|观望|不买/)[0] : (score >= 60 ? '买' : score >= 40 ? '观望' : '不买'),
    conclusion: normalizeConclusion(parsed.conclusion, score, trend),
    action: normalizeAction(parsed.action, score),
    trend,
    rsi: rsiValue,
    risk: normalizeRisk(parsed.risk, snapshot),
    grid_upper: Number.isFinite(aiUpper) && aiUpper > 0 ? aiUpper : gridBaseFinal.grid_upper,
    grid_lower: Number.isFinite(aiLower) && aiLower > 0 ? aiLower : gridBaseFinal.grid_lower,
    grid_num: Number.isInteger(aiGridNum) && aiGridNum >= 12 && aiGridNum <= 50 ? aiGridNum : gridBaseFinal.grid_num,
    grid_invest: Number.isFinite(aiGridInvest) && aiGridInvest > 0 ? aiGridInvest : gridBaseFinal.grid_invest,
  };
}

function formatAiAnalysisCard(snapshot, analysis) {
  const trendSuffix = /偏多/.test(String(analysis.trend)) ? '▲' : /偏空/.test(String(analysis.trend)) ? '▼' : '•';
  return [
    '━━━━━━━━━━━━━━━━━━',
    `${snapshot.instId} 分析`,
    '━━━━━━━━━━━━━━━━━━',
    `当前价：${formatUsd(snapshot.price, 6)} | 24h：${formatSignedPercent(snapshot.changePct, 2)}`,
    '',
    `评分：${Math.round(analysis.score)}/100 ${formatStarRating(analysis.score)}`,
    `结论：${analysis.conclusion}`,
    `建议：${analysis.action}`,
    '',
    `趋势：${analysis.trend} ${trendSuffix}`,
    `RSI：${toFixedIfFinite(analysis.rsi, 1)}（${classifyRsiLabel(analysis.rsi)}）`,
    `风险：${analysis.risk}`,
    '',
    '推荐网格区间',
    `上限：${formatUsd(analysis.grid_upper, 2)}  下限：${formatUsd(analysis.grid_lower, 2)}`,
    `格数：${analysis.grid_num}  投入建议：${analysis.grid_invest} USDT`,
    '━━━━━━━━━━━━━━━━━━',
    '仅供参考，不构成投资建议',
  ].join('\n');
}

function formatMarketCard(instId, ticker, indicators) {
  const last = Number(ticker?.last);
  const open24h = Number(ticker?.open24h);
  const changePct = open24h ? ((last - open24h) / open24h) * 100 : null;
  const parts = [
    '━━━━━━━━━━━━━━━━━━',
    `${instId} 行情卡片`,
    '━━━━━━━━━━━━━━━━━━',
    `最新价：${safeNumber(last, 6)}`,
    `24H涨跌：${changePct === null ? '--' : toFixedIfFinite(changePct, 2) + '%'}`,
    `24H最高：${safeNumber(ticker?.high24h, 6)}`,
    `24H最低：${safeNumber(ticker?.low24h, 6)}`,
    `买一 / 卖一：${safeNumber(ticker?.bidPx, 6)} / ${safeNumber(ticker?.askPx, 6)}`,
    `24H成交量：${safeNumber(ticker?.vol24h, 4)}`,
  ];

  if (indicators?.rsi !== null) {
    parts.push(`RSI(14)：${toFixedIfFinite(indicators.rsi, 2)}`);
  }
  if (indicators?.macd) {
    parts.push(`MACD：${toFixedIfFinite(indicators.macd.line, 4)} / Signal ${toFixedIfFinite(indicators.macd.signal, 4)}`);
  }
  if (indicators?.boll) {
    parts.push(`布林带：上 ${safeNumber(indicators.boll.upper, 4)} | 中 ${safeNumber(indicators.boll.middle, 4)} | 下 ${safeNumber(indicators.boll.lower, 4)}`);
  }
  return parts.join('\n');
}


function getUserProfile(telegramId) {
  const row = getUserKeyRow(telegramId);
  return row ? row.profile_name : getProfileName(telegramId);
}

function parseSpotTrade(text) {
  const input = String(text || '').trim();
  const side = /(买|buy)/i.test(input) ? 'buy' : /(卖|sell)/i.test(input) ? 'sell' : null;
  if (!side) return null;
  const symbol = extractSymbol(input);
  const amountMatch = input.match(/(\d+(?:\.\d+)?)(?:\s*)(U|u|USDT|usdt|张|份)?/);
  if (!amountMatch) return null;
  const amount = amountMatch[1];
  const unit = (amountMatch[2] || '').toUpperCase();
  const isQuoteAmount = side === 'buy' && (unit === 'U' || unit === 'USDT');
  return { instId: makeInstId(symbol, false), side, amount, isQuoteAmount };
}

function parseSwapTrade(text) {
  const input = String(text || '').trim();
  const isLong = /(开多|做多|long)/i.test(input);
  const isShort = /(开空|做空|short)/i.test(input);
  if (!isLong && !isShort) return null;
  const symbol = extractSymbol(input);
  const amountMatch = input.match(/(\d+(?:\.\d+)?)(?:\s*)(U|u|USDT|usdt|张|份)?/);
  if (!amountMatch) return null;
  const leverMatch = input.match(/(\d+(?:\.\d+)?)\s*倍/);
  const amount = amountMatch[1];
  const unit = (amountMatch[2] || '').toUpperCase();
  return {
    instId: makeInstId(symbol, true),
    side: isLong ? 'buy' : 'sell',
    posSide: isLong ? 'long' : 'short',
    amount,
    lever: leverMatch ? leverMatch[1] : '5',
    isQuoteAmount: unit === 'U' || unit === 'USDT',
  };
}

function parseGridInput(text) {
  const input = String(text || '').trim();
  if (/查询|订单|列表/.test(input)) {
    return { action: 'orders', algoOrdType: /(合约|contract)/i.test(input) ? 'contract_grid' : 'grid' };
  }
  const symbol = extractSymbol(input);
  const nums = input.match(/\d+(?:\.\d+)?/g) || [];
  if (nums.length < 4) return null;
  const isContract = /(合约|contract)/i.test(input);
  const leverMatch = input.match(/(\d+(?:\.\d+)?)\s*倍/);
  return {
    action: 'create',
    instId: isContract ? makeInstId(symbol, true) : makeInstId(symbol, false),
    algoOrdType: isContract ? 'contract_grid' : 'grid',
    minPx: nums[0],
    maxPx: nums[1],
    gridNum: String(parseInt(nums[2], 10)),
    quoteSz: nums[3],
    lever: leverMatch ? leverMatch[1] : '3',
    direction: /空/.test(input) ? 'short' : /多/.test(input) ? 'long' : 'neutral',
  };
}

function parseEarnInput(text) {
  const input = String(text || '').trim();
  if (/查询|余额|理财/.test(input)) return { action: 'balance' };
  const buyMatch = input.match(/申购\s+([A-Za-z]{2,10})\s+(\d+(?:\.\d+)?)/i);
  if (buyMatch) return { action: 'purchase', ccy: buyMatch[1].toUpperCase(), amt: buyMatch[2] };
  const redeemMatch = input.match(/赎回\s+([A-Za-z]{2,10})\s+(\d+(?:\.\d+)?)/i);
  if (redeemMatch) return { action: 'redeem', ccy: redeemMatch[1].toUpperCase(), amt: redeemMatch[2] };
  return null;
}

async function showBindPrompt(ctx) {
  await ctx.reply('━━━━━━━━━━━━━━━━━━\n请先绑定 OKX API Key\n━━━━━━━━━━━━━━━━━━', BIND_MENU);
}

async function handleStart(ctx) {
  clearUserState(ctx.from.id);
  if (fs.existsSync(WELCOME_IMAGE)) {
    await ctx.replyWithPhoto({ source: WELCOME_IMAGE });
  }
  await ctx.reply(
    '欢迎使用 Dolphin AI Bot。\n请选择功能，或直接发送“BTC怎么样”“OKB多少钱”“ETH现在如何”等自然语言指令。',
    MAIN_MENU,
  );
}

async function handleBalance(ctx) {
  if (!userHasKey(ctx.from.id)) return showBindPrompt(ctx);
  const profile = getUserProfile(ctx.from.id);
  const data = runOkx(['account', 'balance'], { profile });
  const details = data?.[0]?.details || [];
  const top = details
    .filter((x) => Number(x.eqUsd || x.cashBal || x.availBal) > 0)
    .sort((a, b) => Number(b.eqUsd || 0) - Number(a.eqUsd || 0))
    .slice(0, 10)
    .map((x) => `${x.ccy}：可用 ${safeNumber(x.availBal, 8)} | 折合USD ${safeNumber(x.eqUsd, 2)}`)
    .join('\n');

  await ctx.reply(
    ['━━━━━━━━━━━━━━━━━━', '账户余额', '━━━━━━━━━━━━━━━━━━', top || '暂无可用资产显示'].join('\n'),
    MAIN_MENU,
  );
}

async function handleEarnOverview(ctx) {
  if (!userHasKey(ctx.from.id)) return showBindPrompt(ctx);
  setUserState(ctx.from.id, 'await_earn_action', {});
  const profile = getUserProfile(ctx.from.id);
  let balanceText = '暂无数据';
  try {
    const balance = runOkx(['earn', 'savings', 'balance'], { profile });
    const list = Array.isArray(balance) ? balance.slice(0, 8) : [];
    if (list.length) {
      balanceText = list.map((x) => `${x.ccy}：${safeNumber(x.amt || x.bal || 0, 8)}`).join('\n');
    }
  } catch (error) {
    balanceText = `读取失败：${error.message}`;
  }
  await ctx.reply(
    ['━━━━━━━━━━━━━━━━━━', '赚币理财', '━━━━━━━━━━━━━━━━━━', balanceText, '发送：查询 / 申购 USDT 100 / 赎回 USDT 50'].join('\n'),
    MAIN_MENU,
  );
}

async function handleSpotEntry(ctx) {
  if (!userHasKey(ctx.from.id)) return showBindPrompt(ctx);
  setUserState(ctx.from.id, 'await_spot_trade', {});
  await ctx.reply('请输入交易指令，例如：买入100USDT的BTC，或买 BTC 100U', MAIN_MENU);
}

async function handleSwapEntry(ctx) {
  if (!userHasKey(ctx.from.id)) return showBindPrompt(ctx);
  setUserState(ctx.from.id, 'await_swap_trade', {});
  await ctx.reply('请输入合约指令，例如：开多BTC永续100USDT，或开多 BTC 100U 5倍', MAIN_MENU);
}

async function handleGridEntry(ctx) {
  await startGridConversation(ctx);
}

async function handleAiEntry(ctx) {
  setUserState(ctx.from.id, 'await_ai_symbol', {});
  await ctx.reply('请输入币种，例如：BTC', MAIN_MENU);
}

async function handleMarketCommand(ctx) {
  setUserState(ctx.from.id, 'await_ai_symbol', {});
  await ctx.reply('请输入币种，例如：BTC', MAIN_MENU);
}

async function handleTradeCommand(ctx) {
  if (!userHasKey(ctx.from.id)) return showBindPrompt(ctx);
  setUserState(ctx.from.id, 'await_spot_trade', {});
  await ctx.reply('请输入交易指令，例如：买入100USDT的BTC', MAIN_MENU);
}

async function handleContractCommand(ctx) {
  if (!userHasKey(ctx.from.id)) return showBindPrompt(ctx);
  setUserState(ctx.from.id, 'await_swap_trade', {});
  await ctx.reply('请输入合约指令，例如：开多BTC永续100USDT', MAIN_MENU);
}

async function handleGridCommand(ctx) {
  await startGridConversation(ctx);
}

async function handleAiSpotFromCard(ctx, symbol) {
  setUserState(ctx.from.id, 'await_spot_trade', {});
  await ctx.answerCbQuery();
  await ctx.reply(`请输入现货指令，例如：\n买 ${symbol} 100U\n卖 ${symbol} 0.5`, MAIN_MENU);
}

async function handleAiGridFromCard(ctx, symbol) {
  await ctx.answerCbQuery();
  await startGridConversation(ctx, symbol);
}

async function handleBindingStart(ctx) {
  setUserState(ctx.from.id, 'binding_api_key', {});
  await ctx.reply('请输入 OKX API Key', MAIN_MENU);
}

async function processBinding(ctx, text) {
  const state = getUserState(ctx.from.id);
  if (!state) return false;

  if (state.state === 'binding_api_key') {
    setUserState(ctx.from.id, 'binding_secret_key', { apiKey: text.trim() });
    await ctx.reply('请输入 OKX Secret Key', MAIN_MENU);
    return true;
  }

  if (state.state === 'binding_secret_key') {
    setUserState(ctx.from.id, 'binding_passphrase', {
      apiKey: state.payload.apiKey,
      secretKey: text.trim(),
    });
    await ctx.reply('请输入 OKX Passphrase', MAIN_MENU);
    return true;
  }

  if (state.state === 'binding_passphrase') {
    const apiKey = state.payload.apiKey;
    const secretKey = state.payload.secretKey;
    const passphrase = text.trim();
    const profileName = getProfileName(ctx.from.id);
    ensureOkxProfile(profileName, apiKey, secretKey, passphrase);
    saveUserKeys(ctx.from.id, apiKey, secretKey, passphrase);
    clearUserState(ctx.from.id);
    await ctx.reply(`OKX 绑定完成。\nProfile：${profileName}`, MAIN_MENU);
    return true;
  }

  return false;
}

async function processSpotTrade(ctx, text) {
  const state = getUserState(ctx.from.id);
  if (!state || state.state !== 'await_spot_trade') return false;
  if (!userHasKey(ctx.from.id)) {
    await showBindPrompt(ctx);
    return true;
  }
  const parsed = parseSpotTrade(text);
  if (!parsed) {
    await ctx.reply('现货指令无法识别，请按“买 BTC 100U”或“卖 ETH 0.5”发送。', MAIN_MENU);
    return true;
  }
  const profile = getUserProfile(ctx.from.id);
  const args = ['spot', 'place', '--instId', parsed.instId, '--side', parsed.side, '--ordType', 'market', '--sz', parsed.amount, '--tdMode', 'cash'];
  if (parsed.isQuoteAmount) args.push('--tgtCcy', 'quote_ccy');
  const data = runOkx(args, { profile });
  clearUserState(ctx.from.id);
  const row = Array.isArray(data) ? data[0] : data;
  await ctx.reply(
    ['━━━━━━━━━━━━━━━━━━', '现货交易结果', '━━━━━━━━━━━━━━━━━━', `交易对：${parsed.instId}`, `方向：${parsed.side === 'buy' ? '买入' : '卖出'}`, `数量：${parsed.amount}`, `订单ID：${row?.ordId || '--'}`, `状态：${row?.sCode === '0' ? '已提交' : row?.sMsg || '已返回'}`].join('\n'),
    MAIN_MENU,
  );
  return true;
}

async function processSwapTrade(ctx, text) {
  const state = getUserState(ctx.from.id);
  if (!state || state.state !== 'await_swap_trade') return false;
  if (!userHasKey(ctx.from.id)) {
    await showBindPrompt(ctx);
    return true;
  }
  const parsed = parseSwapTrade(text);
  if (!parsed) {
    await ctx.reply('合约指令无法识别，请按“开多 BTC 100U 5倍”或“开空 ETH 2张 10倍”发送。', MAIN_MENU);
    return true;
  }
  const profile = getUserProfile(ctx.from.id);
  runOkx(['swap', 'leverage', '--instId', parsed.instId, '--lever', parsed.lever, '--mgnMode', 'cross', '--posSide', parsed.posSide], { profile });
  const args = ['swap', 'place', '--instId', parsed.instId, '--side', parsed.side, '--ordType', 'market', '--sz', parsed.amount, '--posSide', parsed.posSide, '--tdMode', 'cross'];
  if (parsed.isQuoteAmount) args.push('--tgtCcy', 'quote_ccy');
  const data = runOkx(args, { profile });
  clearUserState(ctx.from.id);
  const row = Array.isArray(data) ? data[0] : data;
  await ctx.reply(
    ['━━━━━━━━━━━━━━━━━━', '合约杠杆结果', '━━━━━━━━━━━━━━━━━━', `交易对：${parsed.instId}`, `方向：${parsed.posSide === 'long' ? '开多' : '开空'}`, `杠杆：${parsed.lever}倍`, `数量：${parsed.amount}`, `订单ID：${row?.ordId || '--'}`, `状态：${row?.sCode === '0' ? '已提交' : row?.sMsg || '已返回'}`].join('\n'),
    MAIN_MENU,
  );
  return true;
}

async function processGridTrade(ctx, text) {
  const state = getUserState(ctx.from.id);
  if (!state) return false;

  if (state.state === 'await_grid_mode') {
    if (/查询.*合约|合约.*查询|订单|列表/.test(text)) {
      if (!userHasKey(ctx.from.id)) {
        await showBindPrompt(ctx);
        return true;
      }
      clearUserState(ctx.from.id);
      await replyContractGridOrders(ctx, getUserProfile(ctx.from.id));
      return true;
    }

    if (/现货网格|现货/.test(text)) {
      if (!userHasKey(ctx.from.id)) {
        await showBindPrompt(ctx);
        return true;
      }
      setUserState(ctx.from.id, 'await_grid_trade', {});
      await ctx.reply('请输入现货网格参数，例如：\nBTC 60000 70000 10格 100U 现货', MAIN_MENU);
      return true;
    }

    if (/合约网格|合约|contract/i.test(text)) {
      if (!userHasKey(ctx.from.id)) {
        await showBindPrompt(ctx);
        return true;
      }
      const symbol = extractExplicitSymbol(text);
      if (symbol) {
        setUserState(ctx.from.id, 'await_contract_grid_direction', {
          symbol,
          instId: makeInstId(symbol, true),
        });
        await ctx.reply(`交易对已设为 ${makeInstId(symbol, true)}。\n请输入方向：做多 / 做空 / 中性`, MAIN_MENU);
      } else {
        setUserState(ctx.from.id, 'await_contract_grid_symbol', {});
        await ctx.reply('请输入币种，例如：BTC', MAIN_MENU);
      }
      return true;
    }

    if (/推荐/.test(text)) {
      const symbol = extractExplicitSymbol(text);
      if (!symbol) {
        await ctx.reply('请输入“推荐 BTC”获取网格区间。', MAIN_MENU);
        return true;
      }
      clearUserState(ctx.from.id);
      await replyGridRecommendation(ctx, symbol);
      return true;
    }

    const symbol = extractExplicitSymbol(text);
    if (symbol) {
      clearUserState(ctx.from.id);
      await replyGridRecommendation(ctx, symbol);
      return true;
    }

    await ctx.reply('未识别网格指令，请输入：推荐 BTC、合约网格、合约网格 BTC、现货网格、查询合约网格', MAIN_MENU);
    return true;
  }

  if (/^await_contract_grid_/.test(state.state || '')) {
    if (!userHasKey(ctx.from.id)) {
      await showBindPrompt(ctx);
      return true;
    }
    return processContractGridWizard(ctx, text, state);
  }

  if (state.state !== 'await_grid_trade') return false;
  if (!userHasKey(ctx.from.id)) {
    await showBindPrompt(ctx);
    return true;
  }
  const parsed = parseGridInput(text);
  if (!parsed) {
    await ctx.reply('网格参数无法识别，请按“BTC 60000 70000 10格 100U 现货”发送。', MAIN_MENU);
    return true;
  }
  const profile = getUserProfile(ctx.from.id);

  if (parsed.action === 'orders') {
    const data = runOkx(['bot', 'grid', 'orders', '--algoOrdType', parsed.algoOrdType], { profile });
    clearUserState(ctx.from.id);
    const list = Array.isArray(data) ? data.slice(0, 5) : [];
    await ctx.reply(
      ['━━━━━━━━━━━━━━━━━━', parsed.algoOrdType === 'contract_grid' ? '合约网格列表' : '网格策略列表', '━━━━━━━━━━━━━━━━━━', list.length ? list.map((x) => `${x.instId} | Algo ${x.algoId} | ${x.state || x.runningType || '--'}`).join('\n') : '暂无运行中的网格订单'].join('\n'),
      MAIN_MENU,
    );
    return true;
  }

  const args = ['bot', 'grid', 'create', '--instId', parsed.instId, '--algoOrdType', parsed.algoOrdType, '--maxPx', parsed.maxPx, '--minPx', parsed.minPx, '--gridNum', parsed.gridNum];
  if (parsed.algoOrdType === 'grid') {
    args.push('--quoteSz', parsed.quoteSz);
  } else {
    args.push('--direction', parsed.direction, '--lever', parsed.lever, '--sz', parsed.quoteSz);
  }
  const data = runOkx(args, { profile });
  clearUserState(ctx.from.id);
  const row = Array.isArray(data) ? data[0] : data;
  await ctx.reply(
    ['━━━━━━━━━━━━━━━━━━', '网格策略结果', '━━━━━━━━━━━━━━━━━━', `交易对：${parsed.instId}`, `区间：${parsed.minPx} - ${parsed.maxPx}`, `网格数：${parsed.gridNum}`, `Algo ID：${row?.algoId || '--'}`, `状态：${row?.sCode === '0' ? '已创建' : row?.sMsg || '已返回'}`].join('\n'),
    MAIN_MENU,
  );
  return true;
}

async function processEarnAction(ctx, text) {
  const state = getUserState(ctx.from.id);
  if (!state || state.state !== 'await_earn_action') return false;
  const parsed = parseEarnInput(text);
  if (!parsed) {
    await ctx.reply('赚币指令无法识别，请发送“查询”“申购 USDT 100”或“赎回 USDT 50”。', MAIN_MENU);
    return true;
  }
  const profile = getUserProfile(ctx.from.id);

  if (parsed.action === 'balance') {
    const data = runOkx(['earn', 'savings', 'balance'], { profile });
    const list = Array.isArray(data) ? data.slice(0, 10) : [];
    await ctx.reply(
      ['━━━━━━━━━━━━━━━━━━', '赚币余额', '━━━━━━━━━━━━━━━━━━', list.length ? list.map((x) => `${x.ccy}：${safeNumber(x.amt || x.bal || 0, 8)}`).join('\n') : '暂无赚币持仓'].join('\n'),
      MAIN_MENU,
    );
    return true;
  }

  const data = parsed.action === 'purchase'
    ? runOkx(['earn', 'savings', 'purchase', '--ccy', parsed.ccy, '--amt', parsed.amt], { profile })
    : runOkx(['earn', 'savings', 'redeem', '--ccy', parsed.ccy, '--amt', parsed.amt], { profile });

  clearUserState(ctx.from.id);
  const row = Array.isArray(data) ? data[0] : data;
  await ctx.reply(
    ['━━━━━━━━━━━━━━━━━━', '赚币理财结果', '━━━━━━━━━━━━━━━━━━', `操作：${parsed.action === 'purchase' ? '申购' : '赎回'}`, `币种：${parsed.ccy}`, `数量：${parsed.amt}`, `结果：${row?.sCode === '0' ? '成功提交' : row?.sMsg || '已返回'}`].join('\n'),
    MAIN_MENU,
  );
  return true;
}

async function replyMarket(ctx, text) {
  const symbol = extractSymbol(text);
  const instId = makeInstId(symbol, wantsSwap(text));
  const snapshot = buildAiMarketSnapshot(instId);
  const analysis = await getOpenAiAiResult(snapshot);
  clearUserState(ctx.from.id);
  await ctx.reply(formatAiAnalysisCard(snapshot, analysis), buildAiActionMenu(symbol));
}

async function replyAiAnalysis(ctx, text) {
  const symbol = extractSymbol(text);
  const instId = makeInstId(symbol, wantsSwap(text));
  const snapshot = buildAiMarketSnapshot(instId);
  const analysis = await getOpenAiAiResult(snapshot);
  clearUserState(ctx.from.id);
  await ctx.reply(formatAiAnalysisCard(snapshot, analysis), buildAiActionMenu(symbol));
}

async function replyGridRecommendation(ctx, text) {
  const symbol = extractSymbol(text);
  const instId = makeInstId(symbol, false);
  const snapshot = buildAiMarketSnapshot(instId);
  const analysis = await getOpenAiAiResult(snapshot);
  clearUserState(ctx.from.id);
  await ctx.reply(
    [
      '━━━━━━━━━━━━━━━━━━',
      `${instId} 网格策略推荐`,
      '━━━━━━━━━━━━━━━━━━',
      `上限：${formatUsd(analysis.grid_upper, 2)}`,
      `下限：${formatUsd(analysis.grid_lower, 2)}`,
      `格数：${analysis.grid_num}`,
      `投入建议：${analysis.grid_invest} USDT`,
      '━━━━━━━━━━━━━━━━━━',
      '仅供参考，不构成投资建议',
    ].join('\n'),
    Markup.inlineKeyboard([[Markup.button.callback('创建网格', `ai_grid_${symbol}`)]]),
  );
}

bot.start(handleStart);
bot.command('market', handleMarketCommand);
bot.command('trade', handleTradeCommand);
bot.command('contract', handleContractCommand);
bot.command('grid', handleGridCommand);

bot.action('start_bind', handleBindingStart);
bot.action(/^ai_spot_(.+)$/, async (ctx) => handleAiSpotFromCard(ctx, ctx.match[1]));
bot.action(/^ai_grid_(.+)$/, async (ctx) => handleAiGridFromCard(ctx, ctx.match[1]));

bot.hears('行情分析', handleMarketCommand);
bot.hears('现货交易', handleSpotEntry);
bot.hears('合约杠杆', handleSwapEntry);
bot.hears('网格策略', handleGridEntry);

bot.on('text', async (ctx) => {
  const text = String(ctx.message.text || '').trim();
  if (!text) return;

  try {
    if (await processBinding(ctx, text)) return;
    if (await processSpotTrade(ctx, text)) return;
    if (await processSwapTrade(ctx, text)) return;
    if (await processGridTrade(ctx, text)) return;
    if (await processEarnAction(ctx, text)) return;

    const state = getUserState(ctx.from.id);
    if (state?.state === 'await_ai_symbol') {
      await replyAiAnalysis(ctx, text);
      return;
    }

    if (state?.state === 'await_grid_recommend_symbol') {
      await replyGridRecommendation(ctx, text);
      return;
    }

    if (isAiQuery(text)) {
      await replyAiAnalysis(ctx, text);
      return;
    }

    if (isMarketQuery(text)) {
      await replyMarket(ctx, text);
      return;
    }

    await ctx.reply('未识别该指令，请点击菜单或发送“BTC怎么样”“ETH现在如何”“买 BTC 100U”。', MAIN_MENU);
  } catch (error) {
    await ctx.reply(`执行失败：${error.message}`, MAIN_MENU);
  }
});

bot.catch(async (error, ctx) => {
  console.error('Bot error:', error);
  try {
    await ctx.reply(`系统异常：${error.message}`, MAIN_MENU);
  } catch (_) {
    // ignore
  }
});

(async () => {
  const me = await bot.telegram.getMe();
  await bot.telegram.setMyCommands([
    { command: 'market', description: '行情分析' },
    { command: 'trade', description: '现货交易' },
    { command: 'contract', description: '合约杠杆' },
    { command: 'grid', description: '网格策略' },
  ]);
  await bot.launch();
  console.log(`Bot polling started: @${me.username} (${me.id})`);
})();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
