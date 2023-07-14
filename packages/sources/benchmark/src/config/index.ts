import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig(
  {
    SOURCE_RPC_URL: {
      description: 'The RPC URL to connect to the EVM chain the contract is deployed to',
      type: 'string',
      required: true,
    },
    BACKGROUND_EXECUTE_MS: {
      description:
        'The amount of time the background execute should sleep before performing the next request',
      type: 'number',
      default: 10_000,
    },
  },
  {
    envDefaultOverrides: {
      BACKGROUND_EXECUTE_TIMEOUT: 180_000,
    },
  },
)
