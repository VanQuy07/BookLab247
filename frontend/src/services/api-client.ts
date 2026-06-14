export const LOCAL_API_BASE_URL = "http://localhost:8000/api/v1";
export const PROD_API_BASE_URL = "https://booklab247.onrender.com/api/v1";

const isLocalApiUrl = (url: string) =>
	url.includes("localhost") || url.includes("127.0.0.1");

export const getApiBaseUrl = () => {
	if (typeof window === "undefined") {
		return PROD_API_BASE_URL;
	}

	const useLocal = localStorage.getItem("use_local_api") === "true";
	if (useLocal) {
		return LOCAL_API_BASE_URL;
	}

	const storedApiBaseUrl = localStorage.getItem("api_base_url");
	if (storedApiBaseUrl && isLocalApiUrl(storedApiBaseUrl)) {
		localStorage.setItem("api_base_url", PROD_API_BASE_URL);
	} else if (storedApiBaseUrl && !isLocalApiUrl(storedApiBaseUrl)) {
		return storedApiBaseUrl;
	}

	return PROD_API_BASE_URL;
};

export const persistApiBaseUrlAfterLogin = () => {
	if (typeof window === "undefined") return;
	localStorage.setItem(
		"api_base_url",
		localStorage.getItem("use_local_api") === "true"
			? LOCAL_API_BASE_URL
			: PROD_API_BASE_URL,
	);
};

export const getApiBaseUrls = () =>
	Array.from(new Set([getApiBaseUrl(), PROD_API_BASE_URL, LOCAL_API_BASE_URL]));
