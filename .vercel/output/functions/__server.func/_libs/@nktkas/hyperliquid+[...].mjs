var DEFAULT_CONFIG = {
	lang: void 0,
	message: void 0,
	abortEarly: void 0,
	abortPipeEarly: void 0
};
/**
* Returns the global configuration.
*
* @param config The config to merge.
*
* @returns The configuration.
*/
/* @__NO_SIDE_EFFECTS__ */
function getGlobalConfig(config$1) {
	if (!config$1 && true) return DEFAULT_CONFIG;
	return {
		lang: config$1?.lang ?? void 0,
		message: config$1?.message,
		abortEarly: config$1?.abortEarly ?? void 0,
		abortPipeEarly: config$1?.abortPipeEarly ?? void 0
	};
}
/**
* Stringifies an unknown input to a literal or type string.
*
* @param input The unknown input.
*
* @returns A literal or type string.
*
* @internal
*/
/* @__NO_SIDE_EFFECTS__ */
function _stringify(input) {
	const type = typeof input;
	if (type === "string") return `"${input}"`;
	if (type === "number" || type === "bigint" || type === "boolean") return `${input}`;
	if (type === "object" || type === "function") return (input && Object.getPrototypeOf(input)?.constructor?.name) ?? "null";
	return type;
}
/**
* Adds an issue to the dataset.
*
* @param context The issue context.
* @param label The issue label.
* @param dataset The input dataset.
* @param config The configuration.
* @param other The optional props.
*
* @internal
*/
function _addIssue(context, label, dataset, config$1, other) {
	const input = other && "input" in other ? other.input : dataset.value;
	const expected = other?.expected ?? context.expects ?? null;
	const received = other?.received ?? /* @__PURE__ */ _stringify(input);
	const issue = {
		kind: context.kind,
		type: context.type,
		input,
		expected,
		received,
		message: `Invalid ${label}: ${expected ? `Expected ${expected} but r` : "R"}eceived ${received}`,
		requirement: context.requirement,
		path: other?.path,
		issues: other?.issues,
		lang: config$1.lang,
		abortEarly: config$1.abortEarly,
		abortPipeEarly: config$1.abortPipeEarly
	};
	const isSchema = context.kind === "schema";
	const message$1 = other?.message ?? context.message ?? (context.reference, issue.lang, void 0) ?? (isSchema ? (issue.lang, void 0) : null) ?? config$1.message ?? (issue.lang, void 0);
	if (message$1 !== void 0) issue.message = typeof message$1 === "function" ? message$1(issue) : message$1;
	if (isSchema) dataset.typed = false;
	if (dataset.issues) dataset.issues.push(issue);
	else dataset.issues = [issue];
}
var _standardCache = /* @__PURE__ */ new WeakMap();
/**
* Returns the Standard Schema properties.
*
* @param context The schema context.
*
* @returns The Standard Schema properties.
*/
/* @__NO_SIDE_EFFECTS__ */
function _getStandardProps(context) {
	let cached = _standardCache.get(context);
	if (!cached) {
		cached = {
			version: 1,
			vendor: "valibot",
			validate(value$1) {
				return context["~run"]({ value: value$1 }, /* @__PURE__ */ getGlobalConfig());
			}
		};
		_standardCache.set(context, cached);
	}
	return cached;
}
/**
* Joins multiple `expects` values with the given separator.
*
* @param values The `expects` values.
* @param separator The separator.
*
* @returns The joined `expects` property.
*
* @internal
*/
/* @__NO_SIDE_EFFECTS__ */
function _joinExpects(values$1, separator) {
	const list = [...new Set(values$1)];
	if (list.length > 1) return `(${list.join(` ${separator} `)})`;
	return list[0] ?? "never";
}
/* @__NO_SIDE_EFFECTS__ */
function getDotPath(issue) {
	if (issue.path) {
		let key = "";
		for (const item of issue.path) if (typeof item.key === "string" || typeof item.key === "number") if (key) key += `.${item.key}`;
		else key += item.key;
		else return null;
		return key;
	}
	return null;
}
/**
* A Valibot error with useful information.
*/
var ValiError = class extends Error {
	/**
	* Creates a Valibot error with useful information.
	*
	* @param issues The error issues.
	*/
	constructor(issues) {
		super(issues[0].message);
		this.name = "ValiError";
		this.issues = issues;
	}
};
/**
* [IP](https://en.wikipedia.org/wiki/IP_address) regex.
*/
var IP_REGEX = /^(?:(?:[1-9]|1\d|2[0-4])?\d|25[0-5])(?:\.(?:(?:[1-9]|1\d|2[0-4])?\d|25[0-5])){3}$|^(?:(?:[\da-f]{1,4}:){7}[\da-f]{1,4}|(?:[\da-f]{1,4}:){1,7}:|(?:[\da-f]{1,4}:){1,6}:[\da-f]{1,4}|(?:[\da-f]{1,4}:){1,5}(?::[\da-f]{1,4}){1,2}|(?:[\da-f]{1,4}:){1,4}(?::[\da-f]{1,4}){1,3}|(?:[\da-f]{1,4}:){1,3}(?::[\da-f]{1,4}){1,4}|(?:[\da-f]{1,4}:){1,2}(?::[\da-f]{1,4}){1,5}|[\da-f]{1,4}:(?::[\da-f]{1,4}){1,6}|:(?:(?::[\da-f]{1,4}){1,7}|:)|fe80:(?::[\da-f]{0,4}){0,4}%[\da-z]+|::(?:f{4}(?::0{1,4})?:)?(?:(?:25[0-5]|(?:2[0-4]|1?\d)?\d)\.){3}(?:25[0-5]|(?:2[0-4]|1?\d)?\d)|(?:[\da-f]{1,4}:){1,4}:(?:(?:25[0-5]|(?:2[0-4]|1?\d)?\d)\.){3}(?:25[0-5]|(?:2[0-4]|1?\d)?\d))$/iu;
/* @__NO_SIDE_EFFECTS__ */
function check(requirement, message$1) {
	return {
		kind: "validation",
		type: "check",
		reference: check,
		async: false,
		expects: null,
		requirement,
		message: message$1,
		"~run"(dataset, config$1) {
			if (dataset.typed && !this.requirement(dataset.value)) _addIssue(this, "input", dataset, config$1);
			return dataset;
		}
	};
}
/* @__NO_SIDE_EFFECTS__ */
function ip(message$1) {
	return {
		kind: "validation",
		type: "ip",
		reference: ip,
		async: false,
		expects: null,
		requirement: IP_REGEX,
		message: message$1,
		"~run"(dataset, config$1) {
			if (dataset.typed && !this.requirement.test(dataset.value)) _addIssue(this, "IP", dataset, config$1);
			return dataset;
		}
	};
}
/* @__NO_SIDE_EFFECTS__ */
function length(requirement, message$1) {
	return {
		kind: "validation",
		type: "length",
		reference: length,
		async: false,
		expects: `${requirement}`,
		requirement,
		message: message$1,
		"~run"(dataset, config$1) {
			if (dataset.typed && dataset.value.length !== this.requirement) _addIssue(this, "length", dataset, config$1, { received: `${dataset.value.length}` });
			return dataset;
		}
	};
}
/* @__NO_SIDE_EFFECTS__ */
function maxLength(requirement, message$1) {
	return {
		kind: "validation",
		type: "max_length",
		reference: maxLength,
		async: false,
		expects: `<=${requirement}`,
		requirement,
		message: message$1,
		"~run"(dataset, config$1) {
			if (dataset.typed && dataset.value.length > this.requirement) _addIssue(this, "length", dataset, config$1, { received: `${dataset.value.length}` });
			return dataset;
		}
	};
}
/* @__NO_SIDE_EFFECTS__ */
function maxValue(requirement, message$1) {
	return {
		kind: "validation",
		type: "max_value",
		reference: maxValue,
		async: false,
		expects: `<=${requirement instanceof Date ? requirement.toJSON() : /* @__PURE__ */ _stringify(requirement)}`,
		requirement,
		message: message$1,
		"~run"(dataset, config$1) {
			if (dataset.typed && !(dataset.value <= this.requirement)) _addIssue(this, "value", dataset, config$1, { received: dataset.value instanceof Date ? dataset.value.toJSON() : /* @__PURE__ */ _stringify(dataset.value) });
			return dataset;
		}
	};
}
/* @__NO_SIDE_EFFECTS__ */
function minLength(requirement, message$1) {
	return {
		kind: "validation",
		type: "min_length",
		reference: minLength,
		async: false,
		expects: `>=${requirement}`,
		requirement,
		message: message$1,
		"~run"(dataset, config$1) {
			if (dataset.typed && dataset.value.length < this.requirement) _addIssue(this, "length", dataset, config$1, { received: `${dataset.value.length}` });
			return dataset;
		}
	};
}
/* @__NO_SIDE_EFFECTS__ */
function minValue(requirement, message$1) {
	return {
		kind: "validation",
		type: "min_value",
		reference: minValue,
		async: false,
		expects: `>=${requirement instanceof Date ? requirement.toJSON() : /* @__PURE__ */ _stringify(requirement)}`,
		requirement,
		message: message$1,
		"~run"(dataset, config$1) {
			if (dataset.typed && !(dataset.value >= this.requirement)) _addIssue(this, "value", dataset, config$1, { received: dataset.value instanceof Date ? dataset.value.toJSON() : /* @__PURE__ */ _stringify(dataset.value) });
			return dataset;
		}
	};
}
/* @__NO_SIDE_EFFECTS__ */
function parseJson(config$1, message$1) {
	return {
		kind: "transformation",
		type: "parse_json",
		reference: parseJson,
		config: config$1,
		message: message$1,
		async: false,
		"~run"(dataset, config$2) {
			try {
				dataset.value = JSON.parse(dataset.value, this.config?.reviver);
			} catch (error) {
				if (error instanceof Error) {
					_addIssue(this, "JSON", dataset, config$2, { received: `"${error.message}"` });
					dataset.typed = false;
				} else throw error;
			}
			return dataset;
		}
	};
}
/* @__NO_SIDE_EFFECTS__ */
function regex(requirement, message$1) {
	return {
		kind: "validation",
		type: "regex",
		reference: regex,
		async: false,
		expects: `${requirement}`,
		requirement,
		message: message$1,
		"~run"(dataset, config$1) {
			if (dataset.typed && !this.requirement.test(dataset.value)) _addIssue(this, "format", dataset, config$1);
			return dataset;
		}
	};
}
/* @__NO_SIDE_EFFECTS__ */
function safeInteger(message$1) {
	return {
		kind: "validation",
		type: "safe_integer",
		reference: safeInteger,
		async: false,
		expects: null,
		requirement: Number.isSafeInteger,
		message: message$1,
		"~run"(dataset, config$1) {
			if (dataset.typed && !this.requirement(dataset.value)) _addIssue(this, "safe integer", dataset, config$1);
			return dataset;
		}
	};
}
/* @__NO_SIDE_EFFECTS__ */
function stringifyJson(config$1, message$1) {
	return {
		kind: "transformation",
		type: "stringify_json",
		reference: stringifyJson,
		message: message$1,
		config: config$1,
		async: false,
		"~run"(dataset, config$2) {
			try {
				const output = JSON.stringify(dataset.value, this.config?.replacer, this.config?.space);
				if (output === void 0) {
					_addIssue(this, "JSON", dataset, config$2);
					dataset.typed = false;
				}
				dataset.value = output;
			} catch (error) {
				if (error instanceof Error) {
					_addIssue(this, "JSON", dataset, config$2, { received: `"${error.message}"` });
					dataset.typed = false;
				} else throw error;
			}
			return dataset;
		}
	};
}
/* @__NO_SIDE_EFFECTS__ */
function toNumber(message$1) {
	return {
		kind: "transformation",
		type: "to_number",
		reference: toNumber,
		async: false,
		message: message$1,
		"~run"(dataset, config$1) {
			try {
				dataset.value = Number(dataset.value);
				if (isNaN(dataset.value)) {
					_addIssue(this, "number", dataset, config$1);
					dataset.typed = false;
				}
			} catch {
				_addIssue(this, "number", dataset, config$1);
				dataset.typed = false;
			}
			return dataset;
		}
	};
}
/* @__NO_SIDE_EFFECTS__ */
function toString(message$1) {
	return {
		kind: "transformation",
		type: "to_string",
		reference: toString,
		async: false,
		message: message$1,
		"~run"(dataset, config$1) {
			try {
				dataset.value = String(dataset.value);
			} catch {
				_addIssue(this, "string", dataset, config$1);
				dataset.typed = false;
			}
			return dataset;
		}
	};
}
/**
* Creates a custom transformation action.
*
* @param operation The transformation operation.
*
* @returns A transform action.
*/
/* @__NO_SIDE_EFFECTS__ */
function transform(operation) {
	return {
		kind: "transformation",
		type: "transform",
		reference: transform,
		async: false,
		operation,
		"~run"(dataset) {
			dataset.value = this.operation(dataset.value);
			return dataset;
		}
	};
}
var ABORT_EARLY_CONFIG = { abortEarly: true };
/**
* Returns the fallback value of the schema.
*
* @param schema The schema to get it from.
* @param dataset The output dataset if available.
* @param config The config if available.
*
* @returns The fallback value.
*/
/* @__NO_SIDE_EFFECTS__ */
function getFallback(schema, dataset, config$1) {
	return typeof schema.fallback === "function" ? schema.fallback(dataset, config$1) : schema.fallback;
}
/**
* Returns the default value of the schema.
*
* @param schema The schema to get it from.
* @param dataset The input dataset if available.
* @param config The config if available.
*
* @returns The default value.
*/
/* @__NO_SIDE_EFFECTS__ */
function getDefault(schema, dataset, config$1) {
	return typeof schema.default === "function" ? schema.default(dataset, config$1) : schema.default;
}
/* @__NO_SIDE_EFFECTS__ */
function array(item, message$1) {
	return {
		kind: "schema",
		type: "array",
		reference: array,
		expects: "Array",
		async: false,
		item,
		message: message$1,
		get "~standard"() {
			return /* @__PURE__ */ _getStandardProps(this);
		},
		"~run"(dataset, config$1) {
			const input = dataset.value;
			if (Array.isArray(input)) {
				dataset.typed = true;
				dataset.value = [];
				for (let key = 0; key < input.length; key++) {
					const value$1 = input[key];
					const itemDataset = this.item["~run"]({ value: value$1 }, config$1);
					if (itemDataset.issues) {
						const pathItem = {
							type: "array",
							origin: "value",
							input,
							key,
							value: value$1
						};
						for (const issue of itemDataset.issues) {
							if (issue.path) issue.path.unshift(pathItem);
							else issue.path = [pathItem];
							dataset.issues?.push(issue);
						}
						if (!dataset.issues) dataset.issues = itemDataset.issues;
						if (config$1.abortEarly) {
							dataset.typed = false;
							break;
						}
					}
					if (!itemDataset.typed) dataset.typed = false;
					dataset.value.push(itemDataset.value);
				}
			} else _addIssue(this, "type", dataset, config$1);
			return dataset;
		}
	};
}
/* @__NO_SIDE_EFFECTS__ */
function boolean(message$1) {
	return {
		kind: "schema",
		type: "boolean",
		reference: boolean,
		expects: "boolean",
		async: false,
		message: message$1,
		get "~standard"() {
			return /* @__PURE__ */ _getStandardProps(this);
		},
		"~run"(dataset, config$1) {
			if (typeof dataset.value === "boolean") dataset.typed = true;
			else _addIssue(this, "type", dataset, config$1);
			return dataset;
		}
	};
}
/* @__NO_SIDE_EFFECTS__ */
function literal(literal_, message$1) {
	return {
		kind: "schema",
		type: "literal",
		reference: literal,
		expects: /* @__PURE__ */ _stringify(literal_),
		async: false,
		literal: literal_,
		message: message$1,
		get "~standard"() {
			return /* @__PURE__ */ _getStandardProps(this);
		},
		"~run"(dataset, config$1) {
			if (dataset.value === this.literal) dataset.typed = true;
			else _addIssue(this, "type", dataset, config$1);
			return dataset;
		}
	};
}
/* @__NO_SIDE_EFFECTS__ */
function null_(message$1) {
	return {
		kind: "schema",
		type: "null",
		reference: null_,
		expects: "null",
		async: false,
		message: message$1,
		get "~standard"() {
			return /* @__PURE__ */ _getStandardProps(this);
		},
		"~run"(dataset, config$1) {
			if (dataset.value === null) dataset.typed = true;
			else _addIssue(this, "type", dataset, config$1);
			return dataset;
		}
	};
}
/* @__NO_SIDE_EFFECTS__ */
function nullable(wrapped, default_) {
	return {
		kind: "schema",
		type: "nullable",
		reference: nullable,
		expects: `(${wrapped.expects} | null)`,
		async: false,
		wrapped,
		default: default_,
		get "~standard"() {
			return /* @__PURE__ */ _getStandardProps(this);
		},
		"~run"(dataset, config$1) {
			if (dataset.value === null) {
				if (this.default !== void 0) dataset.value = /* @__PURE__ */ getDefault(this, dataset, config$1);
				if (dataset.value === null) {
					dataset.typed = true;
					return dataset;
				}
			}
			return this.wrapped["~run"](dataset, config$1);
		}
	};
}
/* @__NO_SIDE_EFFECTS__ */
function nullish(wrapped, default_) {
	return {
		kind: "schema",
		type: "nullish",
		reference: nullish,
		expects: `(${wrapped.expects} | null | undefined)`,
		async: false,
		wrapped,
		default: default_,
		get "~standard"() {
			return /* @__PURE__ */ _getStandardProps(this);
		},
		"~run"(dataset, config$1) {
			if (dataset.value === null || dataset.value === void 0) {
				if (this.default !== void 0) dataset.value = /* @__PURE__ */ getDefault(this, dataset, config$1);
				if (dataset.value === null || dataset.value === void 0) {
					dataset.typed = true;
					return dataset;
				}
			}
			return this.wrapped["~run"](dataset, config$1);
		}
	};
}
/* @__NO_SIDE_EFFECTS__ */
function number(message$1) {
	return {
		kind: "schema",
		type: "number",
		reference: number,
		expects: "number",
		async: false,
		message: message$1,
		get "~standard"() {
			return /* @__PURE__ */ _getStandardProps(this);
		},
		"~run"(dataset, config$1) {
			if (typeof dataset.value === "number" && !isNaN(dataset.value)) dataset.typed = true;
			else _addIssue(this, "type", dataset, config$1);
			return dataset;
		}
	};
}
/* @__NO_SIDE_EFFECTS__ */
function object(entries$1, message$1) {
	return {
		kind: "schema",
		type: "object",
		reference: object,
		expects: "Object",
		async: false,
		entries: entries$1,
		message: message$1,
		get "~standard"() {
			return /* @__PURE__ */ _getStandardProps(this);
		},
		"~run"(dataset, config$1) {
			const input = dataset.value;
			if (input && typeof input === "object") {
				dataset.typed = true;
				dataset.value = {};
				for (const key in this.entries) {
					const valueSchema = this.entries[key];
					if (key in input || (valueSchema.type === "exact_optional" || valueSchema.type === "optional" || valueSchema.type === "nullish") && valueSchema.default !== void 0) {
						const value$1 = key in input ? input[key] : /* @__PURE__ */ getDefault(valueSchema);
						const valueDataset = valueSchema["~run"]({ value: value$1 }, config$1);
						if (valueDataset.issues) {
							const pathItem = {
								type: "object",
								origin: "value",
								input,
								key,
								value: value$1
							};
							for (const issue of valueDataset.issues) {
								if (issue.path) issue.path.unshift(pathItem);
								else issue.path = [pathItem];
								dataset.issues?.push(issue);
							}
							if (!dataset.issues) dataset.issues = valueDataset.issues;
							if (config$1.abortEarly) {
								dataset.typed = false;
								break;
							}
						}
						if (!valueDataset.typed) dataset.typed = false;
						dataset.value[key] = valueDataset.value;
					} else if (valueSchema.fallback !== void 0) dataset.value[key] = /* @__PURE__ */ getFallback(valueSchema);
					else if (valueSchema.type !== "exact_optional" && valueSchema.type !== "optional" && valueSchema.type !== "nullish") {
						_addIssue(this, "key", dataset, config$1, {
							input: void 0,
							expected: `"${key}"`,
							path: [{
								type: "object",
								origin: "key",
								input,
								key,
								value: input[key]
							}]
						});
						if (config$1.abortEarly) break;
					}
				}
			} else _addIssue(this, "type", dataset, config$1);
			return dataset;
		}
	};
}
/* @__NO_SIDE_EFFECTS__ */
function optional(wrapped, default_) {
	return {
		kind: "schema",
		type: "optional",
		reference: optional,
		expects: `(${wrapped.expects} | undefined)`,
		async: false,
		wrapped,
		default: default_,
		get "~standard"() {
			return /* @__PURE__ */ _getStandardProps(this);
		},
		"~run"(dataset, config$1) {
			if (dataset.value === void 0) {
				if (this.default !== void 0) dataset.value = /* @__PURE__ */ getDefault(this, dataset, config$1);
				if (dataset.value === void 0) {
					dataset.typed = true;
					return dataset;
				}
			}
			return this.wrapped["~run"](dataset, config$1);
		}
	};
}
/* @__NO_SIDE_EFFECTS__ */
function picklist(options, message$1) {
	return {
		kind: "schema",
		type: "picklist",
		reference: picklist,
		expects: /* @__PURE__ */ _joinExpects(options.map(_stringify), "|"),
		async: false,
		options,
		message: message$1,
		get "~standard"() {
			return /* @__PURE__ */ _getStandardProps(this);
		},
		"~run"(dataset, config$1) {
			if (this.options.includes(dataset.value)) dataset.typed = true;
			else _addIssue(this, "type", dataset, config$1);
			return dataset;
		}
	};
}
/* @__NO_SIDE_EFFECTS__ */
function string(message$1) {
	return {
		kind: "schema",
		type: "string",
		reference: string,
		expects: "string",
		async: false,
		message: message$1,
		get "~standard"() {
			return /* @__PURE__ */ _getStandardProps(this);
		},
		"~run"(dataset, config$1) {
			if (typeof dataset.value === "string") dataset.typed = true;
			else _addIssue(this, "type", dataset, config$1);
			return dataset;
		}
	};
}
/* @__NO_SIDE_EFFECTS__ */
function tuple(items, message$1) {
	return {
		kind: "schema",
		type: "tuple",
		reference: tuple,
		expects: "Array",
		async: false,
		items,
		message: message$1,
		get "~standard"() {
			return /* @__PURE__ */ _getStandardProps(this);
		},
		"~run"(dataset, config$1) {
			const input = dataset.value;
			if (Array.isArray(input)) {
				dataset.typed = true;
				dataset.value = [];
				for (let key = 0; key < this.items.length; key++) {
					const value$1 = input[key];
					const itemDataset = this.items[key]["~run"]({ value: value$1 }, config$1);
					if (itemDataset.issues) {
						const pathItem = {
							type: "array",
							origin: "value",
							input,
							key,
							value: value$1
						};
						for (const issue of itemDataset.issues) {
							if (issue.path) issue.path.unshift(pathItem);
							else issue.path = [pathItem];
							dataset.issues?.push(issue);
						}
						if (!dataset.issues) dataset.issues = itemDataset.issues;
						if (config$1.abortEarly) {
							dataset.typed = false;
							break;
						}
					}
					if (!itemDataset.typed) dataset.typed = false;
					dataset.value.push(itemDataset.value);
				}
			} else _addIssue(this, "type", dataset, config$1);
			return dataset;
		}
	};
}
/**
* Returns the sub issues of the provided datasets for the union issue.
*
* @param datasets The datasets.
*
* @returns The sub issues.
*
* @internal
*/
/* @__NO_SIDE_EFFECTS__ */
function _subIssues(datasets) {
	let issues;
	if (datasets) for (const dataset of datasets) if (issues) for (const issue of dataset.issues) issues.push(issue);
	else issues = dataset.issues;
	return issues;
}
/* @__NO_SIDE_EFFECTS__ */
function union(options, message$1) {
	return {
		kind: "schema",
		type: "union",
		reference: union,
		expects: /* @__PURE__ */ _joinExpects(options.map((option) => option.expects), "|"),
		async: false,
		options,
		message: message$1,
		get "~standard"() {
			return /* @__PURE__ */ _getStandardProps(this);
		},
		"~run"(dataset, config$1) {
			let validDataset;
			let typedDatasets;
			let untypedDatasets;
			for (const schema of this.options) {
				const optionDataset = schema["~run"]({ value: dataset.value }, config$1);
				if (optionDataset.typed) if (optionDataset.issues) if (typedDatasets) typedDatasets.push(optionDataset);
				else typedDatasets = [optionDataset];
				else {
					validDataset = optionDataset;
					break;
				}
				else if (untypedDatasets) untypedDatasets.push(optionDataset);
				else untypedDatasets = [optionDataset];
			}
			if (validDataset) return validDataset;
			if (typedDatasets) {
				if (typedDatasets.length === 1) return typedDatasets[0];
				_addIssue(this, "type", dataset, config$1, { issues: /* @__PURE__ */ _subIssues(typedDatasets) });
				dataset.typed = true;
			} else if (untypedDatasets?.length === 1) return untypedDatasets[0];
			else _addIssue(this, "type", dataset, config$1, { issues: /* @__PURE__ */ _subIssues(untypedDatasets) });
			return dataset;
		}
	};
}
/* @__NO_SIDE_EFFECTS__ */
function variant(key, options, message$1) {
	return {
		kind: "schema",
		type: "variant",
		reference: variant,
		expects: "Object",
		async: false,
		key,
		options,
		message: message$1,
		get "~standard"() {
			return /* @__PURE__ */ _getStandardProps(this);
		},
		"~run"(dataset, config$1) {
			const input = dataset.value;
			if (input && typeof input === "object") {
				let outputDataset;
				let maxDiscriminatorPriority = 0;
				let invalidDiscriminatorKey = this.key;
				let expectedDiscriminators = [];
				const parseOptions = (variant$1, allKeys) => {
					for (const schema of variant$1.options) {
						if (schema.type === "variant") parseOptions(schema, new Set(allKeys).add(schema.key));
						else {
							let keysAreValid = true;
							let currentPriority = 0;
							for (const currentKey of allKeys) {
								const discriminatorSchema = schema.entries[currentKey];
								if (currentKey in input ? discriminatorSchema["~run"]({
									typed: false,
									value: input[currentKey]
								}, ABORT_EARLY_CONFIG).issues : discriminatorSchema.type !== "exact_optional" && discriminatorSchema.type !== "optional" && discriminatorSchema.type !== "nullish") {
									keysAreValid = false;
									if (invalidDiscriminatorKey !== currentKey && (maxDiscriminatorPriority < currentPriority || maxDiscriminatorPriority === currentPriority && currentKey in input && !(invalidDiscriminatorKey in input))) {
										maxDiscriminatorPriority = currentPriority;
										invalidDiscriminatorKey = currentKey;
										expectedDiscriminators = [];
									}
									if (invalidDiscriminatorKey === currentKey) expectedDiscriminators.push(schema.entries[currentKey].expects);
									break;
								}
								currentPriority++;
							}
							if (keysAreValid) {
								const optionDataset = schema["~run"]({ value: input }, config$1);
								if (!outputDataset || !outputDataset.typed && optionDataset.typed) outputDataset = optionDataset;
							}
						}
						if (outputDataset && !outputDataset.issues) break;
					}
				};
				parseOptions(this, /* @__PURE__ */ new Set([this.key]));
				if (outputDataset) return outputDataset;
				_addIssue(this, "type", dataset, config$1, {
					input: input[invalidDiscriminatorKey],
					expected: /* @__PURE__ */ _joinExpects(expectedDiscriminators, "|"),
					path: [{
						type: "object",
						origin: "value",
						input,
						key: invalidDiscriminatorKey,
						value: input[invalidDiscriminatorKey]
					}]
				});
			} else _addIssue(this, "type", dataset, config$1);
			return dataset;
		}
	};
}
/**
* Creates a modified copy of an object schema that does not contain the
* selected entries.
*
* @param schema The schema to omit from.
* @param keys The selected entries.
*
* @returns An object schema.
*/
/* @__NO_SIDE_EFFECTS__ */
function omit(schema, keys) {
	const entries$1 = { ...schema.entries };
	for (const key of keys) delete entries$1[key];
	return {
		...schema,
		entries: entries$1,
		get "~standard"() {
			return /* @__PURE__ */ _getStandardProps(this);
		}
	};
}
/**
* Parses an unknown input based on a schema.
*
* @param schema The schema to be used.
* @param input The input to be parsed.
* @param config The parse configuration.
*
* @returns The parsed input.
*/
function parse$1(schema, input, config$1) {
	const dataset = schema["~run"]({ value: input }, /* @__PURE__ */ getGlobalConfig(config$1));
	if (dataset.issues) throw new ValiError(dataset.issues);
	return dataset.value;
}
/* @__NO_SIDE_EFFECTS__ */
function pipe(...pipe$1) {
	return {
		...pipe$1[0],
		pipe: pipe$1,
		get "~standard"() {
			return /* @__PURE__ */ _getStandardProps(this);
		},
		"~run"(dataset, config$1) {
			for (const item of pipe$1) if (item.kind !== "metadata") {
				if (dataset.issues && (item.kind === "schema" || item.kind === "transformation")) {
					dataset.typed = false;
					break;
				}
				if (!dataset.issues || !config$1.abortEarly && !config$1.abortPipeEarly) dataset = item["~run"](dataset, config$1);
			}
			return dataset;
		}
	};
}
/**
* Summarize the error messages of issues in a pretty-printable multi-line string.
*
* @param issues The list of issues.
*
* @returns A summary of the issues.
*
* @beta
*/
/* @__NO_SIDE_EFFECTS__ */
function summarize(issues) {
	let summary = "";
	for (const issue of issues) {
		if (summary) summary += "\n";
		summary += `× ${issue.message}`;
		const dotPath = /* @__PURE__ */ getDotPath(issue);
		if (dotPath) summary += `\n  → at ${dotPath}`;
	}
	return summary;
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/_base.js
/** Base error class for all SDK errors. */ var HyperliquidError = class extends Error {
	constructor(message, options) {
		super(message, options);
		this.name = "HyperliquidError";
	}
};
/** Thrown when request parameters fail schema validation. */ var ValidationError = class extends HyperliquidError {
	cause;
	constructor(message, options) {
		super(message, options);
		this.name = "ValidationError";
		this.cause = options.cause;
	}
};
/** Wrapper around `v.parse` that throws {@linkcode ValidationError} instead of `ValiError`. */ function parse(schema, input) {
	try {
		return parse$1(schema, input);
	} catch (error) {
		const valiError = error;
		throw new ValidationError(/* @__PURE__ */ summarize(valiError.issues), { cause: valiError });
	}
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/signing/_abstractWallet.js
/**
* Abstract wallet interfaces and signing utilities for [EIP-712](https://eips.ethereum.org/EIPS/eip-712) typed data.
* @module
*/
/** Thrown when an error occurs in AbstractWallet operations (e.g., signing, getting address). */ var AbstractWalletError = class extends HyperliquidError {
	constructor(message, options) {
		super(message, options);
		this.name = "AbstractWalletError";
	}
};
/** Parse a 65-byte hex signature into `{r, s, v}`. Normalizes raw recovery 0/1 to 27/28. */ function parseSignature(hex) {
	if (hex.length !== 132) throw new AbstractWalletError(`Expected 65-byte signature (132 hex chars), got ${hex.length}`);
	const r = `0x${hex.slice(2, 66)}`;
	const s = `0x${hex.slice(66, 130)}`;
	let v = parseInt(hex.slice(130, 132), 16);
	if (v === 0 || v === 1) v += 27;
	if (v !== 27 && v !== 28) throw new AbstractWalletError(`Invalid signature recovery value: ${v}, expected 0/1 or 27/28`);
	return {
		r,
		s,
		v
	};
}
function isEthersV6Signer(wallet) {
	return "signTypedData" in wallet && typeof wallet.signTypedData === "function" && wallet.signTypedData.length === 3 && "getAddress" in wallet && typeof wallet.getAddress === "function";
}
function adaptEthersV6(wallet) {
	return {
		kind: "ethers-v6",
		async signTypedData(args) {
			return parseSignature(await wallet.signTypedData(args.domain, args.types, args.message));
		},
		async getAddress() {
			return (await wallet.getAddress()).toLowerCase();
		},
		async getChainId() {
			if (!wallet.provider) return "0x1";
			return `0x${(await wallet.provider.getNetwork()).chainId.toString(16)}`;
		}
	};
}
function isEthersV5Signer(wallet) {
	return "_signTypedData" in wallet && typeof wallet._signTypedData === "function" && wallet._signTypedData.length === 3 && "getAddress" in wallet && typeof wallet.getAddress === "function";
}
function adaptEthersV5(wallet) {
	return {
		kind: "ethers-v5",
		async signTypedData(args) {
			return parseSignature(await wallet._signTypedData(args.domain, args.types, args.message));
		},
		async getAddress() {
			return (await wallet.getAddress()).toLowerCase();
		},
		async getChainId() {
			if (!wallet.provider) return "0x1";
			return `0x${(await wallet.provider.getNetwork()).chainId.toString(16)}`;
		}
	};
}
/** EIP-712 domain type definition; viem wallet adapters require it in `types`. */ var EIP712_DOMAIN_TYPE = [
	{
		name: "name",
		type: "string"
	},
	{
		name: "version",
		type: "string"
	},
	{
		name: "chainId",
		type: "uint256"
	},
	{
		name: "verifyingContract",
		type: "address"
	}
];
function isViemJsonRpc(wallet) {
	return "signTypedData" in wallet && typeof wallet.signTypedData === "function" && (wallet.signTypedData.length === 1 || wallet.signTypedData.length === 2) && "getAddresses" in wallet && typeof wallet.getAddresses === "function" && "getChainId" in wallet && typeof wallet.getChainId === "function";
}
function adaptViemJsonRpc(wallet) {
	return {
		kind: "viem-jsonrpc",
		async signTypedData(args) {
			return parseSignature(await wallet.signTypedData({
				domain: args.domain,
				types: {
					EIP712Domain: EIP712_DOMAIN_TYPE,
					...args.types
				},
				primaryType: args.primaryType,
				message: args.message
			}));
		},
		async getAddress() {
			const addresses = await wallet.getAddresses();
			if (!addresses.length) throw new AbstractWalletError("Wallet returned no addresses");
			return addresses[0].toLowerCase();
		},
		async getChainId() {
			return `0x${(await wallet.getChainId()).toString(16)}`;
		}
	};
}
function isViemLocal(wallet) {
	return "signTypedData" in wallet && typeof wallet.signTypedData === "function" && (wallet.signTypedData.length === 1 || wallet.signTypedData.length === 2) && "address" in wallet && typeof wallet.address === "string";
}
function adaptViemLocal(wallet) {
	return {
		kind: "viem-local",
		async signTypedData(args) {
			return parseSignature(await wallet.signTypedData({
				domain: args.domain,
				types: {
					EIP712Domain: EIP712_DOMAIN_TYPE,
					...args.types
				},
				primaryType: args.primaryType,
				message: args.message
			}));
		},
		getAddress() {
			return Promise.resolve(wallet.address.toLowerCase());
		},
		getChainId() {
			return Promise.resolve("0x1");
		}
	};
}
/** Adapt a wallet of any supported kind to the uniform {@link Signer} interface. */ function adapt(wallet) {
	if (isViemJsonRpc(wallet)) return adaptViemJsonRpc(wallet);
	if (isViemLocal(wallet)) return adaptViemLocal(wallet);
	if (isEthersV6Signer(wallet)) return adaptEthersV6(wallet);
	if (isEthersV5Signer(wallet)) return adaptEthersV5(wallet);
	throw new AbstractWalletError("Failed to adapt wallet: unknown wallet type");
}
/**
* Signs [EIP-712](https://eips.ethereum.org/EIPS/eip-712) typed data using the provided wallet.
*
* @param args The wallet, domain, types, primary type, and message to sign.
* @return The ECDSA signature components.
*
* @throws {AbstractWalletError} If the wallet type is unknown or signing fails.
*/ async function signTypedData(args) {
	try {
		const typeFields = args.types[args.primaryType];
		const message = typeFields ? Object.fromEntries(Object.entries(args.message).filter(([k]) => typeFields.some((f) => f.name === k))) : args.message;
		return await adapt(args.wallet).signTypedData({
			domain: args.domain,
			types: args.types,
			primaryType: args.primaryType,
			message
		});
	} catch (error) {
		if (error instanceof AbstractWalletError) throw error;
		throw new AbstractWalletError(`Failed to sign the typed data using the wallet`, { cause: error });
	}
}
/**
* Gets the lowercase wallet address from various wallet types.
*
* @param wallet The wallet to query.
* @return The lowercase wallet address as a hex string.
*
* @throws {AbstractWalletError} If getting the address fails or the wallet type is unknown.
*/ async function getWalletAddress(wallet) {
	try {
		return await adapt(wallet).getAddress();
	} catch (error) {
		if (error instanceof AbstractWalletError) throw error;
		throw new AbstractWalletError("Failed to get an address from the wallet", { cause: error });
	}
}
/**
* Gets the chain ID of the wallet.
*
* For wallets that have no notion of chain (e.g., a viem local account, or an ethers signer without a provider),
* defaults to `"0x1"`.
*
* @param wallet The wallet to query.
* @return The chain ID as a hex string.
*
* @throws {AbstractWalletError} If getting the chain ID fails or the wallet type is unknown.
*/ async function getWalletChainId(wallet) {
	try {
		return await adapt(wallet).getChainId();
	} catch (error) {
		if (error instanceof AbstractWalletError) throw error;
		throw new AbstractWalletError("Failed to get the chain ID from the wallet", { cause: error });
	}
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/signing/_canonicalize.js
/**
* Schema-driven key canonicalization for Hyperliquid action objects.
* @module
*/
/** Thrown when canonicalization fails due to schema/data key mismatch. */ var CanonicalizeError = class extends HyperliquidError {
	constructor(message) {
		super(message);
		this.name = "CanonicalizeError";
	}
};
/**
* Recursively rebuilds a value with object keys in schema-definition order.
*
* @param schema A valibot schema defining the canonical key order.
* @param value The value whose keys should be reordered.
* @return A new value with keys in schema-definition order.
*
* @throws {CanonicalizeError} If keys in data don't match the schema.
*
* @example
* ```ts
* import { canonicalize } from "@nktkas/hyperliquid/signing";
* import { CancelRequest } from "@nktkas/hyperliquid/api/exchange";
*
* const action = canonicalize(CancelRequest.entries.action, {
*   type: "cancel",
*   cancels: [{ a: 0, o: 12345 }],
* });
* ```
*/ function canonicalize(schema, value) {
	return walk(schema, value);
}
function walk(schema, value) {
	const t = schema.type;
	if (t === "optional" || t === "nullable" || t === "nullish") return value === null || value === void 0 ? value : walk(schema.wrapped, value);
	if (t === "object" && isRecord(value)) return reorderObject(schema.entries, value);
	if (t === "array" && Array.isArray(value)) return value.map((item) => walk(schema.item, item));
	if (t === "tuple" && Array.isArray(value)) return value.map((item, i) => walk(schema.items[i], item));
	if (t === "variant" && isRecord(value)) {
		const option = matchVariantOption(schema.key, schema.options, value);
		if (option) return walk(option, value);
		throw new CanonicalizeError(`No variant option matches data (discriminator "${schema.key}" = ${JSON.stringify(value[schema.key])})`);
	}
	if (t === "union" && isRecord(value)) {
		const option = matchByStructure(schema.options, value);
		if (option) return walk(option, value);
		return value;
	}
	return value;
}
function isRecord(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
function reorderObject(entries, value) {
	for (const key of Object.keys(value)) if (!(key in entries)) throw new CanonicalizeError(`Key "${key}" exists in data but not in schema`);
	for (const key of Object.keys(entries)) if (!(key in value)) {
		const t = entries[key].type;
		if (t !== "optional" && t !== "nullable" && t !== "nullish") throw new CanonicalizeError(`Required key "${key}" exists in schema but not in data`);
	}
	const result = {};
	for (const key of Object.keys(entries)) if (key in value) result[key] = walk(entries[key], value[key]);
	return result;
}
function matchVariantOption(discriminatorKey, options, value) {
	const discriminatorValue = value[discriminatorKey];
	const matching = [];
	for (const option of options) if (option.type === "object" && option.entries && discriminatorKey in option.entries) {
		const keySchema = option.entries[discriminatorKey];
		if (keySchema.type === "literal" && keySchema.literal === discriminatorValue) matching.push(option);
	}
	if (matching.length === 1) return matching[0];
	if (matching.length > 1) return matchByStructure(matching, value);
}
function matchByStructure(options, value) {
	const dataKeys = new Set(Object.keys(value));
	for (const option of options) if (option.type === "object" && option.entries) {
		if ([...dataKeys].every((k) => k in option.entries)) {
			if (Object.keys(option.entries).every((k) => {
				if (dataKeys.has(k)) return true;
				const t = option.entries[k].type;
				return t === "optional" || t === "nullable" || t === "nullish";
			})) return option;
		}
	}
}
//#endregion
//#region node_modules/@noble/hashes/_u64.js
var U32_MASK64 = /* @__PURE__ */ (() => BigInt(2 ** 32 - 1))();
var _32n = /* @__PURE__ */ BigInt(32);
function fromBig(n, le = false) {
	if (le) return {
		h: Number(n & U32_MASK64),
		l: Number(n >> _32n & U32_MASK64)
	};
	return {
		h: Number(n >> _32n & U32_MASK64) | 0,
		l: Number(n & U32_MASK64) | 0
	};
}
function split(lst, le = false) {
	const len = lst.length;
	let Ah = new Uint32Array(len);
	let Al = new Uint32Array(len);
	for (let i = 0; i < len; i++) {
		const { h, l } = fromBig(lst[i], le);
		[Ah[i], Al[i]] = [h, l];
	}
	return [Ah, Al];
}
//#endregion
//#region node_modules/@noble/hashes/utils.js
/**
* Checks if something is Uint8Array. Be careful: nodejs Buffer will return true.
* @param a - value to test
* @returns `true` when the value is a Uint8Array-compatible view.
* @example
* Check whether a value is a Uint8Array-compatible view.
* ```ts
* isBytes(new Uint8Array([1, 2, 3]));
* ```
*/
function isBytes(a) {
	return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array" && "BYTES_PER_ELEMENT" in a && a.BYTES_PER_ELEMENT === 1;
}
var atitle = (title) => title ? `"${title}" ` : "";
/**
* Asserts something is a non-negative integer.
* @param n - number to validate
* @param title - label included in thrown errors
* @returns The validated number.
* @throws On wrong argument types. {@link TypeError}
* @throws On wrong argument ranges or values. {@link RangeError}
* @example
* Validate a non-negative integer option.
* ```ts
* anumber(32, 'length');
* ```
*/
function anumber(n, title = "") {
	if (typeof n !== "number") throw new TypeError(atitle(title) + "expected number, got " + typeof n);
	if (!Number.isSafeInteger(n) || n < 0) throw new RangeError(atitle(title) + "expected integer >= 0, got " + n);
	return n;
}
/**
* Asserts something is a boolean.
* @param value - value to validate
* @param title - label included in thrown errors
* @returns The validated boolean.
* @throws On wrong argument types. {@link TypeError}
* @example
* Validate a boolean option.
* ```ts
* abool(true, 'enableXOF');
* ```
*/
function abool(value, title = "") {
	if (typeof value !== "boolean") throw new TypeError(atitle(title) + "expected boolean, got type=" + typeof value);
	return value;
}
/**
* Asserts something is Uint8Array.
* @param value - value to validate
* @param length - optional exact length constraint
* @param title - label included in thrown errors
* @returns The validated byte array.
* @throws On wrong argument types. {@link TypeError}
* @throws On wrong argument ranges or values. {@link RangeError}
* @example
* Validate that a value is a byte array.
* ```ts
* abytes(new Uint8Array([1, 2, 3]));
* ```
*/
function abytes(value, length, title = "") {
	if (isBytes(value) && (length === void 0 || value.length === length)) return value;
	if (length !== void 0) anumber(length, "length");
	const bytes = isBytes(value);
	const ofLen = length !== void 0 ? ` of length ${length}` : "";
	const got = bytes ? `length=${value.length}` : `type=${typeof value}`;
	const message = atitle(title) + "expected Uint8Array" + ofLen + ", got " + got;
	if (!bytes) throw new TypeError(message);
	throw new RangeError(message);
}
var aobject = (value, label) => {
	if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError((label === "object" ? "" : `"${label}" `) + "expected object, got type=" + typeof value);
};
var aopts = (value, label) => {
	aobject(value, label);
	const proto = Object.getPrototypeOf(value);
	if (proto !== Object.prototype && proto !== null) throw new TypeError(`"${label}" expected plain object`);
	if (Object.hasOwn(value, "__proto__")) throw new TypeError(`"${label}.__proto__" is not allowed`);
};
/**
* Asserts a hash instance has not been destroyed or finished.
* @param instance - hash instance to validate
* @param checkFinished - whether to reject finalized instances
* @throws If the hash instance has already been destroyed or finalized. {@link Error}
* @example
* Validate that a hash instance is still usable.
* ```ts
* import { aexists } from '@noble/hashes/utils.js';
* import { sha256 } from '@noble/hashes/sha2.js';
* const hash = sha256.create();
* aexists(hash);
* ```
*/
function aexists(instance, checkFinished = true) {
	if (instance.destroyed) throw new Error("hash was destroyed");
	if (checkFinished && instance.finished) throw new Error("digest() was already called");
}
/**
* Asserts output is a sufficiently-sized byte array.
* @param out - destination buffer
* @param instance - hash instance providing output length
* Oversized buffers are allowed; downstream code only promises to fill the first `outputLen` bytes.
* @throws On wrong argument types. {@link TypeError}
* @throws On wrong argument ranges or values. {@link RangeError}
* @example
* Validate a caller-provided digest buffer.
* ```ts
* import { aoutput } from '@noble/hashes/utils.js';
* import { sha256 } from '@noble/hashes/sha2.js';
* const hash = sha256.create();
* aoutput(new Uint8Array(hash.outputLen), hash);
* ```
*/
function aoutput(out, instance) {
	abytes(out, void 0, "output");
	const min = instance.outputLen;
	if (!(out.length >= min)) throw new RangeError("\"output\" expected length >= " + min);
}
/**
* Casts a typed array view to Uint32Array.
* `arr.byteOffset` must already be 4-byte aligned or the platform
* Uint32Array constructor will throw.
* @param arr - source typed array
* @returns Uint32Array view over the same buffer.
* @example
* Reinterpret a byte array as 32-bit words.
* ```ts
* u32(new Uint8Array(8));
* ```
*/
function u32(arr) {
	return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
}
/**
* Zeroizes typed arrays in place. Warning: JS provides no guarantees.
* @param arrays - arrays to overwrite with zeros
* @example
* Zeroize sensitive buffers in place.
* ```ts
* clean(new Uint8Array([1, 2, 3]));
* ```
*/
function clean(...arrays) {
	for (let i = 0; i < arrays.length; i++) arrays[i].fill(0);
}
/** Whether the current platform is little-endian. */
var isLE = /* @__PURE__ */ (() => new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68)();
/**
* Byte-swap operation for uint32 values.
* @param word - source word
* @returns Word with reversed byte order.
* @example
* Reverse the byte order of a 32-bit word.
* ```ts
* byteSwap(0x11223344);
* ```
*/
function byteSwap(word) {
	return word << 24 & 4278190080 | word << 8 & 16711680 | word >>> 8 & 65280 | word >>> 24 & 255;
}
/**
* Byte-swaps every word of a Uint32Array in place.
* @param arr - array to mutate
* @returns The same array after mutation; callers pass live state arrays here.
* @example
* Reverse the byte order of every word in place.
* ```ts
* byteSwap32(new Uint32Array([0x11223344]));
* ```
*/
function byteSwap32(arr) {
	for (let i = 0; i < arr.length; i++) arr[i] = byteSwap(arr[i]);
	return arr;
}
/**
* Conditionally byte-swaps a Uint32Array on big-endian platforms.
* @param u - array to normalize for host endianness
* @returns Original or byte-swapped array depending on platform endianness.
*   On big-endian runtimes this mutates `u` in place via `byteSwap32(...)`.
* @example
* Normalize a word array for host endianness.
* ```ts
* swap32IfBE(new Uint32Array([0x11223344]));
* ```
*/
var swap32IfBE = isLE ? (u) => u : byteSwap32;
var hasHexBuiltin = /* @__PURE__ */ (() => typeof Uint8Array.from([]).toHex === "function" && typeof Uint8Array.fromHex === "function")();
var hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
/**
* Convert byte array to hex string.
* Uses the built-in function when available and assumes it matches the tested
* fallback semantics.
* @param bytes - bytes to encode
* @returns Lowercase hexadecimal string.
* @throws On wrong argument types. {@link TypeError}
* @example
* Convert bytes to lowercase hexadecimal.
* ```ts
* bytesToHex(Uint8Array.from([0xca, 0xfe, 0x01, 0x23])); // 'cafe0123'
* ```
*/
function bytesToHex(bytes) {
	abytes(bytes);
	if (hasHexBuiltin) return bytes.toHex();
	let hex = "";
	for (let i = 0; i < bytes.length; i++) hex += hexes[bytes[i]];
	return hex;
}
function asciiToBase16(ch) {
	return ch >= 48 && ch <= 57 ? ch - 48 : ch >= 65 && ch <= 70 ? ch - 55 : ch >= 97 && ch <= 102 ? ch - 87 : void 0;
}
/**
* Convert hex string to byte array. Uses built-in function, when available.
* @param hex - hexadecimal string to decode
* @returns Decoded bytes.
* @throws On wrong argument types. {@link TypeError}
* @throws On wrong argument ranges or values. {@link RangeError}
* @example
* Decode lowercase hexadecimal into bytes.
* ```ts
* hexToBytes('cafe0123'); // Uint8Array.from([0xca, 0xfe, 0x01, 0x23])
* ```
*/
function hexToBytes(hex) {
	if (typeof hex !== "string") throw new TypeError("hex string expected, got " + typeof hex);
	if (hasHexBuiltin) try {
		return Uint8Array.fromHex(hex);
	} catch (error) {
		if (error instanceof SyntaxError) throw new RangeError(error.message);
		throw error;
	}
	const hl = hex.length;
	const al = hl / 2;
	if (hl % 2) throw new RangeError("hex string expected, got unpadded hex of length " + hl);
	const array = new Uint8Array(al);
	for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
		const n1 = asciiToBase16(hex.charCodeAt(hi));
		const n2 = asciiToBase16(hex.charCodeAt(hi + 1));
		if (n1 === void 0 || n2 === void 0) {
			const char = hex[hi] + hex[hi + 1];
			throw new RangeError("hex string expected, got non-hex character \"" + char + "\" at index " + hi);
		}
		array[ai] = n1 * 16 + n2;
	}
	return array;
}
/**
* Copies several Uint8Arrays into one.
* @param arrays - arrays to concatenate
* @returns Concatenated byte array.
* @throws On wrong argument types. {@link TypeError}
* @example
* Concatenate multiple byte arrays.
* ```ts
* concatBytes(new Uint8Array([1]), new Uint8Array([2]));
* ```
*/
function concatBytes(...arrays) {
	let sum = 0;
	for (let i = 0; i < arrays.length; i++) {
		const a = arrays[i];
		abytes(a);
		sum += a.length;
	}
	const res = new Uint8Array(sum);
	for (let i = 0, pad = 0; i < arrays.length; i++) {
		const a = arrays[i];
		res.set(a, pad);
		pad += a.length;
	}
	return res;
}
/**
* Merges default options and passed options.
* @param defaults - base option object
* @param opts - user overrides
* @param title - label included in thrown override errors
* @returns Fresh merged option object with a null prototype.
* @throws On wrong argument types. {@link TypeError}
* @example
* Merge user overrides onto default options.
* ```ts
* checkOpts({ dkLen: 32 }, { asyncTick: 10 });
* ```
*/
function checkOpts(defaults, opts, title = "opts") {
	aopts(defaults, "defaults");
	if (opts !== void 0) aopts(opts, title);
	return Object.assign(Object.create(null), defaults, opts);
}
/**
* Creates a callable hash function from a stateful class constructor.
* @param hashCons - hash constructor or factory
* @param info - optional metadata such as DER OID
* @returns Frozen callable hash wrapper with `.create()`.
*   Wrapper construction eagerly calls `hashCons(undefined)` once to read
*   `outputLen` / `blockLen`, so constructor side effects happen at module
*   init time.
* @throws On wrong argument types. {@link TypeError}
* @example
* Wrap a stateful hash constructor into a callable helper.
* ```ts
* import { createHasher } from '@noble/hashes/utils.js';
* import { sha256 } from '@noble/hashes/sha2.js';
* const wrapped = createHasher(sha256.create, { oid: sha256.oid });
* wrapped(new Uint8Array([1]));
* ```
*/
function createHasher(hashCons, info = {}) {
	if (typeof hashCons !== "function") throw new TypeError("\"hashCons\" expected function, got type=" + typeof hashCons);
	info = checkOpts({}, info, "info");
	const hashC = (msg, opts) => hashCons(opts).update(msg).digest();
	const tmp = hashCons(void 0);
	hashC.outputLen = tmp.outputLen;
	hashC.blockLen = tmp.blockLen;
	hashC.canXOF = tmp.canXOF;
	hashC.create = (opts) => hashCons(opts);
	Object.assign(hashC, info);
	return Object.freeze(hashC);
}
//#endregion
//#region node_modules/@noble/hashes/sha3.js
/**
* SHA3 (keccak) hash function, based on a new "Sponge function" design.
* Different from older hashes, the internal state is bigger than output size.
*
* Check out
* {@link https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.202.pdf | FIPS-202},
* {@link https://keccak.team/keccak.html | Website}, and
* {@link https://crypto.stackexchange.com/q/15727 | the differences between
* SHA-3 and Keccak}.
*
* Check out `sha3-addons` module for cSHAKE, k12, and others.
* @module
*/
var _0n = BigInt(0);
var _1n = BigInt(1);
var _2n = BigInt(2);
var _7n = BigInt(7);
var _256n = BigInt(256);
var _0x71n = BigInt(113);
var SHA3_PI = [];
var SHA3_ROTL = [];
var _SHA3_IOTA = [];
for (let round = 0, R = _1n, x = 1, y = 0; round < 24; round++) {
	[x, y] = [y, (2 * x + 3 * y) % 5];
	SHA3_PI.push(2 * (5 * y + x));
	SHA3_ROTL.push((round + 1) * (round + 2) / 2 % 64);
	let t = _0n;
	for (let j = 0; j < 7; j++) {
		R = (R << _1n ^ (R >> _7n) * _0x71n) % _256n;
		if (R & _2n) t ^= _1n << (_1n << BigInt(j)) - _1n;
	}
	_SHA3_IOTA.push(t);
}
var IOTAS = split(_SHA3_IOTA, true);
var SHA3_IOTA_H = IOTAS[0];
var SHA3_IOTA_L = IOTAS[1];
var rotlSH = (h, l, s) => h << s | l >>> 32 - s;
var rotlSL = (h, l, s) => l << s | h >>> 32 - s;
var rotlBH = (h, l, s) => l << s - 32 | h >>> 64 - s;
var rotlBL = (h, l, s) => h << s - 32 | l >>> 64 - s;
var rotlH = (h, l, s) => s > 32 ? rotlBH(h, l, s) : rotlSH(h, l, s);
var rotlL = (h, l, s) => s > 32 ? rotlBL(h, l, s) : rotlSL(h, l, s);
var B = /* @__PURE__ */ new Uint32Array(10);
/**
* `keccakf1600` internal permutation, additionally allows adjusting the round count.
* @param s - 5x5 Keccak state encoded as 25 lanes split into 50 uint32 words
*   in this file's local little-endian lane-word order
* @param rounds - number of rounds to execute
* @throws On wrong argument types. {@link TypeError}
* @throws On wrong argument ranges or values. {@link RangeError}
* @throws If `rounds` is outside the supported `1..24` range. {@link Error}
* @example
* Permute a Keccak state with the default 24 rounds.
* ```ts
* keccakP(new Uint32Array(50));
* ```
*/
function keccakP(s, rounds = 24) {
	if (!(s instanceof Uint32Array)) throw new TypeError("\"s\" expected Uint32Array(50), got type=" + typeof s);
	if (s.length !== 50) throw new RangeError("\"s\" expected Uint32Array(50), got length=" + s.length);
	anumber(rounds, "rounds");
	if (rounds < 1 || rounds > 24) throw new Error("\"rounds\" expected integer 1..24");
	for (let round = 24 - rounds; round < 24; round++) {
		for (let x = 0; x < 10; x++) B[x] = s[x] ^ s[x + 10] ^ s[x + 20] ^ s[x + 30] ^ s[x + 40];
		for (let x = 0; x < 10; x += 2) {
			const idx1 = (x + 8) % 10;
			const idx0 = (x + 2) % 10;
			const B0 = B[idx0];
			const B1 = B[idx0 + 1];
			const Th = rotlH(B0, B1, 1) ^ B[idx1];
			const Tl = rotlL(B0, B1, 1) ^ B[idx1 + 1];
			for (let y = 0; y < 50; y += 10) {
				s[x + y] ^= Th;
				s[x + y + 1] ^= Tl;
			}
		}
		let curH = s[2];
		let curL = s[3];
		for (let t = 0; t < 24; t++) {
			const shift = SHA3_ROTL[t];
			const Th = rotlH(curH, curL, shift);
			const Tl = rotlL(curH, curL, shift);
			const PI = SHA3_PI[t];
			curH = s[PI];
			curL = s[PI + 1];
			s[PI] = Th;
			s[PI + 1] = Tl;
		}
		for (let y = 0; y < 50; y += 10) {
			const b0 = s[y], b1 = s[y + 1], b2 = s[y + 2], b3 = s[y + 3];
			s[y] ^= ~s[y + 2] & s[y + 4];
			s[y + 1] ^= ~s[y + 3] & s[y + 5];
			s[y + 2] ^= ~s[y + 4] & s[y + 6];
			s[y + 3] ^= ~s[y + 5] & s[y + 7];
			s[y + 4] ^= ~s[y + 6] & s[y + 8];
			s[y + 5] ^= ~s[y + 7] & s[y + 9];
			s[y + 6] ^= ~s[y + 8] & b0;
			s[y + 7] ^= ~s[y + 9] & b1;
			s[y + 8] ^= ~b0 & b2;
			s[y + 9] ^= ~b1 & b3;
		}
		s[0] ^= SHA3_IOTA_H[round];
		s[1] ^= SHA3_IOTA_L[round];
	}
	clean(B);
}
/**
* Keccak sponge function.
* @param blockLen - absorb/squeeze rate in bytes
* @param suffix - domain separation suffix byte
* @param outputLen - default digest length in bytes. This base sponge only
*   requires a non-negative integer; wrappers that need positive output
*   lengths must enforce that themselves.
* @param enableXOF - whether XOF output is allowed
* @param rounds - number of Keccak-f rounds
* @example
* Build a sponge state, absorb bytes, then finalize a digest.
* ```ts
* const hash = new Keccak(136, 0x06, 32);
* hash.update(new Uint8Array([1, 2, 3]));
* hash.digest();
* ```
*/
var Keccak = class Keccak {
	state;
	pos = 0;
	posOut = 0;
	finished = false;
	state32;
	destroyed = false;
	blockLen;
	suffix;
	outputLen;
	canXOF;
	enableXOF = false;
	rounds;
	constructor(blockLen, suffix, outputLen, enableXOF = false, rounds = 24) {
		anumber(blockLen, "blockLen");
		anumber(suffix, "suffix");
		anumber(rounds, "rounds");
		abool(enableXOF, "enableXOF");
		this.blockLen = blockLen;
		this.suffix = suffix;
		this.outputLen = outputLen;
		this.enableXOF = enableXOF;
		this.canXOF = enableXOF;
		this.rounds = rounds;
		anumber(outputLen, "outputLen");
		if (!(0 < blockLen && blockLen < 200)) throw new Error("\"blockLen\" must be 1..199");
		this.state = /* @__PURE__ */ new Uint8Array(200);
		this.state32 = u32(this.state);
	}
	clone() {
		return this._cloneInto();
	}
	keccak() {
		swap32IfBE(this.state32);
		keccakP(this.state32, this.rounds);
		swap32IfBE(this.state32);
		this.posOut = 0;
		this.pos = 0;
	}
	update(data) {
		aexists(this);
		abytes(data);
		const { blockLen, state, state32 } = this;
		const len = data.length;
		const canUseU32 = blockLen % 4 === 0 && data.byteOffset % 4 === 0;
		const blockLen32 = blockLen / 4;
		const data32 = canUseU32 && len >= blockLen ? u32(data) : void 0;
		for (let pos = 0; pos < len;) {
			if (data32 !== void 0 && this.pos === 0 && pos % 4 === 0 && len - pos >= blockLen) {
				for (let i = 0, o = pos / 4; i < blockLen32; i++) state32[i] ^= data32[o + i];
				pos += blockLen;
				this.pos = blockLen;
				this.keccak();
				continue;
			}
			const take = Math.min(blockLen - this.pos, len - pos);
			for (let i = 0; i < take; i++) state[this.pos++] ^= data[pos++];
			if (this.pos === blockLen) this.keccak();
		}
		return this;
	}
	finish() {
		if (this.finished) return;
		this.finished = true;
		const { state, suffix, pos, blockLen } = this;
		state[pos] ^= suffix;
		if ((suffix & 128) !== 0 && pos === blockLen - 1) this.keccak();
		state[blockLen - 1] ^= 128;
		this.keccak();
	}
	writeInto(out) {
		aexists(this, false);
		abytes(out);
		this.finish();
		const bufferOut = this.state;
		const { blockLen } = this;
		for (let pos = 0, len = out.length; pos < len;) {
			if (this.posOut >= blockLen) this.keccak();
			const take = Math.min(blockLen - this.posOut, len - pos);
			out.set(bufferOut.subarray(this.posOut, this.posOut + take), pos);
			this.posOut += take;
			pos += take;
		}
		return out;
	}
	xofInto(out) {
		if (!this.enableXOF) throw new Error("XOF is not enabled");
		return this.writeInto(out);
	}
	xof(bytes) {
		anumber(bytes);
		return this.xofInto(new Uint8Array(bytes));
	}
	digestInto(out) {
		aoutput(out, this);
		if (this.finished) throw new Error("digest() was already called");
		this.writeInto(out.length === this.outputLen ? out : out.subarray(0, this.outputLen));
		this.destroy();
	}
	digest() {
		const out = new Uint8Array(this.outputLen);
		this.digestInto(out);
		return out;
	}
	destroy() {
		this.destroyed = true;
		clean(this.state);
	}
	_cloneInto(to) {
		const { blockLen, suffix, outputLen, rounds, enableXOF } = this;
		to ||= new Keccak(blockLen, suffix, outputLen, enableXOF, rounds);
		to.blockLen = blockLen;
		to.state32.set(this.state32);
		to.pos = this.pos;
		to.posOut = this.posOut;
		to.finished = this.finished;
		to.rounds = rounds;
		to.suffix = suffix;
		to.outputLen = outputLen;
		to.enableXOF = enableXOF;
		to.canXOF = this.canXOF;
		to.destroyed = this.destroyed;
		return to;
	}
};
var genKeccak = (suffix, blockLen, outputLen, info = {}) => createHasher(() => new Keccak(blockLen, suffix, outputLen), info);
/**
* Keccak-256 hash function. Different from SHA3-256.
* @param msg - message bytes to hash
* @param opts - Reserved hash options.
* @returns Digest bytes.
* @example
* Hash a message with Keccak-256.
* ```ts
* keccak_256(new Uint8Array([97, 98, 99]));
* ```
*/
var keccak_256 = /* @__PURE__ */ genKeccak(1, 136, 32);
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/_deps/jsr.io/@std/bytes/1.0.6/concat.js
/**
* Concatenate an array of byte slices into a single slice.
*
* @param buffers Array of byte slices to concatenate.
* @returns A new byte slice containing all the input slices concatenated.
*
* @example Basic usage
* ```ts
* import { concat } from "@std/bytes/concat";
* import { assertEquals } from "@std/assert";
*
* const a = new Uint8Array([0, 1, 2]);
* const b = new Uint8Array([3, 4, 5]);
*
* assertEquals(concat([a, b]), new Uint8Array([0, 1, 2, 3, 4, 5]));
* ```
*/ function concat(buffers) {
	let length = 0;
	for (const buffer of buffers) length += buffer.length;
	const output = new Uint8Array(length);
	let index = 0;
	for (const buffer of buffers) {
		output.set(buffer, index);
		index += buffer.length;
	}
	return output;
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/_deps/jsr.io/@std/msgpack/1.0.3/encode.js
var FOUR_BITS = 16;
var FIVE_BITS = 32;
var EIGHT_BITS = 256;
var SIXTEEN_BITS = 65536;
var THIRTY_TWO_BITS = 4294967296;
var SIXTY_FOUR_BITS = 18446744073709551616n;
var encoder = new TextEncoder();
/**
* Encode a value to {@link https://msgpack.org/ | MessagePack} binary format.
*
* @example Usage
* ```ts
* import { encode } from "@std/msgpack/encode";
* import { assertEquals } from "@std/assert";
*
* const obj = {
*   str: "deno",
*   arr: [1, 2, 3],
*   map: {
*     foo: "bar"
*   }
* }
*
* const encoded = encode(obj);
*
* assertEquals(encoded.length, 31);
* ```
*
* @param object Value to encode to MessagePack binary format.
* @returns Encoded MessagePack binary data.
*/ function encode(object) {
	const byteParts = [];
	encodeSlice(object, byteParts);
	return concat(byteParts);
}
function encodeFloat64(num) {
	const dataView = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(9));
	dataView.setFloat64(1, num);
	dataView.setUint8(0, 203);
	return new Uint8Array(dataView.buffer);
}
function encodeNumber(num) {
	if (!Number.isInteger(num)) return encodeFloat64(num);
	if (num < 0) {
		if (num >= -32) return new Uint8Array([num]);
		if (num >= -128) return new Uint8Array([208, num]);
		if (num >= -32768) {
			const dataView = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(3));
			dataView.setInt16(1, num);
			dataView.setUint8(0, 209);
			return new Uint8Array(dataView.buffer);
		}
		if (num >= -2147483648) {
			const dataView = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(5));
			dataView.setInt32(1, num);
			dataView.setUint8(0, 210);
			return new Uint8Array(dataView.buffer);
		}
		return encodeFloat64(num);
	}
	if (num <= 127) return new Uint8Array([num]);
	if (num < EIGHT_BITS) return new Uint8Array([204, num]);
	if (num < SIXTEEN_BITS) {
		const dataView = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(3));
		dataView.setUint16(1, num);
		dataView.setUint8(0, 205);
		return new Uint8Array(dataView.buffer);
	}
	if (num < THIRTY_TWO_BITS) {
		const dataView = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(5));
		dataView.setUint32(1, num);
		dataView.setUint8(0, 206);
		return new Uint8Array(dataView.buffer);
	}
	return encodeFloat64(num);
}
function encodeSlice(object, byteParts) {
	if (object === null) {
		byteParts.push(new Uint8Array([192]));
		return;
	}
	if (object === false) {
		byteParts.push(new Uint8Array([194]));
		return;
	}
	if (object === true) {
		byteParts.push(new Uint8Array([195]));
		return;
	}
	if (typeof object === "number") {
		byteParts.push(encodeNumber(object));
		return;
	}
	if (typeof object === "bigint") {
		if (object < 0) {
			if (object < -9223372036854775808n) throw new Error("Cannot safely encode bigint larger than 64 bits");
			const dataView = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(9));
			dataView.setBigInt64(1, object);
			dataView.setUint8(0, 211);
			byteParts.push(new Uint8Array(dataView.buffer));
			return;
		}
		if (object >= SIXTY_FOUR_BITS) throw new Error("Cannot safely encode bigint larger than 64 bits");
		const dataView = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(9));
		dataView.setBigUint64(1, object);
		dataView.setUint8(0, 207);
		byteParts.push(new Uint8Array(dataView.buffer));
		return;
	}
	if (typeof object === "string") {
		const encoded = encoder.encode(object);
		const len = encoded.length;
		if (len < FIVE_BITS) byteParts.push(new Uint8Array([160 | len]));
		else if (len < EIGHT_BITS) byteParts.push(new Uint8Array([217, len]));
		else if (len < SIXTEEN_BITS) {
			const dataView = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(3));
			dataView.setUint16(1, len);
			dataView.setUint8(0, 218);
			byteParts.push(new Uint8Array(dataView.buffer));
		} else if (len < THIRTY_TWO_BITS) {
			const dataView = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(5));
			dataView.setUint32(1, len);
			dataView.setUint8(0, 219);
			byteParts.push(new Uint8Array(dataView.buffer));
		} else throw new Error("Cannot safely encode string with size larger than 32 bits");
		byteParts.push(encoded);
		return;
	}
	if (object instanceof Uint8Array) {
		if (object.length < EIGHT_BITS) byteParts.push(new Uint8Array([196, object.length]));
		else if (object.length < SIXTEEN_BITS) {
			const dataView = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(3));
			dataView.setUint16(1, object.length);
			dataView.setUint8(0, 197);
			byteParts.push(new Uint8Array(dataView.buffer));
		} else if (object.length < THIRTY_TWO_BITS) {
			const dataView = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(5));
			dataView.setUint32(1, object.length);
			dataView.setUint8(0, 198);
			byteParts.push(new Uint8Array(dataView.buffer));
		} else throw new Error("Cannot safely encode Uint8Array with size larger than 32 bits");
		byteParts.push(object);
		return;
	}
	if (Array.isArray(object)) {
		if (object.length < FOUR_BITS) byteParts.push(new Uint8Array([144 | object.length]));
		else if (object.length < SIXTEEN_BITS) {
			const dataView = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(3));
			dataView.setUint16(1, object.length);
			dataView.setUint8(0, 220);
			byteParts.push(new Uint8Array(dataView.buffer));
		} else if (object.length < THIRTY_TWO_BITS) {
			const dataView = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(5));
			dataView.setUint32(1, object.length);
			dataView.setUint8(0, 221);
			byteParts.push(new Uint8Array(dataView.buffer));
		} else throw new Error("Cannot safely encode array with size larger than 32 bits");
		for (const obj of object) encodeSlice(obj, byteParts);
		return;
	}
	const prototype = Object.getPrototypeOf(object);
	if (prototype === null || prototype === Object.prototype) {
		const numKeys = Object.keys(object).length;
		if (numKeys < FOUR_BITS) byteParts.push(new Uint8Array([128 | numKeys]));
		else if (numKeys < SIXTEEN_BITS) {
			const dataView = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(3));
			dataView.setUint16(1, numKeys);
			dataView.setUint8(0, 222);
			byteParts.push(new Uint8Array(dataView.buffer));
		} else if (numKeys < THIRTY_TWO_BITS) {
			const dataView = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(5));
			dataView.setUint32(1, numKeys);
			dataView.setUint8(0, 223);
			byteParts.push(new Uint8Array(dataView.buffer));
		} else throw new Error("Cannot safely encode map with size larger than 32 bits");
		for (const [key, value] of Object.entries(object)) {
			encodeSlice(key, byteParts);
			encodeSlice(value, byteParts);
		}
		return;
	}
	throw new Error("Cannot safely encode value into messagepack");
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/signing/_userSigned.js
/**
* User-signed ([EIP-712](https://eips.ethereum.org/EIPS/eip-712)) signing for fund and account actions.
* @module
*/
/**
* Signs a user-signed action.
*
* @param args The wallet, action, and EIP-712 types.
* @return The ECDSA signature.
*
* @throws {AbstractWalletError} If signing fails.
*
* @example
* ```ts
* import { signUserSignedAction } from "@nktkas/hyperliquid/signing";
* import { ApproveAgentTypes } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // `viem` or `ethers` or any `AbstractWallet`
*
* const types = ApproveAgentTypes; // or custom EIP-712 types matching the action
* const action = {
*   type: "approveAgent",
*   signatureChainId: "0x66eee" as const,
*   hyperliquidChain: "Mainnet",
*   agentAddress: "0x...",
*   agentName: "Agent",
*   nonce: Date.now(),
* };
*
* const signature = await signUserSignedAction({ wallet, action, types });
* ```
*
* @example
* \- Full cycle of signing and sending a user-signed action to the Hyperliquid API
* ```ts
* import { signUserSignedAction } from "@nktkas/hyperliquid/signing";
* import { ApproveAgentTypes } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // `viem` or `ethers` or any `AbstractWallet`
*
* const types = ApproveAgentTypes; // or custom EIP-712 types matching the action
* const action = {
*   type: "approveAgent",
*   signatureChainId: "0x66eee" as const,
*   hyperliquidChain: "Mainnet",
*   agentAddress: "0x...",
*   agentName: "Agent",
*   nonce: Date.now(),
* };
*
* const signature = await signUserSignedAction({ wallet, action, types });
*
* // Send the signed action to the Hyperliquid API
* const response = await fetch("https://api.hyperliquid.xyz/exchange", {
*   method: "POST",
*   headers: { "Content-Type": "application/json" },
*   body: JSON.stringify({ action, signature, nonce: action.nonce }),
* });
* const body = await response.json();
* ```
*/ async function signUserSignedAction(args) {
	const { wallet, action, types } = args;
	return await signTypedData({
		wallet,
		domain: {
			name: "HyperliquidSignTransaction",
			version: "1",
			chainId: parseInt(action.signatureChainId),
			verifyingContract: "0x0000000000000000000000000000000000000000"
		},
		types,
		primaryType: Object.keys(types)[0],
		message: action
	});
}
/**
* Signs an inner per-signer contribution to a multi-sig user-signed action.
*
* Signs the action with `payloadMultiSigUser` and `outerSigner` fields injected
* (using a type extended after its first field); the returned signature is
* trimmed for inclusion in the multi-sig wrapper.
*
* @param args The signer, action, types, and signing parameters.
* @return The trimmed ECDSA signature.
*
* @throws {AbstractWalletError} If signing fails.
*/ async function signUserSignedInner(args) {
	const primaryType = Object.keys(args.types)[0];
	const primaryTypeFields = args.types[primaryType];
	const extendedTypes = {
		...args.types,
		[primaryType]: [
			primaryTypeFields[0],
			{
				name: "payloadMultiSigUser",
				type: "address"
			},
			{
				name: "outerSigner",
				type: "address"
			},
			...primaryTypeFields.slice(1)
		]
	};
	return trimSignature(await signUserSignedAction({
		wallet: args.signer,
		action: {
			payloadMultiSigUser: args.multiSigUser.toLowerCase(),
			outerSigner: args.outerSigner.toLowerCase(),
			...args.action
		},
		types: extendedTypes
	}));
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/signing/_multiSig.js
/**
* Multi-sig wrapper construction and outer signing.
* @module
*/
/** EIP-712 types for the multi-sig outer wrapper. */ var MULTI_SIG_TYPES = { "HyperliquidTransaction:SendMultiSig": [
	{
		name: "hyperliquidChain",
		type: "string"
	},
	{
		name: "multiSigActionHash",
		type: "bytes32"
	},
	{
		name: "nonce",
		type: "uint64"
	}
] };
/**
* Signs the multi-sig outer wrapper with the leader's wallet.
*
* @param args The leader wallet, the wrapper, and signing parameters.
* @return The leader's ECDSA signature.
*
* @throws {AbstractWalletError} If signing fails.
*/ async function signMultiSigOuter(args) {
	const { leader, wrapper, nonce, isTestnet = false, vaultAddress, expiresAfter } = args;
	const { type: _, ...wrapperWithoutType } = wrapper;
	const multiSigActionHash = createL1ActionHash({
		action: wrapperWithoutType,
		nonce,
		vaultAddress,
		expiresAfter
	});
	return await signTypedData({
		wallet: leader,
		domain: {
			name: "HyperliquidSignTransaction",
			version: "1",
			chainId: parseInt(wrapper.signatureChainId),
			verifyingContract: "0x0000000000000000000000000000000000000000"
		},
		types: MULTI_SIG_TYPES,
		primaryType: "HyperliquidTransaction:SendMultiSig",
		message: {
			hyperliquidChain: isTestnet ? "Testnet" : "Mainnet",
			multiSigActionHash,
			nonce
		}
	});
}
/**
* Signs an L1 action with multi-sig orchestration.
*
* Collects inner signatures from each signer over `[multiSigUser, outerSigner, action]`,
* builds the multi-sig wrapper, and signs the wrapper with the leader (first signer).
*
* @param args The signers, action, and signing parameters.
* @return The wrapper action (modified) and the leader's signature.
*
* @throws {AbstractWalletError} If signing fails.
*
* @example
* ```ts
* import { signMultiSigL1 } from "@nktkas/hyperliquid/signing";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const signers = [
*   privateKeyToAccount("0x..."),
*   privateKeyToAccount("0x..."),
*   // ...more signers if needed
* ] as const;
*
* const action = { type: "cancel", cancels: [{ a: 0, o: 12345 }] };
* const nonce = Date.now();
*
* const { action: wrapper, signature } = await signMultiSigL1({
*   signers,
*   multiSigUser: "0x...",
*   signatureChainId: "0x66eee",
*   action,
*   nonce,
* });
* ```
*
* @example
* \- Full cycle of signing and sending a multi-sig L1 action to the Hyperliquid API
* ```ts
* import { canonicalize, signMultiSigL1 } from "@nktkas/hyperliquid/signing";
* import { CancelRequest } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const signers = [
*   privateKeyToAccount("0x..."),
*   privateKeyToAccount("0x..."),
*   // ...more signers if needed
* ] as const;
*
* //             For correct hashing, keys in the L1 action must be in
* //             the same order as in the schema definition
* //             ⌄⌄⌄⌄⌄⌄⌄⌄⌄
* const action = canonicalize(CancelRequest.entries.action, {
*   type: "cancel",
*   cancels: [{ a: 0, o: 12345 }],
* });
* const nonce = Date.now();
*
* const { action: wrapper, signature } = await signMultiSigL1({
*   signers,
*   multiSigUser: "0x...",
*   signatureChainId: "0x66eee",
*   action,
*   nonce,
* });
*
* // Send the multi-sig wrapper to the Hyperliquid API
* const response = await fetch("https://api.hyperliquid.xyz/exchange", {
*   method: "POST",
*   headers: { "Content-Type": "application/json" },
*   body: JSON.stringify({ action: wrapper, signature, nonce }),
* });
* const body = await response.json();
* ```
*/ async function signMultiSigL1(args) {
	const outerSigner = await getWalletAddress(args.signers[0]);
	const innerSignatures = await Promise.all(args.signers.map((signer) => signL1Inner({
		signer,
		action: args.action,
		multiSigUser: args.multiSigUser,
		outerSigner,
		nonce: args.nonce,
		isTestnet: args.isTestnet,
		vaultAddress: args.vaultAddress,
		expiresAfter: args.expiresAfter
	})));
	const wrapper = {
		type: "multiSig",
		signatureChainId: args.signatureChainId,
		signatures: innerSignatures,
		payload: {
			multiSigUser: args.multiSigUser.toLowerCase(),
			outerSigner,
			action: args.action
		}
	};
	return {
		action: wrapper,
		signature: await signMultiSigOuter({
			leader: args.signers[0],
			wrapper,
			nonce: args.nonce,
			isTestnet: args.isTestnet,
			vaultAddress: args.vaultAddress,
			expiresAfter: args.expiresAfter
		})
	};
}
/**
* Signs a user-signed action with multi-sig orchestration.
*
* Collects inner signatures from each signer over the action with multi-sig
* fields injected into its [EIP-712](https://eips.ethereum.org/EIPS/eip-712) type, builds the wrapper, and signs the
* wrapper with the leader.
*
* @param args The signers, action, types, and signing parameters.
* @return The wrapper action and the leader's signature.
*
* @throws {AbstractWalletError} If signing fails.
*
* @example
* ```ts
* import { signMultiSigUserSigned } from "@nktkas/hyperliquid/signing";
* import { ApproveAgentTypes } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const signers = [
*   privateKeyToAccount("0x..."),
*   privateKeyToAccount("0x..."),
*   // ...more signers if needed
* ] as const;
*
* const types = ApproveAgentTypes; // or custom EIP-712 types matching the action
* const action = {
*   type: "approveAgent",
*   signatureChainId: "0x66eee" as const,
*   hyperliquidChain: "Mainnet" as const,
*   agentAddress: "0x...",
*   agentName: "Agent",
*   nonce: Date.now(),
* };
*
* const { action: wrapper, signature } = await signMultiSigUserSigned({
*   signers,
*   multiSigUser: "0x...",
*   action,
*   types,
* });
* ```
*
* @example
* \- Full cycle of signing and sending a multi-sig user-signed action to the Hyperliquid API
* ```ts
* import { signMultiSigUserSigned } from "@nktkas/hyperliquid/signing";
* import { ApproveAgentTypes } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const signers = [
*   privateKeyToAccount("0x..."),
*   privateKeyToAccount("0x..."),
*   // ...more signers if needed
* ] as const;
*
* const types = ApproveAgentTypes; // or custom EIP-712 types matching the action
* const action = {
*   type: "approveAgent",
*   signatureChainId: "0x66eee" as const,
*   hyperliquidChain: "Mainnet" as const,
*   agentAddress: "0x...",
*   agentName: "Agent",
*   nonce: Date.now(),
* };
*
* const { action: wrapper, signature } = await signMultiSigUserSigned({
*   signers,
*   multiSigUser: "0x...",
*   action,
*   types,
* });
*
* // Send the multi-sig wrapper to the Hyperliquid API
* const response = await fetch("https://api.hyperliquid.xyz/exchange", {
*   method: "POST",
*   headers: { "Content-Type": "application/json" },
*   body: JSON.stringify({ action: wrapper, signature, nonce: action.nonce }),
* });
* const body = await response.json();
* ```
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/multi-sig
*/ async function signMultiSigUserSigned(args) {
	const outerSigner = await getWalletAddress(args.signers[0]);
	const innerSignatures = await Promise.all(args.signers.map((signer) => signUserSignedInner({
		signer,
		action: args.action,
		types: args.types,
		multiSigUser: args.multiSigUser,
		outerSigner
	})));
	const wrapper = {
		type: "multiSig",
		signatureChainId: args.action.signatureChainId,
		signatures: innerSignatures,
		payload: {
			multiSigUser: args.multiSigUser.toLowerCase(),
			outerSigner,
			action: args.payloadAction ?? args.action
		}
	};
	return {
		action: wrapper,
		signature: await signMultiSigOuter({
			leader: args.signers[0],
			wrapper,
			nonce: args.action.nonce ?? args.action.time,
			isTestnet: args.action.hyperliquidChain === "Testnet"
		})
	};
}
/** Removes leading zeros from signature `r` and `s` (required for multi-sig signatures). */ function trimSignature(sig) {
	return {
		r: sig.r.replace(/^0x0+/, "0x"),
		s: sig.s.replace(/^0x0+/, "0x"),
		v: sig.v
	};
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/signing/_l1.js
/**
* L1 (phantom-agent) signing for trading actions.
* @module
*/
/**
* Creates a hash of the L1 action.
*
* @param args The action and metadata to hash.
* @return The keccak256 hash as a hex string.
*
* @example
* ```ts
* import { createL1ActionHash } from "@nktkas/hyperliquid/signing";
*
* const action = { type: "cancel", cancels: [{ a: 0, o: 12345 }] };
* const nonce = Date.now();
*
* const actionHash = createL1ActionHash({ action, nonce });
* ```
*/ function createL1ActionHash(args) {
	const { action, nonce, vaultAddress, expiresAfter } = args;
	return `0x${bytesToHex(keccak_256(concatBytes(encode(adjust(action)), toUint64Bytes(nonce), vaultAddress ? new Uint8Array([1]) : new Uint8Array([0]), vaultAddress ? hexToBytes(vaultAddress.slice(2)) : /* @__PURE__ */ new Uint8Array(), expiresAfter !== void 0 ? new Uint8Array([0]) : /* @__PURE__ */ new Uint8Array(), expiresAfter !== void 0 ? toUint64Bytes(expiresAfter) : /* @__PURE__ */ new Uint8Array())))}`;
}
/**
* Normalizes a value into a shape that `@std/msgpack` encodes the way Hyperliquid expects on the wire:
* - drops `undefined` properties (otherwise the encoder throws)
* - widens `number`s outside the int32 range to `BigInt` (otherwise they would be encoded as float64 instead of int64)
*/ function adjust(value) {
	if (Array.isArray(value)) return value.map(adjust);
	if (typeof value === "object" && value !== null) {
		const result = {};
		for (const key in value) {
			const entry = value[key];
			if (entry !== void 0) result[key] = adjust(entry);
		}
		return result;
	}
	if (typeof value === "number" && Number.isInteger(value) && (value >= 4294967296 || value < -2147483648)) return BigInt(value);
	return value;
}
function toUint64Bytes(n) {
	const bytes = /* @__PURE__ */ new Uint8Array(8);
	new DataView(bytes.buffer).setBigUint64(0, BigInt(n));
	return bytes;
}
/**
* Signs an L1 action.
*
* @param args The wallet, action, and signing parameters.
* @return The ECDSA signature.
*
* @throws {AbstractWalletError} If signing fails.
*
* @example
* ```ts
* import { signL1Action } from "@nktkas/hyperliquid/signing";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // `viem` or `ethers` or any `AbstractWallet`
*
* const action = { type: "cancel", cancels: [{ a: 0, o: 12345 }] };
* const nonce = Date.now();
*
* const signature = await signL1Action({ wallet, action, nonce });
* ```
*
* @example
* \- Full cycle of signing and sending an L1 action to the Hyperliquid API
* ```ts
* import { canonicalize, signL1Action } from "@nktkas/hyperliquid/signing";
* import { CancelRequest } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // `viem` or `ethers` or any `AbstractWallet`
*
* //             For correct hashing, keys in the L1 action must be in
* //             the same order as in the schema definition
* //             ⌄⌄⌄⌄⌄⌄⌄⌄⌄
* const action = canonicalize(CancelRequest.entries.action, {
*   type: "cancel",
*   cancels: [{ a: 0, o: 12345 }],
* });
* const nonce = Date.now();
*
* const signature = await signL1Action({ wallet, action, nonce });
*
* // Send the signed action to the Hyperliquid API
* const response = await fetch("https://api.hyperliquid.xyz/exchange", {
*   method: "POST",
*   headers: { "Content-Type": "application/json" },
*   body: JSON.stringify({ action, signature, nonce }),
* });
* const body = await response.json();
* ```
*/ async function signL1Action(args) {
	const { wallet, action, nonce, isTestnet = false, vaultAddress, expiresAfter } = args;
	const actionHash = createL1ActionHash({
		action,
		nonce,
		vaultAddress,
		expiresAfter
	});
	return await signTypedData({
		wallet,
		domain: {
			name: "Exchange",
			version: "1",
			chainId: 1337,
			verifyingContract: "0x0000000000000000000000000000000000000000"
		},
		types: { Agent: [{
			name: "source",
			type: "string"
		}, {
			name: "connectionId",
			type: "bytes32"
		}] },
		primaryType: "Agent",
		message: {
			source: isTestnet ? "b" : "a",
			connectionId: actionHash
		}
	});
}
/**
* Signs an inner per-signer contribution to a multi-sig L1 action.
*
* Signs `[multiSigUser, outerSigner, action]` with both addresses lowercased;
* the returned signature is trimmed for inclusion in the multi-sig wrapper.
*
* @param args The signer, action, and signing parameters.
* @return The trimmed ECDSA signature.
*
* @throws {AbstractWalletError} If signing fails.
*/ async function signL1Inner(args) {
	return trimSignature(await signL1Action({
		wallet: args.signer,
		action: [
			args.multiSigUser.toLowerCase(),
			args.outerSigner.toLowerCase(),
			args.action
		],
		nonce: args.nonce,
		isTestnet: args.isTestnet,
		vaultAddress: args.vaultAddress,
		expiresAfter: args.expiresAfter
	}));
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/transport/_base.js
/**
* Base contracts shared by every transport: the request and subscription
* interfaces and the root of the transport error hierarchy.
* @module
*/
/**
* Thrown when an error occurs at the transport level (e.g., timeout).
*
* @example
* ```ts
* import { HttpTransport, TransportError } from "@nktkas/hyperliquid";
*
* const transport = new HttpTransport();
* try {
*   // Throws a TransportError subclass on a timeout, an abort, or an HTTP failure.
*   await transport.request("info", { type: "allMids" });
* } catch (error) {
*   if (error instanceof TransportError) {
*     console.error(`Transport failure: ${error.message}`);
*   }
* }
* ```
*/ var TransportError = class extends HyperliquidError {
	/**
	* Creates a transport-level error.
	*
	* The platform-specific failure goes into `options.cause`.
	*/ constructor(message, options) {
		super(message, options);
		this.name = "TransportError";
	}
};
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/transport/_polyfills.js
/** @see https://developer.mozilla.org/en-US/docs/Web/API/DOMException */ var DOMException_ = /* @__PURE__ */ (() => {
	return globalThis.DOMException || class DOMException extends Error {
		constructor(message = "", name = "Error") {
			super(message);
			this.name = name;
		}
	};
})();
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/transport/_abort.js
/**
* AbortSignal wiring helpers shared by the transports.
* @module
*/
/** Aborts `target` with a `TimeoutError` after `ms`; `cancel` clears the timer, `reason` identifies the abort. */ function scheduleTimeout(target, ms) {
	const reason = new DOMException_("Signal timed out.", "TimeoutError");
	const timeoutId = ms !== null && Number.isFinite(ms) ? setTimeout(() => target.abort(reason), ms) : void 0;
	return {
		reason,
		cancel: () => clearTimeout(timeoutId)
	};
}
/** Relays abort events from `sources` into `target` and returns a detach function. */ function relay(sources, target) {
	const detach = new AbortController();
	for (const source of sources) {
		if (!source) continue;
		if (source.aborted) {
			target.abort(source.reason);
			break;
		}
		source.addEventListener("abort", () => target.abort(source.reason), {
			once: true,
			signal: detach.signal
		});
	}
	return () => detach.abort();
}
/**
* Error thrown when an HTTP request fails.
*
* @example
* ```ts
* import { HttpRequestError, HttpTransport } from "@nktkas/hyperliquid";
*
* const transport = new HttpTransport();
* try {
*   // Throws on a non-OK response, a timeout, an abort, or a network failure.
*   await transport.request("info", { type: "allMids" });
* } catch (error) {
*   if (error instanceof HttpRequestError) {
*     console.error(error.message, error.response?.status);
*   }
* }
* ```
*/ var HttpRequestError = class extends TransportError {
	/** The HTTP response that caused the error. */ response;
	/** The original request payload that triggered the error, if available. */ request;
	/**
	* Creates an HTTP request error.
	*
	* The message is the response status line, extended with `detail` when given;
	* without a response, `detail` alone or a description of `cause` is used.
	*/ constructor(options) {
		const { detail, response, request, ...errorOptions } = options ?? {};
		let message;
		if (response) {
			message = `${response.status} ${response.statusText}`.trim();
			if (detail) message += ` - ${detail}`;
		} else if (detail) message = detail;
		else {
			const cause = errorOptions.cause;
			message = cause === void 0 ? "Unknown HTTP request error" : `Unknown HTTP request error: ${cause instanceof Error ? cause.message : String(cause)}`;
		}
		super(message, errorOptions);
		this.name = "HttpRequestError";
		this.response = response;
		this.request = request;
	}
};
/**
* HTTP transport for the Hyperliquid API.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
*
* const transport = new HttpTransport();
* const mids = await transport.request("info", { type: "allMids" });
* ```
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint
*/ var HttpTransport = class {
	/** Indicates this transport uses testnet endpoint. */ isTestnet;
	/** Request timeout in ms. Set to `null` to disable. */ timeout;
	/** Custom API URL for requests. */ apiUrl;
	/** Custom RPC URL for explorer requests. */ rpcUrl;
	/** A custom {@link https://developer.mozilla.org/en-US/docs/Web/API/RequestInit | RequestInit} that is merged with a fetch request. */ fetchOptions;
	constructor(options) {
		this.isTestnet = options?.isTestnet ?? false;
		this.timeout = options?.timeout === void 0 ? 1e4 : options.timeout;
		this.apiUrl = options?.apiUrl ?? (this.isTestnet ? "https://api.hyperliquid-testnet.xyz" : "https://api.hyperliquid.xyz");
		this.rpcUrl = options?.rpcUrl ?? (this.isTestnet ? "https://rpc.hyperliquid-testnet.xyz" : "https://rpc.hyperliquid.xyz");
		this.fetchOptions = options?.fetchOptions ?? {};
	}
	/**
	* Sends a request to the Hyperliquid API.
	*
	* Routes to {@linkcode apiUrl} for `info`/`exchange` and {@linkcode rpcUrl} for `explorer`.
	*
	* @param endpoint The API endpoint to send the request to.
	* @param payload The payload to send with the request.
	* @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
	* @return A promise that resolves with the parsed JSON response body.
	*
	* @throws {HttpRequestError} When the HTTP request fails.
	*
	* @example
	* ```ts
	* import { HttpTransport } from "@nktkas/hyperliquid";
	*
	* const transport = new HttpTransport();
	* const mids = await transport.request("info", { type: "allMids" });
	* ```
	*/ async request(endpoint, payload, signal) {
		const controller = new AbortController();
		const timeoutMs = this.timeout;
		const timeout = scheduleTimeout(controller, timeoutMs);
		const detachRelay = relay([signal, this.fetchOptions.signal], controller);
		try {
			const url = buildEndpointUrl(endpoint === "explorer" ? this.rpcUrl : this.apiUrl, endpoint);
			const init = mergeRequestInit({
				body: JSON.stringify(payload),
				headers: { "Content-Type": "application/json" },
				method: "POST"
			}, this.fetchOptions, { signal: controller.signal });
			const response = await fetch(url, init);
			if (!response.ok || !response.headers.get("Content-Type")?.includes("application/json")) {
				const clone = response.clone();
				const body = await response.text().catch(() => void 0);
				throw new HttpRequestError({
					response: clone,
					detail: body ? truncate$1(body) : void 0,
					request: payload
				});
			}
			const text = await response.text();
			try {
				return JSON.parse(text);
			} catch (error) {
				throw new HttpRequestError({
					response: recreateResponse(response, text),
					detail: "Invalid JSON response body",
					cause: error,
					request: payload
				});
			}
		} catch (error) {
			if (error instanceof TransportError) throw error;
			if (error === timeout.reason) throw new HttpRequestError({
				detail: `Request timed out after ${timeoutMs} ms`,
				cause: error,
				request: payload
			});
			if (controller.signal.aborted && error === controller.signal.reason) throw new HttpRequestError({
				detail: "Request aborted",
				cause: error,
				request: payload
			});
			throw new HttpRequestError({
				cause: error,
				request: payload
			});
		} finally {
			timeout.cancel();
			detachRelay();
		}
	}
};
/** Truncates `text` to `limit` characters, appending the original length. */ function truncate$1(text, limit = 1024) {
	if (text.length <= limit) return text;
	return `${text.slice(0, limit)}… (${text.length} chars total)`;
}
/** Resolves an endpoint against a base URL without dropping the base path or query. */ function buildEndpointUrl(base, endpoint) {
	const baseUrl = new URL(base);
	if (!baseUrl.pathname.endsWith("/")) baseUrl.pathname += "/";
	const url = new URL(endpoint, baseUrl);
	url.search = baseUrl.search;
	return url;
}
/** Rebuilds a response whose body has already been consumed, so `error.response` stays readable. */ function recreateResponse(original, text) {
	return new Response(text || null, {
		status: original.status,
		statusText: original.statusText,
		headers: original.headers
	});
}
/** Merges headers inits left to right: a later occurrence of a key overwrites the earlier one. */ function mergeHeadersInit(...inits) {
	const merged = new Headers();
	for (const init of inits) for (const [key, value] of new Headers(init)) merged.set(key, value);
	return merged;
}
/** Merges request inits left to right: `headers` are combined, every other field is last-init-wins. */ function mergeRequestInit(...inits) {
	const merged = {};
	const headersList = [];
	for (const init of inits) {
		Object.assign(merged, init);
		if (init.headers) headersList.push(init.headers);
	}
	if (headersList.length > 0) merged.headers = mergeHeadersInit(...headersList);
	return merged;
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/_schemas.js
/**
* Common valibot schemas for primitive types used across the API.
* @module
*/
/** Unsigned decimal number as a string (e.g., "123.45"). */ var UnsignedDecimal = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ pipe(/* @__PURE__ */ union([/* @__PURE__ */ string(), /* @__PURE__ */ number()]), /* @__PURE__ */ toString(), /* @__PURE__ */ string(), /* @__PURE__ */ transform((value) => normalizeDecimalString(value)), /* @__PURE__ */ regex(/^[0-9]+(\.[0-9]+)?$/));
})();
/** Decimal number as a string, can be negative (e.g., "-123.45"). */ var Decimal$1 = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ pipe(/* @__PURE__ */ union([/* @__PURE__ */ string(), /* @__PURE__ */ number()]), /* @__PURE__ */ toString(), /* @__PURE__ */ string(), /* @__PURE__ */ transform((value) => normalizeDecimalString(value)), /* @__PURE__ */ regex(/^-?[0-9]+(\.[0-9]+)?$/));
})();
/** Safe integer number (>= Number.MIN_SAFE_INTEGER & <= Number.MAX_SAFE_INTEGER). */ var Integer = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ pipe(/* @__PURE__ */ union([/* @__PURE__ */ string(), /* @__PURE__ */ number()]), /* @__PURE__ */ toNumber(), /* @__PURE__ */ number(), /* @__PURE__ */ safeInteger());
})();
/** Unsigned safe integer number (>= 0 & <= Number.MAX_SAFE_INTEGER). */ var UnsignedInteger = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ pipe(/* @__PURE__ */ union([/* @__PURE__ */ string(), /* @__PURE__ */ number()]), /* @__PURE__ */ toNumber(), /* @__PURE__ */ number(), /* @__PURE__ */ safeInteger(), /* @__PURE__ */ minValue(0));
})();
/**
* Normalize a decimal string: drop redundant leading and trailing zeros and collapse negative zero.
* A string that is not a well-formed decimal is returned unchanged.
*
* @example
* ```ts ignore
* normalizeDecimalString("00123");  // => "123"
* normalizeDecimalString("1.2000"); // => "1.2"
* normalizeDecimalString(".5");     // => "0.5"
* normalizeDecimalString("-0.0");   // => "0"
* normalizeDecimalString("1.0.0");  // => "1.0.0" (not a decimal — unchanged)
* ```
*/ function normalizeDecimalString(value) {
	const match = value.match(/^(-?)([0-9]*)(?:\.([0-9]*))?$/);
	if (!match) return value;
	const [, sign, intRaw, fracRaw = ""] = match;
	if (intRaw === "" && fracRaw === "") return value;
	const int = intRaw.replace(/^0+/, "") || "0";
	let fracEnd = fracRaw.length;
	while (fracEnd > 0 && fracRaw[fracEnd - 1] === "0") fracEnd--;
	const frac = fracRaw.slice(0, fracEnd);
	const body = frac === "" ? int : `${int}.${frac}`;
	return sign === "-" && body !== "0" ? `-${body}` : body;
}
/** Hexadecimal string starting with "0x". */ var Hex = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ pipe(/* @__PURE__ */ string(), /* @__PURE__ */ regex(/^0[xX][0-9a-fA-F]+$/), /* @__PURE__ */ transform((value) => value.toLowerCase()));
})();
/** Ethereum address (42 characters hex string). */ var Address = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(42));
})();
/** Client order ID (34 characters hex string). */ var Cloid = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(34));
})();
/** Percentage string (e.g., "50%"). */ var Percent = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ pipe(/* @__PURE__ */ string(), /* @__PURE__ */ regex(/^[0-9]+(\.[0-9]+)?%$/), /* @__PURE__ */ transform((value) => value));
})();
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/_errors.js
/**
* Shared error types for Hyperliquid API responses.
* @module
*/
/** Thrown when the API returns an error response. */ var ApiRequestError = class extends HyperliquidError {
	/** Raw API response that contains the error. */ response;
	/**
	* @param response Raw API response that contains the error.
	* @param message Human-readable error message extracted from the response.
	*/ constructor(response, message) {
		super(message ?? "An unknown error occurred while processing an API request. See `response` for more details.");
		this.name = "ApiRequestError";
		this.response = response;
	}
};
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/_base/errors.js
/**
* Error types and utilities for Exchange API responses.
* @module
*/
/** True if `value` has an `error` field of type string. */ function hasErrorField(value) {
	return typeof value === "object" && value !== null && "error" in value && typeof value.error === "string";
}
/** True if `r` matches `{ status: "err", response: string }`. */ function isTopLevelError(r) {
	return typeof r === "object" && r !== null && "status" in r && r.status === "err";
}
/** True if `r` matches `{ response: { type, data: { statuses: [{ error }, ...] } } }` (any error in array). */ function isBulkError(r) {
	if (typeof r !== "object" || r === null) return false;
	const response = r.response;
	if (typeof response?.type !== "string") return false;
	const statuses = response.data?.statuses;
	return Array.isArray(statuses) && statuses.some(hasErrorField);
}
/** True if `r` matches `{ response: { data: { status: { error } } } }`. */ function isSingleError(r) {
	if (typeof r !== "object" || r === null) return false;
	const status = r.response?.data?.status;
	return hasErrorField(status);
}
/** True if `r` matches any of the three Hyperliquid error response shapes. */ function isErrorResponse(r) {
	return isTopLevelError(r) || isBulkError(r) || isSingleError(r);
}
/** Extract a human-readable error message from an error response, or `undefined` if none. */ function getErrorMessage(r) {
	if (isTopLevelError(r)) return r.response;
	if (isBulkError(r)) {
		const prefix = r.response.type;
		const errors = r.response.data.statuses.flatMap((s, i) => hasErrorField(s) ? [`${prefix} ${i}: ${s.error}`] : []);
		if (errors.length > 0) return errors.join(", ");
	}
	if (isSingleError(r)) return r.response.data.status.error;
}
/**
* Throws {@linkcode ApiRequestError} if the response is an error; otherwise returns void.
*
* @param response Raw API response to validate.
*
* @throws {ApiRequestError} If the response contains an error.
*/ function assertSuccessResponse(response) {
	if (isErrorResponse(response)) throw new ApiRequestError(response, getErrorMessage(response));
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/_base/_nonce.js
/**
* Nonce manager for generating unique, monotonically increasing nonces.
* @module
*/ /** Default upper bound on map size before stale entries are pruned. */ var DEFAULT_MAX_ENTRIES = 1e4;
/**
* Creates a nonce manager that issues unique, monotonically increasing nonces per key.
*
* Uses `Date.now()` in ms; if the previous nonce for the key is greater than or equal to
* `Date.now()`, increments by 1 to maintain monotonicity.
*
* To bound memory under high-cardinality workloads (e.g., a server proxying many wallets),
* stale entries are pruned when the internal map grows beyond `maxEntries`. An entry is
* considered stale if `Date.now()` has advanced past its last issued nonce.
*
* @param maxEntries Upper bound on map size before stale entries are pruned. Default: `10000`.
* @return A {@linkcode NonceManager}.
*/ function createNonceManager(maxEntries = DEFAULT_MAX_ENTRIES) {
	const map = /* @__PURE__ */ new Map();
	return { getNonce(key) {
		const now = Date.now();
		if (map.size > maxEntries) {
			for (const [k, last] of map) if (now > last) map.delete(k);
		}
		const last = map.get(key) ?? 0;
		const nonce = now > last ? now : last + 1;
		map.set(key, nonce);
		return nonce;
	} };
}
/** Default global nonce manager instance. */ var globalNonceManager = /* @__PURE__ */ createNonceManager();
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/_deps/jsr.io/@std/async/1.5.0/unstable_semaphore.js
/** Internal node for the FIFO waiting queue. */ /**
* A counting semaphore for limiting concurrent access to a resource.
*
* @experimental **UNSTABLE**: New API, yet to be vetted.
*
* @example Usage
* ```ts
* import { Semaphore } from "@std/async/unstable-semaphore";
*
* const sem = new Semaphore(2);
* {
*   using _permit = await sem.acquire();
*   // critical section
* } // permit is automatically released when exiting the block
* ```
*/ var Semaphore = class {
	#max;
	/** Current number of available permits. */ #count;
	/** Head of the waiting queue. */ #head;
	/** Tail of the waiting queue. */ #tail;
	/**
	* Creates a new semaphore with the specified number of permits.
	*
	* @param max Maximum concurrent permits. Defaults to 1 (mutex).
	* @throws {TypeError} If `max` is not a positive integer.
	*/ constructor(max = 1) {
		if (!Number.isInteger(max) || max < 1) throw new TypeError(`Cannot create semaphore as 'max' must be a positive integer: received ${max}`);
		this.#count = this.#max = max;
	}
	/**
	* Acquires a permit, waiting if none are available.
	*
	* @example Usage
	* ```ts no-assert
	* import { Semaphore } from "@std/async/unstable-semaphore";
	*
	* const sem = new Semaphore(1);
	* await sem.acquire();
	* try {
	*   // critical section
	* } finally {
	*   sem.release();
	* }
	* ```
	*
	* @example Using `using` statement
	* ```ts no-assert
	* import { Semaphore } from "@std/async/unstable-semaphore";
	*
	* const sem = new Semaphore(1);
	* {
	*   using _permit = await sem.acquire();
	*   // critical section
	* } // permit is automatically released when exiting the block
	* ```
	*
	* @returns A promise that resolves to a {@linkcode Disposable} when a permit is acquired.
	*/ acquire() {
		const disposable = { [Symbol.dispose]: () => this.release() };
		if (this.#count > 0) {
			this.#count--;
			return Promise.resolve(disposable);
		}
		return new Promise((res) => {
			const node = {
				res: () => res(disposable),
				next: void 0
			};
			if (this.#tail) this.#tail = this.#tail.next = node;
			else this.#head = this.#tail = node;
		});
	}
	/**
	* Tries to acquire a permit without waiting.
	*
	* @example Usage
	* ```ts no-assert
	* import { Semaphore } from "@std/async/unstable-semaphore";
	*
	* const sem = new Semaphore(1);
	* const permit = sem.tryAcquire();
	* if (permit) {
	*   using _ = permit;
	*   // critical section
	* } else {
	*   // resource is busy
	* }
	* ```
	*
	* @returns A {@linkcode Disposable} if a permit was acquired, `undefined` otherwise.
	*/ tryAcquire() {
		if (this.#count > 0) {
			this.#count--;
			return { [Symbol.dispose]: () => this.release() };
		}
	}
	/**
	* Releases a permit, allowing the next waiter to proceed.
	*
	* @example Usage
	* ```ts no-assert
	* import { Semaphore } from "@std/async/unstable-semaphore";
	*
	* const sem = new Semaphore(1);
	* await sem.acquire();
	* try {
	*   // critical section
	* } finally {
	*   sem.release();
	* }
	* ```
	*/ release() {
		if (this.#head) {
			this.#head.res();
			this.#head = this.#head.next;
			if (!this.#head) this.#tail = void 0;
		} else if (this.#count < this.#max) this.#count++;
	}
};
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/_base/_semaphore.js
/**
* Per-key semaphore registry for serializing async operations.
* @module
*/
/**
* A reference-counted registry for lazily creating and reusing per-key values.
*
* @template K Map key type.
* @template V Stored value type.
*/ var RefCountedRegistry = class {
	_map = /* @__PURE__ */ new Map();
	_factory;
	/**
	* Creates a new registry instance.
	*
	* @param factory Factory function used to create a new value when a key is first referenced.
	*/ constructor(factory) {
		this._factory = factory;
	}
	/**
	* Increments the reference count for a key and returns its value.
	*
	* If the key is not present, a new value is created via the factory.
	*
	* @param key Registry key.
	* @return The value associated with the key.
	*/ ref(key) {
		let entry = this._map.get(key);
		if (!entry) {
			entry = {
				value: this._factory(),
				refs: 0
			};
			this._map.set(key, entry);
		}
		entry.refs++;
		return entry.value;
	}
	/**
	* Decrements the reference count for a key.
	*
	* When the count reaches zero, the entry is removed.
	*
	* @param key Registry key.
	*/ unref(key) {
		const entry = this._map.get(key);
		if (!entry) return;
		if (--entry.refs === 0) this._map.delete(key);
	}
};
var semaphores = new RefCountedRegistry(() => new Semaphore(1));
/**
* Acquires a lock for the given key, executes the provided async function, and releases the lock.
*
* @param key The key to lock on.
* @param fn The async function to execute while holding the lock.
* @return The result of the async function.
*/ async function withLock(key, fn) {
	const semaphore = semaphores.ref(key);
	await semaphore.acquire();
	try {
		return await fn();
	} finally {
		semaphore.release();
		semaphores.unref(key);
	}
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/_base/_shell.js
/**
* Common execution shell shared by L1 and user-signed Exchange API actions.
* @module
*/
/**
* Common shell for executing an Exchange API request:
* acquires per-`(walletAddress × isTestnet)` lock, generates nonce, calls `build` to construct
* the signed payload, sends to the Exchange endpoint, and validates the response.
*
* @param config Exchange API configuration.
* @param build Callback that, given the nonce, returns the action, signature, and any extras.
* @param signal Optional {@link AbortSignal} to cancel the request.
* @return The validated API response.
*
* @throws {ApiRequestError} If the API returns an error response.
*/ async function executeWithShell(config, build, signal) {
	const walletAddress = await getWalletAddress("wallet" in config ? config.wallet : config.signers[0]);
	const key = `${walletAddress}:${config.transport.isTestnet}`;
	return await withLock(key, async () => {
		const nonce = await (config.nonceManager?.(walletAddress) ?? globalNonceManager.getNonce(key));
		const { action, signature, extras } = await build(nonce);
		const response = await config.transport.request("exchange", {
			action,
			signature,
			nonce,
			...extras
		}, signal);
		assertSuccessResponse(response);
		return response;
	});
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/_base/execute.js
/**
* Execute helpers for L1 and user-signed Exchange API actions.
* @module
*/
/**
* Execute an L1 action on the Hyperliquid Exchange.
*
* Handles both single-wallet and multi-sig signing.
*
* @param config Exchange API configuration.
* @param action Action payload to execute.
* @param options Additional options for the request.
* @return API response.
*
* @throws {ValidationError} If the request options fail validation.
* @throws {ApiRequestError} If the API returns an error response.
*/ async function executeL1Action(config, action, options) {
	const vaultAddress = parse(/* @__PURE__ */ optional(Address), options?.vaultAddress ?? config.defaultVaultAddress);
	const expiresAfter = parse(/* @__PURE__ */ optional(UnsignedInteger), options?.expiresAfter ?? (typeof config.defaultExpiresAfter === "function" ? await config.defaultExpiresAfter() : config.defaultExpiresAfter));
	return executeWithShell(config, async (nonce) => {
		if ("wallet" in config) return {
			action,
			signature: await signL1Action({
				wallet: config.wallet,
				action,
				nonce,
				isTestnet: config.transport.isTestnet,
				vaultAddress,
				expiresAfter
			}),
			extras: {
				vaultAddress,
				expiresAfter
			}
		};
		else {
			const { action: wrapper, signature } = await signMultiSigL1({
				signers: config.signers,
				multiSigUser: config.multiSigUser,
				signatureChainId: await resolveSignatureChainId(config),
				action,
				nonce,
				isTestnet: config.transport.isTestnet,
				vaultAddress,
				expiresAfter
			});
			return {
				action: wrapper,
				signature,
				extras: {
					vaultAddress,
					expiresAfter
				}
			};
		}
	}, options?.signal);
}
/**
* Execute a user-signed action (EIP-712) on the Hyperliquid Exchange.
*
* Handles both single-wallet and multi-sig signing.
*
* @param config Exchange API configuration.
* @param action Action payload to execute.
* @param types EIP-712 type definitions for signing.
* @param options Additional options for the request.
* @return API response.
*
* @throws {ValidationError} If the request options fail validation.
* @throws {ApiRequestError} If the API returns an error response.
*/ function executeUserSignedAction(config, action, types, options) {
	return executeWithShell(config, async (nonce) => {
		const { type, ...restAction } = action;
		const nonceFieldName = extractNonceFieldName(types);
		const baseFields = {
			type,
			signatureChainId: await resolveSignatureChainId(config),
			hyperliquidChain: config.transport.isTestnet ? "Testnet" : "Mainnet"
		};
		const fullAction = nonceFieldName === "nonce" ? {
			...baseFields,
			...restAction,
			nonce
		} : {
			...baseFields,
			...restAction,
			time: nonce
		};
		if ("wallet" in config) return {
			action: fullAction,
			signature: await signUserSignedAction({
				wallet: config.wallet,
				action: fullAction,
				types
			})
		};
		else {
			const payloadAction = options?.toMultiSigPayloadAction?.(fullAction) ?? fullAction;
			const { action: wrapper, signature } = await signMultiSigUserSigned({
				signers: config.signers,
				multiSigUser: config.multiSigUser,
				action: fullAction,
				payloadAction,
				types
			});
			return {
				action: wrapper,
				signature
			};
		}
	}, options?.signal);
}
/** Extracts the nonce field name ("nonce" or "time") from EIP-712 type definitions. */ function extractNonceFieldName(types) {
	const primaryType = Object.keys(types)[0];
	const field = types[primaryType].find((f) => f.name === "nonce" || f.name === "time");
	if (!field) throw new HyperliquidError(`EIP-712 types must contain a "nonce" or "time" field in "${primaryType}"`);
	return field.name;
}
/** Resolves signature chain ID from config, or falls back to the leader wallet's chain ID. */ async function resolveSignatureChainId(config) {
	if (config.signatureChainId) return parse(Hex, typeof config.signatureChainId === "function" ? await config.signatureChainId() : config.signatureChainId);
	return await getWalletChainId("wallet" in config ? config.wallet : config.signers[0]);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/activateOutcomeDeployer.js
/**
* Activate or deactivate the signer as an outcome deployer.
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/hip-4-deployer-actions#activation
*/ var ActivateOutcomeDeployerRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("activateOutcomeDeployer"),
			/** Deactivate instead of activate. */ isDeactivate: /* @__PURE__ */ boolean()
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		}),
		/** Expiration time of the action. */ expiresAfter: /* @__PURE__ */ optional(UnsignedInteger)
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var ActivateOutcomeDeployerActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object(ActivateOutcomeDeployerRequest.entries.action.entries);
})();
/**
* Activate or deactivate the signer as an outcome deployer.
*
* Signing: L1 Action.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { activateOutcomeDeployer } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await activateOutcomeDeployer({ transport, wallet }, {
*   isDeactivate: false,
* });
* ```
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/hip-4-deployer-actions#activation
*/ function activateOutcomeDeployer(config, params, opts) {
	return executeL1Action(config, canonicalize(ActivateOutcomeDeployerActionSchema, parse(ActivateOutcomeDeployerActionSchema, {
		type: "activateOutcomeDeployer",
		...params
	})), opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/agentEnableDexAbstraction.js
/**
* Enable HIP-3 DEX abstraction.
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#enable-hip-3-dex-abstraction-agent
*/ var AgentEnableDexAbstractionRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({ 
		/** Type of action. */ type: /* @__PURE__ */ literal("agentEnableDexAbstraction") }),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		}),
		/** Expiration time of the action. */ expiresAfter: /* @__PURE__ */ optional(UnsignedInteger)
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var AgentEnableDexAbstractionActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object(AgentEnableDexAbstractionRequest.entries.action.entries);
})();
/**
* Enable HIP-3 DEX abstraction.
*
* Signing: L1 Action.
*
* @deprecated use {@linkcode agentSetAbstraction} instead.
*
* @param config General configuration for Exchange API requests.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { agentEnableDexAbstraction } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await agentEnableDexAbstraction({ transport, wallet });
* ```
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#enable-hip-3-dex-abstraction-agent
*/ function agentEnableDexAbstraction(config, opts) {
	return executeL1Action(config, canonicalize(AgentEnableDexAbstractionActionSchema, parse(AgentEnableDexAbstractionActionSchema, { type: "agentEnableDexAbstraction" })), opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/agentSendAsset.js
/**
* Transfer tokens on behalf of the principal via an agent wallet.
*
* Like {@link sendAsset} but signed as an L1 action by the agent wallet (instead of EIP-712 by the principal).
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#agent-send-asset
*/ var AgentSendAssetRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("agentSendAsset"),
			/** Destination address. */ destination: Address,
			/** Source DEX ("" for default USDC perp DEX, "spot" for spot). */ sourceDex: /* @__PURE__ */ string(),
			/** Destination DEX ("" for default USDC perp DEX, "spot" for spot). */ destinationDex: /* @__PURE__ */ string(),
			/** Token identifier. */ token: /* @__PURE__ */ string(),
			/** Amount to send (not in wei). */ amount: UnsignedDecimal,
			/** Source sub-account address ("" for main account). */ fromSubAccount: /* @__PURE__ */ optional(/* @__PURE__ */ union([/* @__PURE__ */ literal(""), Address]), ""),
			/** Nonce (timestamp in ms). Equal to the envelope nonce; injected by the SDK. */ nonce: UnsignedInteger
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		}),
		/** Expiration time of the action. */ expiresAfter: /* @__PURE__ */ optional(UnsignedInteger)
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var AgentSendAssetActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object(AgentSendAssetRequest.entries.action.entries);
})();
/**
* Transfer tokens on behalf of the principal via an agent wallet.
*
* Like {@link sendAsset} but signed as an L1 action by the agent wallet (instead of EIP-712 by the principal).
*
* Signing: L1 Action.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { agentSendAsset } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const agentWallet = privateKeyToAccount("0x..."); // approved agent's private key
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await agentSendAsset({ transport, wallet: agentWallet }, {
*   destination: "0x0000000000000000000000000000000000000001",
*   sourceDex: "",
*   destinationDex: "test",
*   token: "USDC:0xeb62eee3685fc4c43992febcd9e75443",
*   amount: "1",
* });
* ```
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#agent-send-asset
*/ function agentSendAsset(config, params, opts) {
	const action = canonicalize(AgentSendAssetActionSchema, parse(AgentSendAssetActionSchema, {
		type: "agentSendAsset",
		...params,
		nonce: 0
	}));
	return executeL1Action({
		...config,
		nonceManager: async (addr) => action.nonce = await (config.nonceManager?.(addr) ?? globalNonceManager.getNonce(`${addr}:${config.transport.isTestnet}`))
	}, action, opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/agentSetAbstraction.js
/**
* Set user abstraction mode (method for agent wallet).
*
* Like {@link userSetAbstraction} but signed as an L1 action by the agent wallet (instead of EIP-712 by the principal).
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#set-user-abstraction-agent
*/ var AgentSetAbstractionRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("agentSetAbstraction"),
			/**
			* User abstraction mode.
			* - `"i"`: disabled
			* - `"u"`: unifiedAccount
			* - `"p"`: portfolioMargin
			*/ abstraction: /* @__PURE__ */ picklist([
				"i",
				"u",
				"p"
			])
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		}),
		/** Expiration time of the action. */ expiresAfter: /* @__PURE__ */ optional(UnsignedInteger)
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var AgentSetAbstractionActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object(AgentSetAbstractionRequest.entries.action.entries);
})();
/**
* Set user abstraction mode (method for agent wallet).
*
* Like {@link userSetAbstraction} but signed as an L1 action by the agent wallet (instead of EIP-712 by the principal).
*
* Signing: L1 Action.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { agentSetAbstraction } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await agentSetAbstraction({ transport, wallet }, {
*   abstraction: "u",
* });
* ```
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#set-user-abstraction-agent
*/ function agentSetAbstraction(config, params, opts) {
	return executeL1Action(config, canonicalize(AgentSetAbstractionActionSchema, parse(AgentSetAbstractionActionSchema, {
		type: "agentSetAbstraction",
		...params
	})), opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/approveAgent.js
/**
* Approve an agent to sign on behalf of the master account.
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#approve-an-api-wallet
*/ var ApproveAgentRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("approveAgent"),
			/** Chain ID in hex format for EIP-712 signing. */ signatureChainId: Hex,
			/** Hyperliquid network type. */ hyperliquidChain: /* @__PURE__ */ picklist(["Mainnet", "Testnet"]),
			/** Agent address. */ agentAddress: Address,
			/** Agent name (min 1 and max 16 characters) or empty string for unnamed agent. */ agentName: /* @__PURE__ */ nullish(/* @__PURE__ */ pipe(/* @__PURE__ */ string(), /* @__PURE__ */ check((input) => {
				return input.replace(/ valid_until \d+$/, "").length <= 16;
			}, (issue) => {
				return `Invalid length: Expected <= 16 but received ${issue.input.replace(/ valid_until \d+$/, "").length}`;
			})), ""),
			/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		})
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var ApproveAgentActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ omit(/* @__PURE__ */ object(ApproveAgentRequest.entries.action.entries), [
		"signatureChainId",
		"hyperliquidChain",
		"nonce"
	]);
})();
/** EIP-712 types for the {@linkcode approveAgent} function. */ var ApproveAgentTypes = { "HyperliquidTransaction:ApproveAgent": [
	{
		name: "hyperliquidChain",
		type: "string"
	},
	{
		name: "agentAddress",
		type: "address"
	},
	{
		name: "agentName",
		type: "string"
	},
	{
		name: "nonce",
		type: "uint64"
	}
] };
/**
* Approve an agent to sign on behalf of the master account.
*
* Signing: User-Signed EIP-712.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example Basic usage
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { approveAgent } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await approveAgent({ transport, wallet }, {
*   agentAddress: "0x...",
*   agentName: "myAgent",
* });
* ```
*
* @example With expiration timestamp
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { approveAgent } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* const expirationTimestamp = Date.now() + 24 * 60 * 60 * 1000; // 24 hours from now
* await approveAgent({ transport, wallet }, {
*   agentAddress: "0x...",
*   agentName: `myAgent valid_until ${expirationTimestamp}`,
* });
* ```
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#approve-an-api-wallet
*/ function approveAgent(config, params, opts) {
	return executeUserSignedAction(config, canonicalize(ApproveAgentActionSchema, parse(ApproveAgentActionSchema, {
		type: "approveAgent",
		...params
	})), ApproveAgentTypes, opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/approveBuilderFee.js
/**
* Approve a maximum fee rate for a builder.
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#approve-a-builder-fee
*/ var ApproveBuilderFeeRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("approveBuilderFee"),
			/** Chain ID in hex format for EIP-712 signing. */ signatureChainId: Hex,
			/** Hyperliquid network type. */ hyperliquidChain: /* @__PURE__ */ picklist(["Mainnet", "Testnet"]),
			/** Max fee rate (e.g., "0.01%"). */ maxFeeRate: Percent,
			/** Builder address. */ builder: Address,
			/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		})
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var ApproveBuilderFeeActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ omit(/* @__PURE__ */ object(ApproveBuilderFeeRequest.entries.action.entries), [
		"signatureChainId",
		"hyperliquidChain",
		"nonce"
	]);
})();
/** EIP-712 types for the {@linkcode approveBuilderFee} function. */ var ApproveBuilderFeeTypes = { "HyperliquidTransaction:ApproveBuilderFee": [
	{
		name: "hyperliquidChain",
		type: "string"
	},
	{
		name: "maxFeeRate",
		type: "string"
	},
	{
		name: "builder",
		type: "address"
	},
	{
		name: "nonce",
		type: "uint64"
	}
] };
/**
* Approve a maximum fee rate for a builder.
*
* Signing: User-Signed EIP-712.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { approveBuilderFee } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await approveBuilderFee({ transport, wallet }, {
*   maxFeeRate: "0.01%",
*   builder: "0x...",
* });
* ```
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#approve-a-builder-fee
*/ function approveBuilderFee(config, params, opts) {
	return executeUserSignedAction(config, canonicalize(ApproveBuilderFeeActionSchema, parse(ApproveBuilderFeeActionSchema, {
		type: "approveBuilderFee",
		...params
	})), ApproveBuilderFeeTypes, opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/authorizeAqav2Role.js
/**
* Authorize an AQAv2 role.
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#authorize-aqav2-role
*/ var AuthorizeAqav2RoleRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("authorizeAqav2Role"),
			/** Token identifier. */ token: UnsignedInteger,
			/** Role to authorize. */ role: /* @__PURE__ */ picklist(["technical", "treasury"])
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		}),
		/** Expiration time of the action. */ expiresAfter: /* @__PURE__ */ optional(UnsignedInteger)
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var AuthorizeAqav2RoleActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object(AuthorizeAqav2RoleRequest.entries.action.entries);
})();
/**
* Authorize an AQAv2 role.
*
* Signing: L1 Action.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { authorizeAqav2Role } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await authorizeAqav2Role({ transport, wallet }, {
*   token: 0,
*   role: "technical",
* });
* ```
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#authorize-aqav2-role
*/ function authorizeAqav2Role(config, params, opts) {
	return executeL1Action(config, canonicalize(AuthorizeAqav2RoleActionSchema, parse(AuthorizeAqav2RoleActionSchema, {
		type: "authorizeAqav2Role",
		...params
	})), opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/batchModify.js
/**
* Modify multiple orders.
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#modify-multiple-orders
*/ var BatchModifyRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("batchModify"),
			/** Order modifications. */ modifies: /* @__PURE__ */ array(/* @__PURE__ */ object({
				/** Order ID or Client Order ID. */ oid: /* @__PURE__ */ union([UnsignedInteger, Cloid]),
				/** New order parameters. */ order: /* @__PURE__ */ object({
					/** Asset ID. */ a: UnsignedInteger,
					/** Position side (`true` for long, `false` for short). */ b: /* @__PURE__ */ boolean(),
					/** Price. */ p: /* @__PURE__ */ pipe(UnsignedDecimal, /* @__PURE__ */ check((input) => Number(input) > 0, "Value must be greater than zero")),
					/** Size (in base currency units). */ s: UnsignedDecimal,
					/** Whether the order is reduce-only. */ r: /* @__PURE__ */ boolean(),
					/** Order type (`limit` for limit orders, `trigger` for stop-loss/take-profit orders). */ t: /* @__PURE__ */ union([/* @__PURE__ */ object({ 
					/** Limit order parameters. */ limit: /* @__PURE__ */ object({ 
					/**
					* Time-in-force.
					* - `"Gtc"`: Remains active until filled or canceled.
					* - `"Ioc"`: Fills immediately or cancels any unfilled portion.
					* - `"Alo"`: Adds liquidity only.
					* - `"FrontendMarket"`: Similar to Ioc, but add a note that this is market order.
					*/ tif: /* @__PURE__ */ picklist([
						"Gtc",
						"Ioc",
						"Alo",
						"FrontendMarket"
					]) }) }), /* @__PURE__ */ object({ 
					/** Trigger order parameters. */ trigger: /* @__PURE__ */ object({
						/** Whether the order is a market order. */ isMarket: /* @__PURE__ */ boolean(),
						/** Trigger price. */ triggerPx: /* @__PURE__ */ pipe(UnsignedDecimal, /* @__PURE__ */ check((input) => Number(input) > 0, "Value must be greater than zero")),
						/** Indicates whether it is take profit or stop loss. */ tpsl: /* @__PURE__ */ picklist(["tp", "sl"])
					}) })]),
					/** Client Order ID. */ c: /* @__PURE__ */ optional(Cloid)
				})
			})),
			/**
			* Always place the resulting orders, even if the cancels did not succeed.
			*
			* Omit the field otherwise; the default behavior requires each new order to be a non-trigger order with TIF
			* `Alo`, or a non-executable order with TIF `Gtc`.
			*/ a: /* @__PURE__ */ optional(/* @__PURE__ */ literal(true))
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		}),
		/** Vault address (for vault trading). */ vaultAddress: /* @__PURE__ */ optional(Address),
		/** Expiration time of the action. */ expiresAfter: /* @__PURE__ */ optional(UnsignedInteger)
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var BatchModifyActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object(BatchModifyRequest.entries.action.entries);
})();
/**
* Modify multiple orders.
*
* Signing: L1 Action.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful variant of {@link OrderResponse} without error statuses.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { batchModify } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* const data = await batchModify({ transport, wallet }, {
*   modifies: [
*     {
*       oid: 123,
*       order: {
*         a: 0,
*         b: true,
*         p: "31000",
*         s: "0.2",
*         r: false,
*         t: { limit: { tif: "Gtc" } },
*       },
*     },
*   ],
* });
* ```
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#modify-multiple-orders
*/ function batchModify(config, params, opts) {
	return executeL1Action(config, canonicalize(BatchModifyActionSchema, parse(BatchModifyActionSchema, {
		type: "batchModify",
		...params
	})), opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/borrowLend.js
/**
* Borrow or lend assets.
* @see null
*/ var BorrowLendRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("borrowLend"),
			/** Operation type. */ operation: /* @__PURE__ */ picklist([
				"supply",
				"withdraw",
				"repay",
				"borrow"
			]),
			/** Token ID. */ token: UnsignedInteger,
			/** Amount to supply/withdraw (null = full). */ amount: /* @__PURE__ */ nullable(UnsignedDecimal)
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		}),
		/** Vault address (for vault trading). */ vaultAddress: /* @__PURE__ */ optional(Address),
		/** Expiration time of the action. */ expiresAfter: /* @__PURE__ */ optional(UnsignedInteger)
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var BorrowLendActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object(BorrowLendRequest.entries.action.entries);
})();
/**
* Borrow or lend assets.
*
* Signing: L1 Action.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { borrowLend } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await borrowLend({ transport, wallet }, {
*   operation: "supply",
*   token: 0,
*   amount: "20",
* });
* ```
*
* @see null
*/ function borrowLend(config, params, opts) {
	return executeL1Action(config, canonicalize(BorrowLendActionSchema, parse(BorrowLendActionSchema, {
		type: "borrowLend",
		...params
	})), opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/cancel.js
/**
* Cancel order(s).
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#cancel-order-s
*/ var CancelRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("cancel"),
			/** Orders to cancel by asset and order ID. */ cancels: /* @__PURE__ */ array(/* @__PURE__ */ object({
				/** Asset ID. */ a: UnsignedInteger,
				/** Order ID. */ o: UnsignedInteger
			})),
			/** Prioritize this cancel in the mempool (fast cancel). */ f: /* @__PURE__ */ optional(/* @__PURE__ */ literal(true))
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		}),
		/** Vault address (for vault trading). */ vaultAddress: /* @__PURE__ */ optional(Address),
		/** Expiration time of the action. */ expiresAfter: /* @__PURE__ */ optional(UnsignedInteger)
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var CancelActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object(CancelRequest.entries.action.entries);
})();
/**
* Cancel order(s).
*
* Signing: L1 Action.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful variant of {@link CancelResponse} without error statuses.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { cancel } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await cancel({ transport, wallet }, {
*   cancels: [{ a: 0, o: 123 }],
* });
* ```
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#cancel-order-s
*/ function cancel(config, params, opts) {
	return executeL1Action(config, canonicalize(CancelActionSchema, parse(CancelActionSchema, {
		type: "cancel",
		...params
	})), opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/cancelByCloid.js
/**
* Cancel order(s) by cloid.
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#cancel-order-s-by-cloid
*/ var CancelByCloidRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("cancelByCloid"),
			/** Orders to cancel by asset and client order ID. */ cancels: /* @__PURE__ */ array(/* @__PURE__ */ object({
				/** Asset ID. */ asset: UnsignedInteger,
				/** Client Order ID. */ cloid: Cloid
			})),
			/** Prioritize this cancel in the mempool (fast cancel). */ f: /* @__PURE__ */ optional(/* @__PURE__ */ literal(true))
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		}),
		/** Vault address (for vault trading). */ vaultAddress: /* @__PURE__ */ optional(Address),
		/** Expiration time of the action. */ expiresAfter: /* @__PURE__ */ optional(UnsignedInteger)
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var CancelByCloidActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object(CancelByCloidRequest.entries.action.entries);
})();
/**
* Cancel order(s) by cloid.
*
* Signing: L1 Action.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful variant of {@link CancelResponse} without error statuses.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { cancelByCloid } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await cancelByCloid({ transport, wallet }, {
*   cancels: [
*     { asset: 0, cloid: "0x..." },
*   ],
* });
* ```
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#cancel-order-s-by-cloid
*/ function cancelByCloid(config, params, opts) {
	return executeL1Action(config, canonicalize(CancelByCloidActionSchema, parse(CancelByCloidActionSchema, {
		type: "cancelByCloid",
		...params
	})), opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/cDeposit.js
/**
* Transfer native token from the user spot account into staking for delegating to validators.
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#deposit-into-staking
*/ var CDepositRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("cDeposit"),
			/** Chain ID in hex format for EIP-712 signing. */ signatureChainId: Hex,
			/** Hyperliquid network type. */ hyperliquidChain: /* @__PURE__ */ picklist(["Mainnet", "Testnet"]),
			/** Amount of wei to deposit into staking balance (float * 1e8). */ wei: /* @__PURE__ */ pipe(UnsignedInteger, /* @__PURE__ */ minValue(1)),
			/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		})
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var CDepositActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ omit(/* @__PURE__ */ object(CDepositRequest.entries.action.entries), [
		"signatureChainId",
		"hyperliquidChain",
		"nonce"
	]);
})();
/** EIP-712 types for the {@linkcode cDeposit} function. */ var CDepositTypes = { "HyperliquidTransaction:CDeposit": [
	{
		name: "hyperliquidChain",
		type: "string"
	},
	{
		name: "wei",
		type: "uint64"
	},
	{
		name: "nonce",
		type: "uint64"
	}
] };
/**
* Transfer native token from the user spot account into staking for delegating to validators.
*
* Signing: User-Signed EIP-712.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { cDeposit } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await cDeposit({ transport, wallet }, {
*   wei: 1 * 1e8,
* });
* ```
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#deposit-into-staking
*/ function cDeposit(config, params, opts) {
	return executeUserSignedAction(config, canonicalize(CDepositActionSchema, parse(CDepositActionSchema, {
		type: "cDeposit",
		...params
	})), CDepositTypes, opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/claimRewards.js
/**
* Claim rewards from referral program.
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#claim-rewards
*/ var ClaimRewardsRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({ 
		/** Type of action. */ type: /* @__PURE__ */ literal("claimRewards") }),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		}),
		/** Expiration time of the action. */ expiresAfter: /* @__PURE__ */ optional(UnsignedInteger)
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var ClaimRewardsActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object(ClaimRewardsRequest.entries.action.entries);
})();
/**
* Claim rewards from referral program.
*
* Signing: L1 Action.
*
* @param config General configuration for Exchange API requests.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { claimRewards } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await claimRewards({ transport, wallet });
* ```
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#claim-rewards
*/ function claimRewards(config, opts) {
	return executeL1Action(config, canonicalize(ClaimRewardsActionSchema, parse(ClaimRewardsActionSchema, { type: "claimRewards" })), opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/convertToMultiSigUser.js
/** Multi-sig config or `null` to revert to single-sig. */ var ConvertToMultiSigUserRequestSignersSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ nullable(
		/** Multi-signature configuration. */
		/* @__PURE__ */ object({
			/** List of authorized user addresses. */ authorizedUsers: /* @__PURE__ */ array(Address),
			/** Minimum number of signatures required. */ threshold: /* @__PURE__ */ pipe(UnsignedInteger, /* @__PURE__ */ minValue(1), /* @__PURE__ */ maxValue(10))
		})
	);
})();
/**
* Convert a single-signature account to a multi-signature account or vice versa.
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/multi-sig
*/ var ConvertToMultiSigUserRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("convertToMultiSigUser"),
			/** Chain ID in hex format for EIP-712 signing. */ signatureChainId: Hex,
			/** Hyperliquid network type. */ hyperliquidChain: /* @__PURE__ */ picklist(["Mainnet", "Testnet"]),
			/**
			* Signers configuration.
			*
			* Must be `ConvertToMultiSigUserRequestSignersSchema` converted to a string via `JSON.stringify(...)`.
			*/ signers: /* @__PURE__ */ union([/* @__PURE__ */ pipe(/* @__PURE__ */ string(), /* @__PURE__ */ parseJson(), ConvertToMultiSigUserRequestSignersSchema, /* @__PURE__ */ stringifyJson()), /* @__PURE__ */ pipe(ConvertToMultiSigUserRequestSignersSchema, /* @__PURE__ */ stringifyJson())]),
			/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		})
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var ConvertToMultiSigUserActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ omit(/* @__PURE__ */ object(ConvertToMultiSigUserRequest.entries.action.entries), [
		"signatureChainId",
		"hyperliquidChain",
		"nonce"
	]);
})();
/** EIP-712 types for the {@linkcode convertToMultiSigUser} function. */ var ConvertToMultiSigUserTypes = { "HyperliquidTransaction:ConvertToMultiSigUser": [
	{
		name: "hyperliquidChain",
		type: "string"
	},
	{
		name: "signers",
		type: "string"
	},
	{
		name: "nonce",
		type: "uint64"
	}
] };
/**
* Convert a single-signature account to a multi-signature account or vice versa.
*
* Signing: User-Signed EIP-712.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example Convert to multi-sig user
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { convertToMultiSigUser } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await convertToMultiSigUser({ transport, wallet }, {
*   signers: {
*     authorizedUsers: ["0x...", "0x...", "0x..."],
*     threshold: 2,
*   },
* });
* ```
*
* @example Convert to single-sig user
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { convertToMultiSigUser } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await convertToMultiSigUser({ transport, wallet }, {
*   signers: null,
* });
* ```
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/multi-sig
*/ function convertToMultiSigUser(config, params, opts) {
	return executeUserSignedAction(config, canonicalize(ConvertToMultiSigUserActionSchema, parse(ConvertToMultiSigUserActionSchema, {
		type: "convertToMultiSigUser",
		...params
	})), ConvertToMultiSigUserTypes, opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/createSubAccount.js
/**
* Create a sub-account.
* @see null
*/ var CreateSubAccountRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("createSubAccount"),
			/** Sub-account name. */ name: /* @__PURE__ */ pipe(/* @__PURE__ */ string(), /* @__PURE__ */ minLength(1), /* @__PURE__ */ maxLength(16))
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		}),
		/** Expiration time of the action. */ expiresAfter: /* @__PURE__ */ optional(UnsignedInteger)
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var CreateSubAccountActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object(CreateSubAccountRequest.entries.action.entries);
})();
/**
* Create a sub-account.
*
* Signing: L1 Action.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Response for creating a sub-account.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { createSubAccount } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* const data = await createSubAccount({ transport, wallet }, {
*   name: "...",
* });
* ```
*
* @see null
*/ function createSubAccount(config, params, opts) {
	return executeL1Action(config, canonicalize(CreateSubAccountActionSchema, parse(CreateSubAccountActionSchema, {
		type: "createSubAccount",
		...params
	})), opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/createVault.js
/**
* Create a vault.
* @see null
*/ var CreateVaultRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("createVault"),
			/** Vault name. */ name: /* @__PURE__ */ pipe(/* @__PURE__ */ string(), /* @__PURE__ */ minLength(3), /* @__PURE__ */ maxLength(50)),
			/** Vault description. */ description: /* @__PURE__ */ pipe(/* @__PURE__ */ string(), /* @__PURE__ */ minLength(10), /* @__PURE__ */ maxLength(250)),
			/** Initial balance (float * 1e6). */ initialUsd: /* @__PURE__ */ pipe(UnsignedInteger, /* @__PURE__ */ minValue(1e8)),
			/** Nonce (timestamp in ms). Equal to the envelope nonce; injected by the SDK. */ nonce: UnsignedInteger
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		}),
		/** Expiration time of the action. */ expiresAfter: /* @__PURE__ */ optional(UnsignedInteger)
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var CreateVaultActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object(CreateVaultRequest.entries.action.entries);
})();
/**
* Create a vault.
*
* Signing: L1 Action.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Response for creating a vault.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { createVault } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* const data = await createVault({ transport, wallet }, {
*   name: "...",
*   description: "...",
*   initialUsd: 100 * 1e6,
* });
* ```
*
* @see null
*/ function createVault(config, params, opts) {
	const action = canonicalize(CreateVaultActionSchema, parse(CreateVaultActionSchema, {
		type: "createVault",
		...params,
		nonce: 0
	}));
	return executeL1Action({
		...config,
		nonceManager: async (addr) => action.nonce = await (config.nonceManager?.(addr) ?? globalNonceManager.getNonce(`${addr}:${config.transport.isTestnet}`))
	}, action, opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/cSignerAction.js
/**
* Jail or unjail self as a validator signer.
* @see null
*/ var CSignerActionRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to jail or unjail the signer. */ action: /* @__PURE__ */ variant("type", [/* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("CSignerAction"),
			/** Jail the signer. */ jailSelf: /* @__PURE__ */ null_()
		}), /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("CSignerAction"),
			/** Unjail the signer. */ unjailSelf: /* @__PURE__ */ null_()
		})]),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		}),
		/** Expiration time of the action. */ expiresAfter: /* @__PURE__ */ optional(UnsignedInteger)
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var CSignerActionActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ variant("type", CSignerActionRequest.entries.action.options);
})();
/**
* Jail or unjail self as a validator signer.
*
* Signing: L1 Action.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example Jail self
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { cSignerAction } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await cSignerAction({ transport, wallet }, {
*   jailSelf: null,
* });
* ```
*
* @example Unjail self
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { cSignerAction } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await cSignerAction({ transport, wallet }, {
*   unjailSelf: null,
* });
* ```
*
* @see null
*/ function cSignerAction(config, params, opts) {
	return executeL1Action(config, canonicalize(CSignerActionActionSchema, parse(CSignerActionActionSchema, {
		type: "CSignerAction",
		...params
	})), opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/cValidatorAction.js
/**
* Action related to validator management.
* @see null
*/ var CValidatorActionRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Validator management action. */ action: /* @__PURE__ */ variant("type", [
			/* @__PURE__ */ object({
				/** Type of action. */ type: /* @__PURE__ */ literal("CValidatorAction"),
				/** Profile changes to apply. */ changeProfile: /* @__PURE__ */ object({
					/** Validator node IP address. */ node_ip: /* @__PURE__ */ nullable(/* @__PURE__ */ object({ 
					/** IP address. */ Ip: /* @__PURE__ */ pipe(/* @__PURE__ */ string(), /* @__PURE__ */ ip()) })),
					/** Validator name. */ name: /* @__PURE__ */ nullable(/* @__PURE__ */ string()),
					/** Validator description. */ description: /* @__PURE__ */ nullable(/* @__PURE__ */ string()),
					/** Whether the validator is unjailed. */ unjailed: /* @__PURE__ */ boolean(),
					/** Enable or disable delegations. */ disable_delegations: /* @__PURE__ */ nullable(/* @__PURE__ */ boolean()),
					/** Commission rate in basis points (1 = 0.0001%). */ commission_bps: /* @__PURE__ */ nullable(UnsignedInteger),
					/** Signer address. */ signer: /* @__PURE__ */ nullable(Address)
				})
			}),
			/* @__PURE__ */ object({
				/** Type of action. */ type: /* @__PURE__ */ literal("CValidatorAction"),
				/** Registration parameters. */ register: /* @__PURE__ */ object({
					/** Validator profile information. */ profile: /* @__PURE__ */ object({
						/** Validator node IP address. */ node_ip: /* @__PURE__ */ object({ 
						/** IP address. */ Ip: /* @__PURE__ */ pipe(/* @__PURE__ */ string(), /* @__PURE__ */ ip()) }),
						/** Validator name. */ name: /* @__PURE__ */ string(),
						/** Validator description. */ description: /* @__PURE__ */ string(),
						/** Whether delegations are disabled. */ delegations_disabled: /* @__PURE__ */ boolean(),
						/** Commission rate in basis points (1 = 0.0001%). */ commission_bps: UnsignedInteger,
						/** Signer address. */ signer: Address
					}),
					/** Initial jail status. */ unjailed: /* @__PURE__ */ boolean(),
					/** Initial stake amount in wei. */ initial_wei: UnsignedInteger
				})
			}),
			/* @__PURE__ */ object({
				/** Type of action. */ type: /* @__PURE__ */ literal("CValidatorAction"),
				/** Unregister the validator. */ unregister: /* @__PURE__ */ null_()
			})
		]),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		}),
		/** Expiration time of the action. */ expiresAfter: /* @__PURE__ */ optional(UnsignedInteger)
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var CValidatorActionActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ variant("type", CValidatorActionRequest.entries.action.options);
})();
/**
* Action related to validator management.
*
* Signing: L1 Action.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example Change validator profile
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { cValidatorAction } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await cValidatorAction({ transport, wallet }, {
*   changeProfile: {
*     node_ip: { Ip: "1.2.3.4" },
*     name: "...",
*     description: "...",
*     unjailed: true,
*     disable_delegations: false,
*     commission_bps: null,
*     signer: null,
*   },
* });
* ```
*
* @see null
*/ function cValidatorAction(config, params, opts) {
	return executeL1Action(config, canonicalize(CValidatorActionActionSchema, parse(CValidatorActionActionSchema, {
		type: "CValidatorAction",
		...params
	})), opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/cWithdraw.js
/**
* Transfer native token from staking into the user's spot account.
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#withdraw-from-staking
*/ var CWithdrawRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("cWithdraw"),
			/** Chain ID in hex format for EIP-712 signing. */ signatureChainId: Hex,
			/** Hyperliquid network type. */ hyperliquidChain: /* @__PURE__ */ picklist(["Mainnet", "Testnet"]),
			/** Amount of wei to withdraw from staking balance (float * 1e8). */ wei: /* @__PURE__ */ pipe(UnsignedInteger, /* @__PURE__ */ minValue(1)),
			/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		})
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var CWithdrawActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ omit(/* @__PURE__ */ object(CWithdrawRequest.entries.action.entries), [
		"signatureChainId",
		"hyperliquidChain",
		"nonce"
	]);
})();
/** EIP-712 types for the {@linkcode cWithdraw} function. */ var CWithdrawTypes = { "HyperliquidTransaction:CWithdraw": [
	{
		name: "hyperliquidChain",
		type: "string"
	},
	{
		name: "wei",
		type: "uint64"
	},
	{
		name: "nonce",
		type: "uint64"
	}
] };
/**
* Transfer native token from staking into the user's spot account.
*
* Signing: User-Signed EIP-712.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { cWithdraw } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await cWithdraw({ transport, wallet }, {
*   wei: 1 * 1e8,
* });
* ```
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#withdraw-from-staking
*/ function cWithdraw(config, params, opts) {
	return executeUserSignedAction(config, canonicalize(CWithdrawActionSchema, parse(CWithdrawActionSchema, {
		type: "cWithdraw",
		...params
	})), CWithdrawTypes, opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/evmUserModify.js
/**
* Configure block type for EVM transactions.
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/hyperevm/dual-block-architecture
*/ var EvmUserModifyRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("evmUserModify"),
			/** `true` for large blocks, `false` for small blocks. */ usingBigBlocks: /* @__PURE__ */ boolean()
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		}),
		/** Expiration time of the action. */ expiresAfter: /* @__PURE__ */ optional(UnsignedInteger)
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var EvmUserModifyActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object(EvmUserModifyRequest.entries.action.entries);
})();
/**
* Configure block type for EVM transactions.
*
* Signing: L1 Action.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { evmUserModify } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await evmUserModify({ transport, wallet }, {
*   usingBigBlocks: true,
* });
* ```
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/hyperevm/dual-block-architecture
*/ function evmUserModify(config, params, opts) {
	return executeL1Action(config, canonicalize(EvmUserModifyActionSchema, parse(EvmUserModifyActionSchema, {
		type: "evmUserModify",
		...params
	})), opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/finalizeEvmContract.js
/**
* Finalize the link between a HyperCore spot token and an ERC-20 contract on the HyperEVM.
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/hyperevm/hypercore-less-than-greater-than-hyperevm-transfers
*/ var FinalizeEvmContractRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("finalizeEvmContract"),
			/** Token identifier to link. */ token: UnsignedInteger,
			/**
			* Verification method matching how the EVM contract was deployed:
			* - `{ create: { nonce } }`: contract deployed from an EOA — the EVM user signs with the deploy nonce.
			* - `"firstStorageSlot"`: finalizer address is stored at the contract's first storage slot.
			* - `"customStorageSlot"`: finalizer address is stored at slot `keccak256("HyperCore deployer")`.
			*/ input: /* @__PURE__ */ union([
				/* @__PURE__ */ object({ 
				/** Use the EVM deployment nonce of an EOA-deployed contract. */ create: /* @__PURE__ */ object({ 
				/** Nonce used to deploy the EVM contract. */ nonce: UnsignedInteger }) }),
				/* @__PURE__ */ literal("firstStorageSlot"),
				/* @__PURE__ */ literal("customStorageSlot")
			])
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		}),
		/** Expiration time of the action. */ expiresAfter: /* @__PURE__ */ optional(UnsignedInteger)
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var FinalizeEvmContractActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object(FinalizeEvmContractRequest.entries.action.entries);
})();
/**
* Finalize the link between a HyperCore spot token and an ERC-20 contract on the HyperEVM.
*
* Signing: L1 Action.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example Finalize from an EOA-deployed contract
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { finalizeEvmContract } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await finalizeEvmContract({ transport, wallet }, {
*   token: 200,
*   input: { create: { nonce: 0 } },
* });
* ```
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/hyperevm/hypercore-less-than-greater-than-hyperevm-transfers
*/ function finalizeEvmContract(config, params, opts) {
	return executeL1Action(config, canonicalize(FinalizeEvmContractActionSchema, parse(FinalizeEvmContractActionSchema, {
		type: "finalizeEvmContract",
		...params
	})), opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/gossipPriorityBid.js
/**
* Bid in a gossip priority Dutch auction to receive prioritized mempool data for an IP.
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/priority-fees
*/ var GossipPriorityBidRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("gossipPriorityBid"),
			/** Auction slot identifier (`0` or `1`). Lower-indexed slots are strictly prioritized over higher ones. */ slotId: /* @__PURE__ */ pipe(UnsignedInteger, /* @__PURE__ */ maxValue(1)),
			/** IP address (IPv4 or IPv6) that should be prioritized. Any address may bid on behalf of any IP. */ ip: /* @__PURE__ */ pipe(/* @__PURE__ */ string(), /* @__PURE__ */ ip()),
			/** Max gas in wei (`1 HYPE = 10^8 wei`) charged from spot balance. Min auction price is `0.1 HYPE`. */ maxGas: UnsignedInteger
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		}),
		/** Expiration time of the action. */ expiresAfter: /* @__PURE__ */ optional(UnsignedInteger)
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var GossipPriorityBidActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object(GossipPriorityBidRequest.entries.action.entries);
})();
/**
* Bid in a gossip priority Dutch auction to receive prioritized mempool data for an IP.
*
* Signing: L1 Action.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { gossipPriorityBid } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await gossipPriorityBid({ transport, wallet }, {
*   slotId: 0,
*   ip: "1.2.3.4",
*   maxGas: 100_000_000, // 1 HYPE
* });
* ```
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/priority-fees
*/ function gossipPriorityBid(config, params, opts) {
	return executeL1Action(config, canonicalize(GossipPriorityBidActionSchema, parse(GossipPriorityBidActionSchema, {
		type: "gossipPriorityBid",
		...params
	})), opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/hip3LiquidatorTransfer.js
/**
* Deposit into or withdraw from the HIP-3 DEX backstop liquidator.
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#deposit-or-withdraw-from-an-hip-3-dexs-backstop-liquidator
*/ var Hip3LiquidatorTransferRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("hip3LiquidatorTransfer"),
			/** Name of the HIP-3 DEX. */ dex: /* @__PURE__ */ string(),
			/** Amount in quote-token 1e-6 units (must be a multiple of 1000 quote tokens, i.e. 1_000_000_000). */ ntl: UnsignedInteger,
			/** `true` for deposit, `false` for withdrawal. */ isDeposit: /* @__PURE__ */ boolean()
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		}),
		/** Expiration time of the action. */ expiresAfter: /* @__PURE__ */ optional(UnsignedInteger)
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var Hip3LiquidatorTransferActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object(Hip3LiquidatorTransferRequest.entries.action.entries);
})();
/**
* Deposit into or withdraw from the HIP-3 DEX backstop liquidator.
*
* Signing: L1 Action.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { hip3LiquidatorTransfer } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await hip3LiquidatorTransfer({ transport, wallet }, {
*   dex: "test",
*   ntl: 1_000_000_000, // 1000 quote tokens (1e-6 units)
*   isDeposit: true,
* });
* ```
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#deposit-or-withdraw-from-an-hip-3-dexs-backstop-liquidator
*/ function hip3LiquidatorTransfer(config, params, opts) {
	return executeL1Action(config, canonicalize(Hip3LiquidatorTransferActionSchema, parse(Hip3LiquidatorTransferActionSchema, {
		type: "hip3LiquidatorTransfer",
		...params
	})), opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/linkStakingUser.js
/**
* Link staking and trading accounts for fee discount attribution.
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees#staking-linking
*/ var LinkStakingUserRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("linkStakingUser"),
			/** Chain ID in hex format for EIP-712 signing. */ signatureChainId: Hex,
			/** Hyperliquid network type. */ hyperliquidChain: /* @__PURE__ */ picklist(["Mainnet", "Testnet"]),
			/**
			* Target account address.
			* - Trading user initiating: enter staking account address.
			* - Staking user finalizing: enter trading account address.
			*/ user: Address,
			/**
			* Link phase.
			* - `false` = trading user initiates link request.
			* - `true` = staking user finalizes permanent link.
			*/ isFinalize: /* @__PURE__ */ boolean(),
			/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		})
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var LinkStakingUserActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ omit(/* @__PURE__ */ object(LinkStakingUserRequest.entries.action.entries), [
		"signatureChainId",
		"hyperliquidChain",
		"nonce"
	]);
})();
/** EIP-712 types for the {@linkcode linkStakingUser} function. */ var LinkStakingUserTypes = { "HyperliquidTransaction:LinkStakingUser": [
	{
		name: "hyperliquidChain",
		type: "string"
	},
	{
		name: "user",
		type: "address"
	},
	{
		name: "isFinalize",
		type: "bool"
	},
	{
		name: "nonce",
		type: "uint64"
	}
] };
/**
* Link staking and trading accounts for fee discount attribution.
*
* Signing: User-Signed EIP-712.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { linkStakingUser } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await linkStakingUser({ transport, wallet }, {
*   user: "0x...",
*   isFinalize: false,
* });
* ```
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees#staking-linking
*/ function linkStakingUser(config, params, opts) {
	return executeUserSignedAction(config, canonicalize(LinkStakingUserActionSchema, parse(LinkStakingUserActionSchema, {
		type: "linkStakingUser",
		...params
	})), LinkStakingUserTypes, opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/modify.js
/**
* Modify an order.
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#modify-an-order
*/ var ModifyRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("modify"),
			/** Order ID or Client Order ID. */ oid: /* @__PURE__ */ union([UnsignedInteger, Cloid]),
			/** New order parameters. */ order: /* @__PURE__ */ object({
				/** Asset ID. */ a: UnsignedInteger,
				/** Position side (`true` for long, `false` for short). */ b: /* @__PURE__ */ boolean(),
				/** Price. */ p: /* @__PURE__ */ pipe(UnsignedDecimal, /* @__PURE__ */ check((input) => Number(input) > 0, "Value must be greater than zero")),
				/** Size (in base currency units). */ s: UnsignedDecimal,
				/** Whether the order is reduce-only. */ r: /* @__PURE__ */ boolean(),
				/** Order type (`limit` for limit orders, `trigger` for stop-loss/take-profit orders). */ t: /* @__PURE__ */ union([/* @__PURE__ */ object({ 
				/** Limit order parameters. */ limit: /* @__PURE__ */ object({ 
				/**
				* Time-in-force.
				* - `"Gtc"`: Remains active until filled or canceled.
				* - `"Ioc"`: Fills immediately or cancels any unfilled portion.
				* - `"Alo"`: Adds liquidity only.
				* - `"FrontendMarket"`: Similar to Ioc, but add a note that this is market order.
				*/ tif: /* @__PURE__ */ picklist([
					"Gtc",
					"Ioc",
					"Alo",
					"FrontendMarket"
				]) }) }), /* @__PURE__ */ object({ 
				/** Trigger order parameters. */ trigger: /* @__PURE__ */ object({
					/** Whether the order is a market order. */ isMarket: /* @__PURE__ */ boolean(),
					/** Trigger price. */ triggerPx: /* @__PURE__ */ pipe(UnsignedDecimal, /* @__PURE__ */ check((input) => Number(input) > 0, "Value must be greater than zero")),
					/** Indicates whether it is take profit or stop loss. */ tpsl: /* @__PURE__ */ picklist(["tp", "sl"])
				}) })]),
				/** Client Order ID. */ c: /* @__PURE__ */ optional(Cloid)
			}),
			/**
			* Always place the resulting order, even if the cancel did not succeed.
			*
			* Omit the field otherwise; the default behavior requires the new order to be a non-trigger order with TIF
			* `Alo`, or a non-executable order with TIF `Gtc`.
			*/ a: /* @__PURE__ */ optional(/* @__PURE__ */ literal(true))
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		}),
		/** Vault address (for vault trading). */ vaultAddress: /* @__PURE__ */ optional(Address),
		/** Expiration time of the action. */ expiresAfter: /* @__PURE__ */ optional(UnsignedInteger)
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var ModifyActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object(ModifyRequest.entries.action.entries);
})();
/**
* Modify an order.
*
* Signing: L1 Action.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { modify } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await modify({ transport, wallet }, {
*   oid: 123,
*   order: {
*     a: 0,
*     b: true,
*     p: "31000",
*     s: "0.2",
*     r: false,
*     t: { limit: { tif: "Gtc" } },
*   },
* });
* ```
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#modify-an-order
*/ function modify(config, params, opts) {
	return executeL1Action(config, canonicalize(ModifyActionSchema, parse(ModifyActionSchema, {
		type: "modify",
		...params
	})), opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/noop.js
/**
* This action does not do anything (no operation), but causes the nonce to be marked as used.
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#invalidate-pending-nonce-noop
*/ var NoopRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({ 
		/** Type of action. */ type: /* @__PURE__ */ literal("noop") }),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		}),
		/** Expiration time of the action. */ expiresAfter: /* @__PURE__ */ optional(UnsignedInteger)
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var NoopActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object(NoopRequest.entries.action.entries);
})();
/**
* This action does not do anything (no operation), but causes the nonce to be marked as used.
*
* Signing: L1 Action.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { noop } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await noop(
*   { transport, wallet },
*   { nonce: 1730000000000 },
* );
* ```
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#invalidate-pending-nonce-noop
*/ function noop(config, params, opts) {
	const action = canonicalize(NoopActionSchema, parse(NoopActionSchema, { type: "noop" }));
	return executeL1Action({
		...config,
		nonceManager: () => params.nonce
	}, action, opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/order.js
/**
* Place an order(s).
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#place-an-order
*/ var OrderRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("order"),
			/** Array of order parameters. */ orders: /* @__PURE__ */ array(/* @__PURE__ */ object({
				/** Asset ID. */ a: UnsignedInteger,
				/** Position side (`true` for long, `false` for short). */ b: /* @__PURE__ */ boolean(),
				/** Price. */ p: /* @__PURE__ */ pipe(UnsignedDecimal, /* @__PURE__ */ check((input) => Number(input) > 0, "Value must be greater than zero")),
				/** Size (in base currency units). */ s: UnsignedDecimal,
				/** Whether the order is reduce-only. */ r: /* @__PURE__ */ boolean(),
				/** Order type (`limit` for limit orders, `trigger` for stop-loss/take-profit orders). */ t: /* @__PURE__ */ union([/* @__PURE__ */ object({ 
				/** Limit order parameters. */ limit: /* @__PURE__ */ object({ 
				/**
				* Time-in-force.
				* - `"Gtc"`: Remains active until filled or canceled.
				* - `"Ioc"`: Fills immediately or cancels any unfilled portion.
				* - `"Alo"`: Adds liquidity only.
				* - `"FrontendMarket"`: Similar to Ioc, but add a note that this is market order.
				*/ tif: /* @__PURE__ */ picklist([
					"Gtc",
					"Ioc",
					"Alo",
					"FrontendMarket"
				]) }) }), /* @__PURE__ */ object({ 
				/** Trigger order parameters. */ trigger: /* @__PURE__ */ object({
					/** Whether the order is a market order. */ isMarket: /* @__PURE__ */ boolean(),
					/** Trigger price. */ triggerPx: /* @__PURE__ */ pipe(UnsignedDecimal, /* @__PURE__ */ check((input) => Number(input) > 0, "Value must be greater than zero")),
					/** Indicates whether it is take profit or stop loss. */ tpsl: /* @__PURE__ */ picklist(["tp", "sl"])
				}) })]),
				/** Client Order ID. */ c: /* @__PURE__ */ optional(Cloid)
			})),
			/**
			* Order grouping strategy:
			* - `"na"`: Standard order without grouping.
			* - `"normalTpsl"`: TP/SL order with fixed size that doesn't adjust with position changes.
			* - `"positionTpsl"`: TP/SL order that adjusts proportionally with the position size.
			* - `{ p: number }`: Order priority rate as a fraction `p / 1e8`.
			*   Only valid when every order is on a non-outcome asset and either every order is IOC
			*   or every order is a non-reduce-only ALO.
			*/ grouping: /* @__PURE__ */ optional(/* @__PURE__ */ union([/* @__PURE__ */ picklist([
				"na",
				"normalTpsl",
				"positionTpsl"
			]), /* @__PURE__ */ object({ 
			/** Priority rate as a fraction `p / 1e8`. */ p: /* @__PURE__ */ pipe(UnsignedInteger, /* @__PURE__ */ maxValue(1e8)) })]), "na"),
			/** Builder fee. */ builder: /* @__PURE__ */ optional(/* @__PURE__ */ object({
				/** Builder address. */ b: Address,
				/** Builder fee in 0.1bps (1 = 0.0001%). Max 100 for perps (0.1%), 1000 for spot (1%). */ f: /* @__PURE__ */ pipe(UnsignedInteger, /* @__PURE__ */ maxValue(1e3))
			}))
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		}),
		/** Vault address (for vault trading). */ vaultAddress: /* @__PURE__ */ optional(Address),
		/** Expiration time of the action. */ expiresAfter: /* @__PURE__ */ optional(UnsignedInteger)
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var OrderActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object(OrderRequest.entries.action.entries);
})();
/**
* Place an order(s).
*
* Signing: L1 Action.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful variant of {@link OrderResponse} without error statuses.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { order } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* const data = await order({ transport, wallet }, {
*   orders: [
*     {
*       a: 0,
*       b: true,
*       p: "30000",
*       s: "0.1",
*       r: false,
*       t: { limit: { tif: "Gtc" } },
*     },
*   ],
*   grouping: "na",
* });
* ```
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#place-an-order
*/ function order(config, params, opts) {
	return executeL1Action(config, canonicalize(OrderActionSchema, parse(OrderActionSchema, {
		type: "order",
		...params
	})), opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/perpDeploy.js
/**
* Deploying HIP-3 assets.
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/hip-3-deployer-actions
*/ var PerpDeployRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ variant("type", [
			/* @__PURE__ */ object({
				/** Type of action. */ type: /* @__PURE__ */ literal("perpDeploy"),
				/** Parameters for registering a new perpetual asset (v2). */ registerAsset2: /* @__PURE__ */ object({
					/** Max gas in native token wei. If not provided, then uses current deploy auction price. */ maxGas: /* @__PURE__ */ nullable(UnsignedInteger),
					/** Contains new asset listing parameters. */ assetRequest: /* @__PURE__ */ object({
						/** Asset symbol for the new asset. */ coin: /* @__PURE__ */ string(),
						/** Number of decimal places for size. */ szDecimals: UnsignedInteger,
						/** Initial oracle price for the asset. */ oraclePx: UnsignedDecimal,
						/** Margin table identifier for risk management. */ marginTableId: UnsignedInteger,
						/** `"strictIsolated"` does not allow withdrawing of isolated margin from open position. */ marginMode: /* @__PURE__ */ picklist([
							"strictIsolated",
							"noCross",
							"normal"
						])
					}),
					/** DEX name. */ dex: /* @__PURE__ */ string(),
					/** Contains new dex parameters. */ schema: /* @__PURE__ */ nullable(/* @__PURE__ */ object({
						/** Full name of the DEX. */ fullName: /* @__PURE__ */ string(),
						/** Collateral token index. */ collateralToken: UnsignedInteger,
						/** User to update oracles. If not provided, then deployer is assumed to be oracle updater. */ oracleUpdater: /* @__PURE__ */ nullable(Address)
					}))
				})
			}),
			/* @__PURE__ */ object({
				/** Type of action. */ type: /* @__PURE__ */ literal("perpDeploy"),
				/** Parameters for registering a new perpetual asset. */ registerAsset: /* @__PURE__ */ object({
					/** Max gas in native token wei. If not provided, then uses current deploy auction price. */ maxGas: /* @__PURE__ */ nullable(UnsignedInteger),
					/** Contains new asset listing parameters. */ assetRequest: /* @__PURE__ */ object({
						/** Asset symbol for the new asset. */ coin: /* @__PURE__ */ string(),
						/** Number of decimal places for size. */ szDecimals: UnsignedInteger,
						/** Initial oracle price for the asset. */ oraclePx: UnsignedDecimal,
						/** Margin table identifier for risk management. */ marginTableId: UnsignedInteger,
						/** Whether the asset can only be traded with isolated margin. */ onlyIsolated: /* @__PURE__ */ boolean()
					}),
					/** DEX name. */ dex: /* @__PURE__ */ string(),
					/** Contains new dex parameters. */ schema: /* @__PURE__ */ nullable(/* @__PURE__ */ object({
						/** Full name of the DEX. */ fullName: /* @__PURE__ */ string(),
						/** Collateral token index. */ collateralToken: UnsignedInteger,
						/** User to update oracles. If not provided, then deployer is assumed to be oracle updater. */ oracleUpdater: /* @__PURE__ */ nullable(Address)
					}))
				})
			}),
			/* @__PURE__ */ object({
				/** Type of action. */ type: /* @__PURE__ */ literal("perpDeploy"),
				/** Parameters for setting oracle and mark prices for assets. */ setOracle: /* @__PURE__ */ object({
					/** DEX name. */ dex: /* @__PURE__ */ string(),
					/** A list (sorted by key) of asset and oracle prices. */ oraclePxs: /* @__PURE__ */ array(/* @__PURE__ */ tuple([/* @__PURE__ */ string(), UnsignedDecimal])),
					/** An outer list of inner lists (inner list sorted by key) of asset and mark prices. */ markPxs: /* @__PURE__ */ array(/* @__PURE__ */ array(/* @__PURE__ */ tuple([/* @__PURE__ */ string(), UnsignedDecimal]))),
					/** A list (sorted by key) of asset and external prices which prevent sudden mark price deviations. */ externalPerpPxs: /* @__PURE__ */ array(/* @__PURE__ */ tuple([/* @__PURE__ */ string(), UnsignedDecimal]))
				})
			}),
			/* @__PURE__ */ object({
				/** Type of action. */ type: /* @__PURE__ */ literal("perpDeploy"),
				/** A list (sorted by key) of asset and funding multiplier. */ setFundingMultipliers: /* @__PURE__ */ array(/* @__PURE__ */ tuple([/* @__PURE__ */ string(), UnsignedDecimal]))
			}),
			/* @__PURE__ */ object({
				/** Type of action. */ type: /* @__PURE__ */ literal("perpDeploy"),
				/** A list (sorted by key) of asset and 8-hour funding interest rate (between -0.01 and 0.01). */ setFundingInterestRates: /* @__PURE__ */ array(/* @__PURE__ */ tuple([/* @__PURE__ */ string(), Decimal$1]))
			}),
			/* @__PURE__ */ object({
				/** Type of action. */ type: /* @__PURE__ */ literal("perpDeploy"),
				/** Parameters for halting or resuming trading for an asset. */ haltTrading: /* @__PURE__ */ object({
					/** Asset symbol for the asset to halt or resume. */ coin: /* @__PURE__ */ string(),
					/** Whether trading should be halted (true) or resumed (false). */ isHalted: /* @__PURE__ */ boolean()
				})
			}),
			/* @__PURE__ */ object({
				/** Type of action. */ type: /* @__PURE__ */ literal("perpDeploy"),
				/** A list (sorted by key) of asset and margin table ids. */ setMarginTableIds: /* @__PURE__ */ array(/* @__PURE__ */ tuple([/* @__PURE__ */ string(), UnsignedInteger]))
			}),
			/* @__PURE__ */ object({
				/** Type of action. */ type: /* @__PURE__ */ literal("perpDeploy"),
				/** Parameters for inserting a margin table into a dex. */ insertMarginTable: /* @__PURE__ */ object({
					/** DEX name. */ dex: /* @__PURE__ */ string(),
					/** Margin table to insert. */ marginTable: /* @__PURE__ */ object({
						/** Description of the margin table. */ description: /* @__PURE__ */ string(),
						/**
						* Margin tiers, sorted by increasing lower bound and decreasing max leverage.
						* A maximum of 3 tiers is allowed.
						*/ marginTiers: /* @__PURE__ */ pipe(/* @__PURE__ */ array(/* @__PURE__ */ object({
							/** Position notional value above which leverage is constrained by `maxLeverage`. */ lowerBound: UnsignedInteger,
							/** Maximum leverage (between `1` and `50`). */ maxLeverage: /* @__PURE__ */ pipe(UnsignedInteger, /* @__PURE__ */ minValue(1), /* @__PURE__ */ maxValue(50))
						})), /* @__PURE__ */ maxLength(3))
					})
				})
			}),
			/* @__PURE__ */ object({
				/** Type of action. */ type: /* @__PURE__ */ literal("perpDeploy"),
				/** Parameters for setting the fee recipient. */ setFeeRecipient: /* @__PURE__ */ object({
					/** DEX name. */ dex: /* @__PURE__ */ string(),
					/** Address of the fee recipient. */ feeRecipient: Address
				})
			}),
			/* @__PURE__ */ object({
				/** Type of action. */ type: /* @__PURE__ */ literal("perpDeploy"),
				/** A list (sorted by key) of asset and open interest cap notionals. */ setOpenInterestCaps: /* @__PURE__ */ array(/* @__PURE__ */ tuple([/* @__PURE__ */ string(), UnsignedInteger]))
			}),
			/* @__PURE__ */ object({
				/** Type of action. */ type: /* @__PURE__ */ literal("perpDeploy"),
				/** A modification to sub-deployer permissions. */ setSubDeployers: /* @__PURE__ */ object({
					/** DEX name. */ dex: /* @__PURE__ */ string(),
					/** A modification to sub-deployer permissions. */ subDeployers: /* @__PURE__ */ array(/* @__PURE__ */ object({
						/** Corresponds to a variant of PerpDeployAction. */ variant: /* @__PURE__ */ string(),
						/** Sub-deployer address. */ user: Address,
						/** Add or remove the subDeployer from the authorized set for the action variant. */ allowed: /* @__PURE__ */ boolean()
					}))
				})
			}),
			/* @__PURE__ */ object({
				/** Type of action. */ type: /* @__PURE__ */ literal("perpDeploy"),
				/** A list (sorted by key) of asset and margin modes. */ setMarginModes: /* @__PURE__ */ array(/* @__PURE__ */ tuple([/* @__PURE__ */ string(), /* @__PURE__ */ picklist(["strictIsolated", "noCross"])]))
			}),
			/* @__PURE__ */ object({
				/** Type of action. */ type: /* @__PURE__ */ literal("perpDeploy"),
				/** Set fee scale. */ setFeeScale: /* @__PURE__ */ object({
					/** DEX name. */ dex: /* @__PURE__ */ string(),
					/** Fee scale (between 0.0 and 3.0). */ scale: UnsignedDecimal
				})
			}),
			/* @__PURE__ */ object({
				/** Type of action. */ type: /* @__PURE__ */ literal("perpDeploy"),
				/** A list (sorted by key) of asset and growth modes. */ setGrowthModes: /* @__PURE__ */ array(/* @__PURE__ */ tuple([/* @__PURE__ */ string(), /* @__PURE__ */ boolean()]))
			}),
			/* @__PURE__ */ object({
				/** Type of action. */ type: /* @__PURE__ */ literal("perpDeploy"),
				/** Parameters for setting a perp annotation. */ setPerpAnnotation: /* @__PURE__ */ object({
					/** Asset symbol for the asset to annotate. */ coin: /* @__PURE__ */ string(),
					/** Classification label (max 15 characters). */ category: /* @__PURE__ */ string(),
					/** Detailed description (max 400 characters). */ description: /* @__PURE__ */ string(),
					/** Display name for frontends to use instead of the L1 name, or null to ignore. */ displayName: /* @__PURE__ */ nullable(/* @__PURE__ */ string()),
					/** Keywords used as hints to match against searches. */ keywords: /* @__PURE__ */ array(/* @__PURE__ */ string())
				})
			}),
			/* @__PURE__ */ object({
				/** Type of action. */ type: /* @__PURE__ */ literal("perpDeploy"),
				/** Name of the perp dex to disable. */ disableDex: /* @__PURE__ */ string()
			})
		]),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		}),
		/** Expiration time of the action. */ expiresAfter: /* @__PURE__ */ optional(UnsignedInteger)
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var PerpDeployActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ variant("type", PerpDeployRequest.entries.action.options);
})();
/**
* Deploying HIP-3 assets.
*
* Signing: L1 Action.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { perpDeploy } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await perpDeploy({ transport, wallet }, {
*   registerAsset: {
*     maxGas: 1000000,
*     assetRequest: {
*       coin: "USDC",
*       szDecimals: 8,
*       oraclePx: "1",
*       marginTableId: 1,
*       onlyIsolated: false,
*     },
*     dex: "test",
*     schema: null,
*   },
* });
* ```
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/hip-3-deployer-actions
*/ function perpDeploy(config, params, opts) {
	return executeL1Action(config, canonicalize(PerpDeployActionSchema, parse(PerpDeployActionSchema, {
		type: "perpDeploy",
		...params
	})), opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/registerReferrer.js
/**
* Create a referral code.
* @see null
*/ var RegisterReferrerRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("registerReferrer"),
			/** Referral code to create. */ code: /* @__PURE__ */ pipe(/* @__PURE__ */ string(), /* @__PURE__ */ minLength(1), /* @__PURE__ */ maxLength(20))
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		}),
		/** Expiration time of the action. */ expiresAfter: /* @__PURE__ */ optional(UnsignedInteger)
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var RegisterReferrerActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object(RegisterReferrerRequest.entries.action.entries);
})();
/**
* Create a referral code.
*
* Signing: L1 Action.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { registerReferrer } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await registerReferrer({ transport, wallet }, {
*   code: "...",
* });
* ```
*
* @see null
*/ function registerReferrer(config, params, opts) {
	return executeL1Action(config, canonicalize(RegisterReferrerActionSchema, parse(RegisterReferrerActionSchema, {
		type: "registerReferrer",
		...params
	})), opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/reserveRequestWeight.js
/**
* Reserve additional rate-limited actions for a fee.
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#reserve-additional-actions
*/ var ReserveRequestWeightRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("reserveRequestWeight"),
			/** Amount of request weight to reserve. */ weight: /* @__PURE__ */ pipe(UnsignedInteger, /* @__PURE__ */ maxValue(0x68db8bac710cb)),
			/** Address of an existing user to reserve the weight for. */ destination: /* @__PURE__ */ optional(Address)
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		}),
		/** Expiration time of the action. */ expiresAfter: /* @__PURE__ */ optional(UnsignedInteger)
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var ReserveRequestWeightActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object(ReserveRequestWeightRequest.entries.action.entries);
})();
/**
* Reserve additional rate-limited actions for a fee.
*
* Signing: L1 Action.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { reserveRequestWeight } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await reserveRequestWeight({ transport, wallet }, {
*   weight: 10,
* });
* ```
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#reserve-additional-actions
*/ function reserveRequestWeight(config, params, opts) {
	return executeL1Action(config, canonicalize(ReserveRequestWeightActionSchema, parse(ReserveRequestWeightActionSchema, {
		type: "reserveRequestWeight",
		...params
	})), opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/scheduleCancel.js
/**
* Schedule a cancel-all operation at a future time.
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#schedule-cancel-dead-mans-switch
*/ var ScheduleCancelRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("scheduleCancel"),
			/**
			* Scheduled time (in ms since epoch).
			* Must be at least 5 seconds in the future.
			*
			* If not specified, will cause all scheduled cancel operations to be deleted.
			*/ time: /* @__PURE__ */ optional(UnsignedInteger)
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		}),
		/** Vault address (for vault trading). */ vaultAddress: /* @__PURE__ */ optional(Address),
		/** Expiration time of the action. */ expiresAfter: /* @__PURE__ */ optional(UnsignedInteger)
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var ScheduleCancelActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object(ScheduleCancelRequest.entries.action.entries);
})();
function scheduleCancel(config, paramsOrOpts, maybeOpts) {
	const isFirstArgParams = paramsOrOpts && "time" in paramsOrOpts;
	const params = isFirstArgParams ? paramsOrOpts : {};
	const opts = isFirstArgParams ? maybeOpts : paramsOrOpts;
	return executeL1Action(config, canonicalize(ScheduleCancelActionSchema, parse(ScheduleCancelActionSchema, {
		type: "scheduleCancel",
		...params
	})), opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/sendAsset.js
/**
* Transfer tokens between different perp DEXs, spot balance, users, and/or sub-accounts.
*
* Like {@link agentSendAsset} but signed via EIP-712 by the principal (instead of as an L1 action by the agent wallet).
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#send-asset
*/ var SendAssetRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("sendAsset"),
			/** Chain ID in hex format for EIP-712 signing. */ signatureChainId: Hex,
			/** Hyperliquid network type. */ hyperliquidChain: /* @__PURE__ */ picklist(["Mainnet", "Testnet"]),
			/** Destination address. */ destination: Address,
			/** Source DEX ("" for default USDC perp DEX, "spot" for spot). */ sourceDex: /* @__PURE__ */ string(),
			/** Destination DEX ("" for default USDC perp DEX, "spot" for spot). */ destinationDex: /* @__PURE__ */ string(),
			/** Token identifier. */ token: /* @__PURE__ */ string(),
			/** Amount to send (not in wei). */ amount: UnsignedDecimal,
			/** Source sub-account address ("" for main account). */ fromSubAccount: /* @__PURE__ */ optional(/* @__PURE__ */ union([/* @__PURE__ */ literal(""), Address]), ""),
			/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		})
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var SendAssetActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ omit(/* @__PURE__ */ object(SendAssetRequest.entries.action.entries), [
		"signatureChainId",
		"hyperliquidChain",
		"nonce"
	]);
})();
/** EIP-712 types for the {@linkcode sendAsset} function. */ var SendAssetTypes = { "HyperliquidTransaction:SendAsset": [
	{
		name: "hyperliquidChain",
		type: "string"
	},
	{
		name: "destination",
		type: "string"
	},
	{
		name: "sourceDex",
		type: "string"
	},
	{
		name: "destinationDex",
		type: "string"
	},
	{
		name: "token",
		type: "string"
	},
	{
		name: "amount",
		type: "string"
	},
	{
		name: "fromSubAccount",
		type: "string"
	},
	{
		name: "nonce",
		type: "uint64"
	}
] };
/**
* Transfer tokens between different perp DEXs, spot balance, users, and/or sub-accounts.
*
* Like {@link agentSendAsset} but signed via EIP-712 by the principal (instead of as an L1 action by the agent wallet).
*
* Signing: User-Signed EIP-712.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { sendAsset } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await sendAsset({ transport, wallet }, {
*   destination: "0x0000000000000000000000000000000000000001",
*   sourceDex: "",
*   destinationDex: "test",
*   token: "USDC:0xeb62eee3685fc4c43992febcd9e75443",
*   amount: "1",
* });
* ```
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#send-asset
*/ function sendAsset(config, params, opts) {
	return executeUserSignedAction(config, canonicalize(SendAssetActionSchema, parse(SendAssetActionSchema, {
		type: "sendAsset",
		...params
	})), SendAssetTypes, opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/sendToEvmWithData.js
/**
* Transfer tokens from Core to EVM with an additional data payload for `ICoreReceiveWithData` contracts.
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#send-to-evm-with-data
*/ var SendToEvmWithDataRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("sendToEvmWithData"),
			/** Chain ID in hex format for EIP-712 signing. */ signatureChainId: Hex,
			/** Hyperliquid network type. */ hyperliquidChain: /* @__PURE__ */ picklist(["Mainnet", "Testnet"]),
			/** Token identifier (e.g., "USDC"). */ token: /* @__PURE__ */ string(),
			/** Amount to send (not in wei). */ amount: UnsignedDecimal,
			/** Source DEX name to transfer from. */ sourceDex: /* @__PURE__ */ string(),
			/** Recipient address in the specified encoding format. */ destinationRecipient: /* @__PURE__ */ string(),
			/** Address encoding format. */ addressEncoding: /* @__PURE__ */ picklist(["hex", "base58"]),
			/** Target blockchain chain ID. */ destinationChainId: UnsignedInteger,
			/** Gas limit for execution on the destination chain. */ gasLimit: UnsignedInteger,
			/** Additional data payload (hex-encoded bytes, "0x" for empty). */ data: /* @__PURE__ */ pipe(/* @__PURE__ */ string(), /* @__PURE__ */ regex(/^0[xX]([0-9a-fA-F]+)?$/)),
			/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		})
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var SendToEvmWithDataActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ omit(/* @__PURE__ */ object(SendToEvmWithDataRequest.entries.action.entries), [
		"signatureChainId",
		"hyperliquidChain",
		"nonce"
	]);
})();
/** EIP-712 types for the {@linkcode sendToEvmWithData} function. */ var SendToEvmWithDataTypes = { "HyperliquidTransaction:SendToEvmWithData": [
	{
		name: "hyperliquidChain",
		type: "string"
	},
	{
		name: "token",
		type: "string"
	},
	{
		name: "amount",
		type: "string"
	},
	{
		name: "sourceDex",
		type: "string"
	},
	{
		name: "destinationRecipient",
		type: "string"
	},
	{
		name: "addressEncoding",
		type: "string"
	},
	{
		name: "destinationChainId",
		type: "uint32"
	},
	{
		name: "gasLimit",
		type: "uint64"
	},
	{
		name: "data",
		type: "bytes"
	},
	{
		name: "nonce",
		type: "uint64"
	}
] };
/**
* Transfer tokens from Core to EVM with an additional data payload for `ICoreReceiveWithData` contracts.
*
* Signing: User-Signed EIP-712.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { sendToEvmWithData } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await sendToEvmWithData({ transport, wallet }, {
*   token: "USDC",
*   amount: "1",
*   sourceDex: "spot",
*   destinationRecipient: "0x...",
*   addressEncoding: "hex",
*   destinationChainId: 42161,
*   gasLimit: 200000,
*   data: "0x",
* });
* ```
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#send-to-evm-with-data
*/ function sendToEvmWithData(config, params, opts) {
	return executeUserSignedAction(config, canonicalize(SendToEvmWithDataActionSchema, parse(SendToEvmWithDataActionSchema, {
		type: "sendToEvmWithData",
		...params
	})), SendToEvmWithDataTypes, opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/setDisplayName.js
/**
* Set the display name in the leaderboard.
* @see null
*/ var SetDisplayNameRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("setDisplayName"),
			/**
			* Display name.
			* Set to an empty string to remove the display name.
			*/ displayName: /* @__PURE__ */ pipe(/* @__PURE__ */ string(), /* @__PURE__ */ maxLength(20))
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		}),
		/** Expiration time of the action. */ expiresAfter: /* @__PURE__ */ optional(UnsignedInteger)
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var SetDisplayNameActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object(SetDisplayNameRequest.entries.action.entries);
})();
/**
* Set the display name in the leaderboard.
*
* Signing: L1 Action.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { setDisplayName } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await setDisplayName({ transport, wallet }, {
*   displayName: "...",
* });
* ```
*
* @see null
*/ function setDisplayName(config, params, opts) {
	return executeL1Action(config, canonicalize(SetDisplayNameActionSchema, parse(SetDisplayNameActionSchema, {
		type: "setDisplayName",
		...params
	})), opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/setReferrer.js
/**
* Set a referral code.
* @see null
*/ var SetReferrerRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("setReferrer"),
			/** Referral code. */ code: /* @__PURE__ */ pipe(/* @__PURE__ */ string(), /* @__PURE__ */ minLength(1), /* @__PURE__ */ maxLength(20))
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		}),
		/** Expiration time of the action. */ expiresAfter: /* @__PURE__ */ optional(UnsignedInteger)
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var SetReferrerActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object(SetReferrerRequest.entries.action.entries);
})();
/**
* Set a referral code.
*
* Signing: L1 Action.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { setReferrer } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await setReferrer({ transport, wallet }, {
*   code: "...",
* });
* ```
*
* @see null
*/ function setReferrer(config, params, opts) {
	return executeL1Action(config, canonicalize(SetReferrerActionSchema, parse(SetReferrerActionSchema, {
		type: "setReferrer",
		...params
	})), opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/spotDeploy.js
/**
* Deploying HIP-1 and HIP-2 assets.
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/deploying-hip-1-and-hip-2-assets
*/ var SpotDeployRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ variant("type", [
			/* @__PURE__ */ object({
				/** Type of action. */ type: /* @__PURE__ */ literal("spotDeploy"),
				/** Register token parameters. */ registerToken2: /* @__PURE__ */ object({
					/** Token specifications. */ spec: /* @__PURE__ */ object({
						/** Token name. */ name: /* @__PURE__ */ string(),
						/** Number of decimals for token size. */ szDecimals: UnsignedInteger,
						/** Number of decimals for token amounts in wei. */ weiDecimals: UnsignedInteger
					}),
					/** Maximum gas allowed for registration. */ maxGas: UnsignedInteger,
					/** Optional full token name. */ fullName: /* @__PURE__ */ optional(/* @__PURE__ */ string())
				})
			}),
			/* @__PURE__ */ object({
				/** Type of action. */ type: /* @__PURE__ */ literal("spotDeploy"),
				/** User genesis parameters. */ userGenesis: /* @__PURE__ */ object({
					/** Token identifier. */ token: UnsignedInteger,
					/** Array of tuples: [user address, genesis amount in wei]. */ userAndWei: /* @__PURE__ */ array(/* @__PURE__ */ tuple([Address, UnsignedDecimal])),
					/** Array of tuples: [existing token identifier, genesis amount in wei]. */ existingTokenAndWei: /* @__PURE__ */ array(/* @__PURE__ */ tuple([UnsignedInteger, UnsignedDecimal])),
					/** Array of tuples: [user address, blacklist status] (`true` for blacklist, `false` to remove existing blacklisted user). */ blacklistUsers: /* @__PURE__ */ optional(/* @__PURE__ */ array(/* @__PURE__ */ tuple([Address, /* @__PURE__ */ boolean()])))
				})
			}),
			/* @__PURE__ */ object({
				/** Type of action. */ type: /* @__PURE__ */ literal("spotDeploy"),
				/** Genesis parameters. */ genesis: /* @__PURE__ */ object({
					/** Token identifier. */ token: UnsignedInteger,
					/** Maximum token supply. */ maxSupply: UnsignedDecimal,
					/** Set hyperliquidity balance to 0. */ noHyperliquidity: /* @__PURE__ */ optional(/* @__PURE__ */ literal(true))
				})
			}),
			/* @__PURE__ */ object({
				/** Type of action. */ type: /* @__PURE__ */ literal("spotDeploy"),
				/** Register spot parameters. */ registerSpot: /* @__PURE__ */ object({ 
				/** Tuple containing base and quote token indices. */ tokens: /* @__PURE__ */ tuple([UnsignedInteger, UnsignedInteger]) })
			}),
			/* @__PURE__ */ object({
				/** Type of action. */ type: /* @__PURE__ */ literal("spotDeploy"),
				/** Register hyperliquidity parameters. */ registerHyperliquidity: /* @__PURE__ */ object({
					/** Spot index (distinct from base token index). */ spot: UnsignedInteger,
					/** Starting price for liquidity seeding. */ startPx: UnsignedDecimal,
					/** Order size as a float (not in wei). */ orderSz: UnsignedDecimal,
					/** Total number of orders to place. */ nOrders: UnsignedInteger,
					/** Number of levels to seed with USDC. */ nSeededLevels: /* @__PURE__ */ optional(UnsignedInteger)
				})
			}),
			/* @__PURE__ */ object({
				/** Type of action. */ type: /* @__PURE__ */ literal("spotDeploy"),
				/** Set deployer trading fee share parameters. */ setDeployerTradingFeeShare: /* @__PURE__ */ object({
					/** Token identifier. */ token: UnsignedInteger,
					/** The deployer trading fee share. Range is 0% to 100%. */ share: Percent
				})
			}),
			/* @__PURE__ */ object({
				/** Type of action. */ type: /* @__PURE__ */ literal("spotDeploy"),
				/** Enable quote token parameters. */ enableQuoteToken: /* @__PURE__ */ object({ 
				/** The token ID to convert to a quote token. */ token: UnsignedInteger })
			}),
			/* @__PURE__ */ object({
				/** Type of action. */ type: /* @__PURE__ */ literal("spotDeploy"),
				/** Disable quote token parameters. */ disableQuoteToken: /* @__PURE__ */ object({ 
				/** Token identifier to disable as quote token. */ token: UnsignedInteger })
			}),
			/* @__PURE__ */ object({
				/** Type of action. */ type: /* @__PURE__ */ literal("spotDeploy"),
				/**
				* Request link of a HyperCore spot token to an ERC-20 contract on the HyperEVM.
				* Must be sent by the spot deployer. The link is finalized by the EVM deployer via {@link finalizeEvmContract}.
				* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/hyperevm/hypercore-less-than-greater-than-hyperevm-transfers
				*/ requestEvmContract: /* @__PURE__ */ object({
					/** Token identifier to link. */ token: UnsignedInteger,
					/** ERC-20 contract address on the HyperEVM. */ address: Address,
					/**
					* Difference in wei decimals between Core and EVM spot.
					* E.g. Core PURR has 5 weiDecimals but EVM PURR has 18, so this would be `13`.
					* Range: `[-2, 18]` inclusive.
					*/ evmExtraWeiDecimals: /* @__PURE__ */ pipe(Integer, /* @__PURE__ */ minValue(-2), /* @__PURE__ */ maxValue(18))
				})
			}),
			/* @__PURE__ */ object({
				/** Type of action. */ type: /* @__PURE__ */ literal("spotDeploy"),
				/**
				* Outcome deployer parameters.
				* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/hip-4-deployer-actions
				*/ outcome: /* @__PURE__ */ union([
					/* @__PURE__ */ object({ 
					/** Deploy a standalone Yes/No market from a standalone outcome template. */ registerStandaloneOutcomeFromTemplate: /* @__PURE__ */ object({
						/** Template identifier. */ id: /* @__PURE__ */ string(),
						/** A list (sorted by key) of template keyword and value. */ keywordToValue: /* @__PURE__ */ array(/* @__PURE__ */ tuple([/* @__PURE__ */ string(), /* @__PURE__ */ string()]))
					}) }),
					/* @__PURE__ */ object({ 
					/** Deploy a question and its named outcomes. */ registerQuestionFromTemplate: /* @__PURE__ */ object({
						/** Instantiation of the question template. */ questionTemplateInstance: /* @__PURE__ */ object({
							/** Template identifier. */ id: /* @__PURE__ */ string(),
							/** A list (sorted by key) of template keyword and value. */ keywordToValue: /* @__PURE__ */ array(/* @__PURE__ */ tuple([/* @__PURE__ */ string(), /* @__PURE__ */ string()]))
						}),
						/** Instantiations of the named outcome templates (at most 100). */ namedOutcomeTemplateInstances: /* @__PURE__ */ array(/* @__PURE__ */ object({
							/** Template identifier. */ id: /* @__PURE__ */ string(),
							/** A list (sorted by key) of template keyword and value. */ keywordToValue: /* @__PURE__ */ array(/* @__PURE__ */ tuple([/* @__PURE__ */ string(), /* @__PURE__ */ string()]))
						}))
					}) }),
					/* @__PURE__ */ object({ 
					/** Settle one outcome of the deployer. */ settleOutcome: /* @__PURE__ */ object({
						/** Outcome identifier. */ outcome: UnsignedInteger,
						/** Payout fraction of the Yes side (between 0 and 1). */ settleFraction: UnsignedDecimal,
						/** Settlement details. Must be empty. */ details: /* @__PURE__ */ string(),
						/** Name and description of the outcome being settled. */ nameAndDescription: /* @__PURE__ */ tuple([/* @__PURE__ */ string(), /* @__PURE__ */ string()]),
						/** Names of the Yes and No sides of the outcome being settled. */ sideNames: /* @__PURE__ */ tuple([/* @__PURE__ */ string(), /* @__PURE__ */ string()])
					}) }),
					/* @__PURE__ */ object({ 
					/** Settle all remaining named outcomes of a question. */ settleQuestion2: /* @__PURE__ */ object({
						/** Question identifier. */ question: UnsignedInteger,
						/** Settlement of each remaining active named outcome. */ outcomeSettlements: /* @__PURE__ */ array(/* @__PURE__ */ object({
							/** Outcome identifier. */ outcome: UnsignedInteger,
							/** Payout fraction of the Yes side (between 0 and 1). */ settleFraction: UnsignedDecimal,
							/** Settlement details. Must be empty. */ details: /* @__PURE__ */ string(),
							/** Name and description of the outcome being settled. */ nameAndDescription: /* @__PURE__ */ tuple([/* @__PURE__ */ string(), /* @__PURE__ */ string()]),
							/** Names of the Yes and No sides of the outcome being settled. */ sideNames: /* @__PURE__ */ tuple([/* @__PURE__ */ string(), /* @__PURE__ */ string()])
						})),
						/** Name and description of the question being settled. */ nameAndDescription: /* @__PURE__ */ tuple([/* @__PURE__ */ string(), /* @__PURE__ */ string()])
					}) })
				])
			})
		]),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		}),
		/** Expiration time of the action. */ expiresAfter: /* @__PURE__ */ optional(UnsignedInteger)
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var SpotDeployActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ variant("type", SpotDeployRequest.entries.action.options);
})();
/**
* Deploying HIP-1 and HIP-2 assets.
*
* Signing: L1 Action.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { spotDeploy } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await spotDeploy({ transport, wallet }, {
*   registerToken2: {
*     spec: {
*       name: "USDC",
*       szDecimals: 8,
*       weiDecimals: 8,
*     },
*     maxGas: 1000000,
*     fullName: "USD Coin",
*   },
* });
* ```
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/deploying-hip-1-and-hip-2-assets
*/ function spotDeploy(config, params, opts) {
	return executeL1Action(config, canonicalize(SpotDeployActionSchema, parse(SpotDeployActionSchema, {
		type: "spotDeploy",
		...params
	})), opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/spotSend.js
/**
* Send spot assets to another address.
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#core-spot-transfer
*/ var SpotSendRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("spotSend"),
			/** Chain ID in hex format for EIP-712 signing. */ signatureChainId: Hex,
			/** Hyperliquid network type. */ hyperliquidChain: /* @__PURE__ */ picklist(["Mainnet", "Testnet"]),
			/** Destination address. */ destination: Address,
			/** Token identifier. */ token: /* @__PURE__ */ string(),
			/** Amount to send (not in wei). */ amount: UnsignedDecimal,
			/** Nonce (timestamp in ms) used to prevent replay attacks. */ time: UnsignedInteger
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		})
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var SpotSendActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ omit(/* @__PURE__ */ object(SpotSendRequest.entries.action.entries), [
		"signatureChainId",
		"hyperliquidChain",
		"time"
	]);
})();
/** EIP-712 types for the {@linkcode spotSend} function. */ var SpotSendTypes = { "HyperliquidTransaction:SpotSend": [
	{
		name: "hyperliquidChain",
		type: "string"
	},
	{
		name: "destination",
		type: "string"
	},
	{
		name: "token",
		type: "string"
	},
	{
		name: "amount",
		type: "string"
	},
	{
		name: "time",
		type: "uint64"
	}
] };
/**
* Send spot assets to another address.
*
* Signing: User-Signed EIP-712.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { spotSend } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await spotSend({ transport, wallet }, {
*   destination: "0x...",
*   token: "USDC:0xeb62eee3685fc4c43992febcd9e75443",
*   amount: "1",
* });
* ```
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#core-spot-transfer
*/ function spotSend(config, params, opts) {
	return executeUserSignedAction(config, canonicalize(SpotSendActionSchema, parse(SpotSendActionSchema, {
		type: "spotSend",
		...params
	})), SpotSendTypes, opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/spotUser.js
/**
* Opt out of spot dusting.
* @see null
*/ var SpotUserRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("spotUser"),
			/** Spot dusting options. */ toggleSpotDusting: /* @__PURE__ */ object({ 
			/** Opt out of spot dusting. */ optOut: /* @__PURE__ */ boolean() })
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		}),
		/** Expiration time of the action. */ expiresAfter: /* @__PURE__ */ optional(UnsignedInteger)
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var SpotUserActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object(SpotUserRequest.entries.action.entries);
})();
/**
* Opt out of spot dusting.
*
* Signing: L1 Action.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { spotUser } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await spotUser({ transport, wallet }, {
*   toggleSpotDusting: { optOut: false },
* });
* ```
*
* @see null
*/ function spotUser(config, params, opts) {
	return executeL1Action(config, canonicalize(SpotUserActionSchema, parse(SpotUserActionSchema, {
		type: "spotUser",
		...params
	})), opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/stakingLinkDisableTradingUser.js
/**
* Permanently disable a linked trading user, locking its funds.
* Sent by the staking user. After 1 year of locking, funds from the trading user are automatically
* transferred to the staking user. **This action is irreversible.**
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees#staking-linking
*/ var StakingLinkDisableTradingUserRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("stakingLinkDisableTradingUser"),
			/** Chain ID in hex format for EIP-712 signing. */ signatureChainId: Hex,
			/** Hyperliquid network type. */ hyperliquidChain: /* @__PURE__ */ picklist(["Mainnet", "Testnet"]),
			/** Trading user address to disable. */ tradingUser: Address,
			/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		})
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var StakingLinkDisableTradingUserActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ omit(/* @__PURE__ */ object(StakingLinkDisableTradingUserRequest.entries.action.entries), [
		"signatureChainId",
		"hyperliquidChain",
		"nonce"
	]);
})();
/** EIP-712 types for the {@linkcode stakingLinkDisableTradingUser} function. */ var StakingLinkDisableTradingUserTypes = { "HyperliquidTransaction:StakingLinkDisableTradingUser": [
	{
		name: "hyperliquidChain",
		type: "string"
	},
	{
		name: "tradingUser",
		type: "address"
	},
	{
		name: "nonce",
		type: "uint64"
	}
] };
/**
* Permanently disable a linked trading user, locking its funds.
* Sent by the staking user. After 1 year of locking, funds from the trading user are automatically
* transferred to the staking user. **This action is irreversible.**
*
* Signing: User-Signed EIP-712.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { stakingLinkDisableTradingUser } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await stakingLinkDisableTradingUser({ transport, wallet }, {
*   tradingUser: "0x...",
* });
* ```
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees#staking-linking
*/ function stakingLinkDisableTradingUser(config, params, opts) {
	return executeUserSignedAction(config, canonicalize(StakingLinkDisableTradingUserActionSchema, parse(StakingLinkDisableTradingUserActionSchema, {
		type: "stakingLinkDisableTradingUser",
		...params
	})), StakingLinkDisableTradingUserTypes, opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/subAccountModify.js
/**
* Modify a sub-account.
* @see null
*/ var SubAccountModifyRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("subAccountModify"),
			/** Sub-account address to modify. */ subAccountUser: Address,
			/** New sub-account name. */ name: /* @__PURE__ */ pipe(/* @__PURE__ */ string(), /* @__PURE__ */ minLength(1), /* @__PURE__ */ maxLength(16))
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		}),
		/** Expiration time of the action. */ expiresAfter: /* @__PURE__ */ optional(UnsignedInteger)
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var SubAccountModifyActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object(SubAccountModifyRequest.entries.action.entries);
})();
/**
* Modify a sub-account.
*
* Signing: L1 Action.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { subAccountModify } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await subAccountModify({ transport, wallet }, {
*   subAccountUser: "0x...",
*   name: "...",
* });
* ```
*
* @see null
*/ function subAccountModify(config, params, opts) {
	return executeL1Action(config, canonicalize(SubAccountModifyActionSchema, parse(SubAccountModifyActionSchema, {
		type: "subAccountModify",
		...params
	})), opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/subAccountSpotTransfer.js
/**
* Transfer between sub-accounts (spot).
* @see null
*/ var SubAccountSpotTransferRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("subAccountSpotTransfer"),
			/** Sub-account address. */ subAccountUser: Address,
			/** `true` for deposit, `false` for withdrawal. */ isDeposit: /* @__PURE__ */ boolean(),
			/** Token identifier. */ token: /* @__PURE__ */ string(),
			/** Amount to send (not in wei). */ amount: UnsignedDecimal
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		}),
		/** Expiration time of the action. */ expiresAfter: /* @__PURE__ */ optional(UnsignedInteger)
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var SubAccountSpotTransferActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object(SubAccountSpotTransferRequest.entries.action.entries);
})();
/**
* Transfer between sub-accounts (spot).
*
* Signing: L1 Action.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { subAccountSpotTransfer } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await subAccountSpotTransfer({ transport, wallet }, {
*   subAccountUser: "0x...",
*   isDeposit: true,
*   token: "USDC:0xeb62eee3685fc4c43992febcd9e75443",
*   amount: "1",
* });
* ```
*
* @see null
*/ function subAccountSpotTransfer(config, params, opts) {
	return executeL1Action(config, canonicalize(SubAccountSpotTransferActionSchema, parse(SubAccountSpotTransferActionSchema, {
		type: "subAccountSpotTransfer",
		...params
	})), opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/subAccountTransfer.js
/**
* Transfer between sub-accounts (perpetual).
* @see null
*/ var SubAccountTransferRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("subAccountTransfer"),
			/** Sub-account address. */ subAccountUser: Address,
			/** `true` for deposit, `false` for withdrawal. */ isDeposit: /* @__PURE__ */ boolean(),
			/** Amount to transfer (float * 1e6). */ usd: /* @__PURE__ */ pipe(UnsignedInteger, /* @__PURE__ */ minValue(1))
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		}),
		/** Expiration time of the action. */ expiresAfter: /* @__PURE__ */ optional(UnsignedInteger)
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var SubAccountTransferActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object(SubAccountTransferRequest.entries.action.entries);
})();
/**
* Transfer between sub-accounts (perpetual).
*
* Signing: L1 Action.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { subAccountTransfer } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await subAccountTransfer({ transport, wallet }, {
*   subAccountUser: "0x...",
*   isDeposit: true,
*   usd: 1 * 1e6,
* });
* ```
*
* @see null
*/ function subAccountTransfer(config, params, opts) {
	return executeL1Action(config, canonicalize(SubAccountTransferActionSchema, parse(SubAccountTransferActionSchema, {
		type: "subAccountTransfer",
		...params
	})), opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/tokenDelegate.js
/**
* Delegate or undelegate native tokens to or from a validator.
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#delegate-or-undelegate-stake-from-validator
*/ var TokenDelegateRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("tokenDelegate"),
			/** Chain ID in hex format for EIP-712 signing. */ signatureChainId: Hex,
			/** Hyperliquid network type. */ hyperliquidChain: /* @__PURE__ */ picklist(["Mainnet", "Testnet"]),
			/** Validator address. */ validator: Address,
			/** Amount for delegate/undelegate (float * 1e8). */ wei: /* @__PURE__ */ pipe(UnsignedInteger, /* @__PURE__ */ minValue(1)),
			/** `true` for undelegate, `false` for delegate. */ isUndelegate: /* @__PURE__ */ boolean(),
			/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		})
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var TokenDelegateActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ omit(/* @__PURE__ */ object(TokenDelegateRequest.entries.action.entries), [
		"signatureChainId",
		"hyperliquidChain",
		"nonce"
	]);
})();
/** EIP-712 types for the {@linkcode tokenDelegate} function. */ var TokenDelegateTypes = { "HyperliquidTransaction:TokenDelegate": [
	{
		name: "hyperliquidChain",
		type: "string"
	},
	{
		name: "validator",
		type: "address"
	},
	{
		name: "wei",
		type: "uint64"
	},
	{
		name: "isUndelegate",
		type: "bool"
	},
	{
		name: "nonce",
		type: "uint64"
	}
] };
/**
* Delegate or undelegate native tokens to or from a validator.
*
* Signing: User-Signed EIP-712.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { tokenDelegate } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await tokenDelegate({ transport, wallet }, {
*   validator: "0x...",
*   isUndelegate: true,
*   wei: 1 * 1e8,
* });
* ```
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#delegate-or-undelegate-stake-from-validator
*/ function tokenDelegate(config, params, opts) {
	return executeUserSignedAction(config, canonicalize(TokenDelegateActionSchema, parse(TokenDelegateActionSchema, {
		type: "tokenDelegate",
		...params
	})), TokenDelegateTypes, opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/topUpIsolatedOnlyMargin.js
/**
* Top up isolated margin by targeting a specific leverage.
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#update-isolated-margin
*/ var TopUpIsolatedOnlyMarginRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("topUpIsolatedOnlyMargin"),
			/** Asset ID. */ asset: UnsignedInteger,
			/** Target leverage (float string). */ leverage: UnsignedDecimal
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		}),
		/** Vault address (for vault trading). */ vaultAddress: /* @__PURE__ */ optional(Address),
		/** Expiration time of the action. */ expiresAfter: /* @__PURE__ */ optional(UnsignedInteger)
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var TopUpIsolatedOnlyMarginActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object(TopUpIsolatedOnlyMarginRequest.entries.action.entries);
})();
/**
* Top up isolated margin by targeting a specific leverage.
*
* Signing: L1 Action.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { topUpIsolatedOnlyMargin } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await topUpIsolatedOnlyMargin({ transport, wallet }, {
*   asset: 0,
*   leverage: "0.5",
* });
* ```
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#update-isolated-margin
*/ function topUpIsolatedOnlyMargin(config, params, opts) {
	return executeL1Action(config, canonicalize(TopUpIsolatedOnlyMarginActionSchema, parse(TopUpIsolatedOnlyMarginActionSchema, {
		type: "topUpIsolatedOnlyMargin",
		...params
	})), opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/twapCancel.js
/**
* Cancel a TWAP order.
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#cancel-a-twap-order
*/ var TwapCancelRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("twapCancel"),
			/** Asset ID. */ a: UnsignedInteger,
			/** Twap ID. */ t: UnsignedInteger
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		}),
		/** Vault address (for vault trading). */ vaultAddress: /* @__PURE__ */ optional(Address),
		/** Expiration time of the action. */ expiresAfter: /* @__PURE__ */ optional(UnsignedInteger)
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var TwapCancelActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object(TwapCancelRequest.entries.action.entries);
})();
/**
* Cancel a TWAP order.
*
* Signing: L1 Action.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful variant of {@link TwapCancelResponse} without error status.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { twapCancel } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await twapCancel({ transport, wallet }, {
*   a: 0,
*   t: 1,
* });
* ```
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#cancel-a-twap-order
*/ function twapCancel(config, params, opts) {
	return executeL1Action(config, canonicalize(TwapCancelActionSchema, parse(TwapCancelActionSchema, {
		type: "twapCancel",
		...params
	})), opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/twapOrder.js
/**
* Place a TWAP order.
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#place-a-twap-order
*/ var TwapOrderRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("twapOrder"),
			/** Twap parameters. */ twap: /* @__PURE__ */ object({
				/** Asset ID. */ a: UnsignedInteger,
				/** Position side (`true` for long, `false` for short). */ b: /* @__PURE__ */ boolean(),
				/** Size (in base currency units). */ s: UnsignedDecimal,
				/** Whether the order is reduce-only. */ r: /* @__PURE__ */ boolean(),
				/** TWAP duration in minutes. */ m: /* @__PURE__ */ pipe(UnsignedInteger, /* @__PURE__ */ minValue(5), /* @__PURE__ */ maxValue(1440)),
				/** Enable random order timing. */ t: /* @__PURE__ */ boolean()
			}),
			/** Trigger and stop prices. */ details: /* @__PURE__ */ optional(/* @__PURE__ */ object({
				/** Condition that activates the order. */ t: /* @__PURE__ */ nullable(/* @__PURE__ */ object({
					/** Trigger price. */ p: UnsignedDecimal,
					/** Activate when the mark price is above (`true`) or below (`false`) the trigger price. */ a: /* @__PURE__ */ boolean()
				})),
				/** Price at which the order is terminated. */ s: /* @__PURE__ */ nullable(UnsignedDecimal)
			}))
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		}),
		/** Vault address (for vault trading). */ vaultAddress: /* @__PURE__ */ optional(Address),
		/** Expiration time of the action. */ expiresAfter: /* @__PURE__ */ optional(UnsignedInteger)
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var TwapOrderActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object(TwapOrderRequest.entries.action.entries);
})();
/**
* Place a TWAP order.
*
* Signing: L1 Action.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful variant of {@link TwapOrderResponse} without error status.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { twapOrder } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* const data = await twapOrder({ transport, wallet }, {
*   twap: {
*     a: 0,
*     b: true,
*     s: "1",
*     r: false,
*     m: 10,
*     t: true,
*   },
* });
* ```
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#place-a-twap-order
*/ function twapOrder(config, params, opts) {
	return executeL1Action(config, canonicalize(TwapOrderActionSchema, parse(TwapOrderActionSchema, {
		type: "twapOrder",
		...params
	})), opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/updateIsolatedMargin.js
/**
* Add or remove margin from isolated position.
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#update-isolated-margin
*/ var UpdateIsolatedMarginRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("updateIsolatedMargin"),
			/** Asset ID. */ asset: UnsignedInteger,
			/** Position side (`true` for long, `false` for short). */ isBuy: /* @__PURE__ */ boolean(),
			/** Amount to adjust (float * 1e6). */ ntli: Integer
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		}),
		/** Vault address (for vault trading). */ vaultAddress: /* @__PURE__ */ optional(Address),
		/** Expiration time of the action. */ expiresAfter: /* @__PURE__ */ optional(UnsignedInteger)
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var UpdateIsolatedMarginActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object(UpdateIsolatedMarginRequest.entries.action.entries);
})();
/**
* Add or remove margin from isolated position.
*
* Signing: L1 Action.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { updateIsolatedMargin } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await updateIsolatedMargin({ transport, wallet }, {
*   asset: 0,
*   isBuy: true,
*   ntli: 1 * 1e6,
* });
* ```
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#update-isolated-margin
*/ function updateIsolatedMargin(config, params, opts) {
	return executeL1Action(config, canonicalize(UpdateIsolatedMarginActionSchema, parse(UpdateIsolatedMarginActionSchema, {
		type: "updateIsolatedMargin",
		...params
	})), opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/updateLeverage.js
/**
* Update cross or isolated leverage on a coin.
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#update-leverage
*/ var UpdateLeverageRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("updateLeverage"),
			/** Asset ID. */ asset: UnsignedInteger,
			/** `true` for cross leverage, `false` for isolated leverage. */ isCross: /* @__PURE__ */ boolean(),
			/** New leverage value. */ leverage: /* @__PURE__ */ pipe(UnsignedInteger, /* @__PURE__ */ minValue(1))
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		}),
		/** Vault address (for vault trading). */ vaultAddress: /* @__PURE__ */ optional(Address),
		/** Expiration time of the action. */ expiresAfter: /* @__PURE__ */ optional(UnsignedInteger)
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var UpdateLeverageActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object(UpdateLeverageRequest.entries.action.entries);
})();
/**
* Update cross or isolated leverage on a coin.
*
* Signing: L1 Action.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { updateLeverage } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await updateLeverage({ transport, wallet }, {
*   asset: 0,
*   isCross: true,
*   leverage: 5,
* });
* ```
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#update-leverage
*/ function updateLeverage(config, params, opts) {
	return executeL1Action(config, canonicalize(UpdateLeverageActionSchema, parse(UpdateLeverageActionSchema, {
		type: "updateLeverage",
		...params
	})), opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/usdClassTransfer.js
/**
* Transfer funds between spot account and perp account.
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#transfer-from-spot-account-to-perp-account-and-vice-versa
*/ var UsdClassTransferRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("usdClassTransfer"),
			/** Chain ID in hex format for EIP-712 signing. */ signatureChainId: Hex,
			/** Hyperliquid network type. */ hyperliquidChain: /* @__PURE__ */ picklist(["Mainnet", "Testnet"]),
			/**
			* Amount to transfer (1 = $1).
			*
			* To transfer on behalf of a subaccount, suffix the amount with ` subaccount:<address>`,
			* e.g. `"1 subaccount:0x0000000000000000000000000000000000000000"`.
			*/ amount: /* @__PURE__ */ union([UnsignedDecimal, /* @__PURE__ */ pipe(/* @__PURE__ */ string(), /* @__PURE__ */ regex(/^[0-9]+(\.[0-9]+)?\s+subaccount:0x[0-9a-fA-F]{40}$/))]),
			/** `true` for spot to perp, `false` for perp to spot. */ toPerp: /* @__PURE__ */ boolean(),
			/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		})
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var UsdClassTransferActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ omit(/* @__PURE__ */ object(UsdClassTransferRequest.entries.action.entries), [
		"signatureChainId",
		"hyperliquidChain",
		"nonce"
	]);
})();
/** EIP-712 types for the {@linkcode usdClassTransfer} function. */ var UsdClassTransferTypes = { "HyperliquidTransaction:UsdClassTransfer": [
	{
		name: "hyperliquidChain",
		type: "string"
	},
	{
		name: "amount",
		type: "string"
	},
	{
		name: "toPerp",
		type: "bool"
	},
	{
		name: "nonce",
		type: "uint64"
	}
] };
/**
* Transfer funds between spot account and perp account.
*
* Signing: User-Signed EIP-712.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { usdClassTransfer } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await usdClassTransfer({ transport, wallet }, {
*   amount: "1",
*   toPerp: true,
* });
* ```
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#transfer-from-spot-account-to-perp-account-and-vice-versa
*/ function usdClassTransfer(config, params, opts) {
	return executeUserSignedAction(config, canonicalize(UsdClassTransferActionSchema, parse(UsdClassTransferActionSchema, {
		type: "usdClassTransfer",
		...params
	})), UsdClassTransferTypes, opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/usdSend.js
/**
* Send USD to another address.
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#core-usdc-transfer
*/ var UsdSendRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("usdSend"),
			/** Chain ID in hex format for EIP-712 signing. */ signatureChainId: Hex,
			/** Hyperliquid network type. */ hyperliquidChain: /* @__PURE__ */ picklist(["Mainnet", "Testnet"]),
			/** Destination address. */ destination: Address,
			/** Amount to send (1 = $1). */ amount: UnsignedDecimal,
			/** Nonce (timestamp in ms) used to prevent replay attacks. */ time: UnsignedInteger
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		})
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var UsdSendActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ omit(/* @__PURE__ */ object(UsdSendRequest.entries.action.entries), [
		"signatureChainId",
		"hyperliquidChain",
		"time"
	]);
})();
/** EIP-712 types for the {@linkcode usdSend} function. */ var UsdSendTypes = { "HyperliquidTransaction:UsdSend": [
	{
		name: "hyperliquidChain",
		type: "string"
	},
	{
		name: "destination",
		type: "string"
	},
	{
		name: "amount",
		type: "string"
	},
	{
		name: "time",
		type: "uint64"
	}
] };
/**
* Send USD to another address.
*
* Signing: User-Signed EIP-712.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { usdSend } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await usdSend({ transport, wallet }, {
*   destination: "0x...",
*   amount: "1",
* });
* ```
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#core-usdc-transfer
*/ function usdSend(config, params, opts) {
	return executeUserSignedAction(config, canonicalize(UsdSendActionSchema, parse(UsdSendActionSchema, {
		type: "usdSend",
		...params
	})), UsdSendTypes, opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/userDexAbstraction.js
/**
* Enable/disable HIP-3 DEX abstraction.
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#enable-hip-3-dex-abstraction
*/ var UserDexAbstractionRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("userDexAbstraction"),
			/** Chain ID in hex format for EIP-712 signing. */ signatureChainId: Hex,
			/** Hyperliquid network type. */ hyperliquidChain: /* @__PURE__ */ picklist(["Mainnet", "Testnet"]),
			/** User address. */ user: Address,
			/** Whether to enable or disable HIP-3 DEX abstraction. */ enabled: /* @__PURE__ */ boolean(),
			/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		})
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var UserDexAbstractionActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ omit(/* @__PURE__ */ object(UserDexAbstractionRequest.entries.action.entries), [
		"signatureChainId",
		"hyperliquidChain",
		"nonce"
	]);
})();
/** EIP-712 types for the {@linkcode userDexAbstraction} function. */ var UserDexAbstractionTypes = { "HyperliquidTransaction:UserDexAbstraction": [
	{
		name: "hyperliquidChain",
		type: "string"
	},
	{
		name: "user",
		type: "address"
	},
	{
		name: "enabled",
		type: "bool"
	},
	{
		name: "nonce",
		type: "uint64"
	}
] };
/**
* Enable/disable HIP-3 DEX abstraction.
*
* Signing: User-Signed EIP-712.
*
* @deprecated use {@linkcode userSetAbstraction} instead.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { userDexAbstraction } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await userDexAbstraction({ transport, wallet }, {
*   user: "0x...",
*   enabled: true,
* });
* ```
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#enable-hip-3-dex-abstraction
*/ function userDexAbstraction(config, params, opts) {
	return executeUserSignedAction(config, canonicalize(UserDexAbstractionActionSchema, parse(UserDexAbstractionActionSchema, {
		type: "userDexAbstraction",
		...params
	})), UserDexAbstractionTypes, opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/userOutcome.js
/**
* Manually split or merge outcome shares to convert between primary and dual balances.
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#split-outcome
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#merge-outcome
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#merge-question
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#negate-outcome
*/ var UserOutcomeRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Outcome action. */ action: /* @__PURE__ */ variant("type", [
			/* @__PURE__ */ object({
				/** Type of action. */ type: /* @__PURE__ */ literal("userOutcome"),
				/** Split `X` quote tokens into `X` Yes and `X` No shares of an outcome. */ splitOutcome: /* @__PURE__ */ object({
					/** Outcome identifier. */ outcome: UnsignedInteger,
					/** Amount of quote tokens to split. */ amount: UnsignedDecimal
				})
			}),
			/* @__PURE__ */ object({
				/** Type of action. */ type: /* @__PURE__ */ literal("userOutcome"),
				/** Merge `X` Yes and `X` No shares of an outcome into `X` quote tokens. */ mergeOutcome: /* @__PURE__ */ object({
					/** Outcome identifier. */ outcome: UnsignedInteger,
					/** Amount of shares to merge, or `null` for the maximum available. */ amount: /* @__PURE__ */ nullable(UnsignedDecimal)
				})
			}),
			/* @__PURE__ */ object({
				/** Type of action. */ type: /* @__PURE__ */ literal("userOutcome"),
				/** Merge `X` Yes shares from each outcome associated to the same question into `X` quote tokens. */ mergeQuestion: /* @__PURE__ */ object({
					/** Question identifier. */ question: UnsignedInteger,
					/** Amount of shares to merge, or `null` for the maximum available. */ amount: /* @__PURE__ */ nullable(UnsignedDecimal)
				})
			}),
			/* @__PURE__ */ object({
				/** Type of action. */ type: /* @__PURE__ */ literal("userOutcome"),
				/**
				* Convert `X` No shares from an outcome associated with a question into
				* `X` Yes shares of every other outcome associated with the question.
				*/ negateOutcome: /* @__PURE__ */ object({
					/** Question identifier. */ question: UnsignedInteger,
					/** Outcome identifier. */ outcome: UnsignedInteger,
					/** Amount of No shares to negate. */ amount: UnsignedDecimal
				})
			})
		]),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		}),
		/** Expiration time of the action. */ expiresAfter: /* @__PURE__ */ optional(UnsignedInteger)
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var UserOutcomeActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ variant("type", UserOutcomeRequest.entries.action.options);
})();
/**
* Manually split or merge outcome shares to convert between primary and dual balances.
*
* Signing: L1 Action.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example Split outcome
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { userOutcome } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await userOutcome({ transport, wallet }, {
*   splitOutcome: { outcome: 0, amount: "1" },
* });
* ```
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#split-outcome
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#merge-outcome
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#merge-question
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#negate-outcome
*/ function userOutcome(config, params, opts) {
	return executeL1Action(config, canonicalize(UserOutcomeActionSchema, parse(UserOutcomeActionSchema, {
		type: "userOutcome",
		...params
	})), opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/userPortfolioMargin.js
/**
* Enable/disable user portfolio margin.
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/trading/portfolio-margin
*/ var UserPortfolioMarginRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("userPortfolioMargin"),
			/** Chain ID in hex format for EIP-712 signing. */ signatureChainId: Hex,
			/** Hyperliquid network type. */ hyperliquidChain: /* @__PURE__ */ picklist(["Mainnet", "Testnet"]),
			/** User address. */ user: Address,
			/** Whether to enable or disable user portfolio margin. */ enabled: /* @__PURE__ */ boolean(),
			/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		})
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var UserPortfolioMarginActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ omit(/* @__PURE__ */ object(UserPortfolioMarginRequest.entries.action.entries), [
		"signatureChainId",
		"hyperliquidChain",
		"nonce"
	]);
})();
/** EIP-712 types for the {@linkcode userPortfolioMargin} function. */ var UserPortfolioMarginTypes = { "HyperliquidTransaction:UserPortfolioMargin": [
	{
		name: "hyperliquidChain",
		type: "string"
	},
	{
		name: "user",
		type: "address"
	},
	{
		name: "enabled",
		type: "bool"
	},
	{
		name: "nonce",
		type: "uint64"
	}
] };
/**
* Enable/disable user portfolio margin.
*
* Signing: User-Signed EIP-712.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { userPortfolioMargin } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await userPortfolioMargin({ transport, wallet }, {
*   user: "0x...",
*   enabled: true,
* });
* ```
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/trading/portfolio-margin
*/ function userPortfolioMargin(config, params, opts) {
	return executeUserSignedAction(config, canonicalize(UserPortfolioMarginActionSchema, parse(UserPortfolioMarginActionSchema, {
		type: "userPortfolioMargin",
		...params
	})), UserPortfolioMarginTypes, opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/userSetAbstraction.js
/**
* Set user abstraction mode.
*
* Like {@link agentSetAbstraction} but signed via EIP-712 by the principal (instead of as an L1 action by the agent wallet).
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#set-user-abstraction
*/ var UserSetAbstractionRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("userSetAbstraction"),
			/** Chain ID in hex format for EIP-712 signing. */ signatureChainId: Hex,
			/** Hyperliquid network type. */ hyperliquidChain: /* @__PURE__ */ picklist(["Mainnet", "Testnet"]),
			/** User address. */ user: Address,
			/** Abstraction mode to set. */ abstraction: /* @__PURE__ */ picklist([
				"disabled",
				"unifiedAccount",
				"portfolioMargin"
			]),
			/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		})
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var UserSetAbstractionActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ omit(/* @__PURE__ */ object(UserSetAbstractionRequest.entries.action.entries), [
		"signatureChainId",
		"hyperliquidChain",
		"nonce"
	]);
})();
/** EIP-712 types for the {@linkcode userSetAbstraction} function. */ var UserSetAbstractionTypes = { "HyperliquidTransaction:UserSetAbstraction": [
	{
		name: "hyperliquidChain",
		type: "string"
	},
	{
		name: "user",
		type: "address"
	},
	{
		name: "abstraction",
		type: "string"
	},
	{
		name: "nonce",
		type: "uint64"
	}
] };
/** Produces the action representation serialized into a multi-sig payload. */ function toMultiSigPayloadAction(action) {
	if (action.abstraction === "disabled") return {
		...action,
		abstraction: "i"
	};
	if (action.abstraction === "unifiedAccount") return {
		...action,
		abstraction: "u"
	};
	if (action.abstraction === "portfolioMargin") return {
		...action,
		abstraction: "p"
	};
	return action;
}
/**
* Set user abstraction mode.
*
* Like {@link agentSetAbstraction} but signed via EIP-712 by the principal (instead of as an L1 action by the agent wallet).
*
* Signing: User-Signed EIP-712.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { userSetAbstraction } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await userSetAbstraction({ transport, wallet }, {
*   user: "0x...",
*   abstraction: "unifiedAccount",
* });
* ```
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#set-user-abstraction
*/ function userSetAbstraction(config, params, opts) {
	return executeUserSignedAction(config, canonicalize(UserSetAbstractionActionSchema, parse(UserSetAbstractionActionSchema, {
		type: "userSetAbstraction",
		...params
	})), UserSetAbstractionTypes, {
		...opts,
		toMultiSigPayloadAction
	});
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/validatorL1Stream.js
/**
* Validator vote on risk-free rate for aligned quote asset.
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#validator-vote-on-risk-free-rate-for-aligned-quote-asset
*/ var ValidatorL1StreamRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("validatorL1Stream"),
			/** Risk-free rate as a decimal string (e.g., "0.05" for 5%). */ riskFreeRate: UnsignedDecimal
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		}),
		/** Expiration time of the action. */ expiresAfter: /* @__PURE__ */ optional(UnsignedInteger)
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var ValidatorL1StreamActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object(ValidatorL1StreamRequest.entries.action.entries);
})();
/**
* Validator vote on risk-free rate for aligned quote asset.
*
* Signing: L1 Action.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { validatorL1Stream } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await validatorL1Stream({ transport, wallet }, {
*   riskFreeRate: "0.05",
* });
* ```
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#validator-vote-on-risk-free-rate-for-aligned-quote-asset
*/ function validatorL1Stream(config, params, opts) {
	return executeL1Action(config, canonicalize(ValidatorL1StreamActionSchema, parse(ValidatorL1StreamActionSchema, {
		type: "validatorL1Stream",
		...params
	})), opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/vaultDistribute.js
/**
* Distribute funds from a vault between followers.
* @see null
*/ var VaultDistributeRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("vaultDistribute"),
			/** Vault address. */ vaultAddress: Address,
			/**
			* Amount to distribute (float * 1e6).
			* Set to 0 to close the vault.
			*/ usd: UnsignedInteger
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		}),
		/** Expiration time of the action. */ expiresAfter: /* @__PURE__ */ optional(UnsignedInteger)
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var VaultDistributeActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object(VaultDistributeRequest.entries.action.entries);
})();
/**
* Distribute funds from a vault between followers.
*
* Signing: L1 Action.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { vaultDistribute } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await vaultDistribute({ transport, wallet }, {
*   vaultAddress: "0x...",
*   usd: 10 * 1e6,
* });
* ```
*
* @see null
*/ function vaultDistribute(config, params, opts) {
	return executeL1Action(config, canonicalize(VaultDistributeActionSchema, parse(VaultDistributeActionSchema, {
		type: "vaultDistribute",
		...params
	})), opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/vaultModify.js
/**
* Modify a vault's configuration.
* @see null
*/ var VaultModifyRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("vaultModify"),
			/** Vault address. */ vaultAddress: Address,
			/** Allow deposits from followers. */ allowDeposits: /* @__PURE__ */ nullish(/* @__PURE__ */ boolean(), null),
			/** Always close positions on withdrawal. */ alwaysCloseOnWithdraw: /* @__PURE__ */ nullish(/* @__PURE__ */ boolean(), null)
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		}),
		/** Expiration time of the action. */ expiresAfter: /* @__PURE__ */ optional(UnsignedInteger)
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var VaultModifyActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object(VaultModifyRequest.entries.action.entries);
})();
/**
* Modify a vault's configuration.
*
* Signing: L1 Action.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { vaultModify } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await vaultModify({ transport, wallet }, {
*   vaultAddress: "0x...",
*   allowDeposits: true,
*   alwaysCloseOnWithdraw: false,
* });
* ```
*
* @see null
*/ function vaultModify(config, params, opts) {
	return executeL1Action(config, canonicalize(VaultModifyActionSchema, parse(VaultModifyActionSchema, {
		type: "vaultModify",
		...params
	})), opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/vaultTransfer.js
/**
* Deposit or withdraw from a vault.
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#deposit-or-withdraw-from-a-vault
*/ var VaultTransferRequest = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("vaultTransfer"),
			/** Vault address. */ vaultAddress: Address,
			/** `true` for deposit, `false` for withdrawal. */ isDeposit: /* @__PURE__ */ boolean(),
			/** Amount for deposit/withdrawal (float * 1e6). */ usd: /* @__PURE__ */ pipe(UnsignedInteger, /* @__PURE__ */ minValue(1))
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		}),
		/** Expiration time of the action. */ expiresAfter: /* @__PURE__ */ optional(UnsignedInteger)
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var VaultTransferActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object(VaultTransferRequest.entries.action.entries);
})();
/**
* Deposit or withdraw from a vault.
*
* Signing: L1 Action.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { vaultTransfer } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await vaultTransfer({ transport, wallet }, {
*   vaultAddress: "0x...",
*   isDeposit: true,
*   usd: 10 * 1e6,
* });
* ```
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#deposit-or-withdraw-from-a-vault
*/ function vaultTransfer(config, params, opts) {
	return executeL1Action(config, canonicalize(VaultTransferActionSchema, parse(VaultTransferActionSchema, {
		type: "vaultTransfer",
		...params
	})), opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/withdraw3.js
/**
* Initiate a withdrawal request.
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#initiate-a-withdrawal-request
*/ var Withdraw3Request = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ object({
		/** Action to perform. */ action: /* @__PURE__ */ object({
			/** Type of action. */ type: /* @__PURE__ */ literal("withdraw3"),
			/** Chain ID in hex format for EIP-712 signing. */ signatureChainId: Hex,
			/** Hyperliquid network type. */ hyperliquidChain: /* @__PURE__ */ picklist(["Mainnet", "Testnet"]),
			/** Destination address. */ destination: Address,
			/** Amount to withdraw (1 = $1). */ amount: UnsignedDecimal,
			/** Nonce (timestamp in ms) used to prevent replay attacks. */ time: UnsignedInteger
		}),
		/** Nonce (timestamp in ms) used to prevent replay attacks. */ nonce: UnsignedInteger,
		/** ECDSA signature components. */ signature: /* @__PURE__ */ object({
			/** First 32-byte component. */ r: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Second 32-byte component. */ s: /* @__PURE__ */ pipe(Hex, /* @__PURE__ */ length(66)),
			/** Recovery identifier. */ v: /* @__PURE__ */ picklist([27, 28])
		})
	});
})();
/** Schema for action fields (excludes request-level system fields). */ var Withdraw3ActionSchema = /* @__PURE__ */ (() => {
	return /* @__PURE__ */ omit(/* @__PURE__ */ object(Withdraw3Request.entries.action.entries), [
		"signatureChainId",
		"hyperliquidChain",
		"time"
	]);
})();
/** EIP-712 types for the {@linkcode withdraw3} function. */ var Withdraw3Types = { "HyperliquidTransaction:Withdraw": [
	{
		name: "hyperliquidChain",
		type: "string"
	},
	{
		name: "destination",
		type: "string"
	},
	{
		name: "amount",
		type: "string"
	},
	{
		name: "time",
		type: "uint64"
	}
] };
/**
* Initiate a withdrawal request.
*
* Signing: User-Signed EIP-712.
*
* @param config General configuration for Exchange API requests.
* @param params Parameters specific to the API request.
* @param opts Request execution options.
* @return Successful response without specific data.
*
* @throws {ValidationError} When the request parameters fail validation (before sending).
* @throws {TransportError} When the transport layer throws an error.
* @throws {ApiRequestError} When the API returns an unsuccessful response.
*
* @example
* ```ts
* import { HttpTransport } from "@nktkas/hyperliquid";
* import { withdraw3 } from "@nktkas/hyperliquid/api/exchange";
* import { privateKeyToAccount } from "npm:viem/accounts";
*
* const wallet = privateKeyToAccount("0x..."); // viem or ethers
* const transport = new HttpTransport(); // or `WebSocketTransport`
*
* await withdraw3({ transport, wallet }, {
*   destination: "0x...",
*   amount: "1",
* });
* ```
*
* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#initiate-a-withdrawal-request
*/ function withdraw3(config, params, opts) {
	return executeUserSignedAction(config, canonicalize(Withdraw3ActionSchema, parse(Withdraw3ActionSchema, {
		type: "withdraw3",
		...params
	})), Withdraw3Types, opts);
}
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/api/exchange/client.js
/**
* Client for the Hyperliquid Exchange API endpoint.
* @module
*/
/**
* Execute actions: place orders, cancel orders, transfer funds, etc.
*
* Corresponds to the {@link https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint | Exchange endpoint}.
*/ var ExchangeClient = class {
	config_;
	/**
	* Creates an instance of the ExchangeClient.
	*
	* @param config Configuration for Exchange API requests. See {@link ExchangeConfig}.
	*
	* @example [viem](https://viem.sh/docs/clients/wallet#local-accounts-private-key-mnemonic-etc)
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	*
	* const client = new hl.ExchangeClient({ transport, wallet });
	* ```
	*
	* @example [ethers.js](https://docs.ethers.org/v6/api/wallet/#Wallet)
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { ethers } from "npm:ethers";
	*
	* const wallet = new ethers.Wallet("0x...");
	* const transport = new hl.HttpTransport();
	*
	* const client = new hl.ExchangeClient({ transport, wallet });
	* ```
	*
	* @example Multi-sig
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	* import { ethers } from "npm:ethers";
	*
	* const signer1 = privateKeyToAccount("0x...");
	* const signer2 = new ethers.Wallet("0x...");
	* // ... and more signers
	*
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	*
	* const client = new hl.ExchangeClient({
	*   transport,
	*   signers: [signer1, signer2],
	*   multiSigUser: "0x...",
	* });
	* ```
	*/ constructor(config) {
		this.config_ = config;
	}
	/**
	* Activate or deactivate the signer as an outcome deployer.
	*
	* Signing: L1 Action.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.activateOutcomeDeployer({ isDeactivate: false });
	* ```
	*
	* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/hip-4-deployer-actions#activation
	*/ activateOutcomeDeployer(params, opts) {
		return activateOutcomeDeployer(this.config_, params, opts);
	}
	/**
	* Enable HIP-3 DEX abstraction.
	*
	* Signing: L1 Action.
	*
	* @deprecated use {@linkcode agentSetAbstraction} instead.
	*
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.agentEnableDexAbstraction();
	* ```
	*
	* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#enable-hip-3-dex-abstraction-agent
	*/ agentEnableDexAbstraction(opts) {
		return agentEnableDexAbstraction(this.config_, opts);
	}
	/**
	* Transfer tokens on behalf of the principal via an agent wallet.
	*
	* Like {@link sendAsset} but signed as an L1 action by the agent wallet (instead of EIP-712 by the principal).
	*
	* Signing: L1 Action.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const agentWallet = privateKeyToAccount("0x..."); // approved agent's private key
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet: agentWallet });
	*
	* await client.agentSendAsset({
	*   destination: "0x0000000000000000000000000000000000000001",
	*   sourceDex: "",
	*   destinationDex: "test",
	*   token: "USDC:0xeb62eee3685fc4c43992febcd9e75443",
	*   amount: "1",
	* });
	* ```
	*
	* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#agent-send-asset
	*/ agentSendAsset(params, opts) {
		return agentSendAsset(this.config_, params, opts);
	}
	/**
	* Set user abstraction mode (method for agent wallet).
	*
	* Like {@link userSetAbstraction} but signed as an L1 action by the agent wallet (instead of EIP-712 by the principal).
	*
	* Signing: L1 Action.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.agentSetAbstraction({ abstraction: "u" });
	* ```
	*
	* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#set-user-abstraction-agent
	*/ agentSetAbstraction(params, opts) {
		return agentSetAbstraction(this.config_, params, opts);
	}
	/**
	* Approve an agent to sign on behalf of the master account.
	*
	* Signing: User-Signed EIP-712.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example Basic usage
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.approveAgent({ agentAddress: "0x...", agentName: "myAgent" });
	* ```
	* @example With expiration timestamp
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* const expirationTimestamp = Date.now() + 24 * 60 * 60 * 1000;
	* await client.approveAgent({
	*   agentAddress: "0x...",
	*   agentName: `myAgent valid_until ${expirationTimestamp}`,
	* });
	* ```
	*
	* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#approve-an-api-wallet
	*/ approveAgent(params, opts) {
		return approveAgent(this.config_, params, opts);
	}
	/**
	* Approve a maximum fee rate for a builder.
	*
	* Signing: User-Signed EIP-712.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.approveBuilderFee({ maxFeeRate: "0.01%", builder: "0x..." });
	* ```
	*
	* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#approve-a-builder-fee
	*/ approveBuilderFee(params, opts) {
		return approveBuilderFee(this.config_, params, opts);
	}
	/**
	* Authorize an AQAv2 role.
	*
	* Signing: L1 Action.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.authorizeAqav2Role({
	*   token: 0,
	*   role: "technical",
	* });
	* ```
	*
	* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#authorize-aqav2-role
	*/ authorizeAqav2Role(params, opts) {
		return authorizeAqav2Role(this.config_, params, opts);
	}
	/**
	* Modify multiple orders.
	*
	* Signing: L1 Action.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful variant of {@link OrderResponse} without error statuses.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* const data = await client.batchModify({
	*   modifies: [
	*     {
	*       oid: 123,
	*       order: {
	*         a: 0,
	*         b: true,
	*         p: "31000",
	*         s: "0.2",
	*         r: false,
	*         t: { limit: { tif: "Gtc" } },
	*       },
	*     },
	*   ],
	* });
	* ```
	*
	* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#modify-multiple-orders
	*/ batchModify(params, opts) {
		return batchModify(this.config_, params, opts);
	}
	/**
	* Borrow or lend assets.
	*
	* Signing: L1 Action.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.borrowLend({ operation: "supply", token: 0, amount: "20" });
	* ```
	*
	* @see null
	*/ borrowLend(params, opts) {
		return borrowLend(this.config_, params, opts);
	}
	/**
	* Cancel order(s).
	*
	* Signing: L1 Action.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful variant of {@link CancelResponse} without error statuses.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.cancel({ cancels: [{ a: 0, o: 123 }] });
	* ```
	*
	* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#cancel-order-s
	*/ cancel(params, opts) {
		return cancel(this.config_, params, opts);
	}
	/**
	* Cancel order(s) by cloid.
	*
	* Signing: L1 Action.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful variant of {@link CancelResponse} without error statuses.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.cancelByCloid({
	*   cancels: [
	*     { asset: 0, cloid: "0x..." },
	*   ],
	* });
	* ```
	*
	* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#cancel-order-s-by-cloid
	*/ cancelByCloid(params, opts) {
		return cancelByCloid(this.config_, params, opts);
	}
	/**
	* Transfer native token from the user spot account into staking for delegating to validators.
	*
	* Signing: User-Signed EIP-712.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.cDeposit({ wei: 1 * 1e8 });
	* ```
	*
	* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#deposit-into-staking
	*/ cDeposit(params, opts) {
		return cDeposit(this.config_, params, opts);
	}
	/**
	* Claim rewards from referral program.
	*
	* Signing: L1 Action.
	*
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.claimRewards();
	* ```
	*
	* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#claim-rewards
	*/ claimRewards(opts) {
		return claimRewards(this.config_, opts);
	}
	/**
	* Convert a single-signature account to a multi-signature account or vice versa.
	*
	* Signing: User-Signed EIP-712.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example Convert to multi-sig
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.convertToMultiSigUser({
	*   signers: {
	*     authorizedUsers: ["0x...", "0x...", "0x..."],
	*     threshold: 2,
	*   },
	* });
	* ```
	*
	* @example Convert to single-sig
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.convertToMultiSigUser({ signers: null });
	* ```
	*
	* @see https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/multi-sig
	*/ convertToMultiSigUser(params, opts) {
		return convertToMultiSigUser(this.config_, params, opts);
	}
	/**
	* Create a sub-account.
	*
	* Signing: L1 Action.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Response for creating a sub-account.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* const data = await client.createSubAccount({ name: "..." });
	* ```
	*
	* @see null
	*/ createSubAccount(params, opts) {
		return createSubAccount(this.config_, params, opts);
	}
	/**
	* Create a vault.
	*
	* Signing: L1 Action.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Response for creating a vault.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* const data = await client.createVault({
	*   name: "...",
	*   description: "...",
	*   initialUsd: 100 * 1e6,
	* });
	* ```
	*
	* @see null
	*/ createVault(params, opts) {
		return createVault(this.config_, params, opts);
	}
	/**
	* Jail or unjail self as a validator signer.
	*
	* Signing: L1 Action.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example Jail self
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.cSignerAction({ jailSelf: null });
	* ```
	*
	* @example Unjail self
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.cSignerAction({ unjailSelf: null });
	* ```
	*
	* @see null
	*/ cSignerAction(params, opts) {
		return cSignerAction(this.config_, params, opts);
	}
	/**
	* Action related to validator management.
	*
	* Signing: L1 Action.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.cValidatorAction({
	*   changeProfile: {
	*     node_ip: { Ip: "1.2.3.4" },
	*     name: "...",
	*     description: "...",
	*     unjailed: true,
	*     disable_delegations: false,
	*     commission_bps: null,
	*     signer: null,
	*   },
	* });
	* ```
	*
	* @see null
	*/ cValidatorAction(params, opts) {
		return cValidatorAction(this.config_, params, opts);
	}
	/**
	* Transfer native token from staking into the user's spot account.
	*
	* Signing: User-Signed EIP-712.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.cWithdraw({ wei: 1 * 1e8 });
	* ```
	*
	* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#withdraw-from-staking
	*/ cWithdraw(params, opts) {
		return cWithdraw(this.config_, params, opts);
	}
	/**
	* Configure block type for EVM transactions.
	*
	* Signing: L1 Action.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.evmUserModify({ usingBigBlocks: true });
	* ```
	*
	* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/hyperevm/dual-block-architecture
	*/ evmUserModify(params, opts) {
		return evmUserModify(this.config_, params, opts);
	}
	/**
	* Finalize the link between a HyperCore spot token and an ERC-20 contract on the HyperEVM.
	*
	* Signing: L1 Action.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example Finalize from an EOA-deployed contract
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.finalizeEvmContract({ token: 200, input: { create: { nonce: 0 } } });
	* ```
	*
	* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/hyperevm/hypercore-less-than-greater-than-hyperevm-transfers
	*/ finalizeEvmContract(params, opts) {
		return finalizeEvmContract(this.config_, params, opts);
	}
	/**
	* Bid in a gossip priority Dutch auction to receive prioritized mempool data for an IP.
	*
	* Signing: L1 Action.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.gossipPriorityBid({
	*   slotId: 0,
	*   ip: "1.2.3.4",
	*   maxGas: 100_000_000, // 1 HYPE
	* });
	* ```
	*
	* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/priority-fees
	*/ gossipPriorityBid(params, opts) {
		return gossipPriorityBid(this.config_, params, opts);
	}
	/**
	* Deposit into or withdraw from the HIP-3 DEX backstop liquidator.
	*
	* Signing: L1 Action.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.hip3LiquidatorTransfer({
	*   dex: "test",
	*   ntl: 1_000_000_000, // 1000 quote tokens (1e-6 units)
	*   isDeposit: true,
	* });
	* ```
	*
	* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#deposit-or-withdraw-from-an-hip-3-dexs-backstop-liquidator
	*/ hip3LiquidatorTransfer(params, opts) {
		return hip3LiquidatorTransfer(this.config_, params, opts);
	}
	/**
	* Link staking and trading accounts for fee discount attribution.
	*
	* Signing: User-Signed EIP-712.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.linkStakingUser({ user: "0x...", isFinalize: false });
	* ```
	*
	* @see https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees#staking-linking
	*/ linkStakingUser(params, opts) {
		return linkStakingUser(this.config_, params, opts);
	}
	/**
	* Modify an order.
	*
	* Signing: L1 Action.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.modify({
	*   oid: 123,
	*   order: {
	*     a: 0,
	*     b: true,
	*     p: "31000",
	*     s: "0.2",
	*     r: false,
	*     t: { limit: { tif: "Gtc" } },
	*   },
	* });
	* ```
	*
	* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#modify-an-order
	*/ modify(params, opts) {
		return modify(this.config_, params, opts);
	}
	/**
	* Place an order(s).
	*
	* Signing: L1 Action.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful variant of {@link OrderResponse} without error statuses.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* const data = await client.order({
	*   orders: [
	*     {
	*       a: 0,
	*       b: true,
	*       p: "30000",
	*       s: "0.1",
	*       r: false,
	*       t: { limit: { tif: "Gtc" } },
	*     },
	*   ],
	*   grouping: "na",
	* });
	* ```
	*
	* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#place-an-order
	*/ order(params, opts) {
		return order(this.config_, params, opts);
	}
	/**
	* This action does not do anything (no operation), but causes the nonce to be marked as used.
	*
	* Signing: L1 Action.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.noop({ nonce: 1730000000000 });
	* ```
	*
	* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#invalidate-pending-nonce-noop
	*/ noop(params, opts) {
		return noop(this.config_, params, opts);
	}
	/**
	* Deploying HIP-3 assets.
	*
	* Signing: L1 Action.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.perpDeploy({
	*   registerAsset: {
	*     maxGas: 1000000,
	*     assetRequest: {
	*       coin: "USDC",
	*       szDecimals: 8,
	*       oraclePx: "1",
	*       marginTableId: 1,
	*       onlyIsolated: false,
	*     },
	*     dex: "test",
	*     schema: null,
	*   },
	* });
	* ```
	*
	* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/hip-3-deployer-actions
	*/ perpDeploy(params, opts) {
		return perpDeploy(this.config_, params, opts);
	}
	/**
	* Create a referral code.
	*
	* Signing: L1 Action.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.registerReferrer({ code: "..." });
	* ```
	*
	* @see null
	*/ registerReferrer(params, opts) {
		return registerReferrer(this.config_, params, opts);
	}
	/**
	* Reserve additional rate-limited actions for a fee.
	*
	* Signing: L1 Action.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.reserveRequestWeight({ weight: 10 });
	* ```
	*
	* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#reserve-additional-actions
	*/ reserveRequestWeight(params, opts) {
		return reserveRequestWeight(this.config_, params, opts);
	}
	scheduleCancel(paramsOrOpts, maybeOpts) {
		const isFirstArgParams = paramsOrOpts && "time" in paramsOrOpts;
		const params = isFirstArgParams ? paramsOrOpts : {};
		const opts = isFirstArgParams ? maybeOpts : paramsOrOpts;
		return scheduleCancel(this.config_, params, opts);
	}
	/**
	* Transfer tokens between different perp DEXs, spot balance, users, and/or sub-accounts.
	*
	* Like {@link agentSendAsset} but signed via EIP-712 by the principal (instead of as an L1 action by the agent wallet).
	*
	* Signing: User-Signed EIP-712.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.sendAsset({
	*   destination: "0x0000000000000000000000000000000000000001",
	*   sourceDex: "",
	*   destinationDex: "test",
	*   token: "USDC:0xeb62eee3685fc4c43992febcd9e75443",
	*   amount: "1",
	* });
	* ```
	*
	* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#send-asset
	*/ sendAsset(params, opts) {
		return sendAsset(this.config_, params, opts);
	}
	/**
	* Transfer tokens from Core to EVM with an additional data payload for `ICoreReceiveWithData` contracts.
	*
	* Signing: User-Signed EIP-712.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.sendToEvmWithData({
	*   token: "USDC",
	*   amount: "1",
	*   sourceDex: "spot",
	*   destinationRecipient: "0x...",
	*   addressEncoding: "hex",
	*   destinationChainId: 42161,
	*   gasLimit: 200000,
	*   data: "0x",
	* });
	* ```
	*
	* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#send-to-evm-with-data
	*/ sendToEvmWithData(params, opts) {
		return sendToEvmWithData(this.config_, params, opts);
	}
	/**
	* Set the display name in the leaderboard.
	*
	* Signing: L1 Action.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.setDisplayName({ displayName: "..." });
	* ```
	*
	* @see null
	*/ setDisplayName(params, opts) {
		return setDisplayName(this.config_, params, opts);
	}
	/**
	* Set a referral code.
	*
	* Signing: L1 Action.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.setReferrer({ code: "..." });
	* ```
	*
	* @see null
	*/ setReferrer(params, opts) {
		return setReferrer(this.config_, params, opts);
	}
	/**
	* Deploying HIP-1 and HIP-2 assets.
	*
	* Signing: L1 Action.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.spotDeploy({
	*   registerToken2: {
	*     spec: {
	*       name: "USDC",
	*       szDecimals: 8,
	*       weiDecimals: 8,
	*     },
	*     maxGas: 1000000,
	*     fullName: "USD Coin",
	*   },
	* });
	* ```
	*
	* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/deploying-hip-1-and-hip-2-assets
	*/ spotDeploy(params, opts) {
		return spotDeploy(this.config_, params, opts);
	}
	/**
	* Send spot assets to another address.
	*
	* Signing: User-Signed EIP-712.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.spotSend({
	*   destination: "0x...",
	*   token: "USDC:0xeb62eee3685fc4c43992febcd9e75443",
	*   amount: "1",
	* });
	* ```
	*
	* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#core-spot-transfer
	*/ spotSend(params, opts) {
		return spotSend(this.config_, params, opts);
	}
	/**
	* Opt out of spot dusting.
	*
	* Signing: L1 Action.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.spotUser({ toggleSpotDusting: { optOut: false } });
	* ```
	*
	* @see null
	*/ spotUser(params, opts) {
		return spotUser(this.config_, params, opts);
	}
	/**
	* Permanently disable a linked trading user, locking its funds.
	* Sent by the staking user. After 1 year of locking, funds from the trading user are automatically
	* transferred to the staking user. **This action is irreversible.**
	*
	* Signing: User-Signed EIP-712.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.stakingLinkDisableTradingUser({ tradingUser: "0x..." });
	* ```
	*
	* @see https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees#staking-linking
	*/ stakingLinkDisableTradingUser(params, opts) {
		return stakingLinkDisableTradingUser(this.config_, params, opts);
	}
	/**
	* Modify a sub-account.
	*
	* Signing: L1 Action.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.subAccountModify({ subAccountUser: "0x...", name: "..." });
	* ```
	*
	* @see null
	*/ subAccountModify(params, opts) {
		return subAccountModify(this.config_, params, opts);
	}
	/**
	* Transfer between sub-accounts (spot).
	*
	* Signing: L1 Action.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.subAccountSpotTransfer({
	*   subAccountUser: "0x...",
	*   isDeposit: true,
	*   token: "USDC:0xeb62eee3685fc4c43992febcd9e75443",
	*   amount: "1",
	* });
	* ```
	*
	* @see null
	*/ subAccountSpotTransfer(params, opts) {
		return subAccountSpotTransfer(this.config_, params, opts);
	}
	/**
	* Transfer between sub-accounts (perpetual).
	*
	* Signing: L1 Action.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.subAccountTransfer({
	*   subAccountUser: "0x...",
	*   isDeposit: true,
	*   usd: 1 * 1e6,
	* });
	* ```
	*
	* @see null
	*/ subAccountTransfer(params, opts) {
		return subAccountTransfer(this.config_, params, opts);
	}
	/**
	* Delegate or undelegate native tokens to or from a validator.
	*
	* Signing: User-Signed EIP-712.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.tokenDelegate({
	*   validator: "0x...",
	*   isUndelegate: true,
	*   wei: 1 * 1e8,
	* });
	* ```
	*
	* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#delegate-or-undelegate-stake-from-validator
	*/ tokenDelegate(params, opts) {
		return tokenDelegate(this.config_, params, opts);
	}
	/**
	* Top up isolated margin by targeting a specific leverage.
	*
	* Signing: L1 Action.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.topUpIsolatedOnlyMargin({ asset: 0, leverage: "0.5" });
	* ```
	*
	* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#update-isolated-margin
	*/ topUpIsolatedOnlyMargin(params, opts) {
		return topUpIsolatedOnlyMargin(this.config_, params, opts);
	}
	/**
	* Cancel a TWAP order.
	*
	* Signing: L1 Action.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful variant of {@link TwapCancelResponse} without error status.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.twapCancel({ a: 0, t: 1 });
	* ```
	*
	* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#cancel-a-twap-order
	*/ twapCancel(params, opts) {
		return twapCancel(this.config_, params, opts);
	}
	/**
	* Place a TWAP order.
	*
	* Signing: L1 Action.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful variant of {@link TwapOrderResponse} without error status.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* const data = await client.twapOrder({
	*   twap: {
	*     a: 0,
	*     b: true,
	*     s: "1",
	*     r: false,
	*     m: 10,
	*     t: true,
	*   },
	* });
	* ```
	*
	* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#place-a-twap-order
	*/ twapOrder(params, opts) {
		return twapOrder(this.config_, params, opts);
	}
	/**
	* Add or remove margin from isolated position.
	*
	* Signing: L1 Action.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.updateIsolatedMargin({ asset: 0, isBuy: true, ntli: 1 * 1e6 });
	* ```
	*
	* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#update-isolated-margin
	*/ updateIsolatedMargin(params, opts) {
		return updateIsolatedMargin(this.config_, params, opts);
	}
	/**
	* Update cross or isolated leverage on a coin.
	*
	* Signing: L1 Action.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.updateLeverage({ asset: 0, isCross: true, leverage: 5 });
	* ```
	*
	* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#update-leverage
	*/ updateLeverage(params, opts) {
		return updateLeverage(this.config_, params, opts);
	}
	/**
	* Transfer funds between spot account and perp account.
	*
	* Signing: User-Signed EIP-712.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.usdClassTransfer({ amount: "1", toPerp: true });
	* ```
	*
	* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#transfer-from-spot-account-to-perp-account-and-vice-versa
	*/ usdClassTransfer(params, opts) {
		return usdClassTransfer(this.config_, params, opts);
	}
	/**
	* Send USD to another address.
	*
	* Signing: User-Signed EIP-712.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.usdSend({ destination: "0x...", amount: "1" });
	* ```
	*
	* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#core-usdc-transfer
	*/ usdSend(params, opts) {
		return usdSend(this.config_, params, opts);
	}
	/**
	* Enable/disable HIP-3 DEX abstraction.
	*
	* Signing: User-Signed EIP-712.
	*
	* @deprecated use {@linkcode userSetAbstraction} instead.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.userDexAbstraction({ user: "0x...", enabled: true });
	* ```
	*
	* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#enable-hip-3-dex-abstraction
	*/ userDexAbstraction(params, opts) {
		return userDexAbstraction(this.config_, params, opts);
	}
	/**
	* Manually split or merge outcome shares to convert between primary and dual balances.
	*
	* Signing: L1 Action.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example Split outcome
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.userOutcome({ splitOutcome: { outcome: 0, amount: "1" } });
	* ```
	*
	* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#split-outcome
	* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#merge-outcome
	* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#merge-question
	* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#negate-outcome
	*/ userOutcome(params, opts) {
		return userOutcome(this.config_, params, opts);
	}
	/**
	* Set user abstraction mode.
	*
	* Like {@link agentSetAbstraction} but signed via EIP-712 by the principal (instead of as an L1 action by the agent wallet).
	*
	* Signing: User-Signed EIP-712.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.userSetAbstraction({ user: "0x...", abstraction: "unifiedAccount" });
	* ```
	*
	* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#set-user-abstraction
	*/ userSetAbstraction(params, opts) {
		return userSetAbstraction(this.config_, params, opts);
	}
	/**
	* Enable/disable user portfolio margin.
	*
	* Signing: User-Signed EIP-712.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.userPortfolioMargin({ user: "0x...", enabled: true });
	* ```
	*
	* @see https://hyperliquid.gitbook.io/hyperliquid-docs/trading/portfolio-margin
	*/ userPortfolioMargin(params, opts) {
		return userPortfolioMargin(this.config_, params, opts);
	}
	/**
	* Validator vote on risk-free rate for aligned quote asset.
	*
	* Signing: L1 Action.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.validatorL1Stream({ riskFreeRate: "0.05" });
	* ```
	*
	* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#validator-vote-on-risk-free-rate-for-aligned-quote-asset
	*/ validatorL1Stream(params, opts) {
		return validatorL1Stream(this.config_, params, opts);
	}
	/**
	* Distribute funds from a vault between followers.
	*
	* Signing: L1 Action.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.vaultDistribute({ vaultAddress: "0x...", usd: 10 * 1e6 });
	* ```
	*
	* @see null
	*/ vaultDistribute(params, opts) {
		return vaultDistribute(this.config_, params, opts);
	}
	/**
	* Modify a vault's configuration.
	*
	* Signing: L1 Action.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.vaultModify({
	*   vaultAddress: "0x...",
	*   allowDeposits: true,
	*   alwaysCloseOnWithdraw: false,
	* });
	* ```
	*
	* @see null
	*/ vaultModify(params, opts) {
		return vaultModify(this.config_, params, opts);
	}
	/**
	* Deposit or withdraw from a vault.
	*
	* Signing: L1 Action.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.vaultTransfer({
	*   vaultAddress: "0x...",
	*   isDeposit: true,
	*   usd: 10 * 1e6,
	* });
	* ```
	*
	* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#deposit-or-withdraw-from-a-vault
	*/ vaultTransfer(params, opts) {
		return vaultTransfer(this.config_, params, opts);
	}
	/**
	* Initiate a withdrawal request.
	*
	* Signing: User-Signed EIP-712.
	*
	* @param params Parameters specific to the API request.
	* @param opts Request execution options.
	* @return Successful response without specific data.
	*
	* @throws {ValidationError} When the request parameters fail validation (before sending).
	* @throws {TransportError} When the transport layer throws an error.
	* @throws {ApiRequestError} When the API returns an unsuccessful response.
	*
	* @example
	* ```ts
	* import * as hl from "@nktkas/hyperliquid";
	* import { privateKeyToAccount } from "npm:viem/accounts";
	*
	* const wallet = privateKeyToAccount("0x..."); // viem or ethers
	* const transport = new hl.HttpTransport(); // or `WebSocketTransport`
	* const client = new hl.ExchangeClient({ transport, wallet });
	*
	* await client.withdraw3({ destination: "0x...", amount: "1" });
	* ```
	*
	* @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#initiate-a-withdrawal-request
	*/ withdraw3(params, opts) {
		return withdraw3(this.config_, params, opts);
	}
};
//#endregion
//#region node_modules/decimal.js/decimal.mjs
/*!
*  decimal.js v10.6.0
*  An arbitrary-precision Decimal type for JavaScript.
*  https://github.com/MikeMcl/decimal.js
*  Copyright (c) 2025 Michael Mclaughlin <M8ch88l@gmail.com>
*  MIT Licence
*/
var EXP_LIMIT = 9e15;
var MAX_DIGITS = 1e9;
var NUMERALS = "0123456789abcdef";
var LN10 = "2.3025850929940456840179914546843642076011014886287729760333279009675726096773524802359972050895982983419677840422862486334095254650828067566662873690987816894829072083255546808437998948262331985283935053089653777326288461633662222876982198867465436674744042432743651550489343149393914796194044002221051017141748003688084012647080685567743216228355220114804663715659121373450747856947683463616792101806445070648000277502684916746550586856935673420670581136429224554405758925724208241314695689016758940256776311356919292033376587141660230105703089634572075440370847469940168269282808481184289314848524948644871927809676271275775397027668605952496716674183485704422507197965004714951050492214776567636938662976979522110718264549734772662425709429322582798502585509785265383207606726317164309505995087807523710333101197857547331541421808427543863591778117054309827482385045648019095610299291824318237525357709750539565187697510374970888692180205189339507238539205144634197265287286965110862571492198849978748873771345686209167058";
var PI = "3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679821480865132823066470938446095505822317253594081284811174502841027019385211055596446229489549303819644288109756659334461284756482337867831652712019091456485669234603486104543266482133936072602491412737245870066063155881748815209209628292540917153643678925903600113305305488204665213841469519415116094330572703657595919530921861173819326117931051185480744623799627495673518857527248912279381830119491298336733624406566430860213949463952247371907021798609437027705392171762931767523846748184676694051320005681271452635608277857713427577896091736371787214684409012249534301465495853710507922796892589235420199561121290219608640344181598136297747713099605187072113499999983729780499510597317328160963185950244594553469083026425223082533446850352619311881710100031378387528865875332083814206171776691473035982534904287554687311595628638823537875937519577818577805321712268066130019278766111959092164201989380952572010654858632789";
var DEFAULTS = {
	precision: 20,
	rounding: 4,
	modulo: 1,
	toExpNeg: -7,
	toExpPos: 21,
	minE: -EXP_LIMIT,
	maxE: EXP_LIMIT,
	crypto: false
};
var inexact;
var quadrant;
var external = true;
var decimalError = "[DecimalError] ";
var invalidArgument = decimalError + "Invalid argument: ";
var precisionLimitExceeded = decimalError + "Precision limit exceeded";
var cryptoUnavailable = decimalError + "crypto unavailable";
var tag = "[object Decimal]";
var mathfloor = Math.floor;
var mathpow = Math.pow;
var isBinary = /^0b([01]+(\.[01]*)?|\.[01]+)(p[+-]?\d+)?$/i;
var isHex = /^0x([0-9a-f]+(\.[0-9a-f]*)?|\.[0-9a-f]+)(p[+-]?\d+)?$/i;
var isOctal = /^0o([0-7]+(\.[0-7]*)?|\.[0-7]+)(p[+-]?\d+)?$/i;
var isDecimal = /^(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i;
var BASE = 1e7;
var LOG_BASE = 7;
var MAX_SAFE_INTEGER = 9007199254740991;
var LN10_PRECISION = LN10.length - 1;
var PI_PRECISION = PI.length - 1;
var P = { toStringTag: tag };
P.absoluteValue = P.abs = function() {
	var x = new this.constructor(this);
	if (x.s < 0) x.s = 1;
	return finalise(x);
};
P.ceil = function() {
	return finalise(new this.constructor(this), this.e + 1, 2);
};
P.clampedTo = P.clamp = function(min, max) {
	var k, x = this, Ctor = x.constructor;
	min = new Ctor(min);
	max = new Ctor(max);
	if (!min.s || !max.s) return new Ctor(NaN);
	if (min.gt(max)) throw Error(invalidArgument + max);
	k = x.cmp(min);
	return k < 0 ? min : x.cmp(max) > 0 ? max : new Ctor(x);
};
P.comparedTo = P.cmp = function(y) {
	var i, j, xdL, ydL, x = this, xd = x.d, yd = (y = new x.constructor(y)).d, xs = x.s, ys = y.s;
	if (!xd || !yd) return !xs || !ys ? NaN : xs !== ys ? xs : xd === yd ? 0 : !xd ^ xs < 0 ? 1 : -1;
	if (!xd[0] || !yd[0]) return xd[0] ? xs : yd[0] ? -ys : 0;
	if (xs !== ys) return xs;
	if (x.e !== y.e) return x.e > y.e ^ xs < 0 ? 1 : -1;
	xdL = xd.length;
	ydL = yd.length;
	for (i = 0, j = xdL < ydL ? xdL : ydL; i < j; ++i) if (xd[i] !== yd[i]) return xd[i] > yd[i] ^ xs < 0 ? 1 : -1;
	return xdL === ydL ? 0 : xdL > ydL ^ xs < 0 ? 1 : -1;
};
P.cosine = P.cos = function() {
	var pr, rm, x = this, Ctor = x.constructor;
	if (!x.d) return new Ctor(NaN);
	if (!x.d[0]) return new Ctor(1);
	pr = Ctor.precision;
	rm = Ctor.rounding;
	Ctor.precision = pr + Math.max(x.e, x.sd()) + LOG_BASE;
	Ctor.rounding = 1;
	x = cosine(Ctor, toLessThanHalfPi(Ctor, x));
	Ctor.precision = pr;
	Ctor.rounding = rm;
	return finalise(quadrant == 2 || quadrant == 3 ? x.neg() : x, pr, rm, true);
};
P.cubeRoot = P.cbrt = function() {
	var e, m, n, r, rep, s, sd, t, t3, t3plusx, x = this, Ctor = x.constructor;
	if (!x.isFinite() || x.isZero()) return new Ctor(x);
	external = false;
	s = x.s * mathpow(x.s * x, 1 / 3);
	if (!s || Math.abs(s) == 1 / 0) {
		n = digitsToString(x.d);
		e = x.e;
		if (s = (e - n.length + 1) % 3) n += s == 1 || s == -2 ? "0" : "00";
		s = mathpow(n, 1 / 3);
		e = mathfloor((e + 1) / 3) - (e % 3 == (e < 0 ? -1 : 2));
		if (s == 1 / 0) n = "5e" + e;
		else {
			n = s.toExponential();
			n = n.slice(0, n.indexOf("e") + 1) + e;
		}
		r = new Ctor(n);
		r.s = x.s;
	} else r = new Ctor(s.toString());
	sd = (e = Ctor.precision) + 3;
	for (;;) {
		t = r;
		t3 = t.times(t).times(t);
		t3plusx = t3.plus(x);
		r = divide(t3plusx.plus(x).times(t), t3plusx.plus(t3), sd + 2, 1);
		if (digitsToString(t.d).slice(0, sd) === (n = digitsToString(r.d)).slice(0, sd)) {
			n = n.slice(sd - 3, sd + 1);
			if (n == "9999" || !rep && n == "4999") {
				if (!rep) {
					finalise(t, e + 1, 0);
					if (t.times(t).times(t).eq(x)) {
						r = t;
						break;
					}
				}
				sd += 4;
				rep = 1;
			} else {
				if (!+n || !+n.slice(1) && n.charAt(0) == "5") {
					finalise(r, e + 1, 1);
					m = !r.times(r).times(r).eq(x);
				}
				break;
			}
		}
	}
	external = true;
	return finalise(r, e, Ctor.rounding, m);
};
P.decimalPlaces = P.dp = function() {
	var w, d = this.d, n = NaN;
	if (d) {
		w = d.length - 1;
		n = (w - mathfloor(this.e / LOG_BASE)) * LOG_BASE;
		w = d[w];
		if (w) for (; w % 10 == 0; w /= 10) n--;
		if (n < 0) n = 0;
	}
	return n;
};
P.dividedBy = P.div = function(y) {
	return divide(this, new this.constructor(y));
};
P.dividedToIntegerBy = P.divToInt = function(y) {
	var x = this, Ctor = x.constructor;
	return finalise(divide(x, new Ctor(y), 0, 1, 1), Ctor.precision, Ctor.rounding);
};
P.equals = P.eq = function(y) {
	return this.cmp(y) === 0;
};
P.floor = function() {
	return finalise(new this.constructor(this), this.e + 1, 3);
};
P.greaterThan = P.gt = function(y) {
	return this.cmp(y) > 0;
};
P.greaterThanOrEqualTo = P.gte = function(y) {
	var k = this.cmp(y);
	return k == 1 || k === 0;
};
P.hyperbolicCosine = P.cosh = function() {
	var k, n, pr, rm, len, x = this, Ctor = x.constructor, one = new Ctor(1);
	if (!x.isFinite()) return new Ctor(x.s ? 1 / 0 : NaN);
	if (x.isZero()) return one;
	pr = Ctor.precision;
	rm = Ctor.rounding;
	Ctor.precision = pr + Math.max(x.e, x.sd()) + 4;
	Ctor.rounding = 1;
	len = x.d.length;
	if (len < 32) {
		k = Math.ceil(len / 3);
		n = (1 / tinyPow(4, k)).toString();
	} else {
		k = 16;
		n = "2.3283064365386962890625e-10";
	}
	x = taylorSeries(Ctor, 1, x.times(n), new Ctor(1), true);
	var cosh2_x, i = k, d8 = new Ctor(8);
	for (; i--;) {
		cosh2_x = x.times(x);
		x = one.minus(cosh2_x.times(d8.minus(cosh2_x.times(d8))));
	}
	return finalise(x, Ctor.precision = pr, Ctor.rounding = rm, true);
};
P.hyperbolicSine = P.sinh = function() {
	var k, pr, rm, len, x = this, Ctor = x.constructor;
	if (!x.isFinite() || x.isZero()) return new Ctor(x);
	pr = Ctor.precision;
	rm = Ctor.rounding;
	Ctor.precision = pr + Math.max(x.e, x.sd()) + 4;
	Ctor.rounding = 1;
	len = x.d.length;
	if (len < 3) x = taylorSeries(Ctor, 2, x, x, true);
	else {
		k = 1.4 * Math.sqrt(len);
		k = k > 16 ? 16 : k | 0;
		x = x.times(1 / tinyPow(5, k));
		x = taylorSeries(Ctor, 2, x, x, true);
		var sinh2_x, d5 = new Ctor(5), d16 = new Ctor(16), d20 = new Ctor(20);
		for (; k--;) {
			sinh2_x = x.times(x);
			x = x.times(d5.plus(sinh2_x.times(d16.times(sinh2_x).plus(d20))));
		}
	}
	Ctor.precision = pr;
	Ctor.rounding = rm;
	return finalise(x, pr, rm, true);
};
P.hyperbolicTangent = P.tanh = function() {
	var pr, rm, x = this, Ctor = x.constructor;
	if (!x.isFinite()) return new Ctor(x.s);
	if (x.isZero()) return new Ctor(x);
	pr = Ctor.precision;
	rm = Ctor.rounding;
	Ctor.precision = pr + 7;
	Ctor.rounding = 1;
	return divide(x.sinh(), x.cosh(), Ctor.precision = pr, Ctor.rounding = rm);
};
P.inverseCosine = P.acos = function() {
	var x = this, Ctor = x.constructor, k = x.abs().cmp(1), pr = Ctor.precision, rm = Ctor.rounding;
	if (k !== -1) return k === 0 ? x.isNeg() ? getPi(Ctor, pr, rm) : new Ctor(0) : new Ctor(NaN);
	if (x.isZero()) return getPi(Ctor, pr + 4, rm).times(.5);
	Ctor.precision = pr + 6;
	Ctor.rounding = 1;
	x = new Ctor(1).minus(x).div(x.plus(1)).sqrt().atan();
	Ctor.precision = pr;
	Ctor.rounding = rm;
	return x.times(2);
};
P.inverseHyperbolicCosine = P.acosh = function() {
	var pr, rm, x = this, Ctor = x.constructor;
	if (x.lte(1)) return new Ctor(x.eq(1) ? 0 : NaN);
	if (!x.isFinite()) return new Ctor(x);
	pr = Ctor.precision;
	rm = Ctor.rounding;
	Ctor.precision = pr + Math.max(Math.abs(x.e), x.sd()) + 4;
	Ctor.rounding = 1;
	external = false;
	x = x.times(x).minus(1).sqrt().plus(x);
	external = true;
	Ctor.precision = pr;
	Ctor.rounding = rm;
	return x.ln();
};
P.inverseHyperbolicSine = P.asinh = function() {
	var pr, rm, x = this, Ctor = x.constructor;
	if (!x.isFinite() || x.isZero()) return new Ctor(x);
	pr = Ctor.precision;
	rm = Ctor.rounding;
	Ctor.precision = pr + 2 * Math.max(Math.abs(x.e), x.sd()) + 6;
	Ctor.rounding = 1;
	external = false;
	x = x.times(x).plus(1).sqrt().plus(x);
	external = true;
	Ctor.precision = pr;
	Ctor.rounding = rm;
	return x.ln();
};
P.inverseHyperbolicTangent = P.atanh = function() {
	var pr, rm, wpr, xsd, x = this, Ctor = x.constructor;
	if (!x.isFinite()) return new Ctor(NaN);
	if (x.e >= 0) return new Ctor(x.abs().eq(1) ? x.s / 0 : x.isZero() ? x : NaN);
	pr = Ctor.precision;
	rm = Ctor.rounding;
	xsd = x.sd();
	if (Math.max(xsd, pr) < 2 * -x.e - 1) return finalise(new Ctor(x), pr, rm, true);
	Ctor.precision = wpr = xsd - x.e;
	x = divide(x.plus(1), new Ctor(1).minus(x), wpr + pr, 1);
	Ctor.precision = pr + 4;
	Ctor.rounding = 1;
	x = x.ln();
	Ctor.precision = pr;
	Ctor.rounding = rm;
	return x.times(.5);
};
P.inverseSine = P.asin = function() {
	var halfPi, k, pr, rm, x = this, Ctor = x.constructor;
	if (x.isZero()) return new Ctor(x);
	k = x.abs().cmp(1);
	pr = Ctor.precision;
	rm = Ctor.rounding;
	if (k !== -1) {
		if (k === 0) {
			halfPi = getPi(Ctor, pr + 4, rm).times(.5);
			halfPi.s = x.s;
			return halfPi;
		}
		return new Ctor(NaN);
	}
	Ctor.precision = pr + 6;
	Ctor.rounding = 1;
	x = x.div(new Ctor(1).minus(x.times(x)).sqrt().plus(1)).atan();
	Ctor.precision = pr;
	Ctor.rounding = rm;
	return x.times(2);
};
P.inverseTangent = P.atan = function() {
	var i, j, k, n, px, t, r, wpr, x2, x = this, Ctor = x.constructor, pr = Ctor.precision, rm = Ctor.rounding;
	if (!x.isFinite()) {
		if (!x.s) return new Ctor(NaN);
		if (pr + 4 <= PI_PRECISION) {
			r = getPi(Ctor, pr + 4, rm).times(.5);
			r.s = x.s;
			return r;
		}
	} else if (x.isZero()) return new Ctor(x);
	else if (x.abs().eq(1) && pr + 4 <= PI_PRECISION) {
		r = getPi(Ctor, pr + 4, rm).times(.25);
		r.s = x.s;
		return r;
	}
	Ctor.precision = wpr = pr + 10;
	Ctor.rounding = 1;
	k = Math.min(28, wpr / LOG_BASE + 2 | 0);
	for (i = k; i; --i) x = x.div(x.times(x).plus(1).sqrt().plus(1));
	external = false;
	j = Math.ceil(wpr / LOG_BASE);
	n = 1;
	x2 = x.times(x);
	r = new Ctor(x);
	px = x;
	for (; i !== -1;) {
		px = px.times(x2);
		t = r.minus(px.div(n += 2));
		px = px.times(x2);
		r = t.plus(px.div(n += 2));
		if (r.d[j] !== void 0) for (i = j; r.d[i] === t.d[i] && i--;);
	}
	if (k) r = r.times(2 << k - 1);
	external = true;
	return finalise(r, Ctor.precision = pr, Ctor.rounding = rm, true);
};
P.isFinite = function() {
	return !!this.d;
};
P.isInteger = P.isInt = function() {
	return !!this.d && mathfloor(this.e / LOG_BASE) > this.d.length - 2;
};
P.isNaN = function() {
	return !this.s;
};
P.isNegative = P.isNeg = function() {
	return this.s < 0;
};
P.isPositive = P.isPos = function() {
	return this.s > 0;
};
P.isZero = function() {
	return !!this.d && this.d[0] === 0;
};
P.lessThan = P.lt = function(y) {
	return this.cmp(y) < 0;
};
P.lessThanOrEqualTo = P.lte = function(y) {
	return this.cmp(y) < 1;
};
P.logarithm = P.log = function(base) {
	var isBase10, d, denominator, k, inf, num, sd, r, arg = this, Ctor = arg.constructor, pr = Ctor.precision, rm = Ctor.rounding, guard = 5;
	if (base == null) {
		base = new Ctor(10);
		isBase10 = true;
	} else {
		base = new Ctor(base);
		d = base.d;
		if (base.s < 0 || !d || !d[0] || base.eq(1)) return new Ctor(NaN);
		isBase10 = base.eq(10);
	}
	d = arg.d;
	if (arg.s < 0 || !d || !d[0] || arg.eq(1)) return new Ctor(d && !d[0] ? -1 / 0 : arg.s != 1 ? NaN : d ? 0 : 1 / 0);
	if (isBase10) {
		if (d.length > 1) inf = true;
		else {
			for (k = d[0]; k % 10 === 0;) k /= 10;
			inf = k !== 1;
		}
	}
	external = false;
	sd = pr + guard;
	num = naturalLogarithm(arg, sd);
	denominator = isBase10 ? getLn10(Ctor, sd + 10) : naturalLogarithm(base, sd);
	r = divide(num, denominator, sd, 1);
	if (checkRoundingDigits(r.d, k = pr, rm)) do {
		sd += 10;
		num = naturalLogarithm(arg, sd);
		denominator = isBase10 ? getLn10(Ctor, sd + 10) : naturalLogarithm(base, sd);
		r = divide(num, denominator, sd, 1);
		if (!inf) {
			if (+digitsToString(r.d).slice(k + 1, k + 15) + 1 == 0x5af3107a4000) r = finalise(r, pr + 1, 0);
			break;
		}
	} while (checkRoundingDigits(r.d, k += 10, rm));
	external = true;
	return finalise(r, pr, rm);
};
P.minus = P.sub = function(y) {
	var d, e, i, j, k, len, pr, rm, xd, xe, xLTy, yd, x = this, Ctor = x.constructor;
	y = new Ctor(y);
	if (!x.d || !y.d) {
		if (!x.s || !y.s) y = new Ctor(NaN);
		else if (x.d) y.s = -y.s;
		else y = new Ctor(y.d || x.s !== y.s ? x : NaN);
		return y;
	}
	if (x.s != y.s) {
		y.s = -y.s;
		return x.plus(y);
	}
	xd = x.d;
	yd = y.d;
	pr = Ctor.precision;
	rm = Ctor.rounding;
	if (!xd[0] || !yd[0]) {
		if (yd[0]) y.s = -y.s;
		else if (xd[0]) y = new Ctor(x);
		else return new Ctor(rm === 3 ? -0 : 0);
		return external ? finalise(y, pr, rm) : y;
	}
	e = mathfloor(y.e / LOG_BASE);
	xe = mathfloor(x.e / LOG_BASE);
	xd = xd.slice();
	k = xe - e;
	if (k) {
		xLTy = k < 0;
		if (xLTy) {
			d = xd;
			k = -k;
			len = yd.length;
		} else {
			d = yd;
			e = xe;
			len = xd.length;
		}
		i = Math.max(Math.ceil(pr / LOG_BASE), len) + 2;
		if (k > i) {
			k = i;
			d.length = 1;
		}
		d.reverse();
		for (i = k; i--;) d.push(0);
		d.reverse();
	} else {
		i = xd.length;
		len = yd.length;
		xLTy = i < len;
		if (xLTy) len = i;
		for (i = 0; i < len; i++) if (xd[i] != yd[i]) {
			xLTy = xd[i] < yd[i];
			break;
		}
		k = 0;
	}
	if (xLTy) {
		d = xd;
		xd = yd;
		yd = d;
		y.s = -y.s;
	}
	len = xd.length;
	for (i = yd.length - len; i > 0; --i) xd[len++] = 0;
	for (i = yd.length; i > k;) {
		if (xd[--i] < yd[i]) {
			for (j = i; j && xd[--j] === 0;) xd[j] = BASE - 1;
			--xd[j];
			xd[i] += BASE;
		}
		xd[i] -= yd[i];
	}
	for (; xd[--len] === 0;) xd.pop();
	for (; xd[0] === 0; xd.shift()) --e;
	if (!xd[0]) return new Ctor(rm === 3 ? -0 : 0);
	y.d = xd;
	y.e = getBase10Exponent(xd, e);
	return external ? finalise(y, pr, rm) : y;
};
P.modulo = P.mod = function(y) {
	var q, x = this, Ctor = x.constructor;
	y = new Ctor(y);
	if (!x.d || !y.s || y.d && !y.d[0]) return new Ctor(NaN);
	if (!y.d || x.d && !x.d[0]) return finalise(new Ctor(x), Ctor.precision, Ctor.rounding);
	external = false;
	if (Ctor.modulo == 9) {
		q = divide(x, y.abs(), 0, 3, 1);
		q.s *= y.s;
	} else q = divide(x, y, 0, Ctor.modulo, 1);
	q = q.times(y);
	external = true;
	return x.minus(q);
};
P.naturalExponential = P.exp = function() {
	return naturalExponential(this);
};
P.naturalLogarithm = P.ln = function() {
	return naturalLogarithm(this);
};
P.negated = P.neg = function() {
	var x = new this.constructor(this);
	x.s = -x.s;
	return finalise(x);
};
P.plus = P.add = function(y) {
	var carry, d, e, i, k, len, pr, rm, xd, yd, x = this, Ctor = x.constructor;
	y = new Ctor(y);
	if (!x.d || !y.d) {
		if (!x.s || !y.s) y = new Ctor(NaN);
		else if (!x.d) y = new Ctor(y.d || x.s === y.s ? x : NaN);
		return y;
	}
	if (x.s != y.s) {
		y.s = -y.s;
		return x.minus(y);
	}
	xd = x.d;
	yd = y.d;
	pr = Ctor.precision;
	rm = Ctor.rounding;
	if (!xd[0] || !yd[0]) {
		if (!yd[0]) y = new Ctor(x);
		return external ? finalise(y, pr, rm) : y;
	}
	k = mathfloor(x.e / LOG_BASE);
	e = mathfloor(y.e / LOG_BASE);
	xd = xd.slice();
	i = k - e;
	if (i) {
		if (i < 0) {
			d = xd;
			i = -i;
			len = yd.length;
		} else {
			d = yd;
			e = k;
			len = xd.length;
		}
		k = Math.ceil(pr / LOG_BASE);
		len = k > len ? k + 1 : len + 1;
		if (i > len) {
			i = len;
			d.length = 1;
		}
		d.reverse();
		for (; i--;) d.push(0);
		d.reverse();
	}
	len = xd.length;
	i = yd.length;
	if (len - i < 0) {
		i = len;
		d = yd;
		yd = xd;
		xd = d;
	}
	for (carry = 0; i;) {
		carry = (xd[--i] = xd[i] + yd[i] + carry) / BASE | 0;
		xd[i] %= BASE;
	}
	if (carry) {
		xd.unshift(carry);
		++e;
	}
	for (len = xd.length; xd[--len] == 0;) xd.pop();
	y.d = xd;
	y.e = getBase10Exponent(xd, e);
	return external ? finalise(y, pr, rm) : y;
};
P.precision = P.sd = function(z) {
	var k, x = this;
	if (z !== void 0 && z !== !!z && z !== 1 && z !== 0) throw Error(invalidArgument + z);
	if (x.d) {
		k = getPrecision(x.d);
		if (z && x.e + 1 > k) k = x.e + 1;
	} else k = NaN;
	return k;
};
P.round = function() {
	var x = this, Ctor = x.constructor;
	return finalise(new Ctor(x), x.e + 1, Ctor.rounding);
};
P.sine = P.sin = function() {
	var pr, rm, x = this, Ctor = x.constructor;
	if (!x.isFinite()) return new Ctor(NaN);
	if (x.isZero()) return new Ctor(x);
	pr = Ctor.precision;
	rm = Ctor.rounding;
	Ctor.precision = pr + Math.max(x.e, x.sd()) + LOG_BASE;
	Ctor.rounding = 1;
	x = sine(Ctor, toLessThanHalfPi(Ctor, x));
	Ctor.precision = pr;
	Ctor.rounding = rm;
	return finalise(quadrant > 2 ? x.neg() : x, pr, rm, true);
};
P.squareRoot = P.sqrt = function() {
	var m, n, sd, r, rep, t, x = this, d = x.d, e = x.e, s = x.s, Ctor = x.constructor;
	if (s !== 1 || !d || !d[0]) return new Ctor(!s || s < 0 && (!d || d[0]) ? NaN : d ? x : 1 / 0);
	external = false;
	s = Math.sqrt(+x);
	if (s == 0 || s == 1 / 0) {
		n = digitsToString(d);
		if ((n.length + e) % 2 == 0) n += "0";
		s = Math.sqrt(n);
		e = mathfloor((e + 1) / 2) - (e < 0 || e % 2);
		if (s == 1 / 0) n = "5e" + e;
		else {
			n = s.toExponential();
			n = n.slice(0, n.indexOf("e") + 1) + e;
		}
		r = new Ctor(n);
	} else r = new Ctor(s.toString());
	sd = (e = Ctor.precision) + 3;
	for (;;) {
		t = r;
		r = t.plus(divide(x, t, sd + 2, 1)).times(.5);
		if (digitsToString(t.d).slice(0, sd) === (n = digitsToString(r.d)).slice(0, sd)) {
			n = n.slice(sd - 3, sd + 1);
			if (n == "9999" || !rep && n == "4999") {
				if (!rep) {
					finalise(t, e + 1, 0);
					if (t.times(t).eq(x)) {
						r = t;
						break;
					}
				}
				sd += 4;
				rep = 1;
			} else {
				if (!+n || !+n.slice(1) && n.charAt(0) == "5") {
					finalise(r, e + 1, 1);
					m = !r.times(r).eq(x);
				}
				break;
			}
		}
	}
	external = true;
	return finalise(r, e, Ctor.rounding, m);
};
P.tangent = P.tan = function() {
	var pr, rm, x = this, Ctor = x.constructor;
	if (!x.isFinite()) return new Ctor(NaN);
	if (x.isZero()) return new Ctor(x);
	pr = Ctor.precision;
	rm = Ctor.rounding;
	Ctor.precision = pr + 10;
	Ctor.rounding = 1;
	x = x.sin();
	x.s = 1;
	x = divide(x, new Ctor(1).minus(x.times(x)).sqrt(), pr + 10, 0);
	Ctor.precision = pr;
	Ctor.rounding = rm;
	return finalise(quadrant == 2 || quadrant == 4 ? x.neg() : x, pr, rm, true);
};
P.times = P.mul = function(y) {
	var carry, e, i, k, r, rL, t, xdL, ydL, x = this, Ctor = x.constructor, xd = x.d, yd = (y = new Ctor(y)).d;
	y.s *= x.s;
	if (!xd || !xd[0] || !yd || !yd[0]) return new Ctor(!y.s || xd && !xd[0] && !yd || yd && !yd[0] && !xd ? NaN : !xd || !yd ? y.s / 0 : y.s * 0);
	e = mathfloor(x.e / LOG_BASE) + mathfloor(y.e / LOG_BASE);
	xdL = xd.length;
	ydL = yd.length;
	if (xdL < ydL) {
		r = xd;
		xd = yd;
		yd = r;
		rL = xdL;
		xdL = ydL;
		ydL = rL;
	}
	r = [];
	rL = xdL + ydL;
	for (i = rL; i--;) r.push(0);
	for (i = ydL; --i >= 0;) {
		carry = 0;
		for (k = xdL + i; k > i;) {
			t = r[k] + yd[i] * xd[k - i - 1] + carry;
			r[k--] = t % BASE | 0;
			carry = t / BASE | 0;
		}
		r[k] = (r[k] + carry) % BASE | 0;
	}
	for (; !r[--rL];) r.pop();
	if (carry) ++e;
	else r.shift();
	y.d = r;
	y.e = getBase10Exponent(r, e);
	return external ? finalise(y, Ctor.precision, Ctor.rounding) : y;
};
P.toBinary = function(sd, rm) {
	return toStringBinary(this, 2, sd, rm);
};
P.toDecimalPlaces = P.toDP = function(dp, rm) {
	var x = this, Ctor = x.constructor;
	x = new Ctor(x);
	if (dp === void 0) return x;
	checkInt32(dp, 0, MAX_DIGITS);
	if (rm === void 0) rm = Ctor.rounding;
	else checkInt32(rm, 0, 8);
	return finalise(x, dp + x.e + 1, rm);
};
P.toExponential = function(dp, rm) {
	var str, x = this, Ctor = x.constructor;
	if (dp === void 0) str = finiteToString(x, true);
	else {
		checkInt32(dp, 0, MAX_DIGITS);
		if (rm === void 0) rm = Ctor.rounding;
		else checkInt32(rm, 0, 8);
		x = finalise(new Ctor(x), dp + 1, rm);
		str = finiteToString(x, true, dp + 1);
	}
	return x.isNeg() && !x.isZero() ? "-" + str : str;
};
P.toFixed = function(dp, rm) {
	var str, y, x = this, Ctor = x.constructor;
	if (dp === void 0) str = finiteToString(x);
	else {
		checkInt32(dp, 0, MAX_DIGITS);
		if (rm === void 0) rm = Ctor.rounding;
		else checkInt32(rm, 0, 8);
		y = finalise(new Ctor(x), dp + x.e + 1, rm);
		str = finiteToString(y, false, dp + y.e + 1);
	}
	return x.isNeg() && !x.isZero() ? "-" + str : str;
};
P.toFraction = function(maxD) {
	var d, d0, d1, d2, e, k, n, n0, n1, pr, q, r, x = this, xd = x.d, Ctor = x.constructor;
	if (!xd) return new Ctor(x);
	n1 = d0 = new Ctor(1);
	d1 = n0 = new Ctor(0);
	d = new Ctor(d1);
	e = d.e = getPrecision(xd) - x.e - 1;
	k = e % LOG_BASE;
	d.d[0] = mathpow(10, k < 0 ? LOG_BASE + k : k);
	if (maxD == null) maxD = e > 0 ? d : n1;
	else {
		n = new Ctor(maxD);
		if (!n.isInt() || n.lt(n1)) throw Error(invalidArgument + n);
		maxD = n.gt(d) ? e > 0 ? d : n1 : n;
	}
	external = false;
	n = new Ctor(digitsToString(xd));
	pr = Ctor.precision;
	Ctor.precision = e = xd.length * LOG_BASE * 2;
	for (;;) {
		q = divide(n, d, 0, 1, 1);
		d2 = d0.plus(q.times(d1));
		if (d2.cmp(maxD) == 1) break;
		d0 = d1;
		d1 = d2;
		d2 = n1;
		n1 = n0.plus(q.times(d2));
		n0 = d2;
		d2 = d;
		d = n.minus(q.times(d2));
		n = d2;
	}
	d2 = divide(maxD.minus(d0), d1, 0, 1, 1);
	n0 = n0.plus(d2.times(n1));
	d0 = d0.plus(d2.times(d1));
	n0.s = n1.s = x.s;
	r = divide(n1, d1, e, 1).minus(x).abs().cmp(divide(n0, d0, e, 1).minus(x).abs()) < 1 ? [n1, d1] : [n0, d0];
	Ctor.precision = pr;
	external = true;
	return r;
};
P.toHexadecimal = P.toHex = function(sd, rm) {
	return toStringBinary(this, 16, sd, rm);
};
P.toNearest = function(y, rm) {
	var x = this, Ctor = x.constructor;
	x = new Ctor(x);
	if (y == null) {
		if (!x.d) return x;
		y = new Ctor(1);
		rm = Ctor.rounding;
	} else {
		y = new Ctor(y);
		if (rm === void 0) rm = Ctor.rounding;
		else checkInt32(rm, 0, 8);
		if (!x.d) return y.s ? x : y;
		if (!y.d) {
			if (y.s) y.s = x.s;
			return y;
		}
	}
	if (y.d[0]) {
		external = false;
		x = divide(x, y, 0, rm, 1).times(y);
		external = true;
		finalise(x);
	} else {
		y.s = x.s;
		x = y;
	}
	return x;
};
P.toNumber = function() {
	return +this;
};
P.toOctal = function(sd, rm) {
	return toStringBinary(this, 8, sd, rm);
};
P.toPower = P.pow = function(y) {
	var e, k, pr, r, rm, s, x = this, Ctor = x.constructor, yn = +(y = new Ctor(y));
	if (!x.d || !y.d || !x.d[0] || !y.d[0]) return new Ctor(mathpow(+x, yn));
	x = new Ctor(x);
	if (x.eq(1)) return x;
	pr = Ctor.precision;
	rm = Ctor.rounding;
	if (y.eq(1)) return finalise(x, pr, rm);
	e = mathfloor(y.e / LOG_BASE);
	if (e >= y.d.length - 1 && (k = yn < 0 ? -yn : yn) <= MAX_SAFE_INTEGER) {
		r = intPow(Ctor, x, k, pr);
		return y.s < 0 ? new Ctor(1).div(r) : finalise(r, pr, rm);
	}
	s = x.s;
	if (s < 0) {
		if (e < y.d.length - 1) return new Ctor(NaN);
		if ((y.d[e] & 1) == 0) s = 1;
		if (x.e == 0 && x.d[0] == 1 && x.d.length == 1) {
			x.s = s;
			return x;
		}
	}
	k = mathpow(+x, yn);
	e = k == 0 || !isFinite(k) ? mathfloor(yn * (Math.log("0." + digitsToString(x.d)) / Math.LN10 + x.e + 1)) : new Ctor(k + "").e;
	if (e > Ctor.maxE + 1 || e < Ctor.minE - 1) return new Ctor(e > 0 ? s / 0 : 0);
	external = false;
	Ctor.rounding = x.s = 1;
	k = Math.min(12, (e + "").length);
	r = naturalExponential(y.times(naturalLogarithm(x, pr + k)), pr);
	if (r.d) {
		r = finalise(r, pr + 5, 1);
		if (checkRoundingDigits(r.d, pr, rm)) {
			e = pr + 10;
			r = finalise(naturalExponential(y.times(naturalLogarithm(x, e + k)), e), e + 5, 1);
			if (+digitsToString(r.d).slice(pr + 1, pr + 15) + 1 == 0x5af3107a4000) r = finalise(r, pr + 1, 0);
		}
	}
	r.s = s;
	external = true;
	Ctor.rounding = rm;
	return finalise(r, pr, rm);
};
P.toPrecision = function(sd, rm) {
	var str, x = this, Ctor = x.constructor;
	if (sd === void 0) str = finiteToString(x, x.e <= Ctor.toExpNeg || x.e >= Ctor.toExpPos);
	else {
		checkInt32(sd, 1, MAX_DIGITS);
		if (rm === void 0) rm = Ctor.rounding;
		else checkInt32(rm, 0, 8);
		x = finalise(new Ctor(x), sd, rm);
		str = finiteToString(x, sd <= x.e || x.e <= Ctor.toExpNeg, sd);
	}
	return x.isNeg() && !x.isZero() ? "-" + str : str;
};
P.toSignificantDigits = P.toSD = function(sd, rm) {
	var x = this, Ctor = x.constructor;
	if (sd === void 0) {
		sd = Ctor.precision;
		rm = Ctor.rounding;
	} else {
		checkInt32(sd, 1, MAX_DIGITS);
		if (rm === void 0) rm = Ctor.rounding;
		else checkInt32(rm, 0, 8);
	}
	return finalise(new Ctor(x), sd, rm);
};
P.toString = function() {
	var x = this, Ctor = x.constructor, str = finiteToString(x, x.e <= Ctor.toExpNeg || x.e >= Ctor.toExpPos);
	return x.isNeg() && !x.isZero() ? "-" + str : str;
};
P.truncated = P.trunc = function() {
	return finalise(new this.constructor(this), this.e + 1, 1);
};
P.valueOf = P.toJSON = function() {
	var x = this, Ctor = x.constructor, str = finiteToString(x, x.e <= Ctor.toExpNeg || x.e >= Ctor.toExpPos);
	return x.isNeg() ? "-" + str : str;
};
function digitsToString(d) {
	var i, k, ws, indexOfLastWord = d.length - 1, str = "", w = d[0];
	if (indexOfLastWord > 0) {
		str += w;
		for (i = 1; i < indexOfLastWord; i++) {
			ws = d[i] + "";
			k = LOG_BASE - ws.length;
			if (k) str += getZeroString(k);
			str += ws;
		}
		w = d[i];
		ws = w + "";
		k = LOG_BASE - ws.length;
		if (k) str += getZeroString(k);
	} else if (w === 0) return "0";
	for (; w % 10 === 0;) w /= 10;
	return str + w;
}
function checkInt32(i, min, max) {
	if (i !== ~~i || i < min || i > max) throw Error(invalidArgument + i);
}
function checkRoundingDigits(d, i, rm, repeating) {
	var di, k, r, rd;
	for (k = d[0]; k >= 10; k /= 10) --i;
	if (--i < 0) {
		i += LOG_BASE;
		di = 0;
	} else {
		di = Math.ceil((i + 1) / LOG_BASE);
		i %= LOG_BASE;
	}
	k = mathpow(10, LOG_BASE - i);
	rd = d[di] % k | 0;
	if (repeating == null) {
		if (i < 3) {
			if (i == 0) rd = rd / 100 | 0;
			else if (i == 1) rd = rd / 10 | 0;
			r = rm < 4 && rd == 99999 || rm > 3 && rd == 49999 || rd == 5e4 || rd == 0;
		} else r = (rm < 4 && rd + 1 == k || rm > 3 && rd + 1 == k / 2) && (d[di + 1] / k / 100 | 0) == mathpow(10, i - 2) - 1 || (rd == k / 2 || rd == 0) && (d[di + 1] / k / 100 | 0) == 0;
	} else if (i < 4) {
		if (i == 0) rd = rd / 1e3 | 0;
		else if (i == 1) rd = rd / 100 | 0;
		else if (i == 2) rd = rd / 10 | 0;
		r = (repeating || rm < 4) && rd == 9999 || !repeating && rm > 3 && rd == 4999;
	} else r = ((repeating || rm < 4) && rd + 1 == k || !repeating && rm > 3 && rd + 1 == k / 2) && (d[di + 1] / k / 1e3 | 0) == mathpow(10, i - 3) - 1;
	return r;
}
function convertBase(str, baseIn, baseOut) {
	var j, arr = [0], arrL, i = 0, strL = str.length;
	for (; i < strL;) {
		for (arrL = arr.length; arrL--;) arr[arrL] *= baseIn;
		arr[0] += NUMERALS.indexOf(str.charAt(i++));
		for (j = 0; j < arr.length; j++) if (arr[j] > baseOut - 1) {
			if (arr[j + 1] === void 0) arr[j + 1] = 0;
			arr[j + 1] += arr[j] / baseOut | 0;
			arr[j] %= baseOut;
		}
	}
	return arr.reverse();
}
function cosine(Ctor, x) {
	var k, len, y;
	if (x.isZero()) return x;
	len = x.d.length;
	if (len < 32) {
		k = Math.ceil(len / 3);
		y = (1 / tinyPow(4, k)).toString();
	} else {
		k = 16;
		y = "2.3283064365386962890625e-10";
	}
	Ctor.precision += k;
	x = taylorSeries(Ctor, 1, x.times(y), new Ctor(1));
	for (var i = k; i--;) {
		var cos2x = x.times(x);
		x = cos2x.times(cos2x).minus(cos2x).times(8).plus(1);
	}
	Ctor.precision -= k;
	return x;
}
var divide = (function() {
	function multiplyInteger(x, k, base) {
		var temp, carry = 0, i = x.length;
		for (x = x.slice(); i--;) {
			temp = x[i] * k + carry;
			x[i] = temp % base | 0;
			carry = temp / base | 0;
		}
		if (carry) x.unshift(carry);
		return x;
	}
	function compare(a, b, aL, bL) {
		var i, r;
		if (aL != bL) r = aL > bL ? 1 : -1;
		else for (i = r = 0; i < aL; i++) if (a[i] != b[i]) {
			r = a[i] > b[i] ? 1 : -1;
			break;
		}
		return r;
	}
	function subtract(a, b, aL, base) {
		var i = 0;
		for (; aL--;) {
			a[aL] -= i;
			i = a[aL] < b[aL] ? 1 : 0;
			a[aL] = i * base + a[aL] - b[aL];
		}
		for (; !a[0] && a.length > 1;) a.shift();
	}
	return function(x, y, pr, rm, dp, base) {
		var cmp, e, i, k, logBase, more, prod, prodL, q, qd, rem, remL, rem0, sd, t, xi, xL, yd0, yL, yz, Ctor = x.constructor, sign = x.s == y.s ? 1 : -1, xd = x.d, yd = y.d;
		if (!xd || !xd[0] || !yd || !yd[0]) return new Ctor(!x.s || !y.s || (xd ? yd && xd[0] == yd[0] : !yd) ? NaN : xd && xd[0] == 0 || !yd ? sign * 0 : sign / 0);
		if (base) {
			logBase = 1;
			e = x.e - y.e;
		} else {
			base = BASE;
			logBase = LOG_BASE;
			e = mathfloor(x.e / logBase) - mathfloor(y.e / logBase);
		}
		yL = yd.length;
		xL = xd.length;
		q = new Ctor(sign);
		qd = q.d = [];
		for (i = 0; yd[i] == (xd[i] || 0); i++);
		if (yd[i] > (xd[i] || 0)) e--;
		if (pr == null) {
			sd = pr = Ctor.precision;
			rm = Ctor.rounding;
		} else if (dp) sd = pr + (x.e - y.e) + 1;
		else sd = pr;
		if (sd < 0) {
			qd.push(1);
			more = true;
		} else {
			sd = sd / logBase + 2 | 0;
			i = 0;
			if (yL == 1) {
				k = 0;
				yd = yd[0];
				sd++;
				for (; (i < xL || k) && sd--; i++) {
					t = k * base + (xd[i] || 0);
					qd[i] = t / yd | 0;
					k = t % yd | 0;
				}
				more = k || i < xL;
			} else {
				k = base / (yd[0] + 1) | 0;
				if (k > 1) {
					yd = multiplyInteger(yd, k, base);
					xd = multiplyInteger(xd, k, base);
					yL = yd.length;
					xL = xd.length;
				}
				xi = yL;
				rem = xd.slice(0, yL);
				remL = rem.length;
				for (; remL < yL;) rem[remL++] = 0;
				yz = yd.slice();
				yz.unshift(0);
				yd0 = yd[0];
				if (yd[1] >= base / 2) ++yd0;
				do {
					k = 0;
					cmp = compare(yd, rem, yL, remL);
					if (cmp < 0) {
						rem0 = rem[0];
						if (yL != remL) rem0 = rem0 * base + (rem[1] || 0);
						k = rem0 / yd0 | 0;
						if (k > 1) {
							if (k >= base) k = base - 1;
							prod = multiplyInteger(yd, k, base);
							prodL = prod.length;
							remL = rem.length;
							cmp = compare(prod, rem, prodL, remL);
							if (cmp == 1) {
								k--;
								subtract(prod, yL < prodL ? yz : yd, prodL, base);
							}
						} else {
							if (k == 0) cmp = k = 1;
							prod = yd.slice();
						}
						prodL = prod.length;
						if (prodL < remL) prod.unshift(0);
						subtract(rem, prod, remL, base);
						if (cmp == -1) {
							remL = rem.length;
							cmp = compare(yd, rem, yL, remL);
							if (cmp < 1) {
								k++;
								subtract(rem, yL < remL ? yz : yd, remL, base);
							}
						}
						remL = rem.length;
					} else if (cmp === 0) {
						k++;
						rem = [0];
					}
					qd[i++] = k;
					if (cmp && rem[0]) rem[remL++] = xd[xi] || 0;
					else {
						rem = [xd[xi]];
						remL = 1;
					}
				} while ((xi++ < xL || rem[0] !== void 0) && sd--);
				more = rem[0] !== void 0;
			}
			if (!qd[0]) qd.shift();
		}
		if (logBase == 1) {
			q.e = e;
			inexact = more;
		} else {
			for (i = 1, k = qd[0]; k >= 10; k /= 10) i++;
			q.e = i + e * logBase - 1;
			finalise(q, dp ? pr + q.e + 1 : pr, rm, more);
		}
		return q;
	};
})();
function finalise(x, sd, rm, isTruncated) {
	var digits, i, j, k, rd, roundUp, w, xd, xdi, Ctor = x.constructor;
	out: if (sd != null) {
		xd = x.d;
		if (!xd) return x;
		for (digits = 1, k = xd[0]; k >= 10; k /= 10) digits++;
		i = sd - digits;
		if (i < 0) {
			i += LOG_BASE;
			j = sd;
			w = xd[xdi = 0];
			rd = w / mathpow(10, digits - j - 1) % 10 | 0;
		} else {
			xdi = Math.ceil((i + 1) / LOG_BASE);
			k = xd.length;
			if (xdi >= k) {
				if (isTruncated) {
					for (; k++ <= xdi;) xd.push(0);
					w = rd = 0;
					digits = 1;
					i %= LOG_BASE;
					j = i - LOG_BASE + 1;
				} else break out;
			} else {
				w = k = xd[xdi];
				for (digits = 1; k >= 10; k /= 10) digits++;
				i %= LOG_BASE;
				j = i - LOG_BASE + digits;
				rd = j < 0 ? 0 : w / mathpow(10, digits - j - 1) % 10 | 0;
			}
		}
		isTruncated = isTruncated || sd < 0 || xd[xdi + 1] !== void 0 || (j < 0 ? w : w % mathpow(10, digits - j - 1));
		roundUp = rm < 4 ? (rd || isTruncated) && (rm == 0 || rm == (x.s < 0 ? 3 : 2)) : rd > 5 || rd == 5 && (rm == 4 || isTruncated || rm == 6 && (i > 0 ? j > 0 ? w / mathpow(10, digits - j) : 0 : xd[xdi - 1]) % 10 & 1 || rm == (x.s < 0 ? 8 : 7));
		if (sd < 1 || !xd[0]) {
			xd.length = 0;
			if (roundUp) {
				sd -= x.e + 1;
				xd[0] = mathpow(10, (LOG_BASE - sd % LOG_BASE) % LOG_BASE);
				x.e = -sd || 0;
			} else xd[0] = x.e = 0;
			return x;
		}
		if (i == 0) {
			xd.length = xdi;
			k = 1;
			xdi--;
		} else {
			xd.length = xdi + 1;
			k = mathpow(10, LOG_BASE - i);
			xd[xdi] = j > 0 ? (w / mathpow(10, digits - j) % mathpow(10, j) | 0) * k : 0;
		}
		if (roundUp) for (;;) if (xdi == 0) {
			for (i = 1, j = xd[0]; j >= 10; j /= 10) i++;
			j = xd[0] += k;
			for (k = 1; j >= 10; j /= 10) k++;
			if (i != k) {
				x.e++;
				if (xd[0] == BASE) xd[0] = 1;
			}
			break;
		} else {
			xd[xdi] += k;
			if (xd[xdi] != BASE) break;
			xd[xdi--] = 0;
			k = 1;
		}
		for (i = xd.length; xd[--i] === 0;) xd.pop();
	}
	if (external) {
		if (x.e > Ctor.maxE) {
			x.d = null;
			x.e = NaN;
		} else if (x.e < Ctor.minE) {
			x.e = 0;
			x.d = [0];
		}
	}
	return x;
}
function finiteToString(x, isExp, sd) {
	if (!x.isFinite()) return nonFiniteToString(x);
	var k, e = x.e, str = digitsToString(x.d), len = str.length;
	if (isExp) {
		if (sd && (k = sd - len) > 0) str = str.charAt(0) + "." + str.slice(1) + getZeroString(k);
		else if (len > 1) str = str.charAt(0) + "." + str.slice(1);
		str = str + (x.e < 0 ? "e" : "e+") + x.e;
	} else if (e < 0) {
		str = "0." + getZeroString(-e - 1) + str;
		if (sd && (k = sd - len) > 0) str += getZeroString(k);
	} else if (e >= len) {
		str += getZeroString(e + 1 - len);
		if (sd && (k = sd - e - 1) > 0) str = str + "." + getZeroString(k);
	} else {
		if ((k = e + 1) < len) str = str.slice(0, k) + "." + str.slice(k);
		if (sd && (k = sd - len) > 0) {
			if (e + 1 === len) str += ".";
			str += getZeroString(k);
		}
	}
	return str;
}
function getBase10Exponent(digits, e) {
	var w = digits[0];
	for (e *= LOG_BASE; w >= 10; w /= 10) e++;
	return e;
}
function getLn10(Ctor, sd, pr) {
	if (sd > LN10_PRECISION) {
		external = true;
		if (pr) Ctor.precision = pr;
		throw Error(precisionLimitExceeded);
	}
	return finalise(new Ctor(LN10), sd, 1, true);
}
function getPi(Ctor, sd, rm) {
	if (sd > PI_PRECISION) throw Error(precisionLimitExceeded);
	return finalise(new Ctor(PI), sd, rm, true);
}
function getPrecision(digits) {
	var w = digits.length - 1, len = w * LOG_BASE + 1;
	w = digits[w];
	if (w) {
		for (; w % 10 == 0; w /= 10) len--;
		for (w = digits[0]; w >= 10; w /= 10) len++;
	}
	return len;
}
function getZeroString(k) {
	var zs = "";
	for (; k--;) zs += "0";
	return zs;
}
function intPow(Ctor, x, n, pr) {
	var isTruncated, r = new Ctor(1), k = Math.ceil(pr / LOG_BASE + 4);
	external = false;
	for (;;) {
		if (n % 2) {
			r = r.times(x);
			if (truncate(r.d, k)) isTruncated = true;
		}
		n = mathfloor(n / 2);
		if (n === 0) {
			n = r.d.length - 1;
			if (isTruncated && r.d[n] === 0) ++r.d[n];
			break;
		}
		x = x.times(x);
		truncate(x.d, k);
	}
	external = true;
	return r;
}
function isOdd(n) {
	return n.d[n.d.length - 1] & 1;
}
function maxOrMin(Ctor, args, n) {
	var k, y, x = new Ctor(args[0]), i = 0;
	for (; ++i < args.length;) {
		y = new Ctor(args[i]);
		if (!y.s) {
			x = y;
			break;
		}
		k = x.cmp(y);
		if (k === n || k === 0 && x.s === n) x = y;
	}
	return x;
}
function naturalExponential(x, sd) {
	var denominator, guard, j, pow, sum, t, wpr, rep = 0, i = 0, k = 0, Ctor = x.constructor, rm = Ctor.rounding, pr = Ctor.precision;
	if (!x.d || !x.d[0] || x.e > 17) return new Ctor(x.d ? !x.d[0] ? 1 : x.s < 0 ? 0 : 1 / 0 : x.s ? x.s < 0 ? 0 : x : NaN);
	if (sd == null) {
		external = false;
		wpr = pr;
	} else wpr = sd;
	t = new Ctor(.03125);
	while (x.e > -2) {
		x = x.times(t);
		k += 5;
	}
	guard = Math.log(mathpow(2, k)) / Math.LN10 * 2 + 5 | 0;
	wpr += guard;
	denominator = pow = sum = new Ctor(1);
	Ctor.precision = wpr;
	for (;;) {
		pow = finalise(pow.times(x), wpr, 1);
		denominator = denominator.times(++i);
		t = sum.plus(divide(pow, denominator, wpr, 1));
		if (digitsToString(t.d).slice(0, wpr) === digitsToString(sum.d).slice(0, wpr)) {
			j = k;
			while (j--) sum = finalise(sum.times(sum), wpr, 1);
			if (sd == null) {
				if (rep < 3 && checkRoundingDigits(sum.d, wpr - guard, rm, rep)) {
					Ctor.precision = wpr += 10;
					denominator = pow = t = new Ctor(1);
					i = 0;
					rep++;
				} else return finalise(sum, Ctor.precision = pr, rm, external = true);
			} else {
				Ctor.precision = pr;
				return sum;
			}
		}
		sum = t;
	}
}
function naturalLogarithm(y, sd) {
	var c, c0, denominator, e, numerator, rep, sum, t, wpr, x1, x2, n = 1, guard = 10, x = y, xd = x.d, Ctor = x.constructor, rm = Ctor.rounding, pr = Ctor.precision;
	if (x.s < 0 || !xd || !xd[0] || !x.e && xd[0] == 1 && xd.length == 1) return new Ctor(xd && !xd[0] ? -1 / 0 : x.s != 1 ? NaN : xd ? 0 : x);
	if (sd == null) {
		external = false;
		wpr = pr;
	} else wpr = sd;
	Ctor.precision = wpr += guard;
	c = digitsToString(xd);
	c0 = c.charAt(0);
	if (Math.abs(e = x.e) < 0x5543df729c000) {
		while (c0 < 7 && c0 != 1 || c0 == 1 && c.charAt(1) > 3) {
			x = x.times(y);
			c = digitsToString(x.d);
			c0 = c.charAt(0);
			n++;
		}
		e = x.e;
		if (c0 > 1) {
			x = new Ctor("0." + c);
			e++;
		} else x = new Ctor(c0 + "." + c.slice(1));
	} else {
		t = getLn10(Ctor, wpr + 2, pr).times(e + "");
		x = naturalLogarithm(new Ctor(c0 + "." + c.slice(1)), wpr - guard).plus(t);
		Ctor.precision = pr;
		return sd == null ? finalise(x, pr, rm, external = true) : x;
	}
	x1 = x;
	sum = numerator = x = divide(x.minus(1), x.plus(1), wpr, 1);
	x2 = finalise(x.times(x), wpr, 1);
	denominator = 3;
	for (;;) {
		numerator = finalise(numerator.times(x2), wpr, 1);
		t = sum.plus(divide(numerator, new Ctor(denominator), wpr, 1));
		if (digitsToString(t.d).slice(0, wpr) === digitsToString(sum.d).slice(0, wpr)) {
			sum = sum.times(2);
			if (e !== 0) sum = sum.plus(getLn10(Ctor, wpr + 2, pr).times(e + ""));
			sum = divide(sum, new Ctor(n), wpr, 1);
			if (sd == null) {
				if (checkRoundingDigits(sum.d, wpr - guard, rm, rep)) {
					Ctor.precision = wpr += guard;
					t = numerator = x = divide(x1.minus(1), x1.plus(1), wpr, 1);
					x2 = finalise(x.times(x), wpr, 1);
					denominator = rep = 1;
				} else return finalise(sum, Ctor.precision = pr, rm, external = true);
			} else {
				Ctor.precision = pr;
				return sum;
			}
		}
		sum = t;
		denominator += 2;
	}
}
function nonFiniteToString(x) {
	return String(x.s * x.s / 0);
}
function parseDecimal(x, str) {
	var e, i, len;
	if ((e = str.indexOf(".")) > -1) str = str.replace(".", "");
	if ((i = str.search(/e/i)) > 0) {
		if (e < 0) e = i;
		e += +str.slice(i + 1);
		str = str.substring(0, i);
	} else if (e < 0) e = str.length;
	for (i = 0; str.charCodeAt(i) === 48; i++);
	for (len = str.length; str.charCodeAt(len - 1) === 48; --len);
	str = str.slice(i, len);
	if (str) {
		len -= i;
		x.e = e = e - i - 1;
		x.d = [];
		i = (e + 1) % LOG_BASE;
		if (e < 0) i += LOG_BASE;
		if (i < len) {
			if (i) x.d.push(+str.slice(0, i));
			for (len -= LOG_BASE; i < len;) x.d.push(+str.slice(i, i += LOG_BASE));
			str = str.slice(i);
			i = LOG_BASE - str.length;
		} else i -= len;
		for (; i--;) str += "0";
		x.d.push(+str);
		if (external) {
			if (x.e > x.constructor.maxE) {
				x.d = null;
				x.e = NaN;
			} else if (x.e < x.constructor.minE) {
				x.e = 0;
				x.d = [0];
			}
		}
	} else {
		x.e = 0;
		x.d = [0];
	}
	return x;
}
function parseOther(x, str) {
	var base, Ctor, divisor, i, isFloat, len, p, xd, xe;
	if (str.indexOf("_") > -1) {
		str = str.replace(/(\d)_(?=\d)/g, "$1");
		if (isDecimal.test(str)) return parseDecimal(x, str);
	} else if (str === "Infinity" || str === "NaN") {
		if (!+str) x.s = NaN;
		x.e = NaN;
		x.d = null;
		return x;
	}
	if (isHex.test(str)) {
		base = 16;
		str = str.toLowerCase();
	} else if (isBinary.test(str)) base = 2;
	else if (isOctal.test(str)) base = 8;
	else throw Error(invalidArgument + str);
	i = str.search(/p/i);
	if (i > 0) {
		p = +str.slice(i + 1);
		str = str.substring(2, i);
	} else str = str.slice(2);
	i = str.indexOf(".");
	isFloat = i >= 0;
	Ctor = x.constructor;
	if (isFloat) {
		str = str.replace(".", "");
		len = str.length;
		i = len - i;
		divisor = intPow(Ctor, new Ctor(base), i, i * 2);
	}
	xd = convertBase(str, base, BASE);
	xe = xd.length - 1;
	for (i = xe; xd[i] === 0; --i) xd.pop();
	if (i < 0) return new Ctor(x.s * 0);
	x.e = getBase10Exponent(xd, xe);
	x.d = xd;
	external = false;
	if (isFloat) x = divide(x, divisor, len * 4);
	if (p) x = x.times(Math.abs(p) < 54 ? mathpow(2, p) : Decimal.pow(2, p));
	external = true;
	return x;
}
function sine(Ctor, x) {
	var k, len = x.d.length;
	if (len < 3) return x.isZero() ? x : taylorSeries(Ctor, 2, x, x);
	k = 1.4 * Math.sqrt(len);
	k = k > 16 ? 16 : k | 0;
	x = x.times(1 / tinyPow(5, k));
	x = taylorSeries(Ctor, 2, x, x);
	var sin2_x, d5 = new Ctor(5), d16 = new Ctor(16), d20 = new Ctor(20);
	for (; k--;) {
		sin2_x = x.times(x);
		x = x.times(d5.plus(sin2_x.times(d16.times(sin2_x).minus(d20))));
	}
	return x;
}
function taylorSeries(Ctor, n, x, y, isHyperbolic) {
	var j, t, u, x2, i = 1, pr = Ctor.precision, k = Math.ceil(pr / LOG_BASE);
	external = false;
	x2 = x.times(x);
	u = new Ctor(y);
	for (;;) {
		t = divide(u.times(x2), new Ctor(n++ * n++), pr, 1);
		u = isHyperbolic ? y.plus(t) : y.minus(t);
		y = divide(t.times(x2), new Ctor(n++ * n++), pr, 1);
		t = u.plus(y);
		if (t.d[k] !== void 0) {
			for (j = k; t.d[j] === u.d[j] && j--;);
			if (j == -1) break;
		}
		j = u;
		u = y;
		y = t;
		t = j;
		i++;
	}
	external = true;
	t.d.length = k + 1;
	return t;
}
function tinyPow(b, e) {
	var n = b;
	while (--e) n *= b;
	return n;
}
function toLessThanHalfPi(Ctor, x) {
	var t, isNeg = x.s < 0, pi = getPi(Ctor, Ctor.precision, 1), halfPi = pi.times(.5);
	x = x.abs();
	if (x.lte(halfPi)) {
		quadrant = isNeg ? 4 : 1;
		return x;
	}
	t = x.divToInt(pi);
	if (t.isZero()) quadrant = isNeg ? 3 : 2;
	else {
		x = x.minus(t.times(pi));
		if (x.lte(halfPi)) {
			quadrant = isOdd(t) ? isNeg ? 2 : 3 : isNeg ? 4 : 1;
			return x;
		}
		quadrant = isOdd(t) ? isNeg ? 1 : 4 : isNeg ? 3 : 2;
	}
	return x.minus(pi).abs();
}
function toStringBinary(x, baseOut, sd, rm) {
	var base, e, i, k, len, roundUp, str, xd, y, Ctor = x.constructor, isExp = sd !== void 0;
	if (isExp) {
		checkInt32(sd, 1, MAX_DIGITS);
		if (rm === void 0) rm = Ctor.rounding;
		else checkInt32(rm, 0, 8);
	} else {
		sd = Ctor.precision;
		rm = Ctor.rounding;
	}
	if (!x.isFinite()) str = nonFiniteToString(x);
	else {
		str = finiteToString(x);
		i = str.indexOf(".");
		if (isExp) {
			base = 2;
			if (baseOut == 16) sd = sd * 4 - 3;
			else if (baseOut == 8) sd = sd * 3 - 2;
		} else base = baseOut;
		if (i >= 0) {
			str = str.replace(".", "");
			y = new Ctor(1);
			y.e = str.length - i;
			y.d = convertBase(finiteToString(y), 10, base);
			y.e = y.d.length;
		}
		xd = convertBase(str, 10, base);
		e = len = xd.length;
		for (; xd[--len] == 0;) xd.pop();
		if (!xd[0]) str = isExp ? "0p+0" : "0";
		else {
			if (i < 0) e--;
			else {
				x = new Ctor(x);
				x.d = xd;
				x.e = e;
				x = divide(x, y, sd, rm, 0, base);
				xd = x.d;
				e = x.e;
				roundUp = inexact;
			}
			i = xd[sd];
			k = base / 2;
			roundUp = roundUp || xd[sd + 1] !== void 0;
			roundUp = rm < 4 ? (i !== void 0 || roundUp) && (rm === 0 || rm === (x.s < 0 ? 3 : 2)) : i > k || i === k && (rm === 4 || roundUp || rm === 6 && xd[sd - 1] & 1 || rm === (x.s < 0 ? 8 : 7));
			xd.length = sd;
			if (roundUp) for (; ++xd[--sd] > base - 1;) {
				xd[sd] = 0;
				if (!sd) {
					++e;
					xd.unshift(1);
				}
			}
			for (len = xd.length; !xd[len - 1]; --len);
			for (i = 0, str = ""; i < len; i++) str += NUMERALS.charAt(xd[i]);
			if (isExp) {
				if (len > 1) {
					if (baseOut == 16 || baseOut == 8) {
						i = baseOut == 16 ? 4 : 3;
						for (--len; len % i; len++) str += "0";
						xd = convertBase(str, base, baseOut);
						for (len = xd.length; !xd[len - 1]; --len);
						for (i = 1, str = "1."; i < len; i++) str += NUMERALS.charAt(xd[i]);
					} else str = str.charAt(0) + "." + str.slice(1);
				}
				str = str + (e < 0 ? "p" : "p+") + e;
			} else if (e < 0) {
				for (; ++e;) str = "0" + str;
				str = "0." + str;
			} else if (++e > len) for (e -= len; e--;) str += "0";
			else if (e < len) str = str.slice(0, e) + "." + str.slice(e);
		}
		str = (baseOut == 16 ? "0x" : baseOut == 2 ? "0b" : baseOut == 8 ? "0o" : "") + str;
	}
	return x.s < 0 ? "-" + str : str;
}
function truncate(arr, len) {
	if (arr.length > len) {
		arr.length = len;
		return true;
	}
}
function abs(x) {
	return new this(x).abs();
}
function acos(x) {
	return new this(x).acos();
}
function acosh(x) {
	return new this(x).acosh();
}
function add(x, y) {
	return new this(x).plus(y);
}
function asin(x) {
	return new this(x).asin();
}
function asinh(x) {
	return new this(x).asinh();
}
function atan(x) {
	return new this(x).atan();
}
function atanh(x) {
	return new this(x).atanh();
}
function atan2(y, x) {
	y = new this(y);
	x = new this(x);
	var r, pr = this.precision, rm = this.rounding, wpr = pr + 4;
	if (!y.s || !x.s) r = new this(NaN);
	else if (!y.d && !x.d) {
		r = getPi(this, wpr, 1).times(x.s > 0 ? .25 : .75);
		r.s = y.s;
	} else if (!x.d || y.isZero()) {
		r = x.s < 0 ? getPi(this, pr, rm) : new this(0);
		r.s = y.s;
	} else if (!y.d || x.isZero()) {
		r = getPi(this, wpr, 1).times(.5);
		r.s = y.s;
	} else if (x.s < 0) {
		this.precision = wpr;
		this.rounding = 1;
		r = this.atan(divide(y, x, wpr, 1));
		x = getPi(this, wpr, 1);
		this.precision = pr;
		this.rounding = rm;
		r = y.s < 0 ? r.minus(x) : r.plus(x);
	} else r = this.atan(divide(y, x, wpr, 1));
	return r;
}
function cbrt(x) {
	return new this(x).cbrt();
}
function ceil(x) {
	return finalise(x = new this(x), x.e + 1, 2);
}
function clamp(x, min, max) {
	return new this(x).clamp(min, max);
}
function config(obj) {
	if (!obj || typeof obj !== "object") throw Error(decimalError + "Object expected");
	var i, p, v, useDefaults = obj.defaults === true, ps = [
		"precision",
		1,
		MAX_DIGITS,
		"rounding",
		0,
		8,
		"toExpNeg",
		-EXP_LIMIT,
		0,
		"toExpPos",
		0,
		EXP_LIMIT,
		"maxE",
		0,
		EXP_LIMIT,
		"minE",
		-EXP_LIMIT,
		0,
		"modulo",
		0,
		9
	];
	for (i = 0; i < ps.length; i += 3) {
		if (p = ps[i], useDefaults) this[p] = DEFAULTS[p];
		if ((v = obj[p]) !== void 0) {
			if (mathfloor(v) === v && v >= ps[i + 1] && v <= ps[i + 2]) this[p] = v;
			else throw Error(invalidArgument + p + ": " + v);
		}
	}
	if (p = "crypto", useDefaults) this[p] = DEFAULTS[p];
	if ((v = obj[p]) !== void 0) {
		if (v === true || v === false || v === 0 || v === 1) {
			if (v) {
				if (typeof crypto != "undefined" && crypto && (crypto.getRandomValues || crypto.randomBytes)) this[p] = true;
				else throw Error(cryptoUnavailable);
			} else this[p] = false;
		} else throw Error(invalidArgument + p + ": " + v);
	}
	return this;
}
function cos(x) {
	return new this(x).cos();
}
function cosh(x) {
	return new this(x).cosh();
}
function clone(obj) {
	var i, p, ps;
	function Decimal(v) {
		var e, i, t, x = this;
		if (!(x instanceof Decimal)) return new Decimal(v);
		x.constructor = Decimal;
		if (isDecimalInstance(v)) {
			x.s = v.s;
			if (external) {
				if (!v.d || v.e > Decimal.maxE) {
					x.e = NaN;
					x.d = null;
				} else if (v.e < Decimal.minE) {
					x.e = 0;
					x.d = [0];
				} else {
					x.e = v.e;
					x.d = v.d.slice();
				}
			} else {
				x.e = v.e;
				x.d = v.d ? v.d.slice() : v.d;
			}
			return;
		}
		t = typeof v;
		if (t === "number") {
			if (v === 0) {
				x.s = 1 / v < 0 ? -1 : 1;
				x.e = 0;
				x.d = [0];
				return;
			}
			if (v < 0) {
				v = -v;
				x.s = -1;
			} else x.s = 1;
			if (v === ~~v && v < 1e7) {
				for (e = 0, i = v; i >= 10; i /= 10) e++;
				if (external) {
					if (e > Decimal.maxE) {
						x.e = NaN;
						x.d = null;
					} else if (e < Decimal.minE) {
						x.e = 0;
						x.d = [0];
					} else {
						x.e = e;
						x.d = [v];
					}
				} else {
					x.e = e;
					x.d = [v];
				}
				return;
			}
			if (v * 0 !== 0) {
				if (!v) x.s = NaN;
				x.e = NaN;
				x.d = null;
				return;
			}
			return parseDecimal(x, v.toString());
		}
		if (t === "string") {
			if ((i = v.charCodeAt(0)) === 45) {
				v = v.slice(1);
				x.s = -1;
			} else {
				if (i === 43) v = v.slice(1);
				x.s = 1;
			}
			return isDecimal.test(v) ? parseDecimal(x, v) : parseOther(x, v);
		}
		if (t === "bigint") {
			if (v < 0) {
				v = -v;
				x.s = -1;
			} else x.s = 1;
			return parseDecimal(x, v.toString());
		}
		throw Error(invalidArgument + v);
	}
	Decimal.prototype = P;
	Decimal.ROUND_UP = 0;
	Decimal.ROUND_DOWN = 1;
	Decimal.ROUND_CEIL = 2;
	Decimal.ROUND_FLOOR = 3;
	Decimal.ROUND_HALF_UP = 4;
	Decimal.ROUND_HALF_DOWN = 5;
	Decimal.ROUND_HALF_EVEN = 6;
	Decimal.ROUND_HALF_CEIL = 7;
	Decimal.ROUND_HALF_FLOOR = 8;
	Decimal.EUCLID = 9;
	Decimal.config = Decimal.set = config;
	Decimal.clone = clone;
	Decimal.isDecimal = isDecimalInstance;
	Decimal.abs = abs;
	Decimal.acos = acos;
	Decimal.acosh = acosh;
	Decimal.add = add;
	Decimal.asin = asin;
	Decimal.asinh = asinh;
	Decimal.atan = atan;
	Decimal.atanh = atanh;
	Decimal.atan2 = atan2;
	Decimal.cbrt = cbrt;
	Decimal.ceil = ceil;
	Decimal.clamp = clamp;
	Decimal.cos = cos;
	Decimal.cosh = cosh;
	Decimal.div = div;
	Decimal.exp = exp;
	Decimal.floor = floor;
	Decimal.hypot = hypot;
	Decimal.ln = ln;
	Decimal.log = log;
	Decimal.log10 = log10;
	Decimal.log2 = log2;
	Decimal.max = max;
	Decimal.min = min;
	Decimal.mod = mod;
	Decimal.mul = mul;
	Decimal.pow = pow;
	Decimal.random = random;
	Decimal.round = round;
	Decimal.sign = sign;
	Decimal.sin = sin;
	Decimal.sinh = sinh;
	Decimal.sqrt = sqrt;
	Decimal.sub = sub;
	Decimal.sum = sum;
	Decimal.tan = tan;
	Decimal.tanh = tanh;
	Decimal.trunc = trunc;
	if (obj === void 0) obj = {};
	if (obj) {
		if (obj.defaults !== true) {
			ps = [
				"precision",
				"rounding",
				"toExpNeg",
				"toExpPos",
				"maxE",
				"minE",
				"modulo",
				"crypto"
			];
			for (i = 0; i < ps.length;) if (!obj.hasOwnProperty(p = ps[i++])) obj[p] = this[p];
		}
	}
	Decimal.config(obj);
	return Decimal;
}
function div(x, y) {
	return new this(x).div(y);
}
function exp(x) {
	return new this(x).exp();
}
function floor(x) {
	return finalise(x = new this(x), x.e + 1, 3);
}
function hypot() {
	var i, n, t = new this(0);
	external = false;
	for (i = 0; i < arguments.length;) {
		n = new this(arguments[i++]);
		if (!n.d) {
			if (n.s) {
				external = true;
				return new this(1 / 0);
			}
			t = n;
		} else if (t.d) t = t.plus(n.times(n));
	}
	external = true;
	return t.sqrt();
}
function isDecimalInstance(obj) {
	return obj instanceof Decimal || obj && obj.toStringTag === tag || false;
}
function ln(x) {
	return new this(x).ln();
}
function log(x, y) {
	return new this(x).log(y);
}
function log2(x) {
	return new this(x).log(2);
}
function log10(x) {
	return new this(x).log(10);
}
function max() {
	return maxOrMin(this, arguments, -1);
}
function min() {
	return maxOrMin(this, arguments, 1);
}
function mod(x, y) {
	return new this(x).mod(y);
}
function mul(x, y) {
	return new this(x).mul(y);
}
function pow(x, y) {
	return new this(x).pow(y);
}
function random(sd) {
	var d, e, k, n, i = 0, r = new this(1), rd = [];
	if (sd === void 0) sd = this.precision;
	else checkInt32(sd, 1, MAX_DIGITS);
	k = Math.ceil(sd / LOG_BASE);
	if (!this.crypto) for (; i < k;) rd[i++] = Math.random() * 1e7 | 0;
	else if (crypto.getRandomValues) {
		d = crypto.getRandomValues(new Uint32Array(k));
		for (; i < k;) {
			n = d[i];
			if (n >= 429e7) d[i] = crypto.getRandomValues(/* @__PURE__ */ new Uint32Array(1))[0];
			else rd[i++] = n % 1e7;
		}
	} else if (crypto.randomBytes) {
		d = crypto.randomBytes(k *= 4);
		for (; i < k;) {
			n = d[i] + (d[i + 1] << 8) + (d[i + 2] << 16) + ((d[i + 3] & 127) << 24);
			if (n >= 214e7) crypto.randomBytes(4).copy(d, i);
			else {
				rd.push(n % 1e7);
				i += 4;
			}
		}
		i = k / 4;
	} else throw Error(cryptoUnavailable);
	k = rd[--i];
	sd %= LOG_BASE;
	if (k && sd) {
		n = mathpow(10, LOG_BASE - sd);
		rd[i] = (k / n | 0) * n;
	}
	for (; rd[i] === 0; i--) rd.pop();
	if (i < 0) {
		e = 0;
		rd = [0];
	} else {
		e = -1;
		for (; rd[0] === 0; e -= LOG_BASE) rd.shift();
		for (k = 1, n = rd[0]; n >= 10; n /= 10) k++;
		if (k < LOG_BASE) e -= LOG_BASE - k;
	}
	r.e = e;
	r.d = rd;
	return r;
}
function round(x) {
	return finalise(x = new this(x), x.e + 1, this.rounding);
}
function sign(x) {
	x = new this(x);
	return x.d ? x.d[0] ? x.s : 0 * x.s : x.s || NaN;
}
function sin(x) {
	return new this(x).sin();
}
function sinh(x) {
	return new this(x).sinh();
}
function sqrt(x) {
	return new this(x).sqrt();
}
function sub(x, y) {
	return new this(x).sub(y);
}
function sum() {
	var i = 0, args = arguments, x = new this(args[i]);
	external = false;
	for (; x.s && ++i < args.length;) x = x.plus(args[i]);
	external = true;
	return finalise(x, this.precision, this.rounding);
}
function tan(x) {
	return new this(x).tan();
}
function tanh(x) {
	return new this(x).tanh();
}
function trunc(x) {
	return finalise(x = new this(x), x.e + 1, 1);
}
P[Symbol.for("nodejs.util.inspect.custom")] = P.toString;
P[Symbol.toStringTag] = "Decimal";
var Decimal = P.constructor = clone(DEFAULTS);
LN10 = new Decimal(LN10);
PI = new Decimal(PI);
//#endregion
//#region node_modules/@nktkas/hyperliquid/esm/utils/_format.js
/**
* Price and size formatting per Hyperliquid tick and lot size rules.
*
* @module
*/
/**
* Thrown when a price or size value cannot be formatted to a valid decimal.
*
* @example
* ```ts
* import { formatPrice, FormatError } from "@nktkas/hyperliquid/utils";
*
* try {
*   formatPrice("not a number", 0);
* } catch (error) {
*   if (error instanceof FormatError) {
*     console.error(error.message);
*   }
* }
* ```
*/ var FormatError = class extends HyperliquidError {
	constructor(message, options) {
		super(message, options);
		this.name = "FormatError";
	}
};
var D = Decimal.clone({ rounding: Decimal.ROUND_DOWN });
/**
* Parse a string or number into a finite decimal.js value.
*
* @throws {FormatError} If the value is unparsable or not finite.
*/ function toDecimal(value, field) {
	let d;
	try {
		d = new D(value);
	} catch (cause) {
		throw new FormatError(`Invalid ${field}: ${JSON.stringify(value)}`, { cause });
	}
	if (!d.isFinite()) throw new FormatError(`Invalid ${field}: ${String(value)} is not finite`);
	return d;
}
/**
* Format price according to Hyperliquid {@link https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/tick-and-lot-size | rules}:
* - Maximum 5 significant figures
* - Maximum 6 (for perp) or 8 (for spot) - `szDecimals` decimal places
* - Integer prices are always allowed regardless of significant figures
*
* @param price The price to format (as string or number).
* @param szDecimals The size decimals of the asset.
* @param type The market type: "perp" for perpetuals or "spot" for spot markets. Default: `"perp"`.
* @return Formatted price string
*
* @throws {FormatError} If the price is not a valid finite number, or is truncated to 0.
*
* @example
* ```ts
* import { formatPrice } from "@nktkas/hyperliquid/utils";
*
* formatPrice("97123.456789", 0); // → "97123" (perp, szDecimals=0)
* formatPrice("1.23456789", 5); // → "1.2" (perp, szDecimals=5)
* formatPrice("0.0000123456789", 0, "spot"); // → "0.00001234" (spot, 8-decimal ceiling)
* ```
*/ function formatPrice(price, szDecimals, type = "perp") {
	const d = toDecimal(price, "price");
	const maxDecimals = Math.max((type === "perp" ? 6 : 8) - szDecimals, 0);
	let result = d.toDecimalPlaces(maxDecimals);
	if (!result.isInteger()) result = result.toSignificantDigits(5);
	if (result.isZero()) throw new FormatError("Price is too small and was truncated to 0");
	return result.toFixed();
}
/**
* Format size according to Hyperliquid {@link https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/tick-and-lot-size | rules}:
* - Truncate decimal places to `szDecimals`
*
* @param size The size to format (as string or number).
* @param szDecimals The size decimals of the asset.
* @return Formatted size string
*
* @throws {FormatError} If the size is not a valid finite number, or is truncated to 0.
*
* @example
* ```ts
* import { formatSize } from "@nktkas/hyperliquid/utils";
*
* formatSize("1.23456789", 5); // → "1.23456"
* formatSize("0.123456789", 2); // → "0.12"
* formatSize("100", 0); // → "100"
* ```
*/ function formatSize(size, szDecimals) {
	const result = toDecimal(size, "size").toDecimalPlaces(szDecimals);
	if (result.isZero()) throw new FormatError("Size is too small and was truncated to 0");
	return result.toFixed();
}
//#endregion
export { HttpTransport as i, formatSize as n, ExchangeClient as r, formatPrice as t };
