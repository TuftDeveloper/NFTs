# NFT Floor Price Comparator

A lightweight web tool for tracking and comparing historical NFT floor prices across major Ethereum collections using the OpenSea API.

## Collections Tracked

| Collection | Contract |
|---|---|
| Pudgy Penguins | 0xBd3531dA5CF5857e7CfAA92426877b022e612cf8 |
| Azuki | 0xED5AF388653567Af2F388E6224dC7C4b3241C544 |
| CryptoPunks | 0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB |
| Bored Ape Yacht Club | 0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D |

## Features

- Historical floor price data from January 2023 to present
- Floor price ratio comparisons — select any collection as the base
- Mirrored ratio scale: positive when comparison is more expensive, negative when base is more expensive
- Live floor prices refreshed every 5 minutes via OpenSea API
- Data cached locally in the browser so subsequent loads are instant
- Tooltips show ETH floor price and ratio on hover

## How It Works

Floor prices are fetched using the OpenSea API v2:
- **Historical:** `/api/v2/events/collection/{slug}?event_type=listing` — retrieves listing events per month, minimum listing price = floor
- **Live:** `/api/v2/collections/{slug}/stats` — current floor price

## Usage

1. Get a free OpenSea API key at [docs.opensea.io/reference/api-keys](https://docs.opensea.io/reference/api-keys)
2. Open `nft-compare.html` in any browser
3. Paste your API key and click **Load History**
4. Data is cached — subsequent loads are instant

## Ratio Formula

```
ratio = other >= base  ?  other / base  :  -(base / other)
```

- `+50x` means the comparison collection floor is 50× higher than the base
- `-50x` means the base collection floor is 50× higher than the comparison
- `0` means both collections are at the same floor price

## Tech Stack

- Vanilla HTML / CSS / JavaScript (no build tools)
- [Chart.js 4.4](https://www.chartjs.org/) for charting
- OpenSea API v2 for floor price data

## License

MIT
