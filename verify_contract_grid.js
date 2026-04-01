const fs = require('fs');
const path = require('path');

const file = path.join('/home/ubuntu/dolphin_ai', 'index.js');
const src = fs.readFileSync(file, 'utf8');

const checks = [
  ['grid_mode_entry', /await_grid_mode/],
  ['contract_grid_symbol', /await_contract_grid_symbol/],
  ['contract_grid_direction', /await_contract_grid_direction/],
  ['contract_grid_max_px', /await_contract_grid_max_px/],
  ['contract_grid_min_px', /await_contract_grid_min_px/],
  ['contract_grid_grid_num', /await_contract_grid_grid_num/],
  ['contract_grid_sz', /await_contract_grid_sz/],
  ['contract_grid_lever', /await_contract_grid_lever/],
  ['contract_grid_create_args', /bot', 'grid', 'create'[\s\S]*--algoOrdType', 'contract_grid'[\s\S]*--direction'[\s\S]*--lever'[\s\S]*--sz/],
  ['contract_grid_orders', /orders', '--algoOrdType', 'contract_grid'/],
  ['grid_help_text', /合约网格 BTC/],
];

const result = checks.map(([name, regex]) => ({ name, ok: regex.test(src) }));
const failed = result.filter(x => !x.ok);
console.log(JSON.stringify({ ok: failed.length === 0, result, failed }, null, 2));
if (failed.length) process.exit(1);
