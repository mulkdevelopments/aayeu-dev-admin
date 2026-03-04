/**
 * Generates a dynamic URL by appending parameters either as path segments or query parameters.
 *
 * @param {string} baseRoute - The base route (e.g., "/song-lyrics").
 * @param {Object} params - An object containing key-value pairs for dynamic parameters.
 * @param {"params" | "queryParams"} type - Specifies whether to append params as path segments ("params") or as query parameters ("queryParams").
 * @returns {string} - The generated URL.
 * @throws {Error} - Throws an error for invalid inputs.
 */
export const generateDynamicRoute = (baseRoute, params, type) => {
  if (typeof baseRoute !== "string" || !baseRoute.trim()) {
    throw new Error("Base route must be a non-empty string.");
  }
  if (typeof params !== "object" || params === null || Array.isArray(params)) {
    throw new Error("Params must be a non-null object.");
  }
  if (type !== "params" && type !== "queryParams") {
    throw new Error("Invalid type. Use 'params' or 'queryParams'.");
  }

  let route = baseRoute.trim();
  const queryParams = new URLSearchParams();

  if (type === "params") {
    // Convert object values to a URL path
    const pathParams = Object.values(params)
      .filter((value) => value !== undefined && value !== null) // Filter out null/undefined
      .map((value) => encodeURIComponent(String(value))) // Ensure string conversion & encoding
      .join("/");

    if (!pathParams) {
      throw new Error("No valid path parameters provided.");
    }

    route = `${route}/${pathParams}`;
  } else if (type === "queryParams") {
    // Append as query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    const queryString = queryParams.toString();
    if (queryString) {
      route += `?${queryString}`;
    }
  }

  return route;
};
