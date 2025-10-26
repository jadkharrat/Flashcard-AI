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
                className="text-sm border rounded-lg p-2 w-full cursor-pointer"
            />
            <button
                onClick={handleSubmit}
                disabled={!file || loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition w-full"
            >
                {loading ? "Generating..." : "Upload & Generate"}
            </button>
        </div>
    )
}

export default FileUploader;