import { Global, Module } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { EtherscanClient } from './etherscan.client';

@Global()
@Module({
  providers: [EtherscanClient, BlockchainService],
  exports: [EtherscanClient, BlockchainService],
})
export class BlockchainModule {}
