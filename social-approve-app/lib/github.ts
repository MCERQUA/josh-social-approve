// GitHub API for committing generated images
// This allows serverless functions to commit files to the repo

const GITHUB_API = 'https://api.github.com';

interface GitHubConfig {
  token: string;
  repo: string;
  branch: string;
}

function getConfig(): GitHubConfig {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || 'main';

  if (!token || !repo) {
    throw new Error('GITHUB_TOKEN and GITHUB_REPO environment variables are required');
  }

  return { token, repo, branch };
}

async function githubFetch(endpoint: string, options: RequestInit = {}) {
  const { token } = getConfig();

  const response = await fetch(`${GITHUB_API}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`GitHub API error: ${error.message || response.statusText}`);
  }

  return response.json();
}

// Get the latest commit SHA for the branch
async function getLatestCommitSha(): Promise<string> {
  const { repo, branch } = getConfig();
  const data = await githubFetch(`/repos/${repo}/git/ref/heads/${branch}`);
  return data.object.sha;
}

// Get the tree SHA for a commit
async function getTreeSha(commitSha: string): Promise<string> {
  const { repo } = getConfig();
  const data = await githubFetch(`/repos/${repo}/git/commits/${commitSha}`);
  return data.tree.sha;
}

// Create a blob (file content) in the repo
async function createBlob(content: string, encoding: 'utf-8' | 'base64' = 'base64'): Promise<string> {
  const { repo } = getConfig();
  const data = await githubFetch(`/repos/${repo}/git/blobs`, {
    method: 'POST',
    body: JSON.stringify({ content, encoding }),
  });
  return data.sha;
}

// Create a new tree with the file
async function createTree(baseTreeSha: string, path: string, blobSha: string): Promise<string> {
  const { repo } = getConfig();
  const data = await githubFetch(`/repos/${repo}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: [{
        path,
        mode: '100644', // file mode
        type: 'blob',
        sha: blobSha,
      }],
    }),
  });
  return data.sha;
}

// Create a commit
async function createCommit(treeSha: string, parentSha: string, message: string): Promise<string> {
  const { repo } = getConfig();
  const data = await githubFetch(`/repos/${repo}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({
      message,
      tree: treeSha,
      parents: [parentSha],
    }),
  });
  return data.sha;
}

// Update the branch reference to point to new commit
async function updateBranchRef(commitSha: string): Promise<void> {
  const { repo, branch } = getConfig();
  await githubFetch(`/repos/${repo}/git/refs/heads/${branch}`, {
    method: 'PATCH',
    body: JSON.stringify({
      sha: commitSha,
      force: false,
    }),
  });
}

/**
 * Commit an image file to the GitHub repository
 * @param imageBase64 - Base64 encoded image data (without data URI prefix)
 * @param filename - Name of the file (e.g., 'my-image.png')
 * @param commitMessage - Commit message
 * @returns The path where the file was committed
 */
export async function commitImage(
  imageBase64: string,
  filename: string,
  commitMessage?: string
): Promise<{ path: string; commitSha: string; success: boolean }> {
  try {
    // Note: The Next.js app is in social-approve-app/ subdirectory
    const filePath = `social-approve-app/public/images/${filename}`;
    const message = commitMessage || `Add generated image: ${filename}`;

    // Step 1: Get the latest commit SHA
    const latestCommitSha = await getLatestCommitSha();

    // Step 2: Get the tree SHA for that commit
    const baseTreeSha = await getTreeSha(latestCommitSha);

    // Step 3: Create a blob with the image content
    const blobSha = await createBlob(imageBase64, 'base64');

    // Step 4: Create a new tree with the file
    const newTreeSha = await createTree(baseTreeSha, filePath, blobSha);

    // Step 5: Create a commit
    const newCommitSha = await createCommit(newTreeSha, latestCommitSha, message);

    // Step 6: Update the branch reference
    await updateBranchRef(newCommitSha);

    console.log(`[GitHub] Committed ${filename} with SHA: ${newCommitSha}`);

    return {
      path: filePath,
      commitSha: newCommitSha,
      success: true,
    };
  } catch (error) {
    console.error('[GitHub] Failed to commit image:', error);
    throw error;
  }
}

/**
 * Check if GitHub API is configured
 */
export function isConfigured(): boolean {
  return !!(process.env.GITHUB_TOKEN && process.env.GITHUB_REPO);
}

/**
 * Get the public URL for an image in the repo (after deploy)
 */
export function getImageUrl(filename: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://josh.jamsocial.app';
  return `${baseUrl}/images/${filename}`;
}
