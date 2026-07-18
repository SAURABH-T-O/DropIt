import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API_URL = "http://localhost:5000/api/shares";
const MAX_SIZE = 500 * 1024 * 1024;

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

const getFilePath = (file) => {
  return file.relativePath || file.webkitRelativePath || file.name;
};

const readFileEntry = (entry, path = "") => {
  return new Promise((resolve) => {
    entry.file((file) => {
      Object.defineProperty(file, "relativePath", {
        value: `${path}${file.name}`,
        configurable: true
      });

      resolve([file]);
    });
  });
};

const readDirectoryEntry = async (entry, path = "") => {
  const reader = entry.createReader();
  const entries = [];

  const readEntries = () => {
    return new Promise((resolve) => {
      reader.readEntries(resolve);
    });
  };

  let batch = await readEntries();

  while (batch.length) {
    entries.push(...batch);
    batch = await readEntries();
  }

  const files = await Promise.all(
    entries.map((childEntry) => readEntry(childEntry, `${path}${entry.name}/`))
  );

  return files.flat();
};

const readEntry = (entry, path = "") => {
  if (entry.isFile) {
    return readFileEntry(entry, path);
  }

  if (entry.isDirectory) {
    return readDirectoryEntry(entry, path);
  }

  return Promise.resolve([]);
};

const getFilesFromDrop = async (event) => {
  const items = Array.from(event.dataTransfer.items || []);

  if (!items.length) {
    return Array.from(event.dataTransfer.files || []);
  }

  const files = await Promise.all(
    items.map((item) => {
      const entry = item.webkitGetAsEntry?.();

      if (entry) {
        return readEntry(entry);
      }

      const file = item.getAsFile?.();
      return file ? [file] : [];
    })
  );

  return files.flat();
};

const mergeFiles = (currentFiles, newFiles) => {
  const existingKeys = new Set(
    currentFiles.map((file) => `${getFilePath(file)}-${file.size}`)
  );

  const uniqueNewFiles = newFiles.filter((file) => {
    const key = `${getFilePath(file)}-${file.size}`;

    if (existingKeys.has(key)) {
      return false;
    }

    existingKeys.add(key);
    return true;
  });

  return [...currentFiles, ...uniqueNewFiles];
};

