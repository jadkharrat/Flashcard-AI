import React, {useState} from "react";  

interface props {
    onUpload: (file: File) => void;
    loading: boolean;
}

function FileUploader({ onUpload, loading }: props) {
    const [file, setFile] = useState<File | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);        
        }
    }

    const handleSubmit = () => {
        if (!file) return; 
        onUpload(file);
    }

    return (
        <div className="flex flex-col items-center gap-4">
            <input
                type="file"
                accept="application/pdf"
                onChange={handleChange}
                className="text-sm border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
            />
            <button
                onClick={handleSubmit}
                disabled={!file || loading}
                className={`w-full px-4 py-2 rounded-lg font-medium shadow transition
                ${
                  !file || loading
                    ? "bg-gray-400 dark:bg-gray-700 text-gray-200 cursor-not-allowed"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100"
                }`}
            >
                {loading ? "Generating..." : "Upload & Generate"}
            </button>
        </div>
    )
}

export default FileUploader;