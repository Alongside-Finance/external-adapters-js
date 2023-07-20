import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { cryptoMarketIndex } from './endpoint'
import { config } from './config'

export const adapter = new Adapter({
  defaultEndpoint: cryptoMarketIndex.name,
  name: 'CRYPTO-MARKET-INDEX',
  config,
  endpoints: [cryptoMarketIndex],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
