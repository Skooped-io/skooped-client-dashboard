/**
 * Vercel API utility functions for the Skooped deployment pipeline.
 */

const VERCEL_API = "https://api.vercel.com";

interface VercelProjectResponse {
  id: string;
  error?: { message: string };
}

interface VercelDeploymentResponse {
  deployments: Array<{ readyState: string }>;
  error?: { message: string };
}

interface VercelDomainResponse {
  error?: { message: string };
}

/**
 * Creates a Vercel project linked to a GitHub repo.
 * Returns the new project ID.
 */
export async function createProject(
  name: string,
  repoFullName: string,
  token: string
): Promise<string> {
  const res = await fetch(`${VERCEL_API}/v10/projects`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      framework: "vite",
      gitRepository: {
        type: "github",
        repo: repoFullName,
      },
    }),
  });

  const data = (await res.json()) as VercelProjectResponse;

  if (!res.ok || !data.id) {
    throw new Error(
      `Vercel createProject failed: ${data.error?.message ?? JSON.stringify(data)}`
    );
  }

  return data.id;
}

/**
 * Adds a custom domain to a Vercel project.
 */
export async function addDomain(
  projectId: string,
  domain: string,
  token: string
): Promise<void> {
  const res = await fetch(`${VERCEL_API}/v10/projects/${projectId}/domains`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: domain }),
  });

  const data = (await res.json()) as VercelDomainResponse;

  if (!res.ok) {
    throw new Error(
      `Vercel addDomain failed: ${data.error?.message ?? JSON.stringify(data)}`
    );
  }
}

/**
 * Returns the readyState of the latest deployment for a project.
 * Possible values: BUILDING, ERROR, INITIALIZING, QUEUED, READY, CANCELED
 */
export async function getDeploymentStatus(
  projectId: string,
  token: string
): Promise<string> {
  const res = await fetch(
    `${VERCEL_API}/v6/deployments?projectId=${projectId}&limit=1`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const data = (await res.json()) as VercelDeploymentResponse;

  if (!res.ok) {
    throw new Error(
      `Vercel getDeploymentStatus failed: ${data.error?.message ?? JSON.stringify(data)}`
    );
  }

  const deployment = data.deployments?.[0];
  if (!deployment) return "NO_DEPLOYMENTS";

  return deployment.readyState;
}
