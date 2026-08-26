import {tavily as Tavily} from "@tavily/core"

const tavily = Tavily({
    apiKey:process.env.TAVILY_API_KEY
})

export const searchInternet = async (queryInput) => {
    const query = typeof queryInput === "object" && queryInput !== null
        ? queryInput.query || queryInput.input || JSON.stringify(queryInput)
        : queryInput;

    return await tavily.search(query, {
        maxResults: 5,
        searchDepth: "basic"
    });
};