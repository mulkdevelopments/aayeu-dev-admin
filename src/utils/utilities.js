import axios from "axios";
import _, { deburr, kebabCase, toLower } from "lodash";

import getAxiosConfig from "@/services/apiConfig";

const baseURL = `${process.env.REACT_APP_API_BASE_URL}`;

/**
 * Uploads a file using FormData.
 *
 * @param {File} file - The file to upload.
 * @param {string} endpoint - The API endpoint for uploading the file.
 * @param {string} fieldName - The field name used in FormData.
 * @returns {Promise<string>} - The URL of the uploaded file.
 * @throws {Error} - Throws an error if the upload fails or invalid input is provided.
 */
const uploadFile = async (file, endpoint, fieldName) => {
  // Validate inputs
  if (!(file instanceof File)) {
    throw new Error("Invalid file: Expected a File object.");
  }
  if (typeof endpoint !== "string" || !endpoint.trim()) {
    throw new Error("Invalid endpoint: Expected a non-empty string.");
  }
  if (typeof fieldName !== "string" || !fieldName.trim()) {
    throw new Error("Invalid fieldName: Expected a non-empty string.");
  }

  const formData = new FormData();
  formData.append(fieldName, file);

  try {
    const { data } = await axios.post(
      `${baseURL}${endpoint}`,
      formData,
      getAxiosConfig({ isFormData: true })
    );

    if (!data || !data.data || !data.data.path) {
      throw new Error("Invalid API response: Missing file path.");
    }

    return data.data.path; // Adjust based on your API response
  } catch (error) {
    console.error(
      "Error Uploading File:",
      error?.response?.data || error.message
    );
    throw new Error(error?.response?.data?.message || "File upload failed");
  }
};

// stringUtils.js
/**
 * Formats a given string based on the specified type.
 *
 * @param {string} input - The input string to be formatted.
 * @param {"startCase" | "kebabCase" | "camelCase" | "snakeCase" | "lowerCase" | "upperCase"} [type="startCase"]
 *  - The format type:
 *    - "startCase": Converts 'apna-bana-le' to 'Apna Bana Le'
 *    - "kebabCase": Converts 'Apna Bana Le' to 'apna-bana-le'
 *    - "camelCase": Converts 'Apna Bana Le' to 'apnaBanaLe'
 *    - "snakeCase": Converts 'Apna Bana Le' to 'apna_bana_le'
 *    - "lowerCase": Converts 'Apna Bana Le' to 'apna bana le'
 *    - "upperCase": Converts 'Apna Bana Le' to 'APNA BANA LE'
 * @returns {string} - The formatted string.
 */
const formatStringType = (input, type = "startCase") => {
  if (typeof input !== "string" || !input.trim()) {
    return ""; // Return empty string for invalid input
  }

  if (
    ![
      "startCase",
      "kebabCase",
      "camelCase",
      "snakeCase",
      "lowerCase",
      "upperCase",
    ].includes(type)
  ) {
    throw new Error(
      `Invalid type: ${type}. Expected one of "startCase", "kebabCase", "camelCase", "snakeCase", "lowerCase", "upperCase".`
    );
  }

  try {
    switch (type) {
      case "startCase":
        return _.startCase(_.toLower(input));
      case "kebabCase":
        return _.kebabCase(input);
      case "camelCase":
        return _.camelCase(input);
      case "snakeCase":
        return _.snakeCase(input);
      case "lowerCase":
        return _.toLower(input);
      case "upperCase":
        return _.toUpper(input);
      default:
        return input; // Should never reach here due to validation
    }
  } catch (error) {
    console.error("Error formatting string:", error);
    return input; // Return original input if an error occurs
  }
};

/**
 * Normalizes a genre string by replacing unwanted characters (hyphens, slashes, commas, and multiple spaces)
 * with a single space, and capitalizing the first letter of each word.
 *
 * @param {string} genre - The genre string to be normalized.
 * @returns {string} The normalized genre string with proper capitalization.
 *
 * @throws {Error} - Throws an error if the input is not a valid string.
 *
 * @example
 *** returns "Some Genre"
 * normalizeGenre("Some-Genre");
 *
 * @example
 *** returns "Some Genre"
 * normalizeGenre("Some / Genre");
 *
 * @example
 *** returns "Some Some Genre"
 * normalizeGenre("Some, Some Genre");
 */
