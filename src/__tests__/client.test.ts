import axios from "axios";
import { HexString, SupraClient } from "../index";

jest.mock("axios", () => {
  const actual = jest.requireActual("axios");
  const mockedAxios: any = jest.fn();
  mockedAxios.HttpStatusCode = actual.HttpStatusCode;
  return { __esModule: true, ...actual, default: mockedAxios };
});

const mockedAxios = axios as unknown as jest.Mock;

const BASE_URL = "http://node.invalid";
const ACCOUNT = new HexString("0x" + "ab".repeat(32));
const TX_HASH = "0x" + "cd".repeat(32);

const reply = (status: number, data: any = null, headers: any = {}) => ({
  status,
  data,
  headers,
});

const transferItem = (hash: string, timestamp: number) => ({
  hash,
  status: "Success",
  header: {
    sender: { Move: ACCOUNT.toString() },
    sequence_number: 1,
    max_gas_amount: 5000,
    gas_unit_price: 100,
    expiration_timestamp: { microseconds_since_unix_epoch: 1 },
  },
  payload: {
    Move: {
      type: "entry_function_payload",
      function: "0x1::supra_account::transfer",
      type_arguments: [],
      arguments: ["0x" + "11".repeat(32), "1000"],
    },
  },
  output: {
    Move: { gas_used: 10, events: [], vm_status: "Executed successfully" },
  },
  block_header: {
    height: 7,
    hash: "0x" + "ee".repeat(32),
    timestamp: { microseconds_since_unix_epoch: timestamp },
  },
});

const settlementItem = {
  hash: "0x" + "ff".repeat(32),
  txn_type: "settlement",
  status: "Success",
  block_header: {
    height: 8,
    hash: "0x" + "ee".repeat(32),
    timestamp: { microseconds_since_unix_epoch: 5 },
  },
};

const client = () => new SupraClient(BASE_URL);
const requestedUrls = () =>
  mockedAxios.mock.calls.map((call) => call[0].url as string);

beforeEach(() => {
  mockedAxios.mockReset();
});

describe("isAccountExists", () => {
  it.each([
    [200, true],
    [400, false],
    [404, false],
  ])("status %i returns %s", async (status, expected) => {
    mockedAxios.mockResolvedValue(reply(status, {}));
    await expect(client().isAccountExists(ACCOUNT)).resolves.toBe(expected);
  });

  it("throws on status 500", async () => {
    mockedAxios.mockResolvedValue(reply(500));
    await expect(client().isAccountExists(ACCOUNT)).rejects.toThrow();
  });

  it("throws on a network error", async () => {
    mockedAxios.mockRejectedValue(new Error("connect ECONNREFUSED"));
    await expect(client().isAccountExists(ACCOUNT)).rejects.toThrow(
      "ECONNREFUSED",
    );
  });
});

describe("settlement items", () => {
  const page = [
    transferItem("0x01", 10),
    settlementItem,
    transferItem("0x02", 20),
  ];

  it("getAccountTransactionsDetail skips them", async () => {
    mockedAxios.mockResolvedValue(reply(200, page));
    const result = await client().getAccountTransactionsDetail(ACCOUNT);
    expect(result.map((tx) => tx.txHash)).toEqual(["0x01", "0x02"]);
  });

  it("getCoinTransactionsDetail skips them", async () => {
    mockedAxios.mockResolvedValue(
      reply(200, page, { "x-supra-cursor": "next" }),
    );
    const result = await client().getCoinTransactionsDetail(ACCOUNT);
    expect(result.transactions.map((tx) => tx.txHash)).toEqual([
      "0x01",
      "0x02",
    ]);
    expect(result.cursor).toBe("next");
  });

  it("getAccountCompleteTransactionsDetail skips them", async () => {
    mockedAxios.mockResolvedValue(reply(200, page));
    const result = await client().getAccountCompleteTransactionsDetail(ACCOUNT);
    expect(result.map((tx) => tx.txHash).sort()).toEqual(["0x01", "0x02"]);
  });

  it("getTransactionDetail returns null for a settlement transaction", async () => {
    mockedAxios.mockResolvedValue(reply(200, settlementItem));
    await expect(
      client().getTransactionDetail(ACCOUNT, TX_HASH),
    ).resolves.toBeNull();
  });

  it("getTransactionDetail still describes an ordinary transaction", async () => {
    mockedAxios.mockResolvedValue(reply(200, transferItem("0x01", 10)));
    const result = await client().getTransactionDetail(ACCOUNT, TX_HASH);
    expect(result?.sender).toBe(ACCOUNT.toString());
  });
});

