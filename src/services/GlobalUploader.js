/* eslint-disable react/display-name */

import React, {
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react";
import { Upload, Button, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { uploadFiles } from "./uploadService";

const { Dragger } = Upload;

const GlobalUploader = forwardRef(
  (
    {
      uploadEndpoint,
      multiple = false,
      allowedTypes = [],
      fieldName = "file",
      dragAndDrop = false,
    },
    ref
  ) => {
    const [fileList, setFileList] = useState([]);
    const [uploadedPaths, setUploadedPaths] = useState([]);

    // Memoize handlers to prevent unnecessary re-renders
    const handleChange = useCallback(({ fileList: newFileList }) => {
      setFileList(newFileList);
    }, []);

    const handleRemove = useCallback((file) => {
      setFileList((prevList) =>
        prevList.filter((item) => item.uid !== file.uid)
      );
    }, []);

    const uploadAllFiles = useCallback(async () => {
      if (!fileList.length) {
        message.error("Please select a file before submitting.");
        return [];
      }

      const filesToUpload = fileList
        .map((file) => file.originFileObj)
        .filter(Boolean);

      if (!filesToUpload.length) {
        message.error("No valid files to upload.");
        return [];
      }

      try {
        const paths = await uploadFiles(filesToUpload, uploadEndpoint, {
          multiple,
          allowedTypes,
          fieldName,
        });

        setUploadedPaths(paths);
        message.success("Files uploaded successfully!");
        return paths;
      } catch (error) {
        message.error(`File upload failed: ${error.message}`);
        return [];
      }
    }, [fileList, uploadEndpoint, multiple, allowedTypes, fieldName]);

    // Expose methods to parent component
    useImperativeHandle(
      ref,
      () => ({
        uploadAllFiles,
        getUploadedPaths: () => uploadedPaths,
      }),
      [uploadAllFiles, uploadedPaths]
    );

    // Common upload props
    const uploadProps = {
      fileList,
      beforeUpload: () => false,
      onChange: handleChange,
      onRemove: handleRemove,
      multiple,
    };

    return (
      <>
        {dragAndDrop ? (
          <Dragger {...uploadProps}>
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">Click or drag file to this area</p>
          </Dragger>
        ) : (
          <Upload {...uploadProps} listType="picture">
            <Button icon={<UploadOutlined />}>Upload File</Button>
          </Upload>
        )}
      </>
    );
  }
);

export default GlobalUploader;
