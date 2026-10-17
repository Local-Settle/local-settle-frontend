import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const contractPath = resolve('contracts/backend-openapi.json');
const contract = JSON.parse(await readFile(contractPath, 'utf8'));
const failures = [];

if (!contract.openapi?.startsWith('3.')) {
  failures.push(`Expected an OpenAPI 3.x document in ${contractPath}`);
}

if (!/^\d+\.\d+\.\d+$/.test(contract.info?.version ?? '')) {
  failures.push('Backend OpenAPI info.version must be a semantic version');
}

const models = [
  ['Offer', 'src/features/offer/models/offer.ts', 'Offer'],
  ['CreateOffer', 'src/features/offer/models/createOffer.ts', 'CreateOffer'],
  ['Order', 'src/features/order/models/order.ts', 'Order'],
  ['CreateOrder', 'src/features/order/models/createOrder.ts', 'CreateOrder'],
  ['PaymentMethod', 'src/features/paymentMethod/models/paymentMethod.ts', 'PaymentMethod'],
  ['CreatePaymentMethod', 'src/features/paymentMethod/models/createPaymentMethod.ts', 'CreatePaymentMethod'],
];

for (const [schemaName, modelPath, interfaceName] of models) {
  const schema = contract.components?.schemas?.[schemaName];
  if (!schema) {
    failures.push(`Backend OpenAPI is missing schema ${schemaName}`);
    continue;
  }

  const source = await readFile(resolve(modelPath), 'utf8');
  const interfaceMatch = source.match(
    new RegExp(`export\\s+interface\\s+${interfaceName}\\s*\\{([^}]*)\\}`),
  );
  if (!interfaceMatch) {
    failures.push(`${modelPath} is missing interface ${interfaceName}`);
    continue;
  }

  const properties = new Map();
  for (const match of interfaceMatch[1].matchAll(/^\s*([\w$]+)(\?)?\s*:\s*([^;,\n]+)[;,]?\s*$/gm)) {
    properties.set(match[1], { optional: Boolean(match[2]), type: match[3].trim() });
  }

  for (const propertyName of schema.required ?? []) {
    const modelProperty = properties.get(propertyName);
    if (!modelProperty) {
      failures.push(`${modelPath}: ${interfaceName} is missing backend-required field ${propertyName}`);
    } else if (modelProperty.optional) {
      failures.push(`${modelPath}: backend-required field ${propertyName} is optional in ${interfaceName}`);
    }
  }
}

if (failures.length) {
  console.error('Backend/frontend contract check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Backend OpenAPI ${contract.info.version} is compatible with the frontend API models.`);
}