describe("request paths", () => {
  const hostile = ["a/b", "../x", "a?b=c", "a#b", "a/../b", "..", "."];

  // Asserts the requested URL has one segment at `segmentIndex` and no query or fragment that
  // the caller did not supply.
  const expectSingleSegment = (
    url: string | undefined,
    prefix: string,
    suffix: string,
  ) => {
    if (url === undefined) {
      return;
    }
    expect(url.startsWith(prefix)).toBe(true);
    expect(url.endsWith(suffix)).toBe(true);
    const segment = url.slice(prefix.length, url.length - suffix.length);
    expect(segment).not.toMatch(/[/?#]/);
    expect(segment).not.toBe("..");
    expect(segment).not.toBe(".");
  };

  const calls: Array<{
    name: string;
    prefix: string;
    suffix: string;
    run: (value: string) => Promise<unknown>;
  }> = [
    {
      name: "getResourceData (resource type)",
      prefix: `/rpc/v3/accounts/${ACCOUNT.toString()}/resources/`,
      suffix: "",
      run: (v) => client().getResourceData(ACCOUNT, v),
    },
    {
      name: "getTransactionStatus",
      prefix: "/rpc/v3/transactions/",
      suffix: "",
      run: (v) => client().getTransactionStatus(v),
    },
    {
      name: "getTransactionDetail",
      prefix: "/rpc/v3/transactions/",
      suffix: "",
      run: (v) => client().getTransactionDetail(ACCOUNT, v),
    },
    {
      name: "getTableItemByKey",
      prefix: "/rpc/v3/tables/",
      suffix: "/item",
      run: (v) => client().getTableItemByKey(v, "u64", "u64", "1"),
    },
    {
      name: "isAccountExists",
      prefix: "/rpc/v3/accounts/",
      suffix: "",
      run: (v) => client().isAccountExists(new HexString(v)),
    },
    {
      name: "getAccountInfo",
      prefix: "/rpc/v3/accounts/",
      suffix: "",
      run: (v) => client().getAccountInfo(new HexString(v)),
    },
    {
      name: "getAccountResources",
      prefix: "/rpc/v3/accounts/",
      suffix: "/resources?count=10",
      run: (v) => client().getAccountResources(new HexString(v), { count: 10 }),
    },
    {
      name: "getAccountTransactionsDetail",
      prefix: "/rpc/v3/accounts/",
      suffix: "/transactions?count=10",
      run: (v) =>
        client().getAccountTransactionsDetail(new HexString(v), { count: 10 }),
    },
    {
      name: "getCoinTransactionsDetail",
      prefix: "/rpc/v3/accounts/",
      suffix: "/coin_transactions?count=10",
      run: (v) =>
        client().getCoinTransactionsDetail(new HexString(v), { count: 10 }),
    },
    {
      name: "fundAccountWithFaucet",
      prefix: "/rpc/v3/wallet/faucet/",
      suffix: "",
      run: (v) => client().fundAccountWithFaucet(new HexString(v)),
    },
  ];

  describe.each(calls)("$name", ({ prefix, suffix, run }) => {
    it.each(hostile)(
      "keeps %j in one path segment or rejects it",
      async (value) => {
        mockedAxios.mockResolvedValue(reply(200, []));
        try {
          await run(value);
        } catch {
          // Rejection before or after the request is acceptable; the URL check below applies to
          // any request that was made.
        }
        const urls = requestedUrls();
        expect(urls.length).toBeLessThanOrEqual(1);
        expectSingleSegment(urls[0], prefix, suffix);
      },
    );
  });

  it("encodes the account in getAccountCompleteTransactionsDetail", async () => {
    mockedAxios.mockResolvedValue(reply(200, []));
    await client()
      .getAccountCompleteTransactionsDetail(new HexString("a/../b"))
      .catch(() => undefined);
    for (const url of requestedUrls()) {
      expect(url.split("?")[0]).toMatch(
        /^\/rpc\/v3\/accounts\/[^/]+\/(coin_)?transactions$/,
      );
    }
  });

  it("encodes query values", async () => {
    mockedAxios.mockResolvedValue(reply(200, []));
    await client().getAccountTransactionsDetail(ACCOUNT, {
      start: "a&count=1#x",
      count: 5,
    });
    const url = requestedUrls()[0];
    expect(url).toContain("start=a%26count%3D1%23x");
    expect(url).not.toContain("#");
  });

  it("encodes a Move struct type as one segment", async () => {
    mockedAxios.mockResolvedValue(reply(200, {}));
    await client().getResourceData(
      new HexString("0x1"),
      "0x1::coin::CoinStore<0x1::supra_coin::SupraCoin>",
    );
    expect(requestedUrls()[0]).toBe(
      "/rpc/v3/accounts/0x1/resources/0x1%3A%3Acoin%3A%3ACoinStore%3C0x1%3A%3Asupra_coin%3A%3ASupraCoin%3E",
    );
  });
});
