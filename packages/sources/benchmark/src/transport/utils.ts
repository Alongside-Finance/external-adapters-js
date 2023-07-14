import { makeLogger } from '@chainlink/external-adapter-framework/util/logger'
import { ethers } from 'ethers'
import abi from '../config/abi.json'
import { formatUnits } from 'ethers/lib/utils'

const logger = makeLogger('Alongside benchmark utils logger')

export class Benchmark {
  provider: ethers.providers.JsonRpcProvider
  BenchmarkCalculator: ethers.Contract
  constructor(rpcUrl: string) {
    this.provider = new ethers.providers.JsonRpcProvider(rpcUrl)
    this.BenchmarkCalculator = new ethers.Contract(
      '0xDD1546df6FE32a8c4D2B78AA34dB3914A847819F',
      abi,
      this.provider,
    )
  }
  getBenchmarkPrice = async () => {
    logger.debug('Getting benchmark price')
    const price = await this.BenchmarkCalculator.getBenchmarkPrice([])
    return Number(formatUnits(price, 6))
  }
}
