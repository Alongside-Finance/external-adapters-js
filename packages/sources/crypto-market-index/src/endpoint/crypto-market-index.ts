import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { EmptyInputParameters } from '@chainlink/external-adapter-framework/validation/input-params'
import { CryptoMarketIndexTransport } from '../transport/crypto-market-index'
import { config } from '../config'

export type BaseEndpointTypes = {
  Parameters: EmptyInputParameters
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'crypto-market-index',
  transport: new CryptoMarketIndexTransport(),
})
