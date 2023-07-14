import { BaseEndpointTypes } from '../endpoint/benchmark'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { config } from '../config'
import { Benchmark } from './utils'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { makeLogger } from '@chainlink/external-adapter-framework/util/logger'
import { AdapterResponse, sleep } from '@chainlink/external-adapter-framework/util'

const logger = makeLogger('BenchmarkLogger')

export type BenchmarkTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: any
  }
}
export class AlongsideBenchmarkTransport extends SubscriptionTransport<BenchmarkTransportTypes> {
  responseCache!: ResponseCache<BenchmarkTransportTypes>
  requester!: Requester
  name!: string

  async initialize(
    dependencies: TransportDependencies<BenchmarkTransportTypes>,
    adapterSettings: typeof config.settings,
    endpointName: string,
    name: string,
  ): Promise<void> {
    super.initialize(dependencies, adapterSettings, endpointName, name)
    this.responseCache = dependencies.responseCache
    this.requester = dependencies.requester
    this.name = name
  }

  getSubscriptionTtlFromConfig(adapterSettings: typeof config.settings): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }

  async backgroundHandler(context: EndpointContext<BenchmarkTransportTypes>): Promise<void> {
    const benchmark = new Benchmark(context.adapterSettings.SOURCE_RPC_URL)
    const providerDataRequestedUnixMs = Date.now()
    let response: AdapterResponse<BenchmarkTransportTypes['Response']>
    try {
      const result = await benchmark.getBenchmarkPrice()
      response = {
        data: {
          result: result,
        },
        statusCode: 200,
        result: result,
        timestamps: {
          providerDataRequestedUnixMs,
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      logger.error(errorMessage)
      response = {
        statusCode: 502,
        errorMessage,
        timestamps: {
          providerDataRequestedUnixMs,
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      }
    }

    await this.responseCache.write(this.name, [
      {
        params: {},
        response,
      },
    ])

    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
    return
  }
}
