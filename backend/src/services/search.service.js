const Typesense = require("typesense");
const config = require("../config/env");
const logger = require("../utils/logger");

const isTestEnv =
  process.env.NODE_ENV === "test" ||
  typeof process.env.JEST_WORKER_ID !== "undefined";
const isTypesenseConfigured =
  process.env.TYPESENSE_API_KEY &&
  process.env.TYPESENSE_API_KEY !== "dev-placeholder-key" &&
  process.env.TYPESENSE_HOST;

let client;
let collectionReady = false;

if (!isTestEnv && isTypesenseConfigured) {
  try {
    client = new Typesense.Client({
      nodes: [
        {
          host: process.env.TYPESENSE_HOST || config.typesenseHost,
          port: Number(process.env.TYPESENSE_PORT || config.typesensePort),
          protocol: process.env.TYPESENSE_PROTOCOL || config.typesenseProtocol,
        },
      ],
      apiKey: process.env.TYPESENSE_API_KEY || config.typesenseApiKey,
      connectionTimeoutSeconds: 2,
      numRetries: 2,
    });
  } catch (error) {
    logger.warn("Typesense client initialization failed, search disabled");
    client = null;
  }
} else if (!isTestEnv) {
  logger.info("Typesense not configured, search feature disabled");
}

async function ensureCollection() {
  if (isTestEnv || collectionReady) {
    return;
  }

  try {
    await client.collections("products").retrieve();
    collectionReady = true;
  } catch (error) {
    if (error.httpStatus !== 404) {
      throw error;
    }

    const schema = {
      name: "products",
      fields: [
        { name: "id", type: "string" },
        { name: "name", type: "string" },
        { name: "category", type: "string", facet: true },
        { name: "description", type: "string" },
        { name: "price", type: "float", facet: true },
        { name: "shopId", type: "string", facet: true },
        { name: "isAvailable", type: "bool", facet: true },
      ],
      default_sorting_field: "price",
    };

    await client.collections().create(schema);
    collectionReady = true;
  }
}

async function indexProduct(product) {
  if (isTestEnv || !client) return;
  try {
    await ensureCollection();
    const doc = {
      id: product._id.toString(),
      name: product.name || "",
      category: (product.category && product.category.toString()) || "",
      description: product.description || "",
      price: Number(product.price || 0),
      shopId: product.shop ? product.shop.toString() : "",
      isAvailable: Boolean(product.isAvailable),
    };

    await client.collections("products").documents().upsert(doc);
  } catch (error) {
    console.error("Typesense indexProduct failed", error);
  }
}

async function deleteProduct(productId) {
  if (isTestEnv || !client) return;
  try {
    await ensureCollection();
    await client.collections("products").documents(productId).delete();
  } catch (error) {
    console.error("Typesense deleteProduct failed", error);
  }
}

async function searchProducts(query, options = {}) {
  if (!client || isTestEnv) {
    return { hits: [] };
  }

  try {
    await ensureCollection();

    const searchParams = {
      q: query,
      query_by: "name,category,description",
      query_by_weights: "5,2,1",
      num_typos: 2,
      per_page: options.limit || 20,
      sort_by: options.sort_by || "price:asc",
      filter_by: "isAvailable:=true",
    };

    const result = await client
      .collections("products")
      .documents()
      .search(searchParams);
    return result;
  } catch (error) {
    console.error("Typesense searchProducts failed", error);
    return { hits: [] };
  }
}

module.exports = {
  indexProduct,
  deleteProduct,
  searchProducts,
};
