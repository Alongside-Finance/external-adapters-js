import { makeLogger } from '@chainlink/external-adapter-framework/util/logger'
import { ethers } from 'ethers'
import abi from '../config/abi.json'

const logger = makeLogger('Alongside benchmark utils logger')

export class Calculator {
  provider: ethers.providers.JsonRpcProvider
  contract: ethers.Contract
  constructor(rpcUrl: string) {
    this.provider = new ethers.providers.JsonRpcProvider(rpcUrl)
    this.contract = new ethers.Contract(
      '0x5094Fa1635C47f5806d40326aBEA8061f7973C0C',
      abi,
      this.provider,
    )
  }
  getIndexPrice = async () => {
    logger.debug('Getting index price')
    const price = await this.contract.getBenchmarkPrice()
    return Number(ethers.utils.formatUnits(price, 6))
  }
}
