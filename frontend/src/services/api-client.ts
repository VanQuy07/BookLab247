export const LOCAL_API_BASE_URL = "http://localhost:8000/api/v1";
export const PROD_API_BASE_URL = "https://booklab247.onrender.com/api/v1";

export const getApiBaseUrl = () => {
	if (typeof window === "undefined") {
		return PROD_API_BASE_URL;
	}

	const storedApiBaseUrl = localStorage.getItem("api_base_url");
	if (storedApiBaseUrl) {
		return storedApiBaseUrl;
	}

	if (window.location.hostname === "localhost") {
		return LOCAL_API_BASE_URL;
	}

	return PROD_API_BASE_URL;
};

export const getApiBaseUrls = () => {
	const urls = [
		getApiBaseUrl(),
		LOCAL_API_BASE_URL,
		PROD_API_BASE_URL,
	];

	return Array.from(new Set(urls));
};
