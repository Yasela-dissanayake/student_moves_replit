import { QueryClient } from '@tanstack/react-query';

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
    },
  },
});

export type ApiRequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Generic API request function with error handling
 * @param method HTTP method
 * @param url API endpoint URL
 * @param data Optional request body
 * @param isFormData Whether the data is FormData (for file uploads)
 * @returns Promise with parsed JSON response
 */
export async function apiRequest(
  method: ApiRequestMethod,
  url: string,
  data?: any,
  isFormData = false
): Promise<any> {
  const headers: HeadersInit = {};
  
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const options: RequestInit = {
    method,
    headers,
    credentials: 'include', // Include cookies for auth
  };

  if (data && method !== 'GET') {
    options.body = isFormData ? data : JSON.stringify(data);
  }

  try {
    console.log(`Making API request: ${method} ${url}`);
    const response = await fetch(url, options);
    
    if (response.status === 404) {
      console.error(`API endpoint not found: ${url}`);
      throw new Error(`API endpoint not found: ${url}`);
    }
    
    if (!response.ok && response.status !== 401) {
      // Log the status but don't throw for 401 as it's handled by the caller
      console.error(`API request failed with status: ${response.status} for ${url}`);
    }
    
    // Parse the JSON response before returning
    const responseData = await response.json().catch(err => {
      console.error(`Error parsing JSON response from ${url}:`, err);
      return { error: "JSON parsing error", message: "Could not parse response as JSON" };
    });
    
    // For error responses, add the status code to the response object for better error handling
    if (!response.ok) {
      return {
        ...responseData,
        statusCode: response.status,
        statusText: response.statusText,
        _isErrorResponse: true
      };
    }
    
    return responseData;
  } catch (error) {
    console.error(`Network error when fetching ${url}:`, error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network error');
  }
}

/**
 * Fetcher function for react-query
 * @param url API endpoint URL
 * @returns Promise with response data
 */
export const fetcher = async (url: string): Promise<any> => {
  const data = await apiRequest('GET', url);
  
  if (data._isErrorResponse) {
    throw new Error(data.message || `Error ${data.statusCode}: ${data.statusText}`);
  }
  
  return data;
};

interface GetQueryFnOptions {
  on401?: 'throw' | 'returnNull';
  defaultValue?: any;
}

/**
 * Get a query function for use with useQuery
 * @param options Options for customizing the query function behavior
 * @returns A query function for useQuery
 */
export function getQueryFn(options: GetQueryFnOptions = {}) {
  const { on401 = 'throw', defaultValue } = options;
  
  return async ({ queryKey }: { queryKey: any[] }) => {
    const [endpoint] = queryKey;
    
    try {
      const data = await apiRequest('GET', endpoint);
      
      // Check for 401 unauthorized error
      if (data._isErrorResponse && data.statusCode === 401) {
        if (on401 === 'returnNull') {
          return null;
        }
        throw new Error('Unauthorized');
      }
      
      // Check for other error responses
      if (data._isErrorResponse) {
        throw new Error(data.message || `Error ${data.statusCode}: ${data.statusText}`);
      }
      
      return data;
    } catch (error) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw error;
    }
  };
};