function normalizeGenre(genre) {
  if (typeof genre !== "string" || !genre.trim()) {
    return ""; // Return empty string for invalid input
  }

  try {
    // Replace unwanted characters (-, /, ,, multiple spaces) with a single space
    const cleanedGenre = _.replace(genre, /[-/,\s]+/g, " ");
    return _.startCase(_.toLower(cleanedGenre)); // Capitalize each word properly
  } catch (error) {
    console.error("Error normalizing genre:", error);
    return genre; // Return the original genre if an error occurs
  }
}

/**
 * Removes special characters and accents from a string.
 *
 * @param {string} text - The text to sanitize.
 * @returns {string} - The sanitized string or an empty string if input is invalid.
 */
const sanitizeName = (text) => {
  // Check if text is a valid string
  if (typeof text !== "string") {
    console.error("Invalid input: Expected a string.");
    return "";
  }

  try {
    // Ensure lodash is available
    if (
      typeof _ === "undefined" ||
      typeof _.deburr !== "function" ||
      typeof _.replace !== "function"
    ) {
      throw new Error("Lodash is not loaded correctly.");
    }

    // Remove accents and special characters
    return _.replace(_.deburr(text), /[^a-zA-Z0-9\s]/g, "");
  } catch (error) {
    console.error("Error sanitizing text:", error);
    return "";
  }
};

// dateUtils.js
/**
 * Utility function to format a date string into "dd.MM.yyyy" format.
 *
 * This function takes a date string, creates a `Date` object, and returns
 * the date formatted as "DD.MM.YYYY". The day and month are padded to ensure
 * they are always two digits.
 *
 * @param {string} dateString - The input date string to be formatted.
 * @returns {string} The formatted date in "DD.MM.YYYY" format.
 *
 * @example
 * formatDate('2024-10-15T12:00:00Z');
 * // returns "15.10.2024"
 */
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const day = _.padStart(date.getDate(), 2, "0"); // Ensure two-digit day
  const month = _.padStart(date.getMonth() + 1, 2, "0"); // Month is 0-indexed
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

/**
 * Utility function to format a date string into "yyyy-MM-dd" format.
 *
 * @param {string} dateString - The input date string to be formatted.
 * @returns {string} The formatted date in "YYYY-MM-DD" format.
 *
 * @example
 * formatDateISO('2024-10-15T12:00:00Z');
 * // returns "2024-10-15"
 */
const formatDateISO = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = _.padStart(date.getMonth() + 1, 2, "0"); // Month is 0-indexed
  const day = _.padStart(date.getDate(), 2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Utility function to format a date string into "dd-MMM-yyyy" format.
 *
 * This function takes a date string and returns it in the format "DD-MMM-YYYY"
 * (e.g., "12-Jan-2024").
 *
 * @param {string} dateString - The input date string to be formatted.
 * @returns {string} The formatted date in "DD-MMM-YYYY" format.
 *
 * @example
 * formatDateWithMonthAbbreviation('2024-10-15T12:00:00Z');
 * // returns "15-Oct-2024"
 */
const formatDateWithMonthAbbreviation = (dateString) => {
  const date = new Date(dateString);
  const day = _.padStart(date.getDate(), 2, "0"); // Ensure two-digit day
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = monthNames[date.getMonth()]; // Get month abbreviation
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

function getUserIdFromLocalStorage() {
  try {
    const raw = localStorage.getItem("authUser");
    if (!raw) {
      console.warn("authUser is not set in localStorage.");
      return null;
    }
    const parsed = JSON.parse(raw);
    return parsed?.user?._id || null;
  } catch (error) {
    console.error("Error while accessing localStorage:", error);
    return null;
  }
}

function getUserTokenFromLocalStorage() {
  try {
    const raw = localStorage.getItem("authUser");
    if (!raw) {
      console.warn("authUser is not set in localStorage.");
      return null;
    }
    const parsed = JSON.parse(raw);
    return parsed?.token || null;
  } catch (error) {
    console.error("Error while accessing localStorage:", error);
    return null;
  }
}

export function slugifyProductName(name = "") {
  return kebabCase(toLower(deburr(name))); // removes accents, converts to kebab case
}

export const generateProductSlug = (text) => {
  if (text === null || text === undefined) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, "-");
};


const utilities = {
  file: {
    uploadFile,
  },
  date: {
    formatDate,
    formatDateISO,
    formatDateWithMonthAbbreviation,
  },
  string: {
    formatStringType,
    normalizeGenre,
    sanitizeName,
  },
  localStorage: {
    getUserIdFromLocalStorage,
    getUserTokenFromLocalStorage
  },
};

export default utilities;
