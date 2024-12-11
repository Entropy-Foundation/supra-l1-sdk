import { HexString } from 'aptos'
import type { RequestService } from './requestService'
import type { Logger } from '../logger'
import { AccountInfo, AccountResources, PaginationArgs } from '../types/types'
import { DEFAULT_RECORDS_ITEMS_COUNT } from '../constants/constants'

/**
 * Service responsible for account-related operations.
 */
export class AccountService {
  private readonly requestService: RequestService
  private readonly logger: Logger

  /**
   * Constructs an AccountService instance.
   * @param requestService - Instance of RequestService.
   * @param logger - Logger instance for logging.
   */
  constructor(requestService: RequestService, logger: Logger) {
    this.requestService = requestService
    this.logger = logger
  }

  /**
   * Checks whether a given account exists on-chain.
   * @param account - Hex-encoded 32 byte Supra account address.
   * @returns Boolean indicating account existence.
   */
  public async accountExists(account: HexString): Promise<boolean> {
    try {
      this.logger.debug(`Checking existence of account: ${account.toString()}`)
      const response = await this.requestService.sendRequest<any>(
        `/rpc/v1/accounts/${account.toString()}`
      )

      return response.data !== null
    } catch (error: unknown) {
      // Check if error has a message and includes '404'
      if (error instanceof Error && error.message.includes('404')) {
        this.logger.info(`Account does not exist: ${account.toString()}`)
        return false
      }

      this.logger.error(
        `Failed to check account existence: ${account.toString()}`,
        { error }
      )
      throw error
    }
  }

  /**
   * Retrieves account information.
   * @param account - Hex-encoded 32 byte Supra account address.
   * @returns AccountInfo object.
   */
  public async getAccountInfo(account: HexString): Promise<AccountInfo> {
    this.logger.debug(`Fetching account info for: ${account.toString()}`)

    try {
      const response = await this.requestService.sendRequest<any>(
        `/rpc/v1/accounts/${account.toString()}`
      )

      return {
        sequence_number: BigInt(response.data.sequence_number),
        authentication_key: response.data.authentication_key
      }
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch account info for: ${account.toString()}`,
        { error }
      )

      if (error?.response?.status === 404) {
        throw new Error('Account does not exist')
      }

      // For all other errors, throw a generic error.
      throw new Error('Failed to fetch account info')
    }
  }

  /**
   * Retrieves all resources held by a given account.
   * @param account - Hex-encoded 32 byte Supra account address.
   * @param paginationArgs - Pagination arguments.
   * @returns AccountResources object.
   */
  public async getAccountResources(
    account: HexString,
    paginationArgs?: PaginationArgs
  ): Promise<AccountResources> {
    try {
      const count = paginationArgs?.count ?? DEFAULT_RECORDS_ITEMS_COUNT
      let requestPath = `/rpc/v1/accounts/${account.toString()}/resources?count=${count}`
      if (paginationArgs?.start) {
        requestPath += `&start=${paginationArgs.start}`
      }
      this.logger.debug(`Fetching resources for account: ${account.toString()}`)
      const response = await this.requestService.sendRequest<any>(requestPath) //  TO-DO:   We need to define return types for these responses
      return response.data.Resources as AccountResources
    } catch (error) {
      this.logger.error(
        `Failed to fetch account resources for: ${account.toString()}`,
        {
          error
        }
      )
      throw error
    }
  }

  public async getAccountSupraCoinBalance(account: HexString): Promise<bigint> {
    try {
      return BigInt(
        (
          await this.getResourceData(
            account,
            '0x1::coin::CoinStore<0x1::supra_coin::SupraCoin>'
          )
        ).coin.value
      )
    } catch (error) {
      this.logger.error('Failed to fetch coin info', { error })
      throw error
    }
  }

  /**
   * Retrieves custom coin balance of a given account.
   * @param account - SupraAccount address.
   * @param coinType - Type of the custom coin.
   * @returns Coin balance as bigint.
   */
  public async getAccountCoinBalance(
    account: HexString,
    coinType: string
  ): Promise<bigint> {
    try {
      return BigInt(
        (
          await this.getResourceData(
            account,
            `0x1::coin::CoinStore<${coinType}>`
          )
        ).coin.value
      )
    } catch (error) {
      this.logger.error('Failed to fetch custom coin balance', { error })
      throw error
    }
  }

  /**
   * Retrieves data of a specific resource held by an account.
   * @param account - SupraAccount address.
   * @param resourceType - Type of the resource.
   * @returns Resource data.
   */
  public async getResourceData(
    account: HexString,
    resourceType: string
  ): Promise<any> {
    //  TO-DO:   We need to define return types for these responses
    try {
      const response = await this.requestService.sendRequest<any>( //  TO-DO:   We need to define return types for these responses
        `/rpc/v1/accounts/${account.toString()}/resources/${resourceType}`
      )
      if (!response.data.result || response.data.result.length === 0) {
        throw new Error('Failed to fetch resource data')
      }
      return response.data.result[0]
    } catch (error) {
      throw error
    }
  }
}
