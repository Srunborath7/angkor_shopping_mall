const isProduction = import.meta.env.PROD;

export const config = {
    base_url: isProduction
        ? "https://angkor-shopping-mall-api.onrender.com"
        : "http://localhost:3000",
};