import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { benchmark } from './endpoint'
import { config } from './config'

export const adapter = new Adapter({
  defaultEndpoint: benchmark.name,
  name: 'BENCHMARK',
  config,
  endpoints: [benchmark],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
