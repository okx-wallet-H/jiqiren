# 合约网格 CLI 关键信息

来源：OKX agent-trade-kit CLI Reference

## 查询命令

```bash
okx bot grid orders --algoOrdType contract_grid
okx bot grid orders --algoOrdType contract_grid --history
okx bot grid details --algoOrdType contract_grid --algoId <algoId>
okx bot grid sub-orders --algoOrdType contract_grid --algoId <algoId>
```

## 创建命令

```bash
okx bot grid create --instId BTC-USDT-SWAP --algoOrdType contract_grid \
  --maxPx 100000 --minPx 80000 --gridNum 10 \
  --direction neutral --lever 3 --sz 100
```

```bash
okx bot grid create --instId BTC-USDT-SWAP --algoOrdType contract_grid \
  --maxPx 100000 --minPx 80000 --gridNum 10 \
  --direction long --lever 5 --sz 100
```

```bash
okx bot grid create --instId BTC-USDT-SWAP --algoOrdType contract_grid \
  --maxPx 100000 --minPx 80000 --gridNum 10 \
  --direction short --lever 3 --sz 100
```

## 参数说明

| 参数 | 含义 |
| --- | --- |
| `--instId` | 合约交易对，例如 `BTC-USDT-SWAP` |
| `--algoOrdType contract_grid` | 合约网格类型 |
| `--maxPx` | 上限价 |
| `--minPx` | 下限价 |
| `--gridNum` | 格数 |
| `--direction` | 方向，可取 `neutral`、`long`、`short` |
| `--lever` | 杠杆倍数 |
| `--sz` | 投入金额，USDT 本位下为 USDT 保证金 |

## 停止命令

```bash
okx bot grid stop --algoId <algoId> --algoOrdType contract_grid --instId BTC-USDT-SWAP
okx bot grid stop --algoId <algoId> --algoOrdType contract_grid --instId BTC-USDT-SWAP --stopType 2
```
