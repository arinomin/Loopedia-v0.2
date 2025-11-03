import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      // JSONレスポンスの解析を試みる
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await res.clone().json();
        console.error("API Error Response:", {
          status: res.status,
          statusText: res.statusText,
          errorData
        });
        // エラーオブジェクトにレスポンスデータを含める
        const error = new Error(`${res.status}: ${errorData.message || res.statusText}`);
        (error as any).response = {
          status: res.status,
          statusText: res.statusText,
          data: errorData
        };
        throw error;
      }
    } catch (jsonError) {
      // JSON解析に失敗した場合はテキストとして処理
      console.warn("Failed to parse error response as JSON:", jsonError);
    }
    
    // テキストレスポンスとして処理
    const text = (await res.text()) || res.statusText;
    const error = new Error(`${res.status}: ${text}`);
    (error as any).response = {
      status: res.status,
      statusText: res.statusText,
      text
    };
    throw error;
  }
}

export async function apiRequest<T = any>(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<T> {
  try {
    // リクエストの詳細をログ出力（開発時のデバッグ用）
    if (process.env.NODE_ENV !== 'production') {
      console.log(`API Request: ${method} ${url}`, data ? { data } : '');
    }
    
    // DELETE リクエストでも body を許可する
    const includeBody = data !== undefined && method !== 'GET';
    const res = await fetch(url, {
      method,
      headers: includeBody ? { "Content-Type": "application/json" } : {},
      body: includeBody ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    try {
      const responseData = await res.json() as T;
      return responseData;
    } catch (error: unknown) {
      // JSON解析に失敗した場合の詳細なエラーログ
      const e = error as Error;
      console.warn("Response is not valid JSON:", {
        status: res.status,
        contentType: res.headers.get('content-type'),
        error: e.message
      });
      // 空のレスポンスや非JSON形式のレスポンスの場合
      return { success: res.ok } as unknown as T;
    }
  } catch (error: unknown) {
    // API呼び出し全体の失敗を詳細にログ
    const err = error as Error & { 
      response?: { 
        status?: number, 
        statusText?: string, 
        data?: any, 
        text?: string 
      } 
    };
    
    console.error("API request failed:", {
      url,
      method,
      status: err.response?.status,
      statusText: err.response?.statusText,
      errorData: err.response?.data,
      errorText: err.response?.text,
      message: err.message
    });
    throw error; // エラーを再スローして呼び出し元で処理できるようにする
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      // クエリキーをログ出力（デバッグ用）
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Query Request: ${queryKey[0]}`);
      }
      
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log("認証されていません。null を返します。");
        return null;
      }

      await throwIfResNotOk(res);
      try {
        const data = await res.json();
        return data;
      } catch (error: unknown) {
        const jsonError = error as Error;
        console.warn("Query response is not valid JSON:", {
          queryKey,
          status: res.status,
          contentType: res.headers.get('content-type'),
          error: jsonError.message
        });
        return null;
      }
    } catch (error: unknown) {
      // クエリ実行エラーの詳細ログ
      const err = error as Error & { 
        response?: { 
          status?: number, 
          statusText?: string, 
          data?: any 
        } 
      };
      
      console.error("Query execution failed:", {
        queryKey,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      });
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true, // ウィンドウにフォーカスが戻った時に再検証するように変更
      staleTime: 5 * 60 * 1000, // 5分間キャッシュを有効に設定
      retry: 1, // 1回リトライを許可
    },
    mutations: {
      retry: false,
    },
  },
});

// ユーザー認証状態の検証用関数
export const verifyAuthState = async (): Promise<any> => {
  try {
    console.log("認証状態を検証中...");
    const response = await fetch("/api/auth/me", {
      credentials: "include",
      headers: {
        "Cache-Control": "no-cache",
        "Pragma": "no-cache"
      }
    });
    
    const result = await response.json();
    console.log("認証状態検証結果:", result);
    
    // resultがnullまたは{user: null}の場合は、nullを返す
    const userData = result?.user || null;
    
    // クエリキャッシュを更新
    queryClient.setQueryData(["/api/auth/me"], result);
    return userData;
  } catch (error) {
    console.error("認証状態検証エラー:", error);
    // エラー時は認証状態をnullにリセット
    queryClient.setQueryData(["/api/auth/me"], null);
    return null;
  }
};

// ログアウト処理を強化した関数
export const performLogout = async (): Promise<boolean> => {
  try {
    console.log("ログアウト処理を開始...");
    
    // サーバーにログアウトリクエストを送信
    const response = await apiRequest("POST", "/api/auth/logout");
    console.log("ログアウト応答:", response);
    
    // キャッシュをクリア
    queryClient.setQueryData(["/api/auth/me"], null);
    queryClient.resetQueries({ queryKey: ["/api/auth/me"] });
    
    // すべての認証が必要なクエリをクリア
    const queryCache = queryClient.getQueryCache();
    queryCache.getAll().forEach(query => {
      try {
        // 明示的に型アサーションを使用
        const key = query.queryKey[0] as string;
        if (key && key.startsWith("/api/")) {
          queryClient.invalidateQueries({ queryKey: query.queryKey });
        }
      } catch (error) {
        console.warn("クエリキーの処理中にエラーが発生:", error);
      }
    });
    
    // localStorageから認証関連データをクリア（万が一のため）
    try {
      localStorage.removeItem('lastAuthCheck');
      localStorage.removeItem('authState');
    } catch (storageError) {
      console.warn("localStorageのクリアに失敗:", storageError);
    }
    
    console.log("ログアウト処理が完了しました");
    return true;
  } catch (error) {
    console.error("ログアウト処理中にエラーが発生:", error);
    return false;
  }
};
