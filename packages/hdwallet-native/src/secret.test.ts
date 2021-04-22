import * as core from "@shapeshiftoss/hdwallet-core";
import * as NativeHDWallet from "./native";

const MNEMONIC = "all all all all all all all all all all all all";

const mswMock = require("mswMock")().startServer();
afterEach(() => expect(mswMock).not.toHaveBeenCalled());

const untouchable = require("untouchableMock");

describe("NativeSecretWalletInfo", () => {
  const info = NativeHDWallet.info();

  it("should return some static metadata", async () => {
    await expect(untouchable.call(info, "secretSupportsNetwork")).resolves.toBe(true);
    await expect(untouchable.call(info, "secretSupportsSecureTransfer")).resolves.toBe(false);
    expect(untouchable.call(info, "secretSupportsNativeShapeShift")).toBe(false);
  });

  it("should return the correct account paths", async () => {
    const paths = info.secretGetAccountPaths({ accountIdx: 0 });
    expect(paths).toMatchObject([{ addressNList: core.bip32ToAddressNList("m/44'/529'/0'/0/0") }]);
  });

  it("does not support getting the next account path", async () => {
    expect(untouchable.call(info, "secretNextAccountPath", {})).toBe(undefined);
  });
});

describe("NativeSecretWallet", () => {
  let wallet: NativeHDWallet.NativeHDWallet;

  beforeEach(async () => {
    wallet = NativeHDWallet.create({ deviceId: "native" });
    await wallet.loadDevice({ mnemonic: MNEMONIC });
    await expect(wallet.initialize()).resolves.toBe(true);
  });

  it("should generate a correct secret address", async () => {
    await expect(
      wallet.secretGetAddress({ addressNList: core.bip32ToAddressNList("m/44'/529'/0'/0/0") })
    ).resolves.toBe("secret189wrfk2fsynjlz6jcn54wzdcud3a6k8vqa0ggu");
  });

  it("should generate another correct secret address", async () => {
    await expect(
      wallet.secretGetAddress({ addressNList: core.bip32ToAddressNList("m/44'/529'/1337'/123/4") })
    ).resolves.toBe("secret1wmmewcjt2s09r48ya8mtdfyy0rnnza20xnx6fs");
  });

  it("does not support signing transactions", async () => {
    await expect(wallet.secretSignTx({
      addressNList: core.bip32ToAddressNList("m/44'/529'/0'/0/0"),
      tx: {
        msg: [{ type: "foo", value: "bar" }],
        fee: {
          amount: [{ denom: "foo", amount: "bar" }],
          gas: "baz",
        },
        signatures: null,
        memo: "foobar",
      },
      chain_id: "foobar",
      account_number: 123,
      sequence: 456,
    })).rejects.toThrowError("Not Supported");
  });
});
