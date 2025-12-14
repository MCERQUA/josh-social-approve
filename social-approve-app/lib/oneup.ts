// OneUp API Helper Library
// Documentation: https://docs.oneupapp.io/

const ONEUP_BASE_URL = 'https://www.oneupapp.io/api';

interface OneUpResponse<T> {
  message: string;
  error: boolean;
  data: T;
}

export interface OneUpCategory {
  id: number;
  category_name: string;
  isPaused: number;
  created_at: string;
}

export interface OneUpAccount {
  category_id: number;
  social_network_name: string;
  social_network_id: string;
  social_network_type: string;
}

// Get the API key from environment
function getApiKey(): string {
  const apiKey = process.env.ONEUP_API_KEY;
  if (!apiKey) {
    throw new Error('ONEUP_API_KEY environment variable is not set');
  }
  return apiKey;
}

// List all categories
export async function listCategories(): Promise<OneUpCategory[]> {
  const apiKey = getApiKey();
  const url = `${ONEUP_BASE_URL}/listcategory?apiKey=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url);
  const data: OneUpResponse<OneUpCategory[]> = await response.json();

  if (data.error) {
    throw new Error(data.message);
  }

  return data.data;
}

// List accounts in a category
export async function listCategoryAccounts(categoryId: number): Promise<OneUpAccount[]> {
  const apiKey = getApiKey();
  const url = `${ONEUP_BASE_URL}/listcategoryaccount?apiKey=${encodeURIComponent(apiKey)}&category_id=${categoryId}`;

  const response = await fetch(url);
  const data: OneUpResponse<OneUpAccount[]> = await response.json();

  if (data.error) {
    throw new Error(data.message);
  }

  return data.data;
}

// Format date for OneUp API (YYYY-MM-DD HH:MM)
function formatDateForOneUp(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// Schedule a text post
export async function scheduleTextPost(params: {
  categoryId: number;
  socialNetworkId: string | string[];
  scheduledDateTime: Date;
  content: string;
}): Promise<{ message: string; error: boolean }> {
  const apiKey = getApiKey();

  // Build URL with parameters
  const urlParams = new URLSearchParams({
    apiKey,
    category_id: String(params.categoryId),
    scheduled_date_time: formatDateForOneUp(params.scheduledDateTime),
    content: params.content,
  });

  // Handle social_network_id (can be string, array, or "ALL")
  if (Array.isArray(params.socialNetworkId)) {
    urlParams.set('social_network_id', JSON.stringify(params.socialNetworkId));
  } else {
    urlParams.set('social_network_id', params.socialNetworkId);
  }

  const url = `${ONEUP_BASE_URL}/scheduletextpost?${urlParams.toString()}`;

  const response = await fetch(url);
  const data: OneUpResponse<[]> = await response.json();

  return {
    message: data.message,
    error: data.error,
  };
}

// Schedule an image post
export async function scheduleImagePost(params: {
  categoryId: number;
  socialNetworkId: string | string[];
  scheduledDateTime: Date;
  imageUrl: string;
  content?: string;
}): Promise<{ message: string; error: boolean }> {
  const apiKey = getApiKey();

  const urlParams = new URLSearchParams({
    apiKey,
    category_id: String(params.categoryId),
    scheduled_date_time: formatDateForOneUp(params.scheduledDateTime),
    image_url: params.imageUrl,
  });

  if (params.content) {
    urlParams.set('content', params.content);
  }

  if (Array.isArray(params.socialNetworkId)) {
    urlParams.set('social_network_id', JSON.stringify(params.socialNetworkId));
  } else {
    urlParams.set('social_network_id', params.socialNetworkId);
  }

  const url = `${ONEUP_BASE_URL}/scheduleimagepost?${urlParams.toString()}`;

  const response = await fetch(url);
  const data: OneUpResponse<[]> = await response.json();

  return {
    message: data.message,
    error: data.error,
  };
}

// Test connection to OneUp API
export async function testConnection(): Promise<boolean> {
  try {
    await listCategories();
    return true;
  } catch {
    return false;
  }
}

// Helper to check if OneUp is configured
export function isConfigured(): boolean {
  return !!process.env.ONEUP_API_KEY;
}