export default function App() {
  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState(null);

  const [files, setFiles] = useState([]);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [downloadPercent, setDownloadPercent] = useState(0);

  const [shareLink, setShareLink] = useState("");
  const [receiveLink, setReceiveLink] = useState("");
  const [receivePreview, setReceivePreview] = useState(null);
  const [selectedReceiveFiles, setSelectedReceiveFiles] = useState([]);

  const [message, setMessage] = useState("");

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  const handleStart = () => {
    window.history.pushState({ screen: "actions" }, "", "#actions");
    setStarted(true);
    setMessage("");
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedId = params.get("share");

    if (sharedId) {
      setStarted(true);
      setMode("receive");
      setReceiveLink(window.location.href);
    }

    const handlePopState = () => {
      setStarted(false);
      setMode(null);
      setFiles([]);
      setShareLink("");
      setMessage("");
      setReceivePreview(null);
      setSelectedReceiveFiles([]);
      setUploadPercent(0);
      setDownloadPercent(0);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files);

    setFiles((currentFiles) => mergeFiles(currentFiles, selectedFiles));
    setShareLink("");
    setMessage("");
    setUploadPercent(0);

    event.target.value = "";
  };

  const handleDrop = async (event) => {
    event.preventDefault();

    const droppedFiles = await getFilesFromDrop(event);

    setFiles((currentFiles) => mergeFiles(currentFiles, droppedFiles));
    setShareLink("");
    setMessage("");
    setUploadPercent(0);
  };

  const removeSelectedFile = (indexToRemove) => {
    setFiles((currentFiles) =>
      currentFiles.filter((_, index) => index !== indexToRemove)
    );

    setShareLink("");
    setUploadPercent(0);
    setMessage("");
  };

  const uploadFiles = async () => {
    if (!files.length) {
      setMessage("Please choose files or a folder first.");
      setUploadPercent(0);
      return;
    }

    if (totalSize > MAX_SIZE) {
      setMessage("Maximum upload size is 500 MB.");
      setUploadPercent(0);
      return;
    }

    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files", file);
      formData.append("relativePaths", getFilePath(file));
    });

    try {
      setMessage("Uploading...");
      setUploadPercent(0);

      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        },
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) return;

          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );

          setUploadPercent(percent);
        }
      });

      setShareLink(response.data.data.link);
      setMessage("Upload complete.");
      setFiles([]);
      setUploadPercent(0);
    } catch (error) {
      console.log("Upload error:", error);

      setMessage(
        error.response?.data?.message || error.message || "Upload failed."
      );
    }
  };

  const extractShareId = (value) => {
    try {
      const url = new URL(value);
      return url.searchParams.get("share") || value;
    } catch {
      return value;
    }
  };

  const previewShare = async () => {
    const shareId = extractShareId(receiveLink.trim());

    if (!shareId) {
      setMessage("Please paste a valid sharing link.");
      return;
    }

    try {
      setMessage("Fetching file preview...");

      const response = await axios.get(`${API_URL}/${shareId}`);
      const preview = response.data.data;

      setReceivePreview(preview);
      setSelectedReceiveFiles(preview.files.map((file) => file.name));
      setMessage("");
    } catch {
      setReceivePreview(null);
      setSelectedReceiveFiles([]);
      setMessage("Could not fetch files. Check the link and try again.");
    }
  };

  const toggleReceiveFile = (fileName) => {
    setSelectedReceiveFiles((currentFiles) =>
      currentFiles.includes(fileName)
        ? currentFiles.filter((name) => name !== fileName)
        : [...currentFiles, fileName]
    );
  };

  const downloadFiles = async () => {
    const shareId = extractShareId(receiveLink.trim());

    if (!shareId) {
      setMessage("Please paste a valid sharing link.");
      return;
    }

    if (!selectedReceiveFiles.length) {
      setMessage("Please select at least one file to download.");
      return;
    }

    try {
      setMessage("Downloading...");
      setDownloadPercent(0);

      const response = await axios.post(
        `${API_URL}/${shareId}/download-selected`,
        { selectedFiles: selectedReceiveFiles },
        {
          responseType: "blob",
          onDownloadProgress: (progressEvent) => {
            if (!progressEvent.total) return;

            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );

            setDownloadPercent(percent);
          }
        }
      );

      const blobUrl = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");

      link.href = blobUrl;
      link.download = `dropit-${shareId}-selected.zip`;
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(blobUrl);

      setMessage("Download started.");
    } catch {
      setMessage("Download failed. Check the link and try again.");
    }
  };

  return (
    <main className="hero">
      <header className="brand">DropIt</header>

      {!started && (
        <>
          <img
            className="center-image"
            src="/dropit-nobg.png"
            alt="DropIt file sharing"
          />

          <button className="start-btn" onClick={handleStart}>
            Start
          </button>

          <section className="copy">
            <p>Simple & fast file sharing.</p>
          </section>
        </>
      )}

      {started && !mode && (
        <div className="action-buttons">
          <button className="action-btn" onClick={() => setMode("send")}>
            Send
          </button>

          <button className="action-btn" onClick={() => setMode("receive")}>
            Receive
          </button>
        </div>
      )}

      {mode === "send" && (
        <section className="panel">
          <div
            className="drop-zone"
            onDrop={handleDrop}
            onDragOver={(event) => event.preventDefault()}
          >
            <p>Drag and drop your files or folder</p>

            <label className="file-label">
              Choose folder
              <input
                type="file"
                webkitdirectory="true"
                directory=""
                multiple
                onChange={handleFileSelect}
              />
            </label>

            <label className="file-label">
              Choose files
              <input type="file" multiple onChange={handleFileSelect} />
            </label>
          </div>

          <p className="status">
            Selected: {files.length} item(s) / {formatSize(totalSize)}
          </p>

          {files.length > 0 && (
            <div className="file-preview">
              <h3>Selected files</h3>

              <ul>
                {files.map((file, index) => (
                  <li key={`${getFilePath(file)}-${file.size}-${index}`}>
                    <span>{getFilePath(file)}</span>
                    <strong>{formatSize(file.size)}</strong>

                    <button
                      className="remove-file-btn"
                      onClick={() => removeSelectedFile(index)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button className="action-btn" onClick={uploadFiles}>
            Upload
          </button>

          {files.length > 0 && uploadPercent > 0 && (
            <div className="progress">
              <div style={{ width: `${uploadPercent}%` }} />
              <span>{uploadPercent}%</span>
            </div>
          )}

          {shareLink && (
            <div className="link-box">
              <input value={shareLink} readOnly />
              <button onClick={() => navigator.clipboard.writeText(shareLink)}>
                Copy
              </button>
            </div>
          )}

          {message && <p className="panel-message">{message}</p>}
        </section>
      )}

      {mode === "receive" && (
        <section className="panel">
          <input
            className="receive-input"
            value={receiveLink}
            onChange={(event) => {
              setReceiveLink(event.target.value);
              setReceivePreview(null);
              setSelectedReceiveFiles([]);
              setMessage("");
            }}
            placeholder="Paste sharing link"
          />

          <button className="action-btn" onClick={previewShare}>
            Preview
          </button>

          {receivePreview && (
            <div className="file-preview">
              <h3>
                Receiving {receivePreview.fileCount} file(s) /{" "}
                {formatSize(receivePreview.totalSize)}
              </h3>

              <ul>
                {receivePreview.files.map((file, index) => (
                  <li key={`${file.name}-${index}`}>
                    <label className="file-check">
                      <input
                        type="checkbox"
                        checked={selectedReceiveFiles.includes(file.name)}
                        onChange={() => toggleReceiveFile(file.name)}
                      />
                      <span>{file.name}</span>
                    </label>

                    <strong>{formatSize(file.size)}</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button className="action-btn" onClick={downloadFiles}>
            Download
          </button>

          {downloadPercent > 0 && (
            <div className="progress">
              <div style={{ width: `${downloadPercent}%` }} />
              <span>{downloadPercent}%</span>
            </div>
          )}

          {message && <p className="panel-message">{message}</p>}
        </section>
      )}
    </main>
  );
}