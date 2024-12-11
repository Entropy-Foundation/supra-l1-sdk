import axios from 'axios'
import type { AxiosInstance, AxiosResponse, AxiosError } from 'axios'
import { ServiceError } from '../error'
import type { Logger } from '../logger'

/**
 * Service responsible for making HTTP requests to the Supra RPC node.
 */
export class RequestService {
  private axiosInstance: AxiosInstance
  private logger: Logger

  /**
   * Constructs a RequestService instance.
   * @param baseURL - Base URL for RPC node.
   * @param logger - Logger instance for logging.
   */
  constructor(baseURL: string, logger: Logger) {
    this.logger = logger
    this.axiosInstance = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    })

    // Request interceptor for logging
    this.axiosInstance.interceptors.request.use(
      (config) => {
        this.logger.debug(
          `Sending ${config.method?.toUpperCase()} request to ${config.url}`,
          {
            data: config.data
          }
        )
        return config
      },
      (error) => {
        this.logger.error('Request Error:', { error })
        return Promise.reject(error)
      }
    )

    // Response interceptor for logging
    this.axiosInstance.interceptors.response.use(
      (response) => {
        this.logger.debug(`Received response from ${response.config.url}`, {
          status: response.status,
          data: response.data
        })
        return response
      },
      (error) => {
        this.logger.error('Response Error:', { error })
        return Promise.reject(error)
      }
    )
  }

  /**
   * Sends an HTTP request to the Supra RPC node.
   * Defaults to GET method if not specified.
   * @param subURL - Endpoint URL.
   * @param data - Request payload for POST method.
   * @param method - HTTP method ('GET' or 'POST'). Defaults to 'GET'.
   * @returns AxiosResponse of type T.
   */
  public async sendRequest<T = any>(
    subURL: string,
    data?: any,
    method: 'GET' | 'POST' = 'GET'
  ): Promise<AxiosResponse<T>> {
    try {
      let response: AxiosResponse<T>
      if (method === 'GET') {
        response = await this.axiosInstance.get<T>(subURL)
      } else if (method === 'POST') {
        if (data === undefined) {
          throw new Error("For POST requests, 'data' should not be undefined")
        }

        response = await this.axiosInstance.post<T>(subURL, data)
      } else {
        throw new Error(`Unsupported HTTP method: ${method}`)
      }

      // Handle specific HTTP status codes if needed
      if (response.status === 404) {
        throw new ServiceError(
          'Invalid URL, Path Not Found',
          new Error('404 Not Found')
        )
      }

      return response
    } catch (error) {
      this.handleError(method, subURL, error)
    }
  }

  /**
   * Handles errors from HTTP requests.
   * @param method - HTTP method ('GET' or 'POST').
   * @param subURL - Endpoint URL.
   * @param error - Error object.
   */
  private handleError(method: string, subURL: string, error: any): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError

      let errorMessage = `${method} request to ${subURL} failed.`
      if (axiosError.response) {
        errorMessage += ` Status: ${axiosError.response.status}.`
        if (axiosError.response.data) {
          errorMessage += ` Data: ${JSON.stringify(axiosError.response.data)}.`
        }
      } else if (axiosError.request) {
        errorMessage += ' No response received from the server.'
      } else {
        errorMessage += ` Error: ${axiosError.message}.`
      }

      this.logger.error(errorMessage, { error: axiosError })
      throw new ServiceError(errorMessage, axiosError)
    } else {
      // Non-Axios error
      const errorMessage = `${method} request to ${subURL} failed with an unknown error.`
      this.logger.error(errorMessage, { error })
      throw new ServiceError(errorMessage, error)
    }
  }
}
