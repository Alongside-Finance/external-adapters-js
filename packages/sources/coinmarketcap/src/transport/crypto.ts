import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes, inputParameters } from '../endpoint/crypto'
import { makeLogger, splitArrayIntoChunks } from '@chainlink/external-adapter-framework/util'

const logger = makeLogger('CryptoCMCEndpoint')

interface PriceInfo {
  price: number
  volume_24h: number
  percent_change_1h: number
  percent_change_24h: number
  percent_change_7d: number
  percent_change_30d: number
  market_cap: number
}

interface ProviderResponseBody {
  data: {
    [key: string]: {
      id: number
      name: string
      symbol: string
      slug: string
      is_active: number
      is_fiat: number
      circulating_supply: number
      total_supply: number
      max_supply: number
      date_added: string
      num_market_pairs: number
      cmc_rank: number
      last_updated: string
      tags: string[]
      platform: string
      quote: {
        [key: string]: PriceInfo
      }
    }
  }
  status: {
    timestamp: string
    error_code: number
    error_message: string
    elapsed: number
    credit_count: number
  }
  cost: number
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ProviderResponseBody
  }
}

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params: (typeof inputParameters.validated)[], settings) => {
    const requests = []
    const groupedParams = {
      id: [],
      slug: [],
      symbol: [],
    } as Record<string, (typeof inputParameters.validated)[]>

    for (const param of params) {
      if (param.cid) {
        groupedParams.id.push(param)
      } else if (param.slug) {
        groupedParams.slug.push(param)
      } else if (param.base) {
        groupedParams.symbol.push(param)
      } else {
        logger.error(
          `Params were not able to be classified into ID, Slug or Symbol: (${JSON.stringify(
            param,
          )})`,
        )
      }
    }

    for (const [idType, fullList] of Object.entries(groupedParams)) {
      if (fullList && fullList.length > 0) {
        // CMC does not support more than 120 unique quotes
        const chunkedList = splitArrayIntoChunks(fullList, 120)

        // This could be further optimized in cases with more than 120 entries, to make sure that
        // chunkes are grouped optimally to avoid sending unnecessary converts
        for (const list of chunkedList) {
          requests.push({
            params: list,
            request: {
              baseURL: settings.API_ENDPOINT,
              url: '/cryptocurrency/quotes/latest',
              headers: {
                'X-CMC_PRO_API_KEY': settings.API_KEY,
              },
              params: {
                [idType]: [...new Set(list.map((p) => p.cid || p.slug || p.base))].join(','),
                convert: [...new Set(list.map((p) => p.quote))].join(','),
              },
            },
          })
        }
      }
    }

    return requests
  },
  parseResponse: (params, res) => {
    logger.debug(`CMC api call cost: ${res.data.cost}`)

    // Use the mapping to generate the responses
    return params.map((p) => {
      const data = res.data.data[p.cid || p.slug || p.base]
      if (!data) {
        return {
          params: p,
          response: {
            statusCode: 502,
            errorMessage: `Data was not found in response for request: ${JSON.stringify(p)}`,
          },
        }
      }

      const dataForQuote = data.quote[p.quote]
      if (!dataForQuote) {
        return {
          params: p,
          response: {
            statusCode: 502,
            errorMessage: `Data for quote "${
              p.quote
            }" was not found in response for request: ${JSON.stringify(p)}`,
          },
        }
      }

      // We always set a value for the resultPath in the request transform
      const resultPath =
        p.resultPath as (typeof inputParameters.definition.resultPath.options)[number]
      const valueRequested = dataForQuote[resultPath]
      if (valueRequested == null) {
        return {
          params: p,
          response: {
            statusCode: 502,
            errorMessage: `Value for "${resultPath}" was not found in the quote request: ${JSON.stringify(
              p,
            )}`,
          },
        }
      }

      // We're adding multiple results because the same provider endpoint provides values for several adapter endpoints
      // Price
      return {
        params: p,
        response: {
          result: dataForQuote[resultPath],
          data: {
            result: dataForQuote[resultPath],
          },
        },
      }
    })
  },
})
