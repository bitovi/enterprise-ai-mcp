import { Connection, Client } from '@temporalio/client';
import { readFileSync } from 'fs';

export interface TemporalConfig {
  cloudApiKey?: string;
  address: string;
  namespace: string;
  taskQueue: string;
  workflowType: string;
  tls?: {
    certPath?: string;
    keyPath?: string;
    caCertPath?: string;
  };
}

/**
 * Creates and returns a Temporal client configured from environment variables
 */
export async function createTemporalClient(config: TemporalConfig): Promise<Client> {
  // Build connection options
  const connectionOptions: any = {
    address: config.address,
  };

  // Add Temporal Cloud API key authentication if provided
  if (config.cloudApiKey) {
    connectionOptions.metadata = {
      'authorization': `Bearer ${config.cloudApiKey}`,
    };
  }

  // Add TLS configuration if provided
  if (config.tls?.certPath && config.tls?.keyPath) {
    connectionOptions.tls = {
      clientCertPair: {
        crt: readFileSync(config.tls.certPath),
        key: readFileSync(config.tls.keyPath),
      },
    };

    // Add CA cert if provided
    if (config.tls.caCertPath) {
      connectionOptions.tls.serverRootCACertificate = readFileSync(config.tls.caCertPath);
    }
  }

  // Create connection
  const connection = await Connection.connect(connectionOptions);

  // Create and return client
  const client = new Client({
    connection,
    namespace: config.namespace,
  });

  return client;
}

/**
 * Executes a search workflow and waits for the result
 */
export async function executeSearchWorkflow(
  taskQueue: string,
  client: Client,
  request: { Message: string; Stack: string }
): Promise<any> {
  
  const handle = await client.workflow.start('searchWorkflow', {
    taskQueue: taskQueue,
    args: [request],
    workflowId: `search-${Date.now()}-${Math.random().toString(36).substring(7)}`,
  });

  // Wait for workflow result
  const result = await handle.result();
  return result;
}
