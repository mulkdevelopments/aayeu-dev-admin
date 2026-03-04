import { message } from "antd";
import makeRequest from "./apiRequest";
import getAxiosConfig from "./apiConfig";

/**
 * Uploads files to a given API endpoint.
 *
 * @param {File|File[]|Object|Object[]} files - Single or multiple files.
 * @param {string} endpoint - API endpoint for upload.
 * @param {Object} options - Additional options.
 * @param {boolean} options.multiple - Whether multiple files are allowed.
 * @param {string[]} options.allowedTypes - Allowed file types.
 * @param {string} options.fieldName - Field name for form data.
 * @param {boolean} options.includeAuth - Include authorization header.
 * @returns {Promise<string[]>} - Array of uploaded file paths.
 */
export const uploadFiles = async (
  files,
  endpoint,
  {
    multiple = false,
    allowedTypes = [],
    fieldName = "files",
    includeAuth = true,
  } = {}
) => {
  //   message.loading("Uploading...");

  if (!files) return [];

  const extractFiles = Array.isArray(files)
    ? files.map((file) => file.originFileObj || file)
    : [files.originFileObj || files];
  if (allowedTypes.length) {
    const invalidFiles = extractFiles.filter(
      (file) => !allowedTypes.includes(file.type)
    );
    if (invalidFiles.length) {
      message.error(
        `Invalid file type(s): ${invalidFiles
          .map((f) => f.name)
          .join(", ")}. Allowed types: ${allowedTypes.join(", ")}`
      );
      return [];
    }
  }

  const formData = new FormData();

  if (extractFiles.length === 1) {
    formData.append(fieldName, extractFiles[0]);
  } else {
    extractFiles.forEach((extractFile) => {
      formData.append(fieldName, extractFile);
    });
  }

  try {
    const response = await makeRequest(
      "POST",
      endpoint,
      formData,
      getAxiosConfig({ includeAuth, isFormData: true })
    );

    if (response.status === 200) {
      message.success(response.data.message);
      return response.data.data;
    } else {
      message.error(response.data.message);
      return [];
    }
  } catch (error) {
    console.error("File upload failed:", error);
    message.error("File Upload Failed. Please try again.");
    return [];
  }
};
