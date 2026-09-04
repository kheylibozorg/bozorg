import { a as __toCommonJS, i as __require, n as __esmMin, o as __toESM, r as __exportAll, t as __commonJSMin } from "../_runtime.mjs";
import { a as formatUnits, i as Contract, n as Wallet, o as parseUnits, r as JsonRpcProvider } from "./ethers.mjs";
import { t as axios } from "./axios+[...].mjs";
import { EventEmitter } from "events";
//#region __vite-optional-peer-dep:bufferutil:ws
var __vite_optional_peer_dep_bufferutil_ws_exports = /* @__PURE__ */ __exportAll({ default: () => __vite_optional_peer_dep_bufferutil_ws_default });
var __vite_optional_peer_dep_bufferutil_ws_default;
var init___vite_optional_peer_dep_bufferutil_ws = __esmMin((() => {
	__vite_optional_peer_dep_bufferutil_ws_default = {};
	throw new Error(`Could not resolve "bufferutil" imported by "ws". Is it installed?`);
}));
//#endregion
//#region __vite-optional-peer-dep:utf-8-validate:ws
var __vite_optional_peer_dep_utf_8_validate_ws_exports = /* @__PURE__ */ __exportAll({ default: () => __vite_optional_peer_dep_utf_8_validate_ws_default });
var __vite_optional_peer_dep_utf_8_validate_ws_default;
var init___vite_optional_peer_dep_utf_8_validate_ws = __esmMin((() => {
	__vite_optional_peer_dep_utf_8_validate_ws_default = {};
	throw new Error(`Could not resolve "utf-8-validate" imported by "ws". Is it installed?`);
}));
//#endregion
//#region node_modules/lighter-ts-sdk/dist/esm/utils/configuration.js
var Config = class Config {
	constructor(config) {
		this.config = {
			host: "https://mainnet.zklighter.elliot.ai",
			timeout: 3e4,
			userAgent: "Lighter-TypeScript-SDK/1.0.0",
			...config
		};
	}
	static getDefault() {
		if (!Config.instance) Config.instance = new Config({});
		return Config.instance;
	}
	static setDefault(config) {
		Config.instance = new Config(config);
		return Config.instance;
	}
	getHost() {
		return this.config.host;
	}
	getApiKey() {
		return this.config.apiKey;
	}
	getSecretKey() {
		return this.config.secretKey;
	}
	getTimeout() {
		return this.config.timeout || 3e4;
	}
	getUserAgent() {
		return this.config.userAgent || "Lighter-TypeScript-SDK/1.0.0";
	}
	setApiKey(apiKey) {
		this.config.apiKey = apiKey;
	}
	setSecretKey(secretKey) {
		this.config.secretKey = secretKey;
	}
	setHost(host) {
		this.config.host = host;
	}
	setTimeout(timeout) {
		this.config.timeout = timeout;
	}
	toJSON() {
		return { ...this.config };
	}
};
//#endregion
//#region node_modules/lighter-ts-sdk/dist/esm/utils/exceptions.js
var LighterException = class extends Error {
	constructor(message, status, code) {
		super(message);
		this.name = "LighterException";
		this.status = status;
		this.code = code;
	}
};
var ApiException = class extends LighterException {
	constructor(message, status, code) {
		super(message, status, code);
		this.name = "ApiException";
	}
};
var BadRequestException = class extends ApiException {
	constructor(message, code) {
		super(message, 400, code);
		this.name = "BadRequestException";
	}
};
var UnauthorizedException = class extends ApiException {
	constructor(message, code) {
		super(message, 401, code);
		this.name = "UnauthorizedException";
	}
};
var ForbiddenException = class extends ApiException {
	constructor(message, code) {
		super(message, 403, code);
		this.name = "ForbiddenException";
	}
};
var NotFoundException = class extends ApiException {
	constructor(message, code) {
		super(message, 404, code);
		this.name = "NotFoundException";
	}
};
var TooManyRequestsException = class extends ApiException {
	constructor(message, code) {
		super(message, 429, code);
		this.name = "TooManyRequestsException";
	}
};
var ServiceException = class extends ApiException {
	constructor(message, code) {
		super(message, 500, code);
		this.name = "ServiceException";
	}
};
var TransactionException = class extends LighterException {
	constructor(message, txType, txInfo) {
		super(message, 0, "TRANSACTION_ERROR");
		this.name = "TransactionException";
		this.txType = txType;
		this.txInfo = txInfo;
	}
};
//#endregion
//#region node_modules/lighter-ts-sdk/dist/esm/api/api-client.js
var ApiClient = class {
	constructor(config) {
		this.defaultHeaders = {};
		this.config = config ? new Config(config) : Config.getDefault();
		const axiosConfig = {
			baseURL: this.config.getHost(),
			timeout: this.config.getTimeout(),
			headers: {
				"User-Agent": this.config.getUserAgent(),
				"Content-Type": "application/json"
			}
		};
		this.axiosInstance = axios.create(axiosConfig);
		this.setupInterceptors();
	}
	setupInterceptors() {
		this.axiosInstance.interceptors.request.use((config) => {
			if (this.config.getApiKey()) config.headers["X-API-Key"] = this.config.getApiKey();
			if (this.config.getSecretKey()) config.headers["X-Secret-Key"] = this.config.getSecretKey();
			Object.assign(config.headers, this.defaultHeaders);
			return config;
		}, (error) => {
			return Promise.reject(error);
		});
		this.axiosInstance.interceptors.response.use((response) => {
			return response;
		}, (error) => {
			return Promise.reject(this.handleError(error));
		});
	}
	handleError(error) {
		if (error.response) {
			const { status, data } = error.response;
			const message = data?.message || error.message || "API Error";
			const code = data?.code;
			if (typeof process !== "undefined" && (process.env?.DEBUG || false)) {
				console.error("❌ API Error Response:");
				console.error("   Status:", status);
				console.error("   Code:", code);
				console.error("   Message:", message);
				console.error("   Data:", JSON.stringify(data, null, 2));
			}
			switch (status) {
				case 400: return new BadRequestException(message, code);
				case 401: return new UnauthorizedException(message, code);
				case 403: return new ForbiddenException(message, code);
				case 404: return new NotFoundException(message, code);
				case 429: return new TooManyRequestsException(message, code);
				case 500:
				case 502:
				case 503:
				case 504: return new ServiceException(message, code);
				default: return new ApiException(message, status, code);
			}
		}
		if (error.request) {
			if (typeof process !== "undefined" && (process.env?.DEBUG || false)) {
				console.error("❌ Network Error: No response received");
				console.error("   Request:", error.request);
			}
			return new ApiException("Network error: No response received", 0);
		}
		if (typeof process !== "undefined" && (process.env?.DEBUG || false)) console.error("❌ Unknown Error:", error);
		return new ApiException(error.message || "Unknown error", 0);
	}
	setDefaultHeader(name, value) {
		this.defaultHeaders[name] = value;
	}
	removeDefaultHeader(name) {
		delete this.defaultHeaders[name];
	}
	async request(method, url, data, config) {
		try {
			const response = await this.axiosInstance.request({
				method,
				url,
				data,
				...config
			});
			return {
				data: response.data,
				status: response.status,
				statusText: response.statusText,
				headers: response.headers
			};
		} catch (error) {
			throw error;
		}
	}
	async get(url, params, config) {
		return this.request("GET", url, void 0, {
			params,
			...config
		});
	}
	async post(url, data, config) {
		return this.request("POST", url, data, config);
	}
	async put(url, data, config) {
		return this.request("PUT", url, data, config);
	}
	async delete(url, config) {
		return this.request("DELETE", url, void 0, config);
	}
	async patch(url, data, config) {
		return this.request("PATCH", url, data, config);
	}
	getConfig() {
		return this.config;
	}
	setConfig(config) {
		this.config = Config.setDefault(config);
	}
	close() {}
};
//#endregion
//#region node_modules/lighter-ts-sdk/dist/esm/api/account-api.js
var AccountApi = class {
	constructor(client) {
		this.client = client;
	}
	async getAccount(params, auth) {
		const data = (await this.client.get("/api/v1/account", {
			by: params.by,
			value: params.value
		}, auth ? { headers: { "X-Auth-Token": auth } } : void 0)).data;
		return Array.isArray(data.accounts) ? data.accounts[0] : data;
	}
	async getAccounts(params) {
		return (await this.client.get("/api/v1/accounts", params)).data;
	}
	async getAccountsByL1Address(l1Address) {
		const data = (await this.client.get("/api/v1/accountsByL1Address", { l1_address: l1Address })).data;
		return Array.isArray(data) ? data : data.sub_accounts || [];
	}
	async getApiKeys(accountIndex, apiKeyIndex) {
		return (await this.client.get("/api/v1/apikeys", {
			account_index: accountIndex,
			api_key_index: apiKeyIndex
		})).data;
	}
	async getFeeBucket(accountIndex) {
		return (await this.client.get("/api/v1/feeBucket", { account_index: accountIndex })).data;
	}
	async isWhitelisted(accountIndex) {
		return (await this.client.get("/api/v1/isWhitelisted", { account_index: accountIndex })).data;
	}
	async getPnL(accountIndex, params) {
		return (await this.client.get("/api/v1/pnl", {
			account_index: accountIndex,
			...params
		})).data;
	}
	async getPublicPools(filter = "all", limit = 10, index = 0) {
		return (await this.client.get("/api/v1/publicPools", {
			filter,
			limit,
			index
		})).data;
	}
	async changeAccountTier(accountIndex, newTier, auth) {
		const params = new URLSearchParams();
		params.append("account_index", accountIndex.toString());
		params.append("new_tier", newTier);
		params.append("auth", auth);
		return (await this.client.post("/api/v1/changeAccountTier", params, { headers: { "Content-Type": "application/x-www-form-urlencoded" } })).data;
	}
	async getAccountLimits(accountIndex, auth) {
		return (await this.client.get("/api/v1/accountLimits", {
			account_index: accountIndex,
			...auth ? {
				authorization: auth,
				auth
			} : {}
		})).data;
	}
	async getAccountMetadata(accountIndex, auth) {
		return (await this.client.get("/api/v1/accountMetadata", {
			by: "index",
			value: accountIndex.toString(),
			...auth ? { auth } : {}
		}, auth ? { headers: { authorization: auth } } : void 0)).data;
	}
	async getAccountMetadataBy(by, value, options) {
		return (await this.client.get("/api/v1/accountMetadata", {
			by,
			value,
			...options?.auth ? { auth: options.auth } : {}
		}, options?.authorization ? { headers: { authorization: options.authorization } } : void 0)).data;
	}
	async faucet(accountIndex) {
		return (await this.client.post("/api/v1/faucet", { account_index: accountIndex })).data;
	}
	async getLiquidations(accountIndex, params, auth) {
		return (await this.client.get("/api/v1/liquidations", {
			account_index: accountIndex,
			...params,
			...auth ? {
				authorization: auth,
				auth
			} : {}
		})).data;
	}
	async getPositionFundings(accountIndex, params, auth) {
		return (await this.client.get("/api/v1/positionFundings", {
			account_index: accountIndex,
			...params,
			...auth ? {
				authorization: auth,
				auth
			} : {}
		})).data;
	}
	async getL1Metadata(l1Address, options) {
		return (await this.client.get("/api/v1/l1Metadata", {
			l1_address: l1Address,
			...options?.auth ? { auth: options.auth } : {}
		}, options?.authorization ? { headers: { authorization: options.authorization } } : void 0)).data;
	}
	async getPublicPoolsMetadata(index, limit, params) {
		return (await this.client.get("/api/v1/publicPoolsMetadata", {
			index,
			limit,
			...params?.filter !== void 0 ? { filter: params.filter } : {},
			...params?.account_index !== void 0 ? { account_index: params.account_index } : {},
			...params?.authorization !== void 0 ? { authorization: params.authorization } : {},
			...params?.auth !== void 0 ? { auth: params.auth } : {}
		})).data;
	}
	async getApiTokens(accountIndex, authorization) {
		return (await this.client.get("/api/v1/tokens", { account_index: accountIndex }, authorization ? { headers: { authorization } } : void 0)).data;
	}
	async createApiToken(params) {
		const formData = new URLSearchParams();
		formData.append("name", params.name);
		formData.append("account_index", params.accountIndex.toString());
		formData.append("expiry", params.expiry.toString());
		formData.append("sub_account_access", params.subAccountAccess ? "true" : "false");
		if (params.scopes !== void 0) formData.append("scopes", params.scopes);
		return (await this.client.post("/api/v1/tokens/create", formData, { headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			...params.authorization ? { authorization: params.authorization } : {}
		} })).data;
	}
	async revokeApiToken(tokenId, accountIndex, authorization) {
		const formData = new URLSearchParams();
		formData.append("token_id", tokenId.toString());
		formData.append("account_index", accountIndex.toString());
		return (await this.client.post("/api/v1/tokens/revoke", formData, { headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			...authorization ? { authorization } : {}
		} })).data;
	}
	async getLeaseOptions(params) {
		return (await this.client.get("/api/v1/leaseOptions", {
			...params?.account_index !== void 0 ? { account_index: params.account_index } : {},
			...params?.market_id !== void 0 ? { market_id: params.market_id } : {},
			...params?.auth !== void 0 ? { auth: params.auth } : {},
			...params?.authorization !== void 0 ? { authorization: params.authorization } : {}
		}, params?.authorization ? { headers: { authorization: params.authorization } } : void 0)).data;
	}
	async getLeases(params) {
		return (await this.client.get("/api/v1/leases", {
			...params?.account_index !== void 0 ? { account_index: params.account_index } : {},
			...params?.market_id !== void 0 ? { market_id: params.market_id } : {},
			...params?.auth !== void 0 ? { auth: params.auth } : {},
			...params?.authorization !== void 0 ? { authorization: params.authorization } : {}
		}, params?.authorization ? { headers: { authorization: params.authorization } } : void 0)).data;
	}
	async litLease(params) {
		const formData = new URLSearchParams();
		formData.append("lease_id", params.lease_id.toString());
		if (params.account_index !== void 0) formData.append("account_index", params.account_index.toString());
		if (params.auth !== void 0) formData.append("auth", params.auth);
		return (await this.client.post("/api/v1/litLease", formData, { headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			...params.authorization ? { authorization: params.authorization } : {}
		} })).data;
	}
	async getPartnerStats(accountIndex, auth) {
		return (await this.client.get("/api/v1/partnerStats", { account_index: accountIndex }, auth ? { headers: { authorization: auth } } : void 0)).data;
	}
	async getMakerOnlyApiKeys(accountIndex, auth) {
		return (await this.client.get("/api/v1/makerOnlyApiKeys", { account_index: accountIndex }, auth ? { headers: { authorization: auth } } : void 0)).data;
	}
	async setMakerOnlyApiKeys(params) {
		const formData = new URLSearchParams();
		formData.append("account_index", params.account_index.toString());
		formData.append("api_key_indices", params.api_key_indices);
		if (params.auth) formData.append("auth", params.auth);
		return (await this.client.post("/api/v1/setMakerOnlyApiKeys", formData, { headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			...params.authorization ? { authorization: params.authorization } : {}
		} })).data;
	}
	async rfqCreate(params) {
		const headers = { "Content-Type": "application/x-www-form-urlencoded" };
		if (params.authorization) headers["authorization"] = params.authorization;
		else if (params.auth) headers["authorization"] = params.auth;
		const formData = new URLSearchParams();
		formData.append("account_index", params.account_index.toString());
		formData.append("market_id", params.market_id.toString());
		formData.append("side", params.side);
		formData.append("size", params.size);
		return (await this.client.post("/api/v1/rfq/create", formData, { headers })).data;
	}
	async rfqGet(params) {
		return (await this.client.get("/api/v1/rfq/get", {
			account_index: params.account_index,
			rfq_id: params.rfq_id
		}, params.authorization ? { headers: { authorization: params.authorization } } : void 0)).data;
	}
	async rfqList(params) {
		const headers = {};
		if (params.authorization) headers["authorization"] = params.authorization;
		else if (params.auth) headers["authorization"] = params.auth;
		return (await this.client.get("/api/v1/rfq/list", {
			account_index: params.account_index,
			...params.limit !== void 0 ? { limit: params.limit } : {},
			...params.cursor ? { cursor: params.cursor } : {}
		}, Object.keys(headers).length > 0 ? { headers } : void 0)).data;
	}
	async rfqRespond(params) {
		const formData = new URLSearchParams();
		formData.append("account_index", params.account_index.toString());
		formData.append("rfq_id", params.rfq_id);
		formData.append("price", params.price);
		if (params.auth) formData.append("auth", params.auth);
		return (await this.client.post("/api/v1/rfq/respond", formData, { headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			...params.authorization ? { authorization: params.authorization } : {}
		} })).data;
	}
	async rfqUpdate(params) {
		const formData = new URLSearchParams();
		formData.append("account_index", params.account_index.toString());
		formData.append("rfq_id", params.rfq_id);
		if (params.status) formData.append("status", params.status);
		if (params.auth) formData.append("auth", params.auth);
		return (await this.client.post("/api/v1/rfq/update", formData, { headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			...params.authorization ? { authorization: params.authorization } : {}
		} })).data;
	}
};
//#endregion
//#region node_modules/lighter-ts-sdk/dist/esm/bridge/l1-bridge-client.js
/**
* L1 Bridge Client for handling Ethereum to Lighter L2 deposits
* Uses ethers.js to interact with L1 contracts
*/
var L1BridgeClient = class L1BridgeClient {
	constructor(config) {
		this.config = config;
		this.provider = new JsonRpcProvider(config.rpcUrl);
		this.usdcContract = new Contract(config.usdcContract, L1BridgeClient.USDC_ABI, this.provider);
		this.bridgeContract = new Contract(config.l1BridgeContract, L1BridgeClient.BRIDGE_ABI, this.provider);
	}
	/**
	* Deposit USDC from L1 to L2
	* @param params - Deposit parameters
	* @returns Promise<L1DepositResult>
	*/
	async depositToL2(params) {
		try {
			const wallet = new Wallet(params.ethPrivateKey, this.provider);
			const usdcContractWithSigner = this.usdcContract.connect(wallet);
			const bridgeContractWithSigner = this.bridgeContract.connect(wallet);
			const decimals = await usdcContractWithSigner.decimals();
			const amountInUnits = parseUnits(params.usdcAmount.toString(), decimals);
			const balance = await usdcContractWithSigner.balanceOf(wallet.address);
			if (balance < amountInUnits) throw new Error(`Insufficient USDC balance. Required: ${formatUnits(amountInUnits, decimals)}, Available: ${formatUnits(balance, decimals)}`);
			if (await usdcContractWithSigner.allowance(wallet.address, this.config.l1BridgeContract) < amountInUnits) await (await usdcContractWithSigner.approve(this.config.l1BridgeContract, amountInUnits, {
				gasPrice: params.gasPrice ? parseUnits(params.gasPrice, "gwei") : void 0,
				gasLimit: params.gasLimit
			})).wait();
			const depositTx = await bridgeContractWithSigner.deposit(amountInUnits, params.l2AccountIndex, {
				gasPrice: params.gasPrice ? parseUnits(params.gasPrice, "gwei") : void 0,
				gasLimit: params.gasLimit
			});
			const receipt = await depositTx.wait();
			if (!receipt) throw new Error("Transaction receipt not found");
			return {
				l1TxHash: depositTx.hash,
				l2AccountIndex: params.l2AccountIndex,
				amount: formatUnits(amountInUnits, decimals),
				status: "completed",
				blockNumber: receipt.blockNumber,
				gasUsed: receipt.gasUsed.toString()
			};
		} catch (error) {
			throw error;
		}
	}
	/**
	* Check USDC balance for an address
	* @param address - Ethereum address
	* @returns Promise<string> - Balance in USDC units
	*/
	async getUSDCBalance(address) {
		try {
			const balance = await this.usdcContract.balanceOf(address);
			const decimals = await this.usdcContract.decimals();
			return formatUnits(balance, decimals);
		} catch (error) {
			throw error;
		}
	}
	/**
	* Check USDC allowance for bridge contract
	* @param address - Ethereum address
	* @returns Promise<string> - Allowance in USDC units
	*/
	async getUSDCAllowance(address) {
		try {
			const allowance = await this.usdcContract.allowance(address, this.config.l1BridgeContract);
			const decimals = await this.usdcContract.decimals();
			return formatUnits(allowance, decimals);
		} catch (error) {
			throw error;
		}
	}
	/**
	* Get transaction status
	* @param txHash - Transaction hash
	* @returns Promise<L1DepositResult>
	*/
	async getTransactionStatus(txHash) {
		try {
			const tx = await this.provider.getTransaction(txHash);
			const receipt = await this.provider.getTransactionReceipt(txHash);
			if (!tx) throw new Error("Transaction not found");
			if (!receipt) return {
				l1TxHash: txHash,
				l2AccountIndex: 0,
				amount: "0",
				status: "pending"
			};
			return {
				l1TxHash: txHash,
				l2AccountIndex: 0,
				amount: "0",
				status: receipt.status === 1 ? "completed" : "failed",
				blockNumber: receipt.blockNumber,
				gasUsed: receipt.gasUsed.toString()
			};
		} catch (error) {
			throw error;
		}
	}
	/**
	* Get default bridge configuration for mainnet
	* @returns L1BridgeConfig
	*/
	static getMainnetConfig() {
		return {
			l1BridgeContract: "0x0000000000000000000000000000000000000000",
			usdcContract: "0xA0b86a33E6441b8c4C8C0E4A8c4c4c4c4c4c4c4c4",
			rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY",
			chainId: 1
		};
	}
	/**
	* Get default bridge configuration for testnet
	* @returns L1BridgeConfig
	*/
	static getTestnetConfig() {
		return {
			l1BridgeContract: "0x0000000000000000000000000000000000000000",
			usdcContract: "0x0000000000000000000000000000000000000000",
			rpcUrl: "https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY",
			chainId: 11155111
		};
	}
};
L1BridgeClient.USDC_ABI = [
	"function transfer(address to, uint256 amount) external returns (bool)",
	"function approve(address spender, uint256 amount) external returns (bool)",
	"function balanceOf(address account) external view returns (uint256)",
	"function decimals() external view returns (uint8)",
	"function allowance(address owner, address spender) external view returns (uint256)"
];
L1BridgeClient.BRIDGE_ABI = ["function deposit(uint256 amount, uint256 l2AccountIndex) external", "function depositTo(uint256 amount, uint256 l2AccountIndex, address to) external"];
//#endregion
//#region node_modules/lighter-ts-sdk/dist/esm/api/bridge-api.js
var BridgeApi = class {
	constructor(apiClient, l1BridgeConfig) {
		this.client = apiClient;
		if (l1BridgeConfig) this.l1BridgeClient = new L1BridgeClient(l1BridgeConfig);
	}
	/**
	* Get fast bridge information including limits
	* @returns Promise<FastBridgeInfo>
	*/
	async getFastBridgeInfo() {
		return (await this.client.get("/api/v1/fastbridge/info")).data;
	}
	/**
	* Get fast bridge information with full response details
	* @returns Promise<ApiResponse<FastBridgeInfo>>
	*/
	async getFastBridgeInfoWithResponse() {
		return await this.client.get("/api/v1/fastbridge/info");
	}
	/**
	* Get supported bridge networks
	* @returns Promise<BridgeSupportedNetwork[]>
	*/
	async getSupportedNetworks() {
		try {
			return (await this.client.get("/api/v1/bridge/networks")).data;
		} catch (error) {
			return [];
		}
	}
	/**
	* Get bridges by L1 address
	*/
	async getBridgesByL1Address(l1Address) {
		return (await this.client.get("/api/v1/bridges", { l1_address: l1Address })).data;
	}
	/**
	* Check whether the next bridge operation will be fast
	*/
	async isNextBridgeFast(l1Address) {
		return (await this.client.get("/api/v1/bridges/isNextBridgeFast", { l1_address: l1Address })).data;
	}
	/**
	* Get deposit history for an account
	* @param accountIndex - Account index
	* @param l1Address - L1 address
	* @param authorization - Authorization token
	* @param cursor - Pagination cursor
	* @param filter - Filter criteria
	* @returns Promise<DepositHistory>
	*/
	async getDepositHistory(accountIndex, l1Address, authorization, cursor, filter) {
		return (await this.client.get("/api/v1/deposit/history", {
			account_index: accountIndex,
			l1_address: l1Address,
			...cursor ? { cursor } : {},
			...filter ? { filter } : {},
			...authorization ? {
				authorization,
				auth: authorization
			} : {}
		})).data;
	}
	/**
	* Get withdraw history for an account
	* @param accountIndex - Account index
	* @param l1Address - L1 address
	* @param authorization - Authorization token
	* @param cursor - Pagination cursor
	* @param filter - Filter criteria
	* @returns Promise<WithdrawHistory>
	*/
	async getWithdrawHistory(accountIndex, l1Address, authorization, cursor, filter) {
		return (await this.client.get("/api/v1/withdraw/history", {
			account_index: accountIndex,
			l1_address: l1Address,
			...cursor ? { cursor } : {},
			...filter ? { filter } : {},
			...authorization ? {
				authorization,
				auth: authorization
			} : {}
		})).data;
	}
	/**
	* Submit a fast withdrawal
	*/
	async fastWithdraw(txInfo, toAddress, options) {
		const formData = new URLSearchParams();
		formData.append("tx_info", txInfo);
		formData.append("to_address", toAddress);
		if (options?.auth) formData.append("auth", options.auth);
		return (await this.client.post("/api/v1/fastwithdraw", formData, { headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			...options?.authorization ? { authorization: options.authorization } : {}
		} })).data;
	}
	/**
	* Get fast withdrawal info for account
	*/
	async getFastWithdrawInfo(accountIndex, options) {
		return (await this.client.get("/api/v1/fastwithdraw/info", {
			account_index: accountIndex,
			...options?.authorization ? { authorization: options.authorization } : {},
			...options?.auth ? { auth: options.auth } : {}
		})).data;
	}
	/**
	* Deposit USDC from L1 to L2
	* @param params - L1 deposit parameters
	* @returns Promise<L1DepositResult>
	*/
	async depositFromL1(params) {
		if (!this.l1BridgeClient) throw new Error("L1 bridge client not configured. Please provide L1BridgeConfig in constructor.");
		return await this.l1BridgeClient.depositToL2(params);
	}
	/**
	* Get USDC balance on L1
	* @param address - Ethereum address
	* @returns Promise<string> - Balance in USDC units
	*/
	async getL1USDCBalance(address) {
		if (!this.l1BridgeClient) throw new Error("L1 bridge client not configured. Please provide L1BridgeConfig in constructor.");
		return await this.l1BridgeClient.getUSDCBalance(address);
	}
	/**
	* Get USDC allowance for bridge contract
	* @param address - Ethereum address
	* @returns Promise<string> - Allowance in USDC units
	*/
	async getL1USDCAllowance(address) {
		if (!this.l1BridgeClient) throw new Error("L1 bridge client not configured. Please provide L1BridgeConfig in constructor.");
		return await this.l1BridgeClient.getUSDCAllowance(address);
	}
	/**
	* Get L1 transaction status
	* @param txHash - Transaction hash
	* @returns Promise<L1DepositResult>
	*/
	async getL1TransactionStatus(txHash) {
		if (!this.l1BridgeClient) throw new Error("L1 bridge client not configured. Please provide L1BridgeConfig in constructor.");
		return await this.l1BridgeClient.getTransactionStatus(txHash);
	}
	async createIntentAddress(params) {
		const body = {
			chain_id: params.chain_id,
			from_addr: params.from_addr,
			amount: params.amount,
			...params.account_index !== void 0 ? { account_index: params.account_index } : {},
			...params.is_external_deposit !== void 0 ? { is_external_deposit: params.is_external_deposit } : {}
		};
		return (await this.client.post("/api/v1/createIntentAddress", body, params.authorization ? { headers: { authorization: params.authorization } } : void 0)).data;
	}
	async depositNetworks() {
		return (await this.client.get("/api/v1/deposit/networks")).data;
	}
	async depositLatest(l1Address) {
		return (await this.client.get("/api/v1/deposit/latest", { l1_address: l1Address })).data;
	}
};
//#endregion
//#region node_modules/lighter-ts-sdk/dist/esm/api/order-api.js
var OrderApi = class {
	constructor(client) {
		this.client = client;
	}
	async getExchangeStats() {
		return (await this.client.get("/api/v1/exchangeStats")).data;
	}
	async getOrderBooks() {
		return (await this.client.get("/api/v1/orderBooks")).data;
	}
	async getOrderBookDetails(params) {
		const response = await this.getOrderBookDetailsRaw(params.market_id);
		const perps = response.order_book_details || [];
		const spot = response.spot_order_book_details || [];
		const all = perps.length ? perps : spot;
		const match = all.find((item) => item.market_id === params.market_id) || all[0];
		if (match) return match;
		return {
			symbol: "",
			market_id: params.market_id,
			status: "unknown",
			taker_fee: "0",
			maker_fee: "0",
			liquidation_fee: "0",
			min_base_amount: "0",
			min_quote_amount: "0",
			order_quote_limit: "0",
			supported_size_decimals: 0,
			supported_price_decimals: 0,
			supported_quote_decimals: 0,
			size_decimals: 0,
			price_decimals: 0,
			last_trade_price: 0,
			daily_trades_count: 0,
			daily_base_token_volume: 0,
			daily_quote_token_volume: 0,
			daily_price_low: 0,
			daily_price_high: 0,
			daily_price_change: 0,
			daily_chart: {}
		};
	}
	async getOrderBookDetailsRaw(marketId) {
		return (await this.client.get("/api/v1/orderBookDetails", { market_id: marketId })).data;
	}
	async getOrderBookOrders(params) {
		return (await this.client.get("/api/v1/orderBookOrders", {
			market_id: params.market_id,
			...(params.limit ?? params.depth) !== void 0 ? { limit: params.limit ?? params.depth } : {}
		})).data;
	}
	async getRecentTrades(params) {
		return (await this.client.get("/api/v1/recentTrades", {
			market_id: params.market_id,
			limit: params.limit
		})).data;
	}
	async getTrades(params) {
		return (await this.client.get("/api/v1/trades", { ...params })).data;
	}
	async getAccountActiveOrders(accountIndex, marketId, auth) {
		return (await this.client.get("/api/v1/accountActiveOrders", {
			account_index: accountIndex,
			market_id: marketId,
			...auth && { auth }
		})).data.orders || [];
	}
	async getAccountInactiveOrders(accountIndex, limit = 20, auth, marketId) {
		return (await this.client.get("/api/v1/accountInactiveOrders", {
			account_index: accountIndex,
			limit,
			...marketId !== void 0 && { market_id: marketId },
			...auth && { auth }
		})).data.orders || [];
	}
	async getAccountOrders(accountIndex, params) {
		return (await this.client.get("/api/v1/accountOrders", {
			account_index: accountIndex,
			...params
		})).data;
	}
	async createOrder(params) {
		return (await this.client.post("/api/v1/orders", {
			market_id: params.market_id,
			side: params.side,
			type: params.type,
			size: params.size,
			price: params.price,
			reduce_only: params.reduce_only,
			post_only: params.post_only,
			time_in_force: params.time_in_force,
			client_order_id: params.client_order_id
		})).data;
	}
	async cancelOrder(params) {
		return (await this.client.delete("/api/v1/orders", { params: {
			market_id: params.market_id,
			order_id: params.order_id
		} })).data;
	}
	async cancelAllOrders(marketId) {
		const params = {};
		if (marketId !== void 0) params.market_id = marketId;
		return (await this.client.delete("/api/v1/orders/all", { params })).data;
	}
	/**
	* Get order book details (both perps and spot)
	* @param marketId Optional market ID (default: 255 for all markets)
	* @returns Order book details for perps and spot markets
	*/
	async getOBDetails(marketId) {
		const params = {};
		if (marketId !== void 0) params.market_id = marketId;
		return (await this.client.get("/api/v1/obDetails", params)).data;
	}
	/**
	* Get asset details
	* @param assetIndex Optional asset index (default: 0 for all assets)
	* @returns Asset details
	*/
	async getAssetDetails(assetIndex) {
		const params = {};
		if (assetIndex !== void 0) params.asset_index = assetIndex;
		return (await this.client.get("/api/v1/assetDetails", params)).data;
	}
	async export(exportType, accountIndex, params, auth) {
		return (await this.client.post("/api/v1/export", {
			type: exportType,
			account_index: accountIndex,
			...params
		}, auth ? { headers: { "X-Auth-Token": auth } } : void 0)).data;
	}
	async getExchangeMetrics(params) {
		return (await this.client.get("/api/v1/exchangeMetrics", { ...params || {} })).data;
	}
	async getExecuteStats(params) {
		return (await this.client.get("/api/v1/executeStats", { ...params || {} })).data;
	}
};
//#endregion
//#region node_modules/lighter-ts-sdk/dist/esm/api/transaction-api.js
var TransactionApi = class {
	constructor(client) {
		this.client = client;
	}
	async getBlock(params) {
		return (await this.client.get("/api/v1/block", {
			by: params.by,
			value: params.value
		})).data;
	}
	async getBlocks(params) {
		return (await this.client.get("/api/v1/blocks", params)).data;
	}
	async getCurrentHeight() {
		return (await this.client.get("/api/v1/currentHeight")).data;
	}
	async getTransaction(params) {
		return (await this.client.get("/api/v1/tx", {
			by: params.by,
			value: params.value
		})).data;
	}
	async getTransactions(params) {
		return (await this.client.get("/api/v1/txs", params)).data;
	}
	async getBlockTransactions(params) {
		const { by, value, ...paginationParams } = params;
		return (await this.client.get("/api/v1/blockTxs", {
			by,
			value,
			...paginationParams
		})).data;
	}
	async getAccountTransactions(accountIndex, params) {
		return (await this.client.get("/api/v1/accountTxs", {
			account_index: accountIndex,
			...params
		})).data;
	}
	async getAccountPendingTransactions(accountIndex, params) {
		return (await this.client.get("/api/v1/accountPendingTxs", {
			account_index: accountIndex,
			...params
		})).data;
	}
	async getPendingTransactions(params) {
		return (await this.client.get("/api/v1/pendingTxs", params)).data;
	}
	async getNextNonce(accountIndex, apiKeyIndex) {
		return (await this.client.get("/api/v1/nextNonce", {
			account_index: accountIndex,
			api_key_index: apiKeyIndex
		})).data;
	}
	async sendTransaction(params) {
		return (await this.client.post("/api/v1/sendTx", {
			account_index: params.account_index,
			api_key_index: params.api_key_index,
			transaction: params.transaction,
			...params.price_protection !== void 0 ? { price_protection: params.price_protection } : {}
		})).data;
	}
	async sendTx(txType, txInfo, priceProtection = true) {
		const params = new URLSearchParams();
		params.append("tx_type", txType.toString());
		params.append("tx_info", txInfo);
		params.append("price_protection", priceProtection ? "true" : "false");
		return (await this.client.post("/api/v1/sendTx", params, { headers: { "Content-Type": "application/x-www-form-urlencoded" } })).data;
	}
	async sendTxWithIndices(txType, txInfo, accountIndex, apiKeyIndex, priceProtection = true, auth) {
		const params = new URLSearchParams();
		params.append("tx_type", txType.toString());
		params.append("tx_info", txInfo);
		params.append("account_index", accountIndex.toString());
		params.append("api_key_index", apiKeyIndex.toString());
		params.append("price_protection", priceProtection ? "true" : "false");
		if (auth) params.append("auth", auth);
		if (process.env.DEBUG || false) try {
			JSON.parse(txInfo);
		} catch (e) {}
		return (await this.client.post("/api/v1/sendTx", params, { headers: { "Content-Type": "application/x-www-form-urlencoded" } })).data;
	}
	async sendTxJson(txType, txInfo, accountIndex, apiKeyIndex, priceProtection = true) {
		const payload = {
			tx_type: txType,
			tx_info: txInfo,
			account_index: accountIndex,
			api_key_index: apiKeyIndex,
			price_protection: priceProtection
		};
		return (await this.client.post("/api/v1/sendTx", payload, { headers: { "Content-Type": "application/json" } })).data;
	}
	async sendTransactionBatch(params) {
		if (params.tx_types && params.tx_infos) {
			const urlParams = new URLSearchParams();
			urlParams.append("tx_types", params.tx_types);
			urlParams.append("tx_infos", params.tx_infos);
			return (await this.client.post("/api/v1/sendTxBatch", urlParams, { headers: { "Content-Type": "application/x-www-form-urlencoded" } })).data;
		} else if (params.transactions) return (await this.client.post("/api/v1/sendTxBatch", {
			account_index: params.account_index,
			api_key_index: params.api_key_index,
			transactions: params.transactions
		})).data;
		throw new Error("Invalid batch params: must provide either (tx_types, tx_infos) or (transactions)");
	}
	async getTransactionFromL1TxHash(l1TxHash) {
		return (await this.client.get("/api/v1/txFromL1TxHash", { l1_tx_hash: l1TxHash })).data;
	}
	async getDepositHistory(accountIndex, params) {
		return (await this.client.get("/api/v1/deposit/history", {
			account_index: accountIndex,
			...params
		})).data;
	}
	async getWithdrawHistory(accountIndex, params) {
		return (await this.client.get("/api/v1/withdraw/history", {
			account_index: accountIndex,
			...params
		})).data;
	}
	async getTransferHistory(accountIndex, params, auth) {
		return (await this.client.get("/api/v1/transfer/history", {
			account_index: accountIndex,
			...params
		}, auth ? { headers: { "X-Auth-Token": auth } } : void 0)).data;
	}
	async setAccountMetadata(params) {
		const formData = new URLSearchParams();
		formData.append("account_index", params.account_index.toString());
		formData.append("key", params.key);
		formData.append("value", params.value);
		if (params.auth) formData.append("auth", params.auth);
		return (await this.client.post("/api/v1/setAccountMetadata", formData, { headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			...params.authorization ? { authorization: params.authorization } : {}
		} })).data;
	}
};
//#endregion
//#region node_modules/lighter-ts-sdk/dist/esm/api/root-api.js
var RootApi = class {
	constructor(client) {
		this.client = client;
	}
	async getInfo() {
		return (await this.client.get(`/info`)).data;
	}
	async getStatus() {
		return (await this.client.get(`/status`)).data;
	}
};
//#endregion
//#region node_modules/lighter-ts-sdk/dist/esm/api/explorer-api-client.js
/**
* ExplorerApiClient handles requests to the Lighter Explorer API
* Base URL: https://explorer.elliot.ai/api/
*/
var ExplorerApiClient = class {
	static resolveExplorerHost(baseUrl) {
		if (!baseUrl) return "https://explorer.elliot.ai/api";
		if (baseUrl.toLowerCase().includes("testnet")) return "https://testnet.explorer.elliot.ai/api";
		return "https://explorer.elliot.ai/api";
	}
	constructor(config) {
		this.explorerHost = "https://explorer.elliot.ai/api";
		this.defaultHeaders = {};
		if (config?.explorerHost) this.explorerHost = config.explorerHost;
		const axiosConfig = {
			baseURL: this.explorerHost,
			timeout: 1e4,
			headers: {
				"User-Agent": "lighter-ts-sdk/1.0",
				"Content-Type": "application/json",
				"Accept": "application/json"
			}
		};
		this.axiosInstance = axios.create(axiosConfig);
		this.setupInterceptors();
	}
	setupInterceptors() {
		this.axiosInstance.interceptors.response.use((response) => {
			return response;
		}, (error) => {
			return Promise.reject(this.handleError(error));
		});
	}
	handleError(error) {
		if (error.response) {
			const { status, data } = error.response;
			const message = data?.message || error.message || "Explorer API Error";
			if (process.env.DEBUG || false) {
				console.error("❌ Explorer API Error:");
				console.error("   Status:", status);
				console.error("   Message:", message);
				console.error("   Data:", JSON.stringify(data, null, 2));
			}
			switch (status) {
				case 400: return new BadRequestException(message);
				case 404: return new NotFoundException(message);
				case 429: return new TooManyRequestsException(message);
				case 500:
				case 502:
				case 503:
				case 504: return new ServiceException(message);
				default: return new ApiException(message, status);
			}
		}
		if (error.request) {
			if (process.env.DEBUG || false) console.error("❌ Explorer Network Error: No response received");
			return new ApiException("Explorer Network error: No response received", 0);
		}
		if (process.env.DEBUG || false) console.error("❌ Explorer Unknown Error:", error);
		return new ApiException(error.message || "Unknown error", 0);
	}
	setDefaultHeader(name, value) {
		this.defaultHeaders[name] = value;
		this.axiosInstance.defaults.headers[name] = value;
	}
	removeDefaultHeader(name) {
		delete this.defaultHeaders[name];
		delete this.axiosInstance.defaults.headers[name];
	}
	async request(method, url, data, config) {
		try {
			const response = await this.axiosInstance.request({
				method,
				url,
				data,
				...config
			});
			return {
				data: response.data,
				status: response.status,
				statusText: response.statusText,
				headers: response.headers
			};
		} catch (error) {
			throw error;
		}
	}
	async get(url, params, config) {
		return this.request("GET", url, void 0, {
			params,
			...config
		});
	}
	async post(url, data, config) {
		return this.request("POST", url, data, config);
	}
	async put(url, data, config) {
		return this.request("PUT", url, data, config);
	}
	async delete(url, config) {
		return this.request("DELETE", url, void 0, config);
	}
	setExplorerHost(host) {
		this.explorerHost = host;
		this.axiosInstance.defaults.baseURL = host;
	}
	getExplorerHost() {
		return this.explorerHost;
	}
	close() {}
};
//#endregion
//#region node_modules/lighter-ts-sdk/dist/esm/api/logs-api.js
/**
* LogsApi provides access to transaction logs and activity history
*/
var LogsApi = class {
	constructor(client) {
		this.client = client;
	}
	/**
	* Get transaction log by transaction hash
	*
	* This is the primary method for checking transaction status and details
	*
	* @param hash Transaction hash
	* @returns Transaction log with execution details
	* @throws NotFoundException if transaction hash not found
	*
	* @example
	* ```typescript
	* const logsApi = new LogsApi(explorerClient);
	*
	* // Get transaction details
	* const txLog = await logsApi.getByHash('0x123abc...');
	*
	* console.log('Transaction Status:', txLog.status);
	* console.log('Executed at:', txLog.time);
	* console.log('Block Number:', txLog.block_number);
	*
	* // Check if it was a trade
	* if (txLog.pubdata_type === 'Trade') {
	*   const trade = txLog.pubdata?.trade_pubdata;
	*   console.log('Price:', trade?.price);
	*   console.log('Size:', trade?.size);
	*   console.log('Maker Fee:', trade?.maker_fee);
	*   console.log('Taker Fee:', trade?.taker_fee);
	* }
	* ```
	*/
	async getByHash(hash) {
		return (await this.client.get(`/logs/${hash}`)).data;
	}
	/**
	* Get transaction logs for an account
	*
	* Retrieves transaction history for an account identified by L1 address or account index
	*
	* @param accountIdentifier L1 address or account index
	* @param params Query parameters (limit, offset, pub_data_type filter)
	* @returns Array of transaction logs for the account
	*
	* @example
	* ```typescript
	* const logsApi = new LogsApi(explorerClient);
	*
	* // Get latest 100 transactions for an account
	* const accountLogs = await logsApi.getByAccount('0xAccountAddress', {
	*   limit: 100,
	*   offset: 0
	* });
	*
	* console.log(`Found ${accountLogs.logs.length} transactions`);
	*
	* accountLogs.logs.forEach(log => {
	*   console.log(`[${log.time}] ${log.tx_type}: ${log.status}`);
	* });
	* ```
	*/
	async getByAccount(accountIdentifier, params) {
		const queryParams = {
			limit: params.limit,
			offset: params.offset
		};
		if (params.pub_data_type && params.pub_data_type.length > 0) queryParams.pub_data_type = params.pub_data_type;
		const response = await this.client.get(`/accounts/${accountIdentifier}/logs`, queryParams);
		return {
			logs: response.data || [],
			limit: params.limit,
			offset: params.offset,
			total: response.data?.total
		};
	}
	/**
	* Get account activity logs with optional filtering
	* Convenience method combining account retrieval with common filters
	*
	* @param accountIdentifier L1 address or account index
	* @param limit Maximum number of results
	* @param offset Pagination offset
	* @param dataTypes Optional array of data types to filter by
	* @returns Account logs with pagination info
	*/
	async getAccountActivity(accountIdentifier, limit = 100, offset = 0, dataTypes) {
		const params = {
			limit,
			offset
		};
		if (dataTypes !== void 0) params.pub_data_type = dataTypes;
		return this.getByAccount(accountIdentifier, params);
	}
	/**
	* Check if a transaction was executed
	* Convenience method to quickly verify transaction execution
	*
	* @param hash Transaction hash
	* @returns true if transaction was executed, false otherwise
	*
	* @example
	* ```typescript
	* const logsApi = new LogsApi(explorerClient);
	*
	* const isExecuted = await logsApi.isTransactionExecuted('0x123abc...');
	* if (isExecuted) {
	*   console.log('Transaction has been executed');
	* }
	* ```
	*/
	async isTransactionExecuted(hash) {
		try {
			const log = await this.getByHash(hash);
			return log.status === "executed" || log.status === "committed";
		} catch {
			return false;
		}
	}
	/**
	* Determine if transaction is still pending
	*
	* @param hash Transaction hash
	* @returns true if transaction is pending, false otherwise
	*/
	async isTransactionPending(hash) {
		try {
			return (await this.getByHash(hash)).status === "pending";
		} catch {
			return false;
		}
	}
	/**
	* Get trade details from a transaction log
	* Extracts and returns trade-specific information
	*
	* @param hash Transaction hash
	* @returns Trade pubdata or undefined if not a trade transaction
	*
	* @example
	* ```typescript
	* const logsApi = new LogsApi(explorerClient);
	*
	* const tradeData = await logsApi.getTradeData('0x123abc...');
	* if (tradeData) {
	*   console.log('Market Index:', tradeData.market_index);
	*   console.log('Price:', tradeData.price);
	*   console.log('Size:', tradeData.size);
	*   console.log('Taker Fee:', tradeData.taker_fee);
	* }
	* ```
	*/
	async getTradeData(hash) {
		try {
			const log = await this.getByHash(hash);
			if (log.pubdata_type === "Trade") return log.pubdata?.trade_pubdata;
			return;
		} catch {
			return;
		}
	}
	/**
	* Get all logs of a specific type for an account
	*
	* @param accountIdentifier L1 address or account index
	* @param dataType Data type to filter by (e.g., 'Trade', 'Order')
	* @param limit Maximum number of results
	* @param offset Pagination offset
	* @returns Filtered account logs
	*/
	async getAccountLogsByType(accountIdentifier, dataType, limit = 100, offset = 0) {
		return this.getByAccount(accountIdentifier, {
			limit,
			offset,
			pub_data_type: [dataType]
		});
	}
	/**
	* Get recent trades for an account
	*
	* @param accountIdentifier L1 address or account index
	* @param limit Maximum number of results
	* @param offset Pagination offset
	* @returns Trade logs for the account
	*/
	async getAccountTrades(accountIdentifier, limit = 50, offset = 0) {
		return this.getAccountLogsByType(accountIdentifier, "Trade", limit, offset);
	}
	/**
	* Poll for transaction confirmation
	* Continuously checks transaction status until it's executed or fails
	*
	* @param hash Transaction hash
	* @param maxAttempts Maximum number of attempts
	* @param intervalMs Interval between attempts in milliseconds
	* @returns Final transaction log or undefined if timeout
	*
	* @example
	* ```typescript
	* const logsApi = new LogsApi(explorerClient);
	*
	* const result = await logsApi.waitForExecution(
	*   '0x123abc...',
	*   60,  // Check for up to 60 times
	*   1000 // Check every 1 second
	* );
	*
	* if (result?.status === 'executed') {
	*   console.log('Transaction confirmed!');
	* } else {
	*   console.log('Timeout waiting for transaction');
	* }
	* ```
	*/
	async waitForExecution(hash, maxAttempts = 60, intervalMs = 1e3) {
		for (let i = 0; i < maxAttempts; i++) try {
			const log = await this.getByHash(hash);
			if (log.status === "committed" || log.status === "executed" || log.status === "failed" || log.status === "rejected") return log;
			if (i < maxAttempts - 1) await new Promise((resolve) => setTimeout(resolve, intervalMs));
		} catch (error) {
			if (i < maxAttempts - 1) await new Promise((resolve) => setTimeout(resolve, intervalMs));
		}
	}
};
//#endregion
//#region node_modules/lighter-ts-sdk/dist/esm/network.js
/**
* Network registry and env-driven network selection.
*
* Lighter runs on multiple chains that share the same core: the original
* Lighter L2 (mainnet/testnet, hosts `*.zklighter.elliot.ai`) and
* Lighter-on-Robinhood (`api.rh.lighter.xyz`, testnet `api.rh-testnet.lighter.xyz`). Only the API/WS hosts, contract
* address, signing chain_id, and supported asset set differ — order books and
* settlement are separate per instance.
*
* Pick a network by setting `LIGHTER_NETWORK` in `.env` (default `mainnet`):
*   - mainnet   -> https://mainnet.zklighter.elliot.ai   (chain_id 304)
*   - testnet   -> https://testnet.zklighter.elliot.ai   (chain_id 300)
*   - robinhood         -> https://api.rh.lighter.xyz            (chain_id 466324)
*   - robinhood-testnet -> https://api.rh-testnet.lighter.xyz     (chain_id 300)
*
* `SignerClient` consumes `resolveNetworkFromEnv()` when no explicit `url` or
* `network` is provided, so a single `.env` line drives both the host and the
* signing chain_id. Optional `BASE_URL` / `WS_URL` / `CHAIN_ID` env vars
* override the registry defaults for local or custom deployments.
*/
/** Known networks keyed by their lowercase name. */
var NETWORKS = {
	mainnet: {
		name: "mainnet",
		apiUrl: "https://mainnet.zklighter.elliot.ai",
		wsUrl: "wss://mainnet.zklighter.elliot.ai/stream",
		chainId: 304,
		explorerUrl: "https://explorer.elliot.ai/api"
	},
	testnet: {
		name: "testnet",
		apiUrl: "https://testnet.zklighter.elliot.ai",
		wsUrl: "wss://testnet.zklighter.elliot.ai/stream",
		chainId: 300,
		explorerUrl: "https://testnet.explorer.elliot.ai/api"
	},
	robinhood: {
		name: "robinhood",
		apiUrl: "https://api.rh.lighter.xyz",
		wsUrl: "wss://api.rh.lighter.xyz/stream",
		chainId: 466324
	},
	"robinhood-testnet": {
		name: "robinhood-testnet",
		apiUrl: "https://api.rh-testnet.lighter.xyz",
		wsUrl: "wss://api.rh-testnet.lighter.xyz/stream",
		chainId: 300
	}
};
/**
* Look up a network by name (case-insensitive). Throws on unknown names.
*/
function getNetwork(name) {
	const network = NETWORKS[(name ?? "").trim().toLowerCase()];
	if (!network) {
		const known = Object.keys(NETWORKS).join(", ");
		throw new Error(`Unknown Lighter network "${name}". Known networks: ${known}.`);
	}
	return network;
}
/**
* Derive a WS stream URL from an API URL
* (`https://host[/path]` -> `wss://host/path/stream`).
*/
function deriveWsUrl(apiUrl) {
	let host = apiUrl.trim().replace(/\/+$/, "");
	if (host.startsWith("https://")) host = "wss://" + host.slice(8);
	else if (host.startsWith("http://")) host = "ws://" + host.slice(7);
	else if (!host.startsWith("wss://") && !host.startsWith("ws://")) host = "wss://" + host;
	return host + "/stream";
}
/**
* Resolve the active network from environment variables.
*
* `LIGHTER_NETWORK` (default `mainnet`) selects a complete known profile — its
* host, WS URL, and signing chain_id move together. This is the recommended
* switch: set `LIGHTER_NETWORK=robinhood` and the SDK targets Robinhood with
* chain_id 466324, regardless of any leftover `BASE_URL` from another instance.
*
* When `LIGHTER_NETWORK` is **unset**, the default mainnet profile is used but
* these optional overrides apply (for local / custom / proxied deployments):
*   - `BASE_URL`   overrides the REST host (apiUrl); WS URL is derived from it
*                  when `WS_URL` is also unset.
*   - `WS_URL`     overrides the WebSocket host (wsUrl).
*   - `CHAIN_ID`   overrides the signing chain id (also honored when
*                  `LIGHTER_NETWORK` is set, for the rare case of overriding
*                  only the signing id while keeping a known profile's host).
*/
function resolveNetworkFromEnv(env = process.env) {
	const explicitName = env["LIGHTER_NETWORK"] !== void 0 ? env["LIGHTER_NETWORK"].trim().toLowerCase() : void 0;
	const base = getNetwork(explicitName ?? "mainnet");
	const chainIdOverride = env["CHAIN_ID"] != null ? Number.parseInt(env["CHAIN_ID"], 10) : NaN;
	const chainId = Number.isFinite(chainIdOverride) ? chainIdOverride : base.chainId;
	if (explicitName !== void 0) return chainId === base.chainId ? base : {
		...base,
		chainId
	};
	const apiUrl = env["BASE_URL"] ?? base.apiUrl;
	let wsUrl = base.wsUrl;
	if (env["WS_URL"]) wsUrl = env["WS_URL"];
	else if (env["BASE_URL"]) wsUrl = deriveWsUrl(apiUrl);
	if (apiUrl === base.apiUrl && wsUrl === base.wsUrl && chainId === base.chainId) return base;
	return {
		...base,
		apiUrl,
		wsUrl,
		chainId
	};
}
//#endregion
//#region node_modules/lighter-ts-sdk/dist/esm/signer/wasm-signer.js
/**
* Unified WASM Signer Client for Lighter Protocol
*
* This module provides a TypeScript wrapper for the Go WASM signer,
* enabling cryptographic operations in both browser and Node.js environments.
* Automatically detects the environment and uses the appropriate initialization method.
*/
var fs;
var os;
var path;
function runtimeImport(specifier) {
	return Function("s", "return import(s)")(specifier);
}
async function ensureNodeModulesLoaded() {
	if (fs && os && path) return;
	const fsMod = await runtimeImport("node:fs");
	const osMod = await runtimeImport("node:os");
	const pathMod = await runtimeImport("node:path");
	fs = fsMod.default || fsMod;
	os = osMod.default || osMod;
	path = pathMod.default || pathMod;
}
async function getNodeRequire() {
	const createRequireFn = (await runtimeImport("node:module")).createRequire;
	return createRequireFn(process.cwd() + "/");
}
var WasmManager = class WasmManager {
	constructor() {
		this.wasmClient = null;
		this.isInitialized = false;
		this.initializationPromise = null;
		this.config = null;
	}
	static getInstance() {
		if (!WasmManager.instance) WasmManager.instance = new WasmManager();
		return WasmManager.instance;
	}
	async initialize(config, clientType = "node") {
		if (this.isInitialized && this.wasmClient) return;
		if (this.initializationPromise) return this.initializationPromise;
		this.initializationPromise = this.doInitialize(config, clientType);
		try {
			await this.initializationPromise;
		} finally {
			this.initializationPromise = null;
		}
	}
	async doInitialize(config, clientType) {
		try {
			this.config = config;
			if (clientType === "browser" && typeof window !== "undefined") this.wasmClient = createWasmSignerClient(config);
			else this.wasmClient = createWasmSignerClient(config);
			await this.wasmClient.initialize();
			this.isInitialized = true;
		} catch (error) {
			throw error;
		}
	}
	getWasmClient() {
		if (!this.isInitialized || !this.wasmClient) throw new Error("WASM client not initialized. Call initialize() first.");
		return this.wasmClient;
	}
	isReady() {
		return this.isInitialized && this.wasmClient !== null;
	}
	async ensureReady() {
		if (!this.isReady()) {
			if (!this.config) throw new Error("WASM manager not configured. Call initialize() first.");
			await this.initialize(this.config);
		}
	}
	static async preInitialize(config, clientType = "node") {
		await WasmManager.getInstance().initialize(config, clientType);
	}
	getStatus() {
		return {
			isInitialized: this.isInitialized,
			hasClient: this.wasmClient !== null,
			config: this.config
		};
	}
	destroy() {
		if (this.wasmClient) {
			if (typeof this.wasmClient.destroy === "function") this.wasmClient.destroy();
			this.wasmClient = null;
		}
		this.isInitialized = false;
		this.config = null;
		WasmManager.instance = null;
	}
	static reset() {
		if (WasmManager.instance) WasmManager.instance.destroy();
		WasmManager.instance = null;
	}
};
WasmManager.instance = null;
var WasmSignerClient = class {
	constructor(config) {
		this.wasmModule = null;
		this.wasmInstance = null;
		this.isInitialized = false;
		this.isBrowser = typeof window !== "undefined";
		this.config = config;
	}
	/**
	* Initialize the WASM module (unified for both browser and Node.js)
	*/
	async initialize() {
		if (this.isInitialized) return;
		try {
			if (this.isBrowser) await this.initializeBrowser();
			else await this.initializeNode();
			this.isInitialized = true;
		} catch (error) {
			throw new Error(`Failed to initialize WASM signer: ${error instanceof Error ? error.message : String(error)}`);
		}
	}
	/**
	* Browser-specific initialization
	*/
	async initializeBrowser() {
		let wasmExecPath;
		if (this.config.wasmExecPath) wasmExecPath = this.config.wasmExecPath;
		else if (this.config.wasmPath) {
			const dir = this.config.wasmPath.substring(0, this.config.wasmPath.lastIndexOf("/"));
			wasmExecPath = dir ? `${dir}/wasm_exec.js` : "wasm_exec.js";
		} else wasmExecPath = "wasm/wasm_exec.js";
		await this.loadScript(wasmExecPath);
		const wasmPath = this.config.wasmPath || "wasm/lighter-signer.wasm";
		const wasmBytes = await this.loadWasmBinary(wasmPath);
		const Go = window.Go;
		const go = new Go();
		const result = await WebAssembly.instantiate(wasmBytes, go.importObject);
		go.run(result.instance);
		await new Promise((resolve) => setTimeout(resolve, 1e3));
		this.wasmModule = {
			generateAPIKey: window.GenerateAPIKey || window.generateAPIKey,
			getPublicKey: window.GetPublicKey || window.getPublicKey || void 0,
			createClient: window.CreateClient || window.createClient,
			signChangePubKey: window.SignChangePubKey || window.signChangePubKey,
			signCreateOrder: window.SignCreateOrder || window.signCreateOrder,
			signCancelOrder: window.SignCancelOrder || window.signCancelOrder,
			signCancelAllOrders: window.SignCancelAllOrders || window.signCancelAllOrders,
			signTransfer: window.SignTransfer || window.signTransfer,
			signWithdraw: window.SignWithdraw || window.signWithdraw,
			signUpdateLeverage: window.SignUpdateLeverage || window.signUpdateLeverage,
			createAuthToken: window.CreateAuthToken || window.createAuthToken,
			checkClient: window.CheckClient || window.checkClient,
			signModifyOrder: window.SignModifyOrder || window.signModifyOrder,
			signUpdateMargin: window.SignUpdateMargin || window.signUpdateMargin,
			signCreateSubAccount: window.SignCreateSubAccount || window.signCreateSubAccount,
			signCreatePublicPool: window.SignCreatePublicPool || window.signCreatePublicPool,
			signUpdatePublicPool: window.SignUpdatePublicPool || window.signUpdatePublicPool,
			signMintShares: window.SignMintShares || window.signMintShares,
			signBurnShares: window.SignBurnShares || window.signBurnShares,
			signStakeAssets: window.SignStakeAssets || window.signStakeAssets,
			signUnstakeAssets: window.SignUnstakeAssets || window.signUnstakeAssets,
			signApproveIntegrator: window.SignApproveIntegrator || window.signApproveIntegrator,
			signCreateGroupedOrders: window.SignCreateGroupedOrders || window.signCreateGroupedOrders,
			signUpdateAccountConfig: window.SignUpdateAccountConfig || window.signUpdateAccountConfig,
			signUpdateAccountAssetConfig: window.SignUpdateAccountAssetConfig || window.signUpdateAccountAssetConfig,
			switchAPIKey: window.SwitchAPIKey || window.switchAPIKey || void 0
		};
		if (!this.wasmModule.generateAPIKey) throw new Error("WASM functions not properly registered");
	}
	/**
	* Node.js-specific initialization
	*/
	async initializeNode() {
		await ensureNodeModulesLoaded();
		const resolvedWasmPath = this.resolveWasmPath(this.config.wasmPath || "wasm/lighter-signer.wasm");
		let wasmExecPath = this.config.wasmExecPath;
		if (!wasmExecPath) {
			const bundledPath = this.resolveWasmPath("wasm/wasm_exec.js");
			if (fs.existsSync(bundledPath)) wasmExecPath = bundledPath;
			else throw new Error("Bundled wasm_exec.js not found. Please ensure wasm/wasm_exec.js exists.");
		} else wasmExecPath = this.resolveWasmPath(wasmExecPath);
		if (!wasmExecPath) throw new Error("Unable to locate wasm_exec runtime. Bundled files not found and Go not installed. Please ensure wasm/wasm_exec.js exists in the package.");
		await this.loadWasmExec(wasmExecPath);
		const wasmBytes = await this.loadWasmBinary(resolvedWasmPath);
		const Go = global.Go;
		const go = new Go();
		const baseImport = go.importObject;
		const goModule = baseImport.go || baseImport.gojs;
		if (goModule && !goModule["syscall/js.copyBytesToGo"] && goModule["syscall/js.valueCopyBytesToGo"]) goModule["syscall/js.copyBytesToGo"] = goModule["syscall/js.valueCopyBytesToGo"];
		if (goModule && !goModule["syscall/js.copyBytesToJS"] && goModule["syscall/js.valueCopyBytesToJS"]) goModule["syscall/js.copyBytesToJS"] = goModule["syscall/js.valueCopyBytesToJS"];
		const compatImportObject = {
			...baseImport,
			go: goModule,
			gojs: goModule
		};
		const result = await WebAssembly.instantiate(wasmBytes, compatImportObject);
		go.env = {
			TMPDIR: os.tmpdir(),
			HOME: process.env["HOME"] || "",
			PATH: process.env["PATH"] || ""
		};
		go.argv = ["js"];
		go.exit = process.exit;
		global.process = process;
		global.console = console;
		global.Buffer = Buffer;
		this.wasmInstance = result.instance;
		global.wasmInstance = result.instance;
		global.wasmMemory = result.instance.exports["mem"];
		try {
			go.run(result.instance);
		} catch (runError) {
			throw new Error(`WASM runtime failed: ${runError instanceof Error ? runError.message : String(runError)}`);
		}
		await new Promise((resolve) => setTimeout(resolve, 1e3));
		this.wasmModule = {
			generateAPIKey: global.GenerateAPIKey || global.generateAPIKey || global.lighterWasmFunctions?.generateAPIKey,
			getPublicKey: global.GetPublicKey || global.getPublicKey || global.lighterWasmFunctions?.getPublicKey || void 0,
			createClient: global.CreateClient || global.createClient || global.lighterWasmFunctions?.createClient,
			signChangePubKey: global.SignChangePubKey || global.signChangePubKey || global.lighterWasmFunctions?.signChangePubKey,
			signCreateOrder: global.SignCreateOrder || global.signCreateOrder || global.lighterWasmFunctions?.signCreateOrder,
			signCancelOrder: global.SignCancelOrder || global.signCancelOrder || global.lighterWasmFunctions?.signCancelOrder,
			signCancelAllOrders: global.SignCancelAllOrders || global.signCancelAllOrders || global.lighterWasmFunctions?.signCancelAllOrders,
			signTransfer: global.SignTransfer || global.signTransfer || global.lighterWasmFunctions?.signTransfer,
			signWithdraw: global.SignWithdraw || global.signWithdraw || global.lighterWasmFunctions?.signWithdraw,
			signUpdateLeverage: global.SignUpdateLeverage || global.signUpdateLeverage || global.lighterWasmFunctions?.signUpdateLeverage,
			createAuthToken: global.CreateAuthToken || global.createAuthToken || global.lighterWasmFunctions?.createAuthToken,
			checkClient: global.CheckClient || global.checkClient || global.lighterWasmFunctions?.checkClient,
			signModifyOrder: global.SignModifyOrder || global.signModifyOrder || global.lighterWasmFunctions?.signModifyOrder,
			signUpdateMargin: global.SignUpdateMargin || global.signUpdateMargin || global.lighterWasmFunctions?.signUpdateMargin,
			signCreateSubAccount: global.SignCreateSubAccount || global.signCreateSubAccount || global.lighterWasmFunctions?.signCreateSubAccount,
			signCreatePublicPool: global.SignCreatePublicPool || global.signCreatePublicPool || global.lighterWasmFunctions?.signCreatePublicPool,
			signUpdatePublicPool: global.SignUpdatePublicPool || global.signUpdatePublicPool || global.lighterWasmFunctions?.signUpdatePublicPool,
			signMintShares: global.SignMintShares || global.signMintShares || global.lighterWasmFunctions?.signMintShares,
			signBurnShares: global.SignBurnShares || global.signBurnShares || global.lighterWasmFunctions?.signBurnShares,
			signStakeAssets: global.SignStakeAssets || global.signStakeAssets || global.lighterWasmFunctions?.signStakeAssets,
			signUnstakeAssets: global.SignUnstakeAssets || global.signUnstakeAssets || global.lighterWasmFunctions?.signUnstakeAssets,
			signApproveIntegrator: global.SignApproveIntegrator || global.signApproveIntegrator || global.lighterWasmFunctions?.signApproveIntegrator,
			signCreateGroupedOrders: global.SignCreateGroupedOrders || global.signCreateGroupedOrders || global.lighterWasmFunctions?.signCreateGroupedOrders,
			signUpdateAccountConfig: global.SignUpdateAccountConfig || global.signUpdateAccountConfig || global.lighterWasmFunctions?.signUpdateAccountConfig,
			signUpdateAccountAssetConfig: global.SignUpdateAccountAssetConfig || global.signUpdateAccountAssetConfig || global.lighterWasmFunctions?.signUpdateAccountAssetConfig,
			switchAPIKey: global.SwitchAPIKey || global.switchAPIKey || global.lighterWasmFunctions?.switchAPIKey || void 0
		};
		if (!this.wasmModule.generateAPIKey) throw new Error("WASM functions not properly registered");
	}
	/**
	* Generate a new API key pair
	*/
	async generateAPIKey(seed) {
		await this.ensureInitialized();
		const result = this.wasmModule.generateAPIKey(seed);
		if (result.error) throw new Error(`Failed to generate API key: ${result.error}`);
		return {
			privateKey: result.privateKey,
			publicKey: result.publicKey
		};
	}
	/**
	* Get public key from private key
	* Note: This function is not exported from lighter-go WASM.
	* Use generateAPIKey() instead, which returns both private and public keys.
	* This method is kept for backward compatibility but will throw if GetPublicKey is not available.
	*/
	async getPublicKey(privateKey) {
		await this.ensureInitialized();
		if (!this.wasmModule.getPublicKey) throw new Error("GetPublicKey is not available in lighter-go WASM. Use generateAPIKey() instead, which returns both keys.");
		const result = this.wasmModule.getPublicKey(privateKey);
		if (result && result.error) throw new Error(`Failed to get public key: ${result.error}`);
		return result.publicKey;
	}
	/**
	* Sign a ChangePubKey transaction
	* Returns composite response with txType, txInfo, txHash, messageToSign
	*/
	async signChangePubKey(params) {
		await this.ensureInitialized();
		const result = this.wasmModule.signChangePubKey(params.pubkey, params.skipNonce ?? 0, params.nonce, params.apiKeyIndex, params.accountIndex);
		if (result.error) return {
			txType: 0,
			txInfo: "",
			txHash: "",
			error: result.error
		};
		return {
			txType: result.txType ?? 8,
			txInfo: result.txInfo ?? "",
			txHash: result.txHash ?? "",
			messageToSign: result.messageToSign
		};
	}
	/**
	* Create a client for signing transactions
	*/
	async createClient(params) {
		await this.ensureInitialized();
		const result = this.wasmModule.createClient(params.url, params.privateKey, params.chainId, params.apiKeyIndex, params.accountIndex);
		if (result.error) throw new Error(`Failed to create client: ${result.error}`);
	}
	/**
	* Sign a create order transaction
	* Returns composite response with txType, txInfo, txHash
	*/
	async signCreateOrder(params) {
		await this.ensureInitialized();
		const apiKeyIndex = params.apiKeyIndex ?? 0;
		const accountIndex = params.accountIndex ?? 0;
		let result = this.wasmModule.signCreateOrder(params.marketIndex, params.clientOrderIndex, params.baseAmount, params.price, params.isAsk, params.orderType, params.timeInForce, params.reduceOnly, params.triggerPrice, params.orderExpiry, params.integratorAccountIndex ?? 0, params.integratorTakerFee ?? 0, params.integratorMakerFee ?? 0, params.selfTradeBehaviorMode ?? 0, params.selfTradeEqualityMode ?? 0, params.skipNonce ?? 0, params.nonce, apiKeyIndex, accountIndex);
		if (result?.error && String(result.error).includes("expects 17 args")) result = this.wasmModule.signCreateOrder(params.marketIndex, params.clientOrderIndex, params.baseAmount, params.price, params.isAsk, params.orderType, params.timeInForce, params.reduceOnly, params.triggerPrice, params.orderExpiry, params.integratorAccountIndex ?? 0, params.integratorTakerFee ?? 0, params.integratorMakerFee ?? 0, params.skipNonce ?? 0, params.nonce, apiKeyIndex, accountIndex);
		if (result?.error && String(result.error).includes("expects 16 args")) result = this.wasmModule.signCreateOrder(params.marketIndex, params.clientOrderIndex, params.baseAmount, params.price, params.isAsk, params.orderType, params.timeInForce, params.reduceOnly, params.triggerPrice, params.orderExpiry, params.integratorAccountIndex ?? 0, params.integratorTakerFee ?? 0, params.integratorMakerFee ?? 0, params.nonce, apiKeyIndex, accountIndex);
		if (result?.error && String(result.error).includes("expects 13 args")) result = this.wasmModule.signCreateOrder(params.marketIndex, params.clientOrderIndex, params.baseAmount, params.price, params.isAsk, params.orderType, params.timeInForce, params.reduceOnly, params.triggerPrice, params.orderExpiry, params.nonce, apiKeyIndex, accountIndex);
		if (result.error) return {
			txType: 0,
			txInfo: "",
			txHash: "",
			error: result.error
		};
		return {
			txType: result.txType ?? 14,
			txInfo: result.txInfo ?? "",
			txHash: result.txHash ?? "",
			messageToSign: result.messageToSign
		};
	}
	/**
	* Sign a cancel order transaction
	* Returns composite response with txType, txInfo, txHash
	*/
	async signCancelOrder(params) {
		await this.ensureInitialized();
		let result = this.wasmModule.signCancelOrder(params.marketIndex, params.orderIndex, params.skipNonce ?? 0, params.nonce, params.apiKeyIndex, params.accountIndex);
		if (result?.error && String(result.error).includes("expects 5 args")) result = this.wasmModule.signCancelOrder(params.marketIndex, params.orderIndex, params.nonce, params.apiKeyIndex, params.accountIndex);
		if (result.error) return {
			txType: 0,
			txInfo: "",
			txHash: "",
			error: result.error
		};
		return {
			txType: result.txType ?? 15,
			txInfo: result.txInfo ?? "",
			txHash: result.txHash ?? "",
			messageToSign: result.messageToSign
		};
	}
	/**
	* Create an authentication token
	*/
	async createAuthToken(deadline, apiKeyIndex, accountIndex) {
		await this.ensureInitialized();
		const result = this.wasmModule.createAuthToken(deadline, apiKeyIndex, accountIndex);
		if (result.error) throw new Error(`Failed to create auth token: ${result.error}`);
		return result.authToken;
	}
	/**
	* Sign a cancel all orders transaction
	* Returns composite response with txType, txInfo, txHash
	*/
	async signCancelAllOrders(params) {
		await this.ensureInitialized();
		let result = this.wasmModule.signCancelAllOrders(params.timeInForce, params.time, params.cancelAllMarketIndex ?? 255, params.skipNonce ?? 0, params.nonce, params.apiKeyIndex, params.accountIndex);
		if (result?.error && String(result.error).includes("expects 6 args")) result = this.wasmModule.signCancelAllOrders(params.timeInForce, params.time, params.skipNonce ?? 0, params.nonce, params.apiKeyIndex, params.accountIndex);
		if (result?.error && String(result.error).includes("expects 5 args")) result = this.wasmModule.signCancelAllOrders(params.timeInForce, params.time, params.nonce, params.apiKeyIndex, params.accountIndex);
		if (result.error) return {
			txType: 0,
			txInfo: "",
			txHash: "",
			error: result.error
		};
		return {
			txType: result.txType ?? 16,
			txInfo: result.txInfo ?? "",
			txHash: result.txHash ?? "",
			messageToSign: result.messageToSign
		};
	}
	/**
	* Sign a transfer transaction
	* Returns composite response with txType, txInfo, txHash, messageToSign
	*/
	async signTransfer(params) {
		await this.ensureInitialized();
		const nonce = params.nonce ?? -1;
		const assetIndex = params.asset_id ?? 3;
		const toRouteType = params.is_spot_account === true ? 1 : 0;
		const fromRouteType = (params.from_is_spot_account ?? params.is_spot_account) === true ? 1 : 0;
		let memoBytes;
		if (typeof params.memo === "string") {
			const memoStr = params.memo;
			if (memoStr.length === 32) memoBytes = memoStr;
			else if (memoStr.length === 64 || memoStr.length === 66 && memoStr.startsWith("0x")) memoBytes = memoStr;
			else return {
				txType: 0,
				txInfo: "",
				txHash: "",
				error: `memo expected to be 32 bytes, 64 hex chars, or 66 with 0x prefix, got ${memoStr.length}`
			};
		} else return {
			txType: 0,
			txInfo: "",
			txHash: "",
			error: "memo must be a string"
		};
		const result = this.wasmModule.signTransfer(params.toAccountIndex, assetIndex, fromRouteType, toRouteType, params.usdcAmount, params.fee, memoBytes, params.skipNonce ?? 0, nonce, params.apiKeyIndex, params.accountIndex);
		if (result.error) return {
			txType: 0,
			txInfo: "",
			txHash: "",
			error: result.error
		};
		return {
			txType: result.txType ?? 12,
			txInfo: result.txInfo ?? "",
			txHash: result.txHash ?? "",
			messageToSign: result.messageToSign
		};
	}
	/**
	* Sign a withdraw transaction
	* Returns composite response with txType, txInfo, txHash
	*/
	async signWithdraw(params) {
		await this.ensureInitialized();
		const nonce = params.nonce ?? -1;
		const assetIndex = params.assetIndex ?? 3;
		const routeType = params.routeType ?? 0;
		const result = this.wasmModule.signWithdraw(assetIndex, routeType, params.usdcAmount, params.skipNonce ?? 0, nonce, params.apiKeyIndex, params.accountIndex);
		if (result.error) return {
			txType: 0,
			txInfo: "",
			txHash: "",
			error: result.error
		};
		return {
			txType: result.txType ?? 13,
			txInfo: result.txInfo ?? "",
			txHash: result.txHash ?? "",
			messageToSign: result.messageToSign
		};
	}
	/**
	* Sign an update leverage transaction
	* Returns composite response with txType, txInfo, txHash
	*/
	async signUpdateLeverage(params) {
		await this.ensureInitialized();
		const result = this.wasmModule.signUpdateLeverage(params.marketIndex, params.fraction, params.marginMode, params.skipNonce ?? 0, params.nonce, params.apiKeyIndex, params.accountIndex);
		if (result.error) return {
			txType: 0,
			txInfo: "",
			txHash: "",
			error: result.error
		};
		return {
			txType: result.txType ?? 20,
			txInfo: result.txInfo ?? "",
			txHash: result.txHash ?? "",
			messageToSign: result.messageToSign
		};
	}
	/**
	* Sign a modify order transaction
	* Returns composite response with txType, txInfo, txHash
	*/
	async signModifyOrder(params) {
		await this.ensureInitialized();
		let result = this.wasmModule.signModifyOrder(params.marketIndex, params.index, params.baseAmount, params.price, params.triggerPrice, params.integratorAccountIndex ?? 0, params.integratorTakerFee ?? 0, params.integratorMakerFee ?? 0, params.selfTradeBehaviorMode ?? 0, params.selfTradeEqualityMode ?? 0, params.skipNonce ?? 0, params.nonce, params.apiKeyIndex, params.accountIndex);
		if (result?.error && String(result.error).includes("expects 12 args")) result = this.wasmModule.signModifyOrder(params.marketIndex, params.index, params.baseAmount, params.price, params.triggerPrice, params.integratorAccountIndex ?? 0, params.integratorTakerFee ?? 0, params.integratorMakerFee ?? 0, params.skipNonce ?? 0, params.nonce, params.apiKeyIndex, params.accountIndex);
		if (result?.error && String(result.error).includes("expects 11 args")) result = this.wasmModule.signModifyOrder(params.marketIndex, params.index, params.baseAmount, params.price, params.triggerPrice, params.integratorAccountIndex ?? 0, params.integratorTakerFee ?? 0, params.integratorMakerFee ?? 0, params.nonce, params.apiKeyIndex, params.accountIndex);
		if (result?.error && String(result.error).includes("expects 8 args")) result = this.wasmModule.signModifyOrder(params.marketIndex, params.index, params.baseAmount, params.price, params.triggerPrice, params.nonce, params.apiKeyIndex, params.accountIndex);
		if (result.error) return {
			txType: 0,
			txInfo: "",
			txHash: "",
			error: result.error
		};
		return {
			txType: result.txType ?? 17,
			txInfo: result.txInfo ?? "",
			txHash: result.txHash ?? "",
			messageToSign: result.messageToSign
		};
	}
	/**
	* Sign an update margin transaction
	* Returns composite response with txType, txInfo, txHash
	*/
	async signUpdateMargin(params) {
		await this.ensureInitialized();
		const result = this.wasmModule.signUpdateMargin(params.marketIndex, params.usdcAmount, params.direction, params.skipNonce ?? 0, params.nonce, params.apiKeyIndex, params.accountIndex);
		if (result.error) return {
			txType: 0,
			txInfo: "",
			txHash: "",
			error: result.error
		};
		return {
			txType: result.txType ?? 29,
			txInfo: result.txInfo ?? "",
			txHash: result.txHash ?? "",
			messageToSign: result.messageToSign
		};
	}
	/**
	* Sign a create sub account transaction
	* Returns composite response with txType, txInfo, txHash
	*/
	async signCreateSubAccount(params) {
		await this.ensureInitialized();
		const result = this.wasmModule.signCreateSubAccount(params.skipNonce ?? 0, params.nonce, params.apiKeyIndex, params.accountIndex);
		if (result.error) return {
			txType: 0,
			txInfo: "",
			txHash: "",
			error: result.error
		};
		return {
			txType: result.txType ?? 9,
			txInfo: result.txInfo ?? "",
			txHash: result.txHash ?? "",
			messageToSign: result.messageToSign
		};
	}
	/**
	* Sign a create public pool transaction
	* Returns composite response with txType, txInfo, txHash
	*/
	async signCreatePublicPool(params) {
		await this.ensureInitialized();
		const result = this.wasmModule.signCreatePublicPool(params.operatorFee, params.initialTotalShares, params.minOperatorShareRate, params.skipNonce ?? 0, params.nonce, params.apiKeyIndex, params.accountIndex);
		if (result.error) return {
			txType: 0,
			txInfo: "",
			txHash: "",
			error: result.error
		};
		return {
			txType: result.txType ?? 10,
			txInfo: result.txInfo ?? "",
			txHash: result.txHash ?? "",
			messageToSign: result.messageToSign
		};
	}
	/**
	* Sign an update public pool transaction
	* Returns composite response with txType, txInfo, txHash
	*/
	async signUpdatePublicPool(params) {
		await this.ensureInitialized();
		const result = this.wasmModule.signUpdatePublicPool(params.publicPoolIndex, params.status, params.operatorFee, params.minOperatorShareRate, params.skipNonce ?? 0, params.nonce, params.apiKeyIndex, params.accountIndex);
		if (result.error) return {
			txType: 0,
			txInfo: "",
			txHash: "",
			error: result.error
		};
		return {
			txType: result.txType ?? 11,
			txInfo: result.txInfo ?? "",
			txHash: result.txHash ?? "",
			messageToSign: result.messageToSign
		};
	}
	/**
	* Sign a mint shares transaction
	* Returns composite response with txType, txInfo, txHash
	*/
	async signMintShares(params) {
		await this.ensureInitialized();
		const result = this.wasmModule.signMintShares(params.publicPoolIndex, params.shareAmount, params.skipNonce ?? 0, params.nonce, params.apiKeyIndex, params.accountIndex);
		if (result.error) return {
			txType: 0,
			txInfo: "",
			txHash: "",
			error: result.error
		};
		return {
			txType: result.txType ?? 18,
			txInfo: result.txInfo ?? "",
			txHash: result.txHash ?? "",
			messageToSign: result.messageToSign
		};
	}
	/**
	* Sign a burn shares transaction
	* Returns composite response with txType, txInfo, txHash
	*/
	async signBurnShares(params) {
		await this.ensureInitialized();
		const result = this.wasmModule.signBurnShares(params.publicPoolIndex, params.shareAmount, params.skipNonce ?? 0, params.nonce, params.apiKeyIndex, params.accountIndex);
		if (result.error) return {
			txType: 0,
			txInfo: "",
			txHash: "",
			error: result.error
		};
		return {
			txType: result.txType ?? 19,
			txInfo: result.txInfo ?? "",
			txHash: result.txHash ?? "",
			messageToSign: result.messageToSign
		};
	}
	/**
	* Sign a stake assets transaction
	* Returns composite response with txType, txInfo, txHash
	*/
	async signStakeAssets(params) {
		await this.ensureInitialized();
		const result = this.wasmModule.signStakeAssets(params.stakingPoolIndex, params.shareAmount, params.skipNonce ?? 0, params.nonce, params.apiKeyIndex, params.accountIndex);
		if (result.error) return {
			txType: 0,
			txInfo: "",
			txHash: "",
			error: result.error
		};
		return {
			txType: result.txType ?? 35,
			txInfo: result.txInfo ?? "",
			txHash: result.txHash ?? "",
			messageToSign: result.messageToSign
		};
	}
	/**
	* Sign an unstake assets transaction
	* Returns composite response with txType, txInfo, txHash
	*/
	async signUnstakeAssets(params) {
		await this.ensureInitialized();
		const result = this.wasmModule.signUnstakeAssets(params.stakingPoolIndex, params.shareAmount, params.skipNonce ?? 0, params.nonce, params.apiKeyIndex, params.accountIndex);
		if (result.error) return {
			txType: 0,
			txInfo: "",
			txHash: "",
			error: result.error
		};
		return {
			txType: result.txType ?? 36,
			txInfo: result.txInfo ?? "",
			txHash: result.txHash ?? "",
			messageToSign: result.messageToSign
		};
	}
	/**
	* Sign an approve integrator transaction
	* Returns composite response with txType, txInfo, txHash, messageToSign
	*/
	async signApproveIntegrator(params) {
		await this.ensureInitialized();
		let result = this.wasmModule.signApproveIntegrator(params.integratorIndex, params.maxPerpsTakerFee, params.maxPerpsMakerFee, params.maxSpotTakerFee, params.maxSpotMakerFee, params.approvalExpiry, params.skipNonce ?? 0, params.nonce, params.apiKeyIndex, params.accountIndex);
		if (result?.error && String(result.error).includes("expects 9 args")) result = this.wasmModule.signApproveIntegrator(params.integratorIndex, params.maxPerpsTakerFee, params.maxPerpsMakerFee, params.maxSpotTakerFee, params.maxSpotMakerFee, params.approvalExpiry, params.nonce, params.apiKeyIndex, params.accountIndex);
		if (result.error) return {
			txType: 0,
			txInfo: "",
			txHash: "",
			error: result.error
		};
		return {
			txType: result.txType ?? 45,
			txInfo: result.txInfo ?? "",
			txHash: result.txHash ?? "",
			messageToSign: result.messageToSign
		};
	}
	/**
	* Switch active API key
	* Note: This function is not exported from lighter-go WASM.
	* In lighter-go, multiple API keys are managed via CreateClient with different apiKeyIndex values.
	* This method is kept for backward compatibility but will throw if SwitchAPIKey is not available.
	*
	* To use multiple API keys with lighter-go:
	* 1. Call createClient() with different apiKeyIndex values
	* 2. The signer functions accept apiKeyIndex and accountIndex parameters
	* 3. lighter-go automatically routes to the correct client based on these indices
	*/
	async switchAPIKey(apiKeyIndex) {
		await this.ensureInitialized();
		if (!this.wasmModule.switchAPIKey) throw new Error("SwitchAPIKey is not available in lighter-go WASM. Use createClient() with different apiKeyIndex values instead. The signer functions accept apiKeyIndex and accountIndex parameters to select the correct client.");
		const result = this.wasmModule.switchAPIKey(apiKeyIndex);
		if (result && result.error) throw new Error(`Failed to switch API key: ${result.error}`);
	}
	/**
	* Sign a create grouped orders transaction
	* Creates a single transaction with multiple orders (OTO/OCO/OTOCO)
	* Returns composite response with txType, txInfo, txHash
	*/
	async signCreateGroupedOrders(params) {
		await this.ensureInitialized();
		const ordersArray = params.orders.map((order) => ({
			MarketIndex: order.marketIndex,
			ClientOrderIndex: order.clientOrderIndex,
			BaseAmount: order.baseAmount,
			Price: order.price,
			IsAsk: order.isAsk,
			Type: order.orderType,
			TimeInForce: order.timeInForce,
			ReduceOnly: order.reduceOnly,
			TriggerPrice: order.triggerPrice,
			OrderExpiry: order.orderExpiry,
			IntegratorAccountIndex: order.integratorAccountIndex ?? 0,
			IntegratorTakerFee: order.integratorTakerFee ?? 0,
			IntegratorMakerFee: order.integratorMakerFee ?? 0,
			SelfTradeBehaviorMode: order.selfTradeBehaviorMode ?? 0,
			SelfTradeEqualityMode: order.selfTradeEqualityMode ?? 0
		}));
		let result = this.wasmModule.signCreateGroupedOrders(params.groupingType, ordersArray, params.integratorAccountIndex ?? 0, params.integratorTakerFee ?? 0, params.integratorMakerFee ?? 0, params.selfTradeBehaviorMode ?? 0, params.selfTradeEqualityMode ?? 0, params.skipNonce ?? 0, params.nonce, params.apiKeyIndex, params.accountIndex);
		if (result?.error && String(result.error).includes("expects 9 args")) result = this.wasmModule.signCreateGroupedOrders(params.groupingType, ordersArray, params.integratorAccountIndex ?? 0, params.integratorTakerFee ?? 0, params.integratorMakerFee ?? 0, params.skipNonce ?? 0, params.nonce, params.apiKeyIndex, params.accountIndex);
		if (result?.error && String(result.error).includes("expects 5 args")) result = this.wasmModule.signCreateGroupedOrders(params.groupingType, ordersArray, params.nonce, params.apiKeyIndex, params.accountIndex);
		if (result.error) return {
			txType: 0,
			txInfo: "",
			txHash: "",
			error: result.error
		};
		return {
			txType: result.txType ?? 28,
			txInfo: result.txInfo ?? "",
			txHash: result.txHash ?? "",
			messageToSign: result.messageToSign
		};
	}
	async checkClient(apiKeyIndex, accountIndex) {
		await this.ensureInitialized();
		if (!this.wasmModule.checkClient) return;
		const result = this.wasmModule.checkClient(apiKeyIndex, accountIndex);
		if (result && result.error) throw new Error(typeof result.error === "string" ? result.error : String(result.error));
	}
	async signUpdateAccountConfig(params) {
		await this.ensureInitialized();
		if (!this.wasmModule.signUpdateAccountConfig) return {
			txType: 0,
			txInfo: "",
			txHash: "",
			error: "signUpdateAccountConfig is not available in this WASM build"
		};
		const result = this.wasmModule.signUpdateAccountConfig(params.accountTradingMode, params.skipNonce ?? 0, params.nonce, params.apiKeyIndex, params.accountIndex);
		if (result.error) return {
			txType: 0,
			txInfo: "",
			txHash: "",
			error: result.error
		};
		return {
			txType: result.txType ?? 46,
			txInfo: result.txInfo ?? "",
			txHash: result.txHash ?? "",
			messageToSign: result.messageToSign
		};
	}
	async signUpdateAccountAssetConfig(params) {
		await this.ensureInitialized();
		if (!this.wasmModule.signUpdateAccountAssetConfig) return {
			txType: 0,
			txInfo: "",
			txHash: "",
			error: "signUpdateAccountAssetConfig is not available in this WASM build"
		};
		const result = this.wasmModule.signUpdateAccountAssetConfig(params.assetIndex, params.assetMarginMode, params.skipNonce ?? 0, params.nonce, params.apiKeyIndex, params.accountIndex);
		if (result.error) return {
			txType: 0,
			txInfo: "",
			txHash: "",
			error: result.error
		};
		return {
			txType: result.txType ?? 47,
			txInfo: result.txInfo ?? "",
			txHash: result.txHash ?? "",
			messageToSign: result.messageToSign
		};
	}
	/**
	* Ensure the WASM module is initialized
	*/
	async ensureInitialized() {
		if (!this.isInitialized) await this.initialize();
	}
	/**
	* Load script for browser environment
	*/
	async loadScript(src) {
		return new Promise((resolve, reject) => {
			const debugWasm = typeof process !== "undefined" && !!process.env?.["DEBUG_WASM"];
			if (debugWasm) console.log(`[WASM] Loading script: ${src}`);
			const fullUrl = this.resolveScriptUrl(src);
			if (debugWasm) console.log(`[WASM] Resolved URL: ${fullUrl}`);
			const script = document.createElement("script");
			script.src = fullUrl;
			script.onload = () => {
				if (debugWasm) console.log(`[WASM] Script loaded successfully: ${fullUrl}`);
				resolve();
			};
			script.onerror = (error) => {
				console.error(`[WASM] Script loading failed: ${fullUrl}`, error);
				reject(/* @__PURE__ */ new Error(`Failed to load script: ${fullUrl}`));
			};
			document.head.appendChild(script);
		});
	}
	/**
	* Resolve script URL for browser context
	*/
	resolveScriptUrl(src) {
		if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/")) return src;
		return [
			src,
			`/dist/umd/${src}`,
			`./dist/umd/${src}`
		][0];
	}
	/**
	* Load wasm_exec.js for Node.js
	*/
	async loadWasmExec(wasmExecPath) {
		try {
			await ensureNodeModulesLoaded();
			const nodeRequire = await getNodeRequire();
			let absolutePath = wasmExecPath;
			if (!absolutePath.startsWith("/") && !absolutePath.includes(":")) absolutePath = path.resolve(process.cwd(), wasmExecPath);
			if (!fs.existsSync(absolutePath)) throw new Error(`WASM exec file not found: ${absolutePath}`);
			const wasmExec = nodeRequire(absolutePath);
			if (wasmExec && wasmExec.Go) global.Go = wasmExec.Go;
			else if (global.Go) {} else throw new Error("Go class not found in wasm_exec.js");
		} catch (error) {
			throw new Error(`Failed to load wasm_exec.js: ${error instanceof Error ? error.message : String(error)}`);
		}
	}
	/**
	* Resolve WASM path relative to package root
	*/
	resolveWasmPath(wasmPath) {
		if (!path || !fs) throw new Error("Node path/fs modules are not initialized");
		if (path.isAbsolute(wasmPath)) return wasmPath;
		try {
			const packageRoot = this.findPackageRoot();
			if (packageRoot) {
				const resolvedPath = path.join(packageRoot, wasmPath);
				if (fs.existsSync(resolvedPath)) return resolvedPath;
			}
		} catch {}
		return path.resolve(process.cwd(), wasmPath);
	}
	/**
	* Find the package root directory
	*/
	findPackageRoot() {
		if (!path || !fs) return null;
		const cwd = process.cwd();
		const localPackageJson = path.join(cwd, "package.json");
		const localWasmExec = path.join(cwd, "wasm", "wasm_exec.js");
		const localWasmBinary = path.join(cwd, "wasm", "lighter-signer.wasm");
		if (fs.existsSync(localPackageJson)) try {
			const pkgRaw = fs.readFileSync(localPackageJson, "utf-8");
			if (JSON.parse(pkgRaw).name === "lighter-ts-sdk" && (fs.existsSync(localWasmExec) || fs.existsSync(localWasmBinary))) return cwd;
		} catch {}
		let currentDir = cwd;
		const maxDepth = 10;
		let depth = 0;
		while (currentDir && depth < maxDepth) {
			const packagePath = path.join(currentDir, "node_modules", "lighter-ts-sdk");
			if (fs.existsSync(packagePath)) return packagePath;
			currentDir = path.dirname(currentDir);
			depth++;
		}
		if (fs.existsSync(localWasmExec) || fs.existsSync(localWasmBinary)) return cwd;
		return null;
	}
	/**
	* Load WASM binary for Node.js
	*/
	async loadWasmBinary(wasmPath) {
		if (this.isBrowser) {
			const fullUrl = this.resolveWasmUrl(wasmPath);
			const debugWasm = typeof process !== "undefined" && !!process.env?.["DEBUG_WASM"];
			if (debugWasm) console.log(`[WASM] Fetching WASM binary from: ${fullUrl}`);
			try {
				const response = await fetch(fullUrl);
				if (!response.ok) {
					console.error(`[WASM] Fetch failed with status ${response.status}: ${response.statusText}`);
					throw new Error(`Failed to load WASM binary: HTTP ${response.status} ${response.statusText} from ${fullUrl}`);
				}
				const data = await response.arrayBuffer();
				if (debugWasm) console.log(`[WASM] WASM binary loaded successfully (${data.byteLength} bytes)`);
				return data;
			} catch (error) {
				console.error(`[WASM] Failed to fetch WASM binary:`, error);
				throw error;
			}
		} else {
			await ensureNodeModulesLoaded();
			const buffer = fs.readFileSync(wasmPath);
			return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
		}
	}
	/**
	* Resolve WASM binary URL for browser context
	*/
	resolveWasmUrl(wasmPath) {
		if (wasmPath.startsWith("http://") || wasmPath.startsWith("https://") || wasmPath.startsWith("/")) return wasmPath;
		const resolved = [
			wasmPath,
			`/dist/umd/${wasmPath}`,
			`./dist/umd/${wasmPath}`
		][0];
		if (typeof process !== "undefined" && process.env?.["DEBUG_WASM"]) console.log(`[WASM] Resolving WASM path "${wasmPath}" to: "${resolved}"`);
		return resolved;
	}
};
/**
* Create a unified WASM signer client instance
* Automatically detects browser vs Node.js environment
*/
function createWasmSignerClient(config) {
	return new WasmSignerClient(config);
}
//#endregion
//#region node_modules/lighter-ts-sdk/dist/esm/utils/logger.js
var LogLevel;
(function(LogLevel) {
	LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
	LogLevel[LogLevel["INFO"] = 1] = "INFO";
	LogLevel[LogLevel["WARNING"] = 2] = "WARNING";
	LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (LogLevel = {}));
var logger = class Logger {
	constructor() {
		this.logLevel = LogLevel.INFO;
		this.logs = [];
	}
	static getInstance() {
		if (!Logger.instance) Logger.instance = new Logger();
		return Logger.instance;
	}
	setLevel(level) {
		this.logLevel = level;
	}
	debug(message, context) {
		this.log(LogLevel.DEBUG, message, context);
	}
	info(message, context) {
		this.log(LogLevel.INFO, message, context);
	}
	warning(message, context) {
		this.log(LogLevel.WARNING, message, context);
	}
	error(message, error, context) {
		this.log(LogLevel.ERROR, message, {
			...context,
			error
		});
	}
	log(level, message, context) {
		if (level < this.logLevel) return;
		const entry = {
			timestamp: (/* @__PURE__ */ new Date()).toISOString(),
			level,
			message,
			context,
			error: context?.["error"]
		};
		this.logs.push(entry);
		const contextStr = context ? ` ${JSON.stringify(context, null, 2)}` : "";
		switch (level) {
			case LogLevel.DEBUG:
				console.debug(`[DEBUG] ${message}${contextStr}`);
				break;
			case LogLevel.INFO:
				console.log(`[INFO] ${message}${contextStr}`);
				break;
			case LogLevel.WARNING:
				console.warn(`[WARNING] ${message}${contextStr}`);
				break;
			case LogLevel.ERROR:
				console.error(`[ERROR] ${message}${contextStr}`);
				if (context?.["error"]) console.error("Stack trace:", context["error"].stack);
		}
	}
	getLogs() {
		return [...this.logs];
	}
	clearLogs() {
		this.logs = [];
	}
	logApiCall(method, url, params) {
		this.debug(`API Call: ${method} ${url}`, { params });
	}
	logApiResponse(method, url, status, responseTime) {
		this.debug(`API Response: ${method} ${url} - ${status} (${responseTime}ms)`);
	}
	logTransaction(txType, txInfo) {
		this.debug(`Transaction: ${txType}`, { txInfo });
	}
	logNonce(apiKeyIndex, nonce) {
		this.debug(`Nonce: API Key ${apiKeyIndex}, Nonce ${nonce}`);
	}
	logSignerError(operation, error) {
		this.error(`Signer Error: ${operation}`, error);
	}
}.getInstance();
//#endregion
//#region node_modules/lighter-ts-sdk/dist/esm/utils/nonce-cache.js
var NonceCache = class {
	constructor(fetchNonceCallback) {
		this.fetchNonceCallback = fetchNonceCallback;
		this.cache = /* @__PURE__ */ new Map();
		this.batchSize = 20;
		this.maxCacheAge = 3e4;
		this.lastFetch = 0;
		this.fetchPromise = null;
	}
	async getNextNonce(apiKeyIndex) {
		const nonces = this.cache.get(apiKeyIndex);
		if (!nonces || nonces.length === 0 || this.isCacheExpired()) await this.refreshNonces(apiKeyIndex);
		const cachedNonces = this.cache.get(apiKeyIndex);
		if (!cachedNonces || cachedNonces.length === 0) throw new Error("Failed to get nonce from cache");
		const nonceInfo = cachedNonces.shift();
		this.cache.set(apiKeyIndex, cachedNonces);
		if (cachedNonces.length <= 2) this.refreshNonces(apiKeyIndex).catch(() => {});
		return nonceInfo.nonce;
	}
	async getNextNonces(apiKeyIndex, count) {
		const nonces = [];
		for (let i = 0; i < count; i++) {
			const nonce = await this.getNextNonce(apiKeyIndex);
			nonces.push(nonce);
		}
		return nonces;
	}
	async refreshNonces(apiKeyIndex) {
		if (this.fetchPromise) {
			await this.fetchPromise;
			return;
		}
		this.fetchPromise = this.doRefreshNonces(apiKeyIndex);
		try {
			await this.fetchPromise;
		} finally {
			this.fetchPromise = null;
		}
	}
	async doRefreshNonces(apiKeyIndex) {
		try {
			const nonceInfos = (await this.fetchNonceCallback(apiKeyIndex, this.batchSize)).map((nonce) => ({
				nonce,
				timestamp: Date.now(),
				apiKeyIndex
			}));
			this.cache.set(apiKeyIndex, nonceInfos);
			this.lastFetch = Date.now();
		} catch (error) {
			throw error;
		}
	}
	isCacheExpired() {
		return Date.now() - this.lastFetch > this.maxCacheAge;
	}
	async preWarmCache(apiKeyIndices) {
		const promises = apiKeyIndices.map((index) => this.refreshNonces(index));
		await Promise.all(promises);
	}
	clearCache(apiKeyIndex) {
		this.cache.delete(apiKeyIndex);
	}
	clearAllCache() {
		this.cache.clear();
		this.lastFetch = 0;
	}
	getCacheStats() {
		const stats = {};
		for (const [apiKeyIndex, nonces] of Array.from(this.cache.entries())) if (nonces.length > 0) {
			const timestamps = nonces.map((n) => n.timestamp);
			stats[apiKeyIndex] = {
				count: nonces.length,
				oldest: Math.min(...timestamps),
				newest: Math.max(...timestamps)
			};
		}
		return stats;
	}
	isHealthy() {
		return Date.now() - this.lastFetch < this.maxCacheAge * 2;
	}
	/**
	* Acknowledge failure and rollback nonce
	*/
	acknowledgeFailure(apiKeyIndex) {
		const nonces = this.cache.get(apiKeyIndex);
		if (nonces && nonces.length > 0) {
			const lastNonce = nonces[0];
			if (lastNonce) {
				nonces.unshift({
					nonce: lastNonce.nonce - 1,
					timestamp: Date.now(),
					apiKeyIndex
				});
				this.cache.set(apiKeyIndex, nonces);
			}
		}
	}
	/**
	* Hard refresh nonce from API (used when invalid nonce error occurs)
	*/
	async hardRefreshNonce(apiKeyIndex) {
		this.cache.delete(apiKeyIndex);
		await this.refreshNonces(apiKeyIndex);
	}
};
//#endregion
//#region node_modules/lighter-ts-sdk/dist/esm/utils/nonce-manager.js
/**
* Standalone Nonce Manager Utility
* Provides nonce management functionality that can be imported and used independently
*/
var NonceManager = class {
	constructor(apiClient, config) {
		this.config = {
			batchSize: 20,
			maxCacheAge: 3e4,
			...config
		};
		this.transactionApi = new TransactionApi(apiClient);
		this.nonceCache = new NonceCache(async (apiKeyIndex, count) => {
			const firstNonceResult = await this.transactionApi.getNextNonce(this.config.accountIndex, apiKeyIndex);
			const nonces = [];
			for (let i = 0; i < count; i++) nonces.push(firstNonceResult.nonce + i);
			return nonces;
		});
	}
	/**
	* Get next nonce for current API key
	*/
	async getNextNonce() {
		return this.nonceCache.getNextNonce(this.config.apiKeyIndex);
	}
	/**
	* Get multiple nonces for batch operations
	*/
	async getNextNonces(count) {
		return this.nonceCache.getNextNonces(this.config.apiKeyIndex, count);
	}
	/**
	* Pre-warm the nonce cache for better performance
	*/
	async preWarmCache() {
		await this.nonceCache.refreshNonces(this.config.apiKeyIndex);
	}
	/**
	* Clear nonce cache
	*/
	clearCache() {
		this.nonceCache.clearCache(this.config.apiKeyIndex);
	}
	/**
	* Get cache statistics
	*/
	getCacheStats() {
		return this.nonceCache.getCacheStats();
	}
	/**
	* Check if nonce manager is healthy
	*/
	isHealthy() {
		return this.nonceCache.isHealthy();
	}
	/**
	* Acknowledge transaction failure and rollback nonce
	* This prevents nonce gaps when transactions fail
	*/
	acknowledgeFailure(apiKeyIndex) {
		this.nonceCache.acknowledgeFailure(apiKeyIndex);
	}
	/**
	* Hard refresh nonce from API (used when invalid nonce error occurs)
	*/
	async hardRefreshNonce(apiKeyIndex) {
		await this.nonceCache.hardRefreshNonce(apiKeyIndex);
	}
	/**
	* Check if error is nonce-related
	*/
	isNonceError(error) {
		if (!error) return false;
		const message = error.message || error.toString() || "";
		return message.toLowerCase().includes("invalid nonce") || message.toLowerCase().includes("nonce") || error.status === 400 && message.includes("nonce");
	}
	/**
	* Get current configuration
	*/
	getConfig() {
		return { ...this.config };
	}
	/**
	* Update configuration
	*/
	updateConfig(newConfig) {
		this.config = {
			...this.config,
			...newConfig
		};
	}
};
//#endregion
//#region node_modules/lighter-ts-sdk/dist/esm/utils/request-batcher.js
var RequestBatcher = class {
	constructor(batchProcessor, config) {
		this.batchProcessor = batchProcessor;
		this.pendingRequests = /* @__PURE__ */ new Map();
		this.batchQueue = [];
		this.flushTimer = null;
		this.isProcessing = false;
		this.config = {
			maxBatchSize: 10,
			maxWaitTime: 50,
			flushInterval: 25,
			...config
		};
	}
	async addRequest(type, params) {
		return new Promise((resolve, reject) => {
			const requestId = `${type.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
			const request = {
				id: requestId,
				type,
				params,
				timestamp: Date.now()
			};
			this.pendingRequests.set(requestId, {
				resolve,
				reject,
				timestamp: Date.now()
			});
			this.batchQueue.push(request);
			if (this.batchQueue.length >= this.config.maxBatchSize) this.flush();
			else this.scheduleFlush();
		});
	}
	scheduleFlush() {
		if (this.flushTimer) return;
		this.flushTimer = setTimeout(() => {
			this.flush();
		}, this.config.flushInterval);
	}
	async flush() {
		if (this.isProcessing || this.batchQueue.length === 0) return;
		this.isProcessing = true;
		if (this.flushTimer) {
			clearTimeout(this.flushTimer);
			this.flushTimer = null;
		}
		const currentBatch = [...this.batchQueue];
		this.batchQueue = [];
		if (currentBatch.length === 0) {
			this.isProcessing = false;
			return;
		}
		try {
			const responses = await this.batchProcessor(currentBatch);
			for (const response of responses) {
				const pending = this.pendingRequests.get(response.id);
				if (pending) {
					this.pendingRequests.delete(response.id);
					if (response.success) pending.resolve(response.result);
					else pending.reject(new Error(response.error || "Batch request failed"));
				}
			}
			for (const request of currentBatch) {
				const pending = this.pendingRequests.get(request.id);
				if (pending) {
					this.pendingRequests.delete(request.id);
					pending.reject(/* @__PURE__ */ new Error("No response received for batch request"));
				}
			}
		} catch (error) {
			for (const request of currentBatch) {
				const pending = this.pendingRequests.get(request.id);
				if (pending) {
					this.pendingRequests.delete(request.id);
					pending.reject(error instanceof Error ? error : /* @__PURE__ */ new Error("Batch processing failed"));
				}
			}
		} finally {
			this.isProcessing = false;
		}
	}
	async flushAll() {
		if (this.flushTimer) {
			clearTimeout(this.flushTimer);
			this.flushTimer = null;
		}
		await this.flush();
	}
	getStats() {
		return {
			pendingRequests: this.pendingRequests.size,
			batchQueue: this.batchQueue.length,
			isProcessing: this.isProcessing
		};
	}
	async destroy() {
		if (this.flushTimer) {
			clearTimeout(this.flushTimer);
			this.flushTimer = null;
		}
		for (const [, pending] of Array.from(this.pendingRequests.entries())) pending.reject(/* @__PURE__ */ new Error("RequestBatcher destroyed"));
		this.pendingRequests.clear();
		this.batchQueue = [];
	}
};
//#endregion
//#region node_modules/ws/lib/constants.js
var require_constants = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var BINARY_TYPES = [
		"nodebuffer",
		"arraybuffer",
		"fragments"
	];
	var hasBlob = typeof Blob !== "undefined";
	if (hasBlob) BINARY_TYPES.push("blob");
	module.exports = {
		BINARY_TYPES,
		CLOSE_TIMEOUT: 3e4,
		EMPTY_BUFFER: Buffer.alloc(0),
		GUID: "258EAFA5-E914-47DA-95CA-C5AB0DC85B11",
		hasBlob,
		kForOnEventAttribute: Symbol("kIsForOnEventAttribute"),
		kListener: Symbol("kListener"),
		kStatusCode: Symbol("status-code"),
		kWebSocket: Symbol("websocket"),
		NOOP: () => {}
	};
}));
//#endregion
//#region node_modules/ws/lib/buffer-util.js
var require_buffer_util = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { EMPTY_BUFFER } = require_constants();
	var FastBuffer = Buffer[Symbol.species];
	/**
	* Merges an array of buffers into a new buffer.
	*
	* @param {Buffer[]} list The array of buffers to concat
	* @param {Number} totalLength The total length of buffers in the list
	* @return {Buffer} The resulting buffer
	* @public
	*/
	function concat(list, totalLength) {
		if (list.length === 0) return EMPTY_BUFFER;
		if (list.length === 1) return list[0];
		const target = Buffer.allocUnsafe(totalLength);
		let offset = 0;
		for (let i = 0; i < list.length; i++) {
			const buf = list[i];
			target.set(buf, offset);
			offset += buf.length;
		}
		if (offset < totalLength) return new FastBuffer(target.buffer, target.byteOffset, offset);
		return target;
	}
	/**
	* Masks a buffer using the given mask.
	*
	* @param {Buffer} source The buffer to mask
	* @param {Buffer} mask The mask to use
	* @param {Buffer} output The buffer where to store the result
	* @param {Number} offset The offset at which to start writing
	* @param {Number} length The number of bytes to mask.
	* @public
	*/
	function _mask(source, mask, output, offset, length) {
		for (let i = 0; i < length; i++) output[offset + i] = source[i] ^ mask[i & 3];
	}
	/**
	* Unmasks a buffer using the given mask.
	*
	* @param {Buffer} buffer The buffer to unmask
	* @param {Buffer} mask The mask to use
	* @public
	*/
	function _unmask(buffer, mask) {
		for (let i = 0; i < buffer.length; i++) buffer[i] ^= mask[i & 3];
	}
	/**
	* Converts a buffer to an `ArrayBuffer`.
	*
	* @param {Buffer} buf The buffer to convert
	* @return {ArrayBuffer} Converted buffer
	* @public
	*/
	function toArrayBuffer(buf) {
		if (buf.length === buf.buffer.byteLength) return buf.buffer;
		return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length);
	}
	/**
	* Converts `data` to a `Buffer`.
	*
	* @param {*} data The data to convert
	* @return {Buffer} The buffer
	* @throws {TypeError}
	* @public
	*/
	function toBuffer(data) {
		toBuffer.readOnly = true;
		if (Buffer.isBuffer(data)) return data;
		let buf;
		if (data instanceof ArrayBuffer) buf = new FastBuffer(data);
		else if (ArrayBuffer.isView(data)) buf = new FastBuffer(data.buffer, data.byteOffset, data.byteLength);
		else {
			buf = Buffer.from(data);
			toBuffer.readOnly = false;
		}
		return buf;
	}
	module.exports = {
		concat,
		mask: _mask,
		toArrayBuffer,
		toBuffer,
		unmask: _unmask
	};
	/* istanbul ignore else  */
	if (!process.env.WS_NO_BUFFER_UTIL) try {
		const bufferUtil = (init___vite_optional_peer_dep_bufferutil_ws(), __toCommonJS(__vite_optional_peer_dep_bufferutil_ws_exports));
		module.exports.mask = function(source, mask, output, offset, length) {
			if (length < 48) _mask(source, mask, output, offset, length);
			else bufferUtil.mask(source, mask, output, offset, length);
		};
		module.exports.unmask = function(buffer, mask) {
			if (buffer.length < 32) _unmask(buffer, mask);
			else bufferUtil.unmask(buffer, mask);
		};
	} catch (e) {}
}));
//#endregion
//#region node_modules/ws/lib/limiter.js
var require_limiter = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var kDone = Symbol("kDone");
	var kRun = Symbol("kRun");
	/**
	* A very simple job queue with adjustable concurrency. Adapted from
	* https://github.com/STRML/async-limiter
	*/
	var Limiter = class {
		/**
		* Creates a new `Limiter`.
		*
		* @param {Number} [concurrency=Infinity] The maximum number of jobs allowed
		*     to run concurrently
		*/
		constructor(concurrency) {
			this[kDone] = () => {
				this.pending--;
				this[kRun]();
			};
			this.concurrency = concurrency || Infinity;
			this.jobs = [];
			this.pending = 0;
		}
		/**
		* Adds a job to the queue.
		*
		* @param {Function} job The job to run
		* @public
		*/
		add(job) {
			this.jobs.push(job);
			this[kRun]();
		}
		/**
		* Removes a job from the queue and runs it if possible.
		*
		* @private
		*/
		[kRun]() {
			if (this.pending === this.concurrency) return;
			if (this.jobs.length) {
				const job = this.jobs.shift();
				this.pending++;
				job(this[kDone]);
			}
		}
	};
	module.exports = Limiter;
}));
//#endregion
//#region node_modules/ws/lib/permessage-deflate.js
var require_permessage_deflate = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var zlib = __require("zlib");
	var bufferUtil = require_buffer_util();
	var Limiter = require_limiter();
	var { kStatusCode } = require_constants();
	var FastBuffer = Buffer[Symbol.species];
	var TRAILER = Buffer.from([
		0,
		0,
		255,
		255
	]);
	var kPerMessageDeflate = Symbol("permessage-deflate");
	var kTotalLength = Symbol("total-length");
	var kCallback = Symbol("callback");
	var kBuffers = Symbol("buffers");
	var kError = Symbol("error");
	var zlibLimiter;
	/**
	* permessage-deflate implementation.
	*/
	var PerMessageDeflate = class {
		/**
		* Creates a PerMessageDeflate instance.
		*
		* @param {Object} [options] Configuration options
		* @param {(Boolean|Number)} [options.clientMaxWindowBits] Advertise support
		*     for, or request, a custom client window size
		* @param {Boolean} [options.clientNoContextTakeover=false] Advertise/
		*     acknowledge disabling of client context takeover
		* @param {Number} [options.concurrencyLimit=10] The number of concurrent
		*     calls to zlib
		* @param {Boolean} [options.isServer=false] Create the instance in either
		*     server or client mode
		* @param {Number} [options.maxPayload=0] The maximum allowed message length
		* @param {(Boolean|Number)} [options.serverMaxWindowBits] Request/confirm the
		*     use of a custom server window size
		* @param {Boolean} [options.serverNoContextTakeover=false] Request/accept
		*     disabling of server context takeover
		* @param {Number} [options.threshold=1024] Size (in bytes) below which
		*     messages should not be compressed if context takeover is disabled
		* @param {Object} [options.zlibDeflateOptions] Options to pass to zlib on
		*     deflate
		* @param {Object} [options.zlibInflateOptions] Options to pass to zlib on
		*     inflate
		*/
		constructor(options) {
			this._options = options || {};
			this._threshold = this._options.threshold !== void 0 ? this._options.threshold : 1024;
			this._maxPayload = this._options.maxPayload | 0;
			this._isServer = !!this._options.isServer;
			this._deflate = null;
			this._inflate = null;
			this.params = null;
			if (!zlibLimiter) zlibLimiter = new Limiter(this._options.concurrencyLimit !== void 0 ? this._options.concurrencyLimit : 10);
		}
		/**
		* @type {String}
		*/
		static get extensionName() {
			return "permessage-deflate";
		}
		/**
		* Create an extension negotiation offer.
		*
		* @return {Object} Extension parameters
		* @public
		*/
		offer() {
			const params = {};
			if (this._options.serverNoContextTakeover) params.server_no_context_takeover = true;
			if (this._options.clientNoContextTakeover) params.client_no_context_takeover = true;
			if (this._options.serverMaxWindowBits) params.server_max_window_bits = this._options.serverMaxWindowBits;
			if (this._options.clientMaxWindowBits) params.client_max_window_bits = this._options.clientMaxWindowBits;
			else if (this._options.clientMaxWindowBits == null) params.client_max_window_bits = true;
			return params;
		}
		/**
		* Accept an extension negotiation offer/response.
		*
		* @param {Array} configurations The extension negotiation offers/reponse
		* @return {Object} Accepted configuration
		* @public
		*/
		accept(configurations) {
			configurations = this.normalizeParams(configurations);
			this.params = this._isServer ? this.acceptAsServer(configurations) : this.acceptAsClient(configurations);
			return this.params;
		}
		/**
		* Releases all resources used by the extension.
		*
		* @public
		*/
		cleanup() {
			if (this._inflate) {
				this._inflate.close();
				this._inflate = null;
			}
			if (this._deflate) {
				const callback = this._deflate[kCallback];
				this._deflate.close();
				this._deflate = null;
				if (callback) callback(/* @__PURE__ */ new Error("The deflate stream was closed while data was being processed"));
			}
		}
		/**
		*  Accept an extension negotiation offer.
		*
		* @param {Array} offers The extension negotiation offers
		* @return {Object} Accepted configuration
		* @private
		*/
		acceptAsServer(offers) {
			const opts = this._options;
			const accepted = offers.find((params) => {
				if (opts.serverNoContextTakeover === false && params.server_no_context_takeover || params.server_max_window_bits && (opts.serverMaxWindowBits === false || typeof opts.serverMaxWindowBits === "number" && opts.serverMaxWindowBits > params.server_max_window_bits) || typeof opts.clientMaxWindowBits === "number" && (typeof params.client_max_window_bits === "number" ? opts.clientMaxWindowBits > params.client_max_window_bits : !params.client_max_window_bits)) return false;
				return true;
			});
			if (!accepted) throw new Error("None of the extension offers can be accepted");
			if (opts.serverNoContextTakeover) accepted.server_no_context_takeover = true;
			if (opts.clientNoContextTakeover) accepted.client_no_context_takeover = true;
			if (typeof opts.serverMaxWindowBits === "number") accepted.server_max_window_bits = opts.serverMaxWindowBits;
			if (typeof opts.clientMaxWindowBits === "number") accepted.client_max_window_bits = opts.clientMaxWindowBits;
			else if (accepted.client_max_window_bits === true || opts.clientMaxWindowBits === false) delete accepted.client_max_window_bits;
			return accepted;
		}
		/**
		* Accept the extension negotiation response.
		*
		* @param {Array} response The extension negotiation response
		* @return {Object} Accepted configuration
		* @private
		*/
		acceptAsClient(response) {
			const params = response[0];
			if (this._options.clientNoContextTakeover === false && params.client_no_context_takeover) throw new Error("Unexpected parameter \"client_no_context_takeover\"");
			if (!params.client_max_window_bits) {
				if (typeof this._options.clientMaxWindowBits === "number") params.client_max_window_bits = this._options.clientMaxWindowBits;
			} else if (this._options.clientMaxWindowBits === false || typeof this._options.clientMaxWindowBits === "number" && params.client_max_window_bits > this._options.clientMaxWindowBits) throw new Error("Unexpected or invalid parameter \"client_max_window_bits\"");
			return params;
		}
		/**
		* Normalize parameters.
		*
		* @param {Array} configurations The extension negotiation offers/reponse
		* @return {Array} The offers/response with normalized parameters
		* @private
		*/
		normalizeParams(configurations) {
			configurations.forEach((params) => {
				Object.keys(params).forEach((key) => {
					let value = params[key];
					if (value.length > 1) throw new Error(`Parameter "${key}" must have only a single value`);
					value = value[0];
					if (key === "client_max_window_bits") {
						if (value !== true) {
							const num = +value;
							if (!Number.isInteger(num) || num < 8 || num > 15) throw new TypeError(`Invalid value for parameter "${key}": ${value}`);
							value = num;
						} else if (!this._isServer) throw new TypeError(`Invalid value for parameter "${key}": ${value}`);
					} else if (key === "server_max_window_bits") {
						const num = +value;
						if (!Number.isInteger(num) || num < 8 || num > 15) throw new TypeError(`Invalid value for parameter "${key}": ${value}`);
						value = num;
					} else if (key === "client_no_context_takeover" || key === "server_no_context_takeover") {
						if (value !== true) throw new TypeError(`Invalid value for parameter "${key}": ${value}`);
					} else throw new Error(`Unknown parameter "${key}"`);
					params[key] = value;
				});
			});
			return configurations;
		}
		/**
		* Decompress data. Concurrency limited.
		*
		* @param {Buffer} data Compressed data
		* @param {Boolean} fin Specifies whether or not this is the last fragment
		* @param {Function} callback Callback
		* @public
		*/
		decompress(data, fin, callback) {
			zlibLimiter.add((done) => {
				this._decompress(data, fin, (err, result) => {
					done();
					callback(err, result);
				});
			});
		}
		/**
		* Compress data. Concurrency limited.
		*
		* @param {(Buffer|String)} data Data to compress
		* @param {Boolean} fin Specifies whether or not this is the last fragment
		* @param {Function} callback Callback
		* @public
		*/
		compress(data, fin, callback) {
			zlibLimiter.add((done) => {
				this._compress(data, fin, (err, result) => {
					done();
					callback(err, result);
				});
			});
		}
		/**
		* Decompress data.
		*
		* @param {Buffer} data Compressed data
		* @param {Boolean} fin Specifies whether or not this is the last fragment
		* @param {Function} callback Callback
		* @private
		*/
		_decompress(data, fin, callback) {
			const endpoint = this._isServer ? "client" : "server";
			if (!this._inflate) {
				const key = `${endpoint}_max_window_bits`;
				const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
				this._inflate = zlib.createInflateRaw({
					...this._options.zlibInflateOptions,
					windowBits
				});
				this._inflate[kPerMessageDeflate] = this;
				this._inflate[kTotalLength] = 0;
				this._inflate[kBuffers] = [];
				this._inflate.on("error", inflateOnError);
				this._inflate.on("data", inflateOnData);
			}
			this._inflate[kCallback] = callback;
			this._inflate.write(data);
			if (fin) this._inflate.write(TRAILER);
			this._inflate.flush(() => {
				const err = this._inflate[kError];
				if (err) {
					this._inflate.close();
					this._inflate = null;
					callback(err);
					return;
				}
				const data = bufferUtil.concat(this._inflate[kBuffers], this._inflate[kTotalLength]);
				if (this._inflate._readableState.endEmitted) {
					this._inflate.close();
					this._inflate = null;
				} else {
					this._inflate[kTotalLength] = 0;
					this._inflate[kBuffers] = [];
					if (fin && this.params[`${endpoint}_no_context_takeover`]) this._inflate.reset();
				}
				callback(null, data);
			});
		}
		/**
		* Compress data.
		*
		* @param {(Buffer|String)} data Data to compress
		* @param {Boolean} fin Specifies whether or not this is the last fragment
		* @param {Function} callback Callback
		* @private
		*/
		_compress(data, fin, callback) {
			const endpoint = this._isServer ? "server" : "client";
			if (!this._deflate) {
				const key = `${endpoint}_max_window_bits`;
				const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
				this._deflate = zlib.createDeflateRaw({
					...this._options.zlibDeflateOptions,
					windowBits
				});
				this._deflate[kTotalLength] = 0;
				this._deflate[kBuffers] = [];
				this._deflate.on("data", deflateOnData);
			}
			this._deflate[kCallback] = callback;
			this._deflate.write(data);
			this._deflate.flush(zlib.Z_SYNC_FLUSH, () => {
				if (!this._deflate) return;
				let data = bufferUtil.concat(this._deflate[kBuffers], this._deflate[kTotalLength]);
				if (fin) data = new FastBuffer(data.buffer, data.byteOffset, data.length - 4);
				this._deflate[kCallback] = null;
				this._deflate[kTotalLength] = 0;
				this._deflate[kBuffers] = [];
				if (fin && this.params[`${endpoint}_no_context_takeover`]) this._deflate.reset();
				callback(null, data);
			});
		}
	};
	module.exports = PerMessageDeflate;
	/**
	* The listener of the `zlib.DeflateRaw` stream `'data'` event.
	*
	* @param {Buffer} chunk A chunk of data
	* @private
	*/
	function deflateOnData(chunk) {
		this[kBuffers].push(chunk);
		this[kTotalLength] += chunk.length;
	}
	/**
	* The listener of the `zlib.InflateRaw` stream `'data'` event.
	*
	* @param {Buffer} chunk A chunk of data
	* @private
	*/
	function inflateOnData(chunk) {
		this[kTotalLength] += chunk.length;
		if (this[kPerMessageDeflate]._maxPayload < 1 || this[kTotalLength] <= this[kPerMessageDeflate]._maxPayload) {
			this[kBuffers].push(chunk);
			return;
		}
		this[kError] = /* @__PURE__ */ new RangeError("Max payload size exceeded");
		this[kError].code = "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH";
		this[kError][kStatusCode] = 1009;
		this.removeListener("data", inflateOnData);
		this.reset();
	}
	/**
	* The listener of the `zlib.InflateRaw` stream `'error'` event.
	*
	* @param {Error} err The emitted error
	* @private
	*/
	function inflateOnError(err) {
		this[kPerMessageDeflate]._inflate = null;
		if (this[kError]) {
			this[kCallback](this[kError]);
			return;
		}
		err[kStatusCode] = 1007;
		this[kCallback](err);
	}
}));
//#endregion
//#region node_modules/ws/lib/validation.js
var require_validation = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { isUtf8 } = __require("buffer");
	var { hasBlob } = require_constants();
	var tokenChars = [
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		1,
		0,
		1,
		1,
		1,
		1,
		1,
		0,
		0,
		1,
		1,
		0,
		1,
		1,
		0,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		0,
		0,
		0,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		0,
		1,
		0,
		1,
		0
	];
	/**
	* Checks if a status code is allowed in a close frame.
	*
	* @param {Number} code The status code
	* @return {Boolean} `true` if the status code is valid, else `false`
	* @public
	*/
	function isValidStatusCode(code) {
		return code >= 1e3 && code <= 1014 && code !== 1004 && code !== 1005 && code !== 1006 || code >= 3e3 && code <= 4999;
	}
	/**
	* Checks if a given buffer contains only correct UTF-8.
	* Ported from https://www.cl.cam.ac.uk/%7Emgk25/ucs/utf8_check.c by
	* Markus Kuhn.
	*
	* @param {Buffer} buf The buffer to check
	* @return {Boolean} `true` if `buf` contains only correct UTF-8, else `false`
	* @public
	*/
	function _isValidUTF8(buf) {
		const len = buf.length;
		let i = 0;
		while (i < len) if ((buf[i] & 128) === 0) i++;
		else if ((buf[i] & 224) === 192) {
			if (i + 1 === len || (buf[i + 1] & 192) !== 128 || (buf[i] & 254) === 192) return false;
			i += 2;
		} else if ((buf[i] & 240) === 224) {
			if (i + 2 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || buf[i] === 224 && (buf[i + 1] & 224) === 128 || buf[i] === 237 && (buf[i + 1] & 224) === 160) return false;
			i += 3;
		} else if ((buf[i] & 248) === 240) {
			if (i + 3 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || (buf[i + 3] & 192) !== 128 || buf[i] === 240 && (buf[i + 1] & 240) === 128 || buf[i] === 244 && buf[i + 1] > 143 || buf[i] > 244) return false;
			i += 4;
		} else return false;
		return true;
	}
	/**
	* Determines whether a value is a `Blob`.
	*
	* @param {*} value The value to be tested
	* @return {Boolean} `true` if `value` is a `Blob`, else `false`
	* @private
	*/
	function isBlob(value) {
		return hasBlob && typeof value === "object" && typeof value.arrayBuffer === "function" && typeof value.type === "string" && typeof value.stream === "function" && (value[Symbol.toStringTag] === "Blob" || value[Symbol.toStringTag] === "File");
	}
	module.exports = {
		isBlob,
		isValidStatusCode,
		isValidUTF8: _isValidUTF8,
		tokenChars
	};
	if (isUtf8) module.exports.isValidUTF8 = function(buf) {
		return buf.length < 24 ? _isValidUTF8(buf) : isUtf8(buf);
	};
	else if (!process.env.WS_NO_UTF_8_VALIDATE) try {
		const isValidUTF8 = (init___vite_optional_peer_dep_utf_8_validate_ws(), __toCommonJS(__vite_optional_peer_dep_utf_8_validate_ws_exports));
		module.exports.isValidUTF8 = function(buf) {
			return buf.length < 32 ? _isValidUTF8(buf) : isValidUTF8(buf);
		};
	} catch (e) {}
}));
//#endregion
//#region node_modules/ws/lib/receiver.js
var require_receiver = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { Writable } = __require("stream");
	var PerMessageDeflate = require_permessage_deflate();
	var { BINARY_TYPES, EMPTY_BUFFER, kStatusCode, kWebSocket } = require_constants();
	var { concat, toArrayBuffer, unmask } = require_buffer_util();
	var { isValidStatusCode, isValidUTF8 } = require_validation();
	var FastBuffer = Buffer[Symbol.species];
	var GET_INFO = 0;
	var GET_PAYLOAD_LENGTH_16 = 1;
	var GET_PAYLOAD_LENGTH_64 = 2;
	var GET_MASK = 3;
	var GET_DATA = 4;
	var INFLATING = 5;
	var DEFER_EVENT = 6;
	/**
	* HyBi Receiver implementation.
	*
	* @extends Writable
	*/
	var Receiver = class extends Writable {
		/**
		* Creates a Receiver instance.
		*
		* @param {Object} [options] Options object
		* @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
		*     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
		*     multiple times in the same tick
		* @param {String} [options.binaryType=nodebuffer] The type for binary data
		* @param {Object} [options.extensions] An object containing the negotiated
		*     extensions
		* @param {Boolean} [options.isServer=false] Specifies whether to operate in
		*     client or server mode
		* @param {Number} [options.maxBufferedChunks=0] The maximum number of
		*     buffered data chunks
		* @param {Number} [options.maxFragments=0] The maximum number of message
		*     fragments
		* @param {Number} [options.maxPayload=0] The maximum allowed message length
		* @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
		*     not to skip UTF-8 validation for text and close messages
		*/
		constructor(options = {}) {
			super();
			this._allowSynchronousEvents = options.allowSynchronousEvents !== void 0 ? options.allowSynchronousEvents : true;
			this._binaryType = options.binaryType || BINARY_TYPES[0];
			this._extensions = options.extensions || {};
			this._isServer = !!options.isServer;
			this._maxBufferedChunks = options.maxBufferedChunks | 0;
			this._maxFragments = options.maxFragments | 0;
			this._maxPayload = options.maxPayload | 0;
			this._skipUTF8Validation = !!options.skipUTF8Validation;
			this[kWebSocket] = void 0;
			this._bufferedBytes = 0;
			this._buffers = [];
			this._compressed = false;
			this._payloadLength = 0;
			this._mask = void 0;
			this._fragmented = 0;
			this._masked = false;
			this._fin = false;
			this._opcode = 0;
			this._totalPayloadLength = 0;
			this._messageLength = 0;
			this._numFragments = 0;
			this._fragments = [];
			this._errored = false;
			this._loop = false;
			this._state = GET_INFO;
		}
		/**
		* Implements `Writable.prototype._write()`.
		*
		* @param {Buffer} chunk The chunk of data to write
		* @param {String} encoding The character encoding of `chunk`
		* @param {Function} cb Callback
		* @private
		*/
		_write(chunk, encoding, cb) {
			if (this._opcode === 8 && this._state == GET_INFO) return cb();
			if (this._maxBufferedChunks > 0 && this._buffers.length >= this._maxBufferedChunks) {
				cb(this.createError(RangeError, "Too many buffered chunks", false, 1008, "WS_ERR_TOO_MANY_BUFFERED_PARTS"));
				return;
			}
			this._bufferedBytes += chunk.length;
			this._buffers.push(chunk);
			this.startLoop(cb);
		}
		/**
		* Consumes `n` bytes from the buffered data.
		*
		* @param {Number} n The number of bytes to consume
		* @return {Buffer} The consumed bytes
		* @private
		*/
		consume(n) {
			this._bufferedBytes -= n;
			if (n === this._buffers[0].length) return this._buffers.shift();
			if (n < this._buffers[0].length) {
				const buf = this._buffers[0];
				this._buffers[0] = new FastBuffer(buf.buffer, buf.byteOffset + n, buf.length - n);
				return new FastBuffer(buf.buffer, buf.byteOffset, n);
			}
			const dst = Buffer.allocUnsafe(n);
			do {
				const buf = this._buffers[0];
				const offset = dst.length - n;
				if (n >= buf.length) dst.set(this._buffers.shift(), offset);
				else {
					dst.set(new Uint8Array(buf.buffer, buf.byteOffset, n), offset);
					this._buffers[0] = new FastBuffer(buf.buffer, buf.byteOffset + n, buf.length - n);
				}
				n -= buf.length;
			} while (n > 0);
			return dst;
		}
		/**
		* Starts the parsing loop.
		*
		* @param {Function} cb Callback
		* @private
		*/
		startLoop(cb) {
			this._loop = true;
			do
				switch (this._state) {
					case GET_INFO:
						this.getInfo(cb);
						break;
					case GET_PAYLOAD_LENGTH_16:
						this.getPayloadLength16(cb);
						break;
					case GET_PAYLOAD_LENGTH_64:
						this.getPayloadLength64(cb);
						break;
					case GET_MASK:
						this.getMask();
						break;
					case GET_DATA:
						this.getData(cb);
						break;
					case INFLATING:
					case DEFER_EVENT:
						this._loop = false;
						return;
				}
			while (this._loop);
			if (!this._errored) cb();
		}
		/**
		* Reads the first two bytes of a frame.
		*
		* @param {Function} cb Callback
		* @private
		*/
		getInfo(cb) {
			if (this._bufferedBytes < 2) {
				this._loop = false;
				return;
			}
			const buf = this.consume(2);
			if ((buf[0] & 48) !== 0) {
				cb(this.createError(RangeError, "RSV2 and RSV3 must be clear", true, 1002, "WS_ERR_UNEXPECTED_RSV_2_3"));
				return;
			}
			const compressed = (buf[0] & 64) === 64;
			if (compressed && !this._extensions[PerMessageDeflate.extensionName]) {
				cb(this.createError(RangeError, "RSV1 must be clear", true, 1002, "WS_ERR_UNEXPECTED_RSV_1"));
				return;
			}
			this._fin = (buf[0] & 128) === 128;
			this._opcode = buf[0] & 15;
			this._payloadLength = buf[1] & 127;
			if (this._opcode === 0) {
				if (compressed) {
					cb(this.createError(RangeError, "RSV1 must be clear", true, 1002, "WS_ERR_UNEXPECTED_RSV_1"));
					return;
				}
				if (!this._fragmented) {
					cb(this.createError(RangeError, "invalid opcode 0", true, 1002, "WS_ERR_INVALID_OPCODE"));
					return;
				}
				this._opcode = this._fragmented;
			} else if (this._opcode === 1 || this._opcode === 2) {
				if (this._fragmented) {
					cb(this.createError(RangeError, `invalid opcode ${this._opcode}`, true, 1002, "WS_ERR_INVALID_OPCODE"));
					return;
				}
				this._compressed = compressed;
			} else if (this._opcode > 7 && this._opcode < 11) {
				if (!this._fin) {
					cb(this.createError(RangeError, "FIN must be set", true, 1002, "WS_ERR_EXPECTED_FIN"));
					return;
				}
				if (compressed) {
					cb(this.createError(RangeError, "RSV1 must be clear", true, 1002, "WS_ERR_UNEXPECTED_RSV_1"));
					return;
				}
				if (this._payloadLength > 125 || this._opcode === 8 && this._payloadLength === 1) {
					cb(this.createError(RangeError, `invalid payload length ${this._payloadLength}`, true, 1002, "WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH"));
					return;
				}
			} else {
				cb(this.createError(RangeError, `invalid opcode ${this._opcode}`, true, 1002, "WS_ERR_INVALID_OPCODE"));
				return;
			}
			if (!this._fin && !this._fragmented) this._fragmented = this._opcode;
			this._masked = (buf[1] & 128) === 128;
			if (this._isServer) {
				if (!this._masked) {
					cb(this.createError(RangeError, "MASK must be set", true, 1002, "WS_ERR_EXPECTED_MASK"));
					return;
				}
			} else if (this._masked) {
				cb(this.createError(RangeError, "MASK must be clear", true, 1002, "WS_ERR_UNEXPECTED_MASK"));
				return;
			}
			if (this._payloadLength === 126) this._state = GET_PAYLOAD_LENGTH_16;
			else if (this._payloadLength === 127) this._state = GET_PAYLOAD_LENGTH_64;
			else this.haveLength(cb);
		}
		/**
		* Gets extended payload length (7+16).
		*
		* @param {Function} cb Callback
		* @private
		*/
		getPayloadLength16(cb) {
			if (this._bufferedBytes < 2) {
				this._loop = false;
				return;
			}
			this._payloadLength = this.consume(2).readUInt16BE(0);
			this.haveLength(cb);
		}
		/**
		* Gets extended payload length (7+64).
		*
		* @param {Function} cb Callback
		* @private
		*/
		getPayloadLength64(cb) {
			if (this._bufferedBytes < 8) {
				this._loop = false;
				return;
			}
			const buf = this.consume(8);
			const num = buf.readUInt32BE(0);
			if (num > Math.pow(2, 21) - 1) {
				cb(this.createError(RangeError, "Unsupported WebSocket frame: payload length > 2^53 - 1", false, 1009, "WS_ERR_UNSUPPORTED_DATA_PAYLOAD_LENGTH"));
				return;
			}
			this._payloadLength = num * Math.pow(2, 32) + buf.readUInt32BE(4);
			this.haveLength(cb);
		}
		/**
		* Payload length has been read.
		*
		* @param {Function} cb Callback
		* @private
		*/
		haveLength(cb) {
			if (this._payloadLength && this._opcode < 8) {
				this._totalPayloadLength += this._payloadLength;
				if (this._totalPayloadLength > this._maxPayload && this._maxPayload > 0) {
					cb(this.createError(RangeError, "Max payload size exceeded", false, 1009, "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"));
					return;
				}
			}
			if (this._masked) this._state = GET_MASK;
			else this._state = GET_DATA;
		}
		/**
		* Reads mask bytes.
		*
		* @private
		*/
		getMask() {
			if (this._bufferedBytes < 4) {
				this._loop = false;
				return;
			}
			this._mask = this.consume(4);
			this._state = GET_DATA;
		}
		/**
		* Reads data bytes.
		*
		* @param {Function} cb Callback
		* @private
		*/
		getData(cb) {
			let data = EMPTY_BUFFER;
			if (this._payloadLength) {
				if (this._bufferedBytes < this._payloadLength) {
					this._loop = false;
					return;
				}
				data = this.consume(this._payloadLength);
				if (this._masked && (this._mask[0] | this._mask[1] | this._mask[2] | this._mask[3]) !== 0) unmask(data, this._mask);
			}
			if (this._opcode > 7) {
				this.controlMessage(data, cb);
				return;
			}
			if (this._maxFragments > 0 && ++this._numFragments > this._maxFragments) {
				cb(this.createError(RangeError, "Too many message fragments", false, 1008, "WS_ERR_TOO_MANY_BUFFERED_PARTS"));
				return;
			}
			if (this._compressed) {
				this._state = INFLATING;
				this.decompress(data, cb);
				return;
			}
			if (data.length) {
				this._messageLength = this._totalPayloadLength;
				this._fragments.push(data);
			}
			this.dataMessage(cb);
		}
		/**
		* Decompresses data.
		*
		* @param {Buffer} data Compressed data
		* @param {Function} cb Callback
		* @private
		*/
		decompress(data, cb) {
			this._extensions[PerMessageDeflate.extensionName].decompress(data, this._fin, (err, buf) => {
				if (err) return cb(err);
				if (buf.length) {
					this._messageLength += buf.length;
					if (this._messageLength > this._maxPayload && this._maxPayload > 0) {
						cb(this.createError(RangeError, "Max payload size exceeded", false, 1009, "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"));
						return;
					}
					this._fragments.push(buf);
				}
				this.dataMessage(cb);
				if (this._state === GET_INFO) this.startLoop(cb);
			});
		}
		/**
		* Handles a data message.
		*
		* @param {Function} cb Callback
		* @private
		*/
		dataMessage(cb) {
			if (!this._fin) {
				this._state = GET_INFO;
				return;
			}
			const messageLength = this._messageLength;
			const fragments = this._fragments;
			this._totalPayloadLength = 0;
			this._messageLength = 0;
			this._fragmented = 0;
			this._numFragments = 0;
			this._fragments = [];
			if (this._opcode === 2) {
				let data;
				if (this._binaryType === "nodebuffer") data = concat(fragments, messageLength);
				else if (this._binaryType === "arraybuffer") data = toArrayBuffer(concat(fragments, messageLength));
				else if (this._binaryType === "blob") data = new Blob(fragments);
				else data = fragments;
				if (this._allowSynchronousEvents) {
					this.emit("message", data, true);
					this._state = GET_INFO;
				} else {
					this._state = DEFER_EVENT;
					setImmediate(() => {
						this.emit("message", data, true);
						this._state = GET_INFO;
						this.startLoop(cb);
					});
				}
			} else {
				const buf = concat(fragments, messageLength);
				if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
					cb(this.createError(Error, "invalid UTF-8 sequence", true, 1007, "WS_ERR_INVALID_UTF8"));
					return;
				}
				if (this._state === INFLATING || this._allowSynchronousEvents) {
					this.emit("message", buf, false);
					this._state = GET_INFO;
				} else {
					this._state = DEFER_EVENT;
					setImmediate(() => {
						this.emit("message", buf, false);
						this._state = GET_INFO;
						this.startLoop(cb);
					});
				}
			}
		}
		/**
		* Handles a control message.
		*
		* @param {Buffer} data Data to handle
		* @return {(Error|RangeError|undefined)} A possible error
		* @private
		*/
		controlMessage(data, cb) {
			if (this._opcode === 8) {
				if (data.length === 0) {
					this._loop = false;
					this.emit("conclude", 1005, EMPTY_BUFFER);
					this.end();
				} else {
					const code = data.readUInt16BE(0);
					if (!isValidStatusCode(code)) {
						cb(this.createError(RangeError, `invalid status code ${code}`, true, 1002, "WS_ERR_INVALID_CLOSE_CODE"));
						return;
					}
					const buf = new FastBuffer(data.buffer, data.byteOffset + 2, data.length - 2);
					if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
						cb(this.createError(Error, "invalid UTF-8 sequence", true, 1007, "WS_ERR_INVALID_UTF8"));
						return;
					}
					this._loop = false;
					this.emit("conclude", code, buf);
					this.end();
				}
				this._state = GET_INFO;
				return;
			}
			if (this._allowSynchronousEvents) {
				this.emit(this._opcode === 9 ? "ping" : "pong", data);
				this._state = GET_INFO;
			} else {
				this._state = DEFER_EVENT;
				setImmediate(() => {
					this.emit(this._opcode === 9 ? "ping" : "pong", data);
					this._state = GET_INFO;
					this.startLoop(cb);
				});
			}
		}
		/**
		* Builds an error object.
		*
		* @param {function(new:Error|RangeError)} ErrorCtor The error constructor
		* @param {String} message The error message
		* @param {Boolean} prefix Specifies whether or not to add a default prefix to
		*     `message`
		* @param {Number} statusCode The status code
		* @param {String} errorCode The exposed error code
		* @return {(Error|RangeError)} The error
		* @private
		*/
		createError(ErrorCtor, message, prefix, statusCode, errorCode) {
			this._loop = false;
			this._errored = true;
			const err = new ErrorCtor(prefix ? `Invalid WebSocket frame: ${message}` : message);
			Error.captureStackTrace(err, this.createError);
			err.code = errorCode;
			err[kStatusCode] = statusCode;
			return err;
		}
	};
	module.exports = Receiver;
}));
//#endregion
//#region node_modules/ws/lib/sender.js
var require_sender = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { Duplex: Duplex$3 } = __require("stream");
	var { randomFillSync } = __require("crypto");
	var { types: { isUint8Array } } = __require("util");
	var PerMessageDeflate = require_permessage_deflate();
	var { EMPTY_BUFFER, kWebSocket, NOOP } = require_constants();
	var { isBlob, isValidStatusCode } = require_validation();
	var { mask: applyMask, toBuffer } = require_buffer_util();
	var kByteLength = Symbol("kByteLength");
	var maskBuffer = Buffer.alloc(4);
	var RANDOM_POOL_SIZE = 8192;
	var randomPool;
	var randomPoolPointer = RANDOM_POOL_SIZE;
	var DEFAULT = 0;
	var DEFLATING = 1;
	var GET_BLOB_DATA = 2;
	module.exports = class Sender {
		/**
		* Creates a Sender instance.
		*
		* @param {Duplex} socket The connection socket
		* @param {Object} [extensions] An object containing the negotiated extensions
		* @param {Function} [generateMask] The function used to generate the masking
		*     key
		*/
		constructor(socket, extensions, generateMask) {
			this._extensions = extensions || {};
			if (generateMask) {
				this._generateMask = generateMask;
				this._maskBuffer = Buffer.alloc(4);
			}
			this._socket = socket;
			this._firstFragment = true;
			this._compress = false;
			this._bufferedBytes = 0;
			this._queue = [];
			this._state = DEFAULT;
			this.onerror = NOOP;
			this[kWebSocket] = void 0;
		}
		/**
		* Frames a piece of data according to the HyBi WebSocket protocol.
		*
		* @param {(Buffer|String)} data The data to frame
		* @param {Object} options Options object
		* @param {Boolean} [options.fin=false] Specifies whether or not to set the
		*     FIN bit
		* @param {Function} [options.generateMask] The function used to generate the
		*     masking key
		* @param {Boolean} [options.mask=false] Specifies whether or not to mask
		*     `data`
		* @param {Buffer} [options.maskBuffer] The buffer used to store the masking
		*     key
		* @param {Number} options.opcode The opcode
		* @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
		*     modified
		* @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
		*     RSV1 bit
		* @return {(Buffer|String)[]} The framed data
		* @public
		*/
		static frame(data, options) {
			let mask;
			let merge = false;
			let offset = 2;
			let skipMasking = false;
			if (options.mask) {
				mask = options.maskBuffer || maskBuffer;
				if (options.generateMask) options.generateMask(mask);
				else {
					if (randomPoolPointer === RANDOM_POOL_SIZE) {
						/* istanbul ignore else  */
						if (randomPool === void 0) randomPool = Buffer.alloc(RANDOM_POOL_SIZE);
						randomFillSync(randomPool, 0, RANDOM_POOL_SIZE);
						randomPoolPointer = 0;
					}
					mask[0] = randomPool[randomPoolPointer++];
					mask[1] = randomPool[randomPoolPointer++];
					mask[2] = randomPool[randomPoolPointer++];
					mask[3] = randomPool[randomPoolPointer++];
				}
				skipMasking = (mask[0] | mask[1] | mask[2] | mask[3]) === 0;
				offset = 6;
			}
			let dataLength;
			if (typeof data === "string") {
				if ((!options.mask || skipMasking) && options[kByteLength] !== void 0) dataLength = options[kByteLength];
				else {
					data = Buffer.from(data);
					dataLength = data.length;
				}
			} else {
				dataLength = data.length;
				merge = options.mask && options.readOnly && !skipMasking;
			}
			let payloadLength = dataLength;
			if (dataLength >= 65536) {
				offset += 8;
				payloadLength = 127;
			} else if (dataLength > 125) {
				offset += 2;
				payloadLength = 126;
			}
			const target = Buffer.allocUnsafe(merge ? dataLength + offset : offset);
			target[0] = options.fin ? options.opcode | 128 : options.opcode;
			if (options.rsv1) target[0] |= 64;
			target[1] = payloadLength;
			if (payloadLength === 126) target.writeUInt16BE(dataLength, 2);
			else if (payloadLength === 127) {
				target[2] = target[3] = 0;
				target.writeUIntBE(dataLength, 4, 6);
			}
			if (!options.mask) return [target, data];
			target[1] |= 128;
			target[offset - 4] = mask[0];
			target[offset - 3] = mask[1];
			target[offset - 2] = mask[2];
			target[offset - 1] = mask[3];
			if (skipMasking) return [target, data];
			if (merge) {
				applyMask(data, mask, target, offset, dataLength);
				return [target];
			}
			applyMask(data, mask, data, 0, dataLength);
			return [target, data];
		}
		/**
		* Sends a close message to the other peer.
		*
		* @param {Number} [code] The status code component of the body
		* @param {(String|Buffer)} [data] The message component of the body
		* @param {Boolean} [mask=false] Specifies whether or not to mask the message
		* @param {Function} [cb] Callback
		* @public
		*/
		close(code, data, mask, cb) {
			let buf;
			if (code === void 0) buf = EMPTY_BUFFER;
			else if (typeof code !== "number" || !isValidStatusCode(code)) throw new TypeError("First argument must be a valid error code number");
			else if (data === void 0 || !data.length) {
				buf = Buffer.allocUnsafe(2);
				buf.writeUInt16BE(code, 0);
			} else {
				const length = Buffer.byteLength(data);
				if (length > 123) throw new RangeError("The message must not be greater than 123 bytes");
				buf = Buffer.allocUnsafe(2 + length);
				buf.writeUInt16BE(code, 0);
				if (typeof data === "string") buf.write(data, 2);
				else if (isUint8Array(data)) buf.set(data, 2);
				else throw new TypeError("Second argument must be a string or a Uint8Array");
			}
			const options = {
				[kByteLength]: buf.length,
				fin: true,
				generateMask: this._generateMask,
				mask,
				maskBuffer: this._maskBuffer,
				opcode: 8,
				readOnly: false,
				rsv1: false
			};
			if (this._state !== DEFAULT) this.enqueue([
				this.dispatch,
				buf,
				false,
				options,
				cb
			]);
			else this.sendFrame(Sender.frame(buf, options), cb);
		}
		/**
		* Sends a ping message to the other peer.
		*
		* @param {*} data The message to send
		* @param {Boolean} [mask=false] Specifies whether or not to mask `data`
		* @param {Function} [cb] Callback
		* @public
		*/
		ping(data, mask, cb) {
			let byteLength;
			let readOnly;
			if (typeof data === "string") {
				byteLength = Buffer.byteLength(data);
				readOnly = false;
			} else if (isBlob(data)) {
				byteLength = data.size;
				readOnly = false;
			} else {
				data = toBuffer(data);
				byteLength = data.length;
				readOnly = toBuffer.readOnly;
			}
			if (byteLength > 125) throw new RangeError("The data size must not be greater than 125 bytes");
			const options = {
				[kByteLength]: byteLength,
				fin: true,
				generateMask: this._generateMask,
				mask,
				maskBuffer: this._maskBuffer,
				opcode: 9,
				readOnly,
				rsv1: false
			};
			if (isBlob(data)) {
				if (this._state !== DEFAULT) this.enqueue([
					this.getBlobData,
					data,
					false,
					options,
					cb
				]);
				else this.getBlobData(data, false, options, cb);
			} else if (this._state !== DEFAULT) this.enqueue([
				this.dispatch,
				data,
				false,
				options,
				cb
			]);
			else this.sendFrame(Sender.frame(data, options), cb);
		}
		/**
		* Sends a pong message to the other peer.
		*
		* @param {*} data The message to send
		* @param {Boolean} [mask=false] Specifies whether or not to mask `data`
		* @param {Function} [cb] Callback
		* @public
		*/
		pong(data, mask, cb) {
			let byteLength;
			let readOnly;
			if (typeof data === "string") {
				byteLength = Buffer.byteLength(data);
				readOnly = false;
			} else if (isBlob(data)) {
				byteLength = data.size;
				readOnly = false;
			} else {
				data = toBuffer(data);
				byteLength = data.length;
				readOnly = toBuffer.readOnly;
			}
			if (byteLength > 125) throw new RangeError("The data size must not be greater than 125 bytes");
			const options = {
				[kByteLength]: byteLength,
				fin: true,
				generateMask: this._generateMask,
				mask,
				maskBuffer: this._maskBuffer,
				opcode: 10,
				readOnly,
				rsv1: false
			};
			if (isBlob(data)) {
				if (this._state !== DEFAULT) this.enqueue([
					this.getBlobData,
					data,
					false,
					options,
					cb
				]);
				else this.getBlobData(data, false, options, cb);
			} else if (this._state !== DEFAULT) this.enqueue([
				this.dispatch,
				data,
				false,
				options,
				cb
			]);
			else this.sendFrame(Sender.frame(data, options), cb);
		}
		/**
		* Sends a data message to the other peer.
		*
		* @param {*} data The message to send
		* @param {Object} options Options object
		* @param {Boolean} [options.binary=false] Specifies whether `data` is binary
		*     or text
		* @param {Boolean} [options.compress=false] Specifies whether or not to
		*     compress `data`
		* @param {Boolean} [options.fin=false] Specifies whether the fragment is the
		*     last one
		* @param {Boolean} [options.mask=false] Specifies whether or not to mask
		*     `data`
		* @param {Function} [cb] Callback
		* @public
		*/
		send(data, options, cb) {
			const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
			let opcode = options.binary ? 2 : 1;
			let rsv1 = options.compress;
			let byteLength;
			let readOnly;
			if (typeof data === "string") {
				byteLength = Buffer.byteLength(data);
				readOnly = false;
			} else if (isBlob(data)) {
				byteLength = data.size;
				readOnly = false;
			} else {
				data = toBuffer(data);
				byteLength = data.length;
				readOnly = toBuffer.readOnly;
			}
			if (this._firstFragment) {
				this._firstFragment = false;
				if (rsv1 && perMessageDeflate && perMessageDeflate.params[perMessageDeflate._isServer ? "server_no_context_takeover" : "client_no_context_takeover"]) rsv1 = byteLength >= perMessageDeflate._threshold;
				this._compress = rsv1;
			} else {
				rsv1 = false;
				opcode = 0;
			}
			if (options.fin) this._firstFragment = true;
			const opts = {
				[kByteLength]: byteLength,
				fin: options.fin,
				generateMask: this._generateMask,
				mask: options.mask,
				maskBuffer: this._maskBuffer,
				opcode,
				readOnly,
				rsv1
			};
			if (isBlob(data)) {
				if (this._state !== DEFAULT) this.enqueue([
					this.getBlobData,
					data,
					this._compress,
					opts,
					cb
				]);
				else this.getBlobData(data, this._compress, opts, cb);
			} else if (this._state !== DEFAULT) this.enqueue([
				this.dispatch,
				data,
				this._compress,
				opts,
				cb
			]);
			else this.dispatch(data, this._compress, opts, cb);
		}
		/**
		* Gets the contents of a blob as binary data.
		*
		* @param {Blob} blob The blob
		* @param {Boolean} [compress=false] Specifies whether or not to compress
		*     the data
		* @param {Object} options Options object
		* @param {Boolean} [options.fin=false] Specifies whether or not to set the
		*     FIN bit
		* @param {Function} [options.generateMask] The function used to generate the
		*     masking key
		* @param {Boolean} [options.mask=false] Specifies whether or not to mask
		*     `data`
		* @param {Buffer} [options.maskBuffer] The buffer used to store the masking
		*     key
		* @param {Number} options.opcode The opcode
		* @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
		*     modified
		* @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
		*     RSV1 bit
		* @param {Function} [cb] Callback
		* @private
		*/
		getBlobData(blob, compress, options, cb) {
			this._bufferedBytes += options[kByteLength];
			this._state = GET_BLOB_DATA;
			blob.arrayBuffer().then((arrayBuffer) => {
				if (this._socket.destroyed) {
					const err = /* @__PURE__ */ new Error("The socket was closed while the blob was being read");
					process.nextTick(callCallbacks, this, err, cb);
					return;
				}
				this._bufferedBytes -= options[kByteLength];
				const data = toBuffer(arrayBuffer);
				if (!compress) {
					this._state = DEFAULT;
					this.sendFrame(Sender.frame(data, options), cb);
					this.dequeue();
				} else this.dispatch(data, compress, options, cb);
			}).catch((err) => {
				process.nextTick(onError, this, err, cb);
			});
		}
		/**
		* Dispatches a message.
		*
		* @param {(Buffer|String)} data The message to send
		* @param {Boolean} [compress=false] Specifies whether or not to compress
		*     `data`
		* @param {Object} options Options object
		* @param {Boolean} [options.fin=false] Specifies whether or not to set the
		*     FIN bit
		* @param {Function} [options.generateMask] The function used to generate the
		*     masking key
		* @param {Boolean} [options.mask=false] Specifies whether or not to mask
		*     `data`
		* @param {Buffer} [options.maskBuffer] The buffer used to store the masking
		*     key
		* @param {Number} options.opcode The opcode
		* @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
		*     modified
		* @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
		*     RSV1 bit
		* @param {Function} [cb] Callback
		* @private
		*/
		dispatch(data, compress, options, cb) {
			if (!compress) {
				this.sendFrame(Sender.frame(data, options), cb);
				return;
			}
			const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
			this._bufferedBytes += options[kByteLength];
			this._state = DEFLATING;
			perMessageDeflate.compress(data, options.fin, (_, buf) => {
				if (this._socket.destroyed) {
					const err = /* @__PURE__ */ new Error("The socket was closed while data was being compressed");
					callCallbacks(this, err, cb);
					return;
				}
				this._bufferedBytes -= options[kByteLength];
				this._state = DEFAULT;
				options.readOnly = false;
				this.sendFrame(Sender.frame(buf, options), cb);
				this.dequeue();
			});
		}
		/**
		* Executes queued send operations.
		*
		* @private
		*/
		dequeue() {
			while (this._state === DEFAULT && this._queue.length) {
				const params = this._queue.shift();
				this._bufferedBytes -= params[3][kByteLength];
				Reflect.apply(params[0], this, params.slice(1));
			}
		}
		/**
		* Enqueues a send operation.
		*
		* @param {Array} params Send operation parameters.
		* @private
		*/
		enqueue(params) {
			this._bufferedBytes += params[3][kByteLength];
			this._queue.push(params);
		}
		/**
		* Sends a frame.
		*
		* @param {(Buffer | String)[]} list The frame to send
		* @param {Function} [cb] Callback
		* @private
		*/
		sendFrame(list, cb) {
			if (list.length === 2) {
				this._socket.cork();
				this._socket.write(list[0]);
				this._socket.write(list[1], cb);
				this._socket.uncork();
			} else this._socket.write(list[0], cb);
		}
	};
	/**
	* Calls queued callbacks with an error.
	*
	* @param {Sender} sender The `Sender` instance
	* @param {Error} err The error to call the callbacks with
	* @param {Function} [cb] The first callback
	* @private
	*/
	function callCallbacks(sender, err, cb) {
		if (typeof cb === "function") cb(err);
		for (let i = 0; i < sender._queue.length; i++) {
			const params = sender._queue[i];
			const callback = params[params.length - 1];
			if (typeof callback === "function") callback(err);
		}
	}
	/**
	* Handles a `Sender` error.
	*
	* @param {Sender} sender The `Sender` instance
	* @param {Error} err The error
	* @param {Function} [cb] The first pending callback
	* @private
	*/
	function onError(sender, err, cb) {
		callCallbacks(sender, err, cb);
		sender.onerror(err);
	}
}));
//#endregion
//#region node_modules/ws/lib/event-target.js
var require_event_target = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { kForOnEventAttribute, kListener } = require_constants();
	var kCode = Symbol("kCode");
	var kData = Symbol("kData");
	var kError = Symbol("kError");
	var kMessage = Symbol("kMessage");
	var kReason = Symbol("kReason");
	var kTarget = Symbol("kTarget");
	var kType = Symbol("kType");
	var kWasClean = Symbol("kWasClean");
	/**
	* Class representing an event.
	*/
	var Event = class {
		/**
		* Create a new `Event`.
		*
		* @param {String} type The name of the event
		* @throws {TypeError} If the `type` argument is not specified
		*/
		constructor(type) {
			this[kTarget] = null;
			this[kType] = type;
		}
		/**
		* @type {*}
		*/
		get target() {
			return this[kTarget];
		}
		/**
		* @type {String}
		*/
		get type() {
			return this[kType];
		}
	};
	Object.defineProperty(Event.prototype, "target", { enumerable: true });
	Object.defineProperty(Event.prototype, "type", { enumerable: true });
	/**
	* Class representing a close event.
	*
	* @extends Event
	*/
	var CloseEvent = class extends Event {
		/**
		* Create a new `CloseEvent`.
		*
		* @param {String} type The name of the event
		* @param {Object} [options] A dictionary object that allows for setting
		*     attributes via object members of the same name
		* @param {Number} [options.code=0] The status code explaining why the
		*     connection was closed
		* @param {String} [options.reason=''] A human-readable string explaining why
		*     the connection was closed
		* @param {Boolean} [options.wasClean=false] Indicates whether or not the
		*     connection was cleanly closed
		*/
		constructor(type, options = {}) {
			super(type);
			this[kCode] = options.code === void 0 ? 0 : options.code;
			this[kReason] = options.reason === void 0 ? "" : options.reason;
			this[kWasClean] = options.wasClean === void 0 ? false : options.wasClean;
		}
		/**
		* @type {Number}
		*/
		get code() {
			return this[kCode];
		}
		/**
		* @type {String}
		*/
		get reason() {
			return this[kReason];
		}
		/**
		* @type {Boolean}
		*/
		get wasClean() {
			return this[kWasClean];
		}
	};
	Object.defineProperty(CloseEvent.prototype, "code", { enumerable: true });
	Object.defineProperty(CloseEvent.prototype, "reason", { enumerable: true });
	Object.defineProperty(CloseEvent.prototype, "wasClean", { enumerable: true });
	/**
	* Class representing an error event.
	*
	* @extends Event
	*/
	var ErrorEvent = class extends Event {
		/**
		* Create a new `ErrorEvent`.
		*
		* @param {String} type The name of the event
		* @param {Object} [options] A dictionary object that allows for setting
		*     attributes via object members of the same name
		* @param {*} [options.error=null] The error that generated this event
		* @param {String} [options.message=''] The error message
		*/
		constructor(type, options = {}) {
			super(type);
			this[kError] = options.error === void 0 ? null : options.error;
			this[kMessage] = options.message === void 0 ? "" : options.message;
		}
		/**
		* @type {*}
		*/
		get error() {
			return this[kError];
		}
		/**
		* @type {String}
		*/
		get message() {
			return this[kMessage];
		}
	};
	Object.defineProperty(ErrorEvent.prototype, "error", { enumerable: true });
	Object.defineProperty(ErrorEvent.prototype, "message", { enumerable: true });
	/**
	* Class representing a message event.
	*
	* @extends Event
	*/
	var MessageEvent = class extends Event {
		/**
		* Create a new `MessageEvent`.
		*
		* @param {String} type The name of the event
		* @param {Object} [options] A dictionary object that allows for setting
		*     attributes via object members of the same name
		* @param {*} [options.data=null] The message content
		*/
		constructor(type, options = {}) {
			super(type);
			this[kData] = options.data === void 0 ? null : options.data;
		}
		/**
		* @type {*}
		*/
		get data() {
			return this[kData];
		}
	};
	Object.defineProperty(MessageEvent.prototype, "data", { enumerable: true });
	module.exports = {
		CloseEvent,
		ErrorEvent,
		Event,
		EventTarget: {
			/**
			* Register an event listener.
			*
			* @param {String} type A string representing the event type to listen for
			* @param {(Function|Object)} handler The listener to add
			* @param {Object} [options] An options object specifies characteristics about
			*     the event listener
			* @param {Boolean} [options.once=false] A `Boolean` indicating that the
			*     listener should be invoked at most once after being added. If `true`,
			*     the listener would be automatically removed when invoked.
			* @public
			*/
			addEventListener(type, handler, options = {}) {
				for (const listener of this.listeners(type)) if (!options[kForOnEventAttribute] && listener[kListener] === handler && !listener[kForOnEventAttribute]) return;
				let wrapper;
				if (type === "message") wrapper = function onMessage(data, isBinary) {
					const event = new MessageEvent("message", { data: isBinary ? data : data.toString() });
					event[kTarget] = this;
					callListener(handler, this, event);
				};
				else if (type === "close") wrapper = function onClose(code, message) {
					const event = new CloseEvent("close", {
						code,
						reason: message.toString(),
						wasClean: this._closeFrameReceived && this._closeFrameSent
					});
					event[kTarget] = this;
					callListener(handler, this, event);
				};
				else if (type === "error") wrapper = function onError(error) {
					const event = new ErrorEvent("error", {
						error,
						message: error.message
					});
					event[kTarget] = this;
					callListener(handler, this, event);
				};
				else if (type === "open") wrapper = function onOpen() {
					const event = new Event("open");
					event[kTarget] = this;
					callListener(handler, this, event);
				};
				else return;
				wrapper[kForOnEventAttribute] = !!options[kForOnEventAttribute];
				wrapper[kListener] = handler;
				if (options.once) this.once(type, wrapper);
				else this.on(type, wrapper);
			},
			/**
			* Remove an event listener.
			*
			* @param {String} type A string representing the event type to remove
			* @param {(Function|Object)} handler The listener to remove
			* @public
			*/
			removeEventListener(type, handler) {
				for (const listener of this.listeners(type)) if (listener[kListener] === handler && !listener[kForOnEventAttribute]) {
					this.removeListener(type, listener);
					break;
				}
			}
		},
		MessageEvent
	};
	/**
	* Call an event listener
	*
	* @param {(Function|Object)} listener The listener to call
	* @param {*} thisArg The value to use as `this`` when calling the listener
	* @param {Event} event The event to pass to the listener
	* @private
	*/
	function callListener(listener, thisArg, event) {
		if (typeof listener === "object" && listener.handleEvent) listener.handleEvent.call(listener, event);
		else listener.call(thisArg, event);
	}
}));
//#endregion
//#region node_modules/ws/lib/extension.js
var require_extension = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { tokenChars } = require_validation();
	/**
	* Adds an offer to the map of extension offers or a parameter to the map of
	* parameters.
	*
	* @param {Object} dest The map of extension offers or parameters
	* @param {String} name The extension or parameter name
	* @param {(Object|Boolean|String)} elem The extension parameters or the
	*     parameter value
	* @private
	*/
	function push(dest, name, elem) {
		if (dest[name] === void 0) dest[name] = [elem];
		else dest[name].push(elem);
	}
	/**
	* Parses the `Sec-WebSocket-Extensions` header into an object.
	*
	* @param {String} header The field value of the header
	* @return {Object} The parsed object
	* @public
	*/
	function parse(header) {
		const offers = Object.create(null);
		let params = Object.create(null);
		let mustUnescape = false;
		let isEscaping = false;
		let inQuotes = false;
		let extensionName;
		let paramName;
		let start = -1;
		let code = -1;
		let end = -1;
		let i = 0;
		for (; i < header.length; i++) {
			code = header.charCodeAt(i);
			if (extensionName === void 0) {
				if (end === -1 && tokenChars[code] === 1) {
					if (start === -1) start = i;
				} else if (i !== 0 && (code === 32 || code === 9)) {
					if (end === -1 && start !== -1) end = i;
				} else if (code === 59 || code === 44) {
					if (start === -1) throw new SyntaxError(`Unexpected character at index ${i}`);
					if (end === -1) end = i;
					const name = header.slice(start, end);
					if (code === 44) {
						push(offers, name, params);
						params = Object.create(null);
					} else extensionName = name;
					start = end = -1;
				} else throw new SyntaxError(`Unexpected character at index ${i}`);
			} else if (paramName === void 0) {
				if (end === -1 && tokenChars[code] === 1) {
					if (start === -1) start = i;
				} else if (code === 32 || code === 9) {
					if (end === -1 && start !== -1) end = i;
				} else if (code === 59 || code === 44) {
					if (start === -1) throw new SyntaxError(`Unexpected character at index ${i}`);
					if (end === -1) end = i;
					push(params, header.slice(start, end), true);
					if (code === 44) {
						push(offers, extensionName, params);
						params = Object.create(null);
						extensionName = void 0;
					}
					start = end = -1;
				} else if (code === 61 && start !== -1 && end === -1) {
					paramName = header.slice(start, i);
					start = end = -1;
				} else throw new SyntaxError(`Unexpected character at index ${i}`);
			} else if (isEscaping) {
				if (tokenChars[code] !== 1) throw new SyntaxError(`Unexpected character at index ${i}`);
				if (start === -1) start = i;
				else if (!mustUnescape) mustUnescape = true;
				isEscaping = false;
			} else if (inQuotes) {
				if (tokenChars[code] === 1) {
					if (start === -1) start = i;
				} else if (code === 34 && start !== -1) {
					inQuotes = false;
					end = i;
				} else if (code === 92) isEscaping = true;
				else throw new SyntaxError(`Unexpected character at index ${i}`);
			} else if (code === 34 && header.charCodeAt(i - 1) === 61) inQuotes = true;
			else if (end === -1 && tokenChars[code] === 1) {
				if (start === -1) start = i;
			} else if (start !== -1 && (code === 32 || code === 9)) {
				if (end === -1) end = i;
			} else if (code === 59 || code === 44) {
				if (start === -1) throw new SyntaxError(`Unexpected character at index ${i}`);
				if (end === -1) end = i;
				let value = header.slice(start, end);
				if (mustUnescape) {
					value = value.replace(/\\/g, "");
					mustUnescape = false;
				}
				push(params, paramName, value);
				if (code === 44) {
					push(offers, extensionName, params);
					params = Object.create(null);
					extensionName = void 0;
				}
				paramName = void 0;
				start = end = -1;
			} else throw new SyntaxError(`Unexpected character at index ${i}`);
		}
		if (start === -1 || inQuotes || code === 32 || code === 9) throw new SyntaxError("Unexpected end of input");
		if (end === -1) end = i;
		const token = header.slice(start, end);
		if (extensionName === void 0) push(offers, token, params);
		else {
			if (paramName === void 0) push(params, token, true);
			else if (mustUnescape) push(params, paramName, token.replace(/\\/g, ""));
			else push(params, paramName, token);
			push(offers, extensionName, params);
		}
		return offers;
	}
	/**
	* Builds the `Sec-WebSocket-Extensions` header field value.
	*
	* @param {Object} extensions The map of extensions and parameters to format
	* @return {String} A string representing the given object
	* @public
	*/
	function format(extensions) {
		return Object.keys(extensions).map((extension) => {
			let configurations = extensions[extension];
			if (!Array.isArray(configurations)) configurations = [configurations];
			return configurations.map((params) => {
				return [extension].concat(Object.keys(params).map((k) => {
					let values = params[k];
					if (!Array.isArray(values)) values = [values];
					return values.map((v) => v === true ? k : `${k}=${v}`).join("; ");
				})).join("; ");
			}).join(", ");
		}).join(", ");
	}
	module.exports = {
		format,
		parse
	};
}));
//#endregion
//#region node_modules/ws/lib/websocket.js
var require_websocket = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var EventEmitter$2 = __require("events");
	var https = __require("https");
	var http$1 = __require("http");
	var net = __require("net");
	var tls = __require("tls");
	var { randomBytes, createHash: createHash$1 } = __require("crypto");
	var { Duplex: Duplex$2, Readable } = __require("stream");
	var { URL } = __require("url");
	var PerMessageDeflate = require_permessage_deflate();
	var Receiver = require_receiver();
	var Sender = require_sender();
	var { isBlob } = require_validation();
	var { BINARY_TYPES, CLOSE_TIMEOUT, EMPTY_BUFFER, GUID, kForOnEventAttribute, kListener, kStatusCode, kWebSocket, NOOP } = require_constants();
	var { EventTarget: { addEventListener, removeEventListener } } = require_event_target();
	var { format, parse } = require_extension();
	var { toBuffer } = require_buffer_util();
	var kAborted = Symbol("kAborted");
	var protocolVersions = [8, 13];
	var readyStates = [
		"CONNECTING",
		"OPEN",
		"CLOSING",
		"CLOSED"
	];
	var subprotocolRegex = /^[!#$%&'*+\-.0-9A-Z^_`|a-z~]+$/;
	/**
	* Class representing a WebSocket.
	*
	* @extends EventEmitter
	*/
	var WebSocket = class WebSocket extends EventEmitter$2 {
		/**
		* Create a new `WebSocket`.
		*
		* @param {(String|URL)} address The URL to which to connect
		* @param {(String|String[])} [protocols] The subprotocols
		* @param {Object} [options] Connection options
		*/
		constructor(address, protocols, options) {
			super();
			this._binaryType = BINARY_TYPES[0];
			this._closeCode = 1006;
			this._closeFrameReceived = false;
			this._closeFrameSent = false;
			this._closeMessage = EMPTY_BUFFER;
			this._closeTimer = null;
			this._errorEmitted = false;
			this._extensions = {};
			this._paused = false;
			this._protocol = "";
			this._readyState = WebSocket.CONNECTING;
			this._receiver = null;
			this._sender = null;
			this._socket = null;
			if (address !== null) {
				this._bufferedAmount = 0;
				this._isServer = false;
				this._redirects = 0;
				if (protocols === void 0) protocols = [];
				else if (!Array.isArray(protocols)) {
					if (typeof protocols === "object" && protocols !== null) {
						options = protocols;
						protocols = [];
					} else protocols = [protocols];
				}
				initAsClient(this, address, protocols, options);
			} else {
				this._autoPong = options.autoPong;
				this._closeTimeout = options.closeTimeout;
				this._isServer = true;
			}
		}
		/**
		* For historical reasons, the custom "nodebuffer" type is used by the default
		* instead of "blob".
		*
		* @type {String}
		*/
		get binaryType() {
			return this._binaryType;
		}
		set binaryType(type) {
			if (!BINARY_TYPES.includes(type)) return;
			this._binaryType = type;
			if (this._receiver) this._receiver._binaryType = type;
		}
		/**
		* @type {Number}
		*/
		get bufferedAmount() {
			if (!this._socket) return this._bufferedAmount;
			return this._socket._writableState.length + this._sender._bufferedBytes;
		}
		/**
		* @type {String}
		*/
		get extensions() {
			return Object.keys(this._extensions).join();
		}
		/**
		* @type {Boolean}
		*/
		get isPaused() {
			return this._paused;
		}
		/**
		* @type {Function}
		*/
		/* istanbul ignore next */
		get onclose() {
			return null;
		}
		/**
		* @type {Function}
		*/
		/* istanbul ignore next */
		get onerror() {
			return null;
		}
		/**
		* @type {Function}
		*/
		/* istanbul ignore next */
		get onopen() {
			return null;
		}
		/**
		* @type {Function}
		*/
		/* istanbul ignore next */
		get onmessage() {
			return null;
		}
		/**
		* @type {String}
		*/
		get protocol() {
			return this._protocol;
		}
		/**
		* @type {Number}
		*/
		get readyState() {
			return this._readyState;
		}
		/**
		* @type {String}
		*/
		get url() {
			return this._url;
		}
		/**
		* Set up the socket and the internal resources.
		*
		* @param {Duplex} socket The network socket between the server and client
		* @param {Buffer} head The first packet of the upgraded stream
		* @param {Object} options Options object
		* @param {Boolean} [options.allowSynchronousEvents=false] Specifies whether
		*     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
		*     multiple times in the same tick
		* @param {Function} [options.generateMask] The function used to generate the
		*     masking key
		* @param {Number} [options.maxBufferedChunks=0] The maximum number of
		*     buffered data chunks
		* @param {Number} [options.maxFragments=0] The maximum number of message
		*     fragments
		* @param {Number} [options.maxPayload=0] The maximum allowed message size
		* @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
		*     not to skip UTF-8 validation for text and close messages
		* @private
		*/
		setSocket(socket, head, options) {
			const receiver = new Receiver({
				allowSynchronousEvents: options.allowSynchronousEvents,
				binaryType: this.binaryType,
				extensions: this._extensions,
				isServer: this._isServer,
				maxBufferedChunks: options.maxBufferedChunks,
				maxFragments: options.maxFragments,
				maxPayload: options.maxPayload,
				skipUTF8Validation: options.skipUTF8Validation
			});
			const sender = new Sender(socket, this._extensions, options.generateMask);
			this._receiver = receiver;
			this._sender = sender;
			this._socket = socket;
			receiver[kWebSocket] = this;
			sender[kWebSocket] = this;
			socket[kWebSocket] = this;
			receiver.on("conclude", receiverOnConclude);
			receiver.on("drain", receiverOnDrain);
			receiver.on("error", receiverOnError);
			receiver.on("message", receiverOnMessage);
			receiver.on("ping", receiverOnPing);
			receiver.on("pong", receiverOnPong);
			sender.onerror = senderOnError;
			if (socket.setTimeout) socket.setTimeout(0);
			if (socket.setNoDelay) socket.setNoDelay();
			if (head.length > 0) socket.unshift(head);
			socket.on("close", socketOnClose);
			socket.on("data", socketOnData);
			socket.on("end", socketOnEnd);
			socket.on("error", socketOnError);
			this._readyState = WebSocket.OPEN;
			this.emit("open");
		}
		/**
		* Emit the `'close'` event.
		*
		* @private
		*/
		emitClose() {
			if (!this._socket) {
				this._readyState = WebSocket.CLOSED;
				this.emit("close", this._closeCode, this._closeMessage);
				return;
			}
			if (this._extensions[PerMessageDeflate.extensionName]) this._extensions[PerMessageDeflate.extensionName].cleanup();
			this._receiver.removeAllListeners();
			this._readyState = WebSocket.CLOSED;
			this.emit("close", this._closeCode, this._closeMessage);
		}
		/**
		* Start a closing handshake.
		*
		*          +----------+   +-----------+   +----------+
		*     - - -|ws.close()|-->|close frame|-->|ws.close()|- - -
		*    |     +----------+   +-----------+   +----------+     |
		*          +----------+   +-----------+         |
		* CLOSING  |ws.close()|<--|close frame|<--+-----+       CLOSING
		*          +----------+   +-----------+   |
		*    |           |                        |   +---+        |
		*                +------------------------+-->|fin| - - - -
		*    |         +---+                      |   +---+
		*     - - - - -|fin|<---------------------+
		*              +---+
		*
		* @param {Number} [code] Status code explaining why the connection is closing
		* @param {(String|Buffer)} [data] The reason why the connection is
		*     closing
		* @public
		*/
		close(code, data) {
			if (this.readyState === WebSocket.CLOSED) return;
			if (this.readyState === WebSocket.CONNECTING) {
				abortHandshake(this, this._req, "WebSocket was closed before the connection was established");
				return;
			}
			if (this.readyState === WebSocket.CLOSING) {
				if (this._closeFrameSent && (this._closeFrameReceived || this._receiver._writableState.errorEmitted)) this._socket.end();
				return;
			}
			this._readyState = WebSocket.CLOSING;
			this._sender.close(code, data, !this._isServer, (err) => {
				if (err) return;
				this._closeFrameSent = true;
				if (this._closeFrameReceived || this._receiver._writableState.errorEmitted) this._socket.end();
			});
			setCloseTimer(this);
		}
		/**
		* Pause the socket.
		*
		* @public
		*/
		pause() {
			if (this.readyState === WebSocket.CONNECTING || this.readyState === WebSocket.CLOSED) return;
			this._paused = true;
			this._socket.pause();
		}
		/**
		* Send a ping.
		*
		* @param {*} [data] The data to send
		* @param {Boolean} [mask] Indicates whether or not to mask `data`
		* @param {Function} [cb] Callback which is executed when the ping is sent
		* @public
		*/
		ping(data, mask, cb) {
			if (this.readyState === WebSocket.CONNECTING) throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
			if (typeof data === "function") {
				cb = data;
				data = mask = void 0;
			} else if (typeof mask === "function") {
				cb = mask;
				mask = void 0;
			}
			if (typeof data === "number") data = data.toString();
			if (this.readyState !== WebSocket.OPEN) {
				sendAfterClose(this, data, cb);
				return;
			}
			if (mask === void 0) mask = !this._isServer;
			this._sender.ping(data || EMPTY_BUFFER, mask, cb);
		}
		/**
		* Send a pong.
		*
		* @param {*} [data] The data to send
		* @param {Boolean} [mask] Indicates whether or not to mask `data`
		* @param {Function} [cb] Callback which is executed when the pong is sent
		* @public
		*/
		pong(data, mask, cb) {
			if (this.readyState === WebSocket.CONNECTING) throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
			if (typeof data === "function") {
				cb = data;
				data = mask = void 0;
			} else if (typeof mask === "function") {
				cb = mask;
				mask = void 0;
			}
			if (typeof data === "number") data = data.toString();
			if (this.readyState !== WebSocket.OPEN) {
				sendAfterClose(this, data, cb);
				return;
			}
			if (mask === void 0) mask = !this._isServer;
			this._sender.pong(data || EMPTY_BUFFER, mask, cb);
		}
		/**
		* Resume the socket.
		*
		* @public
		*/
		resume() {
			if (this.readyState === WebSocket.CONNECTING || this.readyState === WebSocket.CLOSED) return;
			this._paused = false;
			if (!this._receiver._writableState.needDrain) this._socket.resume();
		}
		/**
		* Send a data message.
		*
		* @param {*} data The message to send
		* @param {Object} [options] Options object
		* @param {Boolean} [options.binary] Specifies whether `data` is binary or
		*     text
		* @param {Boolean} [options.compress] Specifies whether or not to compress
		*     `data`
		* @param {Boolean} [options.fin=true] Specifies whether the fragment is the
		*     last one
		* @param {Boolean} [options.mask] Specifies whether or not to mask `data`
		* @param {Function} [cb] Callback which is executed when data is written out
		* @public
		*/
		send(data, options, cb) {
			if (this.readyState === WebSocket.CONNECTING) throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
			if (typeof options === "function") {
				cb = options;
				options = {};
			}
			if (typeof data === "number") data = data.toString();
			if (this.readyState !== WebSocket.OPEN) {
				sendAfterClose(this, data, cb);
				return;
			}
			const opts = {
				binary: typeof data !== "string",
				mask: !this._isServer,
				compress: true,
				fin: true,
				...options
			};
			if (!this._extensions[PerMessageDeflate.extensionName]) opts.compress = false;
			this._sender.send(data || EMPTY_BUFFER, opts, cb);
		}
		/**
		* Forcibly close the connection.
		*
		* @public
		*/
		terminate() {
			if (this.readyState === WebSocket.CLOSED) return;
			if (this.readyState === WebSocket.CONNECTING) {
				abortHandshake(this, this._req, "WebSocket was closed before the connection was established");
				return;
			}
			if (this._socket) {
				this._readyState = WebSocket.CLOSING;
				this._socket.destroy();
			}
		}
	};
	/**
	* @constant {Number} CONNECTING
	* @memberof WebSocket
	*/
	Object.defineProperty(WebSocket, "CONNECTING", {
		enumerable: true,
		value: readyStates.indexOf("CONNECTING")
	});
	/**
	* @constant {Number} CONNECTING
	* @memberof WebSocket.prototype
	*/
	Object.defineProperty(WebSocket.prototype, "CONNECTING", {
		enumerable: true,
		value: readyStates.indexOf("CONNECTING")
	});
	/**
	* @constant {Number} OPEN
	* @memberof WebSocket
	*/
	Object.defineProperty(WebSocket, "OPEN", {
		enumerable: true,
		value: readyStates.indexOf("OPEN")
	});
	/**
	* @constant {Number} OPEN
	* @memberof WebSocket.prototype
	*/
	Object.defineProperty(WebSocket.prototype, "OPEN", {
		enumerable: true,
		value: readyStates.indexOf("OPEN")
	});
	/**
	* @constant {Number} CLOSING
	* @memberof WebSocket
	*/
	Object.defineProperty(WebSocket, "CLOSING", {
		enumerable: true,
		value: readyStates.indexOf("CLOSING")
	});
	/**
	* @constant {Number} CLOSING
	* @memberof WebSocket.prototype
	*/
	Object.defineProperty(WebSocket.prototype, "CLOSING", {
		enumerable: true,
		value: readyStates.indexOf("CLOSING")
	});
	/**
	* @constant {Number} CLOSED
	* @memberof WebSocket
	*/
	Object.defineProperty(WebSocket, "CLOSED", {
		enumerable: true,
		value: readyStates.indexOf("CLOSED")
	});
	/**
	* @constant {Number} CLOSED
	* @memberof WebSocket.prototype
	*/
	Object.defineProperty(WebSocket.prototype, "CLOSED", {
		enumerable: true,
		value: readyStates.indexOf("CLOSED")
	});
	[
		"binaryType",
		"bufferedAmount",
		"extensions",
		"isPaused",
		"protocol",
		"readyState",
		"url"
	].forEach((property) => {
		Object.defineProperty(WebSocket.prototype, property, { enumerable: true });
	});
	[
		"open",
		"error",
		"close",
		"message"
	].forEach((method) => {
		Object.defineProperty(WebSocket.prototype, `on${method}`, {
			enumerable: true,
			get() {
				for (const listener of this.listeners(method)) if (listener[kForOnEventAttribute]) return listener[kListener];
				return null;
			},
			set(handler) {
				for (const listener of this.listeners(method)) if (listener[kForOnEventAttribute]) {
					this.removeListener(method, listener);
					break;
				}
				if (typeof handler !== "function") return;
				this.addEventListener(method, handler, { [kForOnEventAttribute]: true });
			}
		});
	});
	WebSocket.prototype.addEventListener = addEventListener;
	WebSocket.prototype.removeEventListener = removeEventListener;
	module.exports = WebSocket;
	/**
	* Initialize a WebSocket client.
	*
	* @param {WebSocket} websocket The client to initialize
	* @param {(String|URL)} address The URL to which to connect
	* @param {Array} protocols The subprotocols
	* @param {Object} [options] Connection options
	* @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether any
	*     of the `'message'`, `'ping'`, and `'pong'` events can be emitted multiple
	*     times in the same tick
	* @param {Boolean} [options.autoPong=true] Specifies whether or not to
	*     automatically send a pong in response to a ping
	* @param {Number} [options.closeTimeout=30000] Duration in milliseconds to wait
	*     for the closing handshake to finish after `websocket.close()` is called
	* @param {Function} [options.finishRequest] A function which can be used to
	*     customize the headers of each http request before it is sent
	* @param {Boolean} [options.followRedirects=false] Whether or not to follow
	*     redirects
	* @param {Function} [options.generateMask] The function used to generate the
	*     masking key
	* @param {Number} [options.handshakeTimeout] Timeout in milliseconds for the
	*     handshake request
	* @param {Number} [options.maxBufferedChunks=262144] The maximum number of
	*     buffered data chunks
	* @param {Number} [options.maxFragments=16384] The maximum number of message
	*     fragments
	* @param {Number} [options.maxPayload=104857600] The maximum allowed message
	*     size
	* @param {Number} [options.maxRedirects=10] The maximum number of redirects
	*     allowed
	* @param {String} [options.origin] Value of the `Origin` or
	*     `Sec-WebSocket-Origin` header
	* @param {(Boolean|Object)} [options.perMessageDeflate=true] Enable/disable
	*     permessage-deflate
	* @param {Number} [options.protocolVersion=13] Value of the
	*     `Sec-WebSocket-Version` header
	* @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
	*     not to skip UTF-8 validation for text and close messages
	* @private
	*/
	function initAsClient(websocket, address, protocols, options) {
		const opts = {
			allowSynchronousEvents: true,
			autoPong: true,
			closeTimeout: CLOSE_TIMEOUT,
			protocolVersion: protocolVersions[1],
			maxBufferedChunks: 262144,
			maxFragments: 16384,
			maxPayload: 104857600,
			skipUTF8Validation: false,
			perMessageDeflate: true,
			followRedirects: false,
			maxRedirects: 10,
			...options,
			socketPath: void 0,
			hostname: void 0,
			protocol: void 0,
			timeout: void 0,
			method: "GET",
			host: void 0,
			path: void 0,
			port: void 0
		};
		websocket._autoPong = opts.autoPong;
		websocket._closeTimeout = opts.closeTimeout;
		if (!protocolVersions.includes(opts.protocolVersion)) throw new RangeError(`Unsupported protocol version: ${opts.protocolVersion} (supported versions: ${protocolVersions.join(", ")})`);
		let parsedUrl;
		if (address instanceof URL) parsedUrl = address;
		else try {
			parsedUrl = new URL(address);
		} catch {
			throw new SyntaxError(`Invalid URL: ${address}`);
		}
		if (parsedUrl.protocol === "http:") parsedUrl.protocol = "ws:";
		else if (parsedUrl.protocol === "https:") parsedUrl.protocol = "wss:";
		websocket._url = parsedUrl.href;
		const isSecure = parsedUrl.protocol === "wss:";
		const isIpcUrl = parsedUrl.protocol === "ws+unix:";
		let invalidUrlMessage;
		if (parsedUrl.protocol !== "ws:" && !isSecure && !isIpcUrl) invalidUrlMessage = "The URL's protocol must be one of \"ws:\", \"wss:\", \"http:\", \"https:\", or \"ws+unix:\"";
		else if (isIpcUrl && !parsedUrl.pathname) invalidUrlMessage = "The URL's pathname is empty";
		else if (parsedUrl.hash) invalidUrlMessage = "The URL contains a fragment identifier";
		if (invalidUrlMessage) {
			const err = new SyntaxError(invalidUrlMessage);
			if (websocket._redirects === 0) throw err;
			else {
				emitErrorAndClose(websocket, err);
				return;
			}
		}
		const defaultPort = isSecure ? 443 : 80;
		const key = randomBytes(16).toString("base64");
		const request = isSecure ? https.request : http$1.request;
		const protocolSet = /* @__PURE__ */ new Set();
		let perMessageDeflate;
		opts.createConnection = opts.createConnection || (isSecure ? tlsConnect : netConnect);
		opts.defaultPort = opts.defaultPort || defaultPort;
		opts.port = parsedUrl.port || defaultPort;
		opts.host = parsedUrl.hostname.startsWith("[") ? parsedUrl.hostname.slice(1, -1) : parsedUrl.hostname;
		opts.headers = {
			...opts.headers,
			"Sec-WebSocket-Version": opts.protocolVersion,
			"Sec-WebSocket-Key": key,
			Connection: "Upgrade",
			Upgrade: "websocket"
		};
		opts.path = parsedUrl.pathname + parsedUrl.search;
		opts.timeout = opts.handshakeTimeout;
		if (opts.perMessageDeflate) {
			perMessageDeflate = new PerMessageDeflate({
				...opts.perMessageDeflate,
				isServer: false,
				maxPayload: opts.maxPayload
			});
			opts.headers["Sec-WebSocket-Extensions"] = format({ [PerMessageDeflate.extensionName]: perMessageDeflate.offer() });
		}
		if (protocols.length) {
			for (const protocol of protocols) {
				if (typeof protocol !== "string" || !subprotocolRegex.test(protocol) || protocolSet.has(protocol)) throw new SyntaxError("An invalid or duplicated subprotocol was specified");
				protocolSet.add(protocol);
			}
			opts.headers["Sec-WebSocket-Protocol"] = protocols.join(",");
		}
		if (opts.origin) {
			if (opts.protocolVersion < 13) opts.headers["Sec-WebSocket-Origin"] = opts.origin;
			else opts.headers.Origin = opts.origin;
		}
		if (parsedUrl.username || parsedUrl.password) opts.auth = `${parsedUrl.username}:${parsedUrl.password}`;
		if (isIpcUrl) {
			const parts = opts.path.split(":");
			opts.socketPath = parts[0];
			opts.path = parts[1];
		}
		let req;
		if (opts.followRedirects) {
			if (websocket._redirects === 0) {
				websocket._originalIpc = isIpcUrl;
				websocket._originalSecure = isSecure;
				websocket._originalHostOrSocketPath = isIpcUrl ? opts.socketPath : parsedUrl.host;
				const headers = options && options.headers;
				options = {
					...options,
					headers: {}
				};
				if (headers) for (const [key, value] of Object.entries(headers)) options.headers[key.toLowerCase()] = value;
			} else if (websocket.listenerCount("redirect") === 0) {
				const isSameHost = isIpcUrl ? websocket._originalIpc ? opts.socketPath === websocket._originalHostOrSocketPath : false : websocket._originalIpc ? false : parsedUrl.host === websocket._originalHostOrSocketPath;
				if (!isSameHost || websocket._originalSecure && !isSecure) {
					delete opts.headers.authorization;
					delete opts.headers.cookie;
					if (!isSameHost) delete opts.headers.host;
					opts.auth = void 0;
				}
			}
			if (opts.auth && !options.headers.authorization) options.headers.authorization = "Basic " + Buffer.from(opts.auth).toString("base64");
			req = websocket._req = request(opts);
			if (websocket._redirects) websocket.emit("redirect", websocket.url, req);
		} else req = websocket._req = request(opts);
		if (opts.timeout) req.on("timeout", () => {
			abortHandshake(websocket, req, "Opening handshake has timed out");
		});
		req.on("error", (err) => {
			if (req === null || req[kAborted]) return;
			req = websocket._req = null;
			emitErrorAndClose(websocket, err);
		});
		req.on("response", (res) => {
			const location = res.headers.location;
			const statusCode = res.statusCode;
			if (location && opts.followRedirects && statusCode >= 300 && statusCode < 400) {
				if (++websocket._redirects > opts.maxRedirects) {
					abortHandshake(websocket, req, "Maximum redirects exceeded");
					return;
				}
				req.abort();
				let addr;
				try {
					addr = new URL(location, address);
				} catch (e) {
					emitErrorAndClose(websocket, /* @__PURE__ */ new SyntaxError(`Invalid URL: ${location}`));
					return;
				}
				initAsClient(websocket, addr, protocols, options);
			} else if (!websocket.emit("unexpected-response", req, res)) abortHandshake(websocket, req, `Unexpected server response: ${res.statusCode}`);
		});
		req.on("upgrade", (res, socket, head) => {
			websocket.emit("upgrade", res);
			if (websocket.readyState !== WebSocket.CONNECTING) return;
			req = websocket._req = null;
			const upgrade = res.headers.upgrade;
			if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
				abortHandshake(websocket, socket, "Invalid Upgrade header");
				return;
			}
			const digest = createHash$1("sha1").update(key + GUID).digest("base64");
			if (res.headers["sec-websocket-accept"] !== digest) {
				abortHandshake(websocket, socket, "Invalid Sec-WebSocket-Accept header");
				return;
			}
			const serverProt = res.headers["sec-websocket-protocol"];
			let protError;
			if (serverProt !== void 0) {
				if (!protocolSet.size) protError = "Server sent a subprotocol but none was requested";
				else if (!protocolSet.has(serverProt)) protError = "Server sent an invalid subprotocol";
			} else if (protocolSet.size) protError = "Server sent no subprotocol";
			if (protError) {
				abortHandshake(websocket, socket, protError);
				return;
			}
			if (serverProt) websocket._protocol = serverProt;
			const secWebSocketExtensions = res.headers["sec-websocket-extensions"];
			if (secWebSocketExtensions !== void 0) {
				if (!perMessageDeflate) {
					abortHandshake(websocket, socket, "Server sent a Sec-WebSocket-Extensions header but no extension was requested");
					return;
				}
				let extensions;
				try {
					extensions = parse(secWebSocketExtensions);
				} catch (err) {
					abortHandshake(websocket, socket, "Invalid Sec-WebSocket-Extensions header");
					return;
				}
				const extensionNames = Object.keys(extensions);
				if (extensionNames.length !== 1 || extensionNames[0] !== PerMessageDeflate.extensionName) {
					abortHandshake(websocket, socket, "Server indicated an extension that was not requested");
					return;
				}
				try {
					perMessageDeflate.accept(extensions[PerMessageDeflate.extensionName]);
				} catch (err) {
					abortHandshake(websocket, socket, "Invalid Sec-WebSocket-Extensions header");
					return;
				}
				websocket._extensions[PerMessageDeflate.extensionName] = perMessageDeflate;
			}
			websocket.setSocket(socket, head, {
				allowSynchronousEvents: opts.allowSynchronousEvents,
				generateMask: opts.generateMask,
				maxBufferedChunks: opts.maxBufferedChunks,
				maxFragments: opts.maxFragments,
				maxPayload: opts.maxPayload,
				skipUTF8Validation: opts.skipUTF8Validation
			});
		});
		if (opts.finishRequest) opts.finishRequest(req, websocket);
		else req.end();
	}
	/**
	* Emit the `'error'` and `'close'` events.
	*
	* @param {WebSocket} websocket The WebSocket instance
	* @param {Error} The error to emit
	* @private
	*/
	function emitErrorAndClose(websocket, err) {
		websocket._readyState = WebSocket.CLOSING;
		websocket._errorEmitted = true;
		websocket.emit("error", err);
		websocket.emitClose();
	}
	/**
	* Create a `net.Socket` and initiate a connection.
	*
	* @param {Object} options Connection options
	* @return {net.Socket} The newly created socket used to start the connection
	* @private
	*/
	function netConnect(options) {
		options.path = options.socketPath;
		return net.connect(options);
	}
	/**
	* Create a `tls.TLSSocket` and initiate a connection.
	*
	* @param {Object} options Connection options
	* @return {tls.TLSSocket} The newly created socket used to start the connection
	* @private
	*/
	function tlsConnect(options) {
		options.path = void 0;
		if (!options.servername && options.servername !== "") options.servername = net.isIP(options.host) ? "" : options.host;
		return tls.connect(options);
	}
	/**
	* Abort the handshake and emit an error.
	*
	* @param {WebSocket} websocket The WebSocket instance
	* @param {(http.ClientRequest|net.Socket|tls.Socket)} stream The request to
	*     abort or the socket to destroy
	* @param {String} message The error message
	* @private
	*/
	function abortHandshake(websocket, stream, message) {
		websocket._readyState = WebSocket.CLOSING;
		const err = new Error(message);
		Error.captureStackTrace(err, abortHandshake);
		if (stream.setHeader) {
			stream[kAborted] = true;
			stream.abort();
			if (stream.socket && !stream.socket.destroyed) stream.socket.destroy();
			process.nextTick(emitErrorAndClose, websocket, err);
		} else {
			stream.destroy(err);
			stream.once("error", websocket.emit.bind(websocket, "error"));
			stream.once("close", websocket.emitClose.bind(websocket));
		}
	}
	/**
	* Handle cases where the `ping()`, `pong()`, or `send()` methods are called
	* when the `readyState` attribute is `CLOSING` or `CLOSED`.
	*
	* @param {WebSocket} websocket The WebSocket instance
	* @param {*} [data] The data to send
	* @param {Function} [cb] Callback
	* @private
	*/
	function sendAfterClose(websocket, data, cb) {
		if (data) {
			const length = isBlob(data) ? data.size : toBuffer(data).length;
			if (websocket._socket) websocket._sender._bufferedBytes += length;
			else websocket._bufferedAmount += length;
		}
		if (cb) {
			const err = /* @__PURE__ */ new Error(`WebSocket is not open: readyState ${websocket.readyState} (${readyStates[websocket.readyState]})`);
			process.nextTick(cb, err);
		}
	}
	/**
	* The listener of the `Receiver` `'conclude'` event.
	*
	* @param {Number} code The status code
	* @param {Buffer} reason The reason for closing
	* @private
	*/
	function receiverOnConclude(code, reason) {
		const websocket = this[kWebSocket];
		websocket._closeFrameReceived = true;
		websocket._closeMessage = reason;
		websocket._closeCode = code;
		if (websocket._socket[kWebSocket] === void 0) return;
		websocket._socket.removeListener("data", socketOnData);
		process.nextTick(resume, websocket._socket);
		if (code === 1005) websocket.close();
		else websocket.close(code, reason);
	}
	/**
	* The listener of the `Receiver` `'drain'` event.
	*
	* @private
	*/
	function receiverOnDrain() {
		const websocket = this[kWebSocket];
		if (!websocket.isPaused) websocket._socket.resume();
	}
	/**
	* The listener of the `Receiver` `'error'` event.
	*
	* @param {(RangeError|Error)} err The emitted error
	* @private
	*/
	function receiverOnError(err) {
		const websocket = this[kWebSocket];
		if (websocket._socket[kWebSocket] !== void 0) {
			websocket._socket.removeListener("data", socketOnData);
			process.nextTick(resume, websocket._socket);
			websocket.close(err[kStatusCode]);
		}
		if (!websocket._errorEmitted) {
			websocket._errorEmitted = true;
			websocket.emit("error", err);
		}
	}
	/**
	* The listener of the `Receiver` `'finish'` event.
	*
	* @private
	*/
	function receiverOnFinish() {
		this[kWebSocket].emitClose();
	}
	/**
	* The listener of the `Receiver` `'message'` event.
	*
	* @param {Buffer|ArrayBuffer|Buffer[])} data The message
	* @param {Boolean} isBinary Specifies whether the message is binary or not
	* @private
	*/
	function receiverOnMessage(data, isBinary) {
		this[kWebSocket].emit("message", data, isBinary);
	}
	/**
	* The listener of the `Receiver` `'ping'` event.
	*
	* @param {Buffer} data The data included in the ping frame
	* @private
	*/
	function receiverOnPing(data) {
		const websocket = this[kWebSocket];
		if (websocket._autoPong) websocket.pong(data, !this._isServer, NOOP);
		websocket.emit("ping", data);
	}
	/**
	* The listener of the `Receiver` `'pong'` event.
	*
	* @param {Buffer} data The data included in the pong frame
	* @private
	*/
	function receiverOnPong(data) {
		this[kWebSocket].emit("pong", data);
	}
	/**
	* Resume a readable stream
	*
	* @param {Readable} stream The readable stream
	* @private
	*/
	function resume(stream) {
		stream.resume();
	}
	/**
	* The `Sender` error event handler.
	*
	* @param {Error} The error
	* @private
	*/
	function senderOnError(err) {
		const websocket = this[kWebSocket];
		if (websocket.readyState === WebSocket.CLOSED) return;
		if (websocket.readyState === WebSocket.OPEN) {
			websocket._readyState = WebSocket.CLOSING;
			setCloseTimer(websocket);
		}
		this._socket.end();
		if (!websocket._errorEmitted) {
			websocket._errorEmitted = true;
			websocket.emit("error", err);
		}
	}
	/**
	* Set a timer to destroy the underlying raw socket of a WebSocket.
	*
	* @param {WebSocket} websocket The WebSocket instance
	* @private
	*/
	function setCloseTimer(websocket) {
		websocket._closeTimer = setTimeout(websocket._socket.destroy.bind(websocket._socket), websocket._closeTimeout);
	}
	/**
	* The listener of the socket `'close'` event.
	*
	* @private
	*/
	function socketOnClose() {
		const websocket = this[kWebSocket];
		this.removeListener("close", socketOnClose);
		this.removeListener("data", socketOnData);
		this.removeListener("end", socketOnEnd);
		websocket._readyState = WebSocket.CLOSING;
		if (!this._readableState.endEmitted && !websocket._closeFrameReceived && !websocket._receiver._writableState.errorEmitted && this._readableState.length !== 0) {
			const chunk = this.read(this._readableState.length);
			websocket._receiver.write(chunk);
		}
		websocket._receiver.end();
		this[kWebSocket] = void 0;
		clearTimeout(websocket._closeTimer);
		if (websocket._receiver._writableState.finished || websocket._receiver._writableState.errorEmitted) websocket.emitClose();
		else {
			websocket._receiver.on("error", receiverOnFinish);
			websocket._receiver.on("finish", receiverOnFinish);
		}
	}
	/**
	* The listener of the socket `'data'` event.
	*
	* @param {Buffer} chunk A chunk of data
	* @private
	*/
	function socketOnData(chunk) {
		if (!this[kWebSocket]._receiver.write(chunk)) this.pause();
	}
	/**
	* The listener of the socket `'end'` event.
	*
	* @private
	*/
	function socketOnEnd() {
		const websocket = this[kWebSocket];
		websocket._readyState = WebSocket.CLOSING;
		websocket._receiver.end();
		this.end();
	}
	/**
	* The listener of the socket `'error'` event.
	*
	* @private
	*/
	function socketOnError() {
		const websocket = this[kWebSocket];
		this.removeListener("error", socketOnError);
		this.on("error", NOOP);
		if (websocket) {
			websocket._readyState = WebSocket.CLOSING;
			this.destroy();
		}
	}
}));
//#endregion
//#region node_modules/ws/lib/stream.js
var require_stream = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	require_websocket();
	var { Duplex: Duplex$1 } = __require("stream");
	/**
	* Emits the `'close'` event on a stream.
	*
	* @param {Duplex} stream The stream.
	* @private
	*/
	function emitClose(stream) {
		stream.emit("close");
	}
	/**
	* The listener of the `'end'` event.
	*
	* @private
	*/
	function duplexOnEnd() {
		if (!this.destroyed && this._writableState.finished) this.destroy();
	}
	/**
	* The listener of the `'error'` event.
	*
	* @param {Error} err The error
	* @private
	*/
	function duplexOnError(err) {
		this.removeListener("error", duplexOnError);
		this.destroy();
		if (this.listenerCount("error") === 0) this.emit("error", err);
	}
	/**
	* Wraps a `WebSocket` in a duplex stream.
	*
	* @param {WebSocket} ws The `WebSocket` to wrap
	* @param {Object} [options] The options for the `Duplex` constructor
	* @return {Duplex} The duplex stream
	* @public
	*/
	function createWebSocketStream(ws, options) {
		let terminateOnDestroy = true;
		const duplex = new Duplex$1({
			...options,
			autoDestroy: false,
			emitClose: false,
			objectMode: false,
			writableObjectMode: false
		});
		ws.on("message", function message(msg, isBinary) {
			const data = !isBinary && duplex._readableState.objectMode ? msg.toString() : msg;
			if (!duplex.push(data)) ws.pause();
		});
		ws.once("error", function error(err) {
			if (duplex.destroyed) return;
			terminateOnDestroy = false;
			duplex.destroy(err);
		});
		ws.once("close", function close() {
			if (duplex.destroyed) return;
			duplex.push(null);
		});
		duplex._destroy = function(err, callback) {
			if (ws.readyState === ws.CLOSED) {
				callback(err);
				process.nextTick(emitClose, duplex);
				return;
			}
			let called = false;
			ws.once("error", function error(err) {
				called = true;
				callback(err);
			});
			ws.once("close", function close() {
				if (!called) callback(err);
				process.nextTick(emitClose, duplex);
			});
			if (terminateOnDestroy) ws.terminate();
		};
		duplex._final = function(callback) {
			if (ws.readyState === ws.CONNECTING) {
				ws.once("open", function open() {
					duplex._final(callback);
				});
				return;
			}
			if (ws._socket === null) return;
			if (ws._socket._writableState.finished) {
				callback();
				if (duplex._readableState.endEmitted) duplex.destroy();
			} else {
				ws._socket.once("finish", function finish() {
					callback();
				});
				ws.close();
			}
		};
		duplex._read = function() {
			if (ws.isPaused) ws.resume();
		};
		duplex._write = function(chunk, encoding, callback) {
			if (ws.readyState === ws.CONNECTING) {
				ws.once("open", function open() {
					duplex._write(chunk, encoding, callback);
				});
				return;
			}
			ws.send(chunk, callback);
		};
		duplex.on("end", duplexOnEnd);
		duplex.on("error", duplexOnError);
		return duplex;
	}
	module.exports = createWebSocketStream;
}));
//#endregion
//#region node_modules/ws/lib/subprotocol.js
var require_subprotocol = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { tokenChars } = require_validation();
	/**
	* Parses the `Sec-WebSocket-Protocol` header into a set of subprotocol names.
	*
	* @param {String} header The field value of the header
	* @return {Set} The subprotocol names
	* @public
	*/
	function parse(header) {
		const protocols = /* @__PURE__ */ new Set();
		let start = -1;
		let end = -1;
		let i = 0;
		for (; i < header.length; i++) {
			const code = header.charCodeAt(i);
			if (end === -1 && tokenChars[code] === 1) {
				if (start === -1) start = i;
			} else if (i !== 0 && (code === 32 || code === 9)) {
				if (end === -1 && start !== -1) end = i;
			} else if (code === 44) {
				if (start === -1) throw new SyntaxError(`Unexpected character at index ${i}`);
				if (end === -1) end = i;
				const protocol = header.slice(start, end);
				if (protocols.has(protocol)) throw new SyntaxError(`The "${protocol}" subprotocol is duplicated`);
				protocols.add(protocol);
				start = end = -1;
			} else throw new SyntaxError(`Unexpected character at index ${i}`);
		}
		if (start === -1 || end !== -1) throw new SyntaxError("Unexpected end of input");
		const protocol = header.slice(start, i);
		if (protocols.has(protocol)) throw new SyntaxError(`The "${protocol}" subprotocol is duplicated`);
		protocols.add(protocol);
		return protocols;
	}
	module.exports = { parse };
}));
//#endregion
//#region node_modules/ws/lib/websocket-server.js
var require_websocket_server = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var EventEmitter$1 = __require("events");
	var http = __require("http");
	var { Duplex } = __require("stream");
	var { createHash } = __require("crypto");
	var extension = require_extension();
	var PerMessageDeflate = require_permessage_deflate();
	var subprotocol = require_subprotocol();
	var WebSocket = require_websocket();
	var { CLOSE_TIMEOUT, GUID, kWebSocket } = require_constants();
	var keyRegex = /^[+/0-9A-Za-z]{22}==$/;
	var RUNNING = 0;
	var CLOSING = 1;
	var CLOSED = 2;
	/**
	* Class representing a WebSocket server.
	*
	* @extends EventEmitter
	*/
	var WebSocketServer = class extends EventEmitter$1 {
		/**
		* Create a `WebSocketServer` instance.
		*
		* @param {Object} options Configuration options
		* @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
		*     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
		*     multiple times in the same tick
		* @param {Boolean} [options.autoPong=true] Specifies whether or not to
		*     automatically send a pong in response to a ping
		* @param {Number} [options.backlog=511] The maximum length of the queue of
		*     pending connections
		* @param {Boolean} [options.clientTracking=true] Specifies whether or not to
		*     track clients
		* @param {Number} [options.closeTimeout=30000] Duration in milliseconds to
		*     wait for the closing handshake to finish after `websocket.close()` is
		*     called
		* @param {Function} [options.handleProtocols] A hook to handle protocols
		* @param {String} [options.host] The hostname where to bind the server
		* @param {Number} [options.maxBufferedChunks=262144] The maximum number of
		*     buffered data chunks
		* @param {Number} [options.maxFragments=16384] The maximum number of message
		*     fragments
		* @param {Number} [options.maxPayload=104857600] The maximum allowed message
		*     size
		* @param {Boolean} [options.noServer=false] Enable no server mode
		* @param {String} [options.path] Accept only connections matching this path
		* @param {(Boolean|Object)} [options.perMessageDeflate=false] Enable/disable
		*     permessage-deflate
		* @param {Number} [options.port] The port where to bind the server
		* @param {(http.Server|https.Server)} [options.server] A pre-created HTTP/S
		*     server to use
		* @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
		*     not to skip UTF-8 validation for text and close messages
		* @param {Function} [options.verifyClient] A hook to reject connections
		* @param {Function} [options.WebSocket=WebSocket] Specifies the `WebSocket`
		*     class to use. It must be the `WebSocket` class or class that extends it
		* @param {Function} [callback] A listener for the `listening` event
		*/
		constructor(options, callback) {
			super();
			options = {
				allowSynchronousEvents: true,
				autoPong: true,
				maxBufferedChunks: 262144,
				maxFragments: 16384,
				maxPayload: 104857600,
				skipUTF8Validation: false,
				perMessageDeflate: false,
				handleProtocols: null,
				clientTracking: true,
				closeTimeout: CLOSE_TIMEOUT,
				verifyClient: null,
				noServer: false,
				backlog: null,
				server: null,
				host: null,
				path: null,
				port: null,
				WebSocket,
				...options
			};
			if (options.port == null && !options.server && !options.noServer || options.port != null && (options.server || options.noServer) || options.server && options.noServer) throw new TypeError("One and only one of the \"port\", \"server\", or \"noServer\" options must be specified");
			if (options.port != null) {
				this._server = http.createServer((req, res) => {
					const body = http.STATUS_CODES[426];
					res.writeHead(426, {
						"Content-Length": body.length,
						"Content-Type": "text/plain"
					});
					res.end(body);
				});
				this._server.listen(options.port, options.host, options.backlog, callback);
			} else if (options.server) this._server = options.server;
			if (this._server) {
				const emitConnection = this.emit.bind(this, "connection");
				this._removeListeners = addListeners(this._server, {
					listening: this.emit.bind(this, "listening"),
					error: this.emit.bind(this, "error"),
					upgrade: (req, socket, head) => {
						this.handleUpgrade(req, socket, head, emitConnection);
					}
				});
			}
			if (options.perMessageDeflate === true) options.perMessageDeflate = {};
			if (options.clientTracking) {
				this.clients = /* @__PURE__ */ new Set();
				this._shouldEmitClose = false;
			}
			this.options = options;
			this._state = RUNNING;
		}
		/**
		* Returns the bound address, the address family name, and port of the server
		* as reported by the operating system if listening on an IP socket.
		* If the server is listening on a pipe or UNIX domain socket, the name is
		* returned as a string.
		*
		* @return {(Object|String|null)} The address of the server
		* @public
		*/
		address() {
			if (this.options.noServer) throw new Error("The server is operating in \"noServer\" mode");
			if (!this._server) return null;
			return this._server.address();
		}
		/**
		* Stop the server from accepting new connections and emit the `'close'` event
		* when all existing connections are closed.
		*
		* @param {Function} [cb] A one-time listener for the `'close'` event
		* @public
		*/
		close(cb) {
			if (this._state === CLOSED) {
				if (cb) this.once("close", () => {
					cb(/* @__PURE__ */ new Error("The server is not running"));
				});
				process.nextTick(emitClose, this);
				return;
			}
			if (cb) this.once("close", cb);
			if (this._state === CLOSING) return;
			this._state = CLOSING;
			if (this.options.noServer || this.options.server) {
				if (this._server) {
					this._removeListeners();
					this._removeListeners = this._server = null;
				}
				if (this.clients) {
					if (!this.clients.size) process.nextTick(emitClose, this);
					else this._shouldEmitClose = true;
				} else process.nextTick(emitClose, this);
			} else {
				const server = this._server;
				this._removeListeners();
				this._removeListeners = this._server = null;
				server.close(() => {
					emitClose(this);
				});
			}
		}
		/**
		* See if a given request should be handled by this server instance.
		*
		* @param {http.IncomingMessage} req Request object to inspect
		* @return {Boolean} `true` if the request is valid, else `false`
		* @public
		*/
		shouldHandle(req) {
			if (this.options.path) {
				const index = req.url.indexOf("?");
				if ((index !== -1 ? req.url.slice(0, index) : req.url) !== this.options.path) return false;
			}
			return true;
		}
		/**
		* Handle a HTTP Upgrade request.
		*
		* @param {http.IncomingMessage} req The request object
		* @param {Duplex} socket The network socket between the server and client
		* @param {Buffer} head The first packet of the upgraded stream
		* @param {Function} cb Callback
		* @public
		*/
		handleUpgrade(req, socket, head, cb) {
			socket.on("error", socketOnError);
			const key = req.headers["sec-websocket-key"];
			const upgrade = req.headers.upgrade;
			const version = +req.headers["sec-websocket-version"];
			if (req.method !== "GET") {
				abortHandshakeOrEmitwsClientError(this, req, socket, 405, "Invalid HTTP method");
				return;
			}
			if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
				abortHandshakeOrEmitwsClientError(this, req, socket, 400, "Invalid Upgrade header");
				return;
			}
			if (key === void 0 || !keyRegex.test(key)) {
				abortHandshakeOrEmitwsClientError(this, req, socket, 400, "Missing or invalid Sec-WebSocket-Key header");
				return;
			}
			if (version !== 13 && version !== 8) {
				abortHandshakeOrEmitwsClientError(this, req, socket, 400, "Missing or invalid Sec-WebSocket-Version header", { "Sec-WebSocket-Version": "13, 8" });
				return;
			}
			if (!this.shouldHandle(req)) {
				abortHandshake(socket, 400);
				return;
			}
			const secWebSocketProtocol = req.headers["sec-websocket-protocol"];
			let protocols = /* @__PURE__ */ new Set();
			if (secWebSocketProtocol !== void 0) try {
				protocols = subprotocol.parse(secWebSocketProtocol);
			} catch (err) {
				abortHandshakeOrEmitwsClientError(this, req, socket, 400, "Invalid Sec-WebSocket-Protocol header");
				return;
			}
			const secWebSocketExtensions = req.headers["sec-websocket-extensions"];
			const extensions = {};
			if (this.options.perMessageDeflate && secWebSocketExtensions !== void 0) {
				const perMessageDeflate = new PerMessageDeflate({
					...this.options.perMessageDeflate,
					isServer: true,
					maxPayload: this.options.maxPayload
				});
				try {
					const offers = extension.parse(secWebSocketExtensions);
					if (offers[PerMessageDeflate.extensionName]) {
						perMessageDeflate.accept(offers[PerMessageDeflate.extensionName]);
						extensions[PerMessageDeflate.extensionName] = perMessageDeflate;
					}
				} catch (err) {
					abortHandshakeOrEmitwsClientError(this, req, socket, 400, "Invalid or unacceptable Sec-WebSocket-Extensions header");
					return;
				}
			}
			if (this.options.verifyClient) {
				const info = {
					origin: req.headers[`${version === 8 ? "sec-websocket-origin" : "origin"}`],
					secure: !!(req.socket.authorized || req.socket.encrypted),
					req
				};
				if (this.options.verifyClient.length === 2) {
					this.options.verifyClient(info, (verified, code, message, headers) => {
						if (!verified) return abortHandshake(socket, code || 401, message, headers);
						this.completeUpgrade(extensions, key, protocols, req, socket, head, cb);
					});
					return;
				}
				if (!this.options.verifyClient(info)) return abortHandshake(socket, 401);
			}
			this.completeUpgrade(extensions, key, protocols, req, socket, head, cb);
		}
		/**
		* Upgrade the connection to WebSocket.
		*
		* @param {Object} extensions The accepted extensions
		* @param {String} key The value of the `Sec-WebSocket-Key` header
		* @param {Set} protocols The subprotocols
		* @param {http.IncomingMessage} req The request object
		* @param {Duplex} socket The network socket between the server and client
		* @param {Buffer} head The first packet of the upgraded stream
		* @param {Function} cb Callback
		* @throws {Error} If called more than once with the same socket
		* @private
		*/
		completeUpgrade(extensions, key, protocols, req, socket, head, cb) {
			if (!socket.readable || !socket.writable) return socket.destroy();
			if (socket[kWebSocket]) throw new Error("server.handleUpgrade() was called more than once with the same socket, possibly due to a misconfiguration");
			if (this._state > RUNNING) return abortHandshake(socket, 503);
			const headers = [
				"HTTP/1.1 101 Switching Protocols",
				"Upgrade: websocket",
				"Connection: Upgrade",
				`Sec-WebSocket-Accept: ${createHash("sha1").update(key + GUID).digest("base64")}`
			];
			const ws = new this.options.WebSocket(null, void 0, this.options);
			if (protocols.size) {
				const protocol = this.options.handleProtocols ? this.options.handleProtocols(protocols, req) : protocols.values().next().value;
				if (protocol) {
					headers.push(`Sec-WebSocket-Protocol: ${protocol}`);
					ws._protocol = protocol;
				}
			}
			if (extensions[PerMessageDeflate.extensionName]) {
				const params = extensions[PerMessageDeflate.extensionName].params;
				const value = extension.format({ [PerMessageDeflate.extensionName]: [params] });
				headers.push(`Sec-WebSocket-Extensions: ${value}`);
				ws._extensions = extensions;
			}
			this.emit("headers", headers, req);
			socket.write(headers.concat("\r\n").join("\r\n"));
			socket.removeListener("error", socketOnError);
			ws.setSocket(socket, head, {
				allowSynchronousEvents: this.options.allowSynchronousEvents,
				maxBufferedChunks: this.options.maxBufferedChunks,
				maxFragments: this.options.maxFragments,
				maxPayload: this.options.maxPayload,
				skipUTF8Validation: this.options.skipUTF8Validation
			});
			if (this.clients) {
				this.clients.add(ws);
				ws.on("close", () => {
					this.clients.delete(ws);
					if (this._shouldEmitClose && !this.clients.size) process.nextTick(emitClose, this);
				});
			}
			cb(ws, req);
		}
	};
	module.exports = WebSocketServer;
	/**
	* Add event listeners on an `EventEmitter` using a map of <event, listener>
	* pairs.
	*
	* @param {EventEmitter} server The event emitter
	* @param {Object.<String, Function>} map The listeners to add
	* @return {Function} A function that will remove the added listeners when
	*     called
	* @private
	*/
	function addListeners(server, map) {
		for (const event of Object.keys(map)) server.on(event, map[event]);
		return function removeListeners() {
			for (const event of Object.keys(map)) server.removeListener(event, map[event]);
		};
	}
	/**
	* Emit a `'close'` event on an `EventEmitter`.
	*
	* @param {EventEmitter} server The event emitter
	* @private
	*/
	function emitClose(server) {
		server._state = CLOSED;
		server.emit("close");
	}
	/**
	* Handle socket errors.
	*
	* @private
	*/
	function socketOnError() {
		this.destroy();
	}
	/**
	* Close the connection when preconditions are not fulfilled.
	*
	* @param {Duplex} socket The socket of the upgrade request
	* @param {Number} code The HTTP response status code
	* @param {String} [message] The HTTP response body
	* @param {Object} [headers] Additional HTTP response headers
	* @private
	*/
	function abortHandshake(socket, code, message, headers) {
		message = message || http.STATUS_CODES[code];
		headers = {
			Connection: "close",
			"Content-Type": "text/html",
			"Content-Length": Buffer.byteLength(message),
			...headers
		};
		socket.once("finish", socket.destroy);
		socket.end(`HTTP/1.1 ${code} ${http.STATUS_CODES[code]}\r\n` + Object.keys(headers).map((h) => `${h}: ${headers[h]}`).join("\r\n") + "\r\n\r\n" + message);
	}
	/**
	* Emit a `'wsClientError'` event on a `WebSocketServer` if there is at least
	* one listener for it, otherwise call `abortHandshake()`.
	*
	* @param {WebSocketServer} server The WebSocket server
	* @param {http.IncomingMessage} req The request object
	* @param {Duplex} socket The socket of the upgrade request
	* @param {Number} code The HTTP response status code
	* @param {String} message The HTTP response body
	* @param {Object} [headers] The HTTP response headers
	* @private
	*/
	function abortHandshakeOrEmitwsClientError(server, req, socket, code, message, headers) {
		if (server.listenerCount("wsClientError")) {
			const err = new Error(message);
			Error.captureStackTrace(err, abortHandshakeOrEmitwsClientError);
			server.emit("wsClientError", err, socket, req);
		} else abortHandshake(socket, code, message, headers);
	}
}));
require_stream();
require_extension();
require_permessage_deflate();
require_receiver();
require_sender();
require_subprotocol();
var import_websocket = /* @__PURE__ */ __toESM(require_websocket(), 1);
require_websocket_server();
var wrapper_default = import_websocket.default;
//#endregion
//#region node_modules/lighter-ts-sdk/dist/esm/api/ws-order-client.js
var WebSocketOrderClient = class extends EventEmitter {
	constructor(config) {
		super();
		this.ws = null;
		this.isConnected = false;
		this.shouldReconnect = true;
		this.reconnectAttempts = 0;
		this.pendingRequests = /* @__PURE__ */ new Map();
		this.heartbeatTimer = null;
		this.reconnectTimer = null;
		this.messageId = 0;
		this.config = {
			reconnectInterval: 5e3,
			maxReconnectAttempts: 10,
			heartbeatInterval: 3e4,
			timeout: 1e4,
			endpointPath: "/jsonapi",
			...config
		};
	}
	async connect() {
		this.shouldReconnect = true;
		return new Promise((resolve, reject) => {
			try {
				const isWsUrl = this.config.url.startsWith("ws://") || this.config.url.startsWith("wss://");
				const base = isWsUrl ? this.config.url.replace(/\/+$/, "") : this.config.url.replace("https://", "wss://").replace("http://", "ws://").replace(/\/+$/, "");
				const normalizePath = (p) => p.startsWith("/") ? p : `/${p}`;
				const explicitPath = isWsUrl ? "" : this.config.endpointPath ? normalizePath(this.config.endpointPath) : void 0;
				const candidates = explicitPath !== void 0 ? [explicitPath] : isWsUrl ? [""] : ["/jsonapi", "/stream"];
				let attemptIndex = 0;
				const attemptConnect = () => {
					if (!this.shouldReconnect) {
						reject(/* @__PURE__ */ new Error("WebSocket connection aborted"));
						return;
					}
					const path = candidates[attemptIndex];
					const wsUrl = `${base}${path}`;
					let connectTimeout = null;
					this.ws = new wrapper_default(wsUrl);
					const handleOpen = () => {
						this.isConnected = true;
						this.reconnectAttempts = 0;
						this.startHeartbeat();
						this.emit("connected");
						cleanupListeners();
						resolve();
					};
					const handleMessage = (data) => {
						this.handleMessage(data);
					};
					const handleError = (error) => {
						const errorMsg = error.message || String(error);
						const errorCode = error.code;
						const is404 = errorMsg.includes("404") || errorMsg.includes("Unexpected server response: 404") || errorCode === 404 || errorMsg.includes("Not Found");
						if (!explicitPath && is404 && attemptIndex < candidates.length - 1) {
							attemptIndex += 1;
							try {
								if (this.ws) {
									this.ws.removeAllListeners();
									this.ws.terminate();
									this.ws = null;
								}
							} catch {}
							setTimeout(() => attemptConnect(), 100);
							return;
						}
						this.emit("error", error);
						if (!this.isConnected) {
							cleanupListeners();
							reject(error);
						}
					};
					const handleClose = (code, reason) => {
						this.isConnected = false;
						this.stopHeartbeat();
						this.emit("disconnected", {
							code,
							reason
						});
						cleanupListeners();
						if (this.shouldReconnect) this.scheduleReconnect();
					};
					const cleanupListeners = () => {
						if (connectTimeout) {
							clearTimeout(connectTimeout);
							connectTimeout = null;
						}
						if (!this.ws) return;
						this.ws.removeListener("open", handleOpen);
						this.ws.removeListener("message", handleMessage);
						this.ws.removeListener("error", handleError);
						this.ws.removeListener("close", handleClose);
					};
					this.ws.on("open", handleOpen);
					this.ws.on("message", handleMessage);
					this.ws.on("error", handleError);
					this.ws.on("close", handleClose);
					connectTimeout = setTimeout(() => {
						if (!this.isConnected && this.ws?.readyState !== wrapper_default.OPEN) {
							try {
								this.ws?.terminate();
							} catch {}
							if (!explicitPath && attemptIndex < candidates.length - 1) {
								attemptIndex += 1;
								attemptConnect();
							} else {
								cleanupListeners();
								reject(/* @__PURE__ */ new Error("WebSocket connection timeout"));
							}
						}
					}, this.config.timeout);
				};
				attemptConnect();
			} catch (error) {
				reject(error);
			}
		});
	}
	handleMessage(data) {
		try {
			const message = JSON.parse(data.toString());
			if (process.env.DEBUG_WS) {
				console.log("[WS DEBUG] Pending requests:", Array.from(this.pendingRequests.keys()));
				console.log("[WS DEBUG] Message type:", message.type || "unknown");
			}
			if (message.type === "PONG" || message.type === "pong") return;
			if (message.error) {
				const errorMsg = typeof message.error === "object" ? message.error.message || JSON.stringify(message.error) : message.error;
				const errorCode = message.error?.code || "UNKNOWN";
				if (message.id) {
					const pending = this.pendingRequests.get(message.id);
					if (pending) {
						clearTimeout(pending.timeout);
						this.pendingRequests.delete(message.id);
						pending.reject(/* @__PURE__ */ new Error(`[${errorCode}] ${errorMsg}`));
						return;
					}
				}
				if (this.pendingRequests.size > 0) {
					const oldestKey = Array.from(this.pendingRequests.keys())[0];
					const oldestRequest = this.pendingRequests.get(oldestKey);
					clearTimeout(oldestRequest.timeout);
					this.pendingRequests.delete(oldestKey);
					oldestRequest.reject(/* @__PURE__ */ new Error(`[${errorCode}] ${errorMsg}`));
					return;
				}
				this.emit("error", /* @__PURE__ */ new Error(`[${errorCode}] ${errorMsg}`));
				return;
			}
			if (message.id) {
				const pending = this.pendingRequests.get(message.id);
				if (pending) {
					clearTimeout(pending.timeout);
					this.pendingRequests.delete(message.id);
					if ("success" in message) {
						if (message.success) pending.resolve(message.result);
						else pending.reject(new Error(message.error || "Unknown error"));
					} else if ("hash" in message) pending.resolve(message);
					else if (Array.isArray(message) && message.length > 0 && "hash" in message[0]) pending.resolve(message);
					else pending.resolve(message);
				}
			} else if ("hash" in message || Array.isArray(message) && message.length > 0 && "hash" in message[0]) {
				if (this.pendingRequests.size > 0) {
					const oldestKey = Array.from(this.pendingRequests.keys())[0];
					const oldestRequest = this.pendingRequests.get(oldestKey);
					clearTimeout(oldestRequest.timeout);
					this.pendingRequests.delete(oldestKey);
					oldestRequest.resolve(message);
				} else this.emit("response", message);
			} else this.emit("response", message);
		} catch (error) {}
	}
	startHeartbeat() {
		this.heartbeatTimer = setInterval(() => {
			if (this.isConnected && this.ws?.readyState === wrapper_default.OPEN) this.ws.send(JSON.stringify({
				type: "PING",
				timestamp: Date.now()
			}));
		}, this.config.heartbeatInterval);
	}
	stopHeartbeat() {
		if (this.heartbeatTimer) {
			clearInterval(this.heartbeatTimer);
			this.heartbeatTimer = null;
		}
	}
	scheduleReconnect() {
		if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
			this.emit("maxReconnectAttemptsReached");
			return;
		}
		this.reconnectAttempts++;
		this.reconnectTimer = setTimeout(() => {
			this.connect().catch(() => {});
		}, this.config.reconnectInterval);
	}
	async sendTransaction(txType, txInfo) {
		if (!this.isConnected || !this.ws || this.ws.readyState !== wrapper_default.OPEN) throw new Error("WebSocket not connected");
		try {
			const request = {
				id: `tx_${Date.now()}_${++this.messageId}`,
				type: "SEND_TX",
				data: {
					type: "jsonapi/sendtx",
					data: {
						tx_type: txType,
						tx_info: txInfo
					}
				},
				timestamp: Date.now()
			};
			return await this.sendRequest(request);
		} finally {}
	}
	async sendBatchTransactions(txTypes, txInfos) {
		if (!this.isConnected || !this.ws || this.ws.readyState !== wrapper_default.OPEN) throw new Error("WebSocket not connected");
		if (txTypes.length !== txInfos.length) throw new Error("txTypes and txInfos arrays must have the same length");
		if (txTypes.length > 50) throw new Error("Batch size cannot exceed 50 transactions");
		try {
			const request = {
				id: `batch_${Date.now()}_${++this.messageId}`,
				type: "SEND_BATCH_TX",
				data: {
					type: "jsonapi/sendtxbatch",
					data: {
						tx_types: JSON.stringify(txTypes),
						tx_infos: JSON.stringify(txInfos)
					}
				},
				timestamp: Date.now()
			};
			return await this.sendRequest(request);
		} finally {}
	}
	async batchOrders(orders) {
		if (!this.isConnected || !this.ws || this.ws.readyState !== wrapper_default.OPEN) throw new Error("WebSocket not connected");
		try {
			const request = {
				id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
				type: "SEND_BATCH_TX",
				data: {
					type: "jsonapi/sendtxbatch",
					data: {
						tx_types: JSON.stringify(orders.map(() => 14)),
						tx_infos: JSON.stringify(orders)
					}
				},
				timestamp: Date.now()
			};
			return await this.sendRequest(request);
		} finally {}
	}
	sendRequest(request) {
		return new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				this.pendingRequests.delete(request.id);
				reject(/* @__PURE__ */ new Error(`Request timeout: ${request.id}`));
			}, this.config.timeout);
			this.pendingRequests.set(request.id, {
				resolve,
				reject,
				timeout,
				timestamp: Date.now()
			});
			try {
				const dataPayload = {
					id: request.id,
					...request.data.data
				};
				if (dataPayload.tx_info) {
					if (typeof dataPayload.tx_info === "string") try {
						dataPayload.tx_info = JSON.parse(dataPayload.tx_info);
					} catch (e) {}
				}
				if (dataPayload.tx_infos && typeof dataPayload.tx_infos === "string") try {
					const parsed = JSON.parse(dataPayload.tx_infos);
					if (Array.isArray(parsed)) dataPayload.tx_infos = parsed.map((ti) => {
						try {
							return typeof ti === "string" ? JSON.parse(ti) : ti;
						} catch {
							return ti;
						}
					});
				} catch (e) {}
				const messageToSend = {
					type: request.data.type,
					data: dataPayload
				};
				const messageStr = JSON.stringify(messageToSend);
				this.ws.send(messageStr);
			} catch (error) {
				clearTimeout(timeout);
				this.pendingRequests.delete(request.id);
				reject(error);
			}
		});
	}
	async disconnect() {
		return new Promise((resolve) => {
			this.shouldReconnect = false;
			if (this.reconnectTimer) {
				clearTimeout(this.reconnectTimer);
				this.reconnectTimer = null;
			}
			this.stopHeartbeat();
			for (const [, pending] of Array.from(this.pendingRequests.entries())) {
				clearTimeout(pending.timeout);
				pending.reject(/* @__PURE__ */ new Error("WebSocket disconnected"));
			}
			this.pendingRequests.clear();
			if (this.ws) {
				this.ws.once("close", () => {
					this.ws = null;
					this.isConnected = false;
					resolve();
				});
				this.ws.close();
			} else resolve();
		});
	}
	isReady() {
		return this.isConnected && this.ws?.readyState === wrapper_default.OPEN;
	}
	getConnectionStats() {
		return {
			isConnected: this.isConnected,
			pendingRequests: this.pendingRequests.size,
			reconnectAttempts: this.reconnectAttempts
		};
	}
};
//#endregion
//#region node_modules/lighter-ts-sdk/dist/esm/signer/wasm-signer-client.js
/**
* Order Type Constants and Enums
* Provides easy-to-understand order type references without context
*/
var OrderType;
(function(OrderType) {
	OrderType[OrderType["LIMIT"] = 0] = "LIMIT";
	OrderType[OrderType["MARKET"] = 1] = "MARKET";
	OrderType[OrderType["STOP_LOSS"] = 2] = "STOP_LOSS";
	OrderType[OrderType["STOP_LOSS_LIMIT"] = 3] = "STOP_LOSS_LIMIT";
	OrderType[OrderType["TAKE_PROFIT"] = 4] = "TAKE_PROFIT";
	OrderType[OrderType["TAKE_PROFIT_LIMIT"] = 5] = "TAKE_PROFIT_LIMIT";
	OrderType[OrderType["TWAP"] = 6] = "TWAP";
})(OrderType || (OrderType = {}));
var TimeInForce;
(function(TimeInForce) {
	TimeInForce[TimeInForce["IMMEDIATE_OR_CANCEL"] = 0] = "IMMEDIATE_OR_CANCEL";
	TimeInForce[TimeInForce["GOOD_TILL_TIME"] = 1] = "GOOD_TILL_TIME";
	TimeInForce[TimeInForce["POST_ONLY"] = 2] = "POST_ONLY";
})(TimeInForce || (TimeInForce = {}));
var GroupingType;
(function(GroupingType) {
	GroupingType[GroupingType["OTO"] = 1] = "OTO";
	GroupingType[GroupingType["OCO"] = 2] = "OCO";
	GroupingType[GroupingType["OTOCO"] = 3] = "OTOCO";
})(GroupingType || (GroupingType = {}));
var TransactionStatus;
(function(TransactionStatus) {
	TransactionStatus[TransactionStatus["PENDING"] = 0] = "PENDING";
	TransactionStatus[TransactionStatus["QUEUED"] = 1] = "QUEUED";
	TransactionStatus[TransactionStatus["COMMITTED"] = 2] = "COMMITTED";
	TransactionStatus[TransactionStatus["EXECUTED"] = 3] = "EXECUTED";
	TransactionStatus[TransactionStatus["FAILED"] = 4] = "FAILED";
	TransactionStatus[TransactionStatus["REJECTED"] = 5] = "REJECTED";
})(TransactionStatus || (TransactionStatus = {}));
var TransactionType;
(function(TransactionType) {
	TransactionType[TransactionType["TRANSFER"] = 12] = "TRANSFER";
	TransactionType[TransactionType["WITHDRAW"] = 13] = "WITHDRAW";
	TransactionType[TransactionType["CREATE_ORDER"] = 14] = "CREATE_ORDER";
	TransactionType[TransactionType["CANCEL_ORDER"] = 15] = "CANCEL_ORDER";
	TransactionType[TransactionType["CANCEL_ALL_ORDERS"] = 16] = "CANCEL_ALL_ORDERS";
	TransactionType[TransactionType["MODIFY_ORDER"] = 17] = "MODIFY_ORDER";
	TransactionType[TransactionType["MINT_SHARES"] = 18] = "MINT_SHARES";
	TransactionType[TransactionType["BURN_SHARES"] = 19] = "BURN_SHARES";
	TransactionType[TransactionType["UPDATE_LEVERAGE"] = 20] = "UPDATE_LEVERAGE";
	TransactionType[TransactionType["CREATE_GROUPED_ORDERS"] = 28] = "CREATE_GROUPED_ORDERS";
	TransactionType[TransactionType["UPDATE_MARGIN"] = 29] = "UPDATE_MARGIN";
	TransactionType[TransactionType["STAKE_ASSETS"] = 35] = "STAKE_ASSETS";
	TransactionType[TransactionType["UNSTAKE_ASSETS"] = 36] = "UNSTAKE_ASSETS";
	TransactionType[TransactionType["APPROVE_INTEGRATOR"] = 45] = "APPROVE_INTEGRATOR";
})(TransactionType || (TransactionType = {}));
/**
* Resolve the effective `Network` and API URL for a SignerConfig.
*
* Network precedence:
*   1. `config.network` (a `Network` object or a registry name)
*   2. an explicit `config.url` matched against known network hosts
*   3. `LIGHTER_NETWORK` in the environment (default `mainnet`)
*
* The returned `url` is always a string: `config.url` when set, otherwise the
* resolved network's `apiUrl`. Matching an explicit URL to a known network
* lets `url: 'https://api.rh.lighter.xyz'` pick up the Robinhood chain_id
* (466324) without also setting `LIGHTER_NETWORK` or `chainId`.
*/
function resolveEffectiveNetwork(config) {
	if (config.network) {
		const network = typeof config.network === "string" ? getNetwork(config.network) : config.network;
		return {
			network,
			url: config.url ?? network.apiUrl
		};
	}
	if (config.url) return {
		network: matchNetworkByUrl(config.url),
		url: config.url
	};
	const network = resolveNetworkFromEnv();
	return {
		network,
		url: network.apiUrl
	};
}
/** Extract the bare host (`api.rh.lighter.xyz`) from a URL for matching. */
function normalizeHost(url) {
	return url.toLowerCase().replace(/^https?:\/\//, "").replace(/[/:].*$/, "");
}
/** Match an API URL to a known network by exact host. */
function matchNetworkByUrl(url) {
	const host = normalizeHost(url);
	if (!host) return void 0;
	for (const network of Object.values(NETWORKS)) if (normalizeHost(network.apiUrl) === host) return network;
}
/**
* Main SignerClient class for interacting with Lighter Protocol
* Handles order creation, account management, and transaction signing
* @class SignerClient
*/
var SignerClient = class SignerClient {
	/**
	* Creates a new SignerClient instance
	* @param config - Configuration object containing API credentials and settings
	* @param config.url - Lighter Protocol API URL
	* @param config.privateKey - Private key for signing transactions
	* @param config.accountIndex - Account index (0 for master account)
	* @param config.apiKeyIndex - API key index for authentication
	* @param config.wasmConfig - Optional WASM signer configuration
	* @param config.logLevel - Optional logging level
	*/
	constructor(config) {
		this.clientCreated = false;
		this.clientCreationPromise = null;
		this.nonceCache = null;
		this.wsOrderClient = null;
		this.orderBatcher = null;
		const resolved = resolveEffectiveNetwork(config);
		this.resolvedNetwork = resolved.network;
		const apiHost = config.url ?? resolved.url;
		if (!config.url) config.url = apiHost;
		if (config.chainId === void 0 && resolved.network) config.chainId = resolved.network.chainId;
		this.validateConfig(config);
		this.config = config;
		this.apiUrl = apiHost;
		this.apiClient = new ApiClient({ host: apiHost });
		this.transactionApi = new TransactionApi(this.apiClient);
		this.accountApi = new AccountApi(this.apiClient);
		this.bridgeApi = new BridgeApi(this.apiClient, config.l1BridgeConfig);
		this.orderApi = new OrderApi(this.apiClient);
		this.nonceManager = new NonceManager(this.apiClient, {
			accountIndex: config.accountIndex,
			apiKeyIndex: config.apiKeyIndex
		});
		if (config.logLevel !== void 0) logger.setLevel(config.logLevel);
		if (config.wasmConfig) {
			const wasmManager = WasmManager.getInstance();
			const clientType = typeof window !== "undefined" ? "browser" : "node";
			if (wasmManager.isReady()) {
				this.wallet = wasmManager.getWasmClient();
				this.signerType = clientType === "browser" ? "wasm" : "node-wasm";
			} else {
				this.wallet = createWasmSignerClient(config.wasmConfig);
				this.signerType = typeof window !== "undefined" ? "wasm" : "node-wasm";
			}
		} else throw new Error("wasmConfig must be provided.");
		this.initializeOptimizations();
	}
	initializeOptimizations() {
		this.nonceCache = new NonceCache(async (apiKeyIndex, count) => {
			const firstNonceResult = await this.transactionApi.getNextNonce(this.config.accountIndex, apiKeyIndex);
			const nonces = [];
			for (let i = 0; i < count; i++) nonces.push(firstNonceResult.nonce + i);
			return nonces;
		});
		if (this.config.enableWebSocket) this.wsOrderClient = new WebSocketOrderClient({
			url: this.apiUrl,
			reconnectInterval: 5e3,
			maxReconnectAttempts: 10,
			heartbeatInterval: 3e4,
			timeout: 1e4
		});
		if (this.config.enableBatching) this.orderBatcher = new RequestBatcher(async (requests) => {
			const results = [];
			for (const request of requests) try {
				let result;
				if (request.type === "CREATE_ORDER") result = await this.processOrderRequest(request.params);
				else if (request.type === "CANCEL_ORDER") result = await this.processCancelRequest(request.params);
				results.push({
					id: request.id,
					success: true,
					result,
					timestamp: Date.now()
				});
			} catch (error) {
				results.push({
					id: request.id,
					success: false,
					error: error instanceof Error ? error.message : "Unknown error",
					timestamp: Date.now()
				});
			}
			return results;
		}, {
			maxBatchSize: 10,
			maxWaitTime: 50,
			flushInterval: 25
		});
	}
	async processOrderRequest(params) {
		return await this.processTransactionWithRetry(async () => {
			const [, txHash, createErr] = await this.createOrderOptimized(params);
			if (createErr) throw new Error(createErr);
			return { txHash };
		});
	}
	async processCancelRequest(params) {
		return await this.processTransactionWithRetry(async () => {
			const [, txHash, cancelErr] = await this.cancelOrder(params.marketIndex);
			if (cancelErr) throw new Error(cancelErr);
			return { txHash };
		});
	}
	/**
	* Process transaction with automatic retry and nonce recovery
	*/
	async processTransactionWithRetry(operation, maxRetries = 1) {
		let lastError;
		for (let attempt = 0; attempt <= maxRetries; attempt++) try {
			return await operation();
		} catch (error) {
			lastError = error;
			if (this.isNonceError(error)) {
				await this.hardRefreshNonce();
				if (attempt === 0) continue;
			}
			this.acknowledgeFailure();
			if (!this.isNonceError(error)) break;
		}
		throw lastError;
	}
	/**
	* Check if error is nonce-related
	*/
	isNonceError(error) {
		if (!error) return false;
		const message = error.message || error.toString() || "";
		return message.toLowerCase().includes("invalid nonce") || message.toLowerCase().includes("nonce") || error.status === 400 && message.includes("nonce");
	}
	/**
	* Hard refresh nonce from API
	*/
	async hardRefreshNonce() {
		if (this.nonceManager) await this.nonceManager.hardRefreshNonce(this.config.apiKeyIndex);
		else await this.getNextNonce();
	}
	/**
	* Acknowledge transaction failure
	*/
	acknowledgeFailure() {
		if (this.nonceManager) this.nonceManager.acknowledgeFailure(this.config.apiKeyIndex);
	}
	/**
	* Initialize the signer (required for WASM signers)
	*/
	async initialize() {
		if (this.signerType === "wasm" || this.signerType === "node-wasm") await this.wallet.initialize();
	}
	async ensureWasmClient() {
		if (this.signerType !== "wasm" && this.signerType !== "node-wasm") return;
		if (this.clientCreated) return;
		if (this.clientCreationPromise) return this.clientCreationPromise;
		this.clientCreationPromise = (async () => {
			try {
				if (this.clientCreated) return;
				const explicitChainId = this.config.chainId;
				let chainIdNum;
				if (typeof explicitChainId === "number" && Number.isFinite(explicitChainId) && explicitChainId > 0) chainIdNum = explicitChainId;
				else {
					const root = new RootApi(this.apiClient);
					const defaultChainId = this.apiUrl.toLowerCase().includes("testnet") ? 300 : 304;
					chainIdNum = defaultChainId;
					try {
						try {
							const basic = await this.apiClient.get("/api/v1/layer2BasicInfo");
							const data = basic?.data ?? basic;
							const cid = (data && (data.chain_id ?? data.chainId ?? data.chainID)) ?? void 0;
							if (cid !== void 0) {
								if (typeof cid === "number") chainIdNum = cid;
								else {
									const s = String(cid).toLowerCase();
									if (/^\d+$/.test(s)) chainIdNum = parseInt(s, 10);
									else if (s.includes("mainnet")) chainIdNum = 304;
									else if (s.includes("testnet")) chainIdNum = 300;
								}
							}
						} catch {}
						if (!Number.isFinite(chainIdNum) || chainIdNum <= 0) {
							const info = await root.getInfo();
							const cid = (info && (info.chain_id ?? info.chainId ?? info.chainID)) ?? defaultChainId;
							if (typeof cid === "number") chainIdNum = cid;
							else {
								const s = String(cid).toLowerCase();
								if (/^\d+$/.test(s)) chainIdNum = parseInt(s, 10);
								else if (s.includes("mainnet")) chainIdNum = 304;
								else if (s.includes("testnet")) chainIdNum = 300;
								else chainIdNum = defaultChainId;
							}
						}
						if (!Number.isFinite(chainIdNum) || chainIdNum <= 0) chainIdNum = defaultChainId;
					} catch {
						chainIdNum = defaultChainId;
					}
				}
				const fullKey = this.config.privateKey || "";
				let wasmKey;
				if (fullKey.includes("#")) wasmKey = fullKey.split("#")[0].trim();
				else wasmKey = fullKey;
				await this.wallet.createClient({
					url: this.apiUrl,
					privateKey: wasmKey.startsWith("0x") ? wasmKey : `0x${wasmKey}`,
					chainId: chainIdNum,
					apiKeyIndex: this.config.apiKeyIndex,
					accountIndex: this.config.accountIndex
				});
				this.clientCreated = true;
			} finally {
				this.clientCreationPromise = null;
			}
		})();
		return this.clientCreationPromise;
	}
	validateConfig(config) {
		if (!config.url || typeof config.url !== "string") throw new Error("SignerClient requires an API URL: set `url`, `network`, or the LIGHTER_NETWORK env var (mainnet | testnet | robinhood).");
		if (!config.privateKey || typeof config.privateKey !== "string") throw new Error("Private key is required and must be a string");
		if (typeof config.accountIndex !== "number" || config.accountIndex < 0) throw new Error("Account index must be a non-negative number");
		if (typeof config.apiKeyIndex !== "number" || config.apiKeyIndex < 0) throw new Error("API key index must be a non-negative number");
		if (!config.wasmConfig) config.wasmConfig = { wasmPath: "wasm/lighter-signer.wasm" };
	}
	/**
	* Check client configuration and validate API key with server
	* This performs basic validation and optionally calls WASM CheckClient to verify API key matches server
	* @param useWasmCheck - If true, calls WASM CheckClient to verify API key matches server (default: false)
	* @returns Error message if validation fails, null if successful
	*/
	async checkClient(useWasmCheck = false) {
		if (!this.config.privateKey) return "Private key is required";
		if (this.config.accountIndex < 0) return "Account index must be non-negative";
		if (this.config.apiKeyIndex < 0) return "API key index must be non-negative";
		if (useWasmCheck && (this.signerType === "wasm" || this.signerType === "node-wasm")) try {
			await this.ensureWasmClient();
			await this.wallet.checkClient(this.config.apiKeyIndex, this.config.accountIndex);
		} catch (error) {
			return error instanceof Error ? error.message : "CheckClient validation failed";
		}
		return null;
	}
	/**
	* Creates a new order (limit, market, or conditional)
	* @param params - Order parameters
	* @param params.marketIndex - Market index (0 for ETH-USD)
	* @param params.clientOrderIndex - Unique client order identifier
	* @param params.baseAmount - Order size in base units
	* @param params.price - Order price (for limit orders)
	* @param params.isAsk - True for sell orders, false for buy orders
	* @param params.orderType - Order type (0=limit, 1=market, 2=stop, 3=take_profit)
	* @param params.timeInForce - Time in force (0=GTC, 1=IOC, 2=FOK)
	* @param params.reduceOnly - True for reduce-only orders
	* @param params.triggerPrice - Trigger price for conditional orders
	* @param params.orderExpiry - Order expiry timestamp (optional)
	* @param params.nonce - Transaction nonce (optional, auto-fetched if not provided)
	* @returns Promise resolving to [orderInfo, transactionHash, error]
	*/
	async createOrder(params) {
		return await this.processTransactionWithRetry(async () => {
			try {
				if (this.config.enableWebSocket && this.wsOrderClient?.isReady()) try {
					const nonce = (params.skipNonce || params.nonce === 0 ? { nonce: params.nonce ?? 0 } : params.nonce === void 0 || params.nonce === -1 ? await this.getNextNonce() : { nonce: params.nonce }).nonce;
					let orderExpiry = params.orderExpiry ?? SignerClient.DEFAULT_28_DAY_ORDER_EXPIRY;
					if (orderExpiry === void 0 || orderExpiry === -1 || orderExpiry === SignerClient.DEFAULT_28_DAY_ORDER_EXPIRY) orderExpiry = Date.now() + 24192e5;
					const defaultTimeInForce = params.orderType === void 0 || params.orderType === SignerClient.ORDER_TYPE_LIMIT ? SignerClient.ORDER_TIME_IN_FORCE_GOOD_TILL_TIME : SignerClient.ORDER_TIME_IN_FORCE_IMMEDIATE_OR_CANCEL;
					const timeInForce = params.timeInForce !== void 0 ? params.timeInForce : defaultTimeInForce;
					const isSLTPOrder = params.orderType === SignerClient.ORDER_TYPE_STOP_LOSS || params.orderType === SignerClient.ORDER_TYPE_STOP_LOSS_LIMIT || params.orderType === SignerClient.ORDER_TYPE_TAKE_PROFIT || params.orderType === SignerClient.ORDER_TYPE_TAKE_PROFIT_LIMIT;
					const wasmOrderExpiry = timeInForce === SignerClient.ORDER_TIME_IN_FORCE_IMMEDIATE_OR_CANCEL && !isSLTPOrder ? 0 : orderExpiry;
					if (params.marketIndex < 0 || params.marketIndex > 65535) {
						const errorMsg = `Market index ${params.marketIndex} is out of valid range (0-65535).`;
						logger.error(errorMsg);
						return [
							null,
							"",
							errorMsg
						];
					}
					const wasmParams = {
						marketIndex: params.marketIndex,
						clientOrderIndex: params.clientOrderIndex,
						baseAmount: params.baseAmount,
						price: params.price,
						isAsk: params.isAsk ? 1 : 0,
						orderType: params.orderType !== void 0 ? params.orderType : SignerClient.ORDER_TYPE_LIMIT,
						timeInForce,
						reduceOnly: params.reduceOnly ? 1 : 0,
						triggerPrice: params.triggerPrice !== void 0 ? params.triggerPrice : SignerClient.NIL_TRIGGER_PRICE,
						orderExpiry: wasmOrderExpiry,
						integratorAccountIndex: params.integratorAccountIndex ?? 0,
						integratorTakerFee: params.integratorTakerFee ?? 0,
						integratorMakerFee: params.integratorMakerFee ?? 0,
						skipNonce: params.skipNonce ? 1 : 0,
						nonce,
						apiKeyIndex: this.config.apiKeyIndex,
						accountIndex: this.config.accountIndex,
						selfTradeBehaviorMode: params.selfTradeBehaviorMode ?? 0,
						selfTradeEqualityMode: params.selfTradeEqualityMode ?? 0
					};
					const wasmResponse = await this.wallet.signCreateOrder(wasmParams);
					if (wasmResponse.error) return [
						null,
						"",
						wasmResponse.error
					];
					return [
						JSON.parse(wasmResponse.txInfo),
						(await this.wsOrderClient.sendTransaction(wasmResponse.txType || SignerClient.TX_TYPE_CREATE_ORDER, wasmResponse.txInfo)).hash || wasmResponse.txHash,
						null
					];
				} catch (error) {
					logger.warning("WebSocket order failed, falling back to HTTP", { error: error instanceof Error ? error.message : String(error) });
				}
				if (this.config.enableBatching && this.orderBatcher) {
					const result = await this.orderBatcher.addRequest("CREATE_ORDER", params);
					return [
						result,
						result.txHash || "",
						null
					];
				}
				return await this.createOrderOptimized(params);
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : "Unknown error";
				throw new Error(errorMessage);
			}
		});
	}
	async createOrderOptimized(params) {
		const nextNonce = params.skipNonce || params.nonce === 0 ? { nonce: params.nonce ?? 0 } : params.nonce === void 0 || params.nonce === -1 ? await this.getNextNonce() : { nonce: params.nonce };
		let orderExpiry = params.orderExpiry ?? SignerClient.DEFAULT_28_DAY_ORDER_EXPIRY;
		if (orderExpiry === void 0 || orderExpiry === -1 || orderExpiry === SignerClient.DEFAULT_28_DAY_ORDER_EXPIRY) orderExpiry = Date.now() + 24192e5;
		const defaultTimeInForce = params.orderType === void 0 || params.orderType === SignerClient.ORDER_TYPE_LIMIT ? SignerClient.ORDER_TIME_IN_FORCE_GOOD_TILL_TIME : SignerClient.ORDER_TIME_IN_FORCE_IMMEDIATE_OR_CANCEL;
		const timeInForce = params.timeInForce !== void 0 ? params.timeInForce : defaultTimeInForce;
		const isSLTPOrder = params.orderType === SignerClient.ORDER_TYPE_STOP_LOSS || params.orderType === SignerClient.ORDER_TYPE_STOP_LOSS_LIMIT || params.orderType === SignerClient.ORDER_TYPE_TAKE_PROFIT || params.orderType === SignerClient.ORDER_TYPE_TAKE_PROFIT_LIMIT;
		const wasmOrderExpiry = timeInForce === SignerClient.ORDER_TIME_IN_FORCE_IMMEDIATE_OR_CANCEL && !isSLTPOrder ? 0 : orderExpiry;
		if (params.marketIndex < 0 || params.marketIndex > 65535) {
			const errorMsg = `Market index ${params.marketIndex} is out of valid range (0-65535).`;
			logger.error(errorMsg);
			return [
				null,
				"",
				errorMsg
			];
		}
		const wasmParams = {
			marketIndex: params.marketIndex,
			clientOrderIndex: params.clientOrderIndex,
			baseAmount: params.baseAmount,
			price: params.price,
			isAsk: params.isAsk ? 1 : 0,
			orderType: params.orderType !== void 0 ? params.orderType : SignerClient.ORDER_TYPE_LIMIT,
			timeInForce,
			reduceOnly: params.reduceOnly || false ? 1 : 0,
			triggerPrice: params.triggerPrice !== void 0 ? params.triggerPrice : SignerClient.NIL_TRIGGER_PRICE,
			orderExpiry: wasmOrderExpiry,
			integratorAccountIndex: params.integratorAccountIndex ?? 0,
			integratorTakerFee: params.integratorTakerFee ?? 0,
			integratorMakerFee: params.integratorMakerFee ?? 0,
			skipNonce: params.skipNonce ? 1 : 0,
			nonce: nextNonce.nonce,
			apiKeyIndex: this.config.apiKeyIndex,
			accountIndex: this.config.accountIndex,
			selfTradeBehaviorMode: params.selfTradeBehaviorMode ?? 0,
			selfTradeEqualityMode: params.selfTradeEqualityMode ?? 0
		};
		if (process.env.DEBUG) logger.debug("Order signing parameters", {
			inputOrderType: params.orderType,
			inputTimeInForce: params.timeInForce,
			inputOrderExpiry: params.orderExpiry,
			computedTimeInForce: timeInForce,
			computedOrderExpiry: wasmOrderExpiry,
			wasmOrderType: wasmParams.orderType,
			marketIndex: wasmParams.marketIndex,
			marketIndexType: "uint16 (0-65535)"
		});
		const wasmResponse = await this.wallet.signCreateOrder(wasmParams);
		if (wasmResponse.error) return [
			null,
			"",
			wasmResponse.error
		];
		try {
			const txHash = await this.transactionApi.sendTxWithIndices(wasmResponse.txType || SignerClient.TX_TYPE_CREATE_ORDER, wasmResponse.txInfo, this.config.accountIndex, this.config.apiKeyIndex);
			if (txHash.code && txHash.code !== 200) {
				this.acknowledgeFailure();
				return [
					null,
					"",
					txHash.message || "Transaction failed"
				];
			}
			const finalHash = txHash.tx_hash || txHash.hash || wasmResponse.txHash || "";
			return [
				JSON.parse(wasmResponse.txInfo),
				finalHash,
				null
			];
		} catch (apiError) {
			const errorMessage = apiError?.response?.data?.message || apiError?.message || "Transaction failed";
			if (this.isNonceError(apiError) || errorMessage.toLowerCase().includes("invalid nonce") || errorMessage.toLowerCase().includes("nonce")) try {
				await this.hardRefreshNonce();
			} catch (refreshError) {}
			this.acknowledgeFailure();
			return [
				null,
				"",
				errorMessage
			];
		}
	}
	async getNextNonce() {
		if (!this.nonceCache) throw new Error("Nonce cache not initialized");
		return { nonce: await this.nonceCache.getNextNonce(this.config.apiKeyIndex) };
	}
	async getNextNonces(count) {
		if (!this.nonceCache) throw new Error("Nonce cache not initialized");
		return await this.nonceCache.getNextNonces(this.config.apiKeyIndex, count);
	}
	/**
	* Pre-warm the nonce cache for better performance
	*/
	async preWarmNonceCache() {
		if (this.nonceCache) {
			await this.nonceCache.preWarmCache([this.config.apiKeyIndex]);
			logger.info("Nonce cache pre-warmed", { apiKeyIndex: this.config.apiKeyIndex });
		}
	}
	/**
	* Get nonce cache statistics for monitoring
	*/
	getNonceCacheStats() {
		return this.nonceCache ? this.nonceCache.getCacheStats() : null;
	}
	async createMarketOrder(params) {
		try {
			const nextNonce = params.skipNonce || params.nonce === 0 ? { nonce: params.nonce ?? 0 } : params.nonce === void 0 || params.nonce === -1 ? await this.getNextNonce() : { nonce: params.nonce };
			const wasmParams = {
				marketIndex: params.marketIndex,
				clientOrderIndex: params.clientOrderIndex,
				baseAmount: params.baseAmount,
				price: params.avgExecutionPrice,
				isAsk: params.isAsk ? 1 : 0,
				orderType: SignerClient.ORDER_TYPE_MARKET,
				timeInForce: SignerClient.ORDER_TIME_IN_FORCE_IMMEDIATE_OR_CANCEL,
				reduceOnly: params.reduceOnly ? 1 : 0,
				triggerPrice: SignerClient.NIL_TRIGGER_PRICE,
				orderExpiry: 0,
				integratorAccountIndex: params.integratorAccountIndex ?? 0,
				integratorTakerFee: params.integratorTakerFee ?? 0,
				integratorMakerFee: params.integratorMakerFee ?? 0,
				skipNonce: params.skipNonce ? 1 : 0,
				nonce: nextNonce.nonce,
				apiKeyIndex: this.config.apiKeyIndex,
				accountIndex: this.config.accountIndex,
				selfTradeBehaviorMode: params.selfTradeBehaviorMode ?? 0,
				selfTradeEqualityMode: params.selfTradeEqualityMode ?? 0
			};
			const wasmResponse = await this.wallet.signCreateOrder(wasmParams);
			if (wasmResponse.error) return [
				null,
				"",
				wasmResponse.error
			];
			const txHashResponse = await this.transactionApi.sendTxWithIndices(wasmResponse.txType || SignerClient.TX_TYPE_CREATE_ORDER, wasmResponse.txInfo, this.config.accountIndex, this.config.apiKeyIndex);
			if (txHashResponse.code && txHashResponse.code !== 200) return [
				null,
				"",
				txHashResponse.message || `API returned error code ${txHashResponse.code}`
			];
			const txHash = txHashResponse.tx_hash || txHashResponse.hash || wasmResponse.txHash || "";
			if (!txHash) return [
				null,
				"",
				"No transaction hash returned from API"
			];
			return [
				JSON.parse(wasmResponse.txInfo),
				txHash,
				null
			];
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Unknown error";
			throw new Error(errorMessage);
		}
	}
	parseOrderBookInt(value) {
		if (value === void 0 || value === null) return 0;
		if (typeof value === "number") return Math.floor(value);
		const normalized = value.replace(".", "");
		const parsed = Number(normalized);
		return Number.isFinite(parsed) ? Math.floor(parsed) : 0;
	}
	async getBestPrice(marketIndex, isAsk, obOrders) {
		const orderBook = obOrders || await this.orderApi.getOrderBookOrders({
			market_id: marketIndex,
			limit: 1
		});
		const side = isAsk ? orderBook?.bids || [] : orderBook?.asks || [];
		if (!side.length) throw new Error("Order book has no liquidity on required side");
		return this.parseOrderBookInt(side[0]?.price);
	}
	async getPotentialExecutionPrice(marketIndex, amount, isAsk, isAmountBase = true, obOrders) {
		const orderBook = obOrders || await this.orderApi.getOrderBookOrders({
			market_id: marketIndex,
			limit: 100
		});
		const side = isAsk ? orderBook?.bids || [] : orderBook?.asks || [];
		let matchedUsdAmount = 0;
		let matchedSize = 0;
		for (const level of side) {
			if (isAmountBase && matchedSize >= amount || !isAmountBase && matchedUsdAmount >= amount) break;
			const currentPrice = this.parseOrderBookInt(level?.price);
			const currentSize = this.parseOrderBookInt(level?.remaining_base_amount ?? level?.size);
			if (currentPrice <= 0 || currentSize <= 0) continue;
			const maxPossibleSize = isAmountBase ? amount - matchedSize : Math.floor((amount - matchedUsdAmount) / currentPrice);
			const usedSize = Math.min(maxPossibleSize, currentSize);
			if (usedSize <= 0) continue;
			matchedUsdAmount += currentPrice * usedSize;
			matchedSize += usedSize;
		}
		if (matchedSize <= 0) throw new Error("No liquidity available to estimate execution price");
		return [matchedUsdAmount / matchedSize, isAmountBase ? matchedSize : matchedUsdAmount];
	}
	async createMarketOrder_quoteAmount(params) {
		try {
			const quoteAmount = Math.floor(params.quoteAmount * 1e6);
			const obOrders = await this.orderApi.getOrderBookOrders({
				market_id: params.marketIndex,
				limit: 100
			});
			const idealPrice = params.idealPrice ?? await this.getBestPrice(params.marketIndex, params.isAsk, obOrders);
			const acceptableExecutionPrice = Math.round(idealPrice * (1 + params.maxSlippage * (params.isAsk ? -1 : 1)));
			const [potentialExecutionPrice, matchedUsdAmount] = await this.getPotentialExecutionPrice(params.marketIndex, quoteAmount, params.isAsk, false, obOrders);
			if (params.isAsk && potentialExecutionPrice < acceptableExecutionPrice || !params.isAsk && potentialExecutionPrice > acceptableExecutionPrice) return [
				null,
				"",
				"Excessive slippage"
			];
			if (matchedUsdAmount < quoteAmount) return [
				null,
				"",
				"Cannot be sure slippage will be acceptable due to the high size"
			];
			const baseAmount = Math.floor(quoteAmount / potentialExecutionPrice);
			return await this.createOrder({
				marketIndex: params.marketIndex,
				clientOrderIndex: params.clientOrderIndex,
				baseAmount,
				price: Math.round(acceptableExecutionPrice),
				isAsk: params.isAsk,
				orderType: SignerClient.ORDER_TYPE_MARKET,
				timeInForce: SignerClient.ORDER_TIME_IN_FORCE_IMMEDIATE_OR_CANCEL,
				orderExpiry: SignerClient.DEFAULT_IOC_EXPIRY,
				reduceOnly: params.reduceOnly || false,
				...params.nonce !== void 0 ? { nonce: params.nonce } : {}
			});
		} catch (error) {
			return [
				null,
				"",
				error instanceof Error ? error.message : "Unknown error"
			];
		}
	}
	/**
	* Create market order with maximum slippage limit
	* Will only execute the amount such that slippage is limited to the value provided
	*/
	async createMarketOrder_maxSlippage(params) {
		try {
			let idealPrice = params.idealPrice;
			if (idealPrice === void 0) idealPrice = 4e3;
			const acceptableExecutionPrice = Math.round(idealPrice * (1 + params.maxSlippage * (params.isAsk ? -1 : 1)));
			return await this.createMarketOrder({
				marketIndex: params.marketIndex,
				clientOrderIndex: params.clientOrderIndex,
				baseAmount: params.baseAmount,
				avgExecutionPrice: acceptableExecutionPrice,
				isAsk: params.isAsk,
				reduceOnly: params.reduceOnly || false,
				...params.nonce !== void 0 && { nonce: params.nonce }
			});
		} catch (error) {
			return [
				null,
				"",
				error instanceof Error ? error.message : "Unknown error"
			];
		}
	}
	/**
	* Create market order only if slippage is acceptable
	* Will only execute if slippage <= max_slippage
	*/
	async createMarketOrder_ifSlippage(params) {
		try {
			let idealPrice = params.idealPrice;
			if (idealPrice === void 0) idealPrice = 4e3;
			const acceptableExecutionPrice = idealPrice * (1 + params.maxSlippage * (params.isAsk ? -1 : 1));
			return await this.createMarketOrder({
				marketIndex: params.marketIndex,
				clientOrderIndex: params.clientOrderIndex,
				baseAmount: params.baseAmount,
				avgExecutionPrice: Math.round(acceptableExecutionPrice),
				isAsk: params.isAsk,
				reduceOnly: params.reduceOnly || false,
				...params.nonce !== void 0 && { nonce: params.nonce }
			});
		} catch (error) {
			return [
				null,
				"",
				error instanceof Error ? error.message : "Unknown error"
			];
		}
	}
	async cancelOrder(params) {
		return await this.processTransactionWithRetry(async () => {
			try {
				const nextNonce = params.skipNonce || params.nonce === 0 ? { nonce: params.nonce ?? 0 } : params.nonce === void 0 || params.nonce === -1 ? await this.getNextNonce() : { nonce: params.nonce };
				const wasmParams = {
					marketIndex: params.marketIndex,
					orderIndex: params.orderIndex,
					skipNonce: params.skipNonce ? 1 : 0,
					nonce: nextNonce.nonce,
					apiKeyIndex: this.config.apiKeyIndex,
					accountIndex: this.config.accountIndex
				};
				const wasmResponse = await this.wallet.signCancelOrder(wasmParams);
				if (wasmResponse.error) return [
					null,
					"",
					wasmResponse.error
				];
				const txHash = await this.transactionApi.sendTx(wasmResponse.txType || SignerClient.TX_TYPE_CANCEL_ORDER, wasmResponse.txInfo);
				if (txHash.code && txHash.code !== 200) {
					this.acknowledgeFailure();
					return [
						null,
						"",
						txHash.message || "Transaction failed"
					];
				}
				return [
					JSON.parse(wasmResponse.txInfo),
					txHash.tx_hash || txHash.hash || wasmResponse.txHash || "",
					null
				];
			} catch (error) {
				return [
					null,
					"",
					error instanceof Error ? error.message : "Unknown error"
				];
			}
		});
	}
	/**
	* Change API key (register new public key)
	*
	* Can be used to:
	* 1. Register a new API key at a new index (defaults to current + 1)
	* 2. Overwrite/revoke an existing API key by using the same index
	*
	* @param ethPrivateKey - Ethereum private key for L1 signature
	* @param newPubkey - New public key to register
	* @param newPrivateKey - Private key corresponding to newPubkey
	* @param newApiKeyIndex - Optional API key index (defaults to current + 1).
	*                         To revoke an existing key, specify the same index as the key to revoke.
	* @returns [txHash, txInfo, error]
	*/
	async changeApiKey(params) {
		try {
			const newApiKeyIndex = params.newApiKeyIndex ?? this.config.apiKeyIndex + 1;
			let nonce = params.nonce ?? 0;
			if (nonce === 0) try {
				nonce = (await this.transactionApi.getNextNonce(this.config.accountIndex, newApiKeyIndex)).nonce;
			} catch {
				nonce = 0;
			}
			let pubkey = params.newPubkey.replace(/^0x/, "");
			if (pubkey.length !== 80) return [
				null,
				"",
				`Invalid public key length: expected 80 hex chars (40 bytes), got ${pubkey.length}. Public key: ${params.newPubkey.substring(0, 30)}...`
			];
			if (!/^[0-9a-fA-F]{80}$/.test(pubkey)) return [
				null,
				"",
				`Invalid public key format: must be 80 hex characters. Public key: ${params.newPubkey.substring(0, 30)}...`
			];
			const tempClient = new SignerClient({
				url: this.apiUrl,
				privateKey: params.newPrivateKey,
				accountIndex: this.config.accountIndex,
				apiKeyIndex: newApiKeyIndex,
				...this.config.chainId !== void 0 ? { chainId: this.config.chainId } : {},
				wasmConfig: this.config.wasmConfig || { wasmPath: "wasm/lighter-signer.wasm" }
			});
			await tempClient.initialize();
			await tempClient.ensureWasmClient();
			const wasmResponse = await tempClient.wallet.signChangePubKey({
				pubkey: `0x${pubkey}`,
				skipNonce: 0,
				nonce,
				apiKeyIndex: newApiKeyIndex,
				accountIndex: this.config.accountIndex
			});
			await tempClient.close();
			if (wasmResponse.error) return [
				null,
				"",
				wasmResponse.error
			];
			const txInfo = JSON.parse(wasmResponse.txInfo);
			const messageToSign = wasmResponse.messageToSign;
			if (!messageToSign) return [
				null,
				"",
				"No messageToSign from WASM"
			];
			const fullSig = await new (await (import("./ethers.mjs").then((n) => n.t))).Wallet(params.ethPrivateKey).signMessage(messageToSign);
			txInfo.L1Sig = fullSig.startsWith("0x") && fullSig.length === 132 ? fullSig : fullSig;
			const authToken = await this.createAuthTokenWithExpiry().catch(() => void 0);
			try {
				const txHashResponse = await this.transactionApi.sendTxWithIndices(wasmResponse.txType || SignerClient.TX_TYPE_CHANGE_PUB_KEY, JSON.stringify(txInfo), this.config.accountIndex, this.config.apiKeyIndex, true, authToken);
				if (txHashResponse.code && txHashResponse.code !== 200) return [
					null,
					"",
					txHashResponse.message || `API error: ${txHashResponse.code}`
				];
				const txHash = txHashResponse.tx_hash || txHashResponse.hash || wasmResponse.txHash || "";
				return txHash ? [
					txHashResponse,
					txHash,
					null
				] : [
					null,
					"",
					"No transaction hash"
				];
			} catch (error) {
				const errorMsg = error?.message || error?.data?.message || String(error);
				if (errorMsg.includes("invalid signature") && txInfo.Sig) {
					if (!txInfo.Sig.startsWith("0x") && !txInfo.Sig.includes("=")) try {
						const txInfoRetry = { ...txInfo };
						txInfoRetry.Sig = "0x" + txInfo.Sig;
						const txHashResponse = await this.transactionApi.sendTxWithIndices(wasmResponse.txType || SignerClient.TX_TYPE_CHANGE_PUB_KEY, JSON.stringify(txInfoRetry), this.config.accountIndex, this.config.apiKeyIndex, true, authToken);
						if (!txHashResponse.code || txHashResponse.code === 200) {
							const txHash = txHashResponse.tx_hash || txHashResponse.hash || wasmResponse.txHash || "";
							if (txHash) return [
								txHashResponse,
								txHash,
								null
							];
						}
					} catch (retryError) {}
					if (!txInfo.Sig.includes("=")) try {
						const sigHex = txInfo.Sig.startsWith("0x") ? txInfo.Sig.substring(2) : txInfo.Sig;
						const sigBytes = Buffer.from(sigHex, "hex");
						const txInfoRetry = { ...txInfo };
						txInfoRetry.Sig = sigBytes.toString("base64");
						const txHashResponse = await this.transactionApi.sendTxWithIndices(wasmResponse.txType || SignerClient.TX_TYPE_CHANGE_PUB_KEY, JSON.stringify(txInfoRetry), this.config.accountIndex, this.config.apiKeyIndex, true, authToken);
						if (!txHashResponse.code || txHashResponse.code === 200) {
							const txHash = txHashResponse.tx_hash || txHashResponse.hash || wasmResponse.txHash || "";
							if (txHash) return [
								txHashResponse,
								txHash,
								null
							];
						}
					} catch (retryError) {}
				}
				if ((errorMsg.includes("invalid tx info") || errorMsg.includes("invalid PublicKey")) && txInfo.PubKey) {
					if (txInfo.PubKey.startsWith("0x")) {
						const txInfoRetry = { ...txInfo };
						txInfoRetry.PubKey = txInfo.PubKey.substring(2);
						try {
							const txHashResponse = await this.transactionApi.sendTxWithIndices(wasmResponse.txType || SignerClient.TX_TYPE_CHANGE_PUB_KEY, JSON.stringify(txInfoRetry), this.config.accountIndex, this.config.apiKeyIndex, true, authToken);
							if (!txHashResponse.code || txHashResponse.code === 200) {
								const txHash = txHashResponse.tx_hash || txHashResponse.hash || wasmResponse.txHash || "";
								if (txHash) return [
									txHashResponse,
									txHash,
									null
								];
							}
						} catch (retryError) {}
					}
					if (!txInfo.PubKey.startsWith("0x") && txInfo.PubKey.length > 50) try {
						const bytes = Buffer.from(txInfo.PubKey, "base64");
						if (bytes.length === 40) {
							const hexPubKey = bytes.toString("hex");
							const txInfoRetry1 = { ...txInfo };
							txInfoRetry1.PubKey = "0x" + hexPubKey;
							try {
								const txHashResponse1 = await this.transactionApi.sendTxWithIndices(wasmResponse.txType || SignerClient.TX_TYPE_CHANGE_PUB_KEY, JSON.stringify(txInfoRetry1), this.config.accountIndex, this.config.apiKeyIndex, true, authToken);
								if (!txHashResponse1.code || txHashResponse1.code === 200) {
									const txHash1 = txHashResponse1.tx_hash || txHashResponse1.hash || wasmResponse.txHash || "";
									if (txHash1) return [
										txHashResponse1,
										txHash1,
										null
									];
								}
							} catch (e1) {}
							const txInfoRetry2 = { ...txInfo };
							txInfoRetry2.PubKey = hexPubKey;
							const txHashResponse2 = await this.transactionApi.sendTxWithIndices(wasmResponse.txType || SignerClient.TX_TYPE_CHANGE_PUB_KEY, JSON.stringify(txInfoRetry2), this.config.accountIndex, this.config.apiKeyIndex, true, authToken);
							if (txHashResponse2.code && txHashResponse2.code !== 200) return [
								null,
								"",
								txHashResponse2.message || `API error: ${txHashResponse2.code}`
							];
							const txHash2 = txHashResponse2.tx_hash || txHashResponse2.hash || wasmResponse.txHash || "";
							return txHash2 ? [
								txHashResponse2,
								txHash2,
								null
							] : [
								null,
								"",
								"No transaction hash"
							];
						}
					} catch (retryError) {
						return [
							null,
							"",
							errorMsg
						];
					}
				}
				return [
					null,
					"",
					errorMsg
				];
			}
		} catch (error) {
			return [
				null,
				"",
				error instanceof Error ? error.message : "Unknown error"
			];
		}
	}
	/**
	* Creates an authentication token with default expiry (10 minutes)
	* @returns Promise resolving to auth token string
	*/
	async createAuthToken() {
		return this.createAuthTokenWithExpiry();
	}
	/**
	* Creates an authentication token with custom expiry duration
	* @param expirySeconds - Token expiry duration in seconds (default: 10 minutes)
	* @returns Promise resolving to auth token string
	*/
	async createAuthTokenWithExpiry(expirySeconds = SignerClient.DEFAULT_10_MIN_AUTH_EXPIRY) {
		try {
			const deadline = expirySeconds === SignerClient.DEFAULT_10_MIN_AUTH_EXPIRY ? 0 : Math.floor(Date.now() / 1e3) + expirySeconds;
			return await this.wallet.createAuthToken(deadline, this.config.apiKeyIndex, this.config.accountIndex);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Unknown error";
			throw new Error(errorMessage);
		}
	}
	/**
	* Generate a new API key pair using WASM signer
	*/
	async generateAPIKey(seed) {
		try {
			return await this.wallet.generateAPIKey(seed);
		} catch (error) {
			return null;
		}
	}
	/**
	* Create a sub account
	* @param nonce - Optional nonce (will be fetched automatically if not provided)
	* @returns Promise resolving to [subAccountInfo, transactionHash, error]
	*/
	async createSubAccount(nonce = -1) {
		return await this.processTransactionWithRetry(async () => {
			try {
				const nextNonce = nonce === -1 ? await this.getNextNonce() : { nonce };
				const wasmResponse = await this.wallet.signCreateSubAccount({
					nonce: nextNonce.nonce,
					apiKeyIndex: this.config.apiKeyIndex,
					accountIndex: this.config.accountIndex
				});
				if (wasmResponse.error) return [
					null,
					"",
					wasmResponse.error
				];
				const txHash = await this.transactionApi.sendTxWithIndices(wasmResponse.txType || SignerClient.TX_TYPE_CREATE_SUB_ACCOUNT, wasmResponse.txInfo, this.config.accountIndex, this.config.apiKeyIndex);
				if (txHash.code && txHash.code !== 200) {
					this.acknowledgeFailure();
					return [
						null,
						"",
						txHash.message || "Transaction failed"
					];
				}
				return [
					JSON.parse(wasmResponse.txInfo),
					txHash.tx_hash || txHash.hash || wasmResponse.txHash || "",
					null
				];
			} catch (error) {
				return [
					null,
					"",
					error instanceof Error ? error.message : "Unknown error"
				];
			}
		});
	}
	/**
	* Cancel all orders
	*/
	async cancelAllOrders(timeInForce, time, nonce = -1, cancelAllMarketIndex = 255) {
		try {
			const nextNonce = nonce === -1 ? await this.getNextNonce() : { nonce };
			const wasmResponse = await this.wallet.signCancelAllOrders({
				timeInForce,
				time,
				cancelAllMarketIndex,
				nonce: nextNonce.nonce,
				apiKeyIndex: this.config.apiKeyIndex,
				accountIndex: this.config.accountIndex
			});
			if (wasmResponse.error) return [
				null,
				null,
				wasmResponse.error
			];
			return [
				JSON.parse(wasmResponse.txInfo),
				await this.transactionApi.sendTxWithIndices(wasmResponse.txType || SignerClient.TX_TYPE_CANCEL_ALL_ORDERS, wasmResponse.txInfo, this.config.accountIndex, this.config.apiKeyIndex),
				null
			];
		} catch (error) {
			return [
				null,
				null,
				error instanceof Error ? error.message : "Unknown error"
			];
		}
	}
	/**
	* Close all positions by creating opposite market orders
	* This method gets all open positions and creates market orders to close them
	*/
	async closeAllPositions() {
		try {
			const accountData = await this.accountApi.getAccount({
				by: "index",
				value: this.config.accountIndex.toString()
			});
			const account = accountData.accounts?.[0] || accountData;
			if (!account.positions || !Array.isArray(account.positions)) return [
				[],
				[],
				[]
			];
			const openPositions = account.positions.filter((pos) => parseFloat(pos.position) !== 0);
			if (openPositions.length === 0) return [
				[],
				[],
				[]
			];
			const closedTransactions = [];
			const closedResponses = [];
			const errors = [];
			for (const position of openPositions) try {
				const isLong = position.sign === 1;
				const positionSize = Math.abs(parseFloat(position.position));
				const baseAmount = Math.floor(positionSize * 1e6);
				const avgPrice = Math.abs(parseFloat(position.avg_entry_price));
				const priceInUnits = Math.floor(avgPrice * 1e5);
				const [tx, apiResponse, err] = await this.createMarketOrder({
					marketIndex: position.market_id,
					clientOrderIndex: Date.now() + Math.floor(Math.random() * 1e3),
					baseAmount,
					avgExecutionPrice: priceInUnits * 2,
					isAsk: isLong,
					reduceOnly: true
				});
				if (err) errors.push(`Failed to close position in market ${position.market_id} (${position.symbol}): ${err}`);
				else {
					closedTransactions.push(tx);
					closedResponses.push(apiResponse);
				}
			} catch (positionError) {
				errors.push(`Error closing position in market ${position.market_id}: ${positionError instanceof Error ? positionError.message : "Unknown error"}`);
			}
			return [
				closedTransactions,
				closedResponses,
				errors
			];
		} catch (error) {
			return [
				[],
				[],
				[error instanceof Error ? error.message : "Unknown error"]
			];
		}
	}
	/**
	* Modify an existing order
	* @param marketIndex - Market index
	* @param orderIndex - Order index to modify
	* @param baseAmount - New base amount
	* @param price - New price
	* @param triggerPrice - New trigger price (for conditional orders)
	* @param nonce - Optional nonce (will be fetched automatically if not provided)
	* @returns Promise resolving to [orderInfo, transactionHash, error]
	*/
	async modifyOrder(marketIndex, orderIndex, baseAmount, price, triggerPrice, nonce = -1, options) {
		return await this.processTransactionWithRetry(async () => {
			try {
				const nextNonce = options?.skipNonce || nonce === 0 ? { nonce: nonce === -1 ? 0 : nonce } : nonce === -1 ? await this.getNextNonce() : { nonce };
				const wasmResponse = await this.wallet.signModifyOrder({
					marketIndex,
					index: orderIndex,
					baseAmount,
					price,
					triggerPrice,
					integratorAccountIndex: options?.integratorAccountIndex ?? 0,
					integratorTakerFee: options?.integratorTakerFee ?? 0,
					integratorMakerFee: options?.integratorMakerFee ?? 0,
					skipNonce: options?.skipNonce ? 1 : 0,
					nonce: nextNonce.nonce,
					apiKeyIndex: this.config.apiKeyIndex,
					accountIndex: this.config.accountIndex,
					selfTradeBehaviorMode: options?.selfTradeBehaviorMode ?? 0,
					selfTradeEqualityMode: options?.selfTradeEqualityMode ?? 0
				});
				if (wasmResponse.error) return [
					null,
					"",
					wasmResponse.error
				];
				const txHash = await this.transactionApi.sendTxWithIndices(wasmResponse.txType || SignerClient.TX_TYPE_MODIFY_ORDER, wasmResponse.txInfo, this.config.accountIndex, this.config.apiKeyIndex);
				if (txHash.code && txHash.code !== 200) {
					this.acknowledgeFailure();
					return [
						null,
						"",
						txHash.message || "Transaction failed"
					];
				}
				return [
					JSON.parse(wasmResponse.txInfo),
					txHash.tx_hash || txHash.hash || wasmResponse.txHash || "",
					null
				];
			} catch (error) {
				return [
					null,
					"",
					error instanceof Error ? error.message : "Unknown error"
				];
			}
		});
	}
	/**
	* Transfer USDC between accounts (L2-to-L2 transfer)
	* @param params - Transfer parameters
	* @returns Promise resolving to [transferInfo, transactionHash, error]
	*/
	async transfer(params) {
		return await this.processTransactionWithRetry(async () => {
			try {
				const nextNonce = params.nonce === void 0 || params.nonce === -1 ? await this.getNextNonce() : { nonce: params.nonce };
				const scaledAmount = Math.floor(params.usdcAmount * SignerClient.USDC_TICKER_SCALE);
				const wasmParams = {
					toAccountIndex: params.toAccountIndex,
					asset_id: params.asset_id ?? 3,
					is_spot_account: params.is_spot_account ?? false,
					from_is_spot_account: params.from_is_spot_account,
					usdcAmount: scaledAmount,
					fee: params.fee,
					memo: params.memo,
					skipNonce: 0,
					nonce: nextNonce.nonce,
					apiKeyIndex: this.config.apiKeyIndex,
					accountIndex: this.config.accountIndex
				};
				if (params.ethPrivateKey !== void 0) wasmParams.ethPrivateKey = params.ethPrivateKey;
				const wasmResponse = await this.wallet.signTransfer(wasmParams);
				if (wasmResponse.error) return [
					null,
					"",
					wasmResponse.error
				];
				let txInfo = wasmResponse.txInfo;
				if (wasmResponse.messageToSign && params.ethPrivateKey) try {
					const l1Sig = await new (await (import("./ethers.mjs").then((n) => n.t))).Wallet(params.ethPrivateKey).signMessage(wasmResponse.messageToSign);
					const txInfoObj = JSON.parse(txInfo);
					txInfoObj.L1Sig = l1Sig;
					txInfo = JSON.stringify(txInfoObj);
				} catch (sigError) {
					return [
						null,
						"",
						`Failed to sign L1 message: ${sigError instanceof Error ? sigError.message : String(sigError)}`
					];
				}
				const txHash = await this.transactionApi.sendTxWithIndices(wasmResponse.txType || SignerClient.TX_TYPE_TRANSFER, txInfo, this.config.accountIndex, this.config.apiKeyIndex);
				if (txHash.code && txHash.code !== 200) {
					this.acknowledgeFailure();
					return [
						null,
						"",
						txHash.message || "Transaction failed"
					];
				}
				return [
					JSON.parse(wasmResponse.txInfo),
					txHash.tx_hash || txHash.hash || wasmResponse.txHash || "",
					null
				];
			} catch (error) {
				return [
					null,
					"",
					error instanceof Error ? error.message : "Unknown error"
				];
			}
		});
	}
	/**
	* Transfer USDC between subaccounts under the same master account (L2-to-L2 transfer).
	* This method does NOT require an L1 signature since both accounts share the same master.
	* @param params - Transfer parameters (does not require ethPrivateKey)
	* @returns Promise resolving to [transferInfo, transactionHash, error]
	*/
	async transferSameMasterAccount(params) {
		return await this.processTransactionWithRetry(async () => {
			try {
				const nextNonce = params.nonce === void 0 || params.nonce === -1 ? await this.getNextNonce() : { nonce: params.nonce };
				const scaledAmount = Math.floor(params.usdcAmount * SignerClient.USDC_TICKER_SCALE);
				const wasmParams = {
					toAccountIndex: params.toAccountIndex,
					asset_id: params.asset_id ?? 3,
					is_spot_account: params.is_spot_account ?? false,
					from_is_spot_account: params.from_is_spot_account,
					usdcAmount: scaledAmount,
					fee: params.fee,
					memo: params.memo,
					skipNonce: 0,
					nonce: nextNonce.nonce,
					apiKeyIndex: this.config.apiKeyIndex,
					accountIndex: this.config.accountIndex
				};
				const wasmResponse = await this.wallet.signTransfer(wasmParams);
				if (wasmResponse.error) return [
					null,
					"",
					wasmResponse.error
				];
				const txInfo = wasmResponse.txInfo;
				const txHash = await this.transactionApi.sendTxWithIndices(wasmResponse.txType || SignerClient.TX_TYPE_TRANSFER, txInfo, this.config.accountIndex, this.config.apiKeyIndex);
				if (txHash.code && txHash.code !== 200) {
					this.acknowledgeFailure();
					return [
						null,
						"",
						txHash.message || "Transaction failed"
					];
				}
				return [
					JSON.parse(wasmResponse.txInfo),
					txHash.tx_hash || txHash.hash || wasmResponse.txHash || "",
					null
				];
			} catch (error) {
				return [
					null,
					"",
					error instanceof Error ? error.message : "Unknown error"
				];
			}
		});
	}
	/**
	* Withdraw USDC from L2 to L1 (L2-to-L1 withdrawal)
	* @param params - Withdraw parameters
	* @returns Promise resolving to [withdrawInfo, transactionHash, error]
	*/
	async withdraw(params) {
		return await this.processTransactionWithRetry(async () => {
			try {
				const nextNonce = params.nonce === void 0 || params.nonce === -1 ? await this.getNextNonce() : { nonce: params.nonce };
				const scaledAmount = Math.floor(params.usdcAmount * SignerClient.USDC_TICKER_SCALE);
				const wasmResponse = await this.wallet.signWithdraw({
					usdcAmount: scaledAmount,
					assetIndex: params.assetIndex ?? 3,
					routeType: params.routeType ?? 0,
					nonce: nextNonce.nonce,
					apiKeyIndex: this.config.apiKeyIndex,
					accountIndex: this.config.accountIndex
				});
				if (wasmResponse.error) return [
					null,
					"",
					wasmResponse.error
				];
				const txHash = await this.transactionApi.sendTxWithIndices(wasmResponse.txType || SignerClient.TX_TYPE_WITHDRAW, wasmResponse.txInfo, this.config.accountIndex, this.config.apiKeyIndex);
				if (txHash.code && txHash.code !== 200) {
					this.acknowledgeFailure();
					return [
						null,
						"",
						txHash.message || "Transaction failed"
					];
				}
				return [
					JSON.parse(wasmResponse.txInfo),
					txHash.tx_hash || txHash.hash || wasmResponse.txHash || "",
					null
				];
			} catch (error) {
				return [
					null,
					"",
					error instanceof Error ? error.message : "Unknown error"
				];
			}
		});
	}
	/**
	* Update leverage for a specific market
	* @param marketIndex - Market index to update leverage for
	* @param marginMode - Margin mode: 0 for CROSS, 1 for ISOLATED
	* @param leverage - Desired leverage (e.g., 3 for 3x)
	* @param nonce - Optional nonce (will be fetched automatically if not provided)
	* @returns Promise resolving to [leverageInfo, transactionHash, error]
	*/
	async updateLeverage(marketIndex, marginMode, leverage, nonce = -1) {
		return await this.processTransactionWithRetry(async () => {
			try {
				const nextNonce = nonce === -1 ? await this.getNextNonce() : { nonce };
				const imf = Math.floor(1e4 / leverage);
				const wasmResponse = await this.wallet.signUpdateLeverage({
					marketIndex,
					fraction: imf,
					marginMode,
					nonce: nextNonce.nonce,
					apiKeyIndex: this.config.apiKeyIndex,
					accountIndex: this.config.accountIndex
				});
				if (wasmResponse.error) return [
					null,
					"",
					wasmResponse.error
				];
				const txHash = await this.transactionApi.sendTxWithIndices(wasmResponse.txType || SignerClient.TX_TYPE_UPDATE_LEVERAGE, wasmResponse.txInfo, this.config.accountIndex, this.config.apiKeyIndex);
				if (txHash.code && txHash.code !== 200) {
					this.acknowledgeFailure();
					return [
						null,
						"",
						txHash.message || "Transaction failed"
					];
				}
				return [
					JSON.parse(wasmResponse.txInfo),
					txHash.tx_hash || txHash.hash || wasmResponse.txHash || "",
					null
				];
			} catch (error) {
				return [
					null,
					"",
					error instanceof Error ? error.message : "Unknown error"
				];
			}
		});
	}
	/**
	* Update margin for a specific market
	* @param marketIndex - Market index to update margin for
	* @param usdcAmount - USDC amount to add/remove (in smallest unit, e.g., 1000000 = 1 USDC)
	* @param direction - Direction: 0 to add margin, 1 to remove margin
	* @param nonce - Optional nonce (will be fetched automatically if not provided)
	* @returns Promise resolving to [marginInfo, transactionHash, error]
	*/
	async updateMargin(marketIndex, usdcAmount, direction, nonce = -1) {
		return await this.processTransactionWithRetry(async () => {
			try {
				const nextNonce = nonce === -1 ? await this.getNextNonce() : { nonce };
				const scaledAmount = Math.floor(usdcAmount * SignerClient.USDC_TICKER_SCALE);
				const wasmResponse = await this.wallet.signUpdateMargin({
					marketIndex,
					usdcAmount: scaledAmount,
					direction,
					nonce: nextNonce.nonce,
					apiKeyIndex: this.config.apiKeyIndex,
					accountIndex: this.config.accountIndex
				});
				if (wasmResponse.error) return [
					null,
					"",
					wasmResponse.error
				];
				const txHash = await this.transactionApi.sendTxWithIndices(wasmResponse.txType || SignerClient.TX_TYPE_UPDATE_MARGIN, wasmResponse.txInfo, this.config.accountIndex, this.config.apiKeyIndex);
				if (txHash.code && txHash.code !== 200) {
					this.acknowledgeFailure();
					return [
						null,
						"",
						txHash.message || "Transaction failed"
					];
				}
				return [
					JSON.parse(wasmResponse.txInfo),
					txHash.tx_hash || txHash.hash || wasmResponse.txHash || "",
					null
				];
			} catch (error) {
				return [
					null,
					"",
					error instanceof Error ? error.message : "Unknown error"
				];
			}
		});
	}
	/**
	* Create a public pool
	* @param operatorFee - Operator fee (in basis points, e.g., 100 = 1%)
	* @param initialTotalShares - Initial total shares
	* @param minOperatorShareRate - Minimum operator share rate
	* @param nonce - Optional nonce (will be fetched automatically if not provided)
	* @returns Promise resolving to [poolInfo, transactionHash, error]
	*/
	async createPublicPool(operatorFee, initialTotalShares, minOperatorShareRate, nonce = -1) {
		return await this.processTransactionWithRetry(async () => {
			try {
				const nextNonce = nonce === -1 ? await this.getNextNonce() : { nonce };
				const wasmResponse = await this.wallet.signCreatePublicPool({
					operatorFee,
					initialTotalShares,
					minOperatorShareRate,
					nonce: nextNonce.nonce,
					apiKeyIndex: this.config.apiKeyIndex,
					accountIndex: this.config.accountIndex
				});
				if (wasmResponse.error) return [
					null,
					"",
					wasmResponse.error
				];
				const txHash = await this.transactionApi.sendTxWithIndices(wasmResponse.txType || SignerClient.TX_TYPE_CREATE_PUBLIC_POOL, wasmResponse.txInfo, this.config.accountIndex, this.config.apiKeyIndex);
				if (txHash.code && txHash.code !== 200) {
					this.acknowledgeFailure();
					return [
						null,
						"",
						txHash.message || "Transaction failed"
					];
				}
				return [
					JSON.parse(wasmResponse.txInfo),
					txHash.tx_hash || txHash.hash || wasmResponse.txHash || "",
					null
				];
			} catch (error) {
				return [
					null,
					"",
					error instanceof Error ? error.message : "Unknown error"
				];
			}
		});
	}
	/**
	* Update a public pool
	* @param publicPoolIndex - Public pool index
	* @param status - Pool status
	* @param operatorFee - Operator fee (in basis points)
	* @param minOperatorShareRate - Minimum operator share rate
	* @param nonce - Optional nonce (will be fetched automatically if not provided)
	* @returns Promise resolving to [poolInfo, transactionHash, error]
	*/
	async updatePublicPool(publicPoolIndex, status, operatorFee, minOperatorShareRate, nonce = -1) {
		return await this.processTransactionWithRetry(async () => {
			try {
				const nextNonce = nonce === -1 ? await this.getNextNonce() : { nonce };
				const wasmResponse = await this.wallet.signUpdatePublicPool({
					publicPoolIndex,
					status,
					operatorFee,
					minOperatorShareRate,
					nonce: nextNonce.nonce,
					apiKeyIndex: this.config.apiKeyIndex,
					accountIndex: this.config.accountIndex
				});
				if (wasmResponse.error) return [
					null,
					"",
					wasmResponse.error
				];
				const txHash = await this.transactionApi.sendTxWithIndices(wasmResponse.txType || SignerClient.TX_TYPE_UPDATE_PUBLIC_POOL, wasmResponse.txInfo, this.config.accountIndex, this.config.apiKeyIndex);
				if (txHash.code && txHash.code !== 200) {
					this.acknowledgeFailure();
					return [
						null,
						"",
						txHash.message || "Transaction failed"
					];
				}
				return [
					JSON.parse(wasmResponse.txInfo),
					txHash.tx_hash || txHash.hash || wasmResponse.txHash || "",
					null
				];
			} catch (error) {
				return [
					null,
					"",
					error instanceof Error ? error.message : "Unknown error"
				];
			}
		});
	}
	/**
	* Mint shares in a public pool
	* @param publicPoolIndex - Public pool index
	* @param shareAmount - Amount of shares to mint
	* @param nonce - Optional nonce (will be fetched automatically if not provided)
	* @returns Promise resolving to [mintInfo, transactionHash, error]
	*/
	async mintShares(publicPoolIndex, shareAmount, nonce = -1) {
		return await this.processTransactionWithRetry(async () => {
			try {
				const nextNonce = nonce === -1 ? await this.getNextNonce() : { nonce };
				const wasmResponse = await this.wallet.signMintShares({
					publicPoolIndex,
					shareAmount,
					nonce: nextNonce.nonce,
					apiKeyIndex: this.config.apiKeyIndex,
					accountIndex: this.config.accountIndex
				});
				if (wasmResponse.error) return [
					null,
					"",
					wasmResponse.error
				];
				const txHash = await this.transactionApi.sendTxWithIndices(wasmResponse.txType || SignerClient.TX_TYPE_MINT_SHARES, wasmResponse.txInfo, this.config.accountIndex, this.config.apiKeyIndex);
				if (txHash.code && txHash.code !== 200) {
					this.acknowledgeFailure();
					return [
						null,
						"",
						txHash.message || "Transaction failed"
					];
				}
				return [
					JSON.parse(wasmResponse.txInfo),
					txHash.tx_hash || txHash.hash || wasmResponse.txHash || "",
					null
				];
			} catch (error) {
				return [
					null,
					"",
					error instanceof Error ? error.message : "Unknown error"
				];
			}
		});
	}
	/**
	* Burn shares in a public pool
	* @param publicPoolIndex - Public pool index
	* @param shareAmount - Amount of shares to burn
	* @param nonce - Optional nonce (will be fetched automatically if not provided)
	* @returns Promise resolving to [burnInfo, transactionHash, error]
	*/
	async burnShares(publicPoolIndex, shareAmount, nonce = -1) {
		return await this.processTransactionWithRetry(async () => {
			try {
				const nextNonce = nonce === -1 ? await this.getNextNonce() : { nonce };
				const wasmResponse = await this.wallet.signBurnShares({
					publicPoolIndex,
					shareAmount,
					nonce: nextNonce.nonce,
					apiKeyIndex: this.config.apiKeyIndex,
					accountIndex: this.config.accountIndex
				});
				if (wasmResponse.error) return [
					null,
					"",
					wasmResponse.error
				];
				const txHash = await this.transactionApi.sendTxWithIndices(wasmResponse.txType || SignerClient.TX_TYPE_BURN_SHARES, wasmResponse.txInfo, this.config.accountIndex, this.config.apiKeyIndex);
				if (txHash.code && txHash.code !== 200) {
					this.acknowledgeFailure();
					return [
						null,
						"",
						txHash.message || "Transaction failed"
					];
				}
				return [
					JSON.parse(wasmResponse.txInfo),
					txHash.tx_hash || txHash.hash || wasmResponse.txHash || "",
					null
				];
			} catch (error) {
				return [
					null,
					"",
					error instanceof Error ? error.message : "Unknown error"
				];
			}
		});
	}
	/**
	* Stake assets in a staking pool
	* @param stakingPoolIndex - Staking pool index
	* @param shareAmount - Amount of shares to stake
	* @param nonce - Optional nonce (will be fetched automatically if not provided)
	* @returns Promise resolving to [stakeInfo, transactionHash, error]
	*/
	async stakeAssets(stakingPoolIndex, shareAmount, nonce = -1) {
		return await this.processTransactionWithRetry(async () => {
			try {
				const nextNonce = nonce === -1 ? await this.getNextNonce() : { nonce };
				const wasmResponse = await this.wallet.signStakeAssets({
					stakingPoolIndex,
					shareAmount,
					nonce: nextNonce.nonce,
					apiKeyIndex: this.config.apiKeyIndex,
					accountIndex: this.config.accountIndex
				});
				if (wasmResponse.error) return [
					null,
					"",
					wasmResponse.error
				];
				const txHash = await this.transactionApi.sendTxWithIndices(wasmResponse.txType || SignerClient.TX_TYPE_STAKE_ASSETS, wasmResponse.txInfo, this.config.accountIndex, this.config.apiKeyIndex);
				if (txHash.code && txHash.code !== 200) {
					this.acknowledgeFailure();
					return [
						null,
						"",
						txHash.message || "Transaction failed"
					];
				}
				return [
					JSON.parse(wasmResponse.txInfo),
					txHash.tx_hash || txHash.hash || wasmResponse.txHash || "",
					null
				];
			} catch (error) {
				return [
					null,
					"",
					error instanceof Error ? error.message : "Unknown error"
				];
			}
		});
	}
	/**
	* Unstake assets from a staking pool
	* @param stakingPoolIndex - Staking pool index
	* @param shareAmount - Amount of shares to unstake
	* @param nonce - Optional nonce (will be fetched automatically if not provided)
	* @returns Promise resolving to [unstakeInfo, transactionHash, error]
	*/
	async unstakeAssets(stakingPoolIndex, shareAmount, nonce = -1) {
		return await this.processTransactionWithRetry(async () => {
			try {
				const nextNonce = nonce === -1 ? await this.getNextNonce() : { nonce };
				const wasmResponse = await this.wallet.signUnstakeAssets({
					stakingPoolIndex,
					shareAmount,
					nonce: nextNonce.nonce,
					apiKeyIndex: this.config.apiKeyIndex,
					accountIndex: this.config.accountIndex
				});
				if (wasmResponse.error) return [
					null,
					"",
					wasmResponse.error
				];
				const txHash = await this.transactionApi.sendTxWithIndices(wasmResponse.txType || SignerClient.TX_TYPE_UNSTAKE_ASSETS, wasmResponse.txInfo, this.config.accountIndex, this.config.apiKeyIndex);
				if (txHash.code && txHash.code !== 200) {
					this.acknowledgeFailure();
					return [
						null,
						"",
						txHash.message || "Transaction failed"
					];
				}
				return [
					JSON.parse(wasmResponse.txInfo),
					txHash.tx_hash || txHash.hash || wasmResponse.txHash || "",
					null
				];
			} catch (error) {
				return [
					null,
					"",
					error instanceof Error ? error.message : "Unknown error"
				];
			}
		});
	}
	/**
	* Approve an integrator with fee caps and expiry
	* @param integratorIndex - Integrator account index
	* @param maxPerpsTakerFee - Max perps taker fee
	* @param maxPerpsMakerFee - Max perps maker fee
	* @param maxSpotTakerFee - Max spot taker fee
	* @param maxSpotMakerFee - Max spot maker fee
	* @param approvalExpiry - Approval expiry timestamp
	* @param nonce - Optional nonce (will be fetched automatically if not provided)
	* @returns Promise resolving to [approveInfo, transactionHash, error]
	*/
	async approveIntegrator(integratorIndex, maxPerpsTakerFee, maxPerpsMakerFee, maxSpotTakerFee, maxSpotMakerFee, approvalExpiry, nonce = -1) {
		return await this.processTransactionWithRetry(async () => {
			try {
				const nextNonce = nonce === -1 ? await this.getNextNonce() : { nonce };
				const wasmResponse = await this.wallet.signApproveIntegrator({
					integratorIndex,
					maxPerpsTakerFee,
					maxPerpsMakerFee,
					maxSpotTakerFee,
					maxSpotMakerFee,
					approvalExpiry,
					nonce: nextNonce.nonce,
					apiKeyIndex: this.config.apiKeyIndex,
					accountIndex: this.config.accountIndex
				});
				if (wasmResponse.error) return [
					null,
					"",
					wasmResponse.error
				];
				const txHash = await this.transactionApi.sendTxWithIndices(wasmResponse.txType || SignerClient.TX_TYPE_APPROVE_INTEGRATOR, wasmResponse.txInfo, this.config.accountIndex, this.config.apiKeyIndex);
				if (txHash.code && txHash.code !== 200) {
					this.acknowledgeFailure();
					return [
						null,
						"",
						txHash.message || "Transaction failed"
					];
				}
				return [
					JSON.parse(wasmResponse.txInfo),
					txHash.tx_hash || txHash.hash || wasmResponse.txHash || "",
					null
				];
			} catch (error) {
				return [
					null,
					"",
					error instanceof Error ? error.message : "Unknown error"
				];
			}
		});
	}
	/**
	* Create OCO grouped orders (One Cancels Other)
	* @param params - OCO order parameters (exactly two orders)
	* @returns Promise resolving to grouped transaction result
	*/
	async createOcoOrder(params) {
		if (!params.orders || params.orders.length !== 2) return {
			tx: null,
			hash: "",
			error: "OCO requires exactly two orders"
		};
		const orders = params.orders.map((order) => ({
			marketIndex: order.marketIndex,
			clientOrderIndex: order.clientOrderIndex ?? 0,
			baseAmount: order.baseAmount,
			price: order.price,
			isAsk: order.isAsk,
			orderType: order.orderType ?? OrderType.LIMIT,
			timeInForce: order.timeInForce ?? TimeInForce.GOOD_TILL_TIME,
			reduceOnly: order.reduceOnly ?? false,
			triggerPrice: order.triggerPrice ?? SignerClient.NIL_TRIGGER_PRICE,
			orderExpiry: order.orderExpiry ?? SignerClient.DEFAULT_28_DAY_ORDER_EXPIRY,
			integratorAccountIndex: order.integratorAccountIndex ?? params.integratorAccountIndex ?? 0,
			integratorTakerFee: order.integratorTakerFee ?? params.integratorTakerFee ?? 0,
			integratorMakerFee: order.integratorMakerFee ?? params.integratorMakerFee ?? 0
		}));
		const [tx, hash, error] = await this.createGroupedOrders(GroupingType.OCO, orders, params.nonce ?? -1, {
			...params.skipNonce !== void 0 && { skipNonce: params.skipNonce },
			...params.integratorAccountIndex !== void 0 && { integratorAccountIndex: params.integratorAccountIndex },
			...params.integratorTakerFee !== void 0 && { integratorTakerFee: params.integratorTakerFee },
			...params.integratorMakerFee !== void 0 && { integratorMakerFee: params.integratorMakerFee }
		});
		return {
			tx,
			hash,
			error
		};
	}
	/**
	* Create OTOCO grouped orders (entry + take-profit + stop-loss)
	* @param params - OTOCO order parameters
	* @returns Promise resolving to grouped transaction result
	*/
	async createOtocoOrder(params) {
		const { mainOrder, stopLoss, takeProfit } = params;
		if (mainOrder.baseAmount <= 0) return {
			tx: null,
			hash: "",
			error: "Main order baseAmount must be greater than 0"
		};
		if (stopLoss.triggerPrice <= 0 || takeProfit.triggerPrice <= 0) return {
			tx: null,
			hash: "",
			error: "Stop-loss and take-profit triggerPrice must be greater than 0"
		};
		const isMarketMainOrder = mainOrder.orderType === OrderType.MARKET;
		let mainPrice = mainOrder.price;
		if (isMarketMainOrder) {
			mainPrice = mainOrder.avgExecutionPrice;
			if (mainOrder.maxSlippage !== void 0 && mainOrder.maxSlippage > 0) {
				const idealPrice = mainOrder.idealPrice || mainPrice || 4e3;
				const slippageMultiplier = 1 + mainOrder.maxSlippage * (mainOrder.isAsk ? -1 : 1);
				mainPrice = Math.round(idealPrice * slippageMultiplier);
			} else if (!mainPrice) {
				const defaultIdealPrice = mainOrder.idealPrice || 4e3;
				const slippageMultiplier = 1 + .001 * (mainOrder.isAsk ? -1 : 1);
				mainPrice = Math.round(defaultIdealPrice * slippageMultiplier);
			}
		} else if (!mainPrice || mainPrice <= 0) return {
			tx: null,
			hash: "",
			error: "Main LIMIT order requires a valid price"
		};
		const mainExpiry = isMarketMainOrder ? 0 : mainOrder.orderExpiry === void 0 || mainOrder.orderExpiry === -1 ? Date.now() + 24192e5 : mainOrder.orderExpiry;
		const protectionExpiryDefault = Date.now() + 24192e5;
		const groupedOrders = [
			{
				marketIndex: mainOrder.marketIndex,
				clientOrderIndex: 0,
				baseAmount: mainOrder.baseAmount,
				price: mainPrice,
				isAsk: mainOrder.isAsk,
				orderType: isMarketMainOrder ? SignerClient.ORDER_TYPE_MARKET : SignerClient.ORDER_TYPE_LIMIT,
				timeInForce: isMarketMainOrder ? SignerClient.ORDER_TIME_IN_FORCE_IMMEDIATE_OR_CANCEL : mainOrder.timeInForce ?? SignerClient.ORDER_TIME_IN_FORCE_GOOD_TILL_TIME,
				reduceOnly: mainOrder.reduceOnly ?? false,
				triggerPrice: SignerClient.NIL_TRIGGER_PRICE,
				orderExpiry: mainExpiry,
				integratorAccountIndex: mainOrder.integratorAccountIndex ?? params.integratorAccountIndex ?? 0,
				integratorTakerFee: mainOrder.integratorTakerFee ?? params.integratorTakerFee ?? 0,
				integratorMakerFee: mainOrder.integratorMakerFee ?? params.integratorMakerFee ?? 0
			},
			{
				marketIndex: mainOrder.marketIndex,
				clientOrderIndex: 0,
				baseAmount: 0,
				price: takeProfit.price ?? takeProfit.triggerPrice,
				isAsk: !mainOrder.isAsk,
				orderType: takeProfit.isLimit ? SignerClient.ORDER_TYPE_TAKE_PROFIT_LIMIT : SignerClient.ORDER_TYPE_TAKE_PROFIT,
				timeInForce: takeProfit.isLimit ? SignerClient.ORDER_TIME_IN_FORCE_GOOD_TILL_TIME : SignerClient.ORDER_TIME_IN_FORCE_IMMEDIATE_OR_CANCEL,
				reduceOnly: true,
				triggerPrice: takeProfit.triggerPrice,
				orderExpiry: takeProfit.orderExpiry ?? protectionExpiryDefault,
				integratorAccountIndex: takeProfit.integratorAccountIndex ?? params.integratorAccountIndex ?? 0,
				integratorTakerFee: takeProfit.integratorTakerFee ?? params.integratorTakerFee ?? 0,
				integratorMakerFee: takeProfit.integratorMakerFee ?? params.integratorMakerFee ?? 0
			},
			{
				marketIndex: mainOrder.marketIndex,
				clientOrderIndex: 0,
				baseAmount: 0,
				price: stopLoss.price ?? stopLoss.triggerPrice,
				isAsk: !mainOrder.isAsk,
				orderType: stopLoss.isLimit ? SignerClient.ORDER_TYPE_STOP_LOSS_LIMIT : SignerClient.ORDER_TYPE_STOP_LOSS,
				timeInForce: stopLoss.isLimit ? SignerClient.ORDER_TIME_IN_FORCE_GOOD_TILL_TIME : SignerClient.ORDER_TIME_IN_FORCE_IMMEDIATE_OR_CANCEL,
				reduceOnly: true,
				triggerPrice: stopLoss.triggerPrice,
				orderExpiry: stopLoss.orderExpiry ?? protectionExpiryDefault,
				integratorAccountIndex: stopLoss.integratorAccountIndex ?? params.integratorAccountIndex ?? 0,
				integratorTakerFee: stopLoss.integratorTakerFee ?? params.integratorTakerFee ?? 0,
				integratorMakerFee: stopLoss.integratorMakerFee ?? params.integratorMakerFee ?? 0
			}
		];
		const [tx, hash, error] = await this.createGroupedOrders(GroupingType.OTOCO, groupedOrders, params.nonce ?? -1, {
			...params.skipNonce !== void 0 && { skipNonce: params.skipNonce },
			...params.integratorAccountIndex !== void 0 && { integratorAccountIndex: params.integratorAccountIndex },
			...params.integratorTakerFee !== void 0 && { integratorTakerFee: params.integratorTakerFee },
			...params.integratorMakerFee !== void 0 && { integratorMakerFee: params.integratorMakerFee }
		});
		return {
			tx,
			hash,
			error
		};
	}
	/**
	* Create grouped orders (OTO/OCO/OTOCO)
	* @param groupingType - Grouping type: 1=OTO, 2=OCO, 3=OTOCO
	* @param orders - Array of order parameters
	* @param nonce - Optional nonce (will be fetched automatically if not provided)
	* @returns Promise resolving to [groupedOrdersInfo, transactionHash, error]
	*/
	async createGroupedOrders(groupingType, orders, nonce = -1, options) {
		return await this.processTransactionWithRetry(async () => {
			try {
				const nextNonce = options?.skipNonce || nonce === 0 ? { nonce: nonce === -1 ? 0 : nonce } : nonce === -1 ? await this.getNextNonce() : { nonce };
				const wasmOrders = orders.map((order) => ({
					marketIndex: order.marketIndex,
					clientOrderIndex: order.clientOrderIndex,
					baseAmount: order.baseAmount,
					price: order.price,
					isAsk: order.isAsk ? 1 : 0,
					orderType: order.orderType,
					timeInForce: order.timeInForce,
					reduceOnly: order.reduceOnly ?? false ? 1 : 0,
					triggerPrice: order.triggerPrice || SignerClient.NIL_TRIGGER_PRICE,
					orderExpiry: order.orderExpiry ?? SignerClient.DEFAULT_28_DAY_ORDER_EXPIRY,
					integratorAccountIndex: order.integratorAccountIndex ?? options?.integratorAccountIndex ?? 0,
					integratorTakerFee: order.integratorTakerFee ?? options?.integratorTakerFee ?? 0,
					integratorMakerFee: order.integratorMakerFee ?? options?.integratorMakerFee ?? 0
				}));
				const wasmResponse = await this.wallet.signCreateGroupedOrders({
					groupingType,
					orders: wasmOrders,
					integratorAccountIndex: options?.integratorAccountIndex ?? 0,
					integratorTakerFee: options?.integratorTakerFee ?? 0,
					integratorMakerFee: options?.integratorMakerFee ?? 0,
					skipNonce: options?.skipNonce ? 1 : 0,
					nonce: nextNonce.nonce,
					apiKeyIndex: this.config.apiKeyIndex,
					accountIndex: this.config.accountIndex,
					selfTradeBehaviorMode: options?.selfTradeBehaviorMode ?? 0,
					selfTradeEqualityMode: options?.selfTradeEqualityMode ?? 0
				});
				if (wasmResponse.error) return [
					null,
					"",
					wasmResponse.error
				];
				const txHash = await this.transactionApi.sendTxWithIndices(wasmResponse.txType || SignerClient.TX_TYPE_CREATE_GROUPED_ORDERS, wasmResponse.txInfo, this.config.accountIndex, this.config.apiKeyIndex);
				if (txHash.code && txHash.code !== 200) {
					this.acknowledgeFailure();
					return [
						null,
						"",
						txHash.message || "Transaction failed"
					];
				}
				return [
					JSON.parse(wasmResponse.txInfo),
					txHash.tx_hash || txHash.hash || wasmResponse.txHash || "",
					null
				];
			} catch (error) {
				return [
					null,
					"",
					error instanceof Error ? error.message : "Unknown error"
				];
			}
		});
	}
	async updateAccountConfig(accountTradingMode, nonce = -1) {
		return await this.processTransactionWithRetry(async () => {
			try {
				const nextNonce = nonce === -1 ? await this.getNextNonce() : { nonce };
				const wasmResponse = await this.wallet.signUpdateAccountConfig({
					accountTradingMode,
					nonce: nextNonce.nonce,
					apiKeyIndex: this.config.apiKeyIndex,
					accountIndex: this.config.accountIndex
				});
				if (wasmResponse.error) return [
					null,
					"",
					wasmResponse.error
				];
				const txHash = await this.transactionApi.sendTxWithIndices(wasmResponse.txType || SignerClient.TX_TYPE_UPDATE_ACCOUNT_CONFIG, wasmResponse.txInfo, this.config.accountIndex, this.config.apiKeyIndex);
				if (txHash.code && txHash.code !== 200) {
					this.acknowledgeFailure();
					return [
						null,
						"",
						txHash.message || "Transaction failed"
					];
				}
				return [
					JSON.parse(wasmResponse.txInfo),
					txHash.tx_hash || txHash.hash || wasmResponse.txHash || "",
					null
				];
			} catch (error) {
				return [
					null,
					"",
					error instanceof Error ? error.message : "Unknown error"
				];
			}
		});
	}
	async updateAccountAssetConfig(assetIndex, assetMarginMode, nonce = -1) {
		return await this.processTransactionWithRetry(async () => {
			try {
				const nextNonce = nonce === -1 ? await this.getNextNonce() : { nonce };
				const wasmResponse = await this.wallet.signUpdateAccountAssetConfig({
					assetIndex,
					assetMarginMode,
					nonce: nextNonce.nonce,
					apiKeyIndex: this.config.apiKeyIndex,
					accountIndex: this.config.accountIndex
				});
				if (wasmResponse.error) return [
					null,
					"",
					wasmResponse.error
				];
				const txHash = await this.transactionApi.sendTxWithIndices(wasmResponse.txType || SignerClient.TX_TYPE_UPDATE_ACCOUNT_ASSET_CONFIG, wasmResponse.txInfo, this.config.accountIndex, this.config.apiKeyIndex);
				if (txHash.code && txHash.code !== 200) {
					this.acknowledgeFailure();
					return [
						null,
						"",
						txHash.message || "Transaction failed"
					];
				}
				return [
					JSON.parse(wasmResponse.txInfo),
					txHash.tx_hash || txHash.hash || wasmResponse.txHash || "",
					null
				];
			} catch (error) {
				return [
					null,
					"",
					error instanceof Error ? error.message : "Unknown error"
				];
			}
		});
	}
	/**
	* Get fast bridge information including limits
	* @returns Promise<FastBridgeInfo>
	*/
	async getFastBridgeInfo() {
		return await this.bridgeApi.getFastBridgeInfo();
	}
	/**
	* Get supported bridge networks
	* @returns Promise<BridgeSupportedNetwork[]>
	*/
	async getSupportedNetworks() {
		return await this.bridgeApi.getSupportedNetworks();
	}
	/**
	* Get deposit history for the current account
	* @param l1Address - L1 address
	* @param cursor - Pagination cursor
	* @param filter - Filter criteria
	* @returns Promise<DepositHistory>
	*/
	async getDepositHistory(l1Address, cursor, filter) {
		const authToken = await this.createAuthTokenWithExpiry();
		return await this.bridgeApi.getDepositHistory(this.config.accountIndex, l1Address, authToken, cursor, filter);
	}
	/**
	* Get withdraw history for the current account
	* @param l1Address - L1 address
	* @param cursor - Pagination cursor
	* @param filter - Filter criteria
	* @returns Promise<WithdrawHistory>
	*/
	async getWithdrawHistory(l1Address, cursor, filter) {
		const authToken = await this.createAuthTokenWithExpiry();
		return await this.bridgeApi.getWithdrawHistory(this.config.accountIndex, l1Address, authToken, cursor, filter);
	}
	/**
	* Deposit USDC from L1 to L2
	* @param params - L1 deposit parameters
	* @returns Promise<L1DepositResult>
	*/
	async depositFromL1(params) {
		return await this.bridgeApi.depositFromL1(params);
	}
	/**
	* Get USDC balance on L1
	* @param address - Ethereum address
	* @returns Promise<string> - Balance in USDC units
	*/
	async getL1USDCBalance(address) {
		return await this.bridgeApi.getL1USDCBalance(address);
	}
	/**
	* Get USDC allowance for bridge contract
	* @param address - Ethereum address
	* @returns Promise<string> - Allowance in USDC units
	*/
	async getL1USDCAllowance(address) {
		return await this.bridgeApi.getL1USDCAllowance(address);
	}
	/**
	* Get L1 transaction status
	* @param txHash - Transaction hash
	* @returns Promise<L1DepositResult>
	*/
	async getL1TransactionStatus(txHash) {
		return await this.bridgeApi.getL1TransactionStatus(txHash);
	}
	async getTransaction(txHash) {
		return await this.transactionApi.getTransaction({
			by: "hash",
			value: txHash
		});
	}
	async waitForTransaction(txHash, maxWaitTime = 12e4, pollInterval = 2e3) {
		const startTime = Date.now();
		let dots = "";
		let animationInterval = null;
		const logsApi = new LogsApi(new ExplorerApiClient({ explorerHost: ExplorerApiClient.resolveExplorerHost(this.config.url) }));
		const startAnimation = () => {
			animationInterval = setInterval(() => {
				dots = dots.length >= 3 ? "" : dots + ".";
				process.stdout.write(`\r⏳ Transaction ${txHash.substring(0, 16)}${dots}   `);
			}, 500);
		};
		const stopAnimation = () => {
			if (animationInterval) {
				clearInterval(animationInterval);
				animationInterval = null;
			}
			process.stdout.write("\r" + " ".repeat(80) + "\r");
		};
		const getLogError = (status) => {
			if (status === "failed") return "Transaction failed";
			if (status === "rejected") return "Transaction rejected";
			return `Transaction ${status}`;
		};
		const checkCoreTxStatus = async () => {
			const transaction = await this.transactionApi.getTransaction({
				by: "hash",
				value: txHash
			});
			const txStatus = typeof transaction.status === "number" ? transaction.status : parseInt(String(transaction.status), 10);
			if (txStatus === SignerClient.TX_STATUS_COMMITTED || txStatus === SignerClient.TX_STATUS_EXECUTED) return transaction;
			if (txStatus === SignerClient.TX_STATUS_FAILED || txStatus === SignerClient.TX_STATUS_REJECTED) throw new TransactionException(`Transaction ${txStatus === SignerClient.TX_STATUS_FAILED ? "failed" : "rejected"}`, "waitForTransaction", transaction);
			return null;
		};
		try {
			startAnimation();
			while (Date.now() - startTime < maxWaitTime) try {
				const log = await logsApi.getByHash(txHash);
				const status = log.status;
				if (status === "committed" || status === "executed") {
					stopAnimation();
					return log;
				}
				if (status === "failed" || status === "rejected") {
					stopAnimation();
					throw new TransactionException(getLogError(status), "waitForTransaction", log);
				}
				try {
					const transaction = await checkCoreTxStatus();
					if (transaction) {
						stopAnimation();
						return transaction;
					}
				} catch (coreError) {
					if (coreError instanceof TransactionException) {
						stopAnimation();
						throw coreError;
					}
				}
				await new Promise((resolve) => setTimeout(resolve, pollInterval));
			} catch (error) {
				if (error instanceof TransactionException) throw error;
				try {
					const transaction = await checkCoreTxStatus();
					if (transaction) {
						stopAnimation();
						return transaction;
					}
				} catch (coreError) {
					if (coreError instanceof TransactionException) {
						stopAnimation();
						throw coreError;
					}
				}
				await new Promise((resolve) => setTimeout(resolve, pollInterval));
			}
			stopAnimation();
			throw new Error(`Transaction ${txHash} did not confirm within ${maxWaitTime}ms`);
		} finally {
			stopAnimation();
		}
	}
	/**
	* Get list of subaccounts for the current master account
	* @returns Array of subaccount indices
	*/
	async getSubAccounts() {
		try {
			const response = await this.accountApi.getAccount({
				by: "index",
				value: this.config.accountIndex.toString()
			});
			let account;
			if (response.accounts && Array.isArray(response.accounts)) account = response.accounts[0];
			else if (response.data) account = response.data;
			else account = response;
			const subAccountsField = account.sub_accounts || account.subAccounts || account.subaccounts || account.related_accounts || account.sub_account_indices;
			if (subAccountsField && Array.isArray(subAccountsField) && subAccountsField.length > 0) return subAccountsField.map((sub) => {
				if (typeof sub === "object" && sub !== null) return parseInt(sub.index || sub.account_index || sub.accountIndex, 10);
				return parseInt(sub, 10);
			});
			if (account.l1_address) {
				const accountsResponse = await this.accountApi.getAccountsByL1Address(account.l1_address);
				const accountsArray = accountsResponse.sub_accounts || accountsResponse.accounts || accountsResponse;
				if (Array.isArray(accountsArray)) {
					const subAccountIndices = accountsArray.filter((acc) => (acc.account_type === 1 || acc.account_type === "1") && parseInt(acc.index, 10) !== this.config.accountIndex).map((acc) => parseInt(acc.index, 10));
					if (subAccountIndices.length > 0) return subAccountIndices;
				}
			}
			return [];
		} catch (error) {
			logger.debug("Error fetching subaccounts", { error: error instanceof Error ? error.message : "Unknown error" });
			return [];
		}
	}
	/**
	* Check if a specific account index is a subaccount of the current master account
	* @param accountIndex - Account index to check
	* @returns True if the account is a subaccount
	*/
	async isSubAccount(accountIndex) {
		return (await this.getSubAccounts()).includes(accountIndex);
	}
	/**
	* Check if the current account is a master account or subaccount
	* Master accounts have lower indices (typically < 2^47 - 1)
	* Subaccounts are created sequentially after their master
	* @returns Object with isMaster flag and estimated master index
	*/
	checkAccountType() {
		const MAX_MASTER_ACCOUNT_INDEX = 0x7fffffffffff;
		const accountIndex = this.config.accountIndex;
		if (accountIndex <= MAX_MASTER_ACCOUNT_INDEX) return {
			isMaster: true,
			estimatedMasterIndex: null
		};
		return {
			isMaster: false,
			estimatedMasterIndex: accountIndex - 1
		};
	}
	/**
	* Close the API client connection
	*/
	async close() {
		try {
			if (this.wsOrderClient) {
				await this.wsOrderClient.disconnect();
				this.wsOrderClient = null;
			}
			if (this.orderBatcher) {
				await this.orderBatcher.destroy();
				this.orderBatcher = null;
			}
			if (this.nonceCache) this.nonceCache.clearAllCache();
		} finally {
			await this.apiClient.close();
		}
	}
};
SignerClient.ORDER_TYPE_LIMIT = 0;
SignerClient.ORDER_TYPE_MARKET = 1;
SignerClient.ORDER_TIME_IN_FORCE_GOOD_TILL_TIME = 1;
SignerClient.ORDER_TIME_IN_FORCE_IMMEDIATE_OR_CANCEL = 0;
SignerClient.ORDER_TIME_IN_FORCE_FILL_OR_KILL = 2;
SignerClient.USDC_TICKER_SCALE = 1e6;
SignerClient.TX_TYPE_CHANGE_PUB_KEY = 8;
SignerClient.TX_TYPE_CREATE_SUB_ACCOUNT = 9;
SignerClient.TX_TYPE_CREATE_PUBLIC_POOL = 10;
SignerClient.TX_TYPE_UPDATE_PUBLIC_POOL = 11;
SignerClient.TX_TYPE_TRANSFER = 12;
SignerClient.TX_TYPE_WITHDRAW = 13;
SignerClient.TX_TYPE_CREATE_ORDER = 14;
SignerClient.TX_TYPE_CANCEL_ORDER = 15;
SignerClient.TX_TYPE_CANCEL_ALL_ORDERS = 16;
SignerClient.TX_TYPE_MODIFY_ORDER = 17;
SignerClient.TX_TYPE_MINT_SHARES = 18;
SignerClient.TX_TYPE_BURN_SHARES = 19;
SignerClient.TX_TYPE_UPDATE_LEVERAGE = 20;
SignerClient.TX_TYPE_CREATE_GROUPED_ORDERS = 28;
SignerClient.TX_TYPE_UPDATE_MARGIN = 29;
SignerClient.TX_TYPE_STAKE_ASSETS = 35;
SignerClient.TX_TYPE_UNSTAKE_ASSETS = 36;
SignerClient.TX_TYPE_APPROVE_INTEGRATOR = 45;
SignerClient.ORDER_TYPE_STOP_LOSS = 2;
SignerClient.ORDER_TYPE_STOP_LOSS_LIMIT = 3;
SignerClient.ORDER_TYPE_TAKE_PROFIT = 4;
SignerClient.ORDER_TYPE_TAKE_PROFIT_LIMIT = 5;
SignerClient.ORDER_TYPE_TWAP = 6;
SignerClient.BUY = false;
SignerClient.SELL = true;
SignerClient.NOT_REDUCE_ONLY = false;
SignerClient.REDUCE_ONLY = true;
SignerClient.ORDER_TIME_IN_FORCE_POST_ONLY = 2;
SignerClient.CANCEL_ALL_TIF_IMMEDIATE = 0;
SignerClient.CANCEL_ALL_TIF_SCHEDULED = 1;
SignerClient.CANCEL_ALL_TIF_ABORT = 2;
SignerClient.NIL_TRIGGER_PRICE = 0;
SignerClient.DEFAULT_28_DAY_ORDER_EXPIRY = -1;
SignerClient.DEFAULT_IOC_EXPIRY = 0;
SignerClient.DEFAULT_10_MIN_AUTH_EXPIRY = -1;
SignerClient.MINUTE = 60;
SignerClient.TX_STATUS_PENDING = 0;
SignerClient.TX_STATUS_QUEUED = 1;
SignerClient.TX_STATUS_COMMITTED = 2;
SignerClient.TX_STATUS_EXECUTED = 3;
SignerClient.TX_STATUS_FAILED = 4;
SignerClient.TX_STATUS_REJECTED = 5;
SignerClient.CROSS_MARGIN_MODE = 0;
SignerClient.ISOLATED_MARGIN_MODE = 1;
SignerClient.ISOLATED_MARGIN_REMOVE_COLLATERAL = 0;
SignerClient.ISOLATED_MARGIN_ADD_COLLATERAL = 1;
SignerClient.SELF_TRADE_BEHAVIOR_EXPIRE_MAKER = 0;
SignerClient.SELF_TRADE_BEHAVIOR_EXPIRE_TAKER = 1;
SignerClient.SELF_TRADE_BEHAVIOR_EXPIRE_BOTH = 2;
SignerClient.SELF_TRADE_BEHAVIOR_REDUCE = 3;
SignerClient.SELF_TRADE_EQUALITY_ACCOUNT_INDEX = 0;
SignerClient.SELF_TRADE_EQUALITY_MASTER_ACCOUNT_INDEX = 1;
SignerClient.ASSET_MARGIN_MODE_DISABLED = 0;
SignerClient.ASSET_MARGIN_MODE_ENABLED = 1;
SignerClient.TX_TYPE_UPDATE_ACCOUNT_CONFIG = 46;
SignerClient.TX_TYPE_UPDATE_ACCOUNT_ASSET_CONFIG = 47;
SignerClient.NIL_MARKET_INDEX = 255;
//#endregion
//#region node_modules/lighter-ts-sdk/dist/esm/index.js
var esm_exports = /* @__PURE__ */ __exportAll({
	NonceManager: () => NonceManager,
	SignerClient: () => SignerClient,
	VERSION: () => VERSION
});
//#endregion
export { esm_exports as t };